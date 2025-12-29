package za.co.taska.domain.usecase.notification

import za.co.taska.domain.repository.NotificationsRepository
import javax.inject.Inject

/**
 * Clear All Notifications Use Case
 * Business logic for clearing/deleting notifications
 *
 * Operations:
 * - Clear all read notifications
 * - Delete a specific notification
 */
class ClearAllNotificationsUseCase @Inject constructor(
    private val notificationsRepository: NotificationsRepository
) {
    /**
     * Clear (delete) all read notifications
     */
    suspend fun clearReadNotifications(): Result<Unit> {
        return notificationsRepository.clearReadNotifications()
    }

    /**
     * Delete a specific notification
     */
    suspend fun deleteNotification(notificationId: String): Result<Unit> {
        // Validate input
        if (notificationId.isBlank()) {
            return Result.failure(IllegalArgumentException("Notification ID cannot be empty"))
        }

        // Call repository
        return notificationsRepository.deleteNotification(notificationId.trim())
    }

    /**
     * Get unread notification count
     */
    suspend fun getUnreadCount(): Result<Int> {
        return notificationsRepository.getUnreadCount()
    }
}
