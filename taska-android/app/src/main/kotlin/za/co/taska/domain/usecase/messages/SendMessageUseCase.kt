package za.co.taska.domain.usecase.messages

import za.co.taska.domain.model.Message
import za.co.taska.domain.model.SendMessageRequest
import za.co.taska.domain.repository.MessagesRepository
import javax.inject.Inject

/**
 * Use case for sending a message in a conversation
 * Validates message content and handles file attachments
 */
class SendMessageUseCase @Inject constructor(
    private val messagesRepository: MessagesRepository
) {
    /**
     * Send a message with validation
     * @return Result with sent Message or error
     */
    suspend operator fun invoke(request: SendMessageRequest): Result<Message> {
        // Validate message content
        if (request.content.isBlank() && request.fileUrl == null) {
            return Result.failure(IllegalArgumentException("Message must have content or file attachment"))
        }

        if (request.content.length > 5000) {
            return Result.failure(IllegalArgumentException("Message content exceeds maximum length of 5000 characters"))
        }

        return messagesRepository.sendMessage(request)
    }

    /**
     * Legacy method for backward compatibility
     */
    suspend fun sendSimpleMessage(
        recipientId: String,
        jobId: String,
        content: String,
        messageType: String = "TEXT",
        attachments: List<String>? = null
    ): Result<Message> {
        return messagesRepository.sendMessage(
            recipientId = recipientId,
            jobId = jobId,
            content = content,
            messageType = messageType,
            attachments = attachments
        )
    }
}
