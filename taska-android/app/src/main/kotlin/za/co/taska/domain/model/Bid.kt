package za.co.taska.domain.model

/**
 * Bid Domain Model
 * Clean architecture - no framework dependencies
 */
data class Bid(
    val id: String,
    val jobId: String,
    val artisanId: String,
    val amount: Double,
    val message: String,
    val estimatedDays: Int,
    val attachments: List<String>,
    val status: BidStatus,
    val acceptedAt: String?,
    val rejectedAt: String?,
    val withdrawnAt: String?,
    val expiresAt: String,
    val createdAt: String,
    val job: Job?
) {
    val amountDisplay: String
        get() = "R ${amount.toInt()}"

    val estimatedDaysDisplay: String
        get() = when (estimatedDays) {
            1 -> "1 day"
            else -> "$estimatedDays days"
        }

    val statusDisplay: String
        get() = when (status) {
            BidStatus.PENDING -> "Waiting for response"
            BidStatus.ACCEPTED -> "Accepted! 🎉"
            BidStatus.REJECTED -> "Not selected"
            BidStatus.WITHDRAWN -> "Withdrawn"
            BidStatus.EXPIRED -> "Expired"
        }

    val canEdit: Boolean
        get() = status == BidStatus.PENDING

    val canWithdraw: Boolean
        get() = status == BidStatus.PENDING
}

enum class BidStatus {
    PENDING,
    ACCEPTED,
    REJECTED,
    WITHDRAWN,
    EXPIRED
}
