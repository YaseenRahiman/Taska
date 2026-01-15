'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Users, Briefcase, DollarSign, Activity } from 'lucide-react';
import type { PerformanceMetrics as PerformanceMetricsType } from '@/lib/analytics';

interface PerformanceMetricsProps {
  metrics: PerformanceMetricsType;
  isLoading?: boolean;
}

export function PerformanceMetrics({ metrics, isLoading }: PerformanceMetricsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Users',
      value: metrics.totalUsers,
      icon: Users,
      description: 'Registered platform users',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Total Jobs',
      value: metrics.totalJobs,
      icon: Briefcase,
      description: 'Posted jobs on platform',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Total Payments',
      value: metrics.totalPayments,
      icon: DollarSign,
      description: 'Completed transactions',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Platform Health',
      value: `${metrics.platformHealthScore}%`,
      icon: Activity,
      description: 'Overall system health',
      color: metrics.platformHealthScore >= 80 ? 'text-green-600' : 'text-orange-600',
      bgColor: metrics.platformHealthScore >= 80 ? 'bg-green-50' : 'bg-orange-50',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
            </CardContent>
          </Card>
        );
      })}

      {/* Additional metrics row */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Key Performance Indicators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Avg Bid Response Time</p>
              <p className="text-xl font-semibold">
                {(metrics.avgBidResponseTime * 24).toFixed(1)}h
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Avg Job Completion Time</p>
              <p className="text-xl font-semibold">
                {Math.abs(metrics.avgJobCompletionTime).toFixed(1)} days
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Conversion Rate</p>
              <div className="flex items-center gap-2">
                <p className="text-xl font-semibold">{metrics.conversionRate}%</p>
                {metrics.conversionRate >= 50 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
