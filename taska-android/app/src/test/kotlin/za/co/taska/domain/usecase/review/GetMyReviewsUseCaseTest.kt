package za.co.taska.domain.usecase.review

import app.cash.turbine.test
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.mockito.kotlin.mock
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import za.co.taska.domain.model.Resource
import za.co.taska.domain.model.Review
import za.co.taska.domain.repository.ReviewsRepository

/**
 * Unit tests for GetMyReviewsUseCase
 * Tests flow emission and repository interaction
 *
 * Coverage target: >85%
 */
class GetMyReviewsUseCaseTest {

    private lateinit var useCase: GetMyReviewsUseCase
    private lateinit var repository: ReviewsRepository

    @Before
    fun setup() {
        repository = mock()
        useCase = GetMyReviewsUseCase(repository)
    }

    // ========== Success Cases ==========

    @Test
    fun `invoke should return flow with reviews when repository succeeds`() = runTest {
        // Given
        val reviews = listOf(
            createTestReview(id = "review_1", jobId = "job_1"),
            createTestReview(id = "review_2", jobId = "job_2"),
            createTestReview(id = "review_3", jobId = "job_3")
        )
        whenever(repository.getMyReviews()).thenReturn(
            flowOf(Resource.Success(reviews))
        )

        // When & Then
        useCase().test {
            val result = awaitItem()
            assertTrue(result is Resource.Success)
            assertEquals(3, (result as Resource.Success).data.size)
            assertEquals("review_1", result.data[0].id)
            assertEquals("review_2", result.data[1].id)
            assertEquals("review_3", result.data[2].id)
            awaitComplete()
        }

        // Verify repository called
        verify(repository).getMyReviews()
    }

    @Test
    fun `invoke should return flow with empty list when user has no reviews`() = runTest {
        // Given
        whenever(repository.getMyReviews()).thenReturn(
            flowOf(Resource.Success(emptyList()))
        )

        // When & Then
        useCase().test {
            val result = awaitItem()
            assertTrue(result is Resource.Success)
            assertEquals(0, (result as Resource.Success).data.size)
            awaitComplete()
        }

        verify(repository).getMyReviews()
    }

    @Test
    fun `invoke should emit loading state before success`() = runTest {
        // Given
        val reviews = listOf(createTestReview())
        whenever(repository.getMyReviews()).thenReturn(
            flowOf(
                Resource.Loading(),
                Resource.Success(reviews)
            )
        )

        // When & Then
        useCase().test {
            // First emission: Loading
            val loading = awaitItem()
            assertTrue(loading is Resource.Loading)

            // Second emission: Success
            val success = awaitItem()
            assertTrue(success is Resource.Success)
            assertEquals(1, (success as Resource.Success).data.size)

            awaitComplete()
        }
    }

    @Test
    fun `invoke should handle single review correctly`() = runTest {
        // Given
        val review = createTestReview(id = "review_123")
        whenever(repository.getMyReviews()).thenReturn(
            flowOf(Resource.Success(listOf(review)))
        )

        // When & Then
        useCase().test {
            val result = awaitItem()
            assertTrue(result is Resource.Success)
            assertEquals(1, (result as Resource.Success).data.size)
            assertEquals("review_123", result.data[0].id)
            awaitComplete()
        }
    }

    @Test
    fun `invoke should handle multiple reviews with different ratings`() = runTest {
        // Given
        val reviews = listOf(
            createTestReview(id = "review_1", overallRating = 5),
            createTestReview(id = "review_2", overallRating = 3),
            createTestReview(id = "review_3", overallRating = 4)
        )
        whenever(repository.getMyReviews()).thenReturn(
            flowOf(Resource.Success(reviews))
        )

        // When & Then
        useCase().test {
            val result = awaitItem()
            assertTrue(result is Resource.Success)
            val data = (result as Resource.Success).data
            assertEquals(3, data.size)
            assertEquals(5, data[0].overallRating)
            assertEquals(3, data[1].overallRating)
            assertEquals(4, data[2].overallRating)
            awaitComplete()
        }
    }

    // ========== Error Cases ==========

    @Test
    fun `invoke should propagate repository errors`() = runTest {
        // Given
        whenever(repository.getMyReviews()).thenReturn(
            flowOf(Resource.Error("Failed to fetch reviews"))
        )

        // When & Then
        useCase().test {
            val result = awaitItem()
            assertTrue(result is Resource.Error)
            assertEquals("Failed to fetch reviews", (result as Resource.Error).message)
            awaitComplete()
        }

        verify(repository).getMyReviews()
    }

    @Test
    fun `invoke should propagate network errors`() = runTest {
        // Given
        whenever(repository.getMyReviews()).thenReturn(
            flowOf(Resource.Error("Network timeout"))
        )

        // When & Then
        useCase().test {
            val result = awaitItem()
            assertTrue(result is Resource.Error)
            assertEquals("Network timeout", (result as Resource.Error).message)
            awaitComplete()
        }
    }

    @Test
    fun `invoke should handle unauthorized error`() = runTest {
        // Given
        whenever(repository.getMyReviews()).thenReturn(
            flowOf(Resource.Error("Unauthorized"))
        )

        // When & Then
        useCase().test {
            val result = awaitItem()
            assertTrue(result is Resource.Error)
            assertEquals("Unauthorized", (result as Resource.Error).message)
            awaitComplete()
        }
    }

    // ========== Edge Cases ==========

    @Test
    fun `invoke should handle flow updates correctly`() = runTest {
        // Given - simulating real-time updates
        whenever(repository.getMyReviews()).thenReturn(
            flowOf(
                Resource.Loading(),
                Resource.Success(listOf(createTestReview(id = "review_1"))),
                Resource.Success(listOf(
                    createTestReview(id = "review_1"),
                    createTestReview(id = "review_2")
                ))
            )
        )

        // When & Then
        useCase().test {
            // Loading
            val loading = awaitItem()
            assertTrue(loading is Resource.Loading)

            // First update
            val first = awaitItem()
            assertTrue(first is Resource.Success)
            assertEquals(1, (first as Resource.Success).data.size)

            // Second update
            val second = awaitItem()
            assertTrue(second is Resource.Success)
            assertEquals(2, (second as Resource.Success).data.size)

            awaitComplete()
        }
    }

    @Test
    fun `invoke should handle large review list`() = runTest {
        // Given
        val reviews = (1..50).map { createTestReview(id = "review_$it") }
        whenever(repository.getMyReviews()).thenReturn(
            flowOf(Resource.Success(reviews))
        )

        // When & Then
        useCase().test {
            val result = awaitItem()
            assertTrue(result is Resource.Success)
            assertEquals(50, (result as Resource.Success).data.size)
            awaitComplete()
        }
    }

    // ========== Helper Methods ==========

    private fun createTestReview(
        id: String = "review_123",
        jobId: String = "job_456",
        overallRating: Int = 5
    ) = Review(
        id = id,
        jobId = jobId,
        clientId = "client_789",
        artisanId = "artisan_101",
        overallRating = overallRating,
        qualityRating = 5,
        professionalismRating = 4,
        timelinessRating = 5,
        valueRating = 4,
        reviewText = "Great work!",
        images = listOf("img1.jpg"),
        wouldRecommend = true,
        createdAt = "2025-10-31T10:00:00Z",
        updatedAt = "2025-11-01T10:00:00Z"
    )
}
