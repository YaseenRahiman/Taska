import { Page } from '@playwright/test';

/**
 * User Management Helper
 * Utilities for creating and managing test users
 */

export interface TestUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'CLIENT' | 'ARTISAN' | 'ADMIN';
  phoneNumber?: string;
  trade?: string;
  experience?: number;
  location?: string;
  bio?: string;
}

/**
 * Generate a unique test user with timestamp to avoid collisions
 */
export function generateTestUser(role: 'CLIENT' | 'ARTISAN' | 'ADMIN' = 'ARTISAN'): TestUser {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);

  const baseUser = {
    email: `test.${role.toLowerCase()}.${timestamp}.${random}@playwright.test`,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: `${role} ${timestamp}`,
    role,
    // Generate valid SA phone number: +27 followed by 9 digits (total 12 chars)
    phoneNumber: `+2782${String(timestamp).slice(-7)}`
  };

  // Add artisan-specific fields if role is ARTISAN
  if (role === 'ARTISAN') {
    return {
      ...baseUser,
      trade: 'plumbing',
      experience: 5,
      location: 'Johannesburg',
      bio: 'Experienced artisan with quality workmanship'
    };
  }

  return baseUser;
}

/**
 * Create a new user via registration
 * Returns the user credentials for later login
 */
export async function createUser(page: Page, user: TestUser): Promise<TestUser> {
  // Listen for ALL console messages to debug registration flow
  page.on('console', msg => {
    console.log('Browser Console:', msg.text());
  });

  const registerPath = user.role === 'ARTISAN' ? '/artisan/register' : '/auth/register';

  await page.goto(registerPath);

  // Wait for form to be visible
  await page.waitForSelector('input[name="email"], input[type="email"]', { timeout: 5000 });

  // Fill registration form - fill required fields first
  await page.fill('input[name="firstName"], input[id="firstName"]', user.firstName);
  await page.fill('input[name="lastName"], input[id="lastName"]', user.lastName);
  await page.fill('input[name="email"], input[type="email"]', user.email);

  // Phone number is required - wait for it and fill it
  await page.waitForSelector('input[name="phoneNumber"], input[name="phone"]', { timeout: 5000 });
  await page.fill('input[name="phoneNumber"], input[name="phone"]', user.phoneNumber || '');

  // Fill artisan-specific fields if registering as artisan
  if (user.role === 'ARTISAN') {
    // Trade is required - wait for dropdown to be visible
    await page.waitForSelector('select[name="trade"], select[id="trade"]', { timeout: 5000 });
    await page.selectOption('select[name="trade"], select[id="trade"]', user.trade || 'plumbing');

    // Experience is required - wait and fill
    await page.waitForSelector('input[name="experience"], input[id="experience"]', { timeout: 5000 });
    await page.fill('input[name="experience"], input[id="experience"]', String(user.experience || 5));

    // Location is required - wait and fill
    await page.waitForSelector('input[name="location"], input[id="location"]', { timeout: 5000 });
    await page.fill('input[name="location"], input[id="location"]', user.location || 'Johannesburg');

    // Bio is optional but fill if provided
    const bioField = page.locator('textarea[name="bio"], textarea[id="bio"]');
    if (await bioField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await bioField.fill(user.bio || 'Experienced artisan with quality workmanship');
    }
  }

  // Password is required - wait for field and fill it
  await page.waitForSelector('input[name="password"]', { timeout: 5000 });
  await page.fill('input[name="password"]', user.password);

  // Terms checkbox is required - wait for it and check it
  await page.waitForSelector('input[name="terms"], input[id="terms"]', { timeout: 5000 });
  const termsCheckbox = page.locator('input[name="terms"], input[id="terms"]');
  const isChecked = await termsCheckbox.isChecked();
  if (!isChecked) {
    await termsCheckbox.check();
  }

  // Check if submit button is enabled before clicking
  const submitButton = page.locator('button[type="submit"]');
  const isEnabled = await submitButton.isEnabled();
  console.log('Submit button enabled:', isEnabled);

  // Wait a moment for React Hook Form to validate
  await page.waitForTimeout(500);

  // Check for any visible validation errors before submitting
  const errorElements = await page.locator('p.text-red-600, .text-red-600, [class*="error"]').all();
  if (errorElements.length > 0) {
    console.warn(`Found ${errorElements.length} validation errors before submit:`);
    for (const error of errorElements) {
      const errorText = await error.textContent();
      if (errorText && errorText.trim()) {
        console.warn('  -', errorText);
      }
    }
  }

  // Log all form values for debugging
  const formValues = await page.evaluate(() => {
    const form = document.querySelector('form');
    if (!form) return {};
    const data = new FormData(form);
    const values: Record<string, any> = {};
    for (const [key, value] of data.entries()) {
      values[key] = key === 'password' ? '[REDACTED]' : value;
    }
    return values;
  });
  console.log('Form values before submit:', formValues);


  // Submit registration
  await submitButton.click();

  // Wait for network request to complete
  await page.waitForResponse(response =>
    response.url().includes('/auth/register') && response.status() === 201,
    { timeout: 10000 }
  ).catch(() => console.warn('Registration API call not detected'));

  // Wait for navigation to start - important for catching router.push() redirects
  await page.waitForTimeout(2000); // Give time for state updates and redirect

  // Wait for successful registration (redirect to dashboard or login)
  try {
    // Increase timeout to 30 seconds for registration
    await page.waitForURL(/\/(client|artisan|admin)\/dashboard|auth\/login/, { timeout: 30000 });

    // Wait for dashboard content to actually render
    await page.waitForSelector('h1, main, [role="main"]', {
      state: 'visible',
      timeout: 10000
    }).catch(() => console.warn('Dashboard content not found, continuing'));

    // If redirected to login, log in with the new credentials
    if (page.url().includes('/auth/login')) {
      // Wait for page to fully load
      await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

      await page.fill('input[name="email"], input[type="email"]', user.email);
      await page.fill('input[name="password"], input[type="password"]', user.password);
      await page.click('button[type="submit"]');

      // Wait for login redirect with increased timeout
      await page.waitForURL(/\/(client|artisan|admin)\/dashboard/, { timeout: 30000 });

      // Wait for dashboard content to render after login
      await page.waitForSelector('h1, main, [role="main"]', {
        state: 'visible',
        timeout: 10000
      }).catch(() => console.warn('Dashboard content not found after login'));
    }

    // Wait for dashboard to load
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  } catch (error) {
    console.error('Registration may have failed or redirected elsewhere');
    console.error('Current URL:', page.url());

    // Check for validation errors on the page
    const validationErrors = await page.locator('p.text-red-600, .text-red-600, [class*="error"]').all();
    if (validationErrors.length > 0) {
      console.error(`Found ${validationErrors.length} validation errors on page:`);
      for (const errorEl of validationErrors) {
        const errorText = await errorEl.textContent();
        if (errorText && errorText.trim()) {
          console.error('  -', errorText);
        }
      }
    }

    // Check for error messages
    const errorVisible = await page.locator('text=/error|already exists|invalid|required/i').isVisible({ timeout: 1000 }).catch(() => false);
    if (errorVisible) {
      const errorTexts = await page.locator('text=/error|already exists|invalid|required/i').allTextContents();
      console.error('Error messages:', errorTexts);
    }

    // Check for toast notifications
    const toastVisible = await page.locator('[role="status"], .toast, [class*="toast"]').isVisible({ timeout: 1000 }).catch(() => false);
    if (toastVisible) {
      const toastText = await page.locator('[role="status"], .toast, [class*="toast"]').first().textContent();
      console.error('Toast message:', toastText);
    }

    // Take a screenshot for debugging
    await page.screenshot({ path: `test-results/registration-failure-${Date.now()}.png`, fullPage: true }).catch(() => {});

    throw new Error(`Registration failed: ${error}`);
  }

  return user;
}

