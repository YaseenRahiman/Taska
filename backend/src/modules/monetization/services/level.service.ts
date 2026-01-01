import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ArtisanLevelTier, LevelWarningStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface ArtisanLevelInfo {
  userId: string;
  currentLevel: ArtisanLevelTier;
  displayName: string;
  currentFeePercent: number;
  nextLevel?: ArtisanLevelTier;
  progressToNextLevel: number; // 0-100%
  stats: {
    totalJobsCompleted: number;
    averageRating: number;
    responseRate: number;
    completionRate: number;
    repeatClientCount: number;
    memberSince: Date;
  };
  benefits: {
    freeBidsRemaining: number;
    freeBoostsRemaining: number;
    searchBoostPercent: number;
    payoutDays: number;
  };
  verification: {
    isIdentityVerified: boolean;
    isSkillsVerified: boolean;
  };
  warning?: {
    status: LevelWarningStatus;
    expiresAt?: Date;
  };
}

export interface LevelRequirements {
  level: ArtisanLevelTier;
  displayName: string;
  feePercent: number;
  minJobsRequired: number;
  minRatingRequired: number;
  minMonthsActive: number;
  freeBidsPerMonth: number;
  freeBoostsPerMonth: number;
  searchBoostPercent: number;
  payoutDays: number;
  requiresVerification: boolean;
  requiresSkillsAssessment: boolean;
}

// Level display names with emojis
const LEVEL_DISPLAY_NAMES: Record<ArtisanLevelTier, string> = {
  STARTER: 'Starter 🌱',
  RISING: 'Rising ⭐',
  EXPERT: 'Expert 🥈',
  MASTER: 'Master 🥇',
  LEGEND: 'Legend 👑',
};

// Level order for progression
const LEVEL_ORDER: ArtisanLevelTier[] = [
  ArtisanLevelTier.STARTER,
  ArtisanLevelTier.RISING,
  ArtisanLevelTier.EXPERT,
  ArtisanLevelTier.MASTER,
  ArtisanLevelTier.LEGEND,
];

