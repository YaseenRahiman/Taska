'use client';

import { useState } from 'react';
import { Review, ToggleVisibilityRequest } from '@/types/review-moderation.types';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

interface HideShowToggleProps {
  review: Review;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reviewId: string, data: ToggleVisibilityRequest) => Promise<void>;
}

export default function HideShowToggle({ review, isOpen, onClose, onConfirm }: HideShowToggleProps) {
  const isCurrentlyHidden = review.moderation?.status === 'HIDDEN';
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleConfirm = async () => {
    // Validate reason when hiding
    if (!isCurrentlyHidden && reason.trim().length < 10) {
      setError('Reason must be at least 10 characters when hiding a review');
      return;
    }
    if (reason.trim().length > 500) {
      setError('Reason must not exceed 500 characters');
      return;
    }

    setProcessing(true);
    try {
      await onConfirm(review.id, {
        visible: isCurrentlyHidden,
        reason: reason.trim() || 'Review visibility toggled',
      });
      onClose();
    } catch (error) {
      console.error('Failed to toggle visibility:', error);
      setError('Failed to update review visibility. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  const actionText = isCurrentlyHidden ? 'Show' : 'Hide';
  const Icon = isCurrentlyHidden ? Eye : EyeOff;

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
            <div className={`p-2 rounded-lg ${isCurrentlyHidden ? 'bg-green-100' : 'bg-yellow-100'}`}>
              <Icon className={`w-6 h-6 ${isCurrentlyHidden ? 'text-green-600' : 'text-yellow-600'}`} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{actionText} Review</h2>
              <p className="text-sm text-gray-500">
                {isCurrentlyHidden
                  ? 'Make this review visible to the public'
                  : 'Hide this review from public view'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Warning */}
          {!isCurrentlyHidden && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Hidden reviews are not visible to users but remain in the system.
                The artisan's rating will be recalculated without this review.
              </p>
            </div>
          )}

          {/* Info */}
          {isCurrentlyHidden && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                <strong>Note:</strong> Showing this review will make it visible to users and include it
                in the artisan's rating calculation.
              </p>
            </div>
          )}

          {/* Review Preview */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">Review Content:</p>
            <p className="text-sm text-gray-900 line-clamp-3">{review.content}</p>
          </div>

          {/* Reason Input */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
              Reason {!isCurrentlyHidden && <span className="text-red-500">*</span>}
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError('');
              }}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={`Explain why you are ${actionText.toLowerCase()}ing this review...`}
            />
            <div className="flex items-center justify-between mt-1">
              {error ? (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </p>
              ) : (
                <span className="text-sm text-gray-500">
                  {!isCurrentlyHidden ? 'Required (10-500 characters)' : 'Optional'}
                </span>
              )}
              <span
                className={`text-sm ${reason.length > 500 ? 'text-red-600' : 'text-gray-500'}`}
              >
                {reason.length} / 500
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={processing}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={processing}
            className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isCurrentlyHidden
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-yellow-600 hover:bg-yellow-700'
            }`}
          >
            {processing ? 'Processing...' : `${actionText} Review`}
          </button>
        </div>
      </div>
    </div>
  );
}
