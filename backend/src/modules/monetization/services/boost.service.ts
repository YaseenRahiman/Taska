import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { BoostType } from '@prisma/client';
import { CreditService } from './credit.service';
import { LevelService } from './level.service';

export interface BoostConfig {
  type: BoostType;
  boostPercent: number;
  durationHours: number;
  creditsCost: number;
  description: string;
}

export interface ActiveBoost {
  id: string;
  boostType: BoostType;
  boostPercent: number;
  startedAt: Date;
  expiresAt: Date;
  usedFreeBid: boolean;
  isActive: boolean;
}

@Injectable()
export class BoostService {
  private readonly logger = new Logger(BoostService.name);

  // Boost configurations
  private readonly boostConfigs: Record<BoostType, BoostConfig> = {
    STANDARD: {
      type: 'STANDARD' as BoostType,
      boostPercent: 25,
      durationHours: 24,
      creditsCost: 10,
      description: '25% visibility boost for 24 hours',
    },
    SUPER: {
      type: 'SUPER' as BoostType,
      boostPercent: 50,
      durationHours: 48,
      creditsCost: 25,
      description: '50% visibility boost for 48 hours + featured badge',
    },
    PREMIUM: {
      type: 'PREMIUM' as BoostType,
      boostPercent: 100,
      durationHours: 168, // 7 days
      creditsCost: 50,
      description: '100% visibility boost for 7 days + featured + notifications to clients',
    },
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly creditService: CreditService,
    private readonly levelService: LevelService,
  ) {}

  /**
   * Get available boost configurations
   */
  getBoostConfigs(): BoostConfig[] {
    return Object.values(this.boostConfigs);
  }

