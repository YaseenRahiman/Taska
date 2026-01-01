import { Injectable, Logger, BadRequestException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { LoggingService } from '../../../common/logging/logging.service';
import { Decimal } from '@prisma/client/runtime/library';
import { LevelService } from '../../monetization/services/level.service';
import { LoyaltyService } from '../../monetization/services/loyalty.service';

export interface EscrowAccount {
  id: string;
  jobId: string;
  amount: number;
  platformFee: number;
  vatAmount: number;
  totalAmount: number;
  status: 'HELD' | 'RELEASED' | 'DISPUTED' | 'REFUNDED';
  createdAt: Date;
}

export interface EscrowTransaction {
  paymentId: string;
  jobId: string;
  amount: number;
  status: 'SUCCESS' | 'FAILED';
  transactionId: string;
}

@Injectable()
export class EscrowService {
  private readonly logger = new Logger(EscrowService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly loggingService: LoggingService,
    @Inject(forwardRef(() => LevelService))
    private readonly levelService: LevelService,
    @Inject(forwardRef(() => LoyaltyService))
    private readonly loyaltyService: LoyaltyService,
  ) {}

  /**
   * Create escrow account when payment is received
   */
  async createEscrowAccount(
    jobId: string,
    payerId: string,
    payeeId: string,
    amount: number,
    platformFeePercentage: number = 10,
    vatRate: number = 15,
  ): Promise<EscrowAccount> {
    try {
      // Calculate fees
      const platformFee = this.calculatePlatformFee(amount, platformFeePercentage);
      const vatAmount = this.calculateVAT(amount, vatRate);
      const totalAmount = amount + vatAmount;

      // Use transaction to ensure data consistency
      const result = await this.prisma.$transaction(async (tx) => {
        // Create payment record
        const payment = await tx.payment.create({
          data: {
            jobId,
            payerId,
            payeeId,
            amount: new Decimal(amount.toString()),
            platformFee: new Decimal(platformFee.toString()),
            vatAmount: new Decimal(vatAmount.toString()),
            totalAmount: new Decimal(totalAmount.toString()),
            currency: 'ZAR',
            paymentMethod: 'CREDIT_CARD', // Will be updated based on actual method
            paymentProvider: 'stripe', // Default, will be updated
            providerTxnId: '', // Will be updated when payment is processed
            status: 'PENDING',
            escrowStatus: 'HELD',
          },
        });

        // Update job status to indicate payment is being processed
        await tx.job.update({
          where: { id: jobId },
          data: { status: 'IN_PROGRESS' },
        });

        // Log escrow creation
        await tx.activityLog.create({
          data: {
            userId: payerId,
            jobId,
            action: 'ESCROW_CREATED',
            entityType: 'PAYMENT',
            entityId: payment.id,
            newData: {
              amount,
              platformFee,
              vatAmount,
              totalAmount,
              status: 'HELD',
            },
          },
        });

        return payment;
      });

      this.logger.log(`Escrow account created for job ${jobId}, payment ${result.id}`);

      return {
        id: result.id,
        jobId: result.jobId,
        amount: parseFloat(result.amount.toString()),
        platformFee: parseFloat(result.platformFee.toString()),
        vatAmount: parseFloat(result.vatAmount.toString()),
        totalAmount: parseFloat(result.totalAmount.toString()),
        status: result.escrowStatus as 'HELD' | 'RELEASED' | 'DISPUTED' | 'REFUNDED',
        createdAt: result.createdAt,
      };
    } catch (error) {
      this.logger.error(`Failed to create escrow account for job ${jobId}: ${error.message}`);
      throw new BadRequestException('Failed to create escrow account');
    }
  }

  /**
   * Release funds to artisan when job is completed
   * Uses dynamic platform fees based on artisan level
   */
  async releaseFunds(
    paymentId: string,
    adminUserId?: string,
    releaseReason?: string,
    rating?: number,
    isRepeatClient?: boolean,
  ): Promise<EscrowTransaction> {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          job: {
            include: {
              bids: {
                where: { status: 'ACCEPTED' },
                take: 1,
              },
            },
          },
          payee: {
            include: {
              wallet: true,
            },
          },
        },
      });

      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      if (payment.escrowStatus !== 'HELD') {
        throw new BadRequestException('Funds are not held in escrow');
      }

      const artisanId = payment.payeeId;
      const jobAmount = parseFloat(payment.amount.toString());

      // Get dynamic platform fee based on artisan level
      const feeResult = await this.levelService.calculatePlatformFee(artisanId, jobAmount);
      const dynamicPlatformFee = feeResult.feeAmount;

      // Calculate artisan payout with dynamic fee
      const artisanPayout = jobAmount - dynamicPlatformFee;

      this.logger.log(`Releasing funds with dynamic fee: ${feeResult.feePercent}% (R${dynamicPlatformFee}) for artisan level ${feeResult.level}`);

      const result = await this.prisma.$transaction(async (tx) => {
        // Update payment status with dynamic platform fee
        await tx.payment.update({
          where: { id: paymentId },
          data: {
            escrowStatus: 'RELEASED',
            releasedAt: new Date(),
            status: 'COMPLETED',
            platformFee: new Decimal(dynamicPlatformFee.toString()),
          },
        });

        // Create or update artisan wallet
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
              balance: {
                increment: new Decimal(artisanPayout.toString()),
              },
              totalEarnings: {
                increment: new Decimal(artisanPayout.toString()),
              },
            },
          });
        }

        // Create wallet transaction
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: 'CREDIT',
            amount: new Decimal(artisanPayout.toString()),
            balanceBefore: new Decimal((parseFloat(wallet.balance.toString()) - artisanPayout).toString()),
            balanceAfter: wallet.balance,
            reference: paymentId,
            description: `Payment received for job ${payment.job.title}`,
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

        // Log escrow release
        await tx.activityLog.create({
          data: {
            userId: adminUserId || payment.payeeId,
            jobId: payment.jobId,
            action: 'ESCROW_RELEASED',
            entityType: 'PAYMENT',
            entityId: paymentId,
            newData: {
              artisanPayout,
              releaseReason,
              releasedAt: new Date(),
            },
          },
        });

        // Create notification for artisan with fee details
        await tx.notification.create({
          data: {
            userId: payment.payeeId,
            type: 'PAYMENT_RECEIVED',
            title: 'Payment Received',
            message: `You have received R${artisanPayout.toFixed(2)} for completing the job "${payment.job.title}". (Platform fee: ${feeResult.feePercent}% - R${dynamicPlatformFee.toFixed(2)})`,
            data: {
              paymentId,
              jobId: payment.jobId,
              amount: artisanPayout,
              platformFee: dynamicPlatformFee,
              feePercent: feeResult.feePercent,
              artisanLevel: feeResult.level,
            },
          },
        });

        return payment;
      });

      // After successful transaction, update artisan stats and award loyalty points
      try {
        // Update artisan level stats (job completed, rating, repeat client)
        await this.levelService.updateStatsAfterJobCompletion(
          artisanId,
          payment.jobId,
          rating,
          isRepeatClient,
        );

        // Award loyalty points for job completion
        await this.loyaltyService.awardPoints(
          artisanId,
          'JOB_COMPLETED',
          payment.jobId,
          `Completed job: ${payment.job.title}`,
        );

        this.logger.log(`Updated artisan stats and awarded loyalty points for artisan ${artisanId}`);
      } catch (error) {
        // Log but don't fail the transaction - stats/loyalty updates are non-critical
        this.logger.warn(`Failed to update artisan stats/loyalty for ${artisanId}: ${error.message}`);
      }

      this.logger.log(`Funds released for payment ${paymentId}, amount: R${artisanPayout} (fee: R${dynamicPlatformFee})`);

      return {
        paymentId,
        jobId: result.jobId,
        amount: artisanPayout,
        status: 'SUCCESS',
        transactionId: result.id,
      };
    } catch (error) {
      this.logger.error(`Failed to release funds for payment ${paymentId}: ${error.message}`);
      throw new BadRequestException('Failed to release funds');
    }
  }

  /**
   * Refund payment to client
   */
  async refundPayment(
    paymentId: string,
    refundReason: string,
    adminUserId?: string,
  ): Promise<EscrowTransaction> {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
        include: { job: true },
      });

      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      if (payment.escrowStatus !== 'HELD') {
        throw new BadRequestException('Funds are not held in escrow');
      }

      const refundAmount = parseFloat(payment.totalAmount.toString());

      const result = await this.prisma.$transaction(async (tx) => {
        // Update payment status
        await tx.payment.update({
          where: { id: paymentId },
          data: {
            escrowStatus: 'REFUNDED',
            refundedAt: new Date(),
            status: 'REFUNDED',
          },
        });

        // Update job status
        await tx.job.update({
          where: { id: payment.jobId },
          data: { 
            status: 'CANCELLED',
            cancelledAt: new Date(),
            cancellationReason: refundReason,
          },
        });

        // Log refund
        await tx.activityLog.create({
          data: {
            userId: adminUserId || payment.payerId,
            jobId: payment.jobId,
            action: 'PAYMENT_REFUNDED',
            entityType: 'PAYMENT',
            entityId: paymentId,
            newData: {
              refundAmount,
              refundReason,
              refundedAt: new Date(),
            },
          },
        });

        // Create notification for client
        await tx.notification.create({
          data: {
            userId: payment.payerId,
            type: 'PAYMENT_RECEIVED', // Using generic type, could create REFUND_PROCESSED
            title: 'Payment Refunded',
            message: `Your payment of R${refundAmount.toFixed(2)} for the job "${payment.job.title}" has been refunded.`,
            data: {
              paymentId,
              jobId: payment.jobId,
              refundAmount,
              reason: refundReason,
            },
          },
        });

        return payment;
      });

      this.logger.log(`Payment refunded: ${paymentId}, amount: R${refundAmount}`);

      return {
        paymentId,
        jobId: result.jobId,
        amount: refundAmount,
        status: 'SUCCESS',
        transactionId: result.id,
      };
    } catch (error) {
      this.logger.error(`Failed to refund payment ${paymentId}: ${error.message}`);
      throw new BadRequestException('Failed to process refund');
    }
  }

  /**
   * Mark payment as disputed
   */
  async disputePayment(
    paymentId: string,
    disputeReason: string,
    disputantUserId: string,
  ): Promise<boolean> {
    try {
      await this.prisma.$transaction(async (tx) => {
        // Update payment status
        await tx.payment.update({
          where: { id: paymentId },
          data: {
            escrowStatus: 'DISPUTED',
          },
        });

        const payment = await tx.payment.findUnique({
          where: { id: paymentId },
          include: { job: true },
        });

        // Update job status
        await tx.job.update({
          where: { id: payment.jobId },
          data: { status: 'DISPUTED' },
        });

        // Log dispute
        await tx.activityLog.create({
          data: {
            userId: disputantUserId,
            jobId: payment.jobId,
            action: 'PAYMENT_DISPUTED',
            entityType: 'PAYMENT',
            entityId: paymentId,
            newData: {
              disputeReason,
              disputedAt: new Date(),
            },
          },
        });
      });

      this.logger.log(`Payment disputed: ${paymentId}, reason: ${disputeReason}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to dispute payment ${paymentId}: ${error.message}`);
      throw new BadRequestException('Failed to dispute payment');
    }
  }

  /**
   * Get escrow account details
   */
  async getEscrowAccount(paymentId: string): Promise<EscrowAccount | null> {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
        include: { job: true },
      });

      if (!payment) {
        return null;
      }

      return {
        id: payment.id,
        jobId: payment.jobId,
        amount: parseFloat(payment.amount.toString()),
        platformFee: parseFloat(payment.platformFee.toString()),
        vatAmount: parseFloat(payment.vatAmount.toString()),
        totalAmount: parseFloat(payment.totalAmount.toString()),
        status: payment.escrowStatus as 'HELD' | 'RELEASED' | 'DISPUTED' | 'REFUNDED',
        createdAt: payment.createdAt,
      };
    } catch (error) {
      this.logger.error(`Failed to get escrow account ${paymentId}: ${error.message}`);
      throw new BadRequestException('Failed to retrieve escrow account');
    }
  }

  /**
   * Calculate platform fee
   */
  private calculatePlatformFee(amount: number, feePercentage: number = 10): number {
    return Math.round((amount * feePercentage / 100) * 100) / 100;
  }

  /**
   * Calculate VAT
   */
  private calculateVAT(amount: number, vatRate: number = 15): number {
    return Math.round((amount * vatRate / 100) * 100) / 100;
  }

  /**
   * Get escrow statistics for admin dashboard
   */
  async getEscrowStatistics(): Promise<{
    totalHeld: number;
    totalReleased: number;
    totalDisputed: number;
    totalRefunded: number;
    pendingCount: number;
  }> {
    try {
      const statistics = await this.prisma.payment.aggregate({
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
        where: {
          escrowStatus: 'HELD',
        },
      });

      const [held, released, disputed, refunded] = await Promise.all([
        this.prisma.payment.aggregate({
          _sum: { amount: true },
          where: { escrowStatus: 'HELD' },
        }),
        this.prisma.payment.aggregate({
          _sum: { amount: true },
          where: { escrowStatus: 'RELEASED' },
        }),
        this.prisma.payment.aggregate({
          _sum: { amount: true },
          where: { escrowStatus: 'DISPUTED' },
        }),
        this.prisma.payment.aggregate({
          _sum: { amount: true },
          where: { escrowStatus: 'REFUNDED' },
        }),
      ]);

      return {
        totalHeld: parseFloat(held._sum.amount?.toString() || '0'),
        totalReleased: parseFloat(released._sum.amount?.toString() || '0'),
        totalDisputed: parseFloat(disputed._sum.amount?.toString() || '0'),
        totalRefunded: parseFloat(refunded._sum.amount?.toString() || '0'),
        pendingCount: statistics._count.id,
      };
    } catch (error) {
      this.logger.error(`Failed to get escrow statistics: ${error.message}`);
      throw new BadRequestException('Failed to retrieve escrow statistics');
    }
  }
}
