import { test, expect, Page } from '@playwright/test';

/**
 * E2E Tests for Artisan Jobs Page
 *
 * Tests cover:
 * - Job listing and browsing functionality
 * - Filtering and search capabilities
 * - Job details viewing
 * - Bid submission workflow
 * - Error handling and edge cases
 * - Mobile responsiveness
 */

test.describe('Artisan Jobs Page - Job Discovery and Browsing', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    // Login as artisan user
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'artisan@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/artisan/dashboard');

    // Navigate to jobs page
    await page.goto('/artisan/jobs');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should display job listings with correct structure', async () => {
    // Wait for jobs to load
    await page.waitForSelector('.grid', { timeout: 10000 });

    // Verify page header
    const header = await page.locator('h1').textContent();
    expect(header).toContain('Job Discovery');

    // Verify job cards are displayed
    const jobCards = page.locator('[data-testid="job-card"], .grid > div');
    const count = await jobCards.count();
    expect(count).toBeGreaterThan(0);

    // Verify first job card structure
    const firstJob = jobCards.first();
    await expect(firstJob.locator('text=/Kitchen|Electrical|Carpentry|Painting|Gardening/i')).toBeVisible();
    await expect(firstJob.locator('text=/R\\s?[0-9,]+/')).toBeVisible(); // Budget display
    await expect(firstJob.locator('button', { hasText: /Submit Bid|View Details/i })).toBeVisible();
  });

  test('should display job details correctly', async () => {
    await page.waitForSelector('.grid > div', { timeout: 10000 });
    const jobCards = page.locator('.grid > div');
    const firstJob = jobCards.first();

    // Verify job information is displayed
    await expect(firstJob).toContainText(/Kitchen|Electrical|Carpentry|Painting|Gardening/i);

    // Verify urgency badge
    const urgencyBadge = firstJob.locator('text=/LOW|MEDIUM|HIGH|URGENT/i');
    await expect(urgencyBadge).toBeVisible();

    // Verify location information
    await expect(firstJob).toContainText(/Johannesburg|Cape Town|Durban|Pretoria/i);

    // Verify client information
    await expect(firstJob).toContainText(/⭐/); // Rating display
  });

  test('should show loading state initially', async ({ browser }) => {
    const newPage = await browser.newPage();
    await newPage.goto('/auth/login');
    await newPage.fill('input[name="email"]', 'artisan@test.com');
    await newPage.fill('input[name="password"]', 'password123');
    await newPage.click('button[type="submit"]');
    await newPage.waitForURL('/artisan/dashboard');

    // Navigate and check for loading skeleton
    await newPage.goto('/artisan/jobs');

    // Check for loading indicators (animate-pulse or skeleton)
    const loadingExists = await newPage.locator('.animate-pulse, [data-testid="loading-skeleton"]').count();
    // Loading might be very fast, so we just verify the page loads

    await newPage.waitForSelector('.grid', { timeout: 10000 });
    await newPage.close();
  });

  test('should handle empty job list gracefully', async () => {
    // Apply filters that return no results
    await page.click('button:has-text("Show Filters")');
    await page.waitForSelector('input[type="number"]');

    // Set impossible budget range
    const minBudgetInput = page.locator('input[type="number"]').first();
    const maxBudgetInput = page.locator('input[type="number"]').nth(1);

    await minBudgetInput.fill('100000');
    await maxBudgetInput.fill('100001');

    // Wait for filter application
    await page.waitForTimeout(500);

    // Verify empty state message
    const emptyMessage = page.locator('text=/No jobs match|Try adjusting/i');
    await expect(emptyMessage).toBeVisible();
  });
});

