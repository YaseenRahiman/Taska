import { Module } from '@nestjs/common';
import { BidsController } from './bids.controller';
import { BidsService } from './bids.service';
import { BidsRepository } from './bids.repository';
import { PrismaModule } from '../../prisma/prisma.module';
import { CommonModule } from '../../common/common.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MonetizationModule } from '../monetization/monetization.module';
import { CalendarModule } from '../calendar/calendar.module';

@Module({
  imports: [PrismaModule, CommonModule, NotificationsModule, MonetizationModule, CalendarModule],
  controllers: [BidsController],
  providers: [BidsService, BidsRepository],
  exports: [BidsService],
})
export class BidsModule {}
