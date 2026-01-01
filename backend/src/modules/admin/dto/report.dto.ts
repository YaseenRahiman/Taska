import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  IsObject,
  ValidateNested,
  IsDateString,
  ArrayMinSize,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportFormat, ReportExecutionStatus } from '@prisma/client';

// ==========================================
// Report Data Source and Configuration Enums
// ==========================================

export enum ReportDataSource {
  USERS = 'USERS',
  JOBS = 'JOBS',
  PAYMENTS = 'PAYMENTS',
  REVIEWS = 'REVIEWS',
  BIDS = 'BIDS',
  MESSAGES = 'MESSAGES',
  WALLET_TRANSACTIONS = 'WALLET_TRANSACTIONS',
  AUDIT_LOGS = 'AUDIT_LOGS',
  BULK_OPERATIONS = 'BULK_OPERATIONS',
}

export enum ReportMetric {
  COUNT = 'COUNT',
  SUM = 'SUM',
  AVERAGE = 'AVERAGE',
  MIN = 'MIN',
  MAX = 'MAX',
  MEDIAN = 'MEDIAN',
  PERCENTAGE = 'PERCENTAGE',
  GROWTH_RATE = 'GROWTH_RATE',
}

export enum ReportGroupBy {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  QUARTER = 'QUARTER',
  YEAR = 'YEAR',
  CATEGORY = 'CATEGORY',
  ROLE = 'ROLE',
  STATUS = 'STATUS',
  NONE = 'NONE',
}

export enum CronFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
}

// ==========================================
// Filter and Configuration DTOs
// ==========================================

export class ReportFilter {
  @ApiPropertyOptional({
    description: 'Field name to filter on',
    example: 'status',
  })
  @IsString()
  @IsOptional()
  field?: string;

  @ApiPropertyOptional({
    description: 'Operator (equals, not_equals, contains, gt, lt, gte, lte, in)',
    example: 'equals',
  })
  @IsString()
  @IsOptional()
  operator?: string;

  @ApiPropertyOptional({
    description: 'Value to filter by',
    example: 'COMPLETED',
  })
  @IsOptional()
  value?: any;
}

export class ReportMetricConfig {
  @ApiProperty({
    description: 'Metric type to calculate',
    enum: ReportMetric,
    example: ReportMetric.COUNT,
  })
  @IsEnum(ReportMetric)
  type: ReportMetric;

  @ApiProperty({
    description: 'Field name to aggregate (for SUM, AVG, etc.)',
    example: 'amount',
  })
  @IsString()
  @IsNotEmpty()
  field: string;

  @ApiPropertyOptional({
    description: 'Display label for this metric',
    example: 'Total Revenue',
  })
  @IsString()
  @IsOptional()
  label?: string;
}

export class ReportConfiguration {
  @ApiProperty({
    description: 'Data source for the report',
    enum: ReportDataSource,
    example: ReportDataSource.PAYMENTS,
  })
  @IsEnum(ReportDataSource)
  dataSource: ReportDataSource;

  @ApiProperty({
    description: 'Metrics to calculate',
    type: [ReportMetricConfig],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReportMetricConfig)
  metrics: ReportMetricConfig[];

  @ApiPropertyOptional({
    description: 'Filters to apply',
    type: [ReportFilter],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ReportFilter)
  filters?: ReportFilter[];

  @ApiPropertyOptional({
    description: 'Group results by',
    enum: ReportGroupBy,
    example: ReportGroupBy.MONTH,
  })
  @IsEnum(ReportGroupBy)
  @IsOptional()
  groupBy?: ReportGroupBy;

  @ApiPropertyOptional({
    description: 'Start date for date range filtering',
    example: '2025-01-01',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for date range filtering',
    example: '2025-12-31',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'createdAt',
  })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort order (asc/desc)',
    example: 'desc',
  })
  @IsString()
  @IsOptional()
  sortOrder?: string;

  @ApiPropertyOptional({
    description: 'Maximum number of rows to include',
    example: 1000,
  })
  @IsNumber()
  @Min(1)
  @Max(10000)
  @IsOptional()
  limit?: number;
}

// ==========================================
// Schedule Configuration
// ==========================================

export class ScheduleConfiguration {
  @ApiProperty({
    description: 'Schedule frequency',
    enum: CronFrequency,
    example: CronFrequency.WEEKLY,
  })
  @IsEnum(CronFrequency)
  frequency: CronFrequency;

