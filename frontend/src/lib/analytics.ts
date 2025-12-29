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

/**
 * Fetch revenue analytics
 */
export async function getRevenueAnalytics(
  params: AnalyticsDateRange
): Promise<RevenueAnalytics> {
  const queryParams = new URLSearchParams({
    startDate: params.startDate,
    endDate: params.endDate,
    ...(params.groupBy && { groupBy: params.groupBy }),
  });

  const response = await api.get<{ data: RevenueAnalytics }>(
    `/admin/analytics/revenue?${queryParams}`
  );
  return response.data;
}

/**
 * Fetch user growth analytics
 */
export async function getUserGrowthAnalytics(
  params: AnalyticsDateRange
): Promise<UserGrowthAnalytics> {
  const queryParams = new URLSearchParams({
    startDate: params.startDate,
    endDate: params.endDate,
    ...(params.groupBy && { groupBy: params.groupBy }),
  });

  const response = await api.get<{ data: UserGrowthAnalytics }>(
    `/admin/analytics/users?${queryParams}`
  );
  return response.data;
}

/**
 * Fetch job analytics
 */
export async function getJobAnalytics(
  params: AnalyticsDateRange
): Promise<JobAnalytics> {
  const queryParams = new URLSearchParams({
    startDate: params.startDate,
    endDate: params.endDate,
    ...(params.groupBy && { groupBy: params.groupBy }),
  });

  const response = await api.get<{ data: JobAnalytics }>(
    `/admin/analytics/jobs?${queryParams}`
  );
  return response.data;
}

/**
 * Fetch performance metrics
 */
export async function getPerformanceMetrics(): Promise<PerformanceMetrics> {
  const response = await api.get<{ data: PerformanceMetrics }>(
    '/admin/analytics/performance'
  );
  return response.data;
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
