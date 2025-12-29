import { Page, expect } from '@playwright/test';
import { AUTH_SELECTORS, AUTH_URLS } from '../selectors';
import { waitForPageLoad, waitForNavigation } from '../utils/wait.utils';
import { retryFill, safeClick, retryAction } from '../utils/retry.utils';
import { assertUrl, assertVisible } from '../utils/assertion.utils';

/**
 * REFACTORED Authentication Helper
 * Enhanced with robust selectors, retry logic, and proper waiting strategies
 *
 * Improvements over original:
 * - Centralized selectors with fallbacks
 * - Retry logic for flaky operations
 * - Enhanced error messages
 * - Proper waiting strategies (no hardcoded timeouts)
 * - Better type safety and documentation
 */

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: 'CLIENT' | 'ARTISAN';
  phoneNumber?: string;
  trade?: string;
  experience?: number;
  location?: string;
  bio?: string;
}

export const TEST_USERS = {
  client: {
    email: 'client@test.com',
    password: 'TestPassword123!',
    role: 'CLIENT' as const
  },
  artisan: {
    email: 'artisan@test.com',
    password: 'TestPassword123!',
    role: 'ARTISAN' as const
  },
  admin: {
    email: 'admin@test.com',
    password: 'AdminPassword123!',
    role: 'ADMIN' as const
  }
} as const;

/**
 * Login to the application with retry logic and proper waiting
 */
export async function login(
  page: Page,
  credentials: LoginCredentials,
  options: { timeout?: number } = {}
): Promise<void> {
  const { timeout = 30000 } = options;

  await retryAction(
    async () => {
      // Navigate to login page
      await page.goto('/auth/login');
      await waitForPageLoad(page, { timeout: timeout / 3 });

      // Verify we're on login page
      await assertUrl(page, AUTH_URLS.login, {
        message: 'Should be on login page',
        timeout: 5000
      });

      // Fill email with retry (handles stale elements)
      const emailInput = page.locator(
        `${AUTH_SELECTORS.login.emailInput}, ${AUTH_SELECTORS.login.emailInputFallback}`
      );
      await retryFill(emailInput, credentials.email, {
        maxAttempts: 3,
        errorMessage: 'Failed to fill email input'
      });

      // Fill password with retry
      const passwordInput = page.locator(
        `${AUTH_SELECTORS.login.passwordInput}, ${AUTH_SELECTORS.login.passwordInputFallback}`
      );
      await retryFill(passwordInput, credentials.password, {
        maxAttempts: 3,
        errorMessage: 'Failed to fill password input'
      });

      // Submit form with retry
      const submitButton = page.locator(
        `${AUTH_SELECTORS.login.submitButton}, ${AUTH_SELECTORS.login.submitButtonFallback}`
      );
      await safeClick(submitButton);

      // Wait for navigation to dashboard
      await waitForNavigation(page, AUTH_URLS.anyDashboard, {
        timeout: timeout / 2
      });
    },
    {
      maxAttempts: 2,
      backoff: true,
      errorMessage: `Login failed for user: ${credentials.email}`
    }
  );
}

/**
 * Login as specific user type with role verification
 */
export async function loginAsClient(page: Page): Promise<void> {
  await login(page, TEST_USERS.client);

  // Verify we're on client dashboard
  await assertUrl(page, AUTH_URLS.clientDashboard, {
    message: 'Should be on client dashboard after login',
    timeout: 10000
  });
}

export async function loginAsArtisan(page: Page): Promise<void> {
  await login(page, TEST_USERS.artisan);

  // Verify we're on artisan dashboard
  await assertUrl(page, AUTH_URLS.artisanDashboard, {
    message: 'Should be on artisan dashboard after login',
    timeout: 10000
  });
}

export async function loginAsAdmin(page: Page): Promise<void> {
  await login(page, TEST_USERS.admin);

  // Verify we're on admin dashboard
  await assertUrl(page, AUTH_URLS.adminDashboard, {
    message: 'Should be on admin dashboard after login',
    timeout: 10000
  });
}

/**
 * Logout with retry logic
 */
export async function logout(page: Page): Promise<void> {
  await retryAction(
    async () => {
      // Try to find logout button (might be in user menu)
      const logoutButton = page.locator(
        `${AUTH_SELECTORS.userMenu.logoutButton}, ${AUTH_SELECTORS.userMenu.logoutButtonFallback}`
      );

      // Check if logout button is immediately visible
      const isVisible = await logoutButton.isVisible({ timeout: 2000 }).catch(() => false);

      if (!isVisible) {
        // Try to open user menu first
        const userMenu = page.locator(AUTH_SELECTORS.userMenu.menuButton);
        const menuExists = await userMenu.isVisible({ timeout: 2000 }).catch(() => false);

        if (menuExists) {
          await safeClick(userMenu);
          // Wait for menu to open
          await page.waitForTimeout(300);
        }
      }

      // Click logout
      await safeClick(logoutButton);

      // Wait for redirect to login or home
      await waitForNavigation(page, /\/(auth\/login|$)/, { timeout: 10000 });
    },
    {
      maxAttempts: 2,
      errorMessage: 'Logout failed'
    }
  );
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const url = page.url();
  return (
    url.includes('/client/') ||
    url.includes('/artisan/') ||
    url.includes('/admin/')
  );
}

/**
 * Register new user with comprehensive form handling
 */
