import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationService } from '../admin/services/notification.service';
import { PrismaModule } from '../../prisma/prisma.module';

/**
 * Public notifications module
 *
 * Provides notification access for all authenticated users
 * Reuses NotificationService from admin module for consistency
 */
@Module({
  imports: [PrismaModule],
  controllers: [NotificationsController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationsModule {}
