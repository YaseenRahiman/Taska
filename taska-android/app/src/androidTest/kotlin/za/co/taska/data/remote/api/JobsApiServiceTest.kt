package za.co.taska.data.remote.api

import kotlinx.coroutines.test.runTest
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import za.co.taska.data.remote.dto.request.AddressDto
import za.co.taska.data.remote.dto.request.CreateJobRequest
import za.co.taska.data.remote.dto.request.UpdateJobRequest
import java.util.concurrent.TimeUnit

/**
 * Integration tests for JobsApiService using MockWebServer
 * Tests all 8 new client-focused job endpoints with request/response serialization
 *
 * Coverage target: >70%
 */
class JobsApiServiceTest {

    private lateinit var mockWebServer: MockWebServer
    private lateinit var apiService: JobsApiService

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
            .create(JobsApiService::class.java)
    }

    @After
    fun teardown() {
        mockWebServer.shutdown()
    }

    // ========== createJob Tests ==========

    @Test
    fun createJob_shouldReturnSuccess_whenApiReturns201() = runTest {
        // Given
        val responseBody = """
            {
                "id": "job_123",
                "clientId": "client_456",
                "categoryId": "cat_789",
                "title": "Need plumbing repair",
                "description": "Kitchen sink leaking",
                "budget": 500.0,
                "budgetType": "FIXED",
                "urgency": "HIGH",
                "status": "DRAFT",
                "addressLine1": "123 Main St",
                "addressLine2": null,
                "city": "Cape Town",
                "province": "Western Cape",
                "postalCode": "8001",
                "latitude": -33.9249,
                "longitude": 18.4241,
                "images": ["img1.jpg"],
                "requirements": ["Licensed plumber"],
                "startDate": null,
                "endDate": null,
                "createdAt": "2025-10-31T10:00:00Z"
            }
        """.trimIndent()

        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(201)
                .setBody(responseBody)
                .addHeader("Content-Type", "application/json")
        )

        val request = CreateJobRequest(
            categoryId = "cat_789",
            title = "Need plumbing repair",
            description = "Kitchen sink leaking",
            budget = 500.0,
            budgetType = "FIXED",
            urgency = "HIGH",
            address = AddressDto(
                addressLine1 = "123 Main St",
                addressLine2 = null,
                city = "Cape Town",
                province = "Western Cape",
                postalCode = "8001",
                latitude = -33.9249,
                longitude = 18.4241
            ),
            images = listOf("img1.jpg"),
            requirements = listOf("Licensed plumber"),
            startDate = null,
            endDate = null
        )

        // When
        val response = apiService.createJob(request)

        // Then
        assertTrue(response.isSuccessful)
        assertNotNull(response.body())
        assertEquals("job_123", response.body()?.id)
        assertEquals("cat_789", response.body()?.categoryId)
        assertEquals("Need plumbing repair", response.body()?.title)
        assertEquals(500.0, response.body()?.budget, 0.01)
        assertEquals("DRAFT", response.body()?.status)

        // Verify request
        val recordedRequest = mockWebServer.takeRequest()
        assertEquals("POST", recordedRequest.method)
        assertTrue(recordedRequest.path?.contains("/jobs") == true)
        assertTrue(recordedRequest.body.readUtf8().contains("Need plumbing repair"))
    }

    @Test
    fun createJob_shouldReturnError_whenApiReturns400() = runTest {
        // Given
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(400)
                .setBody("{\"error\": \"Validation failed\"}")
        )

        val request = CreateJobRequest(
            categoryId = "cat_123",
            title = "Short",
            description = "Too short",
            budget = 100.0,
            budgetType = "FIXED",
            urgency = "HIGH",
            address = AddressDto(
                addressLine1 = "123 Main St",
                addressLine2 = null,
                city = "Cape Town",
                province = "Western Cape",
                postalCode = "8001",
                latitude = -33.9249,
                longitude = 18.4241
            )
        )

        // When
        val response = apiService.createJob(request)

        // Then
        assertFalse(response.isSuccessful)
        assertEquals(400, response.code())
    }

    // ========== updateJob Tests ==========

    @Test
    fun updateJob_shouldReturnSuccess_whenApiReturns200() = runTest {
        // Given
        val responseBody = """
            {
                "id": "job_123",
                "clientId": "client_456",
                "categoryId": "cat_789",
                "title": "Updated job title",
                "description": "Updated description",
                "budget": 750.0,
                "budgetType": "HOURLY",
                "urgency": "MEDIUM",
                "status": "DRAFT",
                "addressLine1": "123 Main St",
                "city": "Cape Town",
                "province": "Western Cape",
                "postalCode": "8001",
                "latitude": -33.9249,
                "longitude": 18.4241,
                "images": [],
                "requirements": [],
                "createdAt": "2025-10-31T10:00:00Z"
            }
        """.trimIndent()

        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setBody(responseBody)
                .addHeader("Content-Type", "application/json")
        )

        val request = UpdateJobRequest(
            title = "Updated job title",
            budget = 750.0,
            urgency = "MEDIUM"
        )

        // When
        val response = apiService.updateJob("job_123", request)

        // Then
        assertTrue(response.isSuccessful)
        assertNotNull(response.body())
        assertEquals("job_123", response.body()?.id)
        assertEquals("Updated job title", response.body()?.title)
        assertEquals(750.0, response.body()?.budget, 0.01)

        // Verify request
        val recordedRequest = mockWebServer.takeRequest()
        assertEquals("PATCH", recordedRequest.method)
        assertTrue(recordedRequest.path?.contains("/jobs/job_123") == true)
    }

    @Test
    fun updateJob_shouldReturnError_whenJobNotFound() = runTest {
        // Given
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(404)
                .setBody("{\"error\": \"Job not found\"}")
        )

        val request = UpdateJobRequest(title = "Updated title")

        // When
        val response = apiService.updateJob("non_existent", request)

        // Then
        assertFalse(response.isSuccessful)
        assertEquals(404, response.code())
    }

    // ========== deleteJob Tests ==========

    @Test
    fun deleteJob_shouldReturnSuccess_whenApiReturns204() = runTest {
        // Given
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(204)
        )

        // When
        val response = apiService.deleteJob("job_123")

        // Then
        assertTrue(response.isSuccessful)
        assertEquals(204, response.code())

        // Verify request
        val recordedRequest = mockWebServer.takeRequest()
        assertEquals("DELETE", recordedRequest.method)
        assertTrue(recordedRequest.path?.contains("/jobs/job_123") == true)
    }

    @Test
    fun deleteJob_shouldReturnError_whenApiReturns403() = runTest {
        // Given
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(403)
                .setBody("{\"error\": \"Cannot delete active job\"}")
        )

        // When
        val response = apiService.deleteJob("active_job_123")

        // Then
        assertFalse(response.isSuccessful)
        assertEquals(403, response.code())
    }

    // ========== cancelJob Tests ==========

    @Test
    fun cancelJob_shouldReturnSuccess_whenApiReturns200() = runTest {
        // Given
        val responseBody = """
            {
                "id": "job_123",
                "clientId": "client_456",
                "categoryId": "cat_789",
                "title": "Test job",
                "description": "Test description",
                "budget": 500.0,
                "budgetType": "FIXED",
                "urgency": "HIGH",
                "status": "CANCELLED",
                "addressLine1": "123 Main St",
                "city": "Cape Town",
                "province": "Western Cape",
                "postalCode": "8001",
                "latitude": -33.9249,
                "longitude": 18.4241,
                "images": [],
                "requirements": [],
                "createdAt": "2025-10-31T10:00:00Z"
            }
        """.trimIndent()

        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setBody(responseBody)
                .addHeader("Content-Type", "application/json")
        )

        // When
        val response = apiService.cancelJob("job_123")

        // Then
        assertTrue(response.isSuccessful)
        assertNotNull(response.body())
        assertEquals("job_123", response.body()?.id)
        assertEquals("CANCELLED", response.body()?.status)

        // Verify request
        val recordedRequest = mockWebServer.takeRequest()
        assertEquals("PUT", recordedRequest.method)
        assertTrue(recordedRequest.path?.contains("/jobs/job_123/cancel") == true)
    }

    @Test
    fun cancelJob_shouldReturnError_whenInvalidState() = runTest {
        // Given
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(400)
                .setBody("{\"error\": \"Cannot cancel completed job\"}")
        )

        // When
        val response = apiService.cancelJob("completed_job")

        // Then
        assertFalse(response.isSuccessful)
        assertEquals(400, response.code())
    }

    // ========== completeJob Tests ==========

    @Test
    fun completeJob_shouldReturnSuccess_whenApiReturns200() = runTest {
        // Given
        val responseBody = """
            {
                "id": "job_123",
                "clientId": "client_456",
                "categoryId": "cat_789",
                "title": "Test job",
                "description": "Test description",
                "budget": 500.0,
                "budgetType": "FIXED",
                "urgency": "HIGH",
                "status": "COMPLETED",
                "addressLine1": "123 Main St",
                "city": "Cape Town",
                "province": "Western Cape",
                "postalCode": "8001",
                "latitude": -33.9249,
                "longitude": 18.4241,
                "images": [],
                "requirements": [],
                "createdAt": "2025-10-31T10:00:00Z"
            }
        """.trimIndent()

        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setBody(responseBody)
                .addHeader("Content-Type", "application/json")
        )

        // When
        val response = apiService.completeJob("job_123")

        // Then
        assertTrue(response.isSuccessful)
        assertNotNull(response.body())
        assertEquals("job_123", response.body()?.id)
        assertEquals("COMPLETED", response.body()?.status)

        // Verify request
        val recordedRequest = mockWebServer.takeRequest()
        assertEquals("PUT", recordedRequest.method)
        assertTrue(recordedRequest.path?.contains("/jobs/job_123/complete") == true)
    }

    @Test
    fun completeJob_shouldReturnError_whenJobNotFound() = runTest {
        // Given
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(404)
                .setBody("{\"error\": \"Job not found\"}")
        )

        // When
        val response = apiService.completeJob("non_existent")

        // Then
        assertFalse(response.isSuccessful)
        assertEquals(404, response.code())
    }

    // ========== uploadJobImage Tests ==========

    @Test
    fun uploadJobImage_shouldReturnSuccess_whenApiReturns200() = runTest {
        // Given
        val responseBody = """
            {
                "imageUrl": "https://example.com/uploads/image123.jpg"
            }
        """.trimIndent()

        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setBody(responseBody)
                .addHeader("Content-Type", "application/json")
        )

        // Create multipart file
        val fileContent = "fake image content".toByteArray()
        val requestBody = fileContent.toRequestBody("image/jpeg".toMediaTypeOrNull())
        val multipartBody = MultipartBody.Part.createFormData("image", "test.jpg", requestBody)

        // When
        val response = apiService.uploadJobImage(multipartBody)

        // Then
        assertTrue(response.isSuccessful)
        assertNotNull(response.body())
        assertEquals("https://example.com/uploads/image123.jpg", response.body()?.imageUrl)

        // Verify request
        val recordedRequest = mockWebServer.takeRequest()
        assertEquals("POST", recordedRequest.method)
        assertTrue(recordedRequest.path?.contains("/jobs/upload-image") == true)
        assertTrue(recordedRequest.headers["Content-Type"]?.contains("multipart/form-data") == true)
    }

    @Test
    fun uploadJobImage_shouldReturnError_whenFileTooLarge() = runTest {
        // Given
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(400)
                .setBody("{\"error\": \"File size exceeds 10MB limit\"}")
        )

        val fileContent = "fake image content".toByteArray()
        val requestBody = fileContent.toRequestBody("image/jpeg".toMediaTypeOrNull())
        val multipartBody = MultipartBody.Part.createFormData("image", "large.jpg", requestBody)

        // When
        val response = apiService.uploadJobImage(multipartBody)

        // Then
        assertFalse(response.isSuccessful)
        assertEquals(400, response.code())
    }

    // ========== uploadJobImages Tests ==========

    @Test
    fun uploadJobImages_shouldReturnSuccess_whenApiReturns200() = runTest {
        // Given
        val responseBody = """
            {
                "imageUrls": [
                    "https://example.com/uploads/image1.jpg",
                    "https://example.com/uploads/image2.jpg",
                    "https://example.com/uploads/image3.jpg"
                ]
            }
        """.trimIndent()

        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setBody(responseBody)
                .addHeader("Content-Type", "application/json")
        )

        // Create multipart files
        val multipartBodies = (1..3).map { i ->
            val fileContent = "fake image content $i".toByteArray()
            val requestBody = fileContent.toRequestBody("image/jpeg".toMediaTypeOrNull())
            MultipartBody.Part.createFormData("images", "test$i.jpg", requestBody)
        }

        // When
        val response = apiService.uploadJobImages(multipartBodies)

        // Then
        assertTrue(response.isSuccessful)
        assertNotNull(response.body())
        assertEquals(3, response.body()?.imageUrls?.size)
        assertTrue(response.body()?.imageUrls?.get(0)?.contains("image1.jpg") == true)

        // Verify request
        val recordedRequest = mockWebServer.takeRequest()
        assertEquals("POST", recordedRequest.method)
        assertTrue(recordedRequest.path?.contains("/jobs/upload-images") == true)
        assertTrue(recordedRequest.headers["Content-Type"]?.contains("multipart/form-data") == true)
    }

    @Test
    fun uploadJobImages_shouldReturnError_whenTooManyFiles() = runTest {
        // Given
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(400)
                .setBody("{\"error\": \"Maximum 5 images allowed\"}")
        )

        // Create 6 multipart files
        val multipartBodies = (1..6).map { i ->
            val fileContent = "fake image content $i".toByteArray()
            val requestBody = fileContent.toRequestBody("image/jpeg".toMediaTypeOrNull())
            MultipartBody.Part.createFormData("images", "test$i.jpg", requestBody)
        }

        // When
        val response = apiService.uploadJobImages(multipartBodies)

        // Then
        assertFalse(response.isSuccessful)
        assertEquals(400, response.code())
    }

    // ========== getMyJobs Tests ==========

    @Test
    fun getMyJobs_shouldReturnSuccess_whenApiReturns200() = runTest {
        // Given
        val responseBody = """
            {
                "jobs": [
                    {
                        "id": "job_1",
                        "clientId": "client_456",
                        "categoryId": "cat_789",
                        "title": "Job 1",
                        "description": "Description 1",
                        "budget": 500.0,
                        "budgetType": "FIXED",
                        "urgency": "HIGH",
                        "status": "ACTIVE",
                        "addressLine1": "123 Main St",
                        "city": "Cape Town",
                        "province": "Western Cape",
                        "postalCode": "8001",
                        "latitude": -33.9249,
                        "longitude": 18.4241,
                        "images": [],
                        "requirements": [],
                        "createdAt": "2025-10-31T10:00:00Z"
                    },
                    {
                        "id": "job_2",
                        "clientId": "client_456",
                        "categoryId": "cat_789",
                        "title": "Job 2",
                        "description": "Description 2",
                        "budget": 300.0,
                        "budgetType": "HOURLY",
                        "urgency": "LOW",
                        "status": "DRAFT",
                        "addressLine1": "456 Oak Ave",
                        "city": "Johannesburg",
                        "province": "Gauteng",
                        "postalCode": "2000",
                        "latitude": -26.2041,
                        "longitude": 28.0473,
                        "images": [],
                        "requirements": [],
                        "createdAt": "2025-10-31T11:00:00Z"
                    }
                ],
                "pagination": {
                    "currentPage": 1,
                    "totalPages": 1,
                    "totalItems": 2,
                    "itemsPerPage": 20
                }
            }
        """.trimIndent()

        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setBody(responseBody)
                .addHeader("Content-Type", "application/json")
        )

        // When
        val response = apiService.getMyJobs()

        // Then
        assertTrue(response.isSuccessful)
        assertNotNull(response.body())
        assertEquals(2, response.body()?.jobs?.size)
        assertEquals("job_1", response.body()?.jobs?.get(0)?.id)
        assertEquals("ACTIVE", response.body()?.jobs?.get(0)?.status)
        assertEquals(1, response.body()?.pagination?.currentPage)

        // Verify request
        val recordedRequest = mockWebServer.takeRequest()
        assertEquals("GET", recordedRequest.method)
        assertTrue(recordedRequest.path?.contains("/jobs/my-jobs") == true)
    }

    @Test
    fun getMyJobs_shouldIncludeQueryParameters_whenProvided() = runTest {
        // Given
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setBody("{\"jobs\": [], \"pagination\": {\"currentPage\": 2, \"totalPages\": 5}}")
        )

        // When
        val response = apiService.getMyJobs(status = "ACTIVE", page = 2, limit = 10)

        // Then
        assertTrue(response.isSuccessful)

        // Verify request
        val recordedRequest = mockWebServer.takeRequest()
        val path = recordedRequest.path
        assertTrue(path?.contains("status=ACTIVE") == true)
        assertTrue(path?.contains("page=2") == true)
        assertTrue(path?.contains("limit=10") == true)
    }

    @Test
    fun getMyJobs_shouldReturnError_whenServerError() = runTest {
        // Given
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(500)
                .setBody("{\"error\": \"Internal server error\"}")
        )

        // When
        val response = apiService.getMyJobs()

        // Then
        assertFalse(response.isSuccessful)
        assertEquals(500, response.code())
    }
}
