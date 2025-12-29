# Selector Patterns and Best Practices

## Overview

This document defines the selector strategy for Taska platform E2E tests. Following these patterns ensures tests are:
- **Resilient** to UI changes
- **Maintainable** with centralized selectors
- **Accessible** using semantic HTML
- **Reliable** with proper waiting strategies

---

## Selector Priority Hierarchy

### 1. data-testid Attributes (BEST)

**When to use**: Always prefer when available

**Advantages**:
- Stable across UI refactoring
- Clear intent (made for testing)
- No coupling to implementation details

**Example**:
```typescript
// Component
<button data-testid="submit-button">Submit</button>

// Test
page.getByTestId('submit-button')
// OR using selectors
page.locator('[data-testid="submit-button"]')
```

**Naming conventions**:
- Use kebab-case: `submit-button`, `email-input`
- Be descriptive: `job-create-button` not `button1`
- Include context: `nav-browse-link` vs `browse-link`
- Suffix with element type: `-button`, `-input`, `-link`, `-card`

---

### 2. Accessible Roles + Names (GOOD)

**When to use**: When data-testid is not available, especially for semantic elements

**Advantages**:
- Ensures accessibility compliance
- Semantic and meaningful
- Works with screen readers

**Example**:
```typescript
// Component (no data-testid needed)
<button>Submit Form</button>
<input type="email" aria-label="Email Address" />

// Test
page.getByRole('button', { name: 'Submit Form' })
page.getByRole('textbox', { name: 'Email Address' })
```

**Common roles**:
- `button`, `link`, `textbox`, `checkbox`, `radio`
- `heading`, `navigation`, `list`, `listitem`
- `dialog`, `alert`, `status`

---

### 3. Form Labels (ACCEPTABLE)

**When to use**: For form inputs with associated labels

**Advantages**:
- Accessible and semantic
- Stable unless copy changes

**Example**:
```typescript
// Component
<label for="email">Email Address</label>
<input id="email" name="email" />

// Test
page.getByLabel('Email Address')
// OR
page.getByPlaceholder('Enter your email')
```

---

### 4. Attributes (FALLBACK)

**When to use**: Last resort when semantic options unavailable

**Advantages**:
- Works when nothing else available
- Better than class names

**Example**:
```typescript
// Test
page.locator('input[name="email"]')
page.locator('button[type="submit"]')
page.locator('input[type="password"]')
```

---

### 5. AVOID: Text Content and Classes

**Never use** (unless absolutely no alternative):
```typescript
// ❌ FRAGILE: Breaks on copy changes
page.locator('text=Submit')
page.locator(':has-text("Login")')

// ❌ BRITTLE: Breaks on styling changes
page.locator('.btn-primary')
page.locator('.card-header')

// ❌ COMPLEX: Hard to maintain
page.locator('div > p > span.text-sm')
```

---

## Selector Usage Examples

### Authentication Selectors

```typescript
import { AUTH_SELECTORS, AUTH_ROLES } from '../selectors';

// ✅ BEST: Using data-testid via centralized selectors
await page.locator(AUTH_SELECTORS.login.emailInput).fill('user@test.com');

// ✅ GOOD: Using accessible role
await page.getByRole('button', { name: AUTH_ROLES.submitButton.name }).click();

// ✅ ACCEPTABLE: Using label
await page.getByLabel('Email Address').fill('user@test.com');

// ⚠️ FALLBACK: When components lack data-testid
await page.locator(AUTH_SELECTORS.login.emailInputFallback).fill('user@test.com');
```

### Navigation Selectors

```typescript
import { NAV_SELECTORS, NAV_ROLES } from '../selectors';

// ✅ Primary selector (when component has data-testid)
await page.locator(NAV_SELECTORS.header.browseLink).click();

// ✅ Role-based (semantic)
await page.getByRole('link', { name: /find artisans|browse/i }).click();

// ⚠️ Fallback (when no data-testid)
await page.locator(NAV_SELECTORS.header.browseLinkFallback).click();
```

### Dynamic Content

```typescript
import { JOB_SELECTORS } from '../selectors';

// ✅ Card containers with data-testid
const jobCards = page.locator(JOB_SELECTORS.jobCard.container);

// ✅ Accessible role for list items
const jobs = page.getByRole('article', { name: /job/i });

// ✅ Iterate over cards
const count = await jobCards.count();
for (let i = 0; i < count; i++) {
  const title = await jobCards.nth(i).locator(JOB_SELECTORS.jobCard.title).textContent();
  console.log(title);
}
```

