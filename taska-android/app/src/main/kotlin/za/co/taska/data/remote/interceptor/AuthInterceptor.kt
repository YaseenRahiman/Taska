package za.co.taska.data.remote.interceptor

import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import okhttp3.Interceptor
import okhttp3.Response
import za.co.taska.data.local.preferences.PreferencesManager
import za.co.taska.data.remote.api.AuthApiService
import za.co.taska.data.remote.dto.request.RefreshTokenRequest
import za.co.taska.domain.model.Resource
import javax.inject.Inject

/**
 * Enhanced Auth Interceptor with automatic token refresh
 * - Adds JWT token to authenticated requests
 * - Detects 401 Unauthorized responses
 * - Automatically refreshes expired tokens
 * - Retries failed requests with new token
 * - Thread-safe with mutex to prevent concurrent refresh attempts
 */
class AuthInterceptor @Inject constructor() : Interceptor {

    private var preferencesManager: PreferencesManager? = null
    private var authApiService: AuthApiService? = null
    private val refreshMutex = Mutex()

    fun setPreferencesManager(manager: PreferencesManager) {
        this.preferencesManager = manager
    }

    fun setAuthApiService(apiService: AuthApiService) {
        this.authApiService = apiService
    }

    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()

        // Skip auth for public endpoints
        val url = originalRequest.url.toString()
        if (isPublicEndpoint(url)) {
            return chain.proceed(originalRequest)
        }

        // Add auth token to request
        val token = runBlocking {
            preferencesManager?.getAccessToken()
        }

        val authenticatedRequest = if (token != null) {
            originalRequest.newBuilder()
                .header("Authorization", "Bearer $token")
                .build()
        } else {
            originalRequest
        }

        // Proceed with request
        var response = chain.proceed(authenticatedRequest)

        // Handle 401 Unauthorized - token expired
        if (response.code == 401 && !url.contains("/auth/refresh-token")) {
            response.close()  // Close the original response

            // Attempt to refresh token
            val refreshResult = runBlocking {
                refreshMutex.withLock {
                    // Double-check token wasn't already refreshed by another thread
                    val currentToken = preferencesManager?.getAccessToken()
                    if (currentToken != null && currentToken != token) {
                        // Token was already refreshed by another request
                        return@withLock Resource.success(Unit)
                    }

                    attemptTokenRefresh()
                }
            }

            // If refresh successful, retry original request with new token
            if (refreshResult is Resource.Success) {
                val newToken = runBlocking {
                    preferencesManager?.getAccessToken()
                }

                if (newToken != null) {
                    val retryRequest = originalRequest.newBuilder()
                        .header("Authorization", "Bearer $newToken")
                        .build()

                    response = chain.proceed(retryRequest)
                }
            } else {
                // Refresh failed - user must re-authenticate
                runBlocking {
                    preferencesManager?.clearAll()
                }
            }
        }

        return response
    }

    private fun isPublicEndpoint(url: String): Boolean {
        return url.contains("/auth/login") ||
                url.contains("/auth/register") ||
                url.contains("/auth/request-password-reset") ||
                url.contains("/auth/reset-password")
    }

    private suspend fun attemptTokenRefresh(): Resource<Unit> {
        return try {
            val refreshToken = preferencesManager?.getRefreshToken()
                ?: return Resource.error("No refresh token available")

            val apiService = authApiService
                ?: return Resource.error("Auth API service not initialized")

            val request = RefreshTokenRequest(refreshToken)
            val response = apiService.refreshToken(request)

            if (response.isSuccessful && response.body() != null) {
                val authResponse = response.body()!!

                // Save new tokens
                preferencesManager?.saveAccessToken(authResponse.accessToken)
                preferencesManager?.saveRefreshToken(authResponse.refreshToken)

                Resource.success(Unit)
            } else {
                Resource.error("Token refresh failed: ${response.message()}")
            }
        } catch (e: Exception) {
            Resource.error("Token refresh exception: ${e.message}", e)
        }
    }
}
