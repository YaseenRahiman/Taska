package za.co.taska.data.remote.interceptor

import kotlinx.coroutines.test.runTest
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.mockito.kotlin.*
import retrofit2.Response
import za.co.taska.data.local.preferences.PreferencesManager
import za.co.taska.data.remote.api.AuthApiService
import za.co.taska.data.remote.dto.request.RefreshTokenRequest
import za.co.taska.data.remote.dto.response.AuthResponse
import za.co.taska.data.remote.dto.response.UserDto
import java.io.IOException

/**
 * Unit tests for AuthInterceptor
 * Tests token refresh logic, thread safety, and 401 handling
 *
 * Coverage target: >85%
 */
class AuthInterceptorTest {

    private lateinit var authInterceptor: AuthInterceptor
    private lateinit var preferencesManager: PreferencesManager
    private lateinit var authApiService: AuthApiService
    private lateinit var chain: Interceptor.Chain

    private val testAccessToken = "test_access_token"
    private val testRefreshToken = "test_refresh_token"
    private val newAccessToken = "new_access_token"
    private val newRefreshToken = "new_refresh_token"

    @Before
    fun setup() {
        authInterceptor = AuthInterceptor()
        preferencesManager = mock()
        authApiService = mock()
        chain = mock()

        authInterceptor.setPreferencesManager(preferencesManager)
        authInterceptor.setAuthApiService(authApiService)
    }

    // ========== Public Endpoint Tests ==========

    @Test
    fun `intercept should skip auth for login endpoint`() = runTest {
        // Given
        val request = createMockRequest("https://api.taska.co.za/api/v1/auth/login")
        val response = createMockResponse(request, 200)
        whenever(chain.request()).thenReturn(request)
        whenever(chain.proceed(request)).thenReturn(response)

        // When
        val result = authInterceptor.intercept(chain)

        // Then
        verify(preferencesManager, never()).getAccessToken()
        assertEquals(response, result)
    }

    @Test
    fun `intercept should skip auth for register endpoint`() = runTest {
        // Given
        val request = createMockRequest("https://api.taska.co.za/api/v1/auth/register")
        val response = createMockResponse(request, 200)
        whenever(chain.request()).thenReturn(request)
        whenever(chain.proceed(request)).thenReturn(response)

        // When
        val result = authInterceptor.intercept(chain)

        // Then
        verify(preferencesManager, never()).getAccessToken()
        assertEquals(response, result)
    }

    @Test
    fun `intercept should skip auth for password reset endpoints`() = runTest {
        val endpoints = listOf(
            "https://api.taska.co.za/api/v1/auth/request-password-reset",
            "https://api.taska.co.za/api/v1/auth/reset-password"
        )

        endpoints.forEach { url ->
            // Given
            reset(chain, preferencesManager)
            val request = createMockRequest(url)
            val response = createMockResponse(request, 200)
            whenever(chain.request()).thenReturn(request)
            whenever(chain.proceed(request)).thenReturn(response)

            // When
            val result = authInterceptor.intercept(chain)

            // Then
            verify(preferencesManager, never()).getAccessToken()
            assertEquals(response, result)
        }
    }

    // ========== Bearer Token Addition Tests ==========

    @Test
    fun `intercept should add bearer token to authenticated requests`() = runTest {
        // Given
        val request = createMockRequest("https://api.taska.co.za/api/v1/jobs")
        val response = createMockResponse(request, 200)
        whenever(chain.request()).thenReturn(request)
        whenever(preferencesManager.getAccessToken()).thenReturn(testAccessToken)
        whenever(chain.proceed(any())).thenReturn(response)

        // When
        authInterceptor.intercept(chain)

        // Then
        verify(chain).proceed(argThat {
            header("Authorization") == "Bearer $testAccessToken"
        })
    }

    @Test
    fun `intercept should proceed without token when token is null`() = runTest {
        // Given
        val request = createMockRequest("https://api.taska.co.za/api/v1/jobs")
        val response = createMockResponse(request, 200)
        whenever(chain.request()).thenReturn(request)
        whenever(preferencesManager.getAccessToken()).thenReturn(null)
        whenever(chain.proceed(request)).thenReturn(response)

        // When
        val result = authInterceptor.intercept(chain)

        // Then
        verify(chain).proceed(request)
        assertEquals(response, result)
    }

