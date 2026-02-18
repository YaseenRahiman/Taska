'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArtisanNavbar } from '@/components/artisan/ArtisanNavbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DollarSign,
  TrendingUp,
  Target,
  Star,
  Briefcase,
  Clock,
  MapPin,
  Calendar,
  Users,
  User,
  Eye,
  MessageCircle,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Hammer
} from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import SubscriptionWidget from '@/components/subscription/SubscriptionWidget'
import TodayScheduleWidget from '@/components/artisan/calendar/TodayScheduleWidget'

interface Job {
  id: string
  title: string
  description: string
  category: string
  budget: number
  location: string
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  status: string
  distance?: number
  postedAt: string
  client: {
    name: string
    rating: number
    completedJobs: number
  }
}

interface Bid {
  id: string
  jobId: string
  amount: number
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN'
  submittedAt: string
  job: {
    title: string
    client: {
      name: string
    }
  }
}

interface EarningsData {
  totalEarnings: number
  pendingPayments: number
  thisMonth: number
  lastMonth: number
  averageJobValue: number
  completedJobs: number
}

interface PerformanceData {
  totalBids: number
  acceptedBids: number
  successRate: number
  averageResponseTime: string
  rating: number
  reviews: number
}

export default function ArtisanDashboard() {
  useEffect(() => {
    document.title = 'Taska - Artisan Dashboard';
  }, []);

  const router = useRouter()
  const { user } = useAuth()
  const [availableJobs, setAvailableJobs] = useState<Job[]>([])
  const [activeProjects, setActiveProjects] = useState<Job[]>([])
  const [recentBids, setRecentBids] = useState<Bid[]>([])
  const [earnings, setEarnings] = useState<EarningsData>({
    totalEarnings: 0,
    pendingPayments: 0,
    thisMonth: 0,
    lastMonth: 0,
    averageJobValue: 0,
    completedJobs: 0
  })
  const [performance, setPerformance] = useState<PerformanceData>({
    totalBids: 0,
    acceptedBids: 0,
    successRate: 0,
    averageResponseTime: '',
    rating: 0,
    reviews: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData()
    }
  }, [user?.id])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      // Fetch available jobs
      const jobsResponse = await api.get('/jobs', {
        params: { status: 'OPEN', limit: 6 }
      })
      // GET /jobs returns { data: [], meta: {} }
      setAvailableJobs(jobsResponse.data.data || jobsResponse.data.jobs || [])

      // Fetch active projects
      const projectsResponse = await api.get('/jobs/artisan/active')
      setActiveProjects(Array.isArray(projectsResponse.data) ? projectsResponse.data : (projectsResponse.data?.data || []))

      // Fetch recent bids - /bids/my-bids returns raw array
      const bidsResponse = await api.get('/bids/my-bids', {
        params: { limit: 5 }
      })
      setRecentBids(Array.isArray(bidsResponse.data) ? bidsResponse.data : (bidsResponse.data.bids || []))

      // Fetch wallet statistics for earnings data
      try {
        const walletStatsResponse = await api.get('/wallets/statistics')
        // Handle different API response formats
        const walletStats = walletStatsResponse.data?.data || walletStatsResponse.data?.statistics || walletStatsResponse.data || {}
        setEarnings({
          totalEarnings: Number(walletStats.totalEarnings) || Number(walletStats.total_earnings) || 0,
          pendingPayments: Number(walletStats.pendingWithdrawals) || Number(walletStats.pending_withdrawals) || Number(walletStats.pendingPayments) || 0,
          thisMonth: Number(walletStats.thisMonthEarnings) || Number(walletStats.this_month_earnings) || Number(walletStats.monthlyEarnings) || 0,
          lastMonth: Number(walletStats.lastMonthEarnings) || Number(walletStats.last_month_earnings) || 0,
          averageJobValue: Number(walletStats.averageJobValue) || Number(walletStats.average_job_value) || 0,
          completedJobs: Number(walletStats.completedJobsCount) || Number(walletStats.completed_jobs_count) || Number(walletStats.completedJobs) || 0
        })
      } catch (err) {
        console.error('Error fetching wallet statistics:', err)
        // Wallet may not exist yet for new artisans, use defaults
        setEarnings({
          totalEarnings: 0,
          pendingPayments: 0,
          thisMonth: 0,
          lastMonth: 0,
          averageJobValue: 0,
          completedJobs: 0
        })
      }

      // Fetch bid statistics for performance data
      try {
        const bidStatsResponse = await api.get('/bids/statistics')
        // Handle different API response formats
        const bidStats = bidStatsResponse.data?.data || bidStatsResponse.data?.statistics || bidStatsResponse.data || {}

        // Fetch review statistics for rating
        let reviewData = { averageRating: 0, totalReviews: 0 }
        if (user?.id) {
          try {
            const reviewStatsResponse = await api.get(`/reviews/statistics/${user.id}`)
            const reviewStats = reviewStatsResponse.data?.data || reviewStatsResponse.data?.statistics || reviewStatsResponse.data || {}
            reviewData = {
              averageRating: Number(reviewStats.averageRating) || Number(reviewStats.average_rating) || Number(reviewStats.rating) || 0,
              totalReviews: Number(reviewStats.totalReviews) || Number(reviewStats.total_reviews) || Number(reviewStats.count) || 0
            }
          } catch (reviewErr) {
            console.error('Error fetching review statistics:', reviewErr)
            // No reviews yet, use defaults
          }
        }

        // Calculate success rate - API might return decimal or percentage
        let successRate = Number(bidStats.successRate) || Number(bidStats.success_rate) || 0
        // If success rate is between 0-1, convert to percentage
        if (successRate > 0 && successRate <= 1) {
          successRate = successRate * 100
        }

        setPerformance({
          totalBids: Number(bidStats.total) || Number(bidStats.totalBids) || Number(bidStats.total_bids) || 0,
          acceptedBids: Number(bidStats.accepted) || Number(bidStats.acceptedBids) || Number(bidStats.accepted_bids) || 0,
          successRate: successRate,
          averageResponseTime: bidStats.averageResponseTime || bidStats.average_response_time || 'N/A',
          rating: reviewData.averageRating,
          reviews: reviewData.totalReviews
        })
      } catch (err) {
        console.error('Error fetching bid statistics:', err)
        // No bids yet, use defaults
        setPerformance({
          totalBids: 0,
          acceptedBids: 0,
          successRate: 0,
          averageResponseTime: 'N/A',
          rating: 0,
          reviews: 0
        })
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'URGENT': return 'bg-red-100 text-red-800 border-red-200'
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getBidStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return 'bg-green-100 text-green-800 border-green-200'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200'
      case 'WITHDRAWN': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-green-100 text-green-800 border-green-200'
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'COMPLETED': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50">
        <ArtisanNavbar />
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
    )
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <ArtisanNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8" data-testid="welcome-section">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900" data-testid="welcome-heading">Welcome back!</h1>
          <p className="text-gray-600 mt-2">Here's your artisan business overview and opportunities.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8" data-testid="stats-section">
          <Card className="hover:shadow-lg transition-shadow" data-testid="earnings-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2" data-testid="earnings-value">{formatCurrency(earnings.totalEarnings)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {earnings.completedJobs} jobs completed
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow" data-testid="monthly-earnings-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2" data-testid="monthly-earnings-value">{formatCurrency(earnings.thisMonth)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    +{earnings.lastMonth > 0 ? ((earnings.thisMonth - earnings.lastMonth) / earnings.lastMonth * 100).toFixed(1) : '0'}% from last month
                  </p>
                </div>
                <div className="p-3 bg-primary-100 rounded-full">
                  <TrendingUp className="w-6 h-6 text-primary-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow" data-testid="success-rate-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2" data-testid="success-rate-value">{performance.successRate.toFixed(1)}%</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {performance.acceptedBids} of {performance.totalBids} bids accepted
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow" data-testid="rating-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rating</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2" data-testid="rating-value">{performance.rating.toFixed(1)}/5</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Based on {performance.reviews} reviews
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Star className="w-6 h-6 text-yellow-600 fill-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Schedule Widget */}
        <div className="mb-8">
          <TodayScheduleWidget />
        </div>

        {/* Quick Actions and Subscription */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Quick Actions Banner */}
          <div className="lg:col-span-2 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-6 md:p-8 text-white shadow-lg" data-testid="quick-actions-banner">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 h-full">
              <div>
                <h2 className="text-2xl font-bold mb-2">Find Your Next Job</h2>
                <p className="text-primary-50">Browse available opportunities and submit competitive bids.</p>
              </div>
              <Button
                onClick={() => router.push('/artisan/jobs')}
                size="lg"
                className="bg-white text-black hover:bg-cream-50 shadow-md hover:shadow-lg transition-all whitespace-nowrap font-semibold"
                data-testid="browse-jobs-button"
              >
                <Hammer className="w-5 h-5 mr-2" />
                Browse Jobs
              </Button>
            </div>
          </div>

          {/* Subscription Widget */}
          <div className="lg:col-span-1">
            <SubscriptionWidget userRole="ARTISAN" />
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="jobs" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-3xl">
            <TabsTrigger value="jobs" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              <span>Jobs</span>
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <Hammer className="w-4 h-4" />
              <span>Projects</span>
            </TabsTrigger>
            <TabsTrigger value="bids" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>Bids</span>
            </TabsTrigger>
            <TabsTrigger value="earnings" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span>Earnings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="jobs" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Available Jobs Near You</h2>
              <Button
                variant="outline"
                onClick={() => router.push('/artisan/jobs')}
                className="text-primary-600 border-primary-600 hover:bg-primary-50"
              >
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {availableJobs.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="w-8 h-8 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs available</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Check back soon for new opportunities in your area.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {availableJobs.map((job) => (
                  <Card key={job.id} className="hover:shadow-lg transition-all cursor-pointer" onClick={() => router.push(`/artisan/jobs/${job.id}`)}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{job.title}</h3>
                        <Badge className={`${getUrgencyColor(job.urgency)} border flex-shrink-0`}>
                          {job.urgency}
                        </Badge>
                      </div>
                      <p className="text-gray-600 text-sm line-clamp-2">{job.description}</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Budget</span>
                        <span className="font-semibold text-primary-600">{formatCurrency(job.budget)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1 text-gray-600">
                          <MapPin className="w-4 h-4" />
                          Location
                        </span>
                        <span className="text-gray-900">{job.location}</span>
                      </div>
                      {job.distance && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Distance</span>
                          <span className="text-gray-900">{job.distance} km away</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm pt-2 border-t">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-900 font-medium">{job.client.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          <span className="text-gray-700">{job.client.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <Button className="w-full mt-3 bg-primary-600 hover:bg-primary-700" onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/artisan/jobs/${job.id}#submit-bid`);
                      }}>
                        Submit Bid
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="projects" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Active Projects</h2>
              <Button
                variant="outline"
                onClick={() => router.push('/artisan/projects')}
                className="text-primary-600 border-primary-600 hover:bg-primary-50"
              >
                Manage All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {activeProjects.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeProjects.map((project) => (
                  <Card key={project.id} className="hover:shadow-lg transition-all cursor-pointer" onClick={() => router.push(`/artisan/projects/${project.id}`)}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{project.title}</h3>
                        <Badge className={`${getStatusColor(project.status)} border flex-shrink-0`}>
                          {project.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-gray-600 text-sm line-clamp-2">{project.description}</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Payment</span>
                        <span className="font-semibold text-green-600">{formatCurrency(project.budget)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1 text-gray-600">
                          <Clock className="w-4 h-4" />
                          Posted
                        </span>
                        <span className="text-gray-900">{formatRelativeTime(project.postedAt)}</span>
                      </div>
                      <div className="pt-3 space-y-2">
                        <Button
                          className="w-full bg-primary-600 hover:bg-primary-700"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/artisan/projects/${project.id}#update`);
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Update Progress
                        </Button>
                        <Button
                          className="w-full text-gray-700 border-gray-300 hover:bg-gray-50"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/artisan/messages?project=${project.id}`);
                          }}
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Message Client
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Hammer className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No active projects</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Submit bids on available jobs to get started!
                  </p>
                  <Button
                    onClick={() => router.push('/artisan/jobs')}
                    className="bg-primary-600 hover:bg-primary-700"
                  >
                    <Briefcase className="w-4 h-4 mr-2" />
                    Browse Jobs
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="bids" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Recent Bids</h2>
              <Button
                variant="outline"
                onClick={() => router.push('/artisan/bids')}
                className="text-primary-600 border-primary-600 hover:bg-primary-50"
              >
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {recentBids.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-yellow-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No bids yet</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Start bidding on jobs to grow your business!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {recentBids.map((bid) => (
                  <Card key={bid.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push(`/artisan/bids/${bid.id}`)}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="font-semibold text-gray-900 text-lg">{bid.job.title}</h3>
                            <Badge className={`${getBidStatusColor(bid.status)} border flex-shrink-0`}>
                              {bid.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            Client: <span className="font-medium text-gray-900">{bid.job.client.name}</span>
                          </p>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            Submitted {formatRelativeTime(bid.submittedAt)}
                          </div>
                        </div>
                        <div className="flex md:flex-col items-center md:items-end gap-2">
                          <div className="text-2xl font-bold text-primary-600">{formatCurrency(bid.amount)}</div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/artisan/bids/${bid.id}`);
                            }}
                            className="text-primary-600 border-primary-600 hover:bg-primary-50"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="earnings" className="space-y-4">
            <div className="grid gap-4 md:gap-6 md:grid-cols-2">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-gray-900">Earnings Overview</CardTitle>
                  <CardDescription className="text-gray-600">Your financial performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b">
                    <div className="flex items-center gap-2 text-gray-700">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      <span>Total Earnings</span>
                    </div>
                    <span className="font-semibold text-gray-900">{formatCurrency(earnings.totalEarnings)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span>Pending Payments</span>
                    </div>
                    <span className="font-semibold text-orange-600">{formatCurrency(earnings.pendingPayments)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span>This Month</span>
                    </div>
                    <span className="font-semibold text-gray-900">{formatCurrency(earnings.thisMonth)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <div className="flex items-center gap-2 text-gray-700">
                      <TrendingUp className="w-4 h-4 text-gray-500" />
                      <span>Average Job Value</span>
                    </div>
                    <span className="font-semibold text-gray-900">{formatCurrency(earnings.averageJobValue)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <div className="flex items-center gap-2 text-gray-700">
                      <CheckCircle className="w-4 h-4 text-gray-500" />
                      <span>Completed Jobs</span>
                    </div>
                    <span className="font-semibold text-gray-900">{earnings.completedJobs}</span>
                  </div>
                  <div className="pt-4">
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => router.push('/artisan/earnings/withdraw')}
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Request Withdrawal
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-gray-900">Performance Metrics</CardTitle>
                  <CardDescription className="text-gray-600">Your business statistics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Target className="w-4 h-4 text-gray-500" />
                      <span>Success Rate</span>
                    </div>
                    <span className="font-semibold text-gray-900">{performance.successRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span>Avg Response Time</span>
                    </div>
                    <span className="font-semibold text-gray-900">{performance.averageResponseTime}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span>Customer Rating</span>
                    </div>
                    <span className="font-semibold text-gray-900">{performance.rating.toFixed(1)}/5</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <div className="flex items-center gap-2 text-gray-700">
                      <MessageCircle className="w-4 h-4 text-gray-500" />
                      <span>Total Reviews</span>
                    </div>
                    <span className="font-semibold text-gray-900">{performance.reviews}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span>Total Bids</span>
                    </div>
                    <span className="font-semibold text-gray-900">{performance.totalBids}</span>
                  </div>
                  <div className="pt-4">
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => router.push('/artisan/reports')}
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      View Detailed Reports
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
