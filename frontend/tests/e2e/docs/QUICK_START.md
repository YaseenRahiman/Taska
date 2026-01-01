# Quick Start Guide - Refactored Test Infrastructure

## Overview

The test infrastructure has been enhanced with:
- ✅ **Centralized selectors** (no more scattered selector strings)
- ✅ **Retry utilities** (handle flaky operations automatically)
- ✅ **Smart waiting** (no more hardcoded timeouts)
- ✅ **Enhanced assertions** (better error messages)

---

## Using the New Infrastructure

### 1. Import What You Need

```typescript
// Import selectors
import { AUTH_SELECTORS, NAV_SELECTORS, JOB_SELECTORS, BID_SELECTORS } from '../selectors';

// Import utilities
import {
  waitForPageLoad,
  waitForElement,
  retryClick,
  retryFill,
  safeClick,
  safeFill,
  assertVisible,
  assertText,
  assertUrl
} from '../utils';

// Import Playwright
import { test, expect, Page } from '@playwright/test';
```

### 2. Use Centralized Selectors

```typescript
// ❌ OLD WAY (fragile)
await page.locator('input[type="email"]').fill('user@test.com');
await page.locator('button:has-text("Submit")').click();

// ✅ NEW WAY (robust)
await page.locator(AUTH_SELECTORS.login.emailInput).fill('user@test.com');
await page.locator(AUTH_SELECTORS.login.submitButton).click();

// ✅ WITH FALLBACK (works without component changes)
await page.locator(AUTH_SELECTORS.login.emailInputFallback).fill('user@test.com');
```

### 3. Add Retry Logic

```typescript
// ❌ OLD WAY (fails on first error)
await page.click('button[type="submit"]');
await page.fill('input', 'value');

// ✅ NEW WAY (retries on failure)
await retryClick(page.locator('button[type="submit"]'));
await retryFill(page.locator('input'), 'value');

// ✅ EVEN BETTER (pre-configured safe operations)
await safeClick(page.locator(AUTH_SELECTORS.login.submitButton));
await safeFill(page.locator(AUTH_SELECTORS.login.emailInput), 'user@test.com');
```

### 4. Replace Hardcoded Timeouts

```typescript
// ❌ OLD WAY (arbitrary wait)
await page.waitForTimeout(2000);

// ✅ NEW WAY (wait for specific condition)
await waitForPageLoad(page);
await expect(element).toBeVisible();

// ✅ CUSTOM WAIT (with retry)
await waitForElement(page, selector, {
  timeout: 10000,
  retries: 3
});
```

### 5. Use Enhanced Assertions

```typescript
// ❌ OLD WAY (generic error message)
await expect(page.locator('h1')).toBeVisible();

// ✅ NEW WAY (contextual error message)
await assertVisible(page.locator('h1'), {
  message: 'Dashboard heading should be visible after login',
  timeout: 10000
});

// ✅ TEXT ASSERTION (shows actual vs expected)
await assertText(heading, /dashboard/i, {
  message: 'Heading should indicate dashboard page'
});

// ✅ URL ASSERTION (shows current URL on failure)
await assertUrl(page, /\/client\/dashboard/, {
  message: 'Should navigate to client dashboard'
});
```

---

## Common Patterns

### Pattern 1: Login Flow

```typescript
import { AUTH_SELECTORS } from '../selectors';
import { waitForPageLoad, safeFill, safeClick, assertUrl } from '../utils';

test('should login successfully', async ({ page }) => {
  // Navigate
  await page.goto('/auth/login');
  await waitForPageLoad(page);

  // Fill form with retry
  await safeFill(
    page.locator(AUTH_SELECTORS.login.emailInput),
    'user@test.com'
  );
  await safeFill(
    page.locator(AUTH_SELECTORS.login.passwordInput),
    'password123'
  );

  // Submit with retry
  await safeClick(page.locator(AUTH_SELECTORS.login.submitButton));

  // Assert navigation
  await assertUrl(page, /\/dashboard/, {
    message: 'Should redirect to dashboard after login'
  });
});
```

### Pattern 2: Form Submission

```typescript
import { JOB_SELECTORS } from '../selectors';
import { waitForPageLoad, safeFill, safeClick } from '../utils';

test('should create job', async ({ page }) => {
  await page.goto('/client/jobs/create');
  await waitForPageLoad(page);

  // Fill form
  await safeFill(
    page.locator(JOB_SELECTORS.createForm.titleInput),
    'Fix plumbing'
  );
  await safeFill(
    page.locator(JOB_SELECTORS.createForm.descriptionTextarea),
    'Need urgent plumbing fix'
  );

  // Select category
  await page
    .locator(JOB_SELECTORS.createForm.categorySelect)
    .selectOption('Plumbing');

  // Submit
  await safeClick(page.locator(JOB_SELECTORS.createForm.submitButton));

  // Verify success
  await expect(page).toHaveURL(/\/client\/jobs/);
});
```

### Pattern 3: Navigation Test

```typescript
import { NAV_SELECTORS } from '../selectors';
import { waitForPageLoad, safeClick, assertUrl } from '../utils';

test('should navigate to browse page', async ({ page }) => {
  await page.goto('/');
  await waitForPageLoad(page);

  // Click navigation link
  await safeClick(page.locator(NAV_SELECTORS.header.browseLink));

  // Verify navigation
  await assertUrl(page, /\/browse/, {
    message: 'Should navigate to browse page'
  });
});
```

