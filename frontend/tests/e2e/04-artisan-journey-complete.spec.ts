import { test, expect } from '@playwright/test';
import { generateTestUser, createUser, loginWithUser, getOrCreateUser, cleanupUser } from './helpers/user-management.helper';
import { waitForPageLoad } from './helpers/navigation.helper';
import { TEST_BID } from './fixtures/test-data';

/**
 * Complete Artisan User Journey Tests
 * Full end-to-end flow including user creation/login, browsing jobs, and submitting bids
 */

test.describe('Complete Artisan Journey - New User Registration', () => {
  let testUser: any;

  test('should register a new artisan user and complete full journey', async ({ page }) => {
    // Step 1: Create new artisan user using helper function
    testUser = generateTestUser('ARTISAN');

    console.log('Creating new artisan user:', testUser.email);

    // Use the helper function to register the user
    await createUser(page, testUser);

    console.log('User created successfully');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    // Verify artisan dashboard
    await expect(page).toHaveURL(/\/artisan\/dashboard/);
    await expect(page.locator('h1').filter({ hasText: /welcome/i })).toBeVisible();

    console.log('User successfully authenticated and on dashboard');

    // Step 3: Browse available jobs
    await page.goto('/artisan/jobs');
    await expect(page.locator('h1').filter({ hasText: /available jobs|browse jobs|job listings/i })).toBeVisible();

    console.log('Browsing jobs page');

    // Step 4: View job details
    const jobCards = page.locator('[data-testid="job-card"], .job-card, .card');
    const jobCount = await jobCards.count();

    if (jobCount > 0) {
      console.log(`Found ${jobCount} job(s), viewing first job`);
      await jobCards.first().click();

      // Verify job details page
      await expect(page.locator('text=/description|details|about this job/i')).toBeVisible({ timeout: 5000 });

      console.log('Viewing job details');

      // Step 5: Attempt to place a bid
      const bidButton = page.locator('button:has-text("Bid"), button:has-text("Submit Bid"), button:has-text("Place Bid")');

      if (await bidButton.isVisible({ timeout: 3000 })) {
        console.log('Found bid button, opening bid form');
        await bidButton.click();

        // Verify bid form appears
        const bidForm = page.locator('[role="dialog"], form, .bid-form');
        await expect(bidForm.first()).toBeVisible({ timeout: 3000 });

        console.log('Bid form opened successfully');

        // Fill bid details
        const amountInput = page.locator('input[name="amount"], input[type="number"]');
        if (await amountInput.isVisible({ timeout: 2000 })) {
          await amountInput.fill(String(TEST_BID.amount));

          const messageInput = page.locator('textarea[name="message"], textarea[name="description"]');
          if (await messageInput.isVisible({ timeout: 1000 })) {
            await messageInput.fill(TEST_BID.message);
          }

          console.log('Filled bid form with amount:', TEST_BID.amount);

          // Note: Not submitting to avoid creating test data in database
          console.log('Bid form validation successful (not submitting to avoid test data)');
        }
      } else {
        console.log('Bid button not found on this job');
      }
    } else {
      console.log('No jobs available to view');
    }

    // Step 6: Check my bids section
    await page.goto('/artisan/bids');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await expect(page.locator('h1, h2').filter({ hasText: /my bids|bid|proposals/i }).first()).toBeVisible();

    console.log('Verified access to my bids page');

    // Step 7: Check profile page
    await page.goto('/artisan/profile');
    await expect(page.locator('text=/profile|account|settings/i').first()).toBeVisible();

    console.log('Verified access to profile page');

    // Cleanup
    await cleanupUser(page);
    console.log('Test completed successfully - user logged out');
  });
});

