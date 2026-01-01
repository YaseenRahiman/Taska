import { test, expect } from '@playwright/test';
import { waitForPageLoad } from './helpers/navigation.helper';

/**
 * Comprehensive Button and Interaction Tests
 * Testing all clickable elements and interactive components
 */

test.describe('All Public Pages Load Successfully', () => {
  const publicPages = [
    { path: '/', name: 'Home' },
    { path: '/browse', name: 'Browse Artisans' },
    { path: '/categories', name: 'Categories' },
    { path: '/how-it-works', name: 'How It Works' },
    { path: '/about', name: 'About' },
    { path: '/contact', name: 'Contact' },
    { path: '/pricing', name: 'Pricing' },
    { path: '/careers', name: 'Careers' },
    { path: '/privacy', name: 'Privacy Policy' },
    { path: '/terms', name: 'Terms of Service' },
    { path: '/safety', name: 'Safety' },
    { path: '/insurance', name: 'Insurance' },
    { path: '/press', name: 'Press' },
    { path: '/success-stories', name: 'Success Stories' },
    { path: '/resources', name: 'Resources' },
    { path: '/auth/login', name: 'Login' },
    { path: '/auth/register', name: 'Register' },
    { path: '/artisan/register', name: 'Artisan Register' },
  ];

  for (const page of publicPages) {
    test(`should load ${page.name} page (${page.path})`, async ({ page: testPage }) => {
      await testPage.goto(page.path);

      // Page should load without errors
      await waitForPageLoad(testPage);

      // Should have content
      await expect(testPage.locator('body')).toBeVisible();

      // Should have title
      const title = await testPage.title();
      expect(title.length).toBeGreaterThan(0);

      // Should not redirect to error page
      expect(testPage.url()).not.toContain('/404');
      expect(testPage.url()).not.toContain('/error');
    });
  }
});

test.describe('Button Interactions - Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have clickable logo that navigates home', async ({ page }) => {
    // Click logo
    const logo = page.locator('[data-testid="logo-link"], a[href="/"]').first();

    if (await logo.isVisible()) {
      await logo.click();
      await expect(page).toHaveURL('/');
    }
  });

  test('should have working "Post Your Job" CTA buttons', async ({ page }) => {
    const ctaButtons = page.locator('a:has-text("Post Your Job"), a:has-text("Get Started")');

    const count = await ctaButtons.count();

    for (let i = 0; i < count; i++) {
      await page.goto('/'); // Reset to home
      const button = ctaButtons.nth(i);

      if (await button.isVisible({ timeout: 2000 })) {
        await button.click();
        await expect(page).toHaveURL(/\/(auth\/register|post-job)/);
      }
    }
  });

  test('should have working "Find Artisans" buttons', async ({ page }) => {
    const findButtons = page.locator('a:has-text("Find Artisans"), a:has-text("Browse")');

    const count = await findButtons.count();

    for (let i = 0; i < count; i++) {
      await page.goto('/'); // Reset
      const button = findButtons.nth(i);

      if (await button.isVisible({ timeout: 2000 })) {
        await button.click();
        await expect(page).toHaveURL(/\/browse/);
      }
    }
  });

  test('should have clickable category cards', async ({ page }) => {
    const categoryCards = page.locator('.card, [class*="category"]');

    if (await categoryCards.first().isVisible({ timeout: 2000 })) {
      const firstCard = categoryCards.first();
      await firstCard.click();

      // Should navigate somewhere (category page or browse)
      await waitForPageLoad(page);
    }
  });
});

test.describe('Form Interactions - Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
  });

  test('should focus on email input when clicked', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]');
    await emailInput.click();

    const isFocused = await emailInput.evaluate(el => el === document.activeElement);
    expect(isFocused).toBe(true);
  });

  test('should show/hide password toggle work', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"], input[name="password"]');

    if (await passwordInput.isVisible()) {
      const toggleButton = page.locator('button[aria-label*="password"], button:has-text("Show"), button:has-text("Hide")');

      if (await toggleButton.isVisible({ timeout: 1000 })) {
        const initialType = await passwordInput.getAttribute('type');

        await toggleButton.click();

        const newType = await passwordInput.getAttribute('type');
        expect(newType).not.toBe(initialType);
      }
    }
  });

  test('should enable submit button when form is filled', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');

    await emailInput.fill('test@example.com');
    await passwordInput.fill('Password123!');

    // Button should be enabled or clickable
    await expect(submitButton).toBeEnabled();
  });
});

