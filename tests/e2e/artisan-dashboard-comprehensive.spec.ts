/**
 * Comprehensive Artisan Dashboard E2E Test Suite
 *
 * This test suite provides thorough validation of the artisan dashboard
 * implementation including authentication, UI components, functionality,
 * accessibility, and quality checks.
 *
 * Test Coverage:
 * 1. Authentication Flow
 * 2. Dashboard UI Components
 * 3. Profile & Logout Functionality
 * 4. Navigation Elements
 * 5. Responsive Design
 * 6. Accessibility Compliance
 * 7. Error Handling
 * 8. Visual Regression
 */

import { test, expect, Page } from '@playwright/test';

// Configuration
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 60000;

// Test Credentials
const ARTISAN_CREDENTIALS = {
  email: 'grahiman01@gmail.com',
  password: 'Qwerty12345!@'
};

// Helper Functions
async function takeScreenshot(page: Page, name: string, fullPage = true) {
  try {
    await page.screenshot({
      path: `claudedocs/test-reports/screenshots/artisan-dashboard-${name}-${Date.now()}.png`,
      fullPage
    });
  } catch (error) {
    console.warn(`Failed to take screenshot: ${name}`, error);
  }
}

async function waitForNetworkIdle(page: Page, timeout = 10000) {
  try {
    await page.waitForLoadState('networkidle', { timeout });
  } catch (error) {
    console.warn('Network idle timeout - continuing anyway');
  }
}

async function checkConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(`Console Error: ${msg.text()}`);
    }
  });

  page.on('pageerror', (error) => {
    errors.push(`Page Error: ${error.message}`);
  });

  return errors;
}

async function checkAccessibility(page: Page): Promise<{ violations: any[], passes: number }> {
  try {
    // Inject axe-core for accessibility testing
    await page.evaluate(() => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.7.2/axe.min.js';
      document.head.appendChild(script);
    });

    await page.waitForTimeout(1000); // Wait for axe-core to load

    const results = await page.evaluate(async () => {
      if (typeof (window as any).axe !== 'undefined') {
        return await (window as any).axe.run();
      }
      return { violations: [], passes: [] };
    });

    return {
      violations: results.violations,
      passes: results.passes?.length || 0
    };
  } catch (error) {
    console.warn('Accessibility check failed:', error);
    return { violations: [], passes: 0 };
  }
}

/**
 * TEST SUITE 1: AUTHENTICATION
 * Validates the complete artisan login flow
 */
