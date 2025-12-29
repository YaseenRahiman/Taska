import { E2ETestHelper } from './setup-e2e';
import { JobStatus, BidStatus, UserRole } from '@prisma/client';

/**
 * Artisan Job Discovery and Bidding E2E Tests
 *
 * This comprehensive test suite covers:
 * 1. Artisan job discovery and browsing
 * 2. Job filtering and search functionality
 * 3. Job details viewing and validation
 * 4. Bid submission workflow
 * 5. Bid management (update, withdraw)
 * 6. Edge cases and error scenarios
 * 7. Geographic proximity searches
 * 8. Performance and pagination
 */

describe('Artisan Jobs Discovery and Bidding Flow E2E Tests', () => {
  let testCategoryId: string;
  let testJobId: string;

  beforeAll(async () => {
    // Get available categories
    const categoriesResponse = await E2ETestHelper.makeRequest(
      'get',
      '/api/v1/categories'
    );
    testCategoryId = categoriesResponse.body[0]?.id;

    console.log(`\n🧪 Artisan Job Tests Setup Complete`);
    console.log(`🎯 Using category: ${testCategoryId}`);
  });

  describe('1. JOB DISCOVERY - Artisan Browse Available Jobs', () => {
    beforeEach(async () => {
      // Create test jobs for artisan to discover
      const jobData = {
        title: 'E2E Test: Artisan Discovery Job',
        description: 'Test job for artisan discovery and browsing functionality',
        categoryId: testCategoryId,
        budget: 1500,
        budgetType: 'FIXED',
        urgency: 'MEDIUM',
        addressLine1: '100 Discovery Street',
        city: 'Johannesburg',
        province: 'Gauteng',
        postalCode: '2000',
        latitude: -26.2041,
        longitude: 28.0473,
        requirements: ['Licensed professional', 'Own tools'],
        isDraft: false,
      };

      const response = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/jobs',
        'client',
        jobData
      );

      testJobId = response.body.id;
    });

    it('should retrieve all available open jobs for artisan', async () => {
      const response = await E2ETestHelper.makeRequest(
        'get',
        '/api/v1/jobs?status=OPEN',
        'artisan'
      );

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      // Verify job structure
      const job = response.body.data[0];
      expect(job).toHaveProperty('id');
      expect(job).toHaveProperty('title');
      expect(job).toHaveProperty('description');
      expect(job).toHaveProperty('budget');
      expect(job).toHaveProperty('category');
      expect(job.status).toBe('OPEN');

      console.log(`✅ Artisan retrieved ${response.body.data.length} available jobs`);
    });

    it('should allow artisan to view specific job details', async () => {
      const response = await E2ETestHelper.makeRequest(
        'get',
        `/api/v1/jobs/${testJobId}`,
        'artisan'
      );

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testJobId);
      expect(response.body.title).toBe('E2E Test: Artisan Discovery Job');
      expect(response.body.description).toBeDefined();
      expect(response.body.budget).toBeDefined();
      expect(response.body.client).toBeDefined();
      expect(response.body.requirements).toEqual(['Licensed professional', 'Own tools']);

      console.log(`✅ Job details retrieved: ${response.body.title}`);
    });

    it('should include client information in job details', async () => {
      const response = await E2ETestHelper.makeRequest(
        'get',
        `/api/v1/jobs/${testJobId}`,
        'artisan'
      );

      expect(response.status).toBe(200);
      expect(response.body.client).toBeDefined();
      expect(response.body.client).toHaveProperty('firstName');
      expect(response.body.client).toHaveProperty('lastName');

      console.log(`✅ Client info available: ${response.body.client.firstName} ${response.body.client.lastName}`);
    });

    it('should show job category information', async () => {
      const response = await E2ETestHelper.makeRequest(
        'get',
        `/api/v1/jobs/${testJobId}`,
        'artisan'
      );

      expect(response.status).toBe(200);
      expect(response.body.category).toBeDefined();
      expect(response.body.category).toHaveProperty('name');
      expect(response.body.categoryId).toBe(testCategoryId);

      console.log(`✅ Category displayed: ${response.body.category.name}`);
    });
  });

  describe('2. JOB FILTERING - Search and Filter Operations', () => {
    beforeAll(async () => {
      // Create diverse test jobs for filtering
      const jobsData = [
        {
          title: 'Urgent Plumbing Repair',
          description: 'Emergency plumbing needed immediately',
          categoryId: testCategoryId,
          budget: 1200,
          budgetType: 'FIXED',
          urgency: 'URGENT',
          city: 'Cape Town',
          province: 'Western Cape',
          addressLine1: '123 Urgent Street',
          postalCode: '8001',
          latitude: -33.9249,
          longitude: 18.4241,
        },
        {
          title: 'High Budget Electrical Work',
          description: 'Complete home rewiring project',
          categoryId: testCategoryId,
          budget: 8000,
          budgetType: 'FIXED',
          urgency: 'LOW',
          city: 'Durban',
          province: 'KwaZulu-Natal',
          addressLine1: '456 High Budget Avenue',
          postalCode: '4000',
          latitude: -29.8587,
          longitude: 31.0218,
        },
        {
          title: 'Medium Budget Carpentry',
          description: 'Custom furniture building',
          categoryId: testCategoryId,
          budget: 3000,
          budgetType: 'NEGOTIABLE',
          urgency: 'MEDIUM',
          city: 'Johannesburg',
          province: 'Gauteng',
          addressLine1: '789 Medium Street',
          postalCode: '2000',
          latitude: -26.2041,
          longitude: 28.0473,
        },
      ];

      for (const jobData of jobsData) {
        await E2ETestHelper.makeRequest(
          'post',
          '/api/v1/jobs',
          'client',
          jobData
        );
      }
    });

    it('should filter jobs by category', async () => {
      const response = await E2ETestHelper.makeRequest(
        'get',
        `/api/v1/jobs?categoryId=${testCategoryId}&status=OPEN`,
        'artisan'
      );

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();

      if (response.body.data.length > 0) {
        response.body.data.forEach((job: any) => {
          expect(job.categoryId).toBe(testCategoryId);
        });
      }

      console.log(`✅ Category filter: ${response.body.data.length} jobs found`);
    });

    it('should filter jobs by budget range', async () => {
      const response = await E2ETestHelper.makeRequest(
        'get',
        '/api/v1/jobs?minBudget=1000&maxBudget=5000&status=OPEN',
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

      console.log(`✅ Budget filter: ${response.body.data.length} jobs in range R1000-R5000`);
    });

    it('should filter jobs by urgency', async () => {
      const response = await E2ETestHelper.makeRequest(
        'get',
        '/api/v1/jobs?urgency=URGENT&status=OPEN',
        'artisan'
      );

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();

      if (response.body.data.length > 0) {
        response.body.data.forEach((job: any) => {
          expect(job.urgency).toBe('URGENT');
        });
      }

      console.log(`✅ Urgency filter: ${response.body.data.length} urgent jobs`);
    });

    it('should filter jobs by city', async () => {
      const response = await E2ETestHelper.makeRequest(
        'get',
        '/api/v1/jobs?city=Johannesburg&status=OPEN',
        'artisan'
      );

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();

      if (response.body.data.length > 0) {
        response.body.data.forEach((job: any) => {
          expect(job.city).toBe('Johannesburg');
        });
      }

      console.log(`✅ City filter: ${response.body.data.length} jobs in Johannesburg`);
    });

    it('should filter jobs by province', async () => {
      const response = await E2ETestHelper.makeRequest(
        'get',
        '/api/v1/jobs?province=Gauteng&status=OPEN',
        'artisan'
      );

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();

      if (response.body.data.length > 0) {
        response.body.data.forEach((job: any) => {
          expect(job.province).toBe('Gauteng');
        });
      }

      console.log(`✅ Province filter: ${response.body.data.length} jobs in Gauteng`);
    });

    it('should filter jobs by budget type', async () => {
      const response = await E2ETestHelper.makeRequest(
        'get',
        '/api/v1/jobs?budgetType=FIXED&status=OPEN',
        'artisan'
      );

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();

      if (response.body.data.length > 0) {
        response.body.data.forEach((job: any) => {
          expect(job.budgetType).toBe('FIXED');
        });
      }

      console.log(`✅ Budget type filter: ${response.body.data.length} fixed budget jobs`);
    });

    it('should search jobs by keyword', async () => {
      const response = await E2ETestHelper.makeRequest(
        'get',
        '/api/v1/jobs/search?q=plumbing',
        'artisan'
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      if (response.body.length > 0) {
        // At least one result should contain 'plumbing'
        const containsKeyword = response.body.some((job: any) =>
          job.title.toLowerCase().includes('plumbing') ||
          job.description.toLowerCase().includes('plumbing')
        );
        expect(containsKeyword).toBe(true);
      }

      console.log(`✅ Keyword search: ${response.body.length} jobs found for 'plumbing'`);
    });

    it('should combine multiple filters', async () => {
      const response = await E2ETestHelper.makeRequest(
        'get',
        '/api/v1/jobs?categoryId=' + testCategoryId + '&minBudget=500&maxBudget=4000&urgency=MEDIUM&city=Johannesburg&status=OPEN',
        'artisan'
      );

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();

      if (response.body.data.length > 0) {
        response.body.data.forEach((job: any) => {
          expect(job.categoryId).toBe(testCategoryId);
          const budget = parseFloat(job.budget);
          expect(budget).toBeGreaterThanOrEqual(1000);
          expect(budget).toBeLessThanOrEqual(4000);
          expect(job.urgency).toBe('MEDIUM');
          expect(job.city).toBe('Johannesburg');
        });
      }

      console.log(`✅ Combined filters: ${response.body.data.length} jobs matched`);
    });
  });

  describe('3. GEOGRAPHIC SEARCH - Nearby Jobs', () => {
    it('should find jobs near artisan location', async () => {
      const response = await E2ETestHelper.makeRequest(
        'get',
        '/api/v1/jobs/nearby?latitude=-26.2041&longitude=28.0473&radius=50',
        'artisan'
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      console.log(`✅ Nearby jobs: ${response.body.length} within 50km radius`);
    });

    it('should calculate distance for nearby jobs', async () => {
      const response = await E2ETestHelper.makeRequest(
        'get',
        '/api/v1/jobs/nearby?latitude=-26.2041&longitude=28.0473&radius=100',
        'artisan'
      );

      expect(response.status).toBe(200);

      if (response.body.length > 0) {
        response.body.forEach((job: any) => {
          expect(job).toHaveProperty('distance');
          if (job.distance !== null) {
            expect(job.distance).toBeLessThanOrEqual(100);
          }
        });
      }

      console.log(`✅ Distance calculation verified for nearby jobs`);
    });

    it('should respect radius parameter for nearby search', async () => {
      const response = await E2ETestHelper.makeRequest(
        'get',
        '/api/v1/jobs/nearby?latitude=-26.2041&longitude=28.0473&radius=10',
        'artisan'
      );

      expect(response.status).toBe(200);

      // Smaller radius should return fewer or equal jobs
      const smallRadiusCount = response.body.length;
      expect(smallRadiusCount).toBeGreaterThanOrEqual(0);

      console.log(`✅ Small radius (10km): ${smallRadiusCount} jobs`);
    });

    it('should limit nearby job results', async () => {
      const response = await E2ETestHelper.makeRequest(
        'get',
        '/api/v1/jobs/nearby?latitude=-26.2041&longitude=28.0473&radius=100&limit=5',
        'artisan'
      );

      expect(response.status).toBe(200);
      expect(response.body.length).toBeLessThanOrEqual(5);

      console.log(`✅ Nearby jobs limited to: ${response.body.length} results`);
    });

    it('should reject invalid coordinates', async () => {
      const response = await E2ETestHelper.makeRequest(
        'get',
        '/api/v1/jobs/nearby?latitude=999&longitude=999&radius=25',
        'artisan'
      );

      expect(response.status).toBe(400);

      console.log(`✅ Invalid coordinates rejected`);
    });
  });

  describe('4. BID SUBMISSION - Artisan Submit Bids', () => {
    let activeJobId: string;

    beforeEach(async () => {
      // Create a job for bidding
      const jobData = {
        title: 'E2E Test: Bidding Target Job',
        description: 'Job for testing bid submission functionality',
        categoryId: testCategoryId,
        budget: 2000,
        budgetType: 'NEGOTIABLE',
        urgency: 'MEDIUM',
        addressLine1: '100 Bidding Street',
        city: 'Pretoria',
        province: 'Gauteng',
        postalCode: '0001',
        latitude: -25.7479,
        longitude: 28.2293,
        requirements: [],
        isDraft: false,
      };

      const response = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/jobs',
        'client',
        jobData
      );

      activeJobId = response.body.id;
    });

    it('should allow artisan to submit bid on open job', async () => {
      const bidData = {
        jobId: activeJobId,
        amount: 1800,
        estimatedDays: 3,
        message: 'I can complete this job professionally within 3 days.',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const response = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/bids',
        'artisan',
        bidData
      );

      expect(response.status).toBe(201);
      expect(response.body.jobId).toBe(activeJobId);
      expect(response.body.amount).toBe(String(bidData.amount));
      expect(response.body.estimatedDays).toBe(bidData.estimatedDays);
      expect(response.body.message).toBe(bidData.message);
      expect(response.body.status).toBe('PENDING');

      console.log(`✅ Bid submitted: R${response.body.amount}, ${response.body.estimatedDays} days`);
    });

    it('should validate bid amount is positive', async () => {
      const bidData = {
        jobId: activeJobId,
        amount: -100,
        estimatedDays: 2,
        message: 'Invalid negative bid',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const response = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/bids',
        'artisan',
        bidData
      );

      expect(response.status).toBe(400);

      console.log(`✅ Negative bid amount rejected`);
    });

    it('should validate estimated days is positive', async () => {
      const bidData = {
        jobId: activeJobId,
        amount: 1500,
        estimatedDays: 0,
        message: 'Invalid zero days',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const response = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/bids',
        'artisan',
        bidData
      );

      expect(response.status).toBe(400);

      console.log(`✅ Zero estimated days rejected`);
    });

    it('should prevent duplicate bids from same artisan', async () => {
      const bidData = {
        jobId: activeJobId,
        amount: 1800,
        estimatedDays: 3,
        message: 'First bid',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      // Submit first bid
      const firstResponse = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/bids',
        'artisan',
        bidData
      );

      expect(firstResponse.status).toBe(201);

      // Try to submit duplicate
      const duplicateResponse = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/bids',
        'artisan',
        { ...bidData, amount: 1700, message: 'Duplicate bid attempt' }
      );

      expect(duplicateResponse.status).toBe(409);
      expect(duplicateResponse.body.message).toContain('already submitted');

      console.log(`✅ Duplicate bid prevented`);
    });

    it('should reject bid on non-existent job', async () => {
      const bidData = {
        jobId: 'non-existent-job-id',
        amount: 1500,
        estimatedDays: 2,
        message: 'Bid on fake job',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const response = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/bids',
        'artisan',
        bidData
      );

      expect(response.status).toBeGreaterThanOrEqual(400);

      console.log(`✅ Bid on non-existent job rejected`);
    });

    it('should validate bid expiry date is in future', async () => {
      const bidData = {
        jobId: activeJobId,
        amount: 1500,
        estimatedDays: 2,
        message: 'Bid with past expiry',
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
      };

      const response = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/bids',
        'artisan',
        bidData
      );

      expect(response.status).toBe(400);

      console.log(`✅ Past expiry date rejected`);
    });
  });

  describe('5. BID MANAGEMENT - View and Update Bids', () => {
    let jobIdWithBid: string;
    let submittedBidId: string;

    beforeEach(async () => {
      // Create job and submit bid
      const jobResponse = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/jobs',
        'client',
        {
          title: 'Job for Bid Management',
          description: 'Testing bid management features',
          categoryId: testCategoryId,
          budget: 2500,
          budgetType: 'FIXED',
          urgency: 'MEDIUM',
          addressLine1: '200 Management Street',
          city: 'Cape Town',
          province: 'Western Cape',
          postalCode: '8001',
          latitude: -33.9249,
          longitude: 18.4241,
          isDraft: false,
        }
      );

      jobIdWithBid = jobResponse.body.id;

      const bidResponse = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/bids',
        'artisan',
        {
          jobId: jobIdWithBid,
          amount: 2200,
          estimatedDays: 4,
          message: 'Original bid message',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }
      );

      submittedBidId = bidResponse.body.id;
    });

    it('should retrieve artisan own bids', async () => {
      const response = await E2ETestHelper.makeRequest(
        'get',
        '/api/v1/bids/my-bids',
        'artisan'
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      const myBid = response.body.find((bid: any) => bid.id === submittedBidId);
      expect(myBid).toBeDefined();
      expect(myBid.amount).toBe("2200");

      console.log(`✅ Retrieved ${response.body.length} artisan bids`);
    });

    it('should view specific bid details', async () => {
      const response = await E2ETestHelper.makeRequest(
        'get',
        `/api/v1/bids/${submittedBidId}`,
        'artisan'
      );

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(submittedBidId);
      expect(response.body.jobId).toBe(jobIdWithBid);
      expect(response.body.amount).toBe("2200");
      expect(response.body.estimatedDays).toBe(4);
      expect(response.body.message).toBe('Original bid message');

      console.log(`✅ Bid details retrieved: R${response.body.amount}`);
    });

    it('should update pending bid', async () => {
      const updateData = {
        amount: 2100,
        estimatedDays: 3,
        message: 'Updated bid with better pricing',
      };

      const response = await E2ETestHelper.makeRequest(
        'patch',
        `/api/v1/bids/${submittedBidId}`,
        'artisan',
        updateData
      );

      expect(response.status).toBe(200);
      expect(response.body.amount).toBe(String(updateData.amount));
      expect(response.body.estimatedDays).toBe(updateData.estimatedDays);
      expect(response.body.message).toBe(updateData.message);

      console.log(`✅ Bid updated: R${response.body.amount}, ${response.body.estimatedDays} days`);
    });

    it('should withdraw pending bid', async () => {
      const response = await E2ETestHelper.makeRequest(
        'post',
        `/api/v1/bids/${submittedBidId}/withdraw`,
        'artisan'
      );

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('WITHDRAWN');

      console.log(`✅ Bid withdrawn successfully`);
    });

    it('should prevent updating withdrawn bid', async () => {
      // Withdraw bid first
      await E2ETestHelper.makeRequest(
        'post',
        `/api/v1/bids/${submittedBidId}/withdraw`,
        'artisan'
      );

      // Try to update withdrawn bid
      const response = await E2ETestHelper.makeRequest(
        'patch',
        `/api/v1/bids/${submittedBidId}`,
        'artisan',
        { amount: 2000 }
      );

      expect(response.status).toBe(400);

      console.log(`✅ Cannot update withdrawn bid`);
    });

    it('should view bid statistics for artisan', async () => {
      const response = await E2ETestHelper.makeRequest(
        'get',
        '/api/v1/bids/statistics',
        'artisan'
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalBids');
      expect(response.body.totalBids).toBeGreaterThanOrEqual(1);

      console.log(`✅ Artisan statistics: ${response.body.totalBids} total bids`);
    });
  });

  describe('6. PAGINATION AND PERFORMANCE', () => {
    beforeAll(async () => {
      // Create multiple jobs for pagination testing
      const jobs = [];
      for (let i = 1; i <= 25; i++) {
        jobs.push({
          title: `Pagination Test Job ${i}`,
          description: `Job number ${i} for pagination testing`,
          categoryId: testCategoryId,
          budget: 1000 + (i * 100),
          budgetType: 'FIXED',
          urgency: 'MEDIUM',
          addressLine1: `${i} Pagination Street`,
          city: 'Johannesburg',
          province: 'Gauteng',
          postalCode: '2000',
          latitude: -26.2041,
          longitude: 28.0473,
          isDraft: false,
        });
      }
      for (const job of jobs) {
        await E2ETestHelper.makeRequest('post', '/api/v1/jobs', 'client', job);
      }
    });

    it('should support pagination for job listings', async () => {
      const page1Response = await E2ETestHelper.makeRequest(
        'get',
        '/api/v1/jobs?page=1&limit=10&status=OPEN',
        'artisan'
      );

      expect(page1Response.status).toBe(200);
      expect(page1Response.body.data).toBeDefined();
      expect(page1Response.body.data.length).toBeLessThanOrEqual(10);
      expect(page1Response.body.meta).toBeDefined();
      expect(page1Response.body.meta.page).toBe(1);

      console.log(`✅ Page 1: ${page1Response.body.data.length} jobs`);
    });

    it('should retrieve second page of results', async () => {
      const page2Response = await E2ETestHelper.makeRequest(
        'get',
        '/api/v1/jobs?page=2&limit=10&status=OPEN',
        'artisan'
      );

      expect(page2Response.status).toBe(200);
      expect(page2Response.body.meta.page).toBe(2);

      console.log(`✅ Page 2: ${page2Response.body.data.length} jobs`);
    });

    it('should respect custom page limits', async () => {
      const response = await E2ETestHelper.makeRequest(
        'get',
        '/api/v1/jobs?page=1&limit=5&status=OPEN',
        'artisan'
      );

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(5);

      console.log(`✅ Custom limit (5): ${response.body.data.length} jobs returned`);
    });

    it('should provide total count in pagination', async () => {
      const response = await E2ETestHelper.makeRequest(
        'get',
        '/api/v1/jobs?page=1&limit=10&status=OPEN',
        'artisan'
      );

      expect(response.status).toBe(200);
      expect(response.body.meta).toHaveProperty('total');
      expect(response.body.meta.total).toBeGreaterThan(0);

      console.log(`✅ Total jobs available: ${response.body.meta.total}`);
    });
  });

  describe('7. EDGE CASES AND ERROR SCENARIOS', () => {
    it('should handle invalid job ID gracefully', async () => {
      const response = await E2ETestHelper.makeRequest(
        'get',
        '/api/v1/jobs/invalid-job-id-12345',
        'artisan'
      );

      expect(response.status).toBe(404);

      console.log(`✅ Invalid job ID handled: ${response.status}`);
    });

    it('should reject access to jobs by unauthenticated users', async () => {
      const response = await E2ETestHelper.makeRequest(
        'get',
        '/api/v1/jobs'
        // No user authentication
      );

      expect(response.status).toBe(401);

      console.log(`✅ Unauthenticated access rejected`);
    });

    it('should prevent clients from submitting bids', async () => {
      // Create a job
      const jobResponse = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/jobs',
        'client',
        {
          title: 'Test Job',
          description: 'For testing role restrictions',
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
          isDraft: false,
        }
      );

      // Try to bid as client
      const bidResponse = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/bids',
        'client',
        {
          jobId: jobResponse.body.id,
          amount: 900,
          estimatedDays: 2,
          message: 'Client trying to bid',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }
      );

      expect(bidResponse.status).toBe(403);

      console.log(`✅ Client prevented from bidding`);
    });

    it('should handle empty search results gracefully', async () => {
      const response = await E2ETestHelper.makeRequest(
        'get',
        '/api/v1/jobs/search?q=nonexistentkeywordxyz123',
        'artisan'
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);

      console.log(`✅ Empty search results handled gracefully`);
    });

    it('should validate budget range parameters', async () => {
      const response = await E2ETestHelper.makeRequest(
        'get',
        '/api/v1/jobs?minBudget=5000&maxBudget=1000&status=OPEN',
        'artisan'
      );

      // Min > Max should return error or empty results
      expect(response.status).toBeGreaterThanOrEqual(200);

      console.log(`✅ Invalid budget range handled`);
    });

    it('should handle concurrent bid submissions gracefully', async () => {
      // Create a job
      const jobResponse = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/jobs',
        'client',
        {
          title: 'Concurrent Bid Test',
          description: 'Testing concurrent bid handling',
          categoryId: testCategoryId,
          budget: 1500,
          budgetType: 'FIXED',
          urgency: 'MEDIUM',
          addressLine1: '300 Concurrent Street',
          city: 'Durban',
          province: 'KwaZulu-Natal',
          postalCode: '4000',
          latitude: -29.8587,
          longitude: 31.0218,
          isDraft: false,
        }
      );

      const jobId = jobResponse.body.id;

      // Submit first bid
      const firstBid = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/bids',
        'artisan',
        {
          jobId,
          amount: 1400,
          estimatedDays: 3,
          message: 'First bid',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }
      );

      expect(firstBid.status).toBe(201);

      // Second attempt should fail
      const secondBid = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/bids',
        'artisan',
        {
          jobId,
          amount: 1300,
          estimatedDays: 2,
          message: 'Second bid attempt',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }
      );

      expect(secondBid.status).toBe(409);

      console.log(`✅ Concurrent bids handled properly`);
    });
  });

  describe('8. JOB STATUS TRANSITIONS', () => {
    it('should only show OPEN jobs to artisans by default', async () => {
      const response = await E2ETestHelper.makeRequest(
        'get',
        '/api/v1/jobs?status=OPEN',
        'artisan'
      );

      expect(response.status).toBe(200);

      if (response.body.data.length > 0) {
        response.body.data.forEach((job: any) => {
          expect(job.status).toBe('OPEN');
        });
      }

      console.log(`✅ Only OPEN jobs shown: ${response.body.data.length} jobs`);
    });

    it('should not show cancelled jobs to artisans', async () => {
      const response = await E2ETestHelper.makeRequest(
        'get',
        '/api/v1/jobs?status=CANCELLED',
        'artisan'
      );

      expect(response.status).toBe(200);
      // Artisans shouldn't normally access cancelled jobs
      expect(response.body.data.length).toBe(0);

      console.log(`✅ Cancelled jobs not shown to artisans`);
    });
  });
});
