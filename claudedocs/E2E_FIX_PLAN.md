# E2E Test Fix Plan - Prioritized Execution Strategy

## Investigation Results

### ✅ Backend Status
- **Health**: Operational (all services healthy)
- **Registration Endpoint**: ✅ Working perfectly (tested with curl)
  - Returns: `accessToken`, `refreshToken`, `user` object
  - Response time: ~250ms
  - Database: Healthy

### ✅ Frontend Status
- **Server**: Running on port 3001
- **Job Creation Page**: ✅ EXISTS at `frontend/src/app/client/jobs/create/page.tsx`
- **Environment**: `.env.test` properly configured

### 🔴 Root Cause Identified

**PRIMARY ISSUE**: Frontend registration flow failing in Playwright test environment

The backend works perfectly (proven by curl test), but Playwright tests show registration not completing. This indicates:

1. **Browser/Playwright-specific issue** - Not a backend problem
2. **Possible causes**:
   - Network interception/mocking in tests blocking real API calls
   - CORS headers not being read correctly by Playwright
   - Cookie/localStorage issues in test browser context
   - Timing race condition between API response and redirect
   - Frontend error handling swallowing errors silently

---

## Prioritized Fix Strategy

### 🎯 Phase 1: Critical Blockers (Parallel Execution)

#### Agent 1: Frontend Registration Flow Debug
**Priority**: CRITICAL - Blocks 8 tests
**Estimated**: 2 hours
**Objective**: Fix artisan registration to complete and redirect properly

**Tasks**:
1. Add comprehensive console logging to registration flow
2. Check browser console errors during Playwright test execution
3. Verify API call is actually reaching backend
4. Check if response is being received
5. Debug redirect logic (`window.location.href`)
6. Test cookie/localStorage writing in Playwright context
7. Possible fixes:
   - Add `page.context().grantPermissions(['storage-access'])`
   - Ensure `storageState` is properly configured
   - Wait for network idle before expecting redirect
   - Add explicit wait for cookies to be set

**Files**:
- `frontend/src/components/auth/ArtisanRegisterForm.tsx`
- `frontend/src/components/providers/auth-provider.tsx`
- `frontend/tests/e2e/helpers/user-management.helper.ts`
- `frontend/playwright.config.ts`

---

#### Agent 2: Client Dashboard UI Selectors
**Priority**: HIGH - Blocks 3 tests
**Estimated**: 1 hour
**Objective**: Fix selector mismatches for dashboard elements

**Tasks**:
1. Run test in headed mode to inspect DOM
2. Compare test selectors vs actual rendered elements
3. Update selectors or add `data-testid` attributes
4. Ensure "Post a New Job" button has consistent selector:
   - Current test: `button:has-text("Post"), a:has-text("Post a Job")`
   - Actual button: Check `data-testid="post-job-button"` exists
5. Verify profile navigation selector

**Files**:
- `frontend/src/app/client/dashboard/page.tsx`
- `frontend/tests/e2e/03-client-journey.spec.ts`

---

#### Agent 3: Client Job Creation Flow
**Priority**: HIGH - Blocks 6 tests
**Estimated**: 1.5 hours
**Objective**: Ensure job creation page accessible and form functional

**Tasks**:
1. Verify route configuration for `/client/jobs/create`
2. Check middleware not blocking access
3. Test page load manually in browser
4. Verify form elements render correctly
5. Check form validation and submission
6. Update test selectors if needed
7. Verify "Post a Job" button navigation

**Files**:
- `frontend/src/app/client/jobs/create/page.tsx`
- `frontend/src/app/client/dashboard/page.tsx:256-265`
- `frontend/tests/e2e/03-client-journey.spec.ts:80-145`
- `frontend/src/middleware.ts` (if exists)

---

#### Agent 4: Artisan Dashboard Issues
**Priority**: HIGH - Blocks 4 tests
**Estimated**: 1 hour
**Objective**: Fix artisan dashboard rendering and navigation

**Tasks**:
1. Similar to Agent 2 for artisan dashboard
2. Verify statistics display correctly
3. Check "Browse Jobs" navigation button
4. Fix jobs listing page navigation
5. Update test selectors

**Files**:
- `frontend/src/app/artisan/dashboard/page.tsx`
- `frontend/tests/e2e/04-artisan-journey.spec.ts:17-75`

