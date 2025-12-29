package za.co.taska.domain.model

import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit

/**
 * Profile Boost Domain Model
 * Represents an active or past profile boost
 */
data class ProfileBoost(
    val id: String,
    val userId: String,
    val type: BoostType,
    val boostPercent: Int,
    val startedAt: LocalDateTime,
    val expiresAt: LocalDateTime,
    val usedFreeBoost: Boolean,
    val creditsCost: Int
) {
    /**
     * Whether the boost is currently active
     */
    val isActive: Boolean
        get() = LocalDateTime.now().isBefore(expiresAt)

    /**
     * Time remaining in human-readable format
     */
    val timeRemaining: String
        get() {
            val now = LocalDateTime.now()
            if (now.isAfter(expiresAt)) return "Expired"

            val hours = ChronoUnit.HOURS.between(now, expiresAt)
            val minutes = ChronoUnit.MINUTES.between(now, expiresAt) % 60

            return when {
                hours > 24 -> "${hours / 24}d ${hours % 24}h"
                hours > 0 -> "${hours}h ${minutes}m"
                minutes > 0 -> "${minutes}m"
                else -> "Expiring soon"
            }
        }

    /**
     * Progress percentage (0-100) of boost duration used
     */
    val progressPercent: Float
        get() {
            val total = ChronoUnit.MINUTES.between(startedAt, expiresAt).toFloat()
            val elapsed = ChronoUnit.MINUTES.between(startedAt, LocalDateTime.now()).toFloat()
            return ((elapsed / total) * 100).coerceIn(0f, 100f)
        }

    /**
     * Formatted expiry date
     */
    val formattedExpiry: String
        get() = expiresAt.format(DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm"))
}

/**
 * Boost type matching backend BoostType enum
 */
enum class BoostType(
    val displayName: String,
    val description: String,
    val boostPercent: Int,
    val durationHours: Int,
    val creditCost: Int
) {
    STANDARD(
        displayName = "Standard Boost",
        description = "Increase visibility by 20% for 24 hours",
        boostPercent = 20,
        durationHours = 24,
        creditCost = 20
    ),
    SUPER(
        displayName = "Super Boost",
        description = "Increase visibility by 50% for 48 hours",
        boostPercent = 50,
        durationHours = 48,
        creditCost = 50
    ),
    PREMIUM(
        displayName = "Premium Boost",
        description = "Increase visibility by 100% for 72 hours",
        boostPercent = 100,
        durationHours = 72,
        creditCost = 100
    )
}

/**
 * Boost configuration for display
 */
data class BoostConfig(
    val type: BoostType,
    val creditCost: Int,
    val boostPercent: Int,
    val durationHours: Int,
    val canUseFreeBid: Boolean
)
