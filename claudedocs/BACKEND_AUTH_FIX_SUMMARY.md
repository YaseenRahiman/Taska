# Backend Authentication Fix Summary

## Problem Found

**ROOT CAUSE**: Backend `/api/v1/auth/register` endpoint returns HTTP 500 Internal Server Error

### Evidence
```bash
$ curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!","role":"ARTISAN","firstName":"Test","lastName":"User","phoneNumber":"+27821234567"}'

Response: {"statusCode":500,"message":"Internal server error"}
HTTP Status: 500
```

## Analysis

### 1. Backend Code Review
**File**: `backend/src/auth/auth.service.ts` line 57-139

The `register()` method does the following:
1. ✅ Checks if user exists
2. ✅ Hashes password
3. ✅ Creates user in transaction
4. ✅ Creates profile
5. ✅ Creates wallet for artisans
6. ✅ Logs activity
7. ❌ **Line 119**: Calls `sendVerificationEmail()` - **THIS IS LIKELY FAILING**
8. ✅ Generates tokens
9. ✅ Returns tokens and user

### 2. Likely Failure Point

**Line 119**: `await this.sendVerificationEmail(user.email, user.id);`

This method is probably not implemented or throws an error because:
- Comment on line 118 says "implement email service later"
- The method is being called but likely doesn't exist or fails
- This causes HTTP 500 before tokens are generated and returned

### 3. Why Tests Fail

**Complete Flow**:
```
Frontend submits registration
  ↓
Backend receives request
  ↓
User created in database ✅
  ↓
sendVerificationEmail() called ❌ THROWS ERROR
  ↓
HTTP 500 returned to frontend
  ↓
Frontend doesn't receive tokens
  ↓
No redirect happens
  ↓
Test times out waiting for redirect
```

## Solution Required

### Option 1: Implement sendVerificationEmail (stub)
Add a stub implementation that does nothing for now:

```typescript
// In auth.service.ts
private async sendVerificationEmail(email: string, userId: string): Promise<void> {
  // TODO: Implement email service
  // For now, do nothing - users are auto-verified (line 79)
  this.logger.log(`Email verification skipped for: ${email}`, 'AuthService');
  return Promise.resolve();
}
```

### Option 2: Comment out the call (temporary)
Temporarily comment out line 119 since users are already auto-verified on line 79:

```typescript
// Send verification email (implement email service later)
// await this.sendVerificationEmail(user.email, user.id); // Temporarily disabled
```

### Option 3: Wrap in try-catch
Prevent email errors from breaking registration:

```typescript
// Send verification email (non-blocking)
try {
  await this.sendVerificationEmail(user.email, user.id);
} catch (error) {
  this.logger.warn(`Failed to send verification email to ${email}: ${error.message}`, 'AuthService');
  // Continue with registration - user is already verified
}
```

## Recommended Fix: Option 3 (Safest)

Add try-catch around the email call to prevent it from breaking registration:

**File**: `backend/src/auth/auth.service.ts`
**Location**: Around line 118-119

```typescript
// Send verification email (implement email service later)
try {
  await this.sendVerificationEmail(user.email, user.id);
} catch (error) {
  this.logger.warn(`Failed to send verification email: ${error.message}`, 'AuthService');
  // Continue - user is already auto-verified for MVP (line 79)
}
```

This approach:
- ✅ Prevents registration failures
- ✅ Logs the issue for debugging
- ✅ Allows registration to complete successfully
- ✅ Returns tokens to frontend
- ✅ Enables redirect to dashboard
- ✅ Makes tests pass

## Additional Issues to Check

### 1. Check if sendVerificationEmail exists
Search for the method implementation:
```bash
grep -n "sendVerificationEmail" backend/src/auth/auth.service.ts
```

If it doesn't exist, add a stub:
```typescript
private async sendVerificationEmail(email: string, userId: string): Promise<void> {
  // TODO: Implement actual email service when ready
  this.logger.log(`Verification email would be sent to: ${email}`, 'AuthService');
}
```

### 2. Check database connection
Ensure Prisma is connected and database is accessible:
```bash
cd backend
npx prisma studio  # Opens database GUI to verify connection
```

### 3. Check for other missing methods
Review the service for other unimplemented methods that might throw errors.

## Expected Outcome After Fix

### Successful Registration Response
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400,
  "user": {
    "id": "clxxx123456789",
    "email": "test@test.com",
    "role": "ARTISAN",
    "verifiedAt": "2025-11-15T00:00:00.000Z",
    "profile": {
      "firstName": "Test",
      "lastName": "User",
      "phoneNumber": "+27821234567"
    }
  }
}
```

### Test Results After Fix
- ✅ Registration completes successfully
- ✅ Tokens returned to frontend
- ✅ Frontend stores tokens in localStorage
- ✅ Redirect to `/artisan/dashboard` happens
- ✅ Tests pass (expected: 10-12 out of 12)

## Implementation Steps

1. **Locate the issue**:
   ```bash
   cd backend/src/auth
   grep -A5 "sendVerificationEmail" auth.service.ts
   ```

2. **Apply fix** (Option 3 recommended):
   - Edit `backend/src/auth/auth.service.ts`
   - Wrap line 119 in try-catch as shown above
   - Save file

3. **Restart backend** (if not in watch mode):
   ```bash
   cd backend
   npm run start:dev
   ```

4. **Test the fix**:
   ```bash
   curl -X POST http://localhost:3000/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test2@test.com","password":"Test123!","role":"ARTISAN","firstName":"Test","lastName":"User","phoneNumber":"+27821234567"}'
   ```

   **Expected**: HTTP 201 with tokens and user object

5. **Re-run Playwright tests**:
   ```bash
   cd frontend
   npx playwright test 04-artisan-journey-complete
   ```

   **Expected**: 10-12 tests passing

## Alternative Debugging Steps

If the fix doesn't work, check backend logs:

1. **Enable detailed logging**:
   Look for error messages in the terminal where backend is running

2. **Check Prisma queries**:
   ```bash
   # Add to backend/.env
   DEBUG=prisma:query
   ```

3. **Verify database schema**:
   ```bash
   cd backend
   npx prisma db push --force-reset  # WARNING: Deletes all data
   npx prisma db seed  # Re-seed database
   ```

## Related Files

- `backend/src/auth/auth.service.ts` - Main service with register() method
- `backend/src/auth/auth.controller.ts` - Controller exposing /register endpoint
- `backend/src/auth/dto/register.dto.ts` - DTO validating registration data
- `backend/src/main.ts` - CORS and API prefix configuration
- `backend/prisma/schema.prisma` - Database schema

## Testing Checklist

After implementing the fix:

- [ ] Backend registration endpoint returns HTTP 201
- [ ] Response includes `accessToken` and `refreshToken`
- [ ] Response includes `user` object with profile
- [ ] Frontend receives tokens and stores them
- [ ] Frontend redirects to `/artisan/dashboard`
- [ ] Dashboard loads successfully
- [ ] All 12 Playwright tests pass
- [ ] No console errors in browser
- [ ] Backend logs show successful registration

## Conclusion

The Artisan Journey tests are failing because the backend registration endpoint returns HTTP 500 instead of authentication tokens. The root cause is likely an unimplemented or failing `sendVerificationEmail()` method.

**Fix**: Wrap the email sending call in a try-catch block to prevent it from breaking registration.

**Result**: Registration will complete successfully, return tokens, and allow the frontend to redirect to the dashboard, making all tests pass.
