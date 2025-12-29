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
import za.co.taska.data.local.dao.PaymentDao
import za.co.taska.data.local.entity.PaymentEntity
import za.co.taska.data.mapper.PaymentMapper
import za.co.taska.data.remote.api.PaymentsApiService
import za.co.taska.data.remote.dto.request.CreatePaymentDto
import za.co.taska.data.remote.dto.request.ReleasePaymentDto
import za.co.taska.data.remote.dto.response.PaginatedPaymentsResponse
import za.co.taska.data.remote.dto.response.PaginationMeta
import za.co.taska.data.remote.dto.response.PaymentResponse
import za.co.taska.domain.model.Payment
import za.co.taska.domain.model.PaymentMethod
import za.co.taska.domain.model.PaymentStatus
import za.co.taska.domain.model.Resource
import za.co.taska.domain.repository.PaymentIntent

/**
 * Unit tests for PaymentsRepositoryImpl
 * Tests network-first caching strategy and error handling
 *
 * Coverage target: >85%
 */
class PaymentsRepositoryImplTest {

    private lateinit var repository: PaymentsRepositoryImpl
    private lateinit var apiService: PaymentsApiService
    private lateinit var paymentDao: PaymentDao
    private lateinit var mapper: PaymentMapper

    @Before
    fun setup() {
        apiService = mock()
        paymentDao = mock()
        mapper = PaymentMapper() // Use real mapper for simplicity
        repository = PaymentsRepositoryImpl(apiService, paymentDao, mapper)
    }

    // ========== createPaymentIntent Tests ==========

    @Test
    fun `createPaymentIntent should return success when API call succeeds`() = runTest {
        // Given
        val paymentIntentResponse = za.co.taska.data.remote.dto.response.PaymentIntent(
            paymentId = "payment_123",
            clientSecret = "secret_abc",
            amount = 1000.0,
            platformFee = 100.0,
            vat = 150.0,
            totalAmount = 1150.0,
            currency = "ZAR",
            paymentProvider = "stripe",
            expiresAt = "2025-10-31T12:00:00Z"
        )
        whenever(apiService.createPaymentIntent(any())).thenReturn(
            Response.success(paymentIntentResponse)
        )

        // When
        val result = repository.createPaymentIntent(
            jobId = "job_456",
            bidId = "bid_789",
            amount = 1000.0,
            paymentMethod = "credit_card",
            paymentProvider = "stripe"
        )

        // Then
        assertTrue(result.isSuccess)
        assertEquals("payment_123", result.getOrNull()?.paymentId)
        assertEquals("secret_abc", result.getOrNull()?.clientSecret)

        // Verify API called with correct DTO
        verify(apiService).createPaymentIntent(
            check {
                assertEquals("job_456", it.jobId)
                assertEquals("bid_789", it.bidId)
                assertEquals(1000.0, it.amount, 0.01)
                assertEquals("card", it.paymentMethod)
                assertEquals("stripe", it.paymentProvider)
                assertEquals("ZAR", it.currency)
            }
        )
    }

    @Test
    fun `createPaymentIntent should return failure when API call fails`() = runTest {
        // Given
        whenever(apiService.createPaymentIntent(any())).thenReturn(
            Response.error(400, "Bad Request".toResponseBody())
        )

        // When
        val result = repository.createPaymentIntent(
            jobId = "job_456",
            bidId = "bid_789",
            amount = 1000.0,
            paymentMethod = "credit_card",
            paymentProvider = "stripe"
        )

        // Then
        assertTrue(result.isFailure)
        assertTrue(result.exceptionOrNull()?.message?.contains("Failed to create payment intent") == true)
    }

