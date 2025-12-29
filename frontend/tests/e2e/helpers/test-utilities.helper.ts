import { Page, expect } from '@playwright/test';

/**
 * Test Utilities Helper
 * Enhanced utilities for reliable test execution
 */

/**
 * Navigate with proper waiting and error handling
 */
export async function navigateAndWait(
  page: Page,
  url: string,
  options: {
    waitForSelector?: string;
    timeout?: number;
    expectedUrl?: RegExp | string;
  } = {}
): Promise<void> {
  const timeout = options.timeout || 10000;

  try {
    // Navigate to URL
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout
    });

    // Wait for network to be idle
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {
      console.warn('Network not idle, continuing...');
    });

    // Wait for specific selector if provided
    if (options.waitForSelector) {
      await page.waitForSelector(options.waitForSelector, { timeout: 5000 });
    }

    // Verify URL if expected URL provided
    if (options.expectedUrl) {
      if (typeof options.expectedUrl === 'string') {
        await expect(page).toHaveURL(options.expectedUrl, { timeout: 5000 });
      } else {
        await expect(page).toHaveURL(options.expectedUrl, { timeout: 5000 });
      }
    }

    console.log(`Navigated to: ${url}`);
  } catch (error) {
    console.error(`Navigation failed to ${url}:`, error);
    throw error;
  }
}

/**
 * Click link and wait for navigation
 */
export async function clickAndNavigate(
  page: Page,
  selector: string,
  expectedUrl: RegExp | string,
  options: { timeout?: number } = {}
): Promise<void> {
  const timeout = options.timeout || 10000;

  try {
    // Find and click the link
    const link = page.locator(selector).first();

    // Wait for link to be visible
    await link.waitFor({ state: 'visible', timeout: 5000 });

    // Get href to verify it's a valid link
    const href = await link.getAttribute('href');
    console.log(`Clicking link with href: ${href}`);

    // Click and wait for navigation
    await Promise.all([
      page.waitForURL(expectedUrl, { timeout }),
      link.click()
    ]);

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

    console.log(`Navigated to: ${page.url()}`);
  } catch (error) {
    console.error(`Click and navigate failed for selector: ${selector}`, error);
    console.error(`Current URL: ${page.url()}`);

    // Take screenshot for debugging
    await page.screenshot({
      path: `test-results/failed-navigation-${Date.now()}.png`,
      fullPage: true
    }).catch(() => {});

    throw error;
  }
}

/**
 * Fill form field with validation
 */
export async function fillFormField(
  page: Page,
  selector: string,
  value: string,
  options: { validate?: boolean; label?: string } = {}
): Promise<void> {
  const label = options.label || selector;

  try {
    const field = page.locator(selector).first();

    // Wait for field to be visible
    await field.waitFor({ state: 'visible', timeout: 5000 });

    // Clear existing value
    await field.clear();

    // Fill with new value
    await field.fill(value);

    // Validate value was set if requested
    if (options.validate !== false) {
      const actualValue = await field.inputValue();
      if (actualValue !== value) {
        throw new Error(`Field value mismatch. Expected: "${value}", Got: "${actualValue}"`);
      }
    }

    console.log(`Filled ${label}: ${value.substring(0, 20)}...`);
  } catch (error) {
    console.error(`Failed to fill ${label}:`, error);
    throw error;
  }
}

/**
 * Submit form and wait for response
 */
export async function submitFormAndWait(
  page: Page,
  submitSelector: string,
  options: {
    waitForUrl?: RegExp | string;
    waitForSelector?: string;
    timeout?: number;
  } = {}
): Promise<void> {
  const timeout = options.timeout || 15000;

  try {
    const submitButton = page.locator(submitSelector).first();

    // Wait for button to be enabled
    await submitButton.waitFor({ state: 'visible', timeout: 5000 });

    // Check if button is enabled
    const isEnabled = await submitButton.isEnabled();
    if (!isEnabled) {
      console.warn('Submit button is disabled, waiting for it to be enabled...');
      await page.waitForTimeout(1000);
    }

    // Click submit button - use force to bypass overlays
    if (options.waitForUrl) {
      await Promise.all([
        page.waitForURL(options.waitForUrl, { timeout }),
        submitButton.click({ force: true }).catch(() => submitButton.click())
      ]);
    } else if (options.waitForSelector) {
      await Promise.all([
        page.waitForSelector(options.waitForSelector, { timeout }),
        submitButton.click({ force: true }).catch(() => submitButton.click())
      ]);
    } else {
      await submitButton.click({ force: true }).catch(() => submitButton.click());
      await page.waitForTimeout(1000); // Give time for processing
    }

    console.log('Form submitted successfully');
  } catch (error) {
    console.error('Form submission failed:', error);
    throw error;
  }
}

