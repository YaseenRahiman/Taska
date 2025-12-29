'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  TrendingUp,
  DollarSign,
  Clock,
  RefreshCw,
  Download,
  Calendar,
  PieChart,
  BarChart3,
} from 'lucide-react';
import escrowConfigService from '@/lib/api/escrow-config';
import type { EscrowAnalytics } from '@/types/escrow-config.types';

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<EscrowAnalytics | null>(null);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    loadAnalytics();
  }, [dateRange, fromDate, toDate]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      const filters: any = {};

      // Set date filters based on range
      if (dateRange !== 'all') {
        const today = new Date();
        const daysAgo = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
        const fromDateCalc = new Date(today);
        fromDateCalc.setDate(today.getDate() - daysAgo);
        filters.fromDate = fromDateCalc.toISOString().split('T')[0];
        filters.toDate = today.toISOString().split('T')[0];
      } else if (fromDate && toDate) {
        filters.fromDate = fromDate;
        filters.toDate = toDate;
      }

      const data = await escrowConfigService.getAnalytics(filters);
      setAnalytics(data);
    } catch (error) {
      toast.error('Failed to load analytics');
      console.error('Load analytics error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'ZAR') => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleExportCSV = async () => {
    try {
      const filters: any = {};
      if (dateRange !== 'all') {
        const today = new Date();
        const daysAgo = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
        const fromDateCalc = new Date(today);
        fromDateCalc.setDate(today.getDate() - daysAgo);
        filters.fromDate = fromDateCalc.toISOString().split('T')[0];
        filters.toDate = today.toISOString().split('T')[0];
      }

      const blob = await escrowConfigService.exportHolds(filters);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `escrow-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Analytics exported successfully');
    } catch (error) {
      toast.error('Failed to export analytics');
      console.error('Export error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading analytics...</span>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12 text-gray-500">
        No analytics data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Escrow Analytics</h2>
          <p className="text-sm text-gray-500 mt-1">
            Financial overview and trends
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range Selector */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Select date range"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={loadAnalytics}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            aria-label="Refresh analytics"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Export Button */}
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Holds */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Holds</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.totalHolds.count.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {formatCurrency(analytics.totalHolds.totalAmount)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Active Holds */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Active Holds</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.activeHolds.count.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {formatCurrency(analytics.activeHolds.totalAmount)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Released This Month */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Released (Month)</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.releasedThisMonth.count.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {formatCurrency(analytics.releasedThisMonth.totalAmount)}
              </p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        {/* Refunded This Month */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Refunded (Month)</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.refundedThisMonth.count.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {formatCurrency(analytics.refundedThisMonth.totalAmount)}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Average Hold Duration */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Average Hold Duration</h3>
        </div>
        <p className="text-3xl font-bold text-gray-900">
          {analytics.averageHoldDuration.toFixed(1)} days
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Average time funds are held in escrow before release or refund
        </p>
      </div>

      {/* Status Breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <PieChart className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Holds by Status</h3>
        </div>

        <div className="space-y-4">
          {analytics.holdsByStatus.map((item) => (
            <div key={item.status} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">{item.status}</span>
                <div className="text-right">
                  <span className="font-semibold text-gray-900">
                    {item.count} ({item.percentage.toFixed(1)}%)
                  </span>
                  <p className="text-xs text-gray-500">
                    {formatCurrency(item.totalAmount)}
                  </p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    item.status === 'ACTIVE'
                      ? 'bg-blue-600'
                      : item.status === 'RELEASED'
                      ? 'bg-green-600'
                      : item.status === 'REFUNDED'
                      ? 'bg-yellow-600'
                      : item.status === 'DISPUTED'
                      ? 'bg-red-600'
                      : 'bg-gray-600'
                  }`}
                  style={{ width: `${item.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Release Reasons */}
      {analytics.releaseReasons.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Release Reasons</h3>
          </div>

          <div className="space-y-4">
            {analytics.releaseReasons.slice(0, 5).map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700 truncate max-w-[70%]">
                    {item.reason || 'No reason provided'}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {item.count} ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Refund Reasons */}
      {analytics.refundReasons.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-5 h-5 text-yellow-600" />
            <h3 className="text-lg font-semibold text-gray-900">Refund Reasons</h3>
          </div>

          <div className="space-y-4">
            {analytics.refundReasons.slice(0, 5).map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700 truncate max-w-[70%]">
                    {item.reason || 'No reason provided'}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {item.count} ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-600 h-2 rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Holds Over Time */}
      {analytics.holdsOverTime.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Holds Over Time</h3>
          </div>

          <div className="space-y-3">
            {analytics.holdsOverTime.slice(-10).map((item, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm font-medium text-gray-700">
                  {new Date(item.date).toLocaleDateString('en-ZA', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-blue-600 font-medium">
                      {item.activeCount} active
                    </span>
                  </div>
                  <div>
                    <span className="text-green-600 font-medium">
                      {item.releasedCount} released
                    </span>
                  </div>
                  <div>
                    <span className="text-yellow-600 font-medium">
                      {item.refundedCount} refunded
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-900 font-semibold">
                      {formatCurrency(item.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