@Injectable()
export class LevelService {
  private readonly logger = new Logger(LevelService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get artisan level info with all details
   */
  async getArtisanLevel(userId: string): Promise<ArtisanLevelInfo | null> {
    try {
      const artisanLevel = await this.prisma.artisanLevel.findUnique({
        where: { userId },
      });

      if (!artisanLevel) return null;

      const levelConfig = await this.getLevelConfig(artisanLevel.currentLevel);
      const nextLevel = this.getNextLevel(artisanLevel.currentLevel);
      const progressToNextLevel = await this.calculateProgressToNextLevel(userId, artisanLevel);

      return {
        userId: artisanLevel.userId,
        currentLevel: artisanLevel.currentLevel,
        displayName: LEVEL_DISPLAY_NAMES[artisanLevel.currentLevel],
        currentFeePercent: parseFloat(artisanLevel.currentFeePercent.toString()),
        nextLevel,
        progressToNextLevel,
        stats: {
          totalJobsCompleted: artisanLevel.totalJobsCompleted,
          averageRating: parseFloat(artisanLevel.averageRating.toString()),
          responseRate: parseFloat(artisanLevel.responseRate.toString()),
          completionRate: parseFloat(artisanLevel.completionRate.toString()),
          repeatClientCount: artisanLevel.repeatClientCount,
          memberSince: artisanLevel.memberSince,
        },
        benefits: {
          freeBidsRemaining: artisanLevel.freeBidsRemaining,
          freeBoostsRemaining: artisanLevel.freeBoostsRemaining,
          searchBoostPercent: levelConfig?.searchBoostPercent ?? 0,
          payoutDays: levelConfig?.payoutDays ?? 3,
        },
        verification: {
          isIdentityVerified: artisanLevel.isIdentityVerified,
          isSkillsVerified: artisanLevel.isSkillsVerified,
        },
        ...(artisanLevel.warningStatus && {
          warning: {
            status: artisanLevel.warningStatus,
            expiresAt: artisanLevel.warningExpiresAt ?? undefined,
          },
        }),
      };
    } catch (error) {
      this.logger.error(`Failed to get artisan level: ${error.message}`);
      throw new BadRequestException('Failed to get artisan level');
    }
  }

  /**
   * Get or create artisan level for new artisan
   */
  async getOrCreateArtisanLevel(userId: string): Promise<ArtisanLevelInfo> {
    try {
      let artisanLevel = await this.prisma.artisanLevel.findUnique({
        where: { userId },
      });

      if (!artisanLevel) {
        const starterConfig = await this.getLevelConfig(ArtisanLevelTier.STARTER);

        artisanLevel = await this.prisma.artisanLevel.create({
          data: {
            userId,
            currentLevel: ArtisanLevelTier.STARTER,
            currentFeePercent: new Decimal('12.00'),
            freeBidsRemaining: starterConfig?.freeBidsPerMonth ?? 10,
            freeBoostsRemaining: starterConfig?.freeBoostsPerMonth ?? 0,
            allocationResetAt: new Date(),
          },
        });

        this.logger.log(`Created artisan level for user ${userId}`);
      }

      return (await this.getArtisanLevel(userId))!;
    } catch (error) {
      this.logger.error(`Failed to get/create artisan level: ${error.message}`);
      throw new BadRequestException('Failed to access artisan level');
    }
  }

  /**
   * Calculate platform fee for an artisan
   */
  async calculatePlatformFee(userId: string, jobAmount: number): Promise<{ feePercent: number; feeAmount: number; level: string }> {
    const artisanLevel = await this.prisma.artisanLevel.findUnique({
      where: { userId },
      select: { currentLevel: true, currentFeePercent: true },
    });

    const feePercent = artisanLevel
      ? parseFloat(artisanLevel.currentFeePercent.toString())
      : 12; // Default starter fee

    const level = artisanLevel?.currentLevel || 'STARTER';
    const feeAmount = (jobAmount * feePercent) / 100;

    return { feePercent, feeAmount, level };
  }

  /**
   * Update artisan stats after job completion
   */
  async updateStatsAfterJobCompletion(
    userId: string,
    jobId: string,
    rating?: number,
    isRepeatClient?: boolean,
  ): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        const artisanLevel = await tx.artisanLevel.findUnique({
          where: { userId },
        });

        if (!artisanLevel) {
          throw new NotFoundException('Artisan level not found');
        }

        // Calculate new average rating
        let newAverageRating = parseFloat(artisanLevel.averageRating.toString());
        let newTotalRatings = artisanLevel.totalRatings;

        if (rating) {
          const totalRatingSum = newAverageRating * newTotalRatings + rating;
          newTotalRatings += 1;
          newAverageRating = totalRatingSum / newTotalRatings;
        }

        // Update stats
        await tx.artisanLevel.update({
          where: { userId },
          data: {
            totalJobsCompleted: { increment: 1 },
            totalJobsThisMonth: { increment: 1 },
            averageRating: new Decimal(newAverageRating.toFixed(2)),
            totalRatings: newTotalRatings,
            repeatClientCount: isRepeatClient
              ? { increment: 1 }
              : artisanLevel.repeatClientCount,
          },
        });

        // Check for level up
        await this.checkAndProcessLevelChange(userId, tx);
      });

      this.logger.log(`Updated stats for artisan ${userId} after job completion`);
    } catch (error) {
      this.logger.error(`Failed to update stats: ${error.message}`);
      throw new BadRequestException('Failed to update artisan stats');
    }
  }

  /**
   * Check if artisan qualifies for level up/down
   */
  async checkAndProcessLevelChange(userId: string, tx?: any): Promise<boolean> {
    const prisma = tx || this.prisma;

    try {
      const artisanLevel = await prisma.artisanLevel.findUnique({
        where: { userId },
      });

      if (!artisanLevel) return false;

      const allConfigs = await prisma.levelConfig.findMany({
        orderBy: { minJobsRequired: 'desc' },
      });

      // Calculate months active
      const monthsActive = Math.floor(
        (Date.now() - artisanLevel.memberSince.getTime()) / (30 * 24 * 60 * 60 * 1000),
      );

      // Find highest qualifying level
      let qualifyingLevel: ArtisanLevelTier = ArtisanLevelTier.STARTER;

      for (const config of allConfigs) {
        const meetsJobs = artisanLevel.totalJobsCompleted >= config.minJobsRequired;
        const meetsRating = parseFloat(artisanLevel.averageRating.toString()) >= parseFloat(config.minRatingRequired.toString());
        const meetsMonths = monthsActive >= config.minMonthsActive;
        const meetsVerification = !config.requiresVerification || artisanLevel.isIdentityVerified;
        const meetsSkills = !config.requiresSkillsAssessment || artisanLevel.isSkillsVerified;

        if (meetsJobs && meetsRating && meetsMonths && meetsVerification && meetsSkills) {
          qualifyingLevel = config.level;
          break;
        }
      }

      // Check if level changed
      if (qualifyingLevel !== artisanLevel.currentLevel) {
        const isPromotion = LEVEL_ORDER.indexOf(qualifyingLevel) > LEVEL_ORDER.indexOf(artisanLevel.currentLevel);
        const newConfig = allConfigs.find((c) => c.level === qualifyingLevel);

        if (!newConfig) return false;

        // Update level
        await prisma.artisanLevel.update({
          where: { userId },
          data: {
            currentLevel: qualifyingLevel,
            currentFeePercent: newConfig.feePercent,
            levelAchievedAt: new Date(),
            freeBidsRemaining: newConfig.freeBidsPerMonth,
            freeBoostsRemaining: newConfig.freeBoostsPerMonth,
            warningStatus: null, // Clear warnings on level change
            warningIssuedAt: null,
            warningExpiresAt: null,
          },
        });

        // Record level change history
        await prisma.levelHistory.create({
          data: {
            artisanLevelId: artisanLevel.id,
            fromLevel: artisanLevel.currentLevel,
            toLevel: qualifyingLevel,
            reason: isPromotion ? 'PROMOTION' : 'DEMOTION',
            triggeredBy: 'SYSTEM',
            metadata: {
              totalJobsCompleted: artisanLevel.totalJobsCompleted,
              averageRating: parseFloat(artisanLevel.averageRating.toString()),
              monthsActive,
            },
          },
        });

        // Create notification
        await prisma.notification.create({
          data: {
            userId,
            type: 'SYSTEM_ANNOUNCEMENT',
            title: isPromotion ? '🎉 Level Up!' : 'Level Update',
            message: isPromotion
              ? `Congratulations! You've been promoted to ${LEVEL_DISPLAY_NAMES[qualifyingLevel]}! Your platform fee is now ${newConfig.feePercent}%.`
              : `Your level has changed to ${LEVEL_DISPLAY_NAMES[qualifyingLevel]}. Keep working to level up!`,
            data: {
              fromLevel: artisanLevel.currentLevel,
              toLevel: qualifyingLevel,
              newFeePercent: parseFloat(newConfig.feePercent.toString()),
            },
          },
        });

        this.logger.log(`Artisan ${userId} ${isPromotion ? 'promoted' : 'demoted'} to ${qualifyingLevel}`);
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error(`Failed to process level change: ${error.message}`);
      return false;
    }
  }

  /**
   * Use a free bid (returns true if free bid available)
   */
  async useFreeBid(userId: string): Promise<{ usedFreeBid: boolean; remaining: number }> {
    try {
      const artisanLevel = await this.prisma.artisanLevel.findUnique({
        where: { userId },
        select: { freeBidsRemaining: true, allocationResetAt: true },
      });

      if (!artisanLevel) {
        return { usedFreeBid: false, remaining: 0 };
      }

      // Check if we need to reset monthly allocation
      const now = new Date();
      const resetDate = new Date(artisanLevel.allocationResetAt);
      if (now.getMonth() !== resetDate.getMonth() || now.getFullYear() !== resetDate.getFullYear()) {
        await this.resetMonthlyAllocations(userId);
        const updatedLevel = await this.prisma.artisanLevel.findUnique({
          where: { userId },
          select: { freeBidsRemaining: true },
        });
        return { usedFreeBid: true, remaining: (updatedLevel?.freeBidsRemaining ?? 0) - 1 };
      }

      if (artisanLevel.freeBidsRemaining <= 0) {
        return { usedFreeBid: false, remaining: 0 };
      }

      const updated = await this.prisma.artisanLevel.update({
        where: { userId },
        data: {
          freeBidsRemaining: { decrement: 1 },
        },
        select: { freeBidsRemaining: true },
      });

      return { usedFreeBid: true, remaining: updated.freeBidsRemaining };
    } catch (error) {
      this.logger.error(`Failed to use free bid: ${error.message}`);
      return { usedFreeBid: false, remaining: 0 };
    }
  }

  /**
   * Use a free boost (returns true if free boost available)
   */
  async useFreeBoost(userId: string): Promise<{ usedFreeBoost: boolean; remaining: number }> {
    try {
      const artisanLevel = await this.prisma.artisanLevel.findUnique({
        where: { userId },
        select: { freeBoostsRemaining: true },
      });

      if (!artisanLevel || artisanLevel.freeBoostsRemaining <= 0) {
        return { usedFreeBoost: false, remaining: 0 };
      }

      const updated = await this.prisma.artisanLevel.update({
        where: { userId },
        data: {
          freeBoostsRemaining: { decrement: 1 },
        },
        select: { freeBoostsRemaining: true },
      });

      return { usedFreeBoost: true, remaining: updated.freeBoostsRemaining };
    } catch (error) {
      this.logger.error(`Failed to use free boost: ${error.message}`);
      return { usedFreeBoost: false, remaining: 0 };
    }
  }

  /**
   * Reset monthly allocations for all artisans (called by cron job)
   */
  async resetMonthlyAllocations(userId?: string): Promise<void> {
    try {
      const where = userId ? { userId } : {};

      const artisans = await this.prisma.artisanLevel.findMany({
        where,
        include: { user: true },
      });

      for (const artisan of artisans) {
        const config = await this.getLevelConfig(artisan.currentLevel);

        await this.prisma.artisanLevel.update({
          where: { id: artisan.id },
          data: {
            freeBidsRemaining: config?.freeBidsPerMonth ?? 10,
            freeBoostsRemaining: config?.freeBoostsPerMonth ?? 0,
            totalJobsThisMonth: 0,
            allocationResetAt: new Date(),
          },
        });
      }

      this.logger.log(`Reset monthly allocations for ${artisans.length} artisans`);
    } catch (error) {
      this.logger.error(`Failed to reset monthly allocations: ${error.message}`);
    }
  }

  /**
   * Issue a warning to artisan
   */
  async issueWarning(
    userId: string,
    warningStatus: LevelWarningStatus,
    expiresInDays: number = 30,
  ): Promise<void> {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      await this.prisma.artisanLevel.update({
        where: { userId },
        data: {
          warningStatus,
          warningIssuedAt: new Date(),
          warningExpiresAt: expiresAt,
        },
      });

      // Send notification
      await this.prisma.notification.create({
        data: {
          userId,
          type: 'SYSTEM_ANNOUNCEMENT',
          title: '⚠️ Level Warning',
          message: this.getWarningMessage(warningStatus, expiresInDays),
          data: { warningStatus, expiresAt },
        },
      });

      this.logger.log(`Issued ${warningStatus} warning to artisan ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to issue warning: ${error.message}`);
    }
  }

  /**
   * Clear expired warnings
   */
  async clearExpiredWarnings(): Promise<void> {
    try {
      await this.prisma.artisanLevel.updateMany({
        where: {
          warningExpiresAt: { lt: new Date() },
          warningStatus: { not: null },
        },
        data: {
          warningStatus: null,
          warningIssuedAt: null,
          warningExpiresAt: null,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to clear expired warnings: ${error.message}`);
    }
  }

  /**
   * Request verification (identity or skills)
   */
  async markVerificationPaid(userId: string, type: 'identity' | 'skills'): Promise<void> {
    const data = type === 'identity'
      ? { verificationPaidAt: new Date() }
      : { skillsAssessedAt: new Date() };

    await this.prisma.artisanLevel.update({
      where: { userId },
      data,
    });
  }

  /**
   * Complete verification
   */
  async completeVerification(userId: string, type: 'identity' | 'skills'): Promise<void> {
    const data = type === 'identity'
      ? { isIdentityVerified: true }
      : { isSkillsVerified: true };

    await this.prisma.artisanLevel.update({
      where: { userId },
      data,
    });

    // Check for level up
    await this.checkAndProcessLevelChange(userId);
  }

  /**
   * Request verification
   */
  async requestVerification(userId: string, type: 'identity' | 'skills'): Promise<{ success: boolean; message: string }> {
    try {
      // Mark verification as requested
      await this.markVerificationPaid(userId, type);

      // Create notification to admin
      await this.prisma.notification.create({
        data: {
          userId,
          type: 'SYSTEM_ANNOUNCEMENT',
          title: 'Verification Requested',
          message: `Your ${type} verification request has been submitted. We'll review it within 2-3 business days.`,
          data: { verificationType: type },
        },
      });

      return { success: true, message: `${type} verification requested successfully` };
    } catch (error) {
      this.logger.error(`Failed to request verification: ${error.message}`);
      throw new BadRequestException('Failed to request verification');
    }
  }

  /**
   * Get all level configs
   */
  async getLevelConfigs(): Promise<LevelRequirements[]> {
    return this.getAllLevelRequirements();
  }

  /**
   * Get level history for a user
   */
  async getLevelHistory(userId: string): Promise<{
    history: Array<{
      id: string;
      fromLevel: ArtisanLevelTier;
      toLevel: ArtisanLevelTier;
      reason: string;
      createdAt: Date;
    }>;
  }> {
    try {
      const artisanLevel = await this.prisma.artisanLevel.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!artisanLevel) {
        return { history: [] };
      }

      const history = await this.prisma.levelHistory.findMany({
        where: { artisanLevelId: artisanLevel.id },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fromLevel: true,
          toLevel: true,
          reason: true,
          createdAt: true,
        },
      });

      return { history };
    } catch (error) {
      this.logger.error(`Failed to get level history: ${error.message}`);
      throw new BadRequestException('Failed to get level history');
    }
  }

  /**
   * Get all level requirements
   */
  async getAllLevelRequirements(): Promise<LevelRequirements[]> {
    const configs = await this.prisma.levelConfig.findMany({
      orderBy: { minJobsRequired: 'asc' },
    });

    return configs.map((config) => ({
      level: config.level,
      displayName: LEVEL_DISPLAY_NAMES[config.level],
      feePercent: parseFloat(config.feePercent.toString()),
      minJobsRequired: config.minJobsRequired,
      minRatingRequired: parseFloat(config.minRatingRequired.toString()),
      minMonthsActive: config.minMonthsActive,
      freeBidsPerMonth: config.freeBidsPerMonth,
      freeBoostsPerMonth: config.freeBoostsPerMonth,
      searchBoostPercent: config.searchBoostPercent,
      payoutDays: config.payoutDays,
      requiresVerification: config.requiresVerification,
      requiresSkillsAssessment: config.requiresSkillsAssessment,
    }));
  }

  /**
   * Get level configuration
   */
  private async getLevelConfig(level: ArtisanLevelTier) {
    return this.prisma.levelConfig.findUnique({
      where: { level },
    });
  }

  /**
   * Get next level in progression
   */
  private getNextLevel(currentLevel: ArtisanLevelTier): ArtisanLevelTier | undefined {
    const currentIndex = LEVEL_ORDER.indexOf(currentLevel);
    if (currentIndex === -1 || currentIndex >= LEVEL_ORDER.length - 1) {
      return undefined;
    }
    return LEVEL_ORDER[currentIndex + 1];
  }

  /**
   * Calculate progress to next level (0-100)
   */
  private async calculateProgressToNextLevel(
    userId: string,
    artisanLevel: { currentLevel: ArtisanLevelTier; totalJobsCompleted: number; averageRating: Decimal },
  ): Promise<number> {
    const nextLevel = this.getNextLevel(artisanLevel.currentLevel);
    if (!nextLevel) return 100; // Already at max level

    const nextConfig = await this.getLevelConfig(nextLevel);
    if (!nextConfig) return 0;

    // Calculate job progress (weight: 60%)
    const currentConfig = await this.getLevelConfig(artisanLevel.currentLevel);
    const jobsNeeded = nextConfig.minJobsRequired - (currentConfig?.minJobsRequired ?? 0);
    const jobsProgress = currentConfig
      ? (artisanLevel.totalJobsCompleted - currentConfig.minJobsRequired) / jobsNeeded
      : artisanLevel.totalJobsCompleted / nextConfig.minJobsRequired;

    // Calculate rating progress (weight: 40%)
    const currentRating = parseFloat(artisanLevel.averageRating.toString());
    const targetRating = parseFloat(nextConfig.minRatingRequired.toString());
    const ratingProgress = Math.min(currentRating / targetRating, 1);

    // Weighted average
    const totalProgress = (jobsProgress * 0.6 + ratingProgress * 0.4) * 100;

    return Math.min(Math.max(Math.round(totalProgress), 0), 99);
  }

  /**
   * Get warning message
   */
  private getWarningMessage(status: LevelWarningStatus, days: number): string {
    const messages: Record<LevelWarningStatus, string> = {
      RATING_DROP: `Your rating has dropped below the minimum for your level. Maintain a higher rating within ${days} days to avoid demotion.`,
      RESPONSE_LOW: `Your response rate is below 70%. Respond to more client inquiries within ${days} days to maintain your level.`,
      INACTIVE: `You haven't been active recently. Complete jobs within ${days} days to maintain your level.`,
      DISPUTE: `A dispute was resolved against you. Maintain good standing for ${days} days to avoid demotion.`,
      COMPLETION_LOW: `Your job completion rate has dropped. Complete more accepted jobs within ${days} days.`,
    };

    return messages[status];
  }
}
