package za.co.taska.domain.usecase.review

import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.mockito.kotlin.*
import za.co.taska.domain.model.Review
import za.co.taska.domain.repository.ReviewsRepository

/**
 * Unit tests for UpdateReviewUseCase
 * Tests validation logic and repository interaction
 *
 * Coverage target: >85%
 */
class UpdateReviewUseCaseTest {

    private lateinit var useCase: UpdateReviewUseCase
    private lateinit var repository: ReviewsRepository

    @Before
    fun setup() {
        repository = mock()
        useCase = UpdateReviewUseCase(repository)
    }

    // ========== Success Cases ==========

    @Test
    fun `invoke should return success when inputs valid and repository succeeds`() = runTest {
        // Given
        val updatedReview = createTestReview(overallRating = 4, reviewText = "Updated")
        whenever(repository.updateReview(any(), any(), any(), any(), any(), any(), any(), any(), any()))
            .thenReturn(Result.success(updatedReview))

        // When
        val result = useCase(
            reviewId = "review_123",
            overallRating = 4,
            reviewText = "Updated"
        )

        // Then
        assertTrue(result.isSuccess)
        assertEquals(4, result.getOrNull()?.overallRating)
        assertEquals("Updated", result.getOrNull()?.reviewText)

        // Verify repository called
        verify(repository).updateReview(
            reviewId = "review_123",
            overallRating = 4,
            qualityRating = null,
            professionalismRating = null,
            timelinessRating = null,
            valueRating = null,
            reviewText = "Updated",
            images = null,
            wouldRecommend = null
        )
    }

    @Test
    fun `invoke should succeed with all parameters null except reviewId`() = runTest {
        // Given
        whenever(repository.updateReview(any(), any(), any(), any(), any(), any(), any(), any(), any()))
            .thenReturn(Result.success(createTestReview()))

        // When
        val result = useCase(reviewId = "review_123")

        // Then
        assertTrue(result.isSuccess)

        // Verify repository called with all nulls
        verify(repository).updateReview(
            reviewId = eq("review_123"),
            overallRating = isNull(),
            qualityRating = isNull(),
            professionalismRating = isNull(),
            timelinessRating = isNull(),
            valueRating = isNull(),
            reviewText = isNull(),
            images = isNull(),
            wouldRecommend = isNull()
        )
    }

    @Test
    fun `invoke should succeed updating only rating`() = runTest {
        // Given
        whenever(repository.updateReview(any(), any(), any(), any(), any(), any(), any(), any(), any()))
            .thenReturn(Result.success(createTestReview()))

        // When
        val result = useCase(
            reviewId = "review_123",
            overallRating = 3
        )

        // Then
        assertTrue(result.isSuccess)
    }

    @Test
    fun `invoke should succeed updating only reviewText`() = runTest {
        // Given
        whenever(repository.updateReview(any(), any(), any(), any(), any(), any(), any(), any(), any()))
            .thenReturn(Result.success(createTestReview()))

        // When
        val result = useCase(
            reviewId = "review_123",
            reviewText = "New review text"
        )

        // Then
        assertTrue(result.isSuccess)
    }

    @Test
    fun `invoke should succeed updating only images`() = runTest {
        // Given
        whenever(repository.updateReview(any(), any(), any(), any(), any(), any(), any(), any(), any()))
            .thenReturn(Result.success(createTestReview()))

        // When
        val result = useCase(
            reviewId = "review_123",
            images = listOf("new1.jpg", "new2.jpg")
        )

        // Then
        assertTrue(result.isSuccess)
    }

    @Test
    fun `invoke should succeed updating only wouldRecommend`() = runTest {
        // Given
        whenever(repository.updateReview(any(), any(), any(), any(), any(), any(), any(), any(), any()))
            .thenReturn(Result.success(createTestReview()))

        // When
        val result = useCase(
            reviewId = "review_123",
            wouldRecommend = false
        )

        // Then
        assertTrue(result.isSuccess)
    }

    @Test
    fun `invoke should succeed updating all ratings`() = runTest {
        // Given
        whenever(repository.updateReview(any(), any(), any(), any(), any(), any(), any(), any(), any()))
            .thenReturn(Result.success(createTestReview()))

        // When
        val result = useCase(
            reviewId = "review_123",
            overallRating = 4,
            qualityRating = 4,
            professionalismRating = 3,
            timelinessRating = 5,
            valueRating = 4
        )

        // Then
        assertTrue(result.isSuccess)
    }

    @Test
    fun `invoke should accept all valid ratings 1 to 5`() = runTest {
        // Given
        whenever(repository.updateReview(any(), any(), any(), any(), any(), any(), any(), any(), any()))
            .thenReturn(Result.success(createTestReview()))

        // Test each valid rating
        for (rating in 1..5) {
            val result = useCase(
                reviewId = "review_123",
                overallRating = rating
            )
            assertTrue("Rating $rating should be valid", result.isSuccess)
        }
    }

    @Test
    fun `invoke should accept maximum 5 images`() = runTest {
        // Given
        whenever(repository.updateReview(any(), any(), any(), any(), any(), any(), any(), any(), any()))
            .thenReturn(Result.success(createTestReview()))

        // When
        val result = useCase(
            reviewId = "review_123",
            images = listOf("1.jpg", "2.jpg", "3.jpg", "4.jpg", "5.jpg")
        )

        // Then
        assertTrue(result.isSuccess)
    }

