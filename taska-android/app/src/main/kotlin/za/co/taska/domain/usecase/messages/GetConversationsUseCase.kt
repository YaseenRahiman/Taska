package za.co.taska.domain.usecase.messages

import kotlinx.coroutines.flow.Flow
import za.co.taska.domain.model.Conversation
import za.co.taska.domain.repository.MessagesRepository
import javax.inject.Inject

/**
 * Use case for retrieving all conversations for the current user
 */
class GetConversationsUseCase @Inject constructor(
    private val messagesRepository: MessagesRepository
) {
    operator fun invoke(): Flow<Result<List<Conversation>>> {
        return messagesRepository.getConversations()
    }
}
