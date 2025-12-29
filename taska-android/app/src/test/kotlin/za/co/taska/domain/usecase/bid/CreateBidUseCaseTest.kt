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
 * Unit tests for CreateBidUseCase
 * Tests comprehensive validation logic and repository interaction
 *
 * Coverage target: >85%
 * Test count: 25 tests
 */
class CreateBidUseCaseTest {

    private lateinit var useCase: CreateBidUseCase
    private lateinit var repository: BidsRepository

    @Before
    fun setup() {
        repository = mock()
        useCase = CreateBidUseCase(repository)
    }

    // ========== Success Cases ==========

    @Test
    fun `invoke should return success when all inputs valid and repository succeeds`() = runTest {
        // Given
        val bid = createTestBid()
        whenever(repository.createBid(any(), any(), any(), any(), any()))
            .thenReturn(Result.success(bid))

        // When
        val result = useCase(
            jobId = "job_123",
            amount = 500.0,
            message = "I can complete this job professionally and efficiently within the timeframe specified.",
            estimatedDays = 5,
            attachments = listOf("attachment1.pdf")
        )

        // Then
        assertTrue(result.isSuccess)
        assertEquals("bid_123", result.getOrNull()?.id)

        verify(repository).createBid(
            jobId = "job_123",
            amount = 500.0,
            message = "I can complete this job professionally and efficiently within the timeframe specified.",
            estimatedDays = 5,
            attachments = listOf("attachment1.pdf")
        )
    }

    @Test
    fun `invoke should succeed with minimum required fields`() = runTest {
        // Given
        whenever(repository.createBid(any(), any(), any(), any(), any()))
            .thenReturn(Result.success(createTestBid()))

        // When
        val result = useCase(
            jobId = "job_123",
            amount = 100.0,
            message = "Twenty characters msg",
            estimatedDays = 1,
            attachments = null
        )

        // Then
        assertTrue(result.isSuccess)
        verify(repository).createBid(
            jobId = any(),
            amount = any(),
            message = any(),
            estimatedDays = any(),
            attachments = isNull()
        )
    }

    @Test
    fun `invoke should succeed with maximum valid values`() = runTest {
        // Given
        whenever(repository.createBid(any(), any(), any(), any(), any()))
            .thenReturn(Result.success(createTestBid()))

        val maxMessage = "a".repeat(500)
        val maxAttachments = listOf("file1.pdf", "file2.jpg", "file3.png")

        // When
        val result = useCase(
            jobId = "job_123",
            amount = 1000000.0,
            message = maxMessage,
            estimatedDays = 365,
            attachments = maxAttachments
        )

        // Then
        assertTrue(result.isSuccess)
    }

    @Test
    fun `invoke should trim whitespace from inputs`() = runTest {
        // Given
        whenever(repository.createBid(any(), any(), any(), any(), any()))
            .thenReturn(Result.success(createTestBid()))

        // When
        val result = useCase(
            jobId = "  job_123  ",
            amount = 500.0,
            message = "  Valid message with twenty characters  ",
            estimatedDays = 5,
            attachments = null
        )

        // Then
        assertTrue(result.isSuccess)
        verify(repository).createBid(
            jobId = "job_123",
            amount = 500.0,
            message = "Valid message with twenty characters",
            estimatedDays = 5,
            attachments = null
        )
    }

    @Test
    fun `invoke should filter blank attachments`() = runTest {
        // Given
        whenever(repository.createBid(any(), any(), any(), any(), any()))
            .thenReturn(Result.success(createTestBid()))

        // When
        val result = useCase(
            jobId = "job_123",
            amount = 500.0,
            message = "Valid message with twenty characters",
            estimatedDays = 5,
            attachments = listOf("file1.pdf", "", "file2.jpg")
        )

        // Then
        assertTrue(result.isSuccess)
        verify(repository).createBid(
            jobId = any(),
            amount = any(),
            message = any(),
            estimatedDays = any(),
            attachments = argThat { size == 2 && contains("file1.pdf") && contains("file2.jpg") }
        )
    }

    // ========== Job ID Validation ==========

    @Test
    fun `invoke should fail when jobId is blank`() = runTest {
        // When
        val result = useCase(
            jobId = "",
            amount = 500.0,
            message = "Valid message with twenty characters",
            estimatedDays = 5
        )

        // Then
        assertTrue(result.isFailure)
        assertTrue(result.exceptionOrNull() is IllegalArgumentException)
        assertEquals("Job ID cannot be empty", result.exceptionOrNull()?.message)
        verify(repository, never()).createBid(any(), any(), any(), any(), any())
    }

