# E2E Test Suite - Quick Reference Card

## 🚀 Quick Start

```bash
# Apply fixes
cp playwright.config.fixed.ts playwright.config.ts

# Run tests
npm run test:e2e
```

## 📦 New Helpers

### Account Management
```typescript
import { loginWithPooledAccount, cleanupAccount } from './helpers/account-pool.helper';

// In test
const { account } = await loginWithPooledAccount(page, 'CLIENT');
try {
  // ... test code ...
} finally {
  await cleanupAccount(page, account);
}
```

### Navigation
```typescript
import { clickAndNavigate, navigateAndWait } from './helpers/test-utilities.helper';

// Click link and navigate
await clickAndNavigate(page, 'a:has-text("About")', /\/about/);

// Direct navigation
await navigateAndWait(page, '/dashboard', {
  expectedUrl: /\/dashboard/,
  waitForSelector: 'h1'
});
```

### Forms
```typescript
import { fillFormField, submitFormAndWait } from './helpers/test-utilities.helper';

// Fill field
await fillFormField(page, 'input[name="email"]', 'test@example.com');

// Submit
await submitFormAndWait(page, 'button[type="submit"]', {
  waitForUrl: /\/success/
});
```

## ✅ Test Pattern

```typescript
test('my test', async ({ page }) => {
  // 1. Get account
  const { account } = await loginWithPooledAccount(page, 'CLIENT');

  try {
    // 2. Navigate
    await navigateAndWait(page, '/path');

    // 3. Interact
    await fillFormField(page, 'input', 'value');
    await submitFormAndWait(page, 'button');

    // 4. Assert
    await expect(page.locator('.result')).toBeVisible();

  } finally {
    // 5. Cleanup
    await cleanupAccount(page, account);
  }
});
```

## 🔧 Common Fixes

| Old (Broken) | New (Fixed) |
|-------------|-------------|
| `await page.click('a')` | `await clickAndNavigate(page, 'a', /url/)` |
| `await page.goto('/path')` | `await navigateAndWait(page, '/path')` |
| `await page.fill('input', 'val')` | `await fillFormField(page, 'input', 'val')` |
| Hardcoded credentials | `loginWithPooledAccount(page, 'CLIENT')` |
| No cleanup | `cleanupAccount(page, account)` |

## ⚠️ Common Mistakes

❌ **DON'T**:
```typescript
await page.click('a:has-text("About")');
await expect(page).toHaveURL(/\/about/); // Race condition!
```

✅ **DO**:
```typescript
await clickAndNavigate(page, 'a:has-text("About")', /\/about/);
```

---

❌ **DON'T**:
```typescript
// Expect error for VALID input
await page.fill('input[name="email"]', 'valid@email.com');
await expect(page.locator('.error')).toBeVisible(); // WRONG!
```

✅ **DO**:
```typescript
// Check validation passes for valid input
const isValid = await input.evaluate((el: HTMLInputElement) => el.validity.valid);
expect(isValid).toBe(true);
```

## 🎯 Cleanup Pattern

```typescript
test.afterEach(async ({ page }) => {
  await clearAuthState(page);
});
```

## 📊 Debugging

```typescript
// Take screenshot
await takeDebugScreenshot(page, 'debug-name');

// Check element exists
const exists = await elementExists(page, '.selector');

// Retry operation
await retryOperation(async () => {
  await page.click('button');
}, { maxAttempts: 3 });
```

## 📈 Stats

```typescript
import { accountPool } from './helpers/account-pool.helper';
const stats = accountPool.getPoolStats();
console.log(stats);
// { total: 12, available: 8, inUse: 3, locked: 1 }
```

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Account locked | Check pool stats, wait 5 min |
| Test timeout | Increase timeout in config |
| Navigation fails | Use clickAndNavigate helper |
| Element not found | Add waitForSelector option |
| Flaky test | Use retryOperation |

## 📚 Documentation

- **Detailed Guide**: `TEST_SUITE_FIXES.md`
- **Apply Guide**: `APPLY_FIXES.md`
- **Example Tests**: `EXAMPLE_FIXED_TEST.spec.ts`
- **Full Deliverable**: `QUALITY_ENGINEER_DELIVERABLE.md`

## 🔗 File Locations

```
tests/
├── e2e/
│   ├── helpers/
│   │   ├── account-pool.helper.ts       ← Account management
│   │   └── test-utilities.helper.ts     ← Test utilities
│   ├── EXAMPLE_FIXED_TEST.spec.ts       ← Reference patterns
│   └── [test files]
├── TEST_SUITE_FIXES.md                  ← Technical details
├── APPLY_FIXES.md                       ← Implementation steps
├── QUICK_REFERENCE.md                   ← This file
└── QUALITY_ENGINEER_DELIVERABLE.md      ← Full summary
```

## ⚡ Performance

| Config | Value | Reason |
|--------|-------|--------|
| `workers` | 1 | Prevent conflicts |
| `fullyParallel` | false | Test isolation |
| `retries` | 1 | Handle transients |
| `timeout` | 60s | Allow slow ops |

## 🎓 Best Practices

1. ✅ Use account pool
2. ✅ Use test utilities
3. ✅ Add cleanup
4. ✅ Wait for navigation
5. ✅ Validate correctly
6. ✅ Take debug screenshots
7. ✅ Use retries
8. ✅ Check existence first

---

**Quick Help**: See APPLY_FIXES.md for step-by-step guide
**Full Details**: See TEST_SUITE_FIXES.md for comprehensive documentation
