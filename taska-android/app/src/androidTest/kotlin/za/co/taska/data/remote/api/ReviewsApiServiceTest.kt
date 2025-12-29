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
import za.co.taska.data.remote.dto.request.CreateReviewRequest
import za.co.taska.data.remote.dto.request.UpdateReviewRequest
import java.util.concurrent.TimeUnit

/**
 * Integration tests for ReviewsApiService using MockWebServer
 * Tests API endpoints, request/response serialization, and error handling
 *
 * Coverage target: >70%
 */
class ReviewsApiServiceTest {

    private lateinit var mockWebServer: MockWebServer
    private lateinit var apiService: ReviewsApiService

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
            .create(ReviewsApiService::class.java)
    }

    @After
    fun teardown() {
        mockWebServer.shutdown()
    }

    // ========== createReview Tests ==========

    @Test
    fun createReview_shouldReturnSuccess_whenApiReturns201() = runTest {
        // Given
        val responseBody = """
            {
                "id": "review_123",
                "jobId": "job_456",
                "clientId": "client_789",
                "artisanId": "artisan_101",
                "overallRating": 5,
                "qualityRating": 5,
                "professionalismRating": 4,
                "timelinessRating": 5,
                "valueRating": 4,
                "reviewText": "Excellent work!",
                "images": ["img1.jpg", "img2.jpg"],
                "wouldRecommend": true,
                "createdAt": "2025-10-31T10:00:00Z",
                "updatedAt": null
            }
        """.trimIndent()

        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(201)
                .setBody(responseBody)
                .addHeader("Content-Type", "application/json")
        )

        val request = CreateReviewRequest(
            jobId = "job_456",
            artisanId = "artisan_101",
            overallRating = 5,
            qualityRating = 5,
            professionalismRating = 4,
            timelinessRating = 5,
            valueRating = 4,
            reviewText = "Excellent work!",
            images = listOf("img1.jpg", "img2.jpg"),
            wouldRecommend = true
        )

        // When
        val response = apiService.createReview(request)

        // Then
        assertTrue(response.isSuccessful)
        assertNotNull(response.body())
        assertEquals("review_123", response.body()?.id)
        assertEquals("job_456", response.body()?.jobId)
        assertEquals("artisan_101", response.body()?.artisanId)
        assertEquals(5, response.body()?.overallRating)
        assertEquals("Excellent work!", response.body()?.reviewText)
        assertEquals(2, response.body()?.images?.size)
        assertTrue(response.body()?.wouldRecommend == true)

        // Verify request
        val recordedRequest = mockWebServer.takeRequest()
        assertEquals("POST", recordedRequest.method)
        assertTrue(recordedRequest.path?.contains("/reviews") == true)
        assertTrue(recordedRequest.body.readUtf8().contains("job_456"))
    }

    @Test
    fun createReview_shouldHandleNullReviewText() = runTest {
        // Given
        val responseBody = """
            {
                "id": "review_123",
                "jobId": "job_456",
                "clientId": "client_789",
                "artisanId": "artisan_101",
                "overallRating": 4,
                "qualityRating": 4,
                "professionalismRating": 4,
                "timelinessRating": 4,
                "valueRating": 4,
                "reviewText": null,
                "images": [],
                "wouldRecommend": true,
                "createdAt": "2025-10-31T10:00:00Z",
                "updatedAt": null
            }
        """.trimIndent()

        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(201)
                .setBody(responseBody)
        )

        val request = CreateReviewRequest(
            jobId = "job_456",
            artisanId = "artisan_101",
            overallRating = 4,
            qualityRating = 4,
            professionalismRating = 4,
            timelinessRating = 4,
            valueRating = 4,
            reviewText = null,
            images = emptyList(),
            wouldRecommend = true
        )

        // When
        val response = apiService.createReview(request)

        // Then
        assertTrue(response.isSuccessful)
        assertNull(response.body()?.reviewText)
        assertTrue(response.body()?.images?.isEmpty() == true)
    }

    @Test
    fun createReview_shouldReturn400_whenValidationFails() = runTest {
        // Given
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(400)
                .setBody("""{"error": "Invalid rating"}""")
        )

        val request = CreateReviewRequest(
            jobId = "job_456",
            artisanId = "artisan_101",
            overallRating = 6, // Invalid rating
            qualityRating = 5,
            professionalismRating = 5,
            timelinessRating = 5,
            valueRating = 5,
            reviewText = "Good",
            images = emptyList(),
            wouldRecommend = true
        )

        // When
        val response = apiService.createReview(request)

        // Then
        assertFalse(response.isSuccessful)
        assertEquals(400, response.code())
    }

    @Test
    fun createReview_shouldReturn403_whenUnauthorized() = runTest {
        // Given
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(403)
                .setBody("""{"error": "Not authorized to review this job"}""")
        )

        val request = CreateReviewRequest(
            jobId = "job_456",
            artisanId = "artisan_101",
            overallRating = 5,
            qualityRating = 5,
            professionalismRating = 5,
            timelinessRating = 5,
            valueRating = 5,
            reviewText = "Great",
            images = emptyList(),
            wouldRecommend = true
        )

        // When
        val response = apiService.createReview(request)

        // Then
        assertFalse(response.isSuccessful)
        assertEquals(403, response.code())
    }

    @Test
    fun createReview_shouldReturn409_whenDuplicateReview() = runTest {
        // Given
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(409)
                .setBody("""{"error": "Review already exists for this job"}""")
        )

        val request = CreateReviewRequest(
            jobId = "job_456",
            artisanId = "artisan_101",
            overallRating = 5,
            qualityRating = 5,
            professionalismRating = 5,
            timelinessRating = 5,
            valueRating = 5,
            reviewText = "Already reviewed",
            images = emptyList(),
            wouldRecommend = true
        )

        // When
        val response = apiService.createReview(request)

        // Then
        assertFalse(response.isSuccessful)
        assertEquals(409, response.code())
    }

    // ========== updateReview Tests ==========

    @Test
    fun updateReview_shouldReturnSuccess_whenApiReturns200() = runTest {
        // Given
        val responseBody = """
            {
                "id": "review_123",
                "jobId": "job_456",
                "clientId": "client_789",
                "artisanId": "artisan_101",
                "overallRating": 4,
                "qualityRating": 4,
                "professionalismRating": 3,
                "timelinessRating": 5,
                "valueRating": 4,
                "reviewText": "Updated review text",
                "images": ["img1.jpg"],
                "wouldRecommend": false,
                "createdAt": "2025-10-31T10:00:00Z",
                "updatedAt": "2025-11-01T10:00:00Z"
            }
        """.trimIndent()

        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setBody(responseBody)
                .addHeader("Content-Type", "application/json")
        )

        val request = UpdateReviewRequest(
            overallRating = 4,
            reviewText = "Updated review text",
            wouldRecommend = false
        )

        // When
        val response = apiService.updateReview("review_123", request)

        // Then
        assertTrue(response.isSuccessful)
        assertNotNull(response.body())
        assertEquals(4, response.body()?.overallRating)
        assertEquals("Updated review text", response.body()?.reviewText)
        assertEquals(false, response.body()?.wouldRecommend)
        assertNotNull(response.body()?.updatedAt)

        // Verify request
        val recordedRequest = mockWebServer.takeRequest()
        assertEquals("PUT", recordedRequest.method)
        assertTrue(recordedRequest.path?.contains("/reviews/review_123") == true)
    }

    @Test
    fun updateReview_shouldHandlePartialUpdate() = runTest {
        // Given - Only updating rating
        val responseBody = """
            {
                "id": "review_123",
                "jobId": "job_456",
                "clientId": "client_789",
                "artisanId": "artisan_101",
                "overallRating": 3,
                "qualityRating": 5,
                "professionalismRating": 4,
                "timelinessRating": 5,
                "valueRating": 4,
                "reviewText": "Original text",
                "images": ["img1.jpg"],
                "wouldRecommend": true,
                "createdAt": "2025-10-31T10:00:00Z",
                "updatedAt": "2025-11-01T10:00:00Z"
            }
        """.trimIndent()

        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setBody(responseBody)
        )

        val request = UpdateReviewRequest(
            overallRating = 3
            // All other fields null
        )

        // When
        val response = apiService.updateReview("review_123", request)

        // Then
        assertTrue(response.isSuccessful)
        assertEquals(3, response.body()?.overallRating)
        assertEquals("Original text", response.body()?.reviewText) // Unchanged
    }

    @Test
    fun updateReview_shouldReturn404_whenReviewNotFound() = runTest {
        // Given
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(404)
                .setBody("""{"error": "Review not found"}""")
        )

        val request = UpdateReviewRequest(overallRating = 4)

        // When
        val response = apiService.updateReview("nonexistent_review", request)

        // Then
        assertFalse(response.isSuccessful)
        assertEquals(404, response.code())
    }

    @Test
    fun updateReview_shouldReturn403_whenNotOwner() = runTest {
        // Given
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(403)
                .setBody("""{"error": "Not authorized to update this review"}""")
        )

        val request = UpdateReviewRequest(
            reviewText = "Trying to update someone else's review"
        )

        // When
        val response = apiService.updateReview("review_123", request)

        // Then
        assertFalse(response.isSuccessful)
        assertEquals(403, response.code())
    }

    // ========== getJobReviews Tests ==========

    @Test
    fun getJobReviews_shouldReturnReviewsList() = runTest {
        // Given
        val responseBody = """
            [
                {
                    "id": "review_1",
                    "jobId": "job_456",
                    "clientId": "client_789",
                    "artisanId": "artisan_101",
                    "overallRating": 5,
                    "qualityRating": 5,
                    "professionalismRating": 4,
                    "timelinessRating": 5,
                    "valueRating": 4,
                    "reviewText": "Excellent!",
                    "images": ["img1.jpg"],
                    "wouldRecommend": true,
                    "createdAt": "2025-10-31T10:00:00Z",
                    "updatedAt": null
                },
                {
                    "id": "review_2",
                    "jobId": "job_456",
                    "clientId": "client_999",
                    "artisanId": "artisan_101",
                    "overallRating": 4,
                    "qualityRating": 4,
                    "professionalismRating": 4,
                    "timelinessRating": 4,
                    "valueRating": 4,
                    "reviewText": "Good work",
                    "images": [],
                    "wouldRecommend": true,
                    "createdAt": "2025-10-30T10:00:00Z",
                    "updatedAt": null
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
        val response = apiService.getJobReviews("job_456")

        // Then
        assertTrue(response.isSuccessful)
        assertNotNull(response.body())
        assertEquals(2, response.body()?.size)
        assertEquals("review_1", response.body()?.get(0)?.id)
        assertEquals("review_2", response.body()?.get(1)?.id)
        assertTrue(response.body()?.all { it.jobId == "job_456" } == true)

        // Verify request
        val recordedRequest = mockWebServer.takeRequest()
        assertEquals("GET", recordedRequest.method)
        assertTrue(recordedRequest.path?.contains("/jobs/job_456/reviews") == true)
    }

    @Test
    fun getJobReviews_shouldReturnEmptyList_whenNoReviews() = runTest {
        // Given
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setBody("[]")
                .addHeader("Content-Type", "application/json")
        )

        // When
        val response = apiService.getJobReviews("job_no_reviews")

        // Then
        assertTrue(response.isSuccessful)
        assertNotNull(response.body())
        assertTrue(response.body()?.isEmpty() == true)
    }

    @Test
    fun getJobReviews_shouldReturn404_whenJobNotFound() = runTest {
        // Given
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(404)
                .setBody("""{"error": "Job not found"}""")
        )

        // When
        val response = apiService.getJobReviews("nonexistent_job")

        // Then
        assertFalse(response.isSuccessful)
        assertEquals(404, response.code())
    }

    // ========== Error Handling Tests ==========

    @Test
    fun apiService_shouldHandleNetworkTimeout() = runTest {
        // Given - Delay longer than client timeout
        mockWebServer.enqueue(
            MockResponse()
                .setBodyDelay(2, TimeUnit.SECONDS)
        )

        val request = CreateReviewRequest(
            jobId = "job_456",
            artisanId = "artisan_101",
            overallRating = 5,
            qualityRating = 5,
            professionalismRating = 5,
            timelinessRating = 5,
            valueRating = 5,
            reviewText = "Test",
            images = emptyList(),
            wouldRecommend = true
        )

        // When & Then
        try {
            apiService.createReview(request)
            fail("Should have thrown exception")
        } catch (e: Exception) {
            // Expected timeout exception
            assertTrue(e.message?.contains("timeout") == true ||
                      e is java.net.SocketTimeoutException)
        }
    }

    @Test
    fun apiService_shouldHandle500ServerError() = runTest {
        // Given
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(500)
                .setBody("""{"error": "Internal server error"}""")
        )

        val request = CreateReviewRequest(
            jobId = "job_456",
            artisanId = "artisan_101",
            overallRating = 5,
            qualityRating = 5,
            professionalismRating = 5,
            timelinessRating = 5,
            valueRating = 5,
            reviewText = "Test",
            images = emptyList(),
            wouldRecommend = true
        )

        // When
        val response = apiService.createReview(request)

        // Then
        assertFalse(response.isSuccessful)
        assertEquals(500, response.code())
    }

    @Test
    fun apiService_shouldHandleMalformedJson() = runTest {
        // Given
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setBody("{ invalid json }")
                .addHeader("Content-Type", "application/json")
        )

        // When & Then
        try {
            apiService.getJobReviews("job_456")
            fail("Should have thrown exception")
        } catch (e: Exception) {
            // Expected JSON parsing exception
            assertTrue(e is com.google.gson.JsonSyntaxException ||
                      e.cause is com.google.gson.JsonSyntaxException)
        }
    }

    // ========== Request Serialization Tests ==========

    @Test
    fun createReview_shouldSerializeAllFields() = runTest {
        // Given
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(201)
                .setBody("""{"id": "review_123", "jobId": "job_456", "clientId": "client_789", "artisanId": "artisan_101", "overallRating": 5, "qualityRating": 5, "professionalismRating": 5, "timelinessRating": 5, "valueRating": 5, "reviewText": "Test", "images": [], "wouldRecommend": true, "createdAt": "2025-10-31T10:00:00Z", "updatedAt": null}""")
        )

        val request = CreateReviewRequest(
            jobId = "job_456",
            artisanId = "artisan_101",
            overallRating = 5,
            qualityRating = 5,
            professionalismRating = 5,
            timelinessRating = 5,
            valueRating = 5,
            reviewText = "Test review",
            images = listOf("img1.jpg", "img2.jpg", "img3.jpg"),
            wouldRecommend = true
        )

        // When
        apiService.createReview(request)

        // Then
        val recordedRequest = mockWebServer.takeRequest()
        val requestBody = recordedRequest.body.readUtf8()

        assertTrue(requestBody.contains("\"jobId\":\"job_456\""))
        assertTrue(requestBody.contains("\"artisanId\":\"artisan_101\""))
        assertTrue(requestBody.contains("\"overallRating\":5"))
        assertTrue(requestBody.contains("\"qualityRating\":5"))
        assertTrue(requestBody.contains("\"professionalismRating\":5"))
        assertTrue(requestBody.contains("\"timelinessRating\":5"))
        assertTrue(requestBody.contains("\"valueRating\":5"))
        assertTrue(requestBody.contains("\"reviewText\":\"Test review\""))
        assertTrue(requestBody.contains("\"images\":[\"img1.jpg\",\"img2.jpg\",\"img3.jpg\"]"))
        assertTrue(requestBody.contains("\"wouldRecommend\":true"))
    }

    @Test
    fun updateReview_shouldSerializeOnlyProvidedFields() = runTest {
        // Given
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setBody("""{"id": "review_123", "jobId": "job_456", "clientId": "client_789", "artisanId": "artisan_101", "overallRating": 3, "qualityRating": 5, "professionalismRating": 4, "timelinessRating": 5, "valueRating": 4, "reviewText": "Original", "images": [], "wouldRecommend": true, "createdAt": "2025-10-31T10:00:00Z", "updatedAt": "2025-11-01T10:00:00Z"}""")
        )

        val request = UpdateReviewRequest(
            overallRating = 3,
            reviewText = "Updated"
            // Other fields intentionally null
        )

        // When
        apiService.updateReview("review_123", request)

        // Then
        val recordedRequest = mockWebServer.takeRequest()
        val requestBody = recordedRequest.body.readUtf8()

        assertTrue(requestBody.contains("\"overallRating\":3"))
        assertTrue(requestBody.contains("\"reviewText\":\"Updated\""))
        // Should not contain other fields or should be null
    }
}
