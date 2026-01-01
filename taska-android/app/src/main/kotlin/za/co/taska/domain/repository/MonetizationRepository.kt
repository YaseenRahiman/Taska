package za.co.taska.domain.repository

import kotlinx.coroutines.flow.Flow
import za.co.taska.domain.model.*

/**
 * Monetization Repository Interface
 * Defines all monetization-related operations for credits, boosts, and levels
 */
interface MonetizationRepository {

    // ========== CREDITS OPERATIONS ==========

    /**
     * Get current credit wallet balance
     */
    suspend fun getCreditBalance(): Result<CreditWallet>

    /**
     * Get available credit bundles for purchase
     */
    suspend fun getCreditBundles(): Result<List<CreditBundle>>

    /**
     * Purchase credits from a bundle
     */
    suspend fun purchaseCredits(
        bundleId: String,
        purchaseMethod: CreditPurchaseMethod,
        providerTxnId: String? = null
    ): Result<CreditWallet>

    /**
     * Redeem a voucher code for credits
     */
    suspend fun redeemVoucher(voucherCode: String): Result<VoucherResult>

    /**
     * Spend credits on an action
     */
    suspend fun spendCredits(
        action: CreditAction,
        reference: String? = null
    ): Result<CreditWallet>

    /**
     * Convert wallet balance (ZAR) to credits
     */
    suspend fun convertWalletToCredits(amountZar: Double): Result<CreditWallet>

    /**
     * Configure auto top-up settings
     */
    suspend fun configureAutoTopUp(
        enabled: Boolean,
        threshold: Int? = null,
        amount: Int? = null,
        source: AutoTopUpSource? = null
    ): Result<CreditWallet>

    /**
     * Get credit transaction history
     */
    suspend fun getCreditTransactions(
        page: Int = 1,
        limit: Int = 20,
        type: CreditTransactionType? = null
    ): Result<PaginatedTransactions>

    /**
     * Get action costs (credits required for each action)
     */
    suspend fun getActionCosts(): Result<Map<CreditAction, Int>>

    // ========== BOOSTS OPERATIONS ==========

    /**
     * Get available boost configurations
     */
    suspend fun getBoostConfigs(): Result<List<BoostConfig>>

    /**
     * Get currently active boost
     */
    suspend fun getActiveBoost(): Result<ProfileBoost?>

    /**
     * Get current boost percentage (includes level-based boost)
     */
    suspend fun getBoostPercentage(): Result<Int>

    /**
     * Activate a profile boost
     */
    suspend fun activateBoost(
        boostType: BoostType,
        useFreeBoost: Boolean = true
    ): Result<ProfileBoost>

    /**
     * Get boost activation history
     */
    suspend fun getBoostHistory(
        page: Int = 1,
        limit: Int = 10
    ): Result<List<ProfileBoost>>

    /**
     * Check if user has featured badge
     */
    suspend fun hasFeaturedBadge(): Result<Boolean>

    // ========== LEVEL OPERATIONS ==========

    /**
     * Get current artisan level and stats
     */
    suspend fun getMyLevel(): Result<ArtisanLevel>

    /**
     * Get artisan level for a specific user
     */
    suspend fun getUserLevel(userId: String): Result<ArtisanLevel>

    /**
     * Get current platform fee rate based on level
     */
    suspend fun getFeeRate(): Result<FeeInfo>

    /**
     * Get all level configurations and requirements
     */
    suspend fun getLevelConfigs(): Result<List<LevelRequirement>>

    /**
     * Get level progression history
     */
    suspend fun getLevelHistory(): Result<List<ArtisanLevel>>

    /**
     * Use a free bid from level benefits
     */
    suspend fun useFreeBid(): Result<FreeBidResult>

    /**
     * Use a free boost from level benefits
     */
    suspend fun useFreeBoost(): Result<FreeBoostResult>

    /**
     * Request identity or skills verification
     */
    suspend fun requestVerification(type: VerificationType): Result<Unit>
}

/**
 * Voucher redemption result
 */
data class VoucherResult(
    val success: Boolean,
    val creditsAwarded: Int,
    val newBalance: Int,
    val message: String
)

/**
 * Paginated transaction result
 */
data class PaginatedTransactions(
    val transactions: List<CreditTransaction>,
    val total: Int,
    val page: Int,
    val limit: Int,
    val totalPages: Int
)

/**
 * Fee information
 */
data class FeeInfo(
    val feePercent: Double,
    val sampleJobAmount: Double,
    val sampleFeeAmount: Double
)

/**
 * Free bid usage result
 */
data class FreeBidResult(
    val success: Boolean,
    val remaining: Int
)

/**
 * Free boost usage result
 */
data class FreeBoostResult(
    val success: Boolean,
    val remaining: Int
)

/**
 * Verification type
 */
enum class VerificationType {
    IDENTITY,
    SKILLS
}
