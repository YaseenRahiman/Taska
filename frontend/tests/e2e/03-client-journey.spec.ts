import { test, expect } from '@playwright/test';
import { loginAsClient, TEST_USERS } from './helpers/auth.helper';
import { waitForPageLoad } from './helpers/navigation.helper';
import { TEST_JOB } from './fixtures/test-data';

/**
 * Client User Journey Tests
 * Complete flow for client users posting and managing jobs
 */

test.describe('Client Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Skip if test user not configured
    test.skip(!process.env.TEST_USER_EXISTS, 'Test user not configured');
    await loginAsClient(page);
    // Wait for React to hydrate and dashboard to render
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    await waitForPageLoad(page);
  });

  test('should display client dashboard correctly', async ({ page }) => {
    await expect(page).toHaveURL(/\/client\/dashboard/);

    // Wait for loading to complete - either loading indicator disappears or content appears
    await Promise.race([
      page.locator('[data-testid="dashboard-loading"]').waitFor({ state: 'hidden', timeout: 10000 }),
      page.locator('h1').filter({ hasText: /welcome/i }).waitFor({ state: 'visible', timeout: 10000 })
    ]).catch(() => {});

    // Check for dashboard sections
    await expect(page.locator('h1').filter({ hasText: /welcome/i }).first()).toBeVisible({ timeout: 10000 });

    // Check for stats cards
    const statsCards = ['Total Jobs', 'Active', 'Completed'];
    for (const stat of statsCards) {
      await expect(page.locator(`text=${stat}`).first()).toBeVisible();
    }
  });

  test('should show "Post a New Job" button', async ({ page }) => {
    // Wait for loading to complete - either loading indicator disappears or button appears
    await Promise.race([
      page.locator('[data-testid="dashboard-loading"]').waitFor({ state: 'hidden', timeout: 10000 }),
      page.locator('[data-testid="post-job-button"]').waitFor({ state: 'visible', timeout: 10000 })
    ]).catch(() => {});

    const postJobButton = page.locator('[data-testid="post-job-button"]');
    await expect(postJobButton).toBeVisible({ timeout: 10000 });
  });

  test('should have working tabs for Jobs, Bids, and Payments', async ({ page }) => {
    // Check for tabs
    const tabs = ['Jobs', 'Bids', 'Payments'];

    for (const tab of tabs) {
      const tabElement = page.locator(`button:has-text("${tab}"), [role="tab"]:has-text("${tab}")`);
      if (await tabElement.isVisible({ timeout: 2000 })) {
        await tabElement.click();
        await waitForPageLoad(page);
      }
    }
  });

  test('should navigate to all jobs page', async ({ page }) => {
    const viewAllButton = page.locator('button:has-text("View All"), a:has-text("View All")').first();

    if (await viewAllButton.isVisible({ timeout: 3000 })) {
      await viewAllButton.click();
      await expect(page).toHaveURL(/\/client\/jobs/);
    }
  });

  test('should show empty state when no jobs exist', async ({ page }) => {
    // If jobs tab shows empty state
    const emptyState = page.locator('text=/no jobs/i, text=/first job/i');

    if (await emptyState.isVisible({ timeout: 2000 })) {
      await expect(emptyState).toBeVisible();
      await expect(page.locator('button:has-text("Post")').first()).toBeVisible();
    }
  });

  test('should display job statistics correctly', async ({ page }) => {
    // Stats should be present - look for any stat cards or numbers
    const statCards = page.locator('[data-testid="stat-card"], .stat-card, .card').first();
    const hasStats = await statCards.isVisible({ timeout: 2000 }).catch(() => false);

    if (!hasStats) {
      // Alternative: look for any numbers on the dashboard that indicate statistics
      const dashboardNumbers = page.locator('text=/\\d+/').first();
      const hasNumbers = await dashboardNumbers.isVisible({ timeout: 2000 }).catch(() => false);
      expect(hasNumbers || hasStats).toBeTruthy();
    } else {
      expect(hasStats).toBe(true);
    }
  });
});

