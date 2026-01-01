const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verifying test users in database...\n');

  const testEmails = ['client@test.com', 'artisan@test.com', 'admin@test.com'];

  const users = await prisma.user.findMany({
    where: {
      email: { in: testEmails }
    },
    select: {
      email: true,
      role: true,
      passwordHash: true
    }
  });

  console.log(`Found ${users.length} users:\n`);

  for (const user of users) {
    console.log(`📧 Email: ${user.email}`);
    console.log(`👤 Role: ${user.role}`);
    console.log(`🔒 Hash: ${user.passwordHash.substring(0, 30)}...`);

    // Test password verification
    const testPassword = 'password123';
    const isValid = await bcrypt.compare(testPassword, user.passwordHash);
    console.log(`✅ Password '${testPassword}' valid: ${isValid}`);
    console.log('---');
  }

  // Also test the hash directly
  console.log('\n🧪 Testing bcrypt comparison:');
  const testHash = await bcrypt.hash('password123', 12);
  console.log(`Test hash created: ${testHash.substring(0, 30)}...`);
  const canCompare = await bcrypt.compare('password123', testHash);
  console.log(`Can verify test hash: ${canCompare}\n`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error('Error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
