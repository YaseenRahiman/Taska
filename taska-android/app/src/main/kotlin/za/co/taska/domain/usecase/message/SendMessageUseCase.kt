package za.co.taska.domain.usecase.message

import za.co.taska.domain.model.Message
import za.co.taska.domain.repository.MessagesRepository
import javax.inject.Inject

/**
 * Send Message Use Case
 * Business logic for sending messages with comprehensive validation
 *
 * Validation Rules:
 * - recipientId: not blank
 * - jobId: not blank
 * - content: 1-1000 characters
 * - attachments: max 5 files (optional)
 */
class SendMessageUseCase @Inject constructor(
    private val messagesRepository: MessagesRepository
) {
    suspend operator fun invoke(
        recipientId: String,
        jobId: String,
        content: String,
        messageType: String = "TEXT",
        attachments: List<String>? = null
    ): Result<Message> {
        // Validate inputs
        val validationError = validateInputs(
            recipientId = recipientId,
            jobId = jobId,
            content = content,
            attachments = attachments
        )

        if (validationError != null) {
            return Result.failure(IllegalArgumentException(validationError))
        }

        // Call repository
        return messagesRepository.sendMessage(
            recipientId = recipientId.trim(),
            jobId = jobId.trim(),
            content = content.trim(),
            messageType = messageType,
            attachments = attachments?.filter { it.isNotBlank() }
        )
    }

    private fun validateInputs(
        recipientId: String,
        jobId: String,
        content: String,
        attachments: List<String>?
    ): String? {
        return when {
            recipientId.isBlank() -> "Recipient ID cannot be empty"

            jobId.isBlank() -> "Job ID cannot be empty"

            content.isBlank() -> "Message content cannot be empty"
            content.trim().length < 1 -> "Message content must be at least 1 character"
            content.trim().length > 1000 -> "Message content cannot exceed 1000 characters"

            attachments != null && attachments.size > 5 -> "Maximum 5 attachments allowed"
            attachments?.any { it.isBlank() } == true -> "Attachment URLs cannot be blank"

            else -> null
        }
    }
}
