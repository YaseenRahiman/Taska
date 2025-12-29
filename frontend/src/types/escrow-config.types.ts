// Escrow Configuration TypeScript Types

export interface EscrowConfig {
  id: string;

  // Auto-release settings
  autoReleaseEnabled: boolean;
  autoReleaseDays: number; // 1-90 days

  // Hold duration settings
  defaultHoldDuration: number; // 1-365 days
  maxHoldDuration: number; // 1-365 days

  // Dispute settings
  disputeWindowEnabled: boolean;
  disputeWindowDays: number; // 1-60 days

  // Fee configuration
  feePercentage: number; // 0-10%
  minHoldAmount: number; // currency
  maxHoldAmount: number; // currency

  updatedAt: string;
  updatedBy: string;
}

export interface UpdateEscrowConfigRequest {
  autoReleaseEnabled?: boolean;
  autoReleaseDays?: number;
  defaultHoldDuration?: number;
  maxHoldDuration?: number;
  disputeWindowEnabled?: boolean;
  disputeWindowDays?: number;
  feePercentage?: number;
  minHoldAmount?: number;
  maxHoldAmount?: number;
}

export type EscrowHoldStatus =
  | 'ACTIVE'
  | 'RELEASED'
  | 'REFUNDED'
  | 'DISPUTED'
  | 'EXPIRED';

export interface EscrowHold {
  id: string;
  paymentId: string;
  amount: number;
  currency: string;

  // Parties
  clientId: string;
  clientName: string;
  clientEmail: string;
  artisanId: string;
  artisanName: string;
  artisanEmail: string;

  // Job reference
  jobId: string;
  jobTitle: string;

  // Dates
  holdDate: string;
  expectedReleaseDate: string;
  actualReleaseDate?: string;

  // Status
  status: EscrowHoldStatus;

  // Metadata
  releaseReason?: string;
  refundReason?: string;
  refundAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface EscrowHoldFilters {
  status?: EscrowHoldStatus;
  clientId?: string;
  artisanId?: string;
  jobId?: string;
  fromDate?: string;
  toDate?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface PaginatedEscrowHolds {
  holds: EscrowHold[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ReleaseEscrowRequest {
  reason?: string;
  notifyParties?: boolean;
}

export interface RefundEscrowRequest {
  reason: string; // required, 10-500 chars
  amount?: number; // optional partial refund
  notifyParties?: boolean;
}

export interface EscrowAnalytics {
  // Summary metrics
  totalHolds: {
    count: number;
    totalAmount: number;
  };

  activeHolds: {
    count: number;
    totalAmount: number;
  };

  releasedThisMonth: {
    count: number;
    totalAmount: number;
  };

  refundedThisMonth: {
    count: number;
    totalAmount: number;
  };

  // Statistics
  averageHoldDuration: number; // in days

  // Time series data
  holdsOverTime: {
    date: string;
    activeCount: number;
    releasedCount: number;
    refundedCount: number;
    totalAmount: number;
  }[];

  // Status breakdown
  holdsByStatus: {
    status: EscrowHoldStatus;
    count: number;
    totalAmount: number;
    percentage: number;
  }[];

  // Release reasons
  releaseReasons: {
    reason: string;
    count: number;
    percentage: number;
  }[];

  // Refund reasons
  refundReasons: {
    reason: string;
    count: number;
    percentage: number;
  }[];
}

export interface EscrowAnalyticsFilters {
  fromDate?: string;
  toDate?: string;
  clientId?: string;
  artisanId?: string;
}

export interface EscrowOperationResponse {
  success: boolean;
  message: string;
  holdId?: string;
  newStatus?: EscrowHoldStatus;
}

// Form validation types
export interface EscrowConfigFormErrors {
  autoReleaseDays?: string;
  defaultHoldDuration?: string;
  maxHoldDuration?: string;
  disputeWindowDays?: string;
  feePercentage?: string;
  minHoldAmount?: string;
  maxHoldAmount?: string;
}

export interface RefundFormErrors {
  reason?: string;
  amount?: string;
}

export interface ReleaseFormErrors {
  reason?: string;
}

// Table sorting
export type EscrowHoldSortField =
  | 'holdDate'
  | 'amount'
  | 'expectedReleaseDate'
  | 'status';

export type SortDirection = 'asc' | 'desc';

export interface EscrowHoldSort {
  field: EscrowHoldSortField;
  direction: SortDirection;
}
