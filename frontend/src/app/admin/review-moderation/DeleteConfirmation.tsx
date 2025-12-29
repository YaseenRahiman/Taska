'use client';

import { useState } from 'react';
import { Review, DeleteReviewRequest } from '@/types/review-moderation.types';
import { Trash2, AlertTriangle, AlertCircle } from 'lucide-react';

interface DeleteConfirmationProps {
  review: Review;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reviewId: string, data: DeleteReviewRequest) => Promise<void>;
}

export default function DeleteConfirmation({ review, isOpen, onClose, onConfirm }: DeleteConfirmationProps) {
  const [reason, setReason] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    // Validate reason
    if (reason.trim().length < 10) {
      setError('Reason must be at least 10 characters');
      return;
    }
    if (reason.trim().length > 500) {
      setError('Reason must not exceed 500 characters');
      return;
    }

    // Validate confirmation text
    if (confirmText !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }

    setDeleting(true);
    try {
      await onConfirm(review.id, {
        reason: reason.trim(),
      });
      onClose();
    } catch (error) {
      console.error('Failed to delete review:', error);
      setError('Failed to delete review. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Delete Review</h2>
              <p className="text-sm text-gray-500">This action cannot be undone</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-semibold mb-1">Warning: Permanent Action</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>This is a soft delete - the review will be marked as deleted</li>
                  <li>The review will not be visible to users</li>
                  <li>The artisan's rating will be recalculated</li>
                  <li>This action will be logged in the audit trail</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Review Preview */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">Review to be deleted:</p>
            <p className="text-sm text-gray-900 line-clamp-3">{review.content}</p>
            <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
              <span>Rating: {review.rating}/5</span>
              <span>ID: {review.id.substring(0, 8)}</span>
            </div>
          </div>

          {/* Reason Input */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Deletion <span className="text-red-500">*</span>
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError('');
              }}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                error && error.includes('Reason') ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Explain why this review is being deleted..."
            />
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm text-gray-500">Required for audit trail (10-500 characters)</span>
              <span
                className={`text-sm ${reason.length > 500 ? 'text-red-600' : 'text-gray-500'}`}
              >
                {reason.length} / 500
              </span>
            </div>
          </div>

          {/* Confirmation Input */}
          <div>
            <label htmlFor="confirmText" className="block text-sm font-medium text-gray-700 mb-2">
              Type <span className="font-mono text-red-600">DELETE</span> to confirm
            </label>
            <input
              id="confirmText"
              type="text"
              value={confirmText}
              onChange={(e) => {
                setConfirmText(e.target.value);
                setError('');
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                error && error.includes('DELETE') ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Type DELETE to confirm"
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting || !reason.trim() || confirmText !== 'DELETE'}
            className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? 'Deleting...' : 'Delete Review'}
          </button>
        </div>
      </div>
    </div>
  );
}