/**
 * Login with existing user credentials
 */
export async function loginWithUser(page: Page, user: TestUser): Promise<void> {
  await page.goto('/auth/login');

  // Wait for page to load
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

  // Fill login form - use pressSequentially to trigger input events properly
  const emailInput = page.locator('input[name="email"], input[type="email"]').first();
  const passwordInput = page.locator('input[name="password"], input[type="password"]').first();

  // Clear and fill email
  await emailInput.click();
  await emailInput.clear();
  await emailInput.pressSequentially(user.email, { delay: 10 });

  // Clear and fill password
  await passwordInput.click();
  await passwordInput.clear();
  await passwordInput.pressSequentially(user.password, { delay: 10 });

  // Wait a moment for validation to process
  await page.waitForTimeout(300);

  // Submit login
  await page.click('button[type="submit"]');

  // Wait for button loading state
  await page.waitForTimeout(500);

  // Wait for successful login with increased timeout
  try {
    await page.waitForURL(/\/(client|artisan|admin)\/dashboard/, { timeout: 30000 });

    // Wait for dashboard content to actually render
    await page.waitForSelector('h1, main, [role="main"]', {
      state: 'visible',
      timeout: 10000
    }).catch(() => console.warn('Dashboard content not found, continuing'));

    // Wait for dashboard to fully load
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  } catch (error) {
    console.error('Login may have failed');
    console.error('Current URL:', page.url());

    // Check for error messages
    const errorVisible = await page.locator('text=/error|invalid|incorrect/i, [data-testid="login-error"]').isVisible({ timeout: 1000 }).catch(() => false);
    if (errorVisible) {
      const errorText = await page.locator('text=/error|invalid|incorrect/i, [data-testid="login-error"]').first().textContent();
      console.error('Error message:', errorText);
    }

    throw new Error(`Login failed: ${error}`);
  }
}

/**
 * Create or reuse a test user
 * Attempts to login first, if that fails, creates a new user
 */
export async function getOrCreateUser(page: Page, role: 'CLIENT' | 'ARTISAN' | 'ADMIN' = 'ARTISAN'): Promise<TestUser> {
  const user = generateTestUser(role);

  try {
    // Try to create new user
    await createUser(page, user);
    return user;
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
}

/**
 * Attempt to login with credentials, return success/failure
 */
export async function tryLogin(page: Page, email: string, password: string): Promise<boolean> {
  try {
    await page.goto('/auth/login');
    await page.fill('input[name="email"], input[type="email"]', email);
    await page.fill('input[name="password"], input[type="password"]', password);
    await page.click('button[type="submit"]');

    // Check if redirected to dashboard (successful login)
    await page.waitForURL(/\/(client|artisan|admin)\/dashboard/, { timeout: 5000 });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Clean up - logout the current user
 */
export async function cleanupUser(page: Page): Promise<void> {
  try {
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out"), a:has-text("Logout")');

    if (await logoutButton.isVisible({ timeout: 2000 })) {
      await logoutButton.click();
    } else {
      // Try clicking on user menu first
      const userMenu = page.locator('[data-testid="user-menu"], [aria-label="User menu"]');
      if (await userMenu.isVisible({ timeout: 2000 })) {
        await userMenu.click();
        await page.locator('button:has-text("Logout"), a:has-text("Logout")').click();
      }
    }

    // Wait for redirect to home or login
    await page.waitForURL(/\/(auth\/login|$)/, { timeout: 5000 });
  } catch (error) {
    console.log('Cleanup: User may already be logged out or logout button not found');
  }
}
