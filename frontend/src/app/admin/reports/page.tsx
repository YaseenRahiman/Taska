'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import {
  FileText,
  Plus,
  Search,
  RefreshCw,
  Play,
  Download,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  Users,
  Briefcase,
  CreditCard,
  Star,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  X,
  Filter,
} from 'lucide-react';

interface ReportConfig {
  dataSource: string;
  metrics: { type: string; field: string; label?: string }[];
  filters?: { field?: string; operator?: string; value?: any }[];
  groupBy?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: string;
  limit?: number;
}

interface Report {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  config: ReportConfig;
  schedule?: {
    frequency: string;
    recipients: string[];
    format: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
    hour?: number;
  };
  lastRun?: string;
  nextRun?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    name: string;
    email: string;
  };
}

interface ReportExecution {
  id: string;
  reportId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  format: string;
  fileUrl?: string;
  fileSizeMb?: number;
  rowCount?: number;
  errorMessage?: string;
  startedAt: string;
  completedAt?: string;
  report?: {
    id: string;
    name: string;
  };
}

const DATA_SOURCES = [
  { value: 'USERS', label: 'Users', icon: Users },
  { value: 'JOBS', label: 'Jobs', icon: Briefcase },
  { value: 'PAYMENTS', label: 'Payments', icon: CreditCard },
  { value: 'REVIEWS', label: 'Reviews', icon: Star },
  { value: 'BIDS', label: 'Bids', icon: BarChart3 },
  { value: 'MESSAGES', label: 'Messages', icon: MessageSquare },
];

const METRICS = [
  { value: 'COUNT', label: 'Count' },
  { value: 'SUM', label: 'Sum' },
  { value: 'AVERAGE', label: 'Average' },
  { value: 'MIN', label: 'Minimum' },
  { value: 'MAX', label: 'Maximum' },
];

const GROUP_BY_OPTIONS = [
  { value: 'NONE', label: 'None' },
  { value: 'DAY', label: 'Day' },
  { value: 'WEEK', label: 'Week' },
  { value: 'MONTH', label: 'Month' },
  { value: 'QUARTER', label: 'Quarter' },
  { value: 'YEAR', label: 'Year' },
  { value: 'STATUS', label: 'Status' },
  { value: 'CATEGORY', label: 'Category' },
];