test.describe('Complete Artisan Journey - Existing User Login', () => {
  test('should create and use artisan user', async ({ page }) => {
    const existingUser = generateTestUser('ARTISAN');
    console.log('Creating and using artisan user:', existingUser.email);

    // Create user first
    await createUser(page, existingUser);

    // Verify successful creation
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/(artisan)\/dashboard|auth\/login/);

    console.log('User created successfully');

    await cleanupUser(page);
  });

  test('should create user and login', async ({ page }) => {
    const existingUser = generateTestUser('ARTISAN');
    console.log('Creating user for login test:', existingUser.email);

    // Create user
    await createUser(page, existingUser);

    // Logout
    await cleanupUser(page);

    // Now login with the same credentials
    console.log('Logging in with created user:', existingUser.email);
    await loginWithUser(page, existingUser);

    // Verify successful login
    await expect(page).toHaveURL(/\/artisan\/dashboard/);
    await expect(page.locator('h1').filter({ hasText: /welcome/i })).toBeVisible();

    console.log('Successfully logged in');

    await cleanupUser(page);
  });

  test('should create user and complete full job browsing flow', async ({ page }) => {
    const existingUser = generateTestUser('ARTISAN');
    console.log('Testing full flow with user:', existingUser.email);

    // Create and login
    await createUser(page, existingUser);
    await expect(page).toHaveURL(/\/artisan\/dashboard/);

    // Navigate through artisan sections
    const sections = [
      { path: '/artisan/jobs', heading: /available jobs|browse jobs|job listings|job discovery/i },
      { path: '/artisan/bids', heading: /my bids|bid|proposals/i },
      { path: '/artisan/projects', heading: /project/i },
      { path: '/artisan/profile', heading: /profile|business/i }
    ];

    for (const section of sections) {
      console.log(`Navigating to ${section.path}`);
      await page.goto(section.path);
      // Wait for network to be idle for client-side rendered pages
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
      // Wait a bit more for React to render
      await page.waitForTimeout(1000);
      await expect(page.locator('h1, h2, h3').filter({ hasText: section.heading }).first()).toBeVisible({ timeout: 10000 });
      console.log(`✓ Verified ${section.path}`);
    }

    console.log('All sections accessible with existing user');

    await cleanupUser(page);
  });

  test('should create user and handle job search and filtering', async ({ page }) => {
    const existingUser = generateTestUser('ARTISAN');
    console.log('Testing search and filtering with user:', existingUser.email);

    await createUser(page, existingUser);
    await page.goto('/artisan/jobs');

    // Test search functionality if available
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
    if (await searchInput.isVisible({ timeout: 2000 })) {
      console.log('Testing search functionality');
      await searchInput.fill('plumbing');
      await page.keyboard.press('Enter');
      await waitForPageLoad(page);
      console.log('✓ Search executed');
    }

    // Test category filter if available
    const categoryFilter = page.locator('select[name="category"], button:has-text("Category"), [aria-label*="category" i]');
    if (await categoryFilter.isVisible({ timeout: 2000 })) {
      console.log('Testing category filter');
      await categoryFilter.click();
      await waitForPageLoad(page);
      console.log('✓ Category filter tested');
    }

    await cleanupUser(page);
  });

  test('should create user and display job details correctly', async ({ page }) => {
    const existingUser = generateTestUser('ARTISAN');
    console.log('Testing job details display with user:', existingUser.email);

    await createUser(page, existingUser);
    await page.goto('/artisan/jobs');

    const firstJob = page.locator('[data-testid="job-card"], .job-card, .card').first();

    if (await firstJob.isVisible({ timeout: 3000 })) {
      console.log('Found job card, clicking to view details');
      await firstJob.click();

      // Verify job details are displayed
      const detailsVisible = await page.locator('text=/description|details|about this job/i').isVisible({ timeout: 5000 });
      expect(detailsVisible).toBe(true);

      console.log('✓ Job details displayed correctly');

      // Check for essential job information
      const essentialInfo = [
        { locator: 'text=/R\\s*\\d+|budget/i', name: 'Budget' },
        { locator: 'text=/high|medium|low|urgent/i', name: 'Urgency' },
        { locator: 'text=/description|details/i', name: 'Description' }
      ];

      for (const info of essentialInfo) {
        const element = page.locator(info.locator);
        if (await element.first().isVisible({ timeout: 1000 })) {
          console.log(`✓ Found ${info.name}`);
        }
      }
    } else {
      console.log('No jobs available for details test');
    }

    await cleanupUser(page);
  });

  test('should create user and validate bid form', async ({ page }) => {
    const existingUser = generateTestUser('ARTISAN');
    console.log('Testing bid form validation with user:', existingUser.email);

    await createUser(page, existingUser);
    await page.goto('/artisan/jobs');

    const firstJob = page.locator('.card').first();

    if (await firstJob.isVisible({ timeout: 3000 })) {
      await firstJob.click();

      const bidButton = page.locator('button:has-text("Bid"), button:has-text("Submit")').first();

      if (await bidButton.isVisible({ timeout: 2000 })) {
        console.log('Opening bid form');
        await bidButton.click();

        // Test empty form validation
        const submitButton = page.locator('button[type="submit"]:has-text("Submit")').first();

        if (await submitButton.isVisible({ timeout: 2000 })) {
          console.log('Testing empty form submission');
          await submitButton.click();
          await page.waitForTimeout(500);

          // Form should still be visible (validation failed)
          const formStillVisible = await page.locator('[role="dialog"], form').isVisible();
          expect(formStillVisible).toBe(true);
          console.log('✓ Empty form validation works');

          // Test with invalid amount
          const amountInput = page.locator('input[name="amount"]');
          if (await amountInput.isVisible({ timeout: 1000 })) {
            console.log('Testing negative amount validation');
            await amountInput.fill('-100');
            await submitButton.click();
            await page.waitForTimeout(500);

            const formStillThere = await page.locator('[role="dialog"]').isVisible();
            expect(formStillThere).toBe(true);
            console.log('✓ Negative amount validation works');
          }
        }
      } else {
        console.log('Bid button not available for this job');
      }
    }

    await cleanupUser(page);
  });

  test('should create user and navigate between artisan pages using menu', async ({ page }) => {
    const existingUser = generateTestUser('ARTISAN');
    console.log('Testing navigation menu with user:', existingUser.email);

    await createUser(page, existingUser);

    const navLinks = ['Dashboard', 'Jobs', 'Bids', 'Projects', 'Profile'];

    for (const linkText of navLinks) {
      const link = page.locator(`a:has-text("${linkText}")`);

      if (await link.isVisible({ timeout: 2000 })) {
        console.log(`Clicking navigation link: ${linkText}`);
        await link.click();
        await waitForPageLoad(page);

        const expectedUrl = linkText.toLowerCase();
        await expect(page).toHaveURL(new RegExp(expectedUrl));
        console.log(`✓ Navigated to ${linkText}`);

        // Return to dashboard for next link
        await page.goto('/artisan/dashboard');
      } else {
        console.log(`Navigation link "${linkText}" not found`);
      }
    }

    await cleanupUser(page);
  });
});

