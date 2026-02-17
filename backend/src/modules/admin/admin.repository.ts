import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseRepository } from '../../common/database/base.repository';
import { LoggingService } from '../../common/logging/logging.service';
import {
  User,
  ActivityLog,
  SystemSetting,
  Job,
  Bid,
  Payment,
  Message,
  Review,
  JobStatus,
  BidStatus,
  UserRole,
} from '@prisma/client';
import { AdminUserFilters, AdminContentFilters, AdminFinancialReport } from './dto';

@Injectable()
export class AdminRepository extends BaseRepository<User> {
  constructor(
    prisma: PrismaService,
    private readonly loggingService: LoggingService,
  ) {
    super(prisma, loggingService, 'user');
  }

  // Re-expose prisma for direct queries not in BaseRepository
  protected get prismaService(): PrismaService {
    return this.prisma as PrismaService;
  }

  // User Management Queries
  async getUsersWithFilters(filters: AdminUserFilters): Promise<{ users: any[]; total: number }> {
    const where: any = {};

    if (filters.role) where.role = filters.role;
    if (filters.status) where.status = filters.status;
    if (filters.verified !== undefined) where.verifiedAt = filters.verified ? { not: null } : null;
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }
    if (filters.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { profile: { firstName: { contains: filters.search, mode: 'insensitive' } } },
        { profile: { lastName: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    // Handle sorting - map sortBy field to Prisma orderBy
    const sortField = filters.sortBy || 'createdAt';
    const sortDirection = filters.sortOrder || 'desc';
    let orderBy: any = { createdAt: sortDirection };

    // Map sortBy to valid Prisma fields
    if (sortField === 'email') {
      orderBy = { email: sortDirection };
    } else if (sortField === 'role') {
      orderBy = { role: sortDirection };
    } else if (sortField === 'status') {
      orderBy = { status: sortDirection };
    } else if (sortField === 'createdAt') {
      orderBy = { createdAt: sortDirection };
    }

    const [users, total] = await Promise.all([
      this.prismaService.user.findMany({
        where,
        include: {
          profile: true,
          _count: {
            select: {
              clientJobs: true,
              artisanBids: true,
              sentMessages: true,
            },
          },
        },
        skip: filters.skip || 0,
        take: filters.take || 20,
        orderBy,
      }),
      this.prismaService.user.count({ where }),
    ]);

    return { users, total };
  }

  async getUserWithDetails(userId: string): Promise<any> {
    return await this.prismaService.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        wallet: true,
        clientJobs: {
          include: { category: true },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        artisanBids: {
          include: { job: true },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        activities: {
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
        sentMessages: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        receivedMessages: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async getActiveUsersCount(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return await this.prismaService.activityLog.groupBy({
      by: ['userId'],
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
    }).then(result => result.length);
  }

  async getNewUsersToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return await this.prismaService.user.count({
      where: {
        createdAt: { gte: today },
      },
    });
  }

  async getPendingVerifications(): Promise<User[]> {
    return await this.prismaService.user.findMany({
      where: {
        role: 'ARTISAN',
        verifiedAt: null,
      },
      include: {
        profile: true,
      },
    });
  }

  // Note: User model doesn't have status field yet - would need to add to schema
  async updateUserStatus(userId: string, role: UserRole, suspendUntil?: Date): Promise<void> {
    await this.prismaService.user.update({
      where: { id: userId },
      data: {
        role,
        // suspendedUntil field doesn't exist in schema - would need to add
      },
    });
  }

  async verifyUser(userId: string): Promise<void> {
    await this.prismaService.user.update({
      where: { id: userId },
      data: {
        verifiedAt: new Date(),
      },
    });
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    await this.prismaService.user.update({
      where: { id: userId },
      data: {
        passwordHash: hashedPassword,
      },
    });
  }

  // Content Moderation Queries
  async getReportedJobs(filters: AdminContentFilters): Promise<any[]> {
    // This would query a reports table - for now return mock data
    return [];
  }

  async getReportedMessages(filters: AdminContentFilters): Promise<any[]> {
    // This would query reported messages - for now return mock data
    return [];
  }

  async getFlaggedReviews(filters: AdminContentFilters): Promise<any[]> {
    // This would query flagged reviews - for now return mock data
    return [];
  }

  async getPendingDisputes(filters: AdminContentFilters): Promise<any[]> {
    // This would query disputes table - for now return mock data
    return [];
  }

  async moderateContent(contentId: string, contentType: string, action: string, reason?: string): Promise<void> {
    // This would update the moderation status of content
    this.loggingService.log('Content moderated', 'AdminRepository');
  }

  async resolveDispute(disputeId: string, resolution: string, refundAmount?: number): Promise<void> {
    // This would resolve a dispute and potentially process refunds
    this.loggingService.log('Dispute resolved', 'AdminRepository');
  }

  // Analytics Queries
  async getTotalUsers(): Promise<number> {
    return await this.prismaService.user.count();
  }

  async getTotalJobs(): Promise<number> {
    return await this.prismaService.job.count();
  }

  async getActiveJobs(): Promise<number> {
    return await this.prismaService.job.count({
      where: {
        status: { in: ['OPEN', 'IN_PROGRESS'] },
      },
    });
  }

  async getTotalBids(): Promise<number> {
    return await this.prismaService.bid.count();
  }

  async getTotalPayments(): Promise<number> {
    return await this.prismaService.payment.count();
  }

  async getTotalRevenue(): Promise<number> {
    const result = await this.prismaService.payment.aggregate({
      _sum: {
        platformFee: true,
      },
      where: {
        status: 'COMPLETED',
      },
    });

    return result._sum.platformFee ? Number(result._sum.platformFee) : 0;
  }

  async getTodayRevenue(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await this.prismaService.payment.aggregate({
      _sum: {
        platformFee: true,
      },
      where: {
        status: 'COMPLETED',
        createdAt: { gte: today },
      },
    });

    return result._sum.platformFee ? Number(result._sum.platformFee) : 0;
  }

  async getMonthlyRevenue(): Promise<number> {
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const result = await this.prismaService.payment.aggregate({
      _sum: {
        platformFee: true,
      },
      where: {
        status: 'COMPLETED',
        createdAt: { gte: firstDayOfMonth },
      },
    });

    return result._sum.platformFee ? Number(result._sum.platformFee) : 0;
  }

  async getUserGrowthRate(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const [currentPeriod, previousPeriod] = await Promise.all([
      this.prismaService.user.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prismaService.user.count({
        where: {
          createdAt: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo,
          },
        },
      }),
    ]);

    if (previousPeriod === 0) return currentPeriod > 0 ? 100 : 0;
    return ((currentPeriod - previousPeriod) / previousPeriod) * 100;
  }

  async getJobGrowthRate(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const [currentPeriod, previousPeriod] = await Promise.all([
      this.prismaService.job.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prismaService.job.count({
        where: {
          createdAt: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo,
          },
        },
      }),
    ]);

    if (previousPeriod === 0) return currentPeriod > 0 ? 100 : 0;
    return ((currentPeriod - previousPeriod) / previousPeriod) * 100;
  }

  async getConversionRate(): Promise<number> {
    const [totalJobs, completedJobs] = await Promise.all([
      this.prismaService.job.count(),
      this.prismaService.job.count({
        where: { status: 'COMPLETED' },
      }),
    ]);

    return totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;
  }

  async getRecentActivity(): Promise<ActivityLog[]> {
    return await this.prismaService.activityLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }

  async generateReportData(type: string, dateFrom: Date, dateTo: Date): Promise<any[]> {
    const where = {
      createdAt: {
        gte: dateFrom,
        lte: dateTo,
      },
    };

    switch (type) {
      case 'USERS':
        return await this.prismaService.user.findMany({
          where,
          include: { profile: true },
        });
      case 'JOBS':
        return await this.prismaService.job.findMany({
          where,
          include: {
            client: { include: { profile: true } },
            category: true,
            bids: true,
          },
        });
      case 'REVENUE':
        return await this.prismaService.payment.findMany({
          where: {
            ...where,
            status: 'COMPLETED',
          },
        });
      default:
        return [];
    }
  }

  async getFinancialReconciliation(): Promise<AdminFinancialReport> {
    const [
      totalRevenue,
      platformFees,
      pendingPayouts,
      escrowAmount,
      totalTransactions,
    ] = await Promise.all([
      this.prismaService.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'COMPLETED' },
      }),
      this.prismaService.payment.aggregate({
        _sum: { platformFee: true },
        where: { status: 'COMPLETED' },
      }),
      this.prismaService.wallet.aggregate({
        _sum: { balance: true },
      }),
      this.prismaService.payment.aggregate({
        _sum: { amount: true },
        where: { escrowStatus: 'HELD' }, // Use escrowStatus instead of status
      }),
      this.prismaService.payment.count(),
    ]);

    return {
      totalRevenue: totalRevenue._sum.amount ? Number(totalRevenue._sum.amount) : 0,
      platformFees: platformFees._sum.platformFee ? Number(platformFees._sum.platformFee) : 0,
      pendingPayouts: pendingPayouts._sum.balance ? Number(pendingPayouts._sum.balance) : 0,
      escrowAmount: escrowAmount._sum.amount ? Number(escrowAmount._sum.amount) : 0,
      totalTransactions,
      lastReconciled: new Date(),
    };
  }

