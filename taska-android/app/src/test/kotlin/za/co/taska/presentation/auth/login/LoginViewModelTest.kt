package za.co.taska.presentation.auth.login

import androidx.arch.core.executor.testing.InstantTaskExecutorRule
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.*
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.mockito.kotlin.*
import za.co.taska.domain.model.Resource
import za.co.taska.domain.model.User
import za.co.taska.domain.model.UserRole
import za.co.taska.domain.usecase.auth.LoginUseCase

/**
 * Unit tests for LoginViewModel
 * Tests email/password validation and login flow with role extraction
 *
 * Coverage target: >85%
 */
@OptIn(ExperimentalCoroutinesApi::class)
class LoginViewModelTest {

    @get:Rule
    val instantTaskExecutorRule = InstantTaskExecutorRule()

    private lateinit var viewModel: LoginViewModel
    private lateinit var loginUseCase: LoginUseCase

    private val testDispatcher = StandardTestDispatcher()

    @Before
    fun setup() {
        Dispatchers.setMain(testDispatcher)
        loginUseCase = mock()
        viewModel = LoginViewModel(loginUseCase)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    // ========== Input Field Tests ==========

    @Test
    fun `onEmailChanged should update email state`() {
        // When
        viewModel.onEmailChanged("test@example.com")

        // Then
        assertEquals("test@example.com", viewModel.state.email)
        assertNull(viewModel.state.emailError)
    }

    @Test
    fun `onEmailChanged should clear email error`() {
        // Given - Trigger error first
        viewModel.onLoginClick()
        assertNotNull(viewModel.state.emailError)

        // When
        viewModel.onEmailChanged("test@example.com")

        // Then
        assertNull(viewModel.state.emailError)
    }

    @Test
    fun `onPasswordChanged should update password state`() {
        // When
        viewModel.onPasswordChanged("SecurePass123!")

        // Then
        assertEquals("SecurePass123!", viewModel.state.password)
        assertNull(viewModel.state.passwordError)
    }

    @Test
    fun `onPasswordChanged should clear password error`() {
        // Given
        viewModel.onLoginClick()
        assertNotNull(viewModel.state.passwordError)

        // When
        viewModel.onPasswordChanged("SecurePass123!")

        // Then
        assertNull(viewModel.state.passwordError)
    }

    @Test
    fun `onPasswordChanged should clear general error`() {
        // Given - Simulate login failure
        viewModel.onEmailChanged("test@example.com")
        viewModel.onPasswordChanged("wrong")
        whenever(loginUseCase(any(), any()))
            .thenReturn(Resource.error("Invalid credentials"))
        viewModel.onLoginClick()
        testDispatcher.scheduler.advanceUntilIdle()
        assertNotNull(viewModel.state.error)

        // When
        viewModel.onPasswordChanged("NewPassword123!")

        // Then
        assertNull(viewModel.state.error)
    }

    // ========== Validation Tests ==========

    @Test
    fun `onLoginClick should show error when email is empty`() {
        // Given
        viewModel.onPasswordChanged("SecurePass123!")

        // When
        viewModel.onLoginClick()

        // Then
        assertEquals("Email cannot be empty", viewModel.state.emailError)
        assertFalse(viewModel.state.isLoading)
    }

    @Test
    fun `onLoginClick should show error when email is invalid`() {
        // Given
        viewModel.onEmailChanged("invalid-email")
        viewModel.onPasswordChanged("SecurePass123!")

        // When
        viewModel.onLoginClick()

        // Then
        assertEquals("Invalid email format", viewModel.state.emailError)
        assertFalse(viewModel.state.isLoading)
    }

    @Test
    fun `onLoginClick should show error when password is empty`() {
        // Given
        viewModel.onEmailChanged("test@example.com")

        // When
        viewModel.onLoginClick()

        // Then
        assertEquals("Password cannot be empty", viewModel.state.passwordError)
        assertFalse(viewModel.state.isLoading)
    }

    @Test
    fun `onLoginClick should not call use case when validation fails`() = runTest {
        // Given - Invalid email
        viewModel.onEmailChanged("invalid")
        viewModel.onPasswordChanged("SecurePass123!")

        // When
        viewModel.onLoginClick()
        testDispatcher.scheduler.advanceUntilIdle()

        // Then
        verify(loginUseCase, never()).invoke(any(), any())
    }

    // ========== Valid Email Format Tests ==========

    @Test
    fun `onLoginClick should accept valid email formats`() {
        val validEmails = listOf(
            "test@example.com",
            "user.name@example.co.za",
            "first+last@domain.com",
            "user_123@test-domain.org"
        )

        validEmails.forEach { email ->
            // Given
            viewModel.onEmailChanged(email)
            viewModel.onPasswordChanged("SecurePass123!")
            whenever(loginUseCase(any(), any()))
                .thenReturn(Resource.success(createTestUser()))

            // When
            viewModel.onLoginClick()
            testDispatcher.scheduler.advanceUntilIdle()

            // Then
            assertNull(viewModel.state.emailError)
            verify(loginUseCase).invoke(email, "SecurePass123!")

            // Reset for next iteration
            clearInvocations(loginUseCase)
            viewModel.onEmailChanged("")
        }
    }

    @Test
    fun `onLoginClick should reject invalid email formats`() {
        val invalidEmails = listOf(
            "notanemail",
            "@example.com",
            "user@",
            "user name@example.com",
            "user@domain",
            ""
        )

        invalidEmails.forEach { email ->
            // Given
            viewModel.onEmailChanged(email)
            viewModel.onPasswordChanged("SecurePass123!")

            // When
            viewModel.onLoginClick()

            // Then
            assertNotNull(viewModel.state.emailError)

            // Reset
            viewModel.onEmailChanged("")
        }
    }

    // ========== Login Flow Tests ==========

    @Test
    fun `onLoginClick should set loading state during login`() = runTest {
        // Given
        viewModel.onEmailChanged("test@example.com")
        viewModel.onPasswordChanged("SecurePass123!")
        whenever(loginUseCase(any(), any()))
            .thenReturn(Resource.loading())

        // When
        viewModel.onLoginClick()

        // Then
        assertTrue(viewModel.state.isLoading)
    }

    @Test
    fun `onLoginClick should call use case with correct parameters`() = runTest {
        // Given
        viewModel.onEmailChanged("test@example.com")
        viewModel.onPasswordChanged("SecurePass123!")
        whenever(loginUseCase(any(), any()))
            .thenReturn(Resource.success(createTestUser()))

        // When
        viewModel.onLoginClick()
        testDispatcher.scheduler.advanceUntilIdle()

        // Then
        verify(loginUseCase).invoke(
            email = "test@example.com",
            password = "SecurePass123!"
        )
    }

    @Test
    fun `successful login should set success state and extract role`() = runTest {
        // Given
        viewModel.onEmailChanged("test@example.com")
        viewModel.onPasswordChanged("SecurePass123!")
        val testUser = createTestUser(role = UserRole.CLIENT)
        whenever(loginUseCase(any(), any()))
            .thenReturn(Resource.success(testUser))

        // When
        viewModel.onLoginClick()
        testDispatcher.scheduler.advanceUntilIdle()

        // Then
        assertFalse(viewModel.state.isLoading)
        assertTrue(viewModel.state.loginSuccess)
        assertEquals(UserRole.CLIENT, viewModel.state.userRole)
        assertNull(viewModel.state.error)
    }

    @Test
    fun `failed login should set error state`() = runTest {
        // Given
        viewModel.onEmailChanged("test@example.com")
        viewModel.onPasswordChanged("WrongPassword123!")
        whenever(loginUseCase(any(), any()))
            .thenReturn(Resource.error("Invalid email or password"))

        // When
        viewModel.onLoginClick()
        testDispatcher.scheduler.advanceUntilIdle()

        // Then
        assertFalse(viewModel.state.isLoading)
        assertFalse(viewModel.state.loginSuccess)
        assertEquals("Invalid email or password", viewModel.state.error)
        assertNull(viewModel.state.userRole)
    }

    // ========== Role Extraction Tests ==========

    @Test
    fun `successful login should extract CLIENT role`() = runTest {
        // Given
        viewModel.onEmailChanged("client@example.com")
        viewModel.onPasswordChanged("SecurePass123!")
        val clientUser = createTestUser(role = UserRole.CLIENT)
        whenever(loginUseCase(any(), any()))
            .thenReturn(Resource.success(clientUser))

        // When
        viewModel.onLoginClick()
        testDispatcher.scheduler.advanceUntilIdle()

        // Then
        assertEquals(UserRole.CLIENT, viewModel.state.userRole)
    }

    @Test
    fun `successful login should extract ARTISAN role`() = runTest {
        // Given
        viewModel.onEmailChanged("artisan@example.com")
        viewModel.onPasswordChanged("SecurePass123!")
        val artisanUser = createTestUser(role = UserRole.ARTISAN)
        whenever(loginUseCase(any(), any()))
            .thenReturn(Resource.success(artisanUser))

        // When
        viewModel.onLoginClick()
        testDispatcher.scheduler.advanceUntilIdle()

        // Then
        assertEquals(UserRole.ARTISAN, viewModel.state.userRole)
    }

    @Test
    fun `successful login should extract ADMIN role`() = runTest {
        // Given
        viewModel.onEmailChanged("admin@example.com")
        viewModel.onPasswordChanged("SecurePass123!")
        val adminUser = createTestUser(role = UserRole.ADMIN)
        whenever(loginUseCase(any(), any()))
            .thenReturn(Resource.success(adminUser))

        // When
        viewModel.onLoginClick()
        testDispatcher.scheduler.advanceUntilIdle()

        // Then
        assertEquals(UserRole.ADMIN, viewModel.state.userRole)
    }

    @Test
    fun `successful login should handle null user gracefully`() = runTest {
        // Given
        viewModel.onEmailChanged("test@example.com")
        viewModel.onPasswordChanged("SecurePass123!")
        whenever(loginUseCase(any(), any()))
            .thenReturn(Resource.success(null))

        // When
        viewModel.onLoginClick()
        testDispatcher.scheduler.advanceUntilIdle()

        // Then
        assertFalse(viewModel.state.isLoading)
        assertTrue(viewModel.state.loginSuccess)
        assertNull(viewModel.state.userRole)
    }

    // ========== Error Handling Tests ==========

    @Test
    fun `login should handle network errors`() = runTest {
        // Given
        viewModel.onEmailChanged("test@example.com")
        viewModel.onPasswordChanged("SecurePass123!")
        whenever(loginUseCase(any(), any()))
            .thenReturn(Resource.error("Network error"))

        // When
        viewModel.onLoginClick()
        testDispatcher.scheduler.advanceUntilIdle()

        // Then
        assertEquals("Network error", viewModel.state.error)
        assertFalse(viewModel.state.loginSuccess)
    }

    @Test
    fun `login should handle server errors`() = runTest {
        // Given
        viewModel.onEmailChanged("test@example.com")
        viewModel.onPasswordChanged("SecurePass123!")
        whenever(loginUseCase(any(), any()))
            .thenReturn(Resource.error("Server error: 500"))

        // When
        viewModel.onLoginClick()
        testDispatcher.scheduler.advanceUntilIdle()

        // Then
        assertEquals("Server error: 500", viewModel.state.error)
        assertFalse(viewModel.state.loginSuccess)
    }

    @Test
    fun `login should handle invalid credentials error`() = runTest {
        // Given
        viewModel.onEmailChanged("test@example.com")
        viewModel.onPasswordChanged("WrongPassword")
        whenever(loginUseCase(any(), any()))
            .thenReturn(Resource.error("Invalid email or password"))

        // When
        viewModel.onLoginClick()
        testDispatcher.scheduler.advanceUntilIdle()

        // Then
        assertEquals("Invalid email or password", viewModel.state.error)
    }

    @Test
    fun `login should handle account not verified error`() = runTest {
        // Given
        viewModel.onEmailChanged("test@example.com")
        viewModel.onPasswordChanged("SecurePass123!")
        whenever(loginUseCase(any(), any()))
            .thenReturn(Resource.error("Please verify your email address"))

        // When
        viewModel.onLoginClick()
        testDispatcher.scheduler.advanceUntilIdle()

        // Then
        assertEquals("Please verify your email address", viewModel.state.error)
    }

    // ========== State Preservation Tests ==========

    @Test
    fun `state should preserve email after failed login`() = runTest {
        // Given
        val email = "test@example.com"
        viewModel.onEmailChanged(email)
        viewModel.onPasswordChanged("WrongPassword")
        whenever(loginUseCase(any(), any()))
            .thenReturn(Resource.error("Invalid credentials"))

        // When
        viewModel.onLoginClick()
        testDispatcher.scheduler.advanceUntilIdle()

        // Then
        assertEquals(email, viewModel.state.email)
    }

    @Test
    fun `state should clear password after failed login`() = runTest {
        // Given
        viewModel.onEmailChanged("test@example.com")
        viewModel.onPasswordChanged("WrongPassword")
        whenever(loginUseCase(any(), any()))
            .thenReturn(Resource.error("Invalid credentials"))

        // When
        viewModel.onLoginClick()
        testDispatcher.scheduler.advanceUntilIdle()

        // Then - Password should remain (for retry)
        assertEquals("WrongPassword", viewModel.state.password)
    }

    // ========== Edge Cases ==========

    @Test
    fun `onLoginClick should trim whitespace from email`() = runTest {
        // Given
        viewModel.onEmailChanged("  test@example.com  ")
        viewModel.onPasswordChanged("SecurePass123!")
        whenever(loginUseCase(any(), any()))
            .thenReturn(Resource.success(createTestUser()))

        // When
        viewModel.onLoginClick()
        testDispatcher.scheduler.advanceUntilIdle()

        // Then
        verify(loginUseCase).invoke(
            email = "test@example.com", // Trimmed
            password = "SecurePass123!"
        )
    }

    @Test
    fun `multiple login attempts should work correctly`() = runTest {
        // First attempt - fails
        viewModel.onEmailChanged("test@example.com")
        viewModel.onPasswordChanged("WrongPassword")
        whenever(loginUseCase(any(), any()))
            .thenReturn(Resource.error("Invalid credentials"))
        viewModel.onLoginClick()
        testDispatcher.scheduler.advanceUntilIdle()

        assertFalse(viewModel.state.loginSuccess)
        assertNotNull(viewModel.state.error)

        // Second attempt - succeeds
        viewModel.onPasswordChanged("CorrectPassword123!")
        whenever(loginUseCase(any(), any()))
            .thenReturn(Resource.success(createTestUser()))
        viewModel.onLoginClick()
        testDispatcher.scheduler.advanceUntilIdle()

        // Then
        assertTrue(viewModel.state.loginSuccess)
        assertNull(viewModel.state.error)
    }

    @Test
    fun `initial state should have empty fields and no errors`() {
        // Then
        assertEquals("", viewModel.state.email)
        assertEquals("", viewModel.state.password)
        assertNull(viewModel.state.emailError)
        assertNull(viewModel.state.passwordError)
        assertNull(viewModel.state.error)
        assertFalse(viewModel.state.isLoading)
        assertFalse(viewModel.state.loginSuccess)
        assertNull(viewModel.state.userRole)
    }

    // ========== Helper Methods ==========

    private fun createTestUser(role: UserRole = UserRole.CLIENT) = User(
        id = "user_123",
        email = "test@example.com",
        role = role,
        verifiedAt = "2024-01-01T00:00:00Z",
        profile = null
    )
}