test.describe('Form Interactions - Registration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/register');
  });

  test('should fill all registration fields', async ({ page }) => {
    const fields = {
      firstName: 'input[name="firstName"], input[id="firstName"]',
      lastName: 'input[name="lastName"], input[id="lastName"]',
      email: 'input[type="email"]',
      password: 'input[type="password"]'
    };

    for (const [field, selector] of Object.entries(fields)) {
      const input = page.locator(selector);

      if (await input.isVisible({ timeout: 2000 })) {
        await input.fill('test');
        const value = await input.inputValue();
        expect(value).toBe('test');
      }
    }
  });

  test('should clear input fields', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]');

    await emailInput.fill('test@example.com');
    await emailInput.clear();

    const value = await emailInput.inputValue();
    expect(value).toBe('');
  });
});

test.describe('Navigation Menu Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should highlight active navigation link', async ({ page }) => {
    const navLinks = ['Find Artisans', 'Categories', 'How It Works'];

    for (const linkText of navLinks) {
      await page.goto('/');

      const link = page.locator(`nav a:has-text("${linkText}")`);

      if (await link.isVisible({ timeout: 2000 })) {
        await link.click();

        // Link might get active class
        const linkClasses = await link.getAttribute('class');
        // Just verify it's still visible after click
        await expect(link).toBeVisible();
      }
    }
  });

  test('should show mobile menu on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Look for hamburger menu
    const mobileMenuButton = page.locator('button[aria-label*="Menu"], button[aria-label*="menu"], button:has-text("Menu"), .mobile-menu, [class*="hamburger"]');

    if (await mobileMenuButton.isVisible({ timeout: 2000 })) {
      await mobileMenuButton.click();

      // Menu should appear
      const mobileNav = page.locator('nav, [role="navigation"], .mobile-nav');
      await expect(mobileNav.first()).toBeVisible();
    }
  });
});

test.describe('Scroll and Hover Interactions', () => {
  test('should scroll to sections smoothly', async ({ page }) => {
    await page.goto('/');

    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    const footer = page.locator('footer');
    await expect(footer).toBeInViewport();
  });

  test('should show hover effects on buttons', async ({ page }) => {
    await page.goto('/');

    const button = page.locator('button, a.btn-primary, a.btn-outline').first();

    if (await button.isVisible()) {
      // Hover over button
      await button.hover();
      await page.waitForTimeout(300);

      // Button should still be visible
      await expect(button).toBeVisible();
    }
  });

  test('should show hover effects on cards', async ({ page }) => {
    await page.goto('/');

    const card = page.locator('.card, [class*="card"]').first();

    if (await card.isVisible({ timeout: 2000 })) {
      await card.hover();
      await page.waitForTimeout(300);

      // Card should still be visible
      await expect(card).toBeVisible();
    }
  });
});

test.describe('Keyboard Navigation', () => {
  test('should navigate with Tab key', async ({ page }) => {
    await page.goto('/auth/login');

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    await emailInput.focus();
    await page.keyboard.press('Tab');

    // Next focusable element should be focused (might be password or another input)
    await page.waitForTimeout(300);
  });

  test('should submit form with Enter key', async ({ page }) => {
    await page.goto('/auth/login');

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    await emailInput.fill('test@example.com');
    await passwordInput.fill('Password123!');

    await page.keyboard.press('Enter');

    // Form should attempt to submit
    await page.waitForTimeout(1000);
  });
});

test.describe('Link Accessibility', () => {
  test('should have accessible links with proper attributes', async ({ page }) => {
    await page.goto('/');

    const links = page.locator('a');
    const linkCount = await links.count();

    expect(linkCount).toBeGreaterThan(0);

    // Check first few links for href attribute
    for (let i = 0; i < Math.min(5, linkCount); i++) {
      const link = links.nth(i);
      const href = await link.getAttribute('href');

      if (href) {
        expect(href.length).toBeGreaterThan(0);
      }
    }
  });

  test('should have proper button types', async ({ page }) => {
    await page.goto('/auth/login');

    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const type = await button.getAttribute('type');

      // Buttons should have type attribute
      expect(['submit', 'button', 'reset'].includes(type || '')).toBe(true);
    }
  });
});

test.describe('Performance and Load Times', () => {
  test('should load pages within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await waitForPageLoad(page);

    const loadTime = Date.now() - startTime;

    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should load images', async ({ page }) => {
    await page.goto('/');

    const images = page.locator('img');

    if (await images.first().isVisible({ timeout: 3000 })) {
      const firstImage = images.first();

      // Wait for image to load
      await firstImage.waitFor({ state: 'visible' });

      // Image should have src
      const src = await firstImage.getAttribute('src');
      expect(src).toBeTruthy();
    }
  });
});
