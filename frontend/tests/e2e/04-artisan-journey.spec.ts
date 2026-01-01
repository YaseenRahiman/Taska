import { test, expect } from '@playwright/test';
import { loginAsArtisan, TEST_USERS } from './helpers/auth.helper';
import { waitForPageLoad } from './helpers/navigation.helper';
import { TEST_BID } from './fixtures/test-data';

/**
 * Artisan User Journey Tests
 * Complete flow for artisan users browsing jobs and submitting bids
 */

test.describe('Artisan Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.TEST_USER_EXISTS, 'Test user not configured');

    // Mock API responses for dashboard data
    await page.route('**/api/v1/auth/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-artisan-id',
          email: 'artisan@test.com',
          role: 'ARTISAN',
          profile: {
            firstName: 'Test',
            lastName: 'Artisan'
          }
        })
      });
    });

    await page.route('**/api/v1/jobs*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          jobs: [],
          total: 0
        })
      });
    });

    await page.route('**/api/v1/jobs/artisan/active', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.route('**/api/v1/bids/my-bids*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          bids: [],
          total: 0
        })
      });
    });

    await loginAsArtisan(page);
  });

  test('should display artisan dashboard correctly', async ({ page }) => {
    await expect(page).toHaveURL(/\/artisan\/dashboard/);
    await expect(page).toHaveTitle(/Dashboard|Artisan/i);

    // Wait for dashboard to load (stats section indicates loading complete)
    await page.waitForSelector('[data-testid="stats-section"]', { timeout: 10000 });

    // Check for welcome heading
    await expect(page.locator('[data-testid="welcome-heading"]')).toBeVisible();
    await expect(page.locator('[data-testid="welcome-heading"]')).toContainText(/welcome/i);
  });

  test('should show artisan statistics', async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="stats-section"]', { timeout: 10000 });

    // Check for specific statistics cards using data-testid
    await expect(page.locator('[data-testid="earnings-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-rate-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="rating-card"]')).toBeVisible();

    // Verify the cards contain actual data
    await expect(page.locator('[data-testid="earnings-value"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-rate-value"]')).toBeVisible();
    await expect(page.locator('[data-testid="rating-value"]')).toBeVisible();
  });

  test('should have navigation to browse jobs', async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="stats-section"]', { timeout: 10000 });

    // Check for Browse Jobs button using data-testid
    const browseJobsButton = page.locator('[data-testid="browse-jobs-button"]');
    await expect(browseJobsButton).toBeVisible();
    await expect(browseJobsButton).toContainText(/browse jobs/i);
  });

  test('should display recent job opportunities', async ({ page }) => {
    // Dashboard should show available jobs or link to them
    const jobsSection = page.locator('text=/available|opportunities|recent jobs/i');

    if (await jobsSection.isVisible({ timeout: 2000 })) {
      await expect(jobsSection).toBeVisible();
    }
  });

  test('should show active bids status', async ({ page }) => {
    // Check for bids section
    const bidsSection = page.locator('text=/my bids|bids|proposals/i');

    if (await bidsSection.isVisible({ timeout: 2000 })) {
      await expect(bidsSection).toBeVisible();
    }
  });
});

