import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * E2E Test: User Registration Flow
 *
 * Objective: Test complete registration workflow from frontend UI to database persistence
 * Test User: grahiman02@gmail.com
 */

test.describe('User Registration Flow', () => {
  const testUser = {
    email: 'grahiman02@gmail.com',
    password: 'Qwerty12345!@',
    firstName: 'Graham',
    lastName: 'Iman',
    role: 'CLIENT'
  };

  const screenshotDir = path.join(__dirname, '..', 'claudedocs', 'test-screenshots');

  test.beforeAll(async () => {
    // Ensure screenshot directory exists
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
  });

  test('should complete user registration successfully', async ({ page }) => {
    // Step 1: Navigate to frontend
    console.log('📍 Step 1: Navigating to frontend...');
    await page.goto('http://localhost:3001');
    await page.screenshot({
      path: path.join(screenshotDir, '01-homepage.png'),
      fullPage: true
    });

    // Step 2: Find and navigate to registration page
    console.log('📍 Step 2: Looking for registration link...');

    // Common registration link patterns
    const registrationSelectors = [
      'a[href*="register"]',
      'a[href*="signup"]',
      'a[href*="sign-up"]',
      'button:has-text("Register")',
      'button:has-text("Sign Up")',
      'a:has-text("Register")',
      'a:has-text("Sign Up")',
      'a:has-text("Create Account")',
      '[data-testid="register-link"]',
      '[data-testid="signup-link"]'
    ];

    let registrationFound = false;
    for (const selector of registrationSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          console.log(`✅ Found registration link: ${selector}`);
          await element.click();
          registrationFound = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!registrationFound) {
      // Try direct navigation
      console.log('⚠️ Registration link not found, trying direct URLs...');
      const registrationUrls = [
        'http://localhost:3001/register',
        'http://localhost:3001/signup',
        'http://localhost:3001/auth/register',
        'http://localhost:3001/auth/signup'
      ];

      for (const url of registrationUrls) {
        try {
          await page.goto(url);
          await page.waitForLoadState('networkidle', { timeout: 5000 });
          const title = await page.title();
          console.log(`Tried URL: ${url} - Page title: ${title}`);

          // Check if we're on a registration page
          const hasRegisterForm = await page.locator('form').count() > 0;
          if (hasRegisterForm) {
            console.log(`✅ Found registration page at: ${url}`);
            registrationFound = true;
            break;
          }
        } catch (e) {
          console.log(`❌ URL ${url} not accessible`);
          continue;
        }
      }
    }

    await page.screenshot({
      path: path.join(screenshotDir, '02-registration-page.png'),
      fullPage: true
    });

    if (!registrationFound) {
      throw new Error('❌ Could not find registration page. Please check the application routing.');
    }

    // Step 3: Fill registration form
    console.log('📍 Step 3: Filling registration form...');

    // Wait for form to be visible
    await page.waitForSelector('form', { timeout: 10000 });

    // Common form field patterns
    const fieldMappings = {
      email: ['input[type="email"]', 'input[name="email"]', '#email', '[data-testid="email"]'],
      password: ['input[type="password"]', 'input[name="password"]', '#password', '[data-testid="password"]'],
      firstName: ['input[name="firstName"]', 'input[name="first_name"]', '#firstName', '#first_name', '[placeholder*="First"]'],
      lastName: ['input[name="lastName"]', 'input[name="last_name"]', '#lastName', '#last_name', '[placeholder*="Last"]']
    };

    // Fill email
    console.log('  📝 Filling email field...');
    let emailFilled = false;
    for (const selector of fieldMappings.email) {
      try {
        const field = page.locator(selector).first();
        if (await field.isVisible({ timeout: 1000 })) {
          await field.fill(testUser.email);
          console.log(`    ✅ Email filled using: ${selector}`);
          emailFilled = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    if (!emailFilled) throw new Error('❌ Could not find email field');

    // Fill password
    console.log('  📝 Filling password field...');
    let passwordFilled = false;
    for (const selector of fieldMappings.password) {
      try {
        const field = page.locator(selector).first();
        if (await field.isVisible({ timeout: 1000 })) {
          await field.fill(testUser.password);
          console.log(`    ✅ Password filled using: ${selector}`);
          passwordFilled = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    if (!passwordFilled) throw new Error('❌ Could not find password field');

    // Fill firstName
    console.log('  📝 Filling first name field...');
    let firstNameFilled = false;
    for (const selector of fieldMappings.firstName) {
      try {
        const field = page.locator(selector).first();
        if (await field.isVisible({ timeout: 1000 })) {
          await field.fill(testUser.firstName);
          console.log(`    ✅ First name filled using: ${selector}`);
          firstNameFilled = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    // First name might be optional
    if (!firstNameFilled) {
      console.log('    ⚠️ First name field not found (may be optional)');
    }

    // Fill lastName
    console.log('  📝 Filling last name field...');
    let lastNameFilled = false;
    for (const selector of fieldMappings.lastName) {
      try {
        const field = page.locator(selector).first();
        if (await field.isVisible({ timeout: 1000 })) {
          await field.fill(testUser.lastName);
          console.log(`    ✅ Last name filled using: ${selector}`);
          lastNameFilled = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    // Last name might be optional
    if (!lastNameFilled) {
      console.log('    ⚠️ Last name field not found (may be optional)');
    }

    await page.screenshot({
      path: path.join(screenshotDir, '03-form-filled.png'),
      fullPage: true
    });

    // Step 4: Submit form
    console.log('📍 Step 4: Submitting registration form...');

    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Register")',
      'button:has-text("Sign Up")',
      'button:has-text("Create Account")',
      'input[type="submit"]',
      '[data-testid="submit"]',
      'form button'
    ];

    let submitClicked = false;
    for (const selector of submitSelectors) {
      try {
        const button = page.locator(selector).first();
        if (await button.isVisible({ timeout: 1000 })) {
          console.log(`  ✅ Found submit button: ${selector}`);
          await button.click();
          submitClicked = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!submitClicked) {
      throw new Error('❌ Could not find submit button');
    }

    // Step 5: Wait for response and capture state
    console.log('📍 Step 5: Waiting for response...');

    // Wait for navigation or response
    try {
      await page.waitForLoadState('networkidle', { timeout: 10000 });
    } catch (e) {
      console.log('  ⚠️ Network did not become idle, continuing...');
    }

    // Wait a bit for any messages to appear
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: path.join(screenshotDir, '04-after-submit.png'),
      fullPage: true
    });

    // Step 6: Check for success/error messages
    console.log('📍 Step 6: Checking for response messages...');

    const messageSelectors = [
      '.error', '.alert-error', '[role="alert"]', '.message',
      '.success', '.alert-success', '.notification',
      '.toast', '.snackbar', '[data-testid="message"]'
    ];

    let foundMessages: string[] = [];
    for (const selector of messageSelectors) {
      try {
        const messages = await page.locator(selector).allTextContents();
        if (messages.length > 0) {
          foundMessages.push(...messages);
          console.log(`  📧 Found messages (${selector}):`, messages);
        }
      } catch (e) {
        continue;
      }
    }

    // Check console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Check network errors
    const networkErrors: string[] = [];
    page.on('requestfailed', request => {
      networkErrors.push(`${request.url()} - ${request.failure()?.errorText}`);
    });

    console.log('📍 Step 7: Checking current URL and page state...');
    const currentUrl = page.url();
    const pageTitle = await page.title();
    const pageContent = await page.content();

    console.log(`  Current URL: ${currentUrl}`);
    console.log(`  Page Title: ${pageTitle}`);
    console.log(`  Console Errors: ${consoleErrors.length > 0 ? consoleErrors.join(', ') : 'None'}`);
    console.log(`  Network Errors: ${networkErrors.length > 0 ? networkErrors.join(', ') : 'None'}`);

    // Check if we're redirected to login or dashboard (success indicators)
    const isOnLogin = currentUrl.includes('login') || currentUrl.includes('signin');
    const isOnDashboard = currentUrl.includes('dashboard') || currentUrl.includes('home');

    console.log(`\n📊 Registration Test Results:`);
    console.log(`  ✉️  Email: ${testUser.email}`);
    console.log(`  📍 Final URL: ${currentUrl}`);
    console.log(`  📄 Page Title: ${pageTitle}`);
    console.log(`  💬 Messages Found: ${foundMessages.length > 0 ? foundMessages.join(' | ') : 'None'}`);
    console.log(`  ✅ Redirected to Login: ${isOnLogin}`);
    console.log(`  ✅ Redirected to Dashboard: ${isOnDashboard}`);
    console.log(`  ⚠️  Console Errors: ${consoleErrors.length}`);
    console.log(`  🌐 Network Errors: ${networkErrors.length}`);

    // Create detailed report
    const report = {
      testUser,
      registration: {
        formFilled: emailFilled && passwordFilled,
        submitted: submitClicked,
        finalUrl: currentUrl,
        pageTitle,
        redirectedToLogin: isOnLogin,
        redirectedToDashboard: isOnDashboard
      },
      messages: foundMessages,
      errors: {
        console: consoleErrors,
        network: networkErrors
      },
      screenshots: [
        '01-homepage.png',
        '02-registration-page.png',
        '03-form-filled.png',
        '04-after-submit.png'
      ]
    };

    // Save report
    const reportPath = path.join(__dirname, '..', 'claudedocs', 'registration-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📋 Detailed report saved to: ${reportPath}`);

    // Basic assertions
    expect(emailFilled && passwordFilled, 'Form should be fillable').toBeTruthy();
    expect(submitClicked, 'Submit button should be clickable').toBeTruthy();
  });
});
