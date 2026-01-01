'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { RevenueAnalytics } from '@/lib/api/analytics';

interface RevenueChartProps {
  data: RevenueAnalytics;
  isLoading?: boolean;
}

export function RevenueChart({ data, isLoading }: RevenueChartProps) {
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

  // Transform period data for chart (with null safety)
  const chartData = Object.entries(data.revenueByPeriod || {}).map(([period, revenue]) => ({
    period,
    revenue: Number((revenue || 0).toFixed(2)),
    platformFees: Number(((revenue || 0) * 0.125).toFixed(2)), // Assuming 12.5% platform fee
  }));

  // Transform category data for display (with null safety)
  const categoryData = Object.entries(data.revenueByCategory || {}).map(([category, amount]) => ({
    category,
    amount: Number((amount || 0).toFixed(2)),
    percentage: data.totalRevenue ? (((amount || 0) / data.totalRevenue) * 100).toFixed(1) : '0',
  }));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Revenue Over Time</CardTitle>
          <CardDescription>
            Total revenue: R{data.totalRevenue.toFixed(2)} | Platform fees: R
            {data.totalPlatformFees.toFixed(2)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorFees" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => `R${value.toFixed(2)}`}
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorRevenue)"
                name="Total Revenue"
              />
              <Area
                type="monotone"
                dataKey="platformFees"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorFees)"
                name="Platform Fees"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Revenue by Category</CardTitle>
          <CardDescription>Breakdown of revenue across job categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {categoryData.map((item) => (
              <div key={item.category} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{item.category}</span>
                    <span className="text-sm text-muted-foreground">{item.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
                <span className="ml-4 text-sm font-semibold min-w-[80px] text-right">
                  R{item.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Avg Transaction Value</p>
                <p className="text-lg font-semibold">R{data.avgTransactionValue.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Transactions</p>
                <p className="text-lg font-semibold">{data.transactionCount}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
