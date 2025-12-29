# Authentication Issue Root Cause Analysis

**Date**: 2025-10-28
**User**: grahiman02@gmail.com
**Symptom**: "Unauthorized" error on login
**System**: Taska NestJS/Prisma Application

---

## Executive Summary

User receives "unauthorized" error when attempting to login. Based on systematic analysis of the authentication flow in `backend/src/auth/auth.service.ts` (lines 156-212), there are **three possible root causes**:

1. **Email not verified** (verifiedAt is NULL) - Line 184-186
2. **Password mismatch** - Line 177-181
3. **User doesn't exist** - Line 171-174

## Evidence-Based Analysis

### Authentication Flow Breakdown

```typescript
// auth.service.ts:156-212
async login(loginDto: LoginDto, ipAddress: string, userAgent: string): Promise<AuthTokens> {
  // 1. Normalize email
  const email = loginDto.email.toLowerCase().trim(); // Line 160

  // 2. Brute force check (stub implementation - no actual logic)
  await this.checkBruteForceProtection(email, ipAddress); // Line 163

  // 3. Find user - FAILURE POINT #1
  const user = await this.prisma.user.findUnique({
    where: { email },
    include: { profile: true },
  }); // Line 166-169

  if (!user) {
    await this.recordFailedLogin(email, ipAddress);
    throw new UnauthorizedException('Invalid credentials'); // Line 173
  }

  // 4. Verify password - FAILURE POINT #2
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash); // Line 177
  if (!isPasswordValid) {
    await this.recordFailedLogin(email, ipAddress);
    throw new UnauthorizedException('Invalid credentials'); // Line 180
  }

  // 5. Check email verification - FAILURE POINT #3
  if (!user.verifiedAt) {
    throw new UnauthorizedException('Please verify your email before logging in'); // Line 185
  }

  // 6. Success path
  await this.clearFailedLogins(email, ipAddress);
  const tokens = await this.generateTokens(user);
  await this.createSession(user.id, deviceId || uuidv4(), ipAddress, userAgent);
  // ... logging ...
  return tokens;
}
```

### Hypothesis Testing

#### HYPOTHESIS 1: User Doesn't Exist
**Likelihood**: LOW (user stated "created on the website")

**Evidence Check**:
- Registration flow (lines 56-124) creates user with transaction
- Success returns tokens, confirming database creation
- If registration succeeded, user should exist

**Test**: Query database for normalized email
```sql
SELECT id, email, role, verified_at, created_at
FROM users
WHERE email = 'grahiman02@gmail.com';
```

**Expected**: User exists with valid ID

---

#### HYPOTHESIS 2: Email Not Verified (verifiedAt is NULL)
**Likelihood**: HIGH - **MOST PROBABLE ROOT CAUSE**

**Evidence**:
```typescript
// auth.service.ts:78 - Registration auto-verifies
verifiedAt: new Date(), // Auto-verify for MVP
```

**However**, there are scenarios where verifiedAt could be NULL:

1. **Database migration issue**: If user was created before this line was added
2. **Manual user creation**: Admin/script created user without verifiedAt
3. **Transaction rollback**: Partial transaction completion
4. **Database default**: Schema allows NULL, no database-level default set

**Critical Evidence**:
```typescript
// auth.service.ts:184-186
if (!user.verifiedAt) {
  throw new UnauthorizedException('Please verify your email before logging in');
}
```

This error message is **DIFFERENT** from "Invalid credentials", but the frontend may display both as generic "unauthorized".

**Test**:
```sql
SELECT email, verified_at FROM users WHERE email = 'grahiman02@gmail.com';
```

**Expected Finding**: `verified_at` column is NULL

**Fix**:
```sql
UPDATE users SET verified_at = NOW() WHERE email = 'grahiman02@gmail.com';
```

---

#### HYPOTHESIS 3: Password Hash Mismatch
**Likelihood**: MEDIUM

**Possible Causes**:

1. **User entered wrong password**: Most common cause
2. **Registration used different password**: User mistyped during registration
3. **Hash corruption**: Database storage issue (rare)
4. **Salt rounds mismatch**: Different bcrypt configuration (unlikely - using same saltRounds)
5. **Password modification**: Password was changed after registration

**Evidence Check**:
```typescript
// auth.service.ts:69 - Registration hashing
const passwordHash = await this.hashPassword(password);

// auth.service.ts:408-410 - Hash function
private async hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, this.saltRounds); // Line 409
}

// auth.service.ts:177 - Login comparison
const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
```

**Process Flow**:
- Registration: `Qwerty12345!@` → bcrypt.hash(password, 10) → `$2b$10$...`
- Login: bcrypt.compare(`Qwerty12345!@`, `$2b$10$...`) → true/false

**Test**:
```typescript
const testPassword = 'Qwerty12345!@';
const storedHash = user.passwordHash;
const isValid = await bcrypt.compare(testPassword, storedHash);
console.log('Password valid:', isValid);
```

**Expected Finding**: If this is the issue, `isValid` will be false