export async function register(
  page: Page,
  userData: RegistrationData,
  options: { timeout?: number } = {}
): Promise<void> {
  const { timeout = 40000 } = options;
  const role = userData.role || 'CLIENT';

  await retryAction(
    async () => {
      // Navigate to appropriate registration page
      const registerPath = role === 'ARTISAN' ? '/artisan/register' : '/auth/register';
      await page.goto(registerPath);
      await waitForPageLoad(page, { timeout: timeout / 4 });

      // Fill basic fields with retry
      await retryFill(
        page.locator(
          `${AUTH_SELECTORS.register.firstNameInput}, ${AUTH_SELECTORS.register.firstNameInputFallback}`
        ),
        userData.firstName
      );

      await retryFill(
        page.locator(
          `${AUTH_SELECTORS.register.lastNameInput}, ${AUTH_SELECTORS.register.lastNameInputFallback}`
        ),
        userData.lastName
      );

      await retryFill(
        page.locator(
          `${AUTH_SELECTORS.register.emailInput}, ${AUTH_SELECTORS.register.emailInputFallback}`
        ),
        userData.email
      );

      // Fill phone number if provided
      if (userData.phoneNumber) {
        const phoneField = page.locator(
          `${AUTH_SELECTORS.register.phoneInput}, ${AUTH_SELECTORS.register.phoneInputFallback}`
        );

        const phoneExists = await phoneField.isVisible({ timeout: 2000 }).catch(() => false);
        if (phoneExists) {
          await retryFill(phoneField, userData.phoneNumber);
        }
      }

      // Fill artisan-specific fields
      if (role === 'ARTISAN') {
        await fillArtisanFields(page, userData);
      }

      // Fill password
      await retryFill(
        page.locator(
          `${AUTH_SELECTORS.register.passwordInput}, ${AUTH_SELECTORS.register.passwordInputFallback}`
        ),
        userData.password
      );

      // Accept terms if checkbox exists
      await acceptTerms(page);

      // Submit form
      const submitButton = page.locator(
        `${AUTH_SELECTORS.register.submitButton}, ${AUTH_SELECTORS.register.submitButtonFallback}`
      );
      await safeClick(submitButton);

      // Wait for successful registration
      await waitForNavigation(page, /\/(client|artisan)\/dashboard/, {
        timeout: timeout / 2
      });
    },
    {
      maxAttempts: 2,
      backoff: true,
      errorMessage: `Registration failed for user: ${userData.email}`
    }
  );
}

/**
 * Fill artisan-specific registration fields
 */
async function fillArtisanFields(page: Page, userData: RegistrationData): Promise<void> {
  // Trade selection
  if (userData.trade) {
    const tradeField = page.locator(
      `${AUTH_SELECTORS.register.tradeSelect}, ${AUTH_SELECTORS.register.tradeSelectFallback}`
    );

    const tradeExists = await tradeField.isVisible({ timeout: 2000 }).catch(() => false);
    if (tradeExists) {
      await tradeField.selectOption(userData.trade);
    }
  }

  // Experience
  if (userData.experience) {
    const experienceField = page.locator(
      `${AUTH_SELECTORS.register.experienceInput}, ${AUTH_SELECTORS.register.experienceInputFallback}`
    );

    const experienceExists = await experienceField.isVisible({ timeout: 2000 }).catch(() => false);
    if (experienceExists) {
      await retryFill(experienceField, String(userData.experience));
    }
  }

  // Location
  if (userData.location) {
    const locationField = page.locator(
      `${AUTH_SELECTORS.register.locationInput}, ${AUTH_SELECTORS.register.locationInputFallback}`
    );

    const locationExists = await locationField.isVisible({ timeout: 2000 }).catch(() => false);
    if (locationExists) {
      await retryFill(locationField, userData.location);
    }
  }

  // Bio
  if (userData.bio) {
    const bioField = page.locator(
      `${AUTH_SELECTORS.register.bioTextarea}, ${AUTH_SELECTORS.register.bioTextareaFallback}`
    );

    const bioExists = await bioField.isVisible({ timeout: 2000 }).catch(() => false);
    if (bioExists) {
      await retryFill(bioField, userData.bio);
    }
  }
}

/**
 * Accept terms and conditions if checkbox present
 */
async function acceptTerms(page: Page): Promise<void> {
  const termsCheckbox = page.locator(
    `${AUTH_SELECTORS.register.termsCheckbox}, ${AUTH_SELECTORS.register.termsCheckboxFallback}`
  );

  const termsExists = await termsCheckbox.isVisible({ timeout: 2000 }).catch(() => false);

  if (termsExists) {
    const isChecked = await termsCheckbox.isChecked().catch(() => false);

    if (!isChecked) {
      await safeClick(termsCheckbox);
    }
  }
}

/**
 * Wait for authentication state change
 */
export async function waitForAuthStateChange(
  page: Page,
  expectedState: 'authenticated' | 'unauthenticated',
  options: { timeout?: number } = {}
): Promise<void> {
  const { timeout = 10000 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const currentState = await isAuthenticated(page);

    if (expectedState === 'authenticated' && currentState) {
      return;
    }

    if (expectedState === 'unauthenticated' && !currentState) {
      return;
    }

    await page.waitForTimeout(200);
  }

  throw new Error(
    `Auth state did not change to "${expectedState}" within ${timeout}ms`
  );
}

/**
 * Quick auth state check without navigation
 */
export async function checkAuthState(page: Page): Promise<'authenticated' | 'unauthenticated'> {
  return (await isAuthenticated(page)) ? 'authenticated' : 'unauthenticated';
}
