# Password Recovery - Quick Fix Guide
## Development Team Action Items

**Status**: 🔴 CRITICAL - NOT PRODUCTION READY
**Estimated Fix Time**: 40-56 hours
**Priority**: MUST FIX FOR MVP

---

## 🚨 Critical Blockers (Fix First)

### 1. Backend: Implement Password Reset Token Management
**Time**: 8 hours | **Severity**: CRITICAL

**Current Issue**:
```typescript
// auth.service.ts lines 341-357
async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
  const { token, newPassword } = resetPasswordDto;

  // ALL THIS IS COMMENTED OUT:
  // const resetRecord = await this.prisma.passwordResetToken.findFirst({...});

  // CURRENT IMPLEMENTATION:
  throw new BadRequestException('Password reset functionality requires proper token management implementation');
}
```

**Fix Required**:
```typescript
async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
  const { token, newPassword } = resetPasswordDto;

  // 1. Find valid, unused token
  const resetRecord = await this.prisma.passwordResetToken.findFirst({
    where: {
      token,
      expiresAt: { gt: new Date() },
      usedAt: null,
    },
    include: { user: true },
  });

  if (!resetRecord) {
    throw new BadRequestException('Invalid or expired reset token');
  }

  // 2. Check password not same as current (security)
  const isSamePassword = await bcrypt.compare(newPassword, resetRecord.user.passwordHash);
  if (isSamePassword) {
    throw new BadRequestException('New password must be different from current password');
  }

  // 3. Hash new password
  const newPasswordHash = await this.hashPassword(newPassword);

  // 4. Update password and mark token as used
  await this.prisma.$transaction([
    this.prisma.user.update({
      where: { id: resetRecord.userId },
      data: { passwordHash: newPasswordHash },
    }),
    this.prisma.passwordResetToken.update({
      where: { id: resetRecord.id },
      data: { usedAt: new Date() },
    }),
  ]);

  // 5. Log activity
  await this.prisma.activityLog.create({
    data: {
      userId: resetRecord.userId,
      action: 'PASSWORD_RESET',
      entityType: 'User',
      entityId: resetRecord.userId,
    },
  });

  return { message: 'Password reset successfully' };
}
```

**Also Fix `requestPasswordReset()`**:
```typescript
async requestPasswordReset(emailInput: string): Promise<{ message: string }> {
  const email = emailInput.toLowerCase().trim();
  const user = await this.prisma.user.findUnique({ where: { email } });

  if (!user) {
    // Anti-enumeration: return same message
    return { message: 'If the email exists, a password reset link has been sent.' };
  }

  // 1. Generate secure token
  const resetToken = uuidv4();
  const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // 2. Store token in database
  await this.prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token: resetToken,
      expiresAt: resetExpiry,
    },
  });

  // 3. Send email (implement email service first)
  await this.sendPasswordResetEmail(email, resetToken);

  return { message: 'If the email exists, a password reset link has been sent.' };
}
```

---

### 2. Frontend: Create Password Reset Pages
**Time**: 8 hours | **Severity**: CRITICAL

**Missing Files**:
1. `frontend/src/app/auth/forgot-password/page.tsx`
2. `frontend/src/app/auth/reset-password/page.tsx`

**File 1: Forgot Password Page**
```typescript
// frontend/src/app/auth/forgot-password/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('http://localhost:3000/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
      } else {
        setError(data.message || 'Failed to send reset email');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="text-center text-3xl font-bold">Reset Your Password</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="mt-1"
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {message && (
            <div className="rounded-md bg-green-50 p-4">
              <p className="text-sm text-green-800">{message}</p>
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Sending...' : 'Send Reset Link'}
          </Button>

          <div className="text-center">
            <a href="/auth/login" className="text-sm text-blue-600 hover:text-blue-500">
              Back to Login
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
```

**File 2: Reset Password Page**
```typescript
// frontend/src/app/auth/reset-password/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Password reset successful! Redirecting to login...');
        setTimeout(() => router.push('/auth/login'), 2000);
      } else {
        setError(data.message || 'Failed to reset password');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600">Invalid Reset Link</h2>
          <p className="mt-2">Please request a new password reset.</p>
          <a href="/auth/forgot-password" className="mt-4 inline-block text-blue-600">
            Request New Reset Link
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="text-center text-3xl font-bold">Set New Password</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your new password below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="mt-1"
            />
            <p className="mt-1 text-xs text-gray-500">
              Must contain uppercase, lowercase, number, and special character
            </p>
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              className="mt-1"
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {message && (
            <div className="rounded-md bg-green-50 p-4">
              <p className="text-sm text-green-800">{message}</p>
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>
      </div>
    </div>
  );
}
```