    @Test
    fun `intercept should return successful response when token is valid`() = runTest {
        // Given
        val request = createMockRequest("https://api.taska.co.za/api/v1/profile")
        val response = createMockResponse(request, 200)
        whenever(chain.request()).thenReturn(request)
        whenever(preferencesManager.getAccessToken()).thenReturn(testAccessToken)
        whenever(chain.proceed(any())).thenReturn(response)

        // When
        val result = authInterceptor.intercept(chain)

        // Then
        assertEquals(200, result.code)
        assertEquals(response, result)
    }

    // ========== 401 Token Refresh Tests ==========

    @Test
    fun `intercept should refresh token on 401 response`() = runTest {
        // Given
        val request = createMockRequest("https://api.taska.co.za/api/v1/jobs")
        val unauthorizedResponse = createMockResponse(request, 401)
        val successResponse = createMockResponse(request, 200)

        whenever(chain.request()).thenReturn(request)
        whenever(preferencesManager.getAccessToken())
            .thenReturn(testAccessToken)  // First call
            .thenReturn(newAccessToken)   // Second call after refresh
        whenever(preferencesManager.getRefreshToken()).thenReturn(testRefreshToken)
        whenever(chain.proceed(any()))
            .thenReturn(unauthorizedResponse)  // First attempt fails
            .thenReturn(successResponse)       // Retry succeeds

        // Mock successful token refresh
        val authResponse = createAuthResponse(newAccessToken, newRefreshToken)
        whenever(authApiService.refreshToken(any()))
            .thenReturn(Response.success(authResponse))

        // When
        val result = authInterceptor.intercept(chain)

        // Then
        verify(authApiService).refreshToken(
            argThat { this.refreshToken == testRefreshToken }
        )
        verify(preferencesManager).saveAccessToken(newAccessToken)
        verify(preferencesManager).saveRefreshToken(newRefreshToken)
        assertEquals(200, result.code)
    }

    @Test
    fun `intercept should retry original request with new token after refresh`() = runTest {
        // Given
        val request = createMockRequest("https://api.taska.co.za/api/v1/jobs")
        val unauthorizedResponse = createMockResponse(request, 401)
        val successResponse = createMockResponse(request, 200)

        whenever(chain.request()).thenReturn(request)
        whenever(preferencesManager.getAccessToken())
            .thenReturn(testAccessToken)
            .thenReturn(newAccessToken)
        whenever(preferencesManager.getRefreshToken()).thenReturn(testRefreshToken)
        whenever(chain.proceed(any()))
            .thenReturn(unauthorizedResponse)
            .thenReturn(successResponse)

        val authResponse = createAuthResponse(newAccessToken, newRefreshToken)
        whenever(authApiService.refreshToken(any()))
            .thenReturn(Response.success(authResponse))

        // When
        val result = authInterceptor.intercept(chain)

        // Then
        verify(chain, times(2)).proceed(any())
        assertEquals(200, result.code)
    }

    @Test
    fun `intercept should not refresh token for refresh endpoint 401`() = runTest {
        // Given
        val request = createMockRequest("https://api.taska.co.za/api/v1/auth/refresh-token")
        val unauthorizedResponse = createMockResponse(request, 401)

        whenever(chain.request()).thenReturn(request)
        whenever(preferencesManager.getAccessToken()).thenReturn(testAccessToken)
        whenever(chain.proceed(any())).thenReturn(unauthorizedResponse)

        // When
        val result = authInterceptor.intercept(chain)

        // Then
        verify(authApiService, never()).refreshToken(any())
        assertEquals(401, result.code)
    }

    // ========== Refresh Failure Tests ==========

    @Test
    fun `intercept should clear preferences when refresh fails`() = runTest {
        // Given
        val request = createMockRequest("https://api.taska.co.za/api/v1/jobs")
        val unauthorizedResponse = createMockResponse(request, 401)

        whenever(chain.request()).thenReturn(request)
        whenever(preferencesManager.getAccessToken()).thenReturn(testAccessToken)
        whenever(preferencesManager.getRefreshToken()).thenReturn(testRefreshToken)
        whenever(chain.proceed(any())).thenReturn(unauthorizedResponse)

        // Mock failed token refresh
        whenever(authApiService.refreshToken(any()))
            .thenReturn(Response.error(401, "".toResponseBody()))

        // When
        authInterceptor.intercept(chain)

        // Then
        verify(preferencesManager).clearAll()
    }

    @Test
    fun `intercept should clear preferences when refresh token is null`() = runTest {
        // Given
        val request = createMockRequest("https://api.taska.co.za/api/v1/jobs")
        val unauthorizedResponse = createMockResponse(request, 401)

        whenever(chain.request()).thenReturn(request)
        whenever(preferencesManager.getAccessToken()).thenReturn(testAccessToken)
        whenever(preferencesManager.getRefreshToken()).thenReturn(null)
        whenever(chain.proceed(any())).thenReturn(unauthorizedResponse)

        // When
        authInterceptor.intercept(chain)

        // Then
        verify(authApiService, never()).refreshToken(any())
        verify(preferencesManager).clearAll()
    }

