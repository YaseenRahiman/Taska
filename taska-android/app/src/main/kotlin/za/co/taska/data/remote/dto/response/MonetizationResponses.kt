package za.co.taska.data.remote.dto.response

import com.google.gson.annotations.SerializedName

/**
 * Credit balance response
 */
data class CreditBalanceResponse(
    @SerializedName("userId")
    val userId: String,

    @SerializedName("balance")
    val balance: Int,

    @SerializedName("lifetimeCredits")
    val lifetimeCredits: Int,

    @SerializedName("lifetimeSpent")
    val lifetimeSpent: Int,

    @SerializedName("autoTopUpEnabled")
    val autoTopUpEnabled: Boolean,

    @SerializedName("autoTopUpThreshold")
    val autoTopUpThreshold: Int?,

    @SerializedName("autoTopUpAmount")
    val autoTopUpAmount: Int?
)

/**
 * Credit bundle response
 */
data class CreditBundleResponse(
    @SerializedName("id")
    val id: String,

    @SerializedName("name")
    val name: String,

    @SerializedName("credits")
    val credits: Int,

    @SerializedName("bonusCredits")
    val bonusCredits: Int,

    @SerializedName("totalCredits")
    val totalCredits: Int,

    @SerializedName("priceZar")
    val priceZar: Double,

    @SerializedName("pricePerCredit")
    val pricePerCredit: Double,

    @SerializedName("isPopular")
    val isPopular: Boolean,

    @SerializedName("description")
    val description: String?
)

/**
 * Credit transaction response
 */
data class CreditTransactionResponse(
    @SerializedName("id")
    val id: String,

    @SerializedName("type")
    val type: String,

    @SerializedName("amount")
    val amount: Int,

    @SerializedName("balanceAfter")
    val balanceAfter: Int,

    @SerializedName("description")
    val description: String,

    @SerializedName("reference")
    val reference: String?,

    @SerializedName("createdAt")
    val createdAt: String
)

/**
 * Paginated credit transactions response
 */
data class PaginatedCreditTransactionsResponse(
    @SerializedName("data")
    val data: List<CreditTransactionResponse>,

    @SerializedName("total")
    val total: Int,

    @SerializedName("page")
    val page: Int,

    @SerializedName("limit")
    val limit: Int,

    @SerializedName("totalPages")
    val totalPages: Int
)

/**
 * Credit action costs response
 */
data class CreditActionCostsResponse(
    @SerializedName("BID")
    val bid: Int,

    @SerializedName("BOOST")
    val boost: Int,

    @SerializedName("SUPER_BOOST")
    val superBoost: Int,

    @SerializedName("FEATURE_PROFILE")
    val featureProfile: Int,

    @SerializedName("UNLOCK_CONTACT")
    val unlockContact: Int,

    @SerializedName("JOB_ALERT")
    val jobAlert: Int
)

/**
 * Purchase result response
 */
data class PurchaseResultResponse(
    @SerializedName("success")
    val success: Boolean,

    @SerializedName("transaction")
    val transaction: CreditTransactionResponse?,

    @SerializedName("newBalance")
    val newBalance: Int?,

    @SerializedName("message")
    val message: String?
)

/**
 * Voucher redemption response
 */
data class VoucherRedemptionResponse(
    @SerializedName("success")
    val success: Boolean,

    @SerializedName("creditsAwarded")
    val creditsAwarded: Int?,

    @SerializedName("newBalance")
    val newBalance: Int?,

    @SerializedName("message")
    val message: String?
)

/**
 * Profile boost response
 */
data class ProfileBoostResponse(
    @SerializedName("id")
    val id: String,

    @SerializedName("userId")
    val userId: String,

    @SerializedName("type")
    val type: String,

    @SerializedName("boostPercent")
    val boostPercent: Int,

    @SerializedName("startedAt")
    val startedAt: String,

    @SerializedName("expiresAt")
    val expiresAt: String,

    @SerializedName("usedFreeBoost")
    val usedFreeBoost: Boolean,

    @SerializedName("creditsCost")
    val creditsCost: Int
)

/**
 * Active boost status response
 */
data class ActiveBoostResponse(
    @SerializedName("hasActiveBoost")
    val hasActiveBoost: Boolean,

    @SerializedName("boost")
    val boost: ProfileBoostResponse?
)

/**
 * Boost activation response
 */
data class BoostActivationResponse(
    @SerializedName("success")
    val success: Boolean,

    @SerializedName("message")
    val message: String,

    @SerializedName("boost")
    val boost: ProfileBoostResponse?
)

/**
 * Boost percentage response
 */
