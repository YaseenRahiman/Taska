import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as request from 'supertest';

export interface TestApp {
  app: INestApplication;
  prisma: PrismaService;
  jwtService: JwtService;
  httpServer: any;
}

export interface TestUser {
  id: string;
  email: string;
  token: string;
  role: 'CLIENT' | 'ARTISAN' | 'ADMIN' | 'ASSESSOR';
}

export class E2ETestHelper {
  static app: TestApp;
  static testUsers: {
    client: TestUser;
    artisan: TestUser;
    admin: TestUser;
    assessor: TestUser;
  };

  static async setupTestApp(): Promise<TestApp> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleFixture.createNestApplication();

    // Set global API prefix to match production (main.ts:26)
    app.setGlobalPrefix('api/v1');

    // Apply global pipes and middleware
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    await app.init();

    const prisma = app.get(PrismaService);
    const jwtService = app.get(JwtService);
    const httpServer = app.getHttpServer();

    // Enable PostgreSQL extensions required for geospatial queries
    try {
      await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS cube;');
      await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS earthdistance CASCADE;');
      console.log('✅ PostGIS extensions (cube, earthdistance) enabled successfully');
    } catch (error) {
      console.error('❌ PostGIS extensions failed to enable:', error.message);
      console.error('   This will cause location-based tests to fail.');
      console.error('   Solution: Grant CREATE permission to your test database user:');
      console.error('   ALTER USER your_test_user WITH CREATEDB;');
      console.error('   Or run: GRANT CREATE ON DATABASE your_test_db TO your_test_user;');
      // Don't throw - let tests run and fail individually with clear error messages
    }

