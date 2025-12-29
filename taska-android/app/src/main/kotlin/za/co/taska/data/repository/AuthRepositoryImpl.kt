package za.co.taska.data.repository

import za.co.taska.data.local.preferences.PreferencesManager
import za.co.taska.data.mapper.toDomain
import za.co.taska.data.remote.api.AuthApiService
import za.co.taska.data.remote.dto.request.LoginRequest
import za.co.taska.data.remote.dto.request.RefreshTokenRequest
import za.co.taska.data.remote.dto.request.RegisterRequest
import za.co.taska.domain.model.Resource
import za.co.taska.domain.model.User
import za.co.taska.domain.repository.AuthRepository
import javax.inject.Inject

/**
 * Auth Repository Implementation
 * Implements authentication operations with API and local storage
 */
class AuthRepositoryImpl @Inject constructor(
    private val authApiService: AuthApiService,
    private val preferencesManager: PreferencesManager
) : AuthRepository {

    override suspend fun register(
        email: String,
        password: String,
        role: String,
        firstName: String?,
        lastName: String?,
        phoneNumber: String?
    ): Resource<User> {
        return try {
            val request = RegisterRequest(
                email = email,
                password = password,
                role = role,
                firstName = firstName,
                lastName = lastName,
                phoneNumber = phoneNumber
            )

            val response = authApiService.register(request)

            if (response.isSuccessful && response.body() != null) {
                val authResponse = response.body()!!

                // Save tokens
                preferencesManager.saveAccessToken(authResponse.accessToken)
                preferencesManager.saveRefreshToken(authResponse.refreshToken)

                // Save user info
                authResponse.user?.let { user ->
                    preferencesManager.saveUserInfo(
                        userId = user.id,
                        email = user.email,
                        role = user.role
                    )

                    Resource.success(user.toDomain())
                } ?: Resource.error("Registration successful but no user data")
            } else {
                Resource.error(response.message() ?: "Registration failed")
            }
        } catch (e: Exception) {
            Resource.error(e.message ?: "Registration error", e)
        }
    }

    override suspend fun login(
        email: String,
        password: String
    ): Resource<User> {
        return try {
            val request = LoginRequest(email, password)
            val response = authApiService.login(request)

            if (response.isSuccessful && response.body() != null) {
                val authResponse = response.body()!!

                // Save tokens
                preferencesManager.saveAccessToken(authResponse.accessToken)
                preferencesManager.saveRefreshToken(authResponse.refreshToken)

                // Save user info
                authResponse.user?.let { user ->
                    preferencesManager.saveUserInfo(
                        userId = user.id,
                        email = user.email,
                        role = user.role
                    )

                    Resource.success(user.toDomain())
                } ?: Resource.error("Login successful but no user data")
            } else {
                Resource.error(response.message() ?: "Login failed")
            }
        } catch (e: Exception) {
            Resource.error(e.message ?: "Login error", e)
        }
    }

    override suspend fun logout(): Resource<Unit> {
        return try {
            authApiService.logout()
            preferencesManager.clearAll()
            Resource.success(Unit)
        } catch (e: Exception) {
            // Clear local data anyway
            preferencesManager.clearAll()
            Resource.success(Unit)
        }
    }

    override suspend fun getProfile(): Resource<User> {
        return try {
            val response = authApiService.getProfile()

            if (response.isSuccessful && response.body() != null) {
                val userProfile = response.body()!!
                Resource.success(
                    User(
                        id = userProfile.id,
                        email = userProfile.email,
                        role = userProfile.role.let {
                            try {
                                za.co.taska.domain.model.UserRole.valueOf(it)
                            } catch (e: Exception) {
                                za.co.taska.domain.model.UserRole.ARTISAN
                            }
                        },
                        verifiedAt = userProfile.verifiedAt,
                        profile = userProfile.profile?.let {
                            za.co.taska.domain.model.Profile(
                                firstName = it.firstName,
                                lastName = it.lastName,
                                phoneNumber = it.phoneNumber,
                                city = it.city,
                                province = it.province,
                                latitude = it.latitude,
                                longitude = it.longitude,
                                profilePictureUrl = it.profilePictureUrl,
                                bio = it.bio,
                                isVerified = it.isVerified
                            )
                        }
                    )
                )
            } else {
                Resource.error(response.message() ?: "Failed to get profile")
            }
        } catch (e: Exception) {
            Resource.error(e.message ?: "Error getting profile", e)
        }
    }

    override suspend fun isLoggedIn(): Boolean {
        return preferencesManager.isLoggedIn()
    }

    override suspend fun getAccessToken(): String? {
        return preferencesManager.getAccessToken()
    }

    override suspend fun refreshToken(): Resource<Unit> {
        return try {
            val refreshToken = preferencesManager.getRefreshToken()
                ?: return Resource.error("No refresh token available")

            val request = RefreshTokenRequest(refreshToken)
            val response = authApiService.refreshToken(request)

            if (response.isSuccessful && response.body() != null) {
                val authResponse = response.body()!!

                // Save new tokens
                preferencesManager.saveAccessToken(authResponse.accessToken)
                preferencesManager.saveRefreshToken(authResponse.refreshToken)

                Resource.success(Unit)
            } else {
                // Refresh token is invalid or expired - user must re-authenticate
                Resource.error(response.message() ?: "Token refresh failed")
            }
        } catch (e: Exception) {
            Resource.error(e.message ?: "Token refresh error", e)
        }
    }
}
