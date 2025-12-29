package za.co.taska.domain.model

import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

/**
 * Artisan Level Domain Model
 * Represents artisan's current level, stats, and benefits
 */
data class ArtisanLevel(
    val userId: String,
    val currentLevel: LevelTier,
    val displayName: String,
    val currentFeePercent: Double,
    val nextLevel: LevelTier?,
    val progressToNextLevel: Int,
    val stats: ArtisanStats,
    val benefits: LevelBenefits,
    val verification: VerificationStatus
) {
    /**
     * Whether artisan has reached the maximum level
     */
    val isMaxLevel: Boolean
        get() = nextLevel == null

    /**
     * Formatted fee percentage
     */
    val formattedFee: String
        get() = "${currentFeePercent.toInt()}% platform fee"

    /**
     * Display text for progress
     */
    val progressText: String
        get() = if (isMaxLevel) {
            "Maximum level achieved"
        } else {
            "$progressToNextLevel% to ${nextLevel?.displayName}"
        }
}

/**
 * Level tiers matching backend ArtisanLevelTier enum
 */
enum class LevelTier(
    val displayName: String,
    val feePercent: Double,
    val minJobsRequired: Int,
    val minRatingRequired: Double
) {
    STARTER(
        displayName = "Starter",
        feePercent = 15.0,
        minJobsRequired = 0,
        minRatingRequired = 0.0
    ),
    BRONZE(
        displayName = "Bronze",
        feePercent = 13.0,
        minJobsRequired = 5,
        minRatingRequired = 4.0
    ),
    SILVER(
        displayName = "Silver",
        feePercent = 11.0,
        minJobsRequired = 15,
        minRatingRequired = 4.3
    ),
    GOLD(
        displayName = "Gold",
        feePercent = 9.0,
        minJobsRequired = 35,
        minRatingRequired = 4.5
    ),
    PLATINUM(
        displayName = "Platinum",
        feePercent = 7.0,
        minJobsRequired = 75,
        minRatingRequired = 4.7
    ),
    ELITE(
        displayName = "Elite",
        feePercent = 5.0,
        minJobsRequired = 150,
        minRatingRequired = 4.8
    )
}

/**
 * Artisan statistics
 */
data class ArtisanStats(
    val totalJobsCompleted: Int,
    val averageRating: Double,
    val responseRate: Double,
    val completionRate: Double,
    val repeatClientCount: Int,
    val memberSince: LocalDateTime
) {
    /**
     * Formatted rating with star
     */
    val formattedRating: String
        get() = String.format("%.1f", averageRating)

    /**
     * Formatted response rate percentage
     */
    val formattedResponseRate: String
        get() = "${(responseRate * 100).toInt()}%"

    /**
     * Formatted completion rate percentage
     */
    val formattedCompletionRate: String
        get() = "${(completionRate * 100).toInt()}%"

    /**
     * Formatted member since date
     */
    val formattedMemberSince: String
        get() = memberSince.format(DateTimeFormatter.ofPattern("MMMM yyyy"))

    /**
     * Calculate rating stars (1-5 range)
     */
    val ratingStars: Int
        get() = averageRating.toInt().coerceIn(0, 5)
}

/**
 * Level-based benefits
 */
data class LevelBenefits(
    val freeBidsRemaining: Int,
    val freeBoostsRemaining: Int,
    val searchBoostPercent: Int,
    val payoutDays: Int
) {
    /**
     * Total free bids used to allocate
     */
    val hasFreeBids: Boolean
        get() = freeBidsRemaining > 0

    /**
     * Has free boosts available
     */
    val hasFreeBoosts: Boolean
        get() = freeBoostsRemaining > 0

    /**
     * Formatted payout schedule
     */
    val payoutSchedule: String
        get() = when (payoutDays) {
            1 -> "Next day payout"
            7 -> "Weekly payout"
            else -> "$payoutDays day payout"
        }
}

/**
 * Verification status
 */
data class VerificationStatus(
    val isIdentityVerified: Boolean,
    val isSkillsVerified: Boolean
) {
    /**
     * Whether fully verified
     */
    val isFullyVerified: Boolean
        get() = isIdentityVerified && isSkillsVerified

    /**
     * Verification status text
     */
    val statusText: String
        get() = when {
            isFullyVerified -> "Fully Verified"
            isIdentityVerified -> "Identity Verified"
            isSkillsVerified -> "Skills Verified"
            else -> "Not Verified"
        }
}

/**
 * Level configuration for requirements display
 */
data class LevelRequirement(
    val level: LevelTier,
    val minJobsCompleted: Int,
    val minAverageRating: Double,
    val minResponseRate: Double,
    val minCompletionRate: Double,
    val requiresIdentityVerification: Boolean,
    val requiresSkillsVerification: Boolean,
    val feePercent: Double,
    val freeBidsPerMonth: Int,
    val freeBoostsPerMonth: Int,
    val searchBoostPercent: Int,
    val payoutDays: Int
)
