# Quick Fix Guide - Playwright Test Failures

## Summary
- **Tests Failing**: 13 out of 158 (all authentication-related)
- **Root Cause**: Race condition between cookie setting and navigation
- **Fix Time**: ~5 minutes
- **Impact**: Should bring tests to 100% pass rate

## The Problem
When users log in or register:
1. Tokens are stored in cookies using `document.cookie`
2. Navigation happens immediately with `router.push()`
3. Middleware tries to read cookies
4. **RACE CONDITION**: Cookies aren't readable yet → redirect fails → test times out

## The Solution

### Fix 1: Auth Provider (2 changes needed)

**File**: `frontend/src/components/providers/auth-provider.tsx`

**Change #1 - Login function (around line 164-182)**

FIND:
```typescript
      setUser(userData);
      setLoading(false);

      // Wait for React state to flush before navigation
      await new Promise(resolve => setTimeout(resolve, 0));

      // Determine redirect path based on role
      let redirectPath = '/client/dashboard';
      if (userData?.role === 'ARTISAN') {
        redirectPath = '/artisan/dashboard';
      } else if (userData?.role === 'ADMIN') {
        redirectPath = '/admin/dashboard';
      }

      console.log('[AuthProvider] Login successful, redirecting to:', redirectPath);

      // Perform redirect after state is settled
      router.push(redirectPath);
```

REPLACE WITH:
```typescript
      setUser(userData);
      setLoading(false);

      // Determine redirect path based on role
      let redirectPath = '/client/dashboard';
      if (userData?.role === 'ARTISAN') {
        redirectPath = '/artisan/dashboard';
      } else if (userData?.role === 'ADMIN') {
        redirectPath = '/admin/dashboard';
      }

      console.log('[AuthProvider] Login successful, redirecting to:', redirectPath);

      // Wait for cookies to be fully written
      await new Promise(resolve => setTimeout(resolve, 150));

      // Use window.location for reliable redirect
      window.location.href = redirectPath;
```

**Change #2 - Register function (around line 265-283)**

FIND:
```typescript
        setUser(userData);
        setLoading(false);

        // Wait for React state to flush before navigation
        await new Promise(resolve => setTimeout(resolve, 0));

        // Determine redirect path based on role (auto-login after registration)
        let redirectPath = '/client/dashboard';
        if (userData?.role === 'ARTISAN') {
          redirectPath = '/artisan/dashboard';
        } else if (userData?.role === 'ADMIN') {
          redirectPath = '/admin/dashboard';
        }

        console.log('[AuthProvider] Registration successful, redirecting to:', redirectPath);

        // Perform redirect after state is settled
        router.push(redirectPath);
```

REPLACE WITH:
```typescript
        setUser(userData);
        setLoading(false);

        // Determine redirect path based on role (auto-login after registration)
        let redirectPath = '/client/dashboard';
        if (userData?.role === 'ARTISAN') {
          redirectPath = '/artisan/dashboard';
        } else if (userData?.role === 'ADMIN') {
          redirectPath = '/admin/dashboard';
        }

        console.log('[AuthProvider] Registration successful, redirecting to:', redirectPath);

        // Wait for cookies to be fully written
        await new Promise(resolve => setTimeout(resolve, 150));

        // Use window.location for reliable redirect
        window.location.href = redirectPath;
```

### Fix 2: Test Helpers (2 changes needed)

**File**: `frontend/tests/e2e/helpers/user-management.helper.ts`

**Change #1 - createUser function (around line 66-84)**

FIND:
```typescript
    // Increase timeout to 30 seconds for registration
    await page.waitForURL(/\/(client|artisan|admin)\/dashboard|auth\/login/, { timeout: 30000 });

    // If redirected to login, log in with the new credentials
```

ADD AFTER waitForURL:
```typescript
    await page.waitForURL(/\/(client|artisan|admin)\/dashboard|auth\/login/, { timeout: 30000 });

    // Wait for dashboard content to render
    await page.waitForSelector('h1, main, [role="main"]', {
      state: 'visible',
      timeout: 10000
    }).catch(() => console.warn('Dashboard content not found'));

    // If redirected to login, log in with the new credentials
```

**Change #2 - loginWithUser function (around line 128-134)**

FIND:
```typescript
  try {
    await page.waitForURL(/\/(client|artisan|admin)\/dashboard/, { timeout: 30000 });

    // Wait for dashboard to fully load
```

ADD AFTER waitForURL:
```typescript
  try {
    await page.waitForURL(/\/(client|artisan|admin)\/dashboard/, { timeout: 30000 });

    // Wait for dashboard content to render
    await page.waitForSelector('h1, main, [role="main"]', {
      state: 'visible',
      timeout: 10000
    }).catch(() => console.warn('Dashboard content not found'));

    // Wait for dashboard to fully load
```

## Test the Fixes

```bash
cd frontend

# Run the failing test suite
npx playwright test tests/e2e/04-artisan-journey-complete.spec.ts

# Run all tests
npx playwright test

# Expected: All 158 tests pass
```

## Why These Fixes Work

1. **window.location.href** instead of `router.push()`:
   - Forces full page reload
   - Ensures cookies are readable by middleware
   - No client-side router timing issues

2. **150ms delay**: Gives cookies time to write to browser storage

3. **Better test waits**: Wait for actual DOM content, not just URL change

## Rollback if Needed

If something goes wrong, the original code patterns are:
- Auth: `router.push(redirectPath)`
- Tests: Just `await page.waitForURL(...)`

## Additional Resources

See `claudedocs/PLAYWRIGHT_TEST_FIXES.md` for full analysis and technical details.