### Pattern 4: List Operations

```typescript
import { JOB_SELECTORS } from '../selectors';
import { waitForStableContent, assertCount } from '../utils';

test('should display job list', async ({ page }) => {
  await page.goto('/client/jobs');

  const jobCards = page.locator(JOB_SELECTORS.jobCard.container);

  // Wait for content to stabilize
  await waitForStableContent(jobCards, { stabilityTime: 500 });

  // Assert count
  await assertCount(jobCards, 5, {
    message: 'Should display 5 job cards'
  });

  // Iterate over cards
  const count = await jobCards.count();
  for (let i = 0; i < count; i++) {
    const title = await jobCards
      .nth(i)
      .locator(JOB_SELECTORS.jobCard.title)
      .textContent();
    console.log(`Job ${i + 1}: ${title}`);
  }
});
```

---

## Migration Checklist

When updating an existing test:

### Step 1: Update Imports
```typescript
// Add at top of file
import { AUTH_SELECTORS, JOB_SELECTORS } from '../selectors';
import { waitForPageLoad, safeClick, safeFill, assertVisible } from '../utils';
```

### Step 2: Replace Selectors
```typescript
// Find: page.locator('input[type="email"]')
// Replace: page.locator(AUTH_SELECTORS.login.emailInput)

// Or use fallback: page.locator(AUTH_SELECTORS.login.emailInputFallback)
```

### Step 3: Remove Timeouts
```typescript
// Find: await page.waitForTimeout(2000);
// Replace: await waitForPageLoad(page);
```

### Step 4: Add Retry Logic
```typescript
// Find: await page.click('button')
// Replace: await safeClick(page.locator('button'))

// Find: await page.fill('input', 'value')
// Replace: await safeFill(page.locator('input'), 'value')
```

### Step 5: Enhance Assertions
```typescript
// Find: await expect(element).toBeVisible();
// Replace:
await assertVisible(element, {
  message: 'Element should be visible',
  timeout: 10000
});
```

---

## Available Selectors

### Auth
- `AUTH_SELECTORS.login.*` - Login form
- `AUTH_SELECTORS.register.*` - Registration form
- `AUTH_SELECTORS.userMenu.*` - User menu/logout

### Navigation
- `NAV_SELECTORS.header.*` - Header navigation
- `NAV_SELECTORS.footer.*` - Footer links
- `NAV_SELECTORS.sidebar.*` - Dashboard sidebar

### Jobs
- `JOB_SELECTORS.createForm.*` - Job creation form
- `JOB_SELECTORS.jobCard.*` - Job card components
- `JOB_SELECTORS.jobDetails.*` - Job details page
- `JOB_SELECTORS.jobList.*` - Job list/filters

### Bids
- `BID_SELECTORS.bidForm.*` - Bid submission form
- `BID_SELECTORS.bidCard.*` - Bid card components
- `BID_SELECTORS.bidDetails.*` - Bid details page

### Common
- `COMMON_SELECTORS.modal` - Modal dialogs
- `COMMON_SELECTORS.spinner` - Loading indicators
- `COMMON_SELECTORS.errorMessage` - Error messages

---

## Available Utilities

### Waiting
- `waitForPageLoad(page)` - Smart page ready detection
- `waitForElement(page, selector)` - Element with retry
- `waitForNavigation(page, url)` - URL change + page load
- `waitForStableContent(locator)` - Dynamic content stabilization

### Retry
- `retryClick(locator)` - Click with retry
- `retryFill(locator, value)` - Fill with retry
- `safeClick(locator)` - Pre-configured click
- `safeFill(locator, value)` - Pre-configured fill
- `retryAction(fn)` - Custom action retry

### Assertions
- `assertVisible(locator)` - Visibility with context
- `assertText(locator, text)` - Text matching
- `assertUrl(page, pattern)` - URL verification
- `assertCount(locator, count)` - Element count
- `assertEnabled(locator)` - Enabled state

---

## Tips

### 1. Always use fallback selectors initially
Until components have data-testid attributes, use fallback selectors:
```typescript
page.locator(AUTH_SELECTORS.login.emailInputFallback)
```

### 2. Add meaningful error messages
Help future debugging with clear assertions:
```typescript
await assertVisible(submitButton, {
  message: 'Submit button should be visible after form validation passes'
});
```

### 3. Avoid hardcoded timeouts
Replace all `waitForTimeout` with conditional waits:
```typescript
// Instead of: await page.waitForTimeout(2000);
await expect(element).toBeVisible();
```

### 4. Use retry for flaky operations
Any operation that occasionally fails should have retry:
```typescript
// Forms, clicks, navigation
await safeClick(button);
await safeFill(input, value);
```

### 5. Check the docs
Full details in: `frontend/tests/e2e/docs/selector-patterns.md`

---

## Questions?

- **Selector not found?** Check `selectors/index.ts` for full list
- **Need new utility?** Check `utils/index.ts` or add to utilities
- **Pattern unclear?** See `docs/selector-patterns.md`
- **Example needed?** See `helpers/auth.helper.refactored.ts`

---

## Next Steps

1. **Read**: `docs/selector-patterns.md` for comprehensive guide
2. **Review**: `helpers/auth.helper.refactored.ts` for complete example
3. **Try**: Update one test file as practice
4. **Adopt**: Use patterns for all new tests
5. **Migrate**: Gradually update existing tests
