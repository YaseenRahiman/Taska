package za.co.taska.domain.usecase.bid

import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.mockito.kotlin.*
import za.co.taska.domain.model.Bid
import za.co.taska.domain.model.BidStatus
import za.co.taska.domain.repository.BidsRepository

/**
 * Unit tests for UpdateBidUseCase
 * Tests comprehensive validation logic and repository interaction
 *
 * Coverage target: >85%
 * Test count: 20 tests
 */
class UpdateBidUseCaseTest {

    private lateinit var useCase: UpdateBidUseCase
    private lateinit var repository: BidsRepository

    @Before
    fun setup() {
        repository = mock()
        useCase = UpdateBidUseCase(repository)
    }

    // ========== Success Cases ==========

    @Test
    fun `invoke should return success when updating amount only`() = runTest {
        // Given
        val bid = createTestBid()
        whenever(repository.updateBid(any(), any(), any(), any()))
            .thenReturn(Result.success(bid))

        // When
        val result = useCase(
            bidId = "bid_123",
            amount = 600.0,
            message = null,
            estimatedDays = null
        )

        // Then
        assertTrue(result.isSuccess)
        verify(repository).updateBid(
            bidId = eq("bid_123"),
            amount = eq(600.0),
            message = isNull(),
            estimatedDays = isNull()
        )
    }

    @Test
    fun `invoke should return success when updating message only`() = runTest {
        // Given
        whenever(repository.updateBid(any(), any(), any(), any()))
            .thenReturn(Result.success(createTestBid()))

        // When
        val result = useCase(
            bidId = "bid_123",
            amount = null,
            message = "Updated message with minimum twenty characters",
            estimatedDays = null
        )

        // Then
        assertTrue(result.isSuccess)
        verify(repository).updateBid(
            bidId = eq("bid_123"),
            amount = isNull(),
            message = eq("Updated message with minimum twenty characters"),
            estimatedDays = isNull()
        )
    }

    @Test
    fun `invoke should return success when updating estimatedDays only`() = runTest {
        // Given
        whenever(repository.updateBid(any(), any(), any(), any()))
            .thenReturn(Result.success(createTestBid()))

        // When
        val result = useCase(
            bidId = "bid_123",
            amount = null,
            message = null,
            estimatedDays = 10
        )

        // Then
        assertTrue(result.isSuccess)
        verify(repository).updateBid(
            bidId = eq("bid_123"),
            amount = isNull(),
            message = isNull(),
            estimatedDays = eq(10)
        )
    }

    @Test
    fun `invoke should return success when updating all fields`() = runTest {
        // Given
        whenever(repository.updateBid(any(), any(), any(), any()))
            .thenReturn(Result.success(createTestBid()))

        // When
        val result = useCase(
            bidId = "bid_123",
            amount = 700.0,
            message = "Completely updated message with sufficient length",
            estimatedDays = 7
        )

        // Then
        assertTrue(result.isSuccess)
        verify(repository).updateBid(
            bidId = eq("bid_123"),
            amount = eq(700.0),
            message = eq("Completely updated message with sufficient length"),
            estimatedDays = eq(7)
        )
    }

    @Test
    fun `invoke should trim whitespace from inputs`() = runTest {
        // Given
        whenever(repository.updateBid(any(), any(), any(), any()))
            .thenReturn(Result.success(createTestBid()))

        // When
        val result = useCase(
            bidId = "  bid_123  ",
            amount = 600.0,
            message = "  Updated message content  ",
            estimatedDays = null
        )

        // Then
        assertTrue(result.isSuccess)
        verify(repository).updateBid(
            bidId = eq("bid_123"),
            amount = eq(600.0),
            message = eq("Updated message content"),
            estimatedDays = isNull()
        )
    }

    // ========== Bid ID Validation ==========

