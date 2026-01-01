'use client';

import { useState } from 'react';
import { Eye, ChevronDown, ChevronUp } from 'lucide-react';
import RiskScoreVisualization from './RiskScoreVisualization';
import PaymentDetailModal from './PaymentDetailModal';
import type { PaymentApproval } from '@/types/payment-approval.types';

interface PendingPaymentsListProps {
  payments: PaymentApproval[];
  loading?: boolean;
  selectedPaymentIds?: string[];
  onSelectionChange?: (paymentIds: string[]) => void;
  onPaymentUpdated?: () => void;
}

type SortField = 'amount' | 'riskScore' | 'flaggedAt' | 'client' | 'artisan';
type SortDirection = 'asc' | 'desc';

export default function PendingPaymentsList({
  payments,
  loading = false,
  selectedPaymentIds = [],
  onSelectionChange,
  onPaymentUpdated
}: PendingPaymentsListProps) {
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('flaggedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSelectAll = (checked: boolean) => {
    if (onSelectionChange) {
      if (checked) {
        const pendingPayments = payments.filter(p => p.status === 'PENDING' || p.status === 'HELD');
        onSelectionChange(pendingPayments.map(p => p.id));
      } else {
        onSelectionChange([]);
      }
    }
  };

  const handleSelectPayment = (paymentId: string, checked: boolean) => {
    if (onSelectionChange) {
      if (checked) {
        onSelectionChange([...selectedPaymentIds, paymentId]);
      } else {
        onSelectionChange(selectedPaymentIds.filter(id => id !== paymentId));
      }
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedPayments = [...payments].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case 'amount':
        aValue = a.amount;
        bValue = b.amount;
        break;
      case 'riskScore':
        aValue = a.riskScore.overall;
        bValue = b.riskScore.overall;
        break;
      case 'flaggedAt':
        aValue = new Date(a.flaggedAt).getTime();
        bValue = new Date(b.flaggedAt).getTime();
        break;
      case 'client':
        aValue = a.client.name.toLowerCase();
        bValue = b.client.name.toLowerCase();
        break;
      case 'artisan':
        aValue = a.artisan.name.toLowerCase();
        bValue = b.artisan.name.toLowerCase();
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const formatCurrency = (amount: number, currency: string) => {
    return `${currency} ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4" aria-hidden="true" />
    ) : (
      <ChevronDown className="w-4 h-4" aria-hidden="true" />
    );
  };

  const allPendingSelected = payments
    .filter(p => p.status === 'PENDING' || p.status === 'HELD')
    .every(p => selectedPaymentIds.includes(p.id));

  const somePendingSelected = payments
    .filter(p => p.status === 'PENDING' || p.status === 'HELD')
    .some(p => selectedPaymentIds.includes(p.id));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <Eye className="w-16 h-16 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900">No payments found</h3>
        <p className="text-gray-600 mt-1">There are no payments matching your criteria</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allPendingSelected && payments.length > 0}
                  ref={(input) => {
                    if (input) {
                      input.indeterminate = somePendingSelected && !allPendingSelected;
                    }
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                  aria-label="Select all payments"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('amount')}
              >
                <div className="flex items-center gap-1">
                  Amount
                  <SortIcon field="amount" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('client')}
              >
                <div className="flex items-center gap-1">
                  Client
                  <SortIcon field="client" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('artisan')}
              >
                <div className="flex items-center gap-1">
                  Artisan
                  <SortIcon field="artisan" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Job
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('riskScore')}
              >
                <div className="flex items-center gap-1">
                  Risk Score
                  <SortIcon field="riskScore" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('flaggedAt')}
              >
                <div className="flex items-center gap-1">
                  Flagged
                  <SortIcon field="flaggedAt" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedPayments.map((payment) => {
              const isSelectable = payment.status === 'PENDING' || payment.status === 'HELD';
              const isSelected = selectedPaymentIds.includes(payment.id);

              return (
                <tr
                  key={payment.id}
                  className={`hover:bg-gray-50 transition-colors ${
                    isSelected ? 'bg-blue-50' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    {isSelectable && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleSelectPayment(payment.id, e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                        aria-label={`Select payment ${payment.id}`}
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">
                    {payment.id.substring(0, 8)}...
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                    {formatCurrency(payment.amount, payment.currency)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div>
                      <p className="font-medium">{payment.client.name}</p>
                      <p className="text-xs text-gray-500">{payment.client.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div>
                      <p className="font-medium">{payment.artisan.name}</p>
                      <p className="text-xs text-gray-500">{payment.artisan.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div className="max-w-xs">
                      <p className="font-medium truncate">{payment.job.title}</p>
                      <p className="text-xs text-gray-500">{payment.job.category}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <RiskScoreVisualization riskScore={payment.riskScore} compact />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDate(payment.flaggedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      payment.status === 'PENDING' ? 'bg-blue-100 text-blue-800' :
                      payment.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                      payment.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                      payment.status === 'HELD' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedPaymentId(payment.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Eye className="w-4 h-4" aria-hidden="true" />
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Payment Detail Modal */}
      {selectedPaymentId && (
        <PaymentDetailModal
          paymentId={selectedPaymentId}
          isOpen={true}
          onClose={() => setSelectedPaymentId(null)}
          onPaymentUpdated={onPaymentUpdated}
        />
      )}
    </>
  );
}
