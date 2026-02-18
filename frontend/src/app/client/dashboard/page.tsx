'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ClientNavbar } from '@/components/client/ClientNavbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  PlusCircle,
  Eye,
  MessageCircle,
  CreditCard,
  TrendingUp,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  AlertCircle,
  Briefcase,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/utils';
import SubscriptionWidget from '@/components/subscription/SubscriptionWidget';

interface Job {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  location?: {
    city?: string;
    province?: string;
  };
  createdAt: string;
  bidsCount?: number;
  images?: string[];
}

interface Bid {
  id: string;
  jobId: string;
  jobTitle?: string;
  artisanName?: string;
  artisanAvatar?: string;
  amount: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  message?: string;
  submittedAt: string;
  estimatedDays?: number;
}

interface Payment {
  id: string;
  jobId: string;
  jobTitle?: string;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  dueDate: string;
  type: 'JOB_PAYMENT' | 'PLATFORM_FEE' | 'REFUND';
}

interface Stats {
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  totalSpent: number;
}

export default function ClientDashboardPage() {
  useEffect(() => {
    document.title = 'Taska - Client Dashboard';
  }, []);

  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [recentBids, setRecentBids] = useState<Bid[]>([]);
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalJobs: 0,
    activeJobs: 0,
    completedJobs: 0,
    totalSpent: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel with proper error handling
      const [jobsRes, bidsRes, paymentsRes, allJobsRes] = await Promise.all([
        api.get('/jobs/my-jobs?limit=5').catch(() => ({ data: { jobs: [] } })),
        api.get('/bids?limit=5&status=PENDING').catch(() => ({ data: { bids: [] } })),
        api.get('/payments?status=PENDING&limit=5').catch(() => ({ data: { payments: [] } })),
        api.get('/jobs/my-jobs').catch(() => ({ data: { jobs: [] } })) // Get all jobs for stats
      ]);

      // API returns raw array for my-jobs; handle both raw array and {jobs:[]} format
      const jobsList = Array.isArray(jobsRes.data) ? jobsRes.data : (jobsRes.data.jobs || []);
      const allJobs = Array.isArray(allJobsRes.data) ? allJobsRes.data : (allJobsRes.data.jobs || []);

      setJobs(jobsList);
      setRecentBids(bidsRes.data.bids || bidsRes.data || []);
      setPendingPayments(paymentsRes.data.payments || paymentsRes.data || []);

      // Calculate stats from jobs data
      const calculatedStats = {
        totalJobs: allJobs.length,
        activeJobs: allJobs.filter((job: Job) =>
          job.status === 'OPEN' || job.status === 'IN_PROGRESS'
        ).length,
        completedJobs: allJobs.filter((job: Job) =>
          job.status === 'COMPLETED'
        ).length,
        totalSpent: allJobs
          .filter((job: Job) => job.status === 'COMPLETED')
          .reduce((sum: number, job: Job) => sum + job.budget, 0)
      };

      setStats(calculatedStats);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-green-100 text-green-800 border-green-200';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'COMPLETED': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ACCEPTED': return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50" data-testid="dashboard-loading">
        <ClientNavbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <ClientNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Welcome back!</h1>
          <p className="text-gray-600 mt-2">Here's what's happening with your jobs.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/client/jobs')} data-testid="stat-total-jobs">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2" data-testid="total-jobs-count">{stats.totalJobs}</p>
                </div>
                <div className="p-3 bg-primary-100 rounded-full">
                  <Briefcase className="w-6 h-6 text-primary-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow" data-testid="stat-active-jobs">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2" data-testid="active-jobs-count">{stats.activeJobs}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow" data-testid="stat-completed-jobs">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2" data-testid="completed-jobs-count">{stats.completedJobs}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(stats.totalSpent)}</p>
                </div>
                <div className="p-3 bg-coral-100 rounded-full">
                  <TrendingUp className="w-6 h-6 text-coral-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions and Subscription Widget */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-6 md:p-8 text-white shadow-lg">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 h-full">
              <div>
                <h2 className="text-2xl font-bold mb-2">Need something done?</h2>
                <p className="text-primary-50">Post a job and get bids from skilled artisans in minutes.</p>
              </div>
              <Button
                onClick={() => router.push('/client/jobs/create')}
                size="lg"
                className="bg-white text-black hover:bg-cream-50 shadow-md hover:shadow-lg transition-all whitespace-nowrap font-semibold"
                data-testid="post-job-button"
              >
                <PlusCircle className="w-5 h-5 mr-2" />
                Post a New Job
              </Button>
            </div>
          </div>
          <div className="lg:col-span-1">
            <SubscriptionWidget userRole="CLIENT" />
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="jobs" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="jobs" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              <span className="hidden sm:inline">Jobs</span>
            </TabsTrigger>
            <TabsTrigger value="bids" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Bids</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Payments</span>
            </TabsTrigger>
          </TabsList>

          {/* Recent Jobs Tab */}
          <TabsContent value="jobs" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Your Recent Jobs</h2>
              <Button
                variant="outline"
                onClick={() => router.push('/client/jobs')}
                className="text-primary-600 border-primary-600 hover:bg-primary-50"
              >
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {jobs.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <PlusCircle className="w-8 h-8 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs yet</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Start by posting your first job to find skilled artisans for your project.
                  </p>
                  <Button
                    onClick={() => router.push('/client/jobs/create')}
                    className="bg-primary-600 hover:bg-primary-700 text-white"
                    data-testid="post-first-job-button"
                  >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Post Your First Job
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {jobs.map((job) => (
                  <Card key={job.id} className="hover:shadow-lg transition-all cursor-pointer" onClick={() => router.push(`/client/jobs/${job.id}`)} data-testid="job-card">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row gap-4">
                        {/* Job Image or Icon */}
                        <div className="flex-shrink-0">
                          {job.images && job.images.length > 0 ? (
                            <img
                              src={job.images[0]}
                              alt={job.title}
                              className="w-full md:w-24 h-24 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-full md:w-24 h-24 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center">
                              <Briefcase className="w-8 h-8 text-primary-600" />
                            </div>
                          )}
                        </div>

                        {/* Job Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">{job.title}</h3>
                            <div className="flex gap-2 flex-shrink-0">
                              <Badge className={`${getStatusColor(job.status)} border`}>
                                {job.status.replace('_', ' ')}
                              </Badge>
                              <Badge className={`${getUrgencyColor(job.urgency)} border`}>
                                {job.urgency}
                              </Badge>
                            </div>
                          </div>

                          <p className="text-gray-600 mb-3 line-clamp-2">{job.description}</p>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 mb-3">
                            {job.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {job.location.city || 'Unknown City'}, {job.location.province || 'Unknown Province'}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatRelativeTime(job.createdAt)}
                            </span>
                            <span className="font-medium text-primary-600">
                              {formatCurrency(job.budget)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 text-sm">
                                <Users className="w-4 h-4 text-gray-500" />
                                <span className="font-medium text-gray-900">{job.bidsCount || 0}</span>
                                <span className="text-gray-600">bids</span>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/client/jobs/${job.id}`);
                                }}
                                className="text-primary-600 border-primary-600 hover:bg-primary-50"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              {(job.bidsCount || 0) > 0 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/client/jobs/${job.id}#bids`);
                                  }}
                                  className="text-coral-600 border-coral-600 hover:bg-coral-50"
                                >
                                  <Users className="w-4 h-4 mr-1" />
                                  {job.bidsCount}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Recent Bids Tab */}
          <TabsContent value="bids" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Recent Bids</h2>
              <Button
                variant="outline"
                onClick={() => router.push('/client/bids')}
                className="text-primary-600 border-primary-600 hover:bg-primary-50"
              >
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {recentBids.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No bids yet</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Bids from artisans will appear here when they apply to your jobs.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {recentBids.map((bid) => (
                  <Card key={bid.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                          {(bid.artisanAvatar || (bid as any).artisan?.profile?.profileImage) ? (
                            <img src={bid.artisanAvatar || (bid as any).artisan?.profile?.profileImage} alt={bid.artisanName || (bid as any).artisan?.profile?.firstName || 'Artisan'} className="w-12 h-12 rounded-full object-cover" />
                          ) : (
                            <span className="text-primary-600 font-medium">
                              {(bid.artisanName || `${(bid as any).artisan?.profile?.firstName || ''} ${(bid as any).artisan?.profile?.lastName || ''}`.trim())?.split(' ').map((n: string) => n[0]).join('') || '??'}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-900">{bid.jobTitle || (bid as any).job?.title || 'Untitled Job'}</h3>
                              <p className="text-sm text-gray-600">by {bid.artisanName || (bid as any).artisan?.profile?.firstName || 'Unknown Artisan'}</p>
                            </div>
                            <Badge className={`${getStatusColor(bid.status)} border flex-shrink-0`}>
                              {bid.status}
                            </Badge>
                          </div>

                          <p className="text-gray-700 mb-3 line-clamp-2">{bid.message || 'No message provided'}</p>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 mb-3">
                            <span className="font-semibold text-primary-600">
                              {formatCurrency(bid.amount)}
                            </span>
                            <span>{bid.estimatedDays || 0} days</span>
                            <span>{formatRelativeTime(bid.submittedAt)}</span>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => router.push(`/client/jobs/${bid.jobId}#bid-${bid.id}`)}
                              className="bg-primary-600 hover:bg-primary-700 text-white"
                            >
                              View Details
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/client/messages?job=${bid.jobId}`)}
                              className="text-coral-600 border-coral-600 hover:bg-coral-50"
                            >
                              <MessageCircle className="w-4 h-4 mr-1" />
                              Message
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Pending Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Pending Payments</h2>
              <Button
                variant="outline"
                onClick={() => router.push('/client/payments')}
                className="text-primary-600 border-primary-600 hover:bg-primary-50"
              >
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {pendingPayments.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No pending payments</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Your payment history and pending transactions will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {pendingPayments.map((payment) => (
                  <Card key={payment.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{payment.jobTitle || 'Untitled Job'}</h3>
                            <Badge className={`${getStatusColor(payment.status)} border flex-shrink-0`}>
                              {payment.status}
                            </Badge>
                          </div>

                          <p className="text-sm text-gray-600 mb-3">
                            Payment Type: {payment.type.replace('_', ' ')}
                          </p>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 mb-4">
                            <span className="text-xl font-bold text-gray-900">
                              {formatCurrency(payment.amount)}
                            </span>
                            <span className="flex items-center gap-1">
                              <AlertCircle className="w-4 h-4 text-amber-500" />
                              Due: {formatDate(payment.dueDate)}
                            </span>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => router.push(`/client/payments/${payment.id}`)}
                              className="bg-primary-600 hover:bg-primary-700 text-white"
                            >
                              <CreditCard className="w-4 h-4 mr-1" />
                              Pay Now
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/client/jobs/${payment.jobId}`)}
                              className="text-gray-600 border-gray-600 hover:bg-gray-50"
                            >
                              View Job
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
