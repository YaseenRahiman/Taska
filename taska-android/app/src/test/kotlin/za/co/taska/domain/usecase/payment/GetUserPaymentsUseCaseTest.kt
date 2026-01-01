package za.co.taska.domain.usecase.payment

import app.cash.turbine.test
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.mockito.kotlin.*
import za.co.taska.domain.model.Payment
import za.co.taska.domain.model.PaymentMethod
import za.co.taska.domain.model.PaymentStatus
import za.co.taska.domain.model.Resource
import za.co.taska.domain.repository.PaymentsRepository

/**
 * Unit tests for GetUserPaymentsUseCase
 * Tests validation logic and repository interaction
 *
 * Coverage target: >85%
 */
class GetUserPaymentsUseCaseTest {

    private lateinit var useCase: GetUserPaymentsUseCase
    private lateinit var repository: PaymentsRepository

    @Before
    fun setup() {
        repository = mock()
        useCase = GetUserPaymentsUseCase(repository)
    }

    // ========== Success Cases ==========

    @Test
    fun `invoke should return payments when inputs valid`() = runTest {
        // Given
        val payments = listOf(createTestPayment())
        whenever(repository.getUserPayments(any(), any(), any()))
            .thenReturn(flowOf(Resource.Success(payments)))

        // When & Then
        useCase(
            status = PaymentStatus.PROCESSING,
            page = 1,
            limit = 20
        ).test {
            val result = awaitItem()
            assertTrue(result is Resource.Success)
            assertEquals(1, (result as Resource.Success).data.size)
            awaitComplete()
        }

        // Verify repository called with lowercase status
        verify(repository).getUserPayments(
            status = "processing",
            page = 1,
            limit = 20
        )
    }

    @Test
    fun `invoke should handle null status filter`() = runTest {
        // Given
        val payments = listOf(
            createTestPayment(status = PaymentStatus.PROCESSING),
            createTestPayment(status = PaymentStatus.COMPLETED)
        )
        whenever(repository.getUserPayments(eq(null), eq(1), eq(20)))
            .thenReturn(flowOf(Resource.Success(payments)))

        // When & Then
        useCase(
            status = null,
            page = 1,
            limit = 20
        ).test {
            val result = awaitItem()
            assertTrue(result is Resource.Success)
            assertEquals(2, (result as Resource.Success).data.size)
            awaitComplete()
        }

        // Verify repository called with null status
        verify(repository).getUserPayments(
            status = null,
            page = 1,
            limit = 20
        )
    }

    @Test
    fun `invoke should use default pagination values`() = runTest {
        // Given
        whenever(repository.getUserPayments(eq(null), eq(1), eq(20)))
            .thenReturn(flowOf(Resource.Success(emptyList())))

        // When & Then
        useCase().test {
            awaitItem()
            awaitComplete()
        }

        // Verify defaults: page=1, limit=20
        verify(repository).getUserPayments(
            status = null,
            page = 1,
            limit = 20
        )
    }

    @Test
    fun `invoke should handle custom pagination`() = runTest {
        // Given
        whenever(repository.getUserPayments(eq(null), eq(3), eq(50)))
            .thenReturn(flowOf(Resource.Success(emptyList())))

        // When & Then
        useCase(
            status = null,
            page = 3,
            limit = 50
        ).test {
            awaitItem()
            awaitComplete()
        }

        // Verify custom values used
        verify(repository).getUserPayments(
            status = null,
            page = 3,
            limit = 50
        )
    }

    @Test
    fun `invoke should handle all payment statuses`() = runTest {
        // Given
        whenever(repository.getUserPayments(any(), any(), any()))
            .thenReturn(flowOf(Resource.Success(emptyList())))

        // Test all payment statuses
        val statuses = listOf(
            PaymentStatus.PENDING,
            PaymentStatus.PROCESSING,
            PaymentStatus.COMPLETED,
            PaymentStatus.FAILED,
            PaymentStatus.REFUNDED
        )

        for (status in statuses) {
            useCase(status = status, page = 1, limit = 20).test {
                awaitItem()
                awaitComplete()
            }
        }

        // Verify all status values converted to lowercase
        verify(repository).getUserPayments("pending", 1, 20)
        verify(repository).getUserPayments("processing", 1, 20)
        verify(repository).getUserPayments("completed", 1, 20)
        verify(repository).getUserPayments("failed", 1, 20)
        verify(repository).getUserPayments("refunded", 1, 20)
    }

    @Test
    fun `invoke should handle maximum limit of 100`() = runTest {
        // Given
        whenever(repository.getUserPayments(eq(null), eq(1), eq(100)))
            .thenReturn(flowOf(Resource.Success(emptyList())))

        // When & Then
        useCase(
            status = null,
            page = 1,
            limit = 100
        ).test {
            awaitItem()
            awaitComplete()
        }

        // Verify
        verify(repository).getUserPayments(null, 1, 100)
    }

    // ========== Validation Error Cases ==========

    @Test
    fun `invoke should fail when page is less than 1`() = runTest {
        // When & Then
        useCase(
            status = null,
            page = 0,
            limit = 20
        ).test {
            val result = awaitItem()
            assertTrue(result is Resource.Error)
            assertEquals("Page number must be at least 1", (result as Resource.Error).message)
            awaitComplete()
        }

        // Verify repository not called
        verify(repository, never()).getUserPayments(any(), any(), any())
    }

