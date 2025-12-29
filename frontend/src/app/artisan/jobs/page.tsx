'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { ArtisanNavbar } from '@/components/artisan/ArtisanNavbar'
import { BidModal } from '@/components/artisan/BidModal'
import { JobDetailsModal } from '@/components/artisan/JobDetailsModal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/lib/api'
import {
  MapPin,
  Clock,
  DollarSign,
  Filter,
  X,
  CheckCircle2,
  AlertCircle,
  Search,
  RefreshCw,
  Bookmark,
  BookmarkCheck,
  User,
  Star,
  TrendingUp,
  Eye,
  Calendar,
  Zap
} from 'lucide-react'

interface Job {
  id: string
  title: string
  description: string
  category: string
  budget: number
  location: string
  coordinates?: {
    lat: number
    lng: number
  }
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  status: string
  distance?: number
  postedAt: string
  deadline?: string
  requiresVerification: boolean
  client: {
    name: string
    rating: number
    completedJobs: number
    isVerified: boolean
  }
  requirements?: string[]
  images?: string[]
}

interface FilterOptions {
  category: string
  maxDistance: number
  minBudget: number
  maxBudget: number
  urgency: string[]
  postedWithin: string
  requiresVerification: boolean
  searchQuery: string
}

const categories = [
  'All Categories',
  'Plumbing',
  'Electrical',
  'Carpentry',
  'Painting',
  'Gardening',
  'Cleaning',
  'Handyman',
  'Roofing',
  'Tiling',
  'Appliance Repair',
  'Security',
  'Automotive'
]

const urgencyLevels = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