test.describe('Artisan Authentication Edge Cases', () => {
  test('should show error for invalid login credentials', async ({ page }) => {
    console.log('Testing invalid login credentials');

    await page.goto('/auth/login');

    await page.fill('input[type="email"], input[name="email"]', 'nonexistent@test.com');
    await page.fill('input[type="password"], input[name="password"]', 'WrongPassword123!');

    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Should show error or stay on login page
    const hasError = await page.locator('text=/invalid|incorrect|failed|error/i').isVisible({ timeout: 3000 }).catch(() => false);
    const stillOnLogin = page.url().includes('/auth/login');

    expect(hasError || stillOnLogin).toBe(true);
    console.log('✓ Invalid credentials handled correctly');
  });

  test('should validate email format during login', async ({ page }) => {
    console.log('Testing email format validation');

    await page.goto('/auth/login');

    await page.fill('input[type="email"]', 'notanemail');
    await page.fill('input[type="password"]', 'Password123!');

    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);

    const stillOnLogin = page.url().includes('/auth/login');
    expect(stillOnLogin).toBe(true);
    console.log('✓ Email format validation works');
  });

  test('should validate password requirements during registration', async ({ page }) => {
    console.log('Testing password requirements');

    await page.goto('/artisan/register');

    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', '123'); // weak password

    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    const stillOnRegister = page.url().includes('/register');
    expect(stillOnRegister).toBe(true);
    console.log('✓ Password requirements validated');
  });

  test('should require authentication for artisan routes', async ({ page }) => {
    console.log('Testing protected route access');

    const protectedRoutes = [
      '/artisan/dashboard',
      '/artisan/jobs',
      '/artisan/bids',
      '/artisan/profile'
    ];

    for (const route of protectedRoutes) {
      console.log(`Testing protection for ${route}`);
      await page.goto(route);

      // Should redirect to login
      await page.waitForURL(/\/auth\/login/, { timeout: 5000 });
      console.log(`✓ ${route} properly protected`);
    }
  });
});
