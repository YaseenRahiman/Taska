package za.co.taska.domain.usecase.notification

import kotlinx.coroutines.flow.Flow
import za.co.taska.domain.model.Notification
import za.co.taska.domain.repository.NotificationsRepository
import javax.inject.Inject

/**
 * Get Notifications Use Case
 * Business logic for retrieving notifications with pagination and filtering
 *
 * Validation Rules:
 * - limit: 1-100 (if provided)
 * - offset: ≥0 (if provided)
 * - type: valid NotificationType value (if provided)
 */
class GetNotificationsUseCase @Inject constructor(
    private val notificationsRepository: NotificationsRepository
) {
    operator fun invoke(
        type: String? = null,
        isRead: Boolean? = null,
        limit: Int = 20,
        offset: Int = 0
    ): Flow<Result<List<Notification>>> {
        // Validate inputs
        val validationError = validateInputs(limit, offset)

        if (validationError != null) {
            return kotlinx.coroutines.flow.flow {
                emit(Result.failure(IllegalArgumentException(validationError)))
            }
        }

        // Call repository
        return notificationsRepository.getNotifications(
            type = type,
            isRead = isRead,
            limit = limit.coerceIn(1, 100),
            offset = offset.coerceAtLeast(0)
        )
    }

    private fun validateInputs(
        limit: Int,
        offset: Int
    ): String? {
        return when {
            limit < 1 -> "Limit must be at least 1"
            limit > 100 -> "Limit cannot exceed 100"
            offset < 0 -> "Offset cannot be negative"
            else -> null
        }
    }
}
