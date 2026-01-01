import { Page, Locator } from '@playwright/test';
import { FormValidationHelper } from './form-validation';

/**
 * Enhanced Form Filling Helper
 * Provides intelligent form filling with validation, retry logic, and debugging
 */

export interface FillOptions {
  /** Wait for field to be visible before filling */
  waitForVisible?: boolean;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Clear field before filling */
  clearFirst?: boolean;
  /** Verify value was set correctly */
  verifyValue?: boolean;
  /** Number of retry attempts */
  retries?: number;
  /** Wait after filling for validation */
  waitForValidation?: boolean;
}

export interface FillResult {
  success: boolean;
  selector: string;
  value: string;
  error?: string;
  attemptCount: number;
}

export class FormFillingHelper {
  /**
   * Smart field filling with multiple selector attempts and retry logic
   */
  static async fillField(
    page: Page,
    fieldSelectors: string[],
    value: string,
    fieldName: string,
    options: FillOptions = {}
  ): Promise<FillResult> {
    const opts = {
      waitForVisible: true,
      timeout: 5000,
      clearFirst: true,
      verifyValue: true,
      retries: 2,
      waitForValidation: false,
      ...options,
    };

    console.log(`  📝 Filling field: ${fieldName}`);

    let lastError: string | undefined;
    let attemptCount = 0;

    // Try each selector
    for (const selector of fieldSelectors) {
      for (let retry = 0; retry <= opts.retries; retry++) {
        attemptCount++;

        try {
          const field = page.locator(selector).first();

          // Wait for field to exist
          const count = await field.count();
          if (count === 0) {
            continue; // Try next selector
          }

          // Wait for field to be visible if requested
          if (opts.waitForVisible) {
            const isVisible = await field.isVisible({ timeout: opts.timeout });
            if (!isVisible) {
              lastError = `Field not visible: ${selector}`;
              continue;
            }
          }

          // Check if field is enabled
          const isDisabled = await field.isDisabled();
          if (isDisabled) {
            lastError = `Field is disabled: ${selector}`;
            console.log(`    ⚠️ ${lastError}`);
            continue; // Try next selector
          }

          // Clear field if requested
          if (opts.clearFirst) {
            await field.clear({ timeout: opts.timeout });
          }

          // Fill the field
          await field.fill(value, { timeout: opts.timeout });

          // Verify value was set if requested
          if (opts.verifyValue) {
            const actualValue = await field.inputValue();
            if (actualValue !== value) {
              lastError = `Value mismatch: expected "${value}", got "${actualValue}"`;
              console.log(`    ⚠️ Retry ${retry + 1}/${opts.retries + 1}: ${lastError}`);

              if (retry < opts.retries) {
                await page.waitForTimeout(500);
                continue; // Retry
              } else {
                continue; // Try next selector
              }
            }
          }

          // Wait for validation if requested
          if (opts.waitForValidation) {
            await page.waitForTimeout(500);
          }

          console.log(`    ✅ ${fieldName} filled using: ${selector}`);

          return {
            success: true,
            selector,
            value,
            attemptCount,
          };

        } catch (error: any) {
          lastError = error.message;
          console.log(`    ⚠️ Attempt ${attemptCount} failed: ${lastError.substring(0, 100)}`);

          if (retry < opts.retries) {
            await page.waitForTimeout(500);
          }
        }
      }
    }

    // All selectors failed
    console.log(`    ❌ ${fieldName} could not be filled after ${attemptCount} attempts`);
    console.log(`    Last error: ${lastError}`);

    return {
      success: false,
      selector: fieldSelectors[0],
      value,
      error: lastError || 'All selectors failed',
      attemptCount,
    };
  }

  /**
   * Fill email field with common selector patterns
   */
  static async fillEmail(
    page: Page,
    email: string,
    options?: FillOptions
  ): Promise<FillResult> {
    const selectors = [
      'input[type="email"]',
      'input[name="email"]',
      '#email',
      '[data-testid="email"]',
      '[placeholder*="email" i]',
      '[aria-label*="email" i]',
    ];

    return this.fillField(page, selectors, email, 'Email', options);
  }

  /**
   * Fill password field with common selector patterns
   */
  static async fillPassword(
    page: Page,
    password: string,
    options?: FillOptions
  ): Promise<FillResult> {
    const selectors = [
      'input[type="password"]',
      'input[name="password"]',
      '#password',
      '[data-testid="password"]',
      '[placeholder*="password" i]',
      '[aria-label*="password" i]',
    ];

    return this.fillField(page, selectors, password, 'Password', {
      verifyValue: false, // Password fields often don't expose value
      ...options,
    });
  }

  /**
   * Fill text field with common selector patterns
   */
  static async fillTextField(
    page: Page,
    fieldName: string,
    value: string,
    options?: FillOptions
  ): Promise<FillResult> {
    const lowerName = fieldName.toLowerCase();
    const selectors = [
      `input[name="${fieldName}"]`,
      `input[name="${lowerName}"]`,
      `#${fieldName}`,
      `#${lowerName}`,
      `[data-testid="${fieldName}"]`,
      `[data-testid="${lowerName}"]`,
      `textarea[name="${fieldName}"]`,
      `textarea[name="${lowerName}"]`,
      `[placeholder*="${fieldName}" i]`,
      `[aria-label*="${fieldName}" i]`,
    ];

    return this.fillField(page, selectors, value, fieldName, options);
  }

