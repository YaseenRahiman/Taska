'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  DollarSign,
  Users,
  Calendar,
  ArrowUpDown,
  Filter,
  Download,
  RefreshCw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import escrowConfigService from '@/lib/api/escrow-config';
import ReleaseModal from './ReleaseModal';
import RefundModal from './RefundModal';
import type {
  EscrowHold,
  EscrowHoldStatus,
  EscrowHoldSort,
  PaginatedEscrowHolds,
} from '@/types/escrow-config.types';

export default function ActiveHoldsTable() {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [holds, setHolds] = useState<EscrowHold[]>([]);
  const [selectedHold, setSelectedHold] = useState<EscrowHold | null>(null);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalHolds, setTotalHolds] = useState(0);
  const limit = 20;

  // Filters
  const [statusFilter, setStatusFilter] = useState<EscrowHoldStatus | 'ALL'>('ALL');

  // Sorting
  const [sort, setSort] = useState<EscrowHoldSort>({
    field: 'holdDate',
    direction: 'desc',
  });

  useEffect(() => {
    loadHolds();
  }, [currentPage, statusFilter, sort]);

  const loadHolds = async () => {
    try {
      setLoading(true);

      const filters = statusFilter !== 'ALL' ? { status: statusFilter } : undefined;

      const data: PaginatedEscrowHolds = await escrowConfigService.getHolds(
        currentPage,
        limit,
        filters,
        sort
      );

      setHolds(data.holds);
      setTotalPages(data.totalPages);
      setTotalHolds(data.total);
    } catch (error) {
      toast.error('Failed to load escrow holds');
      console.error('Load holds error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: EscrowHoldSort['field']) => {
    setSort((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleReleaseClick = (hold: EscrowHold) => {
    setSelectedHold(hold);
    setShowReleaseModal(true);
  };

  const handleRefundClick = (hold: EscrowHold) => {
    setSelectedHold(hold);
    setShowRefundModal(true);
  };

  const handleReleaseSuccess = () => {
    setShowReleaseModal(false);
    setSelectedHold(null);
    loadHolds();
  };

  const handleRefundSuccess = () => {
    setShowRefundModal(false);
    setSelectedHold(null);
    loadHolds();
  };

  const handleExport = async () => {
    try {
      setExporting(true);

      const filters = statusFilter !== 'ALL' ? { status: statusFilter } : undefined;
      const blob = await escrowConfigService.exportHolds(filters);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `escrow-holds-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Export completed successfully');
    } catch (error) {
      toast.error('Failed to export holds');
      console.error('Export error:', error);
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'ZAR') => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isOverdue = (hold: EscrowHold) => {
    if (hold.status !== 'ACTIVE') return false;
    const expectedRelease = new Date(hold.expectedReleaseDate);
    const today = new Date();
    return expectedRelease < today;
  };

  const getStatusBadge = (status: EscrowHoldStatus) => {
    const styles = {
      ACTIVE: 'bg-blue-100 text-blue-800',
      RELEASED: 'bg-green-100 text-green-800',
      REFUNDED: 'bg-yellow-100 text-yellow-800',
      DISPUTED: 'bg-red-100 text-red-800',
      EXPIRED: 'bg-gray-100 text-gray-800',
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Active Escrow Holds</h2>
          <p className="text-sm text-gray-500 mt-1">
            {totalHolds} total hold{totalHolds !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as EscrowHoldStatus | 'ALL');
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Filter by status"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="RELEASED">Released</option>
            <option value="REFUNDED">Refunded</option>
            <option value="DISPUTED">Disputed</option>
            <option value="EXPIRED">Expired</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={loadHolds}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
            aria-label="Refresh holds"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={exporting || holds.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hold ID
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center gap-1">
                    Amount
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Artisan
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('holdDate')}
                >
                  <div className="flex items-center gap-1">
                    Hold Date
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('expectedReleaseDate')}
                >
                  <div className="flex items-center gap-1">
                    Release Date
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1">
                    Status
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="text-gray-600">Loading holds...</span>
                    </div>
                  </td>
                </tr>
              ) : holds.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    No escrow holds found
                  </td>
                </tr>
              ) : (
                holds.map((hold) => (
                  <tr
                    key={hold.id}
                    className={`hover:bg-gray-50 ${
                      isOverdue(hold) ? 'bg-red-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        {isOverdue(hold) && (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="font-mono text-gray-900">
                          {hold.id.slice(0, 8)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {formatCurrency(hold.amount, hold.currency)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div>
                        <div className="font-medium text-gray-900">
                          {hold.clientName}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {hold.clientEmail}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div>
                        <div className="font-medium text-gray-900">
                          {hold.artisanName}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {hold.artisanEmail}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatDate(hold.holdDate)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="flex items-center gap-1">
                        {formatDate(hold.expectedReleaseDate)}
                        {isOverdue(hold) && (
                          <AlertTriangle className="w-3 h-3 text-red-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {getStatusBadge(hold.status)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {hold.status === 'ACTIVE' && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleReleaseClick(hold)}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                          >
                            Release
                          </button>
                          <button
                            onClick={() => handleRefundClick(hold)}
                            className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 transition-colors"
                          >
                            Refund
                          </button>
                        </div>
                      )}
                      {hold.status !== 'ACTIVE' && hold.actualReleaseDate && (
                        <span className="text-xs text-gray-500">
                          {formatDate(hold.actualReleaseDate)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Previous</span>
              </button>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                aria-label="Next page"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showReleaseModal && selectedHold && (
        <ReleaseModal
          hold={selectedHold}
          onClose={() => {
            setShowReleaseModal(false);
            setSelectedHold(null);
          }}
          onSuccess={handleReleaseSuccess}
        />
      )}

      {showRefundModal && selectedHold && (
        <RefundModal
          hold={selectedHold}
          onClose={() => {
            setShowRefundModal(false);
            setSelectedHold(null);
          }}
          onSuccess={handleRefundSuccess}
        />
      )}
    </div>
  );
}
