import { Module, forwardRef } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { JobsRepository } from './jobs.repository';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CommonModule } from '../../common/common.module';
import { PaymentsModule } from '../payments/payments.module';
import { MonetizationModule } from '../monetization/monetization.module';
import { ImageProcessingService } from './services/image-processing.service';
import { JobMatchingService } from './services/job-matching.service';
import { GeocodingService } from './services/geocoding.service';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    NotificationsModule,
    CommonModule,
    forwardRef(() => PaymentsModule),
    forwardRef(() => MonetizationModule),
  ],
  controllers: [JobsController],
  providers: [
    JobsService,
    JobsRepository,
    ImageProcessingService,
    JobMatchingService,
    GeocodingService,
  ],
  exports: [JobsService, JobsRepository],
})
export class JobsModule {}
