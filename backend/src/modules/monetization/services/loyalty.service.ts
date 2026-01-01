import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { LoyaltyActionType } from '@prisma/client';
import { CreditService } from './credit.service';

export interface LoyaltyBalance {
  userId: string;
  currentPoints: number;
  lifetimePoints: number;
}

export interface LoyaltyTransactionInfo {
  id: string;
  action: LoyaltyActionType;
  points: number;
  balance: number;
  reference?: string;
  description: string;
  createdAt: Date;
}

export interface LoyaltyRewardInfo {
  id: string;
  name: string;
  description?: string;
  pointsCost: number;
  rewardType: string;
  rewardValue: Record<string, unknown>;
  isActive: boolean;
  stockCount?: number;
  imageUrl?: string;
}

// Points awarded for various actions
const POINTS_CONFIG: Record<string, number> = {
  JOB_COMPLETED: 100,
  FIVE_STAR_REVIEW: 50,
  FOUR_STAR_REVIEW: 25,
  CLIENT_TIP: 25,
  FAST_RESPONSE: 10,
  EARLY_COMPLETION: 20,
  REPEAT_CLIENT: 75,
  REFERRAL_ARTISAN: 200,
  REFERRAL_CLIENT: 150,
  PROFILE_COMPLETE: 25,
  PORTFOLIO_UPLOAD: 10,
  VERIFICATION_COMPLETE: 100,
  STREAK_BONUS: 50,
  MONTHLY_TOP_PERFORMER: 500,
};

@Injectable()
export class LoyaltyService {
  private readonly logger = new Logger(LoyaltyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly creditService: CreditService,
  ) {}

  /**
   * Get loyalty balance for user
   */
  async getLoyaltyBalance(userId: string): Promise<LoyaltyBalance | null> {
    try {
      const artisanLevel = await this.prisma.artisanLevel.findUnique({
        where: { userId },
        select: {
          userId: true,
          loyaltyPoints: true,
          lifetimePoints: true,
        },
      });

      if (!artisanLevel) return null;

      return {
        userId: artisanLevel.userId,
        currentPoints: artisanLevel.loyaltyPoints,
        lifetimePoints: artisanLevel.lifetimePoints,
      };
    } catch (error) {
      this.logger.error(`Failed to get loyalty balance: ${error.message}`);
      throw new BadRequestException('Failed to get loyalty balance');
    }
  }

  /**
   * Award points for an action
   */
  async awardPoints(
    userId: string,
    action: LoyaltyActionType,
    reference?: string,
    customDescription?: string,
  ): Promise<{ pointsAwarded: number; newBalance: number }> {
    const pointsToAward = POINTS_CONFIG[action] || 0;

    if (pointsToAward === 0) {
      throw new BadRequestException(`Unknown action: ${action}`);
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // Get or create artisan level
        let artisanLevel = await tx.artisanLevel.findUnique({
          where: { userId },
        });

        if (!artisanLevel) {
          artisanLevel = await tx.artisanLevel.create({
            data: {
              userId,
              loyaltyPoints: 0,
              lifetimePoints: 0,
            },
          });
        }

        const newBalance = artisanLevel.loyaltyPoints + pointsToAward;

        // Update points
        const updated = await tx.artisanLevel.update({
          where: { userId },
          data: {
            loyaltyPoints: newBalance,
            lifetimePoints: { increment: pointsToAward },
          },
        });

        // Record transaction
        await tx.loyaltyTransaction.create({
          data: {
            userId,
            action,
            points: pointsToAward,
            balance: newBalance,
            reference,
            description: customDescription || this.getActionDescription(action, pointsToAward),
          },
        });

        return { pointsAwarded: pointsToAward, newBalance: updated.loyaltyPoints };
      });

