import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  AnalyticsDateRange,
  RevenueAnalytics,
  UserGrowthAnalytics,
  JobAnalytics,
  PerformanceMetrics,
} from '../dto/analytics.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get revenue analytics with trends over time
   */
  async getRevenueAnalytics(
    dateRange: AnalyticsDateRange,
  ): Promise<RevenueAnalytics> {
    const { startDate, endDate, groupBy = 'day' } = dateRange;

    this.logger.log(
      `Fetching revenue analytics from ${startDate} to ${endDate}, grouped by ${groupBy}`,
    );

    try {
      // Get all payments in date range
      const payments = await this.prisma.payment.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          status: 'COMPLETED',
        },
        select: {
          amount: true,
          currency: true,
          platformFee: true,
          createdAt: true,
          job: {
            select: {
              category: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      // Calculate total revenue and platform fees
      const totalRevenue = payments.reduce(
        (sum, p) => sum + Number(p.amount),
        0,
      );
      const totalPlatformFees = payments.reduce(
        (sum, p) => sum + Number(p.platformFee || 0),
        0,
      );

      // Group by time period
      const revenueByPeriod = this.groupPaymentsByPeriod(
        payments,
        groupBy as 'day' | 'week' | 'month',
      );

      // Revenue by category
      const revenueByCategory = this.groupPaymentsByCategory(payments);

      // Calculate average transaction value
      const avgTransactionValue =
        payments.length > 0 ? totalRevenue / payments.length : 0;

      // Calculate growth rate (compare to previous period)
      const previousPeriodStart = this.getPreviousPeriodStart(
        startDate,
        endDate,
      );
      const previousPeriodEnd = startDate;

      const previousPeriodPayments = await this.prisma.payment.count({
        where: {
          createdAt: {
            gte: previousPeriodStart,
            lt: previousPeriodEnd,
          },
          status: 'COMPLETED',
        },
      });

      const currentPeriodPayments = payments.length;
      const growthRate =
        previousPeriodPayments > 0
          ? ((currentPeriodPayments - previousPeriodPayments) /
              previousPeriodPayments) *
            100
          : 0;

      return {
        totalRevenue,
        totalPlatformFees,
        avgTransactionValue,
        transactionCount: payments.length,
        growthRate,
        revenueByPeriod,
        revenueByCategory,
      };
    } catch (error) {
      this.logger.error(`Error fetching revenue analytics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user growth analytics
   */
  async getUserGrowthAnalytics(
    dateRange: AnalyticsDateRange,
  ): Promise<UserGrowthAnalytics> {
    const { startDate, endDate, groupBy = 'day' } = dateRange;

    this.logger.log(
      `Fetching user growth analytics from ${startDate} to ${endDate}`,
    );

    try {
      // Total users in period
      const newUsers = await this.prisma.user.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          id: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // User registration by period
      const usersByPeriod = this.groupUsersByPeriod(
        newUsers,
        groupBy as 'day' | 'week' | 'month',
      );

      // Users by role
      const usersByRole = {
        CLIENT: newUsers.filter((u) => u.role === 'CLIENT').length,
        ARTISAN: newUsers.filter((u) => u.role === 'ARTISAN').length,
        ADMIN: newUsers.filter((u) => u.role === 'ADMIN').length,
        ASSESSOR: newUsers.filter((u) => u.role === 'ASSESSOR').length,
      };

      // Active users (users with activity: jobs, bids, or messages in period)
      const usersWithActivity = await this.prisma.user.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          OR: [
            { clientJobs: { some: {} } },
            { artisanBids: { some: {} } },
            { sentMessages: { some: {} } },
          ],
        },
        select: { id: true },
      });
      const activeUsers = usersWithActivity.length;

      // Calculate retention rate (users with activity after registration)
      const usersWithMultipleLogins = usersWithActivity.length;

      const retentionRate =
        newUsers.length > 0
          ? (usersWithMultipleLogins / newUsers.length) * 100
          : 0;

      // Growth rate
      const previousPeriodStart = this.getPreviousPeriodStart(
        startDate,
        endDate,
      );
      const previousPeriodEnd = startDate;

      const previousPeriodUsers = await this.prisma.user.count({
        where: {
          createdAt: {
            gte: previousPeriodStart,
            lt: previousPeriodEnd,
          },
        },
      });

      const growthRate =
        previousPeriodUsers > 0
          ? ((newUsers.length - previousPeriodUsers) / previousPeriodUsers) *
            100
          : 0;

      return {
        totalNewUsers: newUsers.length,
        activeUsers,
        usersByRole,
        usersByPeriod,
        retentionRate,
        growthRate,
      };
    } catch (error) {
      this.logger.error(
        `Error fetching user growth analytics: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get job analytics
   */
  async getJobAnalytics(
    dateRange: AnalyticsDateRange,
  ): Promise<JobAnalytics> {
    const { startDate, endDate, groupBy = 'day' } = dateRange;

    this.logger.log(
      `Fetching job analytics from ${startDate} to ${endDate}`,
    );

    try {
      // All jobs in period
      const jobs = await this.prisma.job.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          id: true,
          status: true,
          createdAt: true,
          completedAt: true,
          category: {
            select: {
              name: true,
            },
          },
          bids: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      });

      // Jobs by period
      const jobsByPeriod = this.groupJobsByPeriod(
        jobs,
        groupBy as 'day' | 'week' | 'month',
      );

      // Jobs by status
      const jobsByStatus = {
        DRAFT: jobs.filter((j) => j.status === 'DRAFT').length,
        OPEN: jobs.filter((j) => j.status === 'OPEN').length,
        IN_PROGRESS: jobs.filter((j) => j.status === 'IN_PROGRESS').length,
        COMPLETED: jobs.filter((j) => j.status === 'COMPLETED').length,
        CANCELLED: jobs.filter((j) => j.status === 'CANCELLED').length,
      };

      // Jobs by category
      const jobsByCategory: Record<string, number> = {};
      jobs.forEach((job) => {
        const categoryName = job.category?.name || 'Uncategorized';
        jobsByCategory[categoryName] =
          (jobsByCategory[categoryName] || 0) + 1;
      });

      // Completion rate
      const completedJobs = jobs.filter((j) => j.status === 'COMPLETED').length;
      const completionRate = jobs.length > 0 ? (completedJobs / jobs.length) * 100 : 0;

      // Average time to completion (in days)
      const jobsWithCompletionTime = jobs.filter(
        (j) => j.completedAt && j.createdAt,
      );
      const avgCompletionTime =
        jobsWithCompletionTime.length > 0
          ? jobsWithCompletionTime.reduce((sum, j) => {
              const days = Math.floor(
                (j.completedAt!.getTime() - j.createdAt.getTime()) /
                  (1000 * 60 * 60 * 24),
              );
              return sum + days;
            }, 0) / jobsWithCompletionTime.length
          : 0;

      // Average bids per job
      const totalBids = jobs.reduce((sum, j) => sum + j.bids.length, 0);
      const avgBidsPerJob = jobs.length > 0 ? totalBids / jobs.length : 0;

      // Jobs with accepted bids
      const jobsWithAcceptedBids = jobs.filter((j) =>
        j.bids.some((b) => b.status === 'ACCEPTED'),
      ).length;
      const successRate = jobs.length > 0 ? (jobsWithAcceptedBids / jobs.length) * 100 : 0;

      return {
        totalJobs: jobs.length,
        jobsByStatus,
        jobsByCategory,
        jobsByPeriod,
        completionRate,
        avgCompletionTime,
        avgBidsPerJob,
        successRate,
      };
    } catch (error) {
      this.logger.error(`Error fetching job analytics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    this.logger.log('Fetching performance metrics');

    try {
      // Calculate various performance metrics
      const [
        totalUsers,
        totalJobs,
        totalPayments,
        avgBidResponseTime,
        avgJobCompletionTime,
        platformHealthScore,
      ] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.job.count(),
        this.prisma.payment.count({ where: { status: 'COMPLETED' } }),
        this.calculateAvgBidResponseTime(),
        this.calculateAvgJobCompletionTime(),
        this.calculatePlatformHealthScore(),
      ]);

      // Job-to-bid conversion rate
      const jobsWithBids = await this.prisma.job.count({
        where: {
          bids: {
            some: {},
          },
        },
      });
      const conversionRate = totalJobs > 0 ? (jobsWithBids / totalJobs) * 100 : 0;

      return {
        totalUsers,
        totalJobs,
        totalPayments,
        avgBidResponseTime,
        avgJobCompletionTime,
        conversionRate,
        platformHealthScore,
      };
    } catch (error) {
      this.logger.error(`Error fetching performance metrics: ${error.message}`);
      throw error;
    }
  }

  // =============================================
  // HELPER METHODS
  // =============================================

  private groupPaymentsByPeriod(
    payments: any[],
    groupBy: 'day' | 'week' | 'month',
  ): Record<string, number> {
    const grouped: Record<string, number> = {};

    payments.forEach((payment) => {
      const key = this.getTimePeriodKey(payment.createdAt, groupBy);
      grouped[key] = (grouped[key] || 0) + Number(payment.amount);
    });

    return grouped;
  }

  private groupPaymentsByCategory(
    payments: any[],
  ): Record<string, number> {
    const grouped: Record<string, number> = {};

    payments.forEach((payment) => {
      const category = payment.job?.category?.name || 'Uncategorized';
      grouped[category] = (grouped[category] || 0) + Number(payment.amount);
    });

    return grouped;
  }

  private groupUsersByPeriod(
    users: any[],
    groupBy: 'day' | 'week' | 'month',
  ): Record<string, number> {
    const grouped: Record<string, number> = {};

    users.forEach((user) => {
      const key = this.getTimePeriodKey(user.createdAt, groupBy);
      grouped[key] = (grouped[key] || 0) + 1;
    });

    return grouped;
  }

  private groupJobsByPeriod(
    jobs: any[],
    groupBy: 'day' | 'week' | 'month',
  ): Record<string, number> {
    const grouped: Record<string, number> = {};

    jobs.forEach((job) => {
      const key = this.getTimePeriodKey(job.createdAt, groupBy);
      grouped[key] = (grouped[key] || 0) + 1;
    });

    return grouped;
  }

  private getTimePeriodKey(date: Date, groupBy: 'day' | 'week' | 'month'): string {
    const d = new Date(date);

    if (groupBy === 'day') {
      return d.toISOString().split('T')[0]; // YYYY-MM-DD
    } else if (groupBy === 'week') {
      const weekNumber = this.getWeekNumber(d);
      return `${d.getFullYear()}-W${weekNumber}`;
    } else {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  private getPreviousPeriodStart(startDate: Date, endDate: Date): Date {
    const periodLength = endDate.getTime() - startDate.getTime();
    return new Date(startDate.getTime() - periodLength);
  }

  private async calculateAvgBidResponseTime(): Promise<number> {
    // Calculate average time from job posting to first bid (in hours)
    const jobs = await this.prisma.job.findMany({
      where: {
        bids: {
          some: {},
        },
      },
      select: {
        createdAt: true,
        bids: {
          orderBy: {
            createdAt: 'asc',
          },
          take: 1,
          select: {
            createdAt: true,
          },
        },
      },
    });

    if (jobs.length === 0) return 0;

    const totalHours = jobs.reduce((sum, job) => {
      if (job.bids.length === 0) return sum;
      const hours =
        (job.bids[0].createdAt.getTime() - job.createdAt.getTime()) /
        (1000 * 60 * 60);
      return sum + hours;
    }, 0);

    return totalHours / jobs.length;
  }

  private async calculateAvgJobCompletionTime(): Promise<number> {
    // Calculate average time from job posting to completion (in days)
    const completedJobs = await this.prisma.job.findMany({
      where: {
        status: 'COMPLETED',
        completedAt: {
          not: null,
        },
      },
      select: {
        createdAt: true,
        completedAt: true,
      },
    });

    if (completedJobs.length === 0) return 0;

    const totalDays = completedJobs.reduce((sum, job) => {
      const days =
        (job.completedAt!.getTime() - job.createdAt.getTime()) /
        (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);

    return totalDays / completedJobs.length;
  }

  private async calculatePlatformHealthScore(): Promise<number> {
    // Platform health score (0-100) based on various factors
    let score = 100;

    // Check for recent errors or issues
    const recentFailedPayments = await this.prisma.payment.count({
      where: {
        status: 'FAILED',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    const totalRecentPayments = await this.prisma.payment.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    // Deduct points for failed payments
    if (totalRecentPayments > 0) {
      const failureRate = (recentFailedPayments / totalRecentPayments) * 100;
      score -= failureRate * 0.5; // Deduct up to 50 points for 100% failure rate
    }

    // Check for cancelled jobs (indicator of poor matches)
    const recentCancelledJobs = await this.prisma.job.count({
      where: {
        status: 'CANCELLED',
        updatedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    });

    const totalRecentJobs = await this.prisma.job.count({
      where: {
        updatedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    if (totalRecentJobs > 0) {
      const cancellationRate = (recentCancelledJobs / totalRecentJobs) * 100;
      score -= cancellationRate * 0.3; // Deduct up to 30 points for 100% cancellation
    }

    return Math.max(0, Math.min(100, score)); // Ensure score is between 0-100
  }
}
