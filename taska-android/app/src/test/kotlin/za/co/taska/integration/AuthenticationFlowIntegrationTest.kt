package za.co.taska.integration

import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.mockito.kotlin.*
import retrofit2.Response
import za.co.taska.data.local.preferences.PreferencesManager
import za.co.taska.data.mapper.toDomain
import za.co.taska.data.remote.api.AuthApiService
import za.co.taska.data.remote.dto.request.LoginRequest
import za.co.taska.data.remote.dto.request.RefreshTokenRequest
import za.co.taska.data.remote.dto.request.RegisterRequest
import za.co.taska.data.remote.dto.response.AuthResponse
import za.co.taska.data.remote.dto.response.UserDto
import za.co.taska.data.repository.AuthRepositoryImpl
import za.co.taska.domain.model.Resource
import za.co.taska.domain.model.User
import za.co.taska.domain.model.UserRole
import za.co.taska.domain.usecase.auth.LoginUseCase
import za.co.taska.domain.usecase.auth.RegisterUseCase

/**
 * Integration tests for complete authentication flows
 * Tests end-to-end scenarios with all auth components
 *
 * Coverage target: >80%
 */
class AuthenticationFlowIntegrationTest {

    private lateinit var authApiService: AuthApiService
    private lateinit var preferencesManager: PreferencesManager
    private lateinit var authRepository: AuthRepositoryImpl
    private lateinit var registerUseCase: RegisterUseCase
    private lateinit var loginUseCase: LoginUseCase

    @Before
    fun setup() {
        authApiService = mock()
        preferencesManager = mock()
        authRepository = AuthRepositoryImpl(authApiService, preferencesManager)
        registerUseCase = RegisterUseCase(authRepository)
        loginUseCase = LoginUseCase(authRepository)
    }

    // ========== Complete Registration Flow Tests ==========

    @Test
    fun `CLIENT registration flow should save tokens and user info`() = runTest {
        // Given
        val email = "client@example.com"
        val password = "SecurePass123!"
        val role = "CLIENT"
        val firstName = "John"
        val lastName = "Doe"
        val phoneNumber = "0821234567"

        val userDto = UserDto(
            id = "user_123",
            email = email,
            role = role,
            verifiedAt = null,
            profile = null
        )

        val authResponse = AuthResponse(
            accessToken = "access_token_123",
            refreshToken = "refresh_token_456",
            user = userDto
        )

        whenever(authApiService.register(any())).thenReturn(Response.success(authResponse))

        // When
        val result = registerUseCase(
            email = email,
            password = password,
            confirmPassword = password,
            role = role,
            firstName = firstName,
            lastName = lastName,
            phoneNumber = phoneNumber
        )

        // Then
        assertTrue(result is Resource.Success)
        assertEquals("user_123", result.data?.id)
        assertEquals(UserRole.CLIENT, result.data?.role)

        // Verify tokens saved
        verify(preferencesManager).saveAccessToken("access_token_123")
        verify(preferencesManager).saveRefreshToken("refresh_token_456")

        // Verify user info saved
        verify(preferencesManager).saveUserInfo(
            userId = "user_123",
            email = email,
            role = role
        )

        // Verify API called with correct request
        verify(authApiService).register(argThat {
            this.email == email &&
            this.password == password &&
            this.role == role &&
            this.firstName == firstName &&
            this.lastName == lastName &&
            this.phoneNumber == phoneNumber
        })
    }

    @Test
    fun `ARTISAN registration flow should save tokens and user info`() = runTest {
        // Given
        val email = "artisan@example.com"
        val password = "SecurePass123!"
        val role = "ARTISAN"

        val userDto = UserDto(
            id = "artisan_123",
            email = email,
            role = role,
            verifiedAt = null,
            profile = null
        )

        val authResponse = AuthResponse(
            accessToken = "artisan_access",
            refreshToken = "artisan_refresh",
            user = userDto
        )

        whenever(authApiService.register(any())).thenReturn(Response.success(authResponse))

        // When
        val result = registerUseCase(
            email = email,
            password = password,
            confirmPassword = password,
            role = role,
            firstName = "Jane",
            lastName = "Smith",
            phoneNumber = "0827654321"
        )

        // Then
        assertTrue(result is Resource.Success)
        assertEquals(UserRole.ARTISAN, result.data?.role)
        verify(preferencesManager).saveUserInfo(
            userId = "artisan_123",
            email = email,
            role = role
        )
    }

