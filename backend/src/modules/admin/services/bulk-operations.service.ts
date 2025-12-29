import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  BulkUserBanDto,
  BulkUserSuspendDto,
  BulkUserVerifyDto,
  BulkExportDto,
  BulkEmailSendDto,
  BulkContentModerateDto,
  BulkOperationStatus,
  BulkOperationType,
  BulkOperationStatusDto,
  BulkOperationQueryDto,
} from '../dto/bulk-operations.dto';
import * as Papa from 'papaparse';
import { createWriteStream } from 'fs';
import { join } from 'path';
import { promisify } from 'util';
import { unlink } from 'fs';

const unlinkAsync = promisify(unlink);

@Injectable()
export class BulkOperationsService {
  private readonly logger = new Logger(BulkOperationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('bulk-operations') private bulkOpsQueue: Queue,
  ) {}

  /**
   * Ban multiple users
   */
  async banUsers(
    dto: BulkUserBanDto,
    initiatorId: string,
  ): Promise<BulkOperationStatusDto> {
    const operation = await this.prisma.bulkOperation.create({
      data: {
        type: BulkOperationType.USER_BAN,
        status: BulkOperationStatus.PENDING,
        totalItems: dto.userIds.length,
        initiatedBy: initiatorId,
        config: {
          userIds: dto.userIds,
          reason: dto.reason,
        },
      },
    });

    await this.bulkOpsQueue.add(
      'ban-users',
      {
        operationId: operation.id,
        userIds: dto.userIds,
        reason: dto.reason,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );

    return this.mapToStatusDto(operation);
  }

  /**
   * Suspend multiple users
   */
  async suspendUsers(
    dto: BulkUserSuspendDto,
    initiatorId: string,
  ): Promise<BulkOperationStatusDto> {
    const operation = await this.prisma.bulkOperation.create({
      data: {
        type: BulkOperationType.USER_SUSPEND,
        status: BulkOperationStatus.PENDING,
        totalItems: dto.userIds.length,
        initiatedBy: initiatorId,
        config: {
          userIds: dto.userIds,
          expiryDate: dto.expiryDate,
          reason: dto.reason,
        },
      },
    });

    await this.bulkOpsQueue.add(
      'suspend-users',
      {
        operationId: operation.id,
        userIds: dto.userIds,
        expiryDate: dto.expiryDate,
        reason: dto.reason,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );

    return this.mapToStatusDto(operation);
  }

  /**
   * Verify multiple artisans
   */
  async verifyUsers(
    dto: BulkUserVerifyDto,
    initiatorId: string,
  ): Promise<BulkOperationStatusDto> {
    const operation = await this.prisma.bulkOperation.create({
      data: {
        type: BulkOperationType.USER_VERIFY,
        status: BulkOperationStatus.PENDING,
        totalItems: dto.userIds.length,
        initiatedBy: initiatorId,
        config: {
          userIds: dto.userIds,
        },
      },
    });

    await this.bulkOpsQueue.add(
      'verify-users',
      {
        operationId: operation.id,
        userIds: dto.userIds,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );

    return this.mapToStatusDto(operation);
  }

  /**
   * Export data to CSV
   */
  async exportData(
    dto: BulkExportDto,
    initiatorId: string,
  ): Promise<BulkOperationStatusDto> {
    const operationType =
      dto.type === 'users'
        ? BulkOperationType.USER_EXPORT
        : dto.type === 'jobs'
          ? BulkOperationType.JOB_EXPORT
          : BulkOperationType.PAYMENT_EXPORT;

    const operation = await this.prisma.bulkOperation.create({
      data: {
        type: operationType,
        status: BulkOperationStatus.PENDING,
        totalItems: 0,
        initiatedBy: initiatorId,
        config: {
          type: dto.type,
          filters: dto.filters || {},
        } as any,
      },
    });

    await this.bulkOpsQueue.add(
      'export-data',
      {
        operationId: operation.id,
        type: dto.type,
        filters: dto.filters,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );

    return this.mapToStatusDto(operation);
  }

  /**
   * Send bulk emails
   */
  async sendBulkEmail(
    dto: BulkEmailSendDto,
    initiatorId: string,
  ): Promise<BulkOperationStatusDto> {
    const recipients = await this.getEmailRecipients(dto.recipients);

    const operation = await this.prisma.bulkOperation.create({
      data: {
        type: BulkOperationType.EMAIL_SEND,
        status: BulkOperationStatus.PENDING,
        totalItems: recipients.length,
        initiatedBy: initiatorId,
        config: {
          templateId: dto.templateId,
          subject: dto.subject,
          body: dto.body,
          recipients: dto.recipients,
          schedule: dto.schedule,
        } as any,
      },
    });

    const jobOptions: any = {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    };

    if (dto.schedule) {
      jobOptions.delay = new Date(dto.schedule).getTime() - Date.now();
    }

    await this.bulkOpsQueue.add(
      'send-emails',
      {
        operationId: operation.id,
        subject: dto.subject,
        body: dto.body,
        recipients: recipients.map((r) => ({ id: r.id, email: r.email })),
      },
      jobOptions,
    );

    return this.mapToStatusDto(operation);
  }

  /**
   * Moderate content in bulk
   */
  async moderateContent(
    dto: BulkContentModerateDto,
    initiatorId: string,
  ): Promise<BulkOperationStatusDto> {
    const operation = await this.prisma.bulkOperation.create({
      data: {
        type: BulkOperationType.CONTENT_MODERATE,
        status: BulkOperationStatus.PENDING,
        totalItems: dto.contentIds.length,
        initiatedBy: initiatorId,
        config: {
          contentIds: dto.contentIds,
          action: dto.action,
          reason: dto.reason,
        },
      },
    });

    await this.bulkOpsQueue.add(
      'moderate-content',
      {
        operationId: operation.id,
        contentIds: dto.contentIds,
        action: dto.action,
        reason: dto.reason,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );

    return this.mapToStatusDto(operation);
  }

  /**
   * Get bulk operation status
   */
  async getOperationStatus(operationId: string): Promise<BulkOperationStatusDto> {
    const operation = await this.prisma.bulkOperation.findUnique({
      where: { id: operationId },
    });

    if (!operation) {
      throw new NotFoundException(`Operation ${operationId} not found`);
    }

    return this.mapToStatusDto(operation);
  }

  /**
   * List all bulk operations with filtering
   */
  async listOperations(
    query: BulkOperationQueryDto,
    initiatorId: string,
  ): Promise<{
    operations: BulkOperationStatusDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const where: any = {
      initiatedBy: initiatorId,
    };

    if (query.type) {
      where.type = query.type;
    }

    if (query.status) {
      where.status = query.status;
    }

    const [operations, total] = await Promise.all([
      this.prisma.bulkOperation.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.bulkOperation.count({ where }),
    ]);

    return {
      operations: operations.map((op) => this.mapToStatusDto(op)),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  /**
   * Cancel a pending or processing operation
   */
  async cancelOperation(operationId: string): Promise<BulkOperationStatusDto> {
    const operation = await this.prisma.bulkOperation.findUnique({
      where: { id: operationId },
    });

    if (!operation) {
      throw new NotFoundException(`Operation ${operationId} not found`);
    }

    if (
      operation.status !== BulkOperationStatus.PENDING &&
      operation.status !== BulkOperationStatus.PROCESSING
    ) {
      throw new Error('Can only cancel pending or processing operations');
    }

    const updatedOperation = await this.prisma.bulkOperation.update({
      where: { id: operationId },
      data: {
        status: BulkOperationStatus.CANCELLED,
        completedAt: new Date(),
      },
    });

    const jobs = await this.bulkOpsQueue.getJobs(['active', 'waiting', 'delayed']);
    const job = jobs.find((j) => j.data.operationId === operationId);
    if (job) {
      await job.remove();
    }

    return this.mapToStatusDto(updatedOperation);
  }

  /**
   * Helper: Get email recipients based on filters
   */
  private async getEmailRecipients(filters: any): Promise<any[]> {
    const where: any = {};

    if (filters.role) {
      where.role = filters.role;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.registeredAfter) {
      where.createdAt = {
        ...where.createdAt,
        gte: new Date(filters.registeredAfter),
      };
    }

    if (filters.registeredBefore) {
      where.createdAt = {
        ...where.createdAt,
        lte: new Date(filters.registeredBefore),
      };
    }

    if (filters.userIds && filters.userIds.length > 0) {
      where.id = { in: filters.userIds };
    }

    return this.prisma.user.findMany({
      where,
      select: { id: true, email: true, name: true },
    });
  }

  /**
   * Helper: Map database model to DTO
   */
  private mapToStatusDto(operation: any): BulkOperationStatusDto {
    const progress =
      operation.totalItems > 0
        ? Math.round((operation.processed / operation.totalItems) * 100)
        : 0;

    return {
      id: operation.id,
      type: operation.type,
      status: operation.status,
      totalItems: operation.totalItems,
      processed: operation.processed,
      succeeded: operation.succeeded,
      failed: operation.failed,
      progress,
      startedAt: operation.startedAt,
      completedAt: operation.completedAt,
      errorLog: operation.errorLog,
    };
  }

  /**
   * Process ban users job (called by Bull queue processor)
   */
  async processBanUsers(data: any): Promise<void> {
    const { operationId, userIds, reason } = data;

    await this.prisma.bulkOperation.update({
      where: { id: operationId },
      data: { status: BulkOperationStatus.PROCESSING },
    });

    let succeeded = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const userId of userIds) {
      try {
        await this.prisma.user.update({
          where: { id: userId },
          data: { status: 'BANNED' },
        });
        succeeded++;
      } catch (error) {
        failed++;
        errors.push(`${userId}: ${error.message}`);
        this.logger.error(`Failed to ban user ${userId}:`, error);
      }

      await this.prisma.bulkOperation.update({
        where: { id: operationId },
        data: {
          processed: succeeded + failed,
          succeeded,
          failed,
        },
      });
    }

    await this.prisma.bulkOperation.update({
      where: { id: operationId },
      data: {
        status: failed === 0 ? BulkOperationStatus.COMPLETED : BulkOperationStatus.FAILED,
        completedAt: new Date(),
        errorLog: errors.length > 0 ? errors.join('\n') : null,
        results: {
          succeeded,
          failed,
          reason,
        },
      },
    });
  }

  /**
   * Process suspend users job
   */
  async processSuspendUsers(data: any): Promise<void> {
    const { operationId, userIds, expiryDate, reason } = data;

    await this.prisma.bulkOperation.update({
      where: { id: operationId },
      data: { status: BulkOperationStatus.PROCESSING },
    });

    let succeeded = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const userId of userIds) {
      try {
        await this.prisma.user.update({
          where: { id: userId },
          data: { status: 'SUSPENDED' },
        });
        succeeded++;
      } catch (error) {
        failed++;
        errors.push(`${userId}: ${error.message}`);
        this.logger.error(`Failed to suspend user ${userId}:`, error);
      }

      await this.prisma.bulkOperation.update({
        where: { id: operationId },
        data: {
          processed: succeeded + failed,
          succeeded,
          failed,
        },
      });
    }

    await this.prisma.bulkOperation.update({
      where: { id: operationId },
      data: {
        status: failed === 0 ? BulkOperationStatus.COMPLETED : BulkOperationStatus.FAILED,
        completedAt: new Date(),
        errorLog: errors.length > 0 ? errors.join('\n') : null,
        results: {
          succeeded,
          failed,
          expiryDate,
          reason,
        },
      },
    });
  }

  /**
   * Process verify users job
   */
  async processVerifyUsers(data: any): Promise<void> {
    const { operationId, userIds } = data;

    await this.prisma.bulkOperation.update({
      where: { id: operationId },
      data: { status: BulkOperationStatus.PROCESSING },
    });

    let succeeded = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const userId of userIds) {
      try {
        await this.prisma.user.update({
          where: { id: userId },
          data: { verifiedAt: new Date() },
        });
        succeeded++;
      } catch (error) {
        failed++;
        errors.push(`${userId}: ${error.message}`);
        this.logger.error(`Failed to verify user ${userId}:`, error);
      }

      await this.prisma.bulkOperation.update({
        where: { id: operationId },
        data: {
          processed: succeeded + failed,
          succeeded,
          failed,
        },
      });
    }

    await this.prisma.bulkOperation.update({
      where: { id: operationId },
      data: {
        status: failed === 0 ? BulkOperationStatus.COMPLETED : BulkOperationStatus.FAILED,
        completedAt: new Date(),
        errorLog: errors.length > 0 ? errors.join('\n') : null,
        results: {
          succeeded,
          failed,
        },
      },
    });
  }
}
