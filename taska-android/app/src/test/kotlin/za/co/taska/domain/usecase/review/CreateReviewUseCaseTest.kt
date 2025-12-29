package za.co.taska.domain.usecase.review

import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.mockito.kotlin.*
import za.co.taska.domain.model.Review
import za.co.taska.domain.repository.ReviewsRepository

/**
 * Unit tests for CreateReviewUseCase
 * Tests validation logic and repository interaction
 *
 * Coverage target: >85%
 */
class CreateReviewUseCaseTest {

    private lateinit var useCase: CreateReviewUseCase
    private lateinit var repository: ReviewsRepository

    @Before
    fun setup() {
        repository = mock()
        useCase = CreateReviewUseCase(repository)
    }

    // ========== Success Cases ==========

    @Test
    fun `invoke should return success when all inputs valid and repository succeeds`() = runTest {
        // Given
        val review = createTestReview()
        whenever(repository.createReview(any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
            .thenReturn(Result.success(review))

        // When
        val result = useCase(
            jobId = "job_123",
            artisanId = "artisan_456",
            overallRating = 5,
            qualityRating = 5,
            professionalismRating = 4,
            timelinessRating = 5,
            valueRating = 4,
            reviewText = "Excellent work!",
            images = listOf("img1.jpg"),
            wouldRecommend = true
        )

        // Then
        assertTrue(result.isSuccess)
        assertEquals("review_123", result.getOrNull()?.id)

        // Verify repository called
        verify(repository).createReview(
            jobId = "job_123",
            artisanId = "artisan_456",
            overallRating = 5,
            qualityRating = 5,
            professionalismRating = 4,
            timelinessRating = 5,
            valueRating = 4,
            reviewText = "Excellent work!",
            images = listOf("img1.jpg"),
            wouldRecommend = true
        )
    }

    @Test
    fun `invoke should succeed with null reviewText`() = runTest {
        // Given
        whenever(repository.createReview(any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
            .thenReturn(Result.success(createTestReview()))

        // When
        val result = useCase(
            jobId = "job_123",
            artisanId = "artisan_456",
            overallRating = 5,
            qualityRating = 5,
            professionalismRating = 5,
            timelinessRating = 5,
            valueRating = 5,
            reviewText = null,
            images = emptyList(),
            wouldRecommend = true
        )

        // Then
        assertTrue(result.isSuccess)
    }

    @Test
    fun `invoke should succeed with empty images list`() = runTest {
        // Given
        whenever(repository.createReview(any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
            .thenReturn(Result.success(createTestReview()))

        // When
        val result = useCase(
            jobId = "job_123",
            artisanId = "artisan_456",
            overallRating = 4,
            qualityRating = 4,
            professionalismRating = 4,
            timelinessRating = 4,
            valueRating = 4,
            reviewText = "Good",
            images = emptyList(),
            wouldRecommend = true
        )

        // Then
        assertTrue(result.isSuccess)
    }

    @Test
    fun `invoke should accept all valid ratings from 1 to 5`() = runTest {
        // Given
        whenever(repository.createReview(any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
            .thenReturn(Result.success(createTestReview()))

        // Test all combinations of valid ratings
        for (rating in 1..5) {
            val result = useCase(
                jobId = "job_123",
                artisanId = "artisan_456",
                overallRating = rating,
                qualityRating = rating,
                professionalismRating = rating,
                timelinessRating = rating,
                valueRating = rating,
                reviewText = "Rating $rating",
                images = emptyList(),
                wouldRecommend = rating >= 3
            )
            assertTrue("Rating $rating should be valid", result.isSuccess)
        }
    }

    @Test
    fun `invoke should accept maximum 5 images`() = runTest {
        // Given
        whenever(repository.createReview(any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
            .thenReturn(Result.success(createTestReview()))

        // When
        val result = useCase(
            jobId = "job_123",
            artisanId = "artisan_456",
            overallRating = 5,
            qualityRating = 5,
            professionalismRating = 5,
            timelinessRating = 5,
            valueRating = 5,
            reviewText = "Review",
            images = listOf("1.jpg", "2.jpg", "3.jpg", "4.jpg", "5.jpg"),
            wouldRecommend = true
        )

        // Then
        assertTrue(result.isSuccess)
    }

    @Test
    fun `invoke should accept maximum 2000 character review text`() = runTest {
        // Given
        whenever(repository.createReview(any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
            .thenReturn(Result.success(createTestReview()))

        // When
        val longText = "a".repeat(2000)
        val result = useCase(
            jobId = "job_123",
            artisanId = "artisan_456",
            overallRating = 5,
            qualityRating = 5,
            professionalismRating = 5,
            timelinessRating = 5,
            valueRating = 5,
            reviewText = longText,
            images = emptyList(),
            wouldRecommend = true
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
            artisanId = "artisan_456",
            overallRating = 5,
            qualityRating = 5,
            professionalismRating = 5,
            timelinessRating = 5,
            valueRating = 5,
            reviewText = "Good",
            images = emptyList(),
            wouldRecommend = true
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Job ID cannot be empty", result.exceptionOrNull()?.message)
        verify(repository, never()).createReview(any(), any(), any(), any(), any(), any(), any(), any(), any(), any())
    }

    @Test
    fun `invoke should fail when artisanId is blank`() = runTest {
        // When
        val result = useCase(
            jobId = "job_123",
            artisanId = "   ",
            overallRating = 5,
            qualityRating = 5,
            professionalismRating = 5,
            timelinessRating = 5,
            valueRating = 5,
            reviewText = "Good",
            images = emptyList(),
            wouldRecommend = true
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Artisan ID cannot be empty", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when overallRating below 1`() = runTest {
        // When
        val result = useCase(
            jobId = "job_123",
            artisanId = "artisan_456",
            overallRating = 0,
            qualityRating = 5,
            professionalismRating = 5,
            timelinessRating = 5,
            valueRating = 5,
            reviewText = "Good",
            images = emptyList(),
            wouldRecommend = true
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Overall rating must be between 1 and 5", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when overallRating above 5`() = runTest {
        // When
        val result = useCase(
            jobId = "job_123",
            artisanId = "artisan_456",
            overallRating = 6,
            qualityRating = 5,
            professionalismRating = 5,
            timelinessRating = 5,
            valueRating = 5,
            reviewText = "Good",
            images = emptyList(),
            wouldRecommend = true
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Overall rating must be between 1 and 5", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when qualityRating invalid`() = runTest {
        // When
        val result = useCase(
            jobId = "job_123",
            artisanId = "artisan_456",
            overallRating = 5,
            qualityRating = 0,
            professionalismRating = 5,
            timelinessRating = 5,
            valueRating = 5,
            reviewText = "Good",
            images = emptyList(),
            wouldRecommend = true
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Quality rating must be between 1 and 5", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when professionalismRating invalid`() = runTest {
        // When
        val result = useCase(
            jobId = "job_123",
            artisanId = "artisan_456",
            overallRating = 5,
            qualityRating = 5,
            professionalismRating = 6,
            timelinessRating = 5,
            valueRating = 5,
            reviewText = "Good",
            images = emptyList(),
            wouldRecommend = true
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Professionalism rating must be between 1 and 5", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when timelinessRating invalid`() = runTest {
        // When
        val result = useCase(
            jobId = "job_123",
            artisanId = "artisan_456",
            overallRating = 5,
            qualityRating = 5,
            professionalismRating = 5,
            timelinessRating = -1,
            valueRating = 5,
            reviewText = "Good",
            images = emptyList(),
            wouldRecommend = true
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Timeliness rating must be between 1 and 5", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when valueRating invalid`() = runTest {
        // When
        val result = useCase(
            jobId = "job_123",
            artisanId = "artisan_456",
            overallRating = 5,
            qualityRating = 5,
            professionalismRating = 5,
            timelinessRating = 5,
            valueRating = 10,
            reviewText = "Good",
            images = emptyList(),
            wouldRecommend = true
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Value rating must be between 1 and 5", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when reviewText is blank`() = runTest {
        // When
        val result = useCase(
            jobId = "job_123",
            artisanId = "artisan_456",
            overallRating = 5,
            qualityRating = 5,
            professionalismRating = 5,
            timelinessRating = 5,
            valueRating = 5,
            reviewText = "   ",
            images = emptyList(),
            wouldRecommend = true
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Review text cannot be blank (use null instead)", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when reviewText exceeds 2000 characters`() = runTest {
        // When
        val tooLong = "a".repeat(2001)
        val result = useCase(
            jobId = "job_123",
            artisanId = "artisan_456",
            overallRating = 5,
            qualityRating = 5,
            professionalismRating = 5,
            timelinessRating = 5,
            valueRating = 5,
            reviewText = tooLong,
            images = emptyList(),
            wouldRecommend = true
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Review text cannot exceed 2000 characters", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when more than 5 images`() = runTest {
        // When
        val result = useCase(
            jobId = "job_123",
            artisanId = "artisan_456",
            overallRating = 5,
            qualityRating = 5,
            professionalismRating = 5,
            timelinessRating = 5,
            valueRating = 5,
            reviewText = "Good",
            images = listOf("1.jpg", "2.jpg", "3.jpg", "4.jpg", "5.jpg", "6.jpg"),
            wouldRecommend = true
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Maximum 5 review images allowed", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when image URL is blank`() = runTest {
        // When
        val result = useCase(
            jobId = "job_123",
            artisanId = "artisan_456",
            overallRating = 5,
            qualityRating = 5,
            professionalismRating = 5,
            timelinessRating = 5,
            valueRating = 5,
            reviewText = "Good",
            images = listOf("valid.jpg", ""),
            wouldRecommend = true
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Image URLs cannot be blank", result.exceptionOrNull()?.message)
    }

    // ========== Repository Error Propagation ==========

    @Test
    fun `invoke should propagate repository errors`() = runTest {
        // Given
        whenever(repository.createReview(any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
            .thenReturn(Result.failure(RuntimeException("Duplicate review")))

        // When
        val result = useCase(
            jobId = "job_123",
            artisanId = "artisan_456",
            overallRating = 5,
            qualityRating = 5,
            professionalismRating = 5,
            timelinessRating = 5,
            valueRating = 5,
            reviewText = "Good",
            images = emptyList(),
            wouldRecommend = true
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Duplicate review", result.exceptionOrNull()?.message)
    }

    // ========== Helper Methods ==========

    private fun createTestReview() = Review(
        id = "review_123",
        jobId = "job_456",
        clientId = "client_789",
        artisanId = "artisan_101",
        overallRating = 5,
        qualityRating = 5,
        professionalismRating = 4,
        timelinessRating = 5,
        valueRating = 4,
        reviewText = "Great!",
        images = listOf("img1.jpg"),
        wouldRecommend = true,
        createdAt = "2025-10-31T10:00:00Z",
        updatedAt = null
    )
}
