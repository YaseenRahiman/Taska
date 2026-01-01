package za.co.taska.data.remote.dto.response

import com.google.gson.annotations.SerializedName

/**
 * Notification Response DTO
 * API response for notification data
 */
data class NotificationResponse(
    @SerializedName("id")
    val id: String,

    @SerializedName("userId")
    val userId: String,

    @SerializedName("type")
    val type: String,

    @SerializedName("title")
    val title: String,

    @SerializedName("body")
    val body: String,

    @SerializedName("data")
    val data: Map<String, String>,

    @SerializedName("isRead")
    val isRead: Boolean,

    @SerializedName("createdAt")
    val createdAt: String,

    @SerializedName("readAt")
    val readAt: String?
)

/**
 * Notification Preferences Response DTO
 * API response for user notification preferences
 */
data class NotificationPreferencesResponse(
    @SerializedName("userId")
    val userId: String,

    @SerializedName("enableBidNotifications")
    val enableBidNotifications: Boolean,

    @SerializedName("enableMessageNotifications")
    val enableMessageNotifications: Boolean,

    @SerializedName("enablePaymentNotifications")
    val enablePaymentNotifications: Boolean,

    @SerializedName("enableReviewNotifications")
    val enableReviewNotifications: Boolean,

    @SerializedName("enableSystemNotifications")
    val enableSystemNotifications: Boolean,

    @SerializedName("updatedAt")
    val updatedAt: String
)

/**
 * Notifications List Response
 * Paginated response for notifications
 */
data class NotificationsListResponse(
    @SerializedName("notifications")
    val notifications: List<NotificationResponse>,

    @SerializedName("total")
    val total: Int,

    @SerializedName("page")
    val page: Int,

    @SerializedName("limit")
    val limit: Int,

    @SerializedName("hasMore")
    val hasMore: Boolean
)