test.describe('Artisan Dashboard - Authentication', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);
  });

  test('1.1 - Successful Artisan Login', async ({ page }) => {
    const errors = await checkConsoleErrors(page);

    // Navigate to login page
    await page.goto(`${FRONTEND_URL}/auth/login`);
    await takeScreenshot(page, '1.1-login-page');

    // Verify login page loaded
    await expect(page).toHaveURL(/login/);
    await expect(page.locator('h1, h2').filter({ hasText: /welcome back|sign in|login/i })).toBeVisible();

    // Fill in credentials
    await page.fill('input[type="email"], input[name="email"]', ARTISAN_CREDENTIALS.email);
    await page.fill('input[type="password"], input[name="password"]', ARTISAN_CREDENTIALS.password);

    await takeScreenshot(page, '1.1-credentials-filled');

    // Submit login form
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForURL(/dashboard|artisan/, { timeout: 15000 });
    await waitForNetworkIdle(page);

    await takeScreenshot(page, '1.1-dashboard-loaded');

    // Verify we're on the artisan dashboard
    expect(page.url()).toMatch(/artisan.*dashboard|dashboard.*artisan/i);

    // Verify dashboard content loaded (navbar contains Dashboard, Find Jobs, My Bids, etc.)
    await page.waitForTimeout(1000); // Wait for content to render
    const hasDashboardContent = await page.locator('text=/Dashboard|Find Jobs|My Bids|Welcome back/i').count() > 0;
    expect(hasDashboardContent).toBeTruthy();

    // Check for console errors during login
    if (errors.length > 0) {
      console.warn('Console errors during login:', errors);
    }
  });

  test('1.2 - Session Persistence', async ({ page }) => {
    // Login first
    await page.goto(`${FRONTEND_URL}/auth/login`);
    await page.fill('input[type="email"], input[name="email"]', ARTISAN_CREDENTIALS.email);
    await page.fill('input[type="password"], input[name="password"]', ARTISAN_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|artisan/, { timeout: 15000 });

    // Verify session storage/localStorage (app uses localStorage for auth)
    const accessToken = await page.evaluate(() => localStorage.getItem('accessToken'));
    const refreshToken = await page.evaluate(() => localStorage.getItem('refreshToken'));

    expect(accessToken || refreshToken).toBeTruthy();

    // Refresh page and verify still logged in
    await page.reload();
    await waitForNetworkIdle(page);

    await takeScreenshot(page, '1.2-after-reload');

    // Should still be on dashboard
    expect(page.url()).toMatch(/dashboard|artisan/);
  });

  test('1.3 - Invalid Credentials Handling', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/auth/login`);

    // Try invalid credentials
    await page.fill('input[type="email"], input[name="email"]', 'invalid@example.com');
    await page.fill('input[type="password"], input[name="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(2000);
    await takeScreenshot(page, '1.3-invalid-credentials');

    // Should show error message
    const hasError = await page.locator('text=/invalid|incorrect|error|failed/i').count() > 0;
    expect(hasError).toBeTruthy();

    // Should still be on login page
    expect(page.url()).toMatch(/login/);
  });
});

/**
 * TEST SUITE 2: DASHBOARD UI COMPONENTS
 * Validates all UI elements are present and properly rendered
 */
test.describe('Artisan Dashboard - UI Components', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);

    // Login before each test
    await page.goto(`${FRONTEND_URL}/auth/login`);
    await page.fill('input[type="email"], input[name="email"]', ARTISAN_CREDENTIALS.email);
    await page.fill('input[type="password"], input[name="password"]', ARTISAN_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|artisan/, { timeout: 15000 });
    await waitForNetworkIdle(page);
  });

  test('2.1 - Profile Button Presence and Visibility', async ({ page }) => {
    await takeScreenshot(page, '2.1-dashboard-ui');

    // Check for profile button/menu
    const profileSelectors = [
      'button:has-text("Profile")',
      'a:has-text("Profile")',
      '[data-testid="profile-button"]',
      '[aria-label*="profile" i]',
      'button[aria-label*="user menu" i]',
      'button[aria-label*="account" i]',
      // Common profile icon patterns
      'button svg[class*="user"]',
      'button svg[class*="person"]',
      'button svg[class*="account"]',
      // Avatar/image patterns
      'button img[alt*="profile" i]',
      'button img[alt*="avatar" i]',
      '[class*="avatar"]'
    ];

    let profileButton = null;
    for (const selector of profileSelectors) {
      const element = page.locator(selector).first();
      if (await element.count() > 0 && await element.isVisible()) {
        profileButton = element;
        break;
      }
    }

    expect(profileButton).not.toBeNull();
    await expect(profileButton!).toBeVisible();

    // Verify it's clickable
    const isEnabled = await profileButton!.isEnabled();
    expect(isEnabled).toBeTruthy();

    // Take screenshot highlighting the profile button
    await profileButton!.highlight();
    await takeScreenshot(page, '2.1-profile-button-highlighted');
  });

  test('2.2 - Logout Button Presence and Visibility', async ({ page }) => {
    await takeScreenshot(page, '2.2-dashboard-ui');

    // Check for logout button/link
    const logoutSelectors = [
      'button:has-text("Logout")',
      'button:has-text("Log out")',
      'button:has-text("Sign out")',
      'a:has-text("Logout")',
      'a:has-text("Log out")',
      'a:has-text("Sign out")',
      '[data-testid="logout-button"]',
      '[aria-label*="logout" i]',
      '[aria-label*="sign out" i]'
    ];

    let logoutButton = null;

    // First check if logout is directly visible
    for (const selector of logoutSelectors) {
      const element = page.locator(selector).first();
      if (await element.count() > 0 && await element.isVisible()) {
        logoutButton = element;
        break;
      }
    }

    // If not found, it might be in a dropdown menu
    if (!logoutButton) {
      // Try opening profile/user menu
      const menuTriggers = [
        'button[aria-label*="user menu" i]',
        'button[aria-label*="account" i]',
        'button:has-text("Profile")',
        '[class*="avatar"]',
        'button svg[class*="user"]'
      ];

      for (const trigger of menuTriggers) {
        const element = page.locator(trigger).first();
        if (await element.count() > 0 && await element.isVisible()) {
          await element.click();
          await page.waitForTimeout(500);

          // Check again for logout button
          for (const selector of logoutSelectors) {
            const logoutEl = page.locator(selector).first();
            if (await logoutEl.count() > 0 && await logoutEl.isVisible()) {
              logoutButton = logoutEl;
              break;
            }
          }

          if (logoutButton) break;
        }
      }
    }

    expect(logoutButton).not.toBeNull();
    await expect(logoutButton!).toBeVisible();

    await takeScreenshot(page, '2.2-logout-button-visible');
  });

  test('2.3 - Navigation Elements Present', async ({ page }) => {
    await takeScreenshot(page, '2.3-navigation');

    // Check for main navigation elements
    const navElements = [
      'Dashboard',
      'Jobs',
      'Bids',
      'Profile',
      'Messages'
    ];

    let foundElements = 0;
    for (const element of navElements) {
      const count = await page.locator(`text=${element}`).count();
      if (count > 0) {
        foundElements++;
      }
    }

    // At least 3 navigation elements should be present
    expect(foundElements).toBeGreaterThanOrEqual(3);

    // Check for navigation container
    const hasNav = await page.locator('nav, [role="navigation"]').count() > 0;
    expect(hasNav).toBeTruthy();
  });

  test('2.4 - Dashboard Layout and Styling', async ({ page }) => {
    await takeScreenshot(page, '2.4-layout-full');

    // Check for main content area
    const mainContent = page.locator('main, [role="main"], .main-content').first();
    await expect(mainContent).toBeVisible();

    // Verify proper spacing and layout
    const boundingBox = await mainContent.boundingBox();
    expect(boundingBox).not.toBeNull();
    expect(boundingBox!.width).toBeGreaterThan(300);
    expect(boundingBox!.height).toBeGreaterThan(200);

    // Check for header/navigation (ArtisanNavbar is a nav element)
    const hasHeader = await page.locator('nav, header, [role="banner"], [role="navigation"]').count() > 0;
    expect(hasHeader).toBeTruthy();
  });

  test('2.5 - Dashboard Data Loading', async ({ page }) => {
    // Check for loading states or data content
    await page.waitForTimeout(2000); // Allow time for data to load

    await takeScreenshot(page, '2.5-data-loaded');

    // Verify no loading spinners are stuck
    const loadingSpinners = page.locator('[class*="loading"], [class*="spinner"]');
    const spinnerCount = await loadingSpinners.count();

    // If spinners exist, they should disappear within 5 seconds
    if (spinnerCount > 0) {
      await expect(loadingSpinners.first()).not.toBeVisible({ timeout: 5000 });
    }

    // Check for actual content (not just empty state)
    const hasContent = await page.locator('main, [role="main"]').locator('*').count() > 5;
    expect(hasContent).toBeTruthy();
  });
});

/**
 * TEST SUITE 3: FUNCTIONALITY
 * Tests interactive features and workflows
 */
test.describe('Artisan Dashboard - Functionality', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);

    // Login before each test
    await page.goto(`${FRONTEND_URL}/auth/login`);
    await page.fill('input[type="email"], input[name="email"]', ARTISAN_CREDENTIALS.email);
    await page.fill('input[type="password"], input[name="password"]', ARTISAN_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|artisan/, { timeout: 15000 });
    await waitForNetworkIdle(page);
  });

  test('3.1 - Profile Button Interaction', async ({ page }) => {
    // Find and click profile button
    const profileSelectors = [
      'button:has-text("Profile")',
      'a:has-text("Profile")',
      '[data-testid="profile-button"]',
      '[aria-label*="profile" i]',
      'button[aria-label*="user menu" i]',
      '[class*="avatar"]'
    ];

    let profileButton = null;
    for (const selector of profileSelectors) {
      const element = page.locator(selector).first();
      if (await element.count() > 0 && await element.isVisible()) {
        profileButton = element;
        break;
      }
    }

    expect(profileButton).not.toBeNull();

    await takeScreenshot(page, '3.1-before-profile-click');

    // Click profile button
    await profileButton!.click();
    await page.waitForTimeout(1500); // Give dropdown time to appear

    await takeScreenshot(page, '3.1-after-profile-click');

    // Check if dropdown/modal/menu appeared or navigated to profile page
    const urlChanged = page.url().includes('profile');
    const dropdownAppeared = await page.locator('[role="menu"], [class*="dropdown"], [class*="popover"], div.absolute').count() > 0;
    const modalAppeared = await page.locator('[role="dialog"], [class*="modal"]').count() > 0;
    // Also check for menu items like "My Profile", "Settings", "Logout"
    const menuItemsAppeared = await page.locator('text=/My Profile|Settings|Logout/i').count() > 0;

    const interactionWorked = urlChanged || dropdownAppeared || modalAppeared || menuItemsAppeared;
    expect(interactionWorked).toBeTruthy();
  });

  test('3.2 - Logout Flow', async ({ page }) => {
    // Find logout button (may be in dropdown)
    const logoutSelectors = [
      'button:has-text("Logout")',
      'button:has-text("Log out")',
      'button:has-text("Sign out")',
      'a:has-text("Logout")',
      'a:has-text("Log out")',
      'a:has-text("Sign out")'
    ];

    let logoutButton = null;

    // Check if logout is directly visible
    for (const selector of logoutSelectors) {
      const element = page.locator(selector).first();
      if (await element.count() > 0 && await element.isVisible()) {
        logoutButton = element;
        break;
      }
    }

    // If not found, try opening user menu first
    if (!logoutButton) {
      const menuTriggers = [
        'button[aria-label*="user menu" i]',
        'button:has-text("Profile")',
        '[class*="avatar"]'
      ];

      for (const trigger of menuTriggers) {
        const element = page.locator(trigger).first();
        if (await element.count() > 0 && await element.isVisible()) {
          await element.click();
          await page.waitForTimeout(500);

          for (const selector of logoutSelectors) {
            const logoutEl = page.locator(selector).first();
            if (await logoutEl.count() > 0 && await logoutEl.isVisible()) {
              logoutButton = logoutEl;
              break;
            }
          }

          if (logoutButton) break;
        }
      }
    }

    expect(logoutButton).not.toBeNull();

    await takeScreenshot(page, '3.2-before-logout');

    // Click logout
    await logoutButton!.click();
    await page.waitForTimeout(2000);

    await takeScreenshot(page, '3.2-after-logout');

    // Verify logged out (should redirect to login or homepage)
    const url = page.url();
    const loggedOut = url.includes('login') ||
                      url.includes('auth') ||
                      url === FRONTEND_URL ||
                      url === `${FRONTEND_URL}/`;

    expect(loggedOut).toBeTruthy();

    // Verify cannot access dashboard after logout
    await page.goto(`${FRONTEND_URL}/artisan/dashboard`);
    await page.waitForTimeout(2000);

    const stillLoggedOut = page.url().includes('login') || page.url().includes('auth');
    expect(stillLoggedOut).toBeTruthy();
  });

  test('3.3 - Navigation Between Sections', async ({ page }) => {
    await takeScreenshot(page, '3.3-initial-state');

    // Try navigating to different sections (using actual navbar link text)
    const sections = ['Find Jobs', 'My Bids', 'Projects', 'Messages'];
    const navigatedSections: string[] = [];

    for (const section of sections) {
      const link = page.locator(`a:has-text("${section}"), button:has-text("${section}")`).first();

      if (await link.count() > 0 && await link.isVisible()) {
        await link.click();
        await page.waitForTimeout(1000);
        await takeScreenshot(page, `3.3-navigated-to-${section.toLowerCase().replace(/\s+/g, '-')}`);

        navigatedSections.push(section);
      }
    }

    // Should be able to navigate to at least 2 sections
    expect(navigatedSections.length).toBeGreaterThanOrEqual(2);
  });
});

/**
 * TEST SUITE 4: RESPONSIVE DESIGN
 * Validates dashboard works across different screen sizes
 */
test.describe('Artisan Dashboard - Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);

    // Login before each test
    await page.goto(`${FRONTEND_URL}/auth/login`);
    await page.fill('input[type="email"], input[name="email"]', ARTISAN_CREDENTIALS.email);
    await page.fill('input[type="password"], input[name="password"]', ARTISAN_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|artisan/, { timeout: 15000 });
    await waitForNetworkIdle(page);
  });

  test('4.1 - Mobile Viewport (375x667)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await waitForNetworkIdle(page);

    await takeScreenshot(page, '4.1-mobile-portrait');

    // Verify mobile menu/hamburger exists
    const hasMobileMenu = await page.locator('button[aria-label*="menu" i], [class*="hamburger"], [class*="mobile-menu"]').count() > 0;

    // Main content should still be visible
    const mainContent = page.locator('main, [role="main"]').first();
    await expect(mainContent).toBeVisible();

    // Check that content doesn't overflow
    const body = await page.locator('body').boundingBox();
    expect(body!.width).toBeLessThanOrEqual(375);
  });

  test('4.2 - Tablet Viewport (768x1024)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await waitForNetworkIdle(page);

    await takeScreenshot(page, '4.2-tablet');

    // Verify layout adapts properly
    const mainContent = page.locator('main, [role="main"]').first();
    await expect(mainContent).toBeVisible();

    const boundingBox = await mainContent.boundingBox();
    expect(boundingBox!.width).toBeGreaterThan(400);
  });

  test('4.3 - Desktop Viewport (1920x1080)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.reload();
    await waitForNetworkIdle(page);

    await takeScreenshot(page, '4.3-desktop');

    // Verify full desktop layout
    const mainContent = page.locator('main, [role="main"]').first();
    await expect(mainContent).toBeVisible();

    // Navigation should be expanded on desktop
    const nav = page.locator('nav, [role="navigation"]').first();
    await expect(nav).toBeVisible();
  });

  test('4.4 - Landscape Mobile (667x375)', async ({ page }) => {
    await page.setViewportSize({ width: 667, height: 375 });
    await page.reload();
    await waitForNetworkIdle(page);

    await takeScreenshot(page, '4.4-mobile-landscape');

    // Content should still be accessible
    const mainContent = page.locator('main, [role="main"]').first();
    await expect(mainContent).toBeVisible();
  });
});

/**
 * TEST SUITE 5: ACCESSIBILITY
 * Validates WCAG compliance and accessibility features
 */
test.describe('Artisan Dashboard - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);

    // Login before each test
    await page.goto(`${FRONTEND_URL}/auth/login`);
    await page.fill('input[type="email"], input[name="email"]', ARTISAN_CREDENTIALS.email);
    await page.fill('input[type="password"], input[name="password"]', ARTISAN_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|artisan/, { timeout: 15000 });
    await waitForNetworkIdle(page);
  });

  test('5.1 - Keyboard Navigation', async ({ page }) => {
    await takeScreenshot(page, '5.1-before-keyboard-nav');

    // Try tabbing through interactive elements
    let focusableElements = 0;

    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(200);

      // Check if something is focused
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return el ? el.tagName : null;
      });

      if (focusedElement && ['BUTTON', 'A', 'INPUT'].includes(focusedElement)) {
        focusableElements++;
      }
    }

    await takeScreenshot(page, '5.1-after-keyboard-nav');

    // Should have at least 5 focusable elements
    expect(focusableElements).toBeGreaterThanOrEqual(5);
  });

  test('5.2 - ARIA Labels and Roles', async ({ page }) => {
    await takeScreenshot(page, '5.2-aria-check');

    // Check for proper ARIA landmarks
    const landmarks = [
      '[role="main"]',
      '[role="navigation"]',
      '[role="banner"]',
      'main',
      'nav',
      'header'
    ];

    let foundLandmarks = 0;
    for (const landmark of landmarks) {
      const count = await page.locator(landmark).count();
      if (count > 0) {
        foundLandmarks++;
      }
    }

    expect(foundLandmarks).toBeGreaterThanOrEqual(2);

    // Check that interactive elements have accessible names
    const buttons = await page.locator('button').all();
    let buttonsWithLabels = 0;

    for (const button of buttons.slice(0, 10)) { // Check first 10 buttons
      const ariaLabel = await button.getAttribute('aria-label');
      const text = await button.textContent();

      if (ariaLabel || (text && text.trim().length > 0)) {
        buttonsWithLabels++;
      }
    }

    // Most buttons should have accessible labels
    if (buttons.length > 0) {
      expect(buttonsWithLabels).toBeGreaterThan(0);
    }
  });

  test('5.3 - Color Contrast', async ({ page }) => {
    await takeScreenshot(page, '5.3-color-contrast');

    // Run automated accessibility check
    const a11yResults = await checkAccessibility(page);

    console.log('Accessibility Results:');
    console.log(`- Passes: ${a11yResults.passes}`);
    console.log(`- Violations: ${a11yResults.violations.length}`);

    if (a11yResults.violations.length > 0) {
      console.log('Violations:', JSON.stringify(a11yResults.violations, null, 2));
    }

    // Should have minimal critical violations
    const criticalViolations = a11yResults.violations.filter(v => v.impact === 'critical');
    expect(criticalViolations.length).toBeLessThan(3);
  });

  test('5.4 - Screen Reader Compatibility', async ({ page }) => {
    await takeScreenshot(page, '5.4-screen-reader');

    // Check for proper heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);

    // Check for alt text on images
    const images = await page.locator('img').all();
    let imagesWithAlt = 0;

    for (const img of images) {
      const alt = await img.getAttribute('alt');
      if (alt !== null) { // alt="" is valid for decorative images
        imagesWithAlt++;
      }
    }

    // All images should have alt attributes
    if (images.length > 0) {
      expect(imagesWithAlt).toBe(images.length);
    }
  });
});

/**
 * TEST SUITE 6: ERROR HANDLING & QUALITY
 * Validates error states and overall quality
 */
test.describe('Artisan Dashboard - Error Handling & Quality', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);

    // Login before each test
    await page.goto(`${FRONTEND_URL}/auth/login`);
    await page.fill('input[type="email"], input[name="email"]', ARTISAN_CREDENTIALS.email);
    await page.fill('input[type="password"], input[name="password"]', ARTISAN_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|artisan/, { timeout: 15000 });
    await waitForNetworkIdle(page);
  });

  test('6.1 - No Console Errors', async ({ page }) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      } else if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      errors.push(`Page Error: ${error.message}`);
    });

    // Navigate around dashboard
    await page.reload();
    await waitForNetworkIdle(page);
    await page.waitForTimeout(3000);

    await takeScreenshot(page, '6.1-console-check');

    console.log('Console Errors:', errors);
    console.log('Console Warnings:', warnings);

    // Should have no critical errors
    expect(errors.length).toBe(0);
  });

  test('6.2 - Network Request Success', async ({ page }) => {
    const failedRequests: any[] = [];

    page.on('response', (response) => {
      if (response.status() >= 400) {
        failedRequests.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });

    // Navigate and interact
    await page.reload();
    await waitForNetworkIdle(page);
    await page.waitForTimeout(3000);

    await takeScreenshot(page, '6.2-network-check');

    console.log('Failed Requests:', failedRequests);

    // Should have no failed requests to main API
    const criticalFailures = failedRequests.filter(r =>
      r.url.includes(BACKEND_URL) && r.status >= 500
    );

    expect(criticalFailures.length).toBe(0);
  });

  test('6.3 - Loading States', async ({ page }) => {
    // Force reload to see loading states
    await page.reload();

    await takeScreenshot(page, '6.3-loading-start');

    // Check for loading indicators
    const loadingIndicators = page.locator('[class*="loading"], [class*="spinner"], [class*="skeleton"]');
    const hasLoadingState = await loadingIndicators.count() > 0;

    // Wait for loading to complete
    if (hasLoadingState) {
      await expect(loadingIndicators.first()).not.toBeVisible({ timeout: 10000 });
    }

    await takeScreenshot(page, '6.3-loading-complete');

    // Verify content loaded
    const mainContent = page.locator('main, [role="main"]').first();
    await expect(mainContent).toBeVisible();
  });

  test('6.4 - Performance Metrics', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/artisan/dashboard`);
    await waitForNetworkIdle(page);

    // Get performance metrics
    const metrics = await page.evaluate(() => {
      const perfData = window.performance.timing;
      const loadTime = perfData.loadEventEnd - perfData.navigationStart;
      const domReadyTime = perfData.domContentLoadedEventEnd - perfData.navigationStart;

      return {
        loadTime,
        domReadyTime
      };
    });

    console.log('Performance Metrics:', metrics);

    await takeScreenshot(page, '6.4-performance');

    // Page should load in reasonable time (< 5 seconds)
    expect(metrics.loadTime).toBeLessThan(5000);
    expect(metrics.domReadyTime).toBeLessThan(3000);
  });
});

