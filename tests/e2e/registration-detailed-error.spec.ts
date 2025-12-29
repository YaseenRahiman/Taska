import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Enhanced E2E Test: Capture Registration Error Details
 */

test.describe('Registration Error Analysis', () => {
  const testUser = {
    email: 'grahiman02@gmail.com',
    password: 'Qwerty12345!@',
    firstName: 'Graham',
    lastName: 'Iman'
  };

  const screenshotDir = path.join(__dirname, '..', '..', 'claudedocs', 'test-screenshots');

  test('should capture detailed error information', async ({ page }) => {
    // Set up console and network monitoring
    const consoleLogs: any[] = [];
    const networkRequests: any[] = [];
    const networkResponses: any[] = [];

    page.on('console', msg => {
      consoleLogs.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      });
    });

    page.on('request', request => {
      if (request.url().includes('register') || request.url().includes('signup') || request.url().includes('auth')) {
        networkRequests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          postData: request.postData()
        });
      }
    });

    page.on('response', async response => {
      if (response.url().includes('register') || response.url().includes('signup') || response.url().includes('auth')) {
        try {
          const body = await response.text();
          networkResponses.push({
            url: response.url(),
            status: response.status(),
            statusText: response.statusText(),
            headers: response.headers(),
            body: body
          });
        } catch (e) {
          networkResponses.push({
            url: response.url(),
            status: response.status(),
            statusText: response.statusText(),
            error: 'Could not read body'
          });
        }
      }
    });

    // Navigate to registration
    console.log('🔍 Navigating to registration page...');
    await page.goto('http://localhost:3001');
    await page.click('a[href*="register"]');
    await page.waitForLoadState('networkidle');

    // Select "Hire Artisans" (CLIENT role)
    console.log('🔍 Selecting user type: Hire Artisans (CLIENT)...');
    await page.click('button:has-text("Hire Artisans"), div:has-text("Hire Artisans")');
    await page.waitForTimeout(500);

    // Fill form
    console.log('🔍 Filling registration form...');
    await page.fill('input[name="firstName"]', testUser.firstName);
    await page.fill('input[name="lastName"]', testUser.lastName);
    await page.fill('input[type="email"]', testUser.email);

    // Check if phone field exists and is required
    const phoneField = page.locator('input[name="phone"], input[name="phoneNumber"], input[type="tel"]');
    const phoneFieldCount = await phoneField.count();
    if (phoneFieldCount > 0) {
      console.log('📱 Phone field found, filling with test number...');
      await phoneField.first().fill('+27123456789');
    }

    await page.fill('input[type="password"]', testUser.password);

    // Check terms checkbox if present
    const termsCheckbox = page.locator('input[type="checkbox"]');
    const checkboxCount = await termsCheckbox.count();
    if (checkboxCount > 0) {
      console.log('✅ Checking terms and conditions checkbox...');
      await termsCheckbox.first().check();
    }

    await page.screenshot({
      path: path.join(screenshotDir, 'detailed-form-filled.png'),
      fullPage: true
    });

    // Submit form
    console.log('🔍 Submitting form...');
    await page.click('button[type="submit"]');

    // Wait for response
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: path.join(screenshotDir, 'detailed-after-submit.png'),
      fullPage: true
    });

    // Capture error messages
    console.log('🔍 Searching for error messages...');

    // Check for error toast/notification
    const errorSelectors = [
      '.error',
      '[role="alert"]',
      '.alert-error',
      '.toast-error',
      '.notification-error',
      '[data-testid="error"]',
      '.text-red-500',
      '.text-red-600',
      '.text-danger',
      'div:has-text("error")',
      'div:has-text("Error")',
      'div:has-text("failed")',
      'div:has-text("Failed")'
    ];

    const errorMessages: any[] = [];
    for (const selector of errorSelectors) {
      try {
        const elements = await page.locator(selector).all();
        for (const element of elements) {
          const text = await element.textContent();
          if (text && text.trim()) {
            const isVisible = await element.isVisible();
            errorMessages.push({
              selector,
              text: text.trim(),
              visible: isVisible
            });
          }
        }
      } catch (e) {
        // Selector not found, continue
      }
    }

    // Check form validation errors
    const validationErrors: any[] = [];
    const inputFields = await page.locator('input').all();
    for (const input of inputFields) {
      const validationMessage = await input.evaluate((el: any) => el.validationMessage);
      if (validationMessage) {
        const name = await input.getAttribute('name');
        validationErrors.push({
          field: name,
          message: validationMessage
        });
      }
    }

    // Compile detailed report
    const report = {
      testUser: {
        email: testUser.email,
        firstName: testUser.firstName,
        lastName: testUser.lastName
      },
      outcome: {
        currentUrl: page.url(),
        pageTitle: await page.title(),
        stayedOnRegistrationPage: page.url().includes('register')
      },
      errors: {
        uiErrors: errorMessages,
        validationErrors: validationErrors,
        consoleErrors: consoleLogs.filter(log => log.type === 'error'),
        consoleWarnings: consoleLogs.filter(log => log.type === 'warning')
      },
      network: {
        requests: networkRequests,
        responses: networkResponses
      },
      allConsoleLogs: consoleLogs
    };

    const reportPath = path.join(__dirname, '..', '..', 'claudedocs', 'registration-error-details.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('\n📊 ERROR ANALYSIS REPORT:');
    console.log('========================');
    console.log(`🌐 Final URL: ${report.outcome.currentUrl}`);
    console.log(`📄 Page Title: ${report.outcome.pageTitle}`);
    console.log(`❌ UI Errors Found: ${errorMessages.length}`);
    if (errorMessages.length > 0) {
      errorMessages.forEach((err, idx) => {
        console.log(`   ${idx + 1}. [${err.selector}] ${err.text} (Visible: ${err.visible})`);
      });
    }
    console.log(`⚠️  Validation Errors: ${validationErrors.length}`);
    if (validationErrors.length > 0) {
      validationErrors.forEach((err, idx) => {
        console.log(`   ${idx + 1}. Field: ${err.field} - ${err.message}`);
      });
    }
    console.log(`🔴 Console Errors: ${report.errors.consoleErrors.length}`);
    if (report.errors.consoleErrors.length > 0) {
      report.errors.consoleErrors.forEach((err, idx) => {
        console.log(`   ${idx + 1}. ${err.text}`);
      });
    }
    console.log(`🌐 API Requests Made: ${networkRequests.length}`);
    console.log(`📥 API Responses: ${networkResponses.length}`);
    if (networkResponses.length > 0) {
      networkResponses.forEach((res, idx) => {
        console.log(`   ${idx + 1}. ${res.method || 'N/A'} ${res.url} - Status: ${res.status}`);
        if (res.body) {
          console.log(`      Body: ${res.body.substring(0, 200)}${res.body.length > 200 ? '...' : ''}`);
        }
      });
    }
    console.log(`\n📋 Full report: ${reportPath}`);
  });
});
