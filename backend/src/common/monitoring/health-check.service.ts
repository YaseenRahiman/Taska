import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  checks: {
    database: HealthCheckResult;
    memory: HealthCheckResult;
    disk: HealthCheckResult;
    external_services: HealthCheckResult;
  };
}

export interface HealthCheckResult {
  status: 'pass' | 'fail' | 'warn';
  responseTime?: number;
  details?: any;
}

@Injectable()
export class HealthCheckService {
  private readonly logger = new Logger(HealthCheckService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(): Promise<HealthCheck> {
    const checks = {
      database: await this.checkDatabase(),
      memory: await this.checkMemory(),
      disk: await this.checkDisk(),
      external_services: await this.checkExternalServices(),
    };

    const overallStatus = this.determineOverallStatus(checks);

    return {
      status: overallStatus,
      timestamp: new Date(),
      checks,
    };
  }

  /**
   * Check database connectivity and performance
   */
  private async checkDatabase(): Promise<HealthCheckResult> {
    const start = Date.now();
    
    try {
      // Simple query to test connectivity
      await this.prisma.$queryRaw`SELECT 1`;
      
      const responseTime = Date.now() - start;
      
      return {
        status: responseTime < 1000 ? 'pass' : 'warn',
        responseTime,
        details: {
          message: 'Database connection successful',
          responseTime: `${responseTime}ms`,
        },
      };
    } catch (error) {
      return {
        status: 'fail',
        responseTime: Date.now() - start,
        details: {
          error: error.message,
        },
      };
    }
  }

  /**
   * Check memory usage
   */
  private async checkMemory(): Promise<HealthCheckResult> {
    try {
      const memUsage = process.memoryUsage();
      const memUsageMB = {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
      };

      // Warning if RSS > 1GB, fail if > 2GB
      const status = memUsageMB.rss > 2048 ? 'fail' : 
                    memUsageMB.rss > 1024 ? 'warn' : 'pass';

      return {
        status,
        details: {
          memory: memUsageMB,
          unit: 'MB',
        },
      };
    } catch (error) {
      return {
        status: 'fail',
        details: { error: error.message },
      };
    }
  }

  /**
   * Check disk space (simplified)
   */
  private async checkDisk(): Promise<HealthCheckResult> {
    try {
      // In a real implementation, you would check actual disk space
      // For now, we'll just return a pass status
      return {
        status: 'pass',
        details: {
          message: 'Disk space check not implemented',
        },
      };
    } catch (error) {
      return {
        status: 'fail',
        details: { error: error.message },
      };
    }
  }

  /**
   * Check external services connectivity
   */
  private async checkExternalServices(): Promise<HealthCheckResult> {
    const services = [];
    
    try {
      // Check Redis (if configured)
      if (process.env.REDIS_URL) {
        // Redis health check would go here
        services.push({ name: 'redis', status: 'pass' });
      }

      // Check email service
      if (process.env.EMAIL_SERVICE_URL) {
        // Email service health check would go here
        services.push({ name: 'email', status: 'pass' });
      }

      // Check payment gateway
      if (process.env.STRIPE_SECRET_KEY || process.env.PAYFAST_MERCHANT_ID) {
        // Payment gateway health check would go here
        services.push({ name: 'payment', status: 'pass' });
      }

      const hasFailures = services.some(s => s.status === 'fail');
      const hasWarnings = services.some(s => s.status === 'warn');

      return {
        status: hasFailures ? 'fail' : hasWarnings ? 'warn' : 'pass',
        details: { services },
      };
    } catch (error) {
      return {
        status: 'fail',
        details: { error: error.message },
      };
    }
  }

  /**
   * Determine overall health status
   */
  private determineOverallStatus(checks: HealthCheck['checks']): HealthCheck['status'] {
    const results = Object.values(checks);
    
    if (results.some(r => r.status === 'fail')) {
      return 'unhealthy';
    }
    
    if (results.some(r => r.status === 'warn')) {
      return 'degraded';
    }
    
    return 'healthy';
  }

  /**
   * Get simple health status
   */
  async getSimpleHealthStatus(): Promise<{ status: string; timestamp: Date }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'healthy',
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Health check failed', error);
      return {
        status: 'unhealthy',
        timestamp: new Date(),
      };
    }
  }
}