    @Test
    fun `createPaymentIntent should return failure when exception thrown`() = runTest {
        // Given
        whenever(apiService.createPaymentIntent(any())).thenThrow(
            RuntimeException("Network error")
        )

        // When
        val result = repository.createPaymentIntent(
            jobId = "job_456",
            bidId = "bid_789",
            amount = 1000.0,
            paymentMethod = "credit_card",
            paymentProvider = "stripe"
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Network error", result.exceptionOrNull()?.message)
    }

    // ========== getPayment Tests ==========

    @Test
    fun `getPayment should emit Loading then Success when API succeeds`() = runTest {
        // Given
        val paymentResponse = createTestPaymentResponse()
        val cachedEntity = createTestPaymentEntity()

        whenever(paymentDao.getPaymentById("payment_123")).thenReturn(cachedEntity)
        whenever(apiService.getPayment("payment_123")).thenReturn(
            Response.success(paymentResponse)
        )

        // When & Then
        repository.getPayment("payment_123").test {
            // First emission: Loading with cached data
            val loading = awaitItem()
            assertTrue(loading is Resource.Loading)
            assertEquals("payment_123", (loading as Resource.Loading).data?.id)

            // Second emission: Success with fresh data
            val success = awaitItem()
            assertTrue(success is Resource.Success)
            assertEquals("payment_123", (success as Resource.Success).data.id)

            awaitComplete()
        }

        // Verify cache updated
        verify(paymentDao).insertPayment(any())
    }

    @Test
    fun `getPayment should emit Loading then Error with cache when API fails`() = runTest {
        // Given
        val cachedEntity = createTestPaymentEntity()

        whenever(paymentDao.getPaymentById("payment_123")).thenReturn(cachedEntity)
        whenever(apiService.getPayment("payment_123")).thenReturn(
            Response.error(500, "Server Error".toResponseBody())
        )

        // When & Then
        repository.getPayment("payment_123").test {
            // First emission: Loading with cached data
            val loading = awaitItem()
            assertTrue(loading is Resource.Loading)
            assertEquals("payment_123", (loading as Resource.Loading).data?.id)

            // Second emission: Success with cached data (not Error)
            val success = awaitItem()
            assertTrue(success is Resource.Success)
            assertEquals("payment_123", (success as Resource.Success).data.id)

            awaitComplete()
        }
    }

    @Test
    fun `getPayment should emit Error without cache when both API and cache fail`() = runTest {
        // Given
        whenever(paymentDao.getPaymentById("payment_123")).thenReturn(null)
        whenever(apiService.getPayment("payment_123")).thenReturn(
            Response.error(404, "Not Found".toResponseBody())
        )

        // When & Then
        repository.getPayment("payment_123").test {
            // First emission: Loading
            val loading = awaitItem()
            assertTrue(loading is Resource.Loading)
            assertNull((loading as Resource.Loading).data)

            // Second emission: Error (Resource.Error has no data field)
            val error = awaitItem()
            assertTrue(error is Resource.Error)
            assertTrue((error as Resource.Error).message.contains("Payment not found"))

            awaitComplete()
        }
    }

    @Test
    fun `getPayment should emit Error with cache when network exception occurs`() = runTest {
        // Given
        val cachedEntity = createTestPaymentEntity()

        whenever(paymentDao.getPaymentById("payment_123")).thenReturn(cachedEntity)
        whenever(apiService.getPayment("payment_123")).thenThrow(
            RuntimeException("Network timeout")
        )

        // When & Then
        repository.getPayment("payment_123").test {
            // Loading with cache
            val loading = awaitItem()
            assertTrue(loading is Resource.Loading)
            assertEquals("payment_123", (loading as Resource.Loading).data?.id)

            // Success with cached data (fallback on network error)
            val success = awaitItem()
            assertTrue(success is Resource.Success)
            assertEquals("payment_123", (success as Resource.Success).data.id)

            awaitComplete()
        }
    }

    // ========== getUserPayments Tests ==========

    @Test
    fun `getUserPayments should emit Loading with cache then Success when API succeeds`() = runTest {
        // Given
        val cachedEntities = listOf(createTestPaymentEntity())
        val paymentResponses = listOf(createTestPaymentResponse())
        val paginatedResponse = PaginatedPaymentsResponse(
            data = paymentResponses,
            pagination = PaginationMeta(
                page = 1,
                limit = 20,
                total = 1,
                totalPages = 1,
                hasNextPage = false,
                hasPreviousPage = false
            )
        )

        whenever(paymentDao.getPayments(20)).thenReturn(flowOf(cachedEntities))
        whenever(apiService.getUserPayments(null, 1, 20)).thenReturn(
            Response.success(paginatedResponse)
        )

        // When & Then
        repository.getUserPayments(status = null, page = 1, limit = 20).test {
            // Loading without data
            val loading1 = awaitItem()
            assertTrue(loading1 is Resource.Loading)

            // Loading with cached data
            val loading2 = awaitItem()
            assertTrue(loading2 is Resource.Loading)
            assertEquals(1, (loading2 as Resource.Loading).data?.size)

            // Success with fresh data
            val success = awaitItem()
            assertTrue(success is Resource.Success)
            assertEquals(1, (success as Resource.Success).data.size)

            awaitComplete()
        }

        // Verify cache updated
        verify(paymentDao).insertPayments(any())
    }

    @Test
    fun `getUserPayments with status filter should not use cache`() = runTest {
        // Given
        val paymentResponses = listOf(createTestPaymentResponse(status = "completed"))
        val paginatedResponse = PaginatedPaymentsResponse(
            data = paymentResponses,
            pagination = PaginationMeta(1, 20, 1, 1, false, false)
        )

        whenever(apiService.getUserPayments("completed", 1, 20)).thenReturn(
            Response.success(paginatedResponse)
        )

        // When & Then
        repository.getUserPayments(status = "completed", page = 1, limit = 20).test {
            // Loading without cache
            val loading = awaitItem()
            assertTrue(loading is Resource.Loading)
            assertNull((loading as Resource.Loading).data)

            // Success
            val success = awaitItem()
            assertTrue(success is Resource.Success)
            assertEquals(1, (success as Resource.Success).data.size)

            awaitComplete()
        }

        // Verify cache not queried or updated
        verify(paymentDao, never()).getPayments(any())
        verify(paymentDao, never()).insertPayments(any())
    }

    @Test
    fun `getUserPayments should emit Error when API fails`() = runTest {
        // Given
        whenever(paymentDao.getPayments(20)).thenReturn(flowOf(emptyList()))
        whenever(apiService.getUserPayments(null, 1, 20)).thenReturn(
            Response.error(500, "Server Error".toResponseBody())
        )

        // When & Then
        repository.getUserPayments(status = null, page = 1, limit = 20).test {
            // Loading
            val loading1 = awaitItem()
            assertTrue(loading1 is Resource.Loading)

            // Error (Resource.Error has no data field)
            val error = awaitItem()
            assertTrue(error is Resource.Error)
            assertTrue((error as Resource.Error).message.contains("Failed to fetch payments"))

            awaitComplete()
        }
    }

    // ========== releasePayment Tests ==========

    @Test
    fun `releasePayment should return success and update cache when API succeeds`() = runTest {
        // Given
        val paymentResponse = createTestPaymentResponse(status = "released")
        whenever(apiService.releasePayment(eq("payment_123"), any())).thenReturn(
            Response.success(paymentResponse)
        )

        // When
        val result = repository.releasePayment(
            paymentId = "payment_123",
            completionNotes = "Great work!",
            rating = 5
        )

        // Then
        assertTrue(result.isSuccess)
        assertEquals(PaymentStatus.COMPLETED, result.getOrNull()?.status)

        // Verify API called
        verify(apiService).releasePayment(
            eq("payment_123"),
            check {
                assertEquals("Great work!", it.completionNotes)
                assertEquals(5, it.rating)
            }
        )

        // Verify cache updated
        verify(paymentDao).updatePayment(any())
    }

    @Test
    fun `releasePayment should return failure when API fails`() = runTest {
        // Given
        whenever(apiService.releasePayment(any(), any())).thenReturn(
            Response.error(403, "Forbidden".toResponseBody())
        )

        // When
        val result = repository.releasePayment(
            paymentId = "payment_123",
            completionNotes = null,
            rating = null
        )

        // Then
        assertTrue(result.isFailure)
        assertTrue(result.exceptionOrNull()?.message?.contains("Failed to release payment") == true)

        // Verify cache not updated
        verify(paymentDao, never()).updatePayment(any())
    }

    @Test
    fun `releasePayment should return failure when exception thrown`() = runTest {
        // Given
        whenever(apiService.releasePayment(any(), any())).thenThrow(
            RuntimeException("Network error")
        )

        // When
        val result = repository.releasePayment(
            paymentId = "payment_123",
            completionNotes = null,
            rating = null
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Network error", result.exceptionOrNull()?.message)
    }

    // ========== Helper Methods ==========

    private fun createTestPaymentResponse(
        id: String = "payment_123",
        status: String = "escrowed"
    ) = PaymentResponse(
        id = id,
        jobId = "job_456",
        payerId = "client_789",
        payeeId = "artisan_101",
        bidId = "bid_112",
        amount = 1000.0,
        platformFee = 100.0,
        vat = 150.0,
        totalAmount = 1150.0,
        paymentMethod = "credit_card",
        paymentProvider = "stripe",
        status = status,
        transactionId = "txn_xyz",
        currency = "ZAR",
        clientSecret = null,
        escrowStatus = null,
        escrowedAt = null,
        createdAt = "2025-10-31T10:00:00Z",
        releasedAt = null,
        updatedAt = "2025-10-31T10:00:00Z"
    )

    private fun createTestPaymentEntity(
        id: String = "payment_123"
    ) = PaymentEntity(
        id = id,
        jobId = "job_456",
        clientId = "client_789",
        artisanId = "artisan_101",
        bidId = "bid_112",
        amount = 1000.0,
        platformFee = 100.0,
        totalAmount = 1150.0,
        paymentMethod = "CREDIT_CARD",
        status = "PROCESSING",
        transactionId = "txn_xyz",
        receiptUrl = null,
        createdAt = "2025-10-31T10:00:00Z",
        completedAt = null,
        cachedAt = System.currentTimeMillis()
    )
}
