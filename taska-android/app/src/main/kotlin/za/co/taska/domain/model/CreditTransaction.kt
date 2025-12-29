package za.co.taska.domain.model

import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

/**
 * Credit Transaction Domain Model
 * Represents a credit wallet transaction
 */
data class CreditTransaction(
    val id: String,
    val type: CreditTransactionType,
    val amount: Int,
    val balanceAfter: Int,
    val description: String,
    val reference: String?,
    val createdAt: LocalDateTime
) {
    /**
     * Whether this transaction added credits (positive)
     */
    val isCredit: Boolean
        get() = type in listOf(
            CreditTransactionType.PURCHASE,
            CreditTransactionType.VOUCHER,
            CreditTransactionType.REFERRAL,
            CreditTransactionType.REFUND,
            CreditTransactionType.ADMIN_GRANT,
            CreditTransactionType.PROMO,
            CreditTransactionType.WALLET_CONVERT,
            CreditTransactionType.AUTO_TOPUP
        )

    /**
     * Whether this transaction spent credits (negative)
     */
    val isDebit: Boolean
        get() = !isCredit

    /**
     * Display amount with sign
     */
    val displayAmount: String
        get() = if (isCredit) "+$amount" else "-$amount"

    /**
     * Formatted date for display
     */
    val formattedDate: String
        get() = createdAt.format(DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm"))

    /**
     * Short formatted date
     */
    val shortFormattedDate: String
        get() = createdAt.format(DateTimeFormatter.ofPattern("dd MMM"))
}

/**
 * Credit transaction types matching backend
 */
enum class CreditTransactionType {
    PURCHASE,
    VOUCHER,
    REFERRAL,
    SPEND_BID,
    SPEND_BOOST,
    SPEND_FEATURE,
    SPEND_UNLOCK,
    SPEND_ALERT,
    REFUND,
    ADMIN_GRANT,
    ADMIN_DEDUCT,
    PROMO,
    WALLET_CONVERT,
    AUTO_TOPUP,
    EXPIRE
}

/**
 * Credit action types for spending
 */
enum class CreditAction(val displayName: String, val cost: Int) {
    BID("Place a Bid", 5),
    BOOST("Profile Boost", 20),
    SUPER_BOOST("Super Boost", 50),
    FEATURE_PROFILE("Featured Profile", 100),
    UNLOCK_CONTACT("Unlock Contact", 10),
    JOB_ALERT("Custom Job Alert", 15)
}

/**
 * Credit purchase methods
 */
enum class CreditPurchaseMethod {
    CARD,
    EFT,
    WALLET,
    MOBILE_MONEY,
    AIRTIME
}
