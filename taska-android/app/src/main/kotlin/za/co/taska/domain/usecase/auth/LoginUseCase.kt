package za.co.taska.domain.usecase.auth

import za.co.taska.domain.model.Resource
import za.co.taska.domain.model.User
import za.co.taska.domain.repository.AuthRepository
import javax.inject.Inject

/**
 * Login Use Case
 * Single responsibility: Handle user login
 */
class LoginUseCase @Inject constructor(
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(email: String, password: String): Resource<User> {
        // Validate inputs
        if (email.isBlank()) {
            return Resource.error("Email cannot be empty")
        }

        if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            return Resource.error("Invalid email format")
        }

        if (password.isBlank()) {
            return Resource.error("Password cannot be empty")
        }

        if (password.length < 6) {
            return Resource.error("Password must be at least 6 characters")
        }

        // Execute login
        return authRepository.login(email, password)
    }
}
