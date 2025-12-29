package za.co.taska.domain.usecase.bid

import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.mockito.kotlin.*
import za.co.taska.domain.model.Bid
import za.co.taska.domain.model.BidStatus
import za.co.taska.domain.repository.BidsRepository

/**
 * Unit tests for GetMyBidsUseCase
 * Tests flow emission and error handling
 *
 * Coverage target: >85%
 * Test count: 8 tests
 */
class GetMyBidsUseCaseTest {

    private lateinit var useCase: GetMyBidsUseCase
    private lateinit var repository: BidsRepository

    @Before
    fun setup() {
        repository = mock()
        useCase = GetMyBidsUseCase(repository)
    }

    // ========== Success Cases ==========

    @Test
    fun `invoke should return flow with bids list when repository succeeds`() = runTest {
        // Given
        val bids = listOf(createTestBid("bid_1"), createTestBid("bid_2"))
        whenever(repository.getMyBids()).thenReturn(flowOf(Result.success(bids)))

        // When
        val result = useCase().first()

        // Then
        assertTrue(result.isSuccess)
        assertEquals(2, result.getOrNull()?.size)
        assertEquals("bid_1", result.getOrNull()?.get(0)?.id)
        assertEquals("bid_2", result.getOrNull()?.get(1)?.id)
    }

    @Test
    fun `invoke should return flow with empty list when no bids exist`() = runTest {
        // Given
        whenever(repository.getMyBids()).thenReturn(flowOf(Result.success(emptyList())))

        // When
        val result = useCase().first()

        // Then
        assertTrue(result.isSuccess)
        assertTrue(result.getOrNull()!!.isEmpty())
    }

    @Test
    fun `invoke should handle single bid correctly`() = runTest {
        // Given
        val bid = createTestBid("bid_single")
        whenever(repository.getMyBids()).thenReturn(flowOf(Result.success(listOf(bid))))

        // When
        val result = useCase().first()

        // Then
        assertTrue(result.isSuccess)
        assertEquals(1, result.getOrNull()?.size)
        assertEquals("bid_single", result.getOrNull()?.first()?.id)
    }

    @Test
    fun `invoke should handle large list of bids`() = runTest {
        // Given
        val bids = (1..50).map { createTestBid("bid_$it") }
        whenever(repository.getMyBids()).thenReturn(flowOf(Result.success(bids)))

        // When
        val result = useCase().first()

        // Then
        assertTrue(result.isSuccess)
        assertEquals(50, result.getOrNull()?.size)
    }

    // ========== Error Handling ==========

    @Test
    fun `invoke should propagate repository errors`() = runTest {
        // Given
        whenever(repository.getMyBids())
            .thenReturn(flowOf(Result.failure(Exception("Network error"))))

        // When
        val result = useCase().first()

        // Then
        assertTrue(result.isFailure)
        assertEquals("Network error", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should handle authentication errors`() = runTest {
        // Given
        whenever(repository.getMyBids())
            .thenReturn(flowOf(Result.failure(Exception("Please login to view your bids"))))

        // When
        val result = useCase().first()

        // Then
        assertTrue(result.isFailure)
        assertEquals("Please login to view your bids", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should emit flow correctly without parameters`() = runTest {
        // Given
        val bids = listOf(createTestBid("bid_1"))
        whenever(repository.getMyBids()).thenReturn(flowOf(Result.success(bids)))

        // When
        val flow = useCase()

        // Then
        assertNotNull(flow)
        val result = flow.first()
        assertTrue(result.isSuccess)
    }

    @Test
    fun `invoke should handle bids with different statuses`() = runTest {
        // Given
        val bids = listOf(
            createTestBid("bid_1", BidStatus.PENDING),
            createTestBid("bid_2", BidStatus.ACCEPTED),
            createTestBid("bid_3", BidStatus.REJECTED),
            createTestBid("bid_4", BidStatus.WITHDRAWN)
        )
        whenever(repository.getMyBids()).thenReturn(flowOf(Result.success(bids)))

        // When
        val result = useCase().first()

        // Then
        assertTrue(result.isSuccess)
        assertEquals(4, result.getOrNull()?.size)
        assertEquals(BidStatus.PENDING, result.getOrNull()?.get(0)?.status)
        assertEquals(BidStatus.ACCEPTED, result.getOrNull()?.get(1)?.status)
        assertEquals(BidStatus.REJECTED, result.getOrNull()?.get(2)?.status)
        assertEquals(BidStatus.WITHDRAWN, result.getOrNull()?.get(3)?.status)
    }

    // ========== Helper Methods ==========

    private fun createTestBid(
        id: String,
        status: BidStatus = BidStatus.PENDING
    ) = Bid(
        id = id,
        jobId = "job_123",
        artisanId = "artisan_123",
        amount = 500.0,
        message = "Test message",
        estimatedDays = 5,
        attachments = emptyList(),
        status = status,
        acceptedAt = null,
        rejectedAt = null,
        withdrawnAt = null,
        expiresAt = "2025-12-01T00:00:00Z",
        createdAt = "2025-11-01T00:00:00Z",
        job = null
    )
}
