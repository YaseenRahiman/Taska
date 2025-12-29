import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateNotificationDto,
  NotificationQueryDto,
  NotificationResponseDto,
  PaginatedNotificationsDto,
  NotificationCountDto,
  MarkAsReadDto,
} from '../dto/notification.dto';
import { NotificationType } from '@prisma/client';

/**
 * Service for managing notifications
 *
 * Handles CRUD operations, querying, and business logic for notifications.
 * Works in conjunction with AdminGateway for real-time broadcasting.
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new notification
   *
   * @param createDto - Notification creation data
   * @returns Created notification
   */
  async createNotification(
    createDto: CreateNotificationDto,
  ): Promise<NotificationResponseDto> {
    try {
      this.logger.log(
        `Creating notification for user ${createDto.userId}: ${createDto.title}`,
      );

      const notification = await this.prisma.notification.create({
        data: {
          userId: createDto.userId,
          type: createDto.type,
          title: createDto.title,
          message: createDto.message,
          data: createDto.data || {},
          isRead: false,
        },
      });

      this.logger.log(`Notification created: ${notification.id}`);

      return this.mapToResponseDto(notification);
    } catch (error) {
      this.logger.error('Failed to create notification', error.stack);
      throw error;
    }
  }

  /**
   * Create notifications in bulk
   *
   * @param userIds - Array of user IDs
   * @param notificationData - Notification data template
   * @returns Created notifications count
   */
  async createBulkNotifications(
    userIds: string[],
    notificationData: Omit<CreateNotificationDto, 'userId'>,
  ): Promise<{ count: number }> {
    try {
      this.logger.log(
        `Creating bulk notifications for ${userIds.length} users`,
      );

      const notifications = userIds.map((userId) => ({
        userId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data || {},
        isRead: false,
      }));

      const result = await this.prisma.notification.createMany({
        data: notifications,
      });

      this.logger.log(`Created ${result.count} bulk notifications`);

      return { count: result.count };
    } catch (error) {
      this.logger.error('Failed to create bulk notifications', error.stack);
      throw error;
    }
  }

  /**
   * Get notifications for a user with pagination and filtering
   *
   * @param userId - User ID
   * @param query - Query parameters
   * @returns Paginated notifications
   */
  async getUserNotifications(
    userId: string,
    query: NotificationQueryDto,
  ): Promise<PaginatedNotificationsDto> {
    try {
      const { page = 1, limit = 20, isRead, type, startDate, endDate } = query;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = { userId };

      if (isRead !== undefined) {
        where.isRead = isRead;
      }

      if (type) {
        where.type = type;
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(startDate);
        }
        if (endDate) {
          where.createdAt.lte = new Date(endDate);
        }
      }

      // Execute queries in parallel
      const [notifications, total, unreadCount] = await Promise.all([
        this.prisma.notification.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.notification.count({ where }),
        this.prisma.notification.count({
          where: { userId, isRead: false },
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        notifications: notifications.map((n) => this.mapToResponseDto(n)),
        total,
        page,
        limit,
        totalPages,
        unreadCount,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get notifications for user ${userId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get notification by ID
   *
   * @param id - Notification ID
   * @param userId - User ID (for authorization)
   * @returns Notification
   */
  async getNotificationById(
    id: string,
    userId: string,
  ): Promise<NotificationResponseDto> {
    try {
      const notification = await this.prisma.notification.findFirst({
        where: { id, userId },
      });

      if (!notification) {
        throw new NotFoundException(`Notification ${id} not found`);
      }

      return this.mapToResponseDto(notification);
    } catch (error) {
      this.logger.error(`Failed to get notification ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * Mark notification(s) as read
   *
   * @param userId - User ID
   * @param notificationIds - Array of notification IDs
   * @returns Updated count
   */
  async markAsRead(
    userId: string,
    notificationIds: string[],
  ): Promise<{ count: number }> {
    try {
      this.logger.log(
        `Marking ${notificationIds.length} notifications as read for user ${userId}`,
      );

      const result = await this.prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId,
          isRead: false, // Only update unread ones
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      this.logger.log(`Marked ${result.count} notifications as read`);

      return { count: result.count };
    } catch (error) {
      this.logger.error('Failed to mark notifications as read', error.stack);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   *
   * @param userId - User ID
   * @returns Updated count
   */
  async markAllAsRead(userId: string): Promise<{ count: number }> {
    try {
      this.logger.log(`Marking all notifications as read for user ${userId}`);

      const result = await this.prisma.notification.updateMany({
        where: {
          userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      this.logger.log(`Marked ${result.count} notifications as read`);

      return { count: result.count };
    } catch (error) {
      this.logger.error('Failed to mark all notifications as read', error.stack);
      throw error;
    }
  }

  /**
   * Delete a notification
   *
   * @param id - Notification ID
   * @param userId - User ID (for authorization)
   */
  async deleteNotification(id: string, userId: string): Promise<void> {
    try {
      this.logger.log(`Deleting notification ${id} for user ${userId}`);

      const notification = await this.prisma.notification.findFirst({
        where: { id, userId },
      });

      if (!notification) {
        throw new NotFoundException(`Notification ${id} not found`);
      }

      await this.prisma.notification.delete({
        where: { id },
      });

      this.logger.log(`Notification ${id} deleted`);
    } catch (error) {
      this.logger.error(`Failed to delete notification ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * Clear all notifications for a user
   *
   * @param userId - User ID
   * @returns Deleted count
   */
  async clearAllNotifications(userId: string): Promise<{ count: number }> {
    try {
      this.logger.log(`Clearing all notifications for user ${userId}`);

      const result = await this.prisma.notification.deleteMany({
        where: { userId },
      });

      this.logger.log(`Cleared ${result.count} notifications`);

      return { count: result.count };
    } catch (error) {
      this.logger.error('Failed to clear all notifications', error.stack);
      throw error;
    }
  }

  /**
   * Get notification counts for a user
   *
   * @param userId - User ID
   * @returns Notification counts
   */
  async getNotificationCounts(userId: string): Promise<NotificationCountDto> {
    try {
      const [unreadCount, totalCount] = await Promise.all([
        this.prisma.notification.count({
          where: { userId, isRead: false },
        }),
        this.prisma.notification.count({
          where: { userId },
        }),
      ]);

      return {
        unreadCount,
        totalCount,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get notification counts for user ${userId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get admin notifications (system-wide)
   * For admin dashboard real-time feed
   *
   * @param limit - Number of recent notifications
   * @returns Recent notifications
   */
  async getAdminNotifications(limit: number = 50): Promise<NotificationResponseDto[]> {
    try {
      const notifications = await this.prisma.notification.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
        },
      });

      return notifications.map((n) => this.mapToResponseDto(n));
    } catch (error) {
      this.logger.error('Failed to get admin notifications', error.stack);
      throw error;
    }
  }

  /**
   * Create system announcement notification for all admins
   *
   * @param title - Announcement title
   * @param message - Announcement message
   * @param data - Additional data
   * @returns Created notifications count
   */
  async createAdminAnnouncement(
    title: string,
    message: string,
    data?: Record<string, any>,
  ): Promise<{ count: number }> {
    try {
      this.logger.log(`Creating admin announcement: ${title}`);

      // Get all admin users
      const adminUsers = await this.prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true },
      });

      const adminIds = adminUsers.map((u) => u.id);

      if (adminIds.length === 0) {
        this.logger.warn('No admin users found for announcement');
        return { count: 0 };
      }

      return await this.createBulkNotifications(adminIds, {
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title,
        message,
        data,
      });
    } catch (error) {
      this.logger.error('Failed to create admin announcement', error.stack);
      throw error;
    }
  }

  /**
   * Clean up old read notifications
   * Should be called periodically (e.g., via cron job)
   *
   * @param daysOld - Delete notifications older than this many days
   * @returns Deleted count
   */
  async cleanupOldNotifications(daysOld: number = 30): Promise<{ count: number }> {
    try {
      this.logger.log(`Cleaning up notifications older than ${daysOld} days`);

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await this.prisma.notification.deleteMany({
        where: {
          isRead: true,
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      this.logger.log(`Cleaned up ${result.count} old notifications`);

      return { count: result.count };
    } catch (error) {
      this.logger.error('Failed to cleanup old notifications', error.stack);
      throw error;
    }
  }

  /**
   * Helper method to map Prisma notification to response DTO
   */
  private mapToResponseDto(notification: any): NotificationResponseDto {
    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      isRead: notification.isRead,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
    };
  }
}
