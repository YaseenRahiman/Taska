'use client';

import { useState, useEffect } from 'react';
import { Filter, X } from 'lucide-react';
import type { PaymentApprovalFilters, PaymentApprovalStatus } from '@/types/payment-approval.types';

interface PaymentFiltersProps {
  filters: PaymentApprovalFilters;
  onFiltersChange: (filters: PaymentApprovalFilters) => void;
  onClear?: () => void;
}

const statusOptions: { value: PaymentApprovalStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'HELD', label: 'On Hold' },
  { value: 'RELEASED', label: 'Released' },
];

export default function PaymentFilters({
  filters,
  onFiltersChange,
  onClear
}: PaymentFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState<PaymentApprovalFilters>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleApply = () => {
    onFiltersChange(localFilters);
    setIsExpanded(false);
  };

  const handleClear = () => {
    const emptyFilters: PaymentApprovalFilters = {};
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
    if (onClear) {
      onClear();
    }
  };

  const handleStatusToggle = (status: PaymentApprovalStatus) => {
    const currentStatuses = localFilters.status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status];

    setLocalFilters({
      ...localFilters,
      status: newStatuses.length > 0 ? newStatuses : undefined,
    });
  };

  const activeFilterCount = Object.keys(filters).filter(key => {
    const value = filters[key as keyof PaymentApprovalFilters];
    return value !== undefined && value !== null && (Array.isArray(value) ? value.length > 0 : true);
  }).length;

  return (
    <div className="space-y-4">
      {/* Filter Toggle Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Filter className="w-4 h-4" aria-hidden="true" />
          <span className="font-medium">Filters</span>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>

        {activeFilterCount > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
            Clear all
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {isExpanded && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
          {/* Status Filter */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map(option => {
                const isSelected = localFilters.status?.includes(option.value);
                return (
                  <button
                    key={option.value}
                    onClick={() => handleStatusToggle(option.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="minAmount" className="block text-sm font-medium text-gray-700">
                Min Amount
              </label>
              <input
                type="number"
                id="minAmount"
                value={localFilters.minAmount || ''}
                onChange={(e) => setLocalFilters({
                  ...localFilters,
                  minAmount: e.target.value ? parseFloat(e.target.value) : undefined,
                })}
                placeholder="0"
                min="0"
                step="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="maxAmount" className="block text-sm font-medium text-gray-700">
                Max Amount
              </label>
              <input
                type="number"
                id="maxAmount"
                value={localFilters.maxAmount || ''}
                onChange={(e) => setLocalFilters({
                  ...localFilters,
                  maxAmount: e.target.value ? parseFloat(e.target.value) : undefined,
                })}
                placeholder="No limit"
                min="0"
                step="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Risk Score Range */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Risk Score Range: {localFilters.minRiskScore || 0} - {localFilters.maxRiskScore || 100}
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  type="range"
                  value={localFilters.minRiskScore || 0}
                  onChange={(e) => setLocalFilters({
                    ...localFilters,
                    minRiskScore: parseInt(e.target.value),
                  })}
                  min="0"
                  max="100"
                  className="w-full"
                  aria-label="Minimum risk score"
                />
                <span className="text-xs text-gray-500">Min: {localFilters.minRiskScore || 0}</span>
              </div>
              <div>
                <input
                  type="range"
                  value={localFilters.maxRiskScore || 100}
                  onChange={(e) => setLocalFilters({
                    ...localFilters,
                    maxRiskScore: parseInt(e.target.value),
                  })}
                  min="0"
                  max="100"
                  className="w-full"
                  aria-label="Maximum risk score"
                />
                <span className="text-xs text-gray-500">Max: {localFilters.maxRiskScore || 100}</span>
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={localFilters.startDate || ''}
                onChange={(e) => setLocalFilters({
                  ...localFilters,
                  startDate: e.target.value || undefined,
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={localFilters.endDate || ''}
                onChange={(e) => setLocalFilters({
                  ...localFilters,
                  endDate: e.target.value || undefined,
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleClear}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={handleApply}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
