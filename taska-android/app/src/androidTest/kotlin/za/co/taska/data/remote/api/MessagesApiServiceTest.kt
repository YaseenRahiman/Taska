package za.co.taska.data.remote.api

import kotlinx.coroutines.test.runTest
import okhttp3.OkHttpClient
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import za.co.taska.data.remote.dto.request.MarkAsReadRequest
import za.co.taska.data.remote.dto.request.SendMessageRequest
import java.util.concurrent.TimeUnit

/**
 * Integration tests for MessagesApiService using MockWebServer
 * Tests all 5 messages endpoints with request/response serialization
 *
 * Coverage target: >70%
 * Test count: 12 tests
 */
class MessagesApiServiceTest {

    private lateinit var mockWebServer: MockWebServer
    private lateinit var apiService: MessagesApiService

    @Before
    fun setup() {
        mockWebServer = MockWebServer()
        mockWebServer.start()

        val okHttpClient = OkHttpClient.Builder()
            .connectTimeout(1, TimeUnit.SECONDS)
            .readTimeout(1, TimeUnit.SECONDS)
            .writeTimeout(1, TimeUnit.SECONDS)
            .build()

        apiService = Retrofit.Builder()
            .baseUrl(mockWebServer.url("/"))
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(MessagesApiService::class.java)
    }

    @After
    fun teardown() {
        mockWebServer.shutdown()
    }

    // ========== sendMessage Tests ==========

    @Test
    fun sendMessage_shouldReturnSuccess_whenApiReturns201() = runTest {
        // Given
        val responseBody = """
            {
                "id": "msg_123",
                "jobId": "job_456",
                "senderId": "sender_789",
                "receiverId": "user_123",
                "content": "Hello, I'm interested in this job",
                "messageType": "TEXT",
                "attachments": ["attachment1.pdf"],
                "isRead": false,
                "readAt": null,
                "createdAt": "2024-01-01T00:00:00Z",
                "sender": {
                    "id": "sender_789",
                    "firstName": "John",
                    "lastName": "Doe",
                    "profilePictureUrl": "https://example.com/avatar.jpg"
                }
            }
        """.trimIndent()

        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(201)
                .setBody(responseBody)
                .addHeader("Content-Type", "application/json")
        )

        val request = SendMessageRequest(
            jobId = "job_456",
            receiverId = "user_123",
            content = "Hello, I'm interested in this job",
            messageType = "TEXT",
            attachments = listOf("attachment1.pdf")
        )

        // When
        val response = apiService.sendMessage(request)

