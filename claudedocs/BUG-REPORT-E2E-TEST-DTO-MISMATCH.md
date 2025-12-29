# BUG REPORT: E2E Test Data Schema Mismatch

## Summary
All E2E tests creating jobs are failing with 400 Bad Request because test data doesn't match the CreateJobDto validation schema.

## Severity
**CRITICAL** - Blocks all backend E2E tests (41 failures)

## Component
Backend API - Jobs Module + Test Infrastructure

## Affected Files
- `backend/test/user-journeys.e2e-spec.ts` - 11 instances
- `backend/test/api-integration.e2e-spec.ts` - 4 instances

## Root Cause
The CreateJobDto was updated but test fixtures weren't updated to match.

### Schema Mismatch

**Test Data Sends (OLD SCHEMA)**:
```typescript
{
  budgetMin: 500,
  budgetMax: 1000,
  urgencyLevel: 'MEDIUM',  // Wrong field name
  preferredDate: '...',     // Wrong field name
  // Missing required fields
}
```

**DTO Expects (CURRENT SCHEMA)**:
```typescript
{
  budget: number,           // Single value, not min/max
  budgetType: BudgetType,   // FIXED | NEGOTIABLE
  urgency: UrgencyLevel,    // Not "urgencyLevel"
  startDate?: string,       // Not "preferredDate"
  isDraft?: boolean,        // Default true
}
```

## Instances to Fix

### user-journeys.e2e-spec.ts
1. Line 15-16: `budgetMin/budgetMax` → `budget: 750, budgetType: 'FIXED'`
2. Line 17: `urgencyLevel` → `urgency`
3. Line 18: `preferredDate` → `startDate`
4. Add: `isDraft: false` (to publish job immediately)

**Pattern to Replace** (11 times in user-journeys.e2e-spec.ts):
```
budgetMin: X,
budgetMax: Y,
urgencyLevel: 'Z',
preferredDate: ...
```

**Replace With**:
```
budget: <average of X and Y>,
budgetType: 'FIXED',
urgency: 'Z',  // Remove "Level" suffix
startDate: ..., // Rename from preferredDate
isDraft: false,
```

**Line Numbers**:
- Lines 15-18 ✅ FIXED
- Lines 157-160 ✅ FIXED
- Lines 296-299 (Admin journey)
- Lines 407-410 (Bid expiry test)
- Lines 464-467 (Duplicate bid test)
- Lines 526-529 (Messaging test)

### api-integration.e2e-spec.ts
**Line Numbers**:
- Lines 115-118 (RBAC client job)
- Lines 145-148 (RBAC artisan attempt)
- Lines 246-249 (Bid lifecycle job)
- Lines 392-395 (Message lifecycle job)

## Fix Strategy

### Option 1: Manual Edit (Current Approach)
Fix each instance individually - SLOW but precise

### Option 2: Regex Find-Replace (RECOMMENDED)
1. Find all `budgetMin: (\d+),\s*budgetMax: (\d+),`
2. Calculate average
3. Replace with `budget: <average>, budgetType: 'FIXED',`

4. Find `urgencyLevel:`
5. Replace with `urgency:`

6. Find `preferredDate:`
7. Replace with `startDate:`

8. Add `isDraft: false,` after requirements array

### Option 3: Create Helper Function
```typescript
// In setup-e2e.ts
export function createJobData(overrides: Partial<CreateJobDto>) {
  return {
    title: 'Test Job',
    description: 'Test job description for E2E testing purposes',
    categoryId: '1',
    budget: 750,
    budgetType: 'FIXED',
    urgency: 'MEDIUM',
    addressLine1: '123 Test Street',
    city: 'Cape Town',
    province: 'Western Cape',
    postalCode: '8001',
    latitude: -33.9249,
    longitude: 18.4241,
    isDraft: false,
    ...overrides,
  };
}
```

## Testing Validation
After fixes, run:
```bash
npm run test:e2e
```

Expected: Job creation tests should return 201 Created instead of 400 Bad Request

## Additional Issues Found

### Issue #2: Messages Repository Error
**Location**: `backend/src/modules/messages/messages.repository.ts:225`
**Error**: `this.prisma.message.count()` receiving full User object instead of userId string
**Fix**: Update messages.repository.ts to use `userId` instead of passing full user object

### Issue #3: Admin Endpoints 404
**Symptom**: `GET /api/v1/admin/jobs` returns 404
**Hypothesis**: Admin routes not properly registered or missing route prefix
**Investigation needed**: Check admin.controller.ts route decorators

## Priority
1. ✅ Fix test DTO mismatches (this file) - IN PROGRESS
2. Fix messages repository Prisma query
3. Fix admin routing issues

## Completion Criteria
- All 15 job data fixtures updated to match CreateJobDto
- E2E tests: job creation returns 201 Created
- Test pass rate improves from 0% to >70%
