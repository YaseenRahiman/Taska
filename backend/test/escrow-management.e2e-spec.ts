import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Escrow Management (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let testPaymentId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Set global API prefix to match production
    app.setGlobalPrefix('api/v1');

    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Clean up test data
    await prisma.escrowConfig.deleteMany({});
    await prisma.payment.deleteMany({ where: { job: { title: { contains: 'Test Escrow' } } } });

    // Create admin user with properly hashed password
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('Admin123!', 12);

    const adminUser = await prisma.user.create({
      data: {
        email: 'escrow-admin@test.com',
        passwordHash: hashedPassword,
        role: 'ADMIN',
        verifiedAt: new Date(),
        profile: {
          create: {
            firstName: 'Test',
            lastName: 'Admin',
            phoneNumber: '+27123456789',
          },
        },
      },
    });

    // Login to get admin token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'escrow-admin@test.com',
        password: 'Admin123!',
      });

    if (loginResponse.status !== 200 || !loginResponse.body.accessToken) {
      console.error('❌ Admin login failed:', loginResponse.status, loginResponse.body);
      throw new Error('Failed to login as admin. Cannot proceed with escrow tests.');
    }

    adminToken = loginResponse.body.accessToken;
    console.log('✅ Admin authenticated successfully for escrow tests');

    // Create test payment for escrow operations
    const clientPassword = await bcrypt.hash('Client123!', 12);
    const client = await prisma.user.create({
      data: {
        email: 'escrow-client@test.com',
        passwordHash: clientPassword,
        role: 'CLIENT',
        verifiedAt: new Date(),
        profile: {
          create: {
            firstName: 'Test',
            lastName: 'Client',
            phoneNumber: '+27123456780',
            addressLine1: '123 Test St',
            city: 'Cape Town',
            province: 'Western Cape',
            postalCode: '8001',
          },
        },
      },
    });

    const artisanPassword = await bcrypt.hash('Artisan123!', 12);
    const artisan = await prisma.user.create({
      data: {
        email: 'escrow-artisan@test.com',
        passwordHash: artisanPassword,
        role: 'ARTISAN',
        verifiedAt: new Date(),
        profile: {
          create: {
            firstName: 'Test',
            lastName: 'Artisan',
            phoneNumber: '+27123456781',
            addressLine1: '456 Test Ave',
            city: 'Cape Town',
            province: 'Western Cape',
            postalCode: '8001',
          },
        },
        wallet: {
          create: {
            balance: 0,
          },
        },
      },
    });

    const category = await prisma.category.create({
      data: {
        name: 'Escrow Test Category',
        description: 'Category for escrow testing',
      },
    });

    const job = await prisma.job.create({
      data: {
        clientId: client.id,
        categoryId: category.id,
        title: 'Test Escrow Job',
        description: 'Test job for escrow operations',
        budget: 1000,
        budgetType: 'FIXED',
        urgency: 'MEDIUM',
        status: 'IN_PROGRESS',
        addressLine1: '123 Test St',
        city: 'Test City',
        province: 'Test Province',
        postalCode: '12345',
        latitude: -26.2041,
        longitude: 28.0473,
      },
    });

    const payment = await prisma.payment.create({
      data: {
        jobId: job.id,
        payerId: client.id,
        payeeId: artisan.id,
        amount: 1000,
        platformFee: 100,
        vatAmount: 150,
        totalAmount: 1150,
        currency: 'ZAR',
        paymentMethod: 'CREDIT_CARD',
        paymentProvider: 'stripe',
        providerTxnId: 'test-txn-123',
        status: 'COMPLETED',
        escrowStatus: 'HELD',
        paidAt: new Date(),
      },
    });

    testPaymentId = payment.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.escrowConfig.deleteMany({});
    await prisma.payment.deleteMany({ where: { job: { title: { contains: 'Test Escrow' } } } });
    await prisma.job.deleteMany({ where: { title: { contains: 'Test Escrow' } } });
    await prisma.category.deleteMany({ where: { name: { contains: 'Escrow Test' } } });
    await prisma.user.deleteMany({ where: { email: { contains: 'escrow-' } } });

    await app.close();
  });

  describe('GET /api/v1/admin/escrow/config', () => {
    it('should get escrow configuration', () => {
      return request(app.getHttpServer())
        .get('/api/v1/admin/escrow/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('autoReleaseDays');
          expect(res.body).toHaveProperty('holdDurationDays');
          expect(res.body).toHaveProperty('disputeWindowDays');
          expect(res.body).toHaveProperty('feePercentage');
          expect(res.body).toHaveProperty('minHoldAmount');
          expect(res.body).toHaveProperty('maxHoldAmount');
          expect(res.body).toHaveProperty('isActive');
          expect(res.body.autoReleaseDays).toBe(7);
          expect(res.body.feePercentage).toBe(10);
        });
    });

    it('should create default config if none exists', async () => {
      // Delete all configs first
      await prisma.escrowConfig.deleteMany({});

      return request(app.getHttpServer())
        .get('/api/v1/admin/escrow/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.autoReleaseDays).toBe(7);
          expect(res.body.isActive).toBe(true);
        });
    });

    it('should reject unauthenticated requests', () => {
      return request(app.getHttpServer())
        .get('/api/v1/admin/escrow/config')
        .expect(401);
    });
  });

  describe('PUT /api/v1/admin/escrow/config', () => {
    it('should update escrow configuration', () => {
      return request(app.getHttpServer())
        .put('/api/v1/admin/escrow/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          autoReleaseDays: 10,
          feePercentage: 12.00,
          minHoldAmount: 100.00,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.autoReleaseDays).toBe(10);
          expect(res.body.feePercentage).toBe(12);
          expect(res.body.minHoldAmount).toBe(100);
        });
    });

    it('should reject invalid fee percentage', () => {
      return request(app.getHttpServer())
        .put('/api/v1/admin/escrow/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          feePercentage: 15.00, // > 10%
        })
        .expect(400);
    });

    it('should reject invalid min/max amounts', () => {
      return request(app.getHttpServer())
        .put('/api/v1/admin/escrow/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          minHoldAmount: 10000.00,
          maxHoldAmount: 5000.00,
        })
        .expect(400);
    });

    it('should reject invalid auto-release days', () => {
      return request(app.getHttpServer())
        .put('/api/v1/admin/escrow/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          autoReleaseDays: 100, // > 90
        })
        .expect(400);
    });
  });

  describe('GET /api/v1/admin/escrow/holds', () => {
    it('should get all escrow holds with pagination', () => {
      return request(app.getHttpServer())
        .get('/api/v1/admin/escrow/holds')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 20 })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('holds');
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('page');
          expect(res.body).toHaveProperty('limit');
          expect(res.body).toHaveProperty('totalPages');
          expect(Array.isArray(res.body.holds)).toBe(true);
          expect(res.body.page).toBe(1);
          expect(res.body.limit).toBe(20);
        });
    });

    it('should filter holds by status', () => {
      return request(app.getHttpServer())
        .get('/api/v1/admin/escrow/holds')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ status: 'HELD' })
        .expect(200)
        .expect((res) => {
          expect(res.body.holds.every((h: any) => h.escrowStatus === 'HELD')).toBe(true);
        });
    });

    it('should support pagination', () => {
      return request(app.getHttpServer())
        .get('/api/v1/admin/escrow/holds')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 2, limit: 5 })
        .expect(200)
        .expect((res) => {
          expect(res.body.page).toBe(2);
          expect(res.body.limit).toBe(5);
        });
    });
  });

  describe('GET /api/v1/admin/escrow/holds/:id', () => {
    it('should get escrow hold by ID', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/admin/escrow/holds/${testPaymentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(testPaymentId);
          expect(res.body).toHaveProperty('jobTitle');
          expect(res.body).toHaveProperty('clientName');
          expect(res.body).toHaveProperty('artisanName');
          expect(res.body).toHaveProperty('amount');
          expect(res.body).toHaveProperty('escrowStatus');
          expect(res.body).toHaveProperty('daysHeld');
          expect(res.body).toHaveProperty('daysUntilAutoRelease');
        });
    });

    it('should return 404 for non-existent hold', () => {
      return request(app.getHttpServer())
        .get('/api/v1/admin/escrow/holds/nonexistent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('POST /api/v1/admin/escrow/holds/:id/release', () => {
    it('should release escrow hold', async () => {
      // Create a new payment for release test
      const client = await prisma.user.findFirst({ where: { email: 'escrow-client@test.com' } });
      const artisan = await prisma.user.findFirst({ where: { email: 'escrow-artisan@test.com' } });
      const job = await prisma.job.findFirst({ where: { title: 'Test Escrow Job' } });

      const releasePayment = await prisma.payment.create({
        data: {
          jobId: job!.id,
          payerId: client!.id,
          payeeId: artisan!.id,
          amount: 500,
          platformFee: 50,
          vatAmount: 75,
          totalAmount: 575,
          currency: 'ZAR',
          paymentMethod: 'CREDIT_CARD',
          paymentProvider: 'stripe',
          providerTxnId: 'test-release-txn',
          status: 'COMPLETED',
          escrowStatus: 'HELD',
          paidAt: new Date(),
        },
      });

      return request(app.getHttpServer())
        .post(`/api/v1/admin/escrow/holds/${releasePayment.id}/release`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Job completed successfully',
          notes: 'Test release',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.escrowStatus).toBe('RELEASED');
          expect(res.body.id).toBe(releasePayment.id);
        });
    });

    it('should reject release of already released hold', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/admin/escrow/holds/${testPaymentId}/release`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Test release',
        })
        .expect(400);
    });

    it('should reject release without reason', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/admin/escrow/holds/${testPaymentId}/release`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);
    });
  });

  describe('POST /api/v1/admin/escrow/holds/:id/refund', () => {
    it('should refund escrow hold', async () => {
      // Create a new payment for refund test
      const client = await prisma.user.findFirst({ where: { email: 'escrow-client@test.com' } });
      const artisan = await prisma.user.findFirst({ where: { email: 'escrow-artisan@test.com' } });
      const job = await prisma.job.findFirst({ where: { title: 'Test Escrow Job' } });

      const refundPayment = await prisma.payment.create({
        data: {
          jobId: job!.id,
          payerId: client!.id,
          payeeId: artisan!.id,
          amount: 750,
          platformFee: 75,
          vatAmount: 112.5,
          totalAmount: 862.5,
          currency: 'ZAR',
          paymentMethod: 'CREDIT_CARD',
          paymentProvider: 'stripe',
          providerTxnId: 'test-refund-txn',
          status: 'COMPLETED',
          escrowStatus: 'HELD',
          paidAt: new Date(),
        },
      });

      return request(app.getHttpServer())
        .post(`/api/v1/admin/escrow/holds/${refundPayment.id}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Job cancelled by client',
          notes: 'Test refund',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.escrowStatus).toBe('REFUNDED');
          expect(res.body.id).toBe(refundPayment.id);
        });
    });

    it('should reject refund without reason', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/admin/escrow/holds/${testPaymentId}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);
    });
  });

  describe('GET /api/v1/admin/escrow/analytics', () => {
    it('should get escrow analytics', () => {
      return request(app.getHttpServer())
        .get('/api/v1/admin/escrow/analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('totalHeld');
          expect(res.body).toHaveProperty('totalReleased');
          expect(res.body).toHaveProperty('totalDisputed');
          expect(res.body).toHaveProperty('totalRefunded');
          expect(res.body).toHaveProperty('activeHoldsCount');
          expect(res.body).toHaveProperty('pendingAutoReleaseCount');
          expect(res.body).toHaveProperty('averageHoldDuration');
          expect(res.body).toHaveProperty('platformFeesCollected');
          expect(res.body).toHaveProperty('holdsByStatus');
          expect(res.body).toHaveProperty('holdsRequiringAttention');
          expect(typeof res.body.totalHeld).toBe('number');
          expect(typeof res.body.activeHoldsCount).toBe('number');
        });
    });

    it('should include holds by status breakdown', () => {
      return request(app.getHttpServer())
        .get('/api/v1/admin/escrow/analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.holdsByStatus).toHaveProperty('held');
          expect(res.body.holdsByStatus).toHaveProperty('released');
          expect(res.body.holdsByStatus).toHaveProperty('disputed');
          expect(res.body.holdsByStatus).toHaveProperty('refunded');
        });
    });
  });

  describe('Authorization Tests', () => {
    it('should reject non-admin users', async () => {
      // Create a regular client user
      const regularClientPassword = await require('bcrypt').hash('Client123!', 12);
      const clientUser = await prisma.user.create({
        data: {
          email: 'regular-client@test.com',
          passwordHash: regularClientPassword,
          role: 'CLIENT',
          verifiedAt: new Date(),
          profile: {
            create: {
              firstName: 'Regular',
              lastName: 'Client',
              phoneNumber: '+27123456782',
            },
          },
        },
      });

      // Login as client
      const clientLogin = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'regular-client@test.com',
          password: 'Client123!',
        });

      const clientToken = clientLogin.body.accessToken || 'mock-client-token';

      // Attempt to access admin escrow endpoints
      await request(app.getHttpServer())
        .get('/api/v1/admin/escrow/config')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .get('/api/v1/admin/escrow/holds')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);

      // Clean up
      await prisma.user.delete({ where: { id: clientUser.id } });
    });
  });
});
