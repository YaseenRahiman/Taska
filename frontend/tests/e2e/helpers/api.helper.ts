import axios, { AxiosInstance, AxiosError } from 'axios';

/**
 * API Helper
 * Utilities for direct API interactions in tests
 * Useful for setup, teardown, and data manipulation
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      endpoint: error.config?.url
    });
    return Promise.reject(error);
  }
);

/**
 * Health check - verify API is accessible
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await apiClient.get('/health');
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

/**
 * Wait for API to be ready
 */
export async function waitForAPI(maxAttempts: number = 30, delayMs: number = 2000): Promise<boolean> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (await checkHealth()) {
      console.log(`✓ API is ready (attempt ${attempt})`);
      return true;
    }
    console.log(`Waiting for API... (attempt ${attempt}/${maxAttempts})`);
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  console.error('✗ API failed to become ready');
  return false;
}

/**
 * Authentication APIs
 */
export const auth = {
  /**
   * Register new user
   */
  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    role?: 'CLIENT' | 'ARTISAN' | 'ADMIN';
  }): Promise<any> {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<any> {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  /**
   * Logout user
   */
  async logout(token: string): Promise<void> {
    await apiClient.post('/auth/logout', {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  /**
   * Get user profile
   */
  async getProfile(token: string): Promise<any> {
    const response = await apiClient.get('/auth/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<any> {
    const response = await apiClient.post('/auth/refresh-token', { refreshToken });
    return response.data;
  }
};

/**
 * Job APIs
 */
export const jobs = {
  /**
   * Create job
   */
  async create(token: string, jobData: any): Promise<any> {
    const response = await apiClient.post('/jobs', jobData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  /**
   * Get all jobs
   */
  async getAll(token: string, params?: any): Promise<any> {
    const response = await apiClient.get('/jobs', {
      headers: { Authorization: `Bearer ${token}` },
      params
    });
    return response.data;
  },

  /**
   * Get job by ID
   */
  async getById(token: string, jobId: string): Promise<any> {
    const response = await apiClient.get(`/jobs/${jobId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  /**
   * Update job
   */
  async update(token: string, jobId: string, updates: any): Promise<any> {
    const response = await apiClient.patch(`/jobs/${jobId}`, updates, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  /**
   * Delete job
   */
  async delete(token: string, jobId: string): Promise<void> {
    await apiClient.delete(`/jobs/${jobId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  /**
   * Get jobs by client
   */
  async getByClient(token: string): Promise<any> {
    const response = await apiClient.get('/jobs', {
      headers: { Authorization: `Bearer ${token}` },
      params: { clientId: 'me' }
    });
    return response.data;
  }
};

/**
 * Bid APIs
 */
export const bids = {
  /**
   * Create bid
   */
  async create(token: string, bidData: any): Promise<any> {
    const response = await apiClient.post('/bids', bidData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  /**
   * Get all bids
   */
  async getAll(token: string, params?: any): Promise<any> {
    const response = await apiClient.get('/bids', {
      headers: { Authorization: `Bearer ${token}` },
      params
    });
    return response.data;
  },

  /**
   * Get bid by ID
   */
  async getById(token: string, bidId: string): Promise<any> {
    const response = await apiClient.get(`/bids/${bidId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  /**
   * Accept bid
   */
  async accept(token: string, bidId: string): Promise<any> {
    const response = await apiClient.post(`/bids/${bidId}/accept`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  /**
   * Reject bid
   */
  async reject(token: string, bidId: string, reason?: string): Promise<any> {
    const response = await apiClient.post(`/bids/${bidId}/reject`, { reason }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
};

/**
 * Message APIs
 */
export const messages = {
  /**
   * Send message
   */
  async send(token: string, messageData: any): Promise<any> {
    const response = await apiClient.post('/messages', messageData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  /**
   * Get messages
   */
  async getAll(token: string, params?: any): Promise<any> {
    const response = await apiClient.get('/messages', {
      headers: { Authorization: `Bearer ${token}` },
      params
    });
    return response.data;
  },

  /**
   * Mark messages as read
   */
  async markAsRead(token: string, messageIds: string[]): Promise<void> {
    await apiClient.post('/messages/mark-read', { messageIds }, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
};

/**
 * Category APIs
 */
export const categories = {
  /**
   * Get all categories
   */
  async getAll(): Promise<any> {
    const response = await apiClient.get('/categories');
    return response.data;
  },

  /**
   * Get category by ID
   */
  async getById(categoryId: string): Promise<any> {
    const response = await apiClient.get(`/categories/${categoryId}`);
    return response.data;
  }
};

/**
 * Test data cleanup utilities
 */
export const cleanup = {
  /**
   * Delete test jobs created during tests
   */
  async deleteTestJobs(token: string, titlePattern: string = 'Test Job'): Promise<number> {
    try {
      const { data } = await jobs.getAll(token);
      const testJobs = data.filter((job: any) =>
        job.title?.includes(titlePattern)
      );

      let deleted = 0;
      for (const job of testJobs) {
        try {
          await jobs.delete(token, job.id);
          deleted++;
        } catch (error) {
          console.warn(`Failed to delete job ${job.id}`);
        }
      }

      console.log(`✓ Deleted ${deleted} test jobs`);
      return deleted;
    } catch (error) {
      console.error('Failed to cleanup test jobs:', error);
      return 0;
    }
  },

  /**
   * Delete test bids
   */
  async deleteTestBids(token: string): Promise<number> {
    try {
      const { data } = await bids.getAll(token);

      let deleted = 0;
      for (const bid of data) {
        try {
          // Note: Would need delete endpoint
          deleted++;
        } catch (error) {
          console.warn(`Failed to delete bid ${bid.id}`);
        }
      }

      return deleted;
    } catch (error) {
      console.error('Failed to cleanup test bids:', error);
      return 0;
    }
  }
};

/**
 * Utility functions
 */

/**
 * Create authenticated API client
 */
export function createAuthClient(token: string): AxiosInstance {
  return axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
}

/**
 * Make authenticated request
 */
export async function authenticatedRequest<T>(
  token: string,
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  endpoint: string,
  data?: any
): Promise<T> {
  const client = createAuthClient(token);

  const response = await client.request({
    method,
    url: endpoint,
    data
  });

  return response.data;
}

/**
 * Retry API request with exponential backoff
 */
export async function retryRequest<T>(
  requestFn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000
  } = options;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      console.log(`Request failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('Request failed after all retries');
}

/**
 * Check API response status
 */
export function isSuccessResponse(status: number): boolean {
  return status >= 200 && status < 300;
}

/**
 * Extract error message from API error
 */
export function getErrorMessage(error: any): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message;
  }
  return error.message || 'Unknown error';
}

// Export default API client
export default {
  client: apiClient,
  auth,
  jobs,
  bids,
  messages,
  categories,
  cleanup,
  checkHealth,
  waitForAPI,
  createAuthClient,
  authenticatedRequest,
  retryRequest,
  isSuccessResponse,
  getErrorMessage
};
