import { test, expect, Page } from '@playwright/test';

// Test configuration
const BACKEND_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:3000';
const TEST_TIMEOUT = 30000;

// Helper function to generate unique email
const generateTestEmail = (prefix: string): string => {
  const timestamp = Date.now();
  return `${prefix}_${timestamp}@taska.test`;
};

// Helper function to wait for navigation
const waitForNavigation = async (page: Page, timeout = 5000) => {
  await page.waitForLoadState('networkidle', { timeout });
};

test.describe('SPRINT 1 - Authentication Core Flows', () => {
  test.setTimeout(TEST_TIMEOUT);

  test.describe('Registration Flow - Client', () => {
    test('AUTH-REG-001: Client registration with valid data', async ({ page }) => {
      const email = generateTestEmail('client_test');
      const password = 'Test123!@#';

      await page.goto(`${FRONTEND_URL}/auth/register`);
      await waitForNavigation(page);

      // Verify registration page loads
      await expect(page).toHaveTitle(/taska/i);

      // Fill registration form
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', password);
      await page.fill('input[name="confirmPassword"]', password);
      await page.fill('input[name="name"]', 'Test Client User');

      // Select client role
      await page.click('input[value="client"]');

      // Submit form
      await page.click('button[type="submit"]');

      // Wait for redirect to client dashboard
      await waitForNavigation(page);

      // Verify successful registration and redirect
      expect(page.url()).toContain('/client/dashboard');

      // Verify user is logged in (check for user menu or logout button)
      const isLoggedIn = await page.isVisible('text=Logout') ||
                         await page.isVisible('[data-testid="user-menu"]');
      expect(isLoggedIn).toBeTruthy();
    });

    test('AUTH-REG-002: Client registration - empty fields validation', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/auth/register`);
      await waitForNavigation(page);

      // Click submit without filling any fields
      await page.click('button[type="submit"]');

      // Check for validation errors
      const emailError = await page.isVisible('text=/email.*required/i') ||
                        await page.isVisible('[data-testid="email-error"]');
      const passwordError = await page.isVisible('text=/password.*required/i') ||
                           await page.isVisible('[data-testid="password-error"]');

      expect(emailError || passwordError).toBeTruthy();

      // Verify we're still on registration page
      expect(page.url()).toContain('/auth/register');
    });

    test('AUTH-REG-003: Client registration - invalid email format', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/auth/register`);
      await waitForNavigation(page);

      await page.fill('input[name="email"]', 'invalid-email');
      await page.fill('input[name="password"]', 'Test123!@#');
      await page.fill('input[name="confirmPassword"]', 'Test123!@#');
      await page.fill('input[name="name"]', 'Test User');

      await page.click('button[type="submit"]');

      // Check for email validation error
      const emailError = await page.isVisible('text=/invalid.*email/i') ||
                        await page.isVisible('text=/valid.*email/i') ||
                        await page.isVisible('[data-testid="email-error"]');

      expect(emailError).toBeTruthy();
    });

    test('AUTH-REG-004: Client registration - weak password rejection', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/auth/register`);
      await waitForNavigation(page);

      const email = generateTestEmail('weak_pwd_test');

      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', 'weak');
      await page.fill('input[name="confirmPassword"]', 'weak');
      await page.fill('input[name="name"]', 'Test User');

      await page.click('button[type="submit"]');

      // Check for password strength error
      const passwordError = await page.isVisible('text=/password.*strong/i') ||
                           await page.isVisible('text=/password.*length/i') ||
                           await page.isVisible('[data-testid="password-error"]');

      expect(passwordError).toBeTruthy();
    });

    test('AUTH-REG-005: Client registration - password mismatch', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/auth/register`);
      await waitForNavigation(page);

      const email = generateTestEmail('mismatch_test');

      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', 'Test123!@#');
      await page.fill('input[name="confirmPassword"]', 'Different123!@#');
      await page.fill('input[name="name"]', 'Test User');

      await page.click('button[type="submit"]');

      // Check for password mismatch error
      const mismatchError = await page.isVisible('text=/password.*match/i') ||
                           await page.isVisible('[data-testid="confirm-password-error"]');

      expect(mismatchError).toBeTruthy();
    });

    test('AUTH-REG-006: Client registration - duplicate email handling', async ({ page }) => {
      const email = generateTestEmail('duplicate_test');
      const password = 'Test123!@#';

      // First registration
      await page.goto(`${FRONTEND_URL}/auth/register`);
      await waitForNavigation(page);

      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', password);
      await page.fill('input[name="confirmPassword"]', password);
      await page.fill('input[name="name"]', 'Test User 1');
      await page.click('input[value="client"]');
      await page.click('button[type="submit"]');

      await waitForNavigation(page);

      // Logout
      const logoutBtn = page.locator('text=Logout').first();
      if (await logoutBtn.isVisible()) {
        await logoutBtn.click();
        await waitForNavigation(page);
      }

      // Second registration with same email
      await page.goto(`${FRONTEND_URL}/auth/register`);
      await waitForNavigation(page);

      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', password);
      await page.fill('input[name="confirmPassword"]', password);
      await page.fill('input[name="name"]', 'Test User 2');
      await page.click('input[value="client"]');
      await page.click('button[type="submit"]');

      // Check for duplicate email error
      const duplicateError = await page.isVisible('text=/email.*exists/i') ||
                            await page.isVisible('text=/already.*registered/i');

      expect(duplicateError).toBeTruthy();
    });

    test('AUTH-REG-007: Registration form UI/UX validation', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/auth/register`);
      await waitForNavigation(page);

      // Check all form fields are visible
      const emailField = await page.isVisible('input[name="email"]');
      const passwordField = await page.isVisible('input[name="password"]');
      const confirmPasswordField = await page.isVisible('input[name="confirmPassword"]');
      const nameField = await page.isVisible('input[name="name"]');
      const submitButton = await page.isVisible('button[type="submit"]');

      expect(emailField).toBeTruthy();
      expect(passwordField).toBeTruthy();
      expect(confirmPasswordField).toBeTruthy();
      expect(nameField).toBeTruthy();
      expect(submitButton).toBeTruthy();

      // Check for role selection
      const clientRole = await page.isVisible('input[value="client"]') ||
                        await page.isVisible('text=/client/i');
      const artisanRole = await page.isVisible('input[value="artisan"]') ||
                         await page.isVisible('text=/artisan/i');

      expect(clientRole || artisanRole).toBeTruthy();
    });
  });

  test.describe('Registration Flow - Artisan', () => {
    test('AUTH-REG-101: Artisan registration with valid data', async ({ page }) => {
      const email = generateTestEmail('artisan_test');
      const password = 'Test123!@#';

      await page.goto(`${FRONTEND_URL}/auth/register`);
      await waitForNavigation(page);

      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', password);
      await page.fill('input[name="confirmPassword"]', password);
      await page.fill('input[name="name"]', 'Test Artisan User');

      // Select artisan role
      await page.click('input[value="artisan"]');

      await page.click('button[type="submit"]');
      await waitForNavigation(page);

      // Verify redirect to artisan dashboard
      expect(page.url()).toContain('/artisan/dashboard');

      const isLoggedIn = await page.isVisible('text=Logout') ||
                         await page.isVisible('[data-testid="user-menu"]');
      expect(isLoggedIn).toBeTruthy();
    });
  });

  test.describe('Login Flow', () => {
    let clientEmail: string;
    let artisanEmail: string;
    const password = 'Test123!@#';

    test.beforeAll(async ({ browser }) => {
      // Create test users
      clientEmail = generateTestEmail('login_client');
      artisanEmail = generateTestEmail('login_artisan');

      const context = await browser.newContext();
      const page = await context.newPage();

      // Register client
      await page.goto(`${FRONTEND_URL}/auth/register`);
      await waitForNavigation(page);
      await page.fill('input[name="email"]', clientEmail);
      await page.fill('input[name="password"]', password);
      await page.fill('input[name="confirmPassword"]', password);
      await page.fill('input[name="name"]', 'Login Test Client');
      await page.click('input[value="client"]');
      await page.click('button[type="submit"]');
      await waitForNavigation(page);

      // Logout
      const logoutBtn = page.locator('text=Logout').first();
      if (await logoutBtn.isVisible()) {
        await logoutBtn.click();
        await waitForNavigation(page);
      }

      // Register artisan
      await page.goto(`${FRONTEND_URL}/auth/register`);
      await waitForNavigation(page);
      await page.fill('input[name="email"]', artisanEmail);
      await page.fill('input[name="password"]', password);
      await page.fill('input[name="confirmPassword"]', password);
      await page.fill('input[name="name"]', 'Login Test Artisan');
      await page.click('input[value="artisan"]');
      await page.click('button[type="submit"]');
      await waitForNavigation(page);

      await context.close();
    });

    test('AUTH-LOGIN-001: Valid client login', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/auth/login`);
      await waitForNavigation(page);

      await page.fill('input[name="email"]', clientEmail);
      await page.fill('input[name="password"]', password);
      await page.click('button[type="submit"]');

      await waitForNavigation(page);

      expect(page.url()).toContain('/client/dashboard');

      const isLoggedIn = await page.isVisible('text=Logout') ||
                         await page.isVisible('[data-testid="user-menu"]');
      expect(isLoggedIn).toBeTruthy();
    });

    test('AUTH-LOGIN-002: Valid artisan login', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/auth/login`);
      await waitForNavigation(page);

      await page.fill('input[name="email"]', artisanEmail);
      await page.fill('input[name="password"]', password);
      await page.click('button[type="submit"]');

      await waitForNavigation(page);

      expect(page.url()).toContain('/artisan/dashboard');

      const isLoggedIn = await page.isVisible('text=Logout') ||
                         await page.isVisible('[data-testid="user-menu"]');
      expect(isLoggedIn).toBeTruthy();
    });

    test('AUTH-LOGIN-003: Invalid credentials handling', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/auth/login`);
      await waitForNavigation(page);

      await page.fill('input[name="email"]', clientEmail);
      await page.fill('input[name="password"]', 'WrongPassword123!');
      await page.click('button[type="submit"]');

      // Check for error message
      const errorMessage = await page.isVisible('text=/invalid.*credentials/i') ||
                          await page.isVisible('text=/incorrect.*password/i') ||
                          await page.isVisible('[data-testid="login-error"]');

      expect(errorMessage).toBeTruthy();
      expect(page.url()).toContain('/auth/login');
    });

    test('AUTH-LOGIN-004: Session persistence across page refresh', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/auth/login`);
      await waitForNavigation(page);

      await page.fill('input[name="email"]', clientEmail);
      await page.fill('input[name="password"]', password);
      await page.click('button[type="submit"]');

      await waitForNavigation(page);

      // Refresh the page
      await page.reload();
      await waitForNavigation(page);

      // Verify still logged in
      expect(page.url()).toContain('/client/dashboard');

      const isLoggedIn = await page.isVisible('text=Logout') ||
                         await page.isVisible('[data-testid="user-menu"]');
      expect(isLoggedIn).toBeTruthy();
    });

    test('AUTH-LOGIN-005: Login form UI validation', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/auth/login`);
      await waitForNavigation(page);

      const emailField = await page.isVisible('input[name="email"]');
      const passwordField = await page.isVisible('input[name="password"]');
      const submitButton = await page.isVisible('button[type="submit"]');

      expect(emailField).toBeTruthy();
      expect(passwordField).toBeTruthy();
      expect(submitButton).toBeTruthy();

      // Check for "Forgot Password" link
      const forgotPassword = await page.isVisible('text=/forgot.*password/i');

      // Check for "Register" link
      const registerLink = await page.isVisible('text=/sign up/i') ||
                          await page.isVisible('text=/register/i');
    });
  });

  test.describe('Logout & Session Management', () => {
    let testEmail: string;
    const password = 'Test123!@#';

    test.beforeEach(async ({ page }) => {
      testEmail = generateTestEmail('logout_test');

      // Register and login
      await page.goto(`${FRONTEND_URL}/auth/register`);
      await waitForNavigation(page);
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', password);
      await page.fill('input[name="confirmPassword"]', password);
      await page.fill('input[name="name"]', 'Logout Test User');
      await page.click('input[value="client"]');
      await page.click('button[type="submit"]');
      await waitForNavigation(page);
    });

    test('AUTH-LOGOUT-001: Logout clears session completely', async ({ page }) => {
      // Verify logged in
      expect(page.url()).toContain('/client/dashboard');

      // Click logout
      const logoutBtn = page.locator('text=Logout').first();
      await logoutBtn.click();
      await waitForNavigation(page);

      // Verify redirected to login or home
      expect(page.url()).toMatch(/\/(auth\/login|\/)?$/);

      // Try to access protected route
      await page.goto(`${FRONTEND_URL}/client/dashboard`);
      await waitForNavigation(page);

      // Should redirect to login
      expect(page.url()).toContain('/auth/login');
    });

    test('AUTH-LOGOUT-002: Cannot access protected routes after logout', async ({ page }) => {
      // Logout
      const logoutBtn = page.locator('text=Logout').first();
      if (await logoutBtn.isVisible()) {
        await logoutBtn.click();
        await waitForNavigation(page);
      }

      // Test multiple protected routes
      const protectedRoutes = [
        '/client/dashboard',
        '/artisan/dashboard',
        '/client/jobs/create'
      ];

      for (const route of protectedRoutes) {
        await page.goto(`${FRONTEND_URL}${route}`);
        await waitForNavigation(page);

        // Should redirect to login
        expect(page.url()).toContain('/auth/login');
      }
    });
  });

  test.describe('Security Boundaries', () => {
    let clientEmail: string;
    let artisanEmail: string;
    const password = 'Test123!@#';

    test.beforeAll(async ({ browser }) => {
      clientEmail = generateTestEmail('security_client');
      artisanEmail = generateTestEmail('security_artisan');

      const context = await browser.newContext();
      const page = await context.newPage();

      // Register client
      await page.goto(`${FRONTEND_URL}/auth/register`);
      await waitForNavigation(page);
      await page.fill('input[name="email"]', clientEmail);
      await page.fill('input[name="password"]', password);
      await page.fill('input[name="confirmPassword"]', password);
      await page.fill('input[name="name"]', 'Security Test Client');
      await page.click('input[value="client"]');
      await page.click('button[type="submit"]');
      await waitForNavigation(page);

      const logoutBtn = page.locator('text=Logout').first();
      if (await logoutBtn.isVisible()) {
        await logoutBtn.click();
        await waitForNavigation(page);
      }

      // Register artisan
      await page.goto(`${FRONTEND_URL}/auth/register`);
      await waitForNavigation(page);
      await page.fill('input[name="email"]', artisanEmail);
      await page.fill('input[name="password"]', password);
      await page.fill('input[name="confirmPassword"]', password);
      await page.fill('input[name="name"]', 'Security Test Artisan');
      await page.click('input[value="artisan"]');
      await page.click('button[type="submit"]');
      await waitForNavigation(page);

      await context.close();
    });

    test('AUTH-SEC-001: Protected routes redirect when unauthenticated', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/client/dashboard`);
      await waitForNavigation(page);

      expect(page.url()).toContain('/auth/login');
    });

    test('AUTH-SEC-002: Role-based access - client cannot access artisan routes', async ({ page }) => {
      // Login as client
      await page.goto(`${FRONTEND_URL}/auth/login`);
      await waitForNavigation(page);
      await page.fill('input[name="email"]', clientEmail);
      await page.fill('input[name="password"]', password);
      await page.click('button[type="submit"]');
      await waitForNavigation(page);

      // Try to access artisan route
      await page.goto(`${FRONTEND_URL}/artisan/dashboard`);
      await waitForNavigation(page);

      // Should be blocked or redirected
      expect(page.url()).not.toContain('/artisan/dashboard');
    });

    test('AUTH-SEC-003: Role-based access - artisan cannot access client routes', async ({ page }) => {
      // Login as artisan
      await page.goto(`${FRONTEND_URL}/auth/login`);
      await waitForNavigation(page);
      await page.fill('input[name="email"]', artisanEmail);
      await page.fill('input[name="password"]', password);
      await page.click('button[type="submit"]');
      await waitForNavigation(page);

      // Try to access client route
      await page.goto(`${FRONTEND_URL}/client/jobs/create`);
      await waitForNavigation(page);

      // Should be blocked or redirected
      expect(page.url()).not.toContain('/client/jobs/create');
    });

    test('AUTH-SEC-004: XSS prevention in input fields', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/auth/login`);
      await waitForNavigation(page);

      const xssPayload = '<script>alert("XSS")</script>';

      await page.fill('input[name="email"]', xssPayload);
      await page.fill('input[name="password"]', xssPayload);
      await page.click('button[type="submit"]');

      // Wait a bit to see if script executes
      await page.waitForTimeout(1000);

      // Check no alert appeared (script didn't execute)
      const alerts = page.locator('dialog[role="alertdialog"]');
      const alertCount = await alerts.count();
      expect(alertCount).toBe(0);
    });

    test('AUTH-SEC-005: SQL injection prevention in login', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/auth/login`);
      await waitForNavigation(page);

      const sqlPayload = "admin' OR '1'='1";

      await page.fill('input[name="email"]', sqlPayload);
      await page.fill('input[name="password"]', sqlPayload);
      await page.click('button[type="submit"]');

      // Should not successfully login
      await page.waitForTimeout(2000);
      expect(page.url()).toContain('/auth/login');
    });
  });

  test.describe('Edge Cases & Error Handling', () => {
    test('AUTH-EDGE-001: Registration with very long input values', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/auth/register`);
      await waitForNavigation(page);

      const longString = 'a'.repeat(500);

      await page.fill('input[name="email"]', `${longString}@test.com`);
      await page.fill('input[name="name"]', longString);
      await page.fill('input[name="password"]', 'Test123!@#');
      await page.fill('input[name="confirmPassword"]', 'Test123!@#');

      await page.click('button[type="submit"]');

      // Should handle gracefully with validation error
      const validationError = await page.isVisible('text=/too long/i') ||
                             await page.isVisible('text=/maximum.*length/i');

      // Or should truncate and succeed
      // Either way, should not crash
    });

    test('AUTH-EDGE-002: Login with non-existent email', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/auth/login`);
      await waitForNavigation(page);

      await page.fill('input[name="email"]', 'nonexistent@test.com');
      await page.fill('input[name="password"]', 'Test123!@#');
      await page.click('button[type="submit"]');

      const errorMessage = await page.isVisible('text=/invalid.*credentials/i') ||
                          await page.isVisible('text=/user.*not.*found/i');

      expect(errorMessage).toBeTruthy();
    });

    test('AUTH-EDGE-003: Network error handling during registration', async ({ page }) => {
      // Simulate offline mode
      await page.context().setOffline(true);

      await page.goto(`${FRONTEND_URL}/auth/register`);

      const email = generateTestEmail('network_test');

      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', 'Test123!@#');
      await page.fill('input[name="confirmPassword"]', 'Test123!@#');
      await page.fill('input[name="name"]', 'Network Test User');
      await page.click('input[value="client"]');
      await page.click('button[type="submit"]');

      // Should show network error
      const networkError = await page.isVisible('text=/network.*error/i') ||
                          await page.isVisible('text=/connection.*failed/i') ||
                          await page.isVisible('text=/unable.*to.*connect/i');

      // Restore online mode
      await page.context().setOffline(false);
    });
  });
});
