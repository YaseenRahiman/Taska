import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { CalendarRepository } from './calendar.repository';

@Module({
  imports: [PrismaModule],
  controllers: [CalendarController],
  providers: [CalendarService, CalendarRepository],
  exports: [CalendarService],
})
export class CalendarModule {}
