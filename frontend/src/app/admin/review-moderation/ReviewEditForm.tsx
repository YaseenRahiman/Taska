'use client';

import { useState } from 'react';
import { Review, EditReviewRequest } from '@/types/review-moderation.types';
import { Star, AlertCircle } from 'lucide-react';

interface ReviewEditFormProps {
  review: Review;
  isOpen: boolean;
  onClose: () => void;
  onSave: (reviewId: string, data: EditReviewRequest) => Promise<void>;
}

export default function ReviewEditForm({ review, isOpen, onClose, onSave }: ReviewEditFormProps) {
  const [formData, setFormData] = useState({
    content: review.content,
    rating: review.rating,
    editReason: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.content.trim().length < 10) {
      newErrors.content = 'Content must be at least 10 characters';
    }
    if (formData.content.trim().length > 1000) {
      newErrors.content = 'Content must not exceed 1000 characters';
    }
    if (formData.rating < 1 || formData.rating > 5) {
      newErrors.rating = 'Rating must be between 1 and 5';
    }
    if (formData.editReason.trim().length < 10) {
      newErrors.editReason = 'Edit reason must be at least 10 characters';
    }
    if (formData.editReason.trim().length > 500) {
      newErrors.editReason = 'Edit reason must not exceed 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      await onSave(review.id, {
        content: formData.content.trim(),
        rating: formData.rating,
        editReason: formData.editReason.trim(),
      });
      onClose();
    } catch (error) {
      console.error('Failed to save review:', error);
      setErrors({ submit: 'Failed to save review. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const contentLength = formData.content.length;
  const editReasonLength = formData.editReason.length;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Review</h2>
          <p className="text-sm text-gray-500 mt-1">Make changes to the review content and rating</p>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({ ...formData, rating: star })}
                  className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= formData.rating
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300 hover:text-yellow-200'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-lg font-semibold text-gray-900">{formData.rating} / 5</span>
            </div>
            {errors.rating && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.rating}
              </p>
            )}
          </div>

          {/* Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              Review Content <span className="text-red-500">*</span>
            </label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={6}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.content ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter review content..."
            />
            <div className="flex items-center justify-between mt-1">
              {errors.content ? (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.content}
                </p>
              ) : (
                <span className="text-sm text-gray-500">Minimum 10 characters</span>
              )}
              <span
                className={`text-sm ${
                  contentLength > 1000 ? 'text-red-600' : 'text-gray-500'
                }`}
              >
                {contentLength} / 1000
              </span>
            </div>
          </div>

          {/* Edit Reason */}
          <div>
            <label htmlFor="editReason" className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Edit <span className="text-red-500">*</span>
            </label>
            <textarea
              id="editReason"
              value={formData.editReason}
              onChange={(e) => setFormData({ ...formData, editReason: e.target.value })}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.editReason ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Explain why this review is being edited..."
            />
            <div className="flex items-center justify-between mt-1">
              {errors.editReason ? (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.editReason}
                </p>
              ) : (
                <span className="text-sm text-gray-500">Required for audit trail</span>
              )}
              <span
                className={`text-sm ${
                  editReasonLength > 500 ? 'text-red-600' : 'text-gray-500'
                }`}
              >
                {editReasonLength} / 500
              </span>
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {errors.submit}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
