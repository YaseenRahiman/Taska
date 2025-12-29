package za.co.taska.domain.usecase.notification

import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.mockito.kotlin.*
import za.co.taska.domain.model.NotificationPreferences
import za.co.taska.domain.repository.NotificationsRepository

/**
 * Unit tests for UpdateNotificationPreferencesUseCase
 * Coverage target: >85%
 */
class UpdateNotificationPreferencesUseCaseTest {

    private lateinit var useCase: UpdateNotificationPreferencesUseCase
    private lateinit var repository: NotificationsRepository

    @Before
    fun setup() {
        repository = mock()
        useCase = UpdateNotificationPreferencesUseCase(repository)
    }

    // ========== Success Cases ==========

    @Test
    fun `invoke should return success when updating single preference`() = runTest {
        // Given
        val preferences = createTestPreferences()
        whenever(repository.updateNotificationPreferences(
            enableBidNotifications = true,
            enableMessageNotifications = null,
            enablePaymentNotifications = null,
            enableReviewNotifications = null,
            enableSystemNotifications = null
        )).thenReturn(Result.success(preferences))

        // When
        val result = useCase(enableBidNotifications = true)

        // Then
        assertTrue(result.isSuccess)
        assertEquals(preferences, result.getOrNull())
    }

    @Test
    fun `invoke should return success when updating all preferences`() = runTest {
        // Given
        val preferences = createTestPreferences(
            enableBidNotifications = true,
            enableMessageNotifications = true,
            enablePaymentNotifications = true,
            enableReviewNotifications = true,
            enableSystemNotifications = true
        )
        whenever(repository.updateNotificationPreferences(
            enableBidNotifications = true,
            enableMessageNotifications = true,
            enablePaymentNotifications = true,
            enableReviewNotifications = true,
            enableSystemNotifications = true
        )).thenReturn(Result.success(preferences))

        // When
        val result = useCase(
            enableBidNotifications = true,
            enableMessageNotifications = true,
            enablePaymentNotifications = true,
            enableReviewNotifications = true,
            enableSystemNotifications = true
        )

        // Then
        assertTrue(result.isSuccess)
        assertTrue(result.getOrNull()?.allEnabled == true)
    }

    @Test
    fun `getPreferences should return current preferences`() = runTest {
        // Given
        val preferences = createTestPreferences()
        whenever(repository.getNotificationPreferences())
            .thenReturn(Result.success(preferences))

        // When
        val result = useCase.getPreferences()

        // Then
        assertTrue(result.isSuccess)
        assertEquals(preferences, result.getOrNull())
        verify(repository).getNotificationPreferences()
    }

    @Test
    fun `enableAll should enable all notification types`() = runTest {
        // Given
        val preferences = createTestPreferences(
            enableBidNotifications = true,
            enableMessageNotifications = true,
            enablePaymentNotifications = true,
            enableReviewNotifications = true,
            enableSystemNotifications = true
        )
        whenever(repository.updateNotificationPreferences(
            enableBidNotifications = true,
            enableMessageNotifications = true,
            enablePaymentNotifications = true,
            enableReviewNotifications = true,
            enableSystemNotifications = true
        )).thenReturn(Result.success(preferences))

        // When
        val result = useCase.enableAll()

        // Then
        assertTrue(result.isSuccess)
        val prefs = result.getOrNull()!!
        assertTrue(prefs.enableBidNotifications)
        assertTrue(prefs.enableMessageNotifications)
        assertTrue(prefs.enablePaymentNotifications)
        assertTrue(prefs.enableReviewNotifications)
        assertTrue(prefs.enableSystemNotifications)
    }

    @Test
    fun `disableAll should disable all notification types`() = runTest {
        // Given
        val preferences = createTestPreferences(
            enableBidNotifications = false,
            enableMessageNotifications = false,
            enablePaymentNotifications = false,
            enableReviewNotifications = false,
            enableSystemNotifications = false
        )
        whenever(repository.updateNotificationPreferences(
            enableBidNotifications = false,
            enableMessageNotifications = false,
            enablePaymentNotifications = false,
            enableReviewNotifications = false,
            enableSystemNotifications = false
        )).thenReturn(Result.success(preferences))

        // When
        val result = useCase.disableAll()

        // Then
        assertTrue(result.isSuccess)
        val prefs = result.getOrNull()!!
        assertFalse(prefs.enableBidNotifications)
        assertFalse(prefs.enableMessageNotifications)
        assertFalse(prefs.enablePaymentNotifications)
        assertFalse(prefs.enableReviewNotifications)
        assertFalse(prefs.enableSystemNotifications)
    }

    // ========== Validation Cases ==========

    @Test
    fun `invoke should fail when all preferences are null`() = runTest {
        // When
        val result = useCase(
            enableBidNotifications = null,
            enableMessageNotifications = null,
            enablePaymentNotifications = null,
            enableReviewNotifications = null,
            enableSystemNotifications = null
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("At least one notification preference must be specified", result.exceptionOrNull()?.message)
        verifyNoInteractions(repository)
    }

    // ========== Error Cases ==========

    @Test
    fun `invoke should return failure when repository fails`() = runTest {
        // Given
        val error = Exception("Network error")
        whenever(repository.updateNotificationPreferences(
            enableBidNotifications = true,
            enableMessageNotifications = null,
            enablePaymentNotifications = null,
            enableReviewNotifications = null,
            enableSystemNotifications = null
        )).thenReturn(Result.failure(error))

        // When
        val result = useCase(enableBidNotifications = true)

        // Then
        assertTrue(result.isFailure)
        assertEquals("Network error", result.exceptionOrNull()?.message)
    }

    @Test
    fun `getPreferences should return failure when repository fails`() = runTest {
        // Given
        val error = Exception("Database error")
        whenever(repository.getNotificationPreferences())
            .thenReturn(Result.failure(error))

        // When
        val result = useCase.getPreferences()

        // Then
        assertTrue(result.isFailure)
        assertEquals("Database error", result.exceptionOrNull()?.message)
    }

    // ========== Helper Methods ==========

    private fun createTestPreferences(
        enableBidNotifications: Boolean = true,
        enableMessageNotifications: Boolean = true,
        enablePaymentNotifications: Boolean = true,
        enableReviewNotifications: Boolean = true,
        enableSystemNotifications: Boolean = true
    ) = NotificationPreferences(
        userId = "user_123",
        enableBidNotifications = enableBidNotifications,
        enableMessageNotifications = enableMessageNotifications,
        enablePaymentNotifications = enablePaymentNotifications,
        enableReviewNotifications = enableReviewNotifications,
        enableSystemNotifications = enableSystemNotifications,
        updatedAt = "2024-01-01T10:00:00Z"
    )
}
