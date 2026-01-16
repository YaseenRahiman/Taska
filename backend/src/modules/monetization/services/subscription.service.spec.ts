import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionService } from './subscription.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { SubscriptionStatus, BillingCycle } from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let prisma: PrismaService;

  const mockPrismaService = {
    subscriptionPlan: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
    },
    userSubscription: {
      count: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
    usageRecord: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
  };

  const mockFreePlan = {
    id: 'free-plan-id',
    name: 'FREE',
    displayName: 'Free Plan',
    description: 'Basic features',
    clientJobsPerMonth: 2,
    artisanBidsPerMonth: 5,
    pricePerMonthZar: { equals: (val: number) => val === 0 },
    pricePerYearZar: 0,
    isActive: true,
    isDefault: true,
    sortOrder: 0,
  };

  const mockPremiumPlan = {
    id: 'premium-plan-id',
    name: 'PREMIUM',
    displayName: 'Premium Plan',
    description: 'Premium features',
    clientJobsPerMonth: 50,
    artisanBidsPerMonth: 100,
    pricePerMonthZar: { equals: (val: number) => val === 299 },
    pricePerYearZar: 2990,
    isActive: true,
    isDefault: false,
    sortOrder: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SubscriptionService>(SubscriptionService);
    prisma = module.get<PrismaService>(PrismaService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initializeDefaultPlans', () => {
    it('should create default plans when none exist', async () => {
      mockPrismaService.subscriptionPlan.count.mockResolvedValue(0);
      mockPrismaService.subscriptionPlan.createMany.mockResolvedValue({ count: 2 });

      await service.initializeDefaultPlans();

      expect(mockPrismaService.subscriptionPlan.count).toHaveBeenCalled();
      expect(mockPrismaService.subscriptionPlan.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            name: 'FREE',
            clientJobsPerMonth: 2,
            artisanBidsPerMonth: 5,
          }),
          expect.objectContaining({
            name: 'PREMIUM',
            clientJobsPerMonth: 50,
            artisanBidsPerMonth: 100,
          }),
        ]),
      });
    });

    it('should skip initialization if plans already exist', async () => {
      mockPrismaService.subscriptionPlan.count.mockResolvedValue(2);

      await service.initializeDefaultPlans();

      expect(mockPrismaService.subscriptionPlan.count).toHaveBeenCalled();
      expect(mockPrismaService.subscriptionPlan.createMany).not.toHaveBeenCalled();
    });
  });

  describe('getPlans', () => {
    it('should return all active plans', async () => {
      const plans = [mockFreePlan, mockPremiumPlan];
      mockPrismaService.subscriptionPlan.findMany.mockResolvedValue(plans);

      const result = await service.getPlans();

      expect(result).toEqual(plans);
      expect(mockPrismaService.subscriptionPlan.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });
    });
  });

  describe('getPlanById', () => {
    it('should return plan when found', async () => {
      mockPrismaService.subscriptionPlan.findUnique.mockResolvedValue(mockFreePlan);

      const result = await service.getPlanById('free-plan-id');

      expect(result).toEqual(mockFreePlan);
    });

    it('should throw NotFoundException when plan not found', async () => {
      mockPrismaService.subscriptionPlan.findUnique.mockResolvedValue(null);

      await expect(service.getPlanById('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getDefaultPlan', () => {
    it('should return the default plan', async () => {
      mockPrismaService.subscriptionPlan.findFirst.mockResolvedValue(mockFreePlan);

      const result = await service.getDefaultPlan();

      expect(result).toEqual(mockFreePlan);
    });

    it('should fallback to free plan by name if no default', async () => {
      mockPrismaService.subscriptionPlan.findFirst.mockResolvedValue(null);
      mockPrismaService.subscriptionPlan.findUnique.mockResolvedValue(mockFreePlan);

      const result = await service.getDefaultPlan();

      expect(result).toEqual(mockFreePlan);
    });

    it('should throw NotFoundException if no free plan exists', async () => {
      mockPrismaService.subscriptionPlan.findFirst.mockResolvedValue(null);
      mockPrismaService.subscriptionPlan.findUnique.mockResolvedValue(null);

      await expect(service.getDefaultPlan()).rejects.toThrow(NotFoundException);
    });
  });

  describe('getOrCreateSubscription', () => {
    const userId = 'user-123';

    it('should return existing active subscription', async () => {
      const existingSubscription = {
        id: 'sub-123',
        userId,
        planId: mockFreePlan.id,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: new Date(Date.now() + 86400000), // Tomorrow
        plan: mockFreePlan,
      };
      mockPrismaService.userSubscription.findUnique.mockResolvedValue(existingSubscription);

      const result = await service.getOrCreateSubscription(userId);

      expect(result).toEqual(existingSubscription);
    });

    it('should create new subscription for new user', async () => {
      const newSubscription = {
        id: 'new-sub-123',
        userId,
        planId: mockFreePlan.id,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        plan: mockFreePlan,
      };

      mockPrismaService.userSubscription.findUnique
        .mockResolvedValueOnce(null) // First call: no existing subscription
        .mockResolvedValueOnce(newSubscription); // Second call: when getting usage record
      mockPrismaService.subscriptionPlan.findFirst.mockResolvedValue(mockFreePlan);
      mockPrismaService.userSubscription.create.mockResolvedValue(newSubscription);
      mockPrismaService.usageRecord.findFirst.mockResolvedValue(null);
      mockPrismaService.usageRecord.create.mockResolvedValue({});

      const result = await service.getOrCreateSubscription(userId);

      expect(result).toEqual(newSubscription);
      expect(mockPrismaService.userSubscription.create).toHaveBeenCalled();
    });
  });

  describe('canPostJob', () => {
    const userId = 'user-123';

    it('should return allowed=true when jobs remaining', async () => {
      const subscription = {
        id: 'sub-123',
        userId,
        planId: mockFreePlan.id,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 86400000),
        plan: mockFreePlan,
      };
      const usageRecord = {
        jobsPosted: 1,
        bidsPlaced: 0,
      };

      mockPrismaService.userSubscription.findUnique.mockResolvedValue(subscription);
      mockPrismaService.usageRecord.findFirst.mockResolvedValue(usageRecord);

      const result = await service.canPostJob(userId);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1); // 2 - 1 = 1
    });

    it('should return allowed=false when limit reached', async () => {
      const subscription = {
        id: 'sub-123',
        userId,
        planId: mockFreePlan.id,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 86400000),
        plan: mockFreePlan,
      };
      const usageRecord = {
        jobsPosted: 2, // At limit
        bidsPlaced: 0,
      };

      mockPrismaService.userSubscription.findUnique.mockResolvedValue(subscription);
      mockPrismaService.usageRecord.findFirst.mockResolvedValue(usageRecord);

      const result = await service.canPostJob(userId);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.reason).toContain('reached your monthly limit');
    });
  });

  describe('canPlaceBid', () => {
    const userId = 'user-123';

    it('should return allowed=true when bids remaining', async () => {
      const subscription = {
        id: 'sub-123',
        userId,
        planId: mockFreePlan.id,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 86400000),
        plan: mockFreePlan,
      };
      const usageRecord = {
        jobsPosted: 0,
        bidsPlaced: 3,
      };

      mockPrismaService.userSubscription.findUnique.mockResolvedValue(subscription);
      mockPrismaService.usageRecord.findFirst.mockResolvedValue(usageRecord);

      const result = await service.canPlaceBid(userId);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2); // 5 - 3 = 2
    });

    it('should return allowed=false when limit reached', async () => {
      const subscription = {
        id: 'sub-123',
        userId,
        planId: mockFreePlan.id,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 86400000),
        plan: mockFreePlan,
      };
      const usageRecord = {
        jobsPosted: 0,
        bidsPlaced: 5, // At limit
      };

      mockPrismaService.userSubscription.findUnique.mockResolvedValue(subscription);
      mockPrismaService.usageRecord.findFirst.mockResolvedValue(usageRecord);

      const result = await service.canPlaceBid(userId);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.reason).toContain('reached your monthly limit');
    });
  });

  describe('incrementJobUsage', () => {
    const userId = 'user-123';

    it('should increment job count', async () => {
      const subscription = {
        id: 'sub-123',
        userId,
        planId: mockFreePlan.id,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 86400000),
        plan: mockFreePlan,
      };
      const usageRecord = { id: 'usage-123', jobsPosted: 0, bidsPlaced: 0 };
      const updatedRecord = { id: 'usage-123', jobsPosted: 1, bidsPlaced: 0 };

      mockPrismaService.userSubscription.findUnique.mockResolvedValue(subscription);
      mockPrismaService.usageRecord.findFirst.mockResolvedValue(usageRecord);
      mockPrismaService.usageRecord.update.mockResolvedValue(updatedRecord);

      const result = await service.incrementJobUsage(userId);

      expect(result.jobsPosted).toBe(1);
      expect(mockPrismaService.usageRecord.update).toHaveBeenCalledWith({
        where: { id: 'usage-123' },
        data: { jobsPosted: { increment: 1 } },
      });
    });
  });

  describe('incrementBidUsage', () => {
    const userId = 'user-123';

    it('should increment bid count', async () => {
      const subscription = {
        id: 'sub-123',
        userId,
        planId: mockFreePlan.id,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 86400000),
        plan: mockFreePlan,
      };
      const usageRecord = { id: 'usage-123', jobsPosted: 0, bidsPlaced: 0 };
      const updatedRecord = { id: 'usage-123', jobsPosted: 0, bidsPlaced: 1 };

      mockPrismaService.userSubscription.findUnique.mockResolvedValue(subscription);
      mockPrismaService.usageRecord.findFirst.mockResolvedValue(usageRecord);
      mockPrismaService.usageRecord.update.mockResolvedValue(updatedRecord);

      const result = await service.incrementBidUsage(userId);

      expect(result.bidsPlaced).toBe(1);
      expect(mockPrismaService.usageRecord.update).toHaveBeenCalledWith({
        where: { id: 'usage-123' },
        data: { bidsPlaced: { increment: 1 } },
      });
    });
  });

  describe('subscribe', () => {
    const userId = 'user-123';

    it('should create new subscription for new user', async () => {
      const newSubscription = {
        id: 'new-sub-123',
        userId,
        planId: mockPremiumPlan.id,
        status: SubscriptionStatus.ACTIVE,
        billingCycle: BillingCycle.MONTHLY,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        plan: mockPremiumPlan,
      };

      mockPrismaService.subscriptionPlan.findUnique.mockResolvedValue({
        ...mockPremiumPlan,
        isActive: true,
      });
      mockPrismaService.userSubscription.findUnique
        .mockResolvedValueOnce(null) // First call: no existing subscription
        .mockResolvedValueOnce(newSubscription); // Second call: when getting usage record
      mockPrismaService.userSubscription.create.mockResolvedValue(newSubscription);
      mockPrismaService.usageRecord.findFirst.mockResolvedValue(null);
      mockPrismaService.usageRecord.create.mockResolvedValue({});

      const result = await service.subscribe(userId, mockPremiumPlan.id);

      expect(result).toEqual(newSubscription);
    });

    it('should throw if plan is not active', async () => {
      mockPrismaService.subscriptionPlan.findUnique.mockResolvedValue({
        ...mockPremiumPlan,
        isActive: false,
      });

      await expect(
        service.subscribe(userId, mockPremiumPlan.id),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelSubscription', () => {
    const userId = 'user-123';

    it('should cancel subscription at period end', async () => {
      const subscription = {
        id: 'sub-123',
        userId,
        planId: mockPremiumPlan.id,
        status: SubscriptionStatus.ACTIVE,
        plan: mockPremiumPlan,
      };
      mockPrismaService.userSubscription.findUnique.mockResolvedValue(subscription);
      mockPrismaService.userSubscription.update.mockResolvedValue({
        ...subscription,
        cancelledAt: new Date(),
        cancelAtPeriodEnd: true,
        status: SubscriptionStatus.ACTIVE,
      });

      const result = await service.cancelSubscription(userId, true);

      expect(result.cancelAtPeriodEnd).toBe(true);
      expect(result.status).toBe(SubscriptionStatus.ACTIVE);
    });

    it('should throw if trying to cancel free plan', async () => {
      const subscription = {
        id: 'sub-123',
        userId,
        planId: mockFreePlan.id,
        status: SubscriptionStatus.ACTIVE,
        plan: mockFreePlan,
      };
      mockPrismaService.userSubscription.findUnique.mockResolvedValue(subscription);

      await expect(service.cancelSubscription(userId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw if no subscription found', async () => {
      mockPrismaService.userSubscription.findUnique.mockResolvedValue(null);

      await expect(service.cancelSubscription(userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getSubscriptionStats', () => {
    it('should return comprehensive stats', async () => {
      mockPrismaService.userSubscription.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(95)  // active
        .mockResolvedValueOnce(20)  // premium
        .mockResolvedValueOnce(75)  // free
        .mockResolvedValueOnce(5)   // cancelled
        .mockResolvedValueOnce(75)  // free count for breakdown
        .mockResolvedValueOnce(20); // premium count for breakdown

      mockPrismaService.subscriptionPlan.findMany.mockResolvedValue([
        mockFreePlan,
        mockPremiumPlan,
      ]);

      mockPrismaService.usageRecord.aggregate.mockResolvedValue({
        _sum: { jobsPosted: 150, bidsPlaced: 300 },
        _count: 50,
      });

      mockPrismaService.subscriptionPlan.findUnique.mockResolvedValue({
        ...mockPremiumPlan,
        pricePerMonthZar: 299,
      });

      const result = await service.getSubscriptionStats();

      expect(result.totalSubscribers).toBe(100);
      expect(result.activeSubscriptions).toBe(95);
      expect(result.premiumUsers).toBe(20);
      expect(result.freeUsers).toBe(75);
      expect(result.usageStats.totalJobsPosted).toBe(150);
      expect(result.usageStats.totalBidsPlaced).toBe(300);
    });
  });

  describe('updatePlan', () => {
    it('should update plan details', async () => {
      const updatedPlan = {
        ...mockFreePlan,
        clientJobsPerMonth: 5,
        artisanBidsPerMonth: 10,
      };
      mockPrismaService.subscriptionPlan.update.mockResolvedValue(updatedPlan);

      const result = await service.updatePlan(mockFreePlan.id, {
        clientJobsPerMonth: 5,
        artisanBidsPerMonth: 10,
      });

      expect(result.clientJobsPerMonth).toBe(5);
      expect(result.artisanBidsPerMonth).toBe(10);
    });
  });
});
