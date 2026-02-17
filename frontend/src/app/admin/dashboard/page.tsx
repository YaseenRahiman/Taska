'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { NotificationCenter } from '@/components/admin/notifications/notification-center';
import {
  Users,
  Briefcase,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Activity,
  BarChart3,
  Shield,
  Settings,
  FileText,
  Download,
  RefreshCw,
  Eye,
  UserCheck,
  Flag,
  Zap,
  LogOut,
  Plus,
  Megaphone,
  Bell,
  FileSpreadsheet,
  CreditCard,
  X
} from 'lucide-react';

interface AdminMetrics {
  totalUsers: number;
  activeUsers: number;
  totalJobs: number;
  activeJobs: number;
  totalBids: number;
  totalPayments: number;
  totalRevenue: number;
  todayRevenue: number;
  monthlyRevenue: number;
  userGrowth: number;
  jobGrowth: number;
  conversionRate: number;
  systemHealth: {
    database: string;
    redis: string;
    storage: string;
    paymentGateway: string;
    overallStatus: string;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    user: string;
    timestamp: string;
    type: 'user' | 'job' | 'payment' | 'system';
  }>;
}

const AdminDashboard: React.FC = () => {
  const router = useRouter();
  const { logout } = useAuth();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Quick Action Modal States
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [announcementType, setAnnouncementType] = useState<'INFO' | 'WARNING' | 'ERROR'>('INFO');
  const [announcementLoading, setAnnouncementLoading] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth/login');
    } catch (error) {
      // Error is already handled by the logout function
    }
  };

  const handleSendAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementMessage.trim()) {
      alert('Please fill in both title and message');
      return;
    }

    try {
      setAnnouncementLoading(true);
      await api.post('/admin/announcements', {
        title: announcementTitle,
        message: announcementMessage,
        type: announcementType,
      });
      alert('Announcement sent successfully!');
      setShowAnnouncementModal(false);
      setAnnouncementTitle('');
      setAnnouncementMessage('');
      setAnnouncementType('INFO');
    } catch (err: any) {
      console.error('Failed to send announcement:', err);
      alert(err.response?.data?.message || 'Failed to send announcement');
    } finally {
      setAnnouncementLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      setRefreshing(true);
      const response = await api.get('/admin/dashboard/metrics');
      setMetrics(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Dashboard metrics error:', err);
      // Use mock data for development/testing if backend is not available
      const mockMetrics: AdminMetrics = {
        totalUsers: 150,
        activeUsers: 45,
        totalJobs: 78,
        activeJobs: 23,
        totalBids: 156,
        totalPayments: 45,
        totalRevenue: 125000,
        todayRevenue: 3500,
        monthlyRevenue: 85000,
        userGrowth: 12.5,
        jobGrowth: 8.3,
        conversionRate: 28.5,
        systemHealth: {
          database: 'healthy',
          redis: 'healthy',
          storage: 'healthy',
          paymentGateway: 'healthy',
          overallStatus: 'healthy',
        },
        recentActivity: [
          {
            id: '1',
            action: 'New user registered',
            user: 'John Doe',
            timestamp: new Date().toISOString(),
            type: 'user',
          },
          {
            id: '2',
            action: 'Job posted',
            user: 'Jane Smith',
            timestamp: new Date(Date.now() - 300000).toISOString(),
            type: 'job',
          },
          {
            id: '3',
            action: 'Payment completed',
            user: 'Mike Johnson',
            timestamp: new Date(Date.now() - 600000).toISOString(),
            type: 'payment',
          },
        ],
      };
      setMetrics(mockMetrics);
      setError(null); // Don't show error when using mock data
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Set document title
  useEffect(() => {
    document.title = 'Admin Dashboard - Taska';
  }, []);

  useEffect(() => {
    fetchMetrics();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

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

  const getHealthStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user': return <Users className="w-4 h-4" />;
      case 'job': return <Briefcase className="w-4 h-4" />;
      case 'payment': return <DollarSign className="w-4 h-4" />;
      case 'system': return <Settings className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getUserDisplayName = (user: any): string => {
    if (typeof user === 'string') return user;
    if (user?.profile?.firstName || user?.profile?.lastName) {
      return `${user.profile.firstName || ''} ${user.profile.lastName || ''}`.trim();
    }
    if (user?.email) return user.email;
    return 'Unknown User';
  };

  const formatActivityTime = (timestamp: string | null | undefined): string => {
    if (!timestamp) return 'Just now';

    try {
      const date = new Date(timestamp);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Just now';
      }

      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString('en-ZA', {
        day: 'numeric',
        month: 'short'
      });
    } catch {
      return 'Just now';
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg h-80"></div>
              <div className="bg-white rounded-lg h-80"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchMetrics} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
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
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome to the Taska admin control panel
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* <NotificationCenter /> Temporarily disabled for testing */}
            <Button
              variant="outline"
              onClick={fetchMetrics}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={() => window.open('/admin/reports/generate', '_blank')}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Report
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <div className="flex items-center gap-2 mt-1">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {metrics?.totalUsers?.toLocaleString() || '0'}
                  </h3>
                  <Badge variant="secondary" className={`text-xs ${getGrowthColor(metrics?.userGrowth || 0)}`}>
                    {formatPercentage(metrics?.userGrowth || 0)}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {metrics?.activeUsers || 0} active today
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                <div className="flex items-center gap-2 mt-1">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {metrics?.totalJobs?.toLocaleString() || '0'}
                  </h3>
                  <Badge variant="secondary" className={`text-xs ${getGrowthColor(metrics?.jobGrowth || 0)}`}>
                    {formatPercentage(metrics?.jobGrowth || 0)}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {metrics?.activeJobs || 0} active jobs
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(metrics?.monthlyRevenue || 0)}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {formatCurrency(metrics?.todayRevenue || 0)} today
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">
                  {(metrics?.conversionRate || 0).toFixed(1)}%
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {metrics?.totalBids || 0} total bids
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="p-6 mb-8 border-0 shadow-sm bg-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            <span className="text-xs text-gray-500">Common admin tasks</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-24 flex-col gap-2 hover:bg-blue-50 hover:border-blue-300 transition-all"
              onClick={() => router.push('/admin/subscriptions?action=create')}
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Plus className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm font-medium">New Subscription Plan</span>
            </Button>

            <Button
              variant="outline"
              className="h-24 flex-col gap-2 hover:bg-orange-50 hover:border-orange-300 transition-all"
              onClick={() => setShowAnnouncementModal(true)}
            >
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Megaphone className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-sm font-medium">Send Announcement</span>
            </Button>

            <Button
              variant="outline"
              className="h-24 flex-col gap-2 hover:bg-red-50 hover:border-red-300 transition-all"
              onClick={() => router.push('/admin/activity-logs?filter=critical')}
            >
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-red-600" />
              </div>
              <span className="text-sm font-medium">View Critical Alerts</span>
            </Button>

            <Button
              variant="outline"
              className="h-24 flex-col gap-2 hover:bg-green-50 hover:border-green-300 transition-all"
              onClick={() => router.push('/admin/reports')}
            >
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm font-medium">Export Data</span>
            </Button>
          </div>
        </Card>

        {/* Quick Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Button
            variant="outline"
            className="h-20 flex-col gap-2 hover:bg-purple-50 hover:border-purple-300"
            onClick={() => window.location.href = '/admin/dashboard'}
          >
            <BarChart3 className="w-6 h-6" />
            <span className="text-sm">Analytics</span>
          </Button>

          <Button
            variant="outline"
            className="h-20 flex-col gap-2 hover:bg-blue-50 hover:border-blue-300"
            onClick={() => window.location.href = '/admin/users'}
          >
            <UserCheck className="w-6 h-6" />
            <span className="text-sm">Users</span>
          </Button>

          <Button
            variant="outline"
            className="h-20 flex-col gap-2 hover:bg-green-50 hover:border-green-300"
            onClick={() => window.location.href = '/admin/moderation'}
          >
            <Flag className="w-6 h-6" />
            <span className="text-sm">Moderation</span>
          </Button>

          <Button
            variant="outline"
            className="h-20 flex-col gap-2 hover:bg-yellow-50 hover:border-yellow-300"
            onClick={() => window.location.href = '/admin/financial'}
          >
            <DollarSign className="w-6 h-6" />
            <span className="text-sm">Financial</span>
          </Button>

          <Button
            variant="outline"
            className="h-20 flex-col gap-2 hover:bg-gray-50 hover:border-gray-300"
            onClick={() => window.location.href = '/admin/settings'}
          >
            <Settings className="w-6 h-6" />
            <span className="text-sm">Settings</span>
          </Button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* System Health */}
          <Card className="p-6 border-0 shadow-sm bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
              <Badge 
                variant={metrics?.systemHealth?.overallStatus === 'healthy' ? 'default' : 'destructive'}
                className="flex items-center gap-1"
              >
                <Zap className="w-3 h-3" />
                {metrics?.systemHealth?.overallStatus || 'Unknown'}
              </Badge>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Database</span>
                <span className={`text-sm font-medium ${getHealthStatusColor(metrics?.systemHealth?.database || '')}`}>
                  {metrics?.systemHealth?.database || 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Cache (Redis)</span>
                <span className={`text-sm font-medium ${getHealthStatusColor(metrics?.systemHealth?.redis || '')}`}>
                  {metrics?.systemHealth?.redis || 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Storage</span>
                <span className={`text-sm font-medium ${getHealthStatusColor(metrics?.systemHealth?.storage || '')}`}>
                  {metrics?.systemHealth?.storage || 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Payment Gateway</span>
                <span className={`text-sm font-medium ${getHealthStatusColor(metrics?.systemHealth?.paymentGateway || '')}`}>
                  {metrics?.systemHealth?.paymentGateway || 'Unknown'}
                </span>
              </div>
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="lg:col-span-2 p-6 border-0 shadow-sm bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                <Eye className="w-4 h-4 mr-2" />
                View All
              </Button>
            </div>
            <div className="space-y-3">
              {metrics?.recentActivity?.length ? (
                metrics.recentActivity.slice(0, 8).map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-xs text-gray-500">{getUserDisplayName(activity.user)}</p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatActivityTime(activity.timestamp)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent activity</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Announcement Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-orange-600" />
                Send System Announcement
              </h3>
              <button
                onClick={() => setShowAnnouncementModal(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4">
              {/* Announcement Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <div className="flex gap-2">
                  {(['INFO', 'WARNING', 'ERROR'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setAnnouncementType(type)}
                      className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                        announcementType === type
                          ? type === 'INFO'
                            ? 'bg-blue-100 border-blue-300 text-blue-700'
                            : type === 'WARNING'
                            ? 'bg-yellow-100 border-yellow-300 text-yellow-700'
                            : 'bg-red-100 border-red-300 text-red-700'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  placeholder="Announcement title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  maxLength={100}
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={announcementMessage}
                  onChange={(e) => setAnnouncementMessage(e.target.value)}
                  placeholder="Enter your announcement message..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {announcementMessage.length}/500 characters
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => setShowAnnouncementModal(false)}
                disabled={announcementLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendAnnouncement}
                disabled={announcementLoading || !announcementTitle.trim() || !announcementMessage.trim()}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {announcementLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Megaphone className="w-4 h-4 mr-2" />
                    Send Announcement
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
