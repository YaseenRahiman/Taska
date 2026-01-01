import { E2ETestHelper } from './setup-e2e';
import { JobStatus, BidStatus } from '@prisma/client';

describe('User Journeys E2E Tests', () => {
  describe('Client Journey: Register → Post Job → Accept Bid → Pay → Review', () => {
    let jobId: string;
    let bidId: string;

    it('should complete full client journey', async () => {
      // Step 1: Client posts a job
      const jobData = {
        title: 'Fix Kitchen Sink',
        description: 'Kitchen sink is leaking and needs repair immediately',
        categoryId: '1', // Plumbing
        budget: 750,
        budgetType: 'FIXED',
        urgency: 'MEDIUM',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        addressLine1: '123 Test Street',
        city: 'Cape Town',
        province: 'Western Cape',
        postalCode: '8001',
        latitude: -33.9249,
        longitude: 18.4241,
        requirements: ['Bring own tools', 'Available weekends'],
        isDraft: false,
      };

      const jobResponse = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/jobs',
        'client',
        jobData
      );

      expect(jobResponse.status).toBe(201);
      expect(jobResponse.body.title).toBe(jobData.title);
      expect(jobResponse.body.status).toBe('OPEN');
      jobId = jobResponse.body.id;

      // Step 2: Artisan submits a bid
      const bidData = {
        jobId,
        amount: 750,
        estimatedDays: 1,
        message: 'I can fix your sink today. I have 10+ years experience.',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const bidResponse = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/bids',
        'artisan',
        bidData
      );

      expect(bidResponse.status).toBe(201);
      expect(bidResponse.body.amount).toBe(String(bidData.amount));
      expect(bidResponse.body.status).toBe('PENDING');
      bidId = bidResponse.body.id;

      // Step 3: Client views bids for the job
      const bidsResponse = await E2ETestHelper.makeRequest(
        'get',
        `/api/v1/bids/job/${jobId}`,
        'client'
      );

      expect(bidsResponse.status).toBe(200);
      expect(bidsResponse.body.length).toBe(1);
      expect(bidsResponse.body[0].id).toBe(bidId);

      // Step 4: Client accepts the bid
      const acceptResponse = await E2ETestHelper.makeRequest(
        'post',
        `/api/v1/bids/${bidId}/accept`,
        'client'
      );

      expect(acceptResponse.status).toBe(200);
      expect(acceptResponse.body.status).toBe('ACCEPTED');

      // Verify job status changed to IN_PROGRESS
      const updatedJobResponse = await E2ETestHelper.makeRequest(
        'get',
        `/api/v1/jobs/${jobId}`,
        'client'
      );
      expect(updatedJobResponse.body.status).toBe('IN_PROGRESS');

      // Step 5: Simulate payment creation (mock payment)
      const paymentData = {
        jobId,
        amount: 750,
        paymentMethod: 'CARD',
        platformFee: 112.5, // 15% of 750
        vatAmount: 112.5, // 15% VAT
        totalAmount: 862.5,
      };

      const paymentResponse = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/payments',
        'client',
        paymentData
      );

      expect(paymentResponse.status).toBe(201);
      expect(paymentResponse.body.status).toBe('PENDING');

      // Step 6: Simulate job completion
      const completeJobResponse = await E2ETestHelper.makeRequest(
        'patch',
        `/api/v1/jobs/${jobId}`,
        'artisan',
        { status: 'COMPLETED' }
      );

      expect(completeJobResponse.status).toBe(200);

      // Step 7: Client submits review
      const reviewData = {
        jobId,
        artisanId: E2ETestHelper.testUsers.artisan.id,
        rating: 5,
        qualityRating: 5,
        timelinessRating: 5,
        communicationRating: 5,
        valueRating: 5,
        comment: 'Excellent work! Fixed the sink quickly and professionally.',
        wouldRecommend: true,
      };

      const reviewResponse = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/reviews',
        'client',
        reviewData
      );

      expect(reviewResponse.status).toBe(201);
      expect(reviewResponse.body.rating).toBe(5);
      expect(reviewResponse.body.comment).toBe(reviewData.comment);
    });
  });

  describe('Artisan Journey: Register → Find Job → Submit Bid → Complete → Get Paid', () => {
    let jobId: string;
    let bidId: string;

    it('should complete full artisan journey', async () => {
      // Step 1: Client creates a job for artisan to find
      const jobData = {
        title: 'Install New Light Fixtures',
        description: 'Need to install 3 LED light fixtures in living room immediately',
        categoryId: '2', // Electrical
        budget: 1000,
        budgetType: 'FIXED',
        urgency: 'HIGH',
        startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        addressLine1: '456 Test Avenue',
        city: 'Johannesburg',
        province: 'Gauteng',
        postalCode: '2000',
        latitude: -26.2041,
        longitude: 28.0473,
        requirements: ['Must be certified electrician', 'Provide materials'],
        isDraft: false,
      };

      const jobResponse = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/jobs',
        'client',
        jobData
      );

      expect(jobResponse.status).toBe(201);
      jobId = jobResponse.body.id;

      // Step 2: Artisan discovers available jobs
      const jobsResponse = await E2ETestHelper.makeRequest(
        'get',
        '/api/v1/jobs?status=OPEN&categoryId=2',
        'artisan'
      );

      expect(jobsResponse.status).toBe(200);
      expect(jobsResponse.body.data.length).toBeGreaterThan(0);
      const foundJob = jobsResponse.body.data.find((job: any) => job.id === jobId);
      expect(foundJob).toBeDefined();

      // Step 3: Artisan views job details
      const jobDetailResponse = await E2ETestHelper.makeRequest(
        'get',
        `/api/v1/jobs/${jobId}`,
        'artisan'
      );

      expect(jobDetailResponse.status).toBe(200);
      expect(jobDetailResponse.body.title).toBe(jobData.title);

      // Step 4: Artisan submits competitive bid
      const bidData = {
        jobId,
        amount: 950,
        estimatedDays: 2,
        message: 'Certified electrician with 15 years experience. I can provide all materials and complete within 2 days.',
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const bidResponse = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/bids',
        'artisan',
        bidData
      );

      expect(bidResponse.status).toBe(201);
      expect(bidResponse.body.amount).toBe(String(bidData.amount));
      bidId = bidResponse.body.id;

      // Step 5: Artisan tracks bid status
      const myBidsResponse = await E2ETestHelper.makeRequest(
        'get',
        '/api/v1/bids/my-bids',
        'artisan'
      );

      expect(myBidsResponse.status).toBe(200);
      const myBid = myBidsResponse.body.find((bid: any) => bid.id === bidId);
      expect(myBid).toBeDefined();
      expect(myBid.status).toBe('PENDING');

      // Step 6: Client accepts artisan's bid
      const acceptResponse = await E2ETestHelper.makeRequest(
        'post',
        `/api/v1/bids/${bidId}/accept`,
        'client'
      );

      expect(acceptResponse.status).toBe(200);

      // Step 7: Artisan receives notification and starts work
      const acceptedBidResponse = await E2ETestHelper.makeRequest(
        'get',
        `/api/v1/bids/${bidId}`,
        'artisan'
      );

      expect(acceptedBidResponse.status).toBe(200);
      expect(acceptedBidResponse.body.status).toBe('ACCEPTED');

      // Step 8: Artisan updates job progress
      const progressUpdate = await E2ETestHelper.makeRequest(
        'patch',
        `/api/v1/jobs/${jobId}`,
        'artisan',
        { status: 'IN_PROGRESS' }
      );

      expect(progressUpdate.status).toBe(200);

      // Step 9: Artisan completes job
      const completeResponse = await E2ETestHelper.makeRequest(
        'patch',
        `/api/v1/jobs/${jobId}`,
        'artisan',
        { status: 'COMPLETED' }
      );

      expect(completeResponse.status).toBe(200);

      // Step 10: Check artisan wallet for payment (mock)
      const walletResponse = await E2ETestHelper.makeRequest(
        'get',
        '/api/v1/wallets/balance',
        'artisan'
      );

      expect(walletResponse.status).toBe(200);
      expect(walletResponse.body.balance).toBeGreaterThan(0);
    });
  });

  describe('Admin Journey: Login → Moderate → Resolve Dispute', () => {
    let jobId: string;
    let bidId: string;
    let disputeId: string;

    it('should complete admin moderation workflow', async () => {
      // Step 1: Create a completed job with dispute
      const jobData = {
        title: 'Faulty Electrical Work',
        description: 'Electrical work was not done properly and needs fixing',
        categoryId: '2',
        budget: 1250,
        budgetType: 'FIXED',
        urgency: 'HIGH',
        startDate: new Date().toISOString(),
        addressLine1: '789 Test Road',
        city: 'Durban',
        province: 'KwaZulu-Natal',
        postalCode: '4000',
        latitude: -29.8587,
        longitude: 31.0218,
        isDraft: false,
      };

      const jobResponse = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/jobs',
        'client',
        jobData
      );
      jobId = jobResponse.body.id;

      // Create and accept bid
      const bidData = {
        jobId,
        amount: 1200,
        estimatedDays: 3,
        message: 'Quick electrical fix',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const bidResponse = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/bids',
        'artisan',
        bidData
      );
      bidId = bidResponse.body.id;

      await E2ETestHelper.makeRequest(
        'post',
        `/api/v1/bids/${bidId}/accept`,
        'client'
      );

      // Complete job
      await E2ETestHelper.makeRequest(
        'patch',
        `/api/v1/jobs/${jobId}`,
        'artisan',
        { status: 'COMPLETED' }
      );

      // Step 2: Admin views all jobs for moderation
      const allJobsResponse = await E2ETestHelper.makeRequest(
        'get',
        '/api/v1/admin/jobs',
        'admin'
      );

      expect(allJobsResponse.status).toBe(200);
      expect(Array.isArray(allJobsResponse.body.data)).toBe(true);

      // Step 3: Admin views specific job details
      const jobDetailResponse = await E2ETestHelper.makeRequest(
        'get',
        `/api/v1/admin/jobs/${jobId}`,
        'admin'
      );

      expect(jobDetailResponse.status).toBe(200);
      expect(jobDetailResponse.body.id).toBe(jobId);

      // Step 4: Admin views all users
      const usersResponse = await E2ETestHelper.makeRequest(
        'get',
        '/api/v1/admin/users',
        'admin'
      );

      expect(usersResponse.status).toBe(200);
      expect(Array.isArray(usersResponse.body.users)).toBe(true);
      expect(usersResponse.body.users.length).toBeGreaterThan(0);

      // Step 5: Admin views platform analytics
      const analyticsResponse = await E2ETestHelper.makeRequest(
        'get',
        '/api/v1/admin/analytics',
        'admin'
      );

      expect(analyticsResponse.status).toBe(200);
      expect(analyticsResponse.body.totalUsers).toBeGreaterThan(0);
      expect(analyticsResponse.body.totalJobs).toBeGreaterThan(0);

      // Step 6: Admin verifies artisan (if needed)
      const verifyResponse = await E2ETestHelper.makeRequest(
        'patch',
        `/api/v1/admin/users/${E2ETestHelper.testUsers.artisan.id}/verify`,
        'admin'
      );

      expect(verifyResponse.status).toBe(200);
    });
  });

  describe('Cross-Role Integration Tests', () => {
    it('should handle bid expiry correctly', async () => {
      // Create job
      const jobData = {
        title: 'Test Expiry Job',
        description: 'Testing bid expiry functionality for quality assurance',
        categoryId: '1',
        budget: 150,
        budgetType: 'FIXED',
        urgency: 'LOW',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        addressLine1: '123 Test Street',
        city: 'Cape Town',
        province: 'Western Cape',
        postalCode: '8001',
        latitude: -33.9249,
        longitude: 18.4241,
        isDraft: false,
      };

      const jobResponse = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/jobs',
        'client',
        jobData
      );
      const jobId = jobResponse.body.id;

      // Create bid with very short expiry
      const bidData = {
        jobId,
        amount: 150,
        estimatedDays: 1,
        message: 'Quick test bid',
        expiresAt: new Date(Date.now() + 1000).toISOString(), // 1 second from now
      };

      const bidResponse = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/bids',
        'artisan',
        bidData
      );
      const bidId = bidResponse.body.id;

      // Wait for expiry
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Try to accept expired bid
      const acceptResponse = await E2ETestHelper.makeRequest(
        'post',
        `/api/v1/bids/${bidId}/accept`,
        'client'
      );

      expect(acceptResponse.status).toBe(400);
      expect(acceptResponse.body.message).toContain('expired');
    });

    it('should prevent duplicate bids from same artisan', async () => {
      // Create job
      const jobData = {
        title: 'No Duplicate Bids Job',
        description: 'Testing duplicate bid prevention functionality properly',
        categoryId: '1',
        budget: 150,
        budgetType: 'FIXED',
        urgency: 'MEDIUM',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        addressLine1: '123 Test Street',
        city: 'Cape Town',
        province: 'Western Cape',
        postalCode: '8001',
        latitude: -33.9249,
        longitude: 18.4241,
        isDraft: false,
      };

      const jobResponse = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/jobs',
        'client',
        jobData
      );
      const jobId = jobResponse.body.id;

      // Submit first bid
      const bidData = {
        jobId,
        amount: 150,
        estimatedDays: 1,
        message: 'First bid',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const firstBidResponse = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/bids',
        'artisan',
        bidData
      );

      expect(firstBidResponse.status).toBe(201);

      // Try to submit duplicate bid
      const duplicateBidData = {
        ...bidData,
        amount: 140,
        message: 'Second bid attempt',
      };

      const duplicateBidResponse = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/bids',
        'artisan',
        duplicateBidData
      );

      expect(duplicateBidResponse.status).toBe(409);
      expect(duplicateBidResponse.body.message).toContain('already submitted');
    });

    it('should handle messaging between client and artisan', async () => {
      // Create and accept a bid first
      const jobData = {
        title: 'Messaging Test Job',
        description: 'Testing messaging functionality between client and artisan',
        categoryId: '1',
        budget: 250,
        budgetType: 'FIXED',
        urgency: 'MEDIUM',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        addressLine1: '123 Test Street',
        city: 'Cape Town',
        province: 'Western Cape',
        postalCode: '8001',
        latitude: -33.9249,
        longitude: 18.4241,
        isDraft: false,
      };

      const jobResponse = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/jobs',
        'client',
        jobData
      );
      const jobId = jobResponse.body.id;

      const bidData = {
        jobId,
        amount: 250,
        estimatedDays: 2,
        message: 'I can help with this',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const bidResponse = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/bids',
        'artisan',
        bidData
      );
      const bidId = bidResponse.body.id;

      const acceptResponse = await E2ETestHelper.makeRequest(
        'post',
        `/api/v1/bids/${bidId}/accept`,
        'client'
      );

      console.log('DEBUG: Bid acceptance response:', acceptResponse.status, acceptResponse.body);

      // Now test messaging
      const messageData = {
        jobId,
        recipientId: E2ETestHelper.testUsers.artisan.id,
        content: 'When can you start the work?',
      };

      console.log('DEBUG: jobId =', jobId);
      console.log('DEBUG: recipientId =', E2ETestHelper.testUsers.artisan.id);
      console.log('DEBUG: messageData =', messageData);

      const messageResponse = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/messages',
        'client',
        messageData
      );

      if (messageResponse.status !== 201) {
        console.log('Message creation failed:', messageResponse.status, messageResponse.body);
      }

      expect(messageResponse.status).toBe(201);
      expect(messageResponse.body.content).toBe(messageData.content);

      // Artisan replies
      const replyData = {
        jobId,
        recipientId: E2ETestHelper.testUsers.client.id,
        content: 'I can start tomorrow morning at 8 AM',
      };

      const replyResponse = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/messages',
        'artisan',
        replyData
      );

      expect(replyResponse.status).toBe(201);

      // Get conversation
      const conversationResponse = await E2ETestHelper.makeRequest(
        'get',
        `/api/v1/messages/job/${jobId}`,
        'client'
      );

      expect(conversationResponse.status).toBe(200);
      expect(conversationResponse.body.length).toBe(2);
    });
  });
});
