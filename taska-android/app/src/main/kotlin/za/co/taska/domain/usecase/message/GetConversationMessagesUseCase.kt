package za.co.taska.domain.usecase.message

import kotlinx.coroutines.flow.Flow
import za.co.taska.domain.model.Message
import za.co.taska.domain.repository.MessagesRepository
import javax.inject.Inject

/**
 * Get Conversation Messages Use Case
 * Retrieves messages for a specific conversation with pagination
 *
 * Validation Rules:
 * - At least one of jobId or userId must be provided
 * - limit: if provided, 1-100
 * - page: if provided, ≥1
 */
class GetConversationMessagesUseCase @Inject constructor(
    private val messagesRepository: MessagesRepository
) {
    operator fun invoke(
        jobId: String? = null,
        userId: String? = null,
        limit: Int? = null,
        page: Int? = null
    ): Flow<Result<List<Message>>> {
        // Validate inputs
        val validationError = validateInputs(
            jobId = jobId,
            userId = userId,
            limit = limit,
            page = page
        )

        if (validationError != null) {
            return kotlinx.coroutines.flow.flow {
                emit(Result.failure(IllegalArgumentException(validationError)))
            }
        }

        // Call repository
        return messagesRepository.getConversationMessages(
            jobId = jobId?.trim(),
            userId = userId?.trim(),
            limit = limit,
            page = page
        )
    }

    private fun validateInputs(
        jobId: String?,
        userId: String?,
        limit: Int?,
        page: Int?
    ): String? {
        return when {
            jobId.isNullOrBlank() && userId.isNullOrBlank() ->
                "At least one of jobId or userId must be provided"

            jobId?.isBlank() == true -> "Job ID cannot be blank"
            userId?.isBlank() == true -> "User ID cannot be blank"

            limit != null && limit < 1 -> "Limit must be at least 1"
            limit != null && limit > 100 -> "Limit cannot exceed 100"

            page != null && page < 1 -> "Page must be at least 1"

            else -> null
        }
    }
}
