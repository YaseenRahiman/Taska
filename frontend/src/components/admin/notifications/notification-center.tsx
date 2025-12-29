'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2, Eye } from 'lucide-react';
import { useNotifications } from '@/hooks/use-notifications';
import { NotificationItem } from './notification-item';
import { Button } from '@/components/ui/button';

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    counts,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = (id: string) => {
    markAsRead([id]);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleClearAll = async () => {
    const confirmed = window.confirm('Are you sure you want to clear all notifications?');
    if (confirmed) {
      await clearAll();
    }
  };

  const unreadNotifications = notifications.filter(n => !n.isRead);
  const recentNotifications = notifications.slice(0, 10);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-6 w-6" />

        {/* Unread count badge */}
        {counts.unread > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full transform translate-x-1/2 -translate-y-1/2">
            {counts.unread > 99 ? '99+' : counts.unread}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                <p className="text-sm text-gray-500">
                  {counts.unread > 0 ? `${counts.unread} unread` : 'All caught up!'}
                </p>
              </div>

              {/* Connection status indicator */}
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" title="Connected" />
              </div>
            </div>

            {/* Action buttons */}
            {notifications.length > 0 && (
              <div className="flex gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  disabled={counts.unread === 0}
                  className="flex-1"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Mark all read
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear all
                </Button>
              </div>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
                <p className="text-sm text-gray-500 mt-2">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-600 font-medium">No notifications</p>
                <p className="text-xs text-gray-400 mt-1">
                  You're all caught up! Check back later.
                </p>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {/* Show unread first */}
                {unreadNotifications.length > 0 && (
                  <>
                    <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Unread ({unreadNotifications.length})
                    </div>
                    {unreadNotifications.map(notification => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={handleMarkAsRead}
                        onDelete={deleteNotification}
                        compact
                      />
                    ))}
                  </>
                )}

                {/* Show read notifications */}
                {recentNotifications.filter(n => n.isRead).length > 0 && (
                  <>
                    <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide mt-3">
                      Read
                    </div>
                    {recentNotifications
                      .filter(n => n.isRead)
                      .map(notification => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onMarkAsRead={handleMarkAsRead}
                          onDelete={deleteNotification}
                          compact
                        />
                      ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 10 && (
            <div className="p-3 border-t border-gray-200 text-center">
              <a
                href="/admin/notifications"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1"
              >
                <Eye className="h-4 w-4" />
                View all notifications
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