    @Test
    fun `invoke should accept maximum 2000 character review text`() = runTest {
        // Given
        whenever(repository.updateReview(any(), any(), any(), any(), any(), any(), any(), any(), any()))
            .thenReturn(Result.success(createTestReview()))

        // When
        val longText = "a".repeat(2000)
        val result = useCase(
            reviewId = "review_123",
            reviewText = longText
        )

        // Then
        assertTrue(result.isSuccess)
    }

    // ========== Validation Error Cases ==========

    @Test
    fun `invoke should fail when reviewId is blank`() = runTest {
        // When
        val result = useCase(
            reviewId = "",
            overallRating = 5
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Review ID cannot be empty", result.exceptionOrNull()?.message)
        verify(repository, never()).updateReview(any(), any(), any(), any(), any(), any(), any(), any(), any())
    }

    @Test
    fun `invoke should fail when reviewId is whitespace`() = runTest {
        // When
        val result = useCase(
            reviewId = "   ",
            reviewText = "Updated"
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Review ID cannot be empty", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when overallRating below 1`() = runTest {
        // When
        val result = useCase(
            reviewId = "review_123",
            overallRating = 0
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Overall rating must be between 1 and 5", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when overallRating above 5`() = runTest {
        // When
        val result = useCase(
            reviewId = "review_123",
            overallRating = 6
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Overall rating must be between 1 and 5", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when qualityRating invalid`() = runTest {
        // When
        val result = useCase(
            reviewId = "review_123",
            qualityRating = -1
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Quality rating must be between 1 and 5", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when professionalismRating invalid`() = runTest {
        // When
        val result = useCase(
            reviewId = "review_123",
            professionalismRating = 10
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Professionalism rating must be between 1 and 5", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when timelinessRating invalid`() = runTest {
        // When
        val result = useCase(
            reviewId = "review_123",
            timelinessRating = 0
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Timeliness rating must be between 1 and 5", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when valueRating invalid`() = runTest {
        // When
        val result = useCase(
            reviewId = "review_123",
            valueRating = 7
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Value rating must be between 1 and 5", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when reviewText is blank`() = runTest {
        // When
        val result = useCase(
            reviewId = "review_123",
            reviewText = "   "
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Review text cannot be blank (use null to remove)", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when reviewText exceeds 2000 characters`() = runTest {
        // When
        val tooLong = "a".repeat(2001)
        val result = useCase(
            reviewId = "review_123",
            reviewText = tooLong
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Review text cannot exceed 2000 characters", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when images list has more than 5 items`() = runTest {
        // When
        val result = useCase(
            reviewId = "review_123",
            images = listOf("1.jpg", "2.jpg", "3.jpg", "4.jpg", "5.jpg", "6.jpg")
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Maximum 5 review images allowed", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when images list contains blank URL`() = runTest {
        // When
        val result = useCase(
            reviewId = "review_123",
            images = listOf("valid.jpg", "", "another.jpg")
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Image URLs cannot be blank", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when images list contains whitespace URL`() = runTest {
        // When
        val result = useCase(
            reviewId = "review_123",
            images = listOf("valid.jpg", "   ")
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Image URLs cannot be blank", result.exceptionOrNull()?.message)
    }

    // ========== Repository Error Propagation ==========

    @Test
    fun `invoke should propagate repository errors`() = runTest {
        // Given
        whenever(repository.updateReview(any(), any(), any(), any(), any(), any(), any(), any(), any()))
            .thenReturn(Result.failure(RuntimeException("Unauthorized")))

        // When
        val result = useCase(
            reviewId = "review_123",
            overallRating = 4
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Unauthorized", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should propagate network errors`() = runTest {
        // Given
        whenever(repository.updateReview(any(), any(), any(), any(), any(), any(), any(), any(), any()))
            .thenReturn(Result.failure(RuntimeException("Network timeout")))

        // When
        val result = useCase(
            reviewId = "review_123",
            reviewText = "Updated"
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Network timeout", result.exceptionOrNull()?.message)
    }

    // ========== Edge Cases ==========

    @Test
    fun `invoke should handle updating multiple fields at once`() = runTest {
        // Given
        whenever(repository.updateReview(any(), any(), any(), any(), any(), any(), any(), any(), any()))
            .thenReturn(Result.success(createTestReview()))

        // When
        val result = useCase(
            reviewId = "review_123",
            overallRating = 3,
            reviewText = "Revised review",
            images = listOf("updated.jpg"),
            wouldRecommend = false
        )

        // Then
        assertTrue(result.isSuccess)

        // Verify all fields passed to repository
        verify(repository).updateReview(
            reviewId = eq("review_123"),
            overallRating = eq(3),
            qualityRating = isNull(),
            professionalismRating = isNull(),
            timelinessRating = isNull(),
            valueRating = isNull(),
            reviewText = eq("Revised review"),
            images = eq(listOf("updated.jpg")),
            wouldRecommend = eq(false)
        )
    }

    // ========== Helper Methods ==========

    private fun createTestReview(
        overallRating: Int = 5,
        reviewText: String? = "Great!"
    ) = Review(
        id = "review_123",
        jobId = "job_456",
        clientId = "client_789",
        artisanId = "artisan_101",
        overallRating = overallRating,
        qualityRating = 5,
        professionalismRating = 4,
        timelinessRating = 5,
        valueRating = 4,
        reviewText = reviewText,
        images = listOf("img1.jpg"),
        wouldRecommend = true,
        createdAt = "2025-10-31T10:00:00Z",
        updatedAt = "2025-11-01T10:00:00Z"
    )
}
