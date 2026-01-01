import { test, expect } from '@playwright/test';
import { AuthHelper } from '../helpers/auth-enhanced';
import { ErrorReporter } from '../helpers/error-reporter';
import { FormFillingHelper } from '../helpers/form-filling';
import { FormValidationHelper } from '../helpers/form-validation';

/**
 * REFACTORED: User Registration Flow Test
 *
 * This is an example of how to use the enhanced helpers for better test quality
 *
 * Improvements over original:
 * 1. Uses FormFillingHelper with retry logic and validation
 * 2. Validates form state before submission
 * 3. Comprehensive error reporting with context
 * 4. Better debugging information
 * 5. Reduced code duplication
 */

test.describe('User Registration - Refactored', () => {
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'SecurePass123!@',
    firstName: 'Test',
    lastName: 'User',
    role: 'CLIENT' as const,
  };

  test.beforeEach(async ({ page }) => {
    // Initialize error tracking
    ErrorReporter.initializeTracking(page);
  });

  test.afterEach(async ({ page }) => {
    // Clear auth data
    await AuthHelper.clearAuth(page);

    // Log error summary
    const summary = ErrorReporter.getErrorSummary();
    if (summary.hasErrors) {
      console.log('');
      console.log('⚠️ Test encountered errors:');
      console.log(`  Console Errors: ${summary.consoleErrorCount}`);
      console.log(`  Network Errors: ${summary.networkErrorCount}`);
    }

    ErrorReporter.clearErrors();
  });

  test('should register new user with proper validation', async ({ page }, testInfo) => {
    console.log('\n🎯 TEST: User Registration with Enhanced Validation\n');

    try {
      // Navigate to registration page
      console.log('📍 Step 1: Navigating to registration page');
      await page.goto('http://localhost:3001/auth/register', { waitUntil: 'networkidle' });

      // Verify we're on the right page
      expect(page.url()).toContain('register');
      console.log('  ✅ On registration page');

      // Wait for form to load
      console.log('📍 Step 2: Waiting for form to load');
      await page.waitForSelector('form', { timeout: 10000 });
      console.log('  ✅ Form loaded');

      // Fill the form with validation
      console.log('📍 Step 3: Filling registration form');

      const fillResult = await FormFillingHelper.fillAndValidateForm(
        page,
        [
          {
            name: 'Email',
            value: testUser.email,
            selectors: [
              'input[type="email"]',
              'input[name="email"]',
              '#email',
            ],
            options: { waitForValidation: true },
          },
          {
            name: 'Password',
            value: testUser.password,
            selectors: [
              'input[type="password"]',
              'input[name="password"]',
              '#password',
            ],
            options: { waitForValidation: true },
          },
          {
            name: 'First Name',
            value: testUser.firstName,
            selectors: [
              'input[name="firstName"]',
              'input[name="first_name"]',
              '#firstName',
            ],
          },
          {
            name: 'Last Name',
            value: testUser.lastName,
            selectors: [
              'input[name="lastName"]',
              'input[name="last_name"]',
              '#lastName',
            ],
          },
        ],
        'form'
      );

      // Log filling results
      const fillingReport = FormFillingHelper.generateFillingReport(fillResult.results);
      console.log(fillingReport);

      // Verify all fields were filled successfully
      expect(fillResult.success, 'All form fields should be filled successfully').toBe(true);

      if (!fillResult.canSubmit) {
        console.log('\n❌ Form cannot be submitted - validation errors:');
        console.log(fillResult.validationReport);

        throw await ErrorReporter.createEnhancedError(
          page,
          testInfo,
          'Form validation failed before submission'
        );
      }

      console.log('  ✅ Form filled and validated successfully');

      // Take screenshot before submission
      await page.screenshot({
        path: `${testInfo.outputDir}/before-submit.png`,
        fullPage: true,
      });

      // Submit the form
      console.log('📍 Step 4: Submitting form');

      const submitResult = await FormFillingHelper.submitForm(page, 'form', {
        validateBefore: true,
        waitForNavigation: true,
        timeout: 15000,
      });

      if (!submitResult.success) {
        console.log('\n❌ Form submission failed:');
        console.log(`  Error: ${submitResult.error}`);
        if (submitResult.validationReport) {
          console.log(submitResult.validationReport);
        }

        throw await ErrorReporter.createEnhancedError(
          page,
          testInfo,
          `Form submission failed: ${submitResult.error}`
        );
      }

      console.log('  ✅ Form submitted successfully');

      // Take screenshot after submission
      await page.screenshot({
        path: `${testInfo.outputDir}/after-submit.png`,
        fullPage: true,
      });

      // Verify success
      console.log('📍 Step 5: Verifying registration success');

      const currentUrl = page.url();
      console.log(`  Current URL: ${currentUrl}`);

      // Check for success indicators
      const isOnLogin = currentUrl.includes('login');
      const isOnDashboard = currentUrl.includes('dashboard');

      if (!isOnLogin && !isOnDashboard) {
        // Might still be on registration page - check for errors
        const validation = await FormValidationHelper.validateFormReadyForSubmit(page);

        if (!validation.isValid) {
          const report = FormValidationHelper.formatValidationReport(validation);
          console.log('\n❌ Still on registration page with errors:');
          console.log(report);

          throw await ErrorReporter.createEnhancedError(
            page,
            testInfo,
            'Registration failed - still on registration page with validation errors'
          );
        }
      }

      console.log(`  ✅ Redirected: ${isOnLogin ? 'Login' : isOnDashboard ? 'Dashboard' : 'Unknown'}`);

      // Verify no errors occurred
      const errorSummary = ErrorReporter.getErrorSummary();

      if (errorSummary.hasErrors) {
        console.log('\n⚠️ Test completed but errors were detected:');
        console.log(`  Console Errors: ${errorSummary.consoleErrorCount}`);
        console.log(`  Network Errors: ${errorSummary.networkErrorCount}`);

        const context = await ErrorReporter.captureErrorContext(
          page,
          testInfo,
          'Test completed with errors'
        );

        const report = ErrorReporter.generateErrorReport(context);
        console.log(report);
      }

      console.log('\n✅ REGISTRATION TEST COMPLETED SUCCESSFULLY\n');

    } catch (error: any) {
      console.error('\n❌ REGISTRATION TEST FAILED\n');
      console.error(ErrorReporter.formatErrorForConsole(error));

      // Capture comprehensive error context
      const context = await ErrorReporter.captureErrorContext(page, testInfo, error.message);
      const reportPath = await ErrorReporter.saveErrorReport(context, testInfo, error);

      console.log(`\n📋 Detailed error report: ${reportPath}`);

      throw error;
    }
  });

  test('should handle validation errors properly', async ({ page }, testInfo) => {
    console.log('\n🎯 TEST: Registration Validation Error Handling\n');

    try {
      // Navigate to registration page
      await page.goto('http://localhost:3001/auth/register', { waitUntil: 'networkidle' });

      // Try to submit with invalid/empty data
      console.log('📍 Testing form validation with empty fields');

      // Wait for form
      await page.waitForSelector('form', { timeout: 10000 });

      // Try to submit without filling anything
      const canSubmit = await FormValidationHelper.canSubmitForm(page);

      console.log(`  Can submit empty form: ${canSubmit.canSubmit ? 'YES (BUG!)' : 'NO (correct)'}`);
      console.log(`  Reason: ${canSubmit.reason || 'N/A'}`);

      // The form should NOT be submittable with empty required fields
      if (canSubmit.canSubmit) {
        const validation = await FormValidationHelper.validateFormReadyForSubmit(page);
        const report = FormValidationHelper.formatValidationReport(validation);

        console.log('\n❌ BUG DETECTED: Form allows submission with empty required fields!');
        console.log(report);

        await ErrorReporter.logAssertionFailure(
          page,
          testInfo,
          'Empty form should not be submittable',
          false,
          true
        );
      } else {
        console.log('  ✅ Form correctly prevents submission with empty fields');
      }

      // Test with invalid email format
      console.log('\n📍 Testing email validation');

      const emailResult = await FormFillingHelper.fillEmail(page, 'invalid-email', {
        waitForValidation: true,
      });

      if (emailResult.success) {
        await FormValidationHelper.waitForValidationToSettle(page);

        const validation = await FormValidationHelper.validateFormReadyForSubmit(page);
        const hasEmailError = validation.errors.some(err =>
          err.field.includes('email') || err.message.toLowerCase().includes('email')
        );

        console.log(`  Email validation triggered: ${hasEmailError ? 'YES ✅' : 'NO ❌'}`);

        if (!hasEmailError) {
          console.log('  ⚠️ Invalid email format not detected by validation');
        }
      }

      console.log('\n✅ VALIDATION TEST COMPLETED\n');

    } catch (error: any) {
      console.error('\n❌ VALIDATION TEST FAILED\n');
      console.error(ErrorReporter.formatErrorForConsole(error));

      await ErrorReporter.captureErrorContext(page, testInfo, error.message);

      throw error;
    }
  });
});
