import { test, expect } from '@playwright/test';
import { navigateTo, clickLinkAndVerify, waitForPageLoad } from './helpers/navigation.helper';
import { NAVIGATION_LINKS } from './fixtures/test-data';

/**
 * Guest/Visitor Navigation Tests
 * Tests for unauthenticated users browsing the platform
 */

test.describe('Guest Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load home page successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/Taska|Home/i);

    // Check for main hero section
    await expect(page.locator('h1').first()).toContainText(/Connect with.*Skilled Artisans/i);

    // Check for CTA buttons - use first() to handle multiple matches
    await expect(page.locator('a:has-text("Post Your Job")').first()).toBeVisible();
    await expect(page.locator('a:has-text("Find Artisans")').first()).toBeVisible();
  });

  test('should have working navigation menu', async ({ page }) => {
    // Test main navigation links
    const navLinks = [
      { text: 'Find Artisans', urlPattern: /browse/ },
      { text: 'Categories', urlPattern: /categories/ },
      { text: 'How It Works', urlPattern: /how-it-works/ },
      { text: 'About', urlPattern: /about/ }
    ];

    for (const link of navLinks) {
      await page.goto('/');
      // Use nav scope to avoid footer links
      await page.locator(`nav a:has-text("${link.text}")`).first().click();
      await expect(page).toHaveURL(link.urlPattern);
      await waitForPageLoad(page);
    }
  });

  test('should navigate to authentication pages', async ({ page }) => {
    // Test Sign In link - scope to nav to avoid footer duplicates
    await page.locator('nav a:has-text("Sign In")').first().click();
    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.locator('h1').first()).toContainText(/Welcome back|Sign in|Login/i);

    // Go back and test Get Started / Register
    await page.goto('/');
    await page.locator('nav a:has-text("Get Started")').first().click();
    await expect(page).toHaveURL(/\/auth\/(register|login)/);
  });

  test('should display all popular categories', async ({ page }) => {
    // Check for category cards on homepage - use heading role within main section
    const categories = ['Plumbing', 'Electrical', 'Carpentry', 'Painting'];

    for (const category of categories) {
      // Use more specific selector - h3 headings in category cards
      const categoryHeading = page.locator('section').filter({ hasText: 'Popular Services' })
        .locator(`h3:has-text("${category}")`);
      await expect(categoryHeading).toBeVisible();
    }
  });

  test('should have working footer links', async ({ page }) => {
    // Test footer navigation
    const footerLinks = [
      { text: 'About', url: /about/ },
      { text: 'Contact', url: /contact/ },
      { text: 'Privacy', url: /privacy/ },
      { text: 'Terms', url: /terms/ }
    ];

    for (const link of footerLinks) {
      await page.goto('/');

      // Scroll to footer
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

      // Click footer link
      await page.locator('footer').locator(`a:has-text("${link.text}")`).click();
      await expect(page).toHaveURL(link.url);
    }
  });

  test('should display "How It Works" section', async ({ page }) => {
    // Check for the 3-step process - use heading role to be specific
    await expect(page.getByRole('heading', { name: /How.*Works/i }).first()).toBeVisible();

    const steps = ['Post Your Job', 'Receive Quotes', 'Choose'];
    for (const step of steps) {
      await expect(page.locator(`text=${step}`).first()).toBeVisible();
    }
  });

  test('should have working CTA buttons in hero section', async ({ page }) => {
    // Test primary CTA
    const primaryCTA = page.locator('a:has-text("Post Your Job"), a:has-text("Get Started")').first();
    await primaryCTA.click();
    await expect(page).toHaveURL(/\/(auth\/register|post-job)/);

    // Go back and test secondary CTA
    await page.goto('/');
    const secondaryCTA = page.locator('a:has-text("Find Artisans"), a:has-text("Browse")').first();
    await secondaryCTA.click();
    await expect(page).toHaveURL(/\/browse/);
  });

  test('should navigate to pricing page', async ({ page }) => {
    // Try from nav menu first
    const pricingNav = page.locator('nav a:has-text("Pricing")');
    if (await pricingNav.isVisible({ timeout: 2000 })) {
      await pricingNav.click();
    } else {
      // Try from footer
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.locator('footer a:has-text("Pricing")').click();
    }

    await expect(page).toHaveURL(/\/pricing/);
  });

  test('should load categories page', async ({ page }) => {
    // Click Categories in nav, not footer
    await page.locator('nav a:has-text("Categories")').first().click();
    await expect(page).toHaveURL(/\/categories/);

    // Check for page heading specifically
    await expect(page.locator('h1').filter({ hasText: /Service Categories/i })).toBeVisible();
  });

  test('should load how it works page with details', async ({ page }) => {
    // Click nav link specifically
    await page.locator('nav a:has-text("How It Works")').first().click();
    await expect(page).toHaveURL(/\/how-it-works/);

    // Wait for content to load
    await waitForPageLoad(page);

    // Check for main h1 heading specifically
    await expect(page.locator('h1').filter({ hasText: /How Taska Works/i })).toBeVisible();
  });

  test('should have responsive navigation', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Wait for page to load
    await waitForPageLoad(page);

    // Check if mobile menu button exists
    const mobileMenuButton = page.locator('button[aria-label*="menu" i], button[aria-label*="Menu"], [data-testid="mobile-menu"], .mobile-menu-button');

    // Navigation should be either visible or behind mobile menu
    const navLink = page.locator('nav a:has-text("Find Artisans")').first();
    const isNavVisible = await navLink.isVisible().catch(() => false);
    const hasMobileMenu = await mobileMenuButton.count() > 0;

    // Either nav is visible OR there's a mobile menu button
    expect(isNavVisible || hasMobileMenu).toBeTruthy();
  });

  test('should not have console errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await waitForPageLoad(page);

    // Log all errors for debugging
    if (consoleErrors.length > 0) {
      console.log('Console errors found:', consoleErrors);
    }

    // Allow certain known errors (like API calls without auth, hydration warnings, script redirects, etc)
    const criticalErrors = consoleErrors.filter(error =>
      !error.includes('401') &&
      !error.includes('authentication') &&
      !error.includes('Hydration') &&
      !error.includes('hydration') &&
      !error.includes('Warning:') &&
      !error.toLowerCase().includes('favicon') &&
      !error.includes('Failed to load resource') &&
      !error.includes('net::ERR') &&
      !error.includes('script resource is behind a redirect') &&
      !error.includes('disallowed')
    );

    expect(criticalErrors.length).toBe(0);
  });

  test('should load browse artisans page', async ({ page }) => {
    await page.locator('a:has-text("Find Artisans")').first().click();
    await expect(page).toHaveURL(/\/browse/);

    // Should have search or filter capabilities
    await waitForPageLoad(page);
  });

  test('should load about page with content', async ({ page }) => {
    // Click About in nav specifically
    await page.locator('nav a:has-text("About")').first().click();
    await expect(page).toHaveURL(/\/about/);

    // Wait for content to load
    await waitForPageLoad(page);

    // Check for main h1 heading
    await expect(page.locator('h1').first()).toBeVisible();

    // Verify there's actual content (multiple sections)
    const headingCount = await page.locator('h1, h2').count();
    expect(headingCount).toBeGreaterThan(0);
  });

  test('should load contact page', async ({ page }) => {
    const contactLink = page.locator('a:has-text("Contact")').first();
    await contactLink.click();
    await expect(page).toHaveURL(/\/contact/);
  });
});
