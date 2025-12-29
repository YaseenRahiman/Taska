package za.co.taska.domain.model

/**
 * Credit Wallet Domain Model
 * Represents user's credit balance and auto top-up settings
 */
data class CreditWallet(
    val userId: String,
    val balance: Int,
    val lifetimeCredits: Int,
    val lifetimeSpent: Int,
    val autoTopUpEnabled: Boolean,
    val autoTopUpThreshold: Int?,
    val autoTopUpAmount: Int?,
    val autoTopUpSource: AutoTopUpSource?
) {
    val hasAutoTopUp: Boolean
        get() = autoTopUpEnabled && autoTopUpThreshold != null && autoTopUpAmount != null

    val isLowBalance: Boolean
        get() = autoTopUpThreshold?.let { balance < it } ?: (balance < 20)

    val formattedBalance: String
        get() = "$balance credits"
}

/**
 * Auto top-up source options
 */
enum class AutoTopUpSource {
    WALLET,
    CARD
}
