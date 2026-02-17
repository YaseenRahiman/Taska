import { PrismaClient, UserRole, BudgetType, UrgencyLevel, JobStatus, BidStatus, PaymentStatus, PaymentMethod, EscrowStatus, ArtisanLevelTier } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create Subscription Plans (CRITICAL: Must be created first for job posting to work)
  console.log('📋 Creating subscription plans...');
  await prisma.subscriptionPlan.upsert({
    where: { name: 'FREE' },
    update: {},
    create: {
      name: 'FREE',
      displayName: 'Free Plan',
      description: 'Get started with basic features',
      clientJobsPerMonth: 2,
      artisanBidsPerMonth: 5,
      pricePerMonthZar: 0,
      pricePerYearZar: 0,
      isDefault: true,
      isActive: true,
      sortOrder: 0,
      features: {
        basicSupport: true,
        jobPosting: true,
        bidding: true,
      },
    },
  });

  await prisma.subscriptionPlan.upsert({
    where: { name: 'PREMIUM' },
    update: {},
    create: {
      name: 'PREMIUM',
      displayName: 'Premium Plan',
      description: 'Unlock unlimited potential with premium features',
      clientJobsPerMonth: 50,
      artisanBidsPerMonth: 100,
      pricePerMonthZar: 299,
      pricePerYearZar: 2990,
      isDefault: false,
      isActive: true,
      sortOrder: 1,
      features: {
        prioritySupport: true,
        jobPosting: true,
        bidding: true,
        analytics: true,
        featuredListing: true,
        priorityMatching: true,
      },
    },
  });

  // Create System Settings
  console.log('📋 Creating system settings...');
  await prisma.systemSetting.createMany({
    data: [
      { key: 'PLATFORM_FEE_PERCENTAGE', value: '12.5', description: 'Platform fee percentage (12.5%)', isPublic: true },
      { key: 'VAT_PERCENTAGE', value: '15', description: 'VAT percentage (15%)', isPublic: true },
      { key: 'MINIMUM_WITHDRAWAL', value: '100', description: 'Minimum withdrawal amount in ZAR', isPublic: false },
      { key: 'MAX_BID_EXPIRY_DAYS', value: '7', description: 'Maximum days for bid expiry', isPublic: false },
      { key: 'ESCROW_RELEASE_DELAY_HOURS', value: '24', description: 'Hours to wait before automatic escrow release', isPublic: false },
      // Job budget settings - these control job creation validation
      { key: 'MIN_JOB_BUDGET', value: '100', description: 'Minimum job budget in ZAR', isPublic: true },
      { key: 'MAX_JOB_BUDGET', value: '100000', description: 'Maximum job budget in ZAR', isPublic: true },
      // Session and security settings
      { key: 'SESSION_TIMEOUT_MINUTES', value: '60', description: 'Session timeout in minutes', isPublic: false },
      { key: 'MAX_LOGIN_ATTEMPTS', value: '5', description: 'Maximum login attempts before lockout', isPublic: false },
      { key: 'PASSWORD_MIN_LENGTH', value: '8', description: 'Minimum password length', isPublic: true },
      // Content settings
      { key: 'JOB_EXPIRY_DAYS', value: '30', description: 'Days until job expires', isPublic: true },
      { key: 'MAX_JOB_IMAGES', value: '5', description: 'Maximum images per job', isPublic: true },
      { key: 'MAX_FILE_SIZE_MB', value: '5', description: 'Maximum file size in MB', isPublic: true },
    ],
    skipDuplicates: true,
  });

  // Create Categories (upsert to be idempotent)
  console.log('🏷️  Creating job categories...');

  // Helper function to upsert category with children
  async function upsertCategoryWithChildren(
    name: string,
    description: string,
    sortOrder: number,
    children: { name: string; description: string; sortOrder: number }[]
  ) {
    const category = await prisma.category.upsert({
      where: { name },
      update: { description, sortOrder },
      create: { name, description, sortOrder },
    });

    for (const child of children) {
      await prisma.category.upsert({
        where: { name: child.name },
        update: { description: child.description, sortOrder: child.sortOrder, parentId: category.id },
        create: { name: child.name, description: child.description, sortOrder: child.sortOrder, parentId: category.id },
      });
    }

    return category;
  }

  const categories = await Promise.all([
    // Home Improvement
    upsertCategoryWithChildren('Home Improvement', 'General home improvement and renovation services', 1, [
      { name: 'Plumbing', description: 'Plumbing repairs and installations', sortOrder: 1 },
      { name: 'Electrical', description: 'Electrical work and installations', sortOrder: 2 },
      { name: 'Carpentry', description: 'Wood work and carpentry services', sortOrder: 3 },
      { name: 'Painting', description: 'Interior and exterior painting', sortOrder: 4 },
      { name: 'Tiling', description: 'Floor and wall tiling services', sortOrder: 5 },
    ]),
    // Garden & Landscaping
    upsertCategoryWithChildren('Garden & Landscaping', 'Garden maintenance and landscaping services', 2, [
      { name: 'Garden Maintenance', description: 'Regular garden upkeep and maintenance', sortOrder: 1 },
      { name: 'Landscaping', description: 'Garden design and landscaping', sortOrder: 2 },
      { name: 'Tree Services', description: 'Tree felling and maintenance', sortOrder: 3 },
    ]),
    // Technology
    upsertCategoryWithChildren('Technology', 'IT and technology-related services', 3, [
      { name: 'Computer Repair', description: 'Computer and laptop repairs', sortOrder: 1 },
      { name: 'Web Development', description: 'Website development and design', sortOrder: 2 },
      { name: 'Mobile App Development', description: 'Mobile application development', sortOrder: 3 },
    ]),
    // Automotive
    upsertCategoryWithChildren('Automotive', 'Vehicle-related services', 4, [
      { name: 'Car Repair', description: 'Vehicle maintenance and repairs', sortOrder: 1 },
      { name: 'Car Wash', description: 'Vehicle cleaning services', sortOrder: 2 },
    ]),
    // Cleaning
    upsertCategoryWithChildren('Cleaning', 'Cleaning and maintenance services', 5, [
      { name: 'House Cleaning', description: 'Residential cleaning services', sortOrder: 1 },
      { name: 'Office Cleaning', description: 'Commercial cleaning services', sortOrder: 2 },
      { name: 'Carpet Cleaning', description: 'Professional carpet cleaning', sortOrder: 3 },
    ])
  ]);

  // Get all categories (including subcategories) for later use
  const allCategories = await prisma.category.findMany();
  const subcategories = allCategories.filter(cat => cat.parentId !== null);

  // Helper function to get or create user
  async function getOrCreateUser(email: string, userData: any) {
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({ data: userData });
    }
    return user;
  }

  // Create Admin User
  console.log('👤 Creating admin user...');
  const adminUser = await getOrCreateUser('admin@taska.co.za', {
    email: 'admin@taska.co.za',
    passwordHash: await hash('Admin123!', 12),
    role: UserRole.ADMIN,
    verifiedAt: new Date(),
    profile: {
      create: {
        firstName: 'System',
        lastName: 'Administrator',
        phoneNumber: '+27123456789',
        city: 'Cape Town',
        province: 'Western Cape',
        isVerified: true,
      }
    }
  });

  // Create Client Users
  console.log('👥 Creating client users...');
  const clients = await Promise.all([
    getOrCreateUser('john.smith@example.com', {
      email: 'john.smith@example.com',
      passwordHash: await hash('Password123!', 12),
      role: UserRole.CLIENT,
      verifiedAt: new Date(),
      profile: {
        create: {
          firstName: 'John',
          lastName: 'Smith',
          phoneNumber: '+27821234567',
          addressLine1: '123 Main Street',
          city: 'Cape Town',
          province: 'Western Cape',
          postalCode: '8001',
          latitude: -33.9249,
          longitude: 18.4241,
          isVerified: true,
        }
      }
    }),
    getOrCreateUser('sarah.jones@example.com', {
      email: 'sarah.jones@example.com',
      passwordHash: await hash('Password123!', 12),
      role: UserRole.CLIENT,
      verifiedAt: new Date(),
      profile: {
        create: {
          firstName: 'Sarah',
          lastName: 'Jones',
          phoneNumber: '+27827654321',
          addressLine1: '456 Oak Avenue',
          city: 'Johannesburg',
          province: 'Gauteng',
          postalCode: '2001',
          latitude: -26.2041,
          longitude: 28.0473,
          isVerified: true,
        }
      }
    }),
    getOrCreateUser('mike.brown@example.com', {
      email: 'mike.brown@example.com',
      passwordHash: await hash('Password123!', 12),
      role: UserRole.CLIENT,
      verifiedAt: new Date(),
      profile: {
        create: {
          firstName: 'Mike',
          lastName: 'Brown',
          phoneNumber: '+27831112222',
          addressLine1: '789 Pine Road',
          city: 'Durban',
          province: 'KwaZulu-Natal',
          postalCode: '4001',
          latitude: -29.8587,
          longitude: 31.0218,
          isVerified: true,
        }
      }
    })
  ]);

  // Create Artisan Users
  console.log('🔨 Creating artisan users...');
  const artisans = await Promise.all([
    // Plumber
    getOrCreateUser('david.plumber@example.com', {
      email: 'david.plumber@example.com',
      passwordHash: await hash('Password123!', 12),
      role: UserRole.ARTISAN,
      verifiedAt: new Date(),
      profile: {
        create: {
          firstName: 'David',
          lastName: 'Wilson',
          phoneNumber: '+27843334444',
          addressLine1: '321 Water Street',
          city: 'Cape Town',
          province: 'Western Cape',
          postalCode: '8001',
          latitude: -33.9249,
          longitude: 18.4241,
          bio: 'Licensed plumber with 10+ years experience in residential and commercial plumbing.',
          isVerified: true,
        }
      },
      wallet: {
        create: {
          balance: 2500.00,
          totalEarnings: 15000.00,
        }
      }
    }),
    // Electrician
    getOrCreateUser('lisa.electrician@example.com', {
      email: 'lisa.electrician@example.com',
      passwordHash: await hash('Password123!', 12),
      role: UserRole.ARTISAN,
      verifiedAt: new Date(),
      profile: {
        create: {
          firstName: 'Lisa',
          lastName: 'Taylor',
          phoneNumber: '+27855556666',
          addressLine1: '654 Electric Avenue',
          city: 'Johannesburg',
          province: 'Gauteng',
          postalCode: '2001',
          latitude: -26.2041,
          longitude: 28.0473,
          bio: 'Certified electrician specializing in home installations and repairs.',
          isVerified: true,
        }
      },
      wallet: {
        create: {
          balance: 1800.00,
          totalEarnings: 12000.00,
        }
      }
    }),
    // Carpenter
    getOrCreateUser('tom.carpenter@example.com', {
      email: 'tom.carpenter@example.com',
      passwordHash: await hash('Password123!', 12),
      role: UserRole.ARTISAN,
      verifiedAt: new Date(),
      profile: {
        create: {
          firstName: 'Tom',
          lastName: 'Anderson',
          phoneNumber: '+27867778888',
          addressLine1: '987 Wood Lane',
          city: 'Durban',
          province: 'KwaZulu-Natal',
          postalCode: '4001',
          latitude: -29.8587,
          longitude: 31.0218,
          bio: 'Master carpenter with expertise in custom furniture and home improvements.',
          isVerified: true,
        }
      },
      wallet: {
        create: {
          balance: 3200.00,
          totalEarnings: 20000.00,
        }
      }
    }),
    // Web Developer
    getOrCreateUser('alex.developer@example.com', {
      email: 'alex.developer@example.com',
      passwordHash: await hash('Password123!', 12),
      role: UserRole.ARTISAN,
      verifiedAt: new Date(),
      profile: {
        create: {
          firstName: 'Alex',
          lastName: 'Johnson',
          phoneNumber: '+27879990000',
          addressLine1: '159 Code Street',
          city: 'Cape Town',
          province: 'Western Cape',
          postalCode: '8001',
          latitude: -33.9249,
          longitude: 18.4241,
          bio: 'Full-stack developer specializing in modern web applications and e-commerce.',
          isVerified: true,
        }
      },
      wallet: {
        create: {
          balance: 4500.00,
          totalEarnings: 35000.00,
        }
      }
    })
  ]);

  // Create Artisan Specializations
  console.log('🎯 Creating artisan specializations...');
  const plumbingCategory = subcategories.find(c => c.name === 'Plumbing');
  const electricalCategory = subcategories.find(c => c.name === 'Electrical');
  const carpentryCategory = subcategories.find(c => c.name === 'Carpentry');
  const webDevCategory = subcategories.find(c => c.name === 'Web Development');

  if (plumbingCategory && electricalCategory && carpentryCategory && webDevCategory) {
    await prisma.artisanSpecialization.createMany({
      skipDuplicates: true,
      data: [
        {
          userId: artisans[0].id,
          categoryId: plumbingCategory.id,
          experience: 10,
          isVerified: true,
          portfolio: ['https://example.com/plumbing1.jpg', 'https://example.com/plumbing2.jpg'],
          certifications: ['https://example.com/plumbing-cert.pdf']
        },
        {
          userId: artisans[1].id,
          categoryId: electricalCategory.id,
          experience: 8,
          isVerified: true,
          portfolio: ['https://example.com/electrical1.jpg', 'https://example.com/electrical2.jpg'],
          certifications: ['https://example.com/electrical-cert.pdf']
        },
        {
          userId: artisans[2].id,
          categoryId: carpentryCategory.id,
          experience: 15,
          isVerified: true,
          portfolio: ['https://example.com/carpentry1.jpg', 'https://example.com/carpentry2.jpg'],
          certifications: ['https://example.com/carpentry-cert.pdf']
        },
        {
          userId: artisans[3].id,
          categoryId: webDevCategory.id,
          experience: 6,
          isVerified: true,
          portfolio: ['https://example.com/website1.png', 'https://example.com/website2.png'],
          certifications: ['https://example.com/webdev-cert.pdf']
        }
      ]
    });
  }

  // Create Sample Jobs
  console.log('💼 Creating sample jobs...');
  const jobs = await Promise.all([
    // Plumbing job
    prisma.job.create({
      data: {
        clientId: clients[0].id,
        categoryId: plumbingCategory?.id || subcategories[0].id,
        title: 'Kitchen Sink Leak Repair',
        description: 'Kitchen sink has been leaking under the cabinet for a few days. Need urgent repair to prevent water damage.',
        budget: 800.00,
        budgetType: BudgetType.FIXED,
        urgency: UrgencyLevel.HIGH,
        status: JobStatus.OPEN,
        addressLine1: '123 Main Street',
        city: 'Cape Town',
        province: 'Western Cape',
        postalCode: '8001',
        latitude: -33.9249,
        longitude: 18.4241,
        images: ['https://example.com/sink-leak1.jpg', 'https://example.com/sink-leak2.jpg'],
        requirements: ['Must be licensed plumber', 'Available for weekend work', 'Provide warranty'],
        startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      }
    }),
    // Electrical job
    prisma.job.create({
      data: {
        clientId: clients[1].id,
        categoryId: electricalCategory?.id || subcategories[1].id,
        title: 'Install Ceiling Fan in Bedroom',
        description: 'Need to install a new ceiling fan in the master bedroom. Electrical point already exists.',
        budget: 500.00,
        budgetType: BudgetType.FIXED,
        urgency: UrgencyLevel.MEDIUM,
        status: JobStatus.OPEN,
        addressLine1: '456 Oak Avenue',
        city: 'Johannesburg',
        province: 'Gauteng',
        postalCode: '2001',
        latitude: -26.2041,
        longitude: 28.0473,
        images: ['https://example.com/ceiling-fan.jpg'],
        requirements: ['COC required', 'Bring own tools'],
        startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      }
    }),
    // Carpentry job
    prisma.job.create({
      data: {
        clientId: clients[2].id,
        categoryId: carpentryCategory?.id || subcategories[2].id,
        title: 'Build Custom Kitchen Cabinets',
        description: 'Need custom kitchen cabinets built for a small kitchen renovation. Measurements and design ready.',
        budget: 15000.00,
        budgetType: BudgetType.NEGOTIABLE,
        urgency: UrgencyLevel.LOW,
        status: JobStatus.OPEN,
        addressLine1: '789 Pine Road',
        city: 'Durban',
        province: 'KwaZulu-Natal',
        postalCode: '4001',
        latitude: -29.8587,
        longitude: 31.0218,
        images: ['https://example.com/kitchen-design.jpg', 'https://example.com/measurements.jpg'],
        requirements: ['Portfolio of previous work required', '3-year warranty minimum', 'Use quality materials'],
        startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      }
    }),
    // Completed job for review purposes
    prisma.job.create({
      data: {
        clientId: clients[0].id,
        categoryId: webDevCategory?.id || subcategories[3].id,
        title: 'Simple Business Website',
        description: 'Need a simple 5-page website for my small business with contact form and gallery.',
        budget: 5000.00,
        budgetType: BudgetType.FIXED,
        urgency: UrgencyLevel.MEDIUM,
        status: JobStatus.COMPLETED,
        addressLine1: '123 Main Street',
        city: 'Cape Town',
        province: 'Western Cape',
        postalCode: '8001',
        latitude: -33.9249,
        longitude: 18.4241,
        images: ['https://example.com/business-logo.png'],
        requirements: ['Mobile responsive', 'SEO optimized', 'Easy to update'],
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      }
    })
  ]);

  // Create Bids for open jobs
  console.log('💰 Creating sample bids...');
  await Promise.all([
    // Bids for plumbing job
    prisma.bid.create({
      data: {
        jobId: jobs[0].id,
        artisanId: artisans[0].id, // David the plumber
        amount: 750.00,
        message: 'I can fix your kitchen sink leak quickly. I have 10+ years experience and all the necessary tools. Available this weekend.',
        estimatedDays: 1,
        attachments: ['https://example.com/plumber-quote.pdf'],
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      }
    }),
    // Bids for electrical job
    prisma.bid.create({
      data: {
        jobId: jobs[1].id,
        artisanId: artisans[1].id, // Lisa the electrician
        amount: 450.00,
        message: 'I can install your ceiling fan professionally with COC included. I have all the necessary tools and certificates.',
        estimatedDays: 1,
        attachments: ['https://example.com/electrician-portfolio.pdf'],
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }
    }),
    // Multiple bids for carpentry job
    prisma.bid.create({
      data: {
        jobId: jobs[2].id,
        artisanId: artisans[2].id, // Tom the carpenter
        amount: 14500.00,
        message: 'I specialize in custom kitchen cabinets. I can provide 5-year warranty and use only quality materials. Please see my portfolio.',
        estimatedDays: 10,
        attachments: ['https://example.com/carpenter-portfolio.pdf', 'https://example.com/cabinet-samples.jpg'],
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }
    }),
    // Accepted bid for completed job
    prisma.bid.create({
      data: {
        jobId: jobs[3].id,
        artisanId: artisans[3].id, // Alex the developer
        amount: 4800.00,
        message: 'I can create a professional business website that meets all your requirements. Mobile responsive and SEO optimized.',
        estimatedDays: 7,
        status: BidStatus.ACCEPTED,
        acceptedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }
    })
  ]);

  // Create Payment for completed job
  console.log('💳 Creating sample payment...');
  await prisma.payment.create({
    data: {
      jobId: jobs[3].id,
      payerId: clients[0].id,
      payeeId: artisans[3].id,
      amount: 4800.00,
      platformFee: 600.00, // 12.5%
      vatAmount: 720.00, // 15% of amount
      totalAmount: 5520.00,
      currency: 'ZAR',
      paymentMethod: PaymentMethod.CREDIT_CARD,
      paymentProvider: 'stripe',
      providerTxnId: 'pi_test_1234567890',
      status: PaymentStatus.COMPLETED,
      escrowStatus: EscrowStatus.RELEASED,
      paidAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
      releasedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    }
  });

  // Create Sample Review
  console.log('⭐ Creating sample review...');
  await prisma.review.create({
    data: {
      jobId: jobs[3].id,
      reviewerId: clients[0].id, // John reviewing
      revieweeId: artisans[3].id, // Alex being reviewed
      rating: 5,
      qualityRating: 5,
      timelinessRating: 4,
      communicationRating: 5,
      valueRating: 4,
      comment: 'Excellent work! Alex delivered exactly what I needed. The website looks professional and works perfectly on mobile. Great communication throughout the project.',
      images: ['https://example.com/website-screenshot.png'],
      isVerified: true,
    }
  });

  // Create Sample Notifications
  console.log('🔔 Creating sample notifications...');
  await prisma.notification.createMany({
    data: [
      {
        userId: clients[0].id,
        type: 'BID_RECEIVED',
        title: 'New Bid Received',
        message: 'David Wilson placed a bid of R750 on your job "Kitchen Sink Leak Repair"',
        data: { jobId: jobs[0].id, bidAmount: 750 },
      },
      {
        userId: artisans[0].id,
        type: 'JOB_POSTED',
        title: 'New Job Available',
        message: 'A new plumbing job has been posted in your area',
        data: { jobId: jobs[0].id },
      },
      {
        userId: artisans[3].id,
        type: 'PAYMENT_RECEIVED',
        title: 'Payment Received',
        message: 'You received R4,800 for completing the website project',
        data: { amount: 4800 },
      }
    ]
  });

  // ============================================================================
  // TASKA CREDITS & LOYALTY SYSTEM SEED DATA
  // ============================================================================

  // Create Credit Bundles (SA-friendly pricing)
  console.log('💳 Creating credit bundles...');
  await prisma.creditBundle.createMany({
    data: [
      {
        name: 'Starter',
        credits: 30,
        bonusCredits: 0,
        priceZar: 30.00,
        isActive: true,
        isPopular: false,
        sortOrder: 1,
        description: 'Perfect for trying out Taska Credits',
      },
      {
        name: 'Basic',
        credits: 50,
        bonusCredits: 5, // +10%
        priceZar: 50.00,
        isActive: true,
        isPopular: false,
        sortOrder: 2,
        description: 'Great for occasional bidding',
      },
      {
        name: 'Value',
        credits: 100,
        bonusCredits: 15, // +15%
        priceZar: 100.00,
        isActive: true,
        isPopular: true,
        sortOrder: 3,
        description: 'Most popular - best value for regular artisans',
      },
      {
        name: 'Pro',
        credits: 200,
        bonusCredits: 40, // +20%
        priceZar: 200.00,
        isActive: true,
        isPopular: false,
        sortOrder: 4,
        description: 'For active artisans who bid frequently',
      },
      {
        name: 'Bulk',
        credits: 500,
        bonusCredits: 150, // +30%
        priceZar: 500.00,
        isActive: true,
        isPopular: false,
        sortOrder: 5,
        description: 'Maximum savings for power users',
      },
    ],
    skipDuplicates: true,
  });

  // Create Level Configuration
  console.log('📊 Creating level configuration...');
  await prisma.levelConfig.createMany({
    data: [
      {
        level: ArtisanLevelTier.STARTER,
        displayName: 'Starter 🌱',
        feePercent: 12.00,
        minJobsRequired: 0,
        minRatingRequired: 0.00,
        minMonthsActive: 0,
        freeBidsPerMonth: 10,
        freeBoostsPerMonth: 0,
        searchBoostPercent: 0,
        payoutDays: 3,
        featuredDaysPerMonth: 0,
        requiresVerification: false,
        requiresSkillsAssessment: false,
      },
      {
        level: ArtisanLevelTier.RISING,
        displayName: 'Rising ⭐',
        feePercent: 10.00,
        minJobsRequired: 10,
        minRatingRequired: 4.00,
        minMonthsActive: 3,
        freeBidsPerMonth: 15,
        freeBoostsPerMonth: 2,
        searchBoostPercent: 10,
        payoutDays: 2,
        featuredDaysPerMonth: 0,
        requiresVerification: false,
        requiresSkillsAssessment: false,
      },
      {
        level: ArtisanLevelTier.EXPERT,
        displayName: 'Expert 🥈',
        feePercent: 8.00,
        minJobsRequired: 25,
        minRatingRequired: 4.50,
        minMonthsActive: 6,
        freeBidsPerMonth: 25,
        freeBoostsPerMonth: 5,
        searchBoostPercent: 25,
        payoutDays: 1,
        featuredDaysPerMonth: 1,
        requiresVerification: true,
        requiresSkillsAssessment: false,
      },
      {
        level: ArtisanLevelTier.MASTER,
        displayName: 'Master 🥇',
        feePercent: 7.00,
        minJobsRequired: 50,
        minRatingRequired: 4.80,
        minMonthsActive: 12,
        freeBidsPerMonth: 40,
        freeBoostsPerMonth: 10,
        searchBoostPercent: 50,
        payoutDays: 0, // Same day
        featuredDaysPerMonth: 7,
        requiresVerification: true,
        requiresSkillsAssessment: true,
      },
      {
        level: ArtisanLevelTier.LEGEND,
        displayName: 'Legend 👑',
        feePercent: 5.00,
        minJobsRequired: 100,
        minRatingRequired: 4.90,
        minMonthsActive: 24,
        freeBidsPerMonth: 999, // Unlimited
        freeBoostsPerMonth: 20,
        searchBoostPercent: 100, // Top of search
        payoutDays: 0, // Instant
        featuredDaysPerMonth: 30, // Always featured
        requiresVerification: true,
        requiresSkillsAssessment: true,
      },
    ],
    skipDuplicates: true,
  });

  // Create Loyalty Rewards
  console.log('🎁 Creating loyalty rewards...');
  await prisma.loyaltyReward.createMany({
    data: [
      {
        name: '50 Taska Credits',
        description: 'Convert your loyalty points to 50 Taska Credits',
        pointsCost: 500,
        rewardType: 'CREDITS',
        rewardValue: { credits: 50 },
        isActive: true,
        sortOrder: 1,
      },
      {
        name: '100 Taska Credits',
        description: 'Convert your loyalty points to 100 Taska Credits',
        pointsCost: 900, // Slight discount for bulk
        rewardType: 'CREDITS',
        rewardValue: { credits: 100 },
        isActive: true,
        sortOrder: 2,
      },
      {
        name: 'Featured Profile (3 Days)',
        description: 'Get your profile featured at the top of search results for 3 days',
        pointsCost: 750,
        rewardType: 'FEATURE',
        rewardValue: { days: 3, type: 'profile' },
        isActive: true,
        sortOrder: 3,
      },
      {
        name: 'Featured Profile (7 Days)',
        description: 'Get your profile featured at the top of search results for 7 days',
        pointsCost: 1500,
        rewardType: 'FEATURE',
        rewardValue: { days: 7, type: 'profile' },
        isActive: true,
        sortOrder: 4,
      },
      {
        name: '1% Fee Reduction (1 Month)',
        description: 'Reduce your platform fee by 1% for one month',
        pointsCost: 1000,
        rewardType: 'FEE_DISCOUNT',
        rewardValue: { discountPercent: 1, durationDays: 30 },
        isActive: true,
        sortOrder: 5,
      },
      {
        name: 'Taska Branded T-Shirt',
        description: 'Show your Taska pride with an official branded t-shirt',
        pointsCost: 2500,
        rewardType: 'MERCHANDISE',
        rewardValue: { item: 'tshirt', sizes: ['S', 'M', 'L', 'XL', 'XXL'] },
        isActive: true,
        stockCount: 100,
        sortOrder: 6,
      },
      {
        name: 'R500 Tool Voucher',
        description: 'Get a R500 voucher for Builders Warehouse or similar hardware store',
        pointsCost: 5000,
        rewardType: 'TOOL_VOUCHER',
        rewardValue: { amount: 500, currency: 'ZAR', validAt: ['Builders Warehouse', 'Cashbuild', 'Build It'] },
        isActive: true,
        stockCount: 50,
        sortOrder: 7,
      },
    ],
    skipDuplicates: true,
  });

  // Create Artisan Levels for existing artisans
  console.log('📈 Creating artisan levels...');
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  await Promise.all([
    // David the plumber - Rising level (experienced)
    prisma.artisanLevel.upsert({
      where: { userId: artisans[0].id },
      update: {},
      create: {
        userId: artisans[0].id,
        currentLevel: ArtisanLevelTier.RISING,
        currentFeePercent: 10.00,
        totalJobsCompleted: 15,
        totalJobsThisMonth: 3,
        averageRating: 4.60,
        totalRatings: 12,
        responseRate: 92.00,
        completionRate: 95.00,
        repeatClientCount: 4,
        disputesLost: 0,
        disputesLostLast12m: 0,
        loyaltyPoints: 1250,
        lifetimePoints: 2100,
        freeBidsRemaining: 12,
        freeBoostsRemaining: 1,
        allocationResetAt: now,
        memberSince: sixMonthsAgo,
        levelAchievedAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
        isIdentityVerified: true,
        isSkillsVerified: false,
        verificationPaidAt: new Date(now.getTime() - 150 * 24 * 60 * 60 * 1000),
      }
    }),
    // Lisa the electrician - Expert level
    prisma.artisanLevel.upsert({
      where: { userId: artisans[1].id },
      update: {},
      create: {
        userId: artisans[1].id,
        currentLevel: ArtisanLevelTier.EXPERT,
        currentFeePercent: 8.00,
        totalJobsCompleted: 32,
        totalJobsThisMonth: 5,
        averageRating: 4.75,
        totalRatings: 28,
        responseRate: 96.00,
        completionRate: 98.00,
        repeatClientCount: 8,
        disputesLost: 0,
        disputesLostLast12m: 0,
        loyaltyPoints: 3200,
        lifetimePoints: 5500,
        freeBidsRemaining: 20,
        freeBoostsRemaining: 3,
        allocationResetAt: now,
        memberSince: oneYearAgo,
        levelAchievedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        isIdentityVerified: true,
        isSkillsVerified: true,
        verificationPaidAt: new Date(now.getTime() - 300 * 24 * 60 * 60 * 1000),
        skillsAssessedAt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      }
    }),
    // Tom the carpenter - Master level
    prisma.artisanLevel.upsert({
      where: { userId: artisans[2].id },
      update: {},
      create: {
        userId: artisans[2].id,
        currentLevel: ArtisanLevelTier.MASTER,
        currentFeePercent: 7.00,
        totalJobsCompleted: 58,
        totalJobsThisMonth: 4,
        averageRating: 4.85,
        totalRatings: 52,
        responseRate: 98.00,
        completionRate: 100.00,
        repeatClientCount: 15,
        disputesLost: 1,
        disputesLostLast12m: 0,
        loyaltyPoints: 6500,
        lifetimePoints: 12000,
        freeBidsRemaining: 35,
        freeBoostsRemaining: 8,
        allocationResetAt: now,
        memberSince: new Date(now.getTime() - 540 * 24 * 60 * 60 * 1000), // 18 months ago
        levelAchievedAt: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
        isIdentityVerified: true,
        isSkillsVerified: true,
        verificationPaidAt: new Date(now.getTime() - 500 * 24 * 60 * 60 * 1000),
        skillsAssessedAt: new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000),
      }
    }),
    // Alex the developer - Starter level (new to platform)
    prisma.artisanLevel.upsert({
      where: { userId: artisans[3].id },
      update: {},
      create: {
        userId: artisans[3].id,
        currentLevel: ArtisanLevelTier.STARTER,
        currentFeePercent: 12.00,
        totalJobsCompleted: 1,
        totalJobsThisMonth: 1,
        averageRating: 5.00,
        totalRatings: 1,
        responseRate: 100.00,
        completionRate: 100.00,
        repeatClientCount: 0,
        disputesLost: 0,
        disputesLostLast12m: 0,
        loyaltyPoints: 175, // Job completed + 5-star review
        lifetimePoints: 175,
        freeBidsRemaining: 8,
        freeBoostsRemaining: 0,
        allocationResetAt: now,
        memberSince: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
        levelAchievedAt: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
        isIdentityVerified: false,
        isSkillsVerified: false,
      }
    }),
  ]);

  // Create Credit Wallets for artisans
  console.log('💰 Creating credit wallets...');
  await Promise.all([
    prisma.creditWallet.upsert({
      where: { userId: artisans[0].id },
      update: {},
      create: {
        userId: artisans[0].id,
        balance: 45,
        lifetimeCredits: 200,
        lifetimeSpent: 155,
        autoTopUpEnabled: false,
      }
    }),
    prisma.creditWallet.upsert({
      where: { userId: artisans[1].id },
      update: {},
      create: {
        userId: artisans[1].id,
        balance: 120,
        lifetimeCredits: 350,
        lifetimeSpent: 230,
        autoTopUpEnabled: true,
        autoTopUpThreshold: 20,
        autoTopUpAmount: 100,
        autoTopUpSource: 'WALLET',
      }
    }),
    prisma.creditWallet.upsert({
      where: { userId: artisans[2].id },
      update: {},
      create: {
        userId: artisans[2].id,
        balance: 85,
        lifetimeCredits: 500,
        lifetimeSpent: 415,
        autoTopUpEnabled: true,
        autoTopUpThreshold: 30,
        autoTopUpAmount: 200,
        autoTopUpSource: 'WALLET',
      }
    }),
    prisma.creditWallet.upsert({
      where: { userId: artisans[3].id },
      update: {},
      create: {
        userId: artisans[3].id,
        balance: 25,
        lifetimeCredits: 30,
        lifetimeSpent: 5,
        autoTopUpEnabled: false,
      }
    }),
  ]);

  // Create sample loyalty transactions (skip if jobs don't exist)
  console.log('🏆 Creating sample loyalty transactions...');
  if (jobs && jobs[3]) {
    await prisma.loyaltyTransaction.createMany({
      data: [
        {
          userId: artisans[3].id,
          action: 'JOB_COMPLETED',
          points: 100,
          balance: 100,
          reference: jobs[3].id,
          description: 'Completed job: Simple Business Website',
        },
        {
          userId: artisans[3].id,
          action: 'FIVE_STAR_REVIEW',
          points: 50,
          balance: 150,
          reference: jobs[3].id,
          description: 'Received 5-star review for Simple Business Website',
        },
        {
          userId: artisans[3].id,
          action: 'PROFILE_COMPLETE',
          points: 25,
          balance: 175,
          description: 'Completed profile setup',
        },
      ],
      skipDuplicates: true,
    });
  }

  console.log('✅ Database seeding completed successfully!');
  console.log(`📊 Created:
    - ${await prisma.user.count()} users
    - ${await prisma.category.count()} categories
    - ${await prisma.job.count()} jobs
    - ${await prisma.bid.count()} bids
    - ${await prisma.payment.count()} payments
    - ${await prisma.review.count()} reviews
    - ${await prisma.notification.count()} notifications
    - ${await prisma.systemSetting.count()} system settings

    💳 Monetization System:
    - ${await prisma.subscriptionPlan.count()} subscription plans
    - ${await prisma.creditBundle.count()} credit bundles
    - ${await prisma.creditWallet.count()} credit wallets
    - ${await prisma.levelConfig.count()} level configurations
    - ${await prisma.artisanLevel.count()} artisan levels
    - ${await prisma.loyaltyReward.count()} loyalty rewards
    - ${await prisma.loyaltyTransaction.count()} loyalty transactions
  `);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
