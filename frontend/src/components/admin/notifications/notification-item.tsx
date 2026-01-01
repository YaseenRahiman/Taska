'use client';

import React from 'react';
import { Bell, CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { Notification } from '@/hooks/use-notifications';
import { formatDistanceToNow } from 'date-fns';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  compact = false,
}: NotificationItemProps) {
  const getIcon = () => {
    switch (notification.type) {
      case 'SUCCESS':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'ERROR':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'WARNING':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'SYSTEM':
        return <Bell className="h-5 w-5 text-blue-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  const getBgColor = () => {
    if (notification.isRead) {
      return 'bg-gray-50';
    }
    switch (notification.type) {
      case 'SUCCESS':
        return 'bg-green-50';
      case 'ERROR':
        return 'bg-red-50';
      case 'WARNING':
        return 'bg-orange-50';
      case 'SYSTEM':
        return 'bg-blue-50';
      default:
        return 'bg-white';
    }
  };

  const getBorderColor = () => {
    if (notification.isRead) {
      return 'border-gray-200';
    }
    switch (notification.type) {
      case 'SUCCESS':
        return 'border-green-200';
      case 'ERROR':
        return 'border-red-200';
      case 'WARNING':
        return 'border-orange-200';
      case 'SYSTEM':
        return 'border-blue-200';
      default:
        return 'border-gray-200';
    }
  };

  const handleClick = () => {
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(notification.id);
    }
  };

  return (
    <div
      className={`
        ${getBgColor()} ${getBorderColor()}
        border rounded-lg p-4 transition-all hover:shadow-md cursor-pointer
        ${!notification.isRead ? 'border-l-4' : ''}
        ${compact ? 'p-3' : 'p-4'}
      `}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-1">{getIcon()}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={`text-sm font-semibold ${notification.isRead ? 'text-gray-600' : 'text-gray-900'}`}>
              {notification.title}
            </h4>

            {/* Delete button */}
            {onDelete && (
              <button
                onClick={handleDelete}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Delete notification"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <p className={`text-sm mt-1 ${notification.isRead ? 'text-gray-500' : 'text-gray-700'}`}>
            {notification.message}
          </p>

          {/* Timestamp */}
          <p className="text-xs text-gray-400 mt-2">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </p>

          {/* Additional data if present */}
          {notification.data && Object.keys(notification.data).length > 0 && !compact && (
            <div className="mt-2 p-2 bg-white/50 rounded text-xs">
              {Object.entries(notification.data).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="font-medium text-gray-600">{key}:</span>
                  <span className="text-gray-800">{String(value)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Unread indicator */}
        {!notification.isRead && (
          <div className="flex-shrink-0">
            <div className="h-2 w-2 bg-blue-600 rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
}
