/**
 * Authentication Diagnostic Script
 *
 * Purpose: Diagnose why login fails for grahiman02@gmail.com
 *
 * This script will:
 * 1. Check if user exists in database
 * 2. Verify email verification status (verifiedAt)
 * 3. Test password hash comparison
 * 4. Check for any database anomalies
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function diagnoseAuthIssue() {
  const testEmail = 'grahiman02@gmail.com';
  const testPassword = 'Qwerty12345!@';

  console.log('🔍 AUTHENTICATION DIAGNOSTIC REPORT');
  console.log('=' .repeat(60));
  console.log(`Email: ${testEmail}`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('=' .repeat(60));

  try {
    // HYPOTHESIS 1: Check if user exists in database
    console.log('\n📊 HYPOTHESIS 1: User Existence Check');
    console.log('-'.repeat(60));

    const normalizedEmail = testEmail.toLowerCase().trim();
    console.log(`Normalized email: ${normalizedEmail}`);

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { profile: true },
    });

    if (!user) {
      console.log('❌ FINDING: User does NOT exist in database');
      console.log('   Root Cause: User was never created or was deleted');
      console.log('   Solution: User needs to re-register');
      return;
    }

    console.log('✅ FINDING: User EXISTS in database');
    console.log(`   User ID: ${user.id}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Created: ${user.createdAt}`);
    console.log(`   Updated: ${user.updatedAt}`);

    // HYPOTHESIS 2: Check email verification status
    console.log('\n📊 HYPOTHESIS 2: Email Verification Status');
    console.log('-'.repeat(60));

    if (!user.verifiedAt) {
      console.log('❌ FINDING: Email is NOT verified (verifiedAt is NULL)');
      console.log('   Root Cause: Registration did not set verifiedAt field');
      console.log('   Expected: Auto-verification should happen on line 78 of auth.service.ts');
      console.log('   Solution: Manually set verifiedAt or fix registration flow');
      console.log('\n   SQL Fix:');
      console.log(`   UPDATE users SET verified_at = NOW() WHERE email = '${normalizedEmail}';`);
    } else {
      console.log('✅ FINDING: Email is verified');
      console.log(`   Verified at: ${user.verifiedAt}`);
    }

    // HYPOTHESIS 3: Check password hash
    console.log('\n📊 HYPOTHESIS 3: Password Hash Analysis');
    console.log('-'.repeat(60));

    console.log(`   Stored hash: ${user.passwordHash.substring(0, 20)}...`);
    console.log(`   Hash length: ${user.passwordHash.length} characters`);
    console.log(`   Hash format: ${user.passwordHash.startsWith('$2b$') ? 'Valid bcrypt format' : 'INVALID format'}`);

    // Test password comparison
    console.log('\n   Testing password comparison...');
    const isPasswordValid = await bcrypt.compare(testPassword, user.passwordHash);

    if (!isPasswordValid) {
      console.log('❌ FINDING: Password does NOT match stored hash');
      console.log('   Possible causes:');
      console.log('   - User provided incorrect password');
      console.log('   - Password was changed after registration');
      console.log('   - Hash was corrupted during storage');
      console.log('   - Different password was used during registration');

      // Try common variations
      console.log('\n   Testing password variations...');
      const variations = [
        testPassword,
        testPassword.trim(),
        testPassword.toLowerCase(),
        testPassword.toUpperCase(),
      ];

      for (const variant of variations) {
        const matches = await bcrypt.compare(variant, user.passwordHash);
        if (matches) {
          console.log(`   ✓ Match found with variation: "${variant}"`);
        }
      }
    } else {
      console.log('✅ FINDING: Password matches stored hash');
    }

    // HYPOTHESIS 4: Check profile relationship
    console.log('\n📊 HYPOTHESIS 4: Profile Relationship');
    console.log('-'.repeat(60));

    if (!user.profile) {
      console.log('⚠️  WARNING: User has no profile (orphaned user)');
      console.log('   This should not happen in normal registration flow');
    } else {
      console.log('✅ FINDING: User has profile');
      console.log(`   Name: ${user.profile.firstName} ${user.profile.lastName}`);
      console.log(`   Phone: ${user.profile.phoneNumber}`);
    }

    // HYPOTHESIS 5: Check activity logs
    console.log('\n📊 HYPOTHESIS 5: Activity Log Analysis');
    console.log('-'.repeat(60));

    const activities = await prisma.activityLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    console.log(`   Total activities: ${activities.length}`);

    if (activities.length > 0) {
      console.log('\n   Recent activities:');
      activities.forEach((activity, index) => {
        console.log(`   ${index + 1}. ${activity.action} at ${activity.createdAt}`);
      });

      const registrationLog = activities.find(a => a.action === 'USER_REGISTERED');
      const loginAttempts = activities.filter(a => a.action === 'USER_LOGIN');

      if (registrationLog) {
        console.log(`\n   ✓ Registration logged: ${registrationLog.createdAt}`);
      } else {
        console.log('\n   ⚠️  No registration activity found (user may be from migration or manual creation)');
      }

      console.log(`   Login attempts: ${loginAttempts.length}`);
    } else {
      console.log('   ⚠️  No activities logged for this user');
    }

    // SUMMARY
    console.log('\n' + '='.repeat(60));
    console.log('📋 DIAGNOSTIC SUMMARY');
    console.log('='.repeat(60));

    const issues = [];

    if (!user.verifiedAt) {
      issues.push({
        severity: 'CRITICAL',
        issue: 'Email not verified (verifiedAt is NULL)',
        impact: 'Login will fail with "Please verify your email" error',
        fix: `UPDATE users SET verified_at = NOW() WHERE email = '${normalizedEmail}';`,
      });
    }

    if (!isPasswordValid) {
      issues.push({
        severity: 'CRITICAL',
        issue: 'Password does not match stored hash',
        impact: 'Login will fail with "Invalid credentials" error',
        fix: 'User needs to reset password OR verify they are using correct password',
      });
    }

    if (!user.profile) {
      issues.push({
        severity: 'WARNING',
        issue: 'User has no profile (orphaned)',
        impact: 'May cause issues in parts of application expecting profile data',
        fix: 'Create profile manually or investigate why profile was not created',
      });
    }

    if (issues.length === 0) {
      console.log('\n✅ No issues found - login should work normally');
      console.log('   If login still fails, check:');
      console.log('   - Network connectivity');
      console.log('   - API endpoint availability');
      console.log('   - Frontend request payload');
      console.log('   - Backend error logs');
    } else {
      console.log(`\n❌ Found ${issues.length} issue(s):\n`);
      issues.forEach((issue, index) => {
        console.log(`${index + 1}. [${issue.severity}] ${issue.issue}`);
        console.log(`   Impact: ${issue.impact}`);
        console.log(`   Fix: ${issue.fix}\n`);
      });
    }

  } catch (error) {
    console.error('\n❌ ERROR during diagnostics:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run diagnostics
diagnoseAuthIssue()
  .then(() => {
    console.log('\n✓ Diagnostic complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Diagnostic failed:', error);
    process.exit(1);
  });
