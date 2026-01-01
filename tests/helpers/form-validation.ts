import { Page, Locator, expect } from '@playwright/test';

/**
 * Enhanced Form Validation Helper
 * Provides comprehensive form validation checking before submission
 */

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
  fieldStates: Map<string, FieldState>;
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
  domElement?: string;
}

export interface FieldState {
  selector: string;
  value: string;
  isValid: boolean;
  isRequired: boolean;
  isDisabled: boolean;
  errorMessage?: string;
  validationState?: 'valid' | 'invalid' | 'pending' | 'unknown';
}

export class FormValidationHelper {
  /**
   * Check if form is ready for submission
   * Validates all fields and returns detailed state
   */
  static async validateFormReadyForSubmit(
    page: Page,
    formSelector: string = 'form'
  ): Promise<ValidationResult> {
    console.log('🔍 Validating form readiness for submission...');

    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      fieldStates: new Map(),
    };

    try {
      // Get form element
      const form = page.locator(formSelector).first();
      const formExists = await form.count() > 0;

      if (!formExists) {
        result.isValid = false;
        result.errors.push({
          field: 'form',
          message: `Form not found with selector: ${formSelector}`,
          severity: 'error',
        });
        return result;
      }

      // Check all input fields
      const inputs = await form.locator('input, textarea, select').all();

      for (const input of inputs) {
        const fieldState = await this.analyzeFieldState(input);

        if (fieldState.selector) {
          result.fieldStates.set(fieldState.selector, fieldState);

          // Check for validation errors
          if (fieldState.isRequired && !fieldState.value) {
            result.errors.push({
              field: fieldState.selector,
              message: `Required field is empty: ${fieldState.selector}`,
              severity: 'error',
            });
            result.isValid = false;
          }

          if (fieldState.errorMessage) {
            result.errors.push({
              field: fieldState.selector,
              message: fieldState.errorMessage,
              severity: 'error',
            });
            result.isValid = false;
          }

          if (fieldState.validationState === 'invalid') {
            result.warnings.push(
              `Field ${fieldState.selector} has invalid validation state`
            );
          }

          if (fieldState.isDisabled && fieldState.isRequired) {
            result.warnings.push(
              `Required field ${fieldState.selector} is disabled`
            );
          }
        }
      }

      // Check for visible error messages in the form
      const errorElements = await form.locator('[class*="error"], [role="alert"], .invalid-feedback').all();

      for (const errorEl of errorElements) {
        const isVisible = await errorEl.isVisible().catch(() => false);
        if (isVisible) {
          const errorText = await errorEl.textContent();
          if (errorText?.trim()) {
            result.errors.push({
              field: 'form',
              message: errorText.trim(),
              severity: 'error',
              domElement: await errorEl.evaluate(el => el.outerHTML.substring(0, 100)),
            });
            result.isValid = false;
          }
        }
      }

      // Check submit button state
      const submitButton = await this.findSubmitButton(form);
      if (submitButton) {
        const isDisabled = await submitButton.isDisabled().catch(() => true);
        if (isDisabled) {
          result.warnings.push('Submit button is currently disabled');

          // This might be intentional if form is invalid, but worth noting
          if (result.errors.length === 0) {
            result.errors.push({
              field: 'submit',
              message: 'Submit button is disabled but no validation errors detected',
              severity: 'warning',
            });
          }
        }
      }

      console.log(`  ✅ Form validation complete: ${result.isValid ? 'VALID' : 'INVALID'}`);
      console.log(`  Errors: ${result.errors.length}, Warnings: ${result.warnings.length}`);

      if (!result.isValid) {
        console.log('  ❌ Validation errors:');
        result.errors.forEach(err => {
          console.log(`    - [${err.field}] ${err.message}`);
        });
      }

      if (result.warnings.length > 0) {
        console.log('  ⚠️ Validation warnings:');
        result.warnings.forEach(warn => console.log(`    - ${warn}`));
      }

    } catch (error: any) {
      console.error('  ❌ Error during form validation:', error.message);
      result.isValid = false;
      result.errors.push({
        field: 'validation',
        message: `Validation check failed: ${error.message}`,
        severity: 'error',
      });
    }

