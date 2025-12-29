package za.co.taska.domain.usecase.admin

import za.co.taska.domain.model.AdminUser
import za.co.taska.domain.model.UserFilter
import za.co.taska.domain.repository.AdminRepository
import javax.inject.Inject

/**
 * Use case for retrieving users with filtering
 * Supports filtering by role, status, verification, and search
 */
class GetUsersUseCase @Inject constructor(
    private val adminRepository: AdminRepository
) {
    suspend operator fun invoke(filter: UserFilter): Result<List<AdminUser>> {
        return adminRepository.getUsers(filter)
    }
}
