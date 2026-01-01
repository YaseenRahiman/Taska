'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
// import type { JobAnalytics } from '@/lib/api/analytics';

interface JobAnalytics {
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  categoryBreakdown: Array<{ category: string; count: number }>;
  timelineData: Array<{ date: string; jobs: number }>;
  statusBreakdown?: Array<{ status: string; count: number }>;
}

interface JobAnalyticsChartProps {
  data: JobAnalytics;
  isLoading?: boolean;
}

const STATUS_COLORS = {
  DRAFT: '#9ca3af',
  OPEN: '#3b82f6',
  IN_PROGRESS: '#f59e0b',
  COMPLETED: '#10b981',
  CANCELLED: '#ef4444',
};

const STATUS_LABELS = {
  DRAFT: 'Draft',
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export function JobAnalyticsChart({ data, isLoading }: JobAnalyticsChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-60 bg-gray-200 rounded animate-pulse mt-2" />
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-100 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  // Transform status data for pie chart (with null safety)
  const statusData = Object.entries(data.jobsByStatus || {})
    .filter(([_, count]) => (count || 0) > 0)
    .map(([status, count]) => ({
      name: STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status,
      value: count || 0,
      color: STATUS_COLORS[status as keyof typeof STATUS_COLORS] || '#9ca3af',
    }));

  // Transform category data for bar chart (with null safety)
  const categoryData = Object.entries(data.jobsByCategory || {}).map(([category, count]) => ({
    category,
    count: count || 0,
  }));

  // Transform period data for line chart (with null safety)
  const periodData = Object.entries(data.jobsByPeriod || {}).map(([period, count]) => ({
    period,
    jobs: count || 0,
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Jobs by Status</CardTitle>
            <CardDescription>Current job distribution across statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>

              <div className="mt-4 space-y-2 w-full">
                {statusData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold">{item.value} jobs</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Job Metrics</CardTitle>
            <CardDescription>Key job performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold text-blue-600">{data.completionRate.toFixed(1)}%</p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold text-green-600">{data.successRate.toFixed(1)}%</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Avg Bids/Job</p>
                  <p className="text-lg font-bold">{data.avgBidsPerJob.toFixed(1)}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Avg Completion</p>
                  <p className="text-lg font-bold">{Math.abs(data.avgCompletionTime).toFixed(0)}d</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Jobs by Category</CardTitle>
          <CardDescription>Job distribution across different categories</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }}
              />
              <Legend />
              <Bar dataKey="count" fill="#3b82f6" name="Jobs" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Job Posting Trends</CardTitle>
          <CardDescription>Jobs posted over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={periodData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }}
              />
              <Bar dataKey="jobs" fill="#10b981" name="Jobs Posted" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
