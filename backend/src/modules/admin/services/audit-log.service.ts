import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateAuditLogDto,
  AuditLogQueryDto,
  AuditLogResponseDto,
  UserActivityQueryDto,
  SystemEventQueryDto,
  ExportAuditLogsDto,
} from '../dto/audit-log.dto';
import * as Papa from 'papaparse';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new audit log entry
   */
  async createAuditLog(dto: CreateAuditLogDto): Promise<AuditLogResponseDto> {
    try {
      const log = await this.prisma.auditLog.create({
        data: {
          adminId: dto.adminId,
          action: dto.action,
          entityType: dto.entityType,
          entityId: dto.entityId,
          beforeState: dto.beforeState || null,
          afterState: dto.afterState || null,
          reason: dto.reason || null,
          ipAddress: dto.ipAddress,
          userAgent: dto.userAgent,
          success: dto.success,
          errorMessage: dto.errorMessage || null,
        },
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      this.logger.log(
        `Audit log created: ${dto.action} on ${dto.entityType}:${dto.entityId} by ${dto.adminId}`,
      );

      return this.mapToResponseDto(log);
    } catch (error) {
      this.logger.error('Failed to create audit log:', error);
      throw error;
    }
  }

  /**
   * Query audit logs with filtering
   */
  async getAuditLogs(
    query: AuditLogQueryDto,
  ): Promise<{
    logs: AuditLogResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const where: any = {};

    if (query.adminId) {
      where.adminId = query.adminId;
    }

    if (query.action) {
      where.action = query.action;
    }

    if (query.entityType) {
      where.entityType = query.entityType;
    }

    if (query.entityId) {
      where.entityId = query.entityId;
    }

    if (query.success !== undefined) {
      where.success = query.success;
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      logs: logs.map((log) => this.mapToResponseDto(log)),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  /**
   * Get audit logs for a specific entity
   */
  async getEntityAuditTrail(
    entityType: string,
    entityId: string,
  ): Promise<AuditLogResponseDto[]> {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return logs.map((log) => this.mapToResponseDto(log));
  }

  /**
   * Get user activity logs
   */
  async getUserActivity(
    query: UserActivityQueryDto,
  ): Promise<{
    activities: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    const where: any = {
      entityType: 'USER',
      entityId: query.userId,
    };

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    if (query.type) {
      const actionPrefix = query.type.toUpperCase();
      where.action = { startsWith: actionPrefix };
    }

    const [activities, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      activities: activities.map((log) => this.mapToResponseDto(log)),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  /**
   * Get system events
   */
  async getSystemEvents(
    query: SystemEventQueryDto,
  ): Promise<{
    events: AuditLogResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const where: any = {
      entityType: { in: ['SETTINGS', 'FEATURE_FLAG', 'SYSTEM'] },
    };

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    const [events, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      events: events.map((log) => this.mapToResponseDto(log)),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  /**
   * Get admin action summary
   */
  async getAdminActionSummary(
    adminId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<{
    totalActions: number;
    successfulActions: number;
    failedActions: number;
    actionsByType: Record<string, number>;
    recentActions: AuditLogResponseDto[];
  }> {
    const where: any = { adminId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [totalActions, successfulActions, failedActions, allActions] =
      await Promise.all([
        this.prisma.auditLog.count({ where }),
        this.prisma.auditLog.count({ where: { ...where, success: true } }),
        this.prisma.auditLog.count({ where: { ...where, success: false } }),
        this.prisma.auditLog.findMany({
          where,
          include: {
            admin: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
      ]);

    const actionsByType = allActions.reduce(
      (acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalActions,
      successfulActions,
      failedActions,
      actionsByType,
      recentActions: allActions.map((log) => this.mapToResponseDto(log)),
    };
  }

  /**
   * Export audit logs
   */
  async exportAuditLogs(dto: ExportAuditLogsDto): Promise<string> {
    const where: any = {};

    if (dto.filters) {
      if (dto.filters.adminId) {
        where.adminId = dto.filters.adminId;
      }
      if (dto.filters.action) {
        where.action = dto.filters.action;
      }
      if (dto.filters.entityType) {
        where.entityType = dto.filters.entityType;
      }
      if (dto.filters.entityId) {
        where.entityId = dto.filters.entityId;
      }
      if (dto.filters.startDate || dto.filters.endDate) {
        where.createdAt = {};
        if (dto.filters.startDate) {
          where.createdAt.gte = new Date(dto.filters.startDate);
        }
        if (dto.filters.endDate) {
          where.createdAt.lte = new Date(dto.filters.endDate);
        }
      }
    }

    const logs = await this.prisma.auditLog.findMany({
      where,
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10000, // Limit export to 10k records
    });

    if (dto.format === 'csv') {
      const csvData = logs.map((log) => ({
        id: log.id,
        adminId: log.adminId,
        adminName: log.admin.name,
        adminEmail: log.admin.email,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        reason: log.reason || '',
        ipAddress: log.ipAddress,
        success: log.success,
        errorMessage: log.errorMessage || '',
        createdAt: log.createdAt.toISOString(),
      }));

      return Papa.unparse(csvData);
    } else {
      // JSON format
      return JSON.stringify(
        logs.map((log) => this.mapToResponseDto(log)),
        null,
        2,
      );
    }
  }

  /**
   * Get statistics for admin dashboard
   */
  async getAuditStatistics(
    startDate?: string,
    endDate?: string,
  ): Promise<{
    totalLogs: number;
    successRate: number;
    topActions: { action: string; count: number }[];
    topAdmins: { adminId: string; adminName: string; count: number }[];
    actionsOverTime: { date: string; count: number }[];
  }> {
    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [totalLogs, successfulLogs, allLogs] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.count({ where: { ...where, success: true } }),
      this.prisma.auditLog.findMany({
        where,
        include: {
          admin: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const successRate = totalLogs > 0 ? (successfulLogs / totalLogs) * 100 : 0;

    const actionCounts = allLogs.reduce(
      (acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const topActions = Object.entries(actionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([action, count]) => ({ action, count }));

    const adminCounts = allLogs.reduce(
      (acc, log) => {
        const key = log.adminId;
        if (!acc[key]) {
          acc[key] = { adminId: log.adminId, adminName: log.admin.name, count: 0 };
        }
        acc[key].count++;
        return acc;
      },
      {} as Record<string, { adminId: string; adminName: string; count: number }>,
    );

    const topAdmins = Object.values(adminCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const actionsOverTime = this.groupByDate(allLogs);

    return {
      totalLogs,
      successRate,
      topActions,
      topAdmins,
      actionsOverTime,
    };
  }

  /**
   * Helper: Group logs by date
   */
  private groupByDate(logs: any[]): { date: string; count: number }[] {
    const dateGroups = logs.reduce(
      (acc, log) => {
        const date = log.createdAt.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(dateGroups)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count: count as number }));
  }

  /**
   * Helper: Map database model to DTO
   */
  private mapToResponseDto(log: any): AuditLogResponseDto {
    return {
      id: log.id,
      adminId: log.adminId,
      adminName: log.admin?.name || 'Unknown',
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      beforeState: log.beforeState,
      afterState: log.afterState,
      reason: log.reason,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      success: log.success,
      errorMessage: log.errorMessage,
      createdAt: log.createdAt,
    };
  }

  /**
   * Delete old audit logs (cleanup)
   */
  async deleteOldLogs(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    this.logger.log(
      `Deleted ${result.count} audit logs older than ${olderThanDays} days`,
    );

    return result.count;
  }
}
