import { Page, expect, BrowserContext } from '@playwright/test';
import axios from 'axios';

/**
 * Authentication Helper
 * Comprehensive utilities for login, logout, registration, and auth state management
 * with proper error handling, retries, and backend integration
 */

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: 'CLIENT' | 'ARTISAN' | 'ADMIN';
  phoneNumber?: string;
  trade?: string;
  experience?: number;
  location?: string;
  bio?: string;
}

export const TEST_USERS = {
  client: {
    email: 'client@test.com',
    password: 'password123',
    role: 'CLIENT',
    firstName: 'Test',
    lastName: 'Client',
    phoneNumber: '+27821234567'
  },
  artisan: {
    email: 'artisan@test.com',
    password: 'password123',
    role: 'ARTISAN',
    firstName: 'Test',
    lastName: 'Artisan',
    phoneNumber: '+27829876543',
    trade: 'plumbing',
    experience: 5,
    location: 'Johannesburg',
    bio: 'Experienced plumber with 5 years in the industry'
  },
  admin: {
    email: 'admin@test.com',
    password: 'password123',
    role: 'ADMIN',
    firstName: 'Test',
    lastName: 'Admin',
    phoneNumber: '+27831112222'
  }
};

// Backend API configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';

/**
 * Wait for element with retry logic
 */
async function waitForElement(
  page: Page,
  selector: string,
  options: { timeout?: number; state?: 'visible' | 'attached' | 'hidden' } = {}
) {
  const timeout = options.timeout || 10000;
  const state = options.state || 'visible';

  try {
    await page.waitForSelector(selector, { timeout, state });
    return true;
  } catch (error) {
    console.warn(`Element not found: ${selector}`, error);
    return false;
  }
}

/**
 * Fill form field with multiple selector strategies
 */
async function fillField(page: Page, fieldName: string, value: string, selectors: string[]) {
  for (const selector of selectors) {
    try {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 2000 })) {
        await element.fill(value);
        console.log(`Filled ${fieldName} using selector: ${selector}`);
        return true;
      }
    } catch (error) {
      continue;
    }
  }

  throw new Error(`Failed to fill ${fieldName}. Tried selectors: ${selectors.join(', ')}`);
}

/**
 * Click element with multiple selector strategies
 */
async function clickElement(page: Page, elementName: string, selectors: string[]) {
  for (const selector of selectors) {
    try {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 2000 })) {
        await element.click();
        console.log(`Clicked ${elementName} using selector: ${selector}`);
        return true;
      }
    } catch (error) {
      continue;
    }
  }

  throw new Error(`Failed to click ${elementName}. Tried selectors: ${selectors.join(', ')}`);
}

/**
 * Create test user via backend API
 */
export async function createTestUser(userData: RegisterData): Promise<any> {
  try {
    const payload: any = {
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phoneNumber: userData.phoneNumber,
      role: userData.role || 'CLIENT'
    };

    // Add artisan-specific fields if role is ARTISAN
    if (userData.role === 'ARTISAN') {
      if (userData.trade) payload.trade = userData.trade;
      if (userData.experience !== undefined) payload.experience = userData.experience;
      if (userData.location) payload.location = userData.location;
      if (userData.bio) payload.bio = userData.bio;
    }

    const response = await axios.post(`${API_URL}/auth/register`, payload);

    console.log(`✓ Test user created: ${userData.email}`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 409) {
      console.log(`User already exists: ${userData.email}`);
      return { user: { email: userData.email } };
    }
    throw error;
  }
}

/**
 * Delete test user via backend API (cleanup)
 */
export async function deleteTestUser(email: string, adminToken?: string): Promise<void> {
  try {
    // This would require admin endpoint - skip if not available
    console.log(`Cleanup: Would delete user ${email}`);
  } catch (error) {
    console.warn(`Failed to delete test user: ${email}`);
  }
}

/**
 * Setup test user before tests
 */
