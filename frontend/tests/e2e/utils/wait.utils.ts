import { Page, Locator, expect } from '@playwright/test';

/**
 * Enhanced Waiting Utilities
 * Robust waiting strategies for reliable E2E tests
 */

export interface WaitOptions {
  timeout?: number;
  state?: 'attached' | 'detached' | 'visible' | 'hidden';
  retries?: number;
  pollingInterval?: number;
}

/**
 * Wait for element to be in a specific state with retry logic
 */
export async function waitForElement(
  page: Page,
  selector: string,
  options: WaitOptions = {}
): Promise<void> {
  const {
    timeout = 10000,
    state = 'visible',
    retries = 3,
    pollingInterval = 500,
  } = options;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      await page.waitForSelector(selector, {
        timeout: timeout / retries,
        state,
      });
      return;
    } catch (error) {
      if (attempt === retries - 1) {
        throw new Error(
          `Element "${selector}" not found after ${retries} attempts (${timeout}ms total). State: ${state}`
        );
      }
      await page.waitForTimeout(pollingInterval * (attempt + 1));
    }
  }
}

/**
 * Wait for element with custom condition
 */
export async function waitForCondition(
  page: Page,
  condition: () => Promise<boolean>,
  options: { timeout?: number; message?: string } = {}
): Promise<void> {
  const { timeout = 10000, message = 'Condition not met' } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await page.waitForTimeout(100);
  }

  throw new Error(`${message} after ${timeout}ms`);
}

/**
 * Smart page load waiting
 * Waits for multiple indicators of page readiness
 */
export async function waitForPageLoad(
  page: Page,
  options: { timeout?: number; waitForNetwork?: boolean } = {}
): Promise<void> {
  const { timeout = 30000, waitForNetwork = true } = options;

  try {
    // Wait for DOM to be ready
    await page.waitForLoadState('domcontentloaded', { timeout });

    // Optionally wait for network to be idle
    if (waitForNetwork) {
      await page.waitForLoadState('networkidle', { timeout }).catch(() => {
        // Network idle is nice to have but not critical
        console.log('Network idle timeout - continuing anyway');
      });
    }

    // Wait for body to be visible (basic sanity check)
    await page.waitForSelector('body', { state: 'visible', timeout: 5000 });
  } catch (error) {
    throw new Error(`Page failed to load within ${timeout}ms: ${(error as Error).message}`);
  }
}

/**
 * Wait for navigation to complete
 */
export async function waitForNavigation(
  page: Page,
  expectedUrl: string | RegExp,
  options: { timeout?: number } = {}
): Promise<void> {
  const { timeout = 30000 } = options;

  try {
    await page.waitForURL(expectedUrl, { timeout });
    await waitForPageLoad(page, { timeout: timeout / 2 });
  } catch (error) {
    const currentUrl = page.url();
    throw new Error(
      `Navigation failed. Expected: ${expectedUrl}, Current: ${currentUrl}. Error: ${(error as Error).message}`
    );
  }
}

/**
 * Wait for element to be actionable (visible and enabled)
 */
export async function waitForActionable(
  locator: Locator,
  options: { timeout?: number } = {}
): Promise<void> {
  const { timeout = 10000 } = options;

  await expect(locator).toBeVisible({ timeout });
  await expect(locator).toBeEnabled({ timeout });
}

/**
 * Wait for dynamic content to stabilize
 * Useful for lists, tables, or content that loads in stages
 */
export async function waitForStableContent(
  locator: Locator,
  options: { timeout?: number; stabilityTime?: number } = {}
): Promise<void> {
  const { timeout = 10000, stabilityTime = 500 } = options;
  const startTime = Date.now();

  let previousCount = 0;
  let stableCount = 0;
  const requiredStableChecks = 3;

  while (Date.now() - startTime < timeout) {
    const currentCount = await locator.count();

    if (currentCount === previousCount) {
      stableCount++;
      if (stableCount >= requiredStableChecks) {
        return; // Content is stable
      }
    } else {
      stableCount = 0; // Reset stability counter
    }

    previousCount = currentCount;
    await locator.first().page().waitForTimeout(stabilityTime / requiredStableChecks);
  }

  throw new Error(`Content did not stabilize within ${timeout}ms`);
}

/**
 * Wait for text to appear in element
 */
export async function waitForText(
  locator: Locator,
  text: string | RegExp,
  options: { timeout?: number } = {}
): Promise<void> {
  const { timeout = 10000 } = options;

  await expect(locator).toContainText(text, { timeout });
}

/**
 * Wait for element to disappear
 */
export async function waitForDisappear(
  page: Page,
  selector: string,
  options: { timeout?: number } = {}
): Promise<void> {
  const { timeout = 10000 } = options;

  try {
    await page.waitForSelector(selector, {
      state: 'hidden',
      timeout,
    });
  } catch (error) {
    throw new Error(`Element "${selector}" did not disappear within ${timeout}ms`);
  }
}

/**
 * Wait for URL to change
 */
export async function waitForUrlChange(
  page: Page,
  currentUrl: string,
  options: { timeout?: number } = {}
): Promise<void> {
  const { timeout = 10000 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (page.url() !== currentUrl) {
      return;
    }
    await page.waitForTimeout(100);
  }

  throw new Error(`URL did not change from "${currentUrl}" within ${timeout}ms`);
}

/**
 * Wait for API response
 */
export async function waitForApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  options: { timeout?: number; method?: string } = {}
): Promise<void> {
  const { timeout = 10000, method } = options;

  await page.waitForResponse(
    (response) => {
      const matchesUrl =
        typeof urlPattern === 'string'
          ? response.url().includes(urlPattern)
          : urlPattern.test(response.url());

      const matchesMethod = method ? response.request().method() === method : true;

      return matchesUrl && matchesMethod;
    },
    { timeout }
  );
}

/**
 * Wait for multiple conditions in parallel
 */
export async function waitForAll(
  conditions: Array<() => Promise<void>>,
  options: { timeout?: number } = {}
): Promise<void> {
  const { timeout = 10000 } = options;

  try {
    await Promise.race([
      Promise.all(conditions.map((condition) => condition())),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout waiting for all conditions')), timeout)
      ),
    ]);
  } catch (error) {
    throw new Error(`Not all conditions met within ${timeout}ms: ${(error as Error).message}`);
  }
}

/**
 * Wait with exponential backoff
 */
export async function waitWithBackoff(
  page: Page,
  attempt: number,
  options: { baseDelay?: number; maxDelay?: number } = {}
): Promise<void> {
  const { baseDelay = 500, maxDelay = 5000 } = options;
  const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  await page.waitForTimeout(delay);
}

/**
 * Wait for animation to complete
 */
export async function waitForAnimation(
  locator: Locator,
  options: { timeout?: number } = {}
): Promise<void> {
  const { timeout = 5000 } = options;

  // Wait for element to be stable (no position/size changes)
  await waitForStableContent(locator, {
    timeout,
    stabilityTime: 300,
  });
}
