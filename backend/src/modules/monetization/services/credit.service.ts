import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreditTransactionType, CreditPurchaseMethod, CreditPurchaseStatus, CreditVoucherStatus } from '@prisma/client';

export interface CreditBalance {
  userId: string;
  balance: number;
  lifetimeCredits: number;
  lifetimeSpent: number;
  autoTopUpEnabled: boolean;
  autoTopUpThreshold?: number;
  autoTopUpAmount?: number;
}

export interface CreditTransaction {
  id: string;
  type: CreditTransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reference?: string;
  referenceType?: string;
  description: string;
  createdAt: Date;
}

export interface CreditBundleInfo {
  id: string;
  name: string;
  credits: number;
  bonusCredits: number;
  totalCredits: number;
  priceZar: number;
  pricePerCredit: number;
  isPopular: boolean;
  description?: string;
}

@Injectable()
export class CreditService {
  private readonly logger = new Logger(CreditService.name);

  // Credit costs for various actions
  private readonly CREDIT_COSTS = {
    BID: 5,
    BOOST: 25,
    SUPER_BOOST: 50,
    FEATURE_PROFILE: 75,
    UNLOCK_CONTACT: 15,
    JOB_ALERT: 10,
  };

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get or create credit wallet for user
   */
  async getOrCreateCreditWallet(userId: string): Promise<CreditBalance> {
    try {
      let wallet = await this.prisma.creditWallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        wallet = await this.prisma.creditWallet.create({
          data: {
            userId,
            balance: 0,
            lifetimeCredits: 0,
            lifetimeSpent: 0,
            autoTopUpEnabled: false,
          },
        });

        this.logger.log(`Created credit wallet for user ${userId}`);
      }

      return {
        userId: wallet.userId,
        balance: wallet.balance,
        lifetimeCredits: wallet.lifetimeCredits,
        lifetimeSpent: wallet.lifetimeSpent,
        autoTopUpEnabled: wallet.autoTopUpEnabled,
        autoTopUpThreshold: wallet.autoTopUpThreshold ?? undefined,
        autoTopUpAmount: wallet.autoTopUpAmount ?? undefined,
      };
    } catch (error) {
      this.logger.error(`Failed to get/create credit wallet: ${error.message}`);
      throw new BadRequestException('Failed to access credit wallet');
    }
  }

  /**
   * Get credit balance for user
   */
  async getCreditBalance(userId: string): Promise<CreditBalance | null> {
    try {
      const wallet = await this.prisma.creditWallet.findUnique({
        where: { userId },
      });

      if (!wallet) return null;

      return {
        userId: wallet.userId,
        balance: wallet.balance,
        lifetimeCredits: wallet.lifetimeCredits,
        lifetimeSpent: wallet.lifetimeSpent,
        autoTopUpEnabled: wallet.autoTopUpEnabled,
        autoTopUpThreshold: wallet.autoTopUpThreshold ?? undefined,
        autoTopUpAmount: wallet.autoTopUpAmount ?? undefined,
      };
    } catch (error) {
      this.logger.error(`Failed to get credit balance: ${error.message}`);
      throw new BadRequestException('Failed to get credit balance');
    }
  }

  /**
   * Get available credit bundles
   */
  async getCreditBundles(): Promise<CreditBundleInfo[]> {
    try {
      const bundles = await this.prisma.creditBundle.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });

      return bundles.map((bundle) => {
        const totalCredits = bundle.credits + bundle.bonusCredits;
        return {
          id: bundle.id,
          name: bundle.name,
          credits: bundle.credits,
          bonusCredits: bundle.bonusCredits,
          totalCredits,
          priceZar: parseFloat(bundle.priceZar.toString()),
          pricePerCredit: parseFloat(bundle.priceZar.toString()) / totalCredits,
          isPopular: bundle.isPopular,
          description: bundle.description ?? undefined,
        };
      });
    } catch (error) {
      this.logger.error(`Failed to get credit bundles: ${error.message}`);
      throw new BadRequestException('Failed to get credit bundles');
    }
  }

  /**
   * Purchase credits with a bundle
   */
  async purchaseCredits(
    userId: string,
    bundleId: string,
    purchaseMethod: CreditPurchaseMethod,
    providerTxnId?: string,
  ): Promise<{ purchase: { id: string; creditsReceived: number }; newBalance: number }> {
    try {
      const bundle = await this.prisma.creditBundle.findUnique({
        where: { id: bundleId },
      });

      if (!bundle || !bundle.isActive) {
        throw new NotFoundException('Credit bundle not found or inactive');
      }

      const totalCredits = bundle.credits + bundle.bonusCredits;

      const result = await this.prisma.$transaction(async (tx) => {
        // Create purchase record
        const purchase = await tx.creditPurchase.create({
          data: {
            userId,
            bundleId,
            creditsReceived: totalCredits,
            amountPaid: bundle.priceZar,
            currency: 'ZAR',
            purchaseMethod,
            providerTxnId,
            status: CreditPurchaseStatus.COMPLETED,
            completedAt: new Date(),
          },
        });

        // Get or create wallet
        let wallet = await tx.creditWallet.findUnique({
          where: { userId },
        });

        if (!wallet) {
          wallet = await tx.creditWallet.create({
            data: {
              userId,
              balance: 0,
              lifetimeCredits: 0,
              lifetimeSpent: 0,
            },
          });
        }

        const balanceBefore = wallet.balance;
        const balanceAfter = balanceBefore + totalCredits;

        // Update wallet
        const updatedWallet = await tx.creditWallet.update({
          where: { userId },
          data: {
            balance: balanceAfter,
            lifetimeCredits: { increment: totalCredits },
          },
        });

        // Record transaction
        await tx.creditTransaction.create({
          data: {
            creditWalletId: wallet.id,
            type: CreditTransactionType.PURCHASE,
            amount: totalCredits,
            balanceBefore,
            balanceAfter,
            reference: purchase.id,
            referenceType: 'PURCHASE',
            description: `Purchased ${bundle.name} bundle (${totalCredits} credits)`,
            metadata: {
              bundleName: bundle.name,
              baseCredits: bundle.credits,
              bonusCredits: bundle.bonusCredits,
              amountPaid: parseFloat(bundle.priceZar.toString()),
            },
          },
        });

        return { purchase, newBalance: updatedWallet.balance };
      });

      this.logger.log(`User ${userId} purchased ${totalCredits} credits`);

      return {
        purchase: {
          id: result.purchase.id,
          creditsReceived: result.purchase.creditsReceived,
        },
        newBalance: result.newBalance,
      };
    } catch (error) {
      this.logger.error(`Failed to purchase credits: ${error.message}`);
      throw new BadRequestException(error.message || 'Failed to purchase credits');
    }
  }

  /**
   * Redeem a voucher code for credits
   */
  async redeemVoucher(userId: string, voucherCode: string): Promise<{ credits: number; newBalance: number }> {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // Find voucher
        const voucher = await tx.creditVoucher.findUnique({
          where: { code: voucherCode.toUpperCase() },
        });

        if (!voucher) {
          throw new NotFoundException('Invalid voucher code');
        }

        if (voucher.status !== CreditVoucherStatus.AVAILABLE && voucher.status !== CreditVoucherStatus.SOLD) {
          throw new BadRequestException('Voucher has already been used or is invalid');
        }

        if (voucher.expiresAt && voucher.expiresAt < new Date()) {
          throw new BadRequestException('Voucher has expired');
        }

        // Get or create wallet
        let wallet = await tx.creditWallet.findUnique({
          where: { userId },
        });

        if (!wallet) {
          wallet = await tx.creditWallet.create({
            data: { userId, balance: 0, lifetimeCredits: 0, lifetimeSpent: 0 },
          });
        }

        const balanceBefore = wallet.balance;
        const balanceAfter = balanceBefore + voucher.credits;

        // Update wallet
        const updatedWallet = await tx.creditWallet.update({
          where: { userId },
          data: {
            balance: balanceAfter,
            lifetimeCredits: { increment: voucher.credits },
          },
        });

        // Mark voucher as redeemed
        await tx.creditVoucher.update({
          where: { id: voucher.id },
          data: {
            status: CreditVoucherStatus.REDEEMED,
            redeemedBy: userId,
            redeemedAt: new Date(),
          },
        });

        // Create purchase record
        await tx.creditPurchase.create({
          data: {
            userId,
            creditsReceived: voucher.credits,
            amountPaid: voucher.priceZar,
            currency: 'ZAR',
            purchaseMethod: CreditPurchaseMethod.RETAIL_VOUCHER,
            voucherCode: voucher.code,
            status: CreditPurchaseStatus.COMPLETED,
            completedAt: new Date(),
          },
        });

        // Record transaction
        await tx.creditTransaction.create({
          data: {
            creditWalletId: wallet.id,
            type: CreditTransactionType.PURCHASE,
            amount: voucher.credits,
            balanceBefore,
            balanceAfter,
            reference: voucher.id,
            referenceType: 'VOUCHER',
            description: `Redeemed voucher for ${voucher.credits} credits`,
            metadata: {
              voucherCode: voucher.code,
              retailer: voucher.retailer,
            },
          },
        });

        return { credits: voucher.credits, newBalance: updatedWallet.balance };
      });

      this.logger.log(`User ${userId} redeemed voucher for ${result.credits} credits`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to redeem voucher: ${error.message}`);
      throw new BadRequestException(error.message || 'Failed to redeem voucher');
    }
  }

  /**
   * Spend credits on an action (bid, boost, etc.)
   */
  async spendCredits(
    userId: string,
    action: 'BID' | 'BOOST' | 'SUPER_BOOST' | 'FEATURE_PROFILE' | 'UNLOCK_CONTACT' | 'JOB_ALERT',
    reference?: string,
    customAmount?: number,
  ): Promise<{ success: boolean; creditsSpent: number; newBalance: number }> {
    const creditsRequired = customAmount ?? this.CREDIT_COSTS[action];

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const wallet = await tx.creditWallet.findUnique({
          where: { userId },
        });

        if (!wallet) {
          throw new NotFoundException('Credit wallet not found. Please purchase credits first.');
        }

        if (wallet.balance < creditsRequired) {
          throw new BadRequestException(
            `Insufficient credits. You need ${creditsRequired} credits but have ${wallet.balance}.`,
          );
        }

        const balanceBefore = wallet.balance;
        const balanceAfter = balanceBefore - creditsRequired;

        // Update wallet
        const updatedWallet = await tx.creditWallet.update({
          where: { userId },
          data: {
            balance: balanceAfter,
            lifetimeSpent: { increment: creditsRequired },
          },
        });

        // Map action to transaction type
        const typeMap: Record<string, CreditTransactionType> = {
          BID: CreditTransactionType.BID,
          BOOST: CreditTransactionType.BOOST,
          SUPER_BOOST: CreditTransactionType.SUPER_BOOST,
          FEATURE_PROFILE: CreditTransactionType.FEATURE_PROFILE,
          UNLOCK_CONTACT: CreditTransactionType.UNLOCK_CONTACT,
          JOB_ALERT: CreditTransactionType.JOB_ALERT,
        };

        // Record transaction
        await tx.creditTransaction.create({
          data: {
            creditWalletId: wallet.id,
            type: typeMap[action],
            amount: -creditsRequired,
            balanceBefore,
            balanceAfter,
            reference,
            referenceType: action,
            description: `Spent ${creditsRequired} credits on ${action.toLowerCase().replace('_', ' ')}`,
          },
        });

        return { creditsSpent: creditsRequired, newBalance: updatedWallet.balance };
      });

      this.logger.log(`User ${userId} spent ${result.creditsSpent} credits on ${action}`);

      return { success: true, ...result };
    } catch (error) {
      this.logger.error(`Failed to spend credits: ${error.message}`);
      throw new BadRequestException(error.message || 'Failed to spend credits');
    }
  }

  /**
   * Check if user has enough credits for an action
   */
  async hasEnoughCredits(userId: string, action: keyof typeof this.CREDIT_COSTS): Promise<boolean> {
    const wallet = await this.prisma.creditWallet.findUnique({
      where: { userId },
    });

    if (!wallet) return false;
    return wallet.balance >= this.CREDIT_COSTS[action];
  }

  /**
   * Get credit cost for an action
   */
  getCreditCost(action: keyof typeof this.CREDIT_COSTS): number {
    return this.CREDIT_COSTS[action];
  }

  /**
   * Refund credits (e.g., when a job is cancelled)
   */
  async refundCredits(
    userId: string,
    amount: number,
    reason: string,
    reference?: string,
  ): Promise<{ newBalance: number }> {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const wallet = await tx.creditWallet.findUnique({
          where: { userId },
        });

        if (!wallet) {
          throw new NotFoundException('Credit wallet not found');
        }

        const balanceBefore = wallet.balance;
        const balanceAfter = balanceBefore + amount;

        const updatedWallet = await tx.creditWallet.update({
          where: { userId },
          data: {
            balance: balanceAfter,
            lifetimeSpent: { decrement: amount },
          },
        });

        await tx.creditTransaction.create({
          data: {
            creditWalletId: wallet.id,
            type: CreditTransactionType.REFUND,
            amount,
            balanceBefore,
            balanceAfter,
            reference,
            referenceType: 'REFUND',
            description: `Refund: ${reason}`,
          },
        });

        return { newBalance: updatedWallet.balance };
      });

      this.logger.log(`Refunded ${amount} credits to user ${userId}: ${reason}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to refund credits: ${error.message}`);
      throw new BadRequestException('Failed to refund credits');
    }
  }

  /**
   * Award bonus credits (promotions, referrals, etc.)
   */
  async awardBonusCredits(
    userId: string,
    amount: number,
    reason: string,
    reference?: string,
  ): Promise<{ newBalance: number }> {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        let wallet = await tx.creditWallet.findUnique({
          where: { userId },
        });

        if (!wallet) {
          wallet = await tx.creditWallet.create({
            data: { userId, balance: 0, lifetimeCredits: 0, lifetimeSpent: 0 },
          });
        }

        const balanceBefore = wallet.balance;
        const balanceAfter = balanceBefore + amount;

        const updatedWallet = await tx.creditWallet.update({
          where: { userId },
          data: {
            balance: balanceAfter,
            lifetimeCredits: { increment: amount },
          },
        });

        await tx.creditTransaction.create({
          data: {
            creditWalletId: wallet.id,
            type: CreditTransactionType.BONUS,
            amount,
            balanceBefore,
            balanceAfter,
            reference,
            referenceType: 'BONUS',
            description: `Bonus credits: ${reason}`,
          },
        });

        return { newBalance: updatedWallet.balance };
      });

      this.logger.log(`Awarded ${amount} bonus credits to user ${userId}: ${reason}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to award bonus credits: ${error.message}`);
      throw new BadRequestException('Failed to award bonus credits');
    }
  }

  /**
   * Convert ZAR wallet balance to credits
   */
  async convertWalletToCredits(
    userId: string,
    amountZar: number,
  ): Promise<{ creditsReceived: number; newCreditBalance: number }> {
    // 1 ZAR = 1 credit (no bonus for wallet conversion)
    const creditsToReceive = Math.floor(amountZar);

    if (creditsToReceive < 10) {
      throw new BadRequestException('Minimum conversion is R10');
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // Check ZAR wallet balance
        const zarWallet = await tx.wallet.findUnique({
          where: { userId },
        });

        if (!zarWallet || parseFloat(zarWallet.balance.toString()) < amountZar) {
          throw new BadRequestException('Insufficient wallet balance');
        }

        // Deduct from ZAR wallet
        await tx.wallet.update({
          where: { userId },
          data: {
            balance: { decrement: amountZar },
          },
        });

        // Record ZAR wallet transaction
        await tx.walletTransaction.create({
          data: {
            walletId: zarWallet.id,
            type: 'DEBIT',
            amount: amountZar,
            balanceBefore: parseFloat(zarWallet.balance.toString()),
            balanceAfter: parseFloat(zarWallet.balance.toString()) - amountZar,
            description: `Converted R${amountZar} to ${creditsToReceive} Taska Credits`,
          },
        });

        // Get or create credit wallet
        let creditWallet = await tx.creditWallet.findUnique({
          where: { userId },
        });

        if (!creditWallet) {
          creditWallet = await tx.creditWallet.create({
            data: { userId, balance: 0, lifetimeCredits: 0, lifetimeSpent: 0 },
          });
        }

        const balanceBefore = creditWallet.balance;
        const balanceAfter = balanceBefore + creditsToReceive;

        // Add to credit wallet
        const updatedCreditWallet = await tx.creditWallet.update({
          where: { userId },
          data: {
            balance: balanceAfter,
            lifetimeCredits: { increment: creditsToReceive },
          },
        });

        // Record credit transaction
        await tx.creditTransaction.create({
          data: {
            creditWalletId: creditWallet.id,
            type: CreditTransactionType.WALLET_CONVERSION,
            amount: creditsToReceive,
            balanceBefore,
            balanceAfter,
            referenceType: 'WALLET_CONVERSION',
            description: `Converted R${amountZar} from wallet to ${creditsToReceive} credits`,
            metadata: { amountZar },
          },
        });

        // Create purchase record
        await tx.creditPurchase.create({
          data: {
            userId,
            creditsReceived: creditsToReceive,
            amountPaid: amountZar,
            currency: 'ZAR',
            purchaseMethod: CreditPurchaseMethod.WALLET,
            status: CreditPurchaseStatus.COMPLETED,
            completedAt: new Date(),
          },
        });

        return {
          creditsReceived: creditsToReceive,
          newCreditBalance: updatedCreditWallet.balance,
        };
      });

      this.logger.log(`User ${userId} converted R${amountZar} to ${result.creditsReceived} credits`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to convert wallet to credits: ${error.message}`);
      throw new BadRequestException(error.message || 'Failed to convert wallet to credits');
    }
  }

  /**
   * Get credit transaction history
   */
  async getCreditTransactions(
    userId: string,
    page: number = 1,
    limit: number = 20,
    type?: CreditTransactionType,
  ): Promise<{
    transactions: CreditTransaction[];
    totalCount: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const wallet = await this.prisma.creditWallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        return {
          transactions: [],
          totalCount: 0,
          page,
          limit,
          totalPages: 0,
        };
      }

      const skip = (page - 1) * limit;
      const where = {
        creditWalletId: wallet.id,
        ...(type && { type }),
      };

      const [transactions, totalCount] = await Promise.all([
        this.prisma.creditTransaction.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.creditTransaction.count({ where }),
      ]);

      return {
        transactions: transactions.map((tx) => ({
          id: tx.id,
          type: tx.type,
          amount: tx.amount,
          balanceBefore: tx.balanceBefore,
          balanceAfter: tx.balanceAfter,
          reference: tx.reference ?? undefined,
          referenceType: tx.referenceType ?? undefined,
          description: tx.description,
          createdAt: tx.createdAt,
        })),
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      };
    } catch (error) {
      this.logger.error(`Failed to get credit transactions: ${error.message}`);
      throw new BadRequestException('Failed to get credit transactions');
    }
  }

  /**
   * Get action costs
   */
  getActionCosts(): Record<string, number> {
    return { ...this.CREDIT_COSTS };
  }

  /**
   * Configure auto top-up settings
   */
  async configureAutoTopUp(
    userId: string,
    enabled: boolean,
    threshold?: number,
    amount?: number,
    source?: 'WALLET' | 'CARD',
  ): Promise<CreditBalance> {
    try {
      if (enabled && (!threshold || !amount)) {
        throw new BadRequestException('Threshold and amount are required when enabling auto top-up');
      }

      const wallet = await this.prisma.creditWallet.update({
        where: { userId },
        data: {
          autoTopUpEnabled: enabled,
          autoTopUpThreshold: enabled ? threshold : null,
          autoTopUpAmount: enabled ? amount : null,
          autoTopUpSource: enabled && source ? source : null,
        },
      });

      this.logger.log(`User ${userId} ${enabled ? 'enabled' : 'disabled'} auto top-up`);

      return {
        userId: wallet.userId,
        balance: wallet.balance,
        lifetimeCredits: wallet.lifetimeCredits,
        lifetimeSpent: wallet.lifetimeSpent,
        autoTopUpEnabled: wallet.autoTopUpEnabled,
        autoTopUpThreshold: wallet.autoTopUpThreshold ?? undefined,
        autoTopUpAmount: wallet.autoTopUpAmount ?? undefined,
      };
    } catch (error) {
      this.logger.error(`Failed to configure auto top-up: ${error.message}`);
      throw new BadRequestException('Failed to configure auto top-up');
    }
  }
}
