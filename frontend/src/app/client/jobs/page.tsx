'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ClientNavbar } from '@/components/client/ClientNavbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Briefcase,
  Clock,
  MapPin,
  DollarSign,
  Plus,
  Eye,
  Edit,
  Trash2,
  Users,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Job {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  status: 'DRAFT' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  location: {
    city: string;
    province: string;
  };
  createdAt: string;
  updatedAt: string;
  _count?: {
    bids: number;
  };
}

const STATUS_CONFIG = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: Edit },
  OPEN: { label: 'Open', color: 'bg-blue-100 text-blue-800', icon: Clock },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800', icon: Loader2 },
  COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle }
};

const URGENCY_CONFIG = {
  LOW: { label: 'No Rush', color: 'bg-green-100 text-green-800' },
  MEDIUM: { label: 'Soon', color: 'bg-yellow-100 text-yellow-800' },
  HIGH: { label: 'Urgent', color: 'bg-red-100 text-red-800' }
};

export default function MyJobsPage() {
  useEffect(() => {
    document.title = 'Taska - My Jobs';
  }, []);

  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | Job['status']>('ALL');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/jobs/my-jobs');
      setJobs(response.data);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredJobs = filter === 'ALL'
    ? jobs
    : jobs.filter(job => job.status === filter);

  const stats = {
    total: jobs.length,
    open: jobs.filter(j => j.status === 'OPEN').length,
    inProgress: jobs.filter(j => j.status === 'IN_PROGRESS').length,
    completed: jobs.filter(j => j.status === 'COMPLETED').length
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-turquoise-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <ClientNavbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Jobs</h1>
            <p className="text-gray-600 mt-1">Manage all your job postings</p>
          </div>
          <Button
            onClick={() => router.push('/client/jobs/create')}
            className="bg-turquoise-600 hover:bg-turquoise-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Post New Job
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Briefcase className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Open</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
                </div>
                <Clock className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
                </div>
                <Loader2 className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <Button
            variant={filter === 'ALL' ? 'default' : 'outline'}
            onClick={() => setFilter('ALL')}
            size="sm"
            className={filter === 'ALL' ? 'bg-turquoise-600' : ''}
          >
            All Jobs
          </Button>
          {Object.keys(STATUS_CONFIG).map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              onClick={() => setFilter(status as Job['status'])}
              size="sm"
              className={filter === status ? 'bg-turquoise-600' : ''}
            >
              {STATUS_CONFIG[status as Job['status']].label}
            </Button>
          ))}
        </div>

        {/* Jobs List */}
        {filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filter === 'ALL' ? 'No jobs yet' : `No ${STATUS_CONFIG[filter as Job['status']].label.toLowerCase()} jobs`}
              </h3>
              <p className="text-gray-600 mb-6">
                {filter === 'ALL'
                  ? 'Start by posting your first job to find skilled artisans for your project.'
                  : `You don't have any ${STATUS_CONFIG[filter as Job['status']].label.toLowerCase()} jobs at the moment.`
                }
              </p>
              {filter === 'ALL' && (
                <Button
                  onClick={() => router.push('/client/jobs/create')}
                  className="bg-turquoise-600 hover:bg-turquoise-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Post Your First Job
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => {
              const StatusIcon = STATUS_CONFIG[job.status].icon;

              return (
                <Card key={job.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start gap-4 mb-3">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                              {job.title}
                            </h3>
                            <p className="text-gray-600 line-clamp-2 mb-3">
                              {job.description}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Badge className={STATUS_CONFIG[job.status].color}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {STATUS_CONFIG[job.status].label}
                            </Badge>
                            <Badge className={URGENCY_CONFIG[job.urgency].color}>
                              {URGENCY_CONFIG[job.urgency].label}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            <span>{job.category}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            <span className="font-semibold text-gray-900">
                              {formatCurrency(job.budget)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{job.location.city}, {job.location.province}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{job._count?.bids || 0} bids</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>Posted {formatDate(job.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => router.push(`/client/jobs/${job.id}`)}
                        className="bg-turquoise-600 hover:bg-turquoise-700"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                      {job.status === 'DRAFT' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/client/jobs/${job.id}/edit`)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      )}
                      {(job.status === 'OPEN' || job.status === 'DRAFT') && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
