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
import za.co.taska.data.remote.dto.request.CreateBidRequest
import za.co.taska.data.remote.dto.request.UpdateBidRequest
import java.util.concurrent.TimeUnit

/**
 * Integration tests for BidsApiService using MockWebServer
 * Tests all 11 bids endpoints with request/response serialization
 *
 * Coverage target: >70%
 * Test count: 17 tests
 */
class BidsApiServiceTest {

    private lateinit var mockWebServer: MockWebServer
    private lateinit var apiService: BidsApiService

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
            .create(BidsApiService::class.java)
    }

    @After
    fun teardown() {
        mockWebServer.shutdown()
    }

    // ========== createBid Tests ==========

    @Test
    fun createBid_shouldReturnSuccess_whenApiReturns201() = runTest {
        // Given
        val responseBody = """
            {
                "id": "bid_123",
                "jobId": "job_456",
                "artisanId": "artisan_789",
                "amount": 500.0,
                "message": "I can complete this job professionally",
                "estimatedDays": 5,
                "attachments": ["file1.pdf"],
                "status": "PENDING",
                "acceptedAt": null,
                "rejectedAt": null,
                "withdrawnAt": null,
                "expiresAt": "2025-12-01T00:00:00Z",
                "createdAt": "2025-11-01T00:00:00Z",
                "updatedAt": "2025-11-01T00:00:00Z",
                "job": null
            }
        """.trimIndent()

        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(201)
                .setBody(responseBody)
                .addHeader("Content-Type", "application/json")
        )

        val request = CreateBidRequest(
            jobId = "job_456",
            amount = 500.0,
            message = "I can complete this job professionally",
            estimatedDays = 5,
            attachments = listOf("file1.pdf")
        )

        // When
        val response = apiService.createBid(request)

        // Then
        assertTrue(response.isSuccessful)
        assertEquals(201, response.code())
        assertNotNull(response.body())
        assertEquals("bid_123", response.body()?.id)
        assertEquals(500.0, response.body()?.amount, 0.01)
    }

    @Test
    fun createBid_shouldReturnError_whenApiReturns400() = runTest {
        // Given
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(400)
                .setBody("""{"message": "Invalid bid details"}""")
        )

        val request = CreateBidRequest(
            jobId = "job_456",
            amount = 500.0,
            message = "Test message",
            estimatedDays = 5,
            attachments = emptyList()
        )

        // When
        val response = apiService.createBid(request)

        // Then
        assertFalse(response.isSuccessful)
        assertEquals(400, response.code())
    }

    // ========== getMyBids Tests ==========

    @Test
    fun getMyBids_shouldReturnSuccess_whenApiReturns200() = runTest {
        // Given
        val responseBody = """
            [
                {
                    "id": "bid_1",
                    "jobId": "job_1",
                    "artisanId": "artisan_123",
                    "amount": 500.0,
                    "message": "Bid 1 message",
                    "estimatedDays": 5,
                    "attachments": [],
                    "status": "PENDING",
                    "acceptedAt": null,
                    "rejectedAt": null,
                    "withdrawnAt": null,
                    "expiresAt": "2025-12-01T00:00:00Z",
                    "createdAt": "2025-11-01T00:00:00Z",
                    "updatedAt": "2025-11-01T00:00:00Z",
                    "job": null
                },
                {
                    "id": "bid_2",
                    "jobId": "job_2",
                    "artisanId": "artisan_123",
                    "amount": 700.0,
                    "message": "Bid 2 message",
                    "estimatedDays": 7,
                    "attachments": [],
                    "status": "ACCEPTED",
                    "acceptedAt": "2025-11-02T00:00:00Z",
                    "rejectedAt": null,
                    "withdrawnAt": null,
                    "expiresAt": "2025-12-01T00:00:00Z",
                    "createdAt": "2025-11-01T00:00:00Z",
                    "updatedAt": "2025-11-02T00:00:00Z",
                    "job": null
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
        val response = apiService.getMyBids()

        // Then
        assertTrue(response.isSuccessful)
        assertEquals(200, response.code())
        assertNotNull(response.body())
        assertEquals(2, response.body()?.size)
        assertEquals("bid_1", response.body()?.get(0)?.id)
        assertEquals("PENDING", response.body()?.get(0)?.status)
        assertEquals("bid_2", response.body()?.get(1)?.id)
        assertEquals("ACCEPTED", response.body()?.get(1)?.status)
    }

    // ========== getBidById Tests ==========

    @Test
    fun getBidById_shouldReturnSuccess_whenApiReturns200() = runTest {
        // Given
        val responseBody = """
            {
                "id": "bid_123",
                "jobId": "job_456",
                "artisanId": "artisan_789",
                "amount": 600.0,
                "message": "Detailed bid message",
                "estimatedDays": 10,
                "attachments": ["file1.pdf", "file2.jpg"],
                "status": "PENDING",
                "acceptedAt": null,
                "rejectedAt": null,
                "withdrawnAt": null,
                "expiresAt": "2025-12-01T00:00:00Z",
                "createdAt": "2025-11-01T00:00:00Z",
                "updatedAt": "2025-11-01T00:00:00Z",
                "job": null
            }
        """.trimIndent()

        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setBody(responseBody)
                .addHeader("Content-Type", "application/json")
        )

        // When
        val response = apiService.getBidById("bid_123")

        // Then
        assertTrue(response.isSuccessful)
        assertEquals(200, response.code())
        assertNotNull(response.body())
        assertEquals("bid_123", response.body()?.id)
        assertEquals(600.0, response.body()?.amount, 0.01)
        assertEquals(2, response.body()?.attachments?.size)
    }

    @Test
    fun getBidById_shouldReturnError_whenApiReturns404() = runTest {
        // Given
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(404)
                .setBody("""{"message": "Bid not found"}""")
        )

        // When
        val response = apiService.getBidById("nonexistent_bid")

        // Then
        assertFalse(response.isSuccessful)
        assertEquals(404, response.code())
    }

    // ========== updateBid Tests ==========

    @Test
    fun updateBid_shouldReturnSuccess_whenApiReturns200() = runTest {
        // Given
        val responseBody = """
            {
                "id": "bid_123",
                "jobId": "job_456",
                "artisanId": "artisan_789",
                "amount": 550.0,
                "message": "Updated bid message with new details",
                "estimatedDays": 6,
                "attachments": [],
                "status": "PENDING",
                "acceptedAt": null,
                "rejectedAt": null,
                "withdrawnAt": null,
                "expiresAt": "2025-12-01T00:00:00Z",
                "createdAt": "2025-11-01T00:00:00Z",
                "updatedAt": "2025-11-02T00:00:00Z",
                "job": null
            }
        """.trimIndent()

        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setBody(responseBody)
                .addHeader("Content-Type", "application/json")
        )

        val request = UpdateBidRequest(
            amount = 550.0,
            message = "Updated bid message with new details",
            estimatedDays = 6
        )

        // When
        val response = apiService.updateBid("bid_123", request)

        // Then
        assertTrue(response.isSuccessful)
        assertEquals(200, response.code())
        assertNotNull(response.body())
        assertEquals(550.0, response.body()?.amount, 0.01)
    }

    @Test
    fun updateBid_shouldReturnError_whenApiReturns403() = runTest {
        // Given
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(403)
                .setBody("""{"message": "You can only update your own pending bids"}""")
        )

        val request = UpdateBidRequest(amount = 600.0)

        // When
        val response = apiService.updateBid("bid_123", request)

        // Then
        assertFalse(response.isSuccessful)
        assertEquals(403, response.code())
    }

    // ========== withdrawBid Tests ==========

    @Test
    fun withdrawBid_shouldReturnSuccess_whenApiReturns200() = runTest {
        // Given
        val responseBody = """{"message": "Bid withdrawn successfully"}"""

        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setBody(responseBody)
                .addHeader("Content-Type", "application/json")
        )

        // When
        val response = apiService.withdrawBid("bid_123")

        // Then
        assertTrue(response.isSuccessful)
        assertEquals(200, response.code())
        assertNotNull(response.body())
        assertEquals("Bid withdrawn successfully", response.body()?.message)
    }

    @Test
    fun withdrawBid_shouldReturnError_whenApiReturns403() = runTest {
        // Given
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(403)
                .setBody("""{"message": "You can only withdraw your own pending bids"}""")
        )

        // When
        val response = apiService.withdrawBid("bid_123")

        // Then
        assertFalse(response.isSuccessful)
        assertEquals(403, response.code())
    }

    // ========== getBidStatistics Tests ==========

    @Test
    fun getBidStatistics_shouldReturnSuccess_whenApiReturns200() = runTest {
        // Given
        val responseBody = """
            {
                "totalBids": 25,
                "pendingBids": 10,
                "acceptedBids": 8,
                "rejectedBids": 5,
                "withdrawnBids": 2
            }
        """.trimIndent()

        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setBody(responseBody)
                .addHeader("Content-Type", "application/json")
        )

        // When
        val response = apiService.getBidStatistics()

        // Then
        assertTrue(response.isSuccessful)
        assertEquals(200, response.code())
        assertNotNull(response.body())
    }

    // ========== getJobBids Tests ==========

    @Test
    fun getJobBids_shouldReturnSuccess_whenApiReturns200() = runTest {
        // Given
        val responseBody = """
            [
                {
                    "id": "bid_1",
                    "jobId": "job_123",
                    "artisanId": "artisan_1",
                    "amount": 500.0,
                    "message": "Artisan 1 bid",
                    "estimatedDays": 5,
                    "attachments": [],
                    "status": "PENDING",
                    "acceptedAt": null,
                    "rejectedAt": null,
                    "withdrawnAt": null,
                    "expiresAt": "2025-12-01T00:00:00Z",
                    "createdAt": "2025-11-01T00:00:00Z",
                    "updatedAt": "2025-11-01T00:00:00Z",
                    "job": null
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
        val response = apiService.getJobBids("job_123")

        // Then
        assertTrue(response.isSuccessful)
        assertEquals(200, response.code())
        assertNotNull(response.body())
        assertEquals(1, response.body()?.size)
        assertEquals("job_123", response.body()?.get(0)?.jobId)
    }

    // ========== getJobBidAnalytics Tests ==========

    @Test
    fun getJobBidAnalytics_shouldReturnSuccess_whenApiReturns200() = runTest {
        // Given
        val responseBody = """
            {
                "totalBids": 5,
                "averageAmount": 550.0,
                "lowestBid": 400.0,
                "highestBid": 700.0
            }
        """.trimIndent()

        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setBody(responseBody)
                .addHeader("Content-Type", "application/json")
        )

        // When
        val response = apiService.getJobBidAnalytics("job_123")

        // Then
        assertTrue(response.isSuccessful)
        assertEquals(200, response.code())
        assertNotNull(response.body())
    }

    // ========== acceptBid Tests ==========

    @Test
    fun acceptBid_shouldReturnSuccess_whenApiReturns200() = runTest {
        // Given
        val responseBody = """{"message": "Bid accepted successfully"}"""

        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setBody(responseBody)
                .addHeader("Content-Type", "application/json")
        )

        // When
        val response = apiService.acceptBid("bid_123")

        // Then
        assertTrue(response.isSuccessful)
        assertEquals(200, response.code())
        assertNotNull(response.body())
        assertEquals("Bid accepted successfully", response.body()?.message)
    }

    @Test
    fun acceptBid_shouldReturnError_whenApiReturns403() = runTest {
        // Given
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(403)
                .setBody("""{"message": "You don't have permission to accept this bid"}""")
        )

        // When
        val response = apiService.acceptBid("bid_123")

        // Then
        assertFalse(response.isSuccessful)
        assertEquals(403, response.code())
    }

    // ========== rejectBid Tests ==========

    @Test
    fun rejectBid_shouldReturnSuccess_whenApiReturns200() = runTest {
        // Given
        val responseBody = """{"message": "Bid rejected successfully"}"""

        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setBody(responseBody)
                .addHeader("Content-Type", "application/json")
        )

        // When
        val response = apiService.rejectBid("bid_123")

        // Then
        assertTrue(response.isSuccessful)
        assertEquals(200, response.code())
        assertNotNull(response.body())
        assertEquals("Bid rejected successfully", response.body()?.message)
    }

    // ========== getAllBids Tests ==========

    @Test
    fun getAllBids_shouldReturnSuccess_whenApiReturns200() = runTest {
        // Given
        val responseBody = """
            [
                {
                    "id": "bid_1",
                    "jobId": "job_1",
                    "artisanId": "artisan_1",
                    "amount": 500.0,
                    "message": "Bid message 1",
                    "estimatedDays": 5,
                    "attachments": [],
                    "status": "PENDING",
                    "acceptedAt": null,
                    "rejectedAt": null,
                    "withdrawnAt": null,
                    "expiresAt": "2025-12-01T00:00:00Z",
                    "createdAt": "2025-11-01T00:00:00Z",
                    "updatedAt": "2025-11-01T00:00:00Z",
                    "job": null
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
        val response = apiService.getAllBids()

        // Then
        assertTrue(response.isSuccessful)
        assertEquals(200, response.code())
        assertNotNull(response.body())
        assertEquals(1, response.body()?.size)
    }
}
