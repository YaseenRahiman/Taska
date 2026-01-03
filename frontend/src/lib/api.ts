import axios, { AxiosInstance, AxiosError } from 'axios';
import { getApiBaseUrl } from '@/lib/api-url';

interface ApiConfig {
  baseURL: string;
  timeout: number;
}

class ApiClient {
  private client: AxiosInstance;
  private refreshTokenPromise: Promise<string> | null = null;

  constructor(config: ApiConfig) {
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh and auth errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // Handle 401 Unauthorized - attempt token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Use shared refresh token promise to avoid multiple refresh calls
            if (!this.refreshTokenPromise) {
              this.refreshTokenPromise = this.refreshToken();
            }

            const newToken = await this.refreshTokenPromise;
            this.refreshTokenPromise = null;

            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed - clear tokens and notify app
            this.handleAuthFailure();
            return Promise.reject(refreshError);
          }
        }

        // Handle 403 Forbidden - also treat as auth failure for job endpoints
        if (error.response?.status === 403) {
          const url = error.config?.url || '';
          // If it's a protected resource, treat as auth failure
          if (url.includes('/jobs') || url.includes('/bids') || url.includes('/payments')) {
            this.handleAuthFailure();
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private handleAuthFailure() {
    // Clear all authentication data
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    // Clear cookies
    if (typeof document !== 'undefined') {
      document.cookie = 'accessToken=; path=/; max-age=0';
      document.cookie = 'refreshToken=; path=/; max-age=0';
    }

    // Dispatch custom event for auth provider to handle
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
  }

  private async refreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const apiUrl = getApiBaseUrl();
    const response = await axios.post(`${apiUrl}/auth/refresh-token`, {
      refreshToken,
    });

    const { accessToken } = response.data;

    // Store in localStorage
    localStorage.setItem('accessToken', accessToken);

    // Sync to cookies for middleware
    if (typeof document !== 'undefined') {
      document.cookie = `accessToken=${accessToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
    }

    return accessToken;
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  async register(userData: any) {
    const response = await this.client.post('/auth/register', userData);
    return response.data;
  }

  async logout() {
    const response = await this.client.post('/auth/logout');
    return response.data;
  }

  async verifyEmail(token: string) {
    const response = await this.client.post('/auth/verify-email', { token });
    return response.data;
  }

  async requestPasswordReset(email: string) {
    const response = await this.client.post('/auth/request-password-reset', { email });
    return response.data;
  }

  async resetPassword(token: string, newPassword: string) {
    const response = await this.client.post('/auth/reset-password', { token, newPassword });
    return response.data;
  }

  async getProfile() {
    const response = await this.client.get('/auth/profile');
    return response.data;
  }

  // Job endpoints
  async getJobs(params?: any) {
    const response = await this.client.get('/jobs', { params });
    return response.data;
  }

  async getJob(id: string) {
    const response = await this.client.get(`/jobs/${id}`);
    return response.data;
  }

  async createJob(jobData: any) {
    const response = await this.client.post('/jobs', jobData);
    return response.data;
  }

  async updateJob(id: string, jobData: any) {
    const response = await this.client.patch(`/jobs/${id}`, jobData);
    return response.data;
  }

  async deleteJob(id: string) {
    const response = await this.client.delete(`/jobs/${id}`);
    return response.data;
  }

  // Bid endpoints
  async getBids(params?: any) {
    const response = await this.client.get('/bids', { params });
    return response.data;
  }

  async createBid(bidData: any) {
    const response = await this.client.post('/bids', bidData);
    return response.data;
  }

  async acceptBid(id: string) {
    const response = await this.client.post(`/bids/${id}/accept`);
    return response.data;
  }

  async rejectBid(id: string, reason?: string) {
    const response = await this.client.post(`/bids/${id}/reject`, { reason });
    return response.data;
  }

  // Message endpoints
  async getMessages(params?: any) {
    const response = await this.client.get('/messages', { params });
    return response.data;
  }

  async sendMessage(messageData: any) {
    const response = await this.client.post('/messages', messageData);
    return response.data;
  }

  async markMessagesAsRead(messageIds: string[]) {
    const response = await this.client.post('/messages/mark-read', { messageIds });
    return response.data;
  }

  // File upload
  async uploadFile(file: File, type?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (type) {
      formData.append('type', type);
    }

    const response = await this.client.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Generic methods for direct access
  get(url: string, config?: any) {
    return this.client.get(url, config);
  }

  post(url: string, data?: any, config?: any) {
    return this.client.post(url, data, config);
  }

  put(url: string, data?: any, config?: any) {
    return this.client.put(url, data, config);
  }

  patch(url: string, data?: any, config?: any) {
    return this.client.patch(url, data, config);
  }

  delete(url: string, config?: any) {
    return this.client.delete(url, config);
  }
}

// Lazy-initialized API client to ensure proper base URL detection on client-side
let _apiClient: ApiClient | null = null;
let _lastBaseUrl: string | null = null;

function getApiClient(): ApiClient {
  const currentBaseUrl = getApiBaseUrl();

  // Reinitialize if base URL has changed (e.g., SSR to client transition)
  if (!_apiClient || _lastBaseUrl !== currentBaseUrl) {
    _apiClient = new ApiClient({
      baseURL: currentBaseUrl,
      timeout: 10000, // 10 seconds
    });
    _lastBaseUrl = currentBaseUrl;
  }

  return _apiClient;
}

// Proxy object that lazily gets the API client
const apiClient = new Proxy({} as ApiClient, {
  get(_, prop) {
    const client = getApiClient();
    const value = client[prop as keyof ApiClient];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

export default apiClient;

// Export as 'api' for easier importing
export { apiClient as api };

// Export types for better TypeScript support
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
  statusCode: number;
}
