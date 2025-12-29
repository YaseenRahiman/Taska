'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Ban, Clock, CheckCircle, X, AlertCircle } from 'lucide-react';
import UserSelectionTable from './UserSelectionTable';
import type { User, BulkUserBanRequest, BulkUserSuspendRequest, BulkUserVerifyRequest, BulkOperationResponse } from '@/types/bulk-operations.types';

interface FormErrors {
  reason?: string;
  expiryDate?: string;
}

export default function BulkUserActions() {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Ban form state
  const [banReason, setBanReason] = useState('');
  const [isPermanent, setIsPermanent] = useState(false);

  // Suspend form state
  const [suspendReason, setSuspendReason] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  // Form errors
  const [errors, setErrors] = useState<FormErrors>({});

  const handleSelectUsers = (userIds: string[]) => {
    setSelectedUsers(userIds);
  };

  const handleClearSelection = () => {
    setSelectedUsers([]);
  };

  const validateBanForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!banReason.trim()) {
      newErrors.reason = 'Reason is required';
    } else if (banReason.trim().length < 10) {
      newErrors.reason = 'Reason must be at least 10 characters';
    } else if (banReason.trim().length > 500) {
      newErrors.reason = 'Reason must not exceed 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSuspendForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!suspendReason.trim()) {
      newErrors.reason = 'Reason is required';
    } else if (suspendReason.trim().length < 10) {
      newErrors.reason = 'Reason must be at least 10 characters';
    } else if (suspendReason.trim().length > 500) {
      newErrors.reason = 'Reason must not exceed 500 characters';
    }

    if (expiryDate) {
      const selectedDate = new Date(expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate <= today) {
        newErrors.expiryDate = 'Expiry date must be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBan = async () => {
    if (!validateBanForm()) {
      return;
    }

    try {
      setLoading(true);

      const requestBody: BulkUserBanRequest = {
        userIds: selectedUsers,
        reason: banReason.trim(),
        permanent: isPermanent,
      };

      const response = await fetch('/api/v1/admin/bulk/users/ban', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to ban users');
      }

      const data: BulkOperationResponse = await response.json();
      toast.success(`Ban operation started! Operation ID: ${data.operationId}`);

      // Reset form and selection
      setBanReason('');
      setIsPermanent(false);
      setShowBanModal(false);
      setSelectedUsers([]);
      setErrors({});
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to ban users';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!validateSuspendForm()) {
      return;
    }

    try {
      setLoading(true);

      const requestBody: BulkUserSuspendRequest = {
        userIds: selectedUsers,
        reason: suspendReason.trim(),
        expiryDate: expiryDate || undefined,
      };

      const response = await fetch('/api/v1/admin/bulk/users/suspend', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to suspend users');
      }

      const data: BulkOperationResponse = await response.json();
      toast.success(`Suspend operation started! Operation ID: ${data.operationId}`);

      // Reset form and selection
      setSuspendReason('');
      setExpiryDate('');
      setShowSuspendModal(false);
      setSelectedUsers([]);
      setErrors({});
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to suspend users';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user to verify');
      return;
    }

    const confirmMessage = `Are you sure you want to verify ${selectedUsers.length} artisan(s)? This will grant them verified status on the platform.`;
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setLoading(true);

      const requestBody: BulkUserVerifyRequest = {
        userIds: selectedUsers,
      };

      const response = await fetch('/api/v1/admin/bulk/users/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to verify users');
      }

      const data: BulkOperationResponse = await response.json();
      toast.success(`Verification operation started! Operation ID: ${data.operationId}`);

      // Reset selection
      setSelectedUsers([]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify users';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const openBanModal = () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user to ban');
      return;
    }
    setShowBanModal(true);
    setErrors({});
  };

  const openSuspendModal = () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user to suspend');
      return;
    }
    setShowSuspendModal(true);
    setErrors({});
  };

  const closeBanModal = () => {
    setShowBanModal(false);
    setBanReason('');
    setIsPermanent(false);
    setErrors({});
  };

  const closeSuspendModal = () => {
    setShowSuspendModal(false);
    setSuspendReason('');
    setExpiryDate('');
    setErrors({});
  };

  // Get minimum date for expiry date picker (tomorrow)
  const getMinExpiryDate = (): string => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Selected:</span>
          <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 text-sm font-bold text-white bg-blue-600 rounded-full">
            {selectedUsers.length}
          </span>
        </div>

        <div className="flex-1"></div>

        <button
          onClick={openBanModal}
          disabled={selectedUsers.length === 0 || loading}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          <Ban className="w-4 h-4" />
          Ban Users
        </button>

        <button
          onClick={openSuspendModal}
          disabled={selectedUsers.length === 0 || loading}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          <Clock className="w-4 h-4" />
          Suspend Users
        </button>

        <button
          onClick={handleVerify}
          disabled={selectedUsers.length === 0 || loading}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          <CheckCircle className="w-4 h-4" />
          Verify Artisans
        </button>

        <button
          onClick={handleClearSelection}
          disabled={selectedUsers.length === 0 || loading}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          <X className="w-4 h-4" />
          Clear Selection
        </button>
      </div>

      {/* User Selection Table */}
      <UserSelectionTable
        selectedUsers={selectedUsers}
        onSelectionChange={handleSelectUsers}
      />

      {/* Ban Modal */}
      {showBanModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={closeBanModal}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Ban className="w-5 h-5 text-red-600" />
                Ban Users
              </h3>
              <button
                onClick={closeBanModal}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Warning: This action will ban {selectedUsers.length} user(s)</p>
                  <p className="mt-1">Banned users will lose access to the platform immediately.</p>
                </div>
              </div>

              {/* Reason Field */}
              <div>
                <label htmlFor="ban-reason" className="block text-sm font-medium text-gray-700 mb-1">
                  Reason <span className="text-red-600">*</span>
                </label>
                <textarea
                  id="ban-reason"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  rows={4}
                  placeholder="Enter the reason for banning these users (10-500 characters)"
                  className={`w-full px-3 py-2 border ${errors.reason ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none`}
                  maxLength={500}
                />
                <div className="flex items-center justify-between mt-1">
                  {errors.reason && (
                    <p className="text-sm text-red-600">{errors.reason}</p>
                  )}
                  <p className="text-xs text-gray-500 ml-auto">
                    {banReason.length}/500 characters
                  </p>
                </div>
              </div>

              {/* Permanent Checkbox */}
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="permanent-ban"
                  checked={isPermanent}
                  onChange={(e) => setIsPermanent(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-500 mt-0.5"
                />
                <label htmlFor="permanent-ban" className="text-sm text-gray-700">
                  <span className="font-medium">Permanent ban</span>
                  <span className="block text-gray-500 mt-0.5">
                    Banned users will not be able to create new accounts with the same email
                  </span>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
              <button
                onClick={closeBanModal}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleBan}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors font-medium flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Ban className="w-4 h-4" />
                    Ban Users
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Modal */}
      {showSuspendModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={closeSuspendModal}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                Suspend Users
              </h3>
              <button
                onClick={closeSuspendModal}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">This action will suspend {selectedUsers.length} user(s)</p>
                  <p className="mt-1">Suspended users will have limited access to the platform.</p>
                </div>
              </div>

              {/* Reason Field */}
              <div>
                <label htmlFor="suspend-reason" className="block text-sm font-medium text-gray-700 mb-1">
                  Reason <span className="text-red-600">*</span>
                </label>
                <textarea
                  id="suspend-reason"
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  rows={4}
                  placeholder="Enter the reason for suspending these users (10-500 characters)"
                  className={`w-full px-3 py-2 border ${errors.reason ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none`}
                  maxLength={500}
                />
                <div className="flex items-center justify-between mt-1">
                  {errors.reason && (
                    <p className="text-sm text-red-600">{errors.reason}</p>
                  )}
                  <p className="text-xs text-gray-500 ml-auto">
                    {suspendReason.length}/500 characters
                  </p>
                </div>
              </div>

              {/* Expiry Date Field */}
              <div>
                <label htmlFor="expiry-date" className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date <span className="text-gray-500">(Optional)</span>
                </label>
                <input
                  type="date"
                  id="expiry-date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  min={getMinExpiryDate()}
                  className={`w-full px-3 py-2 border ${errors.expiryDate ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent`}
                />
                {errors.expiryDate && (
                  <p className="text-sm text-red-600 mt-1">{errors.expiryDate}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty for indefinite suspension
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
              <button
                onClick={closeSuspendModal}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspend}
                disabled={loading}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-colors font-medium flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4" />
                    Suspend Users
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