    @Test
    fun `registration should fail when email already exists`() = runTest {
        // Given
        whenever(authApiService.register(any()))
            .thenReturn(Response.error(400, okhttp3.ResponseBody.create(null, "Email already registered")))

        // When
        val result = registerUseCase(
            email = "existing@example.com",
            password = "SecurePass123!",
            confirmPassword = "SecurePass123!",
            role = "CLIENT",
            firstName = "John",
            lastName = "Doe",
            phoneNumber = "0821234567"
        )

        // Then
        assertTrue(result is Resource.Error)
        verify(preferencesManager, never()).saveAccessToken(any())
        verify(preferencesManager, never()).saveRefreshToken(any())
    }

    // ========== Complete Login Flow Tests ==========

    @Test
    fun `CLIENT login flow should save tokens and return user with role`() = runTest {
        // Given
        val email = "client@example.com"
        val password = "SecurePass123!"

        val userDto = UserDto(
            id = "client_123",
            email = email,
            role = "CLIENT",
            verifiedAt = "2024-01-01T00:00:00Z",
            profile = null
        )

        val authResponse = AuthResponse(
            accessToken = "client_access",
            refreshToken = "client_refresh",
            user = userDto
        )

        whenever(authApiService.login(any())).thenReturn(Response.success(authResponse))

        // When
        val result = loginUseCase(email, password)

        // Then
        assertTrue(result is Resource.Success)
        assertEquals("client_123", result.data?.id)
        assertEquals(UserRole.CLIENT, result.data?.role)

        verify(preferencesManager).saveAccessToken("client_access")
        verify(preferencesManager).saveRefreshToken("client_refresh")
        verify(preferencesManager).saveUserInfo(
            userId = "client_123",
            email = email,
            role = "CLIENT"
        )
    }

    @Test
    fun `ARTISAN login flow should save tokens and return user with role`() = runTest {
        // Given
        val email = "artisan@example.com"
        val password = "SecurePass123!"

        val userDto = UserDto(
            id = "artisan_123",
            email = email,
            role = "ARTISAN",
            verifiedAt = "2024-01-01T00:00:00Z",
            profile = null
        )

        val authResponse = AuthResponse(
            accessToken = "artisan_access",
            refreshToken = "artisan_refresh",
            user = userDto
        )

        whenever(authApiService.login(any())).thenReturn(Response.success(authResponse))

        // When
        val result = loginUseCase(email, password)

        // Then
        assertTrue(result is Resource.Success)
        assertEquals(UserRole.ARTISAN, result.data?.role)
        verify(preferencesManager).saveUserInfo(
            userId = "artisan_123",
            email = email,
            role = "ARTISAN"
        )
    }

    @Test
    fun `login should fail with invalid credentials`() = runTest {
        // Given
        whenever(authApiService.login(any()))
            .thenReturn(Response.error(401, okhttp3.ResponseBody.create(null, "Invalid credentials")))

        // When
        val result = loginUseCase("wrong@example.com", "wrongpassword")

        // Then
        assertTrue(result is Resource.Error)
        verify(preferencesManager, never()).saveAccessToken(any())
    }

    // ========== Token Refresh Flow Tests ==========

    @Test
    fun `token refresh flow should update both tokens`() = runTest {
        // Given
        val oldRefreshToken = "old_refresh_token"
        val newAccessToken = "new_access_token"
        val newRefreshToken = "new_refresh_token"

        whenever(preferencesManager.getRefreshToken()).thenReturn(oldRefreshToken)

        val authResponse = AuthResponse(
            accessToken = newAccessToken,
            refreshToken = newRefreshToken,
            user = UserDto(
                id = "user_123",
                email = "test@example.com",
                role = "CLIENT",
                verifiedAt = null,
                profile = null
            )
        )

        whenever(authApiService.refreshToken(any()))
            .thenReturn(Response.success(authResponse))

        // When
        val result = authRepository.refreshToken()

        // Then
        assertTrue(result is Resource.Success)
        verify(authApiService).refreshToken(
            argThat { this.refreshToken == oldRefreshToken }
        )
        verify(preferencesManager).saveAccessToken(newAccessToken)
        verify(preferencesManager).saveRefreshToken(newRefreshToken)
    }

