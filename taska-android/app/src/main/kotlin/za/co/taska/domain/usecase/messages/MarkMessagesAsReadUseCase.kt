package za.co.taska.domain.usecase.messages

import za.co.taska.domain.repository.MessagesRepository
import javax.inject.Inject

/**
 * Use case for marking messages as read
 * Supports single message or all messages in a job
 */
class MarkMessagesAsReadUseCase @Inject constructor(
    private val messagesRepository: MessagesRepository
) {
    /**
     * Mark a specific message as read
     * @param messageId The ID of the message to mark as read
     */
    suspend fun markMessageAsRead(messageId: String): Result<Unit> {
        if (messageId.isBlank()) {
            return Result.failure(IllegalArgumentException("Message ID cannot be blank"))
        }
        return messagesRepository.markMessageAsRead(messageId)
    }

    /**
     * Mark all messages in a job as read
     * @param jobId The ID of the job whose messages to mark as read
     */
    suspend fun markJobMessagesAsRead(jobId: String): Result<Unit> {
        if (jobId.isBlank()) {
            return Result.failure(IllegalArgumentException("Job ID cannot be blank"))
        }
        return messagesRepository.markJobMessagesAsRead(jobId)
    }
}
