'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Zap,
  Crown,
  TrendingUp,
  ArrowRight,
  Briefcase,
  MessageSquare,
  AlertCircle,
  Check,
  Loader2,
} from 'lucide-react';
import api from '@/lib/api';

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
            <Link
              href="/pricing"
              className="text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-full transition-colors"
            >
              Upgrade
            </Link>
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
                  <Link
                    href="/pricing"
                    className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    View Plans
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