      this.logger.log(`Awarded ${result.pointsAwarded} points to user ${userId} for ${action}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to award points: ${error.message}`);
      throw new BadRequestException('Failed to award points');
    }
  }

  /**
   * Award points for job completion (handles review rating bonus)
   */
  async awardJobCompletionPoints(
    userId: string,
    jobId: string,
    rating?: number,
    isRepeatClient?: boolean,
    completedEarly?: boolean,
  ): Promise<{ totalPointsAwarded: number; breakdown: { action: string; points: number }[] }> {
    const breakdown: { action: string; points: number }[] = [];
    let totalPoints = 0;

    try {
      await this.prisma.$transaction(async (tx) => {
        let artisanLevel = await tx.artisanLevel.findUnique({
          where: { userId },
        });

        if (!artisanLevel) {
          artisanLevel = await tx.artisanLevel.create({
            data: { userId, loyaltyPoints: 0, lifetimePoints: 0 },
          });
        }

        // Base completion points
        const basePoints = POINTS_CONFIG.JOB_COMPLETED;
        totalPoints += basePoints;
        breakdown.push({ action: 'JOB_COMPLETED', points: basePoints });

        // Rating bonus
        if (rating === 5) {
          totalPoints += POINTS_CONFIG.FIVE_STAR_REVIEW;
          breakdown.push({ action: 'FIVE_STAR_REVIEW', points: POINTS_CONFIG.FIVE_STAR_REVIEW });
        } else if (rating === 4) {
          totalPoints += POINTS_CONFIG.FOUR_STAR_REVIEW;
          breakdown.push({ action: 'FOUR_STAR_REVIEW', points: POINTS_CONFIG.FOUR_STAR_REVIEW });
        }

        // Repeat client bonus
        if (isRepeatClient) {
          totalPoints += POINTS_CONFIG.REPEAT_CLIENT;
          breakdown.push({ action: 'REPEAT_CLIENT', points: POINTS_CONFIG.REPEAT_CLIENT });
        }

        // Early completion bonus
        if (completedEarly) {
          totalPoints += POINTS_CONFIG.EARLY_COMPLETION;
          breakdown.push({ action: 'EARLY_COMPLETION', points: POINTS_CONFIG.EARLY_COMPLETION });
        }

        const newBalance = artisanLevel.loyaltyPoints + totalPoints;

        // Update artisan level
        await tx.artisanLevel.update({
          where: { userId },
          data: {
            loyaltyPoints: newBalance,
            lifetimePoints: { increment: totalPoints },
          },
        });

        // Record individual transactions
        for (const item of breakdown) {
          await tx.loyaltyTransaction.create({
            data: {
              userId,
              action: item.action as LoyaltyActionType,
              points: item.points,
              balance: newBalance, // Final balance after all awards
              reference: jobId,
              description: this.getActionDescription(item.action as LoyaltyActionType, item.points),
            },
          });
        }
      });

      this.logger.log(`Awarded ${totalPoints} total points to user ${userId} for job completion`);
      return { totalPointsAwarded: totalPoints, breakdown };
    } catch (error) {
      this.logger.error(`Failed to award job completion points: ${error.message}`);
      throw new BadRequestException('Failed to award job completion points');
    }
  }

  /**
   * Get available rewards
   */
  async getAvailableRewards(): Promise<LoyaltyRewardInfo[]> {
    try {
      const rewards = await this.prisma.loyaltyReward.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });

      return rewards.map((reward) => ({
        id: reward.id,
        name: reward.name,
        description: reward.description ?? undefined,
        pointsCost: reward.pointsCost,
        rewardType: reward.rewardType,
        rewardValue: reward.rewardValue as Record<string, unknown>,
        isActive: reward.isActive,
        stockCount: reward.stockCount ?? undefined,
        imageUrl: reward.imageUrl ?? undefined,
      }));
    } catch (error) {
      this.logger.error(`Failed to get available rewards: ${error.message}`);
      throw new BadRequestException('Failed to get available rewards');
    }
  }

  /**
   * Redeem a reward
   */
  async redeemReward(
    userId: string,
    rewardId: string,
  ): Promise<{ success: boolean; reward: LoyaltyRewardInfo; newBalance: number }> {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const reward = await tx.loyaltyReward.findUnique({
          where: { id: rewardId },
        });

        if (!reward || !reward.isActive) {
          throw new NotFoundException('Reward not found or inactive');
        }

        if (reward.stockCount !== null && reward.stockCount <= 0) {
          throw new BadRequestException('Reward is out of stock');
        }

        const artisanLevel = await tx.artisanLevel.findUnique({
          where: { userId },
        });

        if (!artisanLevel) {
          throw new NotFoundException('Artisan level not found');
        }

        if (artisanLevel.loyaltyPoints < reward.pointsCost) {
          throw new BadRequestException(
            `Insufficient points. You need ${reward.pointsCost} points but have ${artisanLevel.loyaltyPoints}.`,
          );
        }

        // Check max per user limit if applicable
        if (reward.maxPerUser) {
          const previousRedemptions = await tx.loyaltyTransaction.count({
            where: {
              userId,
              action: { in: ['REDEEM_CREDITS', 'REDEEM_FEATURE', 'REDEEM_FEE_DISCOUNT', 'REDEEM_MERCHANDISE', 'REDEEM_TOOL_VOUCHER'] },
              reference: rewardId,
            },
          });

          if (previousRedemptions >= reward.maxPerUser) {
            throw new BadRequestException('Maximum redemptions reached for this reward');
          }
        }

        const newBalance = artisanLevel.loyaltyPoints - reward.pointsCost;

        // Deduct points
        await tx.artisanLevel.update({
          where: { userId },
          data: {
            loyaltyPoints: newBalance,
          },
        });

        // Reduce stock if applicable
        if (reward.stockCount !== null) {
          await tx.loyaltyReward.update({
            where: { id: rewardId },
            data: {
              stockCount: { decrement: 1 },
            },
          });
        }

        // Determine transaction type
        let actionType: LoyaltyActionType;
        switch (reward.rewardType) {
          case 'CREDITS':
            actionType = LoyaltyActionType.REDEEM_CREDITS;
            break;
          case 'FEATURE':
            actionType = LoyaltyActionType.REDEEM_FEATURE;
            break;
          case 'FEE_DISCOUNT':
            actionType = LoyaltyActionType.REDEEM_FEE_DISCOUNT;
            break;
          case 'MERCHANDISE':
            actionType = LoyaltyActionType.REDEEM_MERCHANDISE;
            break;
          case 'TOOL_VOUCHER':
            actionType = LoyaltyActionType.REDEEM_TOOL_VOUCHER;
            break;
          default:
            actionType = LoyaltyActionType.REDEEM_CREDITS;
        }

        // Record transaction
        await tx.loyaltyTransaction.create({
          data: {
            userId,
            action: actionType,
            points: -reward.pointsCost,
            balance: newBalance,
            reference: rewardId,
            description: `Redeemed: ${reward.name}`,
            metadata: { rewardType: reward.rewardType, rewardValue: reward.rewardValue },
          },
        });

        return { reward, newBalance };
      });

      // Process reward fulfillment
      await this.fulfillReward(userId, result.reward);

      this.logger.log(`User ${userId} redeemed reward: ${result.reward.name}`);

      return {
        success: true,
        reward: {
          id: result.reward.id,
          name: result.reward.name,
          description: result.reward.description ?? undefined,
          pointsCost: result.reward.pointsCost,
          rewardType: result.reward.rewardType,
          rewardValue: result.reward.rewardValue as Record<string, unknown>,
          isActive: result.reward.isActive,
          stockCount: result.reward.stockCount ?? undefined,
          imageUrl: result.reward.imageUrl ?? undefined,
        },
        newBalance: result.newBalance,
      };
    } catch (error) {
      this.logger.error(`Failed to redeem reward: ${error.message}`);
      throw new BadRequestException(error.message || 'Failed to redeem reward');
    }
  }

  /**
   * Fulfill reward based on type
   */
  private async fulfillReward(userId: string, reward: { rewardType: string; rewardValue: unknown }): Promise<void> {
    const rewardValue = reward.rewardValue as Record<string, unknown>;

    switch (reward.rewardType) {
      case 'CREDITS':
        // Award Taska credits
        const credits = rewardValue.credits as number;
        await this.creditService.awardBonusCredits(
          userId,
          credits,
          `Loyalty reward redemption`,
        );
        break;

      case 'FEATURE':
        // TODO: Implement profile featuring
        this.logger.log(`Feature reward to be implemented for user ${userId}`);
        break;

      case 'FEE_DISCOUNT':
        // TODO: Implement fee discount
        this.logger.log(`Fee discount reward to be implemented for user ${userId}`);
        break;

      case 'MERCHANDISE':
      case 'TOOL_VOUCHER':
        // These require manual fulfillment - create notification
        await this.prisma.notification.create({
          data: {
            userId,
            type: 'SYSTEM_ANNOUNCEMENT',
            title: 'Reward Redeemed!',
            message: `Your reward has been submitted for fulfillment. We'll contact you soon with delivery details.`,
            data: JSON.parse(JSON.stringify({ rewardType: reward.rewardType, rewardValue: reward.rewardValue })),
          },
        });
        break;
    }
  }

  /**
   * Get loyalty transaction history
   */
  async getLoyaltyTransactions(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    transactions: LoyaltyTransactionInfo[];
    totalCount: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      const [transactions, totalCount] = await Promise.all([
        this.prisma.loyaltyTransaction.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.loyaltyTransaction.count({ where: { userId } }),
      ]);

      return {
        transactions: transactions.map((tx) => ({
          id: tx.id,
          action: tx.action,
          points: tx.points,
          balance: tx.balance,
          reference: tx.reference ?? undefined,
          description: tx.description,
          createdAt: tx.createdAt,
        })),
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      };
    } catch (error) {
      this.logger.error(`Failed to get loyalty transactions: ${error.message}`);
      throw new BadRequestException('Failed to get loyalty transactions');
    }
  }

  /**
   * Award referral points
   */
  async awardReferralPoints(
    referrerId: string,
    referralType: 'ARTISAN' | 'CLIENT',
    referredUserId: string,
  ): Promise<{ pointsAwarded: number; newBalance: number }> {
    const action = referralType === 'ARTISAN'
      ? LoyaltyActionType.REFERRAL_ARTISAN
      : LoyaltyActionType.REFERRAL_CLIENT;

    return this.awardPoints(
      referrerId,
      action,
      referredUserId,
      `Referral bonus: New ${referralType.toLowerCase()} joined`,
    );
  }

  /**
   * Check and award monthly top performer bonus
   */
  async checkAndAwardTopPerformerBonus(categoryId: string): Promise<void> {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // Get top 10 artisans by completed jobs this month
      const topArtisans = await this.prisma.artisanLevel.findMany({
        where: {
          totalJobsThisMonth: { gt: 0 },
          user: {
            specializations: {
              some: { categoryId },
            },
          },
        },
        orderBy: [
          { totalJobsThisMonth: 'desc' },
          { averageRating: 'desc' },
        ],
        take: 10,
        select: { userId: true },
      });

      for (const artisan of topArtisans) {
        // Check if already awarded this month
        const existingAward = await this.prisma.loyaltyTransaction.findFirst({
          where: {
            userId: artisan.userId,
            action: LoyaltyActionType.MONTHLY_TOP_PERFORMER,
            createdAt: { gte: startOfMonth },
          },
        });

        if (!existingAward) {
          await this.awardPoints(
            artisan.userId,
            LoyaltyActionType.MONTHLY_TOP_PERFORMER,
            categoryId,
            'Monthly top performer bonus',
          );
        }
      }

      this.logger.log(`Awarded top performer bonuses for category ${categoryId}`);
    } catch (error) {
      this.logger.error(`Failed to award top performer bonuses: ${error.message}`);
    }
  }

  /**
   * Get points value for an action
   */
  getPointsForAction(action: string): number {
    return POINTS_CONFIG[action] || 0;
  }

  /**
   * Get all points configuration
   */
  getPointsConfig(): Record<string, number> {
    return { ...POINTS_CONFIG };
  }

  /**
   * Generate description for an action
   */
  private getActionDescription(action: LoyaltyActionType, points: number): string {
    const descriptions: Record<string, string> = {
      JOB_COMPLETED: `Earned ${points} points for completing a job`,
      FIVE_STAR_REVIEW: `Earned ${points} bonus points for 5-star review`,
      FOUR_STAR_REVIEW: `Earned ${points} bonus points for 4-star review`,
      CLIENT_TIP: `Earned ${points} points from client tip`,
      FAST_RESPONSE: `Earned ${points} points for fast response`,
      EARLY_COMPLETION: `Earned ${points} points for early completion`,
      REPEAT_CLIENT: `Earned ${points} points for repeat client`,
      REFERRAL_ARTISAN: `Earned ${points} points for referring an artisan`,
      REFERRAL_CLIENT: `Earned ${points} points for referring a client`,
      PROFILE_COMPLETE: `Earned ${points} points for completing profile`,
      PORTFOLIO_UPLOAD: `Earned ${points} points for portfolio upload`,
      VERIFICATION_COMPLETE: `Earned ${points} points for completing verification`,
      STREAK_BONUS: `Earned ${points} points streak bonus`,
      MONTHLY_TOP_PERFORMER: `Earned ${points} points as top performer`,
    };

    return descriptions[action] || `${points > 0 ? 'Earned' : 'Spent'} ${Math.abs(points)} points`;
  }
}
