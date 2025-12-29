import apiClient from '@/lib/api';
import type {
  EscrowConfig,
  UpdateEscrowConfigRequest,
  EscrowHold,
  EscrowHoldFilters,
  PaginatedEscrowHolds,
  ReleaseEscrowRequest,
  RefundEscrowRequest,
  EscrowAnalytics,
  EscrowAnalyticsFilters,
  EscrowOperationResponse,
  EscrowHoldSort,
} from '@/types/escrow-config.types';

/**
 * Escrow Configuration API Service
 * Handles all API calls related to escrow configuration and management
 */
class EscrowConfigService {
  private baseUrl = '/admin/escrow';

  /**
   * Get current escrow configuration settings
   */
  async getConfig(): Promise<EscrowConfig> {
    const response = await apiClient.get(`${this.baseUrl}/config`);
    return response.data;
  }

  /**
   * Update escrow configuration settings
   */
  async updateConfig(config: UpdateEscrowConfigRequest): Promise<EscrowConfig> {
    const response = await apiClient.put(`${this.baseUrl}/config`, config);
    return response.data;
  }

  /**
   * Get paginated list of escrow holds with filters
   */
  async getHolds(
    page: number = 1,
    limit: number = 20,
    filters?: EscrowHoldFilters,
    sort?: EscrowHoldSort
  ): Promise<PaginatedEscrowHolds> {
    const params = {
      page,
      limit,
      ...filters,
      ...(sort && {
        sortBy: sort.field,
        sortOrder: sort.direction,
      }),
    };

    const response = await apiClient.get(`${this.baseUrl}/holds`, { params });
    return response.data;
  }

  /**
   * Get single escrow hold details
   */
  async getHold(holdId: string): Promise<EscrowHold> {
    const response = await apiClient.get(`${this.baseUrl}/holds/${holdId}`);
    return response.data;
  }

  /**
   * Get active escrow holds only
   */
  async getActiveHolds(
    page: number = 1,
    limit: number = 20,
    sort?: EscrowHoldSort
  ): Promise<PaginatedEscrowHolds> {
    return this.getHolds(page, limit, { status: 'ACTIVE' }, sort);
  }

  /**
   * Manually release escrow hold to artisan
   */
  async releaseHold(
    holdId: string,
    request?: ReleaseEscrowRequest
  ): Promise<EscrowOperationResponse> {
    const response = await apiClient.post(
      `${this.baseUrl}/holds/${holdId}/release`,
      request || {}
    );
    return response.data;
  }

  /**
   * Refund escrow hold to client
   */
  async refundHold(
    holdId: string,
    request: RefundEscrowRequest
  ): Promise<EscrowOperationResponse> {
    const response = await apiClient.post(
      `${this.baseUrl}/holds/${holdId}/refund`,
      request
    );
    return response.data;
  }

  /**
   * Bulk release multiple holds
   */
  async bulkRelease(
    holdIds: string[],
    reason?: string
  ): Promise<{ successful: string[]; failed: string[] }> {
    const response = await apiClient.post(`${this.baseUrl}/holds/bulk-release`, {
      holdIds,
      reason,
    });
    return response.data;
  }

  /**
   * Get escrow analytics data
   */
  async getAnalytics(
    filters?: EscrowAnalyticsFilters
  ): Promise<EscrowAnalytics> {
    const response = await apiClient.get(`${this.baseUrl}/analytics`, {
      params: filters,
    });
    return response.data;
  }

  /**
   * Export escrow holds to CSV
   */
  async exportHolds(filters?: EscrowHoldFilters): Promise<Blob> {
    const response = await apiClient.get(`${this.baseUrl}/holds/export`, {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Get transaction history for a specific hold
   */
  async getHoldHistory(holdId: string): Promise<any[]> {
    const response = await apiClient.get(`${this.baseUrl}/holds/${holdId}/history`);
    return response.data;
  }
}

// Export singleton instance
const escrowConfigService = new EscrowConfigService();
export default escrowConfigService;

// Also export the class for testing
export { EscrowConfigService };
