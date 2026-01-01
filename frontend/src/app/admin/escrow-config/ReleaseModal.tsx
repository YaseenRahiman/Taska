'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { X, CheckCircle, AlertCircle, DollarSign } from 'lucide-react';
import escrowConfigService from '@/lib/api/escrow-config';
import type { EscrowHold, ReleaseFormErrors } from '@/types/escrow-config.types';

interface ReleaseModalProps {
  hold: EscrowHold;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReleaseModal({ hold, onClose, onSuccess }: ReleaseModalProps) {
  const [releasing, setReleasing] = useState(false);
  const [reason, setReason] = useState('');
  const [notifyParties, setNotifyParties] = useState(true);
  const [errors, setErrors] = useState<ReleaseFormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: ReleaseFormErrors = {};

    // Reason is optional, but if provided, should be valid
    if (reason && reason.length > 500) {
      newErrors.reason = 'Reason must not exceed 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRelease = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setReleasing(true);

      await escrowConfigService.releaseHold(hold.id, {
        reason: reason.trim() || undefined,
        notifyParties,
      });

      toast.success(
        `Escrow hold released. ${formatCurrency(hold.amount)} will be transferred to ${hold.artisanName}`
      );
      onSuccess();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to release escrow hold');
      console.error('Release error:', error);
    } finally {
      setReleasing(false);
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
      aria-labelledby="release-modal-title"
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 id="release-modal-title" className="text-xl font-semibold text-gray-900">
                Release Escrow Hold
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Release funds to artisan
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
                <span className="text-gray-500">Amount:</span>
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
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-900">Important</p>
              <p className="text-yellow-700 mt-1">
                This action will immediately transfer {formatCurrency(hold.amount, hold.currency)} to{' '}
                {hold.artisanName}. This action cannot be reversed.
              </p>
            </div>
          </div>

          {/* Release Reason (Optional) */}
          <div>
            <label htmlFor="release-reason" className="block font-medium text-gray-700 mb-2">
              Release Reason (Optional)
            </label>
            <textarea
              id="release-reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (errors.reason) {
                  setErrors({ ...errors, reason: undefined });
                }
              }}
              rows={3}
              maxLength={500}
              placeholder="e.g., Job completed successfully, client satisfied with work..."
              className={`
                w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none
                ${errors.reason ? 'border-red-500' : 'border-gray-300'}
              `}
              aria-invalid={!!errors.reason}
              aria-describedby={errors.reason ? 'release-reason-error' : undefined}
            />
            {errors.reason && (
              <p id="release-reason-error" className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.reason}
              </p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              {reason.length}/500 characters
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
                focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                ${notifyParties ? 'bg-green-600' : 'bg-gray-200'}
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
            disabled={releasing}
            className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleRelease}
            disabled={releasing}
            className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {releasing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Releasing...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Release Funds
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
