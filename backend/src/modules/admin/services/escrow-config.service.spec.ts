import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { EscrowConfigService } from './escrow-config.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

describe('EscrowConfigService', () => {
  let service: EscrowConfigService;
  let prisma: PrismaService;

  const mockPrismaService = {
    escrowConfig: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      update: jest.fn(),
    },
    wallet: {
      create: jest.fn(),
      update: jest.fn(),
    },
    walletTransaction: {
      create: jest.fn(),
    },
    job: {
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EscrowConfigService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<EscrowConfigService>(EscrowConfigService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getConfig', () => {
    it('should return existing active config', async () => {
      const mockConfig = {
        id: 'config-1',
        autoReleaseDays: 7,
        holdDurationDays: 14,
        disputeWindowDays: 14,
        feePercentage: new Decimal('10.00'),
        minHoldAmount: new Decimal('0.00'),
        maxHoldAmount: new Decimal('100000.00'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.escrowConfig.findFirst.mockResolvedValue(mockConfig);

      const result = await service.getConfig();

      expect(result.id).toBe('config-1');
      expect(result.autoReleaseDays).toBe(7);
      expect(result.feePercentage).toBe(10.00);
      expect(mockPrismaService.escrowConfig.findFirst).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should create default config if none exists', async () => {
      mockPrismaService.escrowConfig.findFirst.mockResolvedValue(null);
      const mockNewConfig = {
        id: 'new-config',
        autoReleaseDays: 7,
        holdDurationDays: 14,
        disputeWindowDays: 14,
        feePercentage: new Decimal('10.00'),
        minHoldAmount: new Decimal('0.00'),
        maxHoldAmount: new Decimal('100000.00'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.escrowConfig.create.mockResolvedValue(mockNewConfig);

      const result = await service.getConfig();

      expect(result.id).toBe('new-config');
      expect(mockPrismaService.escrowConfig.create).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockPrismaService.escrowConfig.findFirst.mockRejectedValue(new Error('Database error'));

      await expect(service.getConfig()).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('updateConfig', () => {
    const mockCurrentConfig = {
      id: 'config-1',
      autoReleaseDays: 7,
      holdDurationDays: 14,
      disputeWindowDays: 14,
      feePercentage: new Decimal('10.00'),
      minHoldAmount: new Decimal('0.00'),
      maxHoldAmount: new Decimal('100000.00'),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(() => {
      mockPrismaService.escrowConfig.findFirst.mockResolvedValue(mockCurrentConfig);
    });

    it('should update config successfully', async () => {
      const updateDto = {
        autoReleaseDays: 10,
        feePercentage: 12.00,
      };

      const mockNewConfig = {
        ...mockCurrentConfig,
        id: 'config-2',
        autoReleaseDays: 10,
        feePercentage: new Decimal('12.00'),
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          escrowConfig: {
            update: jest.fn().mockResolvedValue(mockCurrentConfig),
            create: jest.fn().mockResolvedValue(mockNewConfig),
          },
          auditLog: {
            create: jest.fn().mockResolvedValue({}),
          },
        });
      });

      const result = await service.updateConfig(updateDto, 'admin-123');

      expect(result.autoReleaseDays).toBe(10);
      expect(result.feePercentage).toBe(12.00);
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should reject invalid min/max amounts', async () => {
      const updateDto = {
        minHoldAmount: 10000.00,
        maxHoldAmount: 5000.00,
      };

      await expect(service.updateConfig(updateDto, 'admin-123')).rejects.toThrow(BadRequestException);
    });

    it('should reject invalid fee percentage', async () => {
      const updateDto = {
        feePercentage: 15.00, // > 10%
      };

      await expect(service.updateConfig(updateDto, 'admin-123')).rejects.toThrow(BadRequestException);
    });

    it('should reject invalid auto-release days', async () => {
      const updateDto = {
        autoReleaseDays: 100, // > 90
      };

      await expect(service.updateConfig(updateDto, 'admin-123')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getActiveHolds', () => {
    it('should return paginated holds', async () => {
      const mockPayments = [
        {
          id: 'payment-1',
          jobId: 'job-1',
          payerId: 'client-1',
          payeeId: 'artisan-1',
          amount: new Decimal('1000.00'),
          platformFee: new Decimal('100.00'),
          totalAmount: new Decimal('1150.00'),
          escrowStatus: 'HELD',
          status: 'COMPLETED',
          paidAt: new Date(),
          releasedAt: null,
          createdAt: new Date(),
          job: { title: 'Test Job' },
          payer: { email: 'client@test.com', profile: { firstName: 'John', lastName: 'Client' } },
          payee: { email: 'artisan@test.com', profile: { firstName: 'Jane', lastName: 'Artisan' } },
        },
      ];

      mockPrismaService.payment.findMany.mockResolvedValue(mockPayments);
      mockPrismaService.payment.count.mockResolvedValue(1);
      mockPrismaService.escrowConfig.findFirst.mockResolvedValue({
        id: 'config-1',
        autoReleaseDays: 7,
        holdDurationDays: 14,
        disputeWindowDays: 14,
        feePercentage: new Decimal('10.00'),
        minHoldAmount: new Decimal('0.00'),
        maxHoldAmount: new Decimal('100000.00'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.getActiveHolds({ page: 1, limit: 20 });

      expect(result.holds).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.holds[0].jobTitle).toBe('Test Job');
      expect(result.holds[0].amount).toBe(1000.00);
    });

    it('should filter by status', async () => {
      mockPrismaService.payment.findMany.mockResolvedValue([]);
      mockPrismaService.payment.count.mockResolvedValue(0);
      mockPrismaService.escrowConfig.findFirst.mockResolvedValue({
        id: 'config-1',
        autoReleaseDays: 7,
        holdDurationDays: 14,
        disputeWindowDays: 14,
        feePercentage: new Decimal('10.00'),
        minHoldAmount: new Decimal('0.00'),
        maxHoldAmount: new Decimal('100000.00'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await service.getActiveHolds({ status: 'RELEASED', page: 1, limit: 20 });

      expect(mockPrismaService.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ escrowStatus: 'RELEASED' }),
        })
      );
    });
  });

  describe('getHoldById', () => {
    it('should return hold by ID', async () => {
      const mockPayment = {
        id: 'payment-1',
        jobId: 'job-1',
        payerId: 'client-1',
        payeeId: 'artisan-1',
        amount: new Decimal('1000.00'),
        platformFee: new Decimal('100.00'),
        totalAmount: new Decimal('1150.00'),
        escrowStatus: 'HELD',
        status: 'COMPLETED',
        paidAt: new Date(),
        releasedAt: null,
        createdAt: new Date(),
        job: { title: 'Test Job' },
        payer: { email: 'client@test.com', profile: { firstName: 'John', lastName: 'Client' } },
        payee: { email: 'artisan@test.com', profile: { firstName: 'Jane', lastName: 'Artisan' } },
      };

      mockPrismaService.payment.findUnique.mockResolvedValue(mockPayment);
      mockPrismaService.escrowConfig.findFirst.mockResolvedValue({
        id: 'config-1',
        autoReleaseDays: 7,
        holdDurationDays: 14,
        disputeWindowDays: 14,
        feePercentage: new Decimal('10.00'),
        minHoldAmount: new Decimal('0.00'),
        maxHoldAmount: new Decimal('100000.00'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.getHoldById('payment-1');

      expect(result.id).toBe('payment-1');
      expect(result.jobTitle).toBe('Test Job');
    });

    it('should throw NotFoundException if hold not found', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue(null);

      await expect(service.getHoldById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('releaseHold', () => {
    const mockPayment = {
      id: 'payment-1',
      jobId: 'job-1',
      payerId: 'client-1',
      payeeId: 'artisan-1',
      amount: new Decimal('1000.00'),
      platformFee: new Decimal('100.00'),
      totalAmount: new Decimal('1150.00'),
      escrowStatus: 'HELD',
      status: 'COMPLETED',
      paidAt: new Date(),
      releasedAt: null,
      createdAt: new Date(),
      job: { title: 'Test Job' },
      payee: { wallet: { id: 'wallet-1', balance: new Decimal('500.00') } },
    };

    it('should release hold successfully', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue(mockPayment);

      const updatedPayment = {
        ...mockPayment,
        escrowStatus: 'RELEASED',
        releasedAt: new Date(),
        payer: { email: 'client@test.com', profile: { firstName: 'John', lastName: 'Client' } },
        payee: { email: 'artisan@test.com', profile: { firstName: 'Jane', lastName: 'Artisan' } },
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          payment: {
            update: jest.fn().mockResolvedValue(updatedPayment),
          },
          wallet: {
            update: jest.fn().mockResolvedValue({ id: 'wallet-1', balance: new Decimal('1400.00') }),
          },
          walletTransaction: {
            create: jest.fn().mockResolvedValue({}),
          },
          job: {
            update: jest.fn().mockResolvedValue({}),
          },
          auditLog: {
            create: jest.fn().mockResolvedValue({}),
          },
          notification: {
            create: jest.fn().mockResolvedValue({}),
          },
        });
      });

      mockPrismaService.escrowConfig.findFirst.mockResolvedValue({
        id: 'config-1',
        autoReleaseDays: 7,
        holdDurationDays: 14,
        disputeWindowDays: 14,
        feePercentage: new Decimal('10.00'),
        minHoldAmount: new Decimal('0.00'),
        maxHoldAmount: new Decimal('100000.00'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.releaseHold('payment-1', 'Job completed', 'admin-123');

      expect(result.escrowStatus).toBe('RELEASED');
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw error if payment not held', async () => {
      const releasedPayment = { ...mockPayment, escrowStatus: 'RELEASED' };
      mockPrismaService.payment.findUnique.mockResolvedValue(releasedPayment);

      await expect(service.releaseHold('payment-1', 'Test', 'admin-123')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('refundHold', () => {
    const mockPayment = {
      id: 'payment-1',
      jobId: 'job-1',
      payerId: 'client-1',
      payeeId: 'artisan-1',
      amount: new Decimal('1000.00'),
      platformFee: new Decimal('100.00'),
      totalAmount: new Decimal('1150.00'),
      escrowStatus: 'HELD',
      status: 'COMPLETED',
      paidAt: new Date(),
      refundedAt: null,
      createdAt: new Date(),
      job: { title: 'Test Job' },
      payer: { email: 'client@test.com', profile: { firstName: 'John', lastName: 'Client' } },
      payee: { email: 'artisan@test.com', profile: { firstName: 'Jane', lastName: 'Artisan' } },
    };

    it('should refund hold successfully', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue(mockPayment);

      const refundedPayment = {
        ...mockPayment,
        escrowStatus: 'REFUNDED',
        refundedAt: new Date(),
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          payment: {
            update: jest.fn().mockResolvedValue(refundedPayment),
          },
          job: {
            update: jest.fn().mockResolvedValue({}),
          },
          auditLog: {
            create: jest.fn().mockResolvedValue({}),
          },
          notification: {
            create: jest.fn().mockResolvedValue({}),
          },
        });
      });

      mockPrismaService.escrowConfig.findFirst.mockResolvedValue({
        id: 'config-1',
        autoReleaseDays: 7,
        holdDurationDays: 14,
        disputeWindowDays: 14,
        feePercentage: new Decimal('10.00'),
        minHoldAmount: new Decimal('0.00'),
        maxHoldAmount: new Decimal('100000.00'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.refundHold('payment-1', 'Job cancelled', 'admin-123');

      expect(result.escrowStatus).toBe('REFUNDED');
    });
  });

  describe('getAnalytics', () => {
    it('should return comprehensive analytics', async () => {
      mockPrismaService.payment.aggregate.mockResolvedValue({
        _sum: { amount: new Decimal('10000.00'), platformFee: new Decimal('1000.00') },
        _count: { id: 10 },
      });

      mockPrismaService.payment.findMany.mockResolvedValue([
        {
          paidAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          releasedAt: new Date(),
        },
      ]);

      mockPrismaService.payment.count.mockResolvedValue(2);

      mockPrismaService.escrowConfig.findFirst.mockResolvedValue({
        id: 'config-1',
        autoReleaseDays: 7,
        holdDurationDays: 14,
        disputeWindowDays: 14,
        feePercentage: new Decimal('10.00'),
        minHoldAmount: new Decimal('0.00'),
        maxHoldAmount: new Decimal('100000.00'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.getAnalytics();

      expect(result.totalHeld).toBe(10000.00);
      expect(result.activeHoldsCount).toBe(10);
      expect(result.holdsByStatus).toBeDefined();
    });
  });

  describe('autoReleaseScheduler', () => {
    it('should auto-release eligible payments', async () => {
      const mockConfig = {
        id: 'config-1',
        autoReleaseDays: 7,
        holdDurationDays: 14,
        disputeWindowDays: 14,
        feePercentage: new Decimal('10.00'),
        minHoldAmount: new Decimal('0.00'),
        maxHoldAmount: new Decimal('100000.00'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const eligiblePayment = {
        id: 'payment-1',
        jobId: 'job-1',
        paidAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
        job: { title: 'Test Job' },
      };

      mockPrismaService.escrowConfig.findFirst.mockResolvedValue(mockConfig);
      mockPrismaService.payment.findMany.mockResolvedValue([eligiblePayment]);

      // Mock the release hold method
      jest.spyOn(service, 'releaseHold').mockResolvedValue({} as any);

      await service.autoReleaseScheduler();

      expect(service.releaseHold).toHaveBeenCalledWith(
        'payment-1',
        expect.stringContaining('Auto-released after 7 days'),
        'system-auto-release',
        expect.any(String)
      );
    });

    it('should handle errors gracefully during auto-release', async () => {
      mockPrismaService.escrowConfig.findFirst.mockRejectedValue(new Error('Database error'));

      // Should not throw
      await expect(service.autoReleaseScheduler()).resolves.not.toThrow();
    });
  });
});
