import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  UpdateEscrowConfigDto,
  EscrowConfigResponseDto,
  EscrowHoldDto,
  EscrowAnalyticsDto,
  EscrowHoldsQueryDto,
} from '../dto/escrow-config.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class EscrowConfigService {
  private readonly logger = new Logger(EscrowConfigService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get active escrow configuration
   * Creates default config if none exists
   */
  async getConfig(): Promise<EscrowConfigResponseDto> {
    try {
      let config = await this.prisma.escrowConfig.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      });

      // Create default config if none exists
      if (!config) {
        this.logger.log('No active escrow config found, creating default');
        config = await this.prisma.escrowConfig.create({
          data: {
            autoReleaseDays: 7,
            holdDurationDays: 14,
            disputeWindowDays: 14,
            feePercentage: new Decimal('10.00'),
            minHoldAmount: new Decimal('0.00'),
            maxHoldAmount: new Decimal('100000.00'),
            isActive: true,
          },
        });
      }

      return this.mapConfigToDto(config);
    } catch (error) {
      this.logger.error(`Failed to get escrow config: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to retrieve escrow configuration');
    }
  }

  /**
   * Update escrow configuration
   * Validates business rules before updating
   */
  async updateConfig(
    updateDto: UpdateEscrowConfigDto,
    adminUserId: string,
  ): Promise<EscrowConfigResponseDto> {
    try {
      // Validate business rules
      this.validateConfigUpdate(updateDto);

      // Get current active config
      const currentConfig = await this.getConfig();

      // Deactivate current config and create new one (audit trail)
      const result = await this.prisma.$transaction(async (tx) => {
        // Deactivate old config
        await tx.escrowConfig.update({
          where: { id: currentConfig.id },
          data: { isActive: false },
        });

        // Create new config with updated values
        const newConfig = await tx.escrowConfig.create({
          data: {
            autoReleaseDays: updateDto.autoReleaseDays ?? currentConfig.autoReleaseDays,
            holdDurationDays: updateDto.holdDurationDays ?? currentConfig.holdDurationDays,
            disputeWindowDays: updateDto.disputeWindowDays ?? currentConfig.disputeWindowDays,
            feePercentage: updateDto.feePercentage
              ? new Decimal(updateDto.feePercentage.toString())
              : new Decimal(currentConfig.feePercentage.toString()),
            minHoldAmount: updateDto.minHoldAmount
              ? new Decimal(updateDto.minHoldAmount.toString())
              : new Decimal(currentConfig.minHoldAmount.toString()),
            maxHoldAmount: updateDto.maxHoldAmount
              ? new Decimal(updateDto.maxHoldAmount.toString())
              : new Decimal(currentConfig.maxHoldAmount.toString()),
            isActive: updateDto.isActive ?? true,
          },
        });

        // Create audit log
        await tx.auditLog.create({
          data: {
            adminId: adminUserId,
            action: 'ESCROW_CONFIG_UPDATE',
            entityType: 'ESCROW_CONFIG',
            entityId: newConfig.id,
            beforeState: currentConfig as any,
            afterState: this.mapConfigToDto(newConfig) as any,
            reason: 'Escrow configuration updated',
            ipAddress: '0.0.0.0', // Should be passed from request
            userAgent: 'Admin API',
            success: true,
          },
        });

        return newConfig;
      });

      this.logger.log(`Escrow config updated by admin ${adminUserId}`);
      return this.mapConfigToDto(result);
    } catch (error) {
      this.logger.error(`Failed to update escrow config: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update escrow configuration');
    }
  }

  /**
   * Get all active escrow holds with filtering and pagination
   */
  async getActiveHolds(query: EscrowHoldsQueryDto): Promise<{
    holds: EscrowHoldDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const { page = 1, limit = 20, status, jobId, clientId, artisanId } = query;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};

      if (status) {
        where.escrowStatus = status;
      }

      if (jobId) {
        where.jobId = jobId;
      }

      if (clientId) {
        where.payerId = clientId;
      }

      if (artisanId) {
        where.payeeId = artisanId;
      }

      const [payments, total] = await Promise.all([
        this.prisma.payment.findMany({
          where,
          include: {
            job: true,
            payer: { include: { profile: true } },
            payee: { include: { profile: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.payment.count({ where }),
      ]);

      const config = await this.getConfig();
      const holds = payments.map(payment => this.mapPaymentToHoldDto(payment, config));

      return {
        holds,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error(`Failed to get active holds: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to retrieve escrow holds');
    }
  }

  /**
   * Get single escrow hold by payment ID
   */
  async getHoldById(paymentId: string): Promise<EscrowHoldDto> {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          job: true,
          payer: { include: { profile: true } },
          payee: { include: { profile: true } },
        },
      });

      if (!payment) {
        throw new NotFoundException('Escrow hold not found');
      }

      const config = await this.getConfig();
      return this.mapPaymentToHoldDto(payment, config);
    } catch (error) {
      this.logger.error(`Failed to get hold ${paymentId}: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve escrow hold');
    }
  }

  /**
   * Release escrow hold (admin action)
   */
  async releaseHold(
    paymentId: string,
    reason: string,
    adminUserId: string,
    notes?: string,
  ): Promise<EscrowHoldDto> {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          job: true,
          payee: { include: { wallet: true } },
        },
      });

      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      if (payment.escrowStatus !== 'HELD') {
        throw new BadRequestException('Payment is not held in escrow');
      }

      // Calculate artisan payout (amount minus platform fee)
      const artisanPayout = parseFloat(payment.amount.toString()) -
                           parseFloat(payment.platformFee.toString());

      const result = await this.prisma.$transaction(async (tx) => {
        // Update payment status
        const updatedPayment = await tx.payment.update({
          where: { id: paymentId },
          data: {
            escrowStatus: 'RELEASED',
            releasedAt: new Date(),
            status: 'COMPLETED',
          },
          include: {
            job: true,
            payer: { include: { profile: true } },
            payee: { include: { profile: true } },
          },
        });

        // Update or create artisan wallet
        let wallet = payment.payee.wallet;
        if (!wallet) {
          wallet = await tx.wallet.create({
            data: {
              userId: payment.payeeId,
              balance: new Decimal(artisanPayout.toString()),
              totalEarnings: new Decimal(artisanPayout.toString()),
            },
          });
        } else {
          wallet = await tx.wallet.update({
            where: { id: wallet.id },
            data: {
              balance: { increment: new Decimal(artisanPayout.toString()) },
              totalEarnings: { increment: new Decimal(artisanPayout.toString()) },
            },
          });
        }

        // Create wallet transaction
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: 'CREDIT',
            amount: new Decimal(artisanPayout.toString()),
            balanceBefore: new Decimal(
              (parseFloat(wallet.balance.toString()) - artisanPayout).toString()
            ),
            balanceAfter: wallet.balance,
            reference: paymentId,
            description: `Payment released for job: ${payment.job.title}`,
          },
        });

        // Update job status
        await tx.job.update({
          where: { id: payment.jobId },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        });

        // Create audit log
        await tx.auditLog.create({
          data: {
            adminId: adminUserId,
            action: 'ESCROW_RELEASE',
            entityType: 'PAYMENT',
            entityId: paymentId,
            beforeState: { escrowStatus: 'HELD' },
            afterState: { escrowStatus: 'RELEASED', artisanPayout, releasedAt: new Date() },
            reason,
            ipAddress: '0.0.0.0',
            userAgent: 'Admin API',
            success: true,
          },
        });

        // Notify artisan
        await tx.notification.create({
          data: {
            userId: payment.payeeId,
            type: 'PAYMENT_RECEIVED',
            title: 'Payment Released',
            message: `Your payment of R${artisanPayout.toFixed(2)} has been released for job "${payment.job.title}".`,
            data: {
              paymentId,
              jobId: payment.jobId,
              amount: artisanPayout,
              reason,
            },
          },
        });

        return updatedPayment;
      });

      this.logger.log(`Hold ${paymentId} released by admin ${adminUserId}: ${reason}`);
      const config = await this.getConfig();
      return this.mapPaymentToHoldDto(result, config);
    } catch (error) {
      this.logger.error(`Failed to release hold ${paymentId}: ${error.message}`, error.stack);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to release escrow hold');
    }
  }

  /**
   * Refund escrow hold (admin action)
   */
  async refundHold(
    paymentId: string,
    reason: string,
    adminUserId: string,
    notes?: string,
  ): Promise<EscrowHoldDto> {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          job: true,
          payer: { include: { profile: true } },
          payee: { include: { profile: true } },
        },
      });

      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      if (payment.escrowStatus !== 'HELD' && payment.escrowStatus !== 'DISPUTED') {
        throw new BadRequestException('Payment cannot be refunded in current status');
      }

      const refundAmount = parseFloat(payment.totalAmount.toString());

      const result = await this.prisma.$transaction(async (tx) => {
        // Update payment status
        const updatedPayment = await tx.payment.update({
          where: { id: paymentId },
          data: {
            escrowStatus: 'REFUNDED',
            refundedAt: new Date(),
            status: 'REFUNDED',
          },
          include: {
            job: true,
            payer: { include: { profile: true } },
            payee: { include: { profile: true } },
          },
        });

        // Update job status
        await tx.job.update({
          where: { id: payment.jobId },
          data: {
            status: 'CANCELLED',
            cancelledAt: new Date(),
            cancellationReason: reason,
          },
        });

        // Create audit log
        await tx.auditLog.create({
          data: {
            adminId: adminUserId,
            action: 'ESCROW_REFUND',
            entityType: 'PAYMENT',
            entityId: paymentId,
            beforeState: { escrowStatus: payment.escrowStatus },
            afterState: { escrowStatus: 'REFUNDED', refundAmount, refundedAt: new Date() },
            reason,
            ipAddress: '0.0.0.0',
            userAgent: 'Admin API',
            success: true,
          },
        });

        // Notify client
        await tx.notification.create({
          data: {
            userId: payment.payerId,
            type: 'PAYMENT_RECEIVED',
            title: 'Payment Refunded',
            message: `Your payment of R${refundAmount.toFixed(2)} has been refunded for job "${payment.job.title}".`,
            data: {
              paymentId,
              jobId: payment.jobId,
              refundAmount,
              reason,
            },
          },
        });

        return updatedPayment;
      });

      this.logger.log(`Hold ${paymentId} refunded by admin ${adminUserId}: ${reason}`);
      const config = await this.getConfig();
      return this.mapPaymentToHoldDto(result, config);
    } catch (error) {
      this.logger.error(`Failed to refund hold ${paymentId}: ${error.message}`, error.stack);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to refund escrow hold');
    }
  }

  /**
   * Get escrow analytics and statistics
   */
  async getAnalytics(): Promise<EscrowAnalyticsDto> {
    try {
      const [
        heldStats,
        releasedStats,
        disputedStats,
        refundedStats,
        allPayments,
      ] = await Promise.all([
        this.prisma.payment.aggregate({
          _sum: { amount: true },
          _count: { id: true },
          where: { escrowStatus: 'HELD' },
        }),
        this.prisma.payment.aggregate({
          _sum: { amount: true, platformFee: true },
          _count: { id: true },
          where: { escrowStatus: 'RELEASED' },
        }),
        this.prisma.payment.aggregate({
          _sum: { amount: true },
          _count: { id: true },
          where: { escrowStatus: 'DISPUTED' },
        }),
        this.prisma.payment.aggregate({
          _sum: { amount: true },
          _count: { id: true },
          where: { escrowStatus: 'REFUNDED' },
        }),
        this.prisma.payment.findMany({
          where: { escrowStatus: 'HELD', paidAt: { not: null } },
          select: { paidAt: true, releasedAt: true },
        }),
      ]);

      const config = await this.getConfig();

      // Calculate average hold duration
      const durations = allPayments
        .filter(p => p.paidAt)
        .map(p => {
          const start = p.paidAt!.getTime();
          const end = p.releasedAt?.getTime() || Date.now();
          return (end - start) / (1000 * 60 * 60 * 24); // Convert to days
        });
      const averageHoldDuration = durations.length > 0
        ? durations.reduce((sum, d) => sum + d, 0) / durations.length
        : 0;

      // Count holds pending auto-release (approaching auto-release date)
      const pendingAutoRelease = await this.prisma.payment.count({
        where: {
          escrowStatus: 'HELD',
          paidAt: {
            lte: new Date(Date.now() - (config.autoReleaseDays - 2) * 24 * 60 * 60 * 1000),
          },
        },
      });

      // Count holds requiring attention
      const holdsRequiringAttention = disputedStats._count.id + pendingAutoRelease;

      return {
        totalHeld: parseFloat(heldStats._sum.amount?.toString() || '0'),
        totalReleased: parseFloat(releasedStats._sum.amount?.toString() || '0'),
        totalDisputed: parseFloat(disputedStats._sum.amount?.toString() || '0'),
        totalRefunded: parseFloat(refundedStats._sum.amount?.toString() || '0'),
        activeHoldsCount: heldStats._count.id,
        pendingAutoReleaseCount: pendingAutoRelease,
        averageHoldDuration: Math.round(averageHoldDuration * 100) / 100,
        platformFeesCollected: parseFloat(releasedStats._sum.platformFee?.toString() || '0'),
        holdsByStatus: {
          held: heldStats._count.id,
          released: releasedStats._count.id,
          disputed: disputedStats._count.id,
          refunded: refundedStats._count.id,
        },
        holdsRequiringAttention,
      };
    } catch (error) {
      this.logger.error(`Failed to get escrow analytics: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to retrieve escrow analytics');
    }
  }

  /**
   * Auto-release scheduler - runs daily at 2 AM
   * Automatically releases funds for completed jobs after configured days
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async autoReleaseScheduler(): Promise<void> {
    try {
      this.logger.log('Starting auto-release scheduler');

      const config = await this.getConfig();
      const cutoffDate = new Date(
        Date.now() - config.autoReleaseDays * 24 * 60 * 60 * 1000
      );

      // Find payments eligible for auto-release
      const eligiblePayments = await this.prisma.payment.findMany({
        where: {
          escrowStatus: 'HELD',
          status: 'COMPLETED',
          paidAt: { lte: cutoffDate },
        },
        include: {
          job: true,
        },
      });

      this.logger.log(`Found ${eligiblePayments.length} payments eligible for auto-release`);

      // Process auto-releases
      let successCount = 0;
      let failureCount = 0;

      for (const payment of eligiblePayments) {
        try {
          await this.releaseHold(
            payment.id,
            `Auto-released after ${config.autoReleaseDays} days`,
            'system-auto-release',
            'Automated release by scheduler'
          );
          successCount++;
        } catch (error) {
          this.logger.error(
            `Failed to auto-release payment ${payment.id}: ${error.message}`,
            error.stack
          );
          failureCount++;
        }
      }

      this.logger.log(
        `Auto-release completed: ${successCount} successful, ${failureCount} failed`
      );
    } catch (error) {
      this.logger.error(`Auto-release scheduler failed: ${error.message}`, error.stack);
    }
  }

  /**
   * Validate escrow configuration update
   */
  private validateConfigUpdate(updateDto: UpdateEscrowConfigDto): void {
    // Validate min/max amounts
    if (updateDto.minHoldAmount !== undefined &&
        updateDto.maxHoldAmount !== undefined &&
        updateDto.minHoldAmount >= updateDto.maxHoldAmount) {
      throw new BadRequestException('Maximum hold amount must be greater than minimum hold amount');
    }

    // Validate fee percentage
    if (updateDto.feePercentage !== undefined &&
        (updateDto.feePercentage < 0 || updateDto.feePercentage > 10)) {
      throw new BadRequestException('Fee percentage must be between 0% and 10%');
    }

    // Validate day ranges
    if (updateDto.autoReleaseDays !== undefined &&
        (updateDto.autoReleaseDays < 1 || updateDto.autoReleaseDays > 90)) {
      throw new BadRequestException('Auto-release days must be between 1 and 90');
    }

    if (updateDto.holdDurationDays !== undefined &&
        (updateDto.holdDurationDays < 1 || updateDto.holdDurationDays > 365)) {
      throw new BadRequestException('Hold duration days must be between 1 and 365');
    }

    if (updateDto.disputeWindowDays !== undefined &&
        (updateDto.disputeWindowDays < 1 || updateDto.disputeWindowDays > 60)) {
      throw new BadRequestException('Dispute window days must be between 1 and 60');
    }
  }

  /**
   * Map escrow config to DTO
   */
  private mapConfigToDto(config: any): EscrowConfigResponseDto {
    return {
      id: config.id,
      autoReleaseDays: config.autoReleaseDays,
      holdDurationDays: config.holdDurationDays,
      disputeWindowDays: config.disputeWindowDays,
      feePercentage: parseFloat(config.feePercentage.toString()),
      minHoldAmount: parseFloat(config.minHoldAmount.toString()),
      maxHoldAmount: parseFloat(config.maxHoldAmount.toString()),
      isActive: config.isActive,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }

  /**
   * Map payment to escrow hold DTO
   */
  private mapPaymentToHoldDto(payment: any, config: EscrowConfigResponseDto): EscrowHoldDto {
    const daysHeld = payment.paidAt
      ? Math.floor((Date.now() - payment.paidAt.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const daysUntilAutoRelease = Math.max(0, config.autoReleaseDays - daysHeld);

    return {
      id: payment.id,
      jobId: payment.jobId,
      jobTitle: payment.job.title,
      clientId: payment.payerId,
      clientName: payment.payer.profile
        ? `${payment.payer.profile.firstName || ''} ${payment.payer.profile.lastName || ''}`.trim()
        : payment.payer.email,
      artisanId: payment.payeeId,
      artisanName: payment.payee.profile
        ? `${payment.payee.profile.firstName || ''} ${payment.payee.profile.lastName || ''}`.trim()
        : payment.payee.email,
      amount: parseFloat(payment.amount.toString()),
      platformFee: parseFloat(payment.platformFee.toString()),
      totalAmount: parseFloat(payment.totalAmount.toString()),
      escrowStatus: payment.escrowStatus,
      paymentStatus: payment.status,
      daysHeld,
      daysUntilAutoRelease,
      createdAt: payment.createdAt,
      paidAt: payment.paidAt,
      releasedAt: payment.releasedAt,
    };
  }
}
