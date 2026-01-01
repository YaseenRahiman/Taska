'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Loader2, AlertCircle, CheckCircle, Settings2 } from 'lucide-react';
import {
  getAutoTopUpSettings,
  updateAutoTopUpSettings,
  getCreditBundles,
  type AutoTopUpSettings as AutoTopUpSettingsType,
  type CreditBundle,
} from '@/lib/api/monetization';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

interface AutoTopUpSettingsProps {
  onSettingsChange?: (enabled: boolean) => void;
}

export function AutoTopUpSettings({ onSettingsChange }: AutoTopUpSettingsProps) {
  const [settings, setSettings] = useState<AutoTopUpSettingsType | null>(null);
  const [bundles, setBundles] = useState<CreditBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Local form state
  const [enabled, setEnabled] = useState(false);
  const [triggerBalance, setTriggerBalance] = useState(50);
  const [selectedBundleId, setSelectedBundleId] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [settingsData, bundlesData] = await Promise.all([
        getAutoTopUpSettings(),
        getCreditBundles(),
      ]);
      setSettings(settingsData);
      setBundles(bundlesData);

      // Initialize form state
      setEnabled(settingsData.enabled);
      setTriggerBalance(settingsData.triggerBalance);
      setSelectedBundleId(settingsData.bundleId || bundlesData[0]?.id || '');
    } catch (err) {
      setError('Failed to load auto top-up settings');
      console.error('Error fetching auto top-up settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    const newEnabled = !enabled;
    setEnabled(newEnabled);

    if (!newEnabled) {
      // If disabling, save immediately
      await handleSave(newEnabled);
    } else {
      // If enabling, show the edit form
      setIsEditing(true);
    }
  };

  const handleSave = async (enabledOverride?: boolean) => {
    try {
      setSaving(true);
      const newSettings = await updateAutoTopUpSettings({
        enabled: enabledOverride !== undefined ? enabledOverride : enabled,
        triggerBalance,
        bundleId: selectedBundleId,
      });
      setSettings(newSettings);
      setIsEditing(false);
      toast.success(
        newSettings.enabled ? 'Auto top-up enabled successfully' : 'Auto top-up disabled'
      );
      onSettingsChange?.(newSettings.enabled);
    } catch (err) {
      toast.error('Failed to update auto top-up settings');
      console.error('Error updating settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to saved values
    if (settings) {
      setEnabled(settings.enabled);
      setTriggerBalance(settings.triggerBalance);
      setSelectedBundleId(settings.bundleId);
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" aria-label="Loading" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-4" aria-hidden="true" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button variant="outline" onClick={fetchData}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const selectedBundle = bundles.find((b) => b.id === selectedBundleId);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <RefreshCw className="w-5 h-5" aria-hidden="true" />
              Auto Top-up
            </CardTitle>
            <CardDescription>
              Automatically purchase credits when your balance is low
            </CardDescription>
          </div>

          {/* Toggle Switch */}
          <button
            role="switch"
            aria-checked={enabled}
            aria-label="Enable auto top-up"
            onClick={handleToggle}
            disabled={saving}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
              ${enabled ? 'bg-primary-500' : 'bg-gray-300'}
              ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${enabled ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </button>
        </div>
      </CardHeader>

      <CardContent>
        {enabled && (isEditing || !settings?.bundleId) ? (
          <div className="space-y-4">
            {/* Trigger Balance */}
            <div>
              <label
                htmlFor="trigger-balance"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Top up when balance falls below
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="trigger-balance"
                  type="number"
                  min="10"
                  max="500"
                  step="10"
                  value={triggerBalance}
                  onChange={(e) => setTriggerBalance(Math.max(10, parseInt(e.target.value) || 10))}
                  className="w-24 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={saving}
                />
                <span className="text-gray-600">credits</span>
              </div>
            </div>

            {/* Bundle Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Credit bundle to purchase
              </label>
              <div className="grid gap-2">
                {bundles.map((bundle) => (
                  <button
                    key={bundle.id}
                    type="button"
                    onClick={() => setSelectedBundleId(bundle.id)}
                    disabled={saving}
                    className={`
                      flex items-center justify-between p-3 border rounded-lg transition-colors text-left
                      ${
                        selectedBundleId === bundle.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }
                      ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
                        ${
                          selectedBundleId === bundle.id
                            ? 'border-primary-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {selectedBundleId === bundle.id && (
                          <div className="w-2 h-2 rounded-full bg-primary-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{bundle.name}</p>
                        <p className="text-sm text-gray-500">
                          {bundle.credits.toLocaleString()} credits
                          {bundle.bonusPercentage > 0 && (
                            <span className="text-green-600">
                              {' '}
                              (+{bundle.bonusPercentage}% bonus)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(bundle.price)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => handleSave()}
                disabled={saving || !selectedBundleId}
                className="flex-1"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" aria-hidden="true" />
                    Save Settings
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleCancel} disabled={saving}>
                Cancel
              </Button>
            </div>
          </div>
        ) : enabled ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-gray-600">Status</span>
              <Badge className="bg-green-100 text-green-700">Active</Badge>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-gray-600">Trigger Balance</span>
              <span className="font-medium">{settings?.triggerBalance} credits</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-gray-600">Top-up Bundle</span>
              <span className="font-medium">{selectedBundle?.name}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-600">Amount</span>
              <span className="font-medium">{formatCurrency(selectedBundle?.price || 0)}</span>
            </div>

            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => setIsEditing(true)}
            >
              <Settings2 className="w-4 h-4 mr-2" aria-hidden="true" />
              Edit Settings
            </Button>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <RefreshCw className="w-12 h-12 mx-auto mb-4 text-gray-300" aria-hidden="true" />
            <p>Auto top-up is currently disabled</p>
            <p className="text-sm mt-1">Enable it to never run out of credits</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
