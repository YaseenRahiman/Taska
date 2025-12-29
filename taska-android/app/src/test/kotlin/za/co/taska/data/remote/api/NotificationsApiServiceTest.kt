package za.co.taska.data.remote.api

import kotlinx.coroutines.test.runTest
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import za.co.taska.data.remote.dto.request.MarkMultipleNotificationsAsReadRequest
import za.co.taska.data.remote.dto.request.UpdateNotificationPreferencesRequest

/**
 * Integration tests for NotificationsApiService
 * Tests actual HTTP requests/responses
 * Coverage target: >70%
 */
class NotificationsApiServiceTest {

    private lateinit var mockWebServer: MockWebServer
    private lateinit var apiService: NotificationsApiService

    @Before
    fun setup() {
        mockWebServer = MockWebServer()
        mockWebServer.start()

        apiService = Retrofit.Builder()
            .baseUrl(mockWebServer.url("/"))
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(NotificationsApiService::class.java)
    }

    @After
    fun tearDown() {
        mockWebServer.shutdown()
    }

    // ========== getNotifications Tests ==========

    @Test
    fun `getNotifications should return success with notifications list`() = runTest {
        // Given
        val responseBody = """
            {
                "notifications": [
                    {
                        "id": "notif_123",
                        "userId": "user_123",
                        "type": "BID_RECEIVED",
                        "title": "New Bid",
                        "body": "You received a new bid",
                        "data": {"bidId": "bid_123"},
                        "isRead": false,
                        "createdAt": "2024-01-01T10:00:00Z",
                        "readAt": null
                    }
                ],
                "total": 1,
                "page": 1,
                "limit": 20,
                "hasMore": false
            }
        """.trimIndent()

        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setBody(responseBody)
        )

        // When
        val response = apiService.getNotifications(page = 1, limit = 20)

        // Then
        assertTrue(response.isSuccessful)
        assertNotNull(response.body())
        assertEquals(1, response.body()?.notifications?.size)
        assertEquals("notif_123", response.body()?.notifications?.first()?.id)
    }

    @Test
    fun `getNotifications should handle 401 unauthorized`() = runTest {
        // Given
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(401)
        )

        // When
        val response = apiService.getNotifications()

        // Then
        assertFalse(response.isSuccessful)
        assertEquals(401, response.code())
    }

    // ========== markAsRead Tests ==========

    @Test
    fun `markAsRead should return success`() = runTest {
        // Given
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
        )

        // When
        val response = apiService.markAsRead("notif_123")

        // Then
        assertTrue(response.isSuccessful)
    }

    // ========== markMultipleAsRead Tests ==========

    @Test
    fun `markMultipleAsRead should return success`() = runTest {
        // Given
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
        )

        val request = MarkMultipleNotificationsAsReadRequest(
            notificationIds = listOf("notif_1", "notif_2")
        )

        // When
        val response = apiService.markMultipleAsRead(request)

        // Then
        assertTrue(response.isSuccessful)
    }

    // ========== getNotificationPreferences Tests ==========

    @Test
    fun `getNotificationPreferences should return preferences`() = runTest {
        // Given
        val responseBody = """
            {
                "userId": "user_123",
                "enableBidNotifications": true,
                "enableMessageNotifications": true,
                "enablePaymentNotifications": false,
                "enableReviewNotifications": true,
                "enableSystemNotifications": true,
                "updatedAt": "2024-01-01T10:00:00Z"
            }
        """.trimIndent()

        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setBody(responseBody)
        )

        // When
        val response = apiService.getNotificationPreferences()

        // Then
        assertTrue(response.isSuccessful)
        assertNotNull(response.body())
        assertTrue(response.body()?.enableBidNotifications == true)
        assertFalse(response.body()?.enablePaymentNotifications == true)
    }

    // ========== updateNotificationPreferences Tests ==========

    @Test
    fun `updateNotificationPreferences should return updated preferences`() = runTest {
        // Given
        val responseBody = """
            {
                "userId": "user_123",
                "enableBidNotifications": false,
                "enableMessageNotifications": true,
                "enablePaymentNotifications": true,
                "enableReviewNotifications": true,
                "enableSystemNotifications": true,
                "updatedAt": "2024-01-01T11:00:00Z"
            }
        """.trimIndent()

        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setBody(responseBody)
        )

        val request = UpdateNotificationPreferencesRequest(
            enableBidNotifications = false
        )

        // When
        val response = apiService.updateNotificationPreferences(request)

        // Then
        assertTrue(response.isSuccessful)
        assertNotNull(response.body())
        assertFalse(response.body()?.enableBidNotifications == true)
    }

    // ========== getUnreadCount Tests ==========

    @Test
    fun `getUnreadCount should return count`() = runTest {
        // Given
        val responseBody = """
            {
                "count": 5
            }
        """.trimIndent()

        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setBody(responseBody)
        )

        // When
        val response = apiService.getUnreadCount()

        // Then
        assertTrue(response.isSuccessful)
        assertEquals(5, response.body()?.count)
    }
}
