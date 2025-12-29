'use client';

import React, { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { toast } from 'sonner';
import { PerformanceMetrics } from '@/components/admin/analytics/PerformanceMetrics';
import { RevenueChart } from '@/components/admin/analytics/RevenueChart';
import { UserGrowthChart } from '@/components/admin/analytics/UserGrowthChart';
import { JobAnalyticsChart } from '@/components/admin/analytics/JobAnalyticsChart';
import { DateRangeSelector } from '@/components/admin/analytics/DateRangeSelector';
import {
  getRevenueAnalytics,
  getUserGrowthAnalytics,
  getJobAnalytics,
  getPerformanceMetrics,
  exportAnalytics,
  type RevenueAnalytics,
  type UserGrowthAnalytics,
  type JobAnalytics,
  type PerformanceMetrics as PerformanceMetricsType,
} from '@/lib/analytics';

export default function AnalyticsPage() {
  // Date range state
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Analytics data state
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetricsType | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueAnalytics | null>(null);
  const [userGrowthData, setUserGrowthData] = useState<UserGrowthAnalytics | null>(null);
  const [jobAnalyticsData, setJobAnalyticsData] = useState<JobAnalytics | null>(null);

  // Loading states
  const [isLoadingPerformance, setIsLoadingPerformance] = useState(true);
  const [isLoadingRevenue, setIsLoadingRevenue] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);

  // Fetch performance metrics (no date range needed)
  const fetchPerformanceMetrics = async () => {
    try {
      setIsLoadingPerformance(true);
      const data = await getPerformanceMetrics();
      setPerformanceMetrics(data);
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      toast.error('Failed to load performance metrics');
    } finally {
      setIsLoadingPerformance(false);
    }
  };

  // Fetch all analytics data
  const fetchAnalyticsData = async () => {
    try {
      const dateRange = {
        startDate,
        endDate,
        groupBy: 'month' as const,
      };

      // Fetch revenue analytics
      setIsLoadingRevenue(true);
      const revenue = await getRevenueAnalytics(dateRange);
      setRevenueData(revenue);
      setIsLoadingRevenue(false);

      // Fetch user growth analytics
      setIsLoadingUsers(true);
      const users = await getUserGrowthAnalytics(dateRange);
      setUserGrowthData(users);
      setIsLoadingUsers(false);

      // Fetch job analytics
      setIsLoadingJobs(true);
      const jobs = await getJobAnalytics(dateRange);
      setJobAnalyticsData(jobs);
      setIsLoadingJobs(false);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchPerformanceMetrics();
    fetchAnalyticsData();
  }, []);

  // Handle date range change
  const handleDateRangeChange = (newStartDate: string, newEndDate: string) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    // Trigger data fetch with new date range
    setTimeout(() => {
      fetchAnalyticsData();
    }, 100);
  };

  // Handle export
  const handleExport = async () => {
    try {
      const result = await exportAnalytics({
        type: 'revenue',
        format: 'json',
        startDate,
        endDate,
      });
      toast.success(`Export initiated! File: ${result.fileName}`);
      // In a real implementation, you would trigger a download here
      console.log('Export URL:', result.downloadUrl);
    } catch (error) {
      console.error('Error exporting analytics:', error);
      toast.error('Failed to export analytics');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Comprehensive platform analytics and insights
        </p>
      </div>

      {/* Date Range Selector */}
      <DateRangeSelector
        startDate={startDate}
        endDate={endDate}
        onDateRangeChange={handleDateRangeChange}
        onExport={handleExport}
      />

      {/* Performance Metrics */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Performance Overview</h2>
        {performanceMetrics ? (
          <PerformanceMetrics metrics={performanceMetrics} isLoading={isLoadingPerformance} />
        ) : (
          <PerformanceMetrics
            metrics={{
              totalUsers: 0,
              totalJobs: 0,
              totalPayments: 0,
              avgBidResponseTime: 0,
              avgJobCompletionTime: 0,
              conversionRate: 0,
              platformHealthScore: 0,
            }}
            isLoading={isLoadingPerformance}
          />
        )}
      </section>

      {/* Revenue Analytics */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Revenue Analytics</h2>
        {revenueData ? (
          <RevenueChart data={revenueData} isLoading={isLoadingRevenue} />
        ) : (
          <RevenueChart
            data={{
              totalRevenue: 0,
              totalPlatformFees: 0,
              avgTransactionValue: 0,
              transactionCount: 0,
              growthRate: 0,
              revenueByPeriod: {},
              revenueByCategory: {},
            }}
            isLoading={isLoadingRevenue}
          />
        )}
      </section>

      {/* User Growth Analytics */}
      <section>
        <h2 className="text-xl font-semibold mb-4">User Growth</h2>
        {userGrowthData ? (
          <UserGrowthChart data={userGrowthData} isLoading={isLoadingUsers} />
        ) : (
          <UserGrowthChart
            data={{
              totalNewUsers: 0,
              activeUsers: 0,
              usersByRole: { CLIENT: 0, ARTISAN: 0, ADMIN: 0, ASSESSOR: 0 },
              usersByPeriod: {},
              retentionRate: 0,
              growthRate: 0,
            }}
            isLoading={isLoadingUsers}
          />
        )}
      </section>

      {/* Job Analytics */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Job Analytics</h2>
        {jobAnalyticsData ? (
          <JobAnalyticsChart data={jobAnalyticsData} isLoading={isLoadingJobs} />
        ) : (
          <JobAnalyticsChart
            data={{
              totalJobs: 0,
              jobsByStatus: {
                DRAFT: 0,
                OPEN: 0,
                IN_PROGRESS: 0,
                COMPLETED: 0,
                CANCELLED: 0,
              },
              jobsByCategory: {},
              jobsByPeriod: {},
              completionRate: 0,
              avgCompletionTime: 0,
              avgBidsPerJob: 0,
              successRate: 0,
            }}
            isLoading={isLoadingJobs}
          />
        )}
      </section>
    </div>
  );
}
