'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import paymentApprovalService from '@/lib/api/payment-approval';
import type { PaymentApproval } from '@/types/payment-approval.types';

interface ApprovalActionsProps {
  payment: PaymentApproval;
  onSuccess?: () => void;
  compact?: boolean;
}

export default function ApprovalActions({
  payment,
  onSuccess,
  compact = false
}: ApprovalActionsProps) {
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [reasonError, setReasonError] = useState('');

  const handleApprove = async () => {
    try {
      setIsProcessing(true);
      await paymentApprovalService.approvePayment({
        paymentId: payment.id,
      });

      toast.success(`Payment ${payment.id} approved successfully`);
      setShowApproveConfirm(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Failed to approve payment:', error);
      toast.error(error.response?.data?.message || 'Failed to approve payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    // Validate reason
    if (!rejectReason.trim()) {
      setReasonError('Rejection reason is required');
      return;
    }

    if (rejectReason.trim().length < 10) {
      setReasonError('Reason must be at least 10 characters');
      return;
    }

    if (rejectReason.trim().length > 500) {
      setReasonError('Reason must not exceed 500 characters');
      return;
    }

    try {
      setIsProcessing(true);
      setReasonError('');

      await paymentApprovalService.rejectPayment({
        paymentId: payment.id,
        reason: rejectReason.trim(),
      });

      toast.success(`Payment ${payment.id} rejected`);
      setShowRejectModal(false);
      setRejectReason('');

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Failed to reject payment:', error);
      toast.error(error.response?.data?.message || 'Failed to reject payment');
    } finally {
      setIsProcessing(false);
    }
  };

  if (payment.status !== 'PENDING' && payment.status !== 'HELD') {
    return (
      <div className="text-sm text-gray-500">
        Payment already {payment.status.toLowerCase()}
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowApproveConfirm(true)}
          className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          title="Approve payment (Alt+A)"
        >
          <CheckCircle className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowRejectModal(true)}
          className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
          title="Reject payment (Alt+R)"
        >
          <XCircle className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowApproveConfirm(true)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          title="Approve payment (Alt+A)"
        >
          <CheckCircle className="w-5 h-5" aria-hidden="true" />
          Approve Payment
        </button>
        <button
          onClick={() => setShowRejectModal(true)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          title="Reject payment (Alt+R)"
        >
          <XCircle className="w-5 h-5" aria-hidden="true" />
          Reject Payment
        </button>
      </div>

      {/* Approve Confirmation Modal */}
      {showApproveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Approve Payment</h3>
                <p className="text-sm text-gray-600">Payment ID: {payment.id}</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Amount:</span>
                <span className="text-sm font-medium text-gray-900">
                  {payment.currency} {payment.amount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Client:</span>
                <span className="text-sm font-medium text-gray-900">{payment.client.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Artisan:</span>
                <span className="text-sm font-medium text-gray-900">{payment.artisan.name}</span>
              </div>
            </div>

            <p className="text-sm text-gray-600">
              Are you sure you want to approve this payment? This action cannot be undone.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowApproveConfirm(false)}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isProcessing ? 'Approving...' : 'Confirm Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Reject Payment</h3>
                <p className="text-sm text-gray-600">Payment ID: {payment.id}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="rejectReason" className="block text-sm font-medium text-gray-700">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => {
                  setRejectReason(e.target.value);
                  setReasonError('');
                }}
                placeholder="Explain why this payment is being rejected (min 10 characters)..."
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none ${
                  reasonError ? 'border-red-300' : 'border-gray-300'
                }`}
                rows={4}
                maxLength={500}
                disabled={isProcessing}
                aria-invalid={!!reasonError}
                aria-describedby={reasonError ? 'reason-error' : undefined}
              />
              {reasonError && (
                <p id="reason-error" className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" aria-hidden="true" />
                  {reasonError}
                </p>
              )}
              <div className="flex justify-between text-xs text-gray-500">
                <span>Minimum 10 characters</span>
                <span>{rejectReason.length}/500</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setReasonError('');
                }}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={isProcessing || !rejectReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isProcessing ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
