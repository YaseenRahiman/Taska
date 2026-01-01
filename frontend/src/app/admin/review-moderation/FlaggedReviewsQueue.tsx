'use client';

import { useState } from 'react';
import { Review } from '@/types/review-moderation.types';
import { Eye, Edit, Trash2, Star, AlertTriangle, Clock } from 'lucide-react';

interface FlaggedReviewsQueueProps {
  reviews: Review[];
  onViewDetails: (review: Review) => void;
  onEdit: (review: Review) => void;
  onToggleVisibility: (review: Review) => void;
  onDelete: (review: Review) => void;
  selectedReviews: string[];
  onSelectReview: (reviewId: string) => void;
  onSelectAll: (selected: boolean) => void;
}

export default function FlaggedReviewsQueue({
  reviews,
  onViewDetails,
  onEdit,
  onToggleVisibility,
  onDelete,
  selectedReviews,
  onSelectReview,
  onSelectAll,
}: FlaggedReviewsQueueProps) {
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());

  const toggleExpanded = (reviewId: string) => {
    const newExpanded = new Set(expandedReviews);
    if (newExpanded.has(reviewId)) {
      newExpanded.delete(reviewId);
    } else {
      newExpanded.add(reviewId);
    }
    setExpandedReviews(newExpanded);
  };

  const getFlagCountColor = (count: number) => {
    if (count === 0) return 'text-green-600 bg-green-50';
    if (count <= 2) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getStatusBadge = (review: Review) => {
    const status = review.moderation?.status || 'VISIBLE';
    const colors = {
      VISIBLE: 'bg-green-100 text-green-800',
      HIDDEN: 'bg-yellow-100 text-yellow-800',
      DELETED: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status]}`}>
        {status}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const allSelected = reviews.length > 0 && reviews.every(r => selectedReviews.includes(r.id));
  const someSelected = selectedReviews.length > 0 && !allSelected;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="w-12 px-6 py-3 text-left">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(input) => {
                  if (input) input.indeterminate = someSelected;
                }}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                aria-label="Select all reviews"
              />
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Reviewer
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Artisan
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rating
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Content Preview
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Flags
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {reviews.length === 0 ? (
            <tr>
              <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">No flagged reviews found</p>
                <p className="text-sm mt-2">Try adjusting your filters</p>
              </td>
            </tr>
          ) : (
            reviews.map((review) => {
              const isExpanded = expandedReviews.has(review.id);
              const flagCount = review.moderation?.flagCount || 0;
              const reviewerName = review.reviewer.profile
                ? `${review.reviewer.profile.firstName || ''} ${review.reviewer.profile.lastName || ''}`.trim()
                : review.reviewer.email;
              const artisanName = review.artisan.profile?.businessName ||
                (review.artisan.profile
                  ? `${review.artisan.profile.firstName || ''} ${review.artisan.profile.lastName || ''}`.trim()
                  : review.artisan.email);

              return (
                <tr
                  key={review.id}
                  className={`hover:bg-gray-50 transition-colors ${
                    selectedReviews.includes(review.id) ? 'bg-blue-50' : ''
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedReviews.includes(review.id)}
                      onChange={() => onSelectReview(review.id)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      aria-label={`Select review ${review.id}`}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {review.id.substring(0, 8)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{reviewerName}</div>
                    <div className="text-xs text-gray-500">{review.reviewer.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{artisanName}</div>
                    <div className="text-xs text-gray-500">{review.artisan.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="ml-1 text-sm font-medium text-gray-900">
                        {review.rating}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 max-w-md">
                    <div className="text-sm text-gray-900">
                      {isExpanded ? review.content : truncateContent(review.content)}
                    </div>
                    {review.content.length > 100 && (
                      <button
                        onClick={() => toggleExpanded(review.id)}
                        className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                      >
                        {isExpanded ? 'Show less' : 'Show more'}
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getFlagCountColor(
                        flagCount
                      )}`}
                    >
                      <AlertTriangle className="w-3 h-3" />
                      {flagCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(review)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>{formatDate(review.createdAt)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onViewDetails(review)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                        title="View details"
                        aria-label="View review details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEdit(review)}
                        className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                        title="Edit review (Alt+E)"
                        aria-label="Edit review"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onToggleVisibility(review)}
                        className="text-yellow-600 hover:text-yellow-900 p-1 rounded hover:bg-yellow-50 transition-colors"
                        title={`${review.moderation?.status === 'HIDDEN' ? 'Show' : 'Hide'} review (Alt+H)`}
                        aria-label="Toggle visibility"
                      >
                        <Eye className={`w-4 h-4 ${review.moderation?.status === 'HIDDEN' ? 'opacity-50' : ''}`} />
                      </button>
                      <button
                        onClick={() => onDelete(review)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                        title="Delete review (Alt+D)"
                        aria-label="Delete review"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
