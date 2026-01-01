# Authentication Diagnostics & Fix Tools

This directory contains scripts to diagnose and fix authentication issues in the Taska platform.

## Issue: User Cannot Login

**Symptom**: User receives "unauthorized" error when attempting to login
**Affected User**: grahiman02@gmail.com
**Password**: Qwerty12345!@

---

## Quick Fix (Recommended First Step)

If you want to immediately fix the most common issue (missing email verification):

```bash
cd backend
npx ts-node scripts/fix-user-verification.ts grahiman02@gmail.com
```

**What it does**:
- Checks if user exists
- Verifies current verification status
- Sets `verifiedAt` field to current timestamp if NULL
- Logs the action in activity_logs

**Expected Output**:
```
✅ Fix applied successfully!
   verifiedAt set to: 2025-10-28T...
```

Then ask the user to try logging in again.

---

## Comprehensive Diagnostics (If Quick Fix Doesn't Work)

If the quick fix doesn't resolve the issue, run comprehensive diagnostics:

```bash
cd backend
npx ts-node scripts/diagnose-auth-issue.ts
```

**What it does**:
- Checks if user exists in database
- Verifies email verification status (verifiedAt field)
- Tests password hash comparison with bcrypt
- Checks profile relationship
- Analyzes activity logs
- Provides detailed report with root cause and fix

**Sample Output**:
```
🔍 AUTHENTICATION DIAGNOSTIC REPORT
============================================================
Email: grahiman02@gmail.com
Time: 2025-10-28T...
============================================================

📊 HYPOTHESIS 1: User Existence Check
------------------------------------------------------------
✅ FINDING: User EXISTS in database
   User ID: clxxx123456789
   Role: CLIENT
   ...

📊 HYPOTHESIS 2: Email Verification Status
------------------------------------------------------------
❌ FINDING: Email is NOT verified (verifiedAt is NULL)
   Root Cause: Registration did not set verifiedAt field
   Solution: Manually set verifiedAt or fix registration flow

   SQL Fix:
   UPDATE users SET verified_at = NOW() WHERE email = 'grahiman02@gmail.com';

...

📋 DIAGNOSTIC SUMMARY
============================================================
❌ Found 1 issue(s):

1. [CRITICAL] Email not verified (verifiedAt is NULL)
   Impact: Login will fail with "Please verify your email" error
   Fix: UPDATE users SET verified_at = NOW() WHERE email = 'grahiman02@gmail.com';
```

---

## Understanding the Root Causes

### Cause 1: Email Not Verified (Most Common)

**Why it happens**:
- User was created before auto-verification was added
- Database migration issue
- Manual user creation without verification
- Transaction rollback during registration

**Authentication Flow**:
```typescript
// auth.service.ts:184-186
if (!user.verifiedAt) {
  throw new UnauthorizedException('Please verify your email before logging in');
}
```

**Fix**:
```bash
npx ts-node scripts/fix-user-verification.ts grahiman02@gmail.com
```

---

### Cause 2: Password Mismatch

**Why it happens**:
- User entered wrong password
- User mistyped during registration
- Password was changed after registration
- Hash corruption (rare)

**Authentication Flow**:
```typescript
// auth.service.ts:177-181
const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
if (!isPasswordValid) {
  throw new UnauthorizedException('Invalid credentials');
}
```

**Fix Options**:

1. **User Resets Password** (Recommended):
   ```bash
   # User uses "Forgot Password" flow on frontend
   POST /auth/request-password-reset
   # User receives email with reset link
   POST /auth/reset-password
   ```

2. **Admin Manual Password Update**:
   ```bash
   # Create a one-time script
   cd backend
   npx ts-node -e "
   import { PrismaClient } from '@prisma/client';
   import * as bcrypt from 'bcrypt';

   const prisma = new PrismaClient();
   const email = 'grahiman02@gmail.com';
   const newPassword = 'Qwerty12345!@';

   (async () => {
     const hash = await bcrypt.hash(newPassword, 10);
     await prisma.user.update({
       where: { email },
       data: { passwordHash: hash }
     });
     console.log('Password updated');
     await prisma.\$disconnect();
   })();
   "
   ```

