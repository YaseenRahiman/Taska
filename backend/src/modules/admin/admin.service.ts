import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { AdminRepository } from './admin.repository';
import { LoggingService } from '../../common/logging/logging.service';
import { UsersService } from '../../users/users.service';
import { 
  AdminUserManagementDto,
  AdminUserActionDto,
  AdminAnalyticsDto,
  AdminContentModerationDto,
  AdminSystemConfigDto,
  AdminReportDto,
  AdminDispute,
  AdminMetrics,
  AdminFinancialReport,
  AdminUserFilters,
  AdminContentFilters,
} from './dto';
import { User, ActivityLog, SystemSetting } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly loggingService: LoggingService,
    private readonly usersService: UsersService,
  ) {}

  // User Management Methods
  async getAllUsers(filters: AdminUserFilters): Promise<AdminUserManagementDto & { totalPages?: number }> {
    this.loggingService.info('Admin: Getting all users with filters', 'AdminService');

    // Handle pagination - support both page/limit and skip/take
    const page = filters.page !== undefined ? Number(filters.page) : 1;
    const limit = filters.limit !== undefined ? Number(filters.limit) : (filters.take !== undefined ? Number(filters.take) : 20);
    const skip = filters.skip !== undefined ? Number(filters.skip) : (page - 1) * limit;

    // Convert string query params to numbers for Prisma
    const normalizedFilters = {
      ...filters,
      skip,
      take: limit,
      sortBy: filters.sortBy || 'createdAt',
      sortOrder: filters.sortOrder || 'desc',
    };

    const { users, total } = await this.adminRepository.getUsersWithFilters(normalizedFilters);
    const activeUsers = await this.adminRepository.getActiveUsersCount();
    const newUsersToday = await this.adminRepository.getNewUsersToday();
    const verificationQueue = await this.adminRepository.getPendingVerifications();

    return {
      users,
      total,
      totalPages: Math.ceil(total / limit),
      activeUsers,
      newUsersToday,
      verificationQueue: verificationQueue.length,
      filters,
    };
  }

  async getUserDetails(userId: string): Promise<User & { profile: any; activityLogs: ActivityLog[] }> {
    this.loggingService.info('Admin: Getting user details', 'AdminService');
    
    const user = await this.adminRepository.getUserWithDetails(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user;
  }

  async banUser(userId: string, adminId: string, reason: string): Promise<void> {
    this.loggingService.warn('Admin: Banning user', 'AdminService');
    
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (user.role === 'ADMIN') {
      throw new ForbiddenException('Cannot ban admin users');
    }

    await this.adminRepository.updateUserStatus(userId, user.role);

    // Log admin action
    await this.adminRepository.logAdminActivity({
      adminId,
      action: 'BAN_USER',
      targetUserId: userId,
      reason,
      metadata: { originalRole: user.role },
    });

    this.loggingService.info('Admin: User banned successfully', 'AdminService');
  }

  async suspendUser(userId: string, adminId: string, reason: string, suspendUntil?: Date): Promise<void> {
    this.loggingService.warn('Admin: Suspending user', 'AdminService');
    
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (user.role === 'ADMIN') {
      throw new ForbiddenException('Cannot suspend admin users');
    }

    await this.adminRepository.updateUserStatus(userId, user.role, suspendUntil);

    // Log admin action
    await this.adminRepository.logAdminActivity({
      adminId,
      action: 'SUSPEND_USER',
      targetUserId: userId,
      reason,
      metadata: { originalRole: user.role, suspendUntil },
    });

    this.loggingService.info('Admin: User suspended successfully', 'AdminService');
  }

  async verifyArtisan(userId: string, adminId: string): Promise<void> {
    this.loggingService.info('Admin: Verifying artisan', 'AdminService');
    
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (user.role !== 'ARTISAN') {
      throw new BadRequestException('User must be an artisan to verify');
    }

    await this.adminRepository.verifyUser(userId);
    
    // Log admin action
    await this.adminRepository.logAdminActivity({
      adminId,
      action: 'VERIFY_ARTISAN',
      targetUserId: userId,
      reason: 'Artisan credentials verified',
      metadata: { verifiedAt: new Date() },
    });

    this.loggingService.info('Admin: Artisan verified successfully', 'AdminService');
  }

  async resetUserPassword(userId: string, adminId: string): Promise<{ temporaryPassword: string }> {
    this.loggingService.info('Admin: Resetting user password', 'AdminService');
    
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const temporaryPassword = this.generateTemporaryPassword();
    await this.adminRepository.updateUserPassword(userId, temporaryPassword);
    
    // Log admin action
    await this.adminRepository.logAdminActivity({
      adminId,
      action: 'RESET_PASSWORD',
      targetUserId: userId,
      reason: 'Password reset by admin',
      metadata: { resetAt: new Date() },
    });

    this.loggingService.info('Admin: Password reset successfully', 'AdminService');
    return { temporaryPassword };
  }

  // Content Moderation Methods
  async getContentModeration(filters: AdminContentFilters): Promise<AdminContentModerationDto> {
    this.loggingService.info('Admin: Getting content moderation queue', 'AdminService');
    
    const reportedJobs = await this.adminRepository.getReportedJobs(filters);
    const reportedMessages = await this.adminRepository.getReportedMessages(filters);
    const flaggedReviews = await this.adminRepository.getFlaggedReviews(filters);
    const pendingDisputes = await this.adminRepository.getPendingDisputes(filters);

    return {
      reportedJobs,
      reportedMessages,
      flaggedReviews,
      pendingDisputes,
      totalReported: reportedJobs.length + reportedMessages.length + flaggedReviews.length,
      filters,
    };
  }

  async moderateContent(contentId: string, contentType: string, adminId: string, action: 'APPROVE' | 'REJECT', reason?: string): Promise<void> {
    this.loggingService.info('Admin: Moderating content', 'AdminService');
    
    await this.adminRepository.moderateContent(contentId, contentType, action, reason);
    
    // Log admin action
    await this.adminRepository.logAdminActivity({
      adminId,
      action: `MODERATE_${contentType.toUpperCase()}`,
      reason: reason || `Content ${action.toLowerCase()}ed`,
      metadata: { contentId, contentType, moderationAction: action },
    });

    this.loggingService.info('Admin: Content moderated successfully', 'AdminService');
  }

  async handleDispute(disputeId: string, adminId: string, resolution: string, refundAmount?: number): Promise<void> {
    this.loggingService.info('Admin: Handling dispute', 'AdminService');
    
    await this.adminRepository.resolveDispute(disputeId, resolution, refundAmount);
    
    // Log admin action
    await this.adminRepository.logAdminActivity({
      adminId,
      action: 'RESOLVE_DISPUTE',
      reason: resolution,
      metadata: { disputeId, refundAmount, resolvedAt: new Date() },
    });

    this.loggingService.info('Admin: Dispute resolved successfully', 'AdminService');
  }

  // Analytics Dashboard Methods
  async getDashboardMetrics(): Promise<AdminMetrics> {
    this.loggingService.info('Admin: Getting dashboard metrics');
    
    const [
      totalUsers,
      activeUsers,
      totalJobs,
      activeJobs,
      totalBids,
      totalPayments,
      totalRevenue,
      todayRevenue,
      monthlyRevenue,
      userGrowth,
      jobGrowth,
      conversionRate,
    ] = await Promise.all([
      this.adminRepository.getTotalUsers(),
      this.adminRepository.getActiveUsersCount(),
      this.adminRepository.getTotalJobs(),
      this.adminRepository.getActiveJobs(),
      this.adminRepository.getTotalBids(),
      this.adminRepository.getTotalPayments(),
      this.adminRepository.getTotalRevenue(),
      this.adminRepository.getTodayRevenue(),
      this.adminRepository.getMonthlyRevenue(),
      this.adminRepository.getUserGrowthRate(),
      this.adminRepository.getJobGrowthRate(),
      this.adminRepository.getConversionRate(),
    ]);

    return {
      totalUsers,
      activeUsers,
      totalJobs,
      activeJobs,
      totalBids,
      totalPayments,
      totalRevenue,
      todayRevenue,
      monthlyRevenue,
      userGrowth,
      jobGrowth,
      conversionRate,
      systemHealth: await this.getSystemHealth(),
      recentActivity: await this.adminRepository.getRecentActivity(),
    };
  }

  async generateReport(type: 'USERS' | 'JOBS' | 'REVENUE' | 'DISPUTES', dateFrom: Date, dateTo: Date, format: 'CSV' | 'PDF'): Promise<AdminReportDto> {
    this.loggingService.info('Admin: Generating report', 'AdminService');
    
    const reportData = await this.adminRepository.generateReportData(type, dateFrom, dateTo);
    const reportUrl = await this.generateReportFile(reportData, type, format);

    return {
      type,
      dateFrom,
      dateTo,
      format,
      recordCount: Array.isArray(reportData) ? reportData.length : 0,
      downloadUrl: reportUrl,
      generatedAt: new Date(),
    };
  }

  async getFinancialReconciliation(): Promise<AdminFinancialReport> {
    this.loggingService.info('Admin: Getting financial reconciliation');
    
    return await this.adminRepository.getFinancialReconciliation();
  }

  // System Configuration Methods
  async getSystemSettings(): Promise<SystemSetting[]> {
    this.loggingService.info('Admin: Getting system settings');
    return await this.adminRepository.getSystemSettings();
  }

  async updateSystemSetting(key: string, value: string, adminId: string): Promise<SystemSetting> {
    this.loggingService.info('Admin: Updating system setting', 'AdminService');
    
    const setting = await this.adminRepository.updateSystemSetting(key, value);
    
    // Log admin action
    await this.adminRepository.logAdminActivity({
      adminId,
      action: 'UPDATE_SYSTEM_SETTING',
      reason: `Updated ${key} setting`,
      metadata: { settingKey: key, newValue: value, updatedAt: new Date() },
    });

    return setting;
  }

  async adjustPlatformFees(newFeePercentage: number, adminId: string): Promise<void> {
    this.loggingService.info('Admin: Adjusting platform fees', 'AdminService');
    
    if (newFeePercentage < 0 || newFeePercentage > 30) {
      throw new BadRequestException('Platform fee must be between 0% and 30%');
    }

    await this.adminRepository.updateSystemSetting('PLATFORM_FEE_PERCENTAGE', newFeePercentage.toString());
    
    // Log admin action
    await this.adminRepository.logAdminActivity({
      adminId,
      action: 'ADJUST_PLATFORM_FEES',
      reason: `Platform fees adjusted to ${newFeePercentage}%`,
      metadata: { newFeePercentage, adjustedAt: new Date() },
    });

    this.loggingService.info('Admin: Platform fees adjusted successfully', 'AdminService');
  }

  async manageCategory(action: 'CREATE' | 'UPDATE' | 'DELETE', categoryData: any, adminId: string): Promise<void> {
    this.loggingService.info('Admin: Managing category', 'AdminService');
    
    await this.adminRepository.manageCategory(action, categoryData);
    
    // Log admin action
    await this.adminRepository.logAdminActivity({
      adminId,
      action: `${action}_CATEGORY`,
      reason: `Category ${action.toLowerCase()}d`,
      metadata: { categoryData, actionAt: new Date() },
    });

    this.loggingService.info('Admin: Category managed successfully', 'AdminService');
  }

  async updateEmailTemplate(templateType: string, templateContent: string, adminId: string): Promise<void> {
    this.loggingService.info('Admin: Updating email template', 'AdminService');
    
    await this.adminRepository.updateEmailTemplate(templateType, templateContent);
    
    // Log admin action
    await this.adminRepository.logAdminActivity({
      adminId,
      action: 'UPDATE_EMAIL_TEMPLATE',
      reason: `Email template ${templateType} updated`,
      metadata: { templateType, updatedAt: new Date() },
    });

    this.loggingService.info('Admin: Email template updated successfully', 'AdminService');
  }

  async setFeatureFlag(flagName: string, enabled: boolean, adminId: string): Promise<void> {
    this.loggingService.info('Admin: Setting feature flag', 'AdminService');
    
    await this.adminRepository.updateSystemSetting(`FEATURE_${flagName.toUpperCase()}`, enabled.toString());
    
    // Log admin action
    await this.adminRepository.logAdminActivity({
      adminId,
      action: 'SET_FEATURE_FLAG',
      reason: `Feature flag ${flagName} ${enabled ? 'enabled' : 'disabled'}`,
      metadata: { flagName, enabled, setAt: new Date() },
    });

    this.loggingService.info('Admin: Feature flag set successfully', 'AdminService');
  }

  // Helper Methods
  private async getSystemHealth(): Promise<any> {
    // This would typically check database connections, external services, etc.
    return {
      database: 'healthy',
      redis: 'healthy',
      storage: 'healthy',
      paymentGateway: 'healthy',
      overallStatus: 'healthy',
    };
  }

  private generateTemporaryPassword(): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  private async generateReportFile(data: any, type: string, format: string): Promise<string> {
    // This would generate actual CSV/PDF files and return download URLs
    // For now, return a mock URL
    const timestamp = Date.now();
    return `/reports/${type.toLowerCase()}_${timestamp}.${format.toLowerCase()}`;
  }
}