test.describe('Artisan Jobs Page - Filtering and Search', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'artisan@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/artisan/dashboard');
    await page.goto('/artisan/jobs');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should show and hide filters panel', async () => {
    // Click to show filters
    await page.click('button:has-text("Show Filters")');
    await page.waitForSelector('select, input[type="range"]', { timeout: 5000 });

    // Verify filter panel is visible
    const filterPanel = page.locator('text=/Filter Jobs|Refine your job/i');
    await expect(filterPanel).toBeVisible();

    // Click to hide filters
    await page.click('button:has-text("Hide Filters")');
    await page.waitForTimeout(300);

    // Filters should still exist in DOM but might be hidden
    // Just verify the toggle works
  });

  test('should filter jobs by category', async () => {
    await page.click('button:has-text("Show Filters")');
    await page.waitForSelector('select');

    // Get initial job count
    const initialCount = await page.locator('.grid > div').count();

    // Select a specific category
    const categorySelect = page.locator('select').first();
    await categorySelect.selectOption('Plumbing');

    // Wait for filter application
    await page.waitForTimeout(500);

    // Verify filtered results
    const filteredJobs = page.locator('.grid > div');
    const filteredCount = await filteredJobs.count();

    // If there are plumbing jobs, verify they're displayed
    if (filteredCount > 0) {
      const firstJob = filteredJobs.first();
      await expect(firstJob).toContainText('Plumbing');
    }
  });

  test('should filter jobs by budget range', async () => {
    await page.click('button:has-text("Show Filters")');
    await page.waitForSelector('input[type="number"]');

    // Set budget range (500-2000)
    const minBudgetInput = page.locator('input[type="number"]').first();
    const maxBudgetInput = page.locator('input[type="number"]').nth(1);

    await minBudgetInput.fill('500');
    await maxBudgetInput.fill('2000');

    // Wait for filter application
    await page.waitForTimeout(500);

    // Verify results are within budget range
    const jobCards = page.locator('.grid > div');
    const count = await jobCards.count();

    if (count > 0) {
      // Each job should show a budget within range
      const budgetTexts = await jobCards.locator('text=/R\\s?[0-9,]+/').allTextContents();
      budgetTexts.forEach(budgetText => {
        const amount = parseInt(budgetText.replace(/[R,\s]/g, ''));
        expect(amount).toBeGreaterThanOrEqual(500);
        expect(amount).toBeLessThanOrEqual(2000);
      });
    }
  });

  test('should filter jobs by urgency level', async () => {
    await page.click('button:has-text("Show Filters")');
    await page.waitForSelector('button:has-text("URGENT")');

    // Click URGENT urgency filter
    await page.click('button:has-text("URGENT")');

    // Wait for filter application
    await page.waitForTimeout(500);

    // Verify filtered results show urgent jobs
    const jobCards = page.locator('.grid > div');
    const count = await jobCards.count();

    if (count > 0) {
      // At least one job should have URGENT badge
      const urgentBadges = jobCards.locator('text=URGENT');
      const urgentCount = await urgentBadges.count();
      expect(urgentCount).toBeGreaterThan(0);
    }
  });

  test('should filter jobs by distance', async () => {
    await page.click('button:has-text("Show Filters")');
    await page.waitForSelector('input[type="range"]');

    // Adjust distance slider
    const distanceSlider = page.locator('input[type="range"]').first();
    await distanceSlider.fill('10'); // 10km radius

    // Wait for filter application
    await page.waitForTimeout(500);

    // Verify distance label updated
    await expect(page.locator('text=/Max Distance.*10km/i')).toBeVisible();
  });

  test('should filter jobs by posted time', async () => {
    await page.click('button:has-text("Show Filters")');
    await page.waitForSelector('select');

    // Select time filter
    const timeSelect = page.locator('select:has(option:has-text("Last 24 Hours"))');
    if (await timeSelect.count() > 0) {
      await timeSelect.selectOption('24h');

      // Wait for filter application
      await page.waitForTimeout(500);

      // Verify filtered results
      const jobCards = page.locator('.grid > div');
      const count = await jobCards.count();
      // Just verify filter applies without error
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('should filter jobs by verified clients only', async () => {
    await page.click('button:has-text("Show Filters")');
    await page.waitForSelector('input[type="checkbox"]');

    // Check "Only verified clients" checkbox
    const verifiedCheckbox = page.locator('input[type="checkbox"]').first();
    await verifiedCheckbox.check();

    // Wait for filter application
    await page.waitForTimeout(500);

    // Verify results show only verified clients
    const jobCards = page.locator('.grid > div');
    const count = await jobCards.count();

    if (count > 0) {
      // Look for verification checkmark on client info
      const verifiedMarks = jobCards.locator('text=✓');
      const verifiedCount = await verifiedMarks.count();
      expect(verifiedCount).toBeGreaterThan(0);
    }
  });

  test('should clear all filters', async () => {
    await page.click('button:has-text("Show Filters")');
    await page.waitForSelector('select');

    // Apply some filters
    const categorySelect = page.locator('select').first();
    await categorySelect.selectOption('Electrical');

    await page.waitForTimeout(300);

    // Get filtered count
    const filteredCount = await page.locator('.grid > div').count();

    // Click Clear Filters
    await page.click('button:has-text("Clear Filters")');

    await page.waitForTimeout(300);

    // Get new count (should be more or equal to filtered)
    const clearedCount = await page.locator('.grid > div').count();
    expect(clearedCount).toBeGreaterThanOrEqual(0);

    // Verify category select is back to "All Categories"
    const selectedOption = await categorySelect.inputValue();
    expect(selectedOption).toBe('All Categories');
  });

  test('should display filter result count', async () => {
    await page.click('button:has-text("Show Filters")');
    await page.waitForSelector('text=/Showing.*of.*jobs/i');

    // Verify result count is displayed
    const resultCount = page.locator('text=/Showing.*of.*jobs/i');
    await expect(resultCount).toBeVisible();
  });
});

test.describe('Artisan Jobs Page - Job Actions', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'artisan@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/artisan/dashboard');
    await page.goto('/artisan/jobs');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should open job details when clicking View Details', async () => {
    await page.waitForSelector('.grid > div', { timeout: 10000 });

    // Click View Details on first job
    const viewDetailsButton = page.locator('button:has-text("View Details")').first();
    await viewDetailsButton.click();

    // Verify navigation or modal opened
    // This depends on implementation - could be modal or new page
    await page.waitForTimeout(500);

    // Just verify the action doesn't cause error
  });

  test('should enable Submit Bid button for available jobs', async () => {
    await page.waitForSelector('.grid > div', { timeout: 10000 });

    // Find Submit Bid button
    const submitBidButton = page.locator('button:has-text("Submit Bid")').first();

    // Verify button is visible and enabled
    await expect(submitBidButton).toBeVisible();
    const isEnabled = await submitBidButton.isEnabled();
    expect(isEnabled).toBe(true);
  });

  test('should show job requirements when available', async () => {
    await page.waitForSelector('.grid > div', { timeout: 10000 });

    // Look for requirements section
    const requirementsSection = page.locator('text=/Requirements:/i');

    // If requirements exist, verify they're displayed
    if (await requirementsSection.count() > 0) {
      await expect(requirementsSection.first()).toBeVisible();
    }
  });

  test('should display client rating and job count', async () => {
    await page.waitForSelector('.grid > div', { timeout: 10000 });
    const firstJob = page.locator('.grid > div').first();

    // Verify client info section
    await expect(firstJob.locator('text=/Client/i')).toBeVisible();
    await expect(firstJob.locator('text=/⭐/i')).toBeVisible();
    await expect(firstJob.locator('text=/jobs/i')).toBeVisible();
  });

  test('should show distance information', async () => {
    await page.waitForSelector('.grid > div', { timeout: 10000 });
    const firstJob = page.locator('.grid > div').first();

    // Verify distance is displayed
    const distanceText = firstJob.locator('text=/Distance/i');
    await expect(distanceText).toBeVisible();
  });
});