    @Test
    fun `invoke should fail when jobId is whitespace`() = runTest {
        // When
        val result = useCase(
            jobId = "   ",
            amount = 500.0,
            message = "Valid message with twenty characters",
            estimatedDays = 5
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Job ID cannot be empty", result.exceptionOrNull()?.message)
    }

    // ========== Amount Validation ==========

    @Test
    fun `invoke should fail when amount is zero`() = runTest {
        // When
        val result = useCase(
            jobId = "job_123",
            amount = 0.0,
            message = "Valid message with twenty characters",
            estimatedDays = 5
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Bid amount must be greater than zero", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when amount is negative`() = runTest {
        // When
        val result = useCase(
            jobId = "job_123",
            amount = -100.0,
            message = "Valid message with twenty characters",
            estimatedDays = 5
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Bid amount must be greater than zero", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when amount exceeds maximum`() = runTest {
        // When
        val result = useCase(
            jobId = "job_123",
            amount = 1000001.0,
            message = "Valid message with twenty characters",
            estimatedDays = 5
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
            jobId = "job_123",
            amount = 500.0,
            message = "",
            estimatedDays = 5
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Bid message cannot be empty", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when message is too short`() = runTest {
        // When
        val result = useCase(
            jobId = "job_123",
            amount = 500.0,
            message = "Too short",
            estimatedDays = 5
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Bid message must be at least 20 characters", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when message is exactly 19 characters`() = runTest {
        // When
        val result = useCase(
            jobId = "job_123",
            amount = 500.0,
            message = "1234567890123456789", // 19 chars
            estimatedDays = 5
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Bid message must be at least 20 characters", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should succeed when message is exactly 20 characters`() = runTest {
        // Given
        whenever(repository.createBid(any(), any(), any(), any(), any()))
            .thenReturn(Result.success(createTestBid()))

        // When
        val result = useCase(
            jobId = "job_123",
            amount = 500.0,
            message = "12345678901234567890", // 20 chars
            estimatedDays = 5
        )

        // Then
        assertTrue(result.isSuccess)
    }

    @Test
    fun `invoke should fail when message exceeds maximum length`() = runTest {
        // When
        val result = useCase(
            jobId = "job_123",
            amount = 500.0,
            message = "a".repeat(501),
            estimatedDays = 5
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
            jobId = "job_123",
            amount = 500.0,
            message = "Valid message with twenty characters",
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
            jobId = "job_123",
            amount = 500.0,
            message = "Valid message with twenty characters",
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
            jobId = "job_123",
            amount = 500.0,
            message = "Valid message with twenty characters",
            estimatedDays = 366
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Estimated days cannot exceed 365", result.exceptionOrNull()?.message)
    }

    // ========== Attachments Validation ==========

    @Test
    fun `invoke should fail when attachments exceed maximum`() = runTest {
        // When
        val result = useCase(
            jobId = "job_123",
            amount = 500.0,
            message = "Valid message with twenty characters",
            estimatedDays = 5,
            attachments = listOf("file1", "file2", "file3", "file4")
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Maximum 3 attachments allowed", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when attachments contain blank URLs`() = runTest {
        // When
        val result = useCase(
            jobId = "job_123",
            amount = 500.0,
            message = "Valid message with twenty characters",
            estimatedDays = 5,
            attachments = listOf("file1.pdf", "", "file2.jpg")
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Attachment URLs cannot be blank", result.exceptionOrNull()?.message)
    }

    // ========== Repository Error Handling ==========

    @Test
    fun `invoke should propagate repository errors`() = runTest {
        // Given
        whenever(repository.createBid(any(), any(), any(), any(), any()))
            .thenReturn(Result.failure(Exception("Network error")))

        // When
        val result = useCase(
            jobId = "job_123",
            amount = 500.0,
            message = "Valid message with twenty characters",
            estimatedDays = 5
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Network error", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should handle null attachments correctly`() = runTest {
        // Given
        whenever(repository.createBid(any(), any(), any(), any(), any()))
            .thenReturn(Result.success(createTestBid()))

        // When
        val result = useCase(
            jobId = "job_123",
            amount = 500.0,
            message = "Valid message with twenty characters",
            estimatedDays = 5,
            attachments = null
        )

        // Then
        assertTrue(result.isSuccess)
        verify(repository).createBid(
            jobId = any(),
            amount = any(),
            message = any(),
            estimatedDays = any(),
            attachments = isNull()
        )
    }

    @Test
    fun `invoke should handle empty attachments list correctly`() = runTest {
        // Given
        whenever(repository.createBid(any(), any(), any(), any(), any()))
            .thenReturn(Result.success(createTestBid()))

        // When
        val result = useCase(
            jobId = "job_123",
            amount = 500.0,
            message = "Valid message with twenty characters",
            estimatedDays = 5,
            attachments = emptyList()
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
