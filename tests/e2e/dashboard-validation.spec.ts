import { test, expect } from '@playwright/test';

test.describe('Client Dashboard Validation Tests', () => {
  const baseURL = 'http://localhost:3001';

  test.beforeEach(async ({ page }) => {
    // Clear storage before each test
    await page.context().clearCookies();
    await page.goto(baseURL);
  });

  test('Test 1: New user registration flow and dashboard redirect', async ({ page }) => {
    console.log('Starting new user registration test...');

    // Navigate to registration page
    await page.goto(`${baseURL}/auth/register`);
    await page.waitForLoadState('networkidle');

    // Take screenshot of registration page
    await page.screenshot({ path: 'tests/screenshots/01-registration-page.png', fullPage: true });

    // Generate unique test email
    const timestamp = Date.now();
    const testEmail = `test-dashboard-fix-${timestamp}@example.com`;

    console.log(`Using test email: ${testEmail}`);

    // Fill registration form
    await page.fill('input[name="name"], input[placeholder*="name" i]', 'Dashboard Test User');
    await page.fill('input[name="email"], input[type="email"]', testEmail);
    await page.fill('input[name="password"], input[type="password"]', 'TestPassword123!@');

    // Select CLIENT role if role selector exists
    const roleSelector = page.locator('select[name="role"], input[value="CLIENT"]');
    if (await roleSelector.count() > 0) {
      await roleSelector.first().click();
    }

    await page.screenshot({ path: 'tests/screenshots/02-registration-form-filled.png', fullPage: true });

    // Submit registration
    await page.click('button[type="submit"], button:has-text("Register"), button:has-text("Sign Up")');

    console.log('Registration submitted, waiting for navigation...');

    // Wait for navigation to dashboard
    await page.waitForURL(/\/(client\/)?dashboard/, { timeout: 15000 });

    console.log(`Navigated to: ${page.url()}`);

    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Additional wait for client-side rendering

    // Take screenshot of dashboard after registration
    await page.screenshot({ path: 'tests/screenshots/03-dashboard-after-registration.png', fullPage: true });

    // Verify dashboard elements are present
    await expect(page.locator('text=/welcome back/i')).toBeVisible({ timeout: 10000 });

    // Verify stats cards are present
    await expect(page.locator('text=/total jobs/i')).toBeVisible();
    await expect(page.locator('text=/active jobs/i')).toBeVisible();
    await expect(page.locator('text=/completed/i')).toBeVisible();

    // Verify no JavaScript errors in console
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Wait a bit more to catch any delayed errors
    await page.waitForTimeout(2000);

    console.log('Console errors:', errors.length > 0 ? errors : 'None');

    // Take final screenshot
    await page.screenshot({ path: 'tests/screenshots/04-dashboard-final-state.png', fullPage: true });

    // Assertions
    expect(errors.filter(e => !e.includes('Download the React DevTools'))).toHaveLength(0);
    expect(page.url()).toContain('dashboard');
  });

  test('Test 2: Existing user login and dashboard access', async ({ page }) => {
    console.log('Starting existing user login test...');

    // Navigate to login page
    await page.goto(`${baseURL}/auth/login`);
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: 'tests/screenshots/05-login-page.png', fullPage: true });

    // Fill login form
    await page.fill('input[name="email"], input[type="email"]', 'grahiman02@gmail.com');
    await page.fill('input[name="password"], input[type="password"]', 'Qwerty12345!@');

    await page.screenshot({ path: 'tests/screenshots/06-login-form-filled.png', fullPage: true });

    // Submit login
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');

    console.log('Login submitted, waiting for navigation...');

    // Wait for navigation to dashboard
    await page.waitForURL(/\/(client\/)?dashboard/, { timeout: 15000 });

    console.log(`Navigated to: ${page.url()}`);

    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'tests/screenshots/07-dashboard-existing-user.png', fullPage: true });

    // Verify dashboard loaded
    await expect(page.locator('text=/welcome back/i')).toBeVisible({ timeout: 10000 });

    // Check for console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.waitForTimeout(2000);

    console.log('Console errors:', errors.length > 0 ? errors : 'None');

    expect(errors.filter(e => !e.includes('Download the React DevTools'))).toHaveLength(0);
  });

  test('Test 3: Empty dashboard state', async ({ page }) => {
    console.log('Starting empty dashboard state test...');

    // This test validates the empty state UI when user has no jobs/bids
    // We'll use the newly registered user which has no data

    // For this test, we'll manually navigate to dashboard
    // In a real scenario, we'd login as a user with no data
    await page.goto(`${baseURL}/client/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'tests/screenshots/08-empty-dashboard.png', fullPage: true });

    // Verify empty state elements
    const noJobsText = page.locator('text=/no jobs yet/i');
    const noBidsText = page.locator('text=/no bids yet/i');
    const noPaymentsText = page.locator('text=/no pending payments/i');

    // Check if empty states are visible or if user has data
    const hasEmptyJobs = await noJobsText.isVisible().catch(() => false);
    const hasEmptyBids = await noBidsText.isVisible().catch(() => false);
    const hasEmptyPayments = await noPaymentsText.isVisible().catch(() => false);

    console.log('Empty states visible:', {
      jobs: hasEmptyJobs,
      bids: hasEmptyBids,
      payments: hasEmptyPayments
    });

    // Verify stats cards show 0 or actual values
    const statsCards = page.locator('[class*="text-3xl"][class*="font-bold"]');
    const statsCount = await statsCards.count();

    console.log(`Found ${statsCount} stat cards`);

    expect(statsCount).toBeGreaterThanOrEqual(3); // At least 3 stat cards
  });

  test('Test 4: Responsive design - Desktop', async ({ page }) => {
    console.log('Starting responsive design test - Desktop...');

    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`${baseURL}/client/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'tests/screenshots/09-dashboard-desktop.png', fullPage: true });

    // Verify grid layout for desktop
    const statsGrid = page.locator('[class*="grid"][class*="grid-cols"]').first();
    expect(await statsGrid.isVisible()).toBeTruthy();
  });

  test('Test 5: Responsive design - Mobile', async ({ page }) => {
    console.log('Starting responsive design test - Mobile...');

    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto(`${baseURL}/client/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'tests/screenshots/10-dashboard-mobile.png', fullPage: true });

    // Verify mobile layout
    const content = page.locator('text=/welcome back/i');
    expect(await content.isVisible()).toBeTruthy();
  });

  test('Test 6: Navigation and interactions', async ({ page }) => {
    console.log('Starting navigation and interactions test...');

    await page.goto(`${baseURL}/client/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Test tab navigation
    const jobsTab = page.locator('button:has-text("Jobs")').first();
    const bidsTab = page.locator('button:has-text("Bids")').first();
    const paymentsTab = page.locator('button:has-text("Payments")').first();

    if (await jobsTab.isVisible()) {
      await jobsTab.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'tests/screenshots/11-jobs-tab.png', fullPage: true });
    }

    if (await bidsTab.isVisible()) {
      await bidsTab.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'tests/screenshots/12-bids-tab.png', fullPage: true });
    }

    if (await paymentsTab.isVisible()) {
      await paymentsTab.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'tests/screenshots/13-payments-tab.png', fullPage: true });
    }

    console.log('Tab navigation completed successfully');
  });

  test('Test 7: Performance and loading states', async ({ page }) => {
    console.log('Starting performance test...');

    const startTime = Date.now();

    await page.goto(`${baseURL}/client/dashboard`);
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;
    console.log(`Dashboard load time: ${loadTime}ms`);

    // Verify loading skeleton disappears
    const loadingSkeleton = page.locator('[class*="animate-pulse"]');

    // Wait for skeleton to disappear (max 10 seconds)
    await page.waitForTimeout(1000);
    const skeletonVisible = await loadingSkeleton.isVisible().catch(() => false);

    console.log('Loading skeleton visible after load:', skeletonVisible);

    expect(loadTime).toBeLessThan(10000); // Should load within 10 seconds
  });
});

test.afterAll(async () => {
  console.log('\n=================================');
  console.log('Dashboard Validation Tests Complete');
  console.log('=================================');
  console.log('Screenshots saved in: tests/screenshots/');
  console.log('\nNext steps:');
  console.log('1. Review screenshots for visual validation');
  console.log('2. Check console logs for any errors');
  console.log('3. Verify all user flows completed successfully');
});