/**
 * Wait for element with better error handling
 */
export async function waitForElement(
  page: Page,
  selector: string,
  options: {
    state?: 'attached' | 'detached' | 'visible' | 'hidden';
    timeout?: number;
  } = {}
): Promise<boolean> {
  const timeout = options.timeout || 10000;
  const state = options.state || 'visible';

  try {
    await page.waitForSelector(selector, { timeout, state });
    return true;
  } catch (error) {
    console.warn(`Element not found: ${selector}`);
    return false;
  }
}

/**
 * Clear authentication state
 */
export async function clearAuthState(page: Page): Promise<void> {
  try {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.context().clearCookies();
    console.log('Auth state cleared');
  } catch (error) {
    console.error('Failed to clear auth state:', error);
  }
}

/**
 * Set authentication tokens
 */
export async function setAuthTokens(
  page: Page,
  tokens: { accessToken: string; refreshToken: string }
): Promise<void> {
  try {
    // Navigate to home first to set same-origin context
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Set tokens in localStorage
    await page.evaluate(({ accessToken, refreshToken }) => {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    }, tokens);

    // Set cookies
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';
    const domain = new URL(FRONTEND_URL).hostname;

    await page.context().addCookies([
      {
        name: 'accessToken',
        value: tokens.accessToken,
        domain,
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax'
      }
    ]);

    console.log('Auth tokens set successfully');
  } catch (error) {
    console.error('Failed to set auth tokens:', error);
    throw error;
  }
}

/**
 * Verify page loaded successfully
 */
export async function verifyPageLoaded(
  page: Page,
  options: {
    expectedUrl?: RegExp | string;
    expectedTitle?: RegExp | string;
    requiredSelector?: string;
  } = {}
): Promise<void> {
  const currentUrl = page.url();

  // Verify URL
  if (options.expectedUrl) {
    if (typeof options.expectedUrl === 'string') {
      expect(currentUrl).toContain(options.expectedUrl);
    } else {
      expect(currentUrl).toMatch(options.expectedUrl);
    }
  }

  // Verify title
  if (options.expectedTitle) {
    const title = await page.title();
    if (typeof options.expectedTitle === 'string') {
      expect(title).toContain(options.expectedTitle);
    } else {
      expect(title).toMatch(options.expectedTitle);
    }
  }

  // Verify required selector
  if (options.requiredSelector) {
    await expect(page.locator(options.requiredSelector).first()).toBeVisible({ timeout: 5000 });
  }

  console.log(`Page loaded: ${currentUrl}`);
}

/**
 * Retry operation with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delayMs?: number;
    backoff?: boolean;
    onRetry?: (attempt: number, error: any) => void;
  } = {}
): Promise<T> {
  const maxAttempts = options.maxAttempts || 3;
  const initialDelay = options.delayMs || 1000;
  const backoff = options.backoff !== false;

  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt < maxAttempts) {
        const delay = backoff ? initialDelay * Math.pow(2, attempt - 1) : initialDelay;
        console.log(`Retry attempt ${attempt}/${maxAttempts} after ${delay}ms...`);

        if (options.onRetry) {
          options.onRetry(attempt, error);
        }

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Operation failed after ${maxAttempts} attempts: ${lastError}`);
}

/**
 * Check if element exists (without failing)
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  try {
    const count = await page.locator(selector).count();
    return count > 0;
  } catch {
    return false;
  }
}

/**
 * Get element text safely
 */
export async function getElementText(page: Page, selector: string): Promise<string | null> {
  try {
    const element = page.locator(selector).first();
    const isVisible = await element.isVisible({ timeout: 2000 }).catch(() => false);
    if (!isVisible) return null;
    return await element.textContent();
  } catch {
    return null;
  }
}

/**
 * Wait for API response
 */
export async function waitForApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  options: { timeout?: number } = {}
): Promise<any> {
  const timeout = options.timeout || 10000;

  return await page.waitForResponse(
    response => {
      const url = response.url();
      const matches = typeof urlPattern === 'string'
        ? url.includes(urlPattern)
        : urlPattern.test(url);
      return matches && response.status() === 200;
    },
    { timeout }
  );
}

/**
 * Take screenshot for debugging
 */
export async function takeDebugScreenshot(
  page: Page,
  name: string,
  options: { fullPage?: boolean } = {}
): Promise<void> {
  try {
    const timestamp = Date.now();
    const filename = `test-results/debug-${name}-${timestamp}.png`;
    await page.screenshot({
      path: filename,
      fullPage: options.fullPage !== false
    });
    console.log(`Screenshot saved: ${filename}`);
  } catch (error) {
    console.warn('Failed to take screenshot:', error);
  }
}
