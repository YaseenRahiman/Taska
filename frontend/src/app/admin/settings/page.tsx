'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import {
  Settings,
  Save,
  RefreshCw,
  Shield,
  Mail,
  DollarSign,
  Globe,
  Bell,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  Edit,
  CheckCircle,
  AlertTriangle,
  Info,
  Zap,
  Users,
  Briefcase,
  MessageSquare,
  Star
} from 'lucide-react';

interface SystemSetting {
  id: string;
  key: string;
  value: string;
  description?: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  category: 'general' | 'email' | 'payment' | 'security' | 'features';
  updatedAt: string;
}

interface EmailTemplate {
  type: string;
  subject: string;
  content: string;
  variables: string[];
}

interface FeatureFlag {
  name: string;
  enabled: boolean;
  description: string;
  rolloutPercentage?: number;
}

const SystemSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    message: '',
    type: 'INFO' as 'INFO' | 'WARNING' | 'ERROR',
    expiresAt: ''
  });

  const fetchSystemData = async () => {
    try {
      setLoading(true);
      
      const [settingsResponse, templatesResponse, flagsResponse] = await Promise.all([
        api.get('/admin/system/settings'),
        api.get('/admin/email-templates'),
        api.get('/admin/feature-flags')
      ]);

      setSettings(settingsResponse.data || []);
      setEmailTemplates(templatesResponse.data.templates || []);
      setFeatureFlags(flagsResponse.data.flags || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load system settings');
      console.error('System settings loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemData();
  }, []);

  const updateSetting = async (key: string, value: string) => {
    try {
      setSaving(key);
      await api.put(`/admin/system/settings/${key}`, { value });
      await fetchSystemData();
      alert('Setting updated successfully');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update setting');
    } finally {
      setSaving(null);
    }
  };

  const updateEmailTemplate = async (type: string, content: string) => {
    try {
      setSaving(`template_${type}`);
      await api.put(`/admin/email-templates/${type}`, { content });
      await fetchSystemData();
      alert('Email template updated successfully');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update template');
    } finally {
      setSaving(null);
    }
  };

  const updateFeatureFlag = async (name: string, enabled: boolean) => {
    try {
      setSaving(`flag_${name}`);
      await api.put(`/admin/feature-flags/${name}`, { enabled });
      await fetchSystemData();
      alert('Feature flag updated successfully');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update feature flag');
    } finally {
      setSaving(null);
    }
  };

  const createAnnouncement = async () => {
    try {
      setSaving('announcement');
      await api.post('/admin/announcements', newAnnouncement);
      setNewAnnouncement({ title: '', message: '', type: 'INFO', expiresAt: '' });
      alert('Announcement created successfully');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create announcement');
    } finally {
      setSaving(null);
    }
  };

  const getSettingsByCategory = (category: string) => {
    return settings.filter(setting => setting.category === category);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'general': return <Settings className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'payment': return <DollarSign className="w-4 h-4" />;
      case 'security': return <Shield className="w-4 h-4" />;
      case 'features': return <Zap className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  const getAnnouncementIcon = (type: string) => {
    switch (type) {
      case 'INFO': return <Info className="w-4 h-4 text-blue-600" />;
      case 'WARNING': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'ERROR': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getAnnouncementColor = (type: string) => {
    switch (type) {
      case 'INFO': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'WARNING': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'ERROR': return 'bg-red-50 border-red-200 text-red-800';
      default: return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="bg-white rounded-lg p-6">
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
            <p className="text-gray-600 mt-1">
              Configure platform settings, email templates, and feature flags
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={fetchSystemData}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('general')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'general'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  General Settings
                </div>
              </button>
              <button
                onClick={() => setActiveTab('email')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'email'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Templates
                </div>
              </button>
              <button
                onClick={() => setActiveTab('features')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'features'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Feature Flags
                </div>
              </button>
              <button
                onClick={() => setActiveTab('announcements')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'announcements'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Announcements
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'general' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Platform Settings */}
            <Card className="p-6 border-0 shadow-sm bg-white">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Platform Configuration</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Platform Fee Percentage
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="30"
                      step="0.1"
                      defaultValue="15"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onBlur={(e) => updateSetting('PLATFORM_FEE_PERCENTAGE', e.target.value)}
                    />
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Commission rate charged to clients</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Job Budget
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">R</span>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      defaultValue="100"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onBlur={(e) => updateSetting('MIN_JOB_BUDGET', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Job Budget
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">R</span>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      defaultValue="50000"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onBlur={(e) => updateSetting('MAX_JOB_BUDGET', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Security Settings */}
            <Card className="p-6 border-0 shadow-sm bg-white">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Security Settings</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Timeout (minutes)
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="1440"
                    defaultValue="60"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onBlur={(e) => updateSetting('SESSION_TIMEOUT', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Login Attempts
                  </label>
                  <input
                    type="number"
                    min="3"
                    max="10"
                    defaultValue="5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onBlur={(e) => updateSetting('MAX_LOGIN_ATTEMPTS', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password Minimum Length
                  </label>
                  <input
                    type="number"
                    min="6"
                    max="20"
                    defaultValue="8"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onBlur={(e) => updateSetting('PASSWORD_MIN_LENGTH', e.target.value)}
                  />
                </div>
              </div>
            </Card>

            {/* Content Settings */}
            <Card className="p-6 border-0 shadow-sm bg-white">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">Content Settings</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Expiry Days
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    defaultValue="30"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onBlur={(e) => updateSetting('JOB_EXPIRY_DAYS', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Images per Job
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    defaultValue="5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onBlur={(e) => updateSetting('MAX_JOB_IMAGES', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum File Size (MB)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    defaultValue="5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onBlur={(e) => updateSetting('MAX_FILE_SIZE_MB', e.target.value)}
                  />
                </div>
              </div>
            </Card>

            {/* Notification Settings */}
            <Card className="p-6 border-0 shadow-sm bg-white">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="w-5 h-5 text-yellow-600" />
                <h3 className="text-lg font-semibold text-gray-900">Notification Settings</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Email Notifications
                  </label>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    onChange={(e) => updateSetting('EMAIL_NOTIFICATIONS_ENABLED', e.target.checked.toString())}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    SMS Notifications
                  </label>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    onChange={(e) => updateSetting('SMS_NOTIFICATIONS_ENABLED', e.target.checked.toString())}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Push Notifications
                  </label>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    onChange={(e) => updateSetting('PUSH_NOTIFICATIONS_ENABLED', e.target.checked.toString())}
                  />
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'email' && (
          <div className="space-y-6">
            <Card className="border-0 shadow-sm bg-white">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Email Templates</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Customize email templates sent to users
                </p>
              </div>

              <div className="divide-y divide-gray-200">
                {[
                  { type: 'welcome', name: 'Welcome Email', description: 'Sent to new users after registration' },
                  { type: 'job_posted', name: 'Job Posted', description: 'Confirmation when a job is posted' },
                  { type: 'bid_received', name: 'Bid Received', description: 'Notification when a bid is received' },
                  { type: 'job_completed', name: 'Job Completed', description: 'Notification when a job is completed' },
                  { type: 'payment_received', name: 'Payment Received', description: 'Confirmation of payment receipt' },
                  { type: 'password_reset', name: 'Password Reset', description: 'Password reset instructions' }
                ].map((template) => (
                  <div key={template.type} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-medium text-gray-900">{template.name}</h3>
                        <p className="text-sm text-gray-500">{template.description}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingItem(editingItem === template.type ? null : template.type)}
                      >
                        {editingItem === template.type ? <Eye className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                      </Button>
                    </div>

                    {editingItem === template.type && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Subject Line
                          </label>
                          <input
                            type="text"
                            defaultValue={`${template.name} - Taska Platform`}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Content
                          </label>
                          <textarea
                            rows={8}
                            defaultValue={`Dear {{user_name}},

Thank you for using Taska platform.

Best regards,
The Taska Team`}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Available variables: {'{'}user_name{'}'}, {'{'}job_title{'}'}, {'{'}amount{'}'}, {'{'}date{'}'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            disabled={saving === `template_${template.type}`}
                            onClick={() => updateEmailTemplate(template.type, 'Updated content')}
                          >
                            {saving === `template_${template.type}` ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                            Save
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setEditingItem(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'features' && (
          <Card className="border-0 shadow-sm bg-white">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Feature Flags</h2>
              <p className="text-sm text-gray-600 mt-1">
                Enable or disable platform features
              </p>
            </div>

            <div className="divide-y divide-gray-200">
              {[
                { name: 'REAL_TIME_CHAT', description: 'Enable real-time messaging between users', enabled: true },
                { name: 'PUSH_NOTIFICATIONS', description: 'Enable push notifications for mobile apps', enabled: true },
                { name: 'ADVANCED_SEARCH', description: 'Enable advanced search filters and sorting', enabled: false },
                { name: 'JOB_RECOMMENDATIONS', description: 'Enable AI-powered job recommendations', enabled: false },
                { name: 'VIDEO_CALLS', description: 'Enable video calls between clients and artisans', enabled: false },
                { name: 'SUBSCRIPTION_PLANS', description: 'Enable premium subscription plans', enabled: false }
              ].map((flag) => (
                <div key={flag.name} className="p-6 flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{flag.name.replace(/_/g, ' ')}</h3>
                    <p className="text-sm text-gray-500">{flag.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={`${flag.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {flag.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={flag.enabled}
                        disabled={saving === `flag_${flag.name}`}
                        onChange={(e) => updateFeatureFlag(flag.name, e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        flag.enabled ? 'bg-blue-600' : 'bg-gray-200'
                      }`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          flag.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </div>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {activeTab === 'announcements' && (
          <div className="space-y-6">
            {/* Create Announcement */}
            <Card className="p-6 border-0 shadow-sm bg-white">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create System Announcement</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Announcement title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={newAnnouncement.type}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, type: e.target.value as 'INFO' | 'WARNING' | 'ERROR' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="INFO">Information</option>
                    <option value="WARNING">Warning</option>
                    <option value="ERROR">Error/Maintenance</option>
                  </select>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  rows={3}
                  value={newAnnouncement.message}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Announcement message"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Expires At (optional)</label>
                <input
                  type="datetime-local"
                  value={newAnnouncement.expiresAt}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, expiresAt: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <Button
                onClick={createAnnouncement}
                disabled={!newAnnouncement.title || !newAnnouncement.message || saving === 'announcement'}
                className="flex items-center gap-2"
              >
                {saving === 'announcement' ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Create Announcement
              </Button>
            </Card>

            {/* Preview */}
            {(newAnnouncement.title || newAnnouncement.message) && (
              <Card className="p-6 border-0 shadow-sm bg-white">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
                <div className={`p-4 rounded-lg border-l-4 ${getAnnouncementColor(newAnnouncement.type)}`}>
                  <div className="flex items-start gap-3">
                    {getAnnouncementIcon(newAnnouncement.type)}
                    <div className="flex-1">
                      <h4 className="font-medium">{newAnnouncement.title || 'Announcement Title'}</h4>
                      <p className="mt-1 text-sm">{newAnnouncement.message || 'Announcement message will appear here...'}</p>
                      {newAnnouncement.expiresAt && (
                        <p className="mt-2 text-xs opacity-75">
                          Expires: {new Date(newAnnouncement.expiresAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemSettings;
