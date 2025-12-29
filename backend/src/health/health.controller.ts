import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  services: {
    database: HealthStatus;
    redis: HealthStatus;
    mcp: {
      context7: HealthStatus;
      git: HealthStatus;
      postgres: HealthStatus;
      filesystem: HealthStatus;
    };
  };
  version: string;
  environment: string;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  message?: string;
  lastCheck: string;
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Get application health status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Health check successful',
    type: Object,
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'One or more services are unhealthy',
  })
  async getHealth(): Promise<HealthCheckResponse> {
    return this.healthService.getHealthStatus();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Check if application is ready to serve requests' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Application is ready',
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'Application is not ready',
  })
  async getReadiness(): Promise<{ status: 'ready' | 'not_ready'; timestamp: string }> {
    const isReady = await this.healthService.isReady();
    
    return {
      status: isReady ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('live')
  @ApiOperation({ summary: 'Check if application is alive' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Application is alive',
  })
  async getLiveness(): Promise<{ status: 'alive'; timestamp: string; uptime: number }> {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get('database')
  @ApiOperation({ summary: 'Check database connection health' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Database is healthy',
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'Database is unhealthy',
  })
  async getDatabaseHealth(): Promise<HealthStatus> {
    return this.healthService.checkDatabase();
  }

  @Get('mcp')
  @ApiOperation({ summary: 'Check MCP servers health' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'MCP servers status',
  })
  async getMcpHealth(): Promise<{
    context7: HealthStatus;
    git: HealthStatus;
    postgres: HealthStatus;
    filesystem: HealthStatus;
  }> {
    return this.healthService.checkMcpServers();
  }
}
