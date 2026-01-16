'use client'

import React, { useState } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { X, Star, CheckCircle2, AlertCircle, MessageSquare, Clock, Wrench, DollarSign } from 'lucide-react'
import { ConfirmCompletionDto, ConfirmCompletionResponse } from '@/types/job'

interface JobCompletionConfirmModalProps {
  jobId: string
  jobTitle: string
  isClient: boolean // True if current user is the client
  otherPartyName: string // Name of the other party (artisan/client)
  otherPartyConfirmed?: boolean // Whether the other party has already confirmed
  isOpen: boolean
  onClose: () => void
  onSuccess?: (response: ConfirmCompletionResponse) => void
}

interface RatingField {
  key: keyof Omit<ConfirmCompletionDto, 'feedback'>
  label: string
  icon: React.ElementType
  description: string
}

const ratingFields: RatingField[] = [
  {
    key: 'rating',
    label: 'Overall Rating',
    icon: Star,
    description: 'Overall experience'
  },
  {
    key: 'qualityRating',
    label: 'Quality',
    icon: Wrench,
    description: 'Quality of work/service'
  },
  {
    key: 'timelinessRating',
    label: 'Timeliness',
    icon: Clock,
    description: 'Completed on time'
  },
  {
    key: 'communicationRating',
    label: 'Communication',
    icon: MessageSquare,
    description: 'Responsiveness and clarity'
  },
  {
    key: 'valueRating',
    label: 'Value',
    icon: DollarSign,
    description: 'Value for money'
  }
]

export function JobCompletionConfirmModal({
  jobId,
  jobTitle,
  isClient,
  otherPartyName,
  otherPartyConfirmed = false,
  isOpen,
  onClose,
  onSuccess
}: JobCompletionConfirmModalProps) {
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [feedback, setFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [hoveredRating, setHoveredRating] = useState<{ field: string; value: number } | null>(null)

  if (!isOpen) return null

  const handleRatingClick = (field: string, value: number) => {
    setRatings(prev => ({ ...prev, [field]: value }))
  }

  const getDisplayRating = (field: string) => {
    if (hoveredRating?.field === field) {
      return hoveredRating.value
    }
    return ratings[field] || 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    setSubmitting(true)

    try {
      const confirmationData: ConfirmCompletionDto = {}

      // Add ratings if provided
      if (ratings.rating) confirmationData.rating = ratings.rating
      if (ratings.qualityRating) confirmationData.qualityRating = ratings.qualityRating
      if (ratings.timelinessRating) confirmationData.timelinessRating = ratings.timelinessRating
      if (ratings.communicationRating) confirmationData.communicationRating = ratings.communicationRating
      if (ratings.valueRating) confirmationData.valueRating = ratings.valueRating
      if (feedback.trim()) confirmationData.feedback = feedback.trim()

      const response = await api.confirmJobCompletion(jobId, confirmationData)

      setSubmitSuccess(true)

      // Show success message briefly then close
      setTimeout(() => {
        onSuccess?.(response)
        onClose()
        // Reset form
        setRatings({})
        setFeedback('')
        setSubmitSuccess(false)
      }, 2000)
    } catch (error: any) {
      console.error('Error confirming job completion:', error)

      if (error.response?.data?.message) {
        setSubmitError(error.response.data.message)
      } else if (error.response?.status === 400) {
        setSubmitError('Unable to confirm completion. The job may not be in progress or you may have already confirmed.')
      } else if (error.response?.status === 403) {
        setSubmitError('You are not authorized to confirm this job completion.')
      } else if (error.response?.status === 404) {
        setSubmitError('Job not found.')
      } else {
        setSubmitError('Failed to confirm completion. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const renderStars = (field: string) => {
    const displayValue = getDisplayRating(field)

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(value => (
          <button
            key={value}
            type="button"
            onClick={() => handleRatingClick(field, value)}
            onMouseEnter={() => setHoveredRating({ field, value })}
            onMouseLeave={() => setHoveredRating(null)}
            className="p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
            disabled={submitting || submitSuccess}
          >
            <Star
              className={`w-6 h-6 transition-colors ${
                value <= displayValue
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300 hover:text-yellow-200'
              }`}
            />
          </button>
        ))}
        {ratings[field] && (
          <span className="ml-2 text-sm text-gray-600">{ratings[field]}/5</span>
        )}
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Confirm Job Completion</h2>
            <p className="text-sm text-gray-600 mt-1">{jobTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Status Banner */}
        {otherPartyConfirmed && (
          <div className="mx-6 mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900">{otherPartyName} has confirmed</h3>
              <p className="text-sm text-blue-700 mt-1">
                Once you confirm, the job will be marked as completed and payment will be released.
              </p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {submitSuccess && (
          <div className="mx-6 mt-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-green-900">Confirmation Recorded!</h3>
              <p className="text-sm text-green-700 mt-1">
                {otherPartyConfirmed
                  ? 'Job completed! Payment is being released.'
                  : `Waiting for ${otherPartyName} to confirm.`}
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {submitError && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-900">Confirmation Failed</h3>
              <p className="text-sm text-red-700 mt-1">{submitError}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          {/* Info Text */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              <strong>How it works:</strong> Both parties must confirm completion before the job is
              marked as done and payment is released. You can optionally rate and provide feedback
              for {isClient ? 'the artisan' : 'the client'}.
            </p>
          </div>

          {/* Rating Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Rate {isClient ? 'the artisan' : 'the client'} (Optional)
            </h3>
            <p className="text-sm text-gray-600">
              Your rating helps build trust in the community.
            </p>

            <div className="space-y-4">
              {ratingFields.map(({ key, label, icon: Icon, description }) => (
                <div
                  key={key}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{label}</p>
                      <p className="text-xs text-gray-500">{description}</p>
                    </div>
                  </div>
                  {renderStars(key)}
                </div>
              ))}
            </div>
          </div>

          {/* Feedback */}
          <div>
            <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
              <MessageSquare className="w-4 h-4 inline mr-1" />
              Feedback (Optional)
            </label>
            <textarea
              id="feedback"
              rows={4}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={`Share your experience with ${otherPartyName}...`}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              disabled={submitting || submitSuccess}
              maxLength={1000}
            />
            <p className="mt-1 text-xs text-gray-500">
              {feedback.length}/1000 characters
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
              {submitting
                ? 'Confirming...'
                : submitSuccess
                ? 'Confirmed!'
                : 'Confirm Completion'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