---

### 3. Email Service Integration
**Time**: 6 hours | **Severity**: CRITICAL

**Choose Email Provider**:
- Option 1: SendGrid (recommended - 100 free emails/day)
- Option 2: AWS SES (cheap, scalable)
- Option 3: NodeMailer + Gmail (dev/testing only)

**Implementation (SendGrid Example)**:

**Step 1: Install Package**
```bash
cd backend
npm install @sendgrid/mail
```

**Step 2: Add to .env**
```
SENDGRID_API_KEY=your_api_key_here
FROM_EMAIL=noreply@taska.com
```

**Step 3: Create Email Service**
```typescript
// backend/src/common/email/email.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';

@Injectable()
export class EmailService {
  constructor(private configService: ConfigService) {
    sgMail.setApiKey(this.configService.get<string>('SENDGRID_API_KEY'));
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/auth/reset-password?token=${token}`;

    const msg = {
      to: email,
      from: this.configService.get<string>('FROM_EMAIL'),
      subject: 'Reset Your Taska Password',
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password. Click the link below to continue:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    };

    await sgMail.send(msg);
  }

  async sendVerificationEmail(email: string, userId: string, token: string): Promise<void> {
    const verifyUrl = `${this.configService.get('FRONTEND_URL')}/auth/verify-email?token=${token}&userId=${userId}`;

    const msg = {
      to: email,
      from: this.configService.get<string>('FROM_EMAIL'),
      subject: 'Verify Your Taska Email',
      html: `
        <h2>Welcome to Taska!</h2>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verifyUrl}">Verify Email</a>
        <p>This link will expire in 24 hours.</p>
      `,
    };

    await sgMail.send(msg);
  }
}
```

**Step 4: Update AuthService**
```typescript
// Replace stub methods in auth.service.ts

constructor(
  private readonly emailService: EmailService, // Inject
  // ... other dependencies
) {}

private async sendPasswordResetEmail(email: string, token: string): Promise<void> {
  await this.emailService.sendPasswordResetEmail(email, token);
  this.logger.log(`Password reset email sent to: ${email}`, 'AuthService');
}

private async sendVerificationEmail(email: string, userId: string): Promise<void> {
  const verificationToken = uuidv4();
  await this.emailService.sendVerificationEmail(email, userId, verificationToken);
  this.logger.log(`Verification email sent to: ${email}`, 'AuthService');
}
```

---

### 4. Add Password Change UI to Settings
**Time**: 2 hours | **Severity**: CRITICAL

**Create Settings Page**:
```typescript
// frontend/src/app/settings/password/page.tsx
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function PasswordChangePage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:3000/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(data.message || 'Failed to change password');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Change Password</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="currentPassword">Current Password</Label>
          <Input
            id="currentPassword"
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="newPassword">New Password</Label>
          <Input
            id="newPassword"
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            Must contain uppercase, lowercase, number, and special character
          </p>
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {message && (
          <div className="rounded-md bg-green-50 p-4">
            <p className="text-sm text-green-800">{message}</p>
          </div>
        )}

        <Button type="submit" disabled={loading}>
          {loading ? 'Changing...' : 'Change Password'}
        </Button>
      </form>
    </div>
  );
}
```

---

## 🟡 High Priority (Fix for Beta)

### 5. Session Management
**Time**: 6 hours | **File**: `auth.service.ts` lines 458-466

**Create Session Model in Prisma**:
```prisma
model Session {
  id           String   @id @default(cuid())
  userId       String   @map("user_id")
  deviceId     String   @map("device_id")
  ipAddress    String   @map("ip_address")
  userAgent    String   @map("user_agent")
  lastActivity DateTime @default(now()) @map("last_activity")
  createdAt    DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, deviceId])
  @@index([userId])
  @@map("sessions")
}
```

**Implement Session Methods**:
```typescript
private async createSession(userId: string, deviceId: string, ipAddress: string, userAgent: string): Promise<void> {
  await this.prisma.session.upsert({
    where: { userId_deviceId: { userId, deviceId } },
    create: { userId, deviceId, ipAddress, userAgent, lastActivity: new Date() },
    update: { ipAddress, userAgent, lastActivity: new Date() },
  });
}

