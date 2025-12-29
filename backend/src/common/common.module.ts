import { Module } from '@nestjs/common';
import { LoggingService } from './logging/logging.service';
import { MonitoringModule } from './monitoring/monitoring.module';

@Module({
  imports: [MonitoringModule],
  providers: [LoggingService],
  exports: [LoggingService, MonitoringModule],
})
export class CommonModule {}
