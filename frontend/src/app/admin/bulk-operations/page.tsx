'use client';

import { useState, useEffect } from 'react';
import { Users, Mail, Shield, FileText, History, ChevronDown } from 'lucide-react';

// Import all tab components
import BulkUserActions from './BulkUserActions';
import BulkEmailSender from './BulkEmailSender';
import BatchModeration from './BatchModeration';
import CsvExportImport from './CsvExportImport';
import OperationHistory from './OperationHistory';

type TabId = 'users' | 'email' | 'moderation' | 'csv' | 'history';

interface Tab {
  id: TabId;
  label: string;
  icon: typeof Users;
  component: React.ComponentType;
  description: string;
}

const tabs: Tab[] = [
  {
    id: 'users',
    label: 'User Actions',
    icon: Users,
    component: BulkUserActions,
    description: 'Ban, suspend, verify, or delete users in bulk'
  },
  {
    id: 'email',
    label: 'Email Campaigns',
    icon: Mail,
    component: BulkEmailSender,
    description: 'Send bulk emails to users with templates'
  },
  {
    id: 'moderation',
    label: 'Content Moderation',
    icon: Shield,
    component: BatchModeration,
    description: 'Moderate jobs, reviews, and comments in batches'
  },
  {
    id: 'csv',
    label: 'Import/Export',
    icon: FileText,
    component: CsvExportImport,
    description: 'Import and export data via CSV files'
  },
  {
    id: 'history',
    label: 'Operation History',
    icon: History,
    component: OperationHistory,
    description: 'View and track all bulk operations'
  }
];

export default function BulkOperationsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('users');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // URL state management
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab') as TabId;
    if (tabParam && tabs.find(t => t.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, []);

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);

    // Update URL without page reload
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tabId);
    window.history.pushState({}, '', url);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key >= '1' && e.key <= '5') {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        if (tabs[index]) {
          handleTabChange(tabs[index].id);
        }
      }

      // Arrow key navigation when focus is on tabs
      if (document.activeElement?.getAttribute('role') === 'tab') {
        const currentIndex = tabs.findIndex(t => t.id === activeTab);
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          const nextIndex = (currentIndex + 1) % tabs.length;
          handleTabChange(tabs[nextIndex].id);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
          handleTabChange(tabs[prevIndex].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  const ActiveComponent = tabs.find(t => t.id === activeTab)?.component || BulkUserActions;
  const activeTabData = tabs.find(t => t.id === activeTab);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-600" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <a href="/admin" className="hover:text-gray-900 transition-colors">
                Admin
              </a>
            </li>
            <li className="flex items-center">
              <span className="mx-2">/</span>
              <span className="font-medium text-gray-900">Bulk Operations</span>
            </li>
          </ol>
        </nav>

        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bulk Operations</h1>
          <p className="mt-2 text-gray-600">
            Manage users, send emails, moderate content, and import/export data at scale
          </p>
        </div>

        {/* Desktop Tab Navigation */}
        <div className="hidden md:block border-b border-gray-200 bg-white rounded-t-lg">
          <nav className="flex space-x-8 px-6" aria-label="Tabs" role="tablist">
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`tabpanel-${tab.id}`}
                  tabIndex={isActive ? 0 : -1}
                  className={`
                    flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                    transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    ${isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                  title={`${tab.label} (Alt+${index + 1})`}
                >
                  <Icon className="w-5 h-5" aria-hidden="true" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Mobile Tab Navigation (Dropdown) */}
        <div className="md:hidden bg-white rounded-lg border border-gray-200">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-full px-4 py-3 flex items-center justify-between text-left"
            aria-expanded={isMobileMenuOpen}
            aria-haspopup="true"
          >
            <div className="flex items-center gap-3">
              {activeTabData && (
                <>
                  <activeTabData.icon className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-900">{activeTabData.label}</span>
                </>
              )}
            </div>
            <ChevronDown
              className={`w-5 h-5 text-gray-400 transition-transform ${
                isMobileMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isMobileMenuOpen && (
            <div className="border-t border-gray-200">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`
                      w-full px-4 py-3 flex items-center gap-3 text-left
                      transition-colors
                      ${isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <div>
                      <div className="font-medium">{tab.label}</div>
                      <div className="text-xs text-gray-500">{tab.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Tab Content */}
        <div
          role="tabpanel"
          id={`tabpanel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <ActiveComponent />
        </div>

        {/* Keyboard Shortcuts Help */}
        <div className="hidden md:block text-xs text-gray-500 text-center">
          <p>Keyboard shortcuts: Alt+1-5 to switch tabs, Arrow keys when focused on tabs</p>
        </div>
      </div>
    </div>
  );
}
