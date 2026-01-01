// Review Moderation TypeScript Types

export type ReviewStatus = 'VISIBLE' | 'HIDDEN' | 'DELETED';
export type FlagReason = 'SPAM' | 'INAPPROPRIATE' | 'FAKE' | 'OFFENSIVE' | 'OTHER';

export interface ReviewModeration {
  id: string;
  reviewId: string;
  flagCount: number;
  flags: ReviewFlag[];
  status: ReviewStatus;
  moderatedBy?: string;
  moderatedAt?: string;
  moderationNotes?: ModerationNote[];
  editHistory?: EditHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface ReviewFlag {
  id: string;
  reviewId: string;
  flaggedBy: string;
  reason: FlagReason;
  description?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  rating: number;
  content: string;
  jobId: string;
  reviewerId: string;
  artisanId: string;
  reviewer: {
    id: string;
    email: string;
    profile?: {
      firstName?: string;
      lastName?: string;
    };
  };
  artisan: {
    id: string;
    email: string;
    profile?: {
      firstName?: string;
      lastName?: string;
      businessName?: string;
    };
  };
  job?: {
    id: string;
    title: string;
  };
  moderation?: ReviewModeration;
  createdAt: string;
  updatedAt: string;
}

export interface ModerationNote {
  id: string;
  reviewId: string;
  content: string;
  createdBy: string;
  admin?: {
    id: string;
    email: string;
    profile?: {
      firstName?: string;
      lastName?: string;
    };
  };
  createdAt: string;
}

export interface EditHistory {
  id: string;
  reviewId: string;
  previousRating: number;
  newRating: number;
  previousContent: string;
  newContent: string;
  editedBy: string;
  editReason: string;
  editor?: {
    id: string;
    email: string;
    profile?: {
      firstName?: string;
      lastName?: string;
    };
  };
  createdAt: string;
}

export interface FlaggedReviewsFilters {
  status?: ReviewStatus;
  flagReason?: FlagReason;
  minRating?: number;
  maxRating?: number;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface PaginatedFlaggedReviews {
  reviews: Review[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EditReviewRequest {
  content: string;
  rating: number;
  editReason: string;
}

export interface ToggleVisibilityRequest {
  visible: boolean;
  reason: string;
}

export interface DeleteReviewRequest {
  reason: string;
}

export interface FlagReviewRequest {
  reason: FlagReason;
  description?: string;
}

export interface AddModerationNoteRequest {
  content: string;
}

export interface ReviewModerationResponse {
  success: boolean;
  message: string;
  review?: Review;
}

export interface BatchModerationRequest {
  reviewIds: string[];
  action: 'HIDE' | 'SHOW' | 'DELETE';
  reason: string;
}

export interface ExportFlaggedReviewsRequest {
  filters?: FlaggedReviewsFilters;
  format: 'CSV' | 'JSON';
}
