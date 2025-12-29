# Test Helpers - Quick Reference Guide

## Overview

Enhanced test helpers for reliable, maintainable E2E testing with Playwright.

## Quick Start

```typescript
import { test, expect } from '@playwright/test';
import { AuthHelper } from '../helpers/auth-enhanced';
import { FormFillingHelper } from '../helpers/form-filling';
import { FormValidationHelper } from '../helpers/form-validation';
import { ErrorReporter } from '../helpers/error-reporter';
```

## Common Patterns

### Pattern 1: Login Test
```typescript
test('user login', async ({ page }, testInfo) => {
  ErrorReporter.initializeTracking(page);

  const result = await AuthHelper.loginAsClient(page);

  expect(result.success, result.error).toBe(true);
});
```

### Pattern 2: Form Filling Test
```typescript
test('fill form', async ({ page }, testInfo) => {
  ErrorReporter.initializeTracking(page);

  await page.goto('http://localhost:3001/form');

  const result = await FormFillingHelper.fillAndValidateForm(page, [
    {
      name: 'Email',
      value: 'test@example.com',
      selectors: ['input[type="email"]', 'input[name="email"]']
    }
  ]);

  expect(result.success).toBe(true);

  const submitResult = await FormFillingHelper.submitForm(page);

  expect(submitResult.success).toBe(true);
});
```

### Pattern 3: Error Handling
```typescript
test('with error handling', async ({ page }, testInfo) => {
  ErrorReporter.initializeTracking(page);

  try {
    // Your test code
  } catch (error) {
    const context = await ErrorReporter.captureErrorContext(
      page,
      testInfo,
      error.message
    );
    await ErrorReporter.saveErrorReport(context, testInfo, error);
    throw error;
  }
});
```

## API Reference

### FormFillingHelper

#### Fill Specific Fields
```typescript
// Email
const result = await FormFillingHelper.fillEmail(page, 'user@example.com');

// Password
const result = await FormFillingHelper.fillPassword(page, 'SecurePass123!');

// Text field
const result = await FormFillingHelper.fillTextField(page, 'firstName', 'John');
```

#### Fill Entire Form
```typescript
const result = await FormFillingHelper.fillAndValidateForm(page, [
  {
    name: 'Email',
    value: 'test@example.com',
    selectors: ['input[type="email"]', 'input[name="email"]'],
    options: {
      waitForVisible: true,
      verifyValue: true,
      waitForValidation: true,
      retries: 2
    }
  }
]);
```

#### Submit Form
```typescript
const result = await FormFillingHelper.submitForm(page, 'form', {
  validateBefore: true,
  waitForNavigation: true,
  timeout: 10000
});
```

### FormValidationHelper

#### Validate Form
```typescript
const validation = await FormValidationHelper.validateFormReadyForSubmit(page);

if (!validation.isValid) {
  console.log(FormValidationHelper.formatValidationReport(validation));
}
```

#### Check Submit Readiness
```typescript
const canSubmit = await FormValidationHelper.canSubmitForm(page);

if (!canSubmit.canSubmit) {
  console.log(`Cannot submit: ${canSubmit.reason}`);
}
```

#### Wait for Validation
```typescript
await FormValidationHelper.waitForValidationToSettle(page);
```

### ErrorReporter

#### Initialize Tracking
```typescript
test.beforeEach(async ({ page }) => {
  ErrorReporter.initializeTracking(page);
});
```

#### Capture Error Context
```typescript
const context = await ErrorReporter.captureErrorContext(
  page,
  testInfo,
  'Error message'
);
```

#### Generate Report
```typescript
const report = ErrorReporter.generateErrorReport(context, error);
console.log(report);
```

#### Save Report
```typescript
const reportPath = await ErrorReporter.saveErrorReport(
  context,
  testInfo,
  error
);
```

#### Log Assertion Failure
```typescript
await ErrorReporter.logAssertionFailure(
  page,
  testInfo,
  'should be valid',
  expected,
  actual
);
```

### AuthHelper

#### Login
```typescript
// Login with options
const result = await AuthHelper.login(page, TEST_USERS.CLIENT, {
  waitForDashboard: true,
  validateForm: true
});

// Convenience methods
await AuthHelper.loginAsClient(page);
await AuthHelper.loginAsArtisan(page);
await AuthHelper.loginAsAdmin(page);
```

#### Register
```typescript
const result = await AuthHelper.register(page, {
  email: 'test@example.com',
  password: 'SecurePass123!',
  firstName: 'Test',
  lastName: 'User',
  role: 'CLIENT'
}, {
  validateForm: true,
  waitForRedirect: true
});
```

#### Utility Methods
```typescript
// Logout
await AuthHelper.logout(page);

// Check authentication
const isAuth = await AuthHelper.isAuthenticated(page);

// Verify role
const hasRole = await AuthHelper.verifyUserRole(page, 'CLIENT');

// Clear auth
await AuthHelper.clearAuth(page);
```

