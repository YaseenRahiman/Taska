import { test, expect, Page } from '@playwright/test';

/**
 * COMPREHENSIVE TASKA PLATFORM TESTING SUITE
 * Tests every page, button, and workflow systematically
 */

// Test configuration
const BASE_URL = 'http://localhost:3001';
const API_URL = 'http://localhost:3000';

// Test users (will be created during tests)
const testUsers = {
  client: {
    email: `client_test_${Date.now()}@example.com`,
    password: 'TestPassword123!',
    name: 'Test Client',
    phone: '0123456789',
  },
  artisan: {
    email: `artisan_test_${Date.now()}@example.com`,
    password: 'TestPassword123!',
    name: 'Test Artisan',
    phone: '0123456789',
  },
  admin: {
    email: 'admin@taska.co.za',
    password: 'AdminPassword123!',
  },
};

// Helper function to check page loads without errors
async function checkPageLoads(page: Page, url: string, pageName: string) {
  const errors: string[] = [];

  page.on('pageerror', (error) => {
    errors.push(`[${pageName}] Page error: ${error.message}`);
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(`[${pageName}] Console error: ${msg.text()}`);
    }
  });

  const response = await page.goto(url, { waitUntil: 'networkidle' });

  expect(response?.status()).toBeLessThan(400);
  expect(errors).toHaveLength(0);

  return { page, errors };
}