    @Test
    fun `intercept should clear preferences when refresh throws exception`() = runTest {
        // Given
        val request = createMockRequest("https://api.taska.co.za/api/v1/jobs")
        val unauthorizedResponse = createMockResponse(request, 401)

        whenever(chain.request()).thenReturn(request)
        whenever(preferencesManager.getAccessToken()).thenReturn(testAccessToken)
        whenever(preferencesManager.getRefreshToken()).thenReturn(testRefreshToken)
        whenever(chain.proceed(any())).thenReturn(unauthorizedResponse)

        // Mock refresh throwing exception
        whenever(authApiService.refreshToken(any()))
            .thenThrow(IOException("Network error"))

        // When
        authInterceptor.intercept(chain)

        // Then
        verify(preferencesManager).clearAll()
    }

    // ========== Thread Safety Tests ==========

    @Test
    fun `intercept should use double-check pattern to prevent duplicate refresh`() = runTest {
        // Given
        val request = createMockRequest("https://api.taska.co.za/api/v1/jobs")
        val unauthorizedResponse = createMockResponse(request, 401)
        val successResponse = createMockResponse(request, 200)

        whenever(chain.request()).thenReturn(request)

        // Simulate token already refreshed by another thread
        whenever(preferencesManager.getAccessToken())
            .thenReturn(testAccessToken)      // First check (old token)
            .thenReturn(newAccessToken)       // Double-check (token changed)
            .thenReturn(newAccessToken)       // For retry request

        whenever(chain.proceed(any()))
            .thenReturn(unauthorizedResponse)
            .thenReturn(successResponse)

        // When
        val result = authInterceptor.intercept(chain)

        // Then - Should not call refresh since token was already refreshed
        verify(authApiService, never()).refreshToken(any())
        assertEquals(200, result.code)
    }

    // ========== Response Body Handling Tests ==========

    @Test
    fun `intercept should close original response before retrying`() = runTest {
        // Given
        val request = createMockRequest("https://api.taska.co.za/api/v1/jobs")
        val unauthorizedResponse = mock<okhttp3.Response> {
            on { code } doReturn 401
            on { request } doReturn request
        }
        val successResponse = createMockResponse(request, 200)

        whenever(chain.request()).thenReturn(request)
        whenever(preferencesManager.getAccessToken())
            .thenReturn(testAccessToken)
            .thenReturn(newAccessToken)
        whenever(preferencesManager.getRefreshToken()).thenReturn(testRefreshToken)
        whenever(chain.proceed(any()))
            .thenReturn(unauthorizedResponse)
            .thenReturn(successResponse)

        val authResponse = createAuthResponse(newAccessToken, newRefreshToken)
        whenever(authApiService.refreshToken(any()))
            .thenReturn(Response.success(authResponse))

        // When
        authInterceptor.intercept(chain)

        // Then
        verify(unauthorizedResponse).close()
    }

    // ========== Multiple Scenarios Tests ==========

    @Test
    fun `intercept should handle multiple successful requests with same token`() = runTest {
        // Given
        val requests = listOf(
            createMockRequest("https://api.taska.co.za/api/v1/jobs"),
            createMockRequest("https://api.taska.co.za/api/v1/profile"),
            createMockRequest("https://api.taska.co.za/api/v1/notifications")
        )

        requests.forEach { request ->
            val response = createMockResponse(request, 200)
            whenever(chain.request()).thenReturn(request)
            whenever(preferencesManager.getAccessToken()).thenReturn(testAccessToken)
            whenever(chain.proceed(any())).thenReturn(response)

            // When
            val result = authInterceptor.intercept(chain)

            // Then
            assertEquals(200, result.code)
            verify(chain).proceed(argThat {
                header("Authorization") == "Bearer $testAccessToken"
            })

            // Reset for next iteration
            clearInvocations(chain)
        }
    }

    @Test
    fun `intercept should handle refresh success response with null body`() = runTest {
        // Given
        val request = createMockRequest("https://api.taska.co.za/api/v1/jobs")
        val unauthorizedResponse = createMockResponse(request, 401)

        whenever(chain.request()).thenReturn(request)
        whenever(preferencesManager.getAccessToken()).thenReturn(testAccessToken)
        whenever(preferencesManager.getRefreshToken()).thenReturn(testRefreshToken)
        whenever(chain.proceed(any())).thenReturn(unauthorizedResponse)

        // Mock successful refresh but null body
        whenever(authApiService.refreshToken(any()))
            .thenReturn(Response.success(null))

        // When
        authInterceptor.intercept(chain)

        // Then - Should treat as failure and clear preferences
        verify(preferencesManager).clearAll()
        verify(preferencesManager, never()).saveAccessToken(any())
    }