    @Test
    fun `invoke should fail when bidId is blank`() = runTest {
        // When
        val result = useCase(
            bidId = "",
            amount = 600.0
        )

        // Then
        assertTrue(result.isFailure)
        assertTrue(result.exceptionOrNull() is IllegalArgumentException)
        assertEquals("Bid ID cannot be empty", result.exceptionOrNull()?.message)
        verify(repository, never()).updateBid(any(), any(), any(), any())
    }

    @Test
    fun `invoke should fail when bidId is whitespace`() = runTest {
        // When
        val result = useCase(
            bidId = "   ",
            amount = 600.0
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Bid ID cannot be empty", result.exceptionOrNull()?.message)
    }

    // ========== No Fields Provided Validation ==========

    @Test
    fun `invoke should fail when no fields provided for update`() = runTest {
        // When
        val result = useCase(
            bidId = "bid_123",
            amount = null,
            message = null,
            estimatedDays = null
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("At least one field must be provided for update", result.exceptionOrNull()?.message)
    }

    // ========== Amount Validation ==========

    @Test
    fun `invoke should fail when amount is zero`() = runTest {
        // When
        val result = useCase(
            bidId = "bid_123",
            amount = 0.0
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Bid amount must be greater than zero", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when amount is negative`() = runTest {
        // When
        val result = useCase(
            bidId = "bid_123",
            amount = -100.0
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Bid amount must be greater than zero", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when amount exceeds maximum`() = runTest {
        // When
        val result = useCase(
            bidId = "bid_123",
            amount = 1000001.0
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Bid amount cannot exceed R1,000,000", result.exceptionOrNull()?.message)
    }

    // ========== Message Validation ==========

    @Test
    fun `invoke should fail when message is blank`() = runTest {
        // When
        val result = useCase(
            bidId = "bid_123",
            message = ""
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Bid message cannot be empty", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when message is too short`() = runTest {
        // When
        val result = useCase(
            bidId = "bid_123",
            message = "Too short"
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Bid message must be at least 20 characters", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when message exceeds maximum length`() = runTest {
        // When
        val result = useCase(
            bidId = "bid_123",
            message = "a".repeat(501)
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Bid message cannot exceed 500 characters", result.exceptionOrNull()?.message)
    }

    // ========== Estimated Days Validation ==========

    @Test
    fun `invoke should fail when estimatedDays is zero`() = runTest {
        // When
        val result = useCase(
            bidId = "bid_123",
            estimatedDays = 0
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Estimated days must be at least 1", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when estimatedDays is negative`() = runTest {
        // When
        val result = useCase(
            bidId = "bid_123",
            estimatedDays = -5
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Estimated days must be at least 1", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when estimatedDays exceeds maximum`() = runTest {
        // When
        val result = useCase(
            bidId = "bid_123",
            estimatedDays = 366
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Estimated days cannot exceed 365", result.exceptionOrNull()?.message)
    }

    // ========== Repository Error Handling ==========

    @Test
    fun `invoke should propagate repository errors`() = runTest {
        // Given
        whenever(repository.updateBid(any(), any(), any(), any()))
            .thenReturn(Result.failure(Exception("Network error")))

        // When
        val result = useCase(
            bidId = "bid_123",
            amount = 600.0
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Network error", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should succeed when updating to maximum valid values`() = runTest {
        // Given
        whenever(repository.updateBid(any(), any(), any(), any()))
            .thenReturn(Result.success(createTestBid()))

        // When
        val result = useCase(
            bidId = "bid_123",
            amount = 1000000.0,
            message = "a".repeat(500),
            estimatedDays = 365
        )

        // Then
        assertTrue(result.isSuccess)
    }

    // ========== Helper Methods ==========

    private fun createTestBid() = Bid(
        id = "bid_123",
        jobId = "job_123",
        artisanId = "artisan_123",
        amount = 500.0,
        message = "Test message",
        estimatedDays = 5,
        attachments = emptyList(),
        status = BidStatus.PENDING,
        acceptedAt = null,
        rejectedAt = null,
        withdrawnAt = null,
        expiresAt = "2025-12-01T00:00:00Z",
        createdAt = "2025-11-01T00:00:00Z",
        job = null
    )
}
