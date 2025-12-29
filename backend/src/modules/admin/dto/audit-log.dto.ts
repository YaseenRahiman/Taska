import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsInt,
  Min,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AuditAction {
  // User actions
  USER_CREATE = 'USER_CREATE',
  USER_UPDATE = 'USER_UPDATE',
  USER_DELETE = 'USER_DELETE',
  USER_BAN = 'USER_BAN',
  USER_SUSPEND = 'USER_SUSPEND',
  USER_VERIFY = 'USER_VERIFY',
  USER_UNBAN = 'USER_UNBAN',
  USER_UNSUSPEND = 'USER_UNSUSPEND',

  // Job actions
  JOB_CREATE = 'JOB_CREATE',
  JOB_UPDATE = 'JOB_UPDATE',
  JOB_DELETE = 'JOB_DELETE',
  JOB_APPROVE = 'JOB_APPROVE',
  JOB_REJECT = 'JOB_REJECT',
  JOB_CLOSE = 'JOB_CLOSE',

  // Bid actions
  BID_APPROVE = 'BID_APPROVE',
  BID_REJECT = 'BID_REJECT',
  BID_DELETE = 'BID_DELETE',

  // Payment actions
  PAYMENT_APPROVE = 'PAYMENT_APPROVE',
  PAYMENT_REJECT = 'PAYMENT_REJECT',
  PAYMENT_REFUND = 'PAYMENT_REFUND',
  PAYMENT_RELEASE = 'PAYMENT_RELEASE',

  // Review actions
  REVIEW_APPROVE = 'REVIEW_APPROVE',
  REVIEW_REJECT = 'REVIEW_REJECT',
  REVIEW_DELETE = 'REVIEW_DELETE',
  REVIEW_HIDE = 'REVIEW_HIDE',

  // Content moderation
  REPORT_RESOLVE = 'REPORT_RESOLVE',
  REPORT_DISMISS = 'REPORT_DISMISS',
  DISPUTE_RESOLVE = 'DISPUTE_RESOLVE',

  // System settings
  SETTINGS_UPDATE = 'SETTINGS_UPDATE',
  FEATURE_FLAG_TOGGLE = 'FEATURE_FLAG_TOGGLE',
  EMAIL_TEMPLATE_UPDATE = 'EMAIL_TEMPLATE_UPDATE',
  ANNOUNCEMENT_CREATE = 'ANNOUNCEMENT_CREATE',
  ANNOUNCEMENT_DELETE = 'ANNOUNCEMENT_DELETE',

  // Bulk operations
  BULK_OPERATION_START = 'BULK_OPERATION_START',
  BULK_OPERATION_COMPLETE = 'BULK_OPERATION_COMPLETE',
  BULK_OPERATION_CANCEL = 'BULK_OPERATION_CANCEL',

  // Admin management
  ADMIN_ROLE_GRANT = 'ADMIN_ROLE_GRANT',
  ADMIN_ROLE_REVOKE = 'ADMIN_ROLE_REVOKE',
}

export enum EntityType {
  USER = 'USER',
  JOB = 'JOB',
  BID = 'BID',
  PAYMENT = 'PAYMENT',
  REVIEW = 'REVIEW',
  MESSAGE = 'MESSAGE',
  NOTIFICATION = 'NOTIFICATION',
  REPORT = 'REPORT',
  DISPUTE = 'DISPUTE',
  SETTINGS = 'SETTINGS',
  FEATURE_FLAG = 'FEATURE_FLAG',
  EMAIL_TEMPLATE = 'EMAIL_TEMPLATE',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  BULK_OPERATION = 'BULK_OPERATION',
  ADMIN = 'ADMIN',
}

export class CreateAuditLogDto {
  @ApiProperty({
    description: 'Admin user ID',
    example: 'admin-id-123',
  })
  @IsString()
  adminId: string;

  @ApiProperty({
    description: 'Action performed',
    enum: AuditAction,
    example: AuditAction.USER_BAN,
  })
  @IsEnum(AuditAction)
  action: AuditAction;

  @ApiProperty({
    description: 'Entity type',
    enum: EntityType,
    example: EntityType.USER,
  })
  @IsEnum(EntityType)
  entityType: EntityType;

  @ApiProperty({
    description: 'Entity ID',
    example: 'user-id-456',
  })
  @IsString()
  entityId: string;

  @ApiPropertyOptional({
    description: 'State before the action',
    example: { status: 'ACTIVE', role: 'CLIENT' },
  })
  @IsOptional()
  beforeState?: any;

  @ApiPropertyOptional({
    description: 'State after the action',
    example: { status: 'BANNED', role: 'CLIENT' },
  })
  @IsOptional()
  afterState?: any;

