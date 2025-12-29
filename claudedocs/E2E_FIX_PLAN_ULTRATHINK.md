# E2E Test Fix Plan - Phase 3: Ultrathink Analysis

**Plan Date**: 2025-12-23
**Analysis Depth**: Ultrathink (Maximum)
**Target**: 225/225 tests passing (100%)
**Current State**: 69/157 passing (43.9%)
**Estimated Impact**: 88 → 0 critical failures

---

## Strategic Overview

### Problem Statement
The Playwright E2E test suite is configured to only start the frontend server (Next.js on port 3001), leaving the backend API (NestJS on port 3000) unavailable. This causes 100% of API-dependent tests to fail with `ERR_CONNECTION_REFUSED` errors.

### Solution Principle
**Fix infrastructure before fixing tests** - Address root cause (missing backend) before investigating individual test failures.

### Success Criteria
1. All 225 E2E tests execute to completion
2. ≥ 90% pass rate (≥ 203/225 tests passing)
3. Zero infrastructure-related failures
4. Reproducible test environment in CI/CD
5. Fast test execution (< 15 minutes total)

---

## Approach Evaluation Matrix

### Approach 1: Modify Playwright Config to Start Both Servers ⭐ **RECOMMENDED**
**Complexity**: LOW
**Risk**: LOW
**Impact**: CRITICAL (fixes 88/88 failures)
**Time**: 15-30 minutes

**Pros**:
- ✅ Single configuration change
- ✅ Leverages existing root `npm run dev` script
- ✅ Maintains monorepo structure
- ✅ Easy to understand and maintain
- ✅ Works in both dev and CI environments
- ✅ No new dependencies

**Cons**:
- ⚠️ Requires both servers to start successfully
- ⚠️ Database must be available
- ⚠️ Slightly slower startup time

**Implementation**:
```typescript
// frontend/playwright.config.ts
webServer: {
  command: 'cd .. && npm run dev',  // Use ROOT dev script (starts both)
  url: 'http://localhost:3001',     // Frontend health check
  reuseExistingServer: !process.env.CI,
  timeout: 180000,  // Increased for both servers
  env: {
    NODE_ENV: 'test',
    DATABASE_URL: 'postgresql://...'  // Test database
  }
}
```

**Verification**:
1. Both ports (3000, 3001) respond
2. API health check passes
3. Frontend loads
4. Database connected

---

### Approach 2: Multiple webServer Configurations
**Complexity**: MEDIUM
**Risk**: MEDIUM
**Impact**: CRITICAL
**Time**: 30-45 minutes

**Pros**:
- ✅ Independent server startup
- ✅ Granular control
- ✅ Better error isolation

**Cons**:
- ❌ Playwright doesn't natively support multiple webServer entries
- ❌ Requires workaround or custom script
- ❌ More complex configuration
- ❌ Harder to maintain

**Implementation**:
```typescript
// frontend/playwright.config.ts
webServer: {
  command: 'node scripts/start-test-servers.js',  // Custom script
  url: 'http://localhost:3001',
  timeout: 180000,
}

// scripts/start-test-servers.js
const { spawn } = require('child_process');
// Start backend, wait for health, then start frontend
```

**Not Recommended**: More complexity for same outcome as Approach 1

---

### Approach 3: Use Docker Compose for Test Environment
**Complexity**: HIGH
**Risk**: MEDIUM
**Impact**: CRITICAL + Infrastructure improvement
**Time**: 2-4 hours

**Pros**:
- ✅ Complete environment isolation
- ✅ Reproducible across machines
- ✅ Includes database, Redis, etc.
- ✅ CI/CD ready
- ✅ Matches production architecture

**Cons**:
- ❌ High initial setup time
- ❌ Requires Docker knowledge
- ❌ Slower startup (container overhead)
- ❌ More infrastructure to maintain