## Best Practices

### 1. Always Initialize Error Tracking
```typescript
test.beforeEach(async ({ page }) => {
  ErrorReporter.initializeTracking(page);
});
```

### 2. Validate Forms Before Submission
```typescript
const result = await FormFillingHelper.fillAndValidateForm(page, fields);

if (!result.canSubmit) {
  console.log(result.validationReport);
  throw new Error('Form validation failed');
}
```

### 3. Use Retry Options
```typescript
const result = await FormFillingHelper.fillField(
  page,
  selectors,
  value,
  'FieldName',
  {
    retries: 2,
    verifyValue: true,
    waitForValidation: true
  }
);
```

### 4. Handle Errors Properly
```typescript
try {
  // Test code
} catch (error) {
  const context = await ErrorReporter.captureErrorContext(page, testInfo, error.message);
  await ErrorReporter.saveErrorReport(context, testInfo, error);
  throw error;
}
```

### 5. Check Results
```typescript
const result = await FormFillingHelper.fillEmail(page, email);

if (!result.success) {
  console.log(`Failed to fill email: ${result.error}`);
  throw new Error(result.error);
}
```

## Common Selectors

### Email Fields
```typescript
const emailSelectors = [
  'input[type="email"]',
  'input[name="email"]',
  '#email',
  '[data-testid="email"]',
  '[placeholder*="email" i]'
];
```

### Password Fields
```typescript
const passwordSelectors = [
  'input[type="password"]',
  'input[name="password"]',
  '#password',
  '[data-testid="password"]'
];
```

### Submit Buttons
```typescript
const submitSelectors = [
  'button[type="submit"]',
  'input[type="submit"]',
  'button:has-text("Submit")',
  'button:has-text("Save")'
];
```

## Debugging Tips

### 1. Use Validation Reports
```typescript
const validation = await FormValidationHelper.validateFormReadyForSubmit(page);
console.log(FormValidationHelper.formatValidationReport(validation));
```

### 2. Check Filling Results
```typescript
const result = await FormFillingHelper.fillAndValidateForm(page, fields);
console.log(FormFillingHelper.generateFillingReport(result.results));
```

### 3. Capture Error Context
```typescript
const context = await ErrorReporter.captureErrorContext(page, testInfo, 'Debug');
console.log(ErrorReporter.generateErrorReport(context));
```

### 4. Check Error Summary
```typescript
const summary = ErrorReporter.getErrorSummary();
console.log(`Console Errors: ${summary.consoleErrorCount}`);
console.log(`Network Errors: ${summary.networkErrorCount}`);
```

## Migration from Old Tests

### Old Pattern
```typescript
await page.fill('input[type="email"]', email);
await page.fill('input[type="password"]', password);
await page.click('button[type="submit"]');
```

### New Pattern
```typescript
const result = await FormFillingHelper.fillAndValidateForm(page, [
  { name: 'Email', value: email, selectors: ['input[type="email"]'] },
  { name: 'Password', value: password, selectors: ['input[type="password"]'] }
]);

await FormFillingHelper.submitForm(page);
```

## Troubleshooting

### Form Won't Submit

1. Check validation:
```typescript
const validation = await FormValidationHelper.validateFormReadyForSubmit(page);
console.log(FormValidationHelper.formatValidationReport(validation));
```

2. Check submit button:
```typescript
const canSubmit = await FormValidationHelper.canSubmitForm(page);
console.log(canSubmit.reason);
```

### Field Won't Fill

1. Check if field exists:
```typescript
const result = await FormFillingHelper.fillField(
  page,
  selectors,
  value,
  'Field',
  { retries: 2 }
);

if (!result.success) {
  console.log(`Tried ${result.attemptCount} times`);
  console.log(`Error: ${result.error}`);
}
```

2. Try more selectors:
```typescript
const selectors = [
  'input[name="field"]',
  '#field',
  '[data-testid="field"]',
  '[placeholder*="field" i]'
];
```

### Test Keeps Failing

1. Initialize error tracking:
```typescript
ErrorReporter.initializeTracking(page);
```

2. Capture full context on failure:
```typescript
const context = await ErrorReporter.captureErrorContext(page, testInfo, 'Failure');
await ErrorReporter.saveErrorReport(context, testInfo);
```

3. Review artifacts:
   - Screenshot: Visual state at failure
   - HTML snapshot: Full DOM at failure
   - Console errors: JavaScript issues
   - Network errors: API failures

## Examples

See `tests/e2e/registration-refactored.spec.ts` for complete working examples.

## Support

For issues or questions, check:
1. Error reports in `test-results/error-reports/`
2. Screenshots in `test-results/error-screenshots/`
3. Validation reports in console output
