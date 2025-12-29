package za.co.taska.domain.usecase.notification

import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.mockito.kotlin.*
import za.co.taska.domain.repository.NotificationsRepository

/**
 * Unit tests for MarkNotificationAsReadUseCase
 * Coverage target: >85%
 */
class MarkNotificationAsReadUseCaseTest {

    private lateinit var useCase: MarkNotificationAsReadUseCase
    private lateinit var repository: NotificationsRepository

    @Before
    fun setup() {
        repository = mock()
        useCase = MarkNotificationAsReadUseCase(repository)
    }

    // ========== markSingleAsRead tests ==========

    @Test
    fun `markSingleAsRead should return success when repository succeeds`() = runTest {
        // Given
        val notificationId = "notif_123"
        whenever(repository.markNotificationAsRead(notificationId))
            .thenReturn(Result.success(Unit))

        // When
        val result = useCase.markSingleAsRead(notificationId)

        // Then
        assertTrue(result.isSuccess)
        verify(repository).markNotificationAsRead(notificationId)
    }

    @Test
    fun `markSingleAsRead should fail when notificationId is blank`() = runTest {
        // When
        val result = useCase.markSingleAsRead("")

        // Then
        assertTrue(result.isFailure)
        assertEquals("Notification ID cannot be empty", result.exceptionOrNull()?.message)
        verifyNoInteractions(repository)
    }

    @Test
    fun `markSingleAsRead should trim whitespace`() = runTest {
        // Given
        whenever(repository.markNotificationAsRead(any()))
            .thenReturn(Result.success(Unit))

        // When
        val result = useCase.markSingleAsRead("  notif_123  ")

        // Then
        assertTrue(result.isSuccess)
        verify(repository).markNotificationAsRead("notif_123")
    }

    // ========== markMultipleAsRead tests ==========

    @Test
    fun `markMultipleAsRead should return success when repository succeeds`() = runTest {
        // Given
        val notificationIds = listOf("notif_1", "notif_2", "notif_3")
        whenever(repository.markMultipleNotificationsAsRead(notificationIds))
            .thenReturn(Result.success(Unit))

        // When
        val result = useCase.markMultipleAsRead(notificationIds)

        // Then
        assertTrue(result.isSuccess)
        verify(repository).markMultipleNotificationsAsRead(notificationIds)
    }

    @Test
    fun `markMultipleAsRead should fail when list is empty`() = runTest {
        // When
        val result = useCase.markMultipleAsRead(emptyList())

        // Then
        assertTrue(result.isFailure)
        assertEquals("Notification IDs list cannot be empty", result.exceptionOrNull()?.message)
        verifyNoInteractions(repository)
    }

    @Test
    fun `markMultipleAsRead should fail when list contains blank IDs`() = runTest {
        // When
        val result = useCase.markMultipleAsRead(listOf("notif_1", "", "notif_3"))

        // Then
        assertTrue(result.isFailure)
        assertEquals("Notification IDs cannot contain blank values", result.exceptionOrNull()?.message)
        verifyNoInteractions(repository)
    }

    @Test
    fun `markMultipleAsRead should fail when list exceeds 100 items`() = runTest {
        // Given
        val notificationIds = (1..101).map { "notif_$it" }

        // When
        val result = useCase.markMultipleAsRead(notificationIds)

        // Then
        assertTrue(result.isFailure)
        assertEquals("Cannot mark more than 100 notifications at once", result.exceptionOrNull()?.message)
        verifyNoInteractions(repository)
    }

    @Test
    fun `markMultipleAsRead should succeed with exactly 100 items`() = runTest {
        // Given
        val notificationIds = (1..100).map { "notif_$it" }
        whenever(repository.markMultipleNotificationsAsRead(notificationIds))
            .thenReturn(Result.success(Unit))

        // When
        val result = useCase.markMultipleAsRead(notificationIds)

        // Then
        assertTrue(result.isSuccess)
        verify(repository).markMultipleNotificationsAsRead(notificationIds)
    }

    // ========== markAllAsRead tests ==========

    @Test
    fun `markAllAsRead should return success when repository succeeds`() = runTest {
        // Given
        whenever(repository.markAllNotificationsAsRead())
            .thenReturn(Result.success(Unit))

        // When
        val result = useCase.markAllAsRead()

        // Then
        assertTrue(result.isSuccess)
        verify(repository).markAllNotificationsAsRead()
    }

    @Test
    fun `markAllAsRead should return failure when repository fails`() = runTest {
        // Given
        val exception = Exception("Server error")
        whenever(repository.markAllNotificationsAsRead())
            .thenReturn(Result.failure(exception))

        // When
        val result = useCase.markAllAsRead()

        // Then
        assertTrue(result.isFailure)
        assertEquals("Server error", result.exceptionOrNull()?.message)
    }

    // ========== Edge Cases ==========

    @Test
    fun `markMultipleAsRead should filter and trim whitespace`() = runTest {
        // Given
        val input = listOf("  notif_1  ", "notif_2", "  notif_3")
        val expected = listOf("notif_1", "notif_2", "notif_3")
        whenever(repository.markMultipleNotificationsAsRead(expected))
            .thenReturn(Result.success(Unit))

        // When
        val result = useCase.markMultipleAsRead(input)

        // Then
        assertTrue(result.isSuccess)
        verify(repository).markMultipleNotificationsAsRead(expected)
    }
}