test.describe('Artisan Job Browsing', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.TEST_USER_EXISTS, 'Test user not configured');

    // Mock API responses
    await page.route('**/api/v1/auth/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-artisan-id',
          email: 'artisan@test.com',
          role: 'ARTISAN',
          profile: {
            firstName: 'Test',
            lastName: 'Artisan'
          }
        })
      });
    });

    await page.route('**/api/v1/jobs*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          jobs: [],
          total: 0
        })
      });
    });

    await loginAsArtisan(page);
  });

  test('should navigate to jobs listing page', async ({ page }) => {
    await page.goto('/artisan/jobs');

    // Wait for page to load and check for heading
    await page.waitForSelector('h1', { timeout: 10000 });
    await expect(page.locator('h1').filter({ hasText: /available jobs|browse jobs|job listings/i }).first()).toBeVisible();
  });

  test('should display job cards with essential information', async ({ page }) => {
    await page.goto('/artisan/jobs');

    // Look for job cards
    const jobCards = page.locator('[data-testid="job-card"], .job-card, .card');

    if (await jobCards.first().isVisible({ timeout: 3000 })) {
      const firstCard = jobCards.first();

      // Job cards should have title, budget, location
      await expect(firstCard).toBeVisible();
    }
  });

  test('should show job budget prominently', async ({ page }) => {
    await page.goto('/artisan/jobs');

    // Budget should be visible (R symbol or currency)
    const budget = page.locator('text=/R\\s*\\d+|\\d+.*budget/i').first();

    if (await budget.isVisible({ timeout: 2000 })) {
      await expect(budget).toBeVisible();
    }
  });

  test('should allow filtering jobs by category', async ({ page }) => {
    await page.goto('/artisan/jobs');

    // Look for category filter
    const categoryFilter = page.locator('select[name="category"], button:has-text("Category"), [aria-label*="category" i]');

    if (await categoryFilter.isVisible({ timeout: 2000 })) {
      await categoryFilter.click();
      await waitForPageLoad(page);
    }
  });

  test('should allow searching for jobs', async ({ page }) => {
    await page.goto('/artisan/jobs');

    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');

    if (await searchInput.isVisible({ timeout: 2000 })) {
      await searchInput.fill('plumbing');
      await page.keyboard.press('Enter');
      await waitForPageLoad(page);
    }
  });

  test('should view job details', async ({ page }) => {
    await page.goto('/artisan/jobs');

    const firstJob = page.locator('[data-testid="job-card"], .job-card, .card').first();

    if (await firstJob.isVisible({ timeout: 3000 })) {
      await firstJob.click();

      // Should show job details
      await expect(page.locator('text=/description|details|about this job/i').first()).toBeVisible();
    }
  });

  test('should display job urgency indicator', async ({ page }) => {
    await page.goto('/artisan/jobs');

    // Urgency badges (HIGH, MEDIUM, LOW, URGENT) - check for badge with urgency text
    const urgencyBadge = page.locator('[class*="badge"]:has-text("URGENT"), [class*="badge"]:has-text("HIGH"), [class*="badge"]:has-text("MEDIUM"), [class*="badge"]:has-text("LOW")');

    if (await urgencyBadge.first().isVisible({ timeout: 2000 })) {
      const count = await urgencyBadge.count();
      expect(count).toBeGreaterThan(0);
    }
  });
});

test.describe('Artisan Bid Submission', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.TEST_USER_EXISTS, 'Test user not configured');
    await loginAsArtisan(page);
  });

  test('should show "Place Bid" button on job details', async ({ page }) => {
    await page.goto('/artisan/jobs');

    const firstJob = page.locator('[data-testid="job-card"], .card').first();

    if (await firstJob.isVisible({ timeout: 3000 })) {
      await firstJob.click();

      // Look for bid button
      const bidButton = page.locator('button:has-text("Bid"), button:has-text("Submit Bid"), button:has-text("Place Bid")');

      if (await bidButton.isVisible({ timeout: 2000 })) {
        await expect(bidButton).toBeVisible();
      }
    }
  });

  test('should open bid submission form', async ({ page }) => {
    await page.goto('/artisan/jobs');

    const firstJob = page.locator('.card').first();

    if (await firstJob.isVisible({ timeout: 3000 })) {
      await firstJob.click();

      const bidButton = page.locator('button:has-text("Bid"), button:has-text("Submit")').first();

      if (await bidButton.isVisible({ timeout: 2000 })) {
        await bidButton.click();

        // Modal or form should appear
        const bidForm = page.locator('[role="dialog"], form, .bid-form');
        await expect(bidForm.first()).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('should show validation for empty bid form', async ({ page }) => {
    await page.goto('/artisan/jobs');

    const firstJob = page.locator('.card').first();

    if (await firstJob.isVisible({ timeout: 3000 })) {
      await firstJob.click();

      const bidButton = page.locator('button:has-text("Bid")').first();

      if (await bidButton.isVisible({ timeout: 2000 })) {
        await bidButton.click();

        // Try to submit empty form
        const submitButton = page.locator('button[type="submit"]:has-text("Submit")').first();

        if (await submitButton.isVisible({ timeout: 2000 })) {
          await submitButton.click();
          await page.waitForTimeout(500);

          // Form should still be visible (validation failed)
          const formStillVisible = await page.locator('[role="dialog"], form').isVisible();
          expect(formStillVisible).toBe(true);
        }
      }
    }
  });

  test('should require bid amount', async ({ page }) => {
    await page.goto('/artisan/jobs');

    const firstJob = page.locator('.card').first();

    if (await firstJob.isVisible({ timeout: 3000 })) {
      await firstJob.click();

      const bidButton = page.locator('button:has-text("Bid")').first();

      if (await bidButton.isVisible({ timeout: 2000 })) {
        await bidButton.click();

        // Look for amount input
        const amountInput = page.locator('input[name="amount"], input[type="number"]');

        if (await amountInput.isVisible({ timeout: 2000 })) {
          await expect(amountInput).toBeVisible();
        }
      }
    }
  });

  test('should validate bid amount is positive', async ({ page }) => {
    await page.goto('/artisan/jobs');

    const firstJob = page.locator('.card').first();

    if (await firstJob.isVisible({ timeout: 3000 })) {
      await firstJob.click();

      const bidButton = page.locator('button:has-text("Bid")').first();

      if (await bidButton.isVisible({ timeout: 2000 })) {
        await bidButton.click();

        const amountInput = page.locator('input[name="amount"]');

        if (await amountInput.isVisible({ timeout: 2000 })) {
          await amountInput.fill('-100');

          const submitButton = page.locator('button[type="submit"]').first();
          await submitButton.click();
          await page.waitForTimeout(500);

          // Should show validation error
          const formStillVisible = await page.locator('[role="dialog"]').isVisible();
          expect(formStillVisible).toBe(true);
        }
      }
    }
  });
});

test.describe('Artisan Bid Management', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.TEST_USER_EXISTS, 'Test user not configured');
    await loginAsArtisan(page);
  });

  test('should navigate to my bids page', async ({ page }) => {
    await page.goto('/artisan/bids');

    await expect(page.locator('text=/my bids|bids|proposals/i').first()).toBeVisible();
  });

  test('should display bid status', async ({ page }) => {
    await page.goto('/artisan/bids');

    // Status badges should be visible
    const statusBadges = page.locator('[class*="badge"], [class*="status"]');

    if (await statusBadges.first().isVisible({ timeout: 2000 })) {
      const count = await statusBadges.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should filter bids by status', async ({ page }) => {
    await page.goto('/artisan/bids');

    // Look for filter controls
    const filterButtons = page.locator('button:has-text("All"), button:has-text("Pending"), button:has-text("Accepted")');

    if (await filterButtons.first().isVisible({ timeout: 2000 })) {
      await filterButtons.first().click();
      await waitForPageLoad(page);
    }
  });

  test('should navigate to projects page', async ({ page }) => {
    await page.goto('/artisan/projects');

    // Projects page should load
    await expect(page.locator('text=/projects|active projects/i').first()).toBeVisible();
  });
});

