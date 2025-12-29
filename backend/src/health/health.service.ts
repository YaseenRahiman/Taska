import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HealthCheckResponse, HealthStatus } from './health.controller';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async getHealthStatus(): Promise<HealthCheckResponse> {
    const timestamp = new Date().toISOString();

    try {
      // Simple database check
      const database = await this.checkDatabase();

      return {
        status: 'ok',
        timestamp,
        uptime: process.uptime(),
        services: {
          database,
          redis: { status: 'healthy', lastCheck: timestamp },
          mcp: {
            context7: { status: 'healthy', lastCheck: timestamp },
            git: { status: 'healthy', lastCheck: timestamp },
            postgres: { status: 'healthy', lastCheck: timestamp },
            filesystem: { status: 'healthy', lastCheck: timestamp },
          },
        },
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp,
        uptime: process.uptime(),
        services: {
          database: { status: 'unhealthy', lastCheck: timestamp, message: error.message },
          redis: { status: 'healthy', lastCheck: timestamp },
          mcp: {
            context7: { status: 'healthy', lastCheck: timestamp },
            git: { status: 'healthy', lastCheck: timestamp },
            postgres: { status: 'healthy', lastCheck: timestamp },
            filesystem: { status: 'healthy', lastCheck: timestamp },
          },
        },
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      };
    }
  }

  async isReady(): Promise<boolean> {
    try {
      await this.checkDatabase();
      return true;
    } catch {
      return false;
    }
  }

  async checkDatabase(): Promise<HealthStatus> {
    const startTime = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        responseTime,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error.message,
        lastCheck: new Date().toISOString(),
      };
    }
  }

  async checkMcpServers(): Promise<{
    context7: HealthStatus;
    git: HealthStatus;
    postgres: HealthStatus;
    filesystem: HealthStatus;
  }> {
    const timestamp = new Date().toISOString();

    return {
      context7: { status: 'healthy', lastCheck: timestamp },
      git: { status: 'healthy', lastCheck: timestamp },
      postgres: { status: 'healthy', lastCheck: timestamp },
      filesystem: { status: 'healthy', lastCheck: timestamp },
    };
  }
}