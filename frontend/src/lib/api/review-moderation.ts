import apiClient from '../api';
import {
  Review,
  PaginatedFlaggedReviews,
  FlaggedReviewsFilters,
  EditReviewRequest,
  ToggleVisibilityRequest,
  DeleteReviewRequest,
  FlagReviewRequest,
  AddModerationNoteRequest,
  ReviewModerationResponse,
  BatchModerationRequest,
  ExportFlaggedReviewsRequest,
} from '@/types/review-moderation.types';

/**
 * Review Moderation API Service
 * Provides methods for managing flagged reviews and moderation actions
 */
class ReviewModerationService {
  private baseUrl = '/admin/reviews';

  /**
   * Get all reviews (with optional filters)
   */
  async getReviews(params?: FlaggedReviewsFilters & { page?: number; limit?: number }): Promise<PaginatedFlaggedReviews> {
    const response = await apiClient.get(this.baseUrl, { params });
    return response.data;
  }

  /**
   * Get flagged reviews only
   */
  async getFlaggedReviews(params?: FlaggedReviewsFilters & { page?: number; limit?: number }): Promise<PaginatedFlaggedReviews> {
    const response = await apiClient.get(`${this.baseUrl}/flagged`, { params });
    return response.data;
  }

  /**
   * Get review details by ID
   */
  async getReviewDetails(reviewId: string): Promise<Review> {
    const response = await apiClient.get(`${this.baseUrl}/${reviewId}`);
    return response.data;
  }

  /**
   * Edit review content and rating
   */
  async editReview(reviewId: string, data: EditReviewRequest): Promise<ReviewModerationResponse> {
    const response = await apiClient.put(`${this.baseUrl}/${reviewId}`, data);
    return response.data;
  }

  /**
   * Toggle review visibility (hide/show)
   */
  async toggleVisibility(reviewId: string, data: ToggleVisibilityRequest): Promise<ReviewModerationResponse> {
    const response = await apiClient.patch(`${this.baseUrl}/${reviewId}/visibility`, data);
    return response.data;
  }

  /**
   * Delete review (soft delete)
   */
  async deleteReview(reviewId: string, data: DeleteReviewRequest): Promise<ReviewModerationResponse> {
    const response = await apiClient.delete(`${this.baseUrl}/${reviewId}`, { data });
    return response.data;
  }

  /**
   * Flag a review
   */
  async flagReview(reviewId: string, data: FlagReviewRequest): Promise<ReviewModerationResponse> {
    const response = await apiClient.post(`${this.baseUrl}/${reviewId}/flag`, data);
    return response.data;
  }

  /**
   * Unflag a review
   */
  async unflagReview(reviewId: string): Promise<ReviewModerationResponse> {
    const response = await apiClient.post(`${this.baseUrl}/${reviewId}/unflag`);
    return response.data;
  }

  /**
   * Add moderation note
   */
  async addModerationNote(reviewId: string, data: AddModerationNoteRequest): Promise<ReviewModerationResponse> {
    const response = await apiClient.post(`${this.baseUrl}/${reviewId}/notes`, data);
    return response.data;
  }

  /**
   * Get moderation notes for a review
   */
  async getModerationNotes(reviewId: string) {
    const response = await apiClient.get(`${this.baseUrl}/${reviewId}/notes`);
    return response.data;
  }

  /**
   * Get edit history for a review
   */
  async getEditHistory(reviewId: string) {
    const response = await apiClient.get(`${this.baseUrl}/${reviewId}/history`);
    return response.data;
  }

  /**
   * Batch moderation action
   */
  async batchModeration(data: BatchModerationRequest): Promise<ReviewModerationResponse> {
    const response = await apiClient.post(`${this.baseUrl}/batch`, data);
    return response.data;
  }

  /**
   * Export flagged reviews
   */
  async exportFlaggedReviews(data: ExportFlaggedReviewsRequest): Promise<Blob> {
    const response = await apiClient.post(`${this.baseUrl}/export`, data, {
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Get review statistics
   */
  async getStatistics() {
    const response = await apiClient.get(`${this.baseUrl}/statistics`);
    return response.data;
  }
}

// Export singleton instance
export const reviewModerationApi = new ReviewModerationService();

// Export class for testing
export default ReviewModerationService;