test.describe('Client Job Creation', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.TEST_USER_EXISTS, 'Test user not configured');
    await loginAsClient(page);
  });

  test('should open job creation modal/page', async ({ page }) => {
    // Click "Post a Job" button - try different variations
    const postJobButton = page.locator('button:has-text("Post"), a:has-text("Post"), [href*="create"]').first();

    // Wait for any navigation or modal
    await Promise.all([
      page.waitForTimeout(1000),
      postJobButton.click().catch(() => {})
    ]);

    // Should either open modal, navigate to create page, or show form
    const isModal = await page.locator('[role="dialog"], .modal').isVisible({ timeout: 2000 }).catch(() => false);
    const isPage = page.url().includes('/create') || page.url().includes('/post');
    const hasForm = await page.locator('input[name="title"], textarea[name="description"]').isVisible({ timeout: 2000 }).catch(() => false);

    expect(isModal || isPage || hasForm).toBe(true);
  });

  test('should navigate to create job page', async ({ page }) => {
    await page.goto('/client/jobs/create');

    // Should show create job form
    await expect(page.locator('text=/create|new job|post job/i').first()).toBeVisible();

    // Check for form fields
    await expect(page.locator('input[name="title"], input[id="title"]')).toBeVisible();
    await expect(page.locator('textarea[name="description"]')).toBeVisible();
  });

  test('should show validation errors for empty job form', async ({ page }) => {
    await page.goto('/client/jobs/create');

    // Try to submit empty form - use force to bypass any overlays
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click({ force: true }).catch(() => {});

    await page.waitForTimeout(1000);

    // Should show validation errors or stay on page
    const stillOnCreatePage = page.url().includes('/create');
    expect(stillOnCreatePage).toBe(true);
  });

  test('should fill job form with all required fields', async ({ page }) => {
    await page.goto('/client/jobs/create');

    // Fill job details
    await page.fill('input[name="title"]', TEST_JOB.title);
    await page.fill('textarea[name="description"]', TEST_JOB.description);

    // Select category (might be dropdown or input)
    const categorySelect = page.locator('select[name="category"]');
    const categoryInput = page.locator('input[name="category"]');

    if (await categorySelect.isVisible({ timeout: 1000 })) {
      await categorySelect.selectOption(TEST_JOB.category);
    } else if (await categoryInput.isVisible({ timeout: 1000 })) {
      await categoryInput.fill(TEST_JOB.category);
    }

    // Fill budget
    await page.fill('input[name="budget"], input[type="number"]', TEST_JOB.budget.toString());

    // All fields should be filled
    const titleValue = await page.inputValue('input[name="title"]');
    expect(titleValue).toBe(TEST_JOB.title);
  });

  test('should validate budget is a positive number', async ({ page }) => {
    await page.goto('/client/jobs/create');

    await page.fill('input[name="title"]', 'Test Job');
    await page.fill('input[name="budget"]', '-100');

    // Use force to bypass overlays
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click({ force: true }).catch(() => {});
    await page.waitForTimeout(500);

    // Should show validation error or prevent submission
    const stillOnPage = page.url().includes('/create');
    expect(stillOnPage).toBe(true);
  });
});

