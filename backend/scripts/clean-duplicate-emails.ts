import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findDuplicates() {
  try {
    console.log('\n🔍 Searching for duplicate email addresses...\n');
    console.log('='.repeat(80));

    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        verifiedAt: true,
        createdAt: true,
      },
      orderBy: {
        email: 'asc',
      },
    });

    // Group by normalized email
    const emailGroups = new Map<string, typeof users>();

    for (const user of users) {
      const normalizedEmail = user.email.toLowerCase();
      const group = emailGroups.get(normalizedEmail) || [];
      group.push(user);
      emailGroups.set(normalizedEmail, group);
    }

    // Find duplicates
    const duplicates = Array.from(emailGroups.entries())
      .filter(([_, group]) => group.length > 1);

    if (duplicates.length === 0) {
      console.log('\n✅ No duplicate emails found!');
      return;
    }

    console.log(`\n⚠️  Found ${duplicates.length} duplicate email(s):\n`);

    for (const [normalizedEmail, group] of duplicates) {
      console.log(`\n📧 Email: ${normalizedEmail}`);
      console.log(`   Duplicate count: ${group.length} accounts\n`);

      // Sort by: verified > older > lowercase
      const sorted = group.sort((a, b) => {
        // Verified users first
        if (a.verifiedAt && !b.verifiedAt) return -1;
        if (!a.verifiedAt && b.verifiedAt) return 1;

        // Older accounts first
        if (a.createdAt < b.createdAt) return -1;
        if (a.createdAt > b.createdAt) return 1;

        // Lowercase emails first
        if (a.email === normalizedEmail && b.email !== normalizedEmail) return -1;
        if (a.email !== normalizedEmail && b.email === normalizedEmail) return 1;

        return 0;
      });

      console.log('   Accounts:');
      sorted.forEach((user, index) => {
        const status = index === 0 ? '✓ KEEP (Primary)' : '❌ DELETE (Duplicate)';
        const verified = user.verifiedAt ? '✓ Verified' : '✗ Not verified';
        const casing = user.email === normalizedEmail ? 'lowercase' : 'mixed case';

        console.log(`   ${index + 1}. ${status}`);
        console.log(`      ID: ${user.id}`);
        console.log(`      Email: ${user.email} (${casing})`);
        console.log(`      Role: ${user.role}`);
        console.log(`      Status: ${verified}`);
        console.log(`      Created: ${user.createdAt.toISOString()}`);
        console.log('');
      });

      console.log(`   Recommendation: Keep user ID ${sorted[0].id}, delete ${sorted.length - 1} duplicate(s)`);
      console.log('-'.repeat(80));
    }

    console.log('\n⚠️  To remove duplicates, you need to manually review and delete them.');
    console.log('   This script only identifies duplicates - it does NOT delete them automatically.');
    console.log('\n   To delete a specific user:');
    console.log('   npx prisma studio');
    console.log('   OR use SQL:');
    console.log('   DELETE FROM "users" WHERE id = \'<user-id>\';');
    console.log('\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findDuplicates();
