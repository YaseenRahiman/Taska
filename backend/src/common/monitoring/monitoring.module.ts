import { Module, Global } from '@nestjs/common';
import { PerformanceService } from './performance.service';
import { HealthCheckService } from './health-check.service';

@Global()
@Module({
  providers: [PerformanceService, HealthCheckService],
  exports: [PerformanceService, HealthCheckService],
})
export class MonitoringModule {}
