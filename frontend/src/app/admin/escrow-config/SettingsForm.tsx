'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Save, RotateCcw, AlertCircle, CheckCircle, Settings } from 'lucide-react';
import escrowConfigService from '@/lib/api/escrow-config';
import type {
  EscrowConfig,
  UpdateEscrowConfigRequest,
  EscrowConfigFormErrors,
} from '@/types/escrow-config.types';

export default function SettingsForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Form state
  const [config, setConfig] = useState<Partial<EscrowConfig>>({
    autoReleaseEnabled: false,
    autoReleaseDays: 30,
    defaultHoldDuration: 14,
    maxHoldDuration: 90,
    disputeWindowEnabled: true,
    disputeWindowDays: 7,
    feePercentage: 2.5,
    minHoldAmount: 100,
    maxHoldAmount: 100000,
  });

  const [originalConfig, setOriginalConfig] = useState<Partial<EscrowConfig>>({});
  const [errors, setErrors] = useState<EscrowConfigFormErrors>({});

  // Load current configuration
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await escrowConfigService.getConfig();
      setConfig(data);
      setOriginalConfig(data);
    } catch (error) {
      toast.error('Failed to load escrow configuration');
      console.error('Load config error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Validation functions
  const validateField = (
    name: keyof EscrowConfig,
    value: any
  ): string | undefined => {
    switch (name) {
      case 'autoReleaseDays':
        if (value < 1 || value > 90) {
          return 'Auto-release days must be between 1 and 90';
        }
        break;

      case 'defaultHoldDuration':
        if (value < 1 || value > 365) {
          return 'Default hold duration must be between 1 and 365 days';
        }
        if (config.maxHoldDuration && value > config.maxHoldDuration) {
          return 'Default duration cannot exceed maximum duration';
        }
        break;

      case 'maxHoldDuration':
        if (value < 1 || value > 365) {
          return 'Maximum hold duration must be between 1 and 365 days';
        }
        if (config.defaultHoldDuration && value < config.defaultHoldDuration) {
          return 'Maximum duration must be greater than or equal to default duration';
        }
        break;

      case 'disputeWindowDays':
        if (value < 1 || value > 60) {
          return 'Dispute window must be between 1 and 60 days';
        }
        break;

      case 'feePercentage':
        if (value < 0 || value > 10) {
          return 'Fee percentage must be between 0 and 10';
        }
        break;

      case 'minHoldAmount':
        if (value < 0) {
          return 'Minimum hold amount must be non-negative';
        }
        if (config.maxHoldAmount && value > config.maxHoldAmount) {
          return 'Minimum amount cannot exceed maximum amount';
        }
        break;

      case 'maxHoldAmount':
        if (value < 0) {
          return 'Maximum hold amount must be non-negative';
        }
        if (config.minHoldAmount && value < config.minHoldAmount) {
          return 'Maximum amount must be greater than minimum amount';
        }
        break;
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: EscrowConfigFormErrors = {};

    // Validate all numeric fields
    const numericFields: (keyof EscrowConfig)[] = [
      'autoReleaseDays',
      'defaultHoldDuration',
      'maxHoldDuration',
      'disputeWindowDays',
      'feePercentage',
      'minHoldAmount',
      'maxHoldAmount',
    ];

    numericFields.forEach((field) => {
      const error = validateField(field, config[field]);
      if (error) {
        newErrors[field as keyof EscrowConfigFormErrors] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    field: keyof EscrowConfig,
    value: number | boolean
  ) => {
    const newConfig = { ...config, [field]: value };
    setConfig(newConfig);
    setHasChanges(true);

    // Clear error for this field
    if (errors[field as keyof EscrowConfigFormErrors]) {
      setErrors({ ...errors, [field]: undefined });
    }

    // Re-validate related fields
    if (field === 'defaultHoldDuration' || field === 'maxHoldDuration') {
      const otherField =
        field === 'defaultHoldDuration' ? 'maxHoldDuration' : 'defaultHoldDuration';
      const otherError = validateField(otherField, newConfig[otherField]);
      setErrors((prev) => ({
        ...prev,
        [otherField]: otherError,
      }));
    }

    if (field === 'minHoldAmount' || field === 'maxHoldAmount') {
      const otherField =
        field === 'minHoldAmount' ? 'maxHoldAmount' : 'minHoldAmount';
      const otherError = validateField(otherField, newConfig[otherField]);
      setErrors((prev) => ({
        ...prev,
        [otherField]: otherError,
      }));
    }
  };

  const handleReset = () => {
    setConfig(originalConfig);
    setErrors({});
    setHasChanges(false);
    toast.success('Changes reset');
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Please fix validation errors before saving');
      return;
    }

    try {
      setSaving(true);

      const updateData: UpdateEscrowConfigRequest = {
        autoReleaseEnabled: config.autoReleaseEnabled,
        autoReleaseDays: config.autoReleaseDays,
        defaultHoldDuration: config.defaultHoldDuration,
        maxHoldDuration: config.maxHoldDuration,
        disputeWindowEnabled: config.disputeWindowEnabled,
        disputeWindowDays: config.disputeWindowDays,
        feePercentage: config.feePercentage,
        minHoldAmount: config.minHoldAmount,
        maxHoldAmount: config.maxHoldAmount,
      };

      const updatedConfig = await escrowConfigService.updateConfig(updateData);
      setConfig(updatedConfig);
      setOriginalConfig(updatedConfig);
      setHasChanges(false);

      toast.success('Escrow configuration updated successfully');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update configuration');
      console.error('Update config error:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading configuration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Escrow Configuration Settings
            </h2>
            <p className="text-sm text-gray-500">
              Configure payment hold durations, fees, and auto-release rules
            </p>
          </div>
        </div>

        {hasChanges && (
          <div className="flex items-center gap-2 text-sm text-amber-600">
            <AlertCircle className="w-4 h-4" />
            <span>Unsaved changes</span>
          </div>
        )}
      </div>

      {/* Auto-Release Configuration */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          Auto-Release Configuration
        </h3>

        <div className="space-y-4">
          {/* Enable Auto-Release Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="autoReleaseEnabled" className="font-medium text-gray-700">
                Enable Auto-Release
              </label>
              <p className="text-sm text-gray-500">
                Automatically release funds after hold period expires
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={config.autoReleaseEnabled}
              onClick={() =>
                handleChange('autoReleaseEnabled', !config.autoReleaseEnabled)
              }
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${config.autoReleaseEnabled ? 'bg-blue-600' : 'bg-gray-200'}
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${config.autoReleaseEnabled ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>

          {/* Auto-Release Days */}
          <div>
            <label htmlFor="autoReleaseDays" className="block font-medium text-gray-700 mb-2">
              Days Until Auto-Release
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="number"
              id="autoReleaseDays"
              min="1"
              max="90"
              value={config.autoReleaseDays || ''}
              onChange={(e) =>
                handleChange('autoReleaseDays', parseInt(e.target.value) || 0)
              }
              disabled={!config.autoReleaseEnabled}
              className={`
                w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
                ${errors.autoReleaseDays ? 'border-red-500' : 'border-gray-300'}
                ${!config.autoReleaseEnabled ? 'bg-gray-100 cursor-not-allowed' : ''}
              `}
              aria-invalid={!!errors.autoReleaseDays}
              aria-describedby={errors.autoReleaseDays ? 'autoReleaseDays-error' : undefined}
            />
            {errors.autoReleaseDays && (
              <p id="autoReleaseDays-error" className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.autoReleaseDays}
              </p>
            )}
            <p className="mt-1 text-sm text-gray-500">Range: 1-90 days</p>
          </div>
        </div>
      </div>

      {/* Hold Duration Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Hold Duration Settings</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Default Hold Duration */}
          <div>
            <label htmlFor="defaultHoldDuration" className="block font-medium text-gray-700 mb-2">
              Default Hold Duration
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="number"
              id="defaultHoldDuration"
              min="1"
              max="365"
              value={config.defaultHoldDuration || ''}
              onChange={(e) =>
                handleChange('defaultHoldDuration', parseInt(e.target.value) || 0)
              }
              className={`
                w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
                ${errors.defaultHoldDuration ? 'border-red-500' : 'border-gray-300'}
              `}
              aria-invalid={!!errors.defaultHoldDuration}
              aria-describedby={errors.defaultHoldDuration ? 'defaultHoldDuration-error' : undefined}
            />
            {errors.defaultHoldDuration && (
              <p id="defaultHoldDuration-error" className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.defaultHoldDuration}
              </p>
            )}
            <p className="mt-1 text-sm text-gray-500">Range: 1-365 days</p>
          </div>

          {/* Maximum Hold Duration */}
          <div>
            <label htmlFor="maxHoldDuration" className="block font-medium text-gray-700 mb-2">
              Maximum Hold Duration
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="number"
              id="maxHoldDuration"
              min="1"
              max="365"
              value={config.maxHoldDuration || ''}
              onChange={(e) =>
                handleChange('maxHoldDuration', parseInt(e.target.value) || 0)
              }
              className={`
                w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
                ${errors.maxHoldDuration ? 'border-red-500' : 'border-gray-300'}
              `}
              aria-invalid={!!errors.maxHoldDuration}
              aria-describedby={errors.maxHoldDuration ? 'maxHoldDuration-error' : undefined}
            />
            {errors.maxHoldDuration && (
              <p id="maxHoldDuration-error" className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.maxHoldDuration}
              </p>
            )}
            <p className="mt-1 text-sm text-gray-500">Range: 1-365 days</p>
          </div>
        </div>
      </div>

      {/* Dispute Window Configuration */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Dispute Window Configuration</h3>

        <div className="space-y-4">
          {/* Enable Disputes Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="disputeWindowEnabled" className="font-medium text-gray-700">
                Enable Dispute Window
              </label>
              <p className="text-sm text-gray-500">
                Allow disputes to be filed after job completion
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={config.disputeWindowEnabled}
              onClick={() =>
                handleChange('disputeWindowEnabled', !config.disputeWindowEnabled)
              }
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${config.disputeWindowEnabled ? 'bg-blue-600' : 'bg-gray-200'}
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${config.disputeWindowEnabled ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>

          {/* Dispute Window Days */}
          <div>
            <label htmlFor="disputeWindowDays" className="block font-medium text-gray-700 mb-2">
              Dispute Window Duration
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="number"
              id="disputeWindowDays"
              min="1"
              max="60"
              value={config.disputeWindowDays || ''}
              onChange={(e) =>
                handleChange('disputeWindowDays', parseInt(e.target.value) || 0)
              }
              disabled={!config.disputeWindowEnabled}
              className={`
                w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
                ${errors.disputeWindowDays ? 'border-red-500' : 'border-gray-300'}
                ${!config.disputeWindowEnabled ? 'bg-gray-100 cursor-not-allowed' : ''}
              `}
              aria-invalid={!!errors.disputeWindowDays}
              aria-describedby={errors.disputeWindowDays ? 'disputeWindowDays-error' : undefined}
            />
            {errors.disputeWindowDays && (
              <p id="disputeWindowDays-error" className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.disputeWindowDays}
              </p>
            )}
            <p className="mt-1 text-sm text-gray-500">Range: 1-60 days</p>
          </div>
        </div>
      </div>

      {/* Fee Configuration */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Fee Configuration</h3>

        <div className="space-y-6">
          {/* Fee Percentage */}
          <div>
            <label htmlFor="feePercentage" className="block font-medium text-gray-700 mb-2">
              Fee Percentage
              <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                id="feePercentage"
                min="0"
                max="10"
                step="0.1"
                value={config.feePercentage || ''}
                onChange={(e) =>
                  handleChange('feePercentage', parseFloat(e.target.value) || 0)
                }
                className={`
                  w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  ${errors.feePercentage ? 'border-red-500' : 'border-gray-300'}
                `}
                aria-invalid={!!errors.feePercentage}
                aria-describedby={errors.feePercentage ? 'feePercentage-error' : undefined}
              />
              <span className="text-gray-600 font-medium">%</span>
            </div>
            {errors.feePercentage && (
              <p id="feePercentage-error" className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.feePercentage}
              </p>
            )}
            <p className="mt-1 text-sm text-gray-500">Range: 0-10%</p>
          </div>

          {/* Min/Max Hold Amounts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Minimum Hold Amount */}
            <div>
              <label htmlFor="minHoldAmount" className="block font-medium text-gray-700 mb-2">
                Minimum Hold Amount
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-600 font-medium">R</span>
                <input
                  type="number"
                  id="minHoldAmount"
                  min="0"
                  step="0.01"
                  value={config.minHoldAmount || ''}
                  onChange={(e) =>
                    handleChange('minHoldAmount', parseFloat(e.target.value) || 0)
                  }
                  className={`
                    w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    ${errors.minHoldAmount ? 'border-red-500' : 'border-gray-300'}
                  `}
                  aria-invalid={!!errors.minHoldAmount}
                  aria-describedby={errors.minHoldAmount ? 'minHoldAmount-error' : undefined}
                />
              </div>
              {errors.minHoldAmount && (
                <p id="minHoldAmount-error" className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.minHoldAmount}
                </p>
              )}
            </div>

            {/* Maximum Hold Amount */}
            <div>
              <label htmlFor="maxHoldAmount" className="block font-medium text-gray-700 mb-2">
                Maximum Hold Amount
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-600 font-medium">R</span>
                <input
                  type="number"
                  id="maxHoldAmount"
                  min="0"
                  step="0.01"
                  value={config.maxHoldAmount || ''}
                  onChange={(e) =>
                    handleChange('maxHoldAmount', parseFloat(e.target.value) || 0)
                  }
                  className={`
                    w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    ${errors.maxHoldAmount ? 'border-red-500' : 'border-gray-300'}
                  `}
                  aria-invalid={!!errors.maxHoldAmount}
                  aria-describedby={errors.maxHoldAmount ? 'maxHoldAmount-error' : undefined}
                />
              </div>
              {errors.maxHoldAmount && (
                <p id="maxHoldAmount-error" className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.maxHoldAmount}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={handleReset}
          disabled={!hasChanges || saving}
          className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges || saving || Object.keys(errors).length > 0}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}
