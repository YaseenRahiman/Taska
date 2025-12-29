package za.co.taska.domain.model

/**
 * Payment Domain Model
 * Represents a payment transaction in the Taska platform
 */
data class Payment(
    val id: String,
    val jobId: String,
    val clientId: String,
    val artisanId: String,
    val bidId: String,
    val amount: Double,
    val platformFee: Double,
    val totalAmount: Double,
    val paymentMethod: PaymentMethod,
    val status: PaymentStatus,
    val transactionId: String?,
    val receiptUrl: String?,
    val createdAt: String,
    val completedAt: String?
) {
    val amountDisplay: String
        get() = "R %.2f".format(amount)

    val totalAmountDisplay: String
        get() = "R %.2f".format(totalAmount)

    val platformFeeDisplay: String
        get() = "R %.2f".format(platformFee)

    val isCompleted: Boolean
        get() = status == PaymentStatus.COMPLETED

    val isFailed: Boolean
        get() = status == PaymentStatus.FAILED || status == PaymentStatus.CANCELLED
}

/**
 * Payment Method Enum
 * Supported payment methods
 */
enum class PaymentMethod {
    CREDIT_CARD,
    DEBIT_CARD,
    EFT,
    MOBILE_MONEY;

    companion object {
        fun fromString(value: String): PaymentMethod {
            return valueOf(value.uppercase().replace(" ", "_"))
        }
    }

    val displayName: String
        get() = when (this) {
            CREDIT_CARD -> "Credit Card"
            DEBIT_CARD -> "Debit Card"
            EFT -> "EFT"
            MOBILE_MONEY -> "Mobile Money"
        }
}

/**
 * Payment Status Enum
 * Payment lifecycle states
 */
enum class PaymentStatus {
    PENDING,
    PROCESSING,
    COMPLETED,
    FAILED,
    REFUNDED,
    CANCELLED;

    companion object {
        fun fromString(value: String): PaymentStatus {
            return valueOf(value.uppercase())
        }
    }

    val displayName: String
        get() = when (this) {
            PENDING -> "Pending"
            PROCESSING -> "Processing"
            COMPLETED -> "Completed"
            FAILED -> "Failed"
            REFUNDED -> "Refunded"
            CANCELLED -> "Cancelled"
        }

    val isTerminal: Boolean
        get() = this in listOf(COMPLETED, FAILED, REFUNDED, CANCELLED)
}