**Fix Options**:
1. User resets password via forgot password flow
2. Admin manually updates password hash
3. User re-registers with new email

---

#### HYPOTHESIS 4: Brute Force Protection (FALSE)
**Likelihood**: NONE

**Evidence**:
```typescript
// auth.service.ts:415-420
private async checkBruteForceProtection(email: string, ipAddress: string): Promise<void> {
  // Implement rate limiting logic
  // This would typically use Redis for production
  const key = `failed_login:${email}:${ipAddress}`;
  // Check failed attempts and implement lockout
}
```

**Finding**: Method is a **STUB** with no actual implementation. It does nothing and cannot block login.

**Conclusion**: NOT the cause

---

#### HYPOTHESIS 5: Session/Token Generation Failure (FALSE)
**Likelihood**: NONE

**Evidence**: Failures occur BEFORE token generation (lines 192-211). If execution reaches token generation, authentication has already succeeded.

**Conclusion**: NOT the cause

---

## Diagnostic Approach

### Step 1: Run Diagnostic Script

```bash
cd C:\Users\Yaseen\OneDrive\Documents\Investments\Taska\backend
npx ts-node scripts/diagnose-auth-issue.ts
```

This will test all hypotheses and provide specific findings.

### Step 2: Interpret Results

**Scenario A: verifiedAt is NULL**
```
Root Cause: Email verification field not set
Error Message: "Please verify your email before logging in"
Fix: UPDATE users SET verified_at = NOW() WHERE email = 'grahiman02@gmail.com';
```

**Scenario B: Password mismatch**
```
Root Cause: Password doesn't match stored hash
Error Message: "Invalid credentials"
Fix: User needs to reset password OR verify correct password
```

**Scenario C: User doesn't exist**
```
Root Cause: User was never created or was deleted
Error Message: "Invalid credentials"
Fix: User needs to re-register
```

### Step 3: Apply Fix

Based on diagnostic results, apply appropriate fix using provided SQL or code.

---

## Recommended Solution Path

### Immediate Fix (if verifiedAt is NULL):

```sql
-- Connect to your PostgreSQL database
-- psql or database client

UPDATE users
SET verified_at = NOW()
WHERE email = 'grahiman02@gmail.com';

-- Verify fix
SELECT email, verified_at, role
FROM users
WHERE email = 'grahiman02@gmail.com';
```

### Alternative Fix (if password mismatch):

1. **User resets password**:
   - Use "Forgot Password" flow
   - POST /auth/request-password-reset
   - Follow reset link
   - POST /auth/reset-password

2. **Admin manual password update**:
```typescript
// Create temporary script
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const newPassword = 'Qwerty12345!@'; // User's intended password
const passwordHash = await bcrypt.hash(newPassword, 10);

await prisma.user.update({
  where: { email: 'grahiman02@gmail.com' },
  data: { passwordHash },
});
```

---

## Prevention Measures

### 1. Ensure Auto-Verification Works

**Current Code** (auth.service.ts:78):
```typescript
verifiedAt: new Date(), // Auto-verify for MVP
```

This is correct, but verify it's always executed.

### 2. Add Database-Level Default (Optional)

**Schema Enhancement**:
```prisma
model User {
  verifiedAt DateTime? @default(now()) @map("verified_at")
  // ... other fields
}
```

This ensures ALL new users get automatic verification timestamp.

### 3. Better Error Messages

**Current Issue**: Backend sends different messages, but all return 401 Unauthorized:
- "Invalid credentials"
- "Please verify your email before logging in"

**Frontend may show**: Generic "unauthorized" error

**Improvement**: Add error codes for better frontend handling:
```typescript
throw new UnauthorizedException({
  code: 'EMAIL_NOT_VERIFIED',
  message: 'Please verify your email before logging in',
});
```

### 4. Comprehensive Logging

Add detailed logging to track authentication failures:
```typescript
this.logger.warn(`Login failed for ${email}: ${reason}`, 'AuthService');
```

---

## Testing Verification

After applying fix, verify login works:

```bash
# Using curl or Postman
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "grahiman02@gmail.com",
  "password": "Qwerty12345!@"
}

# Expected Response (200 OK):
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci...",
  "expiresIn": 86400
}
```

---

## Conclusion

**Most Probable Root Cause**: Email verification field (verifiedAt) is NULL, causing line 184-186 in auth.service.ts to throw "Please verify your email" error.

**Primary Diagnostic Tool**: `backend/scripts/diagnose-auth-issue.ts`

**Primary Fix**: `UPDATE users SET verified_at = NOW() WHERE email = 'grahiman02@gmail.com';`

**Verification**: Re-attempt login after fix application

---

## Files Referenced

- `backend/src/auth/auth.service.ts` (lines 56-212)
- `backend/src/auth/auth.controller.ts` (lines 72-95)
- `backend/prisma/schema.prisma` (lines 14-43)
- `backend/scripts/diagnose-auth-issue.ts` (diagnostic tool)
