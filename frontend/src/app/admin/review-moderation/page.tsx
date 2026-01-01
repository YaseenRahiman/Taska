'use client';

import { useState, useEffect, useCallback } from 'react';
import { Review, FlaggedReviewsFilters, EditReviewRequest, ToggleVisibilityRequest, DeleteReviewRequest } from '@/types/review-moderation.types';
import { reviewModerationApi } from '@/lib/api/review-moderation';
import FlaggedReviewsQueue from './FlaggedReviewsQueue';
import ReviewDetailModal from './ReviewDetailModal';
import ReviewEditForm from './ReviewEditForm';
import HideShowToggle from './HideShowToggle';
import DeleteConfirmation from './DeleteConfirmation';
import ReviewFilters from './ReviewFilters';
import ReviewSearch from './ReviewSearch';
import { Download, AlertTriangle, CheckCircle, XCircle, Eye, Loader } from 'lucide-react';

export default function ReviewModerationPage() {
  // State
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Filters and Search
  const [filters, setFilters] = useState<FlaggedReviewsFilters>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Selection
  const [selectedReviews, setSelectedReviews] = useState<string[]>([]);

  // Modals
  const [detailModal, setDetailModal] = useState<{ isOpen: boolean; review: Review | null }>({
    isOpen: false,
    review: null,
  });
  const [editModal, setEditModal] = useState<{ isOpen: boolean; review: Review | null }>({
    isOpen: false,
    review: null,
  });
  const [hideShowModal, setHideShowModal] = useState<{ isOpen: boolean; review: Review | null }>({
    isOpen: false,
    review: null,
  });
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; review: Review | null }>({
    isOpen: false,
    review: null,
  });

  // Statistics
  const [stats, setStats] = useState({
    totalFlagged: 0,
    visible: 0,
    hidden: 0,
    deleted: 0,
  });

  // Load reviews
  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await reviewModerationApi.getFlaggedReviews({
        ...filters,
        search: searchQuery || undefined,
        page: pagination.page,
        limit: pagination.limit,
      });

      setReviews(data.reviews);
      setPagination({
        page: data.page,
        limit: data.limit,
        total: data.total,
        totalPages: data.totalPages,
      });
    } catch (err: any) {
      console.error('Failed to load reviews:', err);
      setError(err.response?.data?.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [filters, searchQuery, pagination.page, pagination.limit]);

  // Load statistics
  const loadStatistics = useCallback(async () => {
    try {
      const data = await reviewModerationApi.getStatistics();
      setStats(data);
    } catch (err) {
      console.error('Failed to load statistics:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadReviews();
    loadStatistics();
  }, [loadReviews, loadStatistics]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        if (e.key === 'e' && selectedReviews.length === 1) {
          e.preventDefault();
          const review = reviews.find(r => r.id === selectedReviews[0]);
          if (review) handleEdit(review);
        } else if (e.key === 'h' && selectedReviews.length === 1) {
          e.preventDefault();
          const review = reviews.find(r => r.id === selectedReviews[0]);
          if (review) handleToggleVisibility(review);
        } else if (e.key === 'd' && selectedReviews.length === 1) {
          e.preventDefault();
          const review = reviews.find(r => r.id === selectedReviews[0]);
          if (review) handleDelete(review);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedReviews, reviews]);

  // Handlers
  const handleViewDetails = (review: Review) => {
    setDetailModal({ isOpen: true, review });
  };

  const handleEdit = (review: Review) => {
    setEditModal({ isOpen: true, review });
  };

  const handleToggleVisibility = (review: Review) => {
    setHideShowModal({ isOpen: true, review });
  };

  const handleDelete = (review: Review) => {
    setDeleteModal({ isOpen: true, review });
  };

  const handleSaveEdit = async (reviewId: string, data: EditReviewRequest) => {
    await reviewModerationApi.editReview(reviewId, data);
    await loadReviews();
    await loadStatistics();
  };

  const handleConfirmToggleVisibility = async (reviewId: string, data: ToggleVisibilityRequest) => {
    await reviewModerationApi.toggleVisibility(reviewId, data);
    await loadReviews();
    await loadStatistics();
  };

  const handleConfirmDelete = async (reviewId: string, data: DeleteReviewRequest) => {
    await reviewModerationApi.deleteReview(reviewId, data);
    await loadReviews();
    await loadStatistics();
  };

  const handleSelectReview = (reviewId: string) => {
    setSelectedReviews(prev =>
      prev.includes(reviewId)
        ? prev.filter(id => id !== reviewId)
        : [...prev, reviewId]
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedReviews(selected ? reviews.map(r => r.id) : []);
  };

  const handleFiltersChange = (newFilters: FlaggedReviewsFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleExport = async () => {
    try {
      const blob = await reviewModerationApi.exportFlaggedReviews({
        filters,
        format: 'CSV',
      });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `flagged-reviews-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export reviews:', err);
      alert('Failed to export reviews');
    }
  };

  const handleBatchAction = async (action: 'HIDE' | 'SHOW' | 'DELETE') => {
    if (selectedReviews.length === 0) return;

    const reason = prompt(`Enter reason for batch ${action.toLowerCase()}:`);
    if (!reason) return;

    try {
      await reviewModerationApi.batchModeration({
        reviewIds: selectedReviews,
        action,
        reason,
      });
      setSelectedReviews([]);
      await loadReviews();
      await loadStatistics();
    } catch (err) {
      console.error('Batch action failed:', err);
      alert('Batch action failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-600" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <a href="/admin/dashboard" className="hover:text-gray-900 transition-colors">
                Admin
              </a>
            </li>
            <li className="flex items-center">
              <span className="mx-2">/</span>
              <span className="font-medium text-gray-900">Review Moderation</span>
            </li>
          </ol>
        </nav>

        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Review Moderation</h1>
          <p className="mt-2 text-gray-600">
            Manage flagged reviews, edit content, and moderate review visibility
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Flagged</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalFlagged}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Visible</p>
                <p className="text-2xl font-bold text-green-600">{stats.visible}</p>
              </div>
              <Eye className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Hidden</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.hidden}</p>
              </div>
              <XCircle className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Deleted</p>
                <p className="text-2xl font-bold text-red-600">{stats.deleted}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Search */}
        <ReviewSearch
          value={searchQuery}
          onChange={handleSearchChange}
          onClear={handleClearSearch}
        />

        {/* Filters */}
        <ReviewFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClear={handleClearFilters}
        />

        {/* Batch Actions */}
        {selectedReviews.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-blue-900">
                {selectedReviews.length} review{selectedReviews.length !== 1 ? 's' : ''} selected
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBatchAction('HIDE')}
                  className="px-3 py-1.5 text-sm text-yellow-700 bg-yellow-100 rounded-lg hover:bg-yellow-200 transition-colors"
                >
                  Hide Selected
                </button>
                <button
                  onClick={() => handleBatchAction('SHOW')}
                  className="px-3 py-1.5 text-sm text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
                >
                  Show Selected
                </button>
                <button
                  onClick={() => handleBatchAction('DELETE')}
                  className="px-3 py-1.5 text-sm text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
                >
                  Delete Selected
                </button>
                <button
                  onClick={handleExport}
                  className="px-3 py-1.5 text-sm text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reviews Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-600">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
              <p>{error}</p>
              <button
                onClick={loadReviews}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : (
            <FlaggedReviewsQueue
              reviews={reviews}
              onViewDetails={handleViewDetails}
              onEdit={handleEdit}
              onToggleVisibility={handleToggleVisibility}
              onDelete={handleDelete}
              selectedReviews={selectedReviews}
              onSelectReview={handleSelectReview}
              onSelectAll={handleSelectAll}
            />
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between bg-white px-4 py-3 border border-gray-200 rounded-lg">
            <div className="text-sm text-gray-700">
              Showing{' '}
              <span className="font-medium">
                {(pagination.page - 1) * pagination.limit + 1}
              </span>{' '}
              to{' '}
              <span className="font-medium">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{' '}
              of <span className="font-medium">{pagination.total}</span> results
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {[...Array(pagination.totalPages)].map((_, i) => {
                const page = i + 1;
                if (
                  page === 1 ||
                  page === pagination.totalPages ||
                  (page >= pagination.page - 1 && page <= pagination.page + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1.5 text-sm rounded-lg ${
                        page === pagination.page
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (page === pagination.page - 2 || page === pagination.page + 2) {
                  return <span key={page} className="px-2">...</span>;
                }
                return null;
              })}
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Keyboard Shortcuts Help */}
        <div className="text-xs text-gray-500 text-center bg-white p-3 rounded-lg border border-gray-200">
          <p>
            Keyboard shortcuts: Alt+E (Edit), Alt+H (Hide/Show), Alt+D (Delete) - works when one review is selected
          </p>
        </div>
      </div>

      {/* Modals */}
      <ReviewDetailModal
        review={detailModal.review}
        isOpen={detailModal.isOpen}
        onClose={() => setDetailModal({ isOpen: false, review: null })}
      />

      {editModal.review && (
        <ReviewEditForm
          review={editModal.review}
          isOpen={editModal.isOpen}
          onClose={() => setEditModal({ isOpen: false, review: null })}
          onSave={handleSaveEdit}
        />
      )}

      {hideShowModal.review && (
        <HideShowToggle
          review={hideShowModal.review}
          isOpen={hideShowModal.isOpen}
          onClose={() => setHideShowModal({ isOpen: false, review: null })}
          onConfirm={handleConfirmToggleVisibility}
        />
      )}

      {deleteModal.review && (
        <DeleteConfirmation
          review={deleteModal.review}
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, review: null })}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}
