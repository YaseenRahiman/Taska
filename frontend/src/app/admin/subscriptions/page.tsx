'use client';

import { useState, useEffect } from 'react';
import {
  CreditCard,
  Users,
  TrendingUp,
  Edit2,
  Save,
  X,
  Crown,
  Zap,
  AlertCircle,
  Check,
  Loader2,
  RefreshCw,
  BarChart3,
  Calendar,
} from 'lucide-react';
import api from '@/lib/api';

interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  clientJobsPerMonth: number;
  artisanBidsPerMonth: number;
  pricePerMonthZar: number;
  pricePerYearZar: number;
  features: string[] | null;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
}

interface SubscriptionStats {
  totalSubscribers: number;
  activeSubscriptions: number;
  freeUsers: number;
  premiumUsers: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  churnRate: number;
  planBreakdown: {
    planId: string;
    planName: string;
    count: number;
    percentage: number;
  }[];
  usageStats: {
    totalJobsPosted: number;
    totalBidsPlaced: number;
    avgJobsPerUser: number;
    avgBidsPerUser: number;
  };
}

export default function AdminSubscriptionsPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<SubscriptionPlan>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [plansResponse, statsResponse] = await Promise.all([
        api.get('/subscriptions/plans'),
        api.get('/subscriptions/admin/stats'),
      ]);

      if (plansResponse.data.success) {
        setPlans(plansResponse.data.data);
      }

      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch subscription data:', err);
      setError('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (plan: SubscriptionPlan) => {
    setEditingPlan(plan.id);
    setEditForm({
      displayName: plan.displayName,
      description: plan.description,
      clientJobsPerMonth: plan.clientJobsPerMonth,
      artisanBidsPerMonth: plan.artisanBidsPerMonth,
      pricePerMonthZar: plan.pricePerMonthZar,
      pricePerYearZar: plan.pricePerYearZar,
      isActive: plan.isActive,
    });
  };

  const cancelEditing = () => {
    setEditingPlan(null);
    setEditForm({});
  };

  const savePlan = async (planId: string) => {
    try {
      setSaving(true);
      const response = await api.patch(`/subscriptions/admin/plans/${planId}`, editForm);

      if (response.data.success) {
        setPlans(plans.map(p => (p.id === planId ? { ...p, ...editForm } : p)));
        setEditingPlan(null);
        setEditForm({});
      }
    } catch (err) {
      console.error('Failed to update plan:', err);
      setError('Failed to update subscription plan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading subscription data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
          <button
            onClick={fetchData}
            className="ml-auto text-red-600 hover:text-red-700 flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription Management</h1>
          <p className="text-gray-600 mt-1">Manage subscription plans and monitor subscriber activity</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Subscribers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSubscribers}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              {stats.activeSubscriptions} active subscriptions
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Premium Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.premiumUsers}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Crown className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              {stats.freeUsers} free tier users
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  R{stats.monthlyRevenue.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              R{stats.yearlyRevenue.toLocaleString()} yearly
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Usage Stats</p>
                <p className="text-2xl font-bold text-gray-900">{stats.usageStats.totalJobsPosted}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Jobs posted this month ({stats.usageStats.totalBidsPlaced} bids)
            </div>
          </div>
        </div>
      )}

      {/* Plan Breakdown */}
      {stats && stats.planBreakdown.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Plan Distribution</h2>
          <div className="space-y-3">
            {stats.planBreakdown.map((item) => (
              <div key={item.planId} className="flex items-center">
                <div className="w-32 text-sm text-gray-600">{item.planName}</div>
                <div className="flex-1 mx-4">
                  <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        item.planName.toLowerCase().includes('premium')
                          ? 'bg-yellow-500'
                          : 'bg-blue-500'
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
                <div className="w-24 text-sm text-gray-900 text-right">
                  {item.count} ({item.percentage.toFixed(1)}%)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subscription Plans */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Subscription Plans</h2>
          <p className="text-sm text-gray-600 mt-1">Configure plan limits and pricing</p>
        </div>

        <div className="divide-y divide-gray-200">
          {plans.map((plan) => (
            <div key={plan.id} className="p-6">
              {editingPlan === plan.id ? (
                /* Edit Mode */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {plan.name === 'FREE' ? (
                        <Zap className="h-6 w-6 text-gray-500 mr-3" />
                      ) : (
                        <Crown className="h-6 w-6 text-yellow-500 mr-3" />
                      )}
                      <input
                        type="text"
                        value={editForm.displayName || ''}
                        onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                        className="text-lg font-semibold border border-gray-300 rounded px-2 py-1"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => savePlan(plan.id)}
                        disabled={saving}
                        className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {saving ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <Save className="h-4 w-4 mr-1" />
                        )}
                        Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="flex items-center px-3 py-1.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Client Jobs/Month
                      </label>
                      <input
                        type="number"
                        value={editForm.clientJobsPerMonth || 0}
                        onChange={(e) =>
                          setEditForm({ ...editForm, clientJobsPerMonth: parseInt(e.target.value) })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Artisan Bids/Month
                      </label>
                      <input
                        type="number"
                        value={editForm.artisanBidsPerMonth || 0}
                        onChange={(e) =>
                          setEditForm({ ...editForm, artisanBidsPerMonth: parseInt(e.target.value) })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Monthly Price (ZAR)
                      </label>
                      <input
                        type="number"
                        value={editForm.pricePerMonthZar || 0}
                        onChange={(e) =>
                          setEditForm({ ...editForm, pricePerMonthZar: parseFloat(e.target.value) })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Yearly Price (ZAR)
                      </label>
                      <input
                        type="number"
                        value={editForm.pricePerYearZar || 0}
                        onChange={(e) =>
                          setEditForm({ ...editForm, pricePerYearZar: parseFloat(e.target.value) })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={editForm.description || ''}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      rows={2}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`active-${plan.id}`}
                      checked={editForm.isActive ?? true}
                      onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label htmlFor={`active-${plan.id}`} className="ml-2 text-sm text-gray-700">
                      Plan is active and available for subscription
                    </label>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    {plan.name === 'FREE' ? (
                      <div className="p-2 bg-gray-100 rounded-lg mr-4">
                        <Zap className="h-6 w-6 text-gray-600" />
                      </div>
                    ) : (
                      <div className="p-2 bg-yellow-100 rounded-lg mr-4">
                        <Crown className="h-6 w-6 text-yellow-600" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">{plan.displayName}</h3>
                        {plan.isDefault && (
                          <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                            Default
                          </span>
                        )}
                        {!plan.isActive && (
                          <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{plan.description}</p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-500">Client Jobs/Month</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {plan.clientJobsPerMonth}
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-500">Artisan Bids/Month</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {plan.artisanBidsPerMonth}
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-500">Monthly Price</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {plan.pricePerMonthZar > 0 ? `R${plan.pricePerMonthZar}` : 'Free'}
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-500">Yearly Price</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {plan.pricePerYearZar > 0 ? `R${plan.pricePerYearZar}` : 'Free'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => startEditing(plan)}
                    className="flex items-center px-3 py-1.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Usage Limits Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Usage Limit Information</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>
            <strong>Client Jobs:</strong> Clients can post up to the specified number of jobs per
            billing period. Once the limit is reached, they must upgrade or wait for the next period.
          </p>
          <p>
            <strong>Artisan Bids:</strong> Artisans can place up to the specified number of bids per
            billing period. The system checks subscription limits first, then falls back to level-based
            free bids and credits.
          </p>
          <p>
            <strong>Billing Period:</strong> Usage resets at the start of each billing cycle (monthly
            or yearly depending on the subscription).
          </p>
        </div>
      </div>
    </div>
  );
}
