package za.co.taska.domain.repository

import kotlinx.coroutines.flow.Flow
import za.co.taska.domain.model.Notification
import za.co.taska.domain.model.NotificationPreferences

/**
 * Notifications Repository Interface
 * Defines contract for notification data operations
 */
interface NotificationsRepository {

    /**
     * Get notifications with optional filtering and pagination
     * Returns a Flow for real-time updates
     */
    fun getNotifications(
        type: String? = null,
        isRead: Boolean? = null,
        limit: Int = 20,
        offset: Int = 0
    ): Flow<Result<List<Notification>>>

    /**
     * Mark a single notification as read
     */
    suspend fun markNotificationAsRead(notificationId: String): Result<Unit>

    /**
     * Mark multiple notifications as read
     */
    suspend fun markMultipleNotificationsAsRead(notificationIds: List<String>): Result<Unit>

    /**
     * Mark all notifications as read
     */
    suspend fun markAllNotificationsAsRead(): Result<Unit>

    /**
     * Clear (delete) all read notifications
     */
    suspend fun clearReadNotifications(): Result<Unit>

    /**
     * Delete a specific notification
     */
    suspend fun deleteNotification(notificationId: String): Result<Unit>

    /**
     * Get user's notification preferences
     */
    suspend fun getNotificationPreferences(): Result<NotificationPreferences>

    /**
     * Update user's notification preferences
     */
    suspend fun updateNotificationPreferences(
        enableBidNotifications: Boolean? = null,
        enableMessageNotifications: Boolean? = null,
        enablePaymentNotifications: Boolean? = null,
        enableReviewNotifications: Boolean? = null,
        enableSystemNotifications: Boolean? = null
    ): Result<NotificationPreferences>

    /**
     * Get unread notification count
     */
    suspend fun getUnreadCount(): Result<Int>

    /**
     * Register FCM token for push notifications
     */
    suspend fun registerFcmToken(token: String, deviceId: String): Result<Unit>
}
