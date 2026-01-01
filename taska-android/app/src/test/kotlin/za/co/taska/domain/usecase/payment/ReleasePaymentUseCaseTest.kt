package za.co.taska.domain.usecase.payment

import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.mockito.kotlin.*
import za.co.taska.domain.model.Payment
import za.co.taska.domain.model.PaymentMethod
import za.co.taska.domain.model.PaymentStatus
import za.co.taska.domain.repository.PaymentsRepository

/**
 * Unit tests for ReleasePaymentUseCase
 * Tests validation logic and repository interaction
 *
 * Coverage target: >85%
 */
class ReleasePaymentUseCaseTest {

    private lateinit var useCase: ReleasePaymentUseCase
    private lateinit var repository: PaymentsRepository

    @Before
    fun setup() {
        repository = mock()
        useCase = ReleasePaymentUseCase(repository)
    }

    // ========== Success Cases ==========

    @Test
    fun `invoke should return success when inputs valid and repository succeeds`() = runTest {
        // Given
        val payment = createTestPayment(status = PaymentStatus.COMPLETED)
        whenever(repository.releasePayment(any(), any(), any()))
            .thenReturn(Result.success(payment))

        // When
        val result = useCase(
            paymentId = "payment_123",
            completionNotes = "Job completed perfectly",
            rating = 5
        )

        // Then
        assertTrue(result.isSuccess)
        assertEquals(PaymentStatus.COMPLETED, result.getOrNull()?.status)

        // Verify repository called
        verify(repository).releasePayment(
            paymentId = eq("payment_123"),
            completionNotes = eq("Job completed perfectly"),
            rating = eq(5)
        )
    }

    @Test
    fun `invoke should succeed with null completion notes and rating`() = runTest {
        // Given
        val payment = createTestPayment(status = PaymentStatus.COMPLETED)
        whenever(repository.releasePayment(any(), any(), any()))
            .thenReturn(Result.success(payment))

        // When
        val result = useCase(
            paymentId = "payment_123",
            completionNotes = null,
            rating = null
        )

        // Then
        assertTrue(result.isSuccess)

        // Verify repository called
        verify(repository).releasePayment(
            paymentId = eq("payment_123"),
            completionNotes = isNull(),
            rating = isNull()
        )
    }

    @Test
    fun `invoke should succeed with only completion notes`() = runTest {
        // Given
        whenever(repository.releasePayment(any(), any(), any()))
            .thenReturn(Result.success(createTestPayment()))

        // When
        val result = useCase(
            paymentId = "payment_123",
            completionNotes = "Work done well",
            rating = null
        )

        // Then
        assertTrue(result.isSuccess)
    }

    @Test
    fun `invoke should succeed with only rating`() = runTest {
        // Given
        whenever(repository.releasePayment(any(), any(), any()))
            .thenReturn(Result.success(createTestPayment()))

        // When
        val result = useCase(
            paymentId = "payment_123",
            completionNotes = null,
            rating = 4
        )

        // Then
        assertTrue(result.isSuccess)
    }

    @Test
    fun `invoke should accept all valid ratings from 1 to 5`() = runTest {
        // Given
        whenever(repository.releasePayment(any(), any(), any()))
            .thenReturn(Result.success(createTestPayment()))

        // Test all valid ratings
        for (rating in 1..5) {
            val result = useCase(
                paymentId = "payment_123",
                completionNotes = null,
                rating = rating
            )
            assertTrue("Rating $rating should be valid", result.isSuccess)
        }
    }

    // ========== Validation Error Cases ==========

    @Test
    fun `invoke should fail when paymentId is blank`() = runTest {
        // When
        val result = useCase(
            paymentId = "",
            completionNotes = "Good work",
            rating = 5
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Payment ID cannot be empty", result.exceptionOrNull()?.message)
        verify(repository, never()).releasePayment(any(), any(), any())
    }

    @Test
    fun `invoke should fail when paymentId is whitespace`() = runTest {
        // When
        val result = useCase(
            paymentId = "   ",
            completionNotes = null,
            rating = null
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Payment ID cannot be empty", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when rating is below 1`() = runTest {
        // When
        val result = useCase(
            paymentId = "payment_123",
            completionNotes = null,
            rating = 0
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Rating must be between 1 and 5", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when rating is above 5`() = runTest {
        // When
        val result = useCase(
            paymentId = "payment_123",
            completionNotes = null,
            rating = 6
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Rating must be between 1 and 5", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when rating is negative`() = runTest {
        // When
        val result = useCase(
            paymentId = "payment_123",
            completionNotes = null,
            rating = -1
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Rating must be between 1 and 5", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when completion notes exceed 1000 characters`() = runTest {
        // When
        val longNotes = "a".repeat(1001)
        val result = useCase(
            paymentId = "payment_123",
            completionNotes = longNotes,
            rating = 5
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Completion notes cannot exceed 1000 characters", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should succeed when completion notes exactly 1000 characters`() = runTest {
        // Given
        whenever(repository.releasePayment(any(), any(), any()))
            .thenReturn(Result.success(createTestPayment()))

        // When
        val exactlyThousand = "a".repeat(1000)
        val result = useCase(
            paymentId = "payment_123",
            completionNotes = exactlyThousand,
            rating = 5
        )

        // Then
        assertTrue(result.isSuccess)
    }

    @Test
    fun `invoke should fail when completion notes is blank string`() = runTest {
        // When
        val result = useCase(
            paymentId = "payment_123",
            completionNotes = "   ",
            rating = 5
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Completion notes cannot be blank (use null instead)", result.exceptionOrNull()?.message)
    }

    // ========== Repository Error Propagation ==========

    @Test
    fun `invoke should propagate repository errors`() = runTest {
        // Given
        whenever(repository.releasePayment(any(), any(), any()))
            .thenReturn(Result.failure(RuntimeException("Unauthorized: Only job owner can release payment")))

        // When
        val result = useCase(
            paymentId = "payment_123",
            completionNotes = "Done",
            rating = 5
        )

        // Then
        assertTrue(result.isFailure)
        assertTrue(result.exceptionOrNull()?.message?.contains("Unauthorized") == true)
    }

    @Test
    fun `invoke should propagate network errors from repository`() = runTest {
        // Given
        whenever(repository.releasePayment(any(), any(), any()))
            .thenReturn(Result.failure(RuntimeException("Network timeout")))

        // When
        val result = useCase(
            paymentId = "payment_123",
            completionNotes = null,
            rating = null
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Network timeout", result.exceptionOrNull()?.message)
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
        completedAt = if (status == PaymentStatus.COMPLETED) "2025-11-01T15:00:00Z" else null
    )
}
