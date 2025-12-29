'use client';

import { useState } from 'react';
import { Pause, Play, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import paymentApprovalService from '@/lib/api/payment-approval';
import type { PaymentApproval } from '@/types/payment-approval.types';

interface HoldReleaseActionsProps {
  payment: PaymentApproval;
  onSuccess?: () => void;
}

export default function HoldReleaseActions({
  payment,
  onSuccess
}: HoldReleaseActionsProps) {
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [showReleaseConfirm, setShowReleaseConfirm] = useState(false);
  const [holdReason, setHoldReason] = useState('');
  const [holdUntil, setHoldUntil] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [reasonError, setReasonError] = useState('');
  const [dateError, setDateError] = useState('');

  const handleHold = async () => {
    // Validate reason
    if (!holdReason.trim()) {
      setReasonError('Hold reason is required');
      return;
    }

    if (holdReason.trim().length < 10) {
      setReasonError('Reason must be at least 10 characters');
      return;
    }

    if (holdReason.trim().length > 500) {
      setReasonError('Reason must not exceed 500 characters');
      return;
    }

    // Validate hold until date if provided
    if (holdUntil) {
      const selectedDate = new Date(holdUntil);
      const now = new Date();

      if (selectedDate <= now) {
        setDateError('Hold until date must be in the future');
        return;
      }
    }

    try {
      setIsProcessing(true);
      setReasonError('');
      setDateError('');

      await paymentApprovalService.holdPayment({
        paymentId: payment.id,
        reason: holdReason.trim(),
        holdUntil: holdUntil || undefined,
      });

      toast.success(`Payment ${payment.id} placed on hold`);
      setShowHoldModal(false);
      setHoldReason('');
      setHoldUntil('');

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Failed to hold payment:', error);
      toast.error(error.response?.data?.message || 'Failed to hold payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRelease = async () => {
    try {
      setIsProcessing(true);

      await paymentApprovalService.releasePayment({
        paymentId: payment.id,
      });

      toast.success(`Payment ${payment.id} released from hold`);
      setShowReleaseConfirm(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Failed to release payment:', error);
      toast.error(error.response?.data?.message || 'Failed to release payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatHoldDuration = () => {
    if (!payment.heldUntil) return 'Indefinite';

    const until = new Date(payment.heldUntil);
    const now = new Date();
    const diffMs = until.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / 86400000);

    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Expires today';
    if (diffDays === 1) return '1 day remaining';
    return `${diffDays} days remaining`;
  };

  if (payment.status === 'HELD') {
    return (
      <div className="space-y-4">
        {/* Hold Information */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Pause className="w-5 h-5 text-yellow-600 mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <p className="font-medium text-yellow-900">Payment On Hold</p>
              {payment.heldReason && (
                <p className="text-sm text-yellow-800 mt-1">
                  <strong>Reason:</strong> {payment.heldReason}
                </p>
              )}
              {payment.heldUntil && (
                <p className="text-sm text-yellow-800 mt-1">
                  <strong>Duration:</strong> {formatHoldDuration()}
                </p>
              )}
              {payment.heldBy && (
                <p className="text-xs text-yellow-700 mt-2">
                  Held by admin on {new Date(payment.heldAt!).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Release Button */}
        <button
          onClick={() => setShowReleaseConfirm(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Play className="w-5 h-5" aria-hidden="true" />
          Release Payment
        </button>

        {/* Release Confirmation Modal */}
        {showReleaseConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Play className="w-6 h-6 text-blue-600" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Release Payment</h3>
                  <p className="text-sm text-gray-600">Payment ID: {payment.id}</p>
                </div>
              </div>

              <p className="text-sm text-gray-600">
                Are you sure you want to release this payment from hold? It will return to pending status for approval.
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowReleaseConfirm(false)}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRelease}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? 'Releasing...' : 'Confirm Release'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (payment.status === 'PENDING') {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setShowHoldModal(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium"
        >
          <Pause className="w-5 h-5" aria-hidden="true" />
          Hold Payment
        </button>

        {/* Hold Modal */}
        {showHoldModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Pause className="w-6 h-6 text-yellow-600" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Hold Payment</h3>
                  <p className="text-sm text-gray-600">Payment ID: {payment.id}</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Hold Reason */}
                <div className="space-y-2">
                  <label htmlFor="holdReason" className="block text-sm font-medium text-gray-700">
                    Hold Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="holdReason"
                    value={holdReason}
                    onChange={(e) => {
                      setHoldReason(e.target.value);
                      setReasonError('');
                    }}
                    placeholder="Explain why this payment is being held (min 10 characters)..."
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none ${
                      reasonError ? 'border-red-300' : 'border-gray-300'
                    }`}
                    rows={3}
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
                    <span>{holdReason.length}/500</span>
                  </div>
                </div>

                {/* Hold Until Date (Optional) */}
                <div className="space-y-2">
                  <label htmlFor="holdUntil" className="block text-sm font-medium text-gray-700">
                    Hold Until (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    id="holdUntil"
                    value={holdUntil}
                    onChange={(e) => {
                      setHoldUntil(e.target.value);
                      setDateError('');
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${
                      dateError ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={isProcessing}
                    aria-invalid={!!dateError}
                    aria-describedby={dateError ? 'date-error' : undefined}
                  />
                  {dateError && (
                    <p id="date-error" className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" aria-hidden="true" />
                      {dateError}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Leave empty for indefinite hold
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowHoldModal(false);
                    setHoldReason('');
                    setHoldUntil('');
                    setReasonError('');
                    setDateError('');
                  }}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleHold}
                  disabled={isProcessing || !holdReason.trim()}
                  className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? 'Holding...' : 'Confirm Hold'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
