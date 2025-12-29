import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LoggingService } from '../../common/logging/logging.service';
import { Decimal } from '@prisma/client/runtime/library';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';

export interface WalletBalance {
  userId: string;
  balance: number;
  pendingBalance: number;
  totalEarnings: number;
  totalWithdrawals: number;
  currency: string;
  isActive: boolean;
}

export interface WalletTransaction {
  id: string;
  type: 'CREDIT' | 'DEBIT' | 'WITHDRAWAL' | 'REFUND' | 'FEE';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reference?: string;
  description: string;
  createdAt: Date;
}

export interface WithdrawalRequest {
  id: string;
  walletId: string;
  amount: number;
  bankAccount: string;
  withdrawalMethod: 'BANK_TRANSFER' | 'MOBILE_MONEY' | 'CRYPTO';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
  processedAt?: Date;
  rejectedReason?: string;
  createdAt: Date;
}

@Injectable()
export class WalletsService {
  private readonly logger = new Logger(WalletsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly loggingService: LoggingService,
  ) {}

  /**
   * Get or create wallet for artisan
   */
  async getOrCreateWallet(userId: string): Promise<WalletBalance> {
    try {
      let wallet = await this.prisma.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        // Create new wallet for artisan
        wallet = await this.prisma.wallet.create({
          data: {
            userId,
            balance: new Decimal('0'),
            pendingBalance: new Decimal('0'),
            totalEarnings: new Decimal('0'),
            totalWithdrawals: new Decimal('0'),
            currency: 'ZAR',
            isActive: true,
          },
        });

        this.logger.log(`Created new wallet for user ${userId}`);

        // Log wallet creation
        await this.prisma.activityLog.create({
          data: {
            userId,
            action: 'WALLET_CREATED',
            entityType: 'WALLET',
            entityId: wallet.id,
            newData: {
              balance: 0,
              currency: 'ZAR',
              isActive: true,
            },
          },
        });
      }

      return {
        userId: wallet.userId,
        balance: parseFloat(wallet.balance.toString()),
        pendingBalance: parseFloat(wallet.pendingBalance.toString()),
        totalEarnings: parseFloat(wallet.totalEarnings.toString()),
        totalWithdrawals: parseFloat(wallet.totalWithdrawals.toString()),
        currency: wallet.currency,
        isActive: wallet.isActive,
      };
    } catch (error) {
      this.logger.error(`Failed to get or create wallet for user ${userId}: ${error.message}`);
      throw new BadRequestException('Failed to access wallet');
    }
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(userId: string): Promise<WalletBalance | null> {
    try {
      const wallet = await this.prisma.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        return null;
      }

      return {
        userId: wallet.userId,
        balance: parseFloat(wallet.balance.toString()),
        pendingBalance: parseFloat(wallet.pendingBalance.toString()),
        totalEarnings: parseFloat(wallet.totalEarnings.toString()),
        totalWithdrawals: parseFloat(wallet.totalWithdrawals.toString()),
        currency: wallet.currency,
        isActive: wallet.isActive,
      };
    } catch (error) {
      this.logger.error(`Failed to get wallet balance for user ${userId}: ${error.message}`);
      throw new BadRequestException('Failed to retrieve wallet balance');
    }
  }

  /**
   * Get wallet transaction history
   */
  async getWalletTransactions(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    transactions: WalletTransaction[];
    totalCount: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const wallet = await this.prisma.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      const skip = (page - 1) * limit;

      const [transactions, totalCount] = await Promise.all([
        this.prisma.walletTransaction.findMany({
          where: { walletId: wallet.id },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.walletTransaction.count({
          where: { walletId: wallet.id },
        }),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        transactions: transactions.map((tx) => ({
          id: tx.id,
          type: tx.type as 'CREDIT' | 'DEBIT' | 'WITHDRAWAL' | 'REFUND' | 'FEE',
          amount: parseFloat(tx.amount.toString()),
          balanceBefore: parseFloat(tx.balanceBefore.toString()),
          balanceAfter: parseFloat(tx.balanceAfter.toString()),
          reference: tx.reference,
          description: tx.description,
          createdAt: tx.createdAt,
        })),
        totalCount,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error(`Failed to get wallet transactions for user ${userId}: ${error.message}`);
      throw new BadRequestException('Failed to retrieve wallet transactions');
    }
  }

  /**
   * Credit wallet (add funds)
   */
  async creditWallet(
    userId: string,
    amount: number,
    description: string,
    reference?: string,
  ): Promise<WalletBalance> {
    try {
      if (amount <= 0) {
        throw new BadRequestException('Credit amount must be greater than zero');
      }

      const result = await this.prisma.$transaction(async (tx) => {
        const wallet = await tx.wallet.findUnique({
          where: { userId },
        });

        if (!wallet) {
          throw new NotFoundException('Wallet not found');
        }

        if (!wallet.isActive) {
          throw new BadRequestException('Wallet is not active');
        }

        const balanceBefore = parseFloat(wallet.balance.toString());
        const newBalance = balanceBefore + amount;

        // Update wallet balance
        const updatedWallet = await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: new Decimal(newBalance.toString()),
            totalEarnings: {
              increment: new Decimal(amount.toString()),
            },
          },
        });

        // Create transaction record
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: 'CREDIT',
            amount: new Decimal(amount.toString()),
            balanceBefore: new Decimal(balanceBefore.toString()),
            balanceAfter: new Decimal(newBalance.toString()),
            reference,
            description,
          },
        });

        // Log credit transaction
        await tx.activityLog.create({
          data: {
            userId,
            action: 'WALLET_CREDITED',
            entityType: 'WALLET',
            entityId: wallet.id,
            newData: {
              amount,
              newBalance,
              reference,
              description,
            },
          },
        });

        return updatedWallet;
      });

      this.logger.log(`Credited wallet for user ${userId} with R${amount}`);

      return {
        userId: result.userId,
        balance: parseFloat(result.balance.toString()),
        pendingBalance: parseFloat(result.pendingBalance.toString()),
        totalEarnings: parseFloat(result.totalEarnings.toString()),
        totalWithdrawals: parseFloat(result.totalWithdrawals.toString()),
        currency: result.currency,
        isActive: result.isActive,
      };
    } catch (error) {
      this.logger.error(`Failed to credit wallet for user ${userId}: ${error.message}`);
      throw new BadRequestException('Failed to credit wallet');
    }
  }

  /**
   * Request withdrawal
   */
  async requestWithdrawal(
    userId: string,
    withdrawalDto: CreateWithdrawalDto,
  ): Promise<WithdrawalRequest> {
    try {
      if (withdrawalDto.amount <= 0) {
        throw new BadRequestException('Withdrawal amount must be greater than zero');
      }

      // Minimum withdrawal amount (R50)
      const minWithdrawal = 50;
      if (withdrawalDto.amount < minWithdrawal) {
        throw new BadRequestException(`Minimum withdrawal amount is R${minWithdrawal}`);
      }

      const result = await this.prisma.$transaction(async (tx) => {
        const wallet = await tx.wallet.findUnique({
          where: { userId },
        });

        if (!wallet) {
          throw new NotFoundException('Wallet not found');
        }

        if (!wallet.isActive) {
          throw new BadRequestException('Wallet is not active');
        }

        const availableBalance = parseFloat(wallet.balance.toString());
        
        if (withdrawalDto.amount > availableBalance) {
          throw new BadRequestException('Insufficient funds for withdrawal');
        }

        // Check daily withdrawal limit (R10,000)
        const dailyLimit = 10000;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayWithdrawals = await tx.withdrawal.aggregate({
          where: {
            walletId: wallet.id,
            status: { in: ['PENDING', 'PROCESSING', 'COMPLETED'] },
            createdAt: { gte: today },
          },
          _sum: { amount: true },
        });

        const todayTotal = parseFloat(todayWithdrawals._sum.amount?.toString() || '0');
        
        if (todayTotal + withdrawalDto.amount > dailyLimit) {
          throw new BadRequestException(`Daily withdrawal limit of R${dailyLimit} exceeded`);
        }

        // Create withdrawal request
        const withdrawal = await tx.withdrawal.create({
          data: {
            walletId: wallet.id,
            amount: new Decimal(withdrawalDto.amount.toString()),
            bankAccount: withdrawalDto.bankAccount, // Should be encrypted in production
            withdrawalMethod: withdrawalDto.withdrawalMethod,
            status: 'PENDING',
          },
        });

        // Update wallet pending balance
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            pendingBalance: {
              increment: new Decimal(withdrawalDto.amount.toString()),
            },
          },
        });

        // Create debit transaction (pending)
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: 'WITHDRAWAL',
            amount: new Decimal(withdrawalDto.amount.toString()),
            balanceBefore: new Decimal(availableBalance.toString()),
            balanceAfter: new Decimal((availableBalance - withdrawalDto.amount).toString()),
            reference: withdrawal.id,
            description: `Withdrawal request to ${withdrawalDto.withdrawalMethod}`,
          },
        });

        // Log withdrawal request
        await tx.activityLog.create({
          data: {
            userId,
            action: 'WITHDRAWAL_REQUESTED',
            entityType: 'WITHDRAWAL',
            entityId: withdrawal.id,
            newData: {
              amount: withdrawalDto.amount,
              method: withdrawalDto.withdrawalMethod,
              status: 'PENDING',
            },
          },
        });

        // Create notification for admin
        await tx.notification.create({
          data: {
            userId: userId, // Could be admin user ID in production
            type: 'WITHDRAWAL_PROCESSED', // Using existing type
            title: 'Withdrawal Request',
            message: `A withdrawal request of R${withdrawalDto.amount} has been submitted for processing.`,
            data: {
              withdrawalId: withdrawal.id,
              amount: withdrawalDto.amount,
              method: withdrawalDto.withdrawalMethod,
            },
          },
        });

        return withdrawal;
      });

      this.logger.log(`Withdrawal requested by user ${userId} for R${withdrawalDto.amount}`);

      return {
        id: result.id,
        walletId: result.walletId,
        amount: parseFloat(result.amount.toString()),
        bankAccount: result.bankAccount,
        withdrawalMethod: result.withdrawalMethod as 'BANK_TRANSFER' | 'MOBILE_MONEY' | 'CRYPTO',
        status: result.status as 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED' | 'CANCELLED',
        processedAt: result.processedAt,
        rejectedReason: result.rejectedReason,
        createdAt: result.createdAt,
      };
    } catch (error) {
      this.logger.error(`Failed to request withdrawal for user ${userId}: ${error.message}`);
      throw new BadRequestException(error.message || 'Failed to process withdrawal request');
    }
  }

  /**
   * Get withdrawal history
   */
  async getWithdrawalHistory(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    withdrawals: WithdrawalRequest[];
    totalCount: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const wallet = await this.prisma.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      const skip = (page - 1) * limit;

      const [withdrawals, totalCount] = await Promise.all([
        this.prisma.withdrawal.findMany({
          where: { walletId: wallet.id },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.withdrawal.count({
          where: { walletId: wallet.id },
        }),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        withdrawals: withdrawals.map((withdrawal) => ({
          id: withdrawal.id,
          walletId: withdrawal.walletId,
          amount: parseFloat(withdrawal.amount.toString()),
          bankAccount: withdrawal.bankAccount,
          withdrawalMethod: withdrawal.withdrawalMethod as 'BANK_TRANSFER' | 'MOBILE_MONEY' | 'CRYPTO',
          status: withdrawal.status as 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED' | 'CANCELLED',
          processedAt: withdrawal.processedAt,
          rejectedReason: withdrawal.rejectedReason,
          createdAt: withdrawal.createdAt,
        })),
        totalCount,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error(`Failed to get withdrawal history for user ${userId}: ${error.message}`);
      throw new BadRequestException('Failed to retrieve withdrawal history');
    }
  }

  /**
   * Cancel withdrawal (only if pending)
   */
  async cancelWithdrawal(userId: string, withdrawalId: string): Promise<boolean> {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const withdrawal = await tx.withdrawal.findUnique({
          where: { id: withdrawalId },
          include: {
            wallet: true,
          },
        });

        if (!withdrawal) {
          throw new NotFoundException('Withdrawal not found');
        }

        if (withdrawal.wallet.userId !== userId) {
          throw new BadRequestException('Unauthorized to cancel this withdrawal');
        }

        if (withdrawal.status !== 'PENDING') {
          throw new BadRequestException('Only pending withdrawals can be cancelled');
        }

        // Update withdrawal status
        await tx.withdrawal.update({
          where: { id: withdrawalId },
          data: {
            status: 'CANCELLED',
            rejectedReason: 'Cancelled by user',
          },
        });

        // Restore wallet balance from pending
        await tx.wallet.update({
          where: { id: withdrawal.walletId },
          data: {
            pendingBalance: {
              decrement: withdrawal.amount,
            },
          },
        });

        // Log cancellation
        await tx.activityLog.create({
          data: {
            userId,
            action: 'WITHDRAWAL_CANCELLED',
            entityType: 'WITHDRAWAL',
            entityId: withdrawalId,
            newData: {
              amount: parseFloat(withdrawal.amount.toString()),
              reason: 'Cancelled by user',
            },
          },
        });

        return true;
      });

      this.logger.log(`Withdrawal ${withdrawalId} cancelled by user ${userId}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to cancel withdrawal ${withdrawalId}: ${error.message}`);
      throw new BadRequestException('Failed to cancel withdrawal');
    }
  }

  /**
   * Get wallet statistics for user
   */
  async getWalletStatistics(userId: string): Promise<{
    totalEarnings: number;
    thisMonthEarnings: number;
    totalWithdrawals: number;
    pendingWithdrawals: number;
    completedJobsCount: number;
    averageJobValue: number;
  }> {
    try {
      const wallet = await this.prisma.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        return {
          totalEarnings: 0,
          thisMonthEarnings: 0,
          totalWithdrawals: 0,
          pendingWithdrawals: 0,
          completedJobsCount: 0,
          averageJobValue: 0,
        };
      }

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [monthlyCredits, pendingWithdrawals, jobStats] = await Promise.all([
        this.prisma.walletTransaction.aggregate({
          where: {
            walletId: wallet.id,
            type: 'CREDIT',
            createdAt: { gte: startOfMonth },
          },
          _sum: { amount: true },
        }),
        this.prisma.withdrawal.aggregate({
          where: {
            walletId: wallet.id,
            status: { in: ['PENDING', 'PROCESSING'] },
          },
          _sum: { amount: true },
        }),
        this.prisma.payment.aggregate({
          where: {
            payeeId: userId,
            status: 'COMPLETED',
          },
          _count: { id: true },
          _avg: { amount: true },
        }),
      ]);

      return {
        totalEarnings: parseFloat(wallet.totalEarnings.toString()),
        thisMonthEarnings: parseFloat(monthlyCredits._sum.amount?.toString() || '0'),
        totalWithdrawals: parseFloat(wallet.totalWithdrawals.toString()),
        pendingWithdrawals: parseFloat(pendingWithdrawals._sum.amount?.toString() || '0'),
        completedJobsCount: jobStats._count.id,
        averageJobValue: parseFloat(jobStats._avg.amount?.toString() || '0'),
      };
    } catch (error) {
      this.logger.error(`Failed to get wallet statistics for user ${userId}: ${error.message}`);
      throw new BadRequestException('Failed to retrieve wallet statistics');
    }
  }

  /**
   * Deactivate wallet (admin function)
   */
  async deactivateWallet(userId: string, reason: string, adminUserId: string): Promise<boolean> {
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.wallet.update({
          where: { userId },
          data: { isActive: false },
        });

        // Log deactivation
        await tx.activityLog.create({
          data: {
            userId: adminUserId,
            action: 'WALLET_DEACTIVATED',
            entityType: 'WALLET',
            entityId: userId,
            newData: {
              targetUserId: userId,
              reason,
              deactivatedAt: new Date(),
            },
          },
        });
      });

      this.logger.log(`Wallet deactivated for user ${userId} by admin ${adminUserId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to deactivate wallet for user ${userId}: ${error.message}`);
      throw new BadRequestException('Failed to deactivate wallet');
    }
  }
}
