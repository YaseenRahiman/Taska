import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsObject,
  IsInt,
  Min,
  Max,
  IsArray,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationType } from '@prisma/client';

/**
 * DTO for creating a new notification
 */
export class CreateNotificationDto {
  @ApiProperty({
    description: 'User ID to send notification to',
    example: 'user_abc123',
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Notification type',
    enum: NotificationType,
    example: NotificationType.JOB_POSTED,
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({
    description: 'Notification title',
    example: 'New job posted',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Notification message content',
    example: 'A new plumbing job has been posted in your area',
  })
  @IsString()
  message: string;

  @ApiPropertyOptional({
    description: 'Additional notification data (JSON)',
    example: { jobId: 'job_123', amount: 500 },
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}

/**
 * DTO for querying notifications
 */
export class NotificationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by read status',
    example: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isRead?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by notification type',
    enum: NotificationType,
    example: NotificationType.JOB_POSTED,
  })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

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
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Start date filter (ISO 8601)',
    example: '2025-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date filter (ISO 8601)',
    example: '2025-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

/**
 * DTO for marking notification(s) as read
 */
export class MarkAsReadDto {
  @ApiProperty({
    description: 'Notification IDs to mark as read',
    example: ['notif_1', 'notif_2'],
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  notificationIds: string[];
}

/**
 * Response DTO for notification
 */
export class NotificationResponseDto {
  @ApiProperty({
    description: 'Notification ID',
    example: 'notif_abc123',
  })
  id: string;

  @ApiProperty({
    description: 'User ID',
    example: 'user_abc123',
  })
  userId: string;

  @ApiProperty({
    description: 'Notification type',
    enum: NotificationType,
    example: NotificationType.JOB_POSTED,
  })
  type: NotificationType;

  @ApiProperty({
    description: 'Notification title',
    example: 'New job posted',
  })
  title: string;

  @ApiProperty({
    description: 'Notification message',
    example: 'A new plumbing job has been posted in your area',
  })
  message: string;

  @ApiPropertyOptional({
    description: 'Additional notification data',
    example: { jobId: 'job_123', amount: 500 },
  })
  data?: Record<string, any>;

  @ApiProperty({
    description: 'Read status',
    example: false,
  })
  isRead: boolean;

  @ApiPropertyOptional({
    description: 'Read timestamp',
    example: '2025-11-07T10:30:00Z',
  })
  readAt?: Date;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-11-07T10:00:00Z',
  })
  createdAt: Date;
}

/**
 * DTO for notification count response
 */
export class NotificationCountDto {
  @ApiProperty({
    description: 'Total unread notifications count',
    example: 5,
  })
  unreadCount: number;

  @ApiProperty({
    description: 'Total notifications count',
    example: 23,
  })
  totalCount: number;
}

/**
 * DTO for paginated notifications response
 */
export class PaginatedNotificationsDto {
  @ApiProperty({
    description: 'Array of notifications',
    type: [NotificationResponseDto],
  })
  notifications: NotificationResponseDto[];

  @ApiProperty({
    description: 'Total count',
    example: 45,
  })
  total: number;

  @ApiProperty({
    description: 'Current page',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Items per page',
    example: 20,
  })
  limit: number;

  @ApiProperty({
    description: 'Total pages',
    example: 3,
  })
  totalPages: number;

  @ApiProperty({
    description: 'Unread count',
    example: 5,
  })
  unreadCount: number;
}

/**
 * WebSocket event DTO for real-time notifications
 */
export class NotificationEventDto {
  @ApiProperty({
    description: 'Event type',
    example: 'notification:new',
  })
  event: string;

  @ApiProperty({
    description: 'Notification data',
    type: NotificationResponseDto,
  })
  data: NotificationResponseDto;

  @ApiProperty({
    description: 'Event timestamp',
    example: '2025-11-07T10:00:00Z',
  })
  timestamp: Date;
}

/**
 * DTO for real-time metrics update
 */
export class MetricsUpdateDto {
  @ApiProperty({
    description: 'Total users count',
    example: 1523,
  })
  totalUsers?: number;

  @ApiProperty({
    description: 'Total jobs count',
    example: 456,
  })
  totalJobs?: number;

  @ApiProperty({
    description: 'Total revenue',
    example: 125000.50,
  })
  totalRevenue?: number;

  @ApiProperty({
    description: 'Active jobs count',
    example: 89,
  })
  activeJobs?: number;

  @ApiProperty({
    description: 'Pending payments count',
    example: 12,
  })
  pendingPayments?: number;

  @ApiProperty({
    description: 'Update timestamp',
    example: '2025-11-07T10:00:00Z',
  })
  timestamp: Date;
}

/**
 * DTO for activity feed item
 */
export class ActivityFeedItemDto {
  @ApiProperty({
    description: 'Activity ID',
    example: 'activity_123',
  })
  id: string;

  @ApiProperty({
    description: 'Activity type',
    example: 'USER_REGISTERED',
  })
  type: string;

  @ApiProperty({
    description: 'Activity title',
    example: 'New user registered',
  })
  title: string;

  @ApiProperty({
    description: 'Activity description',
    example: 'John Doe joined the platform',
  })
  description: string;

  @ApiPropertyOptional({
    description: 'Additional activity data',
    example: { userId: 'user_123', email: 'john@example.com' },
  })
  data?: Record<string, any>;

  @ApiProperty({
    description: 'Activity timestamp',
    example: '2025-11-07T10:00:00Z',
  })
  timestamp: Date;
}

/**
 * DTO for system alert
 */
export class SystemAlertDto {
  @ApiProperty({
    description: 'Alert severity',
    enum: ['info', 'warning', 'error', 'critical'],
    example: 'warning',
  })
  severity: 'info' | 'warning' | 'error' | 'critical';

  @ApiProperty({
    description: 'Alert message',
    example: 'High server load detected',
  })
  message: string;

  @ApiPropertyOptional({
    description: 'Additional alert data',
    example: { cpu: '85%', memory: '92%' },
  })
  data?: Record<string, any>;

  @ApiProperty({
    description: 'Alert timestamp',
    example: '2025-11-07T10:00:00Z',
  })
  timestamp: Date;
}

/**
 * DTO for WebSocket connection authentication
 */
export class WsAuthDto {
  @ApiProperty({
    description: 'JWT authentication token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  token: string;
}

/**
 * DTO for subscribing to specific metrics
 */
export class MetricsSubscriptionDto {
  @ApiProperty({
    description: 'Array of metrics to subscribe to',
    example: ['users', 'jobs', 'revenue'],
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  metrics: string[];
}