  /**
   * Get the currently active boost for a user
   */
  async getActiveBoost(userId: string): Promise<ActiveBoost | null> {
    // Deactivate expired boosts first
    await this.deactivateExpiredBoosts(userId);

    const boost = await this.prisma.profileBoost.findFirst({
      where: {
        userId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      orderBy: { boostPercent: 'desc' }, // Get highest active boost
    });

    if (!boost) return null;

    return {
      id: boost.id,
      boostType: boost.boostType,
      boostPercent: boost.boostPercent,
      startedAt: boost.startedAt,
      expiresAt: boost.expiresAt,
      usedFreeBid: boost.usedFreeBid,
      isActive: boost.isActive,
    };
  }

  /**
   * Get boost percentage for a user (for search ranking)
   */
  async getBoostPercentage(userId: string): Promise<number> {
    const activeBoost = await this.getActiveBoost(userId);

    if (activeBoost) {
      return activeBoost.boostPercent;
    }

    // Check for level-based search boost
    const artisanLevel = await this.prisma.artisanLevel.findUnique({
      where: { userId },
      include: {
        user: true,
      },
    });

    if (artisanLevel) {
      // Get level config for search boost percent
      const levelConfig = await this.prisma.levelConfig.findUnique({
        where: { level: artisanLevel.currentLevel },
      });
      return levelConfig?.searchBoostPercent || 0;
    }

    return 0;
  }

  /**
   * Activate a boost for a user
   */
  async activateBoost(
    userId: string,
    boostType: BoostType,
    useFreeBooost: boolean = true,
  ): Promise<ActiveBoost> {
    const config = this.boostConfigs[boostType];
    if (!config) {
      throw new BadRequestException('Invalid boost type');
    }

    // Check if user already has an active boost of this type or higher
    const existingBoost = await this.getActiveBoost(userId);
    if (existingBoost && existingBoost.boostPercent >= config.boostPercent) {
      throw new BadRequestException(
        `You already have an active ${existingBoost.boostType} boost until ${existingBoost.expiresAt.toISOString()}`,
      );
    }

    let usedFreeBoost = false;
    let creditsSpent = 0;

    // Try to use free boost if requested
    if (useFreeBooost && boostType === 'STANDARD') {
      try {
        const freeBoostResult = await this.levelService.useFreeBoost(userId);
        usedFreeBoost = freeBoostResult.usedFreeBoost;
        if (usedFreeBoost) {
          this.logger.log(`User ${userId} used a free boost (${freeBoostResult.remaining} remaining)`);
        }
      } catch (error) {
        // No free boosts available
        this.logger.log(`No free boosts available for user ${userId}, will use credits`);
      }
    }

    // If no free boost was used, deduct credits
    if (!usedFreeBoost) {
      const creditAction = boostType === 'SUPER' ? 'SUPER_BOOST' : 'BOOST';
      try {
        await this.creditService.spendCredits(userId, creditAction, `boost_${Date.now()}`);
        creditsSpent = config.creditsCost;
        this.logger.log(`User ${userId} spent ${creditsSpent} credits for ${boostType} boost`);
      } catch (error) {
        throw new BadRequestException(
          `Insufficient credits for ${boostType} boost. Required: ${config.creditsCost} credits.`,
        );
      }
    }

    // Calculate expiration
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + config.durationHours);

    // Deactivate any existing active boosts
    await this.prisma.profileBoost.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    // Create new boost
    const boost = await this.prisma.profileBoost.create({
      data: {
        userId,
        boostType,
        boostPercent: config.boostPercent,
        expiresAt,
        usedFreeBid: usedFreeBoost,
        creditsSpent,
        isActive: true,
      },
    });

    // Create notification (using SYSTEM_ANNOUNCEMENT for boost notifications)
    await this.prisma.notification.create({
      data: {
        userId,
        type: 'SYSTEM_ANNOUNCEMENT',
        title: 'Profile Boost Activated',
        message: `Your ${boostType} boost is now active! Your profile visibility is increased by ${config.boostPercent}% for the next ${config.durationHours} hours.`,
        data: {
          boostId: boost.id,
          boostType,
          boostPercent: config.boostPercent,
          expiresAt: expiresAt.toISOString(),
          notificationType: 'BOOST_ACTIVATED',
        },
      },
    });

    this.logger.log(`Activated ${boostType} boost for user ${userId} until ${expiresAt.toISOString()}`);

    return {
      id: boost.id,
      boostType: boost.boostType,
      boostPercent: boost.boostPercent,
      startedAt: boost.startedAt,
      expiresAt: boost.expiresAt,
      usedFreeBid: boost.usedFreeBid,
      isActive: boost.isActive,
    };
  }

  /**
   * Deactivate expired boosts
   */
  private async deactivateExpiredBoosts(userId: string): Promise<void> {
    await this.prisma.profileBoost.updateMany({
      where: {
        userId,
        isActive: true,
        expiresAt: { lte: new Date() },
      },
      data: { isActive: false },
    });
  }

  /**
   * Get boost history for a user
   */
  async getBoostHistory(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ boosts: ActiveBoost[]; total: number }> {
    const skip = (page - 1) * limit;

    const [boosts, total] = await Promise.all([
      this.prisma.profileBoost.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.profileBoost.count({ where: { userId } }),
    ]);

    return {
      boosts: boosts.map((b) => ({
        id: b.id,
        boostType: b.boostType,
        boostPercent: b.boostPercent,
        startedAt: b.startedAt,
        expiresAt: b.expiresAt,
        usedFreeBid: b.usedFreeBid,
        isActive: b.isActive,
      })),
      total,
    };
  }

  /**
   * Check if user has featured badge (SUPER or PREMIUM boost)
   */
  async hasFeaturedBadge(userId: string): Promise<boolean> {
    const boost = await this.getActiveBoost(userId);
    return boost !== null && (boost.boostType === 'SUPER' || boost.boostType === 'PREMIUM');
  }

  /**
   * Get all users with active boosts (for batch operations)
   */
  async getUsersWithActiveBoosts(): Promise<string[]> {
    const boosts = await this.prisma.profileBoost.findMany({
      where: {
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      select: { userId: true },
      distinct: ['userId'],
    });

    return boosts.map((b) => b.userId);
  }
}
