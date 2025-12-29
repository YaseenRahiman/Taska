'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import {
  Flag,
  AlertTriangle,
  Eye,
  Check,
  X,
  MessageSquare,
  Briefcase,
  Star,
  Clock,
  User,
  Calendar,
  DollarSign,
  FileText,
  Search,
  Filter,
  RefreshCw,
  Download
} from 'lucide-react';

interface ReportedContent {
  id: string;
  contentId: string;
  contentType: 'JOB' | 'MESSAGE' | 'REVIEW';
  reportedBy: {
    id: string;
    email: string;
    profile: {
      firstName: string;
      lastName: string;
    };
  };
  reportedUser: {
    id: string;
    email: string;
    profile: {
      firstName: string;
      lastName: string;
    };
  };
  reason: string;
  description: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  content: {
    title?: string;
    description?: string;
    message?: string;
    rating?: number;
  };
}

interface Dispute {
  id: string;
  jobId: string;
  clientId: string;
  artisanId: string;
  type: 'PAYMENT' | 'QUALITY' | 'CANCELLATION' | 'OTHER';
  description: string;
  status: 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'ESCALATED';
  amount: number;
  createdAt: string;
  job: {
    title: string;
    budget: number;
  };
  client: {
    email: string;
    profile: {
      firstName: string;
      lastName: string;
    };
  };
  artisan: {
    email: string;
    profile: {
      firstName: string;
      lastName: string;
    };
  };
}

interface ContentFilters {
  contentType?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  skip?: number;
  take?: number;
}

