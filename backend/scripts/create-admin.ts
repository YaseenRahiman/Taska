import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdmin() {
  const email = 'admin@taska.com';
  const password = 'Admin@123456';
  const hashedPassword = await bcrypt.hash(password, 12);

  try {
    // Delete existing admin if exists
    await prisma.profile.deleteMany({
      where: { user: { email } }
    });
    await prisma.user.deleteMany({ where: { email } });

    // Create new admin user
    const admin = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        role: 'ADMIN',
        verifiedAt: new Date(),
        profile: {
          create: {
            firstName: 'System',
            lastName: 'Admin',
          }
        }
      }
    });

    console.log('');
    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('   Email:    ' + email);
    console.log('   Password: ' + password);
    console.log('');
  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
