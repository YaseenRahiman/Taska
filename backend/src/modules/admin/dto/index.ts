// Admin User Management DTOs
export interface AdminUserFilters {
  role?: 'CLIENT' | 'ARTISAN' | 'ADMIN' | 'ASSESSOR';
  status?: 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'INACTIVE';
  verified?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  skip?: number;
  take?: number;
  // Frontend pagination parameters (converted to skip/take)
  page?: number;
  limit?: number;
  // Sorting parameters
  sortBy?: 'email' | 'role' | 'status' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface AdminUserManagementDto {
  users: any[];
  total: number;
  activeUsers: number;
  newUsersToday: number;
  verificationQueue: number;
  filters: AdminUserFilters;
}

export interface AdminUserActionDto {
  userId: string;
  action: 'BAN' | 'SUSPEND' | 'VERIFY' | 'RESET_PASSWORD';
  reason?: string;
  suspendUntil?: Date;
}

// Admin Content Moderation DTOs
export interface AdminContentFilters {
  contentType?: 'JOB' | 'MESSAGE' | 'REVIEW';
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  reportedBy?: string;
  dateFrom?: Date;
  dateTo?: Date;
  skip?: number;
  take?: number;
}

export interface AdminContentModerationDto {
  reportedJobs: any[];
  reportedMessages: any[];
  flaggedReviews: any[];
  pendingDisputes: any[];
  totalReported: number;
  filters: AdminContentFilters;
}

export interface AdminDispute {
  id: string;
  jobId: string;
  clientId: string;
  artisanId: string;
  reason: string;
  description: string;
  amount: number;
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'ESCALATED';
  createdAt: Date;
  resolvedAt?: Date;
  resolution?: string;
  refundAmount?: number;
}

// Admin Analytics DTOs
export interface AdminAnalyticsDto {
  dateFrom: Date;
  dateTo: Date;
  metrics: AdminMetrics;
}

export interface AdminMetrics {
  totalUsers: number;
  activeUsers: number;
  totalJobs: number;
  activeJobs: number;
  totalBids: number;
  totalPayments: number;
  totalRevenue: number;
  todayRevenue: number;
  monthlyRevenue: number;
  userGrowth: number;
  jobGrowth: number;
  conversionRate: number;
  systemHealth: any;
  recentActivity: any[];
}

export interface AdminReportDto {
  type: 'USERS' | 'JOBS' | 'REVENUE' | 'DISPUTES';
  dateFrom: Date;
  dateTo: Date;
  format: 'CSV' | 'PDF';
  recordCount: number;
  downloadUrl: string;
  generatedAt: Date;
}

export interface AdminFinancialReport {
  totalRevenue: number;
  platformFees: number;
  pendingPayouts: number;
  escrowAmount: number;
  totalTransactions: number;
  lastReconciled: Date;
}

// Admin System Configuration DTOs
export interface AdminSystemConfigDto {
  platformFeePercentage: number;
  minimumWithdrawal: number;
  maximumJobBudget: number;
  emailTemplates: { [key: string]: string };
  featureFlags: { [key: string]: boolean };
  categories: any[];
}

// Admin Feature Flag DTO
export class AdminFeatureFlagDto {
  name: string;
  enabled: boolean;
  description?: string;
  updatedBy?: string;
  updatedAt?: Date;
}

// Admin Email Template DTO
export class AdminEmailTemplateDto {
  type: string;
  subject: string;
  content: string;
  variables: string[];
  updatedBy?: string;
  updatedAt?: Date;
}

// Admin Category Management DTO
export class AdminCategoryDto {
  id?: string;
  name: string;
  description?: string;
  parentId?: string;
  iconUrl?: string;
  isActive: boolean;
  sortOrder?: number;
}

// Admin Moderation Action DTO
export class AdminModerationActionDto {
  contentId: string;
  contentType: 'JOB' | 'MESSAGE' | 'REVIEW' | 'USER';
  action: 'APPROVE' | 'REJECT';
  reason?: string;
  notes?: string;
}

// Admin Dispute Resolution DTO
export class AdminDisputeResolutionDto {
  disputeId: string;
  resolution: string;
  refundAmount?: number;
  refundToClient?: boolean;
  compensateArtisan?: boolean;
  notes?: string;
}

// Export all analytics DTOs
export * from './analytics.dto';

// Export escrow configuration DTOs
export * from './escrow-config.dto';
