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
 * Unit tests for GetJobBidsUseCase
 * Tests validation, flow emission, and error handling
 *
 * Coverage target: >85%
 * Test count: 10 tests
 */
class GetJobBidsUseCaseTest {

    private lateinit var useCase: GetJobBidsUseCase
    private lateinit var repository: BidsRepository

    @Before
    fun setup() {
        repository = mock()
        useCase = GetJobBidsUseCase(repository)
    }

    // ========== Success Cases ==========

    @Test
    fun `invoke should return flow with bids list when jobId is valid and repository succeeds`() = runTest {
        // Given
        val bids = listOf(createTestBid("bid_1"), createTestBid("bid_2"), createTestBid("bid_3"))
        whenever(repository.getJobBids(any())).thenReturn(flowOf(Result.success(bids)))

        // When
        val result = useCase(jobId = "job_123").first()

        // Then
        assertTrue(result.isSuccess)
        assertEquals(3, result.getOrNull()?.size)
        verify(repository).getJobBids("job_123")
    }

    @Test
    fun `invoke should return flow with empty list when job has no bids`() = runTest {
        // Given
        whenever(repository.getJobBids(any())).thenReturn(flowOf(Result.success(emptyList())))

        // When
        val result = useCase(jobId = "job_123").first()

        // Then
        assertTrue(result.isSuccess)
        assertTrue(result.getOrNull()!!.isEmpty())
    }

    @Test
    fun `invoke should trim whitespace from jobId`() = runTest {
        // Given
        val bids = listOf(createTestBid("bid_1"))
        whenever(repository.getJobBids(any())).thenReturn(flowOf(Result.success(bids)))

        // When
        val result = useCase(jobId = "  job_123  ").first()

        // Then
        assertTrue(result.isSuccess)
        verify(repository).getJobBids("job_123")
    }

    @Test
    fun `invoke should handle single bid correctly`() = runTest {
        // Given
        val bid = createTestBid("bid_single")
        whenever(repository.getJobBids(any())).thenReturn(flowOf(Result.success(listOf(bid))))

        // When
        val result = useCase(jobId = "job_123").first()

        // Then
        assertTrue(result.isSuccess)
        assertEquals(1, result.getOrNull()?.size)
        assertEquals("bid_single", result.getOrNull()?.first()?.id)
    }

    @Test
    fun `invoke should handle multiple bids from different artisans`() = runTest {
        // Given
        val bids = (1..10).map { createTestBid("bid_$it") }
        whenever(repository.getJobBids(any())).thenReturn(flowOf(Result.success(bids)))

        // When
        val result = useCase(jobId = "job_123").first()

        // Then
        assertTrue(result.isSuccess)
        assertEquals(10, result.getOrNull()?.size)
    }

    // ========== Validation Failures ==========

    @Test
    fun `invoke should fail when jobId is blank`() = runTest {
        // When
        val result = useCase(jobId = "").first()

        // Then
        assertTrue(result.isFailure)
        assertTrue(result.exceptionOrNull() is IllegalArgumentException)
        assertEquals("Job ID cannot be empty", result.exceptionOrNull()?.message)
        verify(repository, never()).getJobBids(any())
    }

    @Test
    fun `invoke should fail when jobId is whitespace`() = runTest {
        // When
        val result = useCase(jobId = "   ").first()

        // Then
        assertTrue(result.isFailure)
        assertEquals("Job ID cannot be empty", result.exceptionOrNull()?.message)
        verify(repository, never()).getJobBids(any())
    }

    // ========== Error Handling ==========

    @Test
    fun `invoke should propagate repository errors`() = runTest {
        // Given
        whenever(repository.getJobBids(any()))
            .thenReturn(flowOf(Result.failure(Exception("Network error"))))

        // When
        val result = useCase(jobId = "job_123").first()

        // Then
        assertTrue(result.isFailure)
        assertEquals("Network error", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should handle permission errors`() = runTest {
        // Given
        whenever(repository.getJobBids(any()))
            .thenReturn(flowOf(Result.failure(Exception("You don't have permission to view bids for this job"))))

        // When
        val result = useCase(jobId = "job_123").first()

        // Then
        assertTrue(result.isFailure)
        assertEquals("You don't have permission to view bids for this job", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should handle job not found errors`() = runTest {
        // Given
        whenever(repository.getJobBids(any()))
            .thenReturn(flowOf(Result.failure(Exception("Job not found"))))

        // When
        val result = useCase(jobId = "nonexistent_job").first()

        // Then
        assertTrue(result.isFailure)
        assertEquals("Job not found", result.exceptionOrNull()?.message)
    }

    // ========== Helper Methods ==========

    private fun createTestBid(id: String) = Bid(
        id = id,
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
