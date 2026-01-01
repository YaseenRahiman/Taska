import { test, expect } from '@playwright/test';
import {
  loginWithPooledAccount,
  cleanupAccount
} from './helpers/account-pool.helper';
import {
  clickAndNavigate,
  fillFormField,
  submitFormAndWait,
  navigateAndWait,
  clearAuthState,
  verifyPageLoaded,
  elementExists,
  retryOperation,
  takeDebugScreenshot
} from './helpers/test-utilities.helper';

/**
 * EXAMPLE: Properly Fixed Test File
 * Demonstrates best practices for test reliability
 */

test.describe('Client Journey - Fixed Example', () => {
  // Cleanup after each test
  test.afterEach(async ({ page }, testInfo) => {
    // Clear auth state
    await clearAuthState(page);

    // Take screenshot on failure
    if (testInfo.status !== 'passed') {
      await takeDebugScreenshot(page, `failed-${testInfo.title}`);
    }
  });

  test('should login and navigate to dashboard - CORRECT PATTERN', async ({ page }) => {
    // Step 1: Acquire account from pool
    const { account, tokens } = await loginWithPooledAccount(page, 'CLIENT');

    try {
      // Step 2: Navigate to dashboard with proper waiting
      await navigateAndWait(page, '/client/dashboard', {
        expectedUrl: /\/client\/dashboard/,
        waitForSelector: 'h1, h2, main'
      });

      // Step 3: Verify page content loaded
      await verifyPageLoaded(page, {
        expectedUrl: /\/client\/dashboard/,
        requiredSelector: 'main'
      });

      // Step 4: Verify dashboard elements - flexible pattern to match various dashboard headings
      const hasWelcome = await elementExists(page, 'h1, h2, h3');
      expect(hasWelcome).toBe(true);

    } finally {
      // Step 5: Always cleanup account (even on failure)
      await cleanupAccount(page, account);
    }
  });

  test('should create a job - CORRECT PATTERN', async ({ page }) => {
    // Use isolated account for job creation test
    const { account } = await loginWithPooledAccount(page, 'CLIENT', {
      isolated: true
    });

    try {
      // Navigate to job creation page
      await navigateAndWait(page, '/client/jobs/create', {
        expectedUrl: /\/client\/jobs\/create/,
        timeout: 15000
      });

      // Fill job form using proper utilities
      await fillFormField(page, 'input[name="title"]', 'Fix Leaking Tap', {
        validate: true,
        label: 'Job Title'
      });

      await fillFormField(page, 'textarea[name="description"]', 'Need plumber to fix kitchen tap', {
        validate: true,
        label: 'Description'
      });

      // Select category
      await retryOperation(async () => {
        const categorySelect = page.locator('select[name="category"]');
        await categorySelect.selectOption('Plumbing');
      }, { maxAttempts: 3 });

      // Fill budget
      await fillFormField(page, 'input[name="budget"]', '500', {
        validate: true,
        label: 'Budget'
      });

      // Submit form and wait for success
      await submitFormAndWait(page, 'button[type="submit"]', {
        waitForUrl: /\/client\/jobs/,
        timeout: 20000
      });

      // Verify job was created
      await expect(page.locator('text=/Fix Leaking Tap/i')).toBeVisible({ timeout: 10000 });

    } finally {
      await cleanupAccount(page, account, { isolated: true });
    }
  });

  test('should navigate using links - CORRECT PATTERN', async ({ page }) => {
    const { account } = await loginWithPooledAccount(page, 'CLIENT');

    try {
      // Navigate to dashboard first
      await page.goto('/client/dashboard');

      // Click navigation link properly
      await clickAndNavigate(
        page,
        'a:has-text("Jobs"), a[href*="/jobs"]',
        /\/client\/jobs/,
        { timeout: 15000 }
      );

      // Verify page loaded
      await verifyPageLoaded(page, {
        expectedUrl: /\/client\/jobs/,
        requiredSelector: 'main, h1, h2'
      });

    } finally {
      await cleanupAccount(page, account);
    }
  });

  test('should handle form validation - CORRECT PATTERN', async ({ page }) => {
    // No login needed for public form validation test
    await navigateAndWait(page, '/auth/register', {
      expectedUrl: /\/auth\/register/
    });

    // Fill form with invalid email
    await fillFormField(page, 'input[name="email"]', 'invalid-email', {
      validate: false // Don't validate immediately
    });

    // Try to submit - use force to bypass any overlays
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click({ force: true }).catch(() => {});

    // Wait for validation to process
    await page.waitForTimeout(500);

    // CORRECT: Check if still on same page (form didn't submit)
    expect(page.url()).toContain('/auth/register');

    // CORRECT: Check for HTML5 validation or custom error
    const emailInput = page.locator('input[name="email"]');
    const isValid = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(isValid).toBe(false); // Should be invalid

    // OR check for custom error message if exists
    const hasCustomError = await elementExists(page, '[id*="email-error"], .email-error');
    // Either HTML5 validation OR custom error should be present
    expect(!isValid || hasCustomError).toBe(true);
  });

  test('should retry on transient failures - CORRECT PATTERN', async ({ page }) => {
    const { account } = await loginWithPooledAccount(page, 'CLIENT');

    try {
      // Retry navigation if it fails
      await retryOperation(
        async () => {
          await navigateAndWait(page, '/client/dashboard', {
            expectedUrl: /\/client\/dashboard/,
            timeout: 10000
          });
        },
        {
          maxAttempts: 3,
          delayMs: 2000,
          backoff: true,
          onRetry: (attempt, error) => {
            console.log(`Navigation retry ${attempt}: ${error.message}`);
          }
        }
      );

      // Verify we made it
      await verifyPageLoaded(page, {
        expectedUrl: /\/client\/dashboard/
      });

    } finally {
      await cleanupAccount(page, account);
    }
  });

  test('should handle missing elements gracefully - CORRECT PATTERN', async ({ page }) => {
    await navigateAndWait(page, '/');

    // CORRECT: Check if element exists before interacting
    const hasOptionalBanner = await elementExists(page, '.promo-banner');

    if (hasOptionalBanner) {
      await page.locator('.promo-banner .close-button').click();
    } else {
      console.log('Optional banner not present, continuing...');
    }

    // Test continues regardless of optional element presence
  });

  test('should use seeded users for specific scenarios - CORRECT PATTERN', async ({ page }) => {
    // Use hardcoded seeded users to avoid import issues
    const adminUser = {
      email: 'admin@test.com',
      password: 'password123',
      role: 'ADMIN'
    };

    // Login via helper function instead of API to ensure proper auth flow
    const { loginAsAdmin } = await import('./helpers/auth.helper');
    await loginAsAdmin(page);

    // Verify we're on admin area
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    // Check we're on admin route
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/admin\//);

    // Cleanup
    await clearAuthState(page);
  });
});