**Implementation**:
```yaml
# docker-compose.test.yml
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: taska_test
  backend:
    build: ./backend
    depends_on: [postgres]
  frontend:
    build: ./frontend
    depends_on: [backend]
```

**Future Consideration**: Good for CI/CD, but overkill for immediate fix

---

### Approach 4: Mock Backend API for E2E Tests
**Complexity**: VERY HIGH
**Risk**: HIGH
**Impact**: MEDIUM (doesn't test real integration)
**Time**: 8-16 hours

**Pros**:
- ✅ Fast test execution
- ✅ No database dependency
- ✅ Controlled test data

**Cons**:
- ❌ Not true E2E testing
- ❌ Misses integration bugs
- ❌ Massive effort to mock all endpoints
- ❌ Defeats purpose of E2E tests
- ❌ Mocks drift from real API

**Decision**: ❌ **REJECTED** - Violates E2E testing principles

---

## Recommended Solution: Approach 1 (Detailed)

### Phase 1: Environment Preparation

#### 1.1 Database Setup
**Objective**: Ensure test database is available and seeded

**Steps**:
```bash
# 1. Check if PostgreSQL is running
psql --version
# Verify connection: psql -U postgres -h localhost

# 2. Create test database if not exists
cd backend
npm run db:create:test  # Or manually: createdb taska_test

# 3. Run migrations on test database
DATABASE_URL="postgresql://user:pass@localhost:5432/taska_test" npx prisma migrate deploy

# 4. Seed test data
DATABASE_URL="postgresql://user:pass@localhost:5432/taska_test" npx prisma db seed
```

**Verification**:
```sql
-- Connect to test database
\c taska_test

-- Verify tables exist
\dt

-- Check seed data
SELECT COUNT(*) FROM "User";
SELECT COUNT(*) FROM "Job";
SELECT COUNT(*) FROM "Category";

-- Expected counts:
-- Users: ≥ 10 (test users for each role)
-- Jobs: ≥ 20 (various states)
-- Categories: 8-12 (all trades)
```

**Risk Mitigation**:
- Create `.env.test` with test database URL
- Never use production database
- Add database reset script: `npm run db:reset:test`

---

#### 1.2 Environment Variables
**Objective**: Configure test-specific environment

**Backend `.env.test`**:
```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/taska_test"

# API Configuration
PORT=3000
NODE_ENV=test

# JWT Secrets
JWT_SECRET="test-jwt-secret-change-in-production"
JWT_EXPIRES_IN="24h"

# External Services (Mock/Test Keys)
PAYFAST_MERCHANT_ID="test_merchant"
PAYFAST_MERCHANT_KEY="test_key"
STRIPE_SECRET_KEY="sk_test_..."

# Email (Use mock service)
EMAIL_SERVICE="mock"

# Disable rate limiting for tests
RATE_LIMIT_ENABLED=false
```

**Frontend `.env.test`**:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3000
NODE_ENV=test
```

**Root `.env.test`** (for monorepo):
```env
# Shared test configuration
DATABASE_URL="postgresql://postgres:password@localhost:5432/taska_test"
NODE_ENV=test
```

---

### Phase 2: Playwright Configuration Update

#### 2.1 Core Configuration Changes
**File**: `frontend/playwright.config.ts`

**Current (Broken)**:
```typescript
export default defineConfig({
  // ... other config
  webServer: {
    command: 'npm run dev',  // ❌ Only frontend
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

**Fixed (Approach 1A - Use Root Script)**:
```typescript
import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import path from 'path';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60 * 1000,
  fullyParallel: false,
  workers: 1,  // Keep serial for now
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,

  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  // ✅ CRITICAL FIX: Start both servers
  webServer: {
    // Use root dev script which starts both backend AND frontend
    command: 'npm run dev',
    cwd: path.resolve(__dirname, '..'),  // Run from ROOT directory
    url: 'http://localhost:3001',  // Health check frontend
    reuseExistingServer: !process.env.CI,
    timeout: 180000,  // 3 minutes for both servers to start
    env: {
      NODE_ENV: 'test',
      // Backend will use DATABASE_URL from .env.test
    },
    // Custom ready check - verify BOTH servers
    reuseExistingServer: process.env.CI ? false : true,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

**Alternative (Approach 1B - Explicit Both Servers)**:
```typescript
export default defineConfig({
  // ... other config

  webServer: {
    // Start both servers with concurrently
    command: 'concurrently "npm run dev:backend" "npm run dev:frontend" --kill-others',
    cwd: path.resolve(__dirname, '..'),
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
    env: {
      NODE_ENV: 'test',
      FORCE_COLOR: '1',  // Better logging
    },
  },
});
```

**Advanced (Approach 1C - Custom Startup with Health Checks)**:
```typescript
// frontend/playwright.config.ts
import { waitForServices } from './tests/e2e/utils/wait-for-services';

export default defineConfig({
  // ... other config

  webServer: {
    command: 'npm run dev',
    cwd: path.resolve(__dirname, '..'),
    url: 'http://localhost:3001',
    timeout: 180000,
    reuseExistingServer: !process.env.CI,

    // Custom ready check
    async isReady() {
      try {
        // Check backend health
        const backendHealthy = await fetch('http://localhost:3000/health')
          .then(r => r.ok)
          .catch(() => false);

        // Check frontend ready
        const frontendHealthy = await fetch('http://localhost:3001')
          .then(r => r.ok)
          .catch(() => false);

        return backendHealthy && frontendHealthy;
      } catch {
        return false;
      }
    },
  },
});
```

---

#### 2.2 Root Package.json Verification
**File**: `package.json` (root)

**Verify this script exists and works**:
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\" --kill-others",
    "dev:backend": "cd backend && npm run start:dev",
    "dev:frontend": "cd frontend && npm run dev",
    "test:e2e": "cd frontend && npm run test:e2e",
    "test:e2e:ui": "cd frontend && npm run test:e2e:ui",
    "db:reset:test": "cd backend && DATABASE_URL=$DATABASE_URL_TEST npm run db:reset",
    "db:seed:test": "cd backend && DATABASE_URL=$DATABASE_URL_TEST npm run db:seed"
  }
}
```

**Test the dev script manually**:
```bash
# From project root
npm run dev

# Should see:
# [backend] Nest application successfully started on port 3000
# [frontend] ready - started server on 0.0.0.0:3001
```

---

### Phase 3: Test Helper Improvements

#### 3.1 Enhance API Health Check Helper
**File**: `frontend/tests/e2e/utils/api-health-check.ts` (create if missing)

```typescript
import { expect } from '@playwright/test';

export async function waitForBackendReady(maxAttempts = 30) {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`${backendUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Backend health check passed:', data);
        return true;
      }
    } catch (error) {
      console.log(`⏳ Backend not ready, attempt ${i + 1}/${maxAttempts}...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  throw new Error('Backend failed to become ready within timeout');
}

export async function waitForDatabaseReady() {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  try {
    const response = await fetch(`${backendUrl}/health/db`, {
      method: 'GET',
    });

    if (response.ok) {
      console.log('✅ Database connection verified');
      return true;
    }
  } catch (error) {
    throw new Error('Database health check failed');
  }
}
```

#### 3.2 Add Global Test Setup
**File**: `frontend/tests/e2e/global-setup.ts`

```typescript
import { chromium, FullConfig } from '@playwright/test';
import { waitForBackendReady, waitForDatabaseReady } from './utils/api-health-check';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global test setup...');

  // Wait for backend to be ready
  console.log('⏳ Waiting for backend API...');
  await waitForBackendReady(60);  // 60 second timeout

  // Verify database connection
  console.log('⏳ Checking database connection...');
  await waitForDatabaseReady();

  // Optional: Reset database to known state
  if (process.env.RESET_DB_BEFORE_TESTS === 'true') {
    console.log('🔄 Resetting test database...');
    // Call your database reset endpoint or script
  }

  console.log('✅ Global setup complete');
}

export default globalSetup;
```

**Update playwright.config.ts**:
```typescript
export default defineConfig({
  // ... other config
  globalSetup: require.resolve('./tests/e2e/global-setup.ts'),
});
```

---

### Phase 4: Database Management

#### 4.1 Test Database Reset Script
**File**: `backend/scripts/reset-test-db.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.DATABASE_URL_TEST,
    },
  },
});

async function resetTestDatabase() {
  console.log('🔄 Resetting test database...');

  try {
    // Delete all records (order matters for foreign keys)
    await prisma.$transaction([
      prisma.bid.deleteMany(),
      prisma.job.deleteMany(),
      prisma.review.deleteMany(),
      prisma.message.deleteMany(),
      prisma.notification.deleteMany(),
      prisma.payment.deleteMany(),
      prisma.user.deleteMany(),
      prisma.category.deleteMany(),
    ]);

    console.log('✅ All tables cleared');

    // Run seed
    const { seed } = await import('../prisma/seed');
    await seed();

    console.log('✅ Test database reset complete');
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

resetTestDatabase();
```

**Add to package.json**:
```json
{
  "scripts": {
    "db:reset:test": "DATABASE_URL=$DATABASE_URL_TEST tsx scripts/reset-test-db.ts"
  }
}
```

---

#### 4.2 Enhanced Seed Data for E2E Tests
**File**: `backend/prisma/seed.ts`

**Ensure these test users exist**:
```typescript
// Test users for E2E tests
const testUsers = [
  {
    email: 'client@test.com',
    password: await hash('Test1234!', 10),
    role: 'CLIENT',
    firstName: 'Test',
    lastName: 'Client',
  },
  {
    email: 'artisan@test.com',
    password: await hash('Test1234!', 10),
    role: 'ARTISAN',
    firstName: 'Test',
    lastName: 'Artisan',
    trade: 'PLUMBING',
    experience: 5,
  },
  {
    email: 'admin@test.com',
    password: await hash('Test1234!', 10),
    role: 'ADMIN',
    firstName: 'Test',
    lastName: 'Admin',
  },
];

// Create categories
const categories = [
  { name: 'Plumbing', slug: 'plumbing' },
  { name: 'Electrical', slug: 'electrical' },
  { name: 'Carpentry', slug: 'carpentry' },
  { name: 'Painting', slug: 'painting' },
  { name: 'Roofing', slug: 'roofing' },
  { name: 'Tiling', slug: 'tiling' },
  { name: 'Landscaping', slug: 'landscaping' },
  { name: 'HVAC', slug: 'hvac' },
];

// Create sample jobs in various states
const sampleJobs = [
  {
    title: 'Fix leaking kitchen sink',
    description: 'Kitchen sink has a persistent leak',
    category: 'plumbing',
    budget: 500,
    status: 'OPEN',
    location: 'Johannesburg',
  },
  // ... more diverse job states
];
```

---

### Phase 5: Execution Plan

#### Step-by-Step Implementation

**Step 1: Prepare Environment (15 min)**
```bash
# 1. Navigate to project root
cd C:\Users\Yaseen\OneDrive\Documents\Investments\Taska

# 2. Install any missing dependencies
npm install concurrently --save-dev
cd frontend && npm install dotenv --save-dev
cd ../backend && npm install tsx --save-dev

# 3. Create .env.test files
# Root .env.test
cat > .env.test << EOF
DATABASE_URL="postgresql://postgres:password@localhost:5432/taska_test"
NODE_ENV=test
EOF

# Backend .env.test
cat > backend/.env.test << EOF
DATABASE_URL="postgresql://postgres:password@localhost:5432/taska_test"
PORT=3000
NODE_ENV=test
JWT_SECRET="test-jwt-secret"
JWT_EXPIRES_IN="24h"
RATE_LIMIT_ENABLED=false
EOF

# Frontend .env.test
cat > frontend/.env.test << EOF
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3000
NODE_ENV=test
EOF
```

**Step 2: Setup Test Database (10 min)**
```bash
# 1. Create test database
psql -U postgres -c "CREATE DATABASE taska_test;"

# 2. Run migrations
cd backend
DATABASE_URL="postgresql://postgres:password@localhost:5432/taska_test" npx prisma migrate deploy

# 3. Seed test data
DATABASE_URL="postgresql://postgres:password@localhost:5432/taska_test" npx prisma db seed

# 4. Verify
DATABASE_URL="postgresql://postgres:password@localhost:5432/taska_test" npx prisma studio
# Check that tables have data
```

**Step 3: Update Playwright Config (5 min)**
```bash
cd frontend

# Backup current config
cp playwright.config.ts playwright.config.ts.backup

# Edit playwright.config.ts
# Apply the recommended changes from Phase 2.1
```

**Step 4: Create Helper Utilities (5 min)**
```bash
# Create utils directory if not exists
mkdir -p tests/e2e/utils

# Create api-health-check.ts
# Create global-setup.ts
# (Use code from Phase 3)
```

**Step 5: Test Manual Server Startup (5 min)**
```bash
# From project root
npm run dev

# Verify both servers start:
# - Backend: http://localhost:3000/health → {"status":"ok"}
# - Frontend: http://localhost:3001 → Page loads

# Kill servers: Ctrl+C
```

**Step 6: Run E2E Tests (5 min)**
```bash
cd frontend
npm run test:e2e

# Watch for:
# ✅ Both servers starting
# ✅ Tests beginning execution
# ✅ No ERR_CONNECTION_REFUSED errors
```

**Step 7: Verify Results (5 min)**
```bash
# Check test results
# Expected:
# - 69 tests still passing (guest/public pages)
# - 88 previously failing tests now attempting execution
# - Target: ≥ 85 additional tests now passing
# - Total target: ≥ 154/157 executed tests passing

# Generate HTML report
npm run test:e2e:report
```

**Step 8: Address Remaining Failures (Variable)**
```bash
# If failures remain after infrastructure fix:
# 1. Check test output for new error patterns
# 2. Verify database seeding
# 3. Check for race conditions
# 4. Review test helper functions
```

---

### Phase 6: Verification & Validation

#### Success Metrics
```yaml
Infrastructure:
  ✅ Backend server starts on port 3000
  ✅ Frontend server starts on port 3001
  ✅ Database connection established
  ✅ Health endpoints responding
  ✅ No port conflicts

Test Execution:
  ✅ All 225 tests execute to completion
  ✅ No timeout errors
  ✅ No ERR_CONNECTION_REFUSED errors
  ✅ Tests complete in < 15 minutes

Test Results:
  ✅ ≥ 203/225 tests passing (90%)
  ✅ 100% of infrastructure-related failures resolved
  ✅ Clear categorization of any remaining failures
```

#### Verification Checklist
```markdown
[ ] Environment variables configured (.env.test files)
[ ] Test database created and seeded
[ ] Root npm run dev script works
[ ] Playwright config updated
[ ] Global setup script added
[ ] API health check utility created
[ ] Test helpers enhanced
[ ] Manual server startup verified
[ ] Test execution successful
[ ] Results documented
```

---

### Phase 7: Risk Mitigation

#### Risk 1: Database Not Available
**Probability**: MEDIUM
**Impact**: CRITICAL
**Mitigation**:
```bash
# Verify PostgreSQL is running
psql --version
pg_isready

# Start PostgreSQL if not running (Windows)
net start postgresql-x64-15

# Create database if missing
psql -U postgres -c "CREATE DATABASE taska_test;"
```

**Fallback**:
- Use Docker for PostgreSQL: `docker run -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:15`
- Use SQLite for tests (not recommended, different SQL dialect)

---

#### Risk 2: Port Conflicts
**Probability**: MEDIUM
**Impact**: HIGH
**Mitigation**:
```bash
# Check what's using ports before tests
netstat -ano | findstr ":3000"
netstat -ano | findstr ":3001"

# Kill processes if needed
powershell -Command "Stop-Process -Id <PID> -Force"
```

**Fallback**:
- Configure alternative ports in .env.test
- Update Playwright baseURL accordingly

---

#### Risk 3: Both Servers Don't Start
**Probability**: LOW
**Impact**: CRITICAL
**Mitigation**:
- Increase webServer timeout to 300000 (5 minutes)
- Add verbose logging to startup script
- Check for TypeScript compilation errors

**Debugging**:
```bash
# Run servers manually to see errors
cd backend && npm run start:dev
# In another terminal:
cd frontend && npm run dev

# Check logs for errors
```

---

#### Risk 4: Environment Variables Not Loaded
**Probability**: MEDIUM
**Impact**: HIGH
**Mitigation**:
```typescript
// In playwright.config.ts
import * as dotenv from 'dotenv';
import path from 'path';

// Explicitly load .env.test files
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

// Verify in config
console.log('Test DB URL:', process.env.DATABASE_URL);
```

---

#### Risk 5: Tests Still Fail After Infrastructure Fix
**Probability**: MEDIUM
**Impact**: MEDIUM
**Mitigation**:
- Categorize new failures by pattern
- Check for timing/race conditions
- Verify test data exists in database
- Review authentication helper functions
- Add retry logic for flaky tests

**Analysis Process**:
1. Run tests with `--debug` flag
2. Check test videos and screenshots
3. Review browser console logs
4. Verify API responses
5. Check for test data conflicts

---

### Phase 8: CI/CD Considerations

#### GitHub Actions Configuration
**File**: `.github/workflows/e2e-tests.yml`

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: password
          POSTGRES_DB: taska_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Setup database
        run: |
          cd backend
          DATABASE_URL="postgresql://postgres:password@localhost:5432/taska_test" npx prisma migrate deploy
          DATABASE_URL="postgresql://postgres:password@localhost:5432/taska_test" npx prisma db seed

      - name: Install Playwright Browsers
        run: cd frontend && npx playwright install --with-deps chromium

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          CI: true
          DATABASE_URL: postgresql://postgres:password@localhost:5432/taska_test

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: frontend/playwright-report/
          retention-days: 30
```

---

### Phase 9: Post-Fix Optimization

#### Optimization 1: Parallel Test Execution
**After** infrastructure is stable and all tests pass:

```typescript
// playwright.config.ts
export default defineConfig({
  workers: process.env.CI ? 2 : 3,  // Increase from 1
  fullyParallel: true,  // Enable parallelization

  // Add test sharding for CI
  shard: process.env.CI
    ? { total: 3, current: parseInt(process.env.SHARD || '1') }
    : undefined,
});
```

**Expected Impact**: 3-5x faster test execution

---

#### Optimization 2: Test Data Isolation
**Problem**: Parallel tests may conflict on shared data

**Solution**:
```typescript
// tests/e2e/utils/test-user-factory.ts
export function createUniqueTestUser(role: 'CLIENT' | 'ARTISAN' | 'ADMIN') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);

  return {
    email: `test.${role.toLowerCase()}.${timestamp}.${random}@playwright.test`,
    password: 'Test1234!',
    role,
    firstName: 'Test',
    lastName: `${role} ${timestamp}`,
  };
}
```

---

#### Optimization 3: Smart Test Retries
**For flaky tests only**:

```typescript
// playwright.config.ts
export default defineConfig({
  retries: process.env.CI ? 2 : 0,  // Retry in CI only

  // Per-test retry configuration
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      retries: 1,  // Retry flaky browser tests
    },
  ],
});
```

---

### Phase 10: Documentation & Handoff

#### Developer Documentation
**File**: `frontend/tests/e2e/README.md`

```markdown
# E2E Testing Guide

## Running Tests Locally

### Prerequisites
1. PostgreSQL running on localhost:5432
2. Test database created: `taska_test`
3. Dependencies installed: `npm install`

### Quick Start
```bash
# From project root
npm run test:e2e          # Run all tests
npm run test:e2e:ui       # Run with UI
npm run test:e2e:headed   # Run in headed mode
```

### Troubleshooting

**Error: ERR_CONNECTION_REFUSED**
- Ensure both servers started (check console output)
- Verify ports 3000 and 3001 are free
- Check .env.test files exist

**Error: Database connection failed**
- Start PostgreSQL service
- Verify DATABASE_URL in .env.test
- Run migrations: `npm run db:migrate:test`

**Tests timeout**
- Increase timeout in playwright.config.ts
- Check server startup logs for errors
- Verify no port conflicts
```

---

## Estimated Timeline

### Immediate Fix (1-2 hours)
- ✅ Phase 1: Environment prep (30 min)
- ✅ Phase 2: Config update (15 min)
- ✅ Phase 3: Helper improvements (20 min)
- ✅ Phase 4: Database setup (20 min)
- ✅ Phase 5: Execution (15 min)
- ✅ Phase 6: Verification (15 min)

### Follow-Up (Optional, 2-4 hours)
- Phase 7: Risk mitigation (ongoing)
- Phase 8: CI/CD setup (1-2 hours)
- Phase 9: Optimization (1-2 hours)
- Phase 10: Documentation (30 min)

---

## Success Probability

### Infrastructure Fix
**Confidence**: 99%
**Evidence**: Root cause is definitively identified in configuration

### Test Pass Rate
**Estimated**: 90-95% (203-214 of 225 tests)
**Assumptions**:
- Database properly seeded
- Test helpers function correctly
- No major test logic errors

### Remaining Failures
**Expected**: 5-10% (11-22 tests)
**Likely Causes**:
- Timing/race conditions
- Test data assumptions
- Flaky WebSocket tests
- Edge case scenarios

---

## Rollback Plan

### If Fix Causes Issues
```bash
# 1. Restore old Playwright config
cd frontend
cp playwright.config.ts.backup playwright.config.ts

# 2. Stop all servers
# Kill any hanging processes on ports 3000/3001

# 3. Revert environment changes
git checkout -- .env.test backend/.env.test frontend/.env.test

# 4. Document what went wrong
echo "Issue: [describe problem]" >> rollback-notes.txt
```

### Safe Mode Testing
```typescript
// playwright.config.ts - safe mode
export default defineConfig({
  // Only run guest navigation tests first
  testMatch: '**/01-guest-navigation.spec.ts',

  // Increased timeouts
  timeout: 120000,

  // Verbose logging
  use: {
    trace: 'on',
    video: 'on',
  },
});
```

---

## Conclusion

### Primary Recommendation
**Execute Approach 1: Modify Playwright Config**

**Rationale**:
1. Lowest complexity and risk
2. Highest impact (fixes 100% of infrastructure failures)
3. Fastest implementation (1-2 hours)
4. Maintainable long-term
5. CI/CD compatible

### Expected Outcome
- **Before**: 69/157 passing (43.9%)
- **After**: 203-214/225 passing (90-95%)
- **Improvement**: +134 to +145 tests passing

### Next Actions
1. Get user approval for plan
2. Execute Phase 1-6 systematically
3. Document results
4. Address any remaining failures
5. Optimize for parallel execution

---

**Plan Status**: READY FOR EXECUTION
**Approval Required**: YES
**Estimated Duration**: 1-2 hours
**Risk Level**: LOW
**Expected Success Rate**: 99%
