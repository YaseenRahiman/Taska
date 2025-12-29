package za.co.taska.data.repository

import app.cash.turbine.test
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.mockito.kotlin.*
import retrofit2.Response
import za.co.taska.data.local.dao.NotificationDao
import za.co.taska.data.local.entity.NotificationEntity
import za.co.taska.data.remote.api.NotificationsApiService
import za.co.taska.data.remote.api.UnreadCountResponse
import za.co.taska.data.remote.dto.response.NotificationPreferencesResponse
import za.co.taska.data.remote.dto.response.NotificationResponse
import za.co.taska.data.remote.dto.response.NotificationsListResponse

/**
 * Integration tests for NotificationsRepositoryImpl
 * Tests network-first + cache fallback strategy
 * Coverage target: >70%
 */
class NotificationsRepositoryImplTest {

    private lateinit var repository: NotificationsRepositoryImpl
    private lateinit var apiService: NotificationsApiService
    private lateinit var dao: NotificationDao

    @Before
    fun setup() {
        apiService = mock()
        dao = mock()
        repository = NotificationsRepositoryImpl(apiService, dao)
    }

    // ========== getNotifications Tests ==========

    @Test
    fun `getNotifications should return network data when API succeeds`() = runTest {
        // Given
        val responseData = createTestNotificationsListResponse()
        whenever(apiService.getNotifications(any(), any(), any(), any()))
            .thenReturn(Response.success(responseData))

        // When
        repository.getNotifications(limit = 20, offset = 0).test {
            val result = awaitItem()

            // Then
            assertTrue(result.isSuccess)
            assertEquals(1, result.getOrNull()?.size)
            verify(dao).insertNotifications(any())
            awaitComplete()
        }
    }

    @Test
    fun `getNotifications should fallback to cache when API fails`() = runTest {
        // Given
        whenever(apiService.getNotifications(any(), any(), any(), any()))
            .thenReturn(Response.error(500, "".toResponseBody()))
        val cachedEntities = listOf(createTestNotificationEntity())
        whenever(dao.getNotifications(any(), any()))
            .thenReturn(flowOf(cachedEntities))

        // When
        repository.getNotifications(limit = 20, offset = 0).test {
            val result = awaitItem()

            // Then
            assertTrue(result.isSuccess)
            assertEquals(1, result.getOrNull()?.size)
            awaitComplete()
        }
    }

    @Test
    fun `getNotifications should filter by type`() = runTest {
        // Given
        val responseData = createTestNotificationsListResponse()
        whenever(apiService.getNotifications(eq("BID_RECEIVED"), any(), any(), any()))
            .thenReturn(Response.success(responseData))

        // When
        repository.getNotifications(type = "BID_RECEIVED", limit = 20, offset = 0).test {
            val result = awaitItem()

            // Then
            assertTrue(result.isSuccess)
            verify(apiService).getNotifications(eq("BID_RECEIVED"), any(), any(), any())
            awaitComplete()
        }
    }

    // ========== markNotificationAsRead Tests ==========

    @Test
    fun `markNotificationAsRead should update server and cache`() = runTest {
        // Given
        val notificationId = "notif_123"
        whenever(apiService.markAsRead(notificationId))
            .thenReturn(Response.success(Unit))
        whenever(dao.markAsRead(any(), any())).then { }

        // When
        val result = repository.markNotificationAsRead(notificationId)

        // Then
        assertTrue(result.isSuccess)
        verify(apiService).markAsRead(notificationId)
        verify(dao).markAsRead(eq(notificationId), any())
    }

    @Test
    fun `markNotificationAsRead should update cache on network error`() = runTest {
        // Given
        val notificationId = "notif_123"
        whenever(apiService.markAsRead(notificationId))
            .thenThrow(RuntimeException("Network error"))
        whenever(dao.markAsRead(any(), any())).then { }

        // When
        val result = repository.markNotificationAsRead(notificationId)

        // Then
        assertTrue(result.isSuccess)
        verify(dao).markAsRead(eq(notificationId), any())
    }

    // ========== clearReadNotifications Tests ==========

    @Test
    fun `clearReadNotifications should delete from server and cache`() = runTest {
        // Given
        whenever(apiService.clearReadNotifications())
            .thenReturn(Response.success(Unit))
        whenever(dao.deleteReadNotifications()).then { }

        // When
        val result = repository.clearReadNotifications()

        // Then
        assertTrue(result.isSuccess)
        verify(apiService).clearReadNotifications()
        verify(dao).deleteReadNotifications()
    }

    // ========== getNotificationPreferences Tests ==========

    @Test
    fun `getNotificationPreferences should return preferences from API`() = runTest {
        // Given
        val preferencesResponse = createTestPreferencesResponse()
        whenever(apiService.getNotificationPreferences())
            .thenReturn(Response.success(preferencesResponse))

        // When
        val result = repository.getNotificationPreferences()

        // Then
        assertTrue(result.isSuccess)
        val prefs = result.getOrNull()!!
        assertTrue(prefs.enableBidNotifications)
        assertTrue(prefs.enableMessageNotifications)
    }

    // ========== updateNotificationPreferences Tests ==========

    @Test
    fun `updateNotificationPreferences should update and return new preferences`() = runTest {
        // Given
        val preferencesResponse = createTestPreferencesResponse()
        whenever(apiService.updateNotificationPreferences(any()))
            .thenReturn(Response.success(preferencesResponse))

        // When
        val result = repository.updateNotificationPreferences(
            enableBidNotifications = true,
            enableMessageNotifications = true
        )

        // Then
        assertTrue(result.isSuccess)
        verify(apiService).updateNotificationPreferences(any())
    }

    // ========== Helper Methods ==========

    private fun createTestNotificationsListResponse() = NotificationsListResponse(
        notifications = listOf(
            NotificationResponse(
                id = "notif_123",
                userId = "user_123",
                type = "BID_RECEIVED",
                title = "New Bid",
                body = "You received a new bid",
                data = mapOf("bidId" to "bid_123"),
                isRead = false,
                createdAt = "2024-01-01T10:00:00Z",
                readAt = null
            )
        ),
        total = 1,
        page = 1,
        limit = 20,
        hasMore = false
    )

    private fun createTestNotificationEntity() = NotificationEntity(
        id = "notif_123",
        userId = "user_123",
        type = "BID_RECEIVED",
        title = "New Bid",
        body = "You received a new bid",
        data = mapOf("bidId" to "bid_123"),
        isRead = false,
        createdAt = "2024-01-01T10:00:00Z",
        readAt = null,
        syncStatus = "SYNCED"
    )

    private fun createTestPreferencesResponse() = NotificationPreferencesResponse(
        userId = "user_123",
        enableBidNotifications = true,
        enableMessageNotifications = true,
        enablePaymentNotifications = true,
        enableReviewNotifications = true,
        enableSystemNotifications = true,
        updatedAt = "2024-01-01T10:00:00Z"
    )
}