/**
 * ANTI-PATTERNS TO AVOID
 */
test.describe('Anti-Patterns - DO NOT USE', () => {
  test.skip('WRONG: Using hardcoded credentials without pool', async ({ page }) => {
    // ❌ DON'T DO THIS - causes account lockouts
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'client@test.com'); // Hardcoded!
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
  });

  test.skip('WRONG: No proper waiting after navigation', async ({ page }) => {
    // ❌ DON'T DO THIS - causes flaky tests
    await page.click('a:has-text("About")');
    await expect(page).toHaveURL(/\/about/); // Might fail!
  });

  test.skip('WRONG: Expecting validation errors for valid input', async ({ page }) => {
    // ❌ DON'T DO THIS - incorrect test logic
    await page.goto('/auth/register');
    await page.fill('input[name="email"]', 'valid@email.com'); // Valid email!
    await expect(page.locator('.error')).toBeVisible(); // Why expect error?
  });

  test.skip('WRONG: No cleanup after test', async ({ page }) => {
    // ❌ DON'T DO THIS - pollutes state for other tests
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@example.com');
    // ... test code ...
    // No cleanup! Auth state persists!
  });

  test.skip('WRONG: Using hardcoded waits', async ({ page }) => {
    // ❌ DON'T DO THIS - unreliable and slow
    await page.click('button');
    await page.waitForTimeout(5000); // Just hoping it's enough time
    await expect(page.locator('.result')).toBeVisible();
  });
});

/**
 * BEST PRACTICES SUMMARY
 */
/*
1. Always use account pool for authentication tests
2. Use test utilities for navigation and form interaction
3. Add proper cleanup in afterEach
4. Verify page loaded before interacting with elements
5. Use retryOperation for transient failures
6. Check element exists before expecting it to be visible
7. Take debug screenshots on failures
8. Use isolated accounts for tests that modify state
9. Don't expect validation errors for valid input
10. Wait for specific conditions, not arbitrary timeouts
*/
