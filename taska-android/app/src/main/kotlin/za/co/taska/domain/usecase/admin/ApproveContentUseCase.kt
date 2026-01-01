package za.co.taska.domain.usecase.admin

import za.co.taska.domain.repository.AdminRepository
import javax.inject.Inject

/**
 * Use case for approving moderated content
 * Allows flagged content to remain on the platform
 */
class ApproveContentUseCase @Inject constructor(
    private val adminRepository: AdminRepository
) {
    suspend operator fun invoke(contentId: String, notes: String? = null): Result<Unit> {
        if (contentId.isBlank()) {
            return Result.failure(IllegalArgumentException("Content ID cannot be empty"))
        }
        return adminRepository.approveContent(contentId.trim(), notes?.trim())
    }
}
