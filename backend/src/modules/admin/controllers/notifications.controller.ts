import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { NotificationService } from '../services/notification.service';
import { AdminGateway } from '../gateways/admin.gateway';
import {
  CreateNotificationDto,
  NotificationQueryDto,
  NotificationResponseDto,
  PaginatedNotificationsDto,
  NotificationCountDto,
  MarkAsReadDto,
} from '../dto/notification.dto';

/**
 * Controller for notification management
 *
 * Provides REST API endpoints for:
 * - Querying notifications
 * - Marking notifications as read
 * - Clearing notifications
 * - Getting notification counts
 *
 * Real-time notifications are handled by AdminGateway (WebSocket)
 */
@ApiTags('Admin - Notifications')
@ApiBearerAuth()
@Controller('admin/notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class NotificationsController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly adminGateway: AdminGateway,
  ) {}

  /**
   * Get current user's notifications with pagination and filtering
   */
  @Get()
  @ApiOperation({
    summary: 'Get notifications',
    description: 'Get paginated and filtered notifications for current user',
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully',
    type: PaginatedNotificationsDto,
  })
  @ApiQuery({ type: NotificationQueryDto })
  async getNotifications(
    @Request() req,
    @Query() query: NotificationQueryDto,
  ): Promise<PaginatedNotificationsDto> {
    return this.notificationService.getUserNotifications(req.user.userId, query);
  }

  /**
   * Get notification by ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get notification by ID',
    description: 'Retrieve a specific notification',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification retrieved successfully',
    type: NotificationResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Notification not found',
  })
  @ApiParam({
    name: 'id',
    description: 'Notification ID',
    example: 'notif_abc123',
  })
  async getNotificationById(
    @Request() req,
    @Param('id') id: string,
  ): Promise<NotificationResponseDto> {
    return this.notificationService.getNotificationById(id, req.user.userId);
  }

  /**
   * Get notification counts
   */
  @Get('counts/summary')
  @ApiOperation({
    summary: 'Get notification counts',
    description: 'Get unread and total notification counts for current user',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification counts retrieved successfully',
    type: NotificationCountDto,
  })
  async getNotificationCounts(@Request() req): Promise<NotificationCountDto> {
    return this.notificationService.getNotificationCounts(req.user.userId);
  }

  /**
   * Mark specific notifications as read
   */
  @Patch('read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark notifications as read',
    description: 'Mark one or more notifications as read',
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications marked as read successfully',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number', example: 3 },
      },
    },
  })
  async markAsRead(
    @Request() req,
    @Body() markAsReadDto: MarkAsReadDto,
  ): Promise<{ count: number }> {
    return this.notificationService.markAsRead(
      req.user.userId,
      markAsReadDto.notificationIds,
    );
  }

  /**
   * Mark all notifications as read
   */
  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark all notifications as read',
    description: 'Mark all unread notifications as read for current user',
  })
  @ApiResponse({
    status: 200,
    description: 'All notifications marked as read successfully',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number', example: 15 },
      },
    },
  })
  async markAllAsRead(@Request() req): Promise<{ count: number }> {
    return this.notificationService.markAllAsRead(req.user.userId);
  }

  /**
   * Delete a specific notification
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete notification',
    description: 'Delete a specific notification',
  })
  @ApiResponse({
    status: 204,
    description: 'Notification deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Notification not found',
  })
  @ApiParam({
    name: 'id',
    description: 'Notification ID',
    example: 'notif_abc123',
  })
  async deleteNotification(
    @Request() req,
    @Param('id') id: string,
  ): Promise<void> {
    return this.notificationService.deleteNotification(id, req.user.userId);
  }

  /**
   * Clear all notifications
   */
  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Clear all notifications',
    description: 'Delete all notifications for current user',
  })
  @ApiResponse({
    status: 200,
    description: 'All notifications cleared successfully',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number', example: 23 },
      },
    },
  })
  async clearAllNotifications(@Request() req): Promise<{ count: number }> {
    return this.notificationService.clearAllNotifications(req.user.userId);
  }

  /**
   * Create a notification (admin only)
   * Primarily for testing or manual notification creation
   */
  @Post()
  @ApiOperation({
    summary: 'Create notification',
    description: 'Create a new notification (admin only, primarily for testing)',
  })
  @ApiResponse({
    status: 201,
    description: 'Notification created successfully',
    type: NotificationResponseDto,
  })
  async createNotification(
    @Body() createDto: CreateNotificationDto,
  ): Promise<NotificationResponseDto> {
    // Create notification
    const notification = await this.notificationService.createNotification(createDto);

    // Emit real-time notification via WebSocket
    this.adminGateway.emitNotification(createDto.userId, {
      event: 'notification:new',
      data: notification,
      timestamp: new Date(),
    });

    return notification;
  }

  /**
   * Get admin activity feed (admin notifications system-wide)
   */
  @Get('admin/activity-feed')
  @ApiOperation({
    summary: 'Get admin activity feed',
    description: 'Get recent system-wide notifications for admin dashboard',
  })
  @ApiResponse({
    status: 200,
    description: 'Activity feed retrieved successfully',
    type: [NotificationResponseDto],
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 50,
    description: 'Number of recent notifications to retrieve',
  })
  async getAdminActivityFeed(
    @Query('limit') limit?: number,
  ): Promise<NotificationResponseDto[]> {
    return this.notificationService.getAdminNotifications(limit || 50);
  }

  /**
   * Get WebSocket connection status
   */
  @Get('admin/connection-status')
  @ApiOperation({
    summary: 'Get WebSocket connection status',
    description: 'Get current WebSocket connection statistics',
  })
  @ApiResponse({
    status: 200,
    description: 'Connection status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        connectedAdmins: { type: 'number', example: 3 },
        connectedAdminIds: { type: 'array', items: { type: 'string' } },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  getConnectionStatus() {
    return {
      connectedAdmins: this.adminGateway.getConnectedAdminsCount(),
      connectedAdminIds: this.adminGateway.getConnectedAdminIds(),
      timestamp: new Date(),
    };
  }
}