  /**
   * Click element with retry logic
   */
  static async clickElement(
    page: Page,
    selectors: string[],
    elementName: string,
    options: { timeout?: number; retries?: number; force?: boolean } = {}
  ): Promise<{ success: boolean; selector?: string; error?: string }> {
    const opts = {
      timeout: 5000,
      retries: 2,
      force: false,
      ...options,
    };

    console.log(`  🖱️ Clicking: ${elementName}`);

    let lastError: string | undefined;

    for (const selector of selectors) {
      for (let retry = 0; retry <= opts.retries; retry++) {
        try {
          const element = page.locator(selector).first();

          const count = await element.count();
          if (count === 0) {
            continue; // Try next selector
          }

          const isVisible = await element.isVisible({ timeout: opts.timeout });
          if (!isVisible) {
            lastError = `Element not visible: ${selector}`;
            continue;
          }

          await element.click({ timeout: opts.timeout, force: opts.force });

          console.log(`    ✅ ${elementName} clicked using: ${selector}`);

          return { success: true, selector };

        } catch (error: any) {
          lastError = error.message;
          console.log(`    ⚠️ Click attempt failed: ${lastError.substring(0, 100)}`);

          if (retry < opts.retries) {
            await page.waitForTimeout(500);
          }
        }
      }
    }

    console.log(`    ❌ ${elementName} could not be clicked`);
    console.log(`    Last error: ${lastError}`);

    return { success: false, error: lastError };
  }

  /**
   * Fill complete form and validate before submission
   */
  static async fillAndValidateForm(
    page: Page,
    fields: Array<{
      name: string;
      value: string;
      selectors: string[];
      options?: FillOptions;
    }>,
    formSelector: string = 'form'
  ): Promise<{
    success: boolean;
    results: FillResult[];
    canSubmit: boolean;
    validationReport?: string;
  }> {
    console.log('📝 Filling form with validation...');

    const results: FillResult[] = [];
    let allSuccess = true;

    // Fill all fields
    for (const field of fields) {
      const result = await this.fillField(
        page,
        field.selectors,
        field.value,
        field.name,
        field.options
      );

      results.push(result);

      if (!result.success) {
        allSuccess = false;
        console.log(`  ❌ Failed to fill: ${field.name}`);
      }
    }

    // Wait for validation to settle
    await FormValidationHelper.waitForValidationToSettle(page);

    // Validate form is ready for submission
    const validation = await FormValidationHelper.validateFormReadyForSubmit(page, formSelector);
    const canSubmit = validation.isValid;

    const report = FormValidationHelper.formatValidationReport(validation);

    if (!canSubmit) {
      console.log('  ❌ Form validation failed:');
      console.log(report);
    }

    return {
      success: allSuccess && canSubmit,
      results,
      canSubmit,
      validationReport: report,
    };
  }

  /**
   * Smart submit with validation checks
   */
  static async submitForm(
    page: Page,
    formSelector: string = 'form',
    options: {
      validateBefore?: boolean;
      waitForNavigation?: boolean;
      timeout?: number;
    } = {}
  ): Promise<{
    success: boolean;
    error?: string;
    validationReport?: string;
  }> {
    const opts = {
      validateBefore: true,
      waitForNavigation: true,
      timeout: 10000,
      ...options,
    };

    console.log('🚀 Submitting form...');

    // Validate before submission if requested
    if (opts.validateBefore) {
      const canSubmit = await FormValidationHelper.canSubmitForm(page, formSelector);

      if (!canSubmit.canSubmit) {
        const validation = await FormValidationHelper.validateFormReadyForSubmit(page, formSelector);
        const report = FormValidationHelper.formatValidationReport(validation);

        console.log('  ❌ Form cannot be submitted:');
        console.log(`     Reason: ${canSubmit.reason}`);
        console.log(report);

        return {
          success: false,
          error: canSubmit.reason,
          validationReport: report,
        };
      }
    }

    // Try to find and click submit button
    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("Submit")',
      'button:has-text("Post")',
      'button:has-text("Create")',
      'button:has-text("Register")',
      'button:has-text("Save")',
      'button:has-text("Next")',
    ];

    const clickResult = await this.clickElement(
      page,
      submitSelectors,
      'Submit Button',
      { timeout: opts.timeout }
    );

    if (!clickResult.success) {
      return {
        success: false,
        error: 'Could not find or click submit button',
      };
    }

    // Wait for navigation if requested
    if (opts.waitForNavigation) {
      try {
        await page.waitForLoadState('networkidle', { timeout: opts.timeout });
      } catch (error: any) {
        console.log('  ⚠️ Navigation did not complete within timeout, continuing...');
      }
    }

    console.log('  ✅ Form submitted successfully');

    return { success: true };
  }

  /**
   * Generate field filling report
   */
  static generateFillingReport(results: FillResult[]): string {
    const lines: string[] = [];

    lines.push('╔════════════════════════════════════════╗');
    lines.push('║      FORM FILLING REPORT               ║');
    lines.push('╚════════════════════════════════════════╝');
    lines.push('');

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    lines.push(`Total Fields: ${results.length}`);
    lines.push(`Successful: ${successful} ✅`);
    lines.push(`Failed: ${failed} ❌`);
    lines.push('');

    if (failed > 0) {
      lines.push('═══ FAILED FIELDS ═══');
      results
        .filter(r => !r.success)
        .forEach((result, idx) => {
          lines.push(`${idx + 1}. ${result.selector}`);
          lines.push(`   Value: "${result.value}"`);
          lines.push(`   Error: ${result.error}`);
          lines.push(`   Attempts: ${result.attemptCount}`);
        });
      lines.push('');
    }

    if (successful > 0) {
      lines.push('═══ SUCCESSFUL FIELDS ═══');
      results
        .filter(r => r.success)
        .forEach((result, idx) => {
          lines.push(`${idx + 1}. ${result.selector} ✅`);
        });
    }

    return lines.join('\n');
  }
}