    @Test
    fun `token refresh should fail when refresh token is missing`() = runTest {
        // Given
        whenever(preferencesManager.getRefreshToken()).thenReturn(null)

        // When
        val result = authRepository.refreshToken()

        // Then
        assertTrue(result is Resource.Error)
        assertEquals("No refresh token available", result.message)
        verify(authApiService, never()).refreshToken(any())
    }

    @Test
    fun `token refresh should fail when refresh token is expired`() = runTest {
        // Given
        whenever(preferencesManager.getRefreshToken()).thenReturn("expired_refresh_token")
        whenever(authApiService.refreshToken(any()))
            .thenReturn(Response.error(401, okhttp3.ResponseBody.create(null, "Refresh token expired")))

        // When
        val result = authRepository.refreshToken()

        // Then
        assertTrue(result is Resource.Error)
        verify(preferencesManager, never()).saveAccessToken(any())
        verify(preferencesManager, never()).saveRefreshToken(any())
    }

    // ========== Logout Flow Tests ==========

    @Test
    fun `logout should clear all preferences`() = runTest {
        // Given
        whenever(authApiService.logout()).thenReturn(
            Response.success(za.co.taska.data.remote.dto.response.MessageResponse("Logged out"))
        )

        // When
        val result = authRepository.logout()

        // Then
        assertTrue(result is Resource.Success)
        verify(preferencesManager).clearAll()
    }

    @Test
    fun `logout should clear preferences even if API call fails`() = runTest {
        // Given
        whenever(authApiService.logout()).thenThrow(RuntimeException("Network error"))

        // When
        val result = authRepository.logout()

        // Then
        assertTrue(result is Resource.Success) // Still succeeds locally
        verify(preferencesManager).clearAll()
    }

    // ========== Session Persistence Tests ==========

    @Test
    fun `session should persist after app restart when tokens are valid`() = runTest {
        // Simulate app restart - check stored tokens
        // Given
        whenever(preferencesManager.getAccessToken()).thenReturn("stored_access_token")
        whenever(preferencesManager.getUserId()).thenReturn("user_123")
        whenever(preferencesManager.getUserRole()).thenReturn("CLIENT")

        // When
        val isLoggedIn = authRepository.isLoggedIn()
        val accessToken = authRepository.getAccessToken()

        // Then
        assertTrue(isLoggedIn)
        assertEquals("stored_access_token", accessToken)
    }

    @Test
    fun `session should not persist when tokens are cleared`() = runTest {
        // Given
        whenever(preferencesManager.getAccessToken()).thenReturn(null)

        // When
        val isLoggedIn = authRepository.isLoggedIn()

        // Then
        assertFalse(isLoggedIn)
    }

    // ========== Complete User Journey Tests ==========

    @Test
    fun `complete CLIENT journey - register, logout, login`() = runTest {
        // Step 1: Register
        val registerResponse = AuthResponse(
            accessToken = "register_access",
            refreshToken = "register_refresh",
            user = UserDto("user_123", "client@example.com", "CLIENT", null, null)
        )
        whenever(authApiService.register(any())).thenReturn(Response.success(registerResponse))

        val registerResult = registerUseCase(
            email = "client@example.com",
            password = "SecurePass123!",
            confirmPassword = "SecurePass123!",
            role = "CLIENT",
            firstName = "John",
            lastName = "Doe",
            phoneNumber = "0821234567"
        )

        assertTrue(registerResult is Resource.Success)
        verify(preferencesManager).saveAccessToken("register_access")

        // Step 2: Logout
        whenever(authApiService.logout()).thenReturn(
            Response.success(za.co.taska.data.remote.dto.response.MessageResponse("Logged out"))
        )

        val logoutResult = authRepository.logout()

        assertTrue(logoutResult is Resource.Success)
        verify(preferencesManager).clearAll()

        // Step 3: Login
        val loginResponse = AuthResponse(
            accessToken = "login_access",
            refreshToken = "login_refresh",
            user = UserDto("user_123", "client@example.com", "CLIENT", "2024-01-01T00:00:00Z", null)
        )
        whenever(authApiService.login(any())).thenReturn(Response.success(loginResponse))

        val loginResult = loginUseCase("client@example.com", "SecurePass123!")

        assertTrue(loginResult is Resource.Success)
        verify(preferencesManager).saveAccessToken("login_access")
    }

