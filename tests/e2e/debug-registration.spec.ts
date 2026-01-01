import { test, expect } from '@playwright/test';

const FRONTEND_URL = 'http://localhost:3001';

test('Debug Client Registration Redirect', async ({ page }) => {
  // Listen for console messages
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));

  // Listen for page errors
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));

  // Listen for network requests
  page.on('request', request => {
    if (request.url().includes('/auth/register')) {
      console.log('REGISTRATION REQUEST:', request.method(), request.url());
      console.log('REQUEST HEADERS:', request.headers());
    }
  });

  // Listen for network responses
  page.on('response', async response => {
    if (response.url().includes('/auth/register')) {
      console.log('REGISTRATION RESPONSE URL:', response.url());
      console.log('REGISTRATION RESPONSE:', response.status(), response.statusText());
      console.log('RESPONSE HEADERS:', response.headers());
      try {
        const contentType = response.headers()['content-type'];
        console.log('Content-Type:', contentType);
        const text = await response.text();
        console.log('RESPONSE BODY (first 500 chars):', text.substring(0, 500));
      } catch (err) {
        console.log('Failed to read response:', err);
      }
    }
  });

  // Navigate to registration page
  await page.goto(`${FRONTEND_URL}/auth/register`);
  console.log('1. Navigated to registration page');

  // Fill form
  const testTimestamp = Date.now();
  await page.fill('input[name="firstName"]', 'Debug');
  await page.fill('input[name="lastName"]', 'Test');
  await page.fill('input[type="email"], input[name="email"]', `debug${testTimestamp}@test.com`);
  await page.fill('input[type="password"], input[name="password"]', 'DebugTest123!');
  console.log('2. Filled registration form');

  // Select CLIENT role
  const clientRoleButton = page.locator('button:has-text("Hire Artisans")');
  if (await clientRoleButton.count() > 0) {
    await clientRoleButton.click();
    console.log('3. Selected CLIENT role');
  }

  // Phone number
  const phoneInput = page.locator('input[name="phoneNumber"], input[placeholder*="Phone"]');
  if (await phoneInput.count() > 0) {
    await phoneInput.fill('+27 82 123 4567');
    const phoneValue = await phoneInput.inputValue();
    console.log('4. Filled phone number - value is:', phoneValue);
  } else {
    console.log('4. WARNING: Phone input not found!');
  }

  // Debug all form values before submit
  const formData = {
    firstName: await page.locator('input[name="firstName"]').inputValue(),
    lastName: await page.locator('input[name="lastName"]').inputValue(),
    email: await page.locator('input[type="email"]').inputValue(),
    phoneNumber: await phoneInput.inputValue(),
    password: await page.locator('input[type="password"]').inputValue(),
    terms: await page.locator('input[type="checkbox"]').isChecked(),
  };
  console.log('4b. All form values before submit:', JSON.stringify(formData, null, 2));

  // Check terms checkbox
  const termsCheckbox = page.locator('input[name="terms"], input[id="terms"], input[type="checkbox"]');
  if (await termsCheckbox.count() > 0) {
    await termsCheckbox.first().check();
    const isChecked = await termsCheckbox.first().isChecked();
    console.log('5. Terms checkbox checked:', isChecked);
  }

  // Get current URL before submit
  const urlBeforeSubmit = page.url();
  console.log('6. URL before submit:', urlBeforeSubmit);

  // Submit form
  await page.click('button[type="submit"]');
  console.log('7. Clicked submit button');

  // Wait and check URL after submit
  await page.waitForTimeout(5000);
  const urlAfterSubmit = page.url();
  console.log('8. URL after submit (5s wait):', urlAfterSubmit);

  // Check localStorage for tokens
  const accessToken = await page.evaluate(() => localStorage.getItem('accessToken'));
  const refreshToken = await page.evaluate(() => localStorage.getItem('refreshToken'));
  console.log('9. AccessToken exists:', !!accessToken);
  console.log('10. RefreshToken exists:', !!refreshToken);

  // Check if we're on the dashboard
  const isDashboard = urlAfterSubmit.includes('dashboard') || urlAfterSubmit.includes('/client');
  console.log('11. Redirected to dashboard:', isDashboard);

  // Take final screenshot
  await page.screenshot({ path: 'claudedocs/test-reports/screenshots/debug-registration-final.png', fullPage: true });

  // Assert that we should be on dashboard
  expect(isDashboard).toBeTruthy();
});
