package za.co.taska.domain.usecase.notification

import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.mockito.kotlin.*
import za.co.taska.domain.repository.NotificationsRepository

/**
 * Unit tests for ClearAllNotificationsUseCase
 * Coverage target: >85%
 */
class ClearAllNotificationsUseCaseTest {

    private lateinit var useCase: ClearAllNotificationsUseCase
    private lateinit var repository: NotificationsRepository

    @Before
    fun setup() {
        repository = mock()
        useCase = ClearAllNotificationsUseCase(repository)
    }

    // ========== clearReadNotifications tests ==========

    @Test
    fun `clearReadNotifications should return success when repository succeeds`() = runTest {
        // Given
        whenever(repository.clearReadNotifications())
            .thenReturn(Result.success(Unit))

        // When
        val result = useCase.clearReadNotifications()

        // Then
        assertTrue(result.isSuccess)
        verify(repository).clearReadNotifications()
    }

    @Test
    fun `clearReadNotifications should return failure when repository fails`() = runTest {
        // Given
        val exception = Exception("Clear failed")
        whenever(repository.clearReadNotifications())
            .thenReturn(Result.failure(exception))

        // When
        val result = useCase.clearReadNotifications()

        // Then
        assertTrue(result.isFailure)
        assertEquals("Clear failed", result.exceptionOrNull()?.message)
    }

    // ========== deleteNotification tests ==========

    @Test
    fun `deleteNotification should return success when repository succeeds`() = runTest {
        // Given
        val notificationId = "notif_123"
        whenever(repository.deleteNotification(notificationId))
            .thenReturn(Result.success(Unit))

        // When
        val result = useCase.deleteNotification(notificationId)

        // Then
        assertTrue(result.isSuccess)
        verify(repository).deleteNotification(notificationId)
    }

    @Test
    fun `deleteNotification should fail when id is blank`() = runTest {
        // When
        val result = useCase.deleteNotification("")

        // Then
        assertTrue(result.isFailure)
        assertEquals("Notification ID cannot be empty", result.exceptionOrNull()?.message)
        verifyNoInteractions(repository)
    }

    @Test
    fun `deleteNotification should fail when id is whitespace`() = runTest {
        // When
        val result = useCase.deleteNotification("   ")

        // Then
        assertTrue(result.isFailure)
        assertEquals("Notification ID cannot be empty", result.exceptionOrNull()?.message)
        verifyNoInteractions(repository)
    }

    @Test
    fun `deleteNotification should trim whitespace`() = runTest {
        // Given
        whenever(repository.deleteNotification(any()))
            .thenReturn(Result.success(Unit))

        // When
        val result = useCase.deleteNotification("  notif_123  ")

        // Then
        assertTrue(result.isSuccess)
        verify(repository).deleteNotification("notif_123")
    }

    // ========== getUnreadCount tests ==========

    @Test
    fun `getUnreadCount should return success with count`() = runTest {
        // Given
        val unreadCount = 5
        whenever(repository.getUnreadCount())
            .thenReturn(Result.success(unreadCount))

        // When
        val result = useCase.getUnreadCount()

        // Then
        assertTrue(result.isSuccess)
        assertEquals(5, result.getOrNull())
        verify(repository).getUnreadCount()
    }

    @Test
    fun `getUnreadCount should return failure when repository fails`() = runTest {
        // Given
        val exception = Exception("Count failed")
        whenever(repository.getUnreadCount())
            .thenReturn(Result.failure(exception))

        // When
        val result = useCase.getUnreadCount()

        // Then
        assertTrue(result.isFailure)
        assertEquals("Count failed", result.exceptionOrNull()?.message)
    }
}
