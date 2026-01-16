import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  UserRole,
  SubscriptionStatus,
  BillingCycle,
  SubscriptionPlan,
  UserSubscription,
  UsageRecord,
} from '@prisma/client';

export interface UsageLimits {
  jobsPerMonth: number;
  bidsPerMonth: number;
  jobsUsed: number;
  bidsUsed: number;
  jobsRemaining: number;
  bidsRemaining: number;
  periodStart: Date;
  periodEnd: Date;
}

export interface SubscriptionWithPlan extends UserSubscription {
  plan: SubscriptionPlan;
}

export interface SubscriptionInfo {
  subscription: SubscriptionWithPlan | null;
  plan: SubscriptionPlan;
  usage: UsageLimits;
  isSubscribed: boolean;
  canUpgrade: boolean;
}

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  // Default limits for users without subscription (free tier)
  private readonly FREE_PLAN_NAME = 'FREE';
  private readonly PREMIUM_PLAN_NAME = 'PREMIUM';

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Initialize default subscription plans if they don't exist
   */
  async initializeDefaultPlans(): Promise<void> {
    const existingPlans = await this.prisma.subscriptionPlan.count();
    if (existingPlans > 0) {
      return;
    }

    this.logger.log('Initializing default subscription plans');

    await this.prisma.subscriptionPlan.createMany({
      data: [
        {
          name: this.FREE_PLAN_NAME,
          displayName: 'Free Plan',
          description: 'Get started with basic features',
          clientJobsPerMonth: 2,
          artisanBidsPerMonth: 5,
          pricePerMonthZar: 0,
          pricePerYearZar: 0,
          isDefault: true,
          sortOrder: 0,
          features: {
            basicSupport: true,
            jobPosting: true,
            bidding: true,
          },
        },
        {
          name: this.PREMIUM_PLAN_NAME,
          displayName: 'Premium Plan',
          description: 'Unlock unlimited potential with premium features',
          clientJobsPerMonth: 50,
          artisanBidsPerMonth: 100,
          pricePerMonthZar: 299,
          pricePerYearZar: 2990,
          isDefault: false,
          sortOrder: 1,
          features: {
            prioritySupport: true,
            jobPosting: true,
            bidding: true,
            analytics: true,
            featuredListing: true,
            priorityMatching: true,
          },
        },
      ],
    });

    this.logger.log('Default subscription plans created');
  }

  /**
   * Get all active subscription plans
   */
  async getPlans(): Promise<SubscriptionPlan[]> {
    return this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Get a specific plan by ID
   */
  async getPlanById(planId: string): Promise<SubscriptionPlan> {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    return plan;
  }

  /**
   * Get the default (free) plan
   */
  async getDefaultPlan(): Promise<SubscriptionPlan> {
    const plan = await this.prisma.subscriptionPlan.findFirst({
      where: { isDefault: true, isActive: true },
    });

    if (!plan) {
      // Fallback to free plan by name
      const freePlan = await this.prisma.subscriptionPlan.findUnique({
        where: { name: this.FREE_PLAN_NAME },
      });

      if (!freePlan) {
        throw new NotFoundException('Default subscription plan not found');
      }

      return freePlan;
    }

    return plan;
  }

  /**
   * Get or create a subscription for a user
   * New users get the free plan automatically
   */
  async getOrCreateSubscription(userId: string): Promise<SubscriptionWithPlan> {
    // Check for existing subscription
    const existing = await this.prisma.userSubscription.findUnique({
      where: { userId },
      include: { plan: true },
    });

    if (existing) {
      // Check if subscription needs renewal (period ended)
      if (existing.currentPeriodEnd < new Date() && existing.status === SubscriptionStatus.ACTIVE) {
        // For free plan, auto-renew
        if (existing.plan.pricePerMonthZar.equals(0)) {
          return this.renewFreePlanPeriod(existing);
        }
        // For paid plans, mark as expired
        await this.prisma.userSubscription.update({
          where: { id: existing.id },
          data: { status: SubscriptionStatus.EXPIRED },
        });
      }
      return existing;
    }

    // Create new subscription with default (free) plan
    const defaultPlan = await this.getDefaultPlan();
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const subscription = await this.prisma.userSubscription.create({
      data: {
        userId,
        planId: defaultPlan.id,
        status: SubscriptionStatus.ACTIVE,
        billingCycle: BillingCycle.MONTHLY,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
      include: { plan: true },
    });

    // Create initial usage record
    await this.getOrCreateUsageRecord(subscription.id, userId);

    this.logger.log(`Created free subscription for user ${userId}`);

    return subscription;
  }

  /**
   * Renew the period for a free plan subscription
   */
  private async renewFreePlanPeriod(subscription: SubscriptionWithPlan): Promise<SubscriptionWithPlan> {
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const renewed = await this.prisma.userSubscription.update({
      where: { id: subscription.id },
      data: {
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        status: SubscriptionStatus.ACTIVE,
      },
      include: { plan: true },
    });

    // Create new usage record for the new period
    await this.getOrCreateUsageRecord(renewed.id, renewed.userId);

    this.logger.log(`Renewed free plan period for user ${subscription.userId}`);

    return renewed;
  }

  /**
   * Get or create usage record for current period
   */
  async getOrCreateUsageRecord(subscriptionId: string, userId: string): Promise<UsageRecord> {
    const subscription = await this.prisma.userSubscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Find existing usage record for current period
    const existing = await this.prisma.usageRecord.findFirst({
      where: {
        subscriptionId,
        periodStart: subscription.currentPeriodStart,
      },
    });

    if (existing) {
      return existing;
    }

    // Create new usage record
    return this.prisma.usageRecord.create({
      data: {
        subscriptionId,
        userId,
        periodStart: subscription.currentPeriodStart,
        periodEnd: subscription.currentPeriodEnd,
        jobsPosted: 0,
        bidsPlaced: 0,
      },
    });
  }

  /**
   * Get current usage limits and stats for a user
   */
  async getUsageLimits(userId: string): Promise<UsageLimits> {
    const subscription = await this.getOrCreateSubscription(userId);
    const usageRecord = await this.getOrCreateUsageRecord(subscription.id, userId);

    const jobsRemaining = Math.max(0, subscription.plan.clientJobsPerMonth - usageRecord.jobsPosted);
    const bidsRemaining = Math.max(0, subscription.plan.artisanBidsPerMonth - usageRecord.bidsPlaced);

    return {
      jobsPerMonth: subscription.plan.clientJobsPerMonth,
      bidsPerMonth: subscription.plan.artisanBidsPerMonth,
      jobsUsed: usageRecord.jobsPosted,
      bidsUsed: usageRecord.bidsPlaced,
      jobsRemaining,
      bidsRemaining,
      periodStart: subscription.currentPeriodStart,
      periodEnd: subscription.currentPeriodEnd,
    };
  }

  /**
   * Get full subscription info for a user
   */
  async getSubscriptionInfo(userId: string): Promise<SubscriptionInfo> {
    const subscription = await this.getOrCreateSubscription(userId);
    const usage = await this.getUsageLimits(userId);

    const premiumPlan = await this.prisma.subscriptionPlan.findUnique({
      where: { name: this.PREMIUM_PLAN_NAME },
    });

    const isSubscribed = subscription.plan.name !== this.FREE_PLAN_NAME;
    const canUpgrade = !isSubscribed && premiumPlan !== null;

    return {
      subscription,
      plan: subscription.plan,
      usage,
      isSubscribed,
      canUpgrade,
    };
  }

  /**
   * Check if a client can post a job
   */
  async canPostJob(userId: string): Promise<{ allowed: boolean; reason?: string; remaining: number }> {
    const usage = await this.getUsageLimits(userId);

    if (usage.jobsRemaining <= 0) {
      return {
        allowed: false,
        reason: `You have reached your monthly limit of ${usage.jobsPerMonth} job postings. Upgrade to Premium for ${50} postings per month.`,
        remaining: 0,
      };
    }

    return {
      allowed: true,
      remaining: usage.jobsRemaining,
    };
  }

  /**
   * Check if an artisan can place a bid
   */
  async canPlaceBid(userId: string): Promise<{ allowed: boolean; reason?: string; remaining: number }> {
    const usage = await this.getUsageLimits(userId);

    if (usage.bidsRemaining <= 0) {
      return {
        allowed: false,
        reason: `You have reached your monthly limit of ${usage.bidsPerMonth} bids. Upgrade to Premium for ${100} bids per month.`,
        remaining: 0,
      };
    }

    return {
      allowed: true,
      remaining: usage.bidsRemaining,
    };
  }

  /**
   * Increment job posting count for a user
   */
  async incrementJobUsage(userId: string): Promise<UsageRecord> {
    const subscription = await this.getOrCreateSubscription(userId);
    const usageRecord = await this.getOrCreateUsageRecord(subscription.id, userId);

    const updated = await this.prisma.usageRecord.update({
      where: { id: usageRecord.id },
      data: {
        jobsPosted: { increment: 1 },
      },
    });

    this.logger.log(`User ${userId} posted a job (${updated.jobsPosted}/${subscription.plan.clientJobsPerMonth})`);

    return updated;
  }

  /**
   * Increment bid count for a user
   */
  async incrementBidUsage(userId: string): Promise<UsageRecord> {
    const subscription = await this.getOrCreateSubscription(userId);
    const usageRecord = await this.getOrCreateUsageRecord(subscription.id, userId);

    const updated = await this.prisma.usageRecord.update({
      where: { id: usageRecord.id },
      data: {
        bidsPlaced: { increment: 1 },
      },
    });

    this.logger.log(`User ${userId} placed a bid (${updated.bidsPlaced}/${subscription.plan.artisanBidsPerMonth})`);

    return updated;
  }

  /**
   * Subscribe a user to a plan
   */
  async subscribe(
    userId: string,
    planId: string,
    billingCycle: BillingCycle = BillingCycle.MONTHLY,
    stripeSubscriptionId?: string,
    stripeCustomerId?: string,
  ): Promise<SubscriptionWithPlan> {
    const plan = await this.getPlanById(planId);

    if (!plan.isActive) {
      throw new BadRequestException('This plan is no longer available');
    }

    // Check if user already has a subscription
    const existing = await this.prisma.userSubscription.findUnique({
      where: { userId },
    });

    const now = new Date();
    const periodEnd = new Date(now);

    if (billingCycle === BillingCycle.YEARLY) {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    let subscription: SubscriptionWithPlan;

    if (existing) {
      // Update existing subscription
      subscription = await this.prisma.userSubscription.update({
        where: { id: existing.id },
        data: {
          planId,
          billingCycle,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          cancelledAt: null,
          cancelAtPeriodEnd: false,
          stripeSubscriptionId,
          stripeCustomerId,
        },
        include: { plan: true },
      });
    } else {
      // Create new subscription
      subscription = await this.prisma.userSubscription.create({
        data: {
          userId,
          planId,
          billingCycle,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          stripeSubscriptionId,
          stripeCustomerId,
        },
        include: { plan: true },
      });
    }

    // Create new usage record for the subscription period
    await this.getOrCreateUsageRecord(subscription.id, userId);

    this.logger.log(`User ${userId} subscribed to ${plan.displayName}`);

    return subscription;
  }

  /**
   * Cancel a user's subscription
   */
  async cancelSubscription(userId: string, cancelAtPeriodEnd: boolean = true): Promise<SubscriptionWithPlan> {
    const subscription = await this.prisma.userSubscription.findUnique({
      where: { userId },
      include: { plan: true },
    });

    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    if (subscription.plan.name === this.FREE_PLAN_NAME) {
      throw new BadRequestException('Cannot cancel a free plan');
    }

    const updated = await this.prisma.userSubscription.update({
      where: { id: subscription.id },
      data: {
        cancelledAt: new Date(),
        cancelAtPeriodEnd,
        status: cancelAtPeriodEnd ? SubscriptionStatus.ACTIVE : SubscriptionStatus.CANCELLED,
      },
      include: { plan: true },
    });

    this.logger.log(`User ${userId} cancelled subscription (cancelAtPeriodEnd: ${cancelAtPeriodEnd})`);

    return updated;
  }

  /**
   * Downgrade a user to the free plan (used when subscription expires)
   */
  async downgradeToFreePlan(userId: string): Promise<SubscriptionWithPlan> {
    const freePlan = await this.getDefaultPlan();

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const subscription = await this.prisma.userSubscription.upsert({
      where: { userId },
      update: {
        planId: freePlan.id,
        status: SubscriptionStatus.ACTIVE,
        billingCycle: BillingCycle.MONTHLY,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelledAt: null,
        cancelAtPeriodEnd: false,
        stripeSubscriptionId: null,
        stripeCustomerId: null,
      },
      create: {
        userId,
        planId: freePlan.id,
        status: SubscriptionStatus.ACTIVE,
        billingCycle: BillingCycle.MONTHLY,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
      include: { plan: true },
    });

    // Create new usage record
    await this.getOrCreateUsageRecord(subscription.id, userId);

    this.logger.log(`User ${userId} downgraded to free plan`);

    return subscription;
  }

  /**
   * Get usage history for a user
   */
  async getUsageHistory(userId: string, limit: number = 12): Promise<UsageRecord[]> {
    return this.prisma.usageRecord.findMany({
      where: { userId },
      orderBy: { periodStart: 'desc' },
      take: limit,
    });
  }

  /**
   * Admin: Update a subscription plan
   */
  async updatePlan(
    planId: string,
    data: Partial<{
      displayName: string;
      description: string;
      clientJobsPerMonth: number;
      artisanBidsPerMonth: number;
      pricePerMonthZar: number;
      pricePerYearZar: number;
      features: object;
      isActive: boolean;
      sortOrder: number;
    }>,
  ): Promise<SubscriptionPlan> {
    // Filter out undefined values and cast features appropriately
    const updateData: Record<string, unknown> = {};

    if (data.displayName !== undefined) updateData.displayName = data.displayName;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.clientJobsPerMonth !== undefined) updateData.clientJobsPerMonth = data.clientJobsPerMonth;
    if (data.artisanBidsPerMonth !== undefined) updateData.artisanBidsPerMonth = data.artisanBidsPerMonth;
    if (data.pricePerMonthZar !== undefined) updateData.pricePerMonthZar = data.pricePerMonthZar;
    if (data.pricePerYearZar !== undefined) updateData.pricePerYearZar = data.pricePerYearZar;
    if (data.features !== undefined) updateData.features = data.features;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

    return this.prisma.subscriptionPlan.update({
      where: { id: planId },
      data: updateData,
    });
  }

  /**
   * Admin: Get subscription statistics
   */
  async getSubscriptionStats(): Promise<{
    totalSubscribers: number;
    activeSubscriptions: number;
    freeUsers: number;
    premiumUsers: number;
    monthlyRevenue: number;
    yearlyRevenue: number;
    churnRate: number;
    planBreakdown: {
      planId: string;
      planName: string;
      count: number;
      percentage: number;
    }[];
    usageStats: {
      totalJobsPosted: number;
      totalBidsPlaced: number;
      avgJobsPerUser: number;
      avgBidsPerUser: number;
    };
  }> {
    // Get subscription counts
    const [total, active, premium, free, cancelled] = await Promise.all([
      this.prisma.userSubscription.count(),
      this.prisma.userSubscription.count({
        where: { status: SubscriptionStatus.ACTIVE },
      }),
      this.prisma.userSubscription.count({
        where: {
          status: SubscriptionStatus.ACTIVE,
          plan: { name: this.PREMIUM_PLAN_NAME },
        },
      }),
      this.prisma.userSubscription.count({
        where: {
          status: SubscriptionStatus.ACTIVE,
          plan: { name: this.FREE_PLAN_NAME },
        },
      }),
      this.prisma.userSubscription.count({
        where: { status: SubscriptionStatus.CANCELLED },
      }),
    ]);

    // Get plan breakdown
    const plans = await this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    const planBreakdown = await Promise.all(
      plans.map(async (plan) => {
        const count = await this.prisma.userSubscription.count({
          where: {
            planId: plan.id,
            status: SubscriptionStatus.ACTIVE,
          },
        });
        return {
          planId: plan.id,
          planName: plan.displayName,
          count,
          percentage: total > 0 ? (count / total) * 100 : 0,
        };
      }),
    );

    // Get usage stats for current month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const usageAggregation = await this.prisma.usageRecord.aggregate({
      where: {
        periodStart: { gte: monthStart },
        periodEnd: { lte: monthEnd },
      },
      _sum: {
        jobsPosted: true,
        bidsPlaced: true,
      },
      _count: true,
    });

    const totalJobsPosted = usageAggregation._sum.jobsPosted || 0;
    const totalBidsPlaced = usageAggregation._sum.bidsPlaced || 0;
    const usageRecordCount = usageAggregation._count || 1;

    // Calculate revenue
    const premiumPlan = await this.prisma.subscriptionPlan.findUnique({
      where: { name: this.PREMIUM_PLAN_NAME },
    });

    const monthlyRevenue = premiumPlan
      ? premium * Number(premiumPlan.pricePerMonthZar)
      : 0;
    const yearlyRevenue = monthlyRevenue * 12;

    // Calculate churn rate (cancelled / total * 100)
    const churnRate = total > 0 ? (cancelled / total) * 100 : 0;

    return {
      totalSubscribers: total,
      activeSubscriptions: active,
      freeUsers: free,
      premiumUsers: premium,
      monthlyRevenue,
      yearlyRevenue,
      churnRate,
      planBreakdown,
      usageStats: {
        totalJobsPosted,
        totalBidsPlaced,
        avgJobsPerUser: usageRecordCount > 0 ? totalJobsPosted / usageRecordCount : 0,
        avgBidsPerUser: usageRecordCount > 0 ? totalBidsPlaced / usageRecordCount : 0,
      },
    };
  }
}
