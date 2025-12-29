import {
  IsString,
  IsArray,
  IsOptional,
  IsDateString,
  IsEnum,
  IsInt,
  Min,
  ArrayMinSize,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum BulkOperationType {
  USER_BAN = 'USER_BAN',
  USER_SUSPEND = 'USER_SUSPEND',
  USER_VERIFY = 'USER_VERIFY',
  USER_EXPORT = 'USER_EXPORT',
  JOB_EXPORT = 'JOB_EXPORT',
  PAYMENT_EXPORT = 'PAYMENT_EXPORT',
  EMAIL_SEND = 'EMAIL_SEND',
  CONTENT_MODERATE = 'CONTENT_MODERATE',
  DATA_IMPORT = 'DATA_IMPORT',
}

export enum BulkOperationStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export class BulkUserBanDto {
  @ApiProperty({
    description: 'Array of user IDs to ban',
    type: [String],
    example: ['user-id-1', 'user-id-2'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  userIds: string[];

  @ApiProperty({
    description: 'Reason for banning',
    example: 'Violating community guidelines',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class BulkUserSuspendDto {
  @ApiProperty({
    description: 'Array of user IDs to suspend',
    type: [String],
    example: ['user-id-1', 'user-id-2'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  userIds: string[];

  @ApiPropertyOptional({
    description: 'Suspension expiry date',
    example: '2025-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiProperty({
    description: 'Reason for suspension',
    example: 'Suspicious activity detected',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class BulkUserVerifyDto {
  @ApiProperty({
    description: 'Array of user IDs to verify',
    type: [String],
    example: ['user-id-1', 'user-id-2'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  userIds: string[];
}

export class ExportFilterDto {
  @ApiPropertyOptional({
    description: 'Start date for export',
    example: '2025-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for export',
    example: '2025-12-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'User role filter',
    example: 'ARTISAN',
  })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({
    description: 'Status filter',
    example: 'ACTIVE',
  })
  @IsOptional()
  @IsString()
  status?: string;
}

export class BulkExportDto {
  @ApiProperty({
    description: 'Type of data to export',
    enum: ['users', 'jobs', 'payments'],
    example: 'users',
  })
  @IsEnum(['users', 'jobs', 'payments'])
  type: 'users' | 'jobs' | 'payments';

  @ApiPropertyOptional({
    description: 'Filters for export',
    type: ExportFilterDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ExportFilterDto)
  filters?: ExportFilterDto;
}

export class EmailRecipientFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by user role',
    example: 'ARTISAN',
  })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({
    description: 'Filter by account status',
    example: 'ACTIVE',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter by registration date (from)',
    example: '2025-01-01',
  })
  @IsOptional()
  @IsDateString()
  registeredAfter?: string;

  @ApiPropertyOptional({
    description: 'Filter by registration date (to)',
    example: '2025-12-31',
  })
  @IsOptional()
  @IsDateString()
  registeredBefore?: string;

  @ApiPropertyOptional({
    description: 'Specific user IDs to include',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  userIds?: string[];
}

export class BulkEmailSendDto {
  @ApiProperty({
    description: 'Email template ID',
    example: 'template-id-123',
  })
  @IsString()
  @IsNotEmpty()
  templateId: string;

  @ApiProperty({
    description: 'Email subject',
    example: 'Important Update: New Features Available',
  })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({
    description: 'Email body (HTML)',
    example: '<h1>Welcome</h1><p>Check out our new features!</p>',
  })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiProperty({
    description: 'Recipient filters',
    type: EmailRecipientFilterDto,
  })
  @ValidateNested()
  @Type(() => EmailRecipientFilterDto)
  recipients: EmailRecipientFilterDto;

  @ApiPropertyOptional({
    description: 'Schedule send time',
    example: '2025-12-15T10:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  schedule?: string;
}

export class BulkContentModerateDto {
  @ApiProperty({
    description: 'Array of content IDs to moderate',
    type: [String],
    example: ['content-id-1', 'content-id-2'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  contentIds: string[];

  @ApiProperty({
    description: 'Moderation action',
    enum: ['approve', 'reject', 'hide'],
    example: 'approve',
  })
  @IsEnum(['approve', 'reject', 'hide'])
  action: 'approve' | 'reject' | 'hide';

  @ApiPropertyOptional({
    description: 'Reason for moderation action',
    example: 'Content violates guidelines',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class BulkOperationStatusDto {
  @ApiProperty({
    description: 'Operation ID',
    example: 'op-id-123',
  })
  id: string;

  @ApiProperty({
    description: 'Operation type',
    enum: BulkOperationType,
    example: BulkOperationType.USER_BAN,
  })
  type: BulkOperationType;

  @ApiProperty({
    description: 'Operation status',
    enum: BulkOperationStatus,
    example: BulkOperationStatus.PROCESSING,
  })
  status: BulkOperationStatus;

  @ApiProperty({
    description: 'Total items to process',
    example: 100,
  })
  totalItems: number;

  @ApiProperty({
    description: 'Items processed so far',
    example: 45,
  })
  processed: number;

  @ApiProperty({
    description: 'Successfully processed items',
    example: 43,
  })
  succeeded: number;

  @ApiProperty({
    description: 'Failed items',
    example: 2,
  })
  failed: number;

  @ApiProperty({
    description: 'Progress percentage',
    example: 45,
  })
  progress: number;

  @ApiProperty({
    description: 'Operation start time',
    example: '2025-11-06T10:00:00Z',
  })
  startedAt: Date;

  @ApiPropertyOptional({
    description: 'Operation completion time',
    example: '2025-11-06T10:15:00Z',
  })
  completedAt?: Date;

  @ApiPropertyOptional({
    description: 'Error log for failed items',
    example: 'user-id-1: User not found\nuser-id-2: Invalid status',
  })
  errorLog?: string;
}

export class BulkOperationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by operation type',
    enum: BulkOperationType,
  })
  @IsOptional()
  @IsEnum(BulkOperationType)
  type?: BulkOperationType;

  @ApiPropertyOptional({
    description: 'Filter by operation status',
    enum: BulkOperationStatus,
  })
  @IsOptional()
  @IsEnum(BulkOperationStatus)
  status?: BulkOperationStatus;

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
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
