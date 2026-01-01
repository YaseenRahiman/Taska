package za.co.taska.domain.model

/**
 * Notification Type Enum
 * Defines all possible notification types in the system
 */
enum class NotificationType {
    BID_RECEIVED,       // New bid received on a job
    BID_ACCEPTED,       // Bid was accepted by client
    BID_REJECTED,       // Bid was rejected by client
    MESSAGE_RECEIVED,   // New message received
    PAYMENT_COMPLETED,  // Payment was completed successfully
    PAYMENT_RELEASED,   // Escrow payment was released
    REVIEW_RECEIVED,    // New review received
    JOB_COMPLETED,      // Job marked as complete
    SYSTEM              // System announcements
}
