package za.co.taska.domain.usecase.message

import za.co.taska.domain.repository.MessagesRepository
import javax.inject.Inject

/**
 * Mark Message As Read Use Case
 * Marks a specific message or all messages in a job as read
 *
 * Validation Rules:
 * - messageId: not blank (if marking single message)
 * - jobId: not blank (if marking all job messages)
 */
class MarkMessageAsReadUseCase @Inject constructor(
    private val messagesRepository: MessagesRepository
) {
    /**
     * Mark a specific message as read
     */
    suspend fun markMessage(messageId: String): Result<Unit> {
        // Validate input
        if (messageId.isBlank()) {
            return Result.failure(IllegalArgumentException("Message ID cannot be empty"))
        }

        // Call repository
        return messagesRepository.markMessageAsRead(messageId.trim())
    }

    /**
     * Mark all messages in a job as read
     */
    suspend fun markJobMessages(jobId: String): Result<Unit> {
        // Validate input
        if (jobId.isBlank()) {
            return Result.failure(IllegalArgumentException("Job ID cannot be empty"))
        }

        // Call repository
        return messagesRepository.markJobMessagesAsRead(jobId.trim())
    }
}
