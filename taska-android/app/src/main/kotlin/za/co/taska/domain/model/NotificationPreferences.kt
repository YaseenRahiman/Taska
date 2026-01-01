package za.co.taska.domain.model

/**
 * Notification Preferences Domain Model
 * User preferences for different notification types
 */
data class NotificationPreferences(
    val userId: String,
    val enableBidNotifications: Boolean = true,
    val enableMessageNotifications: Boolean = true,
    val enablePaymentNotifications: Boolean = true,
    val enableReviewNotifications: Boolean = true,
    val enableSystemNotifications: Boolean = true,
    val updatedAt: String
) {
    /**
     * Check if notifications are enabled for a specific type
     */
    fun isEnabledFor(type: NotificationType): Boolean {
        return when (type) {
            NotificationType.BID_RECEIVED,
            NotificationType.BID_ACCEPTED,
            NotificationType.BID_REJECTED -> enableBidNotifications

            NotificationType.MESSAGE_RECEIVED -> enableMessageNotifications

            NotificationType.PAYMENT_COMPLETED,
            NotificationType.PAYMENT_RELEASED -> enablePaymentNotifications

            NotificationType.REVIEW_RECEIVED,
            NotificationType.JOB_COMPLETED -> enableReviewNotifications

            NotificationType.SYSTEM -> enableSystemNotifications
        }
    }

    /**
     * Check if all notifications are disabled
     */
    val allDisabled: Boolean
        get() = !enableBidNotifications &&
                !enableMessageNotifications &&
                !enablePaymentNotifications &&
                !enableReviewNotifications &&
                !enableSystemNotifications

    /**
     * Check if all notifications are enabled
     */
    val allEnabled: Boolean
        get() = enableBidNotifications &&
                enableMessageNotifications &&
                enablePaymentNotifications &&
                enableReviewNotifications &&
                enableSystemNotifications
}