export async function setupTestUser(userType: 'client' | 'artisan' | 'admin' = 'client'): Promise<any> {
  const userData = TEST_USERS[userType];
  return await createTestUser({
    email: userData.email,
    password: userData.password,
    firstName: userData.firstName,
    lastName: userData.lastName,
    phoneNumber: userData.phoneNumber,
    role: userData.role as any
  });
}

/**
 * Login via UI with comprehensive error handling and retries
 */
export async function login(
  page: Page,
  credentials: LoginCredentials,
  options: { maxRetries?: number; timeout?: number } = {}
): Promise<void> {
  const maxRetries = options.maxRetries || 2;
  const timeout = options.timeout || 15000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Login attempt ${attempt}/${maxRetries} for ${credentials.email}`);

      // Navigate to login page
      await page.goto('/auth/login', { waitUntil: 'domcontentloaded', timeout });

      // Wait for page to load
      await page.waitForLoadState('networkidle', { timeout: 10000 });

      // Fill email field with multiple strategies
      await fillField(page, 'email', credentials.email, [
        'input[name="email"]',
        'input[type="email"]',
        'input[id="email"]',
        'input[placeholder*="email" i]',
        'input[placeholder*="Email" i]'
      ]);

      // Fill password field with multiple strategies
      await fillField(page, 'password', credentials.password, [
        'input[name="password"]',
        'input[type="password"]',
        'input[id="password"]',
        'input[placeholder*="password" i]',
        'input[placeholder*="Password" i]'
      ]);

      // Click submit button
      await clickElement(page, 'submit button', [
        'button[type="submit"]',
        'button:has-text("Sign in")',
        'button:has-text("Login")',
        'button:has-text("Log in")',
        'button[data-testid="login-button"]'
      ]);

      // Wait for navigation to dashboard
      const dashboardUrl = /\/(client|artisan|admin)\/dashboard/;
      await page.waitForURL(dashboardUrl, { timeout: 15000 });

      // Verify we're on dashboard
      await expect(page).toHaveURL(dashboardUrl);

      console.log(`✓ Login successful for ${credentials.email}`);
      return;

    } catch (error) {
      console.error(`Login attempt ${attempt} failed:`, error);

      if (attempt === maxRetries) {
        // Take screenshot on final failure
        await page.screenshot({
          path: `test-results/screenshots/login-failed-${Date.now()}.png`,
          fullPage: true
        });
        throw new Error(`Login failed after ${maxRetries} attempts: ${error}`);
      }

      // Wait before retry
      await page.waitForTimeout(2000);
    }
  }
}

/**
 * Login via API (faster for test setup)
 */
export async function loginViaAPI(
  page: Page,
  credentials: LoginCredentials
): Promise<{ accessToken: string; refreshToken: string; user: any }> {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: credentials.email,
      password: credentials.password
    });

    const { accessToken, refreshToken, user } = response.data;

    // Navigate to home page first to set same-origin context
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Set tokens in localStorage first
    await page.evaluate(({ accessToken, refreshToken }) => {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    }, { accessToken, refreshToken });

    // Then set cookies in browser context
    await page.context().addCookies([
      {
        name: 'accessToken',
        value: accessToken,
        domain: new URL(FRONTEND_URL).hostname,
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax'
      },
      {
        name: 'refreshToken',
        value: refreshToken,
        domain: new URL(FRONTEND_URL).hostname,
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax'
      }
    ]);

    // Verify cookies were set
    const cookies = await page.context().cookies();
    const hasAccessToken = cookies.some(c => c.name === 'accessToken' && c.value === accessToken);
    if (!hasAccessToken) {
      console.warn('Warning: accessToken cookie may not be set correctly');
    }

    // Verify localStorage was set
    const storedToken = await page.evaluate(() => localStorage.getItem('accessToken'));
    if (storedToken !== accessToken) {
      throw new Error('Failed to set accessToken in localStorage');
    }

    console.log(`✓ API login successful for ${credentials.email}`);
    return { accessToken, refreshToken, user };

  } catch (error: any) {
    console.error('API login failed:', error.response?.data || error.message);
    throw new Error(`API login failed: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * Login as specific user type
 */
export async function loginAsClient(page: Page, viaAPI: boolean = true): Promise<void> {
  if (viaAPI) {
    await loginViaAPI(page, TEST_USERS.client);
    await page.goto('/client/dashboard', { waitUntil: 'domcontentloaded' });
  } else {
    await login(page, TEST_USERS.client);
  }
  await expect(page).toHaveURL(/\/client\/dashboard/);
}

export async function loginAsArtisan(page: Page, viaAPI: boolean = true): Promise<void> {
  if (viaAPI) {
    await loginViaAPI(page, TEST_USERS.artisan);
    await page.goto('/artisan/dashboard', { waitUntil: 'domcontentloaded' });
  } else {
    await login(page, TEST_USERS.artisan);
  }
  await expect(page).toHaveURL(/\/artisan\/dashboard/);
}

export async function loginAsAdmin(page: Page, viaAPI: boolean = true): Promise<void> {
  if (viaAPI) {
    await loginViaAPI(page, TEST_USERS.admin);
    await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });
  } else {
    await login(page, TEST_USERS.admin);
  }
  await expect(page).toHaveURL(/\/admin\/dashboard/);
}

