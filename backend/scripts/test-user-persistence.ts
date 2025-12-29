/**
 * User Persistence Diagnostic Script
 * Tests if users persist in PostgreSQL database across restarts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testUserPersistence() {
  console.log('=== User Persistence Diagnostic ===\n');

  try {
    // Test 1: Check database connection
    console.log('1. Testing database connection...');
    await prisma.$connect();
    console.log('✓ Database connection successful\n');

    // Test 2: Query all users
    console.log('2. Querying all users in database...');
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        verifiedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`Found ${allUsers.length} users in database:\n`);
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log(`   Verified: ${user.verifiedAt ? 'Yes' : 'No'}`);
      console.log('');
    });

    // Test 3: Check specific user (grahiman02@gmail.com)
    console.log('3. Checking for grahiman02@gmail.com...');
    const testUser = await prisma.user.findUnique({
      where: { email: 'grahiman02@gmail.com' },
      include: {
        profile: true,
      },
    });

    if (testUser) {
      console.log('✓ User found!');
      console.log(`   ID: ${testUser.id}`);
      console.log(`   Email: ${testUser.email}`);
      console.log(`   Role: ${testUser.role}`);
      console.log(`   Created: ${testUser.createdAt}`);
      console.log(`   Profile: ${testUser.profile ? 'Yes' : 'No'}\n`);
    } else {
      console.log('✗ User NOT found in database\n');
    }

    // Test 4: Check database schema
    console.log('4. Verifying database tables exist...');
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `;
    console.log(`Found ${tables.length} tables:`);
    tables.forEach(table => console.log(`   - ${table.tablename}`));
    console.log('');

    // Test 5: Check user count
    console.log('5. User statistics:');
    const userCount = await prisma.user.count();
    const clientCount = await prisma.user.count({ where: { role: 'CLIENT' } });
    const artisanCount = await prisma.user.count({ where: { role: 'ARTISAN' } });
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });

    console.log(`   Total users: ${userCount}`);
    console.log(`   Clients: ${clientCount}`);
    console.log(`   Artisans: ${artisanCount}`);
    console.log(`   Admins: ${adminCount}\n`);

    console.log('=== Diagnostic Complete ===');

  } catch (error) {
    console.error('Error during diagnostic:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUserPersistence();
