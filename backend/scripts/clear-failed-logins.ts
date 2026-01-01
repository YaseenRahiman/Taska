import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearFailedLogins() {
  try {
    const result = await prisma.activityLog.deleteMany({
      where: {
        action: 'FAILED_LOGIN',
      },
    });

    console.log(`✅ Cleared ${result.count} failed login attempts`);
    console.log('Test accounts are now unlocked');
  } catch (error) {
    console.error('❌ Error clearing failed logins:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearFailedLogins();
