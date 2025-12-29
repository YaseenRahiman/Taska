package za.co.taska.data.remote.api

import androidx.test.ext.junit.runners.AndroidJUnit4
import kotlinx.coroutines.test.runTest
import okhttp3.OkHttpClient
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import za.co.taska.data.remote.dto.request.CreatePaymentDto
import za.co.taska.data.remote.dto.request.RefundPaymentDto
import za.co.taska.data.remote.dto.request.ReleasePaymentDto
import java.util.concurrent.TimeUnit

/**
 * Integration tests for PaymentsApiService
 * Tests Retrofit API service with MockWebServer
 *
 * Test count: 20 tests
 * Coverage target: >70%
 */
@RunWith(AndroidJUnit4::class)
class PaymentsApiServiceTest {

    private lateinit var mockWebServer: MockWebServer
    private lateinit var apiService: PaymentsApiService

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
            .create(PaymentsApiService::class.java)
    }

    @After
    fun teardown() {
        mockWebServer.shutdown()
    }

    // ========== createPaymentIntent Tests ==========

    @Test
    fun createPaymentIntent_shouldReturnPaymentIntent_whenSuccessful() = runTest {
        // Given
        val responseBody = """
            {
                "paymentId": "payment_123",
                "clientSecret": "secret_abc",
                "amount": 1000.0,
                "platformFee": 100.0,
                "vat": 150.0,
                "totalAmount": 1150.0,
                "currency": "ZAR",
                "paymentProvider": "stripe",
                "expiresAt": "2025-10-31T12:00:00Z"
            }
        """.trimIndent()

        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(201)
                .setBody(responseBody)
                .setHeader("Content-Type", "application/json")
        )

        val request = CreatePaymentDto(
            jobId = "job_456",
            bidId = "bid_789",
            amount = 1000.0,
            paymentMethod = "card",
            paymentProvider = "stripe",
            currency = "ZAR"
        )

        // When
        val response = apiService.createPaymentIntent(request)

        // Then
        assertTrue(response.isSuccessful)
        assertNotNull(response.body())
        assertEquals("payment_123", response.body()?.paymentId)
        assertEquals("secret_abc", response.body()?.clientSecret)
        assertEquals(1000.0, response.body()?.amount, 0.01)
        assertEquals(100.0, response.body()?.platformFee, 0.01)
        assertEquals(150.0, response.body()?.vat, 0.01)
        assertEquals(1150.0, response.body()?.totalAmount, 0.01)
        assertEquals("ZAR", response.body()?.currency)
        assertEquals("stripe", response.body()?.paymentProvider)

        // Verify request
        val recordedRequest = mockWebServer.takeRequest()
        assertEquals("POST", recordedRequest.method)
        assertEquals("/payments/create-intent", recordedRequest.path)
        assertTrue(recordedRequest.body.readUtf8().contains("job_456"))
        assertTrue(recordedRequest.body.readUtf8().contains("card"))
    }

    @Test
    fun createPaymentIntent_shouldReturnError_whenBadRequest() = runTest {
        // Given
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(400)
                .setBody("""{"error": "Invalid bid ID"}""")
        )

        val request = CreatePaymentDto(
            jobId = "job_456",
            bidId = "invalid",
            amount = 1000.0,
            paymentMethod = "card",
            paymentProvider = "stripe",
            currency = "ZAR"
        )

        // When
        val response = apiService.createPaymentIntent(request)

        // Then
        assertFalse(response.isSuccessful)
        assertEquals(400, response.code())
    }

    @Test
    fun createPaymentIntent_shouldHandlePayFastProvider() = runTest {
        // Given
        val responseBody = """
            {
                "paymentId": "payment_456",
                "clientSecret": "payfast_secret",
                "amount": 500.0,
                "platformFee": 50.0,
                "vat": 75.0,
                "totalAmount": 575.0,
                "currency": "ZAR",
                "paymentProvider": "payfast",
                "expiresAt": "2025-10-31T12:00:00Z"
            }
        """.trimIndent()

        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(201)
                .setBody(responseBody)
        )

        val request = CreatePaymentDto(
            jobId = "job_456",
            bidId = "bid_789",
            amount = 500.0,
            paymentMethod = "eft",
            paymentProvider = "payfast",
            currency = "ZAR"
        )

        // When
        val response = apiService.createPaymentIntent(request)

        // Then
        assertTrue(response.isSuccessful)
        assertEquals("payfast", response.body()?.paymentProvider)
    }

    // ========== getPayment Tests ==========

    @Test
    fun getPayment_shouldReturnPayment_whenSuccessful() = runTest {
        // Given
        val responseBody = """
            {
                "id": "payment_123",
                "jobId": "job_456",
                "payerId": "client_789",
                "payeeId": "artisan_101",
                "bidId": "bid_112",
                "amount": 1000.0,
                "platformFee": 100.0,
                "vat": 150.0,
                "totalAmount": 1150.0,
                "paymentMethod": "card",
                "paymentProvider": "stripe",
                "status": "escrowed",
                "transactionId": "txn_xyz",
                "createdAt": "2025-10-31T10:00:00Z",
                "releasedAt": null
            }
        """.trimIndent()

        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setBody(responseBody)
        )

        // When
        val response = apiService.getPayment("payment_123")

        // Then
        assertTrue(response.isSuccessful)
        assertNotNull(response.body())
        assertEquals("payment_123", response.body()?.id)
        assertEquals("job_456", response.body()?.jobId)
        assertEquals("escrowed", response.body()?.status)
        assertEquals(1000.0, response.body()?.amount, 0.01)

        // Verify request
        val recordedRequest = mockWebServer.takeRequest()
        assertEquals("GET", recordedRequest.method)
        assertEquals("/payments/payment_123", recordedRequest.path)
    }

    @Test
    fun getPayment_shouldReturn404_whenPaymentNotFound() = runTest {
        // Given
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(404)
                .setBody("""{"error": "Payment not found"}""")
        )

        // When
        val response = apiService.getPayment("nonexistent")

        // Then
        assertFalse(response.isSuccessful)
        assertEquals(404, response.code())
    }

    @Test
    fun getPayment_shouldHandleReleasedPayment() = runTest {
        // Given
        val responseBody = """
            {
                "id": "payment_123",
                "jobId": "job_456",
                "payerId": "client_789",
                "payeeId": "artisan_101",
                "bidId": "bid_112",
                "amount": 1000.0,
                "platformFee": 100.0,
                "vat": 150.0,
                "totalAmount": 1150.0,
                "paymentMethod": "card",
                "paymentProvider": "stripe",
                "status": "released",
                "transactionId": "txn_xyz",
                "createdAt": "2025-10-31T10:00:00Z",
                "releasedAt": "2025-11-01T15:00:00Z"
            }
        """.trimIndent()

        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setBody(responseBody)
        )

        // When
        val response = apiService.getPayment("payment_123")

        // Then
        assertTrue(response.isSuccessful)
        assertEquals("released", response.body()?.status)
        assertEquals("2025-11-01T15:00:00Z", response.body()?.releasedAt)
    }

    // ========== getUserPayments Tests ==========

    @Test
    fun getUserPayments_shouldReturnPaginatedList_whenSuccessful() = runTest {
        // Given
        val responseBody = """
            {
                "data": [
                    {
                        "id": "payment_1",
                        "jobId": "job_456",
                        "payerId": "client_789",
                        "payeeId": "artisan_101",
                        "bidId": "bid_112",
                        "amount": 1000.0,
                        "platformFee": 100.0,
                        "vat": 150.0,
                        "totalAmount": 1150.0,
                        "paymentMethod": "card",
                        "paymentProvider": "stripe",
                        "status": "escrowed",
                        "transactionId": "txn_1",
                        "createdAt": "2025-10-31T10:00:00Z",
                        "releasedAt": null
                    },
                    {
                        "id": "payment_2",
                        "jobId": "job_789",
                        "payerId": "client_789",
                        "payeeId": "artisan_202",
                        "bidId": "bid_223",
                        "amount": 2000.0,
                        "platformFee": 200.0,
                        "vat": 300.0,
                        "totalAmount": 2300.0,
                        "paymentMethod": "eft",
                        "paymentProvider": "payfast",
                        "status": "released",
                        "transactionId": "txn_2",
                        "createdAt": "2025-10-30T10:00:00Z",
                        "releasedAt": "2025-10-31T10:00:00Z"
                    }
                ],
                "pagination": {
                    "page": 1,
                    "limit": 20,
                    "total": 2,
                    "totalPages": 1,
                    "hasNextPage": false,
                    "hasPreviousPage": false
                }
            }
        """.trimIndent()

        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setBody(responseBody)
        )

        // When
        val response = apiService.getUserPayments(status = null, page = 1, limit = 20)

        // Then
        assertTrue(response.isSuccessful)
        assertNotNull(response.body())
        assertEquals(2, response.body()?.data?.size)
        assertEquals("payment_1", response.body()?.data?.get(0)?.id)
        assertEquals("payment_2", response.body()?.data?.get(1)?.id)

        // Verify pagination
        val pagination = response.body()?.pagination
        assertEquals(1, pagination?.page)
        assertEquals(20, pagination?.limit)
        assertEquals(2, pagination?.total)
        assertEquals(1, pagination?.totalPages)
        assertFalse(pagination?.hasNextPage ?: true)
        assertFalse(pagination?.hasPreviousPage ?: true)

        // Verify request
        val recordedRequest = mockWebServer.takeRequest()
        assertEquals("GET", recordedRequest.method)
        assertTrue(recordedRequest.path?.contains("page=1") ?: false)
        assertTrue(recordedRequest.path?.contains("limit=20") ?: false)
    }

    @Test
    fun getUserPayments_shouldIncludeStatusFilter_whenProvided() = runTest {
        // Given
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setBody("""{"data": [], "pagination": {"page": 1, "limit": 20, "total": 0, "totalPages": 0, "hasNextPage": false, "hasPreviousPage": false}}""")
        )

        // When
        apiService.getUserPayments(status = "escrowed", page = 1, limit = 20)

        // Then
        val recordedRequest = mockWebServer.takeRequest()
        assertTrue(recordedRequest.path?.contains("status=escrowed") ?: false)
    }

    @Test
    fun getUserPayments_shouldHandleEmptyList() = runTest {
        // Given
        val responseBody = """
            {
                "data": [],
                "pagination": {
                    "page": 1,
                    "limit": 20,
                    "total": 0,
                    "totalPages": 0,
                    "hasNextPage": false,
                    "hasPreviousPage": false
                }
            }
        """.trimIndent()

        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setBody(responseBody)
        )

        // When
        val response = apiService.getUserPayments(status = null, page = 1, limit = 20)

        // Then
        assertTrue(response.isSuccessful)
        assertTrue(response.body()?.data?.isEmpty() ?: false)
    }

    @Test
    fun getUserPayments_shouldHandlePagination() = runTest {
        // Given
        val responseBody = """
            {
                "data": [],
                "pagination": {
                    "page": 2,
                    "limit": 10,
                    "total": 25,
                    "totalPages": 3,
                    "hasNextPage": true,
                    "hasPreviousPage": true
                }
            }
        """.trimIndent()

        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setBody(responseBody)
        )

        // When
        val response = apiService.getUserPayments(status = null, page = 2, limit = 10)

        // Then
        assertTrue(response.isSuccessful)
        val pagination = response.body()?.pagination
        assertEquals(2, pagination?.page)
        assertEquals(10, pagination?.limit)
        assertEquals(25, pagination?.total)
        assertEquals(3, pagination?.totalPages)
        assertTrue(pagination?.hasNextPage ?: false)
        assertTrue(pagination?.hasPreviousPage ?: false)
    }

    // ========== releasePayment Tests ==========

    @Test
    fun releasePayment_shouldReturnUpdatedPayment_whenSuccessful() = runTest {
        // Given
        val responseBody = """
            {
                "id": "payment_123",
                "jobId": "job_456",
                "payerId": "client_789",
                "payeeId": "artisan_101",
                "bidId": "bid_112",
                "amount": 1000.0,
                "platformFee": 100.0,
                "vat": 150.0,
                "totalAmount": 1150.0,
                "paymentMethod": "card",
                "paymentProvider": "stripe",
                "status": "released",
                "transactionId": "txn_xyz",
                "createdAt": "2025-10-31T10:00:00Z",
                "releasedAt": "2025-11-01T15:00:00Z"
            }
        """.trimIndent()

        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setBody(responseBody)
        )

        val request = ReleasePaymentDto(
            completionNotes = "Great work!",
            rating = 5
        )

        // When
        val response = apiService.releasePayment("payment_123", request)

        // Then
        assertTrue(response.isSuccessful)
        assertNotNull(response.body())
        assertEquals("released", response.body()?.status)
        assertEquals("2025-11-01T15:00:00Z", response.body()?.releasedAt)

        // Verify request
        val recordedRequest = mockWebServer.takeRequest()
        assertEquals("POST", recordedRequest.method)
        assertEquals("/payments/payment_123/release", recordedRequest.path)
        val requestBody = recordedRequest.body.readUtf8()
        assertTrue(requestBody.contains("Great work!"))
        assertTrue(requestBody.contains("5"))
    }

    @Test
    fun releasePayment_shouldHandleNullOptionalFields() = runTest {
        // Given
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setBody("""{"id": "payment_123", "status": "released"}""")
        )

        val request = ReleasePaymentDto(
            completionNotes = null,
            rating = null
        )

        // When
        val response = apiService.releasePayment("payment_123", request)

        // Then
        assertTrue(response.isSuccessful)
    }

    @Test
    fun releasePayment_shouldReturn403_whenNotAuthorized() = runTest {
        // Given
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(403)
                .setBody("""{"error": "Only job owner can release payment"}""")
        )

        val request = ReleasePaymentDto(
            completionNotes = "Done",
            rating = 5
        )

        // When
        val response = apiService.releasePayment("payment_123", request)

        // Then
        assertFalse(response.isSuccessful)
        assertEquals(403, response.code())
    }

    @Test
    fun releasePayment_shouldReturn404_whenPaymentNotFound() = runTest {
        // Given
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(404)
                .setBody("""{"error": "Payment not found"}""")
        )

        val request = ReleasePaymentDto(
            completionNotes = null,
            rating = null
        )

        // When
        val response = apiService.releasePayment("nonexistent", request)

        // Then
        assertFalse(response.isSuccessful)
        assertEquals(404, response.code())
    }

    // ========== refundPayment Tests ==========

    @Test
    fun refundPayment_shouldReturnRefundedPayment_whenSuccessful() = runTest {
        // Given
        val responseBody = """
            {
                "id": "payment_123",
                "jobId": "job_456",
                "payerId": "client_789",
                "payeeId": "artisan_101",
                "bidId": "bid_112",
                "amount": 1000.0,
                "platformFee": 100.0,
                "vat": 150.0,
                "totalAmount": 1150.0,
                "paymentMethod": "card",
                "paymentProvider": "stripe",
                "status": "refunded",
                "transactionId": "txn_xyz",
                "createdAt": "2025-10-31T10:00:00Z",
                "releasedAt": null
            }
        """.trimIndent()

        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setBody(responseBody)
        )

        val request = RefundPaymentDto(
            amount = 1000.0,
            reason = "Customer requested full refund"
        )

        // When
        val response = apiService.refundPayment("payment_123", request)

        // Then
        assertTrue(response.isSuccessful)
        assertNotNull(response.body())
        assertEquals("payment_123", response.body()?.id)
        assertEquals("refunded", response.body()?.status)

        // Verify request
        val recordedRequest = mockWebServer.takeRequest()
        assertEquals("POST", recordedRequest.method)
        assertEquals("/payments/payment_123/refund", recordedRequest.path)
        val requestBody = recordedRequest.body.readUtf8()
        assertTrue(requestBody.contains("1000.0"))
        assertTrue(requestBody.contains("Customer requested full refund"))
    }

    @Test
    fun refundPayment_shouldReturn400_whenInvalidAmount() = runTest {
        // Given
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(400)
                .setBody("""{"error": "Invalid refund amount"}""")
        )

        val request = RefundPaymentDto(
            amount = -100.0,
            reason = "Invalid amount test"
        )

        // When
        val response = apiService.refundPayment("payment_123", request)

        // Then
        assertFalse(response.isSuccessful)
        assertEquals(400, response.code())
    }

    @Test
    fun refundPayment_shouldReturn403_whenNotAuthorized() = runTest {
        // Given
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(403)
                .setBody("""{"error": "Not authorized to refund this payment"}""")
        )

        val request = RefundPaymentDto(
            amount = 500.0,
            reason = "Unauthorized refund attempt"
        )

        // When
        val response = apiService.refundPayment("payment_123", request)

        // Then
        assertFalse(response.isSuccessful)
        assertEquals(403, response.code())
    }

    @Test
    fun refundPayment_shouldReturn404_whenPaymentNotFound() = runTest {
        // Given
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(404)
                .setBody("""{"error": "Payment not found"}""")
        )

        val request = RefundPaymentDto(
            amount = 1000.0,
            reason = "Refund for nonexistent payment"
        )

        // When
        val response = apiService.refundPayment("nonexistent", request)

        // Then
        assertFalse(response.isSuccessful)
        assertEquals(404, response.code())
    }

    // ========== Error Handling Tests ==========

    @Test
    fun allEndpoints_shouldHandleNetworkTimeout() = runTest {
        // Given - delay longer than timeout
        mockWebServer.enqueue(
            MockResponse()
                .setBodyDelay(2, TimeUnit.SECONDS)
        )

        val request = CreatePaymentDto(
            jobId = "job_456",
            bidId = "bid_789",
            amount = 1000.0,
            paymentMethod = "card",
            paymentProvider = "stripe",
            currency = "ZAR"
        )

        // When & Then
        try {
            apiService.createPaymentIntent(request)
            fail("Should have thrown timeout exception")
        } catch (e: Exception) {
            // Expected timeout exception
            assertTrue(e.message?.contains("timeout") ?: false)
        }
    }

    @Test
    fun allEndpoints_shouldHandle500ServerError() = runTest {
        // Given
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(500)
                .setBody("""{"error": "Internal server error"}""")
        )

        // When
        val response = apiService.getPayment("payment_123")

        // Then
        assertFalse(response.isSuccessful)
        assertEquals(500, response.code())
    }
}
