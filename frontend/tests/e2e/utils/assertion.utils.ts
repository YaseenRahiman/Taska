import { Page, Locator, expect } from '@playwright/test';

/**
 * Custom Assertion Utilities
 * Enhanced assertions with better error messages and resilience
 */

export interface AssertionOptions {
  timeout?: number;
  message?: string;
  retries?: number;
}

/**
 * Assert element is visible with retry
 */
export async function assertVisible(
  locator: Locator,
  options: AssertionOptions = {}
): Promise<void> {
  const { timeout = 10000, message = 'Element should be visible' } = options;

  try {
    await expect(locator).toBeVisible({ timeout });
  } catch (error) {
    const selector = await locator.evaluate((el) => el.outerHTML).catch(() => 'unknown');
    throw new Error(`${message}. Selector: ${selector}. Error: ${(error as Error).message}`);
  }
}

/**
 * Assert element is hidden/not visible
 */
export async function assertHidden(
  locator: Locator,
  options: AssertionOptions = {}
): Promise<void> {
  const { timeout = 10000, message = 'Element should be hidden' } = options;

  try {
    await expect(locator).toBeHidden({ timeout });
  } catch (error) {
    throw new Error(`${message}. Error: ${(error as Error).message}`);
  }
}

/**
 * Assert element contains specific text
 */
export async function assertText(
  locator: Locator,
  text: string | RegExp,
  options: AssertionOptions = {}
): Promise<void> {
  const { timeout = 10000, message = `Element should contain text: ${text}` } = options;

  try {
    await expect(locator).toContainText(text, { timeout });
  } catch (error) {
    const actualText = await locator.textContent().catch(() => 'unable to read text');
    throw new Error(
      `${message}. Actual text: "${actualText}". Error: ${(error as Error).message}`
    );
  }
}

/**
 * Assert exact text match
 */
export async function assertExactText(
  locator: Locator,
  text: string | RegExp,
  options: AssertionOptions = {}
): Promise<void> {
  const { timeout = 10000, message = `Element should have exact text: ${text}` } = options;

  try {
    await expect(locator).toHaveText(text, { timeout });
  } catch (error) {
    const actualText = await locator.textContent().catch(() => 'unable to read text');
    throw new Error(
      `${message}. Actual text: "${actualText}". Error: ${(error as Error).message}`
    );
  }
}

/**
 * Assert URL matches pattern
 */
export async function assertUrl(
  page: Page,
  urlPattern: string | RegExp,
  options: AssertionOptions = {}
): Promise<void> {
  const { timeout = 10000, message = `URL should match: ${urlPattern}` } = options;

  try {
    await expect(page).toHaveURL(urlPattern, { timeout });
  } catch (error) {
    const currentUrl = page.url();
    throw new Error(
      `${message}. Current URL: "${currentUrl}". Error: ${(error as Error).message}`
    );
  }
}

/**
 * Assert element is enabled
 */
export async function assertEnabled(
  locator: Locator,
  options: AssertionOptions = {}
): Promise<void> {
  const { timeout = 10000, message = 'Element should be enabled' } = options;

  try {
    await expect(locator).toBeEnabled({ timeout });
  } catch (error) {
    const isDisabled = await locator.isDisabled().catch(() => 'unknown');
    throw new Error(
      `${message}. Is disabled: ${isDisabled}. Error: ${(error as Error).message}`
    );
  }
}

/**
 * Assert element is disabled
 */
export async function assertDisabled(
  locator: Locator,
  options: AssertionOptions = {}
): Promise<void> {
  const { timeout = 10000, message = 'Element should be disabled' } = options;

  try {
    await expect(locator).toBeDisabled({ timeout });
  } catch (error) {
    throw new Error(`${message}. Error: ${(error as Error).message}`);
  }
}

/**
 * Assert checkbox is checked
 */
export async function assertChecked(
  locator: Locator,
  options: AssertionOptions = {}
): Promise<void> {
  const { timeout = 10000, message = 'Checkbox should be checked' } = options;

  try {
    await expect(locator).toBeChecked({ timeout });
  } catch (error) {
    const isChecked = await locator.isChecked().catch(() => 'unknown');
    throw new Error(
      `${message}. Is checked: ${isChecked}. Error: ${(error as Error).message}`
    );
  }
}

/**
 * Assert element has specific attribute value
 */
export async function assertAttribute(
  locator: Locator,
  attribute: string,
  value: string | RegExp,
  options: AssertionOptions = {}
): Promise<void> {
  const {
    timeout = 10000,
    message = `Element should have attribute "${attribute}" with value: ${value}`,
  } = options;

  try {
    await expect(locator).toHaveAttribute(attribute, value, { timeout });
  } catch (error) {
    const actualValue = await locator.getAttribute(attribute).catch(() => 'not found');
    throw new Error(
      `${message}. Actual value: "${actualValue}". Error: ${(error as Error).message}`
    );
  }
}

/**
 * Assert element count matches expected
 */