    @Test
    fun `complete ARTISAN journey - register, token refresh, logout`() = runTest {
        // Step 1: Register as ARTISAN
        val registerResponse = AuthResponse(
            accessToken = "artisan_access",
            refreshToken = "artisan_refresh",
            user = UserDto("artisan_123", "artisan@example.com", "ARTISAN", null, null)
        )
        whenever(authApiService.register(any())).thenReturn(Response.success(registerResponse))

        val registerResult = registerUseCase(
            email = "artisan@example.com",
            password = "SecurePass123!",
            confirmPassword = "SecurePass123!",
            role = "ARTISAN",
            firstName = "Jane",
            lastName = "Smith",
            phoneNumber = "0827654321"
        )

        assertTrue(registerResult is Resource.Success)
        assertEquals(UserRole.ARTISAN, registerResult.data?.role)

        // Step 2: Token expires and gets refreshed
        whenever(preferencesManager.getRefreshToken()).thenReturn("artisan_refresh")

        val refreshResponse = AuthResponse(
            accessToken = "new_artisan_access",
            refreshToken = "new_artisan_refresh",
            user = UserDto("artisan_123", "artisan@example.com", "ARTISAN", null, null)
        )
        whenever(authApiService.refreshToken(any())).thenReturn(Response.success(refreshResponse))

        val refreshResult = authRepository.refreshToken()

        assertTrue(refreshResult is Resource.Success)
        verify(preferencesManager).saveAccessToken("new_artisan_access")

        // Step 3: Logout
        whenever(authApiService.logout()).thenReturn(
            Response.success(za.co.taska.data.remote.dto.response.MessageResponse("Logged out"))
        )

        val logoutResult = authRepository.logout()

        assertTrue(logoutResult is Resource.Success)
        verify(preferencesManager, atLeastOnce()).clearAll()
    }

    // ========== Error Recovery Tests ==========

    @Test
    fun `registration failure should not save any data`() = runTest {
        // Given
        whenever(authApiService.register(any()))
            .thenReturn(Response.error(500, okhttp3.ResponseBody.create(null, "Server error")))

        // When
        val result = registerUseCase(
            email = "test@example.com",
            password = "SecurePass123!",
            confirmPassword = "SecurePass123!",
            role = "CLIENT",
            firstName = "John",
            lastName = "Doe",
            phoneNumber = "0821234567"
        )

        // Then
        assertTrue(result is Resource.Error)
        verify(preferencesManager, never()).saveAccessToken(any())
        verify(preferencesManager, never()).saveRefreshToken(any())
        verify(preferencesManager, never()).saveUserInfo(any(), any(), any())
    }

    @Test
    fun `login failure should not save any data`() = runTest {
        // Given
        whenever(authApiService.login(any()))
            .thenReturn(Response.error(401, okhttp3.ResponseBody.create(null, "Invalid credentials")))

        // When
        val result = loginUseCase("wrong@example.com", "wrongpassword")

        // Then
        assertTrue(result is Resource.Error)
        verify(preferencesManager, never()).saveAccessToken(any())
        verify(preferencesManager, never()).saveRefreshToken(any())
        verify(preferencesManager, never()).saveUserInfo(any(), any(), any())
    }

    // ========== Role-Based Navigation Data Tests ==========

    @Test
    fun `successful login should provide role for navigation`() = runTest {
        val roles = mapOf(
            "CLIENT" to UserRole.CLIENT,
            "ARTISAN" to UserRole.ARTISAN,
            "ADMIN" to UserRole.ADMIN
        )

        roles.forEach { (roleString, expectedRole) ->
            // Given
            reset(authApiService, preferencesManager)

            val userDto = UserDto(
                id = "user_123",
                email = "test@example.com",
                role = roleString,
                verifiedAt = "2024-01-01T00:00:00Z",
                profile = null
            )

            val authResponse = AuthResponse(
                accessToken = "access_token",
                refreshToken = "refresh_token",
                user = userDto
            )

            whenever(authApiService.login(any())).thenReturn(Response.success(authResponse))

            // When
            val result = loginUseCase("test@example.com", "SecurePass123!")

            // Then
            assertTrue(result is Resource.Success)
            assertEquals(expectedRole, result.data?.role)
        }
    }
}
