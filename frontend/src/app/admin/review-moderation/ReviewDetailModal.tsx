'use client';

import { useState, useEffect } from 'react';
import { Review } from '@/types/review-moderation.types';
import { reviewModerationApi } from '@/lib/api/review-moderation';
import { X, User, Briefcase, Star, Flag, Clock, FileText, Edit as EditIcon } from 'lucide-react';
import EditHistoryDisplay from './EditHistoryDisplay';
import ModerationNotes from './ModerationNotes';

interface ReviewDetailModalProps {
  review: Review | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ReviewDetailModal({ review, isOpen, onClose }: ReviewDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'flags' | 'history' | 'notes'>('details');
  const [editHistory, setEditHistory] = useState([]);
  const [moderationNotes, setModerationNotes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (review && isOpen) {
      loadAdditionalData();
    }
  }, [review, isOpen]);

  const loadAdditionalData = async () => {
    if (!review) return;

    setLoading(true);
    try {
      const [history, notes] = await Promise.all([
        reviewModerationApi.getEditHistory(review.id),
        reviewModerationApi.getModerationNotes(review.id),
      ]);
      setEditHistory(history);
      setModerationNotes(notes);
    } catch (error) {
      console.error('Failed to load additional data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadAdditionalData();
  };

  if (!isOpen || !review) return null;

  const reviewerName = review.reviewer.profile
    ? `${review.reviewer.profile.firstName || ''} ${review.reviewer.profile.lastName || ''}`.trim()
    : review.reviewer.email;

  const artisanName = review.artisan.profile?.businessName ||
    (review.artisan.profile
      ? `${review.artisan.profile.firstName || ''} ${review.artisan.profile.lastName || ''}`.trim()
      : review.artisan.email);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Review Details</h2>
            <p className="text-sm text-gray-500 font-mono">ID: {review.id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'details', label: 'Details', icon: FileText },
              { id: 'flags', label: 'Flags', icon: Flag, count: review.moderation?.flagCount || 0 },
              { id: 'history', label: 'Edit History', icon: EditIcon, count: editHistory.length },
              { id: 'notes', label: 'Moderation Notes', icon: User, count: moderationNotes.length },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                    transition-colors
                    ${isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="ml-1 px-2 py-0.5 text-xs font-semibold bg-gray-200 text-gray-700 rounded-full">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Rating and Content */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Rating</h3>
                <div className="flex items-center gap-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-6 h-6 ${
                        i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-lg font-semibold text-gray-900">{review.rating} / 5</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Review Content</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-900 whitespace-pre-wrap">{review.content}</p>
                </div>
              </div>

              {/* Reviewer Details */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Reviewer
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Name:</span>
                    <span className="text-sm font-medium text-gray-900">{reviewerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Email:</span>
                    <span className="text-sm font-medium text-gray-900">{review.reviewer.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">ID:</span>
                    <span className="text-sm font-mono text-gray-900">{review.reviewerId}</span>
                  </div>
                </div>
              </div>

              {/* Artisan Details */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Artisan
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Name:</span>
                    <span className="text-sm font-medium text-gray-900">{artisanName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Email:</span>
                    <span className="text-sm font-medium text-gray-900">{review.artisan.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">ID:</span>
                    <span className="text-sm font-mono text-gray-900">{review.artisanId}</span>
                  </div>
                </div>
              </div>

              {/* Job Details */}
              {review.job && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Job/Project</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Title:</span>
                      <span className="text-sm font-medium text-gray-900">{review.job.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">ID:</span>
                      <span className="text-sm font-mono text-gray-900">{review.jobId}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Timestamps
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Created:</span>
                    <span className="text-sm font-medium text-gray-900">{formatDate(review.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Updated:</span>
                    <span className="text-sm font-medium text-gray-900">{formatDate(review.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'flags' && (
            <div className="space-y-4">
              {review.moderation?.flags && review.moderation.flags.length > 0 ? (
                review.moderation.flags.map((flag) => (
                  <div key={flag.id} className="bg-gray-50 p-4 rounded-lg border-l-4 border-red-500">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Flag className="w-4 h-4 text-red-600" />
                        <span className="font-medium text-gray-900">{flag.reason}</span>
                      </div>
                      <span className="text-xs text-gray-500">{formatDate(flag.createdAt)}</span>
                    </div>
                    {flag.description && (
                      <p className="text-sm text-gray-700 mt-2">{flag.description}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">Flagged by: {flag.flaggedBy}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Flag className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No flags on this review</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <EditHistoryDisplay history={editHistory} loading={loading} />
          )}

          {activeTab === 'notes' && (
            <ModerationNotes
              reviewId={review.id}
              notes={moderationNotes}
              onNoteAdded={handleRefresh}
            />
          )}
        </div>
      </div>
    </div>
  );
}