---

#### Agent 5: Navigation & Miscellaneous
**Priority**: MEDIUM - Blocks 5 tests
**Estimated**: 1.5 hours
**Objective**: Fix remaining navigation and minor issues

**Tasks**:
1. Fix auth redirect test (Test 24)
2. Fix job urgency indicator display (Test 76)
3. Fix artisan bids page navigation (Test 82)
4. Fix artisan projects page navigation (Test 85)
5. Investigate each individually

**Files**:
- Various component and test files
- Check routing configuration

---

## Execution Plan

### Option A: Parallel Swarm (RECOMMENDED)

Launch 5 agents simultaneously to work on independent issues:

```bash
/sc:spawn "Fix E2E test failures" \
  --strategy adaptive \
  --depth deep \
  --agents 5 \
  --coordination sequential-reporting
```

**Agent Assignment**:
1. Frontend Registration Flow
2. Client Dashboard UI
3. Client Job Creation
4. Artisan Dashboard
5. Navigation/Misc

**Estimated Total Time**: 3-4 hours (parallelized)
**Advantages**:
- Fast resolution
- Independent workstreams
- Efficient use of agent specialization

**Coordination**:
- Each agent reports completion
- Sequential verification after all agents complete
- Integration testing before final validation

---

### Option B: Sequential Fix (ALTERNATIVE)

Fix issues one at a time, verify each before moving to next:

1. Registration flow (2h)
2. Client dashboard (1h)
3. Job creation (1.5h)
4. Artisan dashboard (1h)
5. Navigation (1.5h)

**Estimated Total Time**: 7-8 hours
**Advantages**:
- Lower risk
- Clear progress tracking
- Easier debugging if issues arise

---

## Verification Strategy

### After Each Fix:
```bash
# Run specific test file
npx playwright test tests/e2e/[test-file].spec.ts

# Run with debug for issues
npx playwright test --debug [test-file]

# Generate report
npx playwright show-report
```

### Final Validation:
```bash
# Run ALL 225 tests
npm run test:e2e

# Expected outcome: 225 passing tests
```

---

## Implementation Details

### Key Investigation Points:

1. **Playwright Context Configuration**:
   ```typescript
   // Check playwright.config.ts
   use: {
     storageState: 'path/to/state.json', // If using
     permissions: ['storage-access'],
     bypassCSP: true, // If needed
   }
   ```

2. **CORS Headers** (backend/src/main.ts):
   ```typescript
   app.enableCors({
     origin: ['http://localhost:3001'],
     credentials: true,
     // Ensure proper headers
   });
   ```

3. **Test Helper Waits**:
   ```typescript
   // Current: 30s timeout
   await page.waitForURL(/\/dashboard/, { timeout: 30000 });

   // May need:
   await page.waitForLoadState('networkidle');
   await page.context().storageState(); // Force storage flush
   ```

4. **Registration Response Handling**:
   ```typescript
   // Verify response is received
   console.log('[AuthProvider] Response:', response.status);
   console.log('[AuthProvider] Data:', await response.json());
   ```

---

## Success Criteria

- [ ] All 8 artisan registration tests pass
- [ ] All 6 client job creation tests pass
- [ ] All 3 client dashboard tests pass
- [ ] All 4 artisan dashboard tests pass
- [ ] All 5 navigation/misc tests pass
- [ ] **Total: 225/225 tests passing**
- [ ] Test suite completes in <30 minutes
- [ ] No flaky tests (3 consecutive full passes)

---

## Risk Mitigation

### If Registration Fix Takes Too Long:
- Use API-based user creation instead of UI registration
- Update `user-management.helper.ts` to call backend API directly
- Only test UI registration in dedicated registration tests

### If Selector Issues Persist:
- Add comprehensive `data-testid` attributes to all interactive elements
- Update test selectors to use test IDs exclusively
- Create selector mapping documentation

### If Network Issues:
- Configure Playwright to wait for network idle
- Add explicit API request/response waiters
- Consider test environment network setup

---

## Next Action

**Ready to execute**: Choose execution strategy and begin fixes

**Recommended**: Launch parallel swarm for fastest resolution

```bash
# Command to execute
/sc:spawn "Fix all E2E test failures based on E2E_FIX_PLAN.md" \
  --agents 5 \
  --strategy adaptive \
  --coordination sequential-reporting
```
