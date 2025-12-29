import { Page, expect } from '@playwright/test';

/**
 * E2E Authentication Helpers
 * Provides reusable authentication functions for Playwright tests
 */

const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:3001';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export interface TestUser {
  email: string;
  password: string;
  role: 'CLIENT' | 'ARTISAN' | 'ADMIN';
  dashboardPath: string;
}

// Test user credentials (matching test-seed.ts)
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

/**
 * Login as a specific user
 * @param page - Playwright Page object
 * @param user - User credentials from TEST_USERS
 * @param waitForDashboard - Whether to wait for dashboard redirect (default: true)
 */
export async function login(
  page: Page,
  user: TestUser,
  waitForDashboard: boolean = true
): Promise<void> {
  console.log(`🔐 Logging in as ${user.role}: ${user.email}`);

  // Navigate to login page
  await page.goto(`${BASE_URL}/auth/login`);

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Fill in credentials
  await page.fill('input[name="email"], input[type="email"]', user.email);
  await page.fill('input[name="password"], input[type="password"]', user.password);

  // Submit form
  await page.click('button[type="submit"]');

  if (waitForDashboard) {
    // Wait for redirect to dashboard
    await page.waitForURL(`**${user.dashboardPath}`, { timeout: 10000 });

    // Verify we're on the correct dashboard
    await expect(page).toHaveURL(new RegExp(user.dashboardPath));

    console.log(`  ✅ Successfully logged in and redirected to ${user.dashboardPath}`);
  } else {
    // Just wait for navigation to complete
    await page.waitForLoadState('networkidle');
    console.log(`  ✅ Successfully logged in`);
  }

  // Verify token is saved in localStorage
  const token = await page.evaluate(() => localStorage.getItem('token'));
  expect(token).toBeTruthy();
}

/**
 * Login as CLIENT user
 */
export async function loginAsClient(page: Page): Promise<void> {
  await login(page, TEST_USERS.CLIENT);
}

/**
 * Login as ARTISAN user
 */
export async function loginAsArtisan(page: Page): Promise<void> {
  await login(page, TEST_USERS.ARTISAN);
}

/**
 * Login as second ARTISAN user
 */
export async function loginAsArtisan2(page: Page): Promise<void> {
  await login(page, TEST_USERS.ARTISAN2);
}

/**
 * Login as ADMIN user
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  await login(page, TEST_USERS.ADMIN);
}

/**
 * Logout current user
 */
export async function logout(page: Page): Promise<void> {
  console.log('🔓 Logging out...');

  // Clear localStorage (which contains auth tokens)
  await page.evaluate(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  });

  // Navigate to home page
  await page.goto(BASE_URL);

  console.log('  ✅ Successfully logged out');
}

/**
 * Get authentication token from localStorage
 */
export async function getAuthToken(page: Page): Promise<string | null> {
  return await page.evaluate(() => localStorage.getItem('token'));
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const token = await getAuthToken(page);
  return token !== null;
}

/**
 * Login via API (faster than UI login)
 * Useful for setup in beforeEach hooks
 */
export async function loginViaAPI(
  page: Page,
  user: TestUser
): Promise<{ accessToken: string; refreshToken: string; user: any }> {
  console.log(`🚀 API Login as ${user.role}: ${user.email}`);

  const response = await page.request.post(`${API_URL}/auth/login`, {
    data: {
      email: user.email,
      password: user.password,
    },
  });

  expect(response.ok()).toBeTruthy();
  const data = await response.json();

  // Store tokens in localStorage
  await page.evaluate(({ accessToken, refreshToken }) => {
    localStorage.setItem('token', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }, data);

  console.log(`  ✅ API login successful`);

  return data;
}

/**
 * Register a new user via API
 * Useful for testing registration flow
 */
export async function registerViaAPI(
  page: Page,
  email: string,
  password: string,
  role: 'CLIENT' | 'ARTISAN'
): Promise<{ accessToken: string; user: any }> {
  console.log(`📝 Registering new user: ${email} as ${role}`);

  const response = await page.request.post(`${API_URL}/auth/register`, {
    data: {
      email,
      password,
      role,
      firstName: 'Test',
      lastName: 'User',
    },
  });

  expect(response.ok()).toBeTruthy();
  const data = await response.json();

  console.log(`  ✅ Registration successful`);

  return data;
}

/**
 * Setup authenticated page context
 * Use in test.beforeEach for tests requiring authentication
 */
export async function setupAuthenticatedPage(
  page: Page,
  user: TestUser
): Promise<void> {
  await loginViaAPI(page, user);
  await page.goto(`${BASE_URL}${user.dashboardPath}`);
  await page.waitForLoadState('networkidle');
}

/**
 * Verify user has correct role
 */
export async function verifyUserRole(
  page: Page,
  expectedRole: 'CLIENT' | 'ARTISAN' | 'ADMIN'
): Promise<void> {
  const userRole = await page.evaluate(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    const user = JSON.parse(userStr);
    return user.role;
  });

  expect(userRole).toBe(expectedRole);
}

/**
 * Wait for authentication to complete
 * Useful after login when redirect might be async
 */
export async function waitForAuth(page: Page, timeout: number = 5000): Promise<void> {
  await page.waitForFunction(
    () => {
      const token = localStorage.getItem('token');
      return token !== null && token !== '';
    },
    { timeout }
  );
}

/**
 * Clear all auth data and cookies
 * Use in test.afterEach for cleanup
 */
export async function clearAuth(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  await page.context().clearCookies();
}

/**
 * Navigate to a route that requires authentication
 * Will redirect to login if not authenticated
 */
export async function navigateAuthenticated(
  page: Page,
  path: string,
  user?: TestUser
): Promise<void> {
  const authenticated = await isAuthenticated(page);

  if (!authenticated && user) {
    await loginViaAPI(page, user);
  }

  await page.goto(`${BASE_URL}${path}`);
  await page.waitForLoadState('networkidle');
}
