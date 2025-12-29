package za.co.taska.data.mapper

import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import za.co.taska.data.local.entity.PaymentEntity
import za.co.taska.data.remote.dto.response.PaymentResponse
import za.co.taska.domain.model.Payment
import za.co.taska.domain.model.PaymentMethod
import za.co.taska.domain.model.PaymentStatus

/**
 * Unit tests for PaymentMapper
 * Tests DTO ↔ Domain ↔ Entity transformations
 *
 * Coverage target: >85%
 */
class PaymentMapperTest {

    private lateinit var mapper: PaymentMapper

    @Before
    fun setup() {
        mapper = PaymentMapper()
    }

    // ========== DTO → Domain Tests ==========

    @Test
    fun `toDomain should map PaymentResponse to Payment correctly`() {
        // Given
        val dto = PaymentResponse(
            id = "payment_123",
            jobId = "job_456",
            payerId = "client_789",
            payeeId = "artisan_101",
            bidId = "bid_112",
            amount = 1000.0,
            platformFee = 100.0,
            vat = 150.0,
            totalAmount = 1150.0,
            currency = "ZAR",
            paymentMethod = "credit_card",
            paymentProvider = "stripe",
            status = "processing",
            transactionId = "txn_xyz",
            clientSecret = null,
            escrowStatus = "escrowed",
            escrowedAt = "2025-10-31T10:00:00Z",
            releasedAt = null,
            createdAt = "2025-10-31T10:00:00Z",
            updatedAt = "2025-10-31T10:00:00Z"
        )

        // When
        val result = mapper.toDomain(dto)

        // Then
        assertEquals("payment_123", result.id)
        assertEquals("job_456", result.jobId)
        assertEquals("client_789", result.clientId)
        assertEquals("artisan_101", result.artisanId)
        assertEquals("bid_112", result.bidId)
        assertEquals(1000.0, result.amount, 0.01)
        assertEquals(100.0, result.platformFee, 0.01)
        assertEquals(1150.0, result.totalAmount, 0.01)
        assertEquals(PaymentMethod.CREDIT_CARD, result.paymentMethod)
        assertEquals(PaymentStatus.PROCESSING, result.status)
        assertEquals("txn_xyz", result.transactionId)
        assertNull(result.receiptUrl) // Backend doesn't provide this yet
        assertEquals("2025-10-31T10:00:00Z", result.createdAt)
        assertNull(result.completedAt)
    }

    @Test
    fun `toDomain should handle completed payment with releasedAt`() {
        // Given
        val dto = PaymentResponse(
            id = "payment_123",
            jobId = "job_456",
            payerId = "client_789",
            payeeId = "artisan_101",
            bidId = "bid_112",
            amount = 1000.0,
            platformFee = 100.0,
            vat = 150.0,
            totalAmount = 1150.0,
            currency = "ZAR",
            paymentMethod = "eft",
            paymentProvider = "payfast",
            status = "completed",
            transactionId = "txn_xyz",
            clientSecret = null,
            escrowStatus = "released",
            escrowedAt = "2025-10-31T10:00:00Z",
            releasedAt = "2025-11-01T15:30:00Z",
            createdAt = "2025-10-31T10:00:00Z",
            updatedAt = "2025-11-01T15:30:00Z"
        )

        // When
        val result = mapper.toDomain(dto)

        // Then
        assertEquals(PaymentStatus.COMPLETED, result.status)
        assertEquals("2025-11-01T15:30:00Z", result.completedAt)
    }

    @Test
    fun `toDomain should handle different payment methods`() {
        // Test EFT
        val eftDto = createTestPaymentResponse(paymentMethod = "eft")
        assertEquals(PaymentMethod.EFT, mapper.toDomain(eftDto).paymentMethod)

        // Test Credit Card
        val creditCardDto = createTestPaymentResponse(paymentMethod = "credit_card")
        assertEquals(PaymentMethod.CREDIT_CARD, mapper.toDomain(creditCardDto).paymentMethod)
    }

    @Test
    fun `toDomain should handle different payment statuses`() {
        // Test PENDING
        val pendingDto = createTestPaymentResponse(status = "pending")
        assertEquals(PaymentStatus.PENDING, mapper.toDomain(pendingDto).status)

        // Test COMPLETED
        val completedDto = createTestPaymentResponse(status = "completed")
        assertEquals(PaymentStatus.COMPLETED, mapper.toDomain(completedDto).status)

        // Test FAILED
        val failedDto = createTestPaymentResponse(status = "failed")
        assertEquals(PaymentStatus.FAILED, mapper.toDomain(failedDto).status)
    }

    @Test
    fun `toDomainList should map list of DTOs correctly`() {
        // Given
        val dtoList = listOf(
            createTestPaymentResponse(id = "payment_1"),
            createTestPaymentResponse(id = "payment_2"),
            createTestPaymentResponse(id = "payment_3")
        )

        // When
        val result = mapper.toDomainList(dtoList)

        // Then
        assertEquals(3, result.size)
        assertEquals("payment_1", result[0].id)
        assertEquals("payment_2", result[1].id)
        assertEquals("payment_3", result[2].id)
    }

