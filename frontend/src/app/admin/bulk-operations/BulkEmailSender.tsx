'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Mail, Send, Eye, Calendar, X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { api } from '@/lib/api';
import type { BulkEmailSendRequest } from '@/types/bulk-operations.types';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

type RecipientType = 'all' | 'clients' | 'artisans' | 'custom';

interface FormData {
  recipientType: RecipientType;
  customEmails: string;
  subject: string;
  body: string;
  templateId: string;
  scheduleAt: string;
}

interface FormErrors {
  recipientType?: string;
  customEmails?: string;
  subject?: string;
  body?: string;
  scheduleAt?: string;
}

export default function BulkEmailSender() {
  const [formData, setFormData] = useState<FormData>({
    recipientType: 'all',
    customEmails: '',
    subject: '',
    body: '',
    templateId: '',
    scheduleAt: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const response = await api.get('/admin/email-templates');
      setTemplates(response.data || []);
    } catch (error: any) {
      console.error('Error fetching templates:', error);
      // Don't show error toast - templates are optional
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        templateId,
        subject: template.subject,
        body: template.body,
      }));
      // Clear subject and body errors when template is loaded
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.subject;
        delete newErrors.body;
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate subject
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    } else if (formData.subject.length < 5) {
      newErrors.subject = 'Subject must be at least 5 characters';
    } else if (formData.subject.length > 200) {
      newErrors.subject = 'Subject must not exceed 200 characters';
    }

    // Validate body
    if (!formData.body.trim()) {
      newErrors.body = 'Email body is required';
    } else if (formData.body.length < 20) {
      newErrors.body = 'Body must be at least 20 characters';
    } else if (formData.body.length > 5000) {
      newErrors.body = 'Body must not exceed 5000 characters';
    }

    // Validate custom emails if selected
    if (formData.recipientType === 'custom') {
      if (!formData.customEmails.trim()) {
        newErrors.customEmails = 'Please enter at least one email address';
      } else {
        const emails = formData.customEmails.split(/[\n,;]+/).map(e => e.trim()).filter(e => e);
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const invalidEmails = emails.filter(email => !emailRegex.test(email));

        if (invalidEmails.length > 0) {
          newErrors.customEmails = `Invalid email addresses: ${invalidEmails.slice(0, 3).join(', ')}${invalidEmails.length > 3 ? '...' : ''}`;
        }
      }
    }

    // Validate schedule date
    if (formData.scheduleAt) {
      const scheduleDate = new Date(formData.scheduleAt);
      if (scheduleDate <= new Date()) {
        newErrors.scheduleAt = 'Schedule date must be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getRecipientCount = (): string => {
    if (formData.recipientType === 'custom') {
      const emails = formData.customEmails.split(/[\n,;]+/).map(e => e.trim()).filter(e => e);
      return `${emails.length} recipient${emails.length !== 1 ? 's' : ''}`;
    }
    return formData.recipientType === 'all' ? 'all users' :
           formData.recipientType === 'clients' ? 'all clients' : 'all artisans';
  };

  const handlePreview = () => {
    if (!formData.subject.trim() || !formData.body.trim()) {
      toast.error('Please enter subject and body to preview');
      return;
    }
    setShowPreview(true);
  };

  const handleSend = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors before sending');
      return;
    }
    setShowConfirmDialog(true);
  };

  const confirmSend = async () => {
    try {
      setLoading(true);
      setShowConfirmDialog(false);

      // Prepare request payload
      const payload: BulkEmailSendRequest = {
        recipients: formData.recipientType === 'custom'
          ? formData.customEmails.split(/[\n,;]+/).map(e => e.trim()).filter(e => e)
          : formData.recipientType,
        subject: formData.subject.trim(),
        body: formData.body.trim(),
      };

      if (formData.templateId) {
        payload.templateId = formData.templateId;
      }

      if (formData.scheduleAt) {
        payload.scheduleAt = formData.scheduleAt;
      }

      const response = await api.post('/admin/bulk/email/send', payload);

      const recipientCount = formData.recipientType === 'custom'
        ? payload.recipients.length
        : getRecipientCount();

      toast.success(`Email queued for sending to ${recipientCount}`);

      // Clear form
      setFormData({
        recipientType: 'all',
        customEmails: '',
        subject: '',
        body: '',
        templateId: '',
        scheduleAt: '',
      });
      setErrors({});
    } catch (error: any) {
      console.error('Error sending email:', error);
      const errorMessage = error.response?.data?.message || 'Failed to send email';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClearForm = () => {
    if (formData.subject || formData.body || formData.customEmails) {
      if (!confirm('Are you sure you want to clear the form?')) {
        return;
      }
    }

    setFormData({
      recipientType: 'all',
      customEmails: '',
      subject: '',
      body: '',
      templateId: '',
      scheduleAt: '',
    });
    setErrors({});
  };

  return (
    <div className="space-y-6">
      {/* Recipient Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Recipients
        </label>
        <div className="space-y-3">
          {(['all', 'clients', 'artisans', 'custom'] as RecipientType[]).map((type) => (
            <label key={type} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="recipientType"
                value={type}
                checked={formData.recipientType === type}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, recipientType: e.target.value as RecipientType }));
                  if (e.target.value !== 'custom') {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.customEmails;
                      return newErrors;
                    });
                  }
                }}
                className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 capitalize">
                {type === 'custom' ? 'Custom Email List' : `All ${type === 'all' ? 'Users' : type}`}
              </span>
            </label>
          ))}
        </div>

        {/* Custom Email List */}
        {formData.recipientType === 'custom' && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Addresses (one per line, or comma/semicolon separated)
            </label>
            <textarea
              value={formData.customEmails}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, customEmails: e.target.value }));
                if (errors.customEmails) {
                  setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.customEmails;
                    return newErrors;
                  });
                }
              }}
              rows={5}
              className={`w-full px-3 py-2 border ${errors.customEmails ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              placeholder="user1@example.com&#10;user2@example.com&#10;user3@example.com"
            />
            {errors.customEmails && (
              <p className="mt-1 text-sm text-red-600">{errors.customEmails}</p>
            )}
          </div>
        )}
      </div>

      {/* Template Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email Template (Optional)
        </label>
        <select
          value={formData.templateId}
          onChange={(e) => handleTemplateSelect(e.target.value)}
          disabled={loadingTemplates}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
        >
          <option value="">No template - write custom email</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
      </div>

      {/* Subject */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Subject <span className="text-red-600">*</span>
        </label>
        <input
          type="text"
          value={formData.subject}
          onChange={(e) => {
            setFormData(prev => ({ ...prev, subject: e.target.value }));
            if (errors.subject) {
              setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.subject;
                return newErrors;
              });
            }
          }}
          maxLength={200}
          className={`w-full px-3 py-2 border ${errors.subject ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          placeholder="Enter email subject..."
        />
        <div className="flex items-center justify-between mt-2">
          {errors.subject ? (
            <p className="text-sm text-red-600">{errors.subject}</p>
          ) : (
            <p className="text-sm text-gray-500">Minimum 5 characters</p>
          )}
          <p className={`text-sm ${formData.subject.length > 180 ? 'text-red-600' : 'text-gray-500'}`}>
            {formData.subject.length}/200
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email Body <span className="text-red-600">*</span>
        </label>
        <textarea
          value={formData.body}
          onChange={(e) => {
            setFormData(prev => ({ ...prev, body: e.target.value }));
            if (errors.body) {
              setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.body;
                return newErrors;
              });
            }
          }}
          maxLength={5000}
          rows={12}
          className={`w-full px-3 py-2 border ${errors.body ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm`}
          placeholder="Enter email body... You can use basic HTML tags for formatting."
        />
        <div className="flex items-center justify-between mt-2">
          {errors.body ? (
            <p className="text-sm text-red-600">{errors.body}</p>
          ) : (
            <p className="text-sm text-gray-500">Minimum 20 characters</p>
          )}
          <p className={`text-sm ${formData.body.length > 4800 ? 'text-red-600' : 'text-gray-500'}`}>
            {formData.body.length}/5000
          </p>
        </div>
      </div>

      {/* Schedule Date */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Schedule Send (Optional)
        </label>
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-gray-400" />
          <input
            type="datetime-local"
            value={formData.scheduleAt}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, scheduleAt: e.target.value }));
              if (errors.scheduleAt) {
                setErrors(prev => {
                  const newErrors = { ...prev };
                  delete newErrors.scheduleAt;
                  return newErrors;
                });
              }
            }}
            min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
            className={`flex-1 px-3 py-2 border ${errors.scheduleAt ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          />
        </div>
        {errors.scheduleAt && (
          <p className="mt-2 text-sm text-red-600">{errors.scheduleAt}</p>
        )}
        <p className="mt-2 text-sm text-gray-500">
          Leave empty to send immediately
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={handlePreview}
          disabled={loading || !formData.subject.trim() || !formData.body.trim()}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Eye className="w-4 h-4" />
          Preview
        </button>

        <button
          onClick={handleClearForm}
          disabled={loading}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Clear Form
        </button>

        <button
          onClick={handleSend}
          disabled={loading}
          className="flex items-center gap-2 ml-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send Email
            </>
          )}
        </button>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Email Preview</h3>
                <p className="text-sm text-gray-500 mt-1">To: {getRecipientCount()}</p>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close preview"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Subject:</div>
                  <div className="text-lg font-semibold text-gray-900">{formData.subject}</div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="prose max-w-none">
                    <div
                      className="text-gray-700 whitespace-pre-wrap break-words"
                      dangerouslySetInnerHTML={{ __html: formData.body }}
                    />
                  </div>
                </div>

                {formData.scheduleAt && (
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Scheduled for: {format(new Date(formData.scheduleAt), 'PPp')}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowPreview(false)}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Confirm Email Send
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Are you sure you want to send this email to <strong>{getRecipientCount()}</strong>?
                </p>
                {formData.scheduleAt && (
                  <p className="text-sm text-gray-600 mb-4">
                    The email will be sent on <strong>{format(new Date(formData.scheduleAt), 'PPp')}</strong>
                  </p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmDialog(false)}
                    disabled={loading}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmSend}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
                  >
                    {loading ? 'Sending...' : 'Send Now'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