export default function JobDiscovery() {
  useEffect(() => {
    document.title = 'Taska - Browse Jobs';
  }, []);

  const [jobs, setJobs] = useState<Job[]>([])
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [showFilters, setShowFilters] = useState(false)
  const [savedSearches, setSavedSearches] = useState<string[]>([])
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set())
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [showBidModal, setShowBidModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  const [filters, setFilters] = useState<FilterOptions>({
    category: 'All Categories',
    maxDistance: 50,
    minBudget: 0,
    maxBudget: 10000,
    urgency: [],
    postedWithin: 'all',
    requiresVerification: false,
    searchQuery: ''
  })

  useEffect(() => {
    fetchJobs()
    fetchSavedSearches()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [jobs, filters])

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/jobs', {
        params: {
          status: 'OPEN',
          includeLocation: true,
          limit: 50
        }
      })

      // Mock jobs with realistic data (fallback)
      const mockJobs: Job[] = [
        {
          id: '1',
          title: 'Kitchen Sink Repair - Urgent',
          description: 'Kitchen sink is completely blocked and overflowing. Need immediate plumbing assistance.',
          category: 'Plumbing',
          budget: 800,
          location: 'Sandton, Johannesburg',
          coordinates: { lat: -26.1076, lng: 28.0567 },
          urgency: 'URGENT',
          status: 'OPEN',
          distance: 5.2,
          postedAt: new Date().toISOString(),
          deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          requiresVerification: true,
          client: {
            name: 'Sarah Miller',
            rating: 4.8,
            completedJobs: 12,
            isVerified: true
          },
          requirements: ['Licensed plumber', 'Emergency availability', 'Own tools'],
          images: ['/api/images/kitchen-sink-1.jpg']
        },
        {
          id: '2',
          title: 'Bedroom Electrical Installation',
          description: 'Need additional power outlets installed in bedroom and ceiling fan wiring.',
          category: 'Electrical',
          budget: 1200,
          location: 'Rosebank, Johannesburg',
          coordinates: { lat: -26.1439, lng: 28.0404 },
          urgency: 'MEDIUM',
          status: 'OPEN',
          distance: 8.7,
          postedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          requiresVerification: true,
          client: {
            name: 'John Davidson',
            rating: 4.5,
            completedJobs: 8,
            isVerified: true
          },
          requirements: ['Certified electrician', 'COC certificate', 'Insurance']
        },
        {
          id: '3',
          title: 'Custom Kitchen Cabinets',
          description: 'Looking for skilled carpenter to build custom kitchen cabinets. Detailed plans provided.',
          category: 'Carpentry',
          budget: 8500,
          location: 'Parktown, Johannesburg',
          coordinates: { lat: -26.1875, lng: 28.0421 },
          urgency: 'LOW',
          status: 'OPEN',
          distance: 12.3,
          postedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          requiresVerification: false,
          client: {
            name: 'Mike Chen',
            rating: 4.9,
            completedJobs: 25,
            isVerified: true
          },
          requirements: ['Portfolio required', 'Experience with custom work', 'References']
        },
        {
          id: '4',
          title: 'Garden Landscaping Project',
          description: 'Complete garden makeover including lawn, flower beds, and irrigation system.',
          category: 'Gardening',
          budget: 5500,
          location: 'Hyde Park, Johannesburg',
          coordinates: { lat: -26.1202, lng: 28.0387 },
          urgency: 'MEDIUM',
          status: 'OPEN',
          distance: 7.1,
          postedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          requiresVerification: false,
          client: {
            name: 'Lisa Thompson',
            rating: 4.6,
            completedJobs: 15,
            isVerified: false
          },
          requirements: ['Landscaping experience', 'Own equipment', 'Plant knowledge']
        },
        {
          id: '5',
          title: 'Office Painting - 3 Rooms',
          description: 'Professional painting required for small office space. 3 rooms, walls and ceiling.',
          category: 'Painting',
          budget: 2800,
          location: 'Bryanston, Johannesburg',
          coordinates: { lat: -26.0456, lng: 28.0183 },
          urgency: 'HIGH',
          status: 'OPEN',
          distance: 15.8,
          postedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          requiresVerification: false,
          client: {
            name: 'David Wilson',
            rating: 4.3,
            completedJobs: 6,
            isVerified: true
          },
          requirements: ['Professional painter', 'Own paint and tools', 'Weekend availability']
        }
      ]

      setJobs(response.data.jobs || mockJobs)
    } catch (error) {
      console.error('Error fetching jobs:', error)
      setError('Failed to load jobs. Please try again.')
      setJobs([])
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchSavedSearches = useCallback(async () => {
    try {
      const response = await api.get('/artisan/saved-searches')
      setSavedSearches(response.data || ['Urgent Plumbing Jobs', 'High-Budget Electrical Work', 'Carpentry Projects'])
    } catch (error) {
      console.error('Error fetching saved searches:', error)
      setSavedSearches(['Urgent Plumbing Jobs', 'High-Budget Electrical Work', 'Carpentry Projects'])
    }
  }, [])

  const applyFilters = useCallback(() => {
    let filtered = [...jobs]

    // Search query filter
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase()
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(query) ||
        job.description.toLowerCase().includes(query) ||
        job.category.toLowerCase().includes(query)
      )
    }

    // Category filter
    if (filters.category !== 'All Categories') {
      filtered = filtered.filter(job => job.category === filters.category)
    }

    // Distance filter
    if (filters.maxDistance < 100) {
      filtered = filtered.filter(job => !job.distance || job.distance <= filters.maxDistance)
    }

    // Budget filter
    filtered = filtered.filter(job =>
      job.budget >= filters.minBudget && job.budget <= filters.maxBudget
    )

    // Urgency filter
    if (filters.urgency.length > 0) {
      filtered = filtered.filter(job => filters.urgency.includes(job.urgency))
    }

    // Posted within filter
    if (filters.postedWithin !== 'all') {
      const now = new Date()
      const timeMap = {
        '1h': 1 * 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '3d': 3 * 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000
      }
      const timeLimit = timeMap[filters.postedWithin as keyof typeof timeMap]
      if (timeLimit) {
        filtered = filtered.filter(job =>
          now.getTime() - new Date(job.postedAt).getTime() <= timeLimit
        )
      }
    }

    // Verification filter
    if (filters.requiresVerification) {
      filtered = filtered.filter(job => job.requiresVerification)
    }

    setFilteredJobs(filtered)
  }, [jobs, filters])

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }, [])

  const getBadgeVariant = useCallback((urgency: string) => {
    switch (urgency) {
      case 'URGENT': return 'bg-red-100 text-red-800 border-red-200'
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }, [])

  const formatDistance = useCallback((distance?: number) => {
    if (!distance) return 'Location not specified'
    return `${distance.toFixed(1)} km away`
  }, [])

  const formatTimeAgo = useCallback((dateString: string) => {
    const now = new Date()
    const posted = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60))

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`
    }
  }, [])

  const saveCurrentSearch = useCallback(() => {
    const searchName = `${filters.category} - ${filters.urgency.join(', ') || 'All'} - ${formatCurrency(filters.maxBudget)}`
    setSavedSearches(prev => [...prev, searchName])
    // API call to save search would go here
  }, [filters, formatCurrency])

  const clearFilters = useCallback(() => {
    setFilters({
      category: 'All Categories',
      maxDistance: 50,
      minBudget: 0,
      maxBudget: 10000,
      urgency: [],
      postedWithin: 'all',
      requiresVerification: false,
      searchQuery: ''
    })
  }, [])

  const toggleSaveJob = useCallback((jobId: string) => {
    setSavedJobs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(jobId)) {
        newSet.delete(jobId)
      } else {
        newSet.add(jobId)
      }
      return newSet
    })
    // API call to save/unsave job would go here
  }, [])

  const handleViewDetails = useCallback((job: Job) => {
    setSelectedJob(job)
    setShowDetailsModal(true)
  }, [])

  const handleSubmitBid = useCallback((job: Job) => {
    setSelectedJob(job)
    setShowBidModal(true)
  }, [])

  const handleBidSuccess = useCallback(() => {
    // Optionally refresh jobs or show success message
    fetchJobs()
  }, [fetchJobs])

  // Memoize filtered job count
  const jobStats = useMemo(() => ({
    total: jobs.length,
    filtered: filteredJobs.length,
    urgent: filteredJobs.filter(j => j.urgency === 'URGENT').length,
    highBudget: filteredJobs.filter(j => j.budget >= 5000).length
  }), [jobs, filteredJobs])

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50">
        <ArtisanNavbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-full mt-2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <ArtisanNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Stats */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">Available Jobs</h1>
              <p className="text-gray-600 mt-2">
                Find jobs that match your skills and location
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                aria-label={showFilters ? 'Hide filters' : 'Show filters'}
                aria-expanded={showFilters}
                className="text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                <Filter className="w-4 h-4 mr-2" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
              <Button
                variant="outline"
                onClick={fetchJobs}
                aria-label="Refresh jobs"
                className="text-primary-600 border-primary-600 hover:bg-primary-50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Search className="w-4 h-4" />
                <span className="text-sm">Available Jobs</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{jobStats.filtered}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Zap className="w-4 h-4" />
                <span className="text-sm">Urgent</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{jobStats.urgent}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">High Budget</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{jobStats.highBudget}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Bookmark className="w-4 h-4" />
                <span className="text-sm">Saved</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{savedJobs.size}</p>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3" role="alert">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-red-900">Error Loading Jobs</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchJobs} className="flex-shrink-0">
              Try Again
            </Button>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
            <input
              type="search"
              placeholder="Search jobs by title, description, or category..."
              value={filters.searchQuery}
              onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              aria-label="Search jobs"
            />
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Filter Jobs</CardTitle>
                  <CardDescription>Refine your job search with these filters</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowFilters(false)}
                  aria-label="Close filters"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Category Filter */}
                <div>
                  <label htmlFor="category-filter" className="block text-sm font-medium mb-2 text-gray-700">Category</label>
                  <select
                    id="category-filter"
                    value={filters.category}
                    onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    aria-label="Filter by category"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                {/* Distance Filter */}
                <div>
                  <label htmlFor="distance-filter" className="block text-sm font-medium mb-2 text-gray-700">
                    Max Distance: {filters.maxDistance}km
                  </label>
                  <input
                    id="distance-filter"
                    type="range"
                    min="1"
                    max="100"
                    value={filters.maxDistance}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxDistance: parseInt(e.target.value) }))}
                    className="w-full"
                    aria-label="Maximum distance"
                    aria-valuemin={1}
                    aria-valuemax={100}
                    aria-valuenow={filters.maxDistance}
                  />
                </div>

                {/* Budget Filter */}
                <div>
                  <label htmlFor="min-budget" className="block text-sm font-medium mb-2 text-gray-700">Min Budget</label>
                  <input
                    id="min-budget"
                    type="number"
                    value={filters.minBudget}
                    onChange={(e) => setFilters(prev => ({ ...prev, minBudget: parseInt(e.target.value) || 0 }))}
                    className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0"
                    min="0"
                    aria-label="Minimum budget"
                  />
                </div>

                <div>
                  <label htmlFor="max-budget" className="block text-sm font-medium mb-2 text-gray-700">Max Budget</label>
                  <input
                    id="max-budget"
                    type="number"
                    value={filters.maxBudget}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxBudget: parseInt(e.target.value) || 10000 }))}
                    className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="10000"
                    min="0"
                    aria-label="Maximum budget"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Urgency Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Urgency Levels</label>
                  <div className="flex flex-wrap gap-2" role="group" aria-label="Urgency level filters">
                    {urgencyLevels.map(level => (
                      <button
                        key={level}
                        onClick={() => {
                          const newUrgency = filters.urgency.includes(level)
                            ? filters.urgency.filter(u => u !== level)
                            : [...filters.urgency, level]
                          setFilters(prev => ({ ...prev, urgency: newUrgency }))
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          filters.urgency.includes(level)
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                        aria-pressed={filters.urgency.includes(level)}
                        aria-label={`Filter by ${level} urgency`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Filter */}
                <div>
                  <label htmlFor="posted-within" className="block text-sm font-medium mb-2 text-gray-700">Posted Within</label>
                  <select
                    id="posted-within"
                    value={filters.postedWithin}
                    onChange={(e) => setFilters(prev => ({ ...prev, postedWithin: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    aria-label="Filter by posting time"
                  >
                    <option value="all">All Time</option>
                    <option value="1h">Last Hour</option>
                    <option value="24h">Last 24 Hours</option>
                    <option value="3d">Last 3 Days</option>
                    <option value="7d">Last Week</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.requiresVerification}
                    onChange={(e) => setFilters(prev => ({ ...prev, requiresVerification: e.target.checked }))}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    aria-label="Only show jobs from verified clients"
                  />
                  <span className="text-sm text-gray-700">Only verified clients</span>
                </label>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <Button variant="outline" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
                <div className="flex items-center gap-3">
                  <Button variant="outline" onClick={saveCurrentSearch}>
                    <Bookmark className="w-4 h-4 mr-2" />
                    Save Search
                  </Button>
                  <span className="text-sm text-gray-600">
                    Showing {jobStats.filtered} of {jobStats.total} jobs
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Saved Searches */}
        {savedSearches.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Saved Searches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {savedSearches.map((search, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => {/* Apply saved search filters */}}
                    className="text-gray-700 border-gray-300 hover:bg-gray-50"
                  >
                    <BookmarkCheck className="w-3 h-3 mr-1" />
                    {search}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Job Listings */}
        <div className="space-y-4">
          {filteredJobs.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredJobs.map((job) => (
                <Card key={job.id} className="hover:shadow-lg transition-all duration-200 relative group">
                  <button
                    onClick={() => toggleSaveJob(job.id)}
                    className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={savedJobs.has(job.id) ? 'Remove from saved jobs' : 'Save job'}
                  >
                    {savedJobs.has(job.id) ? (
                      <BookmarkCheck className="w-4 h-4 text-primary-600" />
                    ) : (
                      <Bookmark className="w-4 h-4 text-gray-600" />
                    )}
                  </button>

                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">{job.title}</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={`${getBadgeVariant(job.urgency)} border text-xs`}>
                        {job.urgency}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {job.category}
                      </Badge>
                      {job.requiresVerification && (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Verified Only
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="line-clamp-2 mt-2">
                      {job.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 flex items-center gap-1">
                        <DollarSign className="w-4 h-4" aria-hidden="true" />
                        Budget
                      </span>
                      <span className="font-semibold text-lg text-primary-600">{formatCurrency(job.budget)}</span>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="flex items-center gap-1 text-gray-600">
                        <MapPin className="w-4 h-4" aria-hidden="true" />
                        Location
                      </span>
                      <span className="text-gray-900 truncate ml-2">{job.location}</span>
                    </div>

                    {job.distance && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Distance</span>
                        <span className="text-gray-900">{formatDistance(job.distance)}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-sm">
                      <span className="flex items-center gap-1 text-gray-600">
                        <Clock className="w-4 h-4" aria-hidden="true" />
                        Posted
                      </span>
                      <span className="text-gray-900">{formatTimeAgo(job.postedAt)}</span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-primary-600" aria-hidden="true" />
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium text-gray-900">{job.client.name}</span>
                            {job.client.isVerified && (
                              <CheckCircle2 className="w-3 h-3 text-blue-600" aria-label="Verified client" />
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" aria-hidden="true" />
                            <span>{job.client.rating.toFixed(1)}</span>
                            <span>•</span>
                            <span>{job.client.completedJobs} jobs</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {job.requirements && job.requirements.length > 0 && (
                      <div className="pt-2">
                        <span className="text-sm text-gray-600 block mb-2">Requirements:</span>
                        <div className="flex flex-wrap gap-1">
                          {job.requirements.slice(0, 2).map((req, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {req}
                            </Badge>
                          ))}
                          {job.requirements.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{job.requirements.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="pt-3 space-y-2">
                      <Button
                        className="w-full bg-primary-600 hover:bg-primary-700"
                        aria-label={`Submit bid for ${job.title}`}
                        onClick={() => handleSubmitBid(job)}
                      >
                        Submit Bid
                      </Button>
                      <Button
                        className="w-full"
                        variant="outline"
                        size="sm"
                        aria-label={`View details for ${job.title}`}
                        onClick={() => handleViewDetails(job)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs match your filters</h3>
                <p className="text-gray-600 max-w-md mx-auto mb-4">
                  Try adjusting your filters or check back later for new jobs that match your criteria.
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedJob && (
        <>
          <BidModal
            job={selectedJob}
            isOpen={showBidModal}
            onClose={() => {
              setShowBidModal(false)
              setSelectedJob(null)
            }}
            onSuccess={handleBidSuccess}
          />
          <JobDetailsModal
            job={selectedJob}
            isOpen={showDetailsModal}
            onClose={() => {
              setShowDetailsModal(false)
              setSelectedJob(null)
            }}
            onBidClick={() => {
              setShowDetailsModal(false)
              setShowBidModal(true)
            }}
          />
        </>
      )}
    </div>
  )
}