  // System Settings Queries
  async getSystemSettings(): Promise<SystemSetting[]> {
    return await this.prismaService.systemSetting.findMany({
      orderBy: { key: 'asc' },
    });
  }

  async updateSystemSetting(key: string, value: string): Promise<SystemSetting> {
    return await this.prismaService.systemSetting.upsert({
      where: { key },
      update: { value, updatedAt: new Date() },
      create: { key, value },
    });
  }

  async manageCategory(action: string, categoryData: any): Promise<void> {
    switch (action) {
      case 'CREATE':
        await this.prismaService.category.create({ data: categoryData });
        break;
      case 'UPDATE':
        await this.prismaService.category.update({
          where: { id: categoryData.id },
          data: categoryData,
        });
        break;
      case 'DELETE':
        await this.prismaService.category.delete({
          where: { id: categoryData.id },
        });
        break;
    }
  }

  async updateEmailTemplate(templateType: string, templateContent: string): Promise<void> {
    await this.updateSystemSetting(`EMAIL_TEMPLATE_${templateType.toUpperCase()}`, templateContent);
  }

  async logAdminActivity(activity: {
    adminId: string;
    action: string;
    targetUserId?: string;
    reason: string;
    metadata?: any;
  }): Promise<ActivityLog> {
    return await this.prismaService.activityLog.create({
      data: {
        userId: activity.adminId,
        action: activity.action,
        entityType: 'user',
        entityId: activity.targetUserId || activity.adminId,
        newData: activity.metadata,
        ipAddress: '', // Would be filled from request context
        userAgent: '', // Would be filled from request context
      },
    });
  }
}
