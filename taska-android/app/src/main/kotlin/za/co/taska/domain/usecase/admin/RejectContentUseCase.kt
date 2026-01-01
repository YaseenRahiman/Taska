package za.co.taska.domain.usecase.admin

import za.co.taska.domain.repository.AdminRepository
import javax.inject.Inject

/**
 * Use case for rejecting moderated content
 * Removes or hides flagged content from the platform
 */
class RejectContentUseCase @Inject constructor(
    private val adminRepository: AdminRepository
) {
    suspend operator fun invoke(contentId: String, notes: String? = null): Result<Unit> {
        if (contentId.isBlank()) {
            return Result.failure(IllegalArgumentException("Content ID cannot be empty"))
        }
        return adminRepository.rejectContent(contentId.trim(), notes?.trim())
    }
}
