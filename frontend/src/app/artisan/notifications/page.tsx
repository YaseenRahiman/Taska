'use client'

import React, { useState, useEffect } from 'react'
import { ArtisanNavbar } from '@/components/artisan/ArtisanNavbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/lib/api'
import { formatRelativeTime } from '@/lib/utils'
import {
  Bell,
  BellOff,
  CheckCheck,
  Trash2,
  Briefcase,
  MessageCircle,
  DollarSign,
  Star,
  AlertCircle,
  Clock,
  User,
  Filter
} from 'lucide-react'

interface Notification {
  id: string
  type: 'BID_ACCEPTED' | 'BID_REJECTED' | 'NEW_MESSAGE' | 'PAYMENT_RECEIVED' | 'REVIEW_RECEIVED' | 'JOB_MATCH' | 'SYSTEM'
  title: string
  message: string
  read: boolean
  createdAt: string
  actionUrl?: string
  metadata?: {
    jobId?: string
    bidId?: string
    amount?: number
    rating?: number
  }
}

export default function ArtisanNotifications() {
  useEffect(() => {
    document.title = 'Taska - Notifications';
  }, []);

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await api.get('/notifications')

      // Mock notifications data
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'BID_ACCEPTED',
          title: 'Bid Accepted!',
          message: 'Your bid for Kitchen Sink Repair has been accepted by Sarah Miller',
          read: false,
          createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          actionUrl: '/artisan/projects/job-1',
          metadata: { jobId: 'job-1', bidId: 'bid-1' }
        },
        {
          id: '2',
          type: 'NEW_MESSAGE',
          title: 'New Message',
          message: 'John Davidson sent you a message about Electrical Installation',
          read: false,
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          actionUrl: '/artisan/messages',
          metadata: { jobId: 'job-2' }
        },
        {
          id: '3',
          type: 'PAYMENT_RECEIVED',
          title: 'Payment Received',
          message: 'You received R2,500.00 for completed job',
          read: true,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          actionUrl: '/artisan/earnings',
          metadata: { amount: 2500 }
        },
        {
          id: '4',
          type: 'REVIEW_RECEIVED',
          title: 'New Review',
          message: 'Mike Chen left you a 5-star review',
          read: true,
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          actionUrl: '/artisan/profile#reviews',
          metadata: { rating: 5 }
        },
        {
          id: '5',
          type: 'JOB_MATCH',
          title: 'New Job Match',
          message: 'A new plumbing job matches your skills and location',
          read: false,
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          actionUrl: '/artisan/jobs',
          metadata: { jobId: 'job-5' }
        },
        {
          id: '6',
          type: 'BID_REJECTED',
          title: 'Bid Not Selected',
          message: 'Your bid for Garden Landscaping was not selected',
          read: true,
          createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          metadata: { jobId: 'job-4', bidId: 'bid-4' }
        },
        {
          id: '7',
          type: 'SYSTEM',
          title: 'Profile Verification',
          message: 'Complete your profile verification to unlock more opportunities',
          read: true,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          actionUrl: '/artisan/profile'
        }
      ]

      // Handle both array and object response formats
      const notificationsData = Array.isArray(response.data)
        ? response.data
        : response.data?.notifications || response.data?.data || [];
      setNotifications(notificationsData.length > 0 ? notificationsData : mockNotifications)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await api.put(`/notifications/${notificationId}/read`)
      setNotifications(notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      ))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/mark-all-read')
      setNotifications(notifications.map(n => ({ ...n, read: true })))
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      await api.delete(`/notifications/${notificationId}`)
      setNotifications(notifications.filter(n => n.id !== notificationId))
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const deleteAllRead = async () => {
    try {
      await api.delete('/notifications/read')
      setNotifications(notifications.filter(n => !n.read))
    } catch (error) {
      console.error('Error deleting read notifications:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'BID_ACCEPTED':
        return <Briefcase className="w-5 h-5 text-green-600" />
      case 'BID_REJECTED':
        return <Briefcase className="w-5 h-5 text-red-600" />
      case 'NEW_MESSAGE':
        return <MessageCircle className="w-5 h-5 text-blue-600" />
      case 'PAYMENT_RECEIVED':
        return <DollarSign className="w-5 h-5 text-green-600" />
      case 'REVIEW_RECEIVED':
        return <Star className="w-5 h-5 text-yellow-600" />
      case 'JOB_MATCH':
        return <Bell className="w-5 h-5 text-primary-600" />
      case 'SYSTEM':
        return <AlertCircle className="w-5 h-5 text-gray-600" />
      default:
        return <Bell className="w-5 h-5 text-gray-600" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'BID_ACCEPTED':
        return 'bg-green-100'
      case 'BID_REJECTED':
        return 'bg-red-100'
      case 'NEW_MESSAGE':
        return 'bg-blue-100'
      case 'PAYMENT_RECEIVED':
        return 'bg-green-100'
      case 'REVIEW_RECEIVED':
        return 'bg-yellow-100'
      case 'JOB_MATCH':
        return 'bg-primary-100'
      case 'SYSTEM':
        return 'bg-gray-100'
      default:
        return 'bg-gray-100'
    }
  }

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications

  const unreadCount = notifications.filter(n => !n.read).length

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50">
        <ArtisanNavbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-16 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <ArtisanNavbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-600 mt-2">
                Stay updated with your activity and opportunities
                {unreadCount > 0 && (
                  <Badge className="ml-2 bg-primary-600 text-white">
                    {unreadCount} new
                  </Badge>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  onClick={markAllAsRead}
                  className="text-primary-600 border-primary-600 hover:bg-primary-50"
                >
                  <CheckCheck className="w-4 h-4 mr-2" />
                  Mark All Read
                </Button>
              )}
              <Button
                variant="outline"
                onClick={deleteAllRead}
                className="text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Read
              </Button>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread')} className="mb-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="all">
              All ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread">
              Unread ({unreadCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BellOff className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                {filter === 'unread'
                  ? "You're all caught up! No unread notifications."
                  : "You don't have any notifications yet."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={`transition-all hover:shadow-md cursor-pointer ${
                  !notification.read ? 'border-l-4 border-l-primary-600' : ''
                }`}
                onClick={() => {
                  if (!notification.read) {
                    markAsRead(notification.id)
                  }
                  if (notification.actionUrl) {
                    window.location.href = notification.actionUrl
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`p-3 ${getNotificationColor(notification.type)} rounded-full flex-shrink-0`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className={`font-semibold ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0 mt-2"></div>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{notification.message}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{formatRelativeTime(notification.createdAt)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            markAsRead(notification.id)
                          }}
                          className="text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                          title="Mark as read"
                        >
                          <CheckCheck className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNotification(notification.id)
                        }}
                        className="text-gray-600 hover:text-red-600 hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info Card */}
        {filteredNotifications.length > 0 && (
          <Card className="mt-6 bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Bell className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">Notification Settings</p>
                  <p className="text-blue-800">
                    Manage how you receive notifications in{' '}
                    <a href="/artisan/settings?tab=notifications" className="underline font-medium">
                      Settings
                    </a>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
