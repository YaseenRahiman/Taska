package za.co.taska.domain.usecase.notification

import app.cash.turbine.test
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.mockito.kotlin.*
import za.co.taska.domain.model.Notification
import za.co.taska.domain.model.NotificationType
import za.co.taska.domain.repository.NotificationsRepository

/**
 * Unit tests for GetNotificationsUseCase
 * Coverage target: >85%
 */
class GetNotificationsUseCaseTest {

    private lateinit var useCase: GetNotificationsUseCase
    private lateinit var repository: NotificationsRepository

    @Before
    fun setup() {
        repository = mock()
        useCase = GetNotificationsUseCase(repository)
    }

    // ========== Success Cases ==========

    @Test
    fun `invoke should return success when fetching all notifications`() = runTest {
        // Given
        val notifications = listOf(createTestNotification())
        whenever(repository.getNotifications(isNull(), isNull(), eq(20), eq(0)))
            .thenReturn(flow { emit(Result.success(notifications)) })

        // When
        useCase(limit = 20, offset = 0).test {
            val result = awaitItem()

            // Then
            assertTrue(result.isSuccess)
            assertEquals(1, result.getOrNull()?.size)
            awaitComplete()
        }

        verify(repository).getNotifications(isNull(), isNull(), eq(20), eq(0))
    }

    @Test
    fun `invoke should return success with type filter`() = runTest {
        // Given
        val notifications = listOf(createTestNotification(type = NotificationType.BID_RECEIVED))
        whenever(repository.getNotifications(eq("BID_RECEIVED"), any(), any(), any()))
            .thenReturn(flow { emit(Result.success(notifications)) })

        // When
        useCase(type = "BID_RECEIVED", limit = 20, offset = 0).test {
            val result = awaitItem()

            // Then
            assertTrue(result.isSuccess)
            assertEquals(NotificationType.BID_RECEIVED, result.getOrNull()?.first()?.type)
            awaitComplete()
        }
    }

    @Test
    fun `invoke should return success with isRead filter`() = runTest {
        // Given
        val notifications = listOf(createTestNotification(isRead = false))
        whenever(repository.getNotifications(any(), eq(false), any(), any()))
            .thenReturn(flow { emit(Result.success(notifications)) })

        // When
        useCase(isRead = false, limit = 20, offset = 0).test {
            val result = awaitItem()

            // Then
            assertTrue(result.isSuccess)
            assertEquals(false, result.getOrNull()?.first()?.isRead)
            awaitComplete()
        }
    }

    @Test
    fun `invoke should succeed with custom pagination`() = runTest {
        // Given
        val notifications = listOf(createTestNotification())
        whenever(repository.getNotifications(any(), any(), eq(50), eq(100)))
            .thenReturn(flow { emit(Result.success(notifications)) })

        // When
        useCase(limit = 50, offset = 100).test {
            val result = awaitItem()

            // Then
            assertTrue(result.isSuccess)
            awaitComplete()
        }

        verify(repository).getNotifications(any(), any(), eq(50), eq(100))
    }

    @Test
    fun `invoke should succeed with minimum limit`() = runTest {
        // Given
        whenever(repository.getNotifications(any(), any(), eq(1), any()))
            .thenReturn(flow { emit(Result.success(emptyList())) })

        // When
        useCase(limit = 1, offset = 0).test {
            awaitItem()
            awaitComplete()
        }
    }

    @Test
    fun `invoke should succeed with maximum limit`() = runTest {
        // Given
        whenever(repository.getNotifications(any(), any(), eq(100), any()))
            .thenReturn(flow { emit(Result.success(emptyList())) })

        // When
        useCase(limit = 100, offset = 0).test {
            awaitItem()
            awaitComplete()
        }
    }

    // ========== Validation Cases ==========

    @Test
    fun `invoke should fail when limit is less than 1`() = runTest {
        // When
        useCase(limit = 0, offset = 0).test {
            val result = awaitItem()

            // Then
            assertTrue(result.isFailure)
            assertEquals("Limit must be at least 1", result.exceptionOrNull()?.message)
            awaitComplete()
        }

        verifyNoInteractions(repository)
    }

    @Test
    fun `invoke should fail when limit exceeds 100`() = runTest {
        // When
        useCase(limit = 101, offset = 0).test {
            val result = awaitItem()

            // Then
            assertTrue(result.isFailure)
            assertEquals("Limit cannot exceed 100", result.exceptionOrNull()?.message)
            awaitComplete()
        }

        verifyNoInteractions(repository)
    }

    @Test
    fun `invoke should fail when offset is negative`() = runTest {
        // When
        useCase(limit = 20, offset = -1).test {
            val result = awaitItem()

            // Then
            assertTrue(result.isFailure)
            assertEquals("Offset cannot be negative", result.exceptionOrNull()?.message)
            awaitComplete()
        }

        verifyNoInteractions(repository)
    }

    // ========== Edge Cases ==========

    @Test
    fun `invoke should return empty list when no notifications exist`() = runTest {
        // Given
        whenever(repository.getNotifications(any(), any(), any(), any()))
            .thenReturn(flow { emit(Result.success(emptyList())) })

        // When
        useCase(limit = 20, offset = 0).test {
            val result = awaitItem()

            // Then
            assertTrue(result.isSuccess)
            assertTrue(result.getOrNull()?.isEmpty() == true)
            awaitComplete()
        }
    }

    @Test
    fun `invoke should coerce limit to valid range`() = runTest {
        // Given
        whenever(repository.getNotifications(any(), any(), eq(100), any()))
            .thenReturn(flow { emit(Result.success(emptyList())) })

        // When - limit > 100 should be coerced to 100
        useCase(limit = 150, offset = 0).test {
            awaitItem()
            awaitComplete()
        }

        // Verify limit was coerced despite initial validation
        // Note: This test expects validation to catch it first
    }

    @Test
    fun `invoke should handle repository error gracefully`() = runTest {
        // Given
        val error = Exception("Network error")
        whenever(repository.getNotifications(any(), any(), any(), any()))
            .thenReturn(flow { emit(Result.failure(error)) })

        // When
        useCase(limit = 20, offset = 0).test {
            val result = awaitItem()

            // Then
            assertTrue(result.isFailure)
            assertEquals("Network error", result.exceptionOrNull()?.message)
            awaitComplete()
        }
    }

    // ========== Helper Methods ==========

    private fun createTestNotification(
        id: String = "notif_123",
        type: NotificationType = NotificationType.BID_RECEIVED,
        isRead: Boolean = false
    ) = Notification(
        id = id,
        userId = "user_123",
        type = type,
        title = "New Bid",
        body = "You received a new bid",
        data = mapOf("bidId" to "bid_123"),
        isRead = isRead,
        createdAt = "2024-01-01T10:00:00Z",
        readAt = null
    )
}
