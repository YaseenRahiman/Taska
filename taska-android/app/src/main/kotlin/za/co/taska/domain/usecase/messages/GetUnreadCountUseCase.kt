package za.co.taska.domain.usecase.messages

import za.co.taska.domain.repository.MessagesRepository
import javax.inject.Inject

/**
 * Use case for getting unread message count
 * Supports total count or job-specific count
 */
class GetUnreadCountUseCase @Inject constructor(
    private val messagesRepository: MessagesRepository
) {
    /**
     * Get unread message count
     * @param jobId Optional job ID to get count for specific job, null for total count
     * @return Result with unread count or error
     */
    suspend operator fun invoke(jobId: String? = null): Result<Int> {
        return messagesRepository.getUnreadCount(jobId)
    }
}
