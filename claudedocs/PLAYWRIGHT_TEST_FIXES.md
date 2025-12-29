# Playwright Test Failures - Root Cause Analysis and Fixes

## Executive Summary
**Issue**: 13 out of 158 Playwright tests failing (91.8% pass rate)
**Root Cause**: Race condition between cookie setting and navigation in authentication flow
**Impact**: All authentication journey tests timing out after login/registration
**Status**: Root cause identified, fixes ready to implement

---

## Test Failure Analysis

### Failing Tests
All 13 failures are in authentication flows:
- `04-artisan-journey-complete.spec.ts` - Complete artisan registration and login flows (7 tests)
- Protected route tests being skipped for client/artisan/admin dashboards (multiple files)

### Error Pattern
```
TimeoutError: page.waitForURL: Timeout 30000ms exceeded.
waiting for navigation until "load"
```

Tests consistently timeout at:
- `frontend/tests/e2e/helpers/user-management.helper.ts:68` - After registration form submit
- `frontend/tests/e2e/helpers/user-management.helper.ts:130` - After login form submit

---

## Root Cause Deep Dive

### The Race Condition

**Current Flow**:
1. User submits login/registration form
2. API returns access tokens
3. Auth provider stores tokens:
   - `localStorage.setItem('accessToken', ...)`
   - `document.cookie = 'accessToken=...'`  (synchronous but may not flush immediately)
4. Auth provider calls `router.push('/artisan/dashboard')` immediately
5. Next.js App Router initiates client-side navigation
6. Middleware intercepts navigation and reads cookies
7. **PROBLEM**: Cookies may not be readable yet, causing middleware to redirect to login
8. **RESULT**: Navigation never completes to dashboard, test times out

**Evidence from Code**:

