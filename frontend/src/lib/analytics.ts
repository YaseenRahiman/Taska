/**
 * Analytics API Client
 *
 * Provides functions to interact with the analytics endpoints
 * for the admin dashboard.
 */

import { api } from './api';

export interface AnalyticsDateRange {
  startDate: string;
  endDate: string;
  groupBy?: 'day' | 'week' | 'month';
}

export interface RevenueAnalytics {
  totalRevenue: number;
  totalPlatformFees: number;
  avgTransactionValue: number;
  transactionCount: number;
  growthRate: number;
  revenueByPeriod: Record<string, number>;
  revenueByCategory: Record<string, number>;
}

export interface UserGrowthAnalytics {
  totalNewUsers: number;
  activeUsers: number;
  usersByRole: {
    CLIENT: number;
    ARTISAN: number;
    ADMIN: number;
    ASSESSOR: number;
  };
  usersByPeriod: Record<string, number>;
  retentionRate: number;
  growthRate: number;
}

export interface JobAnalytics {
  totalJobs: number;
  jobsByStatus: {
    DRAFT: number;
    OPEN: number;
    IN_PROGRESS: number;
    COMPLETED: number;
    CANCELLED: number;
  };
  jobsByCategory: Record<string, number>;
  jobsByPeriod: Record<string, number>;
  completionRate: number;
  avgCompletionTime: number;
  avgBidsPerJob: number;
  successRate: number;
}

export interface PerformanceMetrics {
  totalUsers: number;
  totalJobs: number;
  totalPayments: number;
  avgBidResponseTime: number;
  avgJobCompletionTime: number;
  conversionRate: number;
  platformHealthScore: number;
}

export interface AnalyticsExportQuery extends AnalyticsDateRange {
  type: 'revenue' | 'users' | 'jobs' | 'performance';
  format: 'csv' | 'excel' | 'json';
}

// Default values for analytics data
const defaultRevenueAnalytics: RevenueAnalytics = {
  totalRevenue: 0,
  totalPlatformFees: 0,
  avgTransactionValue: 0,
  transactionCount: 0,
  growthRate: 0,
  revenueByPeriod: {},
  revenueByCategory: {},
};

const defaultUserGrowthAnalytics: UserGrowthAnalytics = {
  totalNewUsers: 0,
  activeUsers: 0,
  usersByRole: { CLIENT: 0, ARTISAN: 0, ADMIN: 0, ASSESSOR: 0 },
  usersByPeriod: {},
  retentionRate: 0,
  growthRate: 0,
};

const defaultJobAnalytics: JobAnalytics = {
  totalJobs: 0,
  jobsByStatus: { DRAFT: 0, OPEN: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0 },
  jobsByCategory: {},
  jobsByPeriod: {},
  completionRate: 0,
  avgCompletionTime: 0,
  avgBidsPerJob: 0,
  successRate: 0,
};

const defaultPerformanceMetrics: PerformanceMetrics = {
  totalUsers: 0,
  totalJobs: 0,
  totalPayments: 0,
  avgBidResponseTime: 0,
  avgJobCompletionTime: 0,
  conversionRate: 0,
  platformHealthScore: 0,
};

/**
 * Fetch revenue analytics
 */
export async function getRevenueAnalytics(
  params: AnalyticsDateRange
): Promise<RevenueAnalytics> {
  try {
    const queryParams = new URLSearchParams({
      startDate: params.startDate,
      endDate: params.endDate,
      ...(params.groupBy && { groupBy: params.groupBy }),
    });

    const response = await api.get<{ data: RevenueAnalytics }>(
      `/admin/analytics/revenue?${queryParams}`
    );
    return { ...defaultRevenueAnalytics, ...response.data };
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    return defaultRevenueAnalytics;
  }
}

/**
 * Fetch user growth analytics
 */
export async function getUserGrowthAnalytics(
  params: AnalyticsDateRange
): Promise<UserGrowthAnalytics> {
  try {
    const queryParams = new URLSearchParams({
      startDate: params.startDate,
      endDate: params.endDate,
      ...(params.groupBy && { groupBy: params.groupBy }),
    });

    const response = await api.get<{ data: UserGrowthAnalytics }>(
      `/admin/analytics/users?${queryParams}`
    );
    return { ...defaultUserGrowthAnalytics, ...response.data };
  } catch (error) {
    console.error('Error fetching user growth analytics:', error);
    return defaultUserGrowthAnalytics;
  }
}

/**
 * Fetch job analytics
 */
export async function getJobAnalytics(
  params: AnalyticsDateRange
): Promise<JobAnalytics> {
  try {
    const queryParams = new URLSearchParams({
      startDate: params.startDate,
      endDate: params.endDate,
      ...(params.groupBy && { groupBy: params.groupBy }),
    });

    const response = await api.get<{ data: JobAnalytics }>(
      `/admin/analytics/jobs?${queryParams}`
    );
    return { ...defaultJobAnalytics, ...response.data };
  } catch (error) {
    console.error('Error fetching job analytics:', error);
    return defaultJobAnalytics;
  }
}

/**
 * Fetch performance metrics
 */
export async function getPerformanceMetrics(): Promise<PerformanceMetrics> {
  try {
    const response = await api.get<{ data: PerformanceMetrics }>(
      '/admin/analytics/performance'
    );
    return { ...defaultPerformanceMetrics, ...response.data };
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    return defaultPerformanceMetrics;
  }
}

/**
 * Export analytics data
 */
export async function exportAnalytics(
  params: AnalyticsExportQuery
): Promise<{ downloadUrl: string; fileName: string }> {
  const queryParams = new URLSearchParams({
    type: params.type,
    format: params.format,
    startDate: params.startDate,
    endDate: params.endDate,
    ...(params.groupBy && { groupBy: params.groupBy }),
  });

  const response = await api.get<{ downloadUrl: string; fileName: string }>(
    `/admin/analytics/export?${queryParams}`
  );
  return response;
}
