import { Page, Locator } from '@playwright/test';
import { waitWithBackoff } from './wait.utils';

/**
 * Retry Utilities
 * Add resilience to flaky operations
 */

export interface RetryOptions {
  maxAttempts?: number;
  timeout?: number;
  backoff?: boolean;
  baseDelay?: number;
  errorMessage?: string;
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Generic retry wrapper for any async operation
 */
export async function retryAction<T>(
  action: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    backoff = true,
    baseDelay = 500,
    errorMessage = 'Operation failed',
    onRetry,
  } = options;

  let lastError: Error = new Error('Unknown error');

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await action();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxAttempts - 1) {
        onRetry?.(attempt + 1, error as Error);

        if (backoff) {
          const delay = baseDelay * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
  }

  throw new Error(
    `${errorMessage} after ${maxAttempts} attempts. Last error: ${lastError.message}`
  );
}

/**
 * Retry click operation
 */
export async function retryClick(
  locator: Locator,
  options: RetryOptions = {}
): Promise<void> {
  const {
    maxAttempts = 3,
    timeout = 10000,
    errorMessage = `Failed to click element`,
  } = options;

  await retryAction(
    async () => {
      await locator.click({ timeout: timeout / maxAttempts });
    },
    {
      ...options,
      errorMessage: `${errorMessage}: ${await locator.evaluate((el) => el.outerHTML).catch(() => 'unknown element')}`,
    }
  );
}

/**
 * Retry fill operation
 */
export async function retryFill(
  locator: Locator,
  value: string,
  options: RetryOptions = {}
): Promise<void> {
  const {
    maxAttempts = 3,
    timeout = 10000,
    errorMessage = 'Failed to fill input',
  } = options;

  await retryAction(
    async () => {
      await locator.clear({ timeout: timeout / (maxAttempts * 2) });
      await locator.fill(value, { timeout: timeout / (maxAttempts * 2) });
    },
    {
      ...options,
      errorMessage: `${errorMessage} with value "${value}"`,
    }
  );
}

/**
 * Retry select operation
 */
export async function retrySelect(
  locator: Locator,
  value: string | string[],
  options: RetryOptions = {}
): Promise<void> {
  const {
    maxAttempts = 3,
    timeout = 10000,
    errorMessage = 'Failed to select option',
  } = options;

  await retryAction(
    async () => {
      await locator.selectOption(value, { timeout: timeout / maxAttempts });
    },
    {
      ...options,
      errorMessage: `${errorMessage}: ${value}`,
    }
  );
}

/**
 * Retry navigation
 */
export async function retryNavigation(
  page: Page,
  url: string,
  options: RetryOptions = {}
): Promise<void> {
  const {
    maxAttempts = 3,
    timeout = 30000,
    errorMessage = `Failed to navigate to ${url}`,
  } = options;

  await retryAction(
    async () => {
      await page.goto(url, {
        timeout: timeout / maxAttempts,
        waitUntil: 'domcontentloaded',
      });
    },
    { ...options, errorMessage }
  );
}

/**
 * Retry with element staleness check
 * Useful when DOM updates cause "Element is not attached to the DOM" errors
 */
export async function retryWithStaleCheck<T>(
  locator: Locator,
  action: (loc: Locator) => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxAttempts = 3, errorMessage = 'Operation failed with stale element' } = options;

  return await retryAction(
    async () => {
      try {
        return await action(locator);
      } catch (error) {
        const err = error as Error;
        if (
          err.message.includes('stale') ||
          err.message.includes('not attached') ||
          err.message.includes('detached')
        ) {
          // Element became stale, retry will get fresh locator
          throw error;
        }
        throw error;
      }
    },
    { ...options, maxAttempts, errorMessage }
  );
}

/**
 * Retry until condition is met
 */
export async function retryUntil(
  condition: () => Promise<boolean>,
  options: RetryOptions & { checkInterval?: number } = {}
): Promise<void> {
  const {
    maxAttempts = 10,
    checkInterval = 500,
    errorMessage = 'Condition not met',
  } = options;

  let attempts = 0;

  while (attempts < maxAttempts) {
    if (await condition()) {
      return;
    }

    attempts++;
    if (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, checkInterval));
    }
  }

  throw new Error(`${errorMessage} after ${maxAttempts} attempts`);
}

/**
 * Retry with custom error handling
 */
export async function retryWithHandler<T>(
  action: () => Promise<T>,
  errorHandler: (error: Error, attempt: number) => boolean | Promise<boolean>,
  options: Omit<RetryOptions, 'onRetry'> = {}
): Promise<T> {
  const { maxAttempts = 3, backoff = true, baseDelay = 500 } = options;

  let lastError: Error = new Error('Unknown error');

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await action();
    } catch (error) {
      lastError = error as Error;

      // Let handler decide if we should retry
      const shouldRetry = await errorHandler(error as Error, attempt);

      if (!shouldRetry || attempt >= maxAttempts - 1) {
        throw error;
      }

      if (backoff) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Batch retry - retry multiple operations with shared failure handling
 */
export async function retryBatch<T>(
  actions: Array<() => Promise<T>>,
  options: RetryOptions = {}
): Promise<T[]> {
  const { maxAttempts = 3, errorMessage = 'Batch operation failed' } = options;

  return await retryAction(
    async () => {
      return await Promise.all(actions.map((action) => action()));
    },
    { ...options, maxAttempts, errorMessage }
  );
}

/**
 * Retry with specific error types
 */
export async function retryOnError<T>(
  action: () => Promise<T>,
  errorTypes: string[],
  options: RetryOptions = {}
): Promise<T> {
  return await retryWithHandler(
    action,
    (error) => {
      // Only retry if error message matches one of the specified types
      return errorTypes.some((type) =>
        error.message.toLowerCase().includes(type.toLowerCase())
      );
    },
    options
  );
}

/**
 * Common error patterns to retry
 */
export const RETRYABLE_ERRORS = {
  NETWORK: ['ECONNRESET', 'ETIMEDOUT', 'network error', 'fetch failed'],
  STALE_ELEMENT: ['stale', 'not attached', 'detached'],
  TIMEOUT: ['timeout', 'timed out'],
  VISIBILITY: ['not visible', 'hidden'],
  ACTIONABILITY: ['not actionable', 'not enabled', 'disabled'],
} as const;

/**
 * Retry click with common error handling
 */
export async function safeClick(
  locator: Locator,
  options: RetryOptions = {}
): Promise<void> {
  await retryOnError(
    () => locator.click({ timeout: 10000 }),
    [...RETRYABLE_ERRORS.STALE_ELEMENT, ...RETRYABLE_ERRORS.ACTIONABILITY],
    { maxAttempts: 3, backoff: true, ...options }
  );
}

/**
 * Retry fill with common error handling
 */
export async function safeFill(
  locator: Locator,
  value: string,
  options: RetryOptions = {}
): Promise<void> {
  await retryOnError(
    async () => {
      await locator.clear();
      await locator.fill(value);
    },
    [...RETRYABLE_ERRORS.STALE_ELEMENT, ...RETRYABLE_ERRORS.ACTIONABILITY],
    { maxAttempts: 3, backoff: true, ...options }
  );
}
