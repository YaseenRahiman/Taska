// Bulk Operations TypeScript Types

export type BulkOperationType =
  | 'USER_BAN'
  | 'USER_SUSPEND'
  | 'USER_VERIFY'
  | 'EMAIL_SEND'
  | 'CONTENT_MODERATE'
  | 'DATA_EXPORT';

export type BulkOperationStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface BulkOperation {
  id: string;
  type: BulkOperationType;
  status: BulkOperationStatus;
  totalItems: number;
  processed: number;
  succeeded: number;
  failed: number;
  initiatedBy: string;
  config: Record<string, any>;
  results?: Record<string, any>;
  startedAt: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BulkUserBanRequest {
  userIds: string[];
  reason: string;
  permanent?: boolean;
}

export interface BulkUserSuspendRequest {
  userIds: string[];
  reason: string;
  expiryDate?: string;
}

export interface BulkUserVerifyRequest {
  userIds: string[];
}

export interface BulkEmailSendRequest {
  recipients: string[] | 'all' | 'clients' | 'artisans';
  subject: string;
  body: string;
  templateId?: string;
  scheduleAt?: string;
}

export interface BulkContentModerateRequest {
  contentIds: string[];
  contentType: 'JOB' | 'REVIEW' | 'COMMENT';
  action: 'APPROVE' | 'REJECT' | 'HIDE' | 'DELETE';
  reason?: string;
}

export interface BulkExportRequest {
  entityType: 'USERS' | 'JOBS' | 'PAYMENTS' | 'REVIEWS';
  format: 'CSV' | 'JSON' | 'EXCEL';
  filters?: Record<string, any>;
  fields?: string[];
}

export interface BulkOperationResponse {
  operationId: string;
  status: BulkOperationStatus;
  message: string;
}

export interface PaginatedBulkOperations {
  operations: BulkOperation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface User {
  id: string;
  email: string;
  role: 'CLIENT' | 'ARTISAN' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  verified: boolean;
  profile?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
  createdAt: string;
  updatedAt: string;
}
