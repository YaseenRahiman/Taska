import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LoggingService } from '../../common/logging/logging.service';
import { StripeService } from './services/stripe.service';
import { PayfastService } from './services/payfast.service';
import { EscrowService } from './services/escrow.service';
import { WalletsService } from './wallets.service';
import { CreatePaymentDto, PaymentMethod } from './dto/create-payment.dto';
import { Decimal } from '@prisma/client/runtime/library';

export interface PaymentResponse {
  id: string;
  jobId: string;
  amount: number;
  totalAmount: number;
  platformFee: number;
  vatAmount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
  paymentUrl?: string;
  clientSecret?: string;
  providerTxnId: string;
  createdAt: Date;
}

export interface PaymentIntent {
  paymentId: string;
  clientSecret?: string;
  paymentUrl?: string;
  amount: number;
  currency: string;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly loggingService: LoggingService,
    private readonly stripeService: StripeService,
    private readonly payfastService: PayfastService,
    private readonly escrowService: EscrowService,
    private readonly walletsService: WalletsService,
  ) {}

  /**
   * Create payment intent for job
   */
  async createPaymentIntent(
    userId: string,
    createPaymentDto: CreatePaymentDto,
  ): Promise<PaymentIntent> {
    try {
      // Validate job and get job details
      const job = await this.prisma.job.findUnique({
        where: { id: createPaymentDto.jobId },
        include: {
          client: {
            include: { profile: true },
          },
          bids: {
            where: { status: 'ACCEPTED' },
            include: {
              artisan: {
                include: { profile: true },
              },
            },
          },
        },
      });

      if (!job) {
        throw new NotFoundException('Job not found');
      }

      if (job.clientId !== userId) {
        throw new BadRequestException('You can only pay for your own jobs');
      }

      if (job.status !== 'OPEN') {
        throw new BadRequestException('Job must be open for payment');
      }

      const acceptedBid = job.bids.find(bid => bid.status === 'ACCEPTED');
      if (!acceptedBid) {
        throw new BadRequestException('No accepted bid found for this job');
      }

      // Calculate fees
      const amount = createPaymentDto.amount;
      const platformFee = await this.calculatePlatformFee(amount);
      const vatAmount = await this.calculateVAT(amount);
      const totalAmount = amount + vatAmount;

      // Create escrow account
      const escrowAccount = await this.escrowService.createEscrowAccount(
        job.id,
        userId,
        acceptedBid.artisanId,
        amount,
        10, // 10% platform fee
        15, // 15% VAT
      );

      let paymentIntent: PaymentIntent;

      // Process based on payment method
      switch (createPaymentDto.paymentMethod) {
        case PaymentMethod.CREDIT_CARD:
        case PaymentMethod.DEBIT_CARD:
          paymentIntent = await this.createStripePaymentIntent(
            escrowAccount.id,
            totalAmount,
            job,
            createPaymentDto,
          );
          break;

        case PaymentMethod.EFT:
        case PaymentMethod.MOBILE_MONEY:
          paymentIntent = await this.createPayFastPayment(
            escrowAccount.id,
            totalAmount,
            job,
            createPaymentDto,
          );
          break;

        default:
          throw new BadRequestException('Unsupported payment method');
      }

      this.logger.log(`Payment intent created: ${paymentIntent.paymentId} for job ${job.id}`);

      return paymentIntent;
    } catch (error) {
      this.logger.error(`Failed to create payment intent: ${error.message}`);
      throw new BadRequestException(error.message || 'Failed to create payment intent');
    }
  }

  /**
   * Create Stripe payment intent
   */
  private async createStripePaymentIntent(
    paymentId: string,
    totalAmount: number,
    job: any,
    createPaymentDto: CreatePaymentDto,
  ): Promise<PaymentIntent> {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
        include: { payer: { include: { profile: true } } },
      });

      // Create or get Stripe customer
      const customer = await this.stripeService.createCustomer(
        payment.payer.email,
        `${payment.payer.profile?.firstName} ${payment.payer.profile?.lastName}`.trim(),
      );

      // Create payment intent
      const stripePaymentIntent = await this.stripeService.createPaymentIntent(
        totalAmount,
        'zar',
        customer.id,
        {
          job_id: job.id,
          payment_id: paymentId,
          job_title: job.title,
        },
      );

      // Update payment record
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          paymentProvider: 'stripe',
          providerTxnId: stripePaymentIntent.id,
          paymentMethod: createPaymentDto.paymentMethod,
          status: 'PROCESSING',
        },
      });

      return {
        paymentId,
        clientSecret: stripePaymentIntent.clientSecret,
        amount: stripePaymentIntent.amount,
        currency: stripePaymentIntent.currency,
      };
    } catch (error) {
      this.logger.error(`Failed to create Stripe payment intent: ${error.message}`);
      throw new BadRequestException('Failed to create Stripe payment intent');
    }
  }

  /**
   * Create PayFast payment
   */
  private async createPayFastPayment(
    paymentId: string,
    totalAmount: number,
    job: any,
    createPaymentDto: CreatePaymentDto,
  ): Promise<PaymentIntent> {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
        include: { payer: { include: { profile: true } } },
      });

      // Generate PayFast payment data
      const paymentData = await this.payfastService.generatePaymentData(
        totalAmount,
        job.id,
        payment.payer.email,
        payment.payer.profile?.firstName || 'Client',
        payment.payer.profile?.lastName || '',
        `Payment for job: ${job.title}`,
        `Job payment for ${job.title} - ${job.description.substring(0, 100)}...`,
      );

      // Update payment record
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          paymentProvider: 'payfast',
          providerTxnId: job.id, // PayFast uses m_payment_id as reference
          paymentMethod: createPaymentDto.paymentMethod,
          status: 'PROCESSING',
        },
      });

      return {
        paymentId,
        paymentUrl: this.payfastService.getPaymentUrl(),
        amount: totalAmount,
        currency: 'ZAR',
      };
    } catch (error) {
      this.logger.error(`Failed to create PayFast payment: ${error.message}`);
      throw new BadRequestException('Failed to create PayFast payment');
    }
  }

  /**
   * Process successful payment
   */
  async processSuccessfulPayment(paymentId: string, providerTxnId: string): Promise<PaymentResponse> {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const payment = await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: 'COMPLETED',
            paidAt: new Date(),
            providerTxnId,
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
          data: { status: 'IN_PROGRESS' },
        });

        // Log successful payment
        await tx.activityLog.create({
          data: {
            userId: payment.payerId,
            jobId: payment.jobId,
            action: 'PAYMENT_COMPLETED',
            entityType: 'PAYMENT',
            entityId: paymentId,
            newData: {
              amount: parseFloat(payment.amount.toString()),
              providerTxnId,
              paidAt: new Date(),
            },
          },
        });

        // Create notifications
        await Promise.all([
          // Notify client
          tx.notification.create({
            data: {
              userId: payment.payerId,
              type: 'PAYMENT_RECEIVED',
              title: 'Payment Successful',
              message: `Your payment of R${parseFloat(payment.totalAmount.toString()).toFixed(2)} for "${payment.job.title}" has been successfully processed.`,
              data: {
                paymentId,
                jobId: payment.jobId,
                amount: parseFloat(payment.totalAmount.toString()),
              },
            },
          }),
          // Notify artisan
          tx.notification.create({
            data: {
              userId: payment.payeeId,
              type: 'JOB_COMPLETED',
              title: 'Job Payment Received',
              message: `Payment has been received for "${payment.job.title}". You can now start working on the job.`,
              data: {
                paymentId,
                jobId: payment.jobId,
                amount: parseFloat(payment.amount.toString()),
              },
            },
          }),
        ]);

        return payment;
      });

      this.logger.log(`Payment processed successfully: ${paymentId}`);

      return {
        id: result.id,
        jobId: result.jobId,
        amount: parseFloat(result.amount.toString()),
        totalAmount: parseFloat(result.totalAmount.toString()),
        platformFee: parseFloat(result.platformFee.toString()),
        vatAmount: parseFloat(result.vatAmount.toString()),
        status: result.status as 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED',
        providerTxnId: result.providerTxnId,
        createdAt: result.createdAt,
      };
    } catch (error) {
      this.logger.error(`Failed to process successful payment ${paymentId}: ${error.message}`);
      throw new BadRequestException('Failed to process payment');
    }
  }

  /**
   * Process failed payment
   */
  async processFailedPayment(paymentId: string, failureReason: string): Promise<boolean> {
    try {
      await this.prisma.$transaction(async (tx) => {
        const payment = await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: 'FAILED',
            escrowStatus: 'REFUNDED',
          },
          include: { job: true },
        });

        // Update job status back to open
        await tx.job.update({
          where: { id: payment.jobId },
          data: { status: 'OPEN' },
        });

        // Log failed payment
        await tx.activityLog.create({
          data: {
            userId: payment.payerId,
            jobId: payment.jobId,
            action: 'PAYMENT_FAILED',
            entityType: 'PAYMENT',
            entityId: paymentId,
            newData: {
              failureReason,
              failedAt: new Date(),
            },
          },
        });

        // Notify client
        await tx.notification.create({
          data: {
            userId: payment.payerId,
            type: 'SYSTEM_ANNOUNCEMENT', // Using available type
            title: 'Payment Failed',
            message: `Your payment for "${payment.job.title}" has failed. Please try again.`,
            data: {
              paymentId,
              jobId: payment.jobId,
              reason: failureReason,
            },
          },
        });
      });

      this.logger.log(`Payment failed: ${paymentId}, reason: ${failureReason}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to process failed payment ${paymentId}: ${error.message}`);
      throw new BadRequestException('Failed to process payment failure');
    }
  }

  /**
   * Get payment details
   */
  async getPayment(paymentId: string, userId: string): Promise<PaymentResponse | null> {
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
        return null;
      }

      // Check if user has access to this payment
      if (payment.payerId !== userId && payment.payeeId !== userId) {
        throw new BadRequestException('Unauthorized to view this payment');
      }

      return {
        id: payment.id,
        jobId: payment.jobId,
        amount: parseFloat(payment.amount.toString()),
        totalAmount: parseFloat(payment.totalAmount.toString()),
        platformFee: parseFloat(payment.platformFee.toString()),
        vatAmount: parseFloat(payment.vatAmount.toString()),
        status: payment.status as 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED',
        providerTxnId: payment.providerTxnId,
        createdAt: payment.createdAt,
      };
    } catch (error) {
      this.logger.error(`Failed to get payment ${paymentId}: ${error.message}`);
      throw new BadRequestException('Failed to retrieve payment');
    }
  }

  /**
   * Get user payments with pagination
   */
  async getUserPayments(
    userId: string,
    page: number = 1,
    limit: number = 20,
    type: 'sent' | 'received' | 'all' = 'all',
  ): Promise<{
    payments: PaymentResponse[];
    totalCount: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      
      let whereCondition: any = {};
      
      switch (type) {
        case 'sent':
          whereCondition = { payerId: userId };
          break;
        case 'received':
          whereCondition = { payeeId: userId };
          break;
        case 'all':
        default:
          whereCondition = {
            OR: [
              { payerId: userId },
              { payeeId: userId },
            ],
          };
          break;
      }

      const [payments, totalCount] = await Promise.all([
        this.prisma.payment.findMany({
          where: whereCondition,
          include: {
            job: true,
            payer: { include: { profile: true } },
            payee: { include: { profile: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.payment.count({
          where: whereCondition,
        }),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        payments: payments.map((payment) => ({
          id: payment.id,
          jobId: payment.jobId,
          amount: parseFloat(payment.amount.toString()),
          totalAmount: parseFloat(payment.totalAmount.toString()),
          platformFee: parseFloat(payment.platformFee.toString()),
          vatAmount: parseFloat(payment.vatAmount.toString()),
          status: payment.status as 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED',
          providerTxnId: payment.providerTxnId,
          createdAt: payment.createdAt,
        })),
        totalCount,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error(`Failed to get payments for user ${userId}: ${error.message}`);
      throw new BadRequestException('Failed to retrieve payments');
    }
  }

  /**
   * Release payment to artisan (when job is completed)
   */
  async releasePayment(paymentId: string, adminUserId?: string): Promise<boolean> {
    try {
      await this.escrowService.releaseFunds(paymentId, adminUserId, 'Job completed successfully');
      
      this.logger.log(`Payment released: ${paymentId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to release payment ${paymentId}: ${error.message}`);
      throw new BadRequestException('Failed to release payment');
    }
  }

  /**
   * Refund payment to client
   */
  async refundPayment(
    paymentId: string, 
    refundReason: string, 
    adminUserId?: string
  ): Promise<boolean> {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
      });

      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      // Process refund through payment provider
      if (payment.paymentProvider === 'stripe' && payment.providerTxnId) {
        try {
          await this.stripeService.refundPayment(payment.providerTxnId, undefined, refundReason);
        } catch (error) {
          this.logger.warn(`Stripe refund failed: ${error.message}`);
          // Continue with internal refund even if external refund fails
        }
      }

      // Process escrow refund
      await this.escrowService.refundPayment(paymentId, refundReason, adminUserId);

      this.logger.log(`Payment refunded: ${paymentId}, reason: ${refundReason}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to refund payment ${paymentId}: ${error.message}`);
      throw new BadRequestException('Failed to process refund');
    }
  }

  /**
   * Calculate platform fee (10% default)
   */
  private async calculatePlatformFee(amount: number, feePercentage: number = 10): Promise<number> {
    return Math.round((amount * feePercentage / 100) * 100) / 100;
  }

  /**
   * Calculate VAT (15% for South Africa)
   */
  private async calculateVAT(amount: number, vatRate: number = 15): Promise<number> {
    return Math.round((amount * vatRate / 100) * 100) / 100;
  }

  /**
   * Get payment statistics for admin dashboard
   */
  async getPaymentStatistics(): Promise<{
    totalPayments: number;
    totalVolume: number;
    completedPayments: number;
    pendingPayments: number;
    refundedPayments: number;
    averagePaymentAmount: number;
    platformFeesCollected: number;
    vatCollected: number;
  }> {
    try {
      const [
        totalStats,
        completedStats,
        pendingStats,
        refundedStats,
        averageStats,
        feeStats
      ] = await Promise.all([
        this.prisma.payment.aggregate({
          _count: { id: true },
          _sum: { totalAmount: true },
        }),
        this.prisma.payment.aggregate({
          _count: { id: true },
          _sum: { totalAmount: true },
          where: { status: 'COMPLETED' },
        }),
        this.prisma.payment.aggregate({
          _count: { id: true },
          where: { status: { in: ['PENDING', 'PROCESSING'] } },
        }),
        this.prisma.payment.aggregate({
          _count: { id: true },
          _sum: { totalAmount: true },
          where: { status: 'REFUNDED' },
        }),
        this.prisma.payment.aggregate({
          _avg: { amount: true },
          where: { status: 'COMPLETED' },
        }),
        this.prisma.payment.aggregate({
          _sum: { 
            platformFee: true,
            vatAmount: true,
          },
          where: { status: 'COMPLETED' },
        }),
      ]);

      return {
        totalPayments: totalStats._count.id,
        totalVolume: parseFloat(totalStats._sum.totalAmount?.toString() || '0'),
        completedPayments: completedStats._count.id,
        pendingPayments: pendingStats._count.id,
        refundedPayments: refundedStats._count.id,
        averagePaymentAmount: parseFloat(averageStats._avg.amount?.toString() || '0'),
        platformFeesCollected: parseFloat(feeStats._sum.platformFee?.toString() || '0'),
        vatCollected: parseFloat(feeStats._sum.vatAmount?.toString() || '0'),
      };
    } catch (error) {
      this.logger.error(`Failed to get payment statistics: ${error.message}`);
      throw new BadRequestException('Failed to retrieve payment statistics');
    }
  }
}
