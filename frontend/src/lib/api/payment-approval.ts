import apiClient from '../api';
import type {
  PaymentApproval,
  PaginatedPaymentApprovals,
  PaymentApprovalFilters,
  PaymentApprovalSearchParams,
  ApprovePaymentRequest,
  RejectPaymentRequest,
  HoldPaymentRequest,
  ReleasePaymentRequest,
  BulkApproveRequest,
  AddInvestigationNoteRequest,
  PaymentApprovalResponse,
  BulkApprovalResponse,
  PaymentApprovalStats,
  InvestigationNote,
} from '@/types/payment-approval.types';

/**
 * Payment Approval API Service
 * Handles all payment approval-related API calls with bearer token authentication
 */
class PaymentApprovalService {
  private baseUrl = '/admin/payments';

  /**
   * Get pending payments with pagination and filters
   */
  async getPendingPayments(
    page: number = 1,
    limit: number = 20,
    filters?: PaymentApprovalFilters,
    searchParams?: PaymentApprovalSearchParams
  ): Promise<PaginatedPaymentApprovals> {
    const params: Record<string, any> = {
      page,
      limit,
      status: 'PENDING',
      ...filters,
      ...searchParams,
    };

    const response = await apiClient.get(`${this.baseUrl}/pending`, { params });
    return response.data;
  }

  /**
   * Get all payments (all statuses) with pagination and filters
   */
  async getAllPayments(
    page: number = 1,
    limit: number = 20,
    filters?: PaymentApprovalFilters,
    searchParams?: PaymentApprovalSearchParams
  ): Promise<PaginatedPaymentApprovals> {
    const params: Record<string, any> = {
      page,
      limit,
      ...filters,
      ...searchParams,
    };

    const response = await apiClient.get(this.baseUrl, { params });
    return response.data;
  }

  /**
   * Get flagged/high-risk payments
   */
  async getFlaggedPayments(
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedPaymentApprovals> {
    const params = { page, limit };
    const response = await apiClient.get(`${this.baseUrl}/flagged`, { params });
    return response.data;
  }

  /**
   * Get payment details by ID
   */
  async getPaymentDetails(paymentId: string): Promise<PaymentApproval> {
    const response = await apiClient.get(`${this.baseUrl}/${paymentId}`);
    return response.data;
  }

  /**
   * Approve a payment
   */
  async approvePayment(request: ApprovePaymentRequest): Promise<PaymentApprovalResponse> {
    const { paymentId, note } = request;
    const response = await apiClient.post(`${this.baseUrl}/${paymentId}/approve`, { note });
    return response.data;
  }

  /**
   * Reject a payment (requires reason)
   */
  async rejectPayment(request: RejectPaymentRequest): Promise<PaymentApprovalResponse> {
    const { paymentId, reason, note } = request;
    const response = await apiClient.post(`${this.baseUrl}/${paymentId}/reject`, {
      reason,
      note,
    });
    return response.data;
  }

  /**
   * Hold a payment (requires reason)
   */
  async holdPayment(request: HoldPaymentRequest): Promise<PaymentApprovalResponse> {
    const { paymentId, reason, holdUntil, note } = request;
    const response = await apiClient.post(`${this.baseUrl}/${paymentId}/hold`, {
      reason,
      holdUntil,
      note,
    });
    return response.data;
  }

  /**
   * Release a held payment
   */
  async releasePayment(request: ReleasePaymentRequest): Promise<PaymentApprovalResponse> {
    const { paymentId, note } = request;
    const response = await apiClient.post(`${this.baseUrl}/${paymentId}/release`, { note });
    return response.data;
  }

  /**
   * Bulk approve payments (max 50)
   */
  async bulkApprove(request: BulkApproveRequest): Promise<BulkApprovalResponse> {
    if (request.paymentIds.length > 50) {
      throw new Error('Cannot approve more than 50 payments at once');
    }

    const response = await apiClient.post(`${this.baseUrl}/bulk-approve`, {
      paymentIds: request.paymentIds,
      note: request.note,
    });
    return response.data;
  }

  /**
   * Add investigation note to a payment
   */
  async addInvestigationNote(
    request: AddInvestigationNoteRequest
  ): Promise<InvestigationNote> {
    const { paymentId, note } = request;
    const response = await apiClient.post(`${this.baseUrl}/${paymentId}/notes`, { note });
    return response.data;
  }

  /**
   * Get investigation notes for a payment
   */
  async getInvestigationNotes(paymentId: string): Promise<InvestigationNote[]> {
    const response = await apiClient.get(`${this.baseUrl}/${paymentId}/notes`);
    return response.data;
  }

  /**
   * Get payment approval statistics
   */
  async getStats(): Promise<PaymentApprovalStats> {
    const response = await apiClient.get(`${this.baseUrl}/stats`);
    return response.data;
  }

  /**
   * Search payments by query
   */
  async searchPayments(
    query: string,
    searchBy: 'paymentId' | 'clientName' | 'artisanName' | 'jobId' = 'paymentId',
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedPaymentApprovals> {
    const params = {
      query,
      searchBy,
      page,
      limit,
    };

    const response = await apiClient.get(`${this.baseUrl}/search`, { params });
    return response.data;
  }
}

// Export singleton instance
export const paymentApprovalService = new PaymentApprovalService();

// Export default for easy importing
export default paymentApprovalService;