const ContentModeration: React.FC = () => {
  const [activeTab, setActiveTab] = useState('reports');
  const [reportedContent, setReportedContent] = useState<ReportedContent[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ContentFilters>({ take: 20, skip: 0 });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ReportedContent | null>(null);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);

  const fetchModerationData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const response = await api.get(`/admin/moderation?${queryParams}`);
      setReportedContent(response.data.reportedJobs.concat(
        response.data.reportedMessages,
        response.data.flaggedReviews
      ));
      setDisputes(response.data.pendingDisputes || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load moderation data');
      console.error('Moderation data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModerationData();
  }, [filters]);

  const handleModerationAction = async (
    contentId: string, 
    contentType: string, 
    action: 'APPROVE' | 'REJECT',
    reason?: string
  ) => {
    try {
      setActionLoading(`${action}_${contentId}`);
      
      await api.post('/admin/moderation/content', {
        contentId,
        contentType,
        action,
        reason: reason || `Content ${action.toLowerCase()}ed by admin`
      });

      // Refresh data
      await fetchModerationData();
      
      alert(`Content ${action.toLowerCase()}ed successfully`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Moderation action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisputeResolution = async (
    disputeId: string,
    resolution: string,
    refundAmount?: number
  ) => {
    try {
      setActionLoading(`resolve_${disputeId}`);
      
      await api.post(`/admin/moderation/disputes/${disputeId}/resolve`, {
        resolution,
        refundAmount
      });

      // Refresh data
      await fetchModerationData();
      
      alert('Dispute resolved successfully');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Dispute resolution failed');
    } finally {
      setActionLoading(null);
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'JOB': return <Briefcase className="w-4 h-4" />;
      case 'MESSAGE': return <MessageSquare className="w-4 h-4" />;
      case 'REVIEW': return <Star className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'INVESTIGATING': return 'bg-blue-100 text-blue-800';
      case 'RESOLVED': return 'bg-green-100 text-green-800';
      case 'ESCALATED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDisputeTypeColor = (type: string) => {
    switch (type) {
      case 'PAYMENT': return 'bg-red-100 text-red-800';
      case 'QUALITY': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLATION': return 'bg-blue-100 text-blue-800';
      case 'OTHER': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (loading && reportedContent.length === 0 && disputes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="bg-white rounded-lg p-6">
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded"></div>
                ))}
              </div>
            </div>
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
            <h1 className="text-3xl font-bold text-gray-900">Content Moderation</h1>
            <p className="text-gray-600 mt-1">
              Review reported content and resolve disputes
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>
            <Button
              variant="outline"
              onClick={fetchModerationData}
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

        {/* Filters Panel */}
        {showFilters && (
          <Card className="p-4 mb-6 border-0 shadow-sm bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
                <select
                  value={filters.contentType || ''}
                  onChange={(e) => setFilters({ ...filters, contentType: e.target.value || undefined, skip: 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="JOB">Jobs</option>
                  <option value="MESSAGE">Messages</option>
                  <option value="REVIEW">Reviews</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined, skip: 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={filters.dateFrom || ''}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value || undefined, skip: 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="date"
                    value={filters.dateTo || ''}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value || undefined, skip: 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </Card>
        )}

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
                  <Flag className="w-4 h-4" />
                  Reported Content ({reportedContent.filter(c => c.status === 'PENDING').length})
                </div>
              </button>
              <button
                onClick={() => setActiveTab('disputes')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'disputes'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Disputes ({disputes.filter(d => d.status === 'PENDING').length})
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'reports' && (
          <Card className="border-0 shadow-sm bg-white">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Reported Content ({reportedContent.length})
              </h2>
            </div>

            <div className="divide-y divide-gray-200">
              {reportedContent.map((report) => (
                <div key={report.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          {getContentTypeIcon(report.contentType)}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {report.content?.title || report.content?.message || 'Review Content'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Reported by {report.reportedBy.profile.firstName} {report.reportedBy.profile.lastName}
                          </p>
                        </div>
                        <Badge className={`${getStatusColor(report.status)} flex items-center gap-1`}>
                          <Clock className="w-3 h-3" />
                          {report.status}
                        </Badge>
                      </div>

                      <div className="ml-11">
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            Against: {report.reportedUser.profile.firstName} {report.reportedUser.profile.lastName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(report.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                          <p className="text-sm font-medium text-gray-900 mb-1">Reason: {report.reason}</p>
                          {report.description && (
                            <p className="text-sm text-gray-600">{report.description}</p>
                          )}
                        </div>

                        {report.content?.description && (
                          <div className="bg-blue-50 rounded-lg p-3">
                            <p className="text-sm text-gray-700">{report.content.description}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {report.status === 'PENDING' && (
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedContent(report)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const reason = prompt('Enter approval reason (optional):');
                            handleModerationAction(report.contentId, report.contentType, 'APPROVE', reason || undefined);
                          }}
                          disabled={actionLoading === `APPROVE_${report.contentId}`}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const reason = prompt('Enter rejection reason:');
                            if (reason) {
                              handleModerationAction(report.contentId, report.contentType, 'REJECT', reason);
                            }
                          }}
                          disabled={actionLoading === `REJECT_${report.contentId}`}
                          className="text-red-600 hover:text-red-900"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {reportedContent.length === 0 && (
                <div className="p-12 text-center text-gray-500">
                  <Flag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No reported content found</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {activeTab === 'disputes' && (
          <Card className="border-0 shadow-sm bg-white">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Disputes ({disputes.length})
              </h2>
            </div>

            <div className="divide-y divide-gray-200">
              {disputes.map((dispute) => (
                <div key={dispute.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{dispute.job.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>Client: {dispute.client.profile.firstName} {dispute.client.profile.lastName}</span>
                            <span>Artisan: {dispute.artisan.profile.firstName} {dispute.artisan.profile.lastName}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${getDisputeTypeColor(dispute.type)}`}>
                            {dispute.type}
                          </Badge>
                          <Badge className={`${getStatusColor(dispute.status)}`}>
                            {dispute.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="ml-11">
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            Dispute Amount: {formatCurrency(dispute.amount)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            Job Budget: {formatCurrency(dispute.job.budget)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(dispute.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm text-gray-700">{dispute.description}</p>
                        </div>
                      </div>
                    </div>

                    {dispute.status === 'PENDING' && (
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedDispute(dispute)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const resolution = prompt('Enter resolution details:');
                            if (resolution) {
                              const refundAmountStr = prompt('Enter refund amount (leave empty for no refund):');
                              const refundAmount = refundAmountStr ? parseFloat(refundAmountStr) : undefined;
                              handleDisputeResolution(dispute.id, resolution, refundAmount);
                            }
                          }}
                          disabled={actionLoading === `resolve_${dispute.id}`}
                          className="text-green-600 hover:text-green-900"
                        >
                          Resolve
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {disputes.length === 0 && (
                <div className="p-12 text-center text-gray-500">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No disputes found</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Content Detail Modal */}
        {selectedContent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-white">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Content Details</h3>
                <Button variant="ghost" onClick={() => setSelectedContent(null)}>
                  ×
                </Button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    {selectedContent.content?.title || 'Content Preview'}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {selectedContent.content?.description || selectedContent.content?.message}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Type:</span> {selectedContent.contentType}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> {selectedContent.status}
                  </div>
                  <div>
                    <span className="font-medium">Reported by:</span> {selectedContent.reportedBy.email}
                  </div>
                  <div>
                    <span className="font-medium">Reported user:</span> {selectedContent.reportedUser.email}
                  </div>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Report reason:</span> {selectedContent.reason}
                </div>
                {selectedContent.description && (
                  <div className="text-sm">
                    <span className="font-medium">Description:</span> {selectedContent.description}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Dispute Detail Modal */}
        {selectedDispute && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-white">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Dispute Details</h3>
                <Button variant="ghost" onClick={() => setSelectedDispute(null)}>
                  ×
                </Button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">{selectedDispute.job.title}</h4>
                  <p className="text-sm text-gray-500">Job ID: {selectedDispute.jobId}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Type:</span> {selectedDispute.type}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> {selectedDispute.status}
                  </div>
                  <div>
                    <span className="font-medium">Dispute Amount:</span> {formatCurrency(selectedDispute.amount)}
                  </div>
                  <div>
                    <span className="font-medium">Job Budget:</span> {formatCurrency(selectedDispute.job.budget)}
                  </div>
                  <div>
                    <span className="font-medium">Client:</span> {selectedDispute.client.email}
                  </div>
                  <div>
                    <span className="font-medium">Artisan:</span> {selectedDispute.artisan.email}
                  </div>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Description:</span>
                  <p className="mt-1 text-gray-600">{selectedDispute.description}</p>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Created:</span> {new Date(selectedDispute.createdAt).toLocaleString()}
                </div>
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

export default ContentModeration;