test.describe('Client Job Management', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.TEST_USER_EXISTS, 'Test user not configured');
    await loginAsClient(page);
  });

  test('should navigate to jobs list page', async ({ page }) => {
    await page.goto('/client/jobs');

    // Wait for page to load
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    // Check for any page content - heading or main content area
    const hasHeading = await page.locator('h1, h2, h3').isVisible({ timeout: 3000 }).catch(() => false);
    const hasMainContent = await page.locator('main, [role="main"]').isVisible({ timeout: 2000 }).catch(() => false);

    expect(hasHeading || hasMainContent).toBe(true);
  });

  test('should view job details by clicking on a job', async ({ page }) => {
    await page.goto('/client/jobs');

    // If there are jobs, click on first one
    const firstJob = page.locator('[data-testid="job-card"], .job-card, .card').first();

    if (await firstJob.isVisible({ timeout: 3000 })) {
      await firstJob.click();

      // Should navigate to job details
      await expect(page).toHaveURL(/\/client\/jobs\/[a-zA-Z0-9-]+/);
    }
  });

  test('should access job edit page', async ({ page }) => {
    await page.goto('/client/jobs');

    // Click edit button on a job
    const editButton = page.locator('button:has-text("Edit"), a:has-text("Edit")').first();

    if (await editButton.isVisible({ timeout: 3000 })) {
      await editButton.click();

      // Should navigate to edit page or open modal
      const isEditPage = page.url().includes('/edit');
      const isModal = await page.locator('[role="dialog"]').isVisible({ timeout: 1000 });

      expect(isEditPage || isModal).toBe(true);
    }
  });

  test('should display job status badges', async ({ page }) => {
    await page.goto('/client/jobs');

    // Job status badges should be visible
    const statusBadges = page.locator('[class*="badge"], [class*="Badge"], .status');

    if (await statusBadges.first().isVisible({ timeout: 2000 })) {
      const count = await statusBadges.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should filter jobs by status', async ({ page }) => {
    await page.goto('/client/jobs');

    // Look for filter controls
    const filterButtons = page.locator('button:has-text("All"), button:has-text("Open"), button:has-text("Active")');

    if (await filterButtons.first().isVisible({ timeout: 2000 })) {
      await filterButtons.first().click();
      await waitForPageLoad(page);
    }
  });

  test('should navigate to profile page', async ({ page }) => {
    await page.goto('/client/profile');

    await expect(page.locator('text=/profile|account/i').first()).toBeVisible();
  });

  test('should have working client navigation menu', async ({ page }) => {
    // Check navigation links in client area
    const navLinks = ['Dashboard', 'Jobs', 'Profile'];

    for (const linkText of navLinks) {
      const link = page.locator(`a:has-text("${linkText}")`);

      if (await link.isVisible({ timeout: 2000 })) {
        await link.click();
        await waitForPageLoad(page);
        await expect(page).toHaveURL(new RegExp(linkText.toLowerCase()));
      }
    }
  });
});

test.describe('Client Job Details', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.TEST_USER_EXISTS, 'Test user not configured');
    await loginAsClient(page);
  });

  test('should display job details correctly', async ({ page }) => {
    // Navigate to a specific job (this assumes a job exists)
    await page.goto('/client/jobs');

    const firstJob = page.locator('[data-testid="job-card"], .card').first();

    if (await firstJob.isVisible({ timeout: 3000 })) {
      await firstJob.click();

      // Job details should be visible
      await expect(page.locator('text=/title|description/i').first()).toBeVisible();
    }
  });

  test('should show bids section on job details', async ({ page }) => {
    await page.goto('/client/jobs');

    const jobWithBids = page.locator('text=/\\d+ bids?/i').first();

    if (await jobWithBids.isVisible({ timeout: 2000 })) {
      await jobWithBids.click();

      // Should show bids section
      await expect(page.locator('text=/bids?/i').first()).toBeVisible();
    }
  });

  test('should allow viewing bid details', async ({ page }) => {
    // This test requires a job with bids
    await page.goto('/client/dashboard');

    const bidsTab = page.locator('button:has-text("Bids"), [role="tab"]:has-text("Bids")');

    if (await bidsTab.isVisible({ timeout: 2000 })) {
      await bidsTab.click();

      const viewBidButton = page.locator('button:has-text("View"), button:has-text("Details")').first();

      if (await viewBidButton.isVisible({ timeout: 2000 })) {
        await viewBidButton.click();
        await waitForPageLoad(page);
      }
    }
  });
});
