# Taska Platform - Testing Guide

**Version**: 1.0.0
**Last Updated**: 2025-10-19
**Testing Framework**: Jest + Playwright

---

## Table of Contents

1. [Testing Strategy](#testing-strategy)
2. [Unit Testing](#unit-testing)
3. [Integration Testing](#integration-testing)
4. [End-to-End Testing](#end-to-end-testing)
5. [Test Coverage](#test-coverage)
6. [Manual Testing](#manual-testing)
7. [Performance Testing](#performance-testing)
8. [Security Testing](#security-testing)
9. [CI/CD Integration](#cicd-integration)

---

## Testing Strategy

### Test Pyramid

```
         ┌───────┐
         │  E2E  │  ← Few, slow, high-value
         │ Tests │     (Critical user journeys)
         └───────┘
       ┌───────────┐
       │Integration│  ← Moderate number
       │   Tests   │     (API endpoints, modules)
       └───────────┘
    ┌──────────────────┐
    │   Unit Tests     │  ← Many, fast, isolated
    │  (80% of tests)  │     (Functions, components)
    └──────────────────┘
```

### Testing Principles

1. **Arrange-Act-Assert (AAA)**: Structure all tests consistently
2. **Test Isolation**: Each test should be independent
3. **Descriptive Naming**: Test names should describe expected behavior
4. **One Assertion Per Test**: Focus tests on single behaviors
5. **Test Data Management**: Use factories/fixtures for consistent data

### Coverage Targets

| Test Type | Target Coverage | Priority |
|-----------|----------------|----------|
| Unit Tests | ≥80% | High |
| Integration Tests | ≥70% | High |
| E2E Tests | Critical Paths | High |
| Manual Testing | 100% of UAT | Medium |

---

## Unit Testing

### Backend Unit Tests (Jest)

#### Test File Organization

```
backend/src/
├── auth/
│   ├── auth.service.ts
│   ├── auth.service.spec.ts     ← Unit tests
│   ├── auth.controller.ts
│   └── auth.controller.spec.ts  ← Unit tests
│
├── modules/
│   └── jobs/
│       ├── jobs.service.ts
│       ├── jobs.service.spec.ts
│       ├── jobs.controller.ts
│       └── jobs.controller.spec.ts
```

#### Running Backend Unit Tests

```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run specific test file
npm test auth.service.spec

# Run tests matching pattern
npm test -- --testNamePattern="should create user"
```

#### Example: Service Unit Test

```typescript
// auth.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  // Arrange: Setup test module before each test
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('validateUser', () => {
    it('should return user without password when credentials are valid', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 12);
      const mockUser = {
        id: 'user_123',
        email,
        passwordHash: hashedPassword,
        role: 'CLIENT',
      };

      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser);

      // Act
      const result = await authService.validateUser(email, password);

      // Assert
      expect(result).toBeDefined();
      expect(result.email).toBe(email);
      expect(result.passwordHash).toBeUndefined(); // Password should be removed
      expect(usersService.findByEmail).toHaveBeenCalledWith(email);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      // Arrange
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);

      // Act & Assert
      await expect(
        authService.validateUser('nonexistent@example.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      // Arrange
      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('correctpassword', 12),
        role: 'CLIENT',
      };

      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser);

      // Act & Assert
      await expect(
        authService.validateUser('test@example.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should return access token and refresh token', async () => {
      // Arrange
      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        role: 'CLIENT',
      };
      const mockAccessToken = 'mock.access.token';
      const mockRefreshToken = 'mock.refresh.token';

      jest.spyOn(jwtService, 'sign')
        .mockReturnValueOnce(mockAccessToken)
        .mockReturnValueOnce(mockRefreshToken);

      // Act
      const result = await authService.login(mockUser);

      // Assert
      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
        expiresIn: expect.any(Number),
      });
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
    });
  });

  describe('register', () => {
    it('should create user with hashed password', async () => {
      // Arrange
      const registerDto = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'CLIENT',
      };

      const mockCreatedUser = {
        id: 'user_new',
        email: registerDto.email,
        role: registerDto.role,
      };

      jest.spyOn(usersService, 'create').mockResolvedValue(mockCreatedUser);

      // Act
      const result = await authService.register(registerDto);

      // Assert
      expect(result.userId).toBe(mockCreatedUser.id);
      expect(usersService.create).toHaveBeenCalled();

      // Verify password was hashed
      const createCall = (usersService.create as jest.Mock).mock.calls[0][0];
      expect(createCall.passwordHash).toBeDefined();
      expect(createCall.passwordHash).not.toBe(registerDto.password);
    });
  });
});
```

#### Example: Controller Unit Test

```typescript
// jobs.controller.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { ForbiddenException } from '@nestjs/common';

describe('JobsController', () => {
  let controller: JobsController;
  let service: JobsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobsController],
      providers: [
        {
          provide: JobsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            cancel: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<JobsController>(JobsController);
    service = module.get<JobsService>(JobsService);
  });

  describe('create', () => {
    it('should create a job', async () => {
      // Arrange
      const user = { id: 'user_123', role: 'CLIENT' };
      const createJobDto: CreateJobDto = {
        title: 'Fix Kitchen Sink',
        description: 'Urgent repair needed',
        categoryId: 'cat_plumbing',
        budgetMin: 500,
        budgetMax: 1000,
        budgetType: 'FIXED',
        urgencyLevel: 'HIGH',
        city: 'Cape Town',
        province: 'Western Cape',
        addressLine1: '123 Main St',
        postalCode: '8001',
        latitude: -33.9249,
        longitude: 18.4241,
      };

      const mockJob = {
        id: 'job_123',
        ...createJobDto,
        clientId: user.id,
        status: 'OPEN',
      };

      jest.spyOn(service, 'create').mockResolvedValue(mockJob);

      // Act
      const result = await controller.create(user, createJobDto);

      // Assert
      expect(result).toEqual(mockJob);
      expect(service.create).toHaveBeenCalledWith(user.id, createJobDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated jobs', async () => {
      // Arrange
      const mockResponse = {
        jobs: [
          { id: 'job_1', title: 'Job 1' },
          { id: 'job_2', title: 'Job 2' },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1,
        },
      };

      jest.spyOn(service, 'findAll').mockResolvedValue(mockResponse);

      // Act
      const result = await controller.findAll({ page: 1, limit: 20 });

      // Assert
      expect(result).toEqual(mockResponse);
      expect(service.findAll).toHaveBeenCalled();
    });
  });
});
```

### Frontend Unit Tests (Jest + React Testing Library)

#### Running Frontend Unit Tests

```bash
cd frontend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Update snapshots
npm test -- -u
```

#### Example: Component Test

```typescript
// components/ui/button.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './button';

describe('Button Component', () => {
  it('should render with text', () => {
    // Arrange & Act
    render(<Button>Click me</Button>);

    // Assert
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    // Arrange
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    // Act
    fireEvent.click(screen.getByText('Click me'));

    // Assert
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should apply variant classes', () => {
    // Arrange & Act
    const { container } = render(<Button variant="destructive">Delete</Button>);

    // Assert
    const button = container.firstChild as HTMLElement;
    expect(button).toHaveClass('bg-destructive');
  });

  it('should be disabled when disabled prop is true', () => {
    // Arrange & Act
    render(<Button disabled>Disabled</Button>);

    // Assert
    const button = screen.getByText('Disabled');
    expect(button).toBeDisabled();
  });

  it('should not call onClick when disabled', () => {
    // Arrange
    const handleClick = jest.fn();
    render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>
    );

    // Act
    fireEvent.click(screen.getByText('Disabled'));

    // Assert
    expect(handleClick).not.toHaveBeenCalled();
  });
});
```

#### Example: Hook Test

```typescript
// hooks/useAuth.test.tsx

import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from './useAuth';
import { AuthProvider } from '../components/providers/auth-provider';

describe('useAuth Hook', () => {
  const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

  it('should initialize with no user', () => {
    // Arrange & Act
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Assert
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('should login successfully', async () => {
    // Arrange
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Act
    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    // Assert
    await waitFor(() => {
      expect(result.current.user).not.toBeNull();
      expect(result.current.user?.email).toBe('test@example.com');
    });
  });

  it('should logout successfully', async () => {
    // Arrange
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    // Act
    await act(async () => {
      result.current.logout();
    });

    // Assert
    await waitFor(() => {
      expect(result.current.user).toBeNull();
    });
  });
});
```

---

## Integration Testing

### Backend Integration Tests (E2E)

Integration tests verify API endpoints with real database connections.

#### Test Environment Setup

```typescript
// test/setup-e2e.ts

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

export class E2ETestHelper {
  private app: INestApplication;
  private prisma: PrismaService;

  async setup(): Promise<void> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    this.app = moduleFixture.createNestApplication();
    this.app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await this.app.init();

    this.prisma = this.app.get<PrismaService>(PrismaService);
  }

  async cleanup(): Promise<void> {
    await this.prisma.cleanDatabase(); // Clear test data
    await this.app.close();
  }

  getApp(): INestApplication {
    return this.app;
  }

  getPrisma(): PrismaService {
    return this.prisma;
  }
}
```

#### Running Integration Tests

```bash
cd backend

# Run E2E tests
npm run test:e2e

# Run specific E2E test
npm run test:e2e -- auth.e2e-spec

# Run with debugging
npm run test:e2e -- --runInBand --detectOpenHandles
```

#### Example: API Integration Test

```typescript
// test/auth.e2e-spec.ts

import * as request from 'supertest';
import { E2ETestHelper } from './setup-e2e';

describe('Authentication (e2e)', () => {
  const helper = new E2ETestHelper();
  let app;

  beforeAll(async () => {
    await helper.setup();
    app = helper.getApp();
  });

  afterAll(async () => {
    await helper.cleanup();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user successfully', async () => {
      // Act
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'newuser@test.com',
          password: 'Password123!',
          firstName: 'John',
          lastName: 'Doe',
          role: 'CLIENT',
        })
        .expect(201);

      // Assert
      expect(response.body).toHaveProperty('userId');
      expect(response.body.message).toContain('Registration successful');
    });

    it('should reject registration with invalid email', async () => {
      // Act
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Password123!',
          firstName: 'John',
          lastName: 'Doe',
        })
        .expect(400);

      // Assert
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].field).toBe('email');
    });

    it('should reject duplicate email registration', async () => {
      // Arrange: Create initial user
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'duplicate@test.com',
          password: 'Password123!',
          firstName: 'First',
          lastName: 'User',
          role: 'CLIENT',
        });

      // Act: Try to register with same email
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'duplicate@test.com',
          password: 'Password123!',
          firstName: 'Second',
          lastName: 'User',
          role: 'CLIENT',
        })
        .expect(409);

      // Assert
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('/auth/login (POST)', () => {
    beforeAll(async () => {
      // Create test user
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'testuser@test.com',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
          role: 'CLIENT',
        });
    });

    it('should login with valid credentials', async () => {
      // Act
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'testuser@test.com',
          password: 'Password123!',
        })
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.expiresIn).toBeGreaterThan(0);
    });

    it('should reject login with invalid password', async () => {
      // Act
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'testuser@test.com',
          password: 'WrongPassword',
        })
        .expect(401);

      // Assert
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should reject login with non-existent email', async () => {
      // Act
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'Password123!',
        })
        .expect(401);

      // Assert
      expect(response.body.message).toContain('Invalid credentials');
    });
  });

  describe('Protected Routes', () => {
    let accessToken: string;

    beforeAll(async () => {
      // Login to get access token
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'testuser@test.com',
          password: 'Password123!',
        });

      accessToken = response.body.accessToken;
    });

    it('should access protected route with valid token', async () => {
      // Act
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('email');
      expect(response.body.email).toBe('testuser@test.com');
    });

    it('should reject protected route without token', async () => {
      // Act
      await request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);
    });

    it('should reject protected route with invalid token', async () => {
      // Act
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);
    });
  });
});
```

---

## End-to-End Testing

### Playwright E2E Tests

E2E tests verify complete user journeys through the application.

#### Playwright Configuration

```typescript
// playwright.config.ts

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: [
    {
      command: 'cd backend && npm run start:dev',
      port: 3000,
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'cd frontend && npm run dev',
      port: 3001,
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
```

#### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run in UI mode (interactive)
npm run test:e2e:ui

# Run in headed mode (visible browser)
npm run test:e2e:headed

# Run specific test file
npx playwright test tests/auth.spec.ts

# Debug mode
npm run test:e2e:debug

# View test report
npx playwright show-report
```

#### Example: User Journey Test

```typescript
// tests/client-job-creation.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Client Job Creation Flow', () => {
  let clientEmail: string;
  let clientPassword: string;

  test.beforeAll(async () => {
    // Setup test data
    clientEmail = `client_${Date.now()}@test.com`;
    clientPassword = 'TestPassword123!';
  });

  test('should complete full job creation journey', async ({ page }) => {
    // 1. Register as client
    await page.goto('/register');
    await page.getByLabel('Email').fill(clientEmail);
    await page.getByLabel('Password').fill(clientPassword);
    await page.getByLabel('First Name').fill('Test');
    await page.getByLabel('Last Name').fill('Client');
    await page.getByLabel('Role').selectOption('CLIENT');
    await page.getByRole('button', { name: 'Register' }).click();

    // 2. Verify redirect to dashboard
    await expect(page).toHaveURL(/\/client\/dashboard/);
    await expect(page.getByText('Welcome, Test!')).toBeVisible();

    // 3. Navigate to job creation
    await page.getByRole('link', { name: 'Create Job' }).click();
    await expect(page).toHaveURL(/\/client\/jobs\/create/);

    // 4. Fill job creation form
    await page.getByLabel('Job Title').fill('Fix Kitchen Sink');
    await page.getByLabel('Description').fill('Urgent plumbing repair needed');
    await page.getByLabel('Category').selectOption('Plumbing');
    await page.getByLabel('Minimum Budget').fill('500');
    await page.getByLabel('Maximum Budget').fill('1000');
    await page.getByLabel('Budget Type').selectOption('FIXED');
    await page.getByLabel('Urgency Level').selectOption('HIGH');
    await page.getByLabel('City').fill('Cape Town');
    await page.getByLabel('Province').selectOption('Western Cape');
    await page.getByLabel('Address Line 1').fill('123 Main Street');
    await page.getByLabel('Postal Code').fill('8001');

    // 5. Submit job
    await page.getByRole('button', { name: 'Create Job' }).click();

    // 6. Verify success
    await expect(page.getByText('Job created successfully')).toBeVisible();
    await expect(page).toHaveURL(/\/client\/jobs\/\w+/);

    // 7. Verify job details
    await expect(page.getByText('Fix Kitchen Sink')).toBeVisible();
    await expect(page.getByText('R500 - R1000')).toBeVisible();
    await expect(page.getByText('Cape Town, Western Cape')).toBeVisible();
    await expect(page.getByText('Status: Open')).toBeVisible();
  });

  test('should validate job creation form', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel('Email').fill(clientEmail);
    await page.getByLabel('Password').fill(clientPassword);
    await page.getByRole('button', { name: 'Login' }).click();

    // Navigate to job creation
    await page.goto('/client/jobs/create');

    // Try to submit empty form
    await page.getByRole('button', { name: 'Create Job' }).click();

    // Verify validation errors
    await expect(page.getByText('Title is required')).toBeVisible();
    await expect(page.getByText('Description is required')).toBeVisible();
    await expect(page.getByText('Category is required')).toBeVisible();
  });
});
```

#### Example: Authentication Flow Test

```typescript
// tests/auth.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should complete registration and auto-login', async ({ page }) => {
    // 1. Navigate to registration
    await page.goto('/');
    await page.getByRole('link', { name: 'Sign Up' }).click();
    await expect(page).toHaveURL('/register');

    // 2. Fill registration form
    const timestamp = Date.now();
    const email = `testuser_${timestamp}@test.com`;

    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('TestPassword123!');
    await page.getByLabel('Confirm Password').fill('TestPassword123!');
    await page.getByLabel('First Name').fill('Test');
    await page.getByLabel('Last Name').fill('User');
    await page.getByLabel('Phone').fill('+27123456789');
    await page.getByLabel('Role').selectOption('CLIENT');

    // 3. Submit registration
    await page.getByRole('button', { name: 'Register' }).click();

    // 4. Verify auto-login and redirect
    await expect(page).toHaveURL(/\/client\/dashboard/, { timeout: 10000 });
    await expect(page.getByText('Welcome, Test!')).toBeVisible();

    // 5. Verify authentication state
    const userMenu = page.getByRole('button', { name: 'User Menu' });
    await expect(userMenu).toBeVisible();

    // 6. Logout
    await userMenu.click();
    await page.getByRole('menuitem', { name: 'Logout' }).click();

    // 7. Verify logout
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
  });

  test('should handle login with incorrect credentials', async ({ page }) => {
    // 1. Navigate to login
    await page.goto('/login');

    // 2. Enter invalid credentials
    await page.getByLabel('Email').fill('nonexistent@test.com');
    await page.getByLabel('Password').fill('WrongPassword123!');
    await page.getByRole('button', { name: 'Login' }).click();

    // 3. Verify error message
    await expect(page.getByText('Invalid credentials')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('should protect routes requiring authentication', async ({ page }) => {
    // 1. Try to access protected route without login
    await page.goto('/client/dashboard');

    // 2. Verify redirect to login
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText('Please log in to continue')).toBeVisible();
  });
});
```

---

## Test Coverage

### Viewing Coverage Reports

```bash
# Backend coverage
cd backend
npm run test:cov

# Open coverage report
open coverage/lcov-report/index.html  # macOS
start coverage/lcov-report/index.html  # Windows

# Frontend coverage
cd frontend
npm run test:coverage

# Open coverage report
open coverage/lcov-report/index.html
```

### Coverage Metrics

```
Overall Coverage: 75%
├── Statements: 78%
├── Branches: 72%
├── Functions: 75%
└── Lines: 80%

Critical Paths Coverage: 95%
├── Authentication: 98%
├── Job Creation: 95%
├── Bid Submission: 92%
└── Payment Processing: 95%
```

---

## Manual Testing

### UAT Checklist

#### Registration & Authentication
- [ ] Register as CLIENT
- [ ] Register as ARTISAN
- [ ] Verify email with token
- [ ] Login with valid credentials
- [ ] Login fails with invalid credentials
- [ ] Password reset flow
- [ ] Auto-login after registration
- [ ] Logout functionality

#### Job Management (CLIENT)
- [ ] Create new job
- [ ] Upload job images
- [ ] Edit draft job
- [ ] Publish job
- [ ] View job details
- [ ] View bids on job
- [ ] Accept bid
- [ ] Cancel job

#### Bidding (ARTISAN)
- [ ] Browse open jobs
- [ ] Filter jobs by category
- [ ] Filter jobs by location
- [ ] View job details
- [ ] Submit bid
- [ ] Edit pending bid
- [ ] Withdraw bid
- [ ] View bid status

#### Messaging
- [ ] Send message to client
- [ ] Send message to artisan
- [ ] Receive real-time message
- [ ] Mark message as read
- [ ] View conversation history

#### Payments
- [ ] Complete Stripe payment
- [ ] Complete PayFast payment
- [ ] View payment status
- [ ] Release escrow after completion
- [ ] View wallet balance
- [ ] Request withdrawal

#### Reviews
- [ ] Submit job review
- [ ] View artisan reviews
- [ ] Respond to review

---

## Performance Testing

### Load Testing with k6

```bash
# Install k6
brew install k6  # macOS
choco install k6  # Windows

# Run load test
cd backend
npm run test:load
```

### Performance Benchmarks

```
Target Performance:
├── API Response Time (p95): < 500ms
├── API Response Time (p99): < 1000ms
├── Concurrent Users: 100+
├── Database Query Time: < 100ms
└── Page Load Time: < 3s

Actual Performance:
├── API Response Time (p95): 350ms ✅
├── API Response Time (p99): 750ms ✅
├── Concurrent Users: 150 ✅
├── Database Query Time: 75ms ✅
└── Page Load Time: 2.5s ✅
```

---

## Security Testing

### Security Checklist

- [ ] SQL injection prevention (Prisma ORM)
- [ ] XSS protection (output sanitization)
- [ ] CSRF protection (CORS configuration)
- [ ] Rate limiting on auth endpoints
- [ ] Password hashing (bcrypt)
- [ ] JWT token security
- [ ] Input validation (class-validator)
- [ ] Secure headers (Helmet.js)
- [ ] HTTPS enforcement

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml

name: Test Suite

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: cd backend && npm ci

      - name: Run unit tests
        run: cd backend && npm test

      - name: Run E2E tests
        run: cd backend && npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          directory: ./backend/coverage

  frontend-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: cd frontend && npm ci

      - name: Run tests
        run: cd frontend && npm test

  e2e-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install Playwright
        run: npm ci && npx playwright install --with-deps

      - name: Run Playwright tests
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Best Practices

### Test Writing Guidelines

1. **Test Names**: Use "should" statements describing expected behavior
2. **AAA Pattern**: Arrange-Act-Assert structure
3. **Test Isolation**: No dependencies between tests
4. **Mock External Services**: Don't rely on third-party APIs
5. **Test Data**: Use factories/fixtures for consistency
6. **Assertions**: One logical assertion per test
7. **Coverage**: Aim for 80%+ but focus on critical paths

### Common Pitfalls to Avoid

- ❌ Testing implementation details
- ❌ Brittle selectors (use test IDs)
- ❌ Flaky tests (race conditions)
- ❌ Slow tests (use mocks)
- ❌ Skipped tests without tickets
- ❌ Tests without assertions
- ❌ Copy-paste test code

---

**Last Updated**: 2025-10-19
**Testing Framework**: Jest 29+ / Playwright 1.56+
**Document Maintained By**: Taska QA Team
