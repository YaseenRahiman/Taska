package za.co.taska.domain.model

/**
 * Notification Domain Model
 * Clean architecture - no framework dependencies
 */
data class Notification(
    val id: String,
    val userId: String,
    val type: NotificationType,
    val title: String,
    val body: String,
    val data: Map<String, String>,
    val isRead: Boolean,
    val createdAt: String,
    val readAt: String?
) {
    val isBidNotification: Boolean
        get() = type == NotificationType.BID_RECEIVED ||
                type == NotificationType.BID_ACCEPTED ||
                type == NotificationType.BID_REJECTED

    val isMessageNotification: Boolean
        get() = type == NotificationType.MESSAGE_RECEIVED

    val isPaymentNotification: Boolean
        get() = type == NotificationType.PAYMENT_COMPLETED ||
                type == NotificationType.PAYMENT_RELEASED

    val isReviewNotification: Boolean
        get() = type == NotificationType.REVIEW_RECEIVED

    val isSystemNotification: Boolean
        get() = type == NotificationType.SYSTEM

    /**
     * Get associated ID from notification data
     * (e.g., bidId, messageId, paymentId, etc.)
     */
    val associatedId: String?
        get() = data["bidId"] ?: data["messageId"] ?: data["paymentId"] ?: data["reviewId"]

    /**
     * Get associated job ID if available
     */
    val jobId: String?
        get() = data["jobId"]
}
