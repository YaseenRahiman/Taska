package za.co.taska.domain.usecase.admin

import za.co.taska.domain.model.AdminUser
import za.co.taska.domain.repository.AdminRepository
import javax.inject.Inject

/**
 * Use case for retrieving detailed user information
 * Returns comprehensive user data for admin review
 */
class GetUserDetailsUseCase @Inject constructor(
    private val adminRepository: AdminRepository
) {
    suspend operator fun invoke(userId: String): Result<AdminUser> {
        if (userId.isBlank()) {
            return Result.failure(IllegalArgumentException("User ID cannot be empty"))
        }
        return adminRepository.getUserDetails(userId.trim())
    }
}
