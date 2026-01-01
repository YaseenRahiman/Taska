/**
 * Seed Test Users Script
 * Creates test users for E2E testing
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const TEST_USERS = [
  {
    email: 'client@test.com',
    password: 'TestPassword123!',
    name: 'Test Client',
    firstName: 'Test',
    lastName: 'Client',
    phoneNumber: '+27821234567',
    role: 'CLIENT',
    emailVerified: true
  },
  {
    email: 'artisan@test.com',
    password: 'TestPassword123!',
    name: 'Test Artisan',
    firstName: 'Test',
    lastName: 'Artisan',
    phoneNumber: '+27829876543',
    role: 'ARTISAN',
    emailVerified: true
  },
  {
    email: 'admin@test.com',
    password: 'AdminPassword123!',
    name: 'Test Admin',
    firstName: 'Test',
    lastName: 'Admin',
    phoneNumber: '+27831112222',
    role: 'ADMIN',
    emailVerified: true
  }
];

async function seedTestUsers() {
  console.log('🌱 Seeding test users...');

  try {
    for (const userData of TEST_USERS) {
      const { email, password, firstName, lastName, phoneNumber, name, emailVerified, role } = userData;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
        include: { profile: true }
      });

      if (existingUser) {
        console.log(`✓ User already exists: ${email}`);

        // Update password if needed (for test consistency)
        const passwordHash = await bcrypt.hash(password, 10);
        await prisma.user.update({
          where: { email },
          data: {
            passwordHash,
            verifiedAt: emailVerified ? new Date() : null,
            role: role as any
          }
        });
        console.log(`✓ Updated password for: ${email}`);

        // Update or create profile
        if (!existingUser.profile) {
          await prisma.profile.create({
            data: {
              userId: existingUser.id,
              firstName,
              lastName,
              phoneNumber
            }
          });
          console.log(`  ✓ Created profile for: ${email}`);
        }
        continue;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user with profile
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name,
          role: role as any,
          verifiedAt: emailVerified ? new Date() : null,
          profile: {
            create: {
              firstName,
              lastName,
              phoneNumber,
              bio: role === 'ARTISAN' ? 'Professional test artisan with 10+ years experience' : null
            }
          }
        },
        include: { profile: true }
      });

      console.log(`✓ Created test user: ${email} (${user.role})`);
    }

    console.log('\n✅ Test users seeded successfully!');
    console.log('\nTest Credentials:');
    console.log('────────────────────────────────');
    TEST_USERS.forEach(user => {
      console.log(`${user.role.padEnd(10)} | ${user.email.padEnd(25)} | ${user.password}`);
    });
    console.log('────────────────────────────────\n');

  } catch (error) {
    console.error('❌ Error seeding test users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedTestUsers()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default seedTestUsers;
