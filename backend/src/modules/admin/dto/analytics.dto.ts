import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum AnalyticsGroupBy {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
}

export enum AnalyticsMetric {
  GROWTH = 'growth',
  RETENTION = 'retention',
  CHURN = 'churn',
}

export enum AnalyticsExportFormat {
  CSV = 'csv',
  EXCEL = 'excel',
  JSON = 'json',
}

export class AnalyticsDateRange {
  @ApiProperty({
    description: 'Start date for analytics period',
    example: '2025-01-01T00:00:00.000Z',
  })
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @ApiProperty({
    description: 'End date for analytics period',
    example: '2025-01-31T23:59:59.999Z',
  })
  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @ApiPropertyOptional({
    description: 'Group results by time period',
    enum: AnalyticsGroupBy,
    default: AnalyticsGroupBy.DAY,
  })
  @IsOptional()
  @IsEnum(AnalyticsGroupBy)
  groupBy?: AnalyticsGroupBy;
}

export class RevenueAnalytics {
  @ApiProperty({ description: 'Total revenue in period' })
  totalRevenue: number;

  @ApiProperty({ description: 'Total platform fees collected' })
  totalPlatformFees: number;

  @ApiProperty({ description: 'Average transaction value' })
  avgTransactionValue: number;

  @ApiProperty({ description: 'Number of transactions' })
  transactionCount: number;

  @ApiProperty({ description: 'Revenue growth rate percentage' })
  growthRate: number;

  @ApiProperty({
    description: 'Revenue grouped by time period',
    example: { '2025-01-01': 1000, '2025-01-02': 1500 },
  })
  revenueByPeriod: Record<string, number>;

  @ApiProperty({
    description: 'Revenue grouped by category',
    example: { Plumbing: 5000, Electrical: 3000 },
  })
  revenueByCategory: Record<string, number>;
}

export class UserGrowthAnalytics {
  @ApiProperty({ description: 'Total new users in period' })
  totalNewUsers: number;

  @ApiProperty({ description: 'Number of active users' })
  activeUsers: number;

  @ApiProperty({
    description: 'Users grouped by role',
    example: { CLIENT: 100, ARTISAN: 50, ADMIN: 5 },
  })
  usersByRole: Record<string, number>;

  @ApiProperty({
    description: 'User registrations by time period',
    example: { '2025-01-01': 10, '2025-01-02': 15 },
  })
  usersByPeriod: Record<string, number>;

  @ApiProperty({ description: 'User retention rate percentage' })
  retentionRate: number;

  @ApiProperty({ description: 'User growth rate percentage' })
  growthRate: number;
}

export class JobAnalytics {
  @ApiProperty({ description: 'Total jobs in period' })
  totalJobs: number;

  @ApiProperty({
    description: 'Jobs grouped by status',
    example: { OPEN: 50, IN_PROGRESS: 30, COMPLETED: 20 },
  })
  jobsByStatus: Record<string, number>;

  @ApiProperty({
    description: 'Jobs grouped by category',
    example: { Plumbing: 40, Electrical: 30 },
  })
  jobsByCategory: Record<string, number>;

  @ApiProperty({
    description: 'Jobs posted by time period',
    example: { '2025-01-01': 5, '2025-01-02': 8 },
  })
  jobsByPeriod: Record<string, number>;

  @ApiProperty({ description: 'Job completion rate percentage' })
  completionRate: number;

  @ApiProperty({ description: 'Average job completion time in days' })
  avgCompletionTime: number;

  @ApiProperty({ description: 'Average number of bids per job' })
  avgBidsPerJob: number;

  @ApiProperty({ description: 'Job success rate (jobs with accepted bids) percentage' })
  successRate: number;
}

export class PerformanceMetrics {
  @ApiProperty({ description: 'Total users on platform' })
  totalUsers: number;

  @ApiProperty({ description: 'Total jobs posted' })
  totalJobs: number;

  @ApiProperty({ description: 'Total completed payments' })
  totalPayments: number;

  @ApiProperty({ description: 'Average bid response time in hours' })
  avgBidResponseTime: number;

  @ApiProperty({ description: 'Average job completion time in days' })
  avgJobCompletionTime: number;

  @ApiProperty({ description: 'Job to bid conversion rate percentage' })
  conversionRate: number;

  @ApiProperty({ description: 'Platform health score (0-100)' })
  platformHealthScore: number;
}

export class AnalyticsExportQuery extends AnalyticsDateRange {
  @ApiProperty({
    description: 'Type of analytics to export',
    enum: ['revenue', 'users', 'jobs', 'performance'],
  })
  @IsString()
  type: 'revenue' | 'users' | 'jobs' | 'performance';

  @ApiProperty({
    description: 'Export format',
    enum: AnalyticsExportFormat,
    default: AnalyticsExportFormat.CSV,
  })
  @IsEnum(AnalyticsExportFormat)
  format: AnalyticsExportFormat;
}

// Response DTOs for API documentation
export class RevenueAnalyticsResponse {
  @ApiProperty({ type: RevenueAnalytics })
  data: RevenueAnalytics;

  @ApiProperty({ example: 'Revenue analytics retrieved successfully' })
  message: string;
}

export class UserGrowthAnalyticsResponse {
  @ApiProperty({ type: UserGrowthAnalytics })
  data: UserGrowthAnalytics;

  @ApiProperty({ example: 'User growth analytics retrieved successfully' })
  message: string;
}

export class JobAnalyticsResponse {
  @ApiProperty({ type: JobAnalytics })
  data: JobAnalytics;

  @ApiProperty({ example: 'Job analytics retrieved successfully' })
  message: string;
}

export class PerformanceMetricsResponse {
  @ApiProperty({ type: PerformanceMetrics })
  data: PerformanceMetrics;

  @ApiProperty({ example: 'Performance metrics retrieved successfully' })
  message: string;
}
