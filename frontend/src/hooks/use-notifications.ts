'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '@/components/providers/websocket-provider';
import toast from 'react-hot-toast';

export interface Notification {
  id: string;
  userId: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'SYSTEM';
  title: string;
  message: string;
  isRead: boolean;
  data?: Record<string, any>;
  createdAt: string;
}

export interface NotificationCounts {
  unread: number;
  total: number;
}

export interface UseNotificationsReturn {
  notifications: Notification[];
  counts: NotificationCounts;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationIds: string[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [counts, setCounts] = useState<NotificationCounts>({ unread: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const { subscribe, unsubscribe, isConnected } = useWebSocket();

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        return;
      }

      const response = await fetch(`${API_BASE_URL}/admin/notifications?limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      setNotifications(data.items || []);

      // Fetch counts
      const countsResponse = await fetch(`${API_BASE_URL}/admin/notifications/counts/summary`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (countsResponse.ok) {
        const countsData = await countsResponse.json();
        setCounts(countsData);
      }
    } catch (error) {
      console.error('[useNotifications] Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark specific notifications as read
  const markAsRead = useCallback(async (notificationIds: string[]) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        return;
      }

      const response = await fetch(`${API_BASE_URL}/admin/notifications/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark notifications as read');
      }

      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          notificationIds.includes(n.id) ? { ...n, isRead: true } : n
        )
      );

      // Update counts
      setCounts(prev => ({
        ...prev,
        unread: Math.max(0, prev.unread - notificationIds.length),
      }));
    } catch (error) {
      console.error('[useNotifications] Error marking as read:', error);
      toast.error('Failed to mark notifications as read');
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        return;
      }

      const response = await fetch(`${API_BASE_URL}/admin/notifications/read-all`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to mark all as read');
      }

      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setCounts(prev => ({ ...prev, unread: 0 }));

      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('[useNotifications] Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  }, []);

  // Delete a specific notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        return;
      }

      const response = await fetch(`${API_BASE_URL}/admin/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }

      // Find the notification before deletion to check if it was unread
      const notification = notifications.find(n => n.id === notificationId);
      const wasUnread = notification && !notification.isRead;

      // Update local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setCounts(prev => ({
        total: Math.max(0, prev.total - 1),
        unread: wasUnread ? Math.max(0, prev.unread - 1) : prev.unread,
      }));
    } catch (error) {
      console.error('[useNotifications] Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  }, [notifications]);

  // Clear all notifications
  const clearAll = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        return;
      }

      const response = await fetch(`${API_BASE_URL}/admin/notifications`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to clear notifications');
      }

      setNotifications([]);
      setCounts({ unread: 0, total: 0 });

      toast.success('All notifications cleared');
    } catch (error) {
      console.error('[useNotifications] Error clearing notifications:', error);
      toast.error('Failed to clear notifications');
    }
  }, []);

  // Handle real-time notification events
  useEffect(() => {
    if (!isConnected) {
      return;
    }

    // Handler for new notifications
    const handleNewNotification = (data: any) => {
      console.log('[useNotifications] New notification received:', data);

      const notification: Notification = data.data;

      // Add to notifications list
      setNotifications(prev => [notification, ...prev]);

      // Update counts
      setCounts(prev => ({
        total: prev.total + 1,
        unread: prev.unread + 1,
      }));

      // Show toast notification
      const toastOptions = {
        duration: 5000,
        position: 'top-right' as const,
      };

      switch (notification.type) {
        case 'SUCCESS':
          toast.success(notification.message, toastOptions);
          break;
        case 'ERROR':
          toast.error(notification.message, toastOptions);
          break;
        case 'WARNING':
          toast(notification.message, { ...toastOptions, icon: '⚠️' });
          break;
        default:
          toast(notification.message, toastOptions);
      }
    };

    // Subscribe to notification events
    subscribe('notification:new', handleNewNotification);

    // Cleanup on unmount
    return () => {
      unsubscribe('notification:new', handleNewNotification);
    };
  }, [isConnected, subscribe, unsubscribe]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    counts,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  };
}