    // ========== Edge Cases ==========

    @Test
    fun `intercept should handle empty token from preferences`() = runTest {
        // Given
        val request = createMockRequest("https://api.taska.co.za/api/v1/jobs")
        val response = createMockResponse(request, 200)
        whenever(chain.request()).thenReturn(request)
        whenever(preferencesManager.getAccessToken()).thenReturn("")
        whenever(chain.proceed(request)).thenReturn(response)

        // When
        val result = authInterceptor.intercept(chain)

        // Then - Should proceed without token
        verify(chain).proceed(request)
        assertEquals(200, result.code)
    }

    @Test
    fun `intercept should handle various HTTP status codes correctly`() = runTest {
        val statusCodes = listOf(200, 201, 400, 403, 404, 500)

        statusCodes.forEach { statusCode ->
            // Given
            reset(chain, preferencesManager)
            val request = createMockRequest("https://api.taska.co.za/api/v1/jobs")
            val response = createMockResponse(request, statusCode)
            whenever(chain.request()).thenReturn(request)
            whenever(preferencesManager.getAccessToken()).thenReturn(testAccessToken)
            whenever(chain.proceed(any())).thenReturn(response)

            // When
            val result = authInterceptor.intercept(chain)

            // Then - Only 401 should trigger refresh
            if (statusCode == 401) {
                verify(preferencesManager).getRefreshToken()
            } else {
                verify(preferencesManager, never()).getRefreshToken()
            }
            assertEquals(statusCode, result.code)
        }
    }

    @Test
    fun `setPreferencesManager should update preferences manager reference`() {
        // Given
        val newPreferencesManager: PreferencesManager = mock()

        // When
        authInterceptor.setPreferencesManager(newPreferencesManager)

        // Then - Next intercept should use new manager
        val request = createMockRequest("https://api.taska.co.za/api/v1/jobs")
        val response = createMockResponse(request, 200)
        whenever(chain.request()).thenReturn(request)
        whenever(newPreferencesManager.getAccessToken()).thenReturn(testAccessToken)
        whenever(chain.proceed(any())).thenReturn(response)

        authInterceptor.intercept(chain)

        verify(newPreferencesManager).getAccessToken()
    }

    @Test
    fun `setAuthApiService should update api service reference`() = runTest {
        // Given
        val newAuthApiService: AuthApiService = mock()

        // When
        authInterceptor.setAuthApiService(newAuthApiService)

        // Then - Next refresh should use new service
        val request = createMockRequest("https://api.taska.co.za/api/v1/jobs")
        val unauthorizedResponse = createMockResponse(request, 401)
        val successResponse = createMockResponse(request, 200)

        whenever(chain.request()).thenReturn(request)
        whenever(preferencesManager.getAccessToken())
            .thenReturn(testAccessToken)
            .thenReturn(newAccessToken)
        whenever(preferencesManager.getRefreshToken()).thenReturn(testRefreshToken)
        whenever(chain.proceed(any()))
            .thenReturn(unauthorizedResponse)
            .thenReturn(successResponse)

        val authResponse = createAuthResponse(newAccessToken, newRefreshToken)
        whenever(newAuthApiService.refreshToken(any()))
            .thenReturn(Response.success(authResponse))

        authInterceptor.intercept(chain)

        verify(newAuthApiService).refreshToken(any())
    }

    // ========== Helper Methods ==========

    private fun createMockRequest(url: String): Request {
        return Request.Builder()
            .url(url)
            .build()
    }

    private fun createMockResponse(request: Request, code: Int): okhttp3.Response {
        return okhttp3.Response.Builder()
            .request(request)
            .protocol(Protocol.HTTP_2)
            .code(code)
            .message("Test Response")
            .body("{}".toResponseBody("application/json".toMediaTypeOrNull()))
            .build()
    }

    private fun createAuthResponse(accessToken: String, refreshToken: String): AuthResponse {
        return AuthResponse(
            accessToken = accessToken,
            refreshToken = refreshToken,
            user = UserDto(
                id = "user_123",
                email = "test@example.com",
                role = "CLIENT",
                verifiedAt = null,
                profile = null
            )
        )
    }
}
