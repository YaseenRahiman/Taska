import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteUser() {
  try {
    const userId = process.argv[2];

    if (!userId) {
      console.error('❌ Usage: npx ts-node scripts/delete-duplicate-user.ts <user-id>');
      console.error('\n   Example:');
      console.error('   npx ts-node scripts/delete-duplicate-user.ts cmgo4yzdg000jww3h3u17p453');
      process.exit(1);
    }

    console.log(`\n🔍 Looking up user: ${userId}...\n`);

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        specializations: true,
        wallet: true,
      },
    });

    if (!user) {
      console.error(`❌ User not found with ID: ${userId}`);
      process.exit(1);
    }

    // Display user details
    console.log('User Details:');
    console.log('='.repeat(60));
    console.log(`ID: ${user.id}`);
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log(`Verified: ${user.verifiedAt ? `Yes (${user.verifiedAt})` : 'No'}`);
    console.log(`Created: ${user.createdAt}`);
    console.log(`\nProfile:`);
    console.log(`  Name: ${user.profile?.firstName} ${user.profile?.lastName}`);
    console.log(`  Phone: ${user.profile?.phoneNumber}`);
    console.log(`\nRelated Records:`);
    console.log(`  Specializations: ${user.specializations.length}`);
    console.log(`  Wallet: ${user.wallet ? 'Yes' : 'No'}`);
    console.log('='.repeat(60));

    // Confirm deletion
    console.log(`\n⚠️  WARNING: This will permanently delete this user and all related records!`);
    console.log(`   This action CANNOT be undone.\n`);

    // Check for any critical data
    const hasJobs = await prisma.job.count({
      where: { clientId: userId },
    });

    const hasBids = await prisma.bid.count({
      where: { artisanId: userId },
    });

    const hasMessages = await prisma.message.count({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
      },
    });

    const hasPayments = await prisma.payment.count({
      where: {
        OR: [
          { payerId: userId },
          { payeeId: userId },
        ],
      },
    });

    if (hasJobs > 0 || hasBids > 0 || hasMessages > 0 || hasPayments > 0) {
      console.log(`❌ CANNOT DELETE: User has critical data:`);
      console.log(`   Jobs: ${hasJobs}`);
      console.log(`   Bids: ${hasBids}`);
      console.log(`   Messages: ${hasMessages}`);
      console.log(`   Payments: ${hasPayments}`);
      console.log(`\n   You should NOT delete this user as it would break data integrity.`);
      console.log(`   Instead, consider deactivating or merging the account.\n`);
      process.exit(1);
    }

    console.log(`✓ Safe to delete: User has no jobs, bids, messages, or payments.\n`);

    // Delete user (cascade will handle related records)
    console.log(`🗑️  Deleting user ${user.email}...\n`);

    await prisma.user.delete({
      where: { id: userId },
    });

    console.log(`✅ Successfully deleted user:`);
    console.log(`   ID: ${userId}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`\n   Related records deleted:`);
    console.log(`   ✓ Profile`);
    if (user.specializations.length > 0) {
      console.log(`   ✓ ${user.specializations.length} Specialization(s)`);
    }
    if (user.wallet) {
      console.log(`   ✓ Wallet`);
    }
    console.log('');

  } catch (error) {
    console.error('❌ Error deleting user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

deleteUser();
