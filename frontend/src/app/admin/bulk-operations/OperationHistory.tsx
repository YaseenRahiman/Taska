'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Eye, Trash2, Filter, ChevronLeft, ChevronRight, X } from 'lucide-react';
import OperationProgress from './OperationProgress';
import type { BulkOperation, BulkOperationType, BulkOperationStatus, PaginatedBulkOperations } from '@/types/bulk-operations.types';
import { format } from 'date-fns';

export default function OperationHistory() {
  const [operations, setOperations] = useState<BulkOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedOperation, setSelectedOperation] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Filter state
  const [filterType, setFilterType] = useState<BulkOperationType | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<BulkOperationStatus | 'ALL'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const limit = 20;

  useEffect(() => {
    fetchOperations();
  }, [page, filterType, filterStatus, startDate, endDate]);

  const fetchOperations = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (filterType !== 'ALL') params.append('type', filterType);
      if (filterStatus !== 'ALL') params.append('status', filterStatus);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/v1/admin/bulk/operations?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch operations: ${response.statusText}`);
      }

      const data: PaginatedBulkOperations = await response.json();
      setOperations(data.operations || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch operations';
      setError(errorMessage);
      toast.error(errorMessage);
      setOperations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (operationId: string) => {
    if (!confirm('Are you sure you want to delete this operation? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/admin/bulk/operations/${operationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete operation');
      }

      toast.success('Operation deleted successfully');
      fetchOperations(); // Refresh the list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete operation';
      toast.error(errorMessage);
    }
  };

  const handleViewDetails = (operationId: string) => {
    setSelectedOperation(operationId);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedOperation(null);
    fetchOperations(); // Refresh to get updated status
  };

  const clearFilters = () => {
    setFilterType('ALL');
    setFilterStatus('ALL');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const getStatusBadgeClass = (status: BulkOperationStatus): string => {
    const statusClasses = {
      COMPLETED: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
      PROCESSING: 'bg-blue-100 text-blue-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  };

  const calculateSuccessRate = (operation: BulkOperation): string => {
    if (operation.processed === 0) return '0%';
    const rate = (operation.succeeded / operation.processed) * 100;
    return `${rate.toFixed(1)}%`;
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Filters Toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Operation History</h2>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Filter className="w-4 h-4" />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Operation Type
              </label>
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value as BulkOperationType | 'ALL');
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">All Types</option>
                <option value="USER_BAN">User Ban</option>
                <option value="USER_SUSPEND">User Suspend</option>
                <option value="USER_VERIFY">User Verify</option>
                <option value="EMAIL_SEND">Email Send</option>
                <option value="CONTENT_MODERATE">Content Moderate</option>
                <option value="DATA_EXPORT">Data Export</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value as BulkOperationStatus | 'ALL');
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="COMPLETED">Completed</option>
                <option value="FAILED">Failed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* Start Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* End Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Clear Filters Button */}
          <div className="flex justify-end">
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="text-sm text-gray-600">
        Showing {operations.length} of {total} operations
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Operations Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Total Items
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Processed
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Success Rate
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Initiated By
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Started At
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {operations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <Filter className="w-12 h-12 text-gray-300" />
                      <p className="font-medium">No operations found</p>
                      <p className="text-sm">Try adjusting your filters or create a new operation</p>
                    </div>
                  </td>
                </tr>
              ) : (
                operations.map((operation) => (
                  <tr key={operation.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {operation.type.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(operation.status)}`}>
                        {operation.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {operation.totalItems}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {operation.processed}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <span className={`font-medium ${
                        parseFloat(calculateSuccessRate(operation)) >= 90 ? 'text-green-600' :
                        parseFloat(calculateSuccessRate(operation)) >= 70 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {calculateSuccessRate(operation)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {operation.initiatedBy}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {format(new Date(operation.startedAt), 'MMM d, yyyy HH:mm')}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(operation.id)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          aria-label="View details"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(operation.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          aria-label="Delete operation"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && selectedOperation && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <OperationProgress
              operationId={selectedOperation}
              onClose={handleCloseModal}
            />
          </div>
        </div>
      )}
    </div>
  );
}