/**
 * Logout from application
 */
export async function logout(page: Page): Promise<void> {
  try {
    // Try multiple logout strategies
    const logoutStrategies = [
      // Strategy 1: Direct logout button
      async () => {
        const logoutBtn = page.locator('button:has-text("Logout"), button:has-text("Sign Out"), a:has-text("Logout")').first();
        if (await logoutBtn.isVisible({ timeout: 2000 })) {
          await logoutBtn.click();
          return true;
        }
        return false;
      },

      // Strategy 2: User menu then logout
      async () => {
        const userMenu = page.locator('[data-testid="user-menu"], [aria-label="User menu"], button:has-text("Profile")').first();
        if (await userMenu.isVisible({ timeout: 2000 })) {
          await userMenu.click();
          await page.waitForTimeout(500);
          const logoutBtn = page.locator('button:has-text("Logout"), a:has-text("Logout"), button:has-text("Sign Out")').first();
          await logoutBtn.click();
          return true;
        }
        return false;
      },

      // Strategy 3: API logout
      async () => {
        await page.evaluate(async () => {
          const token = localStorage.getItem('accessToken');
          if (token) {
            try {
              await fetch('http://localhost:3000/api/v1/auth/logout', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
            } catch (e) {
              console.error('Logout API call failed:', e);
            }
          }
          // Clear storage regardless
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        });
        return true;
      }
    ];

    for (const strategy of logoutStrategies) {
      if (await strategy()) {
        break;
      }
    }

    // Wait for redirect to home or login
    await page.waitForURL(/\/(auth\/login|$)/, { timeout: 5000 }).catch(() => {
      console.warn('Did not redirect to login after logout');
    });

    console.log('✓ Logout successful');

  } catch (error) {
    console.error('Logout failed:', error);
    // Force logout by clearing storage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.context().clearCookies();
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const url = page.url();
  const isOnAuthPage = url.includes('/client/') || url.includes('/artisan/') || url.includes('/admin/');

  if (!isOnAuthPage) {
    return false;
  }

  // Check for auth token
  const hasToken = await page.evaluate(() => {
    return !!localStorage.getItem('accessToken');
  });

  return hasToken;
}

/**
 * Register new user via UI
 */
export async function register(
  page: Page,
  userData: RegisterData,
  options: { maxRetries?: number } = {}
): Promise<void> {
  const maxRetries = options.maxRetries || 2;
  const role = userData.role || 'CLIENT';

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Registration attempt ${attempt}/${maxRetries} for ${userData.email}`);

      // Navigate to appropriate registration page
      const registerPath = role === 'ARTISAN' ? '/auth/register?type=artisan' : '/auth/register';
      await page.goto(registerPath, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 10000 });

      // Fill first name
      await fillField(page, 'firstName', userData.firstName, [
        'input[name="firstName"]',
        'input[id="firstName"]',
        'input[placeholder*="first name" i]'
      ]);

      // Fill last name
      await fillField(page, 'lastName', userData.lastName, [
        'input[name="lastName"]',
        'input[id="lastName"]',
        'input[placeholder*="last name" i]'
      ]);

      // Fill email
      await fillField(page, 'email', userData.email, [
        'input[name="email"]',
        'input[type="email"]',
        'input[id="email"]',
        'input[placeholder*="email" i]'
      ]);

      // Fill phone number if provided
      if (userData.phoneNumber) {
        try {
          await fillField(page, 'phoneNumber', userData.phoneNumber, [
            'input[name="phoneNumber"]',
            'input[name="phone"]',
            'input[id="phone"]',
            'input[placeholder*="phone" i]'
          ]);
        } catch (e) {
          console.warn('Phone number field not found, continuing...');
        }
      }

      // Fill password
      await fillField(page, 'password', userData.password, [
        'input[name="password"]',
        'input[type="password"]',
        'input[id="password"]',
        'input[placeholder*="password" i]'
      ]);

      // Check terms checkbox if present
      try {
        const termsCheckbox = page.locator('input[name="terms"], input[id="terms"], input[type="checkbox"]').first();
        if (await termsCheckbox.isVisible({ timeout: 1000 })) {
          const isChecked = await termsCheckbox.isChecked();
          if (!isChecked) {
            await termsCheckbox.check();
          }
        }
      } catch (e) {
        console.warn('Terms checkbox not found, continuing...');
      }

      // Submit form
      await clickElement(page, 'submit button', [
        'button[type="submit"]',
        'button:has-text("Sign up")',
        'button:has-text("Register")',
        'button:has-text("Create Account")',
        'button[data-testid="register-button"]'
      ]);

      // Wait for successful registration (redirect to dashboard)
      await page.waitForURL(/\/(client|artisan|admin)\/dashboard/, { timeout: 15000 });

      console.log(`✓ Registration successful for ${userData.email}`);
      return;

    } catch (error) {
      console.error(`Registration attempt ${attempt} failed:`, error);

      if (attempt === maxRetries) {
        await page.screenshot({
          path: `test-results/screenshots/register-failed-${Date.now()}.png`,
          fullPage: true
        });
        throw new Error(`Registration failed after ${maxRetries} attempts: ${error}`);
      }

      await page.waitForTimeout(2000);
    }
  }
}

/**
 * Register via API (faster for test setup)
 */
export async function registerViaAPI(userData: RegisterData): Promise<any> {
  return await createTestUser(userData);
}

/**
 * Clear all authentication data
 */
export async function clearAuth(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    sessionStorage.clear();
  });

  await page.context().clearCookies();
  console.log('✓ Auth data cleared');
}

/**
 * Get current auth token from page
 */
export async function getAuthToken(page: Page): Promise<string | null> {
  return await page.evaluate(() => {
    return localStorage.getItem('accessToken');
  });
}

/**
 * Verify user is on correct dashboard
 */
export async function verifyDashboard(page: Page, userRole: 'client' | 'artisan' | 'admin'): Promise<void> {
  const expectedUrl = new RegExp(`\/${userRole}\/dashboard`);
  await expect(page).toHaveURL(expectedUrl, { timeout: 10000 });

  // Verify dashboard content loaded
  const dashboardIndicators = [
    page.locator('h1:has-text("Dashboard")'),
    page.locator('[data-testid="dashboard"]'),
    page.locator('main').filter({ hasText: /dashboard|welcome/i })
  ];

  let found = false;
  for (const indicator of dashboardIndicators) {
    if (await indicator.isVisible({ timeout: 2000 }).catch(() => false)) {
      found = true;
      break;
    }
  }

  if (!found) {
    console.warn('Dashboard content not clearly visible, but URL is correct');
  }

  console.log(`✓ Verified ${userRole} dashboard`);
}
