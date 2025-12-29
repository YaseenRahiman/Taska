'use client'

import React, { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  X,
  MapPin,
  DollarSign,
  Clock,
  Calendar,
  User,
  Star,
  CheckCircle2,
  AlertCircle,
  FileText,
  Image as ImageIcon,
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

interface Bid {
  id: string
  amount: number
  message: string
  estimatedDays: number
  status: string
  createdAt: string
}

interface JobDetailsModalProps {
  job: Job
  isOpen: boolean
  onClose: () => void
  onBidClick: () => void
}

export function JobDetailsModal({ job, isOpen, onClose, onBidClick }: JobDetailsModalProps) {
  const [myBid, setMyBid] = useState<Bid | null>(null)
  const [loadingBid, setLoadingBid] = useState(true)
  const [bidError, setBidError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchMyBidForJob()
    }
  }, [isOpen, job.id])

  const fetchMyBidForJob = async () => {
    setLoadingBid(true)
    setBidError(null)

    try {
      // Get all my bids and filter for this job
      const response = await api.get('/bids/my-bids')
      const bids = response.data.bids || response.data || []
      const jobBid = bids.find((bid: any) => bid.jobId === job.id || bid.job?.id === job.id)
      setMyBid(jobBid || null)
    } catch (error: any) {
      console.error('Error fetching bid:', error)
      if (error.response?.status !== 404) {
        setBidError('Failed to load bid information')
      }
      setMyBid(null)
    } finally {
      setLoadingBid(false)
    }
  }

  if (!isOpen) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const posted = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60))

    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} hours ago`
    } else {
      return `${Math.floor(diffInMinutes / 1440)} days ago`
    }
  }

  const getBadgeVariant = (urgency: string) => {
    switch (urgency) {
      case 'URGENT': return 'bg-red-100 text-red-800 border-red-200'
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getBidStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'ACCEPTED': return 'bg-green-100 text-green-800 border-green-200'
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200'
      case 'WITHDRAWN': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-start justify-between z-10">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={`${getBadgeVariant(job.urgency)} border text-xs`}>
                <Zap className="w-3 h-3 mr-1" />
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
            <h2 className="text-2xl font-bold text-gray-900">{job.title}</h2>
            <p className="text-sm text-gray-600 mt-1">Posted {formatTimeAgo(job.postedAt)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors ml-4"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Key Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm font-medium">Budget</span>
              </div>
              <p className="text-2xl font-bold text-primary-600">{formatCurrency(job.budget)}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <MapPin className="w-4 h-4" />
                <span className="text-sm font-medium">Location</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">{job.location}</p>
              {job.distance && (
                <p className="text-sm text-gray-600">{job.distance.toFixed(1)} km away</p>
              )}
            </div>
            {job.deadline && (
              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-medium">Deadline</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">{formatDate(job.deadline)}</p>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Job Description
            </h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{job.description}</p>
          </div>

          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Requirements
              </h3>
              <ul className="space-y-2">
                {job.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Images */}
          {job.images && job.images.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Images
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {job.images.map((img, idx) => (
                  <div key={idx} className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={img}
                      alt={`Job image ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Client Info */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Client Information</h3>
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-primary-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{job.client.name}</span>
                  {job.client.isVerified && (
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span>{job.client.rating.toFixed(1)}</span>
                  </div>
                  <span className="text-sm text-gray-600">•</span>
                  <span className="text-sm text-gray-600">{job.client.completedJobs} jobs completed</span>
                </div>
              </div>
            </div>
          </div>

          {/* My Bid Section */}
          {loadingBid ? (
            <div className="border-t border-gray-200 pt-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          ) : myBid ? (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Bid</h3>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Status</span>
                  <Badge className={`${getBidStatusBadge(myBid.status)} border`}>
                    {myBid.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Bid Amount</span>
                  <span className="text-lg font-bold text-primary-600">{formatCurrency(myBid.amount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Estimated Days</span>
                  <span className="text-lg font-semibold text-gray-900">{myBid.estimatedDays} days</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700 block mb-1">Your Message</span>
                  <p className="text-sm text-gray-600 bg-white p-3 rounded border border-blue-200">
                    {myBid.message}
                  </p>
                </div>
                <div className="text-xs text-gray-500 pt-2 border-t border-blue-200">
                  Submitted {formatTimeAgo(myBid.createdAt)}
                </div>
              </div>
            </div>
          ) : bidError ? (
            <div className="border-t border-gray-200 pt-6">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-700">{bidError}</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Close
          </Button>
          {!myBid && (
            <Button
              onClick={() => {
                onClose()
                onBidClick()
              }}
              className="flex-1 bg-primary-600 hover:bg-primary-700"
            >
              Submit Bid
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
