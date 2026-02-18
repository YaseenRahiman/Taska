'use strict';
// Plain JavaScript seed - runs in the production image (no ts-node needed)
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // ── Subscription Plans ──────────────────────────────────────────────────────
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
      features: { basicSupport: true, jobPosting: true, bidding: true },
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

  // ── System Settings ──────────────────────────────────────────────────────────
  console.log('📋 Creating system settings...');
  await prisma.systemSetting.createMany({
    skipDuplicates: true,
    data: [
      { key: 'PLATFORM_FEE_PERCENTAGE', value: '12.5', description: 'Platform fee percentage (12.5%)', isPublic: true },
      { key: 'VAT_PERCENTAGE', value: '15', description: 'VAT percentage (15%)', isPublic: true },
      { key: 'MINIMUM_WITHDRAWAL', value: '100', description: 'Minimum withdrawal amount in ZAR', isPublic: false },
      { key: 'MAX_BID_EXPIRY_DAYS', value: '7', description: 'Maximum days for bid expiry', isPublic: false },
      { key: 'ESCROW_RELEASE_DELAY_HOURS', value: '24', description: 'Hours to wait before automatic escrow release', isPublic: false },
      { key: 'MIN_JOB_BUDGET', value: '100', description: 'Minimum job budget in ZAR', isPublic: true },
      { key: 'MAX_JOB_BUDGET', value: '100000', description: 'Maximum job budget in ZAR', isPublic: true },
      { key: 'SESSION_TIMEOUT_MINUTES', value: '60', description: 'Session timeout in minutes', isPublic: false },
      { key: 'MAX_LOGIN_ATTEMPTS', value: '5', description: 'Maximum login attempts before lockout', isPublic: false },
      { key: 'PASSWORD_MIN_LENGTH', value: '8', description: 'Minimum password length', isPublic: true },
      { key: 'JOB_EXPIRY_DAYS', value: '30', description: 'Days until job expires', isPublic: true },
      { key: 'MAX_JOB_IMAGES', value: '5', description: 'Maximum images per job', isPublic: true },
      { key: 'MAX_FILE_SIZE_MB', value: '5', description: 'Maximum file size in MB', isPublic: true },
    ],
  });

  // ── Categories ───────────────────────────────────────────────────────────────
  console.log('🏷️  Creating job categories...');

  async function upsertCategoryWithChildren(name, description, sortOrder, children) {
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

  // Run sequentially to avoid unique constraint conflicts
  await upsertCategoryWithChildren('Structural & Civil Works', 'Foundation, walls, and structural building services', 1, [
    { name: 'Masonry & Bricklaying', description: 'Brick and block wall construction, repointing, and repairs', sortOrder: 1 },
    { name: 'Plastering & Rendering', description: 'Internal and external plaster, skimming, and rendering', sortOrder: 2 },
    { name: 'Concreting', description: 'Concrete slabs, driveways, paths, and foundations', sortOrder: 3 },
    { name: 'Steel Fixing', description: 'Reinforcing steel and structural steel work', sortOrder: 4 },
    { name: 'Demolition & Excavation', description: 'Controlled demolition, breaking up, and excavation work', sortOrder: 5 },
  ]);
  await upsertCategoryWithChildren('Metal & Fabrication', 'Custom metalwork, welding, and security installations', 2, [
    { name: 'Metalworking & Fabrication', description: 'Custom steel fabrication, frames, and structures', sortOrder: 1 },
    { name: 'Welding', description: 'MIG, TIG, and arc welding for repairs and fabrication', sortOrder: 2 },
    { name: 'Steel Doors & Gates', description: 'Security gates, burglar bars, and steel door installation', sortOrder: 3 },
    { name: 'Aluminium & Glazing', description: 'Aluminium windows, doors, shopfronts, and glass installations', sortOrder: 4 },
  ]);
  await upsertCategoryWithChildren('Roofing & Waterproofing', 'Roof installation, repairs, and waterproofing services', 3, [
    { name: 'Roofing', description: 'Roof tiling, IBR sheeting, thatch, and flat roof installations', sortOrder: 1 },
    { name: 'Waterproofing', description: 'Damp proofing, membrane application, and moisture control', sortOrder: 2 },
    { name: 'Gutters & Fascia', description: 'Gutter installation, replacement, and fascia board repairs', sortOrder: 3 },
  ]);
  await upsertCategoryWithChildren('Plumbing & Wet Works', 'Plumbing, drainage, and bathroom waterproofing', 4, [
    { name: 'Plumbing', description: 'Pipe repairs, fixture installation, and leak repairs', sortOrder: 1 },
    { name: 'Tiling', description: 'Floor and wall tiling for bathrooms, kitchens, and patios', sortOrder: 2 },
    { name: 'Bathroom Waterproofing', description: 'Wet area waterproofing for showers and bathrooms', sortOrder: 3 },
    { name: 'Drainage & Sewerage', description: 'Drain clearing, sewer repairs, and stormwater drainage', sortOrder: 4 },
  ]);
  await upsertCategoryWithChildren('Electrical & Mechanical', 'Electrical installations, solar, HVAC, and gas', 5, [
    { name: 'Electrical', description: 'Wiring, distribution boards, and electrical installations', sortOrder: 1 },
    { name: 'Solar & Renewable Energy', description: 'Solar panel installation, inverters, and battery systems', sortOrder: 2 },
    { name: 'Air Conditioning & HVAC', description: 'AC installation, servicing, and ventilation systems', sortOrder: 3 },
    { name: 'Gas Fitting', description: 'Gas appliance installation, piping, and compliance certificates', sortOrder: 4 },
  ]);
  await upsertCategoryWithChildren('Finishing & Interior', 'Painting, carpentry, flooring, and interior finishing', 6, [
    { name: 'Painting', description: 'Interior and exterior painting, varnishing, and coatings', sortOrder: 1 },
    { name: 'Carpentry & Joinery', description: 'Built-in cupboards, doors, skirting, and custom woodwork', sortOrder: 2 },
    { name: 'Flooring', description: 'Timber, laminate, vinyl, and epoxy floor installation', sortOrder: 3 },
    { name: 'Drywall & Ceilings', description: 'Drywall partitioning, suspended ceilings, and cornices', sortOrder: 4 },
    { name: 'Coving & Cornices', description: 'Decorative coving, cornices, and moulding installation', sortOrder: 5 },
  ]);
  await upsertCategoryWithChildren('Outdoor & Landscaping', 'Paving, pools, garden, and outdoor construction', 7, [
    { name: 'Paving', description: 'Brick paving, concrete paving, and driveway construction', sortOrder: 1 },
    { name: 'Pool Construction & Maintenance', description: 'Swimming pool building, repairs, and maintenance', sortOrder: 2 },
    { name: 'Garden & Landscaping', description: 'Garden design, soft landscaping, and maintenance', sortOrder: 3 },
    { name: 'Tree Services', description: 'Tree felling, trimming, and stump removal', sortOrder: 4 },
    { name: 'Fencing', description: 'Palisade, wooden, and wire fencing installation', sortOrder: 5 },
  ]);
  await upsertCategoryWithChildren('Cleaning & Maintenance', 'Professional cleaning and property maintenance', 8, [
    { name: 'House Cleaning', description: 'Residential cleaning and domestic services', sortOrder: 1 },
    { name: 'Deep Cleaning', description: 'Once-off deep cleans, move-in/out cleaning', sortOrder: 2 },
    { name: 'Carpet & Upholstery Cleaning', description: 'Professional steam and dry carpet cleaning', sortOrder: 3 },
    { name: 'Pressure Washing', description: 'High-pressure cleaning of driveways, walls, and surfaces', sortOrder: 4 },
  ]);
  await upsertCategoryWithChildren('General Handyman', 'Small repairs and general maintenance services', 9, [
    { name: 'Handyman Services', description: 'General repairs, installations, and odd jobs', sortOrder: 1 },
    { name: 'Moving & Heavy Lifting', description: 'Furniture moving, assembly, and heavy lifting assistance', sortOrder: 2 },
  ]);

  const allCategories = await prisma.category.findMany();
  const subcategories = allCategories.filter(c => c.parentId !== null);
  const plumbingCat = subcategories.find(c => c.name === 'Plumbing');
  const electricalCat = subcategories.find(c => c.name === 'Electrical');
  const carpentryCat = subcategories.find(c => c.name === 'Carpentry & Joinery');
  const masonryCat = subcategories.find(c => c.name === 'Masonry & Bricklaying');

  // ── Users ────────────────────────────────────────────────────────────────────
  async function getOrCreateUser(email, data) {
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) user = await prisma.user.create({ data });
    return user;
  }

  console.log('👤 Creating admin user...');
  await getOrCreateUser('admin@taska.co.za', {
    email: 'admin@taska.co.za',
    passwordHash: await bcrypt.hash('Admin123!', 12),
    role: 'ADMIN',
    verifiedAt: new Date(),
    profile: {
      create: {
        firstName: 'System', lastName: 'Administrator',
        phoneNumber: '+27123456789', city: 'Cape Town',
        province: 'Western Cape', isVerified: true,
      },
    },
  });

  console.log('👥 Creating client users...');
  const clients = await Promise.all([
    getOrCreateUser('john.smith@example.com', {
      email: 'john.smith@example.com',
      passwordHash: await bcrypt.hash('Password123!', 12),
      role: 'CLIENT', verifiedAt: new Date(),
      profile: { create: { firstName: 'John', lastName: 'Smith', phoneNumber: '+27821234567', addressLine1: '123 Main Street', city: 'Cape Town', province: 'Western Cape', postalCode: '8001', latitude: -33.9249, longitude: 18.4241, isVerified: true } },
    }),
    getOrCreateUser('sarah.jones@example.com', {
      email: 'sarah.jones@example.com',
      passwordHash: await bcrypt.hash('Password123!', 12),
      role: 'CLIENT', verifiedAt: new Date(),
      profile: { create: { firstName: 'Sarah', lastName: 'Jones', phoneNumber: '+27827654321', addressLine1: '456 Oak Avenue', city: 'Johannesburg', province: 'Gauteng', postalCode: '2001', latitude: -26.2041, longitude: 28.0473, isVerified: true } },
    }),
    getOrCreateUser('mike.brown@example.com', {
      email: 'mike.brown@example.com',
      passwordHash: await bcrypt.hash('Password123!', 12),
      role: 'CLIENT', verifiedAt: new Date(),
      profile: { create: { firstName: 'Mike', lastName: 'Brown', phoneNumber: '+27831112222', addressLine1: '789 Pine Road', city: 'Durban', province: 'KwaZulu-Natal', postalCode: '4001', latitude: -29.8587, longitude: 31.0218, isVerified: true } },
    }),
  ]);

  console.log('🔨 Creating artisan users...');
  const artisans = await Promise.all([
    getOrCreateUser('david.plumber@example.com', {
      email: 'david.plumber@example.com',
      passwordHash: await bcrypt.hash('Password123!', 12),
      role: 'ARTISAN', verifiedAt: new Date(),
      profile: { create: { firstName: 'David', lastName: 'Wilson', phoneNumber: '+27843334444', addressLine1: '321 Water Street', city: 'Cape Town', province: 'Western Cape', postalCode: '8001', latitude: -33.9249, longitude: 18.4241, bio: 'Licensed plumber with 10+ years experience.', isVerified: true } },
      wallet: { create: { balance: 2500.00, totalEarnings: 15000.00 } },
    }),
    getOrCreateUser('lisa.electrician@example.com', {
      email: 'lisa.electrician@example.com',
      passwordHash: await bcrypt.hash('Password123!', 12),
      role: 'ARTISAN', verifiedAt: new Date(),
      profile: { create: { firstName: 'Lisa', lastName: 'Taylor', phoneNumber: '+27855556666', addressLine1: '654 Electric Avenue', city: 'Johannesburg', province: 'Gauteng', postalCode: '2001', latitude: -26.2041, longitude: 28.0473, bio: 'Certified electrician specializing in home installations.', isVerified: true } },
      wallet: { create: { balance: 1800.00, totalEarnings: 12000.00 } },
    }),
    getOrCreateUser('tom.carpenter@example.com', {
      email: 'tom.carpenter@example.com',
      passwordHash: await bcrypt.hash('Password123!', 12),
      role: 'ARTISAN', verifiedAt: new Date(),
      profile: { create: { firstName: 'Tom', lastName: 'Anderson', phoneNumber: '+27867778888', addressLine1: '987 Wood Lane', city: 'Durban', province: 'KwaZulu-Natal', postalCode: '4001', latitude: -29.8587, longitude: 31.0218, bio: 'Master carpenter with expertise in custom furniture.', isVerified: true } },
      wallet: { create: { balance: 3200.00, totalEarnings: 20000.00 } },
    }),
    getOrCreateUser('alex.developer@example.com', {
      email: 'alex.developer@example.com',
      passwordHash: await bcrypt.hash('Password123!', 12),
      role: 'ARTISAN', verifiedAt: new Date(),
      profile: { create: { firstName: 'Alex', lastName: 'Johnson', phoneNumber: '+27879990000', addressLine1: '159 Code Street', city: 'Cape Town', province: 'Western Cape', postalCode: '8001', latitude: -33.9249, longitude: 18.4241, bio: 'Full-stack developer specializing in web applications.', isVerified: true } },
      wallet: { create: { balance: 4500.00, totalEarnings: 35000.00 } },
    }),
  ]);

  // ── Artisan Specializations ──────────────────────────────────────────────────
  if (plumbingCat && electricalCat && carpentryCat && masonryCat) {
    console.log('🎯 Creating artisan specializations...');
    await prisma.artisanSpecialization.createMany({
      skipDuplicates: true,
      data: [
        { userId: artisans[0].id, categoryId: plumbingCat.id, experience: 10, isVerified: true, portfolio: [], certifications: [] },
        { userId: artisans[1].id, categoryId: electricalCat.id, experience: 8, isVerified: true, portfolio: [], certifications: [] },
        { userId: artisans[2].id, categoryId: carpentryCat.id, experience: 15, isVerified: true, portfolio: [], certifications: [] },
        { userId: artisans[3].id, categoryId: masonryCat.id, experience: 6, isVerified: true, portfolio: [], certifications: [] },
      ],
    });
  }

  // ── Sample Jobs ──────────────────────────────────────────────────────────────
  console.log('💼 Creating sample jobs...');
  const jobs = await Promise.all([
    prisma.job.create({ data: {
      clientId: clients[0].id, categoryId: (plumbingCat || subcategories[0]).id,
      title: 'Kitchen Sink Leak Repair', description: 'Kitchen sink has been leaking under the cabinet. Need urgent repair.',
      budget: 800.00, budgetType: 'FIXED', urgency: 'HIGH', status: 'OPEN',
      addressLine1: '123 Main Street', city: 'Cape Town', province: 'Western Cape', postalCode: '8001',
      latitude: -33.9249, longitude: 18.4241, images: [], requirements: ['Must be licensed plumber'],
      startDate: new Date(Date.now() + 2 * 86400000),
    }}),
    prisma.job.create({ data: {
      clientId: clients[1].id, categoryId: (electricalCat || subcategories[1]).id,
      title: 'Install Ceiling Fan in Bedroom', description: 'Need to install a new ceiling fan. Electrical point already exists.',
      budget: 500.00, budgetType: 'FIXED', urgency: 'MEDIUM', status: 'OPEN',
      addressLine1: '456 Oak Avenue', city: 'Johannesburg', province: 'Gauteng', postalCode: '2001',
      latitude: -26.2041, longitude: 28.0473, images: [], requirements: ['COC required'],
      startDate: new Date(Date.now() + 5 * 86400000),
    }}),
    prisma.job.create({ data: {
      clientId: clients[2].id, categoryId: (carpentryCat || subcategories[2]).id,
      title: 'Build Custom Kitchen Cabinets', description: 'Need custom kitchen cabinets built. Measurements and design ready.',
      budget: 15000.00, budgetType: 'NEGOTIABLE', urgency: 'LOW', status: 'OPEN',
      addressLine1: '789 Pine Road', city: 'Durban', province: 'KwaZulu-Natal', postalCode: '4001',
      latitude: -29.8587, longitude: 31.0218, images: [], requirements: ['Portfolio required'],
      startDate: new Date(Date.now() + 14 * 86400000),
    }}),
    prisma.job.create({ data: {
      clientId: clients[0].id, categoryId: (masonryCat || subcategories[3]).id,
      title: 'Build Garden Boundary Wall', description: 'Need a 15m brick boundary wall built around the back garden. Approximately 1.8m high.',
      budget: 18000.00, budgetType: 'FIXED', urgency: 'MEDIUM', status: 'COMPLETED',
      addressLine1: '123 Main Street', city: 'Cape Town', province: 'Western Cape', postalCode: '8001',
      latitude: -33.9249, longitude: 18.4241, images: [], requirements: ['Must supply own tools'],
      startDate: new Date(Date.now() - 30 * 86400000),
      completedAt: new Date(Date.now() - 5 * 86400000),
    }}),
  ]);

  // ── Bids ─────────────────────────────────────────────────────────────────────
  console.log('💰 Creating sample bids...');
  await Promise.all([
    prisma.bid.create({ data: { jobId: jobs[0].id, artisanId: artisans[0].id, amount: 750.00, message: 'I can fix your kitchen sink leak. 10+ years experience.', estimatedDays: 1, attachments: [], expiresAt: new Date(Date.now() + 7 * 86400000) } }),
    prisma.bid.create({ data: { jobId: jobs[1].id, artisanId: artisans[1].id, amount: 450.00, message: 'Professional ceiling fan installation with COC included.', estimatedDays: 1, attachments: [], expiresAt: new Date(Date.now() + 7 * 86400000) } }),
    prisma.bid.create({ data: { jobId: jobs[2].id, artisanId: artisans[2].id, amount: 14500.00, message: 'I specialize in custom kitchen cabinets. 5-year warranty.', estimatedDays: 10, attachments: [], expiresAt: new Date(Date.now() + 7 * 86400000) } }),
    prisma.bid.create({ data: { jobId: jobs[3].id, artisanId: artisans[3].id, amount: 4800.00, message: 'Professional business website, mobile responsive and SEO optimized.', estimatedDays: 7, status: 'ACCEPTED', acceptedAt: new Date(Date.now() - 25 * 86400000), expiresAt: new Date(Date.now() + 7 * 86400000) } }),
  ]);

  // ── Payment & Review ─────────────────────────────────────────────────────────
  console.log('💳 Creating sample payment...');
  await prisma.payment.create({ data: {
    jobId: jobs[3].id, payerId: clients[0].id, payeeId: artisans[3].id,
    amount: 4800.00, platformFee: 600.00, vatAmount: 720.00, totalAmount: 5520.00,
    currency: 'ZAR', paymentMethod: 'CREDIT_CARD', paymentProvider: 'stripe',
    providerTxnId: 'pi_test_1234567890', status: 'COMPLETED', escrowStatus: 'RELEASED',
    paidAt: new Date(Date.now() - 20 * 86400000), releasedAt: new Date(Date.now() - 5 * 86400000),
  }});

  console.log('⭐ Creating sample review...');
  await prisma.review.create({ data: {
    jobId: jobs[3].id, reviewerId: clients[0].id, revieweeId: artisans[3].id,
    rating: 5, qualityRating: 5, timelinessRating: 4, communicationRating: 5, valueRating: 4,
    comment: 'Excellent work! The website looks professional and works perfectly on mobile.',
    images: [], isVerified: true,
  }});

  // ── Notifications ────────────────────────────────────────────────────────────
  console.log('🔔 Creating sample notifications...');
  await prisma.notification.createMany({ data: [
    { userId: clients[0].id, type: 'BID_RECEIVED', title: 'New Bid Received', message: 'David Wilson placed a bid of R750 on your job "Kitchen Sink Leak Repair"', data: { jobId: jobs[0].id, bidAmount: 750 } },
    { userId: artisans[0].id, type: 'JOB_POSTED', title: 'New Job Available', message: 'A new plumbing job has been posted in your area', data: { jobId: jobs[0].id } },
    { userId: artisans[3].id, type: 'PAYMENT_RECEIVED', title: 'Payment Received', message: 'You received R4,800 for completing the website project', data: { amount: 4800 } },
  ]});

  // ── Credit Bundles ───────────────────────────────────────────────────────────
  console.log('💳 Creating credit bundles...');
  await prisma.creditBundle.createMany({
    skipDuplicates: true,
    data: [
      { name: 'Starter', credits: 30, bonusCredits: 0, priceZar: 30.00, isActive: true, isPopular: false, sortOrder: 1, description: 'Perfect for trying out Taska Credits' },
      { name: 'Basic', credits: 50, bonusCredits: 5, priceZar: 50.00, isActive: true, isPopular: false, sortOrder: 2, description: 'Great for occasional bidding' },
      { name: 'Value', credits: 100, bonusCredits: 15, priceZar: 100.00, isActive: true, isPopular: true, sortOrder: 3, description: 'Most popular - best value for regular artisans' },
      { name: 'Pro', credits: 200, bonusCredits: 40, priceZar: 200.00, isActive: true, isPopular: false, sortOrder: 4, description: 'For active artisans who bid frequently' },
      { name: 'Bulk', credits: 500, bonusCredits: 150, priceZar: 500.00, isActive: true, isPopular: false, sortOrder: 5, description: 'Maximum savings for power users' },
    ],
  });

  // ── Level Config ─────────────────────────────────────────────────────────────
  console.log('📊 Creating level configuration...');
  await prisma.levelConfig.createMany({
    skipDuplicates: true,
    data: [
      { level: 'STARTER', displayName: 'Starter 🌱', feePercent: 12.00, minJobsRequired: 0, minRatingRequired: 0.00, minMonthsActive: 0, freeBidsPerMonth: 10, freeBoostsPerMonth: 0, searchBoostPercent: 0, payoutDays: 3, featuredDaysPerMonth: 0, requiresVerification: false, requiresSkillsAssessment: false },
      { level: 'RISING', displayName: 'Rising ⭐', feePercent: 10.00, minJobsRequired: 10, minRatingRequired: 4.00, minMonthsActive: 3, freeBidsPerMonth: 15, freeBoostsPerMonth: 2, searchBoostPercent: 10, payoutDays: 2, featuredDaysPerMonth: 0, requiresVerification: false, requiresSkillsAssessment: false },
      { level: 'EXPERT', displayName: 'Expert 🥈', feePercent: 8.00, minJobsRequired: 25, minRatingRequired: 4.50, minMonthsActive: 6, freeBidsPerMonth: 25, freeBoostsPerMonth: 5, searchBoostPercent: 25, payoutDays: 1, featuredDaysPerMonth: 1, requiresVerification: true, requiresSkillsAssessment: false },
      { level: 'MASTER', displayName: 'Master 🥇', feePercent: 7.00, minJobsRequired: 50, minRatingRequired: 4.80, minMonthsActive: 12, freeBidsPerMonth: 40, freeBoostsPerMonth: 10, searchBoostPercent: 50, payoutDays: 0, featuredDaysPerMonth: 7, requiresVerification: true, requiresSkillsAssessment: true },
      { level: 'LEGEND', displayName: 'Legend 👑', feePercent: 5.00, minJobsRequired: 100, minRatingRequired: 4.90, minMonthsActive: 24, freeBidsPerMonth: 999, freeBoostsPerMonth: 20, searchBoostPercent: 100, payoutDays: 0, featuredDaysPerMonth: 30, requiresVerification: true, requiresSkillsAssessment: true },
    ],
  });

  // ── Loyalty Rewards ──────────────────────────────────────────────────────────
  console.log('🎁 Creating loyalty rewards...');
  await prisma.loyaltyReward.createMany({
    skipDuplicates: true,
    data: [
      { name: '50 Taska Credits', description: 'Convert loyalty points to 50 Taska Credits', pointsCost: 500, rewardType: 'CREDITS', rewardValue: { credits: 50 }, isActive: true, sortOrder: 1 },
      { name: '100 Taska Credits', description: 'Convert loyalty points to 100 Taska Credits', pointsCost: 900, rewardType: 'CREDITS', rewardValue: { credits: 100 }, isActive: true, sortOrder: 2 },
      { name: 'Featured Profile (3 Days)', description: 'Featured at top of search results for 3 days', pointsCost: 750, rewardType: 'FEATURE', rewardValue: { days: 3, type: 'profile' }, isActive: true, sortOrder: 3 },
      { name: 'Featured Profile (7 Days)', description: 'Featured at top of search results for 7 days', pointsCost: 1500, rewardType: 'FEATURE', rewardValue: { days: 7, type: 'profile' }, isActive: true, sortOrder: 4 },
      { name: '1% Fee Reduction (1 Month)', description: 'Reduce platform fee by 1% for one month', pointsCost: 1000, rewardType: 'FEE_DISCOUNT', rewardValue: { discountPercent: 1, durationDays: 30 }, isActive: true, sortOrder: 5 },
      { name: 'Taska Branded T-Shirt', description: 'Official branded t-shirt', pointsCost: 2500, rewardType: 'MERCHANDISE', rewardValue: { item: 'tshirt' }, isActive: true, stockCount: 100, sortOrder: 6 },
      { name: 'R500 Tool Voucher', description: 'R500 voucher for hardware store', pointsCost: 5000, rewardType: 'TOOL_VOUCHER', rewardValue: { amount: 500, currency: 'ZAR' }, isActive: true, stockCount: 50, sortOrder: 7 },
    ],
  });

  // ── Artisan Levels ───────────────────────────────────────────────────────────
  console.log('📈 Creating artisan levels...');
  const now = new Date();
  await Promise.all([
    prisma.artisanLevel.upsert({ where: { userId: artisans[0].id }, update: {}, create: { userId: artisans[0].id, currentLevel: 'RISING', currentFeePercent: 10.00, totalJobsCompleted: 15, totalJobsThisMonth: 3, averageRating: 4.60, totalRatings: 12, responseRate: 92.00, completionRate: 95.00, repeatClientCount: 4, disputesLost: 0, disputesLostLast12m: 0, loyaltyPoints: 1250, lifetimePoints: 2100, freeBidsRemaining: 12, freeBoostsRemaining: 1, allocationResetAt: now, memberSince: new Date(now - 180 * 86400000), levelAchievedAt: new Date(now - 60 * 86400000), isIdentityVerified: true, isSkillsVerified: false, verificationPaidAt: new Date(now - 150 * 86400000) } }),
    prisma.artisanLevel.upsert({ where: { userId: artisans[1].id }, update: {}, create: { userId: artisans[1].id, currentLevel: 'EXPERT', currentFeePercent: 8.00, totalJobsCompleted: 32, totalJobsThisMonth: 5, averageRating: 4.75, totalRatings: 28, responseRate: 96.00, completionRate: 98.00, repeatClientCount: 8, disputesLost: 0, disputesLostLast12m: 0, loyaltyPoints: 3200, lifetimePoints: 5500, freeBidsRemaining: 20, freeBoostsRemaining: 3, allocationResetAt: now, memberSince: new Date(now - 365 * 86400000), levelAchievedAt: new Date(now - 30 * 86400000), isIdentityVerified: true, isSkillsVerified: true, verificationPaidAt: new Date(now - 300 * 86400000), skillsAssessedAt: new Date(now - 90 * 86400000) } }),
    prisma.artisanLevel.upsert({ where: { userId: artisans[2].id }, update: {}, create: { userId: artisans[2].id, currentLevel: 'MASTER', currentFeePercent: 7.00, totalJobsCompleted: 58, totalJobsThisMonth: 4, averageRating: 4.85, totalRatings: 52, responseRate: 98.00, completionRate: 100.00, repeatClientCount: 15, disputesLost: 1, disputesLostLast12m: 0, loyaltyPoints: 6500, lifetimePoints: 12000, freeBidsRemaining: 35, freeBoostsRemaining: 8, allocationResetAt: now, memberSince: new Date(now - 540 * 86400000), levelAchievedAt: new Date(now - 45 * 86400000), isIdentityVerified: true, isSkillsVerified: true, verificationPaidAt: new Date(now - 500 * 86400000), skillsAssessedAt: new Date(now - 120 * 86400000) } }),
    prisma.artisanLevel.upsert({ where: { userId: artisans[3].id }, update: {}, create: { userId: artisans[3].id, currentLevel: 'STARTER', currentFeePercent: 12.00, totalJobsCompleted: 1, totalJobsThisMonth: 1, averageRating: 5.00, totalRatings: 1, responseRate: 100.00, completionRate: 100.00, repeatClientCount: 0, disputesLost: 0, disputesLostLast12m: 0, loyaltyPoints: 175, lifetimePoints: 175, freeBidsRemaining: 8, freeBoostsRemaining: 0, allocationResetAt: now, memberSince: new Date(now - 45 * 86400000), levelAchievedAt: new Date(now - 45 * 86400000), isIdentityVerified: false, isSkillsVerified: false } }),
  ]);

  // ── Credit Wallets ───────────────────────────────────────────────────────────
  console.log('💰 Creating credit wallets...');
  await Promise.all([
    prisma.creditWallet.upsert({ where: { userId: artisans[0].id }, update: {}, create: { userId: artisans[0].id, balance: 45, lifetimeCredits: 200, lifetimeSpent: 155, autoTopUpEnabled: false } }),
    prisma.creditWallet.upsert({ where: { userId: artisans[1].id }, update: {}, create: { userId: artisans[1].id, balance: 120, lifetimeCredits: 350, lifetimeSpent: 230, autoTopUpEnabled: true, autoTopUpThreshold: 20, autoTopUpAmount: 100, autoTopUpSource: 'WALLET' } }),
    prisma.creditWallet.upsert({ where: { userId: artisans[2].id }, update: {}, create: { userId: artisans[2].id, balance: 85, lifetimeCredits: 500, lifetimeSpent: 415, autoTopUpEnabled: true, autoTopUpThreshold: 30, autoTopUpAmount: 200, autoTopUpSource: 'WALLET' } }),
    prisma.creditWallet.upsert({ where: { userId: artisans[3].id }, update: {}, create: { userId: artisans[3].id, balance: 25, lifetimeCredits: 30, lifetimeSpent: 5, autoTopUpEnabled: false } }),
  ]);

  // ── Loyalty Transactions ─────────────────────────────────────────────────────
  console.log('🏆 Creating sample loyalty transactions...');
  await prisma.loyaltyTransaction.createMany({
    skipDuplicates: true,
    data: [
      { userId: artisans[3].id, action: 'JOB_COMPLETED', points: 100, balance: 100, reference: jobs[3].id, description: 'Completed job: Simple Business Website' },
      { userId: artisans[3].id, action: 'FIVE_STAR_REVIEW', points: 50, balance: 150, reference: jobs[3].id, description: 'Received 5-star review for Simple Business Website' },
      { userId: artisans[3].id, action: 'PROFILE_COMPLETE', points: 25, balance: 175, description: 'Completed profile setup' },
    ],
  });

  // ── Summary ──────────────────────────────────────────────────────────────────
  const [userCount, categoryCount, jobCount, bidCount, paymentCount] = await Promise.all([
    prisma.user.count(), prisma.category.count(), prisma.job.count(),
    prisma.bid.count(), prisma.payment.count(),
  ]);
  console.log(`✅ Database seeding completed!\n  Users: ${userCount}\n  Categories: ${categoryCount}\n  Jobs: ${jobCount}\n  Bids: ${bidCount}\n  Payments: ${paymentCount}`);
}

main()
  .catch((e) => { console.error('❌ Seeding error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
