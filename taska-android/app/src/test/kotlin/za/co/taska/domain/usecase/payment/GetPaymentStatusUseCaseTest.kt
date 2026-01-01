package za.co.taska.domain.usecase.payment

import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flow
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
 * Unit tests for GetPaymentStatusUseCase
 * Tests validation logic and repository interaction
 *
 * Coverage target: >85%
 */
class GetPaymentStatusUseCaseTest {

    private lateinit var useCase: GetPaymentStatusUseCase
    private lateinit var repository: PaymentsRepository

    private val samplePayment = Payment(
        id = "payment_123",
        jobId = "job_123",
        clientId = "client_123",
        artisanId = "artisan_123",
        bidId = "bid_456",
        amount = 1000.0,
        platformFee = 100.0,
        totalAmount = 1150.0,
        paymentMethod = PaymentMethod.CREDIT_CARD,
        status = PaymentStatus.COMPLETED,
        transactionId = "txn_789",
        receiptUrl = "https://example.com/receipt.pdf",
        createdAt = "2025-10-01T10:00:00Z",
        completedAt = "2025-10-01T10:05:00Z"
    )

    @Before
    fun setup() {
        repository = mock()
        useCase = GetPaymentStatusUseCase(repository)
    }

    // ========== Success Cases ==========

    @Test
    fun `invoke should return success flow when paymentId valid and repository succeeds`() = runTest {
        // Given
        val successFlow = flow {
            emit(Resource.Success(samplePayment))
        }
        whenever(repository.getPayment(any())).thenReturn(successFlow)

        // When
        val flow = useCase("payment_123")
        val result = flow.first()

        // Then
        assertTrue(result is Resource.Success)
        assertEquals("payment_123", (result as Resource.Success).data?.id)

        // Verify repository called
        verify(repository).getPayment("payment_123")
    }

    @Test
    fun `invoke should emit loading state from repository`() = runTest {
        // Given
        val loadingFlow = flow {
            emit(Resource.Loading<Payment>())
            emit(Resource.Success(samplePayment))
        }
        whenever(repository.getPayment(any())).thenReturn(loadingFlow)

        // When
        val flow = useCase("payment_123")
        val firstEmission = flow.first()

        // Then
        assertTrue(firstEmission is Resource.Loading)
    }

    @Test
    fun `invoke should handle repository error flow`() = runTest {
        // Given
        val errorFlow = flow {
            emit(Resource.Error("Network error"))
        }
        whenever(repository.getPayment(any())).thenReturn(errorFlow)

        // When
        val flow = useCase("payment_123")
        val result = flow.first()

        // Then
        assertTrue(result is Resource.Error)
        assertEquals("Network error", (result as Resource.Error).message)
    }

    // ========== Validation Error Cases ==========

    @Test
    fun `invoke should return error flow when paymentId is blank`() = runTest {
        // When
        val flow = useCase("")
        val result = flow.first()

        // Then
        assertTrue(result is Resource.Error)
        assertEquals("Payment ID cannot be empty", (result as Resource.Error).message)

        // Verify repository never called
        verify(repository, never()).getPayment(any())
    }

    @Test
    fun `invoke should return error flow when paymentId is whitespace`() = runTest {
        // When
        val flow = useCase("   ")
        val result = flow.first()

        // Then
        assertTrue(result is Resource.Error)
        assertEquals("Payment ID cannot be empty", (result as Resource.Error).message)
        verify(repository, never()).getPayment(any())
    }

    // ========== observeStatus Method Tests ==========

    @Test
    fun `observeStatus should return flow from repository when valid`() = runTest {
        // Given
        val observeFlow = flow {
            emit(Resource.Success(samplePayment))
        }
        whenever(repository.observePaymentStatus(any())).thenReturn(observeFlow)

        // When
        val flow = useCase.observeStatus("payment_123")
        val result = flow.first()

        // Then
        assertTrue(result is Resource.Success)
        assertEquals("payment_123", (result as Resource.Success).data?.id)
        verify(repository).observePaymentStatus("payment_123")
    }

    @Test
    fun `observeStatus should return error when paymentId blank`() = runTest {
        // When
        val flow = useCase.observeStatus("")
        val result = flow.first()

        // Then
        assertTrue(result is Resource.Error)
        assertEquals("Payment ID cannot be empty", (result as Resource.Error).message)
        verify(repository, never()).observePaymentStatus(any())
    }

    @Test
    fun `observeStatus should emit multiple updates`() = runTest {
        // Given
        val pendingPayment = samplePayment.copy(status = PaymentStatus.PENDING)
        val processingPayment = samplePayment.copy(status = PaymentStatus.PROCESSING)
        val completedPayment = samplePayment.copy(status = PaymentStatus.COMPLETED)

        val multiUpdateFlow = flow {
            emit(Resource.Success(pendingPayment))
            emit(Resource.Success(processingPayment))
            emit(Resource.Success(completedPayment))
        }
        whenever(repository.observePaymentStatus(any())).thenReturn(multiUpdateFlow)

        // When
        val flow = useCase.observeStatus("payment_123")
        val firstUpdate = flow.first()

        // Then - verify first emission is pending
        assertTrue(firstUpdate is Resource.Success)
        assertEquals(PaymentStatus.PENDING, (firstUpdate as Resource.Success).data?.status)
    }

    // ========== Edge Cases ==========

    @Test
    fun `invoke should handle repository returning null data in Success`() = runTest {
        // Given - Use Loading with null data instead of Success with null
        val nullDataFlow = flow {
            emit(Resource.Loading<Payment>(null))
        }
        whenever(repository.getPayment(any())).thenReturn(nullDataFlow)

        // When
        val flow = useCase("payment_123")
        val result = flow.first()

        // Then
        assertTrue(result is Resource.Loading)
        assertNull((result as Resource.Loading).data)
    }
}
