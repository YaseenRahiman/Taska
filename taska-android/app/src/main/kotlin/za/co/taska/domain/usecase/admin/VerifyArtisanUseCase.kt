package za.co.taska.domain.usecase.admin

import za.co.taska.domain.repository.AdminRepository
import javax.inject.Inject

/**
 * Use case for verifying an artisan
 * Marks artisan as verified after credential review
 */
class VerifyArtisanUseCase @Inject constructor(
    private val adminRepository: AdminRepository
) {
    suspend operator fun invoke(userId: String): Result<Unit> {
        if (userId.isBlank()) {
            return Result.failure(IllegalArgumentException("User ID cannot be empty"))
        }
        return adminRepository.verifyArtisan(userId.trim())
    }
}