    @Test
    fun `invoke should fail when page is negative`() = runTest {
        // When & Then
        useCase(
            status = null,
            page = -1,
            limit = 20
        ).test {
            val result = awaitItem()
            assertTrue(result is Resource.Error)
            assertEquals("Page number must be at least 1", (result as Resource.Error).message)
            awaitComplete()
        }
    }

    @Test
    fun `invoke should fail when limit is less than 1`() = runTest {
        // When & Then
        useCase(
            status = null,
            page = 1,
            limit = 0
        ).test {
            val result = awaitItem()
            assertTrue(result is Resource.Error)
            assertEquals("Limit must be at least 1", (result as Resource.Error).message)
            awaitComplete()
        }
    }

    @Test
    fun `invoke should fail when limit is negative`() = runTest {
        // When & Then
        useCase(
            status = null,
            page = 1,
            limit = -10
        ).test {
            val result = awaitItem()
            assertTrue(result is Resource.Error)
            assertEquals("Limit must be at least 1", (result as Resource.Error).message)
            awaitComplete()
        }
    }

    @Test
    fun `invoke should fail when limit exceeds 100`() = runTest {
        // When & Then
        useCase(
            status = null,
            page = 1,
            limit = 101
        ).test {
            val result = awaitItem()
            assertTrue(result is Resource.Error)
            assertEquals("Maximum limit is 100 items per page", (result as Resource.Error).message)
            awaitComplete()
        }
    }

    // ========== Repository Response Handling ==========

    @Test
    fun `invoke should propagate Loading state from repository`() = runTest {
        // Given
        val payments = listOf(createTestPayment())
        whenever(repository.getUserPayments(eq(null), eq(1), eq(20)))
            .thenReturn(flowOf(
                Resource.Loading(),
                Resource.Success(payments)
            ))

        // When & Then
        useCase(page = 1, limit = 20).test {
            val loading = awaitItem()
            assertTrue(loading is Resource.Loading)

            val success = awaitItem()
            assertTrue(success is Resource.Success)

            awaitComplete()
        }
    }

    @Test
    fun `invoke should propagate Error state from repository`() = runTest {
        // Given
        whenever(repository.getUserPayments(eq(null), eq(1), eq(20)))
            .thenReturn(flowOf(Resource.Error("Network error")))

        // When & Then
        useCase(page = 1, limit = 20).test {
            val error = awaitItem()
            assertTrue(error is Resource.Error)
            assertEquals("Network error", (error as Resource.Error).message)
            awaitComplete()
        }
    }

    @Test
    fun `invoke should handle empty payment list`() = runTest {
        // Given
        whenever(repository.getUserPayments(eq(null), eq(1), eq(20)))
            .thenReturn(flowOf(Resource.Success(emptyList())))

        // When & Then
        useCase(page = 1, limit = 20).test {
            val result = awaitItem()
            assertTrue(result is Resource.Success)
            assertTrue((result as Resource.Success).data.isEmpty())
            awaitComplete()
        }
    }

    @Test
    fun `invoke should handle large payment list`() = runTest {
        // Given
        val largeList = (1..100).map { createTestPayment(id = "payment_$it") }
        whenever(repository.getUserPayments(eq(null), eq(1), eq(100)))
            .thenReturn(flowOf(Resource.Success(largeList)))

        // When & Then
        useCase(page = 1, limit = 100).test {
            val result = awaitItem()
            assertTrue(result is Resource.Success)
            assertEquals(100, (result as Resource.Success).data.size)
            awaitComplete()
        }
    }

    // ========== Edge Cases ==========

    @Test
    fun `invoke should handle boundary values`() = runTest {
        // Given - Setup mock for minimum values
        whenever(repository.getUserPayments(eq(null), eq(1), eq(1)))
            .thenReturn(flowOf(Resource.Success(emptyList())))

        // Setup mock for maximum values
        whenever(repository.getUserPayments(eq(null), eq(Int.MAX_VALUE), eq(100)))
            .thenReturn(flowOf(Resource.Success(emptyList())))

        // Minimum valid values
        useCase(page = 1, limit = 1).test {
            awaitItem()
            awaitComplete()
        }

        // Maximum valid values
        useCase(page = Int.MAX_VALUE, limit = 100).test {
            awaitItem()
            awaitComplete()
        }

        // Verify both calls succeeded
        verify(repository).getUserPayments(null, 1, 1)
        verify(repository).getUserPayments(null, Int.MAX_VALUE, 100)
    }

    // ========== Helper Methods ==========

    private fun createTestPayment(
        id: String = "payment_123",
        status: PaymentStatus = PaymentStatus.PROCESSING
    ) = Payment(
        id = id,
        jobId = "job_456",
        clientId = "client_789",
        artisanId = "artisan_101",
        bidId = "bid_112",
        amount = 1000.0,
        platformFee = 100.0,
        totalAmount = 1150.0,
        paymentMethod = PaymentMethod.CREDIT_CARD,
        status = status,
        transactionId = "txn_xyz",
        receiptUrl = null,
        createdAt = "2025-10-31T10:00:00Z",
        completedAt = null
    )
}
