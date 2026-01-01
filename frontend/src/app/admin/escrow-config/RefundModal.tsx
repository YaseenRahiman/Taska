'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { X, RotateCcw, AlertCircle, DollarSign } from 'lucide-react';
import escrowConfigService from '@/lib/api/escrow-config';
import type { EscrowHold, RefundFormErrors } from '@/types/escrow-config.types';

interface RefundModalProps {
  hold: EscrowHold;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RefundModal({ hold, onClose, onSuccess }: RefundModalProps) {
  const [refunding, setRefunding] = useState(false);
  const [reason, setReason] = useState('');
  const [partialRefund, setPartialRefund] = useState(false);
  const [refundAmount, setRefundAmount] = useState(hold.amount);
  const [notifyParties, setNotifyParties] = useState(true);
  const [errors, setErrors] = useState<RefundFormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: RefundFormErrors = {};

    // Reason is required
    if (!reason.trim()) {
      newErrors.reason = 'Refund reason is required';
    } else if (reason.trim().length < 10) {
      newErrors.reason = 'Reason must be at least 10 characters';
    } else if (reason.trim().length > 500) {
      newErrors.reason = 'Reason must not exceed 500 characters';
    }

    // Validate refund amount if partial refund
    if (partialRefund) {
      if (!refundAmount || refundAmount <= 0) {
        newErrors.amount = 'Refund amount must be greater than 0';
      } else if (refundAmount > hold.amount) {
        newErrors.amount = `Refund amount cannot exceed ${formatCurrency(hold.amount, hold.currency)}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRefund = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setRefunding(true);

      await escrowConfigService.refundHold(hold.id, {
        reason: reason.trim(),
        amount: partialRefund ? refundAmount : undefined,
        notifyParties,
      });

      const amountText = partialRefund
        ? formatCurrency(refundAmount, hold.currency)
        : formatCurrency(hold.amount, hold.currency);

      toast.success(
        `Refund initiated. ${amountText} will be refunded to ${hold.clientName}`
      );
      onSuccess();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to refund escrow hold');
      console.error('Refund error:', error);
    } finally {
      setRefunding(false);
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
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="refund-modal-title"
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <RotateCcw className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h2 id="refund-modal-title" className="text-xl font-semibold text-gray-900">
                Refund Escrow Hold
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Refund funds to client
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Hold Details */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="font-medium text-gray-900">Hold Details</h3>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Hold ID:</span>
                <p className="font-mono font-medium text-gray-900 mt-1">{hold.id}</p>
              </div>
              <div>
                <span className="text-gray-500">Total Amount:</span>
                <p className="font-semibold text-gray-900 mt-1 flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  {formatCurrency(hold.amount, hold.currency)}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Client:</span>
                <p className="font-medium text-gray-900 mt-1">{hold.clientName}</p>
                <p className="text-xs text-gray-500">{hold.clientEmail}</p>
              </div>
              <div>
                <span className="text-gray-500">Artisan:</span>
                <p className="font-medium text-gray-900 mt-1">{hold.artisanName}</p>
                <p className="text-xs text-gray-500">{hold.artisanEmail}</p>
              </div>
              <div>
                <span className="text-gray-500">Job:</span>
                <p className="font-medium text-gray-900 mt-1">{hold.jobTitle}</p>
              </div>
              <div>
                <span className="text-gray-500">Hold Date:</span>
                <p className="font-medium text-gray-900 mt-1">{formatDate(hold.holdDate)}</p>
              </div>
            </div>
          </div>

          {/* Warning Message */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-red-900">Important</p>
              <p className="text-red-700 mt-1">
                This action will refund the payment to {hold.clientName}. The artisan will not receive payment. This action cannot be reversed.
              </p>
            </div>
          </div>

          {/* Partial Refund Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <label htmlFor="partial-refund" className="font-medium text-gray-700">
                Partial Refund
              </label>
              <p className="text-sm text-gray-500">
                Refund only a portion of the total amount
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={partialRefund}
              onClick={() => {
                setPartialRefund(!partialRefund);
                if (!partialRefund) {
                  setRefundAmount(hold.amount);
                }
              }}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2
                ${partialRefund ? 'bg-yellow-600' : 'bg-gray-200'}
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${partialRefund ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>

          {/* Refund Amount */}
          {partialRefund && (
            <div>
              <label htmlFor="refund-amount" className="block font-medium text-gray-700 mb-2">
                Refund Amount
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-600 font-medium">R</span>
                <input
                  type="number"
                  id="refund-amount"
                  min="0"
                  max={hold.amount}
                  step="0.01"
                  value={refundAmount}
                  onChange={(e) => {
                    setRefundAmount(parseFloat(e.target.value) || 0);
                    if (errors.amount) {
                      setErrors({ ...errors, amount: undefined });
                    }
                  }}
                  className={`
                    flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent
                    ${errors.amount ? 'border-red-500' : 'border-gray-300'}
                  `}
                  aria-invalid={!!errors.amount}
                  aria-describedby={errors.amount ? 'refund-amount-error' : undefined}
                />
              </div>
              {errors.amount && (
                <p id="refund-amount-error" className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.amount}
                </p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Maximum: {formatCurrency(hold.amount, hold.currency)}
              </p>
            </div>
          )}

          {/* Refund Reason (Required) */}
          <div>
            <label htmlFor="refund-reason" className="block font-medium text-gray-700 mb-2">
              Refund Reason
              <span className="text-red-500 ml-1">*</span>
            </label>
            <textarea
              id="refund-reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (errors.reason) {
                  setErrors({ ...errors, reason: undefined });
                }
              }}
              rows={4}
              maxLength={500}
              placeholder="Please provide a detailed reason for the refund (minimum 10 characters)..."
              className={`
                w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none
                ${errors.reason ? 'border-red-500' : 'border-gray-300'}
              `}
              aria-invalid={!!errors.reason}
              aria-describedby={errors.reason ? 'refund-reason-error' : undefined}
            />
            {errors.reason && (
              <p id="refund-reason-error" className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.reason}
              </p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              {reason.length}/500 characters (minimum 10 required)
            </p>
          </div>

          {/* Notification Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <label htmlFor="notify-parties" className="font-medium text-gray-700">
                Notify Both Parties
              </label>
              <p className="text-sm text-gray-500">
                Send email notifications to client and artisan
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={notifyParties}
              onClick={() => setNotifyParties(!notifyParties)}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2
                ${notifyParties ? 'bg-yellow-600' : 'bg-gray-200'}
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${notifyParties ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={refunding}
            className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleRefund}
            disabled={refunding}
            className="px-6 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {refunding ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                Process Refund
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