    this.app = { app, prisma, jwtService, httpServer };
    return this.app;
  }

  static async cleanDatabase(): Promise<void> {
    const { prisma } = this.app;
    
    // Clean in reverse dependency order
    await prisma.review.deleteMany();
    await prisma.message.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.activityLog.deleteMany();
    await prisma.walletTransaction.deleteMany();
    await prisma.withdrawal.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.bid.deleteMany();
    await prisma.job.deleteMany();
    await prisma.wallet.deleteMany();
    await prisma.artisanSpecialization.deleteMany();
    await prisma.profile.deleteMany();
    await prisma.user.deleteMany();
    await prisma.category.deleteMany();
    await prisma.systemSetting.deleteMany();
  }

  static async seedTestData(): Promise<void> {
    const { prisma } = this.app;

    // Create categories (use skipDuplicates to avoid conflicts)
    const categories = await prisma.category.createMany({
      data: [
        { id: '1', name: 'Plumbing', description: 'Plumbing services', isActive: true },
        { id: '2', name: 'Electrical', description: 'Electrical services', isActive: true },
        { id: '3', name: 'Carpentry', description: 'Carpentry services', isActive: true },
      ],
      skipDuplicates: true,
    });

    // Create system settings (use skipDuplicates to avoid conflicts)
    await prisma.systemSetting.createMany({
      data: [
        { key: 'platform_fee_percentage', value: '15', description: 'Platform fee percentage' },
        { key: 'vat_percentage', value: '15', description: 'VAT percentage' },
        { key: 'max_bid_expiry_days', value: '30', description: 'Maximum bid expiry days' },
      ],
      skipDuplicates: true,
    });
  }

  static async createTestUsers(): Promise<void> {
    const { prisma, jwtService } = this.app;
    const bcrypt = require('bcrypt');

    // Clean all dependent data first to avoid foreign key constraints
    await prisma.review.deleteMany();
    await prisma.message.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.activityLog.deleteMany();
    await prisma.walletTransaction.deleteMany();
    await prisma.withdrawal.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.bid.deleteMany();
    await prisma.job.deleteMany();
    await prisma.wallet.deleteMany();
    await prisma.artisanSpecialization.deleteMany();
    await prisma.profile.deleteMany();

    // Delete existing test users to avoid conflicts
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['client@test.com', 'artisan@test.com', 'admin@test.com', 'assessor@test.com']
        }
      }
    });

    // Create client
    const clientPassword = await bcrypt.hash('password123', 12);
    const clientUser = await prisma.user.create({
      data: {
        email: 'client@test.com',
        passwordHash: clientPassword,
        role: 'CLIENT',
        verifiedAt: new Date(),
        profile: {
          create: {
            firstName: 'Test',
            lastName: 'Client',
            phoneNumber: '+27123456789',
            addressLine1: '123 Test Street',
            city: 'Cape Town',
            province: 'Western Cape',
            postalCode: '8001',
          },
        },
      },
      include: { profile: true },
    });

    // Create artisan
    const artisanPassword = await bcrypt.hash('password123', 12);
    const artisanUser = await prisma.user.create({
      data: {
        email: 'artisan@test.com',
        passwordHash: artisanPassword,
        role: 'ARTISAN',
        verifiedAt: new Date(),
        profile: {
          create: {
            firstName: 'Test',
            lastName: 'Artisan',
            phoneNumber: '+27123456790',
            addressLine1: '456 Test Avenue',
            city: 'Johannesburg',
            province: 'Gauteng',
            postalCode: '2000',
            bio: 'Experienced plumber with 10+ years experience',
          },
        },
        wallet: {
          create: {
            balance: 1000.00,
          },
        },
      },
      include: { profile: true, wallet: true },
    });

    // Create admin
    const adminPassword = await bcrypt.hash('admin123', 12);
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        passwordHash: adminPassword,
        role: 'ADMIN',
        verifiedAt: new Date(),
        profile: {
          create: {
            firstName: 'Test',
            lastName: 'Admin',
            phoneNumber: '+27123456791',
          },
        },
      },
      include: { profile: true },
    });

    // Create assessor
    const assessorPassword = await bcrypt.hash('assessor123', 12);
    const assessorUser = await prisma.user.create({
      data: {
        email: 'assessor@test.com',
        passwordHash: assessorPassword,
        role: 'ASSESSOR',
        verifiedAt: new Date(),
        profile: {
          create: {
            firstName: 'Test',
            lastName: 'Assessor',
            phoneNumber: '+27123456792',
          },
        },
      },
      include: { profile: true },
    });

    // Generate JWT tokens
    const clientToken = jwtService.sign({ 
      sub: clientUser.id, 
      email: clientUser.email, 
      role: clientUser.role 
    });
    const artisanToken = jwtService.sign({ 
      sub: artisanUser.id, 
      email: artisanUser.email, 
      role: artisanUser.role 
    });
    const adminToken = jwtService.sign({ 
      sub: adminUser.id, 
      email: adminUser.email, 
      role: adminUser.role 
    });
    const assessorToken = jwtService.sign({ 
      sub: assessorUser.id, 
      email: assessorUser.email, 
      role: assessorUser.role 
    });

    this.testUsers = {
      client: { id: clientUser.id, email: clientUser.email, token: clientToken, role: 'CLIENT' },
      artisan: { id: artisanUser.id, email: artisanUser.email, token: artisanToken, role: 'ARTISAN' },
      admin: { id: adminUser.id, email: adminUser.email, token: adminToken, role: 'ADMIN' },
      assessor: { id: assessorUser.id, email: assessorUser.email, token: assessorToken, role: 'ASSESSOR' },
    };
  }

  static async closeApp(): Promise<void> {
    if (this.app?.app) {
      await this.app.app.close();
    }
  }

  static getAuthHeaders(userType: 'client' | 'artisan' | 'admin' | 'assessor'): Record<string, string> {
    return {
      Authorization: `Bearer ${this.testUsers[userType].token}`,
    };
  }

  static async makeRequest(method: 'get' | 'post' | 'patch' | 'delete', url: string, userType?: 'client' | 'artisan' | 'admin' | 'assessor', data?: any) {
    const req = request(this.app.httpServer)[method](url);
    
    if (userType) {
      req.set(this.getAuthHeaders(userType));
    }
    
    if (data) {
      req.send(data);
    }
    
    return req;
  }
}

// Global setup and teardown
beforeAll(async () => {
  await E2ETestHelper.setupTestApp();
  await E2ETestHelper.cleanDatabase();
  await E2ETestHelper.seedTestData();
  await E2ETestHelper.createTestUsers();
}, 60000);

afterAll(async () => {
  await E2ETestHelper.cleanDatabase();
  await E2ETestHelper.closeApp();
}, 30000);

beforeEach(async () => {
  // Clean dynamic data before each test but keep users and categories
  const { prisma } = E2ETestHelper.app;
  await prisma.review.deleteMany();
  await prisma.message.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.walletTransaction.deleteMany();
  await prisma.withdrawal.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.bid.deleteMany();
  await prisma.job.deleteMany();
});