    // ========== Domain → Entity Tests ==========

    @Test
    fun `toEntity should map Payment to PaymentEntity correctly`() {
        // Given
        val domain = Payment(
            id = "payment_123",
            jobId = "job_456",
            clientId = "client_789",
            artisanId = "artisan_101",
            bidId = "bid_112",
            amount = 1000.0,
            platformFee = 100.0,
            totalAmount = 1150.0,
            paymentMethod = PaymentMethod.CREDIT_CARD,
            status = PaymentStatus.PROCESSING,
            transactionId = "txn_xyz",
            receiptUrl = "https://example.com/receipt.pdf",
            createdAt = "2025-10-31T10:00:00Z",
            completedAt = null
        )

        // When
        val result = mapper.toEntity(domain)

        // Then
        assertEquals("payment_123", result.id)
        assertEquals("job_456", result.jobId)
        assertEquals("client_789", result.clientId)
        assertEquals("artisan_101", result.artisanId)
        assertEquals("bid_112", result.bidId)
        assertEquals(1000.0, result.amount, 0.01)
        assertEquals(100.0, result.platformFee, 0.01)
        assertEquals(1150.0, result.totalAmount, 0.01)
        assertEquals("CREDIT_CARD", result.paymentMethod)
        assertEquals("PROCESSING", result.status)
        assertEquals("txn_xyz", result.transactionId)
        assertEquals("https://example.com/receipt.pdf", result.receiptUrl)
        assertEquals("2025-10-31T10:00:00Z", result.createdAt)
        assertNull(result.completedAt)
        assertTrue(result.cachedAt > 0) // Should have timestamp
    }

    // ========== Entity → Domain Tests ==========

    @Test
    fun `fromEntity should map PaymentEntity to Payment correctly`() {
        // Given
        val entity = PaymentEntity(
            id = "payment_123",
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

        // When
        val result = mapper.fromEntity(entity)

        // Then
        assertEquals("payment_123", result.id)
        assertEquals("job_456", result.jobId)
        assertEquals("client_789", result.clientId)
        assertEquals("artisan_101", result.artisanId)
        assertEquals("bid_112", result.bidId)
        assertEquals(1000.0, result.amount, 0.01)
        assertEquals(100.0, result.platformFee, 0.01)
        assertEquals(1150.0, result.totalAmount, 0.01)
        assertEquals(PaymentMethod.CREDIT_CARD, result.paymentMethod)
        assertEquals(PaymentStatus.PROCESSING, result.status)
        assertEquals("txn_xyz", result.transactionId)
        assertNull(result.receiptUrl)
        assertEquals("2025-10-31T10:00:00Z", result.createdAt)
        assertNull(result.completedAt)
    }

    @Test
    fun `fromEntityList should map list of entities correctly`() {
        // Given
        val entityList = listOf(
            createTestPaymentEntity(id = "payment_1"),
            createTestPaymentEntity(id = "payment_2"),
            createTestPaymentEntity(id = "payment_3")
        )

        // When
        val result = mapper.fromEntityList(entityList)

        // Then
        assertEquals(3, result.size)
        assertEquals("payment_1", result[0].id)
        assertEquals("payment_2", result[1].id)
        assertEquals("payment_3", result[2].id)
    }

    // ========== Round-trip Tests ==========

    @Test
    fun `round trip DTO to Domain to Entity should preserve data`() {
        // Given
        val dto = createTestPaymentResponse()

        // When
        val domain = mapper.toDomain(dto)
        val entity = mapper.toEntity(domain)
        val backToDomain = mapper.fromEntity(entity)

        // Then
        assertEquals(domain.id, backToDomain.id)
        assertEquals(domain.jobId, backToDomain.jobId)
        assertEquals(domain.amount, backToDomain.amount, 0.01)
        assertEquals(domain.paymentMethod, backToDomain.paymentMethod)
        assertEquals(domain.status, backToDomain.status)
    }

    // ========== Helper Methods ==========

    private fun createTestPaymentResponse(
        id: String = "payment_123",
        paymentMethod: String = "credit_card",
        status: String = "processing"
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
        currency = "ZAR",
        paymentMethod = paymentMethod,
        paymentProvider = "stripe",
        status = status,
        transactionId = "txn_xyz",
        clientSecret = null,
        escrowStatus = null,
        escrowedAt = null,
        releasedAt = null,
        createdAt = "2025-10-31T10:00:00Z",
        updatedAt = "2025-10-31T10:00:00Z"
    )

    private fun createTestPaymentEntity(
        id: String = "payment_123",
        paymentMethod: String = "CREDIT_CARD",
        status: String = "PROCESSING"
    ) = PaymentEntity(
        id = id,
        jobId = "job_456",
        clientId = "client_789",
        artisanId = "artisan_101",
        bidId = "bid_112",
        amount = 1000.0,
        platformFee = 100.0,
        totalAmount = 1150.0,
        paymentMethod = paymentMethod,
        status = status,
        transactionId = "txn_xyz",
        receiptUrl = null,
        createdAt = "2025-10-31T10:00:00Z",
        completedAt = null,
        cachedAt = System.currentTimeMillis()
    )
}