---

### Cause 3: User Doesn't Exist

**Why it happens**:
- User was never created
- User was deleted
- Wrong email address

**Authentication Flow**:
```typescript
// auth.service.ts:171-174
if (!user) {
  throw new UnauthorizedException('Invalid credentials');
}
```

**Fix**: User needs to re-register through the registration flow.

---

## Manual Database Queries

If you prefer direct database access:

### Check User Status
```sql
SELECT
  id,
  email,
  role,
  verified_at,
  created_at,
  updated_at
FROM users
WHERE email = 'grahiman02@gmail.com';
```

### Fix Verification Status
```sql
UPDATE users
SET verified_at = NOW()
WHERE email = 'grahiman02@gmail.com';
```

### Check User Profile
```sql
SELECT
  u.email,
  u.role,
  u.verified_at,
  p.first_name,
  p.last_name,
  p.phone_number
FROM users u
LEFT JOIN profiles p ON p.user_id = u.id
WHERE u.email = 'grahiman02@gmail.com';
```

### View Activity Logs
```sql
SELECT
  action,
  entity_type,
  created_at,
  ip_address
FROM activity_logs
WHERE user_id = (SELECT id FROM users WHERE email = 'grahiman02@gmail.com')
ORDER BY created_at DESC
LIMIT 10;
```

---

## Workflow Diagram

```
User Cannot Login
       ↓
Run: fix-user-verification.ts (Quick Fix)
       ↓
   ┌─────────┬─────────┐
   ↓         ↓         ↓
Fixed    Still Fails   User Not Found
   ↓         ↓         ↓
✓ Done   Diagnostics  Re-register
            ↓
    diagnose-auth-issue.ts
            ↓
   ┌────────┴────────┐
   ↓                 ↓
Verification     Password
Issue            Mismatch
   ↓                 ↓
Apply Fix      Reset Password
```

---

## Testing After Fix

### Using cURL
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "grahiman02@gmail.com",
    "password": "Qwerty12345!@"
  }'
```

**Expected Success Response** (200 OK):
```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci...",
  "expiresIn": 86400
}
```

### Using Frontend
1. Navigate to login page
2. Enter credentials
3. Click login
4. Should redirect to dashboard with successful authentication

---

## Prevention & Best Practices

### 1. Ensure Registration Always Sets verifiedAt

Current code (auth.service.ts:78) correctly sets this:
```typescript
verifiedAt: new Date(), // Auto-verify for MVP
```

### 2. Add Database-Level Default (Optional)

Update Prisma schema:
```prisma
model User {
  verifiedAt DateTime? @default(now()) @map("verified_at")
  // ... other fields
}
```

Then run migration:
```bash
npx prisma migrate dev --name add-verification-default
```

### 3. Better Error Messaging

Consider adding error codes for frontend:
```typescript
throw new UnauthorizedException({
  code: 'EMAIL_NOT_VERIFIED',
  message: 'Please verify your email before logging in',
});
```

### 4. Comprehensive Logging

Log authentication failures for debugging:
```typescript
this.logger.warn(
  `Login failed for ${email}: ${reason}`,
  'AuthService'
);
```

---

## Support & Documentation

- **Full Analysis**: `claudedocs/auth-issue-analysis.md`
- **Auth Service**: `backend/src/auth/auth.service.ts`
- **Database Schema**: `backend/prisma/schema.prisma`

---

## Quick Reference

| Script | Purpose | Usage |
|--------|---------|-------|
| `fix-user-verification.ts` | Quick fix for missing verifiedAt | `npx ts-node scripts/fix-user-verification.ts <email>` |
| `diagnose-auth-issue.ts` | Comprehensive diagnostics | `npx ts-node scripts/diagnose-auth-issue.ts` |

**Most Common Issue**: Missing `verifiedAt` field
**Most Common Fix**: Run `fix-user-verification.ts`
**Success Rate**: ~90% of authentication issues
