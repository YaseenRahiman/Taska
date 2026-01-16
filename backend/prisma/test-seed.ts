import { PrismaClient, UserRole, JobStatus, BidStatus, UrgencyLevel } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Test Database Seeding Script
 * Creates realistic test fixtures for E2E testing
 *
 * Usage: npx ts-node prisma/test-seed.ts
 * Or add to package.json: "test:seed": "ts-node prisma/test-seed.ts"
 */

async function main() {
  console.log('🧪 Starting TEST database seeding...');
  console.log('⚠️  This will create test users, jobs, bids, and messages\n');

  // ============================================
  // 1. CREATE TEST USERS
  // ============================================
  console.log('👥 Creating test users...');

  const password = await hash('Test123!', 12); // Same password for all test users - MUST match E2E tests

  // CLIENT User
  const client = await prisma.user.upsert({
    where: { email: 'client@test.com' },
    update: {},
    create: {
      email: 'client@test.com',
      passwordHash: password,
      role: UserRole.CLIENT,
      verifiedAt: new Date(),
      profile: {
        create: {
          firstName: 'Test',
          lastName: 'Client',
          phoneNumber: '+27821234567',
          addressLine1: '123 Test Street',
          city: 'Cape Town',
          province: 'Western Cape',
          postalCode: '8001',
          latitude: -33.9249,
          longitude: 18.4241,
          isVerified: true,
          bio: 'Test client account for E2E testing',
        }
      },
      wallet: {
        create: {
          balance: 10000, // R10,000 balance
        }
      }
    },
  });
  console.log('  ✅ Created CLIENT:', client.email);

  // ARTISAN User #1
  const artisan1 = await prisma.user.upsert({
    where: { email: 'artisan@test.com' },
    update: {},
    create: {
      email: 'artisan@test.com',
      passwordHash: password,
      role: UserRole.ARTISAN,
      verifiedAt: new Date(),
      profile: {
        create: {
          firstName: 'Test',
          lastName: 'Artisan',
          phoneNumber: '+27827654321',
          addressLine1: '456 Craft Avenue',
          city: 'Johannesburg',
          province: 'Gauteng',
          postalCode: '2000',
          latitude: -26.2041,
          longitude: 28.0473,
          isVerified: true,
          bio: 'Experienced plumber and electrician. 10+ years in the industry.',
        }
      },
      wallet: {
        create: {
          balance: 5000,
        }
      }
    },
  });
  console.log('  ✅ Created ARTISAN:', artisan1.email);

  // ARTISAN User #2
  const artisan2 = await prisma.user.upsert({
    where: { email: 'artisan2@test.com' },
    update: {},
    create: {
      email: 'artisan2@test.com',
      passwordHash: password,
      role: UserRole.ARTISAN,
      verifiedAt: new Date(),
      profile: {
        create: {
          firstName: 'Jane',
          lastName: 'Craftsman',
          phoneNumber: '+27829876543',
          addressLine1: '789 Builder Road',
          city: 'Durban',
          province: 'KwaZulu-Natal',
          postalCode: '4001',
          latitude: -29.8587,
          longitude: 31.0218,
          isVerified: true,
          bio: 'Specialist in carpentry and painting. Quality guaranteed.',
        }
      },
      wallet: {
        create: {
          balance: 7500,
        }
      }
    },
  });
  console.log('  ✅ Created ARTISAN #2:', artisan2.email);

  // ADMIN User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      passwordHash: password,
      role: UserRole.ADMIN,
      verifiedAt: new Date(),
      profile: {
        create: {
          firstName: 'Admin',
          lastName: 'User',
          phoneNumber: '+27821111111',
          isVerified: true,
          bio: 'Platform administrator account',
        }
      }
    },
  });
  console.log('  ✅ Created ADMIN:', admin.email);

  // ============================================
  // 2. CREATE CATEGORIES (if not exist)
  // ============================================
  console.log('\n🏷️  Ensuring categories exist...');

  const plumbingCategory = await prisma.category.upsert({
    where: { name: 'Plumbing' },
    update: {},
    create: {
      name: 'Plumbing',
      description: 'Plumbing repairs and installations',
      sortOrder: 1,
    }
  });

  const electricalCategory = await prisma.category.upsert({
    where: { name: 'Electrical' },
    update: {},
    create: {
      name: 'Electrical',
      description: 'Electrical work and installations',
      sortOrder: 2,
    }
  });

  const carpentryCategory = await prisma.category.upsert({
    where: { name: 'Carpentry' },
    update: {},
    create: {
      name: 'Carpentry',
      description: 'Wood work and carpentry services',
      sortOrder: 3,
    }
  });

  const paintingCategory = await prisma.category.upsert({
    where: { name: 'Painting' },
    update: {},
    create: {
      name: 'Painting',
      description: 'Interior and exterior painting',
      sortOrder: 4,
    }
  });

  console.log('  ✅ Categories ready');

  // ============================================
  // 3. CREATE ARTISAN SPECIALIZATIONS
  // ============================================
  console.log('\n🔧 Creating artisan specializations...');

  await prisma.artisanSpecialization.upsert({
    where: {
      userId_categoryId: {
        userId: artisan1.id,
        categoryId: plumbingCategory.id,
      }
    },
    update: {},
    create: {
      userId: artisan1.id,
      categoryId: plumbingCategory.id,
      experience: 10,
      isVerified: true,
      portfolio: ['/images/portfolio/plumbing1.jpg', '/images/portfolio/plumbing2.jpg'],
      certifications: ['/images/certs/plumbing-cert.pdf'],
    }
  });

  await prisma.artisanSpecialization.upsert({
    where: {
      userId_categoryId: {
        userId: artisan1.id,
        categoryId: electricalCategory.id,
      }
    },
    update: {},
    create: {
      userId: artisan1.id,
      categoryId: electricalCategory.id,
      experience: 8,
      isVerified: true,
      portfolio: ['/images/portfolio/electrical1.jpg'],
      certifications: ['/images/certs/electrical-cert.pdf'],
    }
  });

  await prisma.artisanSpecialization.upsert({
    where: {
      userId_categoryId: {
        userId: artisan2.id,
        categoryId: carpentryCategory.id,
      }
    },
    update: {},
    create: {
      userId: artisan2.id,
      categoryId: carpentryCategory.id,
      experience: 12,
      isVerified: true,
      portfolio: ['/images/portfolio/carpentry1.jpg', '/images/portfolio/carpentry2.jpg', '/images/portfolio/carpentry3.jpg'],
      certifications: ['/images/certs/carpentry-cert.pdf'],
    }
  });

  await prisma.artisanSpecialization.upsert({
    where: {
      userId_categoryId: {
        userId: artisan2.id,
        categoryId: paintingCategory.id,
      }
    },
    update: {},
    create: {
      userId: artisan2.id,
      categoryId: paintingCategory.id,
      experience: 7,
      isVerified: false,
      portfolio: ['/images/portfolio/painting1.jpg'],
      certifications: [],
    }
  });

  console.log('  ✅ Specializations created');

  // ============================================
  // 4. CREATE TEST JOBS
  // ============================================
  console.log('\n💼 Creating test jobs...');

  // JOB 1: Urgent Plumbing (OPEN)
  const job1 = await prisma.job.create({
    data: {
      clientId: client.id,
      categoryId: plumbingCategory.id,
      title: 'Urgent Kitchen Sink Repair',
      description: 'Kitchen sink is completely blocked and water is overflowing. Need immediate assistance to fix the drainage system and check for any pipe damage.',
      status: JobStatus.OPEN,
      urgency: UrgencyLevel.HIGH,
      budget: 1500,
      budgetType: 'FIXED',
      addressLine1: '123 Test Street',
      city: 'Cape Town',
      province: 'Western Cape',
      postalCode: '8001',
      latitude: -33.9249,
      longitude: 18.4241,
      requirements: ['Licensed plumber', 'Own tools', 'Emergency availability'],
      images: ['/images/jobs/kitchen-sink-1.jpg', '/images/jobs/kitchen-sink-2.jpg'],
    }
  });
  console.log('  ✅ Created Job #1 (OPEN - Plumbing):', job1.title);

  // JOB 2: Electrical Installation (OPEN)
  const job2 = await prisma.job.create({
    data: {
      clientId: client.id,
      categoryId: electricalCategory.id,
      title: 'Bedroom Electrical Outlets Installation',
      description: 'Need 4 additional power outlets installed in master bedroom and wiring for ceiling fan. Safety compliance certificate required after completion. Within next 2 weeks, weekends preferred.',
      status: JobStatus.OPEN,
      urgency: UrgencyLevel.MEDIUM,
      budget: 2000,
      budgetType: 'FIXED',
      addressLine1: '123 Test Street',
      city: 'Cape Town',
      province: 'Western Cape',
      postalCode: '8001',
      latitude: -33.9249,
      longitude: 18.4241,
      requirements: ['Certified electrician', 'COC certificate', 'Insurance'],
    }
  });
  console.log('  ✅ Created Job #2 (OPEN - Electrical):', job2.title);

  // JOB 3: Carpentry (OPEN)
  const job3 = await prisma.job.create({
    data: {
      clientId: client.id,
      categoryId: carpentryCategory.id,
      title: 'Custom Kitchen Cabinets',
      description: 'Looking for skilled carpenter to build custom kitchen cabinets. Detailed measurements and design plans will be provided. High-quality finish required. Project can start in 3 weeks, estimated 10-14 days completion.',
      status: JobStatus.OPEN,
      urgency: UrgencyLevel.LOW,
      budget: 8500,
      budgetType: 'NEGOTIABLE',
      addressLine1: '123 Test Street',
      city: 'Cape Town',
      province: 'Western Cape',
      postalCode: '8001',
      latitude: -33.9249,
      longitude: 18.4241,
      requirements: ['Portfolio required', 'Experience with custom work', 'References', 'Own tools'],
      images: ['/images/jobs/kitchen-design.jpg'],
    }
  });
  console.log('  ✅ Created Job #3 (OPEN - Carpentry):', job3.title);

  // JOB 4: Painting (DRAFT - for testing draft creation)
  const job4 = await prisma.job.create({
    data: {
      clientId: client.id,
      categoryId: paintingCategory.id,
      title: 'Living Room Painting',
      description: 'Interior painting for living room and hallway. Walls and ceiling.',
      status: JobStatus.DRAFT,
      urgency: UrgencyLevel.MEDIUM,
      budget: 3000,
      budgetType: 'FIXED',
      addressLine1: '123 Test Street',
      city: 'Cape Town',
      province: 'Western Cape',
      postalCode: '8001',
      latitude: -33.9249,
      longitude: 18.4241,
    }
  });
  console.log('  ✅ Created Job #4 (DRAFT - Painting):', job4.title);

  // ============================================
  // 5. CREATE TEST BIDS
  // ============================================
  console.log('\n💰 Creating test bids...');

  // Bid #1: Artisan1 bids on Job1 (PENDING)
  const bid1 = await prisma.bid.create({
    data: {
      jobId: job1.id,
      artisanId: artisan1.id,
      amount: 1400,
      estimatedDays: 1,
      status: BidStatus.PENDING,
      message: 'I can fix your kitchen sink issue immediately (within 2 hours). I have 10 years of experience with similar problems. Available today and bring all necessary tools. Will also check for any underlying pipe issues.',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    }
  });
  console.log('  ✅ Created Bid #1 (PENDING):', `R${bid1.amount} for Job #1`);

  // Bid #2: Artisan2 bids on Job1 (PENDING)
  const bid2 = await prisma.bid.create({
    data: {
      jobId: job1.id,
      artisanId: artisan2.id,
      amount: 1600,
      estimatedDays: 1,
      status: BidStatus.PENDING,
      message: 'Experienced plumber here. Can come today afternoon (3 hours max). Will provide warranty on parts replaced.',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    }
  });
  console.log('  ✅ Created Bid #2 (PENDING):', `R${bid2.amount} for Job #1`);

  // Bid #3: Artisan1 bids on Job2 (PENDING)
  const bid3 = await prisma.bid.create({
    data: {
      jobId: job2.id,
      artisanId: artisan1.id,
      amount: 1900,
      estimatedDays: 1,
      status: BidStatus.PENDING,
      message: 'Certified electrician with 8 years experience. Will provide COC certificate. Can start next weekend and complete in 1 day. Price includes all materials and certificate.',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    }
  });
  console.log('  ✅ Created Bid #3 (PENDING):', `R${bid3.amount} for Job #2`);

  // Bid #4: Artisan2 bids on Job3 (PENDING)
  const bid4 = await prisma.bid.create({
    data: {
      jobId: job3.id,
      artisanId: artisan2.id,
      amount: 8000,
      estimatedDays: 12,
      status: BidStatus.PENDING,
      message: 'Specialist in custom carpentry with 12 years experience. Have completed similar kitchen cabinet projects. Can provide portfolio and references. Price includes materials and installation. 12-day timeline.',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    }
  });
  console.log('  ✅ Created Bid #4 (PENDING):', `R${bid4.amount} for Job #3`);

  // ============================================
  // 6. CREATE TEST MESSAGES
  // ============================================
  console.log('\n💬 Creating test messages...');

  // Conversation about Job1
  const message1 = await prisma.message.create({
    data: {
      senderId: client.id,
      receiverId: artisan1.id,
      jobId: job1.id,
      content: 'Hi, I saw your bid for the kitchen sink repair. Are you available today?',
      messageType: 'TEXT',
      isRead: false,
    }
  });

  const message2 = await prisma.message.create({
    data: {
      senderId: artisan1.id,
      receiverId: client.id,
      jobId: job1.id,
      content: 'Yes, I can come this afternoon around 2 PM. Would that work for you?',
      messageType: 'TEXT',
      isRead: true,
    }
  });

  const message3 = await prisma.message.create({
    data: {
      senderId: client.id,
      receiverId: artisan1.id,
      jobId: job1.id,
      content: 'Perfect! See you at 2 PM. The address is 123 Test Street, Cape Town.',
      messageType: 'TEXT',
      isRead: true,
    }
  });

  // Conversation about Job2
  const message4 = await prisma.message.create({
    data: {
      senderId: client.id,
      receiverId: artisan1.id,
      jobId: job2.id,
      content: 'I have some questions about the electrical work. Can you provide the COC certificate on the same day?',
      messageType: 'TEXT',
      isRead: false,
    }
  });

  const message5 = await prisma.message.create({
    data: {
      senderId: artisan1.id,
      receiverId: client.id,
      jobId: job2.id,
      content: 'Yes, I can provide the COC certificate within 48 hours of completion. The inspection usually takes a day.',
      messageType: 'TEXT',
      isRead: true,
    }
  });

  console.log(`  ✅ Created ${5} test messages`);

  // ============================================
  // 7. CREATE TEST REVIEWS (for artisans)
  // ============================================
  console.log('\n⭐ Creating test reviews...');

  const review1 = await prisma.review.create({
    data: {
      reviewerId: client.id,
      revieweeId: artisan1.id,
      jobId: job1.id,
      rating: 5,
      comment: 'Excellent work! Very professional and quick. Fixed the sink problem completely and even gave me tips for maintenance.',
      qualityRating: 5,
      communicationRating: 5,
      timelinessRating: 5,
      valueRating: 5,
    }
  });
  console.log('  ✅ Created Review #1: 5 stars for Artisan #1');

  // ============================================
  // 8. SUMMARY
  // ============================================
  console.log('\n' + '='.repeat(50));
  console.log('✅ TEST DATABASE SEEDING COMPLETE!\n');
  console.log('📊 Summary:');
  console.log('  - Users created: 4 (1 CLIENT, 2 ARTISANS, 1 ADMIN)');
  console.log('  - Categories: 4 (Plumbing, Electrical, Carpentry, Painting)');
  console.log('  - Jobs created: 4 (3 OPEN, 1 DRAFT)');
  console.log('  - Bids created: 4 (all PENDING)');
  console.log('  - Messages created: 5');
  console.log('  - Reviews created: 1');
  console.log('  - Specializations: 4');
  console.log('\n🔑 Test Credentials:');
  console.log('  CLIENT:  client@test.com / Test123!');
  console.log('  ARTISAN: artisan@test.com / Test123!');
  console.log('  ARTISAN: artisan2@test.com / Test123!');
  console.log('  ADMIN:   admin@test.com / Test123!');
  console.log('\n🎯 Ready for E2E testing!');
  console.log('='.repeat(50) + '\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error during test seeding:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