---

## Waiting Strategies

### Never Use Hardcoded Timeouts

```typescript
// ❌ BAD: Arbitrary wait
await page.waitForTimeout(1000);

// ✅ GOOD: Wait for specific condition
await expect(element).toBeVisible();
await page.waitForLoadState('networkidle');
```

### Use Smart Waiting Utilities

```typescript
import { waitForPageLoad, waitForElement, waitForStableContent } from '../utils';

// ✅ Wait for page ready
await waitForPageLoad(page);

// ✅ Wait for element with retry
await waitForElement(page, JOB_SELECTORS.jobCard.container, {
  timeout: 10000,
  retries: 3
});

// ✅ Wait for dynamic content to stabilize
await waitForStableContent(jobCards, { stabilityTime: 500 });
```

### Auto-Waiting Actions

Playwright actions have built-in auto-waiting:

```typescript
// ✅ These automatically wait for actionability
await page.click('button');           // Waits for visible + enabled
await page.fill('input', 'value');    // Waits for visible + editable
await page.selectOption('select', 'option'); // Waits for visible + enabled
```

---

## Retry Strategies

### Retry Flaky Operations

```typescript
import { retryClick, retryFill, safeClick, safeFill } from '../utils';

// ✅ Retry with exponential backoff
await retryClick(submitButton, { maxAttempts: 3, backoff: true });

// ✅ Retry fill with clearing
await retryFill(emailInput, 'user@test.com', { maxAttempts: 3 });

// ✅ Safe operations with built-in error handling
await safeClick(submitButton);
await safeFill(emailInput, 'user@test.com');
```

### Retry with Custom Conditions

```typescript
import { retryAction, retryUntil } from '../utils';

// ✅ Retry any operation
await retryAction(
  async () => {
    await page.click('button');
    await expect(page).toHaveURL(/dashboard/);
  },
  { maxAttempts: 3, errorMessage: 'Failed to navigate to dashboard' }
);

// ✅ Retry until condition met
await retryUntil(
  async () => {
    const count = await jobCards.count();
    return count > 0;
  },
  { maxAttempts: 10, checkInterval: 500 }
);
```

---

## Enhanced Assertions

### Use Custom Assertions with Better Errors

```typescript
import { assertVisible, assertText, assertUrl } from '../utils';

// ✅ Enhanced visibility assertion
await assertVisible(element, {
  timeout: 10000,
  message: 'Submit button should be visible after form fill'
});

// ✅ Enhanced text assertion with context
await assertText(heading, /dashboard/i, {
  message: 'Page heading should indicate dashboard'
});

// ✅ Enhanced URL assertion
await assertUrl(page, /\/client\/dashboard/, {
  message: 'Should navigate to client dashboard after login'
});
```

---

## Common Patterns

### Pattern 1: Login Flow

```typescript
import { AUTH_SELECTORS } from '../selectors';
import { waitForPageLoad, retryFill, safeClick } from '../utils';

async function login(page: Page, email: string, password: string) {
  // Navigate
  await page.goto('/auth/login');
  await waitForPageLoad(page);

  // Fill with retry
  await retryFill(page.locator(AUTH_SELECTORS.login.emailInput), email);
  await retryFill(page.locator(AUTH_SELECTORS.login.passwordInput), password);

  // Submit with retry
  await safeClick(page.locator(AUTH_SELECTORS.login.submitButton));

  // Wait for navigation
  await page.waitForURL(/\/dashboard/);
  await waitForPageLoad(page);
}
```

### Pattern 2: Form Submission

```typescript
import { JOB_SELECTORS } from '../selectors';
import { retryFill, safeClick, assertUrl } from '../utils';

async function createJob(page: Page, jobData: JobData) {
  // Fill form fields with retry
  await retryFill(page.locator(JOB_SELECTORS.createForm.titleInput), jobData.title);
  await retryFill(page.locator(JOB_SELECTORS.createForm.descriptionTextarea), jobData.description);

  // Select dropdown
  await page.locator(JOB_SELECTORS.createForm.categorySelect).selectOption(jobData.category);

  // Submit
  await safeClick(page.locator(JOB_SELECTORS.createForm.submitButton));

  // Verify success
  await assertUrl(page, /\/client\/jobs/, {
    message: 'Should redirect to jobs list after creation'
  });
}
```

