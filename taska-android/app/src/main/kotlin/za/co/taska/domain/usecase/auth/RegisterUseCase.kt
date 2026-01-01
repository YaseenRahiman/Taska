package za.co.taska.domain.usecase.auth

import za.co.taska.domain.model.Resource
import za.co.taska.domain.model.User
import za.co.taska.domain.repository.AuthRepository
import javax.inject.Inject

/**
 * Register Use Case
 * Single responsibility: Handle user registration
 */
class RegisterUseCase @Inject constructor(
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(
        email: String,
        password: String,
        confirmPassword: String,
        role: String,
        firstName: String?,
        lastName: String?,
        phoneNumber: String?
    ): Resource<User> {
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

        if (password != confirmPassword) {
            return Resource.error("Passwords do not match")
        }

        if (phoneNumber != null && phoneNumber.isNotBlank()) {
            if (!phoneNumber.startsWith("+27") && !phoneNumber.startsWith("0")) {
                return Resource.error("Invalid South African phone number")
            }
        }

        // Execute registration
        return authRepository.register(
            email = email,
            password = password,
            role = role,
            firstName = firstName,
            lastName = lastName,
            phoneNumber = phoneNumber
        )
    }
}
