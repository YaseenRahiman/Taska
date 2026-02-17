'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import {
  Activity,
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  User,
  Settings,
  Shield,
  FileText,
  Clock,
  Calendar,
  AlertTriangle,
  Eye,
  X,
} from 'lucide-react';

interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeState?: any;
  afterState?: any;
  reason?: string;
  ipAddress: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  createdAt: string;
}

interface AuditStatistics {
  totalLogs: number;
  successRate: number;
  topActions: { action: string; count: number }[];
  topAdmins: { adminId: string; adminName: string; count: number }[];
  actionsOverTime: { date: string; count: number }[];
}

interface Filters {
  adminId?: string;
  action?: string;
  entityType?: string;
  success?: boolean;
  startDate?: string;
  endDate?: string;
}

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [statistics, setStatistics] = useState<AuditStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [activeTab, setActiveTab] = useState<'logs' | 'statistics'>('logs');

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      if (filters.adminId) params.append('adminId', filters.adminId);
      if (filters.action) params.append('action', filters.action);
      if (filters.entityType) params.append('entityType', filters.entityType);
      if (filters.success !== undefined) params.append('success', filters.success.toString());
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await api.get(`/admin/logs/audit?${params.toString()}`);
      setLogs(response.data.logs || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0,
        totalPages: response.data.totalPages || 0,
      }));
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch activity logs:', err);
      setError(err.response?.data?.message || 'Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  const fetchStatistics = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await api.get(`/admin/logs/statistics?${params.toString()}`);
      setStatistics(response.data);
    } catch (err: any) {
      console.error('Failed to fetch statistics:', err);
    }
  }, [filters.startDate, filters.endDate]);

  useEffect(() => {
    fetchLogs();
    fetchStatistics();
  }, [fetchLogs, fetchStatistics]);

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const params = new URLSearchParams();
      params.append('format', format);
      if (filters.adminId) params.append('adminId', filters.adminId);
      if (filters.action) params.append('action', filters.action);
      if (filters.entityType) params.append('entityType', filters.entityType);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await api.get(`/admin/logs/export?${params.toString()}`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], {
        type: format === 'csv' ? 'text/csv' : 'application/json',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Failed to export logs:', err);
      alert('Failed to export logs');
    }
  };

  const clearFilters = () => {
    setFilters({});
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getActionIcon = (action: string) => {
    if (action.includes('USER') || action.includes('ADMIN')) return <User className="w-4 h-4" />;
    if (action.includes('SETTING') || action.includes('CONFIG')) return <Settings className="w-4 h-4" />;
    if (action.includes('BAN') || action.includes('SUSPEND') || action.includes('SECURITY')) return <Shield className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const getEntityTypeColor = (type: string) => {
    switch (type) {
      case 'USER': return 'bg-blue-100 text-blue-800';
      case 'JOB': return 'bg-green-100 text-green-800';
      case 'PAYMENT': return 'bg-purple-100 text-purple-800';
      case 'SETTINGS': return 'bg-yellow-100 text-yellow-800';
      case 'REVIEW': return 'bg-orange-100 text-orange-800';
      case 'SYSTEM': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(query) ||
      log.entityType.toLowerCase().includes(query) ||
      log.entityId.toLowerCase().includes(query) ||
      log.adminName.toLowerCase().includes(query) ||
      (log.reason && log.reason.toLowerCase().includes(query))
    );
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-8 h-8" />
              Activity Logs
            </h1>
            <p className="text-gray-600 mt-1">
              Monitor system activity and admin actions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => { fetchLogs(); fetchStatistics(); }}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <div className="relative">
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => handleExport('csv')}
              >
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 border-0 shadow-sm bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Events</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.totalLogs.toLocaleString()}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </Card>
            <Card className="p-4 border-0 shadow-sm bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-green-600">{statistics.successRate.toFixed(1)}%</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </Card>
            <Card className="p-4 border-0 shadow-sm bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Top Action</p>
                  <p className="text-lg font-bold text-gray-900 truncate max-w-[150px]">
                    {statistics.topActions[0]?.action || 'N/A'}
                  </p>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </Card>
            <Card className="p-4 border-0 shadow-sm bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Admins</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.topAdmins.length}</p>
                </div>
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('logs')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'logs'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Activity Logs
                </div>
              </button>
              <button
                onClick={() => setActiveTab('statistics')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'statistics'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Statistics
                </div>
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'logs' && (
          <>
            {/* Search and Filters */}
            <Card className="p-4 mb-6 border-0 shadow-sm bg-white">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[200px] relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by action, entity, admin..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                  {Object.keys(filters).length > 0 && (
                    <Badge className="bg-blue-100 text-blue-800 ml-1">
                      {Object.keys(filters).length}
                    </Badge>
                  )}
                </Button>
                {Object.keys(filters).length > 0 && (
                  <Button variant="ghost" onClick={clearFilters} className="text-gray-500">
                    Clear Filters
                  </Button>
                )}
              </div>

              {/* Filter Panel */}
              {showFilters && (
                <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
                    <select
                      value={filters.entityType || ''}
                      onChange={(e) => setFilters({ ...filters, entityType: e.target.value || undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Types</option>
                      <option value="USER">User</option>
                      <option value="JOB">Job</option>
                      <option value="PAYMENT">Payment</option>
                      <option value="REVIEW">Review</option>
                      <option value="SETTINGS">Settings</option>
                      <option value="SYSTEM">System</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={filters.success === undefined ? '' : filters.success.toString()}
                      onChange={(e) => setFilters({ ...filters, success: e.target.value === '' ? undefined : e.target.value === 'true' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Statuses</option>
                      <option value="true">Success</option>
                      <option value="false">Failed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={filters.startDate || ''}
                      onChange={(e) => setFilters({ ...filters, startDate: e.target.value || undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={filters.endDate || ''}
                      onChange={(e) => setFilters({ ...filters, endDate: e.target.value || undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={() => { setPagination(prev => ({ ...prev, page: 1 })); fetchLogs(); }}>
                      Apply Filters
                    </Button>
                  </div>
                </div>
              )}
            </Card>

            {/* Logs Table */}
            <Card className="border-0 shadow-sm bg-white overflow-hidden">
              {loading ? (
                <div className="p-12 text-center">
                  <RefreshCw className="w-8 h-8 mx-auto mb-4 text-blue-500 animate-spin" />
                  <p className="text-gray-500">Loading activity logs...</p>
                </div>
              ) : error ? (
                <div className="p-12 text-center">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-4 text-red-500" />
                  <p className="text-red-600">{error}</p>
                  <Button onClick={fetchLogs} className="mt-4">Retry</Button>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="p-12 text-center">
                  <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">No activity logs found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Timestamp
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Admin
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Entity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              {formatDate(log.createdAt)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-gray-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{log.adminName}</p>
                                <p className="text-xs text-gray-500">{log.ipAddress}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {getActionIcon(log.action)}
                              <span className="text-sm text-gray-900">{log.action}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={getEntityTypeColor(log.entityType)}>
                              {log.entityType}
                            </Badge>
                            <span className="ml-2 text-xs text-gray-500">{log.entityId.slice(0, 8)}...</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {log.success ? (
                              <Badge className="bg-green-100 text-green-800 flex items-center gap-1 w-fit">
                                <CheckCircle className="w-3 h-3" />
                                Success
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800 flex items-center gap-1 w-fit">
                                <XCircle className="w-3 h-3" />
                                Failed
                              </Badge>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedLog(log)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <p className="text-sm text-gray-700">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} results
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-gray-700">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </>
        )}

        {activeTab === 'statistics' && statistics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Actions */}
            <Card className="p-6 border-0 shadow-sm bg-white">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Actions</h3>
              <div className="space-y-3">
                {statistics.topActions.slice(0, 10).map((item, index) => (
                  <div key={item.action} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center font-medium">
                        {index + 1}
                      </span>
                      <span className="text-sm text-gray-900">{item.action}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-600">{item.count}</span>
                  </div>
                ))}
                {statistics.topActions.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No data available</p>
                )}
              </div>
            </Card>

            {/* Top Admins */}
            <Card className="p-6 border-0 shadow-sm bg-white">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Active Admins</h3>
              <div className="space-y-3">
                {statistics.topAdmins.slice(0, 10).map((admin, index) => (
                  <div key={admin.adminId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs flex items-center justify-center font-medium">
                        {index + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="text-sm text-gray-900">{admin.adminName || 'Unknown'}</span>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-600">{admin.count} actions</span>
                  </div>
                ))}
                {statistics.topAdmins.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No data available</p>
                )}
              </div>
            </Card>

            {/* Activity Over Time */}
            <Card className="p-6 border-0 shadow-sm bg-white lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Over Time</h3>
              <div className="space-y-2">
                {statistics.actionsOverTime.slice(-14).map((item) => (
                  <div key={item.date} className="flex items-center gap-4">
                    <span className="text-sm text-gray-600 w-24">{item.date}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                      <div
                        className="bg-blue-500 h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min((item.count / Math.max(...statistics.actionsOverTime.map(a => a.count))) * 100, 100)}%`
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-12 text-right">{item.count}</span>
                  </div>
                ))}
                {statistics.actionsOverTime.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No data available</p>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Detail Modal */}
        {selectedLog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-white">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Activity Log Details</h3>
                <Button variant="ghost" size="sm" onClick={() => setSelectedLog(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">ID</label>
                    <p className="text-sm text-gray-900">{selectedLog.id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Timestamp</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedLog.createdAt)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Admin</label>
                    <p className="text-sm text-gray-900">{selectedLog.adminName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">IP Address</label>
                    <p className="text-sm text-gray-900">{selectedLog.ipAddress}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Action</label>
                    <p className="text-sm text-gray-900">{selectedLog.action}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Status</label>
                    <Badge className={selectedLog.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {selectedLog.success ? 'Success' : 'Failed'}
                    </Badge>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Entity Type</label>
                    <Badge className={getEntityTypeColor(selectedLog.entityType)}>{selectedLog.entityType}</Badge>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Entity ID</label>
                    <p className="text-sm text-gray-900 font-mono">{selectedLog.entityId}</p>
                  </div>
                </div>

                {selectedLog.reason && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Reason</label>
                    <p className="text-sm text-gray-900">{selectedLog.reason}</p>
                  </div>
                )}

                {selectedLog.errorMessage && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Error Message</label>
                    <p className="text-sm text-red-600">{selectedLog.errorMessage}</p>
                  </div>
                )}

                {selectedLog.userAgent && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">User Agent</label>
                    <p className="text-sm text-gray-900 break-all">{selectedLog.userAgent}</p>
                  </div>
                )}

                {selectedLog.beforeState && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Before State</label>
                    <pre className="text-xs bg-gray-50 p-3 rounded-lg overflow-x-auto">
                      {JSON.stringify(selectedLog.beforeState, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.afterState && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">After State</label>
                    <pre className="text-xs bg-gray-50 p-3 rounded-lg overflow-x-auto">
                      {JSON.stringify(selectedLog.afterState, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
