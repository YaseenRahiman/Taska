'use client';

import { useState } from 'react';
import { FlaggedReviewsFilters, ReviewStatus, FlagReason } from '@/types/review-moderation.types';
import { Filter, X, Calendar } from 'lucide-react';

interface ReviewFiltersProps {
  filters: FlaggedReviewsFilters;
  onFiltersChange: (filters: FlaggedReviewsFilters) => void;
  onClear: () => void;
}

export default function ReviewFilters({ filters, onFiltersChange, onClear }: ReviewFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusOptions: { value: ReviewStatus; label: string }[] = [
    { value: 'VISIBLE', label: 'Visible' },
    { value: 'HIDDEN', label: 'Hidden' },
    { value: 'DELETED', label: 'Deleted' },
  ];

  const flagReasonOptions: { value: FlagReason; label: string }[] = [
    { value: 'SPAM', label: 'Spam' },
    { value: 'INAPPROPRIATE', label: 'Inappropriate' },
    { value: 'FAKE', label: 'Fake' },
    { value: 'OFFENSIVE', label: 'Offensive' },
    { value: 'OTHER', label: 'Other' },
  ];

  const handleFilterChange = (key: keyof FlaggedReviewsFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== undefined && v !== '');

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Filter Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-900">Filters</span>
          {hasActiveFilters && (
            <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
              Active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
          <span className="text-gray-400">
            {isExpanded ? '▲' : '▼'}
          </span>
        </div>
      </button>

      {/* Filter Content */}
      {isExpanded && (
        <div className="px-4 py-4 border-t border-gray-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Flag Reason Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Flag Reason
              </label>
              <select
                value={filters.flagReason || ''}
                onChange={(e) => handleFilterChange('flagReason', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Reasons</option>
                {flagReasonOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Rating Range */}
            <div className="md:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating Range
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={filters.minRating || ''}
                  onChange={(e) => handleFilterChange('minRating', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="Min"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={filters.maxRating || ''}
                  onChange={(e) => handleFilterChange('maxRating', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="Max"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filter Summary */}
          {hasActiveFilters && (
            <div className="pt-3 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Active Filters:</p>
              <div className="flex flex-wrap gap-2">
                {filters.status && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    Status: {filters.status}
                    <button
                      onClick={() => handleFilterChange('status', undefined)}
                      className="hover:bg-blue-200 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filters.flagReason && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    Flag: {filters.flagReason}
                    <button
                      onClick={() => handleFilterChange('flagReason', undefined)}
                      className="hover:bg-blue-200 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {(filters.minRating || filters.maxRating) && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    Rating: {filters.minRating || 1}-{filters.maxRating || 5}
                    <button
                      onClick={() => {
                        handleFilterChange('minRating', undefined);
                        handleFilterChange('maxRating', undefined);
                      }}
                      className="hover:bg-blue-200 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {(filters.startDate || filters.endDate) && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    Date: {filters.startDate || 'Start'} to {filters.endDate || 'End'}
                    <button
                      onClick={() => {
                        handleFilterChange('startDate', undefined);
                        handleFilterChange('endDate', undefined);
                      }}
                      className="hover:bg-blue-200 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
