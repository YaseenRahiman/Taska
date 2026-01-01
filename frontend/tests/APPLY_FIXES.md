# How to Apply Test Suite Fixes

## Quick Start

### Step 1: Backup Current Configuration

```bash
cd C:/Users/Yaseen/OneDrive/Documents/Investments/Taska/frontend

# Backup current config
cp playwright.config.ts playwright.config.backup.ts
```

### Step 2: Apply Fixed Configuration

```bash
# Replace with fixed configuration
cp playwright.config.fixed.ts playwright.config.ts
```

### Step 3: Verify Files Are Present

```bash
# Check that all helper files exist
ls tests/e2e/helpers/account-pool.helper.ts
ls tests/e2e/helpers/test-utilities.helper.ts
```

### Step 4: Run a Single Test to Verify Setup

```bash
# Run just one test file to verify setup works
npx playwright test tests/e2e/01-guest-navigation.spec.ts --headed
```

### Step 5: Run Full Test Suite

```bash
# Run all tests with the new configuration
npm run test:e2e
```

## Expected Results

### Before Fixes
- Pass rate: ~82% (70/88 run, 75 skipped)
- Failures: 13 tests
- Issues: Account lockouts, navigation failures, validation errors

### After Fixes
- Pass rate: >95% (all tests)
- Failures: <10 tests (transient only)
- Issues: Minimal, with proper retry handling

## Troubleshooting

### If Tests Still Fail

1. **Check Backend is Running**
```bash
# In separate terminal
cd C:/Users/Yaseen/OneDrive/Documents/Investments/Taska/backend
npm run dev
```

2. **Check Account Pool Initialization**
```bash
# Look for this in test output:
# "Initializing account pool..."
# "✓ Account pool initialized"
```

3. **Check for Port Conflicts**
```bash
# Windows
netstat -ano | findstr :3001
netstat -ano | findstr :3000

# Kill if needed
taskkill /PID <PID> /F
```

4. **Clear Test Artifacts**
```bash
# Remove old test results
rm -rf test-results
rm -rf playwright-report

# Remove .next cache
rm -rf .next
```

5. **Reinstall Dependencies**
```bash
npm install
npx playwright install
```

## Manual Configuration (If Copy Fails)

### Edit playwright.config.ts Manually

Find these lines:
```typescript
fullyParallel: true,
workers: process.env.CI ? 1 : undefined,
```

Change to:
```typescript
fullyParallel: false,
workers: 1,
```

Find this line:
```typescript
retries: process.env.CI ? 2 : 0,
```

Change to:
```typescript
retries: process.env.CI ? 2 : 1,
```

### Update global-setup.ts

Add this import at the top:
```typescript
import { initializeAccountPool } from '../helpers/account-pool.helper';
```

Add this before the final success message:
```typescript
// Initialize account pool
console.log('\nInitializing account pool...');
try {
  await initializeAccountPool();
  console.log('✓ Account pool initialized');
} catch (error) {
  console.warn('⚠ Account pool initialization failed');
  console.warn('   Tests will create accounts on demand');
}
```

## Verification Checklist

Before running full test suite:

- [ ] Backend is running on port 3000
- [ ] Frontend dev server starts successfully (port 3001)
- [ ] playwright.config.ts has `workers: 1`
- [ ] playwright.config.ts has `fullyParallel: false`
- [ ] playwright.config.ts has `retries: 1`
- [ ] account-pool.helper.ts exists
- [ ] test-utilities.helper.ts exists
- [ ] No old test processes running (check task manager)
- [ ] .next directory is clean (delete if stale)

## Running Specific Test Suites

```bash
# Guest navigation only
npx playwright test 01-guest-navigation

# Authentication only
npx playwright test 02-authentication

# Client journey only
npx playwright test 03-client-journey

# Artisan journey only
npx playwright test 04-artisan-journey

# Admin journey only
npx playwright test 05-admin-journey

# All tests
npm run test:e2e
```

## Debugging Individual Tests

```bash
# Run in debug mode
npx playwright test --debug

# Run in headed mode (see browser)
npx playwright test --headed

# Run in UI mode (interactive)
npm run test:e2e:ui

# Run with verbose logging
DEBUG=pw:api npx playwright test
```

## Common Issues and Solutions

### Issue: Account Pool Not Initializing

**Solution**: Check backend is running and accessible at http://localhost:3000/api/v1/health

```bash
curl http://localhost:3000/api/v1/health
```

### Issue: Tests Timing Out

**Solution**: Increase timeout in playwright.config.ts

```typescript
timeout: 90 * 1000, // 90 seconds instead of 60
```

### Issue: Navigation Tests Still Failing

**Solution**: Check that test files are using new utilities

```typescript
// Old (failing)
await page.click('a:has-text("About")');

// New (working)
await clickAndNavigate(page, 'a:has-text("About")', /\/about/);
```

### Issue: Form Validation Tests Failing

**Solution**: Update test to check for correct validation behavior

```typescript
// Don't expect errors for valid input
const isValid = await emailInput.evaluate(
  (el: HTMLInputElement) => el.validity.valid
);
expect(isValid).toBe(true); // Valid input should pass
```

## Monitoring Test Execution

### Watch Test Progress

```bash
# Run with line reporter for better visibility
npx playwright test --reporter=line
```

### Generate HTML Report

```bash
# After test run
npm run test:e2e:report
```

### Check Account Pool Stats

Add to any test:
```typescript
const { accountPool } = await import('./helpers/account-pool.helper');
const stats = accountPool.getPoolStats();
console.log('Pool:', stats);
```

## Rolling Back Changes

If fixes cause issues:

```bash
# Restore original configuration
cp playwright.config.backup.ts playwright.config.ts

# Keep using helper files (they're safe)
# Just remove account pool usage from tests
```

## Next Steps After Success

1. Monitor test execution for patterns
2. Identify any remaining flaky tests
3. Add more test coverage
4. Set up CI/CD pipeline
5. Enable cross-browser testing (firefox, webkit)
6. Add visual regression tests
7. Implement test performance monitoring

## Support

If issues persist after applying fixes:

1. Check TEST_SUITE_FIXES.md for detailed documentation
2. Review EXAMPLE_FIXED_TEST.spec.ts for proper patterns
3. Check account-pool.helper.ts and test-utilities.helper.ts inline docs
4. Verify backend is running and seeded with data
5. Check browser console for errors (run in headed mode)

## Success Indicators

You'll know fixes are working when:

- ✅ No "account locked" errors
- ✅ Navigation tests pass consistently
- ✅ Form validation tests pass
- ✅ Tests run to completion (not timing out)
- ✅ Pass rate >95%
- ✅ Account pool stats show proper usage
- ✅ No flaky test behavior
- ✅ Retry mechanism handles transient issues
