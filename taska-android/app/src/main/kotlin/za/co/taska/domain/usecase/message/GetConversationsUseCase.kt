package za.co.taska.domain.usecase.message

import kotlinx.coroutines.flow.Flow
import za.co.taska.domain.model.Conversation
import za.co.taska.domain.repository.MessagesRepository
import javax.inject.Inject

/**
 * Get Conversations Use Case
 * Retrieves all conversations for the current user
 *
 * No validation required - simply returns all conversations
 */
class GetConversationsUseCase @Inject constructor(
    private val messagesRepository: MessagesRepository
) {
    operator fun invoke(): Flow<Result<List<Conversation>>> {
        return messagesRepository.getConversations()
    }
}
