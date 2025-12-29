package za.co.taska.domain.usecase.notification

import za.co.taska.domain.model.NotificationPreferences
import za.co.taska.domain.repository.NotificationsRepository
import javax.inject.Inject

/**
 * Update Notification Preferences Use Case
 * Business logic for updating user notification preferences
 *
 * Validation Rules:
 * - At least one preference must be specified
 * - All preferences are optional boolean values
 */
class UpdateNotificationPreferencesUseCase @Inject constructor(
    private val notificationsRepository: NotificationsRepository
) {
    suspend operator fun invoke(
        enableBidNotifications: Boolean? = null,
        enableMessageNotifications: Boolean? = null,
        enablePaymentNotifications: Boolean? = null,
        enableReviewNotifications: Boolean? = null,
        enableSystemNotifications: Boolean? = null
    ): Result<NotificationPreferences> {
        // Validate that at least one preference is specified
        val allNull = listOf(
            enableBidNotifications,
            enableMessageNotifications,
            enablePaymentNotifications,
            enableReviewNotifications,
            enableSystemNotifications
        ).all { it == null }

        if (allNull) {
            return Result.failure(
                IllegalArgumentException("At least one notification preference must be specified")
            )
        }

        // Call repository
        return notificationsRepository.updateNotificationPreferences(
            enableBidNotifications = enableBidNotifications,
            enableMessageNotifications = enableMessageNotifications,
            enablePaymentNotifications = enablePaymentNotifications,
            enableReviewNotifications = enableReviewNotifications,
            enableSystemNotifications = enableSystemNotifications
        )
    }

    /**
     * Get current notification preferences
     */
    suspend fun getPreferences(): Result<NotificationPreferences> {
        return notificationsRepository.getNotificationPreferences()
    }

    /**
     * Enable all notification types
     */
    suspend fun enableAll(): Result<NotificationPreferences> {
        return invoke(
            enableBidNotifications = true,
            enableMessageNotifications = true,
            enablePaymentNotifications = true,
            enableReviewNotifications = true,
            enableSystemNotifications = true
        )
    }

    /**
     * Disable all notification types
     */
    suspend fun disableAll(): Result<NotificationPreferences> {
        return invoke(
            enableBidNotifications = false,
            enableMessageNotifications = false,
            enablePaymentNotifications = false,
            enableReviewNotifications = false,
            enableSystemNotifications = false
        )
    }
}
