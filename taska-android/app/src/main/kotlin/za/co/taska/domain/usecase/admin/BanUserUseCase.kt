package za.co.taska.domain.usecase.admin

import za.co.taska.domain.repository.AdminRepository
import javax.inject.Inject

/**
 * Use case for banning a user permanently
 * Requires a reason for audit trail
 */
class BanUserUseCase @Inject constructor(
    private val adminRepository: AdminRepository
) {
    suspend operator fun invoke(userId: String, reason: String): Result<Unit> {
        if (userId.isBlank()) {
            return Result.failure(IllegalArgumentException("User ID cannot be empty"))
        }
        if (reason.isBlank() || reason.length < 10) {
            return Result.failure(IllegalArgumentException("Ban reason must be at least 10 characters"))
        }
        return adminRepository.banUser(userId.trim(), reason.trim())
    }
}
