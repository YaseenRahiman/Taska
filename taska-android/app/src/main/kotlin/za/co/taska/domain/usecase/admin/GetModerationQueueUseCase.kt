package za.co.taska.domain.usecase.admin

import za.co.taska.domain.model.ModerationFilter
import za.co.taska.domain.model.ModerationItem
import za.co.taska.domain.repository.AdminRepository
import javax.inject.Inject

/**
 * Use case for retrieving content moderation queue
 * Returns reported content awaiting review
 */
class GetModerationQueueUseCase @Inject constructor(
    private val adminRepository: AdminRepository
) {
    suspend operator fun invoke(filter: ModerationFilter): Result<List<ModerationItem>> {
        return adminRepository.getModerationQueue(filter)
    }
}