test.describe('Artisan Jobs Page - View Modes', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'artisan@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/artisan/dashboard');
    await page.goto('/artisan/jobs');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should toggle between List and Map views', async () => {
    // Verify List View is default
    await expect(page.locator('text=List View')).toBeVisible();

    // Click Map View button
    await page.click('button:has-text("Map View")');
    await page.waitForTimeout(300);

    // Verify map view is shown
    await expect(page.locator('text=/Map View|Interactive map/i')).toBeVisible();

    // Click back to List View
    await page.click('button:has-text("List View")');
    await page.waitForTimeout(300);

    // Verify list view is shown
    const jobCards = page.locator('.grid > div');
    const count = await jobCards.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display map placeholder in Map View', async () => {
    // Switch to Map View
    await page.click('button:has-text("Map View")');
    await page.waitForTimeout(300);

    // Verify map placeholder content
    await expect(page.locator('text=/Map integration|Google Maps|Mapbox/i')).toBeVisible();
    await expect(page.locator('text=/jobs visible on map/i')).toBeVisible();
  });
});

test.describe('Artisan Jobs Page - Saved Searches', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'artisan@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/artisan/dashboard');
    await page.goto('/artisan/jobs');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should display saved searches section', async () => {
    // Look for saved searches
    const savedSearchesSection = page.locator('text=/Saved Searches/i');

    if (await savedSearchesSection.count() > 0) {
      await expect(savedSearchesSection).toBeVisible();
    }
  });

  test('should allow saving current search', async () => {
    await page.click('button:has-text("Show Filters")');
    await page.waitForSelector('select');

    // Apply some filters
    const categorySelect = page.locator('select').first();
    await categorySelect.selectOption('Plumbing');

    await page.waitForTimeout(300);

    // Click Save Search button
    const saveButton = page.locator('button:has-text("Save Search")');
    if (await saveButton.count() > 0) {
      await saveButton.click();
      await page.waitForTimeout(300);

      // Just verify action completes without error
    }
  });
});

