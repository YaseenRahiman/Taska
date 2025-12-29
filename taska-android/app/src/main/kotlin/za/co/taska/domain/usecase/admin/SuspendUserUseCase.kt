package za.co.taska.domain.usecase.admin

import za.co.taska.domain.repository.AdminRepository
import javax.inject.Inject

/**
 * Use case for suspending a user temporarily
 * Requires a reason and optional expiry date
 */
class SuspendUserUseCase @Inject constructor(
    private val adminRepository: AdminRepository
) {
    suspend operator fun invoke(
        userId: String,
        reason: String,
        suspendUntil: String? = null
    ): Result<Unit> {
        if (userId.isBlank()) {
            return Result.failure(IllegalArgumentException("User ID cannot be empty"))
        }
        if (reason.isBlank() || reason.length < 10) {
            return Result.failure(IllegalArgumentException("Suspension reason must be at least 10 characters"))
        }
        return adminRepository.suspendUser(userId.trim(), reason.trim(), suspendUntil)
    }
}