  @ApiPropertyOptional({
    description: 'Reason for the action',
    example: 'Violating community guidelines',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({
    description: 'IP address of the admin',
    example: '192.168.1.1',
  })
  @IsString()
  ipAddress: string;

  @ApiProperty({
    description: 'User agent of the admin',
    example: 'Mozilla/5.0...',
  })
  @IsString()
  userAgent: string;

  @ApiProperty({
    description: 'Whether the action was successful',
    example: true,
  })
  @IsBoolean()
  success: boolean;

  @ApiPropertyOptional({
    description: 'Error message if action failed',
    example: 'User not found',
  })
  @IsOptional()
  @IsString()
  errorMessage?: string;
}

export class AuditLogQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by admin user ID',
    example: 'admin-id-123',
  })
  @IsOptional()
  @IsString()
  adminId?: string;

  @ApiPropertyOptional({
    description: 'Filter by action type',
    enum: AuditAction,
  })
  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @ApiPropertyOptional({
    description: 'Filter by entity type',
    enum: EntityType,
  })
  @IsOptional()
  @IsEnum(EntityType)
  entityType?: EntityType;

  @ApiPropertyOptional({
    description: 'Filter by entity ID',
    example: 'user-id-456',
  })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional({
    description: 'Filter by success status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  success?: boolean;

  @ApiPropertyOptional({
    description: 'Start date for filtering',
    example: '2025-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for filtering',
    example: '2025-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}

export class AuditLogResponseDto {
  @ApiProperty({
    description: 'Audit log ID',
    example: 'log-id-123',
  })
  id: string;

  @ApiProperty({
    description: 'Admin user ID',
    example: 'admin-id-123',
  })
  adminId: string;

  @ApiProperty({
    description: 'Admin user name',
    example: 'John Doe',
  })
  adminName: string;

  @ApiProperty({
    description: 'Action performed',
    enum: AuditAction,
    example: AuditAction.USER_BAN,
  })
  action: AuditAction;

  @ApiProperty({
    description: 'Entity type',
    enum: EntityType,
    example: EntityType.USER,
  })
  entityType: EntityType;

  @ApiProperty({
    description: 'Entity ID',
    example: 'user-id-456',
  })
  entityId: string;

  @ApiPropertyOptional({
    description: 'State before the action',
  })
  beforeState?: any;

  @ApiPropertyOptional({
    description: 'State after the action',
  })
  afterState?: any;

  @ApiPropertyOptional({
    description: 'Reason for the action',
    example: 'Violating community guidelines',
  })
  reason?: string;

  @ApiProperty({
    description: 'IP address of the admin',
    example: '192.168.1.1',
  })
  ipAddress: string;

  @ApiProperty({
    description: 'User agent of the admin',
    example: 'Mozilla/5.0...',
  })
  userAgent: string;

  @ApiProperty({
    description: 'Whether the action was successful',
    example: true,
  })
  success: boolean;

  @ApiPropertyOptional({
    description: 'Error message if action failed',
    example: 'User not found',
  })
  errorMessage?: string;

  @ApiProperty({
    description: 'Timestamp of the action',
    example: '2025-11-06T10:00:00Z',
  })
  createdAt: Date;
}

export class UserActivityQueryDto {
  @ApiProperty({
    description: 'User ID to get activity for',
    example: 'user-id-123',
  })
  @IsString()
  userId: string;

  @ApiPropertyOptional({
    description: 'Filter by activity type',
    enum: ['login', 'profile', 'job', 'bid', 'payment', 'review', 'message'],
  })
  @IsOptional()
  @IsEnum(['login', 'profile', 'job', 'bid', 'payment', 'review', 'message'])
  type?: string;

  @ApiPropertyOptional({
    description: 'Start date for filtering',
    example: '2025-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for filtering',
    example: '2025-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}

export class SystemEventQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by severity',
    enum: ['info', 'warning', 'error', 'critical'],
  })
  @IsOptional()
  @IsEnum(['info', 'warning', 'error', 'critical'])
  severity?: string;

  @ApiPropertyOptional({
    description: 'Start date for filtering',
    example: '2025-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for filtering',
    example: '2025-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}

export class ExportAuditLogsDto {
  @ApiProperty({
    description: 'Export format',
    enum: ['csv', 'json'],
    example: 'csv',
  })
  @IsEnum(['csv', 'json'])
  format: 'csv' | 'json';

  @ApiPropertyOptional({
    description: 'Filters to apply',
    type: AuditLogQueryDto,
  })
  @IsOptional()
  filters?: AuditLogQueryDto;
}
