package za.co.taska.data.remote.dto.request

import com.google.gson.annotations.SerializedName

/**
 * Mark Notification as Read Request
 */
data class MarkNotificationAsReadRequest(
    @SerializedName("notificationId")
    val notificationId: String
)

/**
 * Mark Multiple Notifications as Read Request
 */
data class MarkMultipleNotificationsAsReadRequest(
    @SerializedName("notificationIds")
    val notificationIds: List<String>
)

/**
 * Update Notification Preferences Request
 */
data class UpdateNotificationPreferencesRequest(
    @SerializedName("enableBidNotifications")
    val enableBidNotifications: Boolean? = null,

    @SerializedName("enableMessageNotifications")
    val enableMessageNotifications: Boolean? = null,

    @SerializedName("enablePaymentNotifications")
    val enablePaymentNotifications: Boolean? = null,

    @SerializedName("enableReviewNotifications")
    val enableReviewNotifications: Boolean? = null,

    @SerializedName("enableSystemNotifications")
    val enableSystemNotifications: Boolean? = null
)

/**
 * Register FCM Token Request
 */
data class RegisterFcmTokenRequest(
    @SerializedName("token")
    val token: String,

    @SerializedName("deviceId")
    val deviceId: String,

    @SerializedName("platform")
    val platform: String = "android"
)
