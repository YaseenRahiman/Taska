import { Page, expect } from '@playwright/test';
import { FormFillingHelper } from './form-filling';
import { FormValidationHelper } from './form-validation';
import { ErrorReporter } from './error-reporter';

/**
 * Enhanced Authentication Helper
 * Uses improved form filling and validation for reliable auth operations
 */

const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:3001';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export interface TestUser {
  email: string;
  password: string;
  role: 'CLIENT' | 'ARTISAN' | 'ADMIN';
  dashboardPath: string;
}

export const TEST_USERS = {
  CLIENT: {
    email: 'client@test.com',
    password: 'Test123!',
    role: 'CLIENT' as const,
    dashboardPath: '/client/dashboard',
  },
  ARTISAN: {
    email: 'artisan@test.com',
    password: 'Test123!',
    role: 'ARTISAN' as const,
    dashboardPath: '/artisan/dashboard',
  },
  ARTISAN2: {
    email: 'artisan2@test.com',
    password: 'Test123!',
    role: 'ARTISAN' as const,
    dashboardPath: '/artisan/dashboard',
  },
  ADMIN: {
    email: 'admin@test.com',
    password: 'Test123!',
    role: 'ADMIN' as const,
    dashboardPath: '/admin/dashboard',
  },
};

export class AuthHelper {
  /**
   * Enhanced login with validation and error reporting
   */
  static async login(
    page: Page,
    user: TestUser,
    options: {
      waitForDashboard?: boolean;
      validateForm?: boolean;
    } = {}
  ): Promise<{ success: boolean; error?: string }> {
    const opts = {
      waitForDashboard: true,
      validateForm: true,
      ...options,
    };

    console.log(`🔐 Logging in as ${user.role}: ${user.email}`);

    try {
      // Navigate to login page
      await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle' });

      // Fill email field
      const emailResult = await FormFillingHelper.fillEmail(page, user.email, {
        waitForVisible: true,
        verifyValue: true,
      });

      if (!emailResult.success) {
        return {
          success: false,
          error: `Failed to fill email: ${emailResult.error}`,
        };
      }

      // Fill password field
      const passwordResult = await FormFillingHelper.fillPassword(page, user.password, {
        waitForVisible: true,
      });

      if (!passwordResult.success) {
        return {
          success: false,
          error: `Failed to fill password: ${passwordResult.error}`,
        };
      }

      // Validate form before submission if requested
      if (opts.validateForm) {
        await FormValidationHelper.waitForValidationToSettle(page);

        const canSubmit = await FormValidationHelper.canSubmitForm(page);
        if (!canSubmit.canSubmit) {
          const validation = await FormValidationHelper.validateFormReadyForSubmit(page);
          const report = FormValidationHelper.formatValidationReport(validation);

          console.log('  ❌ Login form validation failed:');
          console.log(report);

          return {
            success: false,
            error: `Form validation failed: ${canSubmit.reason}`,
          };
        }
      }

      // Submit form
      const submitResult = await FormFillingHelper.submitForm(page, 'form', {
        validateBefore: opts.validateForm,
        waitForNavigation: true,
      });

      if (!submitResult.success) {
        return {
          success: false,
          error: `Form submission failed: ${submitResult.error}`,
        };
      }

      if (opts.waitForDashboard) {
        // Wait for redirect to dashboard
        await page.waitForURL(`**${user.dashboardPath}`, { timeout: 10000 });

        // Verify we're on the correct dashboard
        const currentUrl = page.url();
        if (!currentUrl.includes(user.dashboardPath)) {
          return {
            success: false,
            error: `Expected URL to contain ${user.dashboardPath}, got ${currentUrl}`,
          };
        }

        console.log(`  ✅ Successfully logged in and redirected to ${user.dashboardPath}`);
      } else {
        console.log(`  ✅ Successfully logged in`);
      }

      // Verify token is saved in localStorage
      const token = await page.evaluate(() => localStorage.getItem('token'));
      if (!token) {
        return {
          success: false,
          error: 'Auth token not found in localStorage after login',
        };
      }

      return { success: true };

    } catch (error: any) {
      console.error(`  ❌ Login failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Enhanced registration with validation
   */
  static async register(
    page: Page,
    userData: {
      email: string;
      password: string;
      firstName?: string;
      lastName?: string;
      role: 'CLIENT' | 'ARTISAN';
    },
    options: {
      validateForm?: boolean;
      waitForRedirect?: boolean;
    } = {}
  ): Promise<{ success: boolean; error?: string }> {
    const opts = {
      validateForm: true,
      waitForRedirect: true,
      ...options,
    };

    console.log(`📝 Registering new user: ${userData.email} as ${userData.role}`);

    try {
      // Navigate to registration page
      await page.goto(`${BASE_URL}/auth/register`, { waitUntil: 'networkidle' });

      // Prepare form fields
      const fields = [
        {
          name: 'Email',
          value: userData.email,
          selectors: [
            'input[type="email"]',
            'input[name="email"]',
            '#email',
          ],
        },
        {
          name: 'Password',
          value: userData.password,
          selectors: [
            'input[type="password"]',
            'input[name="password"]',
            '#password',
          ],
        },
      ];

      // Add optional fields if provided
      if (userData.firstName) {
        fields.push({
          name: 'First Name',
          value: userData.firstName,
          selectors: [
            'input[name="firstName"]',
            'input[name="first_name"]',
            '#firstName',
            '[placeholder*="First" i]',
          ],
        });
      }

      if (userData.lastName) {
        fields.push({
          name: 'Last Name',
          value: userData.lastName,
          selectors: [
            'input[name="lastName"]',
            'input[name="last_name"]',
            '#lastName',
            '[placeholder*="Last" i]',
          ],
        });
      }

      // Fill and validate form
      const fillResult = await FormFillingHelper.fillAndValidateForm(page, fields);

      if (!fillResult.success) {
        const report = FormFillingHelper.generateFillingReport(fillResult.results);
        console.log('  ❌ Form filling failed:');
        console.log(report);

        if (fillResult.validationReport) {
          console.log(fillResult.validationReport);
        }

        return {
          success: false,
          error: 'Failed to fill registration form',
        };
      }

      // Submit form
      const submitResult = await FormFillingHelper.submitForm(page, 'form', {
        validateBefore: opts.validateForm,
        waitForNavigation: opts.waitForRedirect,
      });

      if (!submitResult.success) {
        return {
          success: false,
          error: `Registration submission failed: ${submitResult.error}`,
        };
      }

      console.log('  ✅ Registration successful');

      return { success: true };

    } catch (error: any) {
      console.error(`  ❌ Registration failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Login as CLIENT user
   */
  static async loginAsClient(page: Page): Promise<{ success: boolean; error?: string }> {
    return this.login(page, TEST_USERS.CLIENT);
  }

  /**
   * Login as ARTISAN user
   */
  static async loginAsArtisan(page: Page): Promise<{ success: boolean; error?: string }> {
    return this.login(page, TEST_USERS.ARTISAN);
  }

  /**
   * Login as ADMIN user
   */
  static async loginAsAdmin(page: Page): Promise<{ success: boolean; error?: string }> {
    return this.login(page, TEST_USERS.ADMIN);
  }

  /**
   * Logout current user
   */
  static async logout(page: Page): Promise<void> {
    console.log('🔓 Logging out...');

    await page.evaluate(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    });

    await page.goto(BASE_URL);

    console.log('  ✅ Successfully logged out');
  }

  /**
   * Get authentication token
   */
  static async getAuthToken(page: Page): Promise<string | null> {
    return await page.evaluate(() => localStorage.getItem('token'));
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(page: Page): Promise<boolean> {
    const token = await this.getAuthToken(page);
    return token !== null;
  }

  /**
   * Verify user has correct role
   */
  static async verifyUserRole(
    page: Page,
    expectedRole: 'CLIENT' | 'ARTISAN' | 'ADMIN'
  ): Promise<boolean> {
    const userRole = await page.evaluate(() => {
      const userStr = localStorage.getItem('user');
      if (!userStr) return null;
      const user = JSON.parse(userStr);
      return user.role;
    });

    return userRole === expectedRole;
  }

  /**
   * Clear all auth data
   */
  static async clearAuth(page: Page): Promise<void> {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    await page.context().clearCookies();
  }
}