const FORMAT_OPTIONS = [
  { value: 'PDF', label: 'PDF' },
  { value: 'CSV', label: 'CSV' },
  { value: 'EXCEL', label: 'Excel' },
  { value: 'JSON', label: 'JSON' },
];

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [executions, setExecutions] = useState<ReportExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'reports' | 'history'>('reports');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [generatingReportId, setGeneratingReportId] = useState<string | null>(null);

  // Form state for creating/editing reports
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dataSource: 'USERS',
    metricType: 'COUNT',
    metricField: 'id',
    groupBy: 'NONE',
    startDate: '',
    endDate: '',
    isActive: true,
  });

  const [generateFormat, setGenerateFormat] = useState('PDF');

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());
      if (searchQuery) params.append('search', searchQuery);

      const response = await api.get(`/admin/reports?${params.toString()}`);
      setReports(response.data.reports || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0,
        totalPages: response.data.totalPages || 0,
      }));
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch reports:', err);
      setError(err.response?.data?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchQuery]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleCreateReport = async () => {
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        config: {
          dataSource: formData.dataSource,
          metrics: [
            {
              type: formData.metricType,
              field: formData.metricField,
              label: `${formData.metricType} of ${formData.metricField}`,
            },
          ],
          groupBy: formData.groupBy,
          startDate: formData.startDate || undefined,
          endDate: formData.endDate || undefined,
        },
        isActive: formData.isActive,
      };

      await api.post('/admin/reports', payload);
      setShowCreateModal(false);
      resetForm();
      fetchReports();
    } catch (err: any) {
      console.error('Failed to create report:', err);
      alert(err.response?.data?.message || 'Failed to create report');
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedReport) return;

    try {
      setGeneratingReportId(selectedReport.id);
      await api.post(`/admin/reports/${selectedReport.id}/generate`, {
        format: generateFormat,
      });
      setShowGenerateModal(false);
      setSelectedReport(null);
      alert('Report generation started. Check the history tab for status.');
      fetchReports();
    } catch (err: any) {
      console.error('Failed to generate report:', err);
      alert(err.response?.data?.message || 'Failed to generate report');
    } finally {
      setGeneratingReportId(null);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      await api.delete(`/admin/reports/${reportId}`);
      fetchReports();
    } catch (err: any) {
      console.error('Failed to delete report:', err);
      alert(err.response?.data?.message || 'Failed to delete report');
    }
  };

  const handleDownloadReport = async (executionId: string, filename: string) => {
    try {
      const response = await api.get(`/admin/reports/executions/${executionId}/download`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Failed to download report:', err);
      alert('Failed to download report');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      dataSource: 'USERS',
      metricType: 'COUNT',
      metricField: 'id',
      groupBy: 'NONE',
      startDate: '',
      endDate: '',
      isActive: true,
    });
  };

  const getDataSourceIcon = (dataSource: string) => {
    const source = DATA_SOURCES.find(s => s.value === dataSource);
    if (!source) return <FileText className="w-4 h-4" />;
    const Icon = source.icon;
    return <Icon className="w-4 h-4" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'RUNNING':
        return <Badge className="bg-blue-100 text-blue-800"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Running</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'FAILED':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
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

  const filteredReports = reports.filter(report => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      report.name.toLowerCase().includes(query) ||
      (report.description && report.description.toLowerCase().includes(query)) ||
      report.config.dataSource.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-8 h-8" />
              Reports
            </h1>
            <p className="text-gray-600 mt-1">
              Create, manage, and generate platform reports
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={fetchReports}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Report
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('reports')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'reports'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Report Templates ({reports.length})
                </div>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Generation History
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Search */}
        <Card className="p-4 mb-6 border-0 shadow-sm bg-white">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </Card>

        {activeTab === 'reports' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="p-6 border-0 shadow-sm bg-white animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </Card>
              ))
            ) : error ? (
              <div className="col-span-full">
                <Card className="p-12 text-center border-0 shadow-sm bg-white">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                  <p className="text-red-600">{error}</p>
                  <Button onClick={fetchReports} className="mt-4">Retry</Button>
                </Card>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="col-span-full">
                <Card className="p-12 text-center border-0 shadow-sm bg-white">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">No reports found</p>
                  <Button onClick={() => setShowCreateModal(true)} className="mt-4">
                    Create Your First Report
                  </Button>
                </Card>
              </div>
            ) : (
              filteredReports.map((report) => (
                <Card key={report.id} className="p-6 border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        {getDataSourceIcon(report.config.dataSource)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{report.name}</h3>
                        <Badge className={report.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {report.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {report.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{report.description}</p>
                  )}

                  <div className="space-y-2 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      <span>Source: {report.config.dataSource}</span>
                    </div>
                    {report.lastRun && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>Last run: {formatDate(report.lastRun)}</span>
                      </div>
                    )}
                    {report.schedule && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Schedule: {report.schedule.frequency}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedReport(report);
                        setShowGenerateModal(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-1"
                    >
                      <Play className="w-4 h-4" />
                      Generate
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteReport(report.id)}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <Card className="border-0 shadow-sm bg-white">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Generations</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-500 text-center py-8">
                Report generation history will appear here after generating reports.
              </p>
            </div>
          </Card>
        )}

        {/* Create Report Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Create New Report</h3>
                <Button variant="ghost" size="sm" onClick={() => { setShowCreateModal(false); resetForm(); }}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Report Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Monthly Revenue Report"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of this report..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Source *</label>
                    <select
                      value={formData.dataSource}
                      onChange={(e) => setFormData({ ...formData, dataSource: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {DATA_SOURCES.map(source => (
                        <option key={source.value} value={source.value}>{source.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Metric Type</label>
                    <select
                      value={formData.metricType}
                      onChange={(e) => setFormData({ ...formData, metricType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {METRICS.map(metric => (
                        <option key={metric.value} value={metric.value}>{metric.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Metric Field</label>
                    <input
                      type="text"
                      value={formData.metricField}
                      onChange={(e) => setFormData({ ...formData, metricField: e.target.value })}
                      placeholder="e.g., amount, id"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Group By</label>
                    <select
                      value={formData.groupBy}
                      onChange={(e) => setFormData({ ...formData, groupBy: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {GROUP_BY_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700">Report is active</label>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <Button variant="outline" onClick={() => { setShowCreateModal(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button onClick={handleCreateReport} disabled={!formData.name}>
                  Create Report
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Generate Report Modal */}
        {showGenerateModal && selectedReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md bg-white">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Generate Report</h3>
                <Button variant="ghost" size="sm" onClick={() => { setShowGenerateModal(false); setSelectedReport(null); }}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium text-gray-900">{selectedReport.name}</p>
                  <p className="text-sm text-gray-500">{selectedReport.description || 'No description'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Output Format</label>
                  <select
                    value={generateFormat}
                    onChange={(e) => setGenerateFormat(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {FORMAT_OPTIONS.map(format => (
                      <option key={format.value} value={format.value}>{format.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <Button variant="outline" onClick={() => { setShowGenerateModal(false); setSelectedReport(null); }}>
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerateReport}
                  disabled={generatingReportId === selectedReport.id}
                  className="flex items-center gap-2"
                >
                  {generatingReportId === selectedReport.id ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  Generate
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && activeTab === 'reports' && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} reports
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
      </div>
    </div>
  );
}
