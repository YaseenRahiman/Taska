package za.co.taska.data.remote.api

import retrofit2.Response
import retrofit2.http.*
import za.co.taska.data.remote.dto.request.MarkMultipleNotificationsAsReadRequest
import za.co.taska.data.remote.dto.request.MarkNotificationAsReadRequest
import za.co.taska.data.remote.dto.request.RegisterFcmTokenRequest
import za.co.taska.data.remote.dto.request.UpdateNotificationPreferencesRequest
import za.co.taska.data.remote.dto.response.NotificationPreferencesResponse
import za.co.taska.data.remote.dto.response.NotificationResponse
import za.co.taska.data.remote.dto.response.NotificationsListResponse

/**
 * Notifications API Service
 * Retrofit interface for notifications endpoints matching backend API
 */
interface NotificationsApiService {

    /**
     * Get notifications with filtering and pagination
     * GET /notifications?type=...&isRead=...&page=...&limit=...
     */
    @GET("notifications")
    suspend fun getNotifications(
        @Query("type") type: String? = null,
        @Query("isRead") isRead: Boolean? = null,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): Response<NotificationsListResponse>

    /**
     * Mark a single notification as read
     * POST /notifications/{id}/mark-read
     */
    @POST("notifications/{id}/mark-read")
    suspend fun markAsRead(
        @Path("id") notificationId: String
    ): Response<Unit>

    /**
     * Mark multiple notifications as read
     * POST /notifications/mark-read-batch
     */
    @POST("notifications/mark-read-batch")
    suspend fun markMultipleAsRead(
        @Body request: MarkMultipleNotificationsAsReadRequest
    ): Response<Unit>

    /**
     * Mark all notifications as read
     * POST /notifications/mark-all-read
     */
    @POST("notifications/mark-all-read")
    suspend fun markAllAsRead(): Response<Unit>

    /**
     * Clear (delete) all read notifications
     * DELETE /notifications/clear-read
     */
    @DELETE("notifications/clear-read")
    suspend fun clearReadNotifications(): Response<Unit>

    /**
     * Delete a specific notification
     * DELETE /notifications/{id}
     */
    @DELETE("notifications/{id}")
    suspend fun deleteNotification(
        @Path("id") notificationId: String
    ): Response<Unit>

    /**
     * Get user's notification preferences
     * GET /notifications/preferences
     */
    @GET("notifications/preferences")
    suspend fun getNotificationPreferences(): Response<NotificationPreferencesResponse>

    /**
     * Update user's notification preferences
     * PUT /notifications/preferences
     */
    @PUT("notifications/preferences")
    suspend fun updateNotificationPreferences(
        @Body request: UpdateNotificationPreferencesRequest
    ): Response<NotificationPreferencesResponse>

    /**
     * Register FCM token for push notifications
     * POST /notifications/register-token
     */
    @POST("notifications/register-token")
    suspend fun registerFcmToken(
        @Body request: RegisterFcmTokenRequest
    ): Response<Unit>

    /**
     * Get unread notification count
     * GET /notifications/unread-count
     */
    @GET("notifications/unread-count")
    suspend fun getUnreadCount(): Response<NotificationUnreadCountResponse>
}

/**
 * Notification unread count response
 */
data class NotificationUnreadCountResponse(
    val count: Int
)
