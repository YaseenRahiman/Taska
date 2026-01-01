package za.co.taska.domain.usecase.payment

import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.mockito.kotlin.*
import za.co.taska.domain.repository.PaymentIntent
import za.co.taska.domain.repository.PaymentsRepository

/**
 * Unit tests for InitiatePaymentUseCase
 * Tests validation logic and repository interaction
 *
 * Coverage target: >85%
 */
class InitiatePaymentUseCaseTest {

    private lateinit var useCase: InitiatePaymentUseCase
    private lateinit var repository: PaymentsRepository

    @Before
    fun setup() {
        repository = mock()
        useCase = InitiatePaymentUseCase(repository)
    }

    // ========== Success Cases ==========

    @Test
    fun `invoke should return success when inputs valid and repository succeeds`() = runTest {
        // Given
        val paymentIntent = PaymentIntent(
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
        whenever(repository.createPaymentIntent(any(), any(), any(), any(), any()))
            .thenReturn(Result.success(paymentIntent))

        // When
        val result = useCase(
            jobId = "job_123",
            bidId = "bid_456",
            amount = 1000.0,
            paymentMethod = "card",
            paymentProvider = "stripe"
        )

        // Then
        assertTrue(result.isSuccess)
        assertEquals("payment_123", result.getOrNull()?.paymentId)

        // Verify repository called
        verify(repository).createPaymentIntent(
            jobId = "job_123",
            bidId = "bid_456",
            amount = 1000.0,
            paymentMethod = "card",
            paymentProvider = "stripe"
        )
    }

    @Test
    fun `invoke should accept PayFast with various payment methods`() = runTest {
        // Given
        whenever(repository.createPaymentIntent(any(), any(), any(), any(), any()))
            .thenReturn(Result.success(mock()))

        // Test PayFast with card
        val cardResult = useCase(
            jobId = "job_123",
            bidId = "bid_456",
            amount = 500.0,
            paymentMethod = "card",
            paymentProvider = "payfast"
        )
        assertTrue(cardResult.isSuccess)

        // Test PayFast with EFT
        val eftResult = useCase(
            jobId = "job_123",
            bidId = "bid_456",
            amount = 500.0,
            paymentMethod = "eft",
            paymentProvider = "payfast"
        )
        assertTrue(eftResult.isSuccess)

        // Test PayFast with instant_eft
        val instantEftResult = useCase(
            jobId = "job_123",
            bidId = "bid_456",
            amount = 500.0,
            paymentMethod = "instant_eft",
            paymentProvider = "payfast"
        )
        assertTrue(instantEftResult.isSuccess)
    }

    @Test
    fun `invoke should accept minimum valid amount`() = runTest {
        // Given
        whenever(repository.createPaymentIntent(any(), any(), any(), any(), any()))
            .thenReturn(Result.success(mock()))

        // When - R50.00 minimum
        val result = useCase(
            jobId = "job_123",
            bidId = "bid_456",
            amount = 50.0,
            paymentMethod = "card",
            paymentProvider = "stripe"
        )

        // Then
        assertTrue(result.isSuccess)
    }

    @Test
    fun `invoke should accept maximum valid amount`() = runTest {
        // Given
        whenever(repository.createPaymentIntent(any(), any(), any(), any(), any()))
            .thenReturn(Result.success(mock()))

        // When - R1,000,000.00 maximum
        val result = useCase(
            jobId = "job_123",
            bidId = "bid_456",
            amount = 1_000_000.0,
            paymentMethod = "card",
            paymentProvider = "stripe"
        )

        // Then
        assertTrue(result.isSuccess)
    }

    // ========== Validation Error Cases ==========

    @Test
    fun `invoke should fail when jobId is blank`() = runTest {
        // When
        val result = useCase(
            jobId = "",
            bidId = "bid_456",
            amount = 1000.0,
            paymentMethod = "card",
            paymentProvider = "stripe"
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Job ID cannot be empty", result.exceptionOrNull()?.message)
        verify(repository, never()).createPaymentIntent(any(), any(), any(), any(), any())
    }

    @Test
    fun `invoke should fail when bidId is blank`() = runTest {
        // When
        val result = useCase(
            jobId = "job_123",
            bidId = "   ",
            amount = 1000.0,
            paymentMethod = "card",
            paymentProvider = "stripe"
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Bid ID cannot be empty", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when amount is zero`() = runTest {
        // When
        val result = useCase(
            jobId = "job_123",
            bidId = "bid_456",
            amount = 0.0,
            paymentMethod = "card",
            paymentProvider = "stripe"
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Amount must be greater than zero", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when amount is negative`() = runTest {
        // When
        val result = useCase(
            jobId = "job_123",
            bidId = "bid_456",
            amount = -100.0,
            paymentMethod = "card",
            paymentProvider = "stripe"
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Amount must be greater than zero", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when amount below minimum`() = runTest {
        // When
        val result = useCase(
            jobId = "job_123",
            bidId = "bid_456",
            amount = 49.99,
            paymentMethod = "card",
            paymentProvider = "stripe"
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Minimum payment amount is R50.00", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when amount above maximum`() = runTest {
        // When
        val result = useCase(
            jobId = "job_123",
            bidId = "bid_456",
            amount = 1_000_001.0,
            paymentMethod = "card",
            paymentProvider = "stripe"
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Maximum payment amount is R1,000,000.00", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when paymentMethod is blank`() = runTest {
        // When
        val result = useCase(
            jobId = "job_123",
            bidId = "bid_456",
            amount = 1000.0,
            paymentMethod = "",
            paymentProvider = "stripe"
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Payment method is required", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when paymentMethod is invalid`() = runTest {
        // When
        val result = useCase(
            jobId = "job_123",
            bidId = "bid_456",
            amount = 1000.0,
            paymentMethod = "bitcoin",
            paymentProvider = "stripe"
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Invalid payment method: bitcoin", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when paymentProvider is blank`() = runTest {
        // When
        val result = useCase(
            jobId = "job_123",
            bidId = "bid_456",
            amount = 1000.0,
            paymentMethod = "card",
            paymentProvider = ""
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Payment provider is required", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when paymentProvider is invalid`() = runTest {
        // When
        val result = useCase(
            jobId = "job_123",
            bidId = "bid_456",
            amount = 1000.0,
            paymentMethod = "card",
            paymentProvider = "paypal"
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Invalid payment provider: paypal", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when method incompatible with provider`() = runTest {
        // When - Stripe doesn't support EFT
        val result = useCase(
            jobId = "job_123",
            bidId = "bid_456",
            amount = 1000.0,
            paymentMethod = "eft",
            paymentProvider = "stripe"
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Payment method eft not supported by stripe", result.exceptionOrNull()?.message)
    }

    // ========== Repository Error Propagation ==========

    @Test
    fun `invoke should propagate repository errors`() = runTest {
        // Given
        whenever(repository.createPaymentIntent(any(), any(), any(), any(), any()))
            .thenReturn(Result.failure(RuntimeException("Network error")))

        // When
        val result = useCase(
            jobId = "job_123",
            bidId = "bid_456",
            amount = 1000.0,
            paymentMethod = "card",
            paymentProvider = "stripe"
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Network error", result.exceptionOrNull()?.message)
    }

    // ========== Case Insensitivity Tests ==========

    @Test
    fun `invoke should handle case-insensitive payment methods`() = runTest {
        // Given
        whenever(repository.createPaymentIntent(any(), any(), any(), any(), any()))
            .thenReturn(Result.success(mock()))

        // When - uppercase
        val upperResult = useCase(
            jobId = "job_123",
            bidId = "bid_456",
            amount = 1000.0,
            paymentMethod = "CARD",
            paymentProvider = "STRIPE"
        )

        // Then
        assertTrue(upperResult.isSuccess)
    }

    @Test
    fun `invoke should handle case-insensitive providers`() = runTest {
        // Given
        whenever(repository.createPaymentIntent(any(), any(), any(), any(), any()))
            .thenReturn(Result.success(mock()))

        // When - mixed case
        val result = useCase(
            jobId = "job_123",
            bidId = "bid_456",
            amount = 1000.0,
            paymentMethod = "Card",
            paymentProvider = "PayFast"
        )

        // Then
        assertTrue(result.isSuccess)
    }
}
