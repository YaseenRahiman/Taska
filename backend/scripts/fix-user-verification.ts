/**
 * Quick Fix Script - Set User Verification
 *
 * This script fixes the most common authentication issue:
 * Setting the verifiedAt field for users who don't have it.
 *
 * Usage:
 *   npx ts-node scripts/fix-user-verification.ts grahiman02@gmail.com
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixUserVerification(email: string) {
  console.log('🔧 User Verification Fix Tool');
  console.log('='.repeat(60));

  try {
    const normalizedEmail = email.toLowerCase().trim();
    console.log(`Target email: ${normalizedEmail}\n`);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      console.log('❌ ERROR: User not found');
      console.log(`   No user exists with email: ${normalizedEmail}`);
      console.log('\n   The user needs to register first.');
      process.exit(1);
    }

    console.log('✅ User found');
    console.log(`   ID: ${user.id}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Current verifiedAt: ${user.verifiedAt || 'NULL'}\n`);

    // Check if already verified
    if (user.verifiedAt) {
      console.log('ℹ️  User is already verified');
      console.log(`   Verified at: ${user.verifiedAt}`);
      console.log('\n   No action needed. If login still fails, run:');
      console.log('   npx ts-node scripts/diagnose-auth-issue.ts');
      process.exit(0);
    }

    // Apply fix
    console.log('🔨 Applying fix...');
    const updatedUser = await prisma.user.update({
      where: { email: normalizedEmail },
      data: {
        verifiedAt: new Date(),
      },
    });

    console.log('✅ Fix applied successfully!');
    console.log(`   verifiedAt set to: ${updatedUser.verifiedAt}\n`);

    // Log the action
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'EMAIL_VERIFICATION_MANUAL',
        entityType: 'User',
        entityId: user.id,
        ipAddress: 'system',
        userAgent: 'verification-fix-script',
        oldData: { verifiedAt: null },
        newData: { verifiedAt: updatedUser.verifiedAt },
      },
    });

    console.log('📝 Action logged in activity_logs table\n');

    console.log('=' .repeat(60));
    console.log('✓ User verification fixed successfully');
    console.log('\nNext steps:');
    console.log('1. User can now try logging in');
    console.log('2. If login still fails, run diagnostics:');
    console.log('   npx ts-node scripts/diagnose-auth-issue.ts');
    console.log('=' .repeat(60));

  } catch (error) {
    console.error('\n❌ ERROR during fix:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('❌ ERROR: Email address required');
  console.error('\nUsage:');
  console.error('  npx ts-node scripts/fix-user-verification.ts <email>');
  console.error('\nExample:');
  console.error('  npx ts-node scripts/fix-user-verification.ts grahiman02@gmail.com');
  process.exit(1);
}

// Run fix
fixUserVerification(email)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
