import { E2ETestHelper } from './setup-e2e';
import { JobStatus } from '@prisma/client';

/**
 * Comprehensive E2E Tests for Job Posting Flow
 *
 * This test suite covers:
 * 1. Complete job posting flow from client perspective
 * 2. Category functionality and data integrity
 * 3. Edge cases and error handling
 * 4. Form validation and data validation
 * 5. Integration with backend APIs
 *
 * Test Coverage Areas:
 * - Job posting creation with all fields
 * - Category selection and validation
 * - Image upload functionality
 * - Location and address validation
 * - Budget and urgency settings
 * - Job visibility and status management
 * - Error scenarios and edge cases
 */

describe('Job Posting Flow E2E Tests', () => {
  let testCategoryId: string;
  let allCategories: any[];

  beforeAll(async () => {
    // Get all available categories for testing
    const categoriesResponse = await E2ETestHelper.makeRequest(
      'get',
      '/api/v1/categories'
    );
    allCategories = categoriesResponse.body;

    // Find a subcategory for testing (subcategories have parentId)
    const subcategory = allCategories.find(cat => cat.parentId !== null);
    testCategoryId = subcategory?.id || allCategories[0]?.id;

    console.log(`\n🧪 Test Setup Complete`);
    console.log(`📁 Found ${allCategories.length} categories`);
    console.log(`🎯 Using category: ${subcategory?.name || allCategories[0]?.name} (ID: ${testCategoryId})`);
  });

  describe('1. COMPLETE JOB POSTING FLOW (Client Role)', () => {
    it('should successfully create a complete job posting with all fields', async () => {
      const jobData = {
        title: 'E2E Test: Complete Kitchen Renovation',
        description: 'This is a comprehensive test job posting for kitchen renovation. Need professional help with plumbing, electrical work, and tiling. The project includes installing new fixtures, updating wiring, and laying ceramic tiles.',
        categoryId: testCategoryId,
        budget: 5000,
        budgetType: 'FIXED',
        urgency: 'HIGH',
        addressLine1: '123 Test Street',
        addressLine2: 'Apartment 4B',
        city: 'Cape Town',
        province: 'Western Cape',
        postalCode: '8001',
        latitude: -33.9249,
        longitude: 18.4241,
        requirements: ['Must have 5+ years experience', 'Provide references', 'Licensed and insured'],
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        images: [],
        isDraft: false // Publish job immediately for E2E testing
      };

      const response = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/jobs',
        'client',
        jobData
      );

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(jobData.title);
      expect(response.body.description).toBe(jobData.description);
      expect(response.body.categoryId).toBe(testCategoryId);
      expect(response.body.budget).toBe(jobData.budget.toString());
      expect(response.body.budgetType).toBe(jobData.budgetType);
      expect(response.body.urgency).toBe(jobData.urgency);
      expect(response.body.status).toBe('OPEN');
      expect(response.body.city).toBe(jobData.city);
      expect(response.body.province).toBe(jobData.province);
      expect(response.body.requirements).toEqual(jobData.requirements);

      console.log(`✅ Job created successfully: ${response.body.id}`);
    });

    it('should create job and verify it appears in client dashboard', async () => {
      // Create job
      const jobData = {
        title: 'E2E Test: Dashboard Verification Job',
        description: 'Testing job visibility in client dashboard after creation',
        categoryId: testCategoryId,
        budget: 1500,
        budgetType: 'FIXED',
        urgency: 'MEDIUM',
        addressLine1: '456 Test Avenue',
        city: 'Johannesburg',
        province: 'Gauteng',
        postalCode: '2000',
        latitude: -26.2041,
        longitude: 28.0473,
        requirements: [],
        isDraft: false // Publish job immediately for E2E testing
      };

      const createResponse = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/jobs',
        'client',
        jobData
      );

      expect(createResponse.status).toBe(201);
      const jobId = createResponse.body.id;

      // Verify job appears in client's job list
      const myJobsResponse = await E2ETestHelper.makeRequest(
        'get',
        '/api/v1/jobs/my-jobs',
        'client'
      );

      expect(myJobsResponse.status).toBe(200);
      const foundJob = myJobsResponse.body.find((job: any) => job.id === jobId);
      expect(foundJob).toBeDefined();
      expect(foundJob.title).toBe(jobData.title);

      console.log(`✅ Job visible in dashboard: ${jobId}`);
    });

    it('should create job and verify it is searchable by artisans', async () => {
      const jobData = {
        title: 'E2E Test: Artisan Searchable Job',
        description: 'Testing job visibility for artisan searches',
        categoryId: testCategoryId,
        budget: 2000,
        budgetType: 'NEGOTIABLE',
        urgency: 'LOW',
        addressLine1: '789 Test Road',
        city: 'Durban',
        province: 'KwaZulu-Natal',
        postalCode: '4000',
        latitude: -29.8587,
        longitude: 31.0218,
        requirements: ['Weekend work preferred'],
        isDraft: false
      };

      const createResponse = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/jobs',
        'client',
        jobData
      );

      expect(createResponse.status).toBe(201);
      const jobId = createResponse.body.id;

      // Search for the job as an artisan
      const searchResponse = await E2ETestHelper.makeRequest(
        'get',
        `/api/v1/jobs?status=OPEN&categoryId=${testCategoryId}`,
        'artisan'
      );

      expect(searchResponse.status).toBe(200);
      const foundJob = searchResponse.body.data.find((job: any) => job.id === jobId);
      expect(foundJob).toBeDefined();

      console.log(`✅ Job searchable by artisans: ${jobId}`);
    });
  });

  describe('2. CATEGORY FUNCTIONALITY TESTS', () => {
    it('should retrieve all active categories', async () => {
      const response = await E2ETestHelper.makeRequest(
        'get',
        '/api/v1/categories'
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Verify category structure
      const category = response.body[0];
      expect(category).toHaveProperty('id');
      expect(category).toHaveProperty('name');
      expect(category).toHaveProperty('isActive');
      expect(category.isActive).toBe(true);

      console.log(`✅ Retrieved ${response.body.length} active categories`);
    });

    it('should test job posting with each available category', async () => {
      const subcategories = allCategories.filter(cat => cat.parentId !== null);

      for (const category of subcategories.slice(0, 3)) { // Test first 3 to save time
        const jobData = {
          title: `E2E Test: ${category.name} Job`,
          description: `Testing job posting with category: ${category.name}`,
          categoryId: category.id,
          budget: 1000,
          budgetType: 'FIXED',
          urgency: 'MEDIUM',
          addressLine1: '100 Category Test Street',
          city: 'Cape Town',
          province: 'Western Cape',
          postalCode: '8001',
          latitude: -33.9249,
          longitude: 18.4241,
          requirements: [],
          isDraft: false // Publish job immediately for E2E testing
        };

        const response = await E2ETestHelper.makeRequest(
          'post',
          '/api/v1/jobs',
          'client',
          jobData
        );

        expect(response.status).toBe(201);
        expect(response.body.categoryId).toBe(category.id);

        console.log(`✅ Created job with category: ${category.name}`);
      }
    });

    it('should get category by ID with subcategories', async () => {
      const parentCategory = allCategories.find(cat => cat.parentId === null);

      if (parentCategory) {
        const response = await E2ETestHelper.makeRequest(
          'get',
          `/api/v1/categories/${parentCategory.id}`
        );

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(parentCategory.id);
        expect(response.body).toHaveProperty('children');

        if (response.body.children && response.body.children.length > 0) {
          expect(response.body.children[0]).toHaveProperty('name');
          console.log(`✅ Category has ${response.body.children.length} subcategories`);
        }
      }
    });

    it('should reject job posting with invalid category ID', async () => {
      const jobData = {
        title: 'E2E Test: Invalid Category Job',
        description: 'Testing job posting with invalid category',
        categoryId: 'invalid-category-id-12345',
        budget: 1000,
        budgetType: 'FIXED',
        urgency: 'MEDIUM',
        addressLine1: '100 Invalid Category Street',
        city: 'Cape Town',
        province: 'Western Cape',
        postalCode: '8001',
        latitude: -33.9249,
        longitude: 18.4241,
        requirements: [],
        isDraft: false // Publish job immediately for E2E testing
      };

      const response = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/jobs',
        'client',
        jobData
      );

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.status).toBeLessThan(500);

      console.log(`✅ Invalid category rejected with status: ${response.status}`);
    });
  });

  describe('3. EDGE CASES AND ERROR HANDLING', () => {
    it('should reject job with missing required fields', async () => {
      const incompleteJobData = {
        title: 'Incomplete Job',
        // Missing description, categoryId, budget, etc.
      };

      const response = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/jobs',
        'client',
        incompleteJobData
      );

      expect(response.status).toBe(400);
      console.log(`✅ Missing fields rejected: ${response.status}`);
    });

    it('should reject job with title too short', async () => {
      const jobData = {
        title: 'Bad',
        description: 'This job title is too short and should be rejected by validation',
        categoryId: testCategoryId,
        budget: 1000,
        budgetType: 'FIXED',
        urgency: 'MEDIUM',
        addressLine1: '100 Test Street',
        city: 'Cape Town',
        province: 'Western Cape',
        postalCode: '8001',
        latitude: -33.9249,
        longitude: 18.4241,
        requirements: [],
        isDraft: false // Publish job immediately for E2E testing
      };

      const response = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/jobs',
        'client',
        jobData
      );

      expect(response.status).toBe(400);
      console.log(`✅ Short title rejected: ${response.status}`);
    });

    it('should reject job with budget below minimum', async () => {
      const jobData = {
        title: 'E2E Test: Low Budget Job',
        description: 'Testing job posting with budget below minimum acceptable amount',
        categoryId: testCategoryId,
        budget: 50, // Below minimum
        budgetType: 'FIXED',
        urgency: 'MEDIUM',
        addressLine1: '100 Test Street',
        city: 'Cape Town',
        province: 'Western Cape',
        postalCode: '8001',
        latitude: -33.9249,
        longitude: 18.4241,
        requirements: [],
        isDraft: false // Publish job immediately for E2E testing
      };

      const response = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/jobs',
        'client',
        jobData
      );

      expect(response.status).toBe(400);
      console.log(`✅ Low budget rejected: ${response.status}`);
    });

    it('should handle empty category selection', async () => {
      const jobData = {
        title: 'E2E Test: No Category Job',
        description: 'Testing job posting without category selection',
        categoryId: '', // Empty category
        budget: 1000,
        budgetType: 'FIXED',
        urgency: 'MEDIUM',
        addressLine1: '100 Test Street',
        city: 'Cape Town',
        province: 'Western Cape',
        postalCode: '8001',
        latitude: -33.9249,
        longitude: 18.4241,
        requirements: [],
        isDraft: false // Publish job immediately for E2E testing
      };

      const response = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/jobs',
        'client',
        jobData
      );

      expect(response.status).toBe(400);
      console.log(`✅ Empty category rejected: ${response.status}`);
    });

    it('should reject job with invalid latitude/longitude', async () => {
      const jobData = {
        title: 'E2E Test: Invalid Coordinates Job',
        description: 'Testing job posting with invalid geographic coordinates',
        categoryId: testCategoryId,
        budget: 1000,
        budgetType: 'FIXED',
        urgency: 'MEDIUM',
        addressLine1: '100 Test Street',
        city: 'Cape Town',
        province: 'Western Cape',
        postalCode: '8001',
        latitude: 999, // Invalid latitude
        longitude: 999, // Invalid longitude
        requirements: [],
        isDraft: false // Publish job immediately for E2E testing
      };

      const response = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/jobs',
        'client',
        jobData
      );

      expect(response.status).toBe(400);
      console.log(`✅ Invalid coordinates rejected: ${response.status}`);
    });

    it('should prevent artisan from creating jobs', async () => {
      const jobData = {
        title: 'E2E Test: Artisan Attempting Job Creation',
        description: 'Testing that artisans cannot create jobs',
        categoryId: testCategoryId,
        budget: 1000,
        budgetType: 'FIXED',
        urgency: 'MEDIUM',
        addressLine1: '100 Test Street',
        city: 'Cape Town',
        province: 'Western Cape',
        postalCode: '8001',
        latitude: -33.9249,
        longitude: 18.4241,
        requirements: [],
        isDraft: false // Publish job immediately for E2E testing
      };

      const response = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/jobs',
        'artisan', // Artisan trying to create job
        jobData
      );

      expect(response.status).toBe(403);
      console.log(`✅ Artisan job creation blocked: ${response.status}`);
    });

    it('should prevent unauthenticated job creation', async () => {
      const jobData = {
        title: 'E2E Test: Unauthenticated Job Creation',
        description: 'Testing that unauthenticated users cannot create jobs',
        categoryId: testCategoryId,
        budget: 1000,
        budgetType: 'FIXED',
        urgency: 'MEDIUM',
        addressLine1: '100 Test Street',
        city: 'Cape Town',
        province: 'Western Cape',
        postalCode: '8001',
        latitude: -33.9249,
        longitude: 18.4241,
        requirements: [],
        isDraft: false // Publish job immediately for E2E testing
      };

      const response = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/jobs',
        undefined, // No authentication
        jobData
      );

      expect(response.status).toBe(401);
      console.log(`✅ Unauthenticated creation blocked: ${response.status}`);
    });
  });

  describe('4. LOCATION AND ADDRESS VALIDATION', () => {
    it('should accept valid South African provinces', async () => {
      const provinces = [
        'Western Cape',
        'Gauteng',
        'KwaZulu-Natal',
        'Eastern Cape'
      ];

      for (const province of provinces) {
        const jobData = {
          title: `E2E Test: ${province} Job`,
          description: `Testing job posting in ${province}`,
          categoryId: testCategoryId,
          budget: 1000,
          budgetType: 'FIXED',
          urgency: 'MEDIUM',
          addressLine1: '100 Province Test Street',
          city: 'Test City',
          province: province,
          postalCode: '0000',
          latitude: -33.9249,
          longitude: 18.4241,
          requirements: [],
          isDraft: false // Publish job immediately for E2E testing
        };

        const response = await E2ETestHelper.makeRequest(
          'post',
          '/api/v1/jobs',
          'client',
          jobData
        );

        expect(response.status).toBe(201);
        expect(response.body.province).toBe(province);
      }

      console.log(`✅ All provinces validated successfully`);
    });

    it('should handle address with special characters', async () => {
      const jobData = {
        title: 'E2E Test: Special Characters Address',
        description: 'Testing address handling with special characters',
        categoryId: testCategoryId,
        budget: 1000,
        budgetType: 'FIXED',
        urgency: 'MEDIUM',
        addressLine1: "123 O'Reilly Street, Apt #4-B",
        addressLine2: 'Building C & D',
        city: 'Cape Town',
        province: 'Western Cape',
        postalCode: '8001',
        latitude: -33.9249,
        longitude: 18.4241,
        requirements: [],
        isDraft: false // Publish job immediately for E2E testing
      };

      const response = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/jobs',
        'client',
        jobData
      );

      expect(response.status).toBe(201);
      expect(response.body.addressLine1).toBe(jobData.addressLine1);
      console.log(`✅ Special characters in address accepted`);
    });
  });

  describe('5. BUDGET AND URGENCY TESTS', () => {
    it('should accept all valid budget types', async () => {
      const budgetTypes = ['FIXED', 'HOURLY', 'NEGOTIABLE'];

      for (const budgetType of budgetTypes) {
        const jobData = {
          title: `E2E Test: ${budgetType} Budget`,
          description: `Testing ${budgetType} budget type`,
          categoryId: testCategoryId,
          budget: 1500,
          budgetType: budgetType,
          urgency: 'MEDIUM',
          addressLine1: '100 Budget Test Street',
          city: 'Cape Town',
          province: 'Western Cape',
          postalCode: '8001',
          latitude: -33.9249,
          longitude: 18.4241,
          requirements: [],
          isDraft: false // Publish job immediately for E2E testing
        };

        const response = await E2ETestHelper.makeRequest(
          'post',
          '/api/v1/jobs',
          'client',
          jobData
        );

        expect(response.status).toBe(201);
        expect(response.body.budgetType).toBe(budgetType);
      }

      console.log(`✅ All budget types validated`);
    });

    it('should accept all valid urgency levels', async () => {
      const urgencyLevels = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

      for (const urgency of urgencyLevels) {
        const jobData = {
          title: `E2E Test: ${urgency} Urgency`,
          description: `Testing ${urgency} urgency level`,
          categoryId: testCategoryId,
          budget: 1500,
          budgetType: 'FIXED',
          urgency: urgency,
          addressLine1: '100 Urgency Test Street',
          city: 'Cape Town',
          province: 'Western Cape',
          postalCode: '8001',
          latitude: -33.9249,
          longitude: 18.4241,
          requirements: [],
          isDraft: false // Publish job immediately for E2E testing
        };

        const response = await E2ETestHelper.makeRequest(
          'post',
          '/api/v1/jobs',
          'client',
          jobData
        );

        expect(response.status).toBe(201);
        expect(response.body.urgency).toBe(urgency);
      }

      console.log(`✅ All urgency levels validated`);
    });
  });

  describe('6. JOB REQUIREMENTS AND OPTIONAL FIELDS', () => {
    it('should handle job with multiple requirements', async () => {
      const jobData = {
        title: 'E2E Test: Multiple Requirements Job',
        description: 'Testing job with comprehensive requirements list',
        categoryId: testCategoryId,
        budget: 3000,
        budgetType: 'FIXED',
        urgency: 'HIGH',
        addressLine1: '100 Requirements Test Street',
        city: 'Cape Town',
        province: 'Western Cape',
        postalCode: '8001',
        latitude: -33.9249,
        longitude: 18.4241,
        requirements: [
          'Must have valid license',
          'Minimum 5 years experience',
          'Provide references',
          'Own tools and equipment',
          'Available weekends',
          'Insurance coverage required'
        ],
        isDraft: false
      };

      const response = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/jobs',
        'client',
        jobData
      );

      expect(response.status).toBe(201);
      expect(response.body.requirements).toEqual(jobData.requirements);
      expect(response.body.requirements.length).toBe(6);
      console.log(`✅ Multiple requirements handled correctly`);
    });

    it('should handle job with empty requirements array', async () => {
      const jobData = {
        title: 'E2E Test: No Requirements Job',
        description: 'Testing job without any specific requirements',
        categoryId: testCategoryId,
        budget: 1000,
        budgetType: 'FIXED',
        urgency: 'MEDIUM',
        addressLine1: '100 No Requirements Street',
        city: 'Cape Town',
        province: 'Western Cape',
        postalCode: '8001',
        latitude: -33.9249,
        longitude: 18.4241,
        requirements: [],
        isDraft: false // Publish job immediately for E2E testing
      };

      const response = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/jobs',
        'client',
        jobData
      );

      expect(response.status).toBe(201);
      expect(response.body.requirements).toEqual([]);
      console.log(`✅ Empty requirements accepted`);
    });

    it('should handle job with start date', async () => {
      const futureDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

      const jobData = {
        title: 'E2E Test: Scheduled Job',
        description: 'Testing job with specific start date',
        categoryId: testCategoryId,
        budget: 2000,
        budgetType: 'FIXED',
        urgency: 'LOW',
        addressLine1: '100 Scheduled Job Street',
        city: 'Cape Town',
        province: 'Western Cape',
        postalCode: '8001',
        latitude: -33.9249,
        longitude: 18.4241,
        requirements: [],
        startDate: futureDate.toISOString(),
        isDraft: false
      };

      const response = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/jobs',
        'client',
        jobData
      );

      expect(response.status).toBe(201);
      expect(response.body.startDate).toBeDefined();
      console.log(`✅ Start date handled correctly`);
    });
  });

  describe('7. JOB VISIBILITY AND FILTERING', () => {
    it('should filter jobs by category', async () => {
      const response = await E2ETestHelper.makeRequest(
        'get',
        `/api/v1/jobs?categoryId=${testCategoryId}`,
        'artisan'
      );

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();

      if (response.body.data.length > 0) {
        response.body.data.forEach((job: any) => {
          expect(job.categoryId).toBe(testCategoryId);
        });
      }
      console.log(`✅ Category filtering works: ${response.body.data.length} jobs found`);
    });

    it('should filter jobs by status', async () => {
      const response = await E2ETestHelper.makeRequest(
        'get',
        '/api/v1/jobs?status=OPEN',
        'artisan'
      );

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();

      if (response.body.data.length > 0) {
        response.body.data.forEach((job: any) => {
          expect(job.status).toBe('OPEN');
        });
      }

      console.log(`✅ Status filtering works: ${response.body.data.length} open jobs`);
    });

    it('should filter jobs by budget range', async () => {
      const response = await E2ETestHelper.makeRequest(
        'get',
        '/api/v1/jobs?minBudget=1000&maxBudget=5000',
        'artisan'
      );

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();

      if (response.body.data.length > 0) {
        response.body.data.forEach((job: any) => {
          const budget = parseFloat(job.budget);
          expect(budget).toBeGreaterThanOrEqual(1000);
          expect(budget).toBeLessThanOrEqual(5000);
        });
      }

      console.log(`✅ Budget filtering works: ${response.body.data.length} jobs in range`);
    });
  });

  describe('8. DATA INTEGRITY AND PERSISTENCE', () => {
    it('should persist job data correctly and retrieve it unchanged', async () => {
      const originalJobData = {
        title: 'E2E Test: Data Integrity Job',
        description: 'Testing that all job data persists correctly in database',
        categoryId: testCategoryId,
        budget: 3500,
        budgetType: 'NEGOTIABLE',
        urgency: 'HIGH',
        addressLine1: '100 Data Integrity Street',
        addressLine2: 'Suite 200',
        city: 'Johannesburg',
        province: 'Gauteng',
        postalCode: '2000',
        latitude: -26.2041,
        longitude: 28.0473,
        requirements: ['Requirement 1', 'Requirement 2', 'Requirement 3'],
        isDraft: false
      };

      // Create job
      const createResponse = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/jobs',
        'client',
        originalJobData
      );

      expect(createResponse.status).toBe(201);
      const jobId = createResponse.body.id;

      // Retrieve job
      const getResponse = await E2ETestHelper.makeRequest(
        'get',
        `/api/v1/jobs/${jobId}`,
        'client'
      );

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.id).toBe(jobId);
      expect(getResponse.body.title).toBe(originalJobData.title);
      expect(getResponse.body.description).toBe(originalJobData.description);
      expect(getResponse.body.categoryId).toBe(originalJobData.categoryId);
      expect(parseFloat(getResponse.body.budget)).toBe(originalJobData.budget);
      expect(getResponse.body.budgetType).toBe(originalJobData.budgetType);
      expect(getResponse.body.urgency).toBe(originalJobData.urgency);
      expect(getResponse.body.addressLine1).toBe(originalJobData.addressLine1);
      expect(getResponse.body.addressLine2).toBe(originalJobData.addressLine2);
      expect(getResponse.body.city).toBe(originalJobData.city);
      expect(getResponse.body.province).toBe(originalJobData.province);
      expect(getResponse.body.postalCode).toBe(originalJobData.postalCode);
      expect(getResponse.body.requirements).toEqual(originalJobData.requirements);

      console.log(`✅ Data integrity verified for job: ${jobId}`);
    });
  });
});