    return result;
  }

  /**
   * Analyze individual field state
   */
  private static async analyzeFieldState(field: Locator): Promise<FieldState> {
    const state: FieldState = {
      selector: '',
      value: '',
      isValid: true,
      isRequired: false,
      isDisabled: false,
      validationState: 'unknown',
    };

    try {
      // Get field attributes
      const name = await field.getAttribute('name').catch(() => null);
      const id = await field.getAttribute('id').catch(() => null);
      const type = await field.getAttribute('type').catch(() => null);

      state.selector = name || id || type || 'unknown';
      state.value = await field.inputValue().catch(() => '');
      state.isRequired = await field.getAttribute('required').then(r => r !== null).catch(() => false);
      state.isDisabled = await field.isDisabled().catch(() => false);

      // Check for validation attributes
      const ariaInvalid = await field.getAttribute('aria-invalid').catch(() => null);
      if (ariaInvalid === 'true') {
        state.validationState = 'invalid';
        state.isValid = false;
      } else if (ariaInvalid === 'false') {
        state.validationState = 'valid';
      }

      // Check for error messages associated with field
      const describedBy = await field.getAttribute('aria-describedby').catch(() => null);
      if (describedBy) {
        const errorEl = await field.page().locator(`#${describedBy}`).first();
        const errorText = await errorEl.textContent().catch(() => null);
        if (errorText?.trim()) {
          state.errorMessage = errorText.trim();
          state.isValid = false;
        }
      }

      // Check for HTML5 validation
      const validity = await field.evaluate((el: any) => {
        if (el.validity) {
          return {
            valid: el.validity.valid,
            valueMissing: el.validity.valueMissing,
            typeMismatch: el.validity.typeMismatch,
            patternMismatch: el.validity.patternMismatch,
            tooLong: el.validity.tooLong,
            tooShort: el.validity.tooShort,
            rangeUnderflow: el.validity.rangeUnderflow,
            rangeOverflow: el.validity.rangeOverflow,
            stepMismatch: el.validity.stepMismatch,
            customError: el.validity.customError,
          };
        }
        return null;
      }).catch(() => null);

      if (validity && !validity.valid) {
        state.isValid = false;
        state.validationState = 'invalid';

        // Build error message from validity state
        const validityErrors: string[] = [];
        if (validity.valueMissing) validityErrors.push('Value is required');
        if (validity.typeMismatch) validityErrors.push('Value type is incorrect');
        if (validity.patternMismatch) validityErrors.push('Value does not match required pattern');
        if (validity.tooLong) validityErrors.push('Value is too long');
        if (validity.tooShort) validityErrors.push('Value is too short');
        if (validity.rangeUnderflow) validityErrors.push('Value is below minimum');
        if (validity.rangeOverflow) validityErrors.push('Value is above maximum');

        if (validityErrors.length > 0) {
          state.errorMessage = validityErrors.join(', ');
        }
      }

    } catch (error: any) {
      console.warn(`  ⚠️ Could not analyze field state: ${error.message}`);
    }

    return state;
  }

  /**
   * Find submit button in form
   */
  private static async findSubmitButton(form: Locator): Promise<Locator | null> {
    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("Submit")',
      'button:has-text("Post")',
      'button:has-text("Create")',
      'button:has-text("Register")',
      'button:has-text("Save")',
    ];

    for (const selector of submitSelectors) {
      const button = form.locator(selector).first();
      const count = await button.count();
      if (count > 0) {
        return button;
      }
    }

    return null;
  }

  /**
   * Wait for form validation to settle
   * Useful after filling fields to let async validation complete
   */
  static async waitForValidationToSettle(
    page: Page,
    timeoutMs: number = 2000
  ): Promise<void> {
    console.log('⏳ Waiting for form validation to settle...');

    // Wait for any pending validation animations or async checks
    await page.waitForTimeout(500);

    // Wait for network to be idle (in case of async validation)
    await page.waitForLoadState('networkidle', { timeout: timeoutMs }).catch(() => {
      console.log('  ⚠️ Network did not become idle, continuing...');
    });

    // Additional wait for any debounced validation
    await page.waitForTimeout(500);

    console.log('  ✅ Validation should be settled');
  }

  /**
   * Check if submit button will actually work
   */
  static async canSubmitForm(page: Page, formSelector: string = 'form'): Promise<{
    canSubmit: boolean;
    reason?: string;
  }> {
    const validation = await this.validateFormReadyForSubmit(page, formSelector);

    if (!validation.isValid) {
      return {
        canSubmit: false,
        reason: `Form has ${validation.errors.length} validation error(s)`,
      };
    }

    const form = page.locator(formSelector).first();
    const submitButton = await this.findSubmitButton(form);

    if (!submitButton) {
      return {
        canSubmit: false,
        reason: 'No submit button found',
      };
    }

    const isDisabled = await submitButton.isDisabled().catch(() => true);
    if (isDisabled) {
      return {
        canSubmit: false,
        reason: 'Submit button is disabled',
      };
    }

    return { canSubmit: true };
  }

  /**
   * Generate readable validation report
   */
  static formatValidationReport(result: ValidationResult): string {
    const lines: string[] = [];

    lines.push('╔════════════════════════════════════════╗');
    lines.push('║      FORM VALIDATION REPORT            ║');
    lines.push('╚════════════════════════════════════════╝');
    lines.push('');

    lines.push(`Overall Status: ${result.isValid ? '✅ VALID' : '❌ INVALID'}`);
    lines.push(`Total Errors: ${result.errors.length}`);
    lines.push(`Total Warnings: ${result.warnings.length}`);
    lines.push(`Fields Analyzed: ${result.fieldStates.size}`);
    lines.push('');

    if (result.errors.length > 0) {
      lines.push('═══ ERRORS ═══');
      result.errors.forEach((err, idx) => {
        lines.push(`${idx + 1}. [${err.field}] ${err.message}`);
        if (err.domElement) {
          lines.push(`   DOM: ${err.domElement}`);
        }
      });
      lines.push('');
    }

    if (result.warnings.length > 0) {
      lines.push('═══ WARNINGS ═══');
      result.warnings.forEach((warn, idx) => {
        lines.push(`${idx + 1}. ${warn}`);
      });
      lines.push('');
    }

    if (result.fieldStates.size > 0) {
      lines.push('═══ FIELD STATES ═══');
      result.fieldStates.forEach((state, field) => {
        const status = state.isValid ? '✅' : '❌';
        const required = state.isRequired ? '[REQUIRED]' : '';
        const disabled = state.isDisabled ? '[DISABLED]' : '';
        const valueInfo = state.value ? `value="${state.value.substring(0, 20)}${state.value.length > 20 ? '...' : ''}"` : '[empty]';

        lines.push(`${status} ${field} ${required} ${disabled}`);
        lines.push(`   ${valueInfo}`);

        if (state.errorMessage) {
          lines.push(`   ⚠️ ${state.errorMessage}`);
        }
      });
    }

    return lines.join('\n');
  }
}
