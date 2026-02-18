'use client';

import { useState, useEffect } from 'react';
import {
  Zap,
  Crown,
  TrendingUp,
  ArrowRight,
  AlertCircle,
  Check,
  Loader2,
  X,
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface UsageLimits {
  jobsPerMonth: number;
  bidsPerMonth: number;
  jobsUsed: number;
  bidsUsed: number;
  jobsRemaining: number;
  bidsRemaining: number;
  periodStart: string;
  periodEnd: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  clientJobsPerMonth: number;
  artisanBidsPerMonth: number;
  pricePerMonthZar: number;
}

interface SubscriptionInfo {
  subscription: {
    id: string;
    status: string;
    currentPeriodEnd: string;
  } | null;
  plan: SubscriptionPlan;
  usage: UsageLimits;
  isSubscribed: boolean;
  canUpgrade: boolean;
}

interface SubscriptionWidgetProps {
  userRole: 'CLIENT' | 'ARTISAN';
}

export default function SubscriptionWidget({ userRole }: SubscriptionWidgetProps) {
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [premiumPlanId, setPremiumPlanId] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptionInfo();
  }, []);

  const fetchSubscriptionInfo = async () => {
    try {
      setLoading(true);
      const response = await api.get('/subscriptions/current');
      if (response.data.success) {
        setSubscriptionInfo(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch subscription info:', err);
      setError('Failed to load subscription information');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeClick = async () => {
    // Fetch premium plan ID if we don't have it yet
    if (!premiumPlanId) {
      try {
        const plansRes = await api.get('/subscriptions/plans');
        const plans: SubscriptionPlan[] = plansRes.data.data || [];
        const premium = plans.find((p) => p.name === 'PREMIUM');
        if (!premium) {
          toast.error('Premium plan not available. Please contact support.');
          return;
        }
        setPremiumPlanId(premium.id);
      } catch {
        toast.error('Could not load plans. Please try again.');
        return;
      }
    }
    setShowUpgradeModal(true);
  };

  const handleConfirmUpgrade = async () => {
    if (!premiumPlanId) return;
    setUpgrading(true);
    try {
      await api.post('/subscriptions/subscribe', { planId: premiumPlanId });
      toast.success('Successfully upgraded to Premium!');
      setShowUpgradeModal(false);
      await fetchSubscriptionInfo();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Upgrade failed. Please try again.';
      toast.error(msg);
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
        </div>
      </div>
    );
  }

  if (error || !subscriptionInfo) {
    return (
      <div className="card p-6">
        <div className="flex items-center text-amber-600">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>{error || 'Unable to load subscription info'}</span>
        </div>
      </div>
    );
  }

  const { plan, usage, isSubscribed, canUpgrade } = subscriptionInfo;
  const isClient = userRole === 'CLIENT';
  const usageCount = isClient ? usage.jobsUsed : usage.bidsUsed;
  const usageLimit = isClient ? usage.jobsPerMonth : usage.bidsPerMonth;
  const remaining = isClient ? usage.jobsRemaining : usage.bidsRemaining;
  const usageLabel = isClient ? 'Job Postings' : 'Bids';
  const usagePercent = usageLimit > 0 ? (usageCount / usageLimit) * 100 : 0;

  const periodEndDate = new Date(usage.periodEnd);
  const daysRemaining = Math.ceil((periodEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className={`px-6 py-4 ${isSubscribed ? 'bg-gradient-to-r from-primary-500 to-primary-600' : 'bg-gradient-to-r from-gray-700 to-gray-800'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center text-white">
            {isSubscribed ? (
              <Crown className="h-5 w-5 mr-2" />
            ) : (
              <Zap className="h-5 w-5 mr-2" />
            )}
            <span className="font-semibold">{plan.displayName}</span>
          </div>
          {!isSubscribed && canUpgrade && (
            <button
              onClick={handleUpgradeClick}
              className="text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-full transition-colors"
            >
              Upgrade
            </button>
          )}
        </div>
      </div>

      {/* Usage Stats */}
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">{usageLabel} Used</span>
            <span className="text-sm font-medium text-gray-900">
              {usageCount} / {usageLimit}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all ${
                usagePercent >= 90
                  ? 'bg-red-500'
                  : usagePercent >= 70
                  ? 'bg-amber-500'
                  : 'bg-primary-500'
              }`}
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {remaining} remaining this month
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-cream-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-gray-900">{remaining}</div>
            <div className="text-xs text-gray-600">{usageLabel} Left</div>
          </div>
          <div className="bg-cream-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-gray-900">{daysRemaining}</div>
            <div className="text-xs text-gray-600">Days Until Reset</div>
          </div>
        </div>

        {/* Low Usage Warning */}
        {remaining <= 1 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Running low on {usageLabel.toLowerCase()}!
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  {canUpgrade
                    ? 'Upgrade to Premium for more monthly allowance.'
                    : 'Purchase credits to continue beyond your limit.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Upgrade CTA */}
        {canUpgrade && (
          <div className="border-t border-cream-200 pt-4">
            <div className="bg-primary-50 rounded-lg p-4">
              <div className="flex items-start">
                <TrendingUp className="h-5 w-5 text-primary-600 mr-3 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">
                    Upgrade to Premium
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1 mb-3">
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      {isClient ? '50 job postings/month' : '100 bids/month'}
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      Priority support
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      Featured listings
                    </li>
                  </ul>
                  <button
                    onClick={handleUpgradeClick}
                    className="inline-flex items-center text-sm font-semibold bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Upgrade Now – R299/month
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upgrade confirmation modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Upgrade to Premium</h3>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-primary-50 rounded-lg p-4 mb-4">
              <div className="text-center mb-3">
                <span className="text-3xl font-bold text-primary-600">R299</span>
                <span className="text-gray-500">/month</span>
              </div>
              <ul className="text-sm text-gray-700 space-y-2">
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  {isClient ? '50 job postings per month' : '100 bids per month'}
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  Priority customer support
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  Featured listings & priority matching
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  Advanced analytics
                </li>
              </ul>
            </div>

            <p className="text-xs text-gray-500 mb-4 text-center">
              Billing handled by our payment partner. Cancel anytime.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                disabled={upgrading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUpgrade}
                disabled={upgrading}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center"
              >
                {upgrading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  'Confirm Upgrade'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
