// Payment Approval TypeScript Types

export type PaymentApprovalStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'HELD'
  | 'RELEASED';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface RiskFactor {
  factor: string;
  score: number;
  description: string;
  severity: RiskLevel;
}

export interface RiskScore {
  overall: number;
  level: RiskLevel;
  factors: RiskFactor[];
  recommendation: string;
}

export interface InvestigationNote {
  id: string;
  paymentId: string;
  adminId: string;
  adminName: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionHistory {
  id: string;
  action: string;
  performedBy: string;
  performedByName: string;
  timestamp: string;
  details?: Record<string, any>;
}

export interface ClientInfo {
  id: string;
  email: string;
  name: string;
  phone?: string;
  totalJobs: number;
  totalSpent: number;
  accountAge: number;
  verificationStatus: boolean;
}

export interface ArtisanInfo {
  id: string;
  email: string;
  name: string;
  phone?: string;
  completedJobs: number;
  totalEarned: number;
  rating: number;
  accountAge: number;
  verificationStatus: boolean;
}

export interface JobInfo {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  createdAt: string;
  budget: number;
}

export interface PaymentApproval {
  id: string;
  amount: number;
  currency: string;
  status: PaymentApprovalStatus;
  clientId: string;
  artisanId: string;
  jobId: string;
  client: ClientInfo;
  artisan: ArtisanInfo;
  job: JobInfo;
  riskScore: RiskScore;
  flaggedAt: string;
  flaggedReason?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectedReason?: string;
  heldAt?: string;
  heldBy?: string;
  heldReason?: string;
  heldUntil?: string;
  releasedAt?: string;
  releasedBy?: string;
  investigationNotes?: InvestigationNote[];
  transactionHistory?: TransactionHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface ApprovePaymentRequest {
  paymentId: string;
  note?: string;
}

export interface RejectPaymentRequest {
  paymentId: string;
  reason: string;
  note?: string;
}

export interface HoldPaymentRequest {
  paymentId: string;
  reason: string;
  holdUntil?: string;
  note?: string;
}

export interface ReleasePaymentRequest {
  paymentId: string;
  note?: string;
}

export interface BulkApproveRequest {
  paymentIds: string[];
  note?: string;
}

export interface AddInvestigationNoteRequest {
  paymentId: string;
  note: string;
}

export interface PaymentApprovalFilters {
  status?: PaymentApprovalStatus[];
  minAmount?: number;
  maxAmount?: number;
  minRiskScore?: number;
  maxRiskScore?: number;
  startDate?: string;
  endDate?: string;
  clientId?: string;
  artisanId?: string;
  jobId?: string;
}

export interface PaymentApprovalSearchParams {
  query?: string;
  searchBy?: 'paymentId' | 'clientName' | 'artisanName' | 'jobId';
}

export interface PaginatedPaymentApprovals {
  payments: PaymentApproval[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaymentApprovalResponse {
  payment: PaymentApproval;
  message: string;
}

export interface BulkApprovalResponse {
  operationId: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  message: string;
  processedCount?: number;
  failedCount?: number;
}

export interface PaymentApprovalStats {
  pending: number;
  approved: number;
  rejected: number;
  held: number;
  totalAmount: number;
  averageRiskScore: number;
  highRiskCount: number;
}
