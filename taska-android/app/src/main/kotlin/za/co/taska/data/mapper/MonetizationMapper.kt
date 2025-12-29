package za.co.taska.data.mapper

import za.co.taska.data.remote.dto.response.*
import za.co.taska.domain.model.*
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.time.format.DateTimeParseException

/**
 * Mapper functions for monetization DTOs to domain models
 */

private val dateFormatter = DateTimeFormatter.ISO_DATE_TIME

private fun parseDateTime(dateString: String): LocalDateTime {
    return try {
        LocalDateTime.parse(dateString, dateFormatter)
    } catch (e: DateTimeParseException) {
        try {
            // Try parsing with alternative format
            LocalDateTime.parse(dateString.replace("Z", ""))
        } catch (e2: DateTimeParseException) {
            LocalDateTime.now()
        }
    }
}

/**
 * Map CreditBalanceResponse to CreditWallet domain model
 */
fun CreditBalanceResponse.toDomain(): CreditWallet {
    return CreditWallet(
        userId = userId,
        balance = balance,
        lifetimeCredits = lifetimeCredits,
        lifetimeSpent = lifetimeSpent,
        autoTopUpEnabled = autoTopUpEnabled,
        autoTopUpThreshold = autoTopUpThreshold,
        autoTopUpAmount = autoTopUpAmount,
        autoTopUpSource = null // Not provided in response
    )
}

/**
 * Map CreditBundleResponse to CreditBundle domain model
 */
fun CreditBundleResponse.toDomain(): CreditBundle {
    return CreditBundle(
        id = id,
        name = name,
        credits = credits,
        bonusCredits = bonusCredits,
        priceZar = priceZar,
        isPopular = isPopular,
        description = description
    )
}

/**
 * Map CreditTransactionResponse to CreditTransaction domain model
 */
fun CreditTransactionResponse.toDomain(): CreditTransaction {
    return CreditTransaction(
        id = id,
        type = try {
            CreditTransactionType.valueOf(type)
        } catch (e: IllegalArgumentException) {
            CreditTransactionType.PURCHASE
        },
        amount = amount,
        balanceAfter = balanceAfter,
        description = description,
        reference = reference,
        createdAt = parseDateTime(createdAt)
    )
}

/**
 * Map ProfileBoostResponse to ProfileBoost domain model
 */
fun ProfileBoostResponse.toDomain(): ProfileBoost {
    return ProfileBoost(
        id = id,
        userId = userId,
        type = try {
            BoostType.valueOf(type)
        } catch (e: IllegalArgumentException) {
            BoostType.STANDARD
        },
        boostPercent = boostPercent,
        startedAt = parseDateTime(startedAt),
        expiresAt = parseDateTime(expiresAt),
        usedFreeBoost = usedFreeBoost,
        creditsCost = creditsCost
    )
}

/**
 * Map BoostConfigResponse to BoostConfig domain model
 */
fun BoostConfigResponse.toDomain(): BoostConfig {
    val boostType = try {
        BoostType.valueOf(type)
    } catch (e: IllegalArgumentException) {
        BoostType.STANDARD
    }

    return BoostConfig(
        type = boostType,
        creditCost = creditCost,
        boostPercent = boostPercent,
        durationHours = durationHours,
        canUseFreeBid = false // This would need to be determined from level benefits
    )
}

/**
 * Map ArtisanLevelResponse to ArtisanLevel domain model
 */
fun ArtisanLevelResponse.toDomain(): ArtisanLevel {
    return ArtisanLevel(
        userId = userId,
        currentLevel = try {
            LevelTier.valueOf(currentLevel)
        } catch (e: IllegalArgumentException) {
            LevelTier.STARTER
        },
        displayName = displayName,
        currentFeePercent = currentFeePercent,
        nextLevel = nextLevel?.let {
            try {
                LevelTier.valueOf(it)
            } catch (e: IllegalArgumentException) {
                null
            }
        },
        progressToNextLevel = progressToNextLevel,
        stats = stats.toDomain(),
        benefits = benefits.toDomain(),
        verification = verification.toDomain()
    )
}

/**
 * Map ArtisanStatsResponse to ArtisanStats domain model
 */
fun ArtisanStatsResponse.toDomain(): ArtisanStats {
    return ArtisanStats(
        totalJobsCompleted = totalJobsCompleted,
        averageRating = averageRating,
        responseRate = responseRate,
        completionRate = completionRate,
        repeatClientCount = repeatClientCount,
        memberSince = parseDateTime(memberSince)
    )
}

/**
 * Map LevelBenefitsResponse to LevelBenefits domain model
 */
fun LevelBenefitsResponse.toDomain(): LevelBenefits {
    return LevelBenefits(
        freeBidsRemaining = freeBidsRemaining,
        freeBoostsRemaining = freeBoostsRemaining,
        searchBoostPercent = searchBoostPercent,
        payoutDays = payoutDays
    )
}

/**
 * Map VerificationStatusResponse to VerificationStatus domain model
 */
fun VerificationStatusResponse.toDomain(): VerificationStatus {
    return VerificationStatus(
        isIdentityVerified = isIdentityVerified,
        isSkillsVerified = isSkillsVerified
    )
}

/**
 * Map LevelConfigResponse to LevelRequirement domain model
 */
fun LevelConfigResponse.toDomain(): LevelRequirement {
    return LevelRequirement(
        level = try {
            LevelTier.valueOf(level)
        } catch (e: IllegalArgumentException) {
            LevelTier.STARTER
        },
        minJobsCompleted = minJobsCompleted,
        minAverageRating = minAverageRating,
        minResponseRate = minResponseRate,
        minCompletionRate = minCompletionRate,
        requiresIdentityVerification = requiresIdentityVerification,
        requiresSkillsVerification = requiresSkillsVerification,
        feePercent = feePercent,
        freeBidsPerMonth = freeBidsPerMonth,
        freeBoostsPerMonth = freeBoostsPerMonth,
        searchBoostPercent = searchBoostPercent,
        payoutDays = payoutDays
    )
}
