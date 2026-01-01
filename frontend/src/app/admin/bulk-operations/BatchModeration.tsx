'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, EyeOff, Trash2, RefreshCw, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { api } from '@/lib/api';
import type { BulkContentModerateRequest } from '@/types/bulk-operations.types';

interface Content {
  id: string;
  type: 'JOB' | 'REVIEW' | 'COMMENT';
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  reportCount: number;
}

type ContentType = 'JOB' | 'REVIEW' | 'COMMENT';
type ModerationAction = 'APPROVE' | 'REJECT' | 'HIDE' | 'DELETE';

interface ActionModalState {
  show: boolean;
  action: ModerationAction | null;
  reason: string;
  error: string;
}

export default function BatchModeration() {
  const [activeTab, setActiveTab] = useState<ContentType>('JOB');
  const [content, setContent] = useState<Content[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionModal, setActionModal] = useState<ActionModalState>({
    show: false,
    action: null,
    reason: '',
    error: '',
  });

  useEffect(() => {
    fetchContent();
    // Clear selection when changing tabs
    setSelectedIds([]);
  }, [activeTab]);

  const fetchContent = async () => {
    try {
      setRefreshing(true);
      const response = await api.get(`/admin/content/pending?type=${activeTab}`);
      setContent(response.data || []);
    } catch (error: any) {
      console.error('Error fetching content:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load content';
      toast.error(errorMessage);
      setContent([]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(content.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(itemId => itemId !== id));
    }
  };

  const handleAction = (action: ModerationAction) => {
    if (selectedIds.length === 0) {
      toast.error('Please select at least one item');
      return;
    }

    // For approve, proceed directly with confirmation
    if (action === 'APPROVE') {
      handleApprove();
      return;
    }

    // For other actions, show reason modal
    setActionModal({
      show: true,
      action,
      reason: '',
      error: '',
    });
  };

  const handleApprove = async () => {
    if (!confirm(`Approve ${selectedIds.length} item${selectedIds.length !== 1 ? 's' : ''}?`)) {
      return;
    }

    await submitModeration('APPROVE', undefined);
  };

  const validateReason = (): boolean => {
    if (!actionModal.reason.trim()) {
      setActionModal(prev => ({ ...prev, error: 'Reason is required' }));
      return false;
    }

    if (actionModal.reason.trim().length < 10) {
      setActionModal(prev => ({ ...prev, error: 'Reason must be at least 10 characters' }));
      return false;
    }

    if (actionModal.reason.trim().length > 500) {
      setActionModal(prev => ({ ...prev, error: 'Reason must not exceed 500 characters' }));
      return false;
    }

    return true;
  };

  const submitModeration = async (action: ModerationAction, reason?: string) => {
    try {
      setLoading(true);

      const payload: BulkContentModerateRequest = {
        contentIds: selectedIds,
        contentType: activeTab,
        action,
      };

      if (reason) {
        payload.reason = reason;
      }

      await api.post('/admin/bulk/content/moderate', payload);

      const actionLabel = action.toLowerCase();
      toast.success(`Successfully ${actionLabel}d ${selectedIds.length} item${selectedIds.length !== 1 ? 's' : ''}`);

      // Clear selection and close modal
      setSelectedIds([]);
      setActionModal({ show: false, action: null, reason: '', error: '' });

      // Refresh content list
      await fetchContent();
    } catch (error: any) {
      console.error('Error moderating content:', error);
      const errorMessage = error.response?.data?.message || 'Failed to moderate content';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleModalSubmit = async () => {
    if (!validateReason()) {
      return;
    }

    if (!actionModal.action) return;

    const actionLabels = {
      REJECT: 'reject',
      HIDE: 'hide',
      DELETE: 'delete',
      APPROVE: 'approve',
    };

    const actionLabel = actionLabels[actionModal.action];

    if (actionModal.action === 'DELETE') {
      if (!confirm(`Are you sure you want to permanently delete ${selectedIds.length} item${selectedIds.length !== 1 ? 's' : ''}? This action cannot be undone.`)) {
        return;
      }
    }

    await submitModeration(actionModal.action, actionModal.reason);
  };

  const truncateContent = (text: string, maxLength: number = 100): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  const allSelected = content.length > 0 && selectedIds.length === content.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  const tabs: { type: ContentType; label: string }[] = [
    { type: 'JOB', label: 'Jobs' },
    { type: 'REVIEW', label: 'Reviews' },
    { type: 'COMMENT', label: 'Comments' },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          {tabs.map(({ type, label }) => (
            <button
              key={type}
              onClick={() => setActiveTab(type)}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === type
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                {selectedIds.length} item{selectedIds.length !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => setSelectedIds([])}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchContent()}
            disabled={refreshing}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            aria-label="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => handleAction('APPROVE')}
            disabled={selectedIds.length === 0 || loading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            Approve
          </button>

          <button
            onClick={() => handleAction('REJECT')}
            disabled={selectedIds.length === 0 || loading}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <XCircle className="w-4 h-4" />
            Reject
          </button>

          <button
            onClick={() => handleAction('HIDE')}
            disabled={selectedIds.length === 0 || loading}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <EyeOff className="w-4 h-4" />
            Hide
          </button>

          <button
            onClick={() => handleAction('DELETE')}
            disabled={selectedIds.length === 0 || loading}
            className="flex items-center gap-2 px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Content Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left w-12">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = someSelected;
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    aria-label="Select all items"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Content Preview
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Author
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Posted Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Reports
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {refreshing ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                      <span className="text-gray-500">Loading content...</span>
                    </div>
                  </td>
                </tr>
              ) : content.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <div className="text-gray-500">
                      <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-lg font-medium">No content pending moderation</p>
                      <p className="text-sm mt-1">All {activeTab.toLowerCase()}s have been reviewed</p>
                    </div>
                  </td>
                </tr>
              ) : (
                content.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-gray-50 ${selectedIds.includes(item.id) ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        aria-label={`Select ${truncateContent(item.content, 30)}`}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-md">
                      {truncateContent(item.content)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {item.authorName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {format(new Date(item.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        item.reportCount > 5
                          ? 'bg-red-100 text-red-800'
                          : item.reportCount > 2
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.reportCount} report{item.reportCount !== 1 ? 's' : ''}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Reason Modal */}
      {actionModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {actionModal.action === 'REJECT' && 'Reject Content'}
                {actionModal.action === 'HIDE' && 'Hide Content'}
                {actionModal.action === 'DELETE' && 'Delete Content'}
              </h3>
              <p className="text-sm text-gray-600">
                {actionModal.action === 'REJECT' &&
                  `Please provide a reason for rejecting ${selectedIds.length} item${selectedIds.length !== 1 ? 's' : ''}. This will be sent to the author${selectedIds.length !== 1 ? 's' : ''}.`}
                {actionModal.action === 'HIDE' &&
                  `Please provide a reason for hiding ${selectedIds.length} item${selectedIds.length !== 1 ? 's' : ''} from public view.`}
                {actionModal.action === 'DELETE' &&
                  `Please provide a reason for permanently deleting ${selectedIds.length} item${selectedIds.length !== 1 ? 's' : ''}. This action cannot be undone.`}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason <span className="text-red-600">*</span>
              </label>
              <textarea
                value={actionModal.reason}
                onChange={(e) => {
                  setActionModal(prev => ({ ...prev, reason: e.target.value, error: '' }));
                }}
                maxLength={500}
                rows={4}
                className={`w-full px-3 py-2 border ${actionModal.error ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Enter moderation reason..."
              />
              <div className="flex items-center justify-between mt-2">
                {actionModal.error ? (
                  <p className="text-sm text-red-600">{actionModal.error}</p>
                ) : (
                  <p className="text-sm text-gray-500">Minimum 10 characters</p>
                )}
                <p className={`text-sm ${actionModal.reason.length > 480 ? 'text-red-600' : 'text-gray-500'}`}>
                  {actionModal.reason.length}/500
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setActionModal({ show: false, action: null, reason: '', error: '' })}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleModalSubmit}
                disabled={loading}
                className={`flex-1 px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50 transition-colors ${
                  actionModal.action === 'REJECT'
                    ? 'bg-red-600 hover:bg-red-700'
                    : actionModal.action === 'HIDE'
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : 'bg-red-700 hover:bg-red-800'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  `Confirm ${actionModal.action?.toLowerCase()}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
