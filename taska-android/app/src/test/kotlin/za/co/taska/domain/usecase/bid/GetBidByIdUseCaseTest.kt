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
 * Unit tests for GetBidByIdUseCase
 * Tests validation logic and repository interaction
 *
 * Coverage target: >85%
 * Test count: 7 tests
 */
class GetBidByIdUseCaseTest {

    private lateinit var useCase: GetBidByIdUseCase
    private lateinit var repository: BidsRepository

    @Before
    fun setup() {
        repository = mock()
        useCase = GetBidByIdUseCase(repository)
    }

    // ========== Success Cases ==========

    @Test
    fun `invoke should return success when bidId is valid and repository succeeds`() = runTest {
        // Given
        val bid = createTestBid()
        whenever(repository.getBidById(any())).thenReturn(Result.success(bid))

        // When
        val result = useCase(bidId = "bid_123")

        // Then
        assertTrue(result.isSuccess)
        assertEquals("bid_123", result.getOrNull()?.id)
        verify(repository).getBidById("bid_123")
    }

    @Test
    fun `invoke should trim whitespace from bidId`() = runTest {
        // Given
        val bid = createTestBid()
        whenever(repository.getBidById(any())).thenReturn(Result.success(bid))

        // When
        val result = useCase(bidId = "  bid_123  ")

        // Then
        assertTrue(result.isSuccess)
        verify(repository).getBidById("bid_123")
    }

    @Test
    fun `invoke should return bid with all properties`() = runTest {
        // Given
        val bid = createTestBid()
        whenever(repository.getBidById(any())).thenReturn(Result.success(bid))

        // When
        val result = useCase(bidId = "bid_123")

        // Then
        assertTrue(result.isSuccess)
        val retrievedBid = result.getOrNull()
        assertNotNull(retrievedBid)
        assertEquals("bid_123", retrievedBid?.id)
        assertEquals("job_123", retrievedBid?.jobId)
        assertEquals(500.0, retrievedBid?.amount ?: 0.0, 0.01)
        assertEquals(BidStatus.PENDING, retrievedBid?.status)
    }

    // ========== Validation Failures ==========

    @Test
    fun `invoke should fail when bidId is blank`() = runTest {
        // When
        val result = useCase(bidId = "")

        // Then
        assertTrue(result.isFailure)
        assertTrue(result.exceptionOrNull() is IllegalArgumentException)
        assertEquals("Bid ID cannot be empty", result.exceptionOrNull()?.message)
        verify(repository, never()).getBidById(any())
    }

    @Test
    fun `invoke should fail when bidId is whitespace`() = runTest {
        // When
        val result = useCase(bidId = "   ")

        // Then
        assertTrue(result.isFailure)
        assertEquals("Bid ID cannot be empty", result.exceptionOrNull()?.message)
        verify(repository, never()).getBidById(any())
    }

    // ========== Error Handling ==========

    @Test
    fun `invoke should propagate repository errors`() = runTest {
        // Given
        whenever(repository.getBidById(any()))
            .thenReturn(Result.failure(Exception("Network error")))

        // When
        val result = useCase(bidId = "bid_123")

        // Then
        assertTrue(result.isFailure)
        assertEquals("Network error", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should handle bid not found errors`() = runTest {
        // Given
        whenever(repository.getBidById(any()))
            .thenReturn(Result.failure(Exception("Bid not found")))

        // When
        val result = useCase(bidId = "nonexistent_bid")

        // Then
        assertTrue(result.isFailure)
        assertEquals("Bid not found", result.exceptionOrNull()?.message)
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
