import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyUser(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user) {
      console.error(`❌ User not found with email: ${email}`);
      process.exit(1);
    }

    if (user.verifiedAt) {
      console.log(`✅ User ${email} is already verified (verified at: ${user.verifiedAt})`);
      process.exit(0);
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: { verifiedAt: new Date() },
      include: { profile: true },
    });

    console.log(`✅ Successfully verified user: ${email}`);
    console.log(`   User ID: ${updatedUser.id}`);
    console.log(`   Role: ${updatedUser.role}`);
    console.log(`   Name: ${updatedUser.profile?.firstName} ${updatedUser.profile?.lastName}`);
    console.log(`   Verified at: ${updatedUser.verifiedAt}`);

  } catch (error) {
    console.error('❌ Error verifying user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line argument
const emailInput = process.argv[2];

if (!emailInput) {
  console.error('❌ Usage: ts-node verify-user.ts <email>');
  process.exit(1);
}

// Normalize email to lowercase (same as registration does via class-validator)
const email = emailInput.toLowerCase().trim();

if (emailInput !== email) {
  console.log(`🔍 Normalizing email: "${emailInput}" → "${email}"`);
}

verifyUser(email);
