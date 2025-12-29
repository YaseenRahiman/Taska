package za.co.taska.data.remote.api

import retrofit2.Response
import retrofit2.http.*
import za.co.taska.data.remote.dto.request.LoginRequest
import za.co.taska.data.remote.dto.request.RefreshTokenRequest
import za.co.taska.data.remote.dto.request.RegisterRequest
import za.co.taska.data.remote.dto.response.AuthResponse
import za.co.taska.data.remote.dto.response.MessageResponse
import za.co.taska.data.remote.dto.response.UserProfileResponse

/**
 * Auth API Service
 * Retrofit interface for authentication endpoints
 */
interface AuthApiService {

    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<AuthResponse>

    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<AuthResponse>

    @POST("auth/refresh-token")
    suspend fun refreshToken(@Body request: RefreshTokenRequest): Response<AuthResponse>

    @GET("auth/profile")
    suspend fun getProfile(): Response<UserProfileResponse>

    @POST("auth/logout")
    suspend fun logout(): Response<MessageResponse>

    @POST("auth/verify-email")
    suspend fun verifyEmail(@Body token: String): Response<MessageResponse>

    @POST("auth/request-password-reset")
    suspend fun requestPasswordReset(@Body email: String): Response<MessageResponse>

    @POST("auth/reset-password")
    suspend fun resetPassword(
        @Body token: String,
        @Body newPassword: String
    ): Response<MessageResponse>
}