  @ApiProperty({
    description: 'Email recipients for scheduled reports',
    type: [String],
    example: ['admin@taska.com', 'manager@taska.com'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  recipients: string[];

  @ApiProperty({
    description: 'Report format for delivery',
    enum: ReportFormat,
    example: ReportFormat.PDF,
  })
  @IsEnum(ReportFormat)
  format: ReportFormat;

  @ApiPropertyOptional({
    description: 'Day of week for weekly reports (1-7)',
    example: 1,
  })
  @IsNumber()
  @Min(1)
  @Max(7)
  @IsOptional()
  dayOfWeek?: number;

  @ApiPropertyOptional({
    description: 'Day of month for monthly reports (1-31)',
    example: 1,
  })
  @IsNumber()
  @Min(1)
  @Max(31)
  @IsOptional()
  dayOfMonth?: number;

  @ApiPropertyOptional({
    description: 'Hour of day to send (0-23)',
    example: 9,
  })
  @IsNumber()
  @Min(0)
  @Max(23)
  @IsOptional()
  hour?: number;
}

// ==========================================
// Report CRUD DTOs
// ==========================================

export class CreateReportDto {
  @ApiProperty({
    description: 'Report name',
    example: 'Monthly Revenue Report',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Report description',
    example: 'Comprehensive monthly revenue breakdown by category',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Report configuration',
    type: ReportConfiguration,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => ReportConfiguration)
  config: ReportConfiguration;

  @ApiPropertyOptional({
    description: 'Schedule configuration for automatic generation',
    type: ScheduleConfiguration,
  })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => ScheduleConfiguration)
  schedule?: ScheduleConfiguration;

  @ApiPropertyOptional({
    description: 'Whether report is active',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateReportDto {
  @ApiPropertyOptional({
    description: 'Report name',
    example: 'Updated Monthly Revenue Report',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Report description',
    example: 'Updated description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Report configuration',
    type: ReportConfiguration,
  })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => ReportConfiguration)
  config?: ReportConfiguration;

  @ApiPropertyOptional({
    description: 'Schedule configuration',
    type: ScheduleConfiguration,
  })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => ScheduleConfiguration)
  schedule?: ScheduleConfiguration;

  @ApiPropertyOptional({
    description: 'Whether report is active',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class GenerateReportDto {
  @ApiProperty({
    description: 'Output format',
    enum: ReportFormat,
    example: ReportFormat.PDF,
  })
  @IsEnum(ReportFormat)
  format: ReportFormat;

  @ApiPropertyOptional({
    description: 'Override start date for this generation',
    example: '2025-01-01',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Override end date for this generation',
    example: '2025-12-31',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}

// ==========================================
// Query DTOs
// ==========================================

export class GetReportsQueryDto {
  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
  })
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Search by name',
    example: 'revenue',
  })
  @IsString()
  @IsOptional()
  search?: string;
}

export class GetExecutionsQueryDto {
  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
  })
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: ReportExecutionStatus,
  })
  @IsEnum(ReportExecutionStatus)
  @IsOptional()
  status?: ReportExecutionStatus;
}

// ==========================================
// Response DTOs
// ==========================================

export class ReportResponseDto {
  @ApiProperty({ description: 'Report ID', example: 'report_123' })
  id: string;

  @ApiProperty({ description: 'Report name', example: 'Monthly Revenue Report' })
  name: string;

  @ApiPropertyOptional({
    description: 'Report description',
    example: 'Comprehensive monthly revenue breakdown',
  })
  description?: string;

  @ApiProperty({ description: 'Creator user ID', example: 'user_123' })
  createdBy: string;

  @ApiProperty({ description: 'Report configuration' })
  config: ReportConfiguration;

  @ApiPropertyOptional({ description: 'Schedule configuration' })
  schedule?: ScheduleConfiguration;

  @ApiPropertyOptional({ description: 'Last run timestamp' })
  lastRun?: Date;

  @ApiPropertyOptional({ description: 'Next scheduled run timestamp' })
  nextRun?: Date;

  @ApiProperty({ description: 'Whether report is active', example: true })
  isActive: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Creator user details' })
  creator?: {
    id: string;
    name: string;
    email: string;
  };
}

export class ReportExecutionResponseDto {
  @ApiProperty({ description: 'Execution ID', example: 'exec_123' })
  id: string;

  @ApiProperty({ description: 'Report ID', example: 'report_123' })
  reportId: string;

  @ApiProperty({
    description: 'Execution status',
    enum: ReportExecutionStatus,
    example: ReportExecutionStatus.COMPLETED,
  })
  status: ReportExecutionStatus;

  @ApiProperty({
    description: 'Output format',
    enum: ReportFormat,
    example: ReportFormat.PDF,
  })
  format: ReportFormat;

  @ApiPropertyOptional({
    description: 'Generated file URL',
    example: '/reports/downloads/exec_123.pdf',
  })
  fileUrl?: string;

  @ApiPropertyOptional({
    description: 'File size in MB',
    example: 2.5,
  })
  fileSizeMb?: number;

  @ApiPropertyOptional({
    description: 'Number of data rows in report',
    example: 150,
  })
  rowCount?: number;

  @ApiPropertyOptional({
    description: 'Error message if failed',
    example: 'Database connection timeout',
  })
  errorMessage?: string;

  @ApiProperty({ description: 'Start timestamp' })
  startedAt: Date;

  @ApiPropertyOptional({ description: 'Completion timestamp' })
  completedAt?: Date;

  @ApiPropertyOptional({ description: 'Report details' })
  report?: {
    id: string;
    name: string;
  };
}

// ==========================================
// Report Data Response DTO
// ==========================================

export class ReportDataResponseDto {
  @ApiProperty({ description: 'Column names', type: [String] })
  columns: string[];

  @ApiProperty({ description: 'Data rows', type: [[String]] })
  rows: any[][];

  @ApiProperty({ description: 'Total row count', example: 150 })
  totalRows: number;

  @ApiProperty({ description: 'Summary statistics' })
  summary?: Record<string, any>;
}