data class BoostPercentageResponse(
    @SerializedName("boostPercentage")
    val boostPercentage: Int
)

/**
 * Boost config response
 */
data class BoostConfigResponse(
    @SerializedName("type")
    val type: String,

    @SerializedName("creditCost")
    val creditCost: Int,

    @SerializedName("boostPercent")
    val boostPercent: Int,

    @SerializedName("durationHours")
    val durationHours: Int
)

/**
 * Paginated boost history response
 */
data class PaginatedBoostHistoryResponse(
    @SerializedName("data")
    val data: List<ProfileBoostResponse>,

    @SerializedName("total")
    val total: Int,

    @SerializedName("page")
    val page: Int,

    @SerializedName("limit")
    val limit: Int
)

/**
 * Featured badge response
 */
data class FeaturedBadgeResponse(
    @SerializedName("hasFeaturedBadge")
    val hasFeaturedBadge: Boolean
)

/**
 * Artisan level response
 */
data class ArtisanLevelResponse(
    @SerializedName("userId")
    val userId: String,

    @SerializedName("currentLevel")
    val currentLevel: String,

    @SerializedName("displayName")
    val displayName: String,

    @SerializedName("currentFeePercent")
    val currentFeePercent: Double,

    @SerializedName("nextLevel")
    val nextLevel: String?,

    @SerializedName("progressToNextLevel")
    val progressToNextLevel: Int,

    @SerializedName("stats")
    val stats: ArtisanStatsResponse,

    @SerializedName("benefits")
    val benefits: LevelBenefitsResponse,

    @SerializedName("verification")
    val verification: VerificationStatusResponse
)

/**
 * Artisan stats response
 */
data class ArtisanStatsResponse(
    @SerializedName("totalJobsCompleted")
    val totalJobsCompleted: Int,

    @SerializedName("averageRating")
    val averageRating: Double,

    @SerializedName("responseRate")
    val responseRate: Double,

    @SerializedName("completionRate")
    val completionRate: Double,

    @SerializedName("repeatClientCount")
    val repeatClientCount: Int,

    @SerializedName("memberSince")
    val memberSince: String
)

/**
 * Level benefits response
 */
data class LevelBenefitsResponse(
    @SerializedName("freeBidsRemaining")
    val freeBidsRemaining: Int,

    @SerializedName("freeBoostsRemaining")
    val freeBoostsRemaining: Int,

    @SerializedName("searchBoostPercent")
    val searchBoostPercent: Int,

    @SerializedName("payoutDays")
    val payoutDays: Int
)

/**
 * Verification status response
 */
data class VerificationStatusResponse(
    @SerializedName("isIdentityVerified")
    val isIdentityVerified: Boolean,

    @SerializedName("isSkillsVerified")
    val isSkillsVerified: Boolean
)

/**
 * Level config response
 */
data class LevelConfigResponse(
    @SerializedName("level")
    val level: String,

    @SerializedName("minJobsCompleted")
    val minJobsCompleted: Int,

    @SerializedName("minAverageRating")
    val minAverageRating: Double,

    @SerializedName("minResponseRate")
    val minResponseRate: Double,

    @SerializedName("minCompletionRate")
    val minCompletionRate: Double,

    @SerializedName("requiresIdentityVerification")
    val requiresIdentityVerification: Boolean,

    @SerializedName("requiresSkillsVerification")
    val requiresSkillsVerification: Boolean,

    @SerializedName("feePercent")
    val feePercent: Double,

    @SerializedName("freeBidsPerMonth")
    val freeBidsPerMonth: Int,

    @SerializedName("freeBoostsPerMonth")
    val freeBoostsPerMonth: Int,

    @SerializedName("searchBoostPercent")
    val searchBoostPercent: Int,

    @SerializedName("payoutDays")
    val payoutDays: Int
)

/**
 * Fee rate response
 */
data class FeeRateResponse(
    @SerializedName("feePercent")
    val feePercent: Double,

    @SerializedName("sampleFee")
    val sampleFee: SampleFeeResponse
)

/**
 * Sample fee response
 */
data class SampleFeeResponse(
    @SerializedName("jobAmount")
    val jobAmount: Double,

    @SerializedName("feeAmount")
    val feeAmount: Double
)

/**
 * Free bid usage response
 */
data class FreeBidUsageResponse(
    @SerializedName("success")
    val success: Boolean,

    @SerializedName("remaining")
    val remaining: Int
)

/**
 * Free boost usage response
 */
data class FreeBoostUsageResponse(
    @SerializedName("success")
    val success: Boolean,

    @SerializedName("remaining")
    val remaining: Int
)
