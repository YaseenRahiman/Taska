'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Wallet,
  RefreshCw,
  Download,
  Filter,
  Eye,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  BarChart3,
  PieChart,
  Users,
  Briefcase
} from 'lucide-react';

interface FinancialMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  todayRevenue: number;
  platformFees: number;
  totalPayouts: number;
  pendingPayouts: number;
  escrowBalance: number;
  refundsIssued: number;
  averageJobValue: number;
  revenueGrowth: number;
  payoutGrowth: number;
  transactionCount: number;
}

interface Transaction {
  id: string;
  type: 'PAYMENT' | 'PAYOUT' | 'REFUND' | 'FEE';
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  description: string;
  createdAt: string;
  user: {
    email: string;
    profile: {
      firstName: string;
      lastName: string;
    };
  };
  job?: {
    title: string;
    id: string;
  };
}

interface Reconciliation {
  totalProcessed: number;
  totalFees: number;
  totalRefunds: number;
  netRevenue: number;
  platformBalance: number;
  escrowHeld: number;
  pendingTransactions: number;
  lastReconciled: string;
}

interface RevenueDataPoint {
  date: string;
  revenue: number;
  fees: number;
  payouts: number;
}

const FinancialManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reconciliation, setReconciliation] = useState<Reconciliation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      
      // Fetch all financial data
      const [metricsResponse, reconciliationResponse] = await Promise.all([
        api.get('/admin/dashboard/metrics'),
        api.get('/admin/financial/reconciliation')
      ]);

      setMetrics({
        totalRevenue: metricsResponse.data.totalRevenue || 0,
        monthlyRevenue: metricsResponse.data.monthlyRevenue || 0,
        todayRevenue: metricsResponse.data.todayRevenue || 0,
        platformFees: reconciliationResponse.data.totalFees || 0,
        totalPayouts: reconciliationResponse.data.totalProcessed || 0,
        pendingPayouts: reconciliationResponse.data.pendingTransactions || 0,
        escrowBalance: reconciliationResponse.data.escrowHeld || 0,
        refundsIssued: reconciliationResponse.data.totalRefunds || 0,
        averageJobValue: 2500, // Mock data
        revenueGrowth: 15.2, // Mock data
        payoutGrowth: 12.8, // Mock data
        transactionCount: 1247 // Mock data
      });
      
      setReconciliation(reconciliationResponse.data);

      // Generate revenue trend data for the last 30 days
      const generateRevenueData = (): RevenueDataPoint[] => {
        const data: RevenueDataPoint[] = [];
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const baseRevenue = 5000 + Math.random() * 15000;
          const fees = baseRevenue * 0.15;
          const payouts = baseRevenue - fees - (Math.random() * 500);
          data.push({
            date: date.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' }),
            revenue: Math.round(baseRevenue),
            fees: Math.round(fees),
            payouts: Math.round(payouts > 0 ? payouts : 0),
          });
        }
        return data;
      };

      setRevenueData(generateRevenueData());

      // Mock transaction data
      setTransactions([
        {
          id: '1',
          type: 'PAYMENT',
          amount: 3500,
          status: 'COMPLETED',
          description: 'Job payment received',
          createdAt: new Date().toISOString(),
          user: {
            email: 'client@example.com',
            profile: { firstName: 'John', lastName: 'Doe' }
          },
          job: { title: 'Kitchen Renovation', id: 'job-1' }
        },
        {
          id: '2',
          type: 'PAYOUT',
          amount: 2975,
          status: 'PENDING',
          description: 'Artisan payout',
          createdAt: new Date(Date.now() - 60000).toISOString(),
          user: {
            email: 'artisan@example.com',
            profile: { firstName: 'Jane', lastName: 'Smith' }
          },
          job: { title: 'Kitchen Renovation', id: 'job-1' }
        }
      ]);
      
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load financial data');
      console.error('Financial data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, [dateRange]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getGrowthColor = (growth: number): string => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      case 'REFUNDED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'PAYMENT': return 'bg-green-100 text-green-800';
      case 'PAYOUT': return 'bg-blue-100 text-blue-800';
      case 'REFUND': return 'bg-red-100 text-red-800';
      case 'FEE': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PAYMENT': return <TrendingUp className="w-4 h-4" />;
      case 'PAYOUT': return <TrendingDown className="w-4 h-4" />;
      case 'REFUND': return <RefreshCw className="w-4 h-4" />;
      case 'FEE': return <DollarSign className="w-4 h-4" />;
      default: return <CreditCard className="w-4 h-4" />;
    }
  };

  if (loading && !metrics) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-lg p-6 h-32"></div>
              ))}
            </div>
            <div className="bg-white rounded-lg h-80"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Financial Management</h1>
            <p className="text-gray-600 mt-1">
              Monitor platform revenue, payouts, and financial performance
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Button
              variant="outline"
              onClick={fetchFinancialData}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Financial Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 border-0 shadow-sm bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <div className="flex items-center gap-2 mt-1">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {formatCurrency(metrics?.totalRevenue || 0)}
                  </h3>
                  <Badge className={`text-xs ${getGrowthColor(metrics?.revenueGrowth || 0)}`}>
                    {formatPercentage(metrics?.revenueGrowth || 0)}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formatCurrency(metrics?.monthlyRevenue || 0)} this month
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-0 shadow-sm bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Platform Fees</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(metrics?.platformFees || 0)}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  15% commission rate
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-0 shadow-sm bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Payouts</p>
                <div className="flex items-center gap-2 mt-1">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {formatCurrency(metrics?.totalPayouts || 0)}
                  </h3>
                  <Badge className={`text-xs ${getGrowthColor(metrics?.payoutGrowth || 0)}`}>
                    {formatPercentage(metrics?.payoutGrowth || 0)}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {metrics?.pendingPayouts || 0} pending
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-0 shadow-sm bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Escrow Balance</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(metrics?.escrowBalance || 0)}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Funds held in escrow
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Overview
                </div>
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'transactions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Transactions ({transactions.length})
                </div>
              </button>
              <button
                onClick={() => setActiveTab('reconciliation')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'reconciliation'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Reconciliation
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Revenue Chart */}
            <Card className="p-6 border-0 shadow-sm bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Revenue Trends</h3>
                <Button variant="ghost" size="sm">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={revenueData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorFees" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorPayouts" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      stroke="#9ca3af"
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#9ca3af"
                      fontSize={12}
                      tickLine={false}
                      tickFormatter={(value) => `R${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                      formatter={(value: number) => [formatCurrency(value), '']}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                    <Area
                      type="monotone"
                      dataKey="payouts"
                      name="Payouts"
                      stroke="#3b82f6"
                      fillOpacity={1}
                      fill="url(#colorPayouts)"
                    />
                    <Area
                      type="monotone"
                      dataKey="fees"
                      name="Fees"
                      stroke="#8b5cf6"
                      fillOpacity={1}
                      fill="url(#colorFees)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Key Metrics */}
            <Card className="p-6 border-0 shadow-sm bg-white">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Financial Metrics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Average Job Value</span>
                  <span className="font-medium">{formatCurrency(metrics?.averageJobValue || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Transactions</span>
                  <span className="font-medium">{metrics?.transactionCount || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Refunds Issued</span>
                  <span className="font-medium">{formatCurrency(metrics?.refundsIssued || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Success Rate</span>
                  <span className="font-medium text-green-600">98.5%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Platform Fee Rate</span>
                  <span className="font-medium">15%</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'transactions' && (
          <Card className="border-0 shadow-sm bg-white">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Transactions
              </h2>
            </div>

            <div className="divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        {getTypeIcon(transaction.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900">{transaction.description}</h4>
                          <Badge className={`${getTypeColor(transaction.type)} text-xs`}>
                            {transaction.type}
                          </Badge>
                          <Badge className={`${getStatusColor(transaction.status)} text-xs`}>
                            {transaction.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{transaction.user.profile.firstName} {transaction.user.profile.lastName}</span>
                          <span>{transaction.user.email}</span>
                          {transaction.job && (
                            <span>Job: {transaction.job.title}</span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(transaction.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className={`font-semibold ${transaction.type === 'PAYMENT' ? 'text-green-600' : 'text-gray-900'}`}>
                          {transaction.type === 'PAYMENT' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTransaction(transaction)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {transactions.length === 0 && (
                <div className="p-12 text-center text-gray-500">
                  <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No transactions found</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {activeTab === 'reconciliation' && reconciliation && (
          <Card className="border-0 shadow-sm bg-white">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Financial Reconciliation</h2>
                <div className="text-sm text-gray-500">
                  Last reconciled: {new Date(reconciliation.lastReconciled).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                    <h4 className="font-medium text-gray-900">Total Processed</h4>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(reconciliation.totalProcessed)}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-purple-600" />
                    </div>
                    <h4 className="font-medium text-gray-900">Platform Fees</h4>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(reconciliation.totalFees)}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <RefreshCw className="w-4 h-4 text-red-600" />
                    </div>
                    <h4 className="font-medium text-gray-900">Total Refunds</h4>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(reconciliation.totalRefunds)}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Wallet className="w-4 h-4 text-blue-600" />
                    </div>
                    <h4 className="font-medium text-gray-900">Net Revenue</h4>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(reconciliation.netRevenue)}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Clock className="w-4 h-4 text-yellow-600" />
                    </div>
                    <h4 className="font-medium text-gray-900">Escrow Held</h4>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(reconciliation.escrowHeld)}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-gray-600" />
                    </div>
                    <h4 className="font-medium text-gray-900">Pending Transactions</h4>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{reconciliation.pendingTransactions}</p>
                </div>
              </div>

              <div className="mt-8 bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Platform Balance Summary</h4>
                <div className="text-sm text-blue-800">
                  <p>Current platform balance: <span className="font-semibold">{formatCurrency(reconciliation.platformBalance)}</span></p>
                  <p className="mt-1">Available for withdrawal: <span className="font-semibold">{formatCurrency(reconciliation.netRevenue - reconciliation.escrowHeld)}</span></p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Transaction Detail Modal */}
        {selectedTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-white">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Transaction Details</h3>
                <Button variant="ghost" onClick={() => setSelectedTransaction(null)}>
                  ×
                </Button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">ID:</span> {selectedTransaction.id}
                  </div>
                  <div>
                    <span className="font-medium">Type:</span> {selectedTransaction.type}
                  </div>
                  <div>
                    <span className="font-medium">Amount:</span> {formatCurrency(selectedTransaction.amount)}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> {selectedTransaction.status}
                  </div>
                  <div>
                    <span className="font-medium">User:</span> {selectedTransaction.user.email}
                  </div>
                  <div>
                    <span className="font-medium">Date:</span> {new Date(selectedTransaction.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Description:</span> {selectedTransaction.description}
                </div>
                {selectedTransaction.job && (
                  <div className="text-sm">
                    <span className="font-medium">Job:</span> {selectedTransaction.job.title} (ID: {selectedTransaction.job.id})
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialManagement;
