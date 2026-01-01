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
 * Unit tests for RefundPaymentUseCase
 * Tests validation logic and repository interaction
 *
 * Coverage target: >85%
 */
class RefundPaymentUseCaseTest {

    private lateinit var useCase: RefundPaymentUseCase
    private lateinit var repository: PaymentsRepository

    private val sampleRefundedPayment = Payment(
        id = "payment_123",
        jobId = "job_123",
        clientId = "client_123",
        artisanId = "artisan_123",
        bidId = "bid_456",
        amount = 1000.0,
        platformFee = 100.0,
        totalAmount = 1150.0,
        paymentMethod = PaymentMethod.CREDIT_CARD,
        status = PaymentStatus.REFUNDED,
        transactionId = "txn_789",
        receiptUrl = "https://example.com/receipt.pdf",
        createdAt = "2025-10-01T10:00:00Z",
        completedAt = "2025-10-01T10:05:00Z"
    )

    @Before
    fun setup() {
        repository = mock()
        useCase = RefundPaymentUseCase(repository)
    }

    // ========== Success Cases ==========

    @Test
    fun `invoke should return success when inputs valid and repository succeeds`() = runTest {
        // Given
        whenever(repository.refundPayment(any(), any(), any()))
            .thenReturn(Result.success(sampleRefundedPayment))

        // When
        val result = useCase(
            paymentId = "payment_123",
            amount = 1000.0,
            reason = "Customer requested refund due to dissatisfaction"
        )

        // Then
        assertTrue(result.isSuccess)
        assertEquals(PaymentStatus.REFUNDED, result.getOrNull()?.status)

        // Verify repository called
        verify(repository).refundPayment(
            paymentId = "payment_123",
            amount = 1000.0,
            reason = "Customer requested refund due to dissatisfaction"
        )
    }

    @Test
    fun `invoke should accept minimum valid reason length`() = runTest {
        // Given
        whenever(repository.refundPayment(any(), any(), any()))
            .thenReturn(Result.success(sampleRefundedPayment))

        // When - 10 characters minimum
        val result = useCase(
            paymentId = "payment_123",
            amount = 500.0,
            reason = "Ten chars!"
        )

        // Then
        assertTrue(result.isSuccess)
    }

    @Test
    fun `invoke should accept maximum valid reason length`() = runTest {
        // Given
        whenever(repository.refundPayment(any(), any(), any()))
            .thenReturn(Result.success(sampleRefundedPayment))

        // When - 500 characters maximum
        val longReason = "A".repeat(500)
        val result = useCase(
            paymentId = "payment_123",
            amount = 500.0,
            reason = longReason
        )

        // Then
        assertTrue(result.isSuccess)
    }

    @Test
    fun `invoke should trim reason whitespace before passing to repository`() = runTest {
        // Given
        whenever(repository.refundPayment(any(), any(), any()))
            .thenReturn(Result.success(sampleRefundedPayment))

        // When
        useCase(
            paymentId = "payment_123",
            amount = 500.0,
            reason = "  Valid reason here  "
        )

        // Then
        verify(repository).refundPayment(
            paymentId = "payment_123",
            amount = 500.0,
            reason = "Valid reason here"
        )
    }

    // ========== Validation Error Cases ==========

    @Test
    fun `invoke should fail when paymentId is blank`() = runTest {
        // When
        val result = useCase(
            paymentId = "",
            amount = 500.0,
            reason = "Valid refund reason"
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Payment ID cannot be empty", result.exceptionOrNull()?.message)
        verify(repository, never()).refundPayment(any(), any(), any())
    }

    @Test
    fun `invoke should fail when amount is zero`() = runTest {
        // When
        val result = useCase(
            paymentId = "payment_123",
            amount = 0.0,
            reason = "Valid refund reason"
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Refund amount must be greater than zero", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when amount is negative`() = runTest {
        // When
        val result = useCase(
            paymentId = "payment_123",
            amount = -100.0,
            reason = "Valid refund reason"
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Refund amount must be greater than zero", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when amount exceeds maximum`() = runTest {
        // When
        val result = useCase(
            paymentId = "payment_123",
            amount = 1_000_001.0,
            reason = "Valid refund reason"
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Refund amount cannot exceed R1,000,000.00", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when reason is blank`() = runTest {
        // When
        val result = useCase(
            paymentId = "payment_123",
            amount = 500.0,
            reason = ""
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Refund reason is required", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when reason is only whitespace`() = runTest {
        // When
        val result = useCase(
            paymentId = "payment_123",
            amount = 500.0,
            reason = "     "
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Refund reason is required", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when reason below minimum length`() = runTest {
        // When - less than 10 characters
        val result = useCase(
            paymentId = "payment_123",
            amount = 500.0,
            reason = "Too short"
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Refund reason must be at least 10 characters", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when reason exceeds maximum length`() = runTest {
        // When - more than 500 characters
        val longReason = "A".repeat(501)
        val result = useCase(
            paymentId = "payment_123",
            amount = 500.0,
            reason = longReason
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Refund reason cannot exceed 500 characters", result.exceptionOrNull()?.message)
    }

    // ========== Repository Error Propagation ==========

    @Test
    fun `invoke should propagate repository errors`() = runTest {
        // Given
        whenever(repository.refundPayment(any(), any(), any()))
            .thenReturn(Result.failure(RuntimeException("Payment not found")))

        // When
        val result = useCase(
            paymentId = "payment_123",
            amount = 500.0,
            reason = "Valid refund reason"
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Payment not found", result.exceptionOrNull()?.message)
    }
}