### Pattern 3: List Operations

```typescript
import { JOB_SELECTORS } from '../selectors';
import { waitForStableContent } from '../utils';

async function getJobTitles(page: Page): Promise<string[]> {
  const jobCards = page.locator(JOB_SELECTORS.jobCard.container);

  // Wait for content to stabilize
  await waitForStableContent(jobCards, { stabilityTime: 500 });

  // Extract titles
  const count = await jobCards.count();
  const titles: string[] = [];

  for (let i = 0; i < count; i++) {
    const title = await jobCards
      .nth(i)
      .locator(JOB_SELECTORS.jobCard.title)
      .textContent();
    titles.push(title || '');
  }

  return titles;
}
```

---

## Migration Checklist

When refactoring existing tests:

### 1. Import Centralized Selectors
```typescript
// ❌ Before
await page.locator('input[type="email"]').fill(email);

// ✅ After
import { AUTH_SELECTORS } from '../selectors';
await page.locator(AUTH_SELECTORS.login.emailInput).fill(email);
```

### 2. Replace Hardcoded Timeouts
```typescript
// ❌ Before
await page.waitForTimeout(2000);

// ✅ After
import { waitForPageLoad } from '../utils';
await waitForPageLoad(page);
```

### 3. Add Retry Logic
```typescript
// ❌ Before
await page.click('button[type="submit"]');

// ✅ After
import { safeClick } from '../utils';
await safeClick(page.locator(AUTH_SELECTORS.login.submitButton));
```

### 4. Enhance Assertions
```typescript
// ❌ Before
await expect(page.locator('h1')).toBeVisible();

// ✅ After
import { assertVisible } from '../utils';
await assertVisible(page.locator('h1'), {
  message: 'Page heading should be visible after load'
});
```

---

## Testing Best Practices

### 1. Use Page Object Pattern (Optional)

For complex pages, consider page objects:

```typescript
class LoginPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto('/auth/login');
    await waitForPageLoad(this.page);
  }

  async fillEmail(email: string) {
    await retryFill(this.page.locator(AUTH_SELECTORS.login.emailInput), email);
  }

  async fillPassword(password: string) {
    await retryFill(this.page.locator(AUTH_SELECTORS.login.passwordInput), password);
  }

  async submit() {
    await safeClick(this.page.locator(AUTH_SELECTORS.login.submitButton));
  }

  async login(email: string, password: string) {
    await this.navigate();
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
  }
}
```

### 2. Keep Tests Focused

```typescript
// ✅ GOOD: One assertion per test
test('should show validation error for empty email', async ({ page }) => {
  await page.goto('/auth/login');
  await page.locator(AUTH_SELECTORS.login.submitButton).click();
  await assertVisible(page.locator(AUTH_SELECTORS.login.errorMessage));
});

// ❌ BAD: Testing too many things
test('should handle all login scenarios', async ({ page }) => {
  // Tests empty form, invalid email, wrong password, successful login...
  // Too many responsibilities
});
```

### 3. Use Descriptive Test Names

```typescript
// ✅ GOOD: Clear what is being tested
test('should display validation error when email field is empty', async ({ page }) => {
  // Test implementation
});

// ❌ BAD: Vague test name
test('email validation', async ({ page }) => {
  // What about email validation?
});
```

### 4. Clean Up After Tests

```typescript
test.afterEach(async ({ page }) => {
  // Clean up any test data
  await page.evaluate(() => localStorage.clear());
});
```

---

## Quick Reference

### Import Statements

```typescript
// Selectors
import { AUTH_SELECTORS, NAV_SELECTORS, JOB_SELECTORS, BID_SELECTORS } from '../selectors';

// Utilities
import { waitForPageLoad, retryClick, safeClick, assertVisible } from '../utils';

// Test framework
import { test, expect, Page } from '@playwright/test';
```

### Common Operations

```typescript
// Navigate
await page.goto('/path');
await waitForPageLoad(page);

// Fill form
await retryFill(input, 'value');

// Click
await safeClick(button);

// Assert
await assertVisible(element);
await assertText(element, 'expected text');
await assertUrl(page, /expected-url/);

// Wait
await waitForElement(page, selector);
await waitForStableContent(locator);
```

---

## Questions?

For questions or clarifications about selector patterns:
1. Check the comprehensive analysis document
2. Review existing test examples
3. Consult the team's testing standards