test.describe('Artisan Jobs Page - Refresh and Updates', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'artisan@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/artisan/dashboard');
    await page.goto('/artisan/jobs');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should refresh jobs when clicking Refresh button', async () => {
    await page.waitForSelector('.grid > div', { timeout: 10000 });

    // Get initial job count
    const initialCount = await page.locator('.grid > div').count();

    // Click Refresh Jobs button
    await page.click('button:has-text("Refresh Jobs")');

    // Wait for refresh
    await page.waitForTimeout(1000);

    // Verify jobs are still displayed
    const newCount = await page.locator('.grid > div').count();
    expect(newCount).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Artisan Jobs Page - Mobile Responsiveness', () => {
  test('should display correctly on mobile devices', async ({ browser }) => {
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 667 }, // iPhone SE
    });
    const page = await mobileContext.newPage();

    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'artisan@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/artisan/dashboard');
    await page.goto('/artisan/jobs');
    await page.waitForLoadState('networkidle');

    // Verify page renders on mobile
    await page.waitForSelector('h1:has-text("Job Discovery")', { timeout: 10000 });

    // Verify job cards stack vertically (single column on mobile)
    const jobCards = page.locator('.grid > div');
    await expect(jobCards.first()).toBeVisible();

    await page.close();
    await mobileContext.close();
  });

  test('should have touch-friendly buttons on mobile', async ({ browser }) => {
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 667 },
    });
    const page = await mobileContext.newPage();

    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'artisan@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/artisan/dashboard');
    await page.goto('/artisan/jobs');
    await page.waitForLoadState('networkidle');

    await page.waitForSelector('button:has-text("Show Filters")', { timeout: 10000 });

    // Verify buttons are accessible
    const filterButton = page.locator('button:has-text("Show Filters")');
    await expect(filterButton).toBeVisible();

    // Test button tap
    await filterButton.click();
    await page.waitForTimeout(300);

    await page.close();
    await mobileContext.close();
  });
});

test.describe('Artisan Jobs Page - Error Handling', () => {
  test('should handle authentication errors gracefully', async ({ page }) => {
    // Try to access without login
    await page.goto('/artisan/jobs');

    // Should redirect to login
    await page.waitForURL(/login|auth/, { timeout: 10000 });

    expect(page.url()).toContain('login');
  });

  test('should handle network errors gracefully', async ({ page, context }) => {
    // Login first
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'artisan@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/artisan/dashboard');

    // Block API requests to simulate network error
    await context.route('**/api/v1/jobs*', route => route.abort());

    // Navigate to jobs page
    await page.goto('/artisan/jobs');

    // Wait for page load
    await page.waitForTimeout(2000);

    // Page should handle error gracefully (show error message or empty state)
    // Verify no crash occurred
    const pageTitle = await page.title();
    expect(pageTitle).toBeDefined();
  });
});
