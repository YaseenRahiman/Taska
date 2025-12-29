import {
  Controller,
  Get,
  Query,
  UseGuards,
  Logger,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AnalyticsService } from '../services/analytics.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import {
  AnalyticsDateRange,
  AnalyticsGroupBy,
  AnalyticsExportQuery,
  RevenueAnalyticsResponse,
  UserGrowthAnalyticsResponse,
  JobAnalyticsResponse,
  PerformanceMetricsResponse,
} from '../dto/analytics.dto';

@ApiTags('Admin Analytics')
@ApiBearerAuth()
@Controller('admin/analytics')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN')
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Get revenue analytics with trends over time
   */
  @Get('revenue')
  @ApiOperation({
    summary: 'Get revenue analytics',
    description:
      'Retrieve comprehensive revenue analytics including trends, platform fees, and breakdown by category',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: Date,
    description: 'Start date for analytics period (ISO 8601)',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: Date,
    description: 'End date for analytics period (ISO 8601)',
  })
  @ApiQuery({
    name: 'groupBy',
    required: false,
    enum: AnalyticsGroupBy,
    description: 'Group results by time period',
  })
  @ApiResponse({
    status: 200,
    description: 'Revenue analytics retrieved successfully',
    type: RevenueAnalyticsResponse,
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getRevenueAnalytics(
    @Query(new ValidationPipe({ transform: true }))
    dateRange: AnalyticsDateRange,
  ) {
    this.logger.log(
      `Getting revenue analytics from ${dateRange.startDate} to ${dateRange.endDate}`,
    );

    const data = await this.analyticsService.getRevenueAnalytics(dateRange);

    return {
      data,
      message: 'Revenue analytics retrieved successfully',
    };
  }

  /**
   * Get user growth analytics
   */
  @Get('users')
  @ApiOperation({
    summary: 'Get user growth analytics',
    description:
      'Retrieve user growth metrics including new users, active users, retention, and breakdown by role',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: Date,
    description: 'Start date for analytics period (ISO 8601)',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: Date,
    description: 'End date for analytics period (ISO 8601)',
  })
  @ApiQuery({
    name: 'groupBy',
    required: false,
    enum: AnalyticsGroupBy,
    description: 'Group results by time period',
  })
  @ApiResponse({
    status: 200,
    description: 'User growth analytics retrieved successfully',
    type: UserGrowthAnalyticsResponse,
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getUserGrowthAnalytics(
    @Query(new ValidationPipe({ transform: true }))
    dateRange: AnalyticsDateRange,
  ) {
    this.logger.log(
      `Getting user growth analytics from ${dateRange.startDate} to ${dateRange.endDate}`,
    );

    const data = await this.analyticsService.getUserGrowthAnalytics(dateRange);

    return {
      data,
      message: 'User growth analytics retrieved successfully',
    };
  }

  /**
   * Get job analytics
   */
  @Get('jobs')
  @ApiOperation({
    summary: 'Get job analytics',
    description:
      'Retrieve job analytics including posting trends, completion rates, and breakdown by category and status',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: Date,
    description: 'Start date for analytics period (ISO 8601)',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: Date,
    description: 'End date for analytics period (ISO 8601)',
  })
  @ApiQuery({
    name: 'groupBy',
    required: false,
    enum: AnalyticsGroupBy,
    description: 'Group results by time period',
  })
  @ApiResponse({
    status: 200,
    description: 'Job analytics retrieved successfully',
    type: JobAnalyticsResponse,
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getJobAnalytics(
    @Query(new ValidationPipe({ transform: true }))
    dateRange: AnalyticsDateRange,
  ) {
    this.logger.log(
      `Getting job analytics from ${dateRange.startDate} to ${dateRange.endDate}`,
    );

    const data = await this.analyticsService.getJobAnalytics(dateRange);

    return {
      data,
      message: 'Job analytics retrieved successfully',
    };
  }

  /**
   * Get performance metrics
   */
  @Get('performance')
  @ApiOperation({
    summary: 'Get platform performance metrics',
    description:
      'Retrieve key performance indicators including response times, completion rates, and platform health score',
  })
  @ApiResponse({
    status: 200,
    description: 'Performance metrics retrieved successfully',
    type: PerformanceMetricsResponse,
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getPerformanceMetrics() {
    this.logger.log('Getting performance metrics');

    const data = await this.analyticsService.getPerformanceMetrics();

    return {
      data,
      message: 'Performance metrics retrieved successfully',
    };
  }

  /**
   * Export analytics data
   */
  @Get('export')
  @ApiOperation({
    summary: 'Export analytics data',
    description:
      'Export analytics data in various formats (CSV, Excel, JSON) for reporting and analysis',
  })
  @ApiQuery({
    name: 'type',
    required: true,
    enum: ['revenue', 'users', 'jobs', 'performance'],
    description: 'Type of analytics to export',
  })
  @ApiQuery({
    name: 'format',
    required: true,
    enum: ['csv', 'excel', 'json'],
    description: 'Export format',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: Date,
    description: 'Start date for analytics period (ISO 8601)',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: Date,
    description: 'End date for analytics period (ISO 8601)',
  })
  @ApiQuery({
    name: 'groupBy',
    required: false,
    enum: AnalyticsGroupBy,
    description: 'Group results by time period',
  })
  @ApiResponse({
    status: 200,
    description: 'Analytics data exported successfully',
    schema: {
      type: 'object',
      properties: {
        downloadUrl: { type: 'string', description: 'URL to download the exported file' },
        fileName: { type: 'string', description: 'Name of the exported file' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async exportAnalytics(
    @Query(new ValidationPipe({ transform: true }))
    exportQuery: AnalyticsExportQuery,
  ) {
    this.logger.log(
      `Exporting ${exportQuery.type} analytics in ${exportQuery.format} format`,
    );

    // TODO: Implement export functionality with actual file generation
    // This will be implemented in the next phase with file storage integration

    return {
      downloadUrl: `/exports/analytics-${exportQuery.type}-${Date.now()}.${exportQuery.format}`,
      fileName: `analytics-${exportQuery.type}-${Date.now()}.${exportQuery.format}`,
      message: 'Analytics export initiated successfully',
    };
  }
}
