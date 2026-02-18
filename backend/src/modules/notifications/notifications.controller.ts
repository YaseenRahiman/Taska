import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { NotificationService } from '../admin/services/notification.service';
import {
  NotificationQueryDto,
  PaginatedNotificationsDto,
  NotificationCountDto,
  MarkAsReadDto,
  NotificationResponseDto,
} from '../admin/dto/notification.dto';

/**
 * Public controller for user notifications
 *
 * Provides REST API endpoints for all authenticated users to:
 * - View their notifications
 * - Mark notifications as read
 * - Delete notifications
 * - Get notification counts
 */
@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * Get current user's notifications with pagination and filtering
   */
  @Get()
  @ApiOperation({
    summary: 'Get my notifications',
    description: 'Get paginated and filtered notifications for authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully',
    type: PaginatedNotificationsDto,
  })
  async getMyNotifications(
    @Request() req,
    @Query() query: NotificationQueryDto,
  ): Promise<PaginatedNotificationsDto> {
    return this.notificationService.getUserNotifications(req.user.id, query);
  }

  /**
   * Get notification by ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get notification by ID',
    description: 'Retrieve a specific notification (must be owned by current user)',
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
    return this.notificationService.getNotificationById(id, req.user.id);
  }

  /**
   * Get unread notification count
   */
  @Get('unread/count')
  @ApiOperation({
    summary: 'Get unread notification count',
    description: 'Get count of unread notifications for authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Unread count retrieved successfully',
    type: NotificationCountDto,
  })
  async getUnreadCount(@Request() req): Promise<NotificationCountDto> {
    return this.notificationService.getNotificationCounts(req.user.id);
  }

  /**
   * Mark notification as read
   */
  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark notification as read',
    description: 'Mark a specific notification as read',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read successfully',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number', example: 1 },
      },
    },
  })
  @ApiParam({
    name: 'id',
    description: 'Notification ID',
    example: 'notif_abc123',
  })
  async markAsRead(
    @Request() req,
    @Param('id') id: string,
  ): Promise<{ count: number }> {
    return this.notificationService.markAsRead(req.user.id, [id]);
  }

  /**
   * Mark all notifications as read
   */
  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark all notifications as read',
    description: 'Mark all unread notifications as read for authenticated user',
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
    return this.notificationService.markAllAsRead(req.user.id);
  }

  /**
   * Delete a notification
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
    return this.notificationService.deleteNotification(id, req.user.id);
  }

  /**
   * Clear all notifications
   */
  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Clear all notifications',
    description: 'Delete all notifications for authenticated user',
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
    return this.notificationService.clearAllNotifications(req.user.id);
  }
}
