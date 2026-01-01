package za.co.taska.domain.usecase.review

import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.mockito.kotlin.*
import za.co.taska.domain.repository.ReviewsRepository

/**
 * Unit tests for DeleteReviewUseCase
 * Tests validation logic and repository interaction
 *
 * Coverage target: >85%
 */
class DeleteReviewUseCaseTest {

    private lateinit var useCase: DeleteReviewUseCase
    private lateinit var repository: ReviewsRepository

    @Before
    fun setup() {
        repository = mock()
        useCase = DeleteReviewUseCase(repository)
    }

    // ========== Success Cases ==========

    @Test
    fun `invoke should return success when reviewId valid and repository succeeds`() = runTest {
        // Given
        whenever(repository.deleteReview("review_123")).thenReturn(Result.success(Unit))

        // When
        val result = useCase("review_123")

        // Then
        assertTrue(result.isSuccess)

        // Verify repository called with correct ID
        verify(repository).deleteReview("review_123")
    }

    @Test
    fun `invoke should handle alphanumeric reviewId`() = runTest {
        // Given
        whenever(repository.deleteReview(any())).thenReturn(Result.success(Unit))

        // When
        val result = useCase("abc123xyz")

        // Then
        assertTrue(result.isSuccess)
        verify(repository).deleteReview("abc123xyz")
    }

    @Test
    fun `invoke should handle reviewId with special characters`() = runTest {
        // Given
        whenever(repository.deleteReview(any())).thenReturn(Result.success(Unit))

        // When
        val result = useCase("review-123_abc")

        // Then
        assertTrue(result.isSuccess)
        verify(repository).deleteReview("review-123_abc")
    }

    @Test
    fun `invoke should handle very long reviewId`() = runTest {
        // Given
        val longId = "a".repeat(100)
        whenever(repository.deleteReview(any())).thenReturn(Result.success(Unit))

        // When
        val result = useCase(longId)

        // Then
        assertTrue(result.isSuccess)
        verify(repository).deleteReview(longId)
    }

    // ========== Validation Error Cases ==========

    @Test
    fun `invoke should fail when reviewId is blank`() = runTest {
        // When
        val result = useCase("")

        // Then
        assertTrue(result.isFailure)
        assertEquals("Review ID cannot be blank", result.exceptionOrNull()?.message)

        // Verify repository never called
        verify(repository, never()).deleteReview(any())
    }

    @Test
    fun `invoke should fail when reviewId is whitespace only`() = runTest {
        // When
        val result = useCase("   ")

        // Then
        assertTrue(result.isFailure)
        assertEquals("Review ID cannot be blank", result.exceptionOrNull()?.message)
        verify(repository, never()).deleteReview(any())
    }

    @Test
    fun `invoke should fail when reviewId is tab character`() = runTest {
        // When
        val result = useCase("\t")

        // Then
        assertTrue(result.isFailure)
        assertEquals("Review ID cannot be blank", result.exceptionOrNull()?.message)
        verify(repository, never()).deleteReview(any())
    }

    @Test
    fun `invoke should fail when reviewId is newline`() = runTest {
        // When
        val result = useCase("\n")

        // Then
        assertTrue(result.isFailure)
        assertEquals("Review ID cannot be blank", result.exceptionOrNull()?.message)
        verify(repository, never()).deleteReview(any())
    }

    // ========== Repository Error Propagation ==========

    @Test
    fun `invoke should propagate repository errors`() = runTest {
        // Given
        whenever(repository.deleteReview("review_123")).thenReturn(
            Result.failure(RuntimeException("Unauthorized"))
        )

        // When
        val result = useCase("review_123")

        // Then
        assertTrue(result.isFailure)
        assertEquals("Unauthorized", result.exceptionOrNull()?.message)

        verify(repository).deleteReview("review_123")
    }

    @Test
    fun `invoke should propagate network errors`() = runTest {
        // Given
        whenever(repository.deleteReview("review_123")).thenReturn(
            Result.failure(RuntimeException("Network timeout"))
        )

        // When
        val result = useCase("review_123")

        // Then
        assertTrue(result.isFailure)
        assertEquals("Network timeout", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should propagate review not found error`() = runTest {
        // Given
        whenever(repository.deleteReview("invalid_id")).thenReturn(
            Result.failure(RuntimeException("Review not found"))
        )

        // When
        val result = useCase("invalid_id")

        // Then
        assertTrue(result.isFailure)
        assertEquals("Review not found", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should propagate permission denied error`() = runTest {
        // Given
        whenever(repository.deleteReview("review_123")).thenReturn(
            Result.failure(RuntimeException("Permission denied"))
        )

        // When
        val result = useCase("review_123")

        // Then
        assertTrue(result.isFailure)
        assertEquals("Permission denied", result.exceptionOrNull()?.message)
    }

    // ========== Edge Cases ==========

    @Test
    fun `invoke should handle repository returning specific exception types`() = runTest {
        // Given
        whenever(repository.deleteReview("review_123")).thenReturn(
            Result.failure(IllegalStateException("Review already deleted"))
        )

        // When
        val result = useCase("review_123")

        // Then
        assertTrue(result.isFailure)
        assertTrue(result.exceptionOrNull() is IllegalStateException)
        assertEquals("Review already deleted", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should handle multiple consecutive deletions`() = runTest {
        // Given
        whenever(repository.deleteReview(any())).thenReturn(Result.success(Unit))

        // When
        val result1 = useCase("review_1")
        val result2 = useCase("review_2")
        val result3 = useCase("review_3")

        // Then
        assertTrue(result1.isSuccess)
        assertTrue(result2.isSuccess)
        assertTrue(result3.isSuccess)

        verify(repository).deleteReview("review_1")
        verify(repository).deleteReview("review_2")
        verify(repository).deleteReview("review_3")
    }

    @Test
    fun `invoke should handle deletion of same review multiple times`() = runTest {
        // Given
        whenever(repository.deleteReview("review_123"))
            .thenReturn(Result.success(Unit))
            .thenReturn(Result.failure(RuntimeException("Review not found")))

        // When
        val result1 = useCase("review_123")
        val result2 = useCase("review_123")

        // Then
        assertTrue(result1.isSuccess)
        assertTrue(result2.isFailure)
        assertEquals("Review not found", result2.exceptionOrNull()?.message)
    }
}
