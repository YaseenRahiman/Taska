import { Injectable, Logger } from '@nestjs/common';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags?: Record<string, string>;
}

export interface DatabaseMetric {
  query: string;
  duration: number;
  rowsAffected?: number;
  timestamp: Date;
}

@Injectable()
export class PerformanceService {
  private readonly logger = new Logger(PerformanceService.name);
  private metrics: PerformanceMetric[] = [];
  private databaseMetrics: DatabaseMetric[] = [];

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Log performance issues
    if (this.isPerformanceIssue(metric)) {
      this.logger.warn(`Performance issue detected: ${metric.name} = ${metric.value}${metric.unit}`);
    }

    // Keep only last 1000 metrics in memory
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  /**
   * Record database query performance
   */
  recordDatabaseQuery(metric: DatabaseMetric): void {
    this.databaseMetrics.push(metric);

    // Log slow queries
    if (metric.duration > 1000) { // More than 1 second
      this.logger.warn(`Slow query detected: ${metric.query} took ${metric.duration}ms`);
    }

    // Keep only last 500 database metrics
    if (this.databaseMetrics.length > 500) {
      this.databaseMetrics = this.databaseMetrics.slice(-500);
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): any {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const recentMetrics = this.metrics.filter(m => m.timestamp >= oneHourAgo);
    const recentDbMetrics = this.databaseMetrics.filter(m => m.timestamp >= oneHourAgo);

    return {
      summary: {
        totalRequests: recentMetrics.filter(m => m.name === 'request_duration').length,
        averageResponseTime: this.calculateAverage(
          recentMetrics.filter(m => m.name === 'request_duration').map(m => m.value)
        ),
        slowQueries: recentDbMetrics.filter(m => m.duration > 1000).length,
        averageQueryTime: this.calculateAverage(recentDbMetrics.map(m => m.duration)),
      },
      metrics: recentMetrics.slice(-50), // Last 50 metrics
      topSlowQueries: recentDbMetrics
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 10),
    };
  }

  /**
   * Measure execution time of a function
   */
  async measureExecutionTime<T>(
    name: string,
    fn: () => Promise<T>,
    tags?: Record<string, string>
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      
      this.recordMetric({
        name,
        value: duration,
        unit: 'ms',
        timestamp: new Date(),
        tags,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.recordMetric({
        name: `${name}_error`,
        value: duration,
        unit: 'ms',
        timestamp: new Date(),
        tags: { ...tags, error: error.message },
      });
      throw error;
    }
  }

  /**
   * Memory usage monitoring
   */
  recordMemoryUsage(): void {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memUsage = process.memoryUsage();
      
      Object.entries(memUsage).forEach(([key, value]) => {
        this.recordMetric({
          name: `memory_${key}`,
          value: Math.round(value / 1024 / 1024), // Convert to MB
          unit: 'MB',
          timestamp: new Date(),
        });
      });
    }
  }

  /**
   * CPU usage monitoring (simplified)
   */
  recordCpuUsage(): void {
    if (typeof process !== 'undefined' && process.cpuUsage) {
      const cpuUsage = process.cpuUsage();
      
      this.recordMetric({
        name: 'cpu_user_time',
        value: Math.round(cpuUsage.user / 1000), // Convert to milliseconds
        unit: 'ms',
        timestamp: new Date(),
      });

      this.recordMetric({
        name: 'cpu_system_time',
        value: Math.round(cpuUsage.system / 1000),
        unit: 'ms',
        timestamp: new Date(),
      });
    }
  }

  private isPerformanceIssue(metric: PerformanceMetric): boolean {
    const thresholds = {
      request_duration: 5000, // 5 seconds
      database_query: 1000,   // 1 second
      memory_rss: 1024,       // 1GB
    };

    return metric.value > (thresholds[metric.name] || Infinity);
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Export metrics for external monitoring systems
   */
  exportMetrics(format: 'json' | 'prometheus' = 'json'): string {
    if (format === 'prometheus') {
      return this.exportPrometheusFormat();
    }
    
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      metrics: this.metrics.slice(-100),
      databaseMetrics: this.databaseMetrics.slice(-50),
    }, null, 2);
  }

  private exportPrometheusFormat(): string {
    let output = '';
    
    // Group metrics by name
    const groupedMetrics = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) acc[metric.name] = [];
      acc[metric.name].push(metric);
      return acc;
    }, {} as Record<string, PerformanceMetric[]>);

    // Export in Prometheus format
    Object.entries(groupedMetrics).forEach(([name, metrics]) => {
      output += `# HELP ${name} ${name} metric\n`;
      output += `# TYPE ${name} gauge\n`;
      
      metrics.slice(-10).forEach(metric => {
        const tags = metric.tags 
          ? Object.entries(metric.tags).map(([k, v]) => `${k}="${v}"`).join(',')
          : '';
        output += `${name}${tags ? `{${tags}}` : ''} ${metric.value}\n`;
      });
    });

    return output;
  }
}
