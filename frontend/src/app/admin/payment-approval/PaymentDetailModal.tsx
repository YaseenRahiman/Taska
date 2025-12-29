'use client';

import { useState, useEffect } from 'react';
import { X, DollarSign, User, Briefcase, History, FileText, Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';
import paymentApprovalService from '@/lib/api/payment-approval';
import RiskScoreVisualization from './RiskScoreVisualization';
import InvestigationNotes from './InvestigationNotes';
import ApprovalActions from './ApprovalActions';
import HoldReleaseActions from './HoldReleaseActions';
import type { PaymentApproval, InvestigationNote } from '@/types/payment-approval.types';

interface PaymentDetailModalProps {
  paymentId: string;
  isOpen: boolean;
  onClose: () => void;
  onPaymentUpdated?: () => void;
}

export default function PaymentDetailModal({
  paymentId,
  isOpen,
  onClose,
  onPaymentUpdated
}: PaymentDetailModalProps) {
  const [payment, setPayment] = useState<PaymentApproval | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'risk' | 'notes' | 'history'>('details');

  useEffect(() => {
    if (isOpen && paymentId) {
      loadPaymentDetails();
    }
  }, [isOpen, paymentId]);

  const loadPaymentDetails = async () => {
    try {
      setLoading(true);
      const data = await paymentApprovalService.getPaymentDetails(paymentId);
      setPayment(data);
    } catch (error: any) {
      console.error('Failed to load payment details:', error);
      toast.error(error.response?.data?.message || 'Failed to load payment details');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentAction = () => {
    loadPaymentDetails();
    if (onPaymentUpdated) {
      onPaymentUpdated();
    }
  };

  const handleNoteAdded = (note: InvestigationNote) => {
    if (payment) {
      setPayment({
        ...payment,
        investigationNotes: [...(payment.investigationNotes || []), note],
      });
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return `${currency} ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Payment Details</h2>
            <p className="text-sm text-gray-600 mt-1">ID: {paymentId}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : payment ? (
          <>
            {/* Tabs */}
            <div className="border-b border-gray-200 px-6">
              <nav className="flex gap-8" aria-label="Payment detail tabs">
                {[
                  { id: 'details' as const, label: 'Details', icon: FileText },
                  { id: 'risk' as const, label: 'Risk Analysis', icon: Shield },
                  { id: 'notes' as const, label: 'Investigation Notes', icon: History },
                  { id: 'history' as const, label: 'Transaction History', icon: History },
                ].map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                        isActive
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" aria-hidden="true" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'details' && (
                <div className="space-y-6">
                  {/* Payment Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <DollarSign className="w-5 h-5" aria-hidden="true" />
                      Payment Information
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Amount</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatCurrency(payment.amount, payment.currency)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <p className={`text-lg font-semibold ${
                          payment.status === 'APPROVED' ? 'text-green-600' :
                          payment.status === 'REJECTED' ? 'text-red-600' :
                          payment.status === 'HELD' ? 'text-yellow-600' :
                          'text-blue-600'
                        }`}>
                          {payment.status}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Flagged Date</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(payment.flaggedAt)}
                        </p>
                      </div>
                      {payment.flaggedReason && (
                        <div className="col-span-2">
                          <p className="text-sm text-gray-600">Flagged Reason</p>
                          <p className="text-sm font-medium text-gray-900">
                            {payment.flaggedReason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Client Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <User className="w-5 h-5" aria-hidden="true" />
                      Client Information
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Name</p>
                          <p className="text-sm font-medium text-gray-900">{payment.client.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="text-sm font-medium text-gray-900">{payment.client.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Jobs</p>
                          <p className="text-sm font-medium text-gray-900">{payment.client.totalJobs}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Spent</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(payment.client.totalSpent, payment.currency)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Account Age</p>
                          <p className="text-sm font-medium text-gray-900">
                            {payment.client.accountAge} days
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Verified</p>
                          <p className={`text-sm font-medium ${
                            payment.client.verificationStatus ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {payment.client.verificationStatus ? 'Yes' : 'No'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Artisan Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <User className="w-5 h-5" aria-hidden="true" />
                      Artisan Information
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Name</p>
                          <p className="text-sm font-medium text-gray-900">{payment.artisan.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="text-sm font-medium text-gray-900">{payment.artisan.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Completed Jobs</p>
                          <p className="text-sm font-medium text-gray-900">{payment.artisan.completedJobs}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Earned</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(payment.artisan.totalEarned, payment.currency)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Rating</p>
                          <p className="text-sm font-medium text-gray-900">
                            {payment.artisan.rating.toFixed(1)} / 5.0
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Verified</p>
                          <p className={`text-sm font-medium ${
                            payment.artisan.verificationStatus ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {payment.artisan.verificationStatus ? 'Yes' : 'No'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Job Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Briefcase className="w-5 h-5" aria-hidden="true" />
                      Job Information
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">Title</p>
                        <p className="text-sm font-medium text-gray-900">{payment.job.title}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Description</p>
                        <p className="text-sm text-gray-700">{payment.job.description}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Category</p>
                          <p className="text-sm font-medium text-gray-900">{payment.job.category}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Budget</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(payment.job.budget, payment.currency)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          <p className="text-sm font-medium text-gray-900">{payment.job.status}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Created</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDate(payment.job.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'risk' && (
                <div>
                  <RiskScoreVisualization riskScore={payment.riskScore} />
                </div>
              )}

              {activeTab === 'notes' && (
                <div>
                  <InvestigationNotes
                    paymentId={payment.id}
                    notes={payment.investigationNotes || []}
                    onNoteAdded={handleNoteAdded}
                  />
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-3">
                  {payment.transactionHistory && payment.transactionHistory.length > 0 ? (
                    payment.transactionHistory.map((transaction, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{transaction.action}</p>
                            <p className="text-sm text-gray-600">
                              By: {transaction.performedByName}
                            </p>
                            {transaction.details && Object.keys(transaction.details).length > 0 && (
                              <div className="mt-2 text-sm text-gray-700">
                                {Object.entries(transaction.details).map(([key, value]) => (
                                  <p key={key}>
                                    <strong>{key}:</strong> {String(value)}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {formatDate(transaction.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <History className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p>No transaction history available</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="border-t border-gray-200 p-6 bg-gray-50 space-y-4">
              <ApprovalActions
                payment={payment}
                onSuccess={handlePaymentAction}
              />
              <HoldReleaseActions
                payment={payment}
                onSuccess={handlePaymentAction}
              />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