async logout(userId: string, deviceId?: string): Promise<{ message: string }> {
  if (deviceId) {
    await this.prisma.session.deleteMany({
      where: { userId, deviceId },
    });
  } else {
    // Logout all sessions
    await this.prisma.session.deleteMany({
      where: { userId },
    });
  }

  await this.prisma.activityLog.create({
    data: {
      userId,
      action: 'USER_LOGOUT',
      entityType: 'User',
      entityId: userId,
    },
  });

  return { message: 'Logged out successfully' };
}
```

---

### 6. Brute Force Protection
**Time**: 4 hours | **Requires**: Redis

**Install Redis**:
```bash
npm install ioredis
npm install @nestjs/throttler
```

**Add Throttler Module**:
```typescript
// app.module.ts
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000, // 60 seconds
      limit: 10, // 10 requests
    }]),
    // ... other modules
  ],
})
```

**Implement in AuthService**:
```typescript
private readonly loginAttempts = new Map<string, { count: number; lockUntil?: Date }>();

private async checkBruteForceProtection(email: string, ipAddress: string): Promise<void> {
  const key = `${email}:${ipAddress}`;
  const attempts = this.loginAttempts.get(key);

  if (attempts && attempts.lockUntil && attempts.lockUntil > new Date()) {
    const remainingTime = Math.ceil((attempts.lockUntil.getTime() - Date.now()) / 1000 / 60);
    throw new UnauthorizedException(
      `Account locked due to too many failed attempts. Try again in ${remainingTime} minutes.`
    );
  }
}

private async recordFailedLogin(email: string, ipAddress: string): Promise<void> {
  const key = `${email}:${ipAddress}`;
  const attempts = this.loginAttempts.get(key) || { count: 0 };
  attempts.count++;

  if (attempts.count >= this.maxLoginAttempts) {
    attempts.lockUntil = new Date(Date.now() + this.lockoutDuration);
  }

  this.loginAttempts.set(key, attempts);
}

private async clearFailedLogins(email: string, ipAddress: string): Promise<void> {
  const key = `${email}:${ipAddress}`;
  this.loginAttempts.delete(key);
}
```

---

### 7. Rate Limiting on Password Reset
**Time**: 3 hours

**Add to Controller**:
```typescript
import { Throttle } from '@nestjs/throttler';

@Post('request-password-reset')
@Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
@HttpCode(HttpStatus.OK)
async requestPasswordReset(@Body('email') email: string): Promise<{ message: string }> {
  return this.authService.requestPasswordReset(email);
}
```

---

## ✅ Testing After Fixes

**Run Test Suite**:
```bash
npx playwright test tests/e2e/sprint1-password-recovery.spec.ts
```

**Expected Results After Fixes**:
- PWD-001: ✅ PASS - Email input found
- PWD-004: ✅ PASS - Password input found
- SEC-001: ✅ PASS - Password reset functional
- CHANGE-002: ✅ PASS - Password change accessible

---

## 📋 Checklist

### Critical (Must Complete)
- [ ] Implement password reset token backend
- [ ] Create forgot-password frontend page
- [ ] Create reset-password frontend page
- [ ] Integrate email service (SendGrid/SES)
- [ ] Create password change settings page
- [ ] Test full password reset flow end-to-end

### High Priority
- [ ] Add session management
- [ ] Implement brute force protection
- [ ] Add rate limiting to auth endpoints
- [ ] Fix password reuse check in reset flow
- [ ] Remove auto-email-verification (line 79)

### Verification
- [ ] Run Playwright test suite
- [ ] Manual test password reset flow
- [ ] Verify emails are sent correctly
- [ ] Test password change from settings
- [ ] Verify security controls (rate limiting, brute force)

---

**Estimated Total Time**: 40-56 hours
**Priority**: 🔴 CRITICAL - Block production deployment until complete
**Next Review**: After Priority 1 items implemented

---

**Quick Reference**:
- Detailed Findings: `claudedocs/SPRINT1-PASSWORD-RECOVERY-FINDINGS.md`
- Test Suite: `tests/e2e/sprint1-password-recovery.spec.ts`
- Executive Summary: `claudedocs/SPRINT1-AGENT2-SUMMARY.md`
