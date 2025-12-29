import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  AdminUserFilters,
  AdminContentFilters,
  AdminUserActionDto,
  AdminModerationActionDto,
  AdminDisputeResolutionDto,
  AdminCategoryDto,
  AdminFeatureFlagDto,
  AdminEmailTemplateDto,
} from './dto';

@ApiTags('Admin Management')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // =============================================
  // USER MANAGEMENT ENDPOINTS
  // =============================================

  @Get('users')
  @ApiOperation({ 
    summary: 'Get all users with advanced filtering',
    description: 'Retrieve all users with comprehensive filtering options including role, status, verification, and date ranges'
  })
  @ApiQuery({ name: 'role', required: false, enum: ['CLIENT', 'ARTISAN', 'ADMIN', 'ASSESSOR'] })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'SUSPENDED', 'BANNED', 'INACTIVE'] })
  @ApiQuery({ name: 'verified', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, description: 'Search by email or name' })
  @ApiQuery({ name: 'dateFrom', required: false, type: Date })
  @ApiQuery({ name: 'dateTo', required: false, type: Date })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Number of records to skip' })
  @ApiQuery({ name: 'take', required: false, type: Number, description: 'Number of records to take' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getAllUsers(@Query() filters: AdminUserFilters) {
    return this.adminService.getAllUsers(filters);
  }

  @Get('users/:id')
  @ApiOperation({ 
    summary: 'Get detailed user information',
    description: 'Get comprehensive user details including profile, activity logs, jobs, bids, and messages'
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserDetails(@Param('id') userId: string) {
    return this.adminService.getUserDetails(userId);
  }

  @Post('users/:id/ban')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Ban a user',
    description: 'Permanently ban a user from the platform with reason logging'
  })
  @ApiParam({ name: 'id', description: 'User ID to ban' })
  @ApiBody({ schema: { properties: { reason: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'User banned successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Cannot ban admin users' })
  async banUser(
    @Param('id') userId: string,
    @Body('reason') reason: string,
    @CurrentUser() admin: any,
  ) {
    await this.adminService.banUser(userId, admin.id, reason);
    return { message: 'User banned successfully', userId, reason };
  }

  @Post('users/:id/suspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Suspend a user',
    description: 'Temporarily suspend a user with optional expiry date'
  })
  @ApiParam({ name: 'id', description: 'User ID to suspend' })
  @ApiBody({ 
    schema: { 
      properties: { 
        reason: { type: 'string' },
        suspendUntil: { type: 'string', format: 'date-time', nullable: true }
      } 
    } 
  })
  @ApiResponse({ status: 200, description: 'User suspended successfully' })
  async suspendUser(
    @Param('id') userId: string,
    @Body() body: { reason: string; suspendUntil?: Date },
    @CurrentUser() admin: any,
  ) {
    await this.adminService.suspendUser(userId, admin.id, body.reason, body.suspendUntil);
    return { message: 'User suspended successfully', userId, ...body };
  }

  @Patch('users/:id/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify an artisan',
    description: 'Mark an artisan as verified after credential review'
  })
  @ApiParam({ name: 'id', description: 'Artisan ID to verify' })
  @ApiResponse({ status: 200, description: 'Artisan verified successfully' })
  @ApiResponse({ status: 400, description: 'User is not an artisan' })
  async verifyArtisan(
    @Param('id') userId: string,
    @CurrentUser() admin: any,
  ) {
    await this.adminService.verifyArtisan(userId, admin.id);
    return { message: 'Artisan verified successfully', userId };
  }

  @Post('users/:id/reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Reset user password',
    description: 'Generate and set a temporary password for a user'
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  async resetUserPassword(
    @Param('id') userId: string,
    @CurrentUser() admin: any,
  ) {
    const result = await this.adminService.resetUserPassword(userId, admin.id);
    return { 
      message: 'Password reset successfully', 
      userId,
      temporaryPassword: result.temporaryPassword 
    };
  }

  @Get('users/verification-queue')
  @ApiOperation({ 
    summary: 'Get pending artisan verifications',
    description: 'Retrieve list of artisans awaiting verification'
  })
  @ApiResponse({ status: 200, description: 'Verification queue retrieved successfully' })
  async getVerificationQueue() {
    return this.adminService.getAllUsers({ 
      role: 'ARTISAN', 
      verified: false 
    });
  }

  // =============================================
  // CONTENT MODERATION ENDPOINTS
  // =============================================

  @Get('moderation')
  @ApiOperation({ 
    summary: 'Get content moderation queue',
    description: 'Retrieve all reported content and pending disputes'
  })
  @ApiQuery({ name: 'contentType', required: false, enum: ['JOB', 'MESSAGE', 'REVIEW'] })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'APPROVED', 'REJECTED'] })
  @ApiResponse({ status: 200, description: 'Moderation queue retrieved successfully' })
  async getContentModeration(@Query() filters: AdminContentFilters) {
    return this.adminService.getContentModeration(filters);
  }

  @Post('moderation/content')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Moderate reported content',
    description: 'Approve or reject reported content with reason'
  })
  @ApiBody({ type: AdminModerationActionDto })
  @ApiResponse({ status: 200, description: 'Content moderated successfully' })
  async moderateContent(
    @Body(ValidationPipe) moderationAction: AdminModerationActionDto,
    @CurrentUser() admin: any,
  ) {
    await this.adminService.moderateContent(
      moderationAction.contentId,
      moderationAction.contentType,
      admin.id,
      moderationAction.action,
      moderationAction.reason,
    );
    return { message: 'Content moderated successfully', ...moderationAction };
  }

  @Post('moderation/disputes/:disputeId/resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Resolve a dispute',
    description: 'Resolve a payment or service dispute with refund options'
  })
  @ApiParam({ name: 'disputeId', description: 'Dispute ID' })
  @ApiBody({ type: AdminDisputeResolutionDto })
  @ApiResponse({ status: 200, description: 'Dispute resolved successfully' })
  async resolveDispute(
    @Param('disputeId') disputeId: string,
    @Body(ValidationPipe) resolution: AdminDisputeResolutionDto,
    @CurrentUser() admin: any,
  ) {
    await this.adminService.handleDispute(
      disputeId,
      admin.id,
      resolution.resolution,
      resolution.refundAmount,
    );
    return { message: 'Dispute resolved successfully', disputeId, ...resolution };
  }

  // =============================================
  // ANALYTICS DASHBOARD ENDPOINTS
  // =============================================

  @Get('dashboard/metrics')
  @ApiOperation({
    summary: 'Get dashboard metrics',
    description: 'Retrieve comprehensive platform analytics and KPIs'
  })
  @ApiResponse({ status: 200, description: 'Dashboard metrics retrieved successfully' })
  async getDashboardMetrics() {
    return this.adminService.getDashboardMetrics();
  }

  @Get('analytics')
  @ApiOperation({
    summary: 'Get platform analytics (alias for dashboard/metrics)',
    description: 'Retrieve comprehensive platform analytics and KPIs'
  })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  async getAnalytics() {
    return this.adminService.getDashboardMetrics();
  }

  @Get('jobs')
  @ApiOperation({
    summary: 'Get all jobs (admin view)',
    description: 'Retrieve all jobs across the platform for admin review'
  })
  @ApiResponse({ status: 200, description: 'Jobs retrieved successfully' })
  async getAdminJobs(@Query() filters?: any) {
    // Return all jobs with admin privileges
    return { jobs: [] }; // Placeholder - will be implemented with proper service
  }

  @Get('jobs/:id')
  @ApiOperation({
    summary: 'Get job details (admin view)',
    description: 'Retrieve detailed job information for admin review'
  })
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiResponse({ status: 200, description: 'Job details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async getAdminJobDetails(@Param('id') jobId: string) {
    // Return job details with admin view
    return { id: jobId, status: 'pending' }; // Placeholder
  }

  @Post('reports/generate')
  @ApiOperation({ 
    summary: 'Generate comprehensive reports',
    description: 'Generate downloadable reports in CSV or PDF format'
  })
  @ApiBody({
    schema: {
      properties: {
        type: { type: 'string', enum: ['USERS', 'JOBS', 'REVENUE', 'DISPUTES'] },
        dateFrom: { type: 'string', format: 'date' },
        dateTo: { type: 'string', format: 'date' },
        format: { type: 'string', enum: ['CSV', 'PDF'] },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Report generated successfully' })
  async generateReport(
    @Body() reportRequest: {
      type: 'USERS' | 'JOBS' | 'REVENUE' | 'DISPUTES';
      dateFrom: Date;
      dateTo: Date;
      format: 'CSV' | 'PDF';
    },
  ) {
    return this.adminService.generateReport(
      reportRequest.type,
      reportRequest.dateFrom,
      reportRequest.dateTo,
      reportRequest.format,
    );
  }

  @Get('financial/reconciliation')
  @ApiOperation({ 
    summary: 'Get financial reconciliation',
    description: 'Retrieve comprehensive financial data for reconciliation'
  })
  @ApiResponse({ status: 200, description: 'Financial data retrieved successfully' })
  async getFinancialReconciliation() {
    return this.adminService.getFinancialReconciliation();
  }

  // =============================================
  // SYSTEM CONFIGURATION ENDPOINTS
  // =============================================

  @Get('system/settings')
  @ApiOperation({ 
    summary: 'Get all system settings',
    description: 'Retrieve all configurable system settings'
  })
  @ApiResponse({ status: 200, description: 'System settings retrieved successfully' })
  async getSystemSettings() {
    return this.adminService.getSystemSettings();
  }

  @Put('system/settings/:key')
  @ApiOperation({ 
    summary: 'Update system setting',
    description: 'Update a specific system configuration setting'
  })
  @ApiParam({ name: 'key', description: 'Setting key' })
  @ApiBody({ schema: { properties: { value: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Setting updated successfully' })
  async updateSystemSetting(
    @Param('key') key: string,
    @Body('value') value: string,
    @CurrentUser() admin: any,
  ) {
    const setting = await this.adminService.updateSystemSetting(key, value, admin.id);
    return { message: 'Setting updated successfully', setting };
  }

  @Put('system/platform-fees')
  @ApiOperation({ 
    summary: 'Adjust platform fees',
    description: 'Update the platform fee percentage (0-30%)'
  })
  @ApiBody({ schema: { properties: { feePercentage: { type: 'number', minimum: 0, maximum: 30 } } } })
  @ApiResponse({ status: 200, description: 'Platform fees updated successfully' })
  async adjustPlatformFees(
    @Body('feePercentage') feePercentage: number,
    @CurrentUser() admin: any,
  ) {
    await this.adminService.adjustPlatformFees(feePercentage, admin.id);
    return { message: 'Platform fees adjusted successfully', feePercentage };
  }

  @Get('categories')
  @ApiOperation({ 
    summary: 'Get all categories',
    description: 'Retrieve all job categories for management'
  })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  async getCategories() {
    return { message: 'Categories endpoint - to be implemented with categories service' };
  }

  @Post('categories')
  @ApiOperation({ 
    summary: 'Create new category',
    description: 'Create a new job category'
  })
  @ApiBody({ type: AdminCategoryDto })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  async createCategory(
    @Body(ValidationPipe) categoryData: AdminCategoryDto,
    @CurrentUser() admin: any,
  ) {
    await this.adminService.manageCategory('CREATE', categoryData, admin.id);
    return { message: 'Category created successfully', category: categoryData };
  }

  @Put('categories/:id')
  @ApiOperation({ summary: 'Update category' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  async updateCategory(
    @Param('id') categoryId: string,
    @Body(ValidationPipe) categoryData: AdminCategoryDto,
    @CurrentUser() admin: any,
  ) {
    await this.adminService.manageCategory('UPDATE', { ...categoryData, id: categoryId }, admin.id);
    return { message: 'Category updated successfully' };
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete category' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  async deleteCategory(
    @Param('id') categoryId: string,
    @CurrentUser() admin: any,
  ) {
    await this.adminService.manageCategory('DELETE', { id: categoryId }, admin.id);
    return { message: 'Category deleted successfully' };
  }

  @Get('email-templates')
  @ApiOperation({ 
    summary: 'Get email templates',
    description: 'Retrieve all email templates for editing'
  })
  @ApiResponse({ status: 200, description: 'Email templates retrieved successfully' })
  async getEmailTemplates() {
    const settings = await this.adminService.getSystemSettings();
    const templates = settings.filter(s => s.key.startsWith('EMAIL_TEMPLATE_'));
    return { templates };
  }

  @Put('email-templates/:type')
  @ApiOperation({ 
    summary: 'Update email template',
    description: 'Update a specific email template'
  })
  @ApiParam({ name: 'type', description: 'Template type' })
  @ApiBody({ type: AdminEmailTemplateDto })
  @ApiResponse({ status: 200, description: 'Email template updated successfully' })
  async updateEmailTemplate(
    @Param('type') templateType: string,
    @Body(ValidationPipe) template: AdminEmailTemplateDto,
    @CurrentUser() admin: any,
  ) {
    await this.adminService.updateEmailTemplate(templateType, template.content, admin.id);
    return { message: 'Email template updated successfully', templateType };
  }

  @Get('feature-flags')
  @ApiOperation({ 
    summary: 'Get feature flags',
    description: 'Retrieve all feature flags and their status'
  })
  @ApiResponse({ status: 200, description: 'Feature flags retrieved successfully' })
  async getFeatureFlags() {
    const settings = await this.adminService.getSystemSettings();
    const flags = settings.filter(s => s.key.startsWith('FEATURE_'));
    return { flags };
  }

  @Put('feature-flags/:name')
  @ApiOperation({ 
    summary: 'Set feature flag',
    description: 'Enable or disable a feature flag'
  })
  @ApiParam({ name: 'name', description: 'Feature flag name' })
  @ApiBody({ type: AdminFeatureFlagDto })
  @ApiResponse({ status: 200, description: 'Feature flag updated successfully' })
  async setFeatureFlag(
    @Param('name') flagName: string,
    @Body(ValidationPipe) flag: AdminFeatureFlagDto,
    @CurrentUser() admin: any,
  ) {
    await this.adminService.setFeatureFlag(flagName, flag.enabled, admin.id);
    return { message: 'Feature flag updated successfully', flagName, enabled: flag.enabled };
  }

  @Post('announcements')
  @ApiOperation({ 
    summary: 'Create system announcement',
    description: 'Create a system-wide announcement banner'
  })
  @ApiBody({
    schema: {
      properties: {
        title: { type: 'string' },
        message: { type: 'string' },
        type: { type: 'string', enum: ['INFO', 'WARNING', 'ERROR'] },
        expiresAt: { type: 'string', format: 'date-time', nullable: true },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Announcement created successfully' })
  async createAnnouncement(
    @Body() announcement: {
      title: string;
      message: string;
      type: 'INFO' | 'WARNING' | 'ERROR';
      expiresAt?: Date;
    },
    @CurrentUser() admin: any,
  ) {
    await this.adminService.updateSystemSetting(
      'SYSTEM_ANNOUNCEMENT',
      JSON.stringify(announcement),
      admin.id,
    );
    return { message: 'Announcement created successfully', announcement };
  }
}
