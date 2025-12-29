package za.co.taska.presentation.screens.splash

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
import za.co.taska.data.local.preferences.PreferencesManager
import za.co.taska.presentation.navigation.UserRole

/**
 * Unit tests for SplashViewModel
 * Tests authentication status checking and role-based navigation
 *
 * Coverage target: >85%
 */
@OptIn(ExperimentalCoroutinesApi::class)
class SplashViewModelTest {

    @get:Rule
    val instantTaskExecutorRule = InstantTaskExecutorRule()

    private lateinit var viewModel: SplashViewModel
    private lateinit var preferencesManager: PreferencesManager

    private val testDispatcher = StandardTestDispatcher()

    @Before
    fun setup() {
        Dispatchers.setMain(testDispatcher)
        preferencesManager = mock()
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    // ========== Authenticated User Tests ==========

    @Test
    fun `init should navigate to CLIENT home when user is authenticated as CLIENT`() = runTest {
        // Given
        whenever(preferencesManager.getAccessToken()).thenReturn("valid_access_token")
        whenever(preferencesManager.getUserId()).thenReturn("user_123")
        whenever(preferencesManager.getUserRole()).thenReturn("CLIENT")

        // When
        viewModel = SplashViewModel(preferencesManager)
        testDispatcher.scheduler.advanceTimeBy(1500) // Skip splash delay
        testDispatcher.scheduler.runCurrent()

        // Then
        assertTrue(viewModel.state.isAuthenticated)
        assertEquals(UserRole.CLIENT, viewModel.state.userRole)
        assertTrue(viewModel.state.navigationEvent is SplashNavigationEvent.NavigateToHome)
        assertEquals(
            UserRole.CLIENT,
            (viewModel.state.navigationEvent as SplashNavigationEvent.NavigateToHome).userRole
        )
    }

    @Test
    fun `init should navigate to ARTISAN home when user is authenticated as ARTISAN`() = runTest {
        // Given
        whenever(preferencesManager.getAccessToken()).thenReturn("valid_access_token")
        whenever(preferencesManager.getUserId()).thenReturn("user_456")
        whenever(preferencesManager.getUserRole()).thenReturn("ARTISAN")

        // When
        viewModel = SplashViewModel(preferencesManager)
        testDispatcher.scheduler.advanceTimeBy(1500)
        testDispatcher.scheduler.runCurrent()

        // Then
        assertTrue(viewModel.state.isAuthenticated)
        assertEquals(UserRole.ARTISAN, viewModel.state.userRole)
        assertTrue(viewModel.state.navigationEvent is SplashNavigationEvent.NavigateToHome)
        assertEquals(
            UserRole.ARTISAN,
            (viewModel.state.navigationEvent as SplashNavigationEvent.NavigateToHome).userRole
        )
    }

    @Test
    fun `init should navigate to ADMIN home when user is authenticated as ADMIN`() = runTest {
        // Given
        whenever(preferencesManager.getAccessToken()).thenReturn("valid_access_token")
        whenever(preferencesManager.getUserId()).thenReturn("admin_789")
        whenever(preferencesManager.getUserRole()).thenReturn("ADMIN")

        // When
        viewModel = SplashViewModel(preferencesManager)
        testDispatcher.scheduler.advanceTimeBy(1500)
        testDispatcher.scheduler.runCurrent()

        // Then
        assertTrue(viewModel.state.isAuthenticated)
        assertEquals(UserRole.ADMIN, viewModel.state.userRole)
        assertTrue(viewModel.state.navigationEvent is SplashNavigationEvent.NavigateToHome)
        assertEquals(
            UserRole.ADMIN,
            (viewModel.state.navigationEvent as SplashNavigationEvent.NavigateToHome).userRole
        )
    }

    // ========== Unauthenticated User Tests ==========

    @Test
    fun `init should navigate to login when token is null`() = runTest {
        // Given
        whenever(preferencesManager.getAccessToken()).thenReturn(null)
        whenever(preferencesManager.getUserId()).thenReturn("user_123")
        whenever(preferencesManager.getUserRole()).thenReturn("CLIENT")

        // When
        viewModel = SplashViewModel(preferencesManager)
        testDispatcher.scheduler.advanceTimeBy(1500)
        testDispatcher.scheduler.runCurrent()

        // Then
        assertFalse(viewModel.state.isAuthenticated)
        assertNull(viewModel.state.userRole)
        assertTrue(viewModel.state.navigationEvent is SplashNavigationEvent.NavigateToLogin)
    }

    @Test
    fun `init should navigate to login when token is empty`() = runTest {
        // Given
        whenever(preferencesManager.getAccessToken()).thenReturn("")
        whenever(preferencesManager.getUserId()).thenReturn("user_123")
        whenever(preferencesManager.getUserRole()).thenReturn("CLIENT")

        // When
        viewModel = SplashViewModel(preferencesManager)
        testDispatcher.scheduler.advanceTimeBy(1500)
        testDispatcher.scheduler.runCurrent()

        // Then
        assertFalse(viewModel.state.isAuthenticated)
        assertNull(viewModel.state.userRole)
        assertTrue(viewModel.state.navigationEvent is SplashNavigationEvent.NavigateToLogin)
    }

    @Test
    fun `init should navigate to login when token is blank`() = runTest {
        // Given
        whenever(preferencesManager.getAccessToken()).thenReturn("   ")
        whenever(preferencesManager.getUserId()).thenReturn("user_123")
        whenever(preferencesManager.getUserRole()).thenReturn("CLIENT")

        // When
        viewModel = SplashViewModel(preferencesManager)
        testDispatcher.scheduler.advanceTimeBy(1500)
        testDispatcher.scheduler.runCurrent()

        // Then
        assertFalse(viewModel.state.isAuthenticated)
        assertNull(viewModel.state.userRole)
        assertTrue(viewModel.state.navigationEvent is SplashNavigationEvent.NavigateToLogin)
    }

    @Test
    fun `init should navigate to login when userId is null`() = runTest {
        // Given
        whenever(preferencesManager.getAccessToken()).thenReturn("valid_token")
        whenever(preferencesManager.getUserId()).thenReturn(null)
        whenever(preferencesManager.getUserRole()).thenReturn("CLIENT")

        // When
        viewModel = SplashViewModel(preferencesManager)
        testDispatcher.scheduler.advanceTimeBy(1500)
        testDispatcher.scheduler.runCurrent()

        // Then
        assertFalse(viewModel.state.isAuthenticated)
        assertNull(viewModel.state.userRole)
        assertTrue(viewModel.state.navigationEvent is SplashNavigationEvent.NavigateToLogin)
    }

    @Test
    fun `init should navigate to login when userId is empty`() = runTest {
        // Given
        whenever(preferencesManager.getAccessToken()).thenReturn("valid_token")
        whenever(preferencesManager.getUserId()).thenReturn("")
        whenever(preferencesManager.getUserRole()).thenReturn("CLIENT")

        // When
        viewModel = SplashViewModel(preferencesManager)
        testDispatcher.scheduler.advanceTimeBy(1500)
        testDispatcher.scheduler.runCurrent()

        // Then
        assertFalse(viewModel.state.isAuthenticated)
        assertNull(viewModel.state.userRole)
        assertTrue(viewModel.state.navigationEvent is SplashNavigationEvent.NavigateToLogin)
    }

    @Test
    fun `init should navigate to login when both token and userId are null`() = runTest {
        // Given
        whenever(preferencesManager.getAccessToken()).thenReturn(null)
        whenever(preferencesManager.getUserId()).thenReturn(null)
        whenever(preferencesManager.getUserRole()).thenReturn(null)

        // When
        viewModel = SplashViewModel(preferencesManager)
        testDispatcher.scheduler.advanceTimeBy(1500)
        testDispatcher.scheduler.runCurrent()

        // Then
        assertFalse(viewModel.state.isAuthenticated)
        assertNull(viewModel.state.userRole)
        assertTrue(viewModel.state.navigationEvent is SplashNavigationEvent.NavigateToLogin)
    }

    // ========== Role Extraction Tests ==========

    @Test
    fun `init should handle invalid role string gracefully`() = runTest {
        // Given
        whenever(preferencesManager.getAccessToken()).thenReturn("valid_token")
        whenever(preferencesManager.getUserId()).thenReturn("user_123")
        whenever(preferencesManager.getUserRole()).thenReturn("INVALID_ROLE")

        // When
        viewModel = SplashViewModel(preferencesManager)
        testDispatcher.scheduler.advanceTimeBy(1500)
        testDispatcher.scheduler.runCurrent()

        // Then
        assertTrue(viewModel.state.isAuthenticated)
        assertNull(viewModel.state.userRole) // Role is null due to invalid string
        assertTrue(viewModel.state.navigationEvent is SplashNavigationEvent.NavigateToHome)
        assertNull((viewModel.state.navigationEvent as SplashNavigationEvent.NavigateToHome).userRole)
    }

    @Test
    fun `init should handle null role string gracefully`() = runTest {
        // Given
        whenever(preferencesManager.getAccessToken()).thenReturn("valid_token")
        whenever(preferencesManager.getUserId()).thenReturn("user_123")
        whenever(preferencesManager.getUserRole()).thenReturn(null)

        // When
        viewModel = SplashViewModel(preferencesManager)
        testDispatcher.scheduler.advanceTimeBy(1500)
        testDispatcher.scheduler.runCurrent()

        // Then
        assertTrue(viewModel.state.isAuthenticated)
        assertNull(viewModel.state.userRole)
        assertTrue(viewModel.state.navigationEvent is SplashNavigationEvent.NavigateToHome)
    }

    @Test
    fun `init should handle empty role string gracefully`() = runTest {
        // Given
        whenever(preferencesManager.getAccessToken()).thenReturn("valid_token")
        whenever(preferencesManager.getUserId()).thenReturn("user_123")
        whenever(preferencesManager.getUserRole()).thenReturn("")

        // When
        viewModel = SplashViewModel(preferencesManager)
        testDispatcher.scheduler.advanceTimeBy(1500)
        testDispatcher.scheduler.runCurrent()

        // Then
        assertTrue(viewModel.state.isAuthenticated)
        assertNull(viewModel.state.userRole)
        assertTrue(viewModel.state.navigationEvent is SplashNavigationEvent.NavigateToHome)
    }

    // ========== Timing Tests ==========

    @Test
    fun `init should delay navigation for minimum splash display time`() = runTest {
        // Given
        whenever(preferencesManager.getAccessToken()).thenReturn("valid_token")
        whenever(preferencesManager.getUserId()).thenReturn("user_123")
        whenever(preferencesManager.getUserRole()).thenReturn("CLIENT")

        // When
        viewModel = SplashViewModel(preferencesManager)

        // Then - Before delay, navigation event should be null
        assertNull(viewModel.state.navigationEvent)

        // Advance time by 1499ms (just before 1500ms)
        testDispatcher.scheduler.advanceTimeBy(1499)
        testDispatcher.scheduler.runCurrent()
        assertNull(viewModel.state.navigationEvent)

        // Advance time by 1ms more (total 1500ms)
        testDispatcher.scheduler.advanceTimeBy(1)
        testDispatcher.scheduler.runCurrent()

        // Then - After delay, navigation event should be set
        assertNotNull(viewModel.state.navigationEvent)
    }

    @Test
    fun `init should wait exactly 1500ms before navigation`() = runTest {
        // Given
        whenever(preferencesManager.getAccessToken()).thenReturn("valid_token")
        whenever(preferencesManager.getUserId()).thenReturn("user_123")
        whenever(preferencesManager.getUserRole()).thenReturn("ARTISAN")

        val startTime = testDispatcher.scheduler.currentTime

        // When
        viewModel = SplashViewModel(preferencesManager)
        testDispatcher.scheduler.advanceTimeBy(1500)
        testDispatcher.scheduler.runCurrent()

        val endTime = testDispatcher.scheduler.currentTime

        // Then
        assertEquals(1500, endTime - startTime)
        assertNotNull(viewModel.state.navigationEvent)
    }

    // ========== Initial State Tests ==========

    @Test
    fun `initial state should have no authentication and no navigation event`() = runTest {
        // Given
        whenever(preferencesManager.getAccessToken()).thenReturn("valid_token")
        whenever(preferencesManager.getUserId()).thenReturn("user_123")
        whenever(preferencesManager.getUserRole()).thenReturn("CLIENT")

        // When
        viewModel = SplashViewModel(preferencesManager)

        // Then - Before any processing
        assertFalse(viewModel.state.isAuthenticated)
        assertNull(viewModel.state.userRole)
        assertNull(viewModel.state.navigationEvent)
    }

    // ========== PreferencesManager Interaction Tests ==========

    @Test
    fun `init should call all required preferences manager methods`() = runTest {
        // Given
        whenever(preferencesManager.getAccessToken()).thenReturn("valid_token")
        whenever(preferencesManager.getUserId()).thenReturn("user_123")
        whenever(preferencesManager.getUserRole()).thenReturn("CLIENT")

        // When
        viewModel = SplashViewModel(preferencesManager)
        testDispatcher.scheduler.advanceTimeBy(1500)
        testDispatcher.scheduler.runCurrent()

        // Then
        verify(preferencesManager).getAccessToken()
        verify(preferencesManager).getUserId()
        verify(preferencesManager).getUserRole()
    }

    @Test
    fun `init should not make additional preferences calls after navigation decision`() = runTest {
        // Given
        whenever(preferencesManager.getAccessToken()).thenReturn("valid_token")
        whenever(preferencesManager.getUserId()).thenReturn("user_123")
        whenever(preferencesManager.getUserRole()).thenReturn("CLIENT")

        // When
        viewModel = SplashViewModel(preferencesManager)
        testDispatcher.scheduler.advanceTimeBy(1500)
        testDispatcher.scheduler.runCurrent()

        // Clear invocations
        clearInvocations(preferencesManager)

        // Advance more time
        testDispatcher.scheduler.advanceTimeBy(5000)
        testDispatcher.scheduler.runCurrent()

        // Then - No additional calls
        verify(preferencesManager, never()).getAccessToken()
        verify(preferencesManager, never()).getUserId()
        verify(preferencesManager, never()).getUserRole()
    }

    // ========== Edge Cases ==========

    @Test
    fun `init should handle case-sensitive role strings`() = runTest {
        // Given - lowercase role string
        whenever(preferencesManager.getAccessToken()).thenReturn("valid_token")
        whenever(preferencesManager.getUserId()).thenReturn("user_123")
        whenever(preferencesManager.getUserRole()).thenReturn("client")

        // When
        viewModel = SplashViewModel(preferencesManager)
        testDispatcher.scheduler.advanceTimeBy(1500)
        testDispatcher.scheduler.runCurrent()

        // Then - Should fail to parse and set role to null
        assertTrue(viewModel.state.isAuthenticated)
        assertNull(viewModel.state.userRole)
    }

    @Test
    fun `init should navigate to home even if role parsing fails`() = runTest {
        // Given - Invalid role but valid token and userId
        whenever(preferencesManager.getAccessToken()).thenReturn("valid_token")
        whenever(preferencesManager.getUserId()).thenReturn("user_123")
        whenever(preferencesManager.getUserRole()).thenReturn("UNKNOWN_ROLE")

        // When
        viewModel = SplashViewModel(preferencesManager)
        testDispatcher.scheduler.advanceTimeBy(1500)
        testDispatcher.scheduler.runCurrent()

        // Then - Should still navigate to home with null role
        assertTrue(viewModel.state.isAuthenticated)
        assertNull(viewModel.state.userRole)
        assertTrue(viewModel.state.navigationEvent is SplashNavigationEvent.NavigateToHome)
    }

    @Test
    fun `navigation event should contain correct role for each user type`() = runTest {
        val userTypes = mapOf(
            "CLIENT" to UserRole.CLIENT,
            "ARTISAN" to UserRole.ARTISAN,
            "ADMIN" to UserRole.ADMIN
        )

        userTypes.forEach { (roleString, expectedRole) ->
            // Given
            reset(preferencesManager)
            whenever(preferencesManager.getAccessToken()).thenReturn("valid_token")
            whenever(preferencesManager.getUserId()).thenReturn("user_123")
            whenever(preferencesManager.getUserRole()).thenReturn(roleString)

            // When
            viewModel = SplashViewModel(preferencesManager)
            testDispatcher.scheduler.advanceTimeBy(1500)
            testDispatcher.scheduler.runCurrent()

            // Then
            val navigationEvent = viewModel.state.navigationEvent
            assertTrue(navigationEvent is SplashNavigationEvent.NavigateToHome)
            assertEquals(
                expectedRole,
                (navigationEvent as SplashNavigationEvent.NavigateToHome).userRole
            )
        }
    }
}
