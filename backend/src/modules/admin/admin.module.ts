import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminRepository } from './admin.repository';
import { AnalyticsController } from './controllers/analytics.controller';
import { BulkOperationsController } from './controllers/bulk-operations.controller';
import { ActivityLogsController } from './controllers/activity-logs.controller';
import { ReportsController } from './controllers/reports.controller';
import { NotificationsController } from './controllers/notifications.controller';
import { EscrowController } from './controllers/escrow.controller';
import { ReviewModerationController } from './controllers/review-moderation.controller';
import { AnalyticsService } from './services/analytics.service';
import { BulkOperationsService } from './services/bulk-operations.service';
import { AuditLogService } from './services/audit-log.service';
import { ReportBuilderService } from './services/report-builder.service';
import { PdfGeneratorService } from './services/pdf-generator.service';
import { NotificationService } from './services/notification.service';
import { EscrowConfigService } from './services/escrow-config.service';
import { ReviewModerationService } from './services/review-moderation.service';
import { BulkOperationsProcessor } from './processors/bulk-operations.processor';
import { AuditLogInterceptor } from './interceptors/audit-log.interceptor';
import { AdminGateway } from './gateways/admin.gateway';
import { PrismaModule } from '../../prisma/prisma.module';
import { CommonModule } from '../../common/common.module';
import { UsersModule } from '../../users/users.module';
import { JobsModule } from '../jobs/jobs.module';
import { BidsModule } from '../bids/bids.module';
import { PaymentsModule } from '../payments/payments.module';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [
    PrismaModule,
    CommonModule,
    UsersModule,
    JobsModule,
    BidsModule,
    PaymentsModule,
    MessagesModule,
    ScheduleModule.forRoot(),
    BullModule.registerQueue({
      name: 'bulk-operations',
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [
    AdminController,
    AnalyticsController,
    BulkOperationsController,
    ActivityLogsController,
    ReportsController,
    NotificationsController,
    EscrowController,
    ReviewModerationController,
  ],
  providers: [
    AdminService,
    AdminRepository,
    AnalyticsService,
    BulkOperationsService,
    AuditLogService,
    ReportBuilderService,
    PdfGeneratorService,
    NotificationService,
    EscrowConfigService,
    ReviewModerationService,
    BulkOperationsProcessor,
    AdminGateway,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
  exports: [
    AdminService,
    AnalyticsService,
    BulkOperationsService,
    AuditLogService,
    ReportBuilderService,
    NotificationService,
    EscrowConfigService,
    ReviewModerationService,
    AdminGateway,
  ],
})
export class AdminModule {}