`frontend/src/components/providers/auth-provider.tsx`:
```typescript
// Line 143-144 (login) and 244-245 (register)
document.cookie = `accessToken=${data.accessToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
document.cookie = `refreshToken=${data.refreshToken}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;

// Line 169 (login) and 270 (register)
await new Promise(resolve => setTimeout(resolve, 0)); // Not enough time!

// Line 182 (login) and 283 (register)
router.push(redirectPath); // Immediate navigation before cookies settle
```

**Why This Fails**:
- `document.cookie` is synchronous to JavaScript but asynchronous to browser internals
- `router.push()` uses Next.js App Router which is client-side and fast
- Middleware runs before route renders, reading cookies from request
- Timing: Cookie write → Router navigation → Middleware read → Cookie not available yet!

---

## Required Fixes

### Fix 1: Auth Provider - Use window.location for Hard Navigation

**File**: `frontend/src/components/providers/auth-provider.tsx`

**Lines to Change**: 164-182 (login function) and 265-283 (register function)

**Current Code**:
```typescript
setUser(userData);
setLoading(false);

await new Promise(resolve => setTimeout(resolve, 0));

let redirectPath = '/client/dashboard';
if (userData?.role === 'ARTISAN') {
  redirectPath = '/artisan/dashboard';
} else if (userData?.role === 'ADMIN') {
  redirectPath = '/admin/dashboard';
}

console.log('[AuthProvider] Login successful, redirecting to:', redirectPath);

router.push(redirectPath);
```

**Fixed Code**:
```typescript
setUser(userData);
setLoading(false);

let redirectPath = '/client/dashboard';
if (userData?.role === 'ARTISAN') {
  redirectPath = '/artisan/dashboard';
} else if (userData?.role === 'ADMIN') {
  redirectPath = '/admin/dashboard';
}

console.log('[AuthProvider] Login successful, redirecting to:', redirectPath);

// Wait for cookies to be fully written and state to settle
await new Promise(resolve => setTimeout(resolve, 150));

// Use window.location for immediate, reliable full-page redirect
// This ensures:
// 1. Cookies are fully written before navigation starts
// 2. Full page reload allows middleware to read fresh cookies
// 3. No client-side router race conditions
window.location.href = redirectPath;
```

**Why This Works**:
- `window.location.href` triggers full page navigation (not client-side)
- 150ms delay ensures cookies are written to browser storage
- Middleware reads cookies from fresh request with no race condition
- More reliable than `router.push()` for post-authentication navigation

**Apply to Both Functions**:
- `login()` function around line 164-182
- `register()` function around line 265-283

### Fix 2: Test Helpers - Better Wait Conditions

**File**: `frontend/tests/e2e/helpers/user-management.helper.ts`

**Current Issue**: Tests only wait for URL change, not dashboard content to load

**Lines to Improve**: 66-84 (createUser) and 128-134 (loginWithUser)

**Current Code**:
```typescript
await page.waitForURL(/\/(client|artisan|admin)\/dashboard/, { timeout: 30000 });
await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
```

**Improved Code**:
```typescript
// Wait for URL to change
await page.waitForURL(/\/(client|artisan|admin)\/dashboard/, { timeout: 30000 });

// Wait for dashboard content to actually render
await page.waitForSelector('[data-testid="dashboard-content"], h1, main', {
  state: 'visible',
  timeout: 10000
}).catch(() => {
  console.warn('Dashboard content selector not found, continuing anyway');
});

// Wait for network to settle
await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

// Additional wait for any client-side hydration
await page.waitForTimeout(500);
```

**Why This Works**:
- Multiple layers of wait conditions
- Waits for actual dashboard DOM content, not just URL
- Handles cases where dashboard is slow to render
- More forgiving with fallbacks

### Fix 3: Add Dashboard Test IDs (Optional Enhancement)

**Files**: Dashboard page components
- `frontend/src/app/client/dashboard/page.tsx`
- `frontend/src/app/artisan/dashboard/page.tsx`
- `frontend/src/app/admin/dashboard/page.tsx`

**Add Marker**:
```tsx
<div data-testid="dashboard-content" className="...">
  {/* Dashboard content */}
</div>
```

This gives tests a reliable selector to wait for.

---

## Implementation Priority

### HIGH PRIORITY (Must Fix):
1. ✅ **Auth Provider window.location.href** - Fixes race condition
2. ✅ **Test Helper Wait Improvements** - Makes tests more robust

### MEDIUM PRIORITY (Should Fix):
3. **Add Dashboard Test IDs** - Improves test reliability

### LOW PRIORITY (Nice to Have):
4. Increase test timeout from 30s to 45s as safety margin
5. Add retry logic to test helpers for transient failures

---

## Testing Validation

After implementing fixes, run:

```bash
# Test specific failing suite
cd frontend
npx playwright test tests/e2e/04-artisan-journey-complete.spec.ts --workers=1

# Test all authentication flows
npx playwright test tests/e2e/02-authentication.spec.ts --workers=1

# Full test suite
npx playwright test --workers=6
```

**Expected Results**:
- All 13 previously failing tests should pass
- Total pass rate should be 100% (158/158)
- No timeout errors on authentication flows

---

## Additional Findings

### Console Errors
Test output shows:
```
Console errors found: ['The script resource is behind a redirect, which is disallowed.']
```

This is a minor warning about script loading and doesn't affect functionality, but could be investigated separately.

### Protected Route Tests Skipped
Many tests marked with `-` (skipped) in output. These aren't failing, they're being skipped by test logic. Review test file to understand why.

---

## Prevention Strategy

### For Future Development:

1. **Use Hard Navigation for Auth**: Always use `window.location.href` after authentication events
2. **Test with E2E Early**: Run Playwright tests during feature development, not just at end
3. **Add Test Markers**: Use `data-testid` attributes for reliable test selectors
4. **Monitor Cookie Timing**: Be aware of cookie write/read timing in middleware scenarios
5. **Robust Wait Conditions**: Never rely on just URL change - always wait for content

### Code Review Checklist:
- [ ] Auth flows use `window.location.href` not `router.push()`
- [ ] Sufficient delay between cookie write and navigation (>100ms)
- [ ] Test helpers wait for DOM content, not just URL
- [ ] Dashboard pages have test ID markers
- [ ] E2E tests pass before merging

---

## Summary

**Root Cause**: Cookie/navigation race condition in auth provider
**Impact**: 13 test failures, 91.8% → target 100% pass rate
**Solution**: Use `window.location.href` + better test wait conditions
**Effort**: ~30 minutes to implement and validate
**Risk**: Low - changes are isolated to auth flow and test helpers

**Next Steps**:
1. Apply Fix 1 to `auth-provider.tsx` (2 locations)
2. Apply Fix 2 to `user-management.helper.ts` (2 locations)
3. Run full Playwright test suite
4. Verify 100% pass rate
5. Commit fixes with clear documentation
