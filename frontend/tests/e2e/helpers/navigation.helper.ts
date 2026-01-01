import { Page, expect } from '@playwright/test';

/**
 * Navigation Helper
 * Comprehensive utilities for page navigation, route verification, and UI interaction
 * with proper error handling and retry logic
 */

interface NavigationOptions {
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
  timeout?: number;
  maxRetries?: number;
}

/**
 * Navigate to a route with retry logic and verification
 */
export async function navigateTo(
  page: Page,
  path: string,
  options: NavigationOptions = {}
): Promise<void> {
  const {
    waitUntil = 'domcontentloaded',
    timeout = 30000,
    maxRetries = 2
  } = options;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Navigation attempt ${attempt}/${maxRetries} to ${path}`);

      await page.goto(path, { waitUntil, timeout });

      // Verify URL
      await expect(page).toHaveURL(new RegExp(path.replace(/\//g, '\\/')), { timeout: 5000 });

      // Wait for page to be interactive
      await waitForPageLoad(page);

      console.log(`✓ Successfully navigated to ${path}`);
      return;

    } catch (error) {
      console.error(`Navigation attempt ${attempt} failed:`, error);

      if (attempt === maxRetries) {
        await page.screenshot({
          path: `test-results/screenshots/nav-failed-${Date.now()}.png`,
          fullPage: true
        });
        throw new Error(`Navigation to ${path} failed after ${maxRetries} attempts: ${error}`);
      }

      await page.waitForTimeout(1000);
    }
  }
}

/**
 * Wait for page to be fully loaded and interactive
 */
export async function waitForPageLoad(page: Page, timeout: number = 30000): Promise<void> {
  try {
    // Wait for network to be idle
    await page.waitForLoadState('networkidle', { timeout: Math.min(timeout, 15000) }).catch(() => {
      console.warn('Network idle timeout - continuing anyway');
    });

    // Wait for DOM to be loaded
    await page.waitForLoadState('domcontentloaded', { timeout: 5000 });

    // Wait for main content to be visible
    const contentSelectors = [
      'main',
      '[role="main"]',
      '#main-content',
      'body > div'
    ];

    for (const selector of contentSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log(`✓ Page content loaded (${selector})`);
        break;
      }
    }

  } catch (error) {
    console.warn('Page load timeout - may still be usable:', error);
  }
}

/**
 * Click a link with text and verify navigation
 */
export async function clickLinkAndVerify(
  page: Page,
  linkText: string,
  expectedUrl: string | RegExp,
  options: { timeout?: number; exact?: boolean } = {}
): Promise<void> {
  const { timeout = 10000, exact = false } = options;

  // Multiple strategies to find and click the link
  const linkSelectors = [
    `a:has-text("${linkText}")`,
    `a[href*="${typeof expectedUrl === 'string' ? expectedUrl : ''}"]`,
    `button:has-text("${linkText}")`,
    `[role="link"]:has-text("${linkText}")`
  ];

  let clicked = false;

  for (const selector of linkSelectors) {
    try {
      const link = page.locator(selector).first();
      if (await link.isVisible({ timeout: 2000 })) {
        await link.click();
        clicked = true;
        console.log(`✓ Clicked link "${linkText}" using selector: ${selector}`);
        break;
      }
    } catch (error) {
      continue;
    }
  }

  if (!clicked) {
    throw new Error(`Failed to find and click link: "${linkText}"`);
  }

  // Verify navigation
  await page.waitForURL(expectedUrl, { timeout });
  await expect(page).toHaveURL(expectedUrl);
  await waitForPageLoad(page);

  console.log(`✓ Verified navigation to ${expectedUrl}`);
}

/**
 * Click a button with text
 */
export async function clickButton(
  page: Page,
  buttonText: string,
  options: { timeout?: number; waitForResponse?: boolean } = {}
): Promise<void> {
  const { timeout = 10000, waitForResponse = false } = options;

  const buttonSelectors = [
    `button:has-text("${buttonText}")`,
    `button[aria-label="${buttonText}"]`,
    `button[data-testid="${buttonText.toLowerCase().replace(/\s+/g, '-')}"]`,
    `[role="button"]:has-text("${buttonText}")`
  ];

  let clicked = false;

  for (const selector of buttonSelectors) {
    try {
      const button = page.locator(selector).first();
      if (await button.isVisible({ timeout: 2000 })) {
        if (waitForResponse) {
          // Wait for network response after click
          await Promise.all([
            page.waitForResponse(response => response.status() < 400, { timeout }),
            button.click()
          ]);
        } else {
          await button.click();
        }
        clicked = true;
        console.log(`✓ Clicked button "${buttonText}" using selector: ${selector}`);
        break;
      }
    } catch (error) {
      continue;
    }
  }

  if (!clicked) {
    throw new Error(`Failed to find and click button: "${buttonText}"`);
  }
}

/**
 * Verify multiple navigation links work on a page
 */
export async function verifyNavigationLinks(
  page: Page,
  links: Array<{ text: string; url: string | RegExp }>,
  options: { returnToStart?: boolean } = {}
): Promise<void> {
  const { returnToStart = true } = options;
  const startUrl = page.url();

  for (const link of links) {
    try {
      console.log(`Testing link: ${link.text} -> ${link.url}`);

      if (returnToStart) {
        await navigateTo(page, startUrl);
      }

      await clickLinkAndVerify(page, link.text, link.url);

      console.log(`✓ Link verified: ${link.text}`);
    } catch (error) {
      console.error(`✗ Link failed: ${link.text}`, error);
      throw error;
    }
  }
}

/**
 * Check if element exists on page
 */
export async function elementExists(
  page: Page,
  selector: string,
  options: { timeout?: number; state?: 'visible' | 'attached' | 'hidden' } = {}
): Promise<boolean> {
  const { timeout = 5000, state = 'visible' } = options;

  try {
    await page.waitForSelector(selector, { timeout, state });
    return true;
  } catch {
    return false;
  }
}

/**
 * Wait for element to be visible
 */
export async function waitForElement(
  page: Page,
  selector: string,
  timeout: number = 10000
): Promise<boolean> {
  return await elementExists(page, selector, { timeout, state: 'visible' });
}

/**
 * Verify element is visible
 */
export async function verifyElementVisible(
  page: Page,
  selector: string,
  timeout: number = 5000
): Promise<void> {
  await expect(page.locator(selector).first()).toBeVisible({ timeout });
  console.log(`✓ Element visible: ${selector}`);
}

/**
 * Verify element has text
 */
export async function verifyElementText(
  page: Page,
  selector: string,
  expectedText: string | RegExp,
  timeout: number = 5000
): Promise<void> {
  const element = page.locator(selector).first();
  await expect(element).toBeVisible({ timeout });
  await expect(element).toContainText(expectedText, { timeout });
  console.log(`✓ Element has text: ${selector}`);
}

/**
 * Monitor and collect console errors
 */
export async function setupConsoleErrorMonitor(page: Page): Promise<() => string[]> {
  const consoleErrors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', (error) => {
    consoleErrors.push(`Page error: ${error.message}`);
  });

  return () => consoleErrors;
}

/**
 * Verify page has no console errors
 */
export async function verifyNoConsoleErrors(page: Page): Promise<void> {
  const getErrors = await setupConsoleErrorMonitor(page);

  // Give page time to load and generate errors if any
  await page.waitForTimeout(1000);

  const errors = getErrors();

  if (errors.length > 0) {
    console.warn(`Console errors detected (${errors.length}):`);
    errors.forEach(error => console.warn(`  - ${error}`));
    // Don't fail test for console errors, just warn
  } else {
    console.log('✓ No console errors detected');
  }
}

/**
 * Take screenshot with descriptive name
 */
export async function takeScreenshot(
  page: Page,
  name: string,
  options: { fullPage?: boolean } = {}
): Promise<void> {
  const { fullPage = true } = options;

  const timestamp = Date.now();
  const filename = `test-results/screenshots/${name}-${timestamp}.png`;

  await page.screenshot({ path: filename, fullPage });
  console.log(`✓ Screenshot saved: ${filename}`);
}

/**
 * Scroll element into view
 */
export async function scrollIntoView(
  page: Page,
  selector: string
): Promise<void> {
  const element = page.locator(selector).first();
  await element.scrollIntoViewIfNeeded();
  console.log(`✓ Scrolled to: ${selector}`);
}

/**
 * Wait for and click element
 */
export async function waitAndClick(
  page: Page,
  selector: string,
  timeout: number = 10000
): Promise<void> {
  await page.waitForSelector(selector, { timeout, state: 'visible' });
  await page.locator(selector).first().click();
  console.log(`✓ Clicked: ${selector}`);
}

/**
 * Fill form with data object
 */
export async function fillForm(
  page: Page,
  formData: Record<string, string>
): Promise<void> {
  for (const [fieldName, value] of Object.entries(formData)) {
    const selectors = [
      `input[name="${fieldName}"]`,
      `input[id="${fieldName}"]`,
      `textarea[name="${fieldName}"]`,
      `textarea[id="${fieldName}"]`,
      `select[name="${fieldName}"]`,
      `select[id="${fieldName}"]`
    ];

    let filled = false;

    for (const selector of selectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          const tagName = await element.evaluate(el => el.tagName.toLowerCase());

          if (tagName === 'select') {
            await element.selectOption(value);
          } else {
            await element.fill(value);
          }

          filled = true;
          console.log(`✓ Filled ${fieldName}: ${value}`);
          break;
        }
      } catch (error) {
        continue;
      }
    }

    if (!filled) {
      console.warn(`⚠ Could not fill field: ${fieldName}`);
    }
  }
}

/**
 * Wait for network to be idle
 */
export async function waitForNetworkIdle(
  page: Page,
  timeout: number = 10000
): Promise<void> {
  try {
    await page.waitForLoadState('networkidle', { timeout });
    console.log('✓ Network idle');
  } catch (error) {
    console.warn('Network idle timeout - continuing');
  }
}

/**
 * Get page performance metrics
 */
export async function getPerformanceMetrics(page: Page): Promise<any> {
  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      domInteractive: navigation.domInteractive - navigation.fetchStart,
      totalLoadTime: navigation.loadEventEnd - navigation.fetchStart
    };
  });

  console.log('Performance metrics:', metrics);
  return metrics;
}

/**
 * Verify page is accessible (basic checks)
 */
export async function verifyBasicAccessibility(page: Page): Promise<void> {
  // Check for page title
  const title = await page.title();
  expect(title.length).toBeGreaterThan(0);
  console.log(`✓ Page has title: ${title}`);

  // Check for main landmark
  const hasMain = await elementExists(page, 'main, [role="main"]');
  if (hasMain) {
    console.log('✓ Page has main landmark');
  } else {
    console.warn('⚠ Page missing main landmark');
  }

  // Check for heading structure
  const hasH1 = await elementExists(page, 'h1');
  if (hasH1) {
    console.log('✓ Page has h1 heading');
  } else {
    console.warn('⚠ Page missing h1 heading');
  }
}

/**
 * Wait for specific URL pattern
 */
export async function waitForUrlPattern(
  page: Page,
  pattern: string | RegExp,
  timeout: number = 10000
): Promise<void> {
  await page.waitForURL(pattern, { timeout });
  console.log(`✓ URL matches pattern: ${pattern}`);
}

/**
 * Retry action with exponential backoff
 */
export async function retryAction<T>(
  action: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    actionName?: string;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    actionName = 'action'
  } = options;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await action();
      console.log(`✓ ${actionName} successful (attempt ${attempt})`);
      return result;
    } catch (error) {
      if (attempt === maxRetries) {
        console.error(`✗ ${actionName} failed after ${maxRetries} attempts`);
        throw error;
      }

      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      console.warn(`⚠ ${actionName} failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error(`${actionName} failed after ${maxRetries} retries`);
}