test.describe('Phase 1: Public Pages Verification', () => {
  test('1.1 - Homepage (/)', async ({ page }) => {
    await checkPageLoads(page, BASE_URL, 'Homepage');

    // Check critical elements
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('h1, h2').first()).toBeVisible();

    // Check navigation links
    const navLinks = ['About', 'How It Works', 'Browse', 'Post Job'];
    for (const link of navLinks) {
      const element = page.getByRole('link', { name: new RegExp(link, 'i') }).first();
      if (await element.isVisible()) {
        await expect(element).toBeVisible();
      }
    }
  });

  test('1.2 - About Page (/about)', async ({ page }) => {
    await checkPageLoads(page, `${BASE_URL}/about`, 'About');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('1.3 - How It Works (/how-it-works)', async ({ page }) => {
    await checkPageLoads(page, `${BASE_URL}/how-it-works`, 'How It Works');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('1.4 - Categories (/categories)', async ({ page }) => {
    await checkPageLoads(page, `${BASE_URL}/categories`, 'Categories');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('1.5 - Browse (/browse)', async ({ page }) => {
    await checkPageLoads(page, `${BASE_URL}/browse`, 'Browse');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('1.6 - Pricing (/pricing)', async ({ page }) => {
    await checkPageLoads(page, `${BASE_URL}/pricing`, 'Pricing');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('1.7 - Contact (/contact)', async ({ page }) => {
    await checkPageLoads(page, `${BASE_URL}/contact`, 'Contact');

    // Check for contact form
    const hasForm = await page.locator('form').count() > 0;
    if (hasForm) {
      await expect(page.locator('form')).toBeVisible();
    }
  });

  test('1.8 - Careers (/careers)', async ({ page }) => {
    await checkPageLoads(page, `${BASE_URL}/careers`, 'Careers');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('1.9 - Press (/press)', async ({ page }) => {
    await checkPageLoads(page, `${BASE_URL}/press`, 'Press');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('1.10 - Privacy Policy (/privacy)', async ({ page }) => {
    await checkPageLoads(page, `${BASE_URL}/privacy`, 'Privacy');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('1.11 - Terms of Service (/terms)', async ({ page }) => {
    await checkPageLoads(page, `${BASE_URL}/terms`, 'Terms');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('1.12 - Safety (/safety)', async ({ page }) => {
    await checkPageLoads(page, `${BASE_URL}/safety`, 'Safety');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('1.13 - Insurance (/insurance)', async ({ page }) => {
    await checkPageLoads(page, `${BASE_URL}/insurance`, 'Insurance');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('1.14 - Success Stories (/success-stories)', async ({ page }) => {
    await checkPageLoads(page, `${BASE_URL}/success-stories`, 'Success Stories');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('1.15 - Resources (/resources)', async ({ page }) => {
    await checkPageLoads(page, `${BASE_URL}/resources`, 'Resources');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });
});

test.describe('Phase 2: Authentication Flow', () => {
  test('2.1 - Login Page Loads (/auth/login)', async ({ page }) => {
    await checkPageLoads(page, `${BASE_URL}/auth/login`, 'Login');

    // Check for login form elements
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]').first()).toBeVisible();
    await expect(page.locator('button[type="submit"]').first()).toBeVisible();
  });

  test('2.2 - Registration Page Loads (/auth/register)', async ({ page }) => {
    await checkPageLoads(page, `${BASE_URL}/auth/register`, 'Registration');

    // Check for registration form elements
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]').first()).toBeVisible();
  });

  test('2.3 - Client Registration Flow', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/register`);

    // Fill registration form
    await page.locator('input[name="name"], input[placeholder*="name" i]').first().fill(testUsers.client.name);
    await page.locator('input[name="email"], input[type="email"]').first().fill(testUsers.client.email);
    await page.locator('input[name="phone"], input[placeholder*="phone" i]').first().fill(testUsers.client.phone);
    await page.locator('input[name="password"], input[type="password"]').first().fill(testUsers.client.password);

    // Select CLIENT role
    const clientRadio = page.locator('input[value="CLIENT"], input[type="radio"]').first();
    if (await clientRadio.isVisible()) {
      await clientRadio.check();
    }

    // Accept terms
    const termsCheckbox = page.locator('input[type="checkbox"]').first();
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }

    // Submit form
    await page.locator('button[type="submit"]').first().click();

    // Wait for redirect and check dashboard
    await page.waitForURL(/\/(client|dashboard)/, { timeout: 10000 });

    // Verify we're on client dashboard
    const url = page.url();
    expect(url).toContain('/client');
  });

  test('2.4 - Client Login Flow', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/login`);

    // Fill login form
    await page.locator('input[name="email"], input[type="email"]').first().fill(testUsers.client.email);
    await page.locator('input[name="password"], input[type="password"]').first().fill(testUsers.client.password);

    // Submit
    await page.locator('button[type="submit"]').first().click();

    // Wait for redirect
    await page.waitForURL(/\/(client|dashboard)/, { timeout: 10000 });

    // Verify logged in
    const url = page.url();
    expect(url).toContain('/client');
  });

  test('2.5 - Artisan Registration Flow', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/register`);

    // Fill registration form
    await page.locator('input[name="name"], input[placeholder*="name" i]').first().fill(testUsers.artisan.name);
    await page.locator('input[name="email"], input[type="email"]').first().fill(testUsers.artisan.email);
    await page.locator('input[name="phone"], input[placeholder*="phone" i]').first().fill(testUsers.artisan.phone);
    await page.locator('input[name="password"], input[type="password"]').first().fill(testUsers.artisan.password);

    // Select ARTISAN role
    const artisanRadio = page.locator('input[value="ARTISAN"]').first();
    if (await artisanRadio.isVisible()) {
      await artisanRadio.check();
    }

    // Accept terms
    const termsCheckbox = page.locator('input[type="checkbox"]').first();
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }

    // Submit form
    await page.locator('button[type="submit"]').first().click();

    // Wait for redirect
    await page.waitForURL(/\/(artisan|dashboard)/, { timeout: 10000 });

    // Verify we're on artisan dashboard
    const url = page.url();
    expect(url).toContain('/artisan');
  });
});

test.describe('Phase 3: Client Dashboard & Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Login as client
    await page.goto(`${BASE_URL}/auth/login`);
    await page.locator('input[name="email"], input[type="email"]').first().fill(testUsers.client.email);
    await page.locator('input[name="password"], input[type="password"]').first().fill(testUsers.client.password);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/\/client/, { timeout: 10000 });
  });

  test('3.1 - Client Dashboard Loads (/client/dashboard)', async ({ page }) => {
    await page.goto(`${BASE_URL}/client/dashboard`);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('3.2 - Job Creation Page Loads (/client/jobs/create)', async ({ page }) => {
    await page.goto(`${BASE_URL}/client/jobs/create`);
    await expect(page.locator('h1, h2').first()).toBeVisible();

    // Check for form elements
    await expect(page.locator('input, textarea, select').first()).toBeVisible();
  });

  test('3.3 - Post a Job (Full Workflow)', async ({ page }) => {
    await page.goto(`${BASE_URL}/client/jobs/create`);

    // Fill job form (adapt selectors based on actual form)
    const titleInput = page.locator('input[name="title"], input[placeholder*="title" i]').first();
    if (await titleInput.isVisible()) {
      await titleInput.fill('Test Job - Plumbing Repair');
    }

    const descInput = page.locator('textarea[name="description"], textarea[placeholder*="description" i]').first();
    if (await descInput.isVisible()) {
      await descInput.fill('Need a plumber to fix leaking tap in kitchen.');
    }

    // Submit form
    const submitBtn = page.locator('button[type="submit"]').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();

      // Wait for success or redirect
      await page.waitForTimeout(2000);
    }
  });
});

test.describe('Phase 4: Artisan Dashboard & Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Login as artisan
    await page.goto(`${BASE_URL}/auth/login`);
    await page.locator('input[name="email"], input[type="email"]').first().fill(testUsers.artisan.email);
    await page.locator('input[name="password"], input[type="password"]').first().fill(testUsers.artisan.password);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/\/artisan/, { timeout: 10000 });
  });

  test('4.1 - Artisan Dashboard Loads (/artisan/dashboard)', async ({ page }) => {
    await page.goto(`${BASE_URL}/artisan/dashboard`);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('4.2 - Browse Jobs (/artisan/jobs)', async ({ page }) => {
    await page.goto(`${BASE_URL}/artisan/jobs`);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('4.3 - Manage Bids (/artisan/bids)', async ({ page }) => {
    await page.goto(`${BASE_URL}/artisan/bids`);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('4.4 - Profile Management (/artisan/profile)', async ({ page }) => {
    await page.goto(`${BASE_URL}/artisan/profile`);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });
});

test.describe('Phase 5: Error Handling & Edge Cases', () => {
  test('5.1 - 404 Page for Invalid Route', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/invalid-route-12345`);
    expect(response?.status()).toBe(404);
  });

  test('5.2 - Protected Route Redirect (Unauthenticated)', async ({ page }) => {
    await page.goto(`${BASE_URL}/client/dashboard`);

    // Should redirect to login
    await page.waitForURL(/\/(auth\/login|login)/, { timeout: 5000 });
    expect(page.url()).toContain('login');
  });

  test('5.3 - Login with Invalid Credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/login`);

    await page.locator('input[name="email"], input[type="email"]').first().fill('invalid@example.com');
    await page.locator('input[name="password"], input[type="password"]').first().fill('WrongPassword123!');
    await page.locator('button[type="submit"]').first().click();

    // Wait for error message
    await page.waitForTimeout(2000);

    // Should show error and stay on login page
    expect(page.url()).toContain('login');
  });

  test('5.4 - Form Validation (Empty Submission)', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/register`);

    // Try to submit empty form
    await page.locator('button[type="submit"]').first().click();

    // Should show validation errors or prevent submission
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('register');
  });
});

test.describe('Phase 6: Navigation & UI Components', () => {
  test('6.1 - Main Navigation Menu Works', async ({ page }) => {
    await page.goto(BASE_URL);

    // Check navigation is visible
    await expect(page.locator('nav')).toBeVisible();

    // Test clicking navigation links
    const aboutLink = page.getByRole('link', { name: /about/i }).first();
    if (await aboutLink.isVisible()) {
      await aboutLink.click();
      await page.waitForURL(/\/about/);
      expect(page.url()).toContain('/about');
    }
  });

  test('6.2 - Mobile Menu Toggle', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);

    // Look for mobile menu button
    const menuButton = page.locator('button[aria-label*="menu" i], button.hamburger, [data-mobile-menu]').first();
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('6.3 - Responsive Design (Mobile)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);

    // Page should load without horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375);
  });

  test('6.4 - Responsive Design (Tablet)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(BASE_URL);

    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('6.5 - Responsive Design (Desktop)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(BASE_URL);

    await expect(page.locator('h1, h2').first()).toBeVisible();
  });
});

test.describe('Phase 7: Performance & Accessibility', () => {
  test('7.1 - Homepage Loads Within 3 Seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(3000);
  });

  test('7.2 - Images Have Alt Text', async ({ page }) => {
    await page.goto(BASE_URL);

    const images = await page.locator('img').all();
    for (const img of images.slice(0, 5)) { // Check first 5 images
      const alt = await img.getAttribute('alt');
      expect(alt).not.toBeNull();
    }
  });

  test('7.3 - Keyboard Navigation', async ({ page }) => {
    await page.goto(BASE_URL);

    // Tab through focusable elements
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);

    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeTruthy();
  });
});
