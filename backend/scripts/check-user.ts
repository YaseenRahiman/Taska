import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUser() {
  try {
    const email = process.argv[2];

    if (!email) {
      console.error('Usage: npx ts-node scripts/check-user.ts <email>');
      process.exit(1);
    }

    console.log(`\nSearching for user with email: ${email}`);
    console.log('='.repeat(60));

    // Search case-sensitive
    const userExact = await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
        specializations: true,
      },
    });

    // Search case-insensitive
    const usersCaseInsensitive = await prisma.user.findMany({
      where: {
        email: {
          mode: 'insensitive',
          equals: email,
        },
      },
      include: {
        profile: true,
        specializations: true,
      },
    });

    // Search by lowercase
    const userLowercase = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        profile: true,
        specializations: true,
      },
    });

    console.log('\n1. EXACT MATCH (case-sensitive):');
    if (userExact) {
      console.log(JSON.stringify(userExact, null, 2));
    } else {
      console.log('   No exact match found');
    }

    console.log('\n2. CASE-INSENSITIVE MATCH:');
    if (usersCaseInsensitive.length > 0) {
      usersCaseInsensitive.forEach((user, index) => {
        console.log(`\n   User ${index + 1}:`);
        console.log(JSON.stringify(user, null, 2));
      });
    } else {
      console.log('   No case-insensitive match found');
    }

    console.log('\n3. LOWERCASE MATCH:');
    if (userLowercase) {
      console.log(JSON.stringify(userLowercase, null, 2));
    } else {
      console.log('   No lowercase match found');
    }

    // List all users with similar emails
    const similarUsers = await prisma.user.findMany({
      where: {
        email: {
          contains: email.split('@')[0],
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        email: true,
        role: true,
        verifiedAt: true,
        createdAt: true,
      },
    });

    console.log('\n4. ALL SIMILAR EMAILS:');
    if (similarUsers.length > 0) {
      console.table(similarUsers);
    } else {
      console.log('   No similar emails found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
