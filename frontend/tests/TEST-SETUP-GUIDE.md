# Taska Platform - E2E Test Setup Guide

Complete guide for setting up, configuring, and running E2E tests for the Taska platform.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Test User Setup](#test-user-setup)
- [Running Tests](#running-tests)
- [Troubleshooting](#troubleshooting)
- [Advanced Configuration](#advanced-configuration)

## Prerequisites

### Required Services
1. **Backend API** - Must be running on `http://localhost:3000`
2. **Frontend Dev Server** - Must be running on `http://localhost:3001`
3. **Database** - PostgreSQL with schema migrated

### Required Tools
- Node.js 18 or higher
- npm or yarn
- Playwright browsers installed

## Initial Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
npx playwright install chromium --with-deps
```

### 2. Environment Configuration

Create `.env.test` in the `frontend` directory:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1

# Frontend Configuration
FRONTEND_URL=http://localhost:3001

# Test Configuration
TEST_USER_EXISTS=false  # Set to true after creating test users
```

### 3. Start Required Services

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Wait for both services to be fully running before proceeding.

## Test User Setup

### Option 1: Automatic Setup (Recommended)

The global setup script will automatically create test users when tests run:

```bash
npm run test:e2e
```

Test users will be created:
- **Client**: `client@test.com` / `TestPassword123!`
- **Artisan**: `artisan@test.com` / `TestPassword123!`
- **Admin**: `admin@test.com` / `AdminPassword123!`

### Option 2: Manual Setup via Backend Seed

```bash
cd backend
npm run seed  # Seeds database with demo data including test users
```

### Option 3: Manual API Registration

Use the auth helper to create users programmatically:

```typescript
import { setupTestUser } from './tests/e2e/helpers/auth.helper';

// In your setup script
await setupTestUser('client');
await setupTestUser('artisan');
await setupTestUser('admin');
```

## Running Tests

### Quick Start

```bash
# Run all tests (headless)
npm run test:e2e

# Run tests with browser visible
npm run test:e2e:headed

# Run tests in UI mode (recommended for development)
npm run test:e2e:ui

# Run specific test suite
npx playwright test 02-authentication

# Run single test file
npx playwright test tests/e2e/02-authentication.spec.ts
```

### Test Execution Modes

#### 1. Headless Mode (CI/CD)
```bash
npm run test:e2e
```
- Fastest execution
- No browser window
- Best for CI/CD pipelines

#### 2. Headed Mode (Debugging)
```bash
npm run test:e2e:headed
```
- Shows browser window
- Watch tests execute
- Useful for debugging

#### 3. UI Mode (Development)
```bash
npm run test:e2e:ui
```
- Interactive test runner
- Time travel debugging
- Inspect DOM at each step
- Recommended for test development

#### 4. Debug Mode
```bash
npm run test:e2e:debug
```
- Opens Playwright Inspector
- Step through tests
- Evaluate selectors
- Generate code

### Test Organization

Tests are organized by user journey:

```
tests/e2e/
├── 01-guest-navigation.spec.ts      # Public pages, no auth (17 tests)
├── 02-authentication.spec.ts        # Login, register, auth flows (18 tests)
├── 03-client-journey.spec.ts        # Client user journey (25+ tests)
├── 04-artisan-journey.spec.ts       # Artisan user journey (22+ tests)
├── 05-admin-journey.spec.ts         # Admin operations (20+ tests)
└── 06-comprehensive-interactions.spec.ts  # All interactions (30+ tests)
```

### Running Specific Test Suites

```bash
# Guest navigation only (no auth required)
npx playwright test 01-guest-navigation

# Authentication tests
npx playwright test 02-authentication

# Client journey (requires test user)
npx playwright test 03-client-journey

# Artisan journey (requires test user)
npx playwright test 04-artisan-journey

# Admin tests (requires admin user)
npx playwright test 05-admin-journey

# Comprehensive interaction tests
npx playwright test 06-comprehensive-interactions
```

## Test Reports

### View HTML Report

After running tests:

```bash
npm run test:e2e:report
```

This opens an interactive HTML report with:
- Test results and timings
- Screenshots of failures
- Video recordings
- Trace files for debugging

### Report Locations

```
frontend/
├── playwright-report/          # HTML reports
├── test-results/              # Test artifacts
│   ├── screenshots/          # Failure screenshots
│   ├── videos/              # Test recordings
│   └── traces/              # Debugging traces
```

## Troubleshooting

### Common Issues

#### 1. Backend Not Running

**Error:**
```
Error: API login failed: connect ECONNREFUSED 127.0.0.1:3000
```

**Solution:**
```bash
cd backend
npm run start:dev
```

Wait for: `Application is running on: http://localhost:3000`

#### 2. Frontend Not Running

**Error:**
```
Navigation timeout of 30000ms exceeded
```

**Solution:**
```bash
cd frontend
npm run dev
```

Wait for: `- ready started server on 0.0.0.0:3001`

#### 3. Test Users Don't Exist

**Error:**
```
API login failed: Invalid credentials
```

**Solution A - Use Auto-Setup:**
```bash
# Tests will create users automatically
npm run test:e2e
```

**Solution B - Manual Creation:**
```bash
cd backend
npm run seed
```

#### 4. Database Not Migrated

**Error:**
```
PrismaClientKnownRequestError: Table 'User' does not exist
```

**Solution:**
```bash
cd backend
npx prisma migrate dev
npx prisma generate
npm run seed
```

#### 5. Playwright Browsers Not Installed

**Error:**
```
browserType.launch: Executable doesn't exist
```

**Solution:**
```bash
npx playwright install chromium --with-deps
```

#### 6. Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solution:**
```bash
# Find and kill process
# Windows:
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:3001 | xargs kill -9
```

### Debugging Failed Tests

#### 1. Check Screenshots

Failed tests automatically capture screenshots:
```
test-results/screenshots/login-failed-<timestamp>.png
```

#### 2. View Trace Files

```bash
npx playwright show-trace test-results/<test-name>/trace.zip
```

#### 3. Enable Debug Logging

```bash
DEBUG=pw:api npm run test:e2e
```

#### 4. Run Single Test

```bash
npx playwright test --grep "should login successfully"
```

#### 5. Use UI Mode

```bash
npm run test:e2e:ui
```
- Select failed test
- Click "Pick Locator" to inspect elements
- View console logs and network requests

## Advanced Configuration

### Custom Test Environment

Create `playwright.config.local.ts`:

```typescript
import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config';

export default defineConfig({
  ...baseConfig,
  use: {
    ...baseConfig.use,
    baseURL: 'http://localhost:3002',  // Custom port
    trace: 'on',  // Always capture traces
    video: 'on',  // Always record videos
  },
  workers: 1,  // Run tests serially
  retries: 2,  // Retry failed tests twice
});
```

Run with custom config:
```bash
npx playwright test --config=playwright.config.local.ts
```

### API Mocking

For tests that don't require real backend:

```typescript
import { test, expect } from '@playwright/test';

test('mock API response', async ({ page }) => {
  // Intercept and mock API calls
  await page.route('**/api/v1/jobs', route => {
    route.fulfill({
      status: 200,
      body: JSON.stringify({ data: [], pagination: { total: 0 } })
    });
  });

  await page.goto('/client/dashboard');
  // Test with mocked data
});
```

### Parallel Execution

```typescript
// playwright.config.ts
export default defineConfig({
  workers: process.env.CI ? 1 : undefined,  // Parallel locally, serial in CI
  fullyParallel: true,
});
```

### Custom Fixtures

Create reusable test fixtures:

```typescript
// tests/e2e/fixtures/authenticated.ts
import { test as base } from '@playwright/test';
import { loginAsClient } from '../helpers/auth.helper';

export const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    await loginAsClient(page, true);  // Use API login
    await use(page);
  },
});

// Usage:
test('view dashboard', async ({ authenticatedPage }) => {
  await expect(authenticatedPage).toHaveURL(/\/client\/dashboard/);
});
```

### CI/CD Integration

#### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: taska_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install Backend Dependencies
        run: |
          cd backend
          npm ci

      - name: Setup Database
        run: |
          cd backend
          npx prisma migrate deploy
          npm run seed

      - name: Start Backend
        run: |
          cd backend
          npm run start:dev &
          sleep 10

      - name: Install Frontend Dependencies
        run: |
          cd frontend
          npm ci

      - name: Install Playwright
        run: |
          cd frontend
          npx playwright install --with-deps

      - name: Run E2E Tests
        run: |
          cd frontend
          npm run test:e2e

      - name: Upload Test Results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: frontend/playwright-report/
```

## Performance Optimization

### Speed Up Tests

1. **Use API Authentication**
   ```typescript
   // Instead of UI login:
   await loginViaAPI(page, credentials);
   ```

2. **Reuse Browser Contexts**
   ```typescript
   // In global setup, save authenticated state
   await context.storageState({ path: 'auth.json' });

   // In tests, reuse state
   const context = await browser.newContext({ storageState: 'auth.json' });
   ```

3. **Run Tests in Parallel**
   ```typescript
   test.describe.configure({ mode: 'parallel' });
   ```

4. **Skip Unnecessary Waits**
   ```typescript
   // Don't always wait for networkidle
   await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
   ```

## Best Practices

### 1. Use Data Test IDs

```typescript
// Add to components:
<button data-testid="submit-job">Post Job</button>

// Use in tests:
await page.click('[data-testid="submit-job"]');
```

### 2. Create Helper Functions

```typescript
// Reusable helpers in helpers/ directory
export async function createJob(page, jobData) {
  await navigateTo(page, '/client/jobs/create');
  await fillForm(page, jobData);
  await clickButton(page, 'Post Job');
}
```

### 3. Use Page Object Model

```typescript
// pages/JobPostPage.ts
export class JobPostPage {
  constructor(private page: Page) {}

  async fillTitle(title: string) {
    await this.page.fill('[name="title"]', title);
  }

  async submit() {
    await this.page.click('button[type="submit"]');
  }
}
```

### 4. Handle Flaky Tests

```typescript
// Retry flaky tests
test.describe('flaky suite', () => {
  test.describe.configure({ retries: 2 });

  test('sometimes fails', async ({ page }) => {
    // Test code
  });
});
```

### 5. Clean Up Test Data

```typescript
test.afterEach(async ({ page }) => {
  // Clean up created test data
  await clearTestData(page);
});
```

## Resources

### Documentation
- [Playwright Docs](https://playwright.dev)
- [Test Helper API](./e2e/helpers/README.md)
- [Test Fixtures](./e2e/fixtures/README.md)

### Support
- Check existing tests for examples
- Review helper functions for reusable utilities
- See troubleshooting section for common issues

## Summary

**Quick Start Checklist:**
- [ ] Backend running on port 3000
- [ ] Frontend running on port 3001
- [ ] Database migrated and seeded
- [ ] Playwright installed
- [ ] Test users created
- [ ] Run `npm run test:e2e:ui` for interactive testing

**Need Help?**
1. Check troubleshooting section
2. Review test logs and screenshots
3. Use UI mode for debugging
4. Check helper function documentation
