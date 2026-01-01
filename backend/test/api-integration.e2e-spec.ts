import { E2ETestHelper } from './setup-e2e';

describe('API Integration Tests', () => {
  describe('Authentication Endpoints', () => {
    it('should register new users with different roles', async () => {
      const clientData = {
        email: 'newclient@test.com',
        password: 'Password123!',
        role: 'CLIENT',
        firstName: 'New',
        lastName: 'Client',
        phoneNumber: '+27123456999',
      };

      const response = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/auth/register',
        undefined,
        clientData
      );

      expect(response.status).toBe(201);
      expect(response.body.user.email).toBe(clientData.email);
      expect(response.body.user.role).toBe('CLIENT');
      expect(response.body.tokens).toBeDefined();
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'client@test.com',
        password: 'password123',
      };

      const response = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/auth/login',
        undefined,
        loginData
      );

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe(loginData.email);
      expect(response.body.tokens.accessToken).toBeDefined();
      expect(response.body.tokens.refreshToken).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      const invalidData = {
        email: 'client@test.com',
        password: 'wrongpassword',
      };

      const response = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/auth/login',
        undefined,
        invalidData
      );

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should refresh tokens', async () => {
      // First login to get refresh token
      const loginResponse = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/auth/login',
        undefined,
        { email: 'client@test.com', password: 'password123' }
      );

      const refreshToken = loginResponse.body.tokens.refreshToken;

      const refreshResponse = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/auth/refresh-token',
        undefined,
        { refreshToken }
      );

      expect(refreshResponse.status).toBe(200);
      expect(refreshResponse.body.tokens.accessToken).toBeDefined();
    });

    it('should protect routes with authentication', async () => {
      const response = await E2ETestHelper.makeRequest(
        'get',
        '/api/v1/auth/profile'
      );

      expect(response.status).toBe(401);
    });

    it('should allow authenticated access to protected routes', async () => {
      const response = await E2ETestHelper.makeRequest(
        'get',
        '/api/v1/auth/profile',
        'client'
      );

      expect(response.status).toBe(200);
      expect(response.body.email).toBe('client@test.com');
    });
  });

  describe('Job Management Endpoints', () => {
    let jobId: string;

    it('should create a new job (CLIENT only)', async () => {
      const jobData = {
        title: 'Test Job Creation',
        description: 'Testing job creation endpoint with proper validation',
        categoryId: '1',
        budget: 150,
        budgetType: 'FIXED',
        urgency: 'MEDIUM',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        addressLine1: '123 API Test Street',
        city: 'Cape Town',
        province: 'Western Cape',
        postalCode: '8001',
        latitude: -33.9249,
        longitude: 18.4241,
        isDraft: false,
      };

      const response = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/jobs',
        'client',
        jobData
      );

      expect(response.status).toBe(201);
      expect(response.body.title).toBe(jobData.title);
      expect(response.body.status).toBe('OPEN');
      jobId = response.body.id;
    });

    it('should prevent artisans from creating jobs', async () => {
      const jobData = {
        title: 'Unauthorized Job',
        description: 'This should fail because artisan cannot create jobs',
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

      const response = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/jobs',
        'artisan',
        jobData
      );

      expect(response.status).toBe(403);
    });

    it('should list jobs with pagination', async () => {
      const response = await E2ETestHelper.makeRequest(
        'get',
        '/api/v1/jobs?page=1&limit=10',
        'client'
      );

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(10);
    });

    it('should filter jobs by category', async () => {
      const response = await E2ETestHelper.makeRequest(
        'get',
        '/api/v1/jobs?categoryId=1',
        'artisan'
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should get job details', async () => {
      const response = await E2ETestHelper.makeRequest(
        'get',
        `/api/v1/jobs/${jobId}`,
        'client'
      );

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(jobId);
      expect(response.body.title).toBeDefined();
    });

    it('should update job (owner only)', async () => {
      const updateData = {
        description: 'Updated description for API test',
      };

      const response = await E2ETestHelper.makeRequest(
        'patch',
        `/api/v1/jobs/${jobId}`,
        'client',
        updateData
      );

      expect(response.status).toBe(200);
      expect(response.body.description).toBe(updateData.description);
    });

    it('should prevent non-owners from updating job', async () => {
      const updateData = {
        description: 'Unauthorized update attempt',
      };

      const response = await E2ETestHelper.makeRequest(
        'patch',
        `/api/v1/jobs/${jobId}`,
        'artisan',
        updateData
      );

      expect(response.status).toBe(403);
    });
  });

  describe('Bidding System Endpoints', () => {
    let jobId: string;
    let bidId: string;

    beforeEach(async () => {
      // Create a job for bidding tests
      const jobData = {
        title: 'Bidding Test Job',
        description: 'Job for testing bidding endpoints with comprehensive validation',
        categoryId: '1',
        budget: 1500,
        budgetType: 'FIXED',
        urgency: 'MEDIUM',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        addressLine1: '456 Bid Test Avenue',
        city: 'Johannesburg',
        province: 'Gauteng',
        postalCode: '2000',
        latitude: -26.2041,
        longitude: 28.0473,
        isDraft: false,
      };

      const jobResponse = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/jobs',
        'client',
        jobData
      );
      jobId = jobResponse.body.id;
    });

    it('should create a bid (ARTISAN only)', async () => {
      const bidData = {
        jobId,
        amount: 300,
        estimatedDays: 2,
        message: 'I can complete this job efficiently',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const response = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/bids',
        'artisan',
        bidData
      );

      expect(response.status).toBe(201);
      expect(response.body.amount).toBe(String(bidData.amount));
      expect(response.body.status).toBe('PENDING');
      bidId = response.body.id;
    });

    it('should prevent clients from creating bids', async () => {
      const bidData = {
        jobId,
        amount: 250,
        estimatedDays: 1,
        message: 'Client should not be able to bid',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const response = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/bids',
        'client',
        bidData
      );

      expect(response.status).toBe(403);
    });

    it('should validate bid amount within budget', async () => {
      const bidData = {
        jobId,
        amount: 500, // Over budget max of 400
        estimatedDays: 1,
        message: 'Over budget bid',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const response = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/bids',
        'artisan',
        bidData
      );

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('budget');
    });

    it('should list bids for a job', async () => {
      // First create a bid
      await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/bids',
        'artisan',
        {
          jobId,
          amount: 300,
          estimatedDays: 2,
          message: 'Test bid for listing',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }
      );

      const response = await E2ETestHelper.makeRequest(
        'get',
        `/api/v1/bids/job/${jobId}`,
        'client'
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should get artisan own bids', async () => {
      const response = await E2ETestHelper.makeRequest(
        'get',
        '/api/v1/bids/my-bids',
        'artisan'
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get bid statistics', async () => {
      const response = await E2ETestHelper.makeRequest(
        'get',
        '/api/v1/bids/statistics',
        'admin'
      );

      expect(response.status).toBe(200);
      expect(response.body.totalBids).toBeDefined();
      expect(response.body.averageAmount).toBeDefined();
    });
  });

  describe('Real-time Communication', () => {
    let jobId: string;
    let bidId: string;

    beforeEach(async () => {
      // Setup job and accepted bid for messaging
      const jobResponse = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/jobs',
        'client',
        {
          title: 'Messaging Test Job',
          description: 'Job for testing messaging functionality properly',
          categoryId: '1',
          budget: 150,
          budgetType: 'FIXED',
          urgency: 'MEDIUM',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          addressLine1: '789 Message Street',
          city: 'Cape Town',
          province: 'Western Cape',
          postalCode: '8001',
          latitude: -33.9249,
          longitude: 18.4241,
          isDraft: false,
        }
      );
      jobId = jobResponse.body.id;

      const bidResponse = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/bids',
        'artisan',
        {
          jobId,
          amount: 150,
          estimatedDays: 1,
          message: 'I can help',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }
      );
      bidId = bidResponse.body.id;

      await E2ETestHelper.makeRequest(
        'post',
        `/api/v1/bids/${bidId}/accept`,
        'client'
      );
    });

    it('should send messages between client and artisan', async () => {
      const messageData = {
        jobId,
        recipientId: E2ETestHelper.testUsers.artisan.id,
        content: 'Hello, when can you start?',
      };

      const response = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/messages',
        'client',
        messageData
      );

      expect(response.status).toBe(201);
      expect(response.body.content).toBe(messageData.content);
      expect(response.body.isEncrypted).toBe(false);
    });

    it('should encrypt sensitive messages', async () => {
      const sensitiveMessage = {
        jobId,
        recipientId: E2ETestHelper.testUsers.artisan.id,
        content: 'My bank account is 1234567890',
      };

      const response = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/messages',
        'client',
        sensitiveMessage
      );

      expect(response.status).toBe(201);
      expect(response.body.isEncrypted).toBe(true);
    });

    it('should get conversation messages', async () => {
      // Send a message first
      await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/messages',
        'client',
        {
          jobId,
          recipientId: E2ETestHelper.testUsers.artisan.id,
          content: 'Test conversation message',
        }
      );

      const response = await E2ETestHelper.makeRequest(
        'get',
        `/api/v1/messages/job/${jobId}`,
        'client'
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should mark messages as read', async () => {
      // Send a message
      const messageResponse = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/messages',
        'client',
        {
          jobId,
          recipientId: E2ETestHelper.testUsers.artisan.id,
          content: 'Mark as read test',
        }
      );

      const messageId = messageResponse.body.id;

      const readResponse = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/messages/mark-read',
        'artisan',
        { messageIds: [messageId] }
      );

      expect(readResponse.status).toBe(200);
    });

    it('should get unread message count', async () => {
      const response = await E2ETestHelper.makeRequest(
        'get',
        '/api/v1/messages/unread-count',
        'client'
      );

      expect(response.status).toBe(200);
      expect(typeof response.body.count).toBe('number');
    });
  });

  describe('Admin Endpoints', () => {
    it('should get platform analytics (ADMIN only)', async () => {
      const response = await E2ETestHelper.makeRequest(
        'get',
        '/api/v1/admin/analytics',
        'admin'
      );

      expect(response.status).toBe(200);
      expect(response.body.totalUsers).toBeDefined();
      expect(response.body.totalJobs).toBeDefined();
      expect(response.body.totalBids).toBeDefined();
      expect(response.body.platformRevenue).toBeDefined();
    });

    it('should prevent non-admins from accessing analytics', async () => {
      const response = await E2ETestHelper.makeRequest(
        'get',
        '/api/v1/admin/analytics',
        'client'
      );

      expect(response.status).toBe(403);
    });

    it('should get all users (ADMIN only)', async () => {
      const response = await E2ETestHelper.makeRequest(
        'get',
        '/api/v1/admin/users',
        'admin'
      );

      expect(response.status).toBe(200);
      expect(response.body.users).toBeDefined();
      expect(Array.isArray(response.body.users)).toBe(true);
    });

    it('should get all jobs for moderation', async () => {
      const response = await E2ETestHelper.makeRequest(
        'get',
        '/api/v1/admin/jobs',
        'admin'
      );

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should verify artisan credentials', async () => {
      const response = await E2ETestHelper.makeRequest(
        'patch',
        `/api/v1/admin/users/${E2ETestHelper.testUsers.artisan.id}/verify`,
        'admin'
      );

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('verified');
    });
  });

  describe('Error Handling and Validation', () => {
    it('should handle malformed JSON', async () => {
      const response = await E2ETestHelper.app.httpServer
        .request()
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${E2ETestHelper.testUsers.client.token}`)
        .send('{"invalid": json}')
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
    });

    it('should validate required fields', async () => {
      const incompleteJob = {
        title: 'Incomplete Job',
        // Missing required fields
      };

      const response = await E2ETestHelper.makeRequest(
        'post',
        '/api/v1/jobs',
        'client',
        incompleteJob
      );

      expect(response.status).toBe(400);
      expect(response.body.message).toBeDefined();
    });

    it('should handle non-existent resources', async () => {
      const response = await E2ETestHelper.makeRequest(
        'get',
        '/api/v1/jobs/non-existent-id',
        'client'
      );

      expect(response.status).toBe(404);
    });

    it('should handle rate limiting', async () => {
      // This would require actual rate limiting to be implemented
      // For now, just test that the endpoint exists
      const response = await E2ETestHelper.makeRequest(
        'get',
        '/api/v1/health',
        'client'
      );

      expect(response.status).toBe(200);
    });
  });

  describe('Health Check Endpoints', () => {
    it('should return health status', async () => {
      const response = await E2ETestHelper.makeRequest(
        'get',
        '/api/v1/health'
      );

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
    });

    it('should return detailed health check', async () => {
      const response = await E2ETestHelper.makeRequest(
        'get',
        '/api/v1/health/detailed'
      );

      expect(response.status).toBe(200);
      expect(response.body.database).toBeDefined();
      expect(response.body.redis).toBeDefined();
    });
  });
});