        // Then
        assertTrue(response.isSuccessful)
        assertEquals(201, response.code())
        assertNotNull(response.body())
        assertEquals("msg_123", response.body()?.id)
        assertEquals("Hello, I'm interested in this job", response.body()?.content)
    }

    @Test
    fun sendMessage_shouldReturnError_whenApiReturns400() = runTest {
        // Given
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(400)
                .setBody("""{"message": "Invalid message data"}""")
        )

        val request = SendMessageRequest(
            jobId = "job_456",
            receiverId = "user_123",
            content = "",
            messageType = "TEXT",
            attachments = emptyList()
        )

        // When
        val response = apiService.sendMessage(request)

        // Then
        assertFalse(response.isSuccessful)
        assertEquals(400, response.code())
    }

    @Test
    fun sendMessage_shouldReturnError_whenApiReturns403() = runTest {
        // Given
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(403)
                .setBody("""{"message": "No permission"}""")
        )

        val request = SendMessageRequest(
            jobId = "job_456",
            receiverId = "user_123",
            content = "Test message",
            messageType = "TEXT",
            attachments = emptyList()
        )

        // When
        val response = apiService.sendMessage(request)

        // Then
        assertFalse(response.isSuccessful)
        assertEquals(403, response.code())
    }

    // ========== getMessages Tests ==========

    @Test
    fun getMessages_shouldReturnSuccess_whenApiReturns200() = runTest {
        // Given
        val responseBody = """
            [
                {
                    "id": "msg_1",
                    "jobId": "job_123",
                    "senderId": "sender_1",
                    "receiverId": "user_123",
                    "content": "First message",
                    "messageType": "TEXT",
                    "attachments": [],
                    "isRead": false,
                    "readAt": null,
                    "createdAt": "2024-01-01T00:00:00Z",
                    "sender": null
                },
                {
                    "id": "msg_2",
                    "jobId": "job_123",
                    "senderId": "user_123",
                    "receiverId": "sender_1",
                    "content": "Second message",
                    "messageType": "TEXT",
                    "attachments": [],
                    "isRead": true,
                    "readAt": "2024-01-01T01:00:00Z",
                    "createdAt": "2024-01-01T00:30:00Z",
                    "sender": null
                }
            ]
        """.trimIndent()

        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setBody(responseBody)
                .addHeader("Content-Type", "application/json")
        )

        // When
        val response = apiService.getMessages(jobId = "job_123")

        // Then
        assertTrue(response.isSuccessful)
        assertEquals(200, response.code())
        assertNotNull(response.body())
        assertEquals(2, response.body()?.size)
    }

    @Test
    fun getMessages_shouldReturnError_whenApiReturns403() = runTest {
        // Given
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(403)
                .setBody("""{"message": "No permission"}""")
        )

        // When
        val response = apiService.getMessages(jobId = "job_123")

        // Then
        assertFalse(response.isSuccessful)
        assertEquals(403, response.code())
    }

    // ========== getConversations Tests ==========

    @Test
    fun getConversations_shouldReturnSuccess_whenApiReturns200() = runTest {
        // Given
        val responseBody = """
            [
                {
                    "jobId": "job_123",
                    "jobTitle": "Plumbing Job",
                    "participantId": "user_456",
                    "participantName": "John Doe",
                    "participantAvatar": "https://example.com/avatar.jpg",
                    "lastMessage": "Last message content",
                    "lastMessageAt": "2024-01-01T00:00:00Z",
                    "unreadCount": 5,
                    "totalMessages": 20
                },
                {
                    "jobId": "job_789",
                    "jobTitle": "Electrical Work",
                    "participantId": "user_789",
                    "participantName": "Jane Smith",
                    "participantAvatar": null,
                    "lastMessage": "Another message",
                    "lastMessageAt": "2024-01-02T00:00:00Z",
                    "unreadCount": 0,
                    "totalMessages": 10
                }
            ]
        """.trimIndent()

        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setBody(responseBody)
                .addHeader("Content-Type", "application/json")
        )

        // When
        val response = apiService.getConversations()

        // Then
        assertTrue(response.isSuccessful)
        assertEquals(200, response.code())
        assertNotNull(response.body())
        assertEquals(2, response.body()?.size)
        assertEquals("Plumbing Job", response.body()?.get(0)?.jobTitle)
        assertEquals(5, response.body()?.get(0)?.unreadCount)
    }

    @Test
    fun getConversations_shouldReturnError_whenApiReturns401() = runTest {
        // Given
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(401)
                .setBody("""{"message": "Unauthorized"}""")
        )

        // When
        val response = apiService.getConversations()

        // Then
        assertFalse(response.isSuccessful)
        assertEquals(401, response.code())
    }

    // ========== markAsRead Tests ==========

    @Test
    fun markAsRead_shouldReturnSuccess_whenApiReturns200() = runTest {
        // Given
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .addHeader("Content-Type", "application/json")
        )

        val request = MarkAsReadRequest(messageId = "msg_123")

        // When
        val response = apiService.markAsRead(request)

        // Then
        assertTrue(response.isSuccessful)
        assertEquals(200, response.code())
    }

    @Test
    fun markAsRead_shouldReturnError_whenApiReturns400() = runTest {
        // Given
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(400)
                .setBody("""{"message": "Invalid message ID"}""")
        )

        val request = MarkAsReadRequest(messageId = "")

        // When
        val response = apiService.markAsRead(request)

        // Then
        assertFalse(response.isSuccessful)
        assertEquals(400, response.code())
    }

    @Test
    fun markAsRead_shouldSupportJobId_whenMarkingAllJobMessages() = runTest {
        // Given
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .addHeader("Content-Type", "application/json")
        )

        val request = MarkAsReadRequest(jobId = "job_123")

        // When
        val response = apiService.markAsRead(request)

        // Then
        assertTrue(response.isSuccessful)
        assertEquals(200, response.code())
    }

    // ========== getUnreadCount Tests ==========

    @Test
    fun getUnreadCount_shouldReturnSuccess_whenApiReturns200() = runTest {
        // Given
        val responseBody = """
            {
                "count": 10
            }
        """.trimIndent()

        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setBody(responseBody)
                .addHeader("Content-Type", "application/json")
        )

        // When
        val response = apiService.getUnreadCount()

        // Then
        assertTrue(response.isSuccessful)
        assertEquals(200, response.code())
        assertNotNull(response.body())
        assertEquals(10, response.body()?.count)
    }
}