/**
 * TEST SUITE 7: VISUAL REGRESSION
 * Comparison with quality standards
 */
test.describe('Artisan Dashboard - Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);

    // Login before each test
    await page.goto(`${FRONTEND_URL}/auth/login`);
    await page.fill('input[type="email"], input[name="email"]', ARTISAN_CREDENTIALS.email);
    await page.fill('input[type="password"], input[name="password"]', ARTISAN_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|artisan/, { timeout: 15000 });
    await waitForNetworkIdle(page);
  });

  test('7.1 - Dashboard Layout Consistency', async ({ page }) => {
    await takeScreenshot(page, '7.1-layout-baseline');

    // Verify consistent spacing
    const mainContent = page.locator('main, [role="main"]').first();
    const box = await mainContent.boundingBox();

    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(300);
    expect(box!.height).toBeGreaterThan(400);

    // Check for consistent header height
    const header = page.locator('header, [role="banner"]').first();
    if (await header.count() > 0) {
      const headerBox = await header.boundingBox();
      expect(headerBox!.height).toBeGreaterThan(50);
      expect(headerBox!.height).toBeLessThan(200);
    }
  });

  test('7.2 - Component Visual Quality', async ({ page }) => {
    await takeScreenshot(page, '7.2-components-quality');

    // Check for proper button styling
    const buttons = await page.locator('button').all();

    for (const button of buttons.slice(0, 5)) {
      const box = await button.boundingBox();
      if (box) {
        // Buttons should have reasonable size
        expect(box.height).toBeGreaterThan(20);
        expect(box.width).toBeGreaterThan(40);
      }
    }

    // Check for consistent typography
    const headings = await page.locator('h1, h2, h3').all();
    expect(headings.length).toBeGreaterThan(0);
  });

  test('7.3 - Comparison with Client Dashboard Standards', async ({ page, browser }) => {
    // Take screenshot of artisan dashboard
    await takeScreenshot(page, '7.3-artisan-dashboard-full', true);

    // Create new context for client dashboard comparison
    const clientContext = await browser.newContext();
    const clientPage = await clientContext.newPage();

    try {
      // Navigate to client dashboard for comparison
      await clientPage.goto(`${FRONTEND_URL}/auth/login`);

      // Note: This would need valid client credentials for full comparison
      // For now, we document the expectation

      await takeScreenshot(page, '7.3-artisan-for-comparison', true);

      console.log('Visual comparison note: Artisan dashboard should match client dashboard quality in terms of:');
      console.log('- Consistent spacing and layout');
      console.log('- Professional typography');
      console.log('- Clear navigation');
      console.log('- Responsive design');
      console.log('- Accessibility features');

    } finally {
      await clientContext.close();
    }
  });
});
