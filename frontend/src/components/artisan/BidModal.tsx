'use client'

import React, { useState } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { X, DollarSign, Clock, FileText, AlertCircle, CheckCircle2 } from 'lucide-react'

interface Job {
  id: string
  title: string
  description: string
  category: string
  budget: number
  location: string
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  client: {
    name: string
    rating: number
    completedJobs: number
    isVerified: boolean
  }
}

interface BidModalProps {
  job: Job
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface BidFormData {
  amount: string
  message: string
  estimatedDays: string
}

interface FormErrors {
  amount?: string
  message?: string
  estimatedDays?: string
}

/**
 * Validates if a job ID is a valid Prisma CUID format.
 * CUIDs are 25+ character strings, not simple numeric IDs.
 */
function isValidJobId(id: string): boolean {
  // Prisma CUIDs are at least 25 characters and contain alphanumeric characters
  // Simple numeric IDs like '1', '2', '3' are invalid
  if (!id || id.length < 20) {
    return false
  }
  // CUIDs should not be purely numeric
  if (/^\d+$/.test(id)) {
    return false
  }
  return true
}

export function BidModal({ job, isOpen, onClose, onSuccess }: BidModalProps) {
  const [formData, setFormData] = useState<BidFormData>({
    amount: '',
    message: '',
    estimatedDays: ''
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  if (!isOpen) return null

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Amount validation
    const amount = parseFloat(formData.amount)
    if (!formData.amount || isNaN(amount)) {
      newErrors.amount = 'Amount is required'
    } else if (amount < 50) {
      newErrors.amount = 'Minimum bid amount is R50'
    } else if (amount > job.budget * 2) {
      newErrors.amount = `Amount should not exceed double the budget (R${job.budget * 2})`
    }

    // Message validation
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required'
    } else if (formData.message.trim().length < 50) {
      newErrors.message = 'Message must be at least 50 characters'
    } else if (formData.message.trim().length > 1000) {
      newErrors.message = 'Message must not exceed 1000 characters'
    }

    // Estimated days validation
    const days = parseInt(formData.estimatedDays)
    if (!formData.estimatedDays || isNaN(days)) {
      newErrors.estimatedDays = 'Estimated days is required'
    } else if (days < 1) {
      newErrors.estimatedDays = 'Minimum estimated days is 1'
    } else if (days > 365) {
      newErrors.estimatedDays = 'Maximum estimated days is 365'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    setSubmitSuccess(false)

    if (!validateForm()) {
      return
    }

    // Validate job ID format before API submission
    if (!isValidJobId(job.id)) {
      setSubmitError('Invalid job ID format. Please refresh the page and try again.')
      return
    }

    setSubmitting(true)

    try {
      const bidData = {
        jobId: job.id,
        amount: parseFloat(formData.amount),
        message: formData.message.trim(),
        estimatedDays: parseInt(formData.estimatedDays)
      }

      await api.createBid(bidData)

      setSubmitSuccess(true)

      // Show success message briefly then close
      setTimeout(() => {
        onSuccess?.()
        onClose()
        // Reset form
        setFormData({
          amount: '',
          message: '',
          estimatedDays: ''
        })
        setSubmitSuccess(false)
      }, 2000)
    } catch (error: any) {
      console.error('Error submitting bid:', error)

      if (error.response?.data?.message) {
        setSubmitError(error.response.data.message)
      } else if (error.response?.status === 400) {
        setSubmitError('Invalid bid data. Please check your inputs.')
      } else if (error.response?.status === 403) {
        setSubmitError('You are not authorized to submit bids. Please ensure you are logged in as an artisan.')
      } else if (error.response?.status === 404) {
        setSubmitError('Job not found. It may have been closed or removed.')
      } else {
        setSubmitError('Failed to submit bid. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof BidFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Submit Bid</h2>
            <p className="text-sm text-gray-600 mt-1">{job.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Success Message */}
        {submitSuccess && (
          <div className="mx-6 mt-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-green-900">Bid Submitted Successfully!</h3>
              <p className="text-sm text-green-700 mt-1">Your bid has been sent to the client.</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {submitError && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-900">Submission Failed</h3>
              <p className="text-sm text-red-700 mt-1">{submitError}</p>
            </div>
          </div>
        )}

        {/* Job Info */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-600">Budget</span>
              <p className="text-lg font-semibold text-gray-900">{formatCurrency(job.budget)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Category</span>
              <p className="text-lg font-semibold text-gray-900">{job.category}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          {/* Bid Amount */}
          <div>
            <label htmlFor="bid-amount" className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="w-4 h-4 inline mr-1" />
              Bid Amount (ZAR) *
            </label>
            <input
              id="bid-amount"
              type="number"
              step="0.01"
              min="50"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              placeholder="Enter your bid amount"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.amount ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={submitting || submitSuccess}
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Client budget: {formatCurrency(job.budget)} • Minimum: R50
            </p>
          </div>

          {/* Estimated Days */}
          <div>
            <label htmlFor="estimated-days" className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Estimated Completion Time (Days) *
            </label>
            <input
              id="estimated-days"
              type="number"
              min="1"
              max="365"
              value={formData.estimatedDays}
              onChange={(e) => handleInputChange('estimatedDays', e.target.value)}
              placeholder="Number of days to complete"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.estimatedDays ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={submitting || submitSuccess}
            />
            {errors.estimatedDays && (
              <p className="mt-1 text-sm text-red-600">{errors.estimatedDays}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              How many days will you need to complete this job?
            </p>
          </div>

          {/* Message */}
          <div>
            <label htmlFor="bid-message" className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Proposal Message *
            </label>
            <textarea
              id="bid-message"
              rows={6}
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              placeholder="Explain your proposal, experience, and why you're the best fit for this job..."
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none ${
                errors.message ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={submitting || submitSuccess}
            />
            {errors.message && (
              <p className="mt-1 text-sm text-red-600">{errors.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.message.length}/1000 characters • Minimum 50 characters required
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={submitting || submitSuccess}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary-600 hover:bg-primary-700"
              disabled={submitting || submitSuccess}
            >
              {submitting ? 'Submitting...' : submitSuccess ? 'Submitted!' : 'Submit Bid'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
