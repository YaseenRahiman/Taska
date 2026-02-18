'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Star,
  MessageCircle,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/utils';
import { JobCompletionConfirmModal } from '@/components/jobs/JobCompletionConfirmModal';
import { JobCompletionStatus, ConfirmCompletionResponse } from '@/types/job';

interface Job {
  id: string;
  title: string;
  description: string;
  category: {
    id: string;
    name: string;
  };
  budget: number;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  // Location fields are flat on the job model, not nested
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  requirements?: string;
  timeline?: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
    averageRating?: number;
    totalReviews?: number;
  };
  bidsCount: number;
}

interface Bid {
  id: string;
  amount: number;
  message: string;
  estimatedDays: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  submittedAt: string;
  artisan: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    profilePicture?: string;
    averageRating?: number;
    totalReviews?: number;
    completedJobs?: number;
    specializations?: string[];
    bio?: string;
    verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  };
  portfolio?: {
    id: string;
    title: string;
    description: string;
    images: string[];
    completedAt: string;
  }[];
}

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.id as string;

  useEffect(() => {
    document.title = 'Taska - Job Details';
  }, []);

  const [job, setJob] = useState<Job | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBid, setSelectedBid] = useState<string | null>(null);
  const [processingBid, setProcessingBid] = useState<string | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionStatus, setCompletionStatus] = useState<JobCompletionStatus | null>(null);
  const [acceptedArtisan, setAcceptedArtisan] = useState<Bid['artisan'] | null>(null);

  useEffect(() => {
    if (jobId) {
      fetchJobData();
    }
  }, [jobId]);

  const fetchCompletionStatus = useCallback(async () => {
    if (!jobId) return;
    try {
      const status = await api.getJobCompletionStatus(jobId);
      setCompletionStatus(status);
    } catch (error) {
      console.error('Failed to fetch completion status:', error);
    }
  }, [jobId]);

  const fetchJobData = async () => {
    try {
      setLoading(true);
      const [jobResponse, bidsResponse] = await Promise.all([
        api.get(`/jobs/${jobId}`),
        api.get(`/bids/job/${jobId}`)
      ]);

      // Handle different API response formats for job data
      const jobData = jobResponse.data?.job || jobResponse.data?.data || jobResponse.data;

      // Transform job data to expected format if needed
      if (jobData) {
        const transformedJob: Job = {
          ...jobData,
          // Handle nested client data
          client: jobData.client?.profile ? {
            id: jobData.client.id,
            firstName: jobData.client.profile.firstName || jobData.client.firstName || '',
            lastName: jobData.client.profile.lastName || jobData.client.lastName || '',
            email: jobData.client.email || '',
            profilePicture: jobData.client.profile.profileImage || jobData.client.profilePicture,
            averageRating: jobData.client.profile.averageRating || jobData.client.averageRating,
            totalReviews: jobData.client.profile.totalReviews || jobData.client.totalReviews,
          } : jobData.client,
          // Handle nested category
          category: jobData.category || { id: '', name: 'Uncategorized' },
          // Handle bidsCount
          bidsCount: jobData.bidsCount || jobData._count?.bids || 0,
        };
        setJob(transformedJob);
      }

      const rawBidsData = bidsResponse.data?.bids || bidsResponse.data || [];
      // Transform bids data to match frontend interface
      const transformedBids: Bid[] = (Array.isArray(rawBidsData) ? rawBidsData : []).map((bid: any) => ({
        ...bid,
        artisan: {
          id: bid.artisan?.id || '',
          firstName: bid.artisan?.profile?.firstName || bid.artisan?.firstName || '',
          lastName: bid.artisan?.profile?.lastName || bid.artisan?.lastName || '',
          email: bid.artisan?.email || '',
          phone: bid.artisan?.profile?.phone || bid.artisan?.phone,
          profilePicture: bid.artisan?.profile?.profileImage || bid.artisan?.profilePicture,
          averageRating: bid.artisan?.profile?.averageRating || bid.artisan?.averageRating,
          totalReviews: bid.artisan?.profile?.totalReviews || bid.artisan?.totalReviews,
          completedJobs: bid.artisan?.profile?.completedJobs || bid.artisan?.completedJobs,
          // Transform specializations from objects to strings
          specializations: bid.artisan?.specializations?.map((spec: any) =>
            typeof spec === 'string' ? spec : spec?.category?.name || spec?.name || ''
          ).filter(Boolean) || bid.artisan?.specializations,
          bio: bid.artisan?.profile?.bio || bid.artisan?.bio,
          verificationStatus: bid.artisan?.profile?.verificationStatus || bid.artisan?.verificationStatus || 'PENDING',
        },
      }));
      setBids(transformedBids);

      // Find the accepted artisan for IN_PROGRESS jobs
      const acceptedBid = transformedBids.find((bid: Bid) => bid.status === 'ACCEPTED');
      if (acceptedBid) {
        setAcceptedArtisan(acceptedBid.artisan);
      }

      // Fetch completion status for IN_PROGRESS jobs
      if (jobData?.status === 'IN_PROGRESS') {
        fetchCompletionStatus();
      }
    } catch (error) {
      console.error('Failed to fetch job data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptBid = async (bidId: string) => {
    try {
      setProcessingBid(bidId);
      await api.post(`/bids/${bidId}/accept`);
      await fetchJobData(); // Refresh data
    } catch (error) {
      console.error('Failed to accept bid:', error);
    } finally {
      setProcessingBid(null);
    }
  };

  const handleRejectBid = async (bidId: string, reason?: string) => {
    try {
      setProcessingBid(bidId);
      await api.post(`/bids/${bidId}/reject`, { reason });
      await fetchJobData(); // Refresh data
    } catch (error) {
      console.error('Failed to reject bid:', error);
    } finally {
      setProcessingBid(null);
    }
  };

  const handleCompletionSuccess = (response: ConfirmCompletionResponse) => {
    // Refresh job data and completion status
    fetchJobData();
    if (response.isFullyConfirmed) {
      // Job is now completed - could show a success message or redirect
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-gray-100 text-gray-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'ACCEPTED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'VERIFIED': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'HIGH': return 'bg-red-100 text-red-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-cream-50 p-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Job Not Found</h1>
          <p className="text-gray-600 mb-6">The job you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => router.push('/jobs')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="text-gray-600 border-gray-600 hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
            <p className="text-gray-600 mt-1">Posted {formatRelativeTime(job.createdAt)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(job.status)}>
              {job.status.replace('_', ' ')}
            </Badge>
            <Badge className={getUrgencyColor(job.urgency)}>
              {job.urgency}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Details */}
            <Card>
              <CardHeader>
                <CardTitle>Job Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Category</h3>
                    <p className="text-gray-700">{job.category?.name || 'Uncategorized'}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Budget</h3>
                    <p className="text-2xl font-bold text-turquoise-600">{formatCurrency(job.budget)}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Location</h3>
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="w-4 h-4" />
                    <span>{job.addressLine1 || 'Unknown Address'}, {job.city || 'Unknown City'}, {job.province || 'Unknown Province'} {job.postalCode || ''}</span>
                  </div>
                </div>

                {job.requirements && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Requirements</h3>
                    <p className="text-gray-700">{job.requirements}</p>
                  </div>
                )}

                {job.timeline && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Timeline</h3>
                    <p className="text-gray-700">{job.timeline}</p>
                  </div>
                )}

                {job.images && job.images.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Images</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {job.images.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Job image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bids Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Bids ({bids.length})</span>
                  {job.status === 'OPEN' && (
                    <span className="text-sm text-gray-600">Review and compare bids from artisans</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bids.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No bids yet</h3>
                    <p className="text-gray-600">Artisans will submit their bids for your job here.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {bids.map((bid) => (
                      <div
                        key={bid.id}
                        className={`border rounded-lg p-6 transition-all ${
                          selectedBid === bid.id ? 'border-turquoise-500 bg-turquoise-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-turquoise-100 rounded-full flex items-center justify-center">
                              {bid.artisan.profilePicture ? (
                                <img 
                                  src={bid.artisan.profilePicture} 
                                  alt={`${bid.artisan.firstName} ${bid.artisan.lastName}`}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-turquoise-600 font-medium">
                                  {bid.artisan?.firstName?.charAt(0) || ''}{bid.artisan?.lastName?.charAt(0) || ''}
                                </span>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium text-gray-900">
                                  {bid.artisan.firstName} {bid.artisan.lastName}
                                </h3>
                                {bid.artisan.verificationStatus === 'VERIFIED' && (
                                  <Badge className="bg-green-100 text-green-800 text-xs">
                                    Verified
                                  </Badge>
                                )}
                              </div>
                              
                              {bid.artisan.averageRating && (
                                <div className="flex items-center gap-1 mb-2">
                                  <div className="flex">
                                    {renderStars(bid.artisan.averageRating)}
                                  </div>
                                  <span className="text-sm text-gray-600">
                                    ({bid.artisan.totalReviews} reviews)
                                  </span>
                                  <span className="text-sm text-gray-400">•</span>
                                  <span className="text-sm text-gray-600">
                                    {bid.artisan.completedJobs} jobs completed
                                  </span>
                                </div>
                              )}

                              {bid.artisan.specializations && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {bid.artisan.specializations.map((spec, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {spec}
                                    </Badge>
                                  ))}
                                </div>
                              )}

                              <p className="text-gray-700 mb-3">{bid.message}</p>

                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600">Bid Amount:</span>
                                  <p className="font-semibold text-turquoise-600">{formatCurrency(bid.amount)}</p>
                                </div>
                                <div>
                                  <span className="text-gray-600">Estimated Time:</span>
                                  <p className="font-medium">{bid.estimatedDays} days</p>
                                </div>
                                <div>
                                  <span className="text-gray-600">Submitted:</span>
                                  <p className="font-medium">{formatRelativeTime(bid.submittedAt)}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end gap-2">
                            <Badge className={getStatusColor(bid.status)}>
                              {bid.status}
                            </Badge>
                          </div>
                        </div>

                        {/* Actions */}
                        {job.status === 'OPEN' && bid.status === 'PENDING' && (
                          <div className="flex gap-3 pt-4 border-t">
                            <Button
                              size="sm"
                              onClick={() => handleAcceptBid(bid.id)}
                              disabled={processingBid === bid.id}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Accept Bid
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRejectBid(bid.id)}
                              disabled={processingBid === bid.id}
                              className="text-red-600 border-red-600 hover:bg-red-50"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/client/messages?artisan=${bid.artisan.id}&job=${job.id}`)}
                              className="text-turquoise-600 border-turquoise-600 hover:bg-turquoise-50"
                            >
                              <MessageCircle className="w-4 h-4 mr-1" />
                              Message
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedBid(selectedBid === bid.id ? null : bid.id)}
                              className="text-gray-600 border-gray-600 hover:bg-gray-50"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              {selectedBid === bid.id ? 'Hide' : 'View'} Profile
                            </Button>
                          </div>
                        )}

                        {/* Expanded Profile */}
                        {selectedBid === bid.id && (
                          <div className="mt-6 pt-6 border-t bg-white rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 mb-3">Artisan Profile</h4>
                            
                            {bid.artisan.bio && (
                              <div className="mb-4">
                                <h5 className="text-sm font-medium text-gray-700 mb-1">About</h5>
                                <p className="text-gray-600 text-sm">{bid.artisan.bio}</p>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <h5 className="text-sm font-medium text-gray-700 mb-1">Contact</h5>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <Mail className="w-3 h-3 text-gray-400" />
                                    <span className="text-gray-600">{bid.artisan.email}</span>
                                  </div>
                                  {bid.artisan.phone && (
                                    <div className="flex items-center gap-2">
                                      <Phone className="w-3 h-3 text-gray-400" />
                                      <span className="text-gray-600">{bid.artisan.phone}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div>
                                <h5 className="text-sm font-medium text-gray-700 mb-1">Experience</h5>
                                <div className="space-y-1 text-gray-600">
                                  <p>{bid.artisan.completedJobs} jobs completed</p>
                                  <p>{bid.artisan.totalReviews} client reviews</p>
                                  <p>{bid.artisan.averageRating?.toFixed(1)} average rating</p>
                                </div>
                              </div>
                            </div>

                            {bid.portfolio && bid.portfolio.length > 0 && (
                              <div className="mt-4">
                                <h5 className="text-sm font-medium text-gray-700 mb-2">Recent Work</h5>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                  {bid.portfolio.slice(0, 3).map((work, index) => (
                                    <div key={work.id} className="relative">
                                      <img
                                        src={work.images[0]}
                                        alt={work.title}
                                        className="w-full h-20 object-cover rounded"
                                      />
                                      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all rounded flex items-center justify-center">
                                        <span className="text-white text-xs font-medium opacity-0 hover:opacity-100">
                                          {work.title}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Client Info */}
            <Card>
              <CardHeader>
                <CardTitle>Posted By</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-turquoise-100 rounded-full flex items-center justify-center">
                    {job.client.profilePicture ? (
                      <img 
                        src={job.client.profilePicture} 
                        alt={`${job.client.firstName} ${job.client.lastName}`}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-turquoise-600 font-medium">
                        {job.client?.firstName?.charAt(0) || ''}{job.client?.lastName?.charAt(0) || ''}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {job.client.firstName} {job.client.lastName}
                    </h3>
                    {job.client.averageRating && (
                      <div className="flex items-center gap-1">
                        <div className="flex">
                          {renderStars(job.client.averageRating)}
                        </div>
                        <span className="text-sm text-gray-600">
                          ({job.client.totalReviews})
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Member since {formatDate(job.createdAt, { year: 'numeric', month: 'long' })}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Job Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Job Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Bids</span>
                  <span className="font-medium">{job.bidsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Budget</span>
                  <span className="font-medium">{formatCurrency(job.budget)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Category</span>
                  <span className="font-medium">{job.category?.name || 'Uncategorized'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Posted</span>
                  <span className="font-medium">{formatRelativeTime(job.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <Badge className={getStatusColor(job.status)}>
                    {job.status.replace('_', ' ')}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Completion Status Banner for IN_PROGRESS jobs */}
            {job.status === 'IN_PROGRESS' && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
                    <Clock className="w-5 h-5" />
                    Job In Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {completionStatus ? (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-blue-700">Your confirmation:</span>
                        {completionStatus.clientConfirmed ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Confirmed
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-blue-700">Artisan confirmation:</span>
                        {completionStatus.artisanConfirmed ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Confirmed
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </div>
                      {!completionStatus.clientConfirmed && (
                        <Button
                          className="w-full bg-green-600 hover:bg-green-700 mt-2"
                          onClick={() => setShowCompletionModal(true)}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Confirm Completion
                        </Button>
                      )}
                      {completionStatus.clientConfirmed && !completionStatus.artisanConfirmed && (
                        <p className="text-sm text-blue-700 mt-2">
                          Waiting for the artisan to confirm completion.
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="text-sm text-blue-700">
                      <p>When the work is complete, both you and the artisan need to confirm completion.</p>
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700 mt-3"
                        onClick={() => setShowCompletionModal(true)}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Confirm Completion
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full"
                  onClick={() => router.push(`/client/jobs/${job.id}/edit`)}
                  disabled={job.status !== 'OPEN'}
                >
                  Edit Job
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/client/messages?job=${job.id}`)}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  View Messages
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-red-600 border-red-600 hover:bg-red-50"
                  onClick={() => {
                    if (confirm('Are you sure you want to cancel this job?')) {
                      // Handle job cancellation
                    }
                  }}
                  disabled={job.status !== 'OPEN'}
                >
                  Cancel Job
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Job Completion Confirmation Modal */}
      {job && job.status === 'IN_PROGRESS' && (
        <JobCompletionConfirmModal
          jobId={job.id}
          jobTitle={job.title}
          isClient={true}
          otherPartyName={acceptedArtisan
            ? `${acceptedArtisan.firstName} ${acceptedArtisan.lastName}`
            : 'the artisan'
          }
          otherPartyConfirmed={completionStatus?.artisanConfirmed ?? false}
          isOpen={showCompletionModal}
          onClose={() => setShowCompletionModal(false)}
          onSuccess={handleCompletionSuccess}
        />
      )}
    </div>
  );
}
