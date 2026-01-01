import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Req,
  Header,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { AuditLogService } from '../services/audit-log.service';
import {
  AuditLogQueryDto,
  AuditLogResponseDto,
  UserActivityQueryDto,
  SystemEventQueryDto,
  ExportAuditLogsDto,
} from '../dto/audit-log.dto';

@ApiTags('Admin - Activity Logs')
@Controller('admin/logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class ActivityLogsController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get('audit')
  @ApiOperation({ summary: 'Get audit logs with filtering' })
  @ApiQuery({ name: 'adminId', required: false, description: 'Filter by admin ID' })
  @ApiQuery({ name: 'action', required: false, description: 'Filter by action type' })
  @ApiQuery({
    name: 'entityType',
    required: false,
    description: 'Filter by entity type',
  })
  @ApiQuery({ name: 'entityId', required: false, description: 'Filter by entity ID' })
  @ApiQuery({
    name: 'success',
    required: false,
    description: 'Filter by success status',
  })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date filter' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date filter' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'List of audit logs',
  })
  async getAuditLogs(@Query() query: AuditLogQueryDto): Promise<{
    logs: AuditLogResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.auditLogService.getAuditLogs(query);
  }

  @Get('audit/entity/:entityType/:entityId')
  @ApiOperation({ summary: 'Get audit trail for a specific entity' })
  @ApiParam({ name: 'entityType', description: 'Entity type (e.g., USER, JOB)' })
  @ApiParam({ name: 'entityId', description: 'Entity ID' })
  @ApiResponse({
    status: 200,
    description: 'Entity audit trail',
    type: [AuditLogResponseDto],
  })
  async getEntityAuditTrail(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ): Promise<AuditLogResponseDto[]> {
    return this.auditLogService.getEntityAuditTrail(entityType, entityId);
  }

  @Get('user-activity/:userId')
  @ApiOperation({ summary: 'Get user activity logs' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Activity type',
    enum: ['login', 'profile', 'job', 'bid', 'payment', 'review', 'message'],
  })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date filter' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date filter' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'User activity logs',
  })
  async getUserActivity(
    @Param('userId') userId: string,
    @Query() query: Omit<UserActivityQueryDto, 'userId'>,
  ): Promise<{
    activities: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.auditLogService.getUserActivity({ ...query, userId });
  }

  @Get('system-events')
  @ApiOperation({ summary: 'Get system events' })
  @ApiQuery({
    name: 'severity',
    required: false,
    description: 'Event severity',
    enum: ['info', 'warning', 'error', 'critical'],
  })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date filter' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date filter' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'System events',
  })
  async getSystemEvents(@Query() query: SystemEventQueryDto): Promise<{
    events: AuditLogResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.auditLogService.getSystemEvents(query);
  }

  @Get('admin-summary/:adminId')
  @ApiOperation({ summary: 'Get admin action summary' })
  @ApiParam({ name: 'adminId', description: 'Admin user ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date filter' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date filter' })
  @ApiResponse({
    status: 200,
    description: 'Admin action summary',
  })
  async getAdminActionSummary(
    @Param('adminId') adminId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{
    totalActions: number;
    successfulActions: number;
    failedActions: number;
    actionsByType: Record<string, number>;
    recentActions: AuditLogResponseDto[];
  }> {
    return this.auditLogService.getAdminActionSummary(adminId, startDate, endDate);
  }

  @Get('admin-summary')
  @ApiOperation({ summary: 'Get current admin action summary' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date filter' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date filter' })
  @ApiResponse({
    status: 200,
    description: 'Current admin action summary',
  })
  async getCurrentAdminSummary(
    @Req() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{
    totalActions: number;
    successfulActions: number;
    failedActions: number;
    actionsByType: Record<string, number>;
    recentActions: AuditLogResponseDto[];
  }> {
    return this.auditLogService.getAdminActionSummary(
      req.user.userId,
      startDate,
      endDate,
    );
  }

  @Get('export')
  @ApiOperation({ summary: 'Export audit logs' })
  @ApiQuery({
    name: 'format',
    required: true,
    description: 'Export format',
    enum: ['csv', 'json'],
  })
  @ApiQuery({
    name: 'adminId',
    required: false,
    description: 'Filter by admin ID',
  })
  @ApiQuery({
    name: 'action',
    required: false,
    description: 'Filter by action type',
  })
  @ApiQuery({
    name: 'entityType',
    required: false,
    description: 'Filter by entity type',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date filter',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date filter',
  })
  @Header('Content-Type', 'text/csv')
  @ApiResponse({
    status: 200,
    description: 'Exported audit logs',
  })
  async exportAuditLogs(@Query() query: any): Promise<string> {
    const dto: ExportAuditLogsDto = {
      format: query.format,
      filters: {
        adminId: query.adminId,
        action: query.action,
        entityType: query.entityType,
        entityId: query.entityId,
        startDate: query.startDate,
        endDate: query.endDate,
      },
    };

    return this.auditLogService.exportAuditLogs(dto);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get audit log statistics for dashboard' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date filter' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date filter' })
  @ApiResponse({
    status: 200,
    description: 'Audit log statistics',
  })
  async getAuditStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{
    totalLogs: number;
    successRate: number;
    topActions: { action: string; count: number }[];
    topAdmins: { adminId: string; adminName: string; count: number }[];
    actionsOverTime: { date: string; count: number }[];
  }> {
    return this.auditLogService.getAuditStatistics(startDate, endDate);
  }
}
