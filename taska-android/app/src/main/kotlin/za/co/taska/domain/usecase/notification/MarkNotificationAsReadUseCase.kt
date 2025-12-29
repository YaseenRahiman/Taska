package za.co.taska.domain.usecase.notification

import za.co.taska.domain.repository.NotificationsRepository
import javax.inject.Inject

/**
 * Mark Notification as Read Use Case
 * Business logic for marking notifications as read (single, multiple, or all)
 *
 * Validation Rules:
 * - notificationId: not blank (for single)
 * - notificationIds: not empty, all valid (for multiple)
 */
class MarkNotificationAsReadUseCase @Inject constructor(
    private val notificationsRepository: NotificationsRepository
) {
    /**
     * Mark a single notification as read
     */
    suspend fun markSingleAsRead(notificationId: String): Result<Unit> {
        // Validate input
        if (notificationId.isBlank()) {
            return Result.failure(IllegalArgumentException("Notification ID cannot be empty"))
        }

        // Call repository
        return notificationsRepository.markNotificationAsRead(notificationId.trim())
    }

    /**
     * Mark multiple notifications as read
     */
    suspend fun markMultipleAsRead(notificationIds: List<String>): Result<Unit> {
        // Validate inputs
        val validationError = validateNotificationIds(notificationIds)

        if (validationError != null) {
            return Result.failure(IllegalArgumentException(validationError))
        }

        // Call repository
        val trimmedIds = notificationIds.map { it.trim() }.filter { it.isNotBlank() }
        return notificationsRepository.markMultipleNotificationsAsRead(trimmedIds)
    }

    /**
     * Mark all notifications as read
     */
    suspend fun markAllAsRead(): Result<Unit> {
        return notificationsRepository.markAllNotificationsAsRead()
    }

    private fun validateNotificationIds(notificationIds: List<String>): String? {
        return when {
            notificationIds.isEmpty() -> "Notification IDs list cannot be empty"
            notificationIds.any { it.isBlank() } -> "Notification IDs cannot contain blank values"
            notificationIds.size > 100 -> "Cannot mark more than 100 notifications at once"
            else -> null
        }
    }
}
