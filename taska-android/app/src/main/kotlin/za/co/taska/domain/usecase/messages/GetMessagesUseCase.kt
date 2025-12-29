package za.co.taska.domain.usecase.messages

import kotlinx.coroutines.flow.Flow
import za.co.taska.domain.model.Message
import za.co.taska.domain.model.MessageQuery
import za.co.taska.domain.repository.MessagesRepository
import javax.inject.Inject

/**
 * Use case for retrieving messages with filtering
 * Supports job-based, user-based, and advanced query filtering
 */
class GetMessagesUseCase @Inject constructor(
    private val messagesRepository: MessagesRepository
) {
    /**
     * Get messages with query-based filtering
     */
    suspend operator fun invoke(query: MessageQuery): Result<List<Message>> {
        return messagesRepository.getMessages(query)
    }

    /**
     * Get messages for a specific conversation (real-time Flow)
     * @param jobId Optional job ID to filter by
     * @param userId Optional user ID to filter by
     * @param limit Optional pagination limit
     * @param page Optional pagination page
     */
    fun getConversationMessages(
        jobId: String? = null,
        userId: String? = null,
        limit: Int? = null,
        page: Int? = null
    ): Flow<Result<List<Message>>> {
        return messagesRepository.getConversationMessages(
            jobId = jobId,
            userId = userId,
            limit = limit,
            page = page
        )
    }

    /**
     * Observe messages in real-time for a conversation
     * @param jobId The job ID to observe messages for
     * @return Flow of message list (auto-updates on new messages)
     */
    fun observeMessages(jobId: String): Flow<List<Message>> {
        return messagesRepository.observeMessages(jobId)
    }
}
