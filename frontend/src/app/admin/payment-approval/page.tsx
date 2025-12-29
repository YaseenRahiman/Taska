'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, DollarSign, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import paymentApprovalService from '@/lib/api/payment-approval';
import PendingPaymentsList from './PendingPaymentsList';
import PaymentFilters from './PaymentFilters';
import PaymentSearch from './PaymentSearch';
import BulkApprovalActions from './BulkApprovalActions';
import type {
  PaymentApproval,
  PaymentApprovalFilters,
  PaymentApprovalStats,
} from '@/types/payment-approval.types';

const AUTO_REFRESH_INTERVAL = 30000; // 30 seconds

export default function PaymentApprovalPage() {
  const [payments, setPayments] = useState<PaymentApproval[]>([]);
  const [stats, setStats] = useState<PaymentApprovalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<PaymentApprovalFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchBy, setSearchBy] = useState<'paymentId' | 'clientName' | 'artisanName' | 'jobId'>('paymentId');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Load payments data
  const loadPayments = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      let data;
      if (searchQuery) {
        data = await paymentApprovalService.searchPayments(searchQuery, searchBy, page, 20);
      } else {
        data = await paymentApprovalService.getAllPayments(page, 20, filters);
      }

      setPayments(data.payments);
      setTotalPages(data.totalPages);
      setLastRefresh(new Date());
    } catch (error: any) {
      console.error('Failed to load payments:', error);
      toast.error(error.response?.data?.message || 'Failed to load payments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, filters, searchQuery, searchBy]);

  // Load statistics
  const loadStats = useCallback(async () => {
    try {
      const statsData = await paymentApprovalService.getStats();
      setStats(statsData);
    } catch (error: any) {
      console.error('Failed to load stats:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadPayments();
    loadStats();
  }, [loadPayments, loadStats]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const interval = setInterval(() => {
      loadPayments(false);
      loadStats();
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, loadPayments, loadStats]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+A for approve (when single payment selected)
      if (e.altKey && e.key === 'a' && selectedPaymentIds.length === 1) {
        e.preventDefault();
        // This would trigger approve for the selected payment
        // Implementation handled by ApprovalActions component
      }

      // Alt+R for reject (when single payment selected)
      if (e.altKey && e.key === 'r' && selectedPaymentIds.length === 1) {
        e.preventDefault();
        // This would trigger reject for the selected payment
        // Implementation handled by ApprovalActions component
      }

      // Alt+F to focus filters
      if (e.altKey && e.key === 'f') {
        e.preventDefault();
        // Focus on filter button or search
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPaymentIds]);

  const handleRefresh = () => {
    loadPayments(false);
    loadStats();
  };

  const handleFiltersChange = (newFilters: PaymentApprovalFilters) => {
    setFilters(newFilters);
    setPage(1);
    setSearchQuery('');
  };

  const handleSearch = (query: string, searchByField: typeof searchBy) => {
    setSearchQuery(query);
    setSearchBy(searchByField);
    setPage(1);
    setFilters({});
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({});
    setPage(1);
  };

  const handlePaymentUpdated = () => {
    loadPayments(false);
    loadStats();
    setSelectedPaymentIds([]);
  };

  const formatCurrency = (amount: number) => {
    return `R ${amount.toLocaleString()}`;
  };

  const formatLastRefresh = () => {
    const now = new Date();
    const diffMs = now.getTime() - lastRefresh.getTime();
    const diffSecs = Math.floor(diffMs / 1000);

    if (diffSecs < 10) return 'Just now';
    if (diffSecs < 60) return `${diffSecs}s ago`;

    const diffMins = Math.floor(diffSecs / 60);
    return `${diffMins}m ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-600" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <a href="/admin" className="hover:text-gray-900 transition-colors">
                Admin
              </a>
            </li>
            <li className="flex items-center">
              <span className="mx-2">/</span>
              <span className="font-medium text-gray-900">Payment Approval</span>
            </li>
          </ol>
        </nav>

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payment Approval Queue</h1>
            <p className="mt-2 text-gray-600">
              Review and approve payments flagged for manual verification
            </p>
          </div>

          {/* Refresh Controls */}
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              <p>Last refresh: {formatLastRefresh()}</p>
              <label className="flex items-center gap-2 mt-1">
                <input
                  type="checkbox"
                  checked={autoRefreshEnabled}
                  onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-xs">Auto-refresh (30s)</span>
              </label>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              title="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
              Refresh
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">High Risk</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.highRiskCount}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="space-y-4">
          <PaymentSearch
            onSearch={handleSearch}
            onClear={handleClearSearch}
          />

          <PaymentFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClear={handleClearFilters}
          />
        </div>

        {/* Bulk Actions */}
        {selectedPaymentIds.length > 0 && (
          <BulkApprovalActions
            selectedPaymentIds={selectedPaymentIds}
            onSuccess={handlePaymentUpdated}
            onClearSelection={() => setSelectedPaymentIds([])}
          />
        )}

        {/* Payments Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <PendingPaymentsList
            payments={payments}
            loading={loading}
            selectedPaymentIds={selectedPaymentIds}
            onSelectionChange={setSelectedPaymentIds}
            onPaymentUpdated={handlePaymentUpdated}
          />
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Keyboard Shortcuts Help */}
        <div className="hidden md:block text-xs text-gray-500 text-center">
          <p>Keyboard shortcuts: Alt+A to approve, Alt+R to reject (when single payment selected)</p>
        </div>
      </div>
    </div>
  );
}
