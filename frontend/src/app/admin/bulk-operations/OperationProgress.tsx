'use client';

import { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { BulkOperation } from '@/types/bulk-operations.types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface OperationProgressProps {
  operationId: string;
  onClose?: () => void;
}

export default function OperationProgress({ operationId, onClose }: OperationProgressProps) {
  const [operation, setOperation] = useState<BulkOperation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOperation();

    // Poll every 2 seconds if operation is in progress
    const interval = setInterval(() => {
      if (operation?.status === 'PROCESSING' || operation?.status === 'PENDING') {
        fetchOperation();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [operationId]);

  const fetchOperation = async () => {
    try {
      const response = await fetch(`/api/v1/admin/bulk/operations/${operationId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch operation');

      const data = await response.json();
      setOperation(data);
    } catch (error) {
      console.error('Error fetching operation:', error);
      toast.error('Failed to load operation details');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!operation) return;

    if (!confirm('Are you sure you want to cancel this operation?')) return;

    try {
      const response = await fetch(`/api/v1/admin/bulk/operations/${operation.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to cancel operation');

      toast.success('Operation cancelled successfully');
      fetchOperation();
    } catch (error) {
      console.error('Error cancelling operation:', error);
      toast.error('Failed to cancel operation');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!operation) {
    return (
      <div className="text-center py-8 text-gray-500">
        Operation not found
      </div>
    );
  }

  const progress = operation.totalItems > 0
    ? Math.round((operation.processed / operation.totalItems) * 100)
    : 0;

  const statusConfig = {
    PENDING: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Pending' },
    PROCESSING: { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Processing' },
    COMPLETED: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'Completed' },
    FAILED: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Failed' },
    CANCELLED: { icon: AlertCircle, color: 'text-gray-600', bg: 'bg-gray-50', label: 'Cancelled' }
  };

  const StatusIcon = statusConfig[operation.status]?.icon || Clock;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {operation.type.replace(/_/g, ' ')}
          </h3>
          <p className="text-sm text-gray-500">
            Started {format(new Date(operation.startedAt), 'PPp')}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      {/* Status */}
      <div className="p-4 space-y-4">
        <div className={`flex items-center gap-3 p-3 rounded-lg ${statusConfig[operation.status]?.bg}`}>
          <StatusIcon className={`w-6 h-6 ${statusConfig[operation.status]?.color}`} />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className={`font-medium ${statusConfig[operation.status]?.color}`}>
                {statusConfig[operation.status]?.label}
              </span>
              <span className="text-sm font-medium">{progress}%</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                operation.status === 'COMPLETED' ? 'bg-green-600' :
                operation.status === 'FAILED' ? 'bg-red-600' :
                operation.status === 'CANCELLED' ? 'bg-gray-600' :
                'bg-blue-600'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{operation.totalItems}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{operation.processed}</div>
            <div className="text-xs text-gray-500">Processed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{operation.succeeded}</div>
            <div className="text-xs text-gray-500">Succeeded</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{operation.failed}</div>
            <div className="text-xs text-gray-500">Failed</div>
          </div>
        </div>

        {/* Error Details */}
        {operation.status === 'FAILED' && operation.results?.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Error Details</p>
                <p className="text-sm text-red-600 mt-1">{operation.results.error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {(operation.status === 'PROCESSING' || operation.status === 'PENDING') && (
          <button
            onClick={handleCancel}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Cancel Operation
          </button>
        )}

        {operation.completedAt && (
          <div className="text-sm text-gray-500 text-center">
            Completed {format(new Date(operation.completedAt), 'PPp')}
          </div>
        )}
      </div>
    </div>
  );
}