export async function assertCount(
  locator: Locator,
  count: number,
  options: AssertionOptions = {}
): Promise<void> {
  const { timeout = 10000, message = `Should have ${count} elements` } = options;

  try {
    await expect(locator).toHaveCount(count, { timeout });
  } catch (error) {
    const actualCount = await locator.count();
    throw new Error(
      `${message}. Actual count: ${actualCount}. Error: ${(error as Error).message}`
    );
  }
}

/**
 * Assert element has specific class
 */
export async function assertClass(
  locator: Locator,
  className: string | RegExp,
  options: AssertionOptions = {}
): Promise<void> {
  const { timeout = 10000, message = `Element should have class: ${className}` } = options;

  try {
    await expect(locator).toHaveClass(className, { timeout });
  } catch (error) {
    const actualClasses = await locator.getAttribute('class').catch(() => 'none');
    throw new Error(
      `${message}. Actual classes: "${actualClasses}". Error: ${(error as Error).message}`
    );
  }
}

/**
 * Assert input has specific value
 */
export async function assertValue(
  locator: Locator,
  value: string | RegExp,
  options: AssertionOptions = {}
): Promise<void> {
  const { timeout = 10000, message = `Input should have value: ${value}` } = options;

  try {
    await expect(locator).toHaveValue(value, { timeout });
  } catch (error) {
    const actualValue = await locator.inputValue().catch(() => 'unable to read value');
    throw new Error(
      `${message}. Actual value: "${actualValue}". Error: ${(error as Error).message}`
    );
  }
}

/**
 * Assert page has no console errors
 */
export async function assertNoConsoleErrors(
  page: Page,
  options: { allowedErrors?: string[]; message?: string } = {}
): Promise<void> {
  const {
    allowedErrors = [],
    message = 'Page should not have console errors',
  } = options;

  const errors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();

      // Filter out allowed errors
      const isAllowed = allowedErrors.some((allowed) => text.includes(allowed));
      if (!isAllowed) {
        errors.push(text);
      }
    }
  });

  if (errors.length > 0) {
    throw new Error(`${message}. Errors found:\n${errors.join('\n')}`);
  }
}

/**
 * Assert screenshot matches
 */
export async function assertScreenshot(
  page: Page | Locator,
  name: string,
  options: { threshold?: number; message?: string } = {}
): Promise<void> {
  const { threshold = 0.2, message = `Screenshot should match: ${name}` } = options;

  try {
    await expect(page).toHaveScreenshot(name, {
      threshold,
      maxDiffPixels: 100,
    });
  } catch (error) {
    throw new Error(`${message}. Error: ${(error as Error).message}`);
  }
}

/**
 * Assert element is in viewport
 */
export async function assertInViewport(
  locator: Locator,
  options: AssertionOptions = {}
): Promise<void> {
  const { timeout = 10000, message = 'Element should be in viewport' } = options;

  try {
    await expect(locator).toBeInViewport({ timeout });
  } catch (error) {
    throw new Error(`${message}. Error: ${(error as Error).message}`);
  }
}

/**
 * Assert element is focused
 */
export async function assertFocused(
  locator: Locator,
  options: AssertionOptions = {}
): Promise<void> {
  const { timeout = 10000, message = 'Element should be focused' } = options;

  try {
    await expect(locator).toBeFocused({ timeout });
  } catch (error) {
    throw new Error(`${message}. Error: ${(error as Error).message}`);
  }
}

/**
 * Assert element exists (attached to DOM)
 */
export async function assertExists(
  locator: Locator,
  options: AssertionOptions = {}
): Promise<void> {
  const { timeout = 10000, message = 'Element should exist in DOM' } = options;

  try {
    await expect(locator).toBeAttached({ timeout });
  } catch (error) {
    throw new Error(`${message}. Error: ${(error as Error).message}`);
  }
}

/**
 * Assert element does not exist
 */
export async function assertNotExists(
  locator: Locator,
  options: AssertionOptions = {}
): Promise<void> {
  const { timeout = 10000, message = 'Element should not exist in DOM' } = options;

  try {
    await expect(locator).not.toBeAttached({ timeout });
  } catch (error) {
    throw new Error(`${message}. Error: ${(error as Error).message}`);
  }
}

/**
 * Soft assertion - doesn't fail test immediately
 */
export async function softAssert(
  assertion: () => Promise<void>,
  options: { message?: string } = {}
): Promise<boolean> {
  const { message = 'Soft assertion failed' } = options;

  try {
    await assertion();
    return true;
  } catch (error) {
    console.warn(`${message}: ${(error as Error).message}`);
    return false;
  }
}

/**
 * Assert all conditions pass
 */
export async function assertAll(
  assertions: Array<() => Promise<void>>,
  options: { message?: string } = {}
): Promise<void> {
  const { message = 'Not all assertions passed' } = options;

  const results = await Promise.allSettled(
    assertions.map((assertion) => assertion())
  );

  const failures = results.filter(
    (result) => result.status === 'rejected'
  ) as PromiseRejectedResult[];

  if (failures.length > 0) {
    const errorMessages = failures.map((f) => f.reason.message).join('\n');
    throw new Error(`${message}. Failures:\n${errorMessages}`);
  }
}