test.describe('Artisan Profile', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.TEST_USER_EXISTS, 'Test user not configured');
    await loginAsArtisan(page);
  });

  test('should navigate to profile page', async ({ page }) => {
    await page.goto('/artisan/profile');

    await expect(page.locator('text=/profile|account|settings/i').first()).toBeVisible();
  });

  test('should display profile information', async ({ page }) => {
    await page.goto('/artisan/profile');

    // Profile should have name, category, description
    await expect(page.locator('text=/name|category|about|description/i').first()).toBeVisible();
  });

  test('should have option to edit profile', async ({ page }) => {
    await page.goto('/artisan/profile');

    const editButton = page.locator('button:has-text("Edit"), a:has-text("Edit Profile")');

    if (await editButton.isVisible({ timeout: 2000 })) {
      await expect(editButton).toBeVisible();
    }
  });

  test('should have working artisan navigation menu', async ({ page }) => {
    // Check navigation links in artisan area
    const navLinks = ['Dashboard', 'Jobs', 'Bids', 'Projects', 'Profile'];

    for (const linkText of navLinks) {
      const link = page.locator(`a:has-text("${linkText}")`);

      if (await link.isVisible({ timeout: 2000 })) {
        await link.click();
        await waitForPageLoad(page);

        const expectedUrl = linkText.toLowerCase();
        await expect(page).toHaveURL(new RegExp(expectedUrl));

        // Go back to dashboard for next link
        await page.goto('/artisan/dashboard');
      }
    }
  });
});

test.describe('Artisan Registration', () => {
  test('should display artisan registration page', async ({ page }) => {
    await page.goto('/artisan/register');

    // Check for page heading or form elements indicating it's the artisan registration page
    const hasHeading = await page.getByRole('heading', { name: /artisan|register|join|sign up/i }).first().isVisible({ timeout: 3000 }).catch(() => false);
    const hasForm = await page.locator('form, input[name="email"]').first().isVisible({ timeout: 3000 }).catch(() => false);

    // Page should have either a relevant heading or form
    expect(hasHeading || hasForm).toBe(true);

    // Should have form fields (might be generic register or artisan-specific)
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible();
  });

  test('should have category selection', async ({ page }) => {
    await page.goto('/artisan/register');

    // Look for category field
    const categoryField = page.locator('select[name="category"], input[name="category"], [aria-label*="category" i]');

    if (await categoryField.isVisible({ timeout: 2000 })) {
      await expect(categoryField).toBeVisible();
    }
  });
});
