'use client';

import { useState } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import paymentApprovalService from '@/lib/api/payment-approval';

interface BulkApprovalActionsProps {
  selectedPaymentIds: string[];
  onSuccess?: () => void;
  onClearSelection?: () => void;
}

const MAX_BULK_APPROVE = 50;

export default function BulkApprovalActions({
  selectedPaymentIds,
  onSuccess,
  onClearSelection
}: BulkApprovalActionsProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBulkApprove = async () => {
    try {
      setIsProcessing(true);

      const response = await paymentApprovalService.bulkApprove({
        paymentIds: selectedPaymentIds,
      });

      if (response.status === 'COMPLETED') {
        toast.success(`Successfully approved ${selectedPaymentIds.length} payments`);
      } else if (response.status === 'PROCESSING') {
        toast.success('Bulk approval is processing. Check operation history for status.');
      }

      setShowConfirmModal(false);

      if (onClearSelection) {
        onClearSelection();
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Failed to bulk approve payments:', error);
      toast.error(error.response?.data?.message || 'Failed to approve payments in bulk');
    } finally {
      setIsProcessing(false);
    }
  };

  if (selectedPaymentIds.length === 0) {
    return null;
  }

  const isOverLimit = selectedPaymentIds.length > MAX_BULK_APPROVE;

  return (
    <div className="space-y-4">
      {/* Selection Info Bar */}
      <div className={`p-4 rounded-lg border ${
        isOverLimit
          ? 'bg-red-50 border-red-200'
          : 'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isOverLimit ? (
              <AlertCircle className="w-5 h-5 text-red-600" aria-hidden="true" />
            ) : (
              <CheckCircle className="w-5 h-5 text-blue-600" aria-hidden="true" />
            )}
            <span className={`font-medium ${
              isOverLimit ? 'text-red-900' : 'text-blue-900'
            }`}>
              {selectedPaymentIds.length} payment{selectedPaymentIds.length !== 1 ? 's' : ''} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onClearSelection && (
              <button
                onClick={onClearSelection}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Clear Selection
              </button>
            )}

            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={isOverLimit}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isOverLimit
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
              title={isOverLimit ? `Cannot approve more than ${MAX_BULK_APPROVE} payments at once` : 'Bulk approve selected payments'}
            >
              Approve All ({selectedPaymentIds.length})
            </button>
          </div>
        </div>

        {isOverLimit && (
          <p className="text-sm text-red-700 mt-2">
            Maximum {MAX_BULK_APPROVE} payments can be approved at once. Please reduce your selection.
          </p>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Bulk Approve Payments</h3>
                <p className="text-sm text-gray-600">
                  {selectedPaymentIds.length} payment{selectedPaymentIds.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <div className="flex gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-yellow-900">
                    Important: This action cannot be undone
                  </p>
                  <p className="text-sm text-yellow-800 mt-1">
                    You are about to approve {selectedPaymentIds.length} payment{selectedPaymentIds.length !== 1 ? 's' : ''}.
                    All selected payments will be processed and funds will be released to artisans.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900">Before you proceed:</h4>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Review all selected payments for risk factors</li>
                <li>Ensure all payments meet approval criteria</li>
                <li>Verify client and artisan information</li>
                <li>Check for any fraud indicators</li>
              </ul>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkApprove}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isProcessing
                  ? `Approving ${selectedPaymentIds.length}...`
                  : `Approve ${selectedPaymentIds.length} Payment${selectedPaymentIds.length !== 1 ? 's' : ''}`
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
