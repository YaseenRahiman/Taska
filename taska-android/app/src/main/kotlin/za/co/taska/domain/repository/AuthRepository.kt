package za.co.taska.domain.repository

import za.co.taska.domain.model.Resource
import za.co.taska.domain.model.User

/**
 * Auth Repository Interface
 * Defines authentication operations
 */
interface AuthRepository {

    suspend fun register(
        email: String,
        password: String,
        role: String,
        firstName: String?,
        lastName: String?,
        phoneNumber: String?
    ): Resource<User>

    suspend fun login(
        email: String,
        password: String
    ): Resource<User>

    suspend fun logout(): Resource<Unit>

    suspend fun getProfile(): Resource<User>

    suspend fun isLoggedIn(): Boolean

    suspend fun getAccessToken(): String?

    suspend fun refreshToken(): Resource<Unit>
}
