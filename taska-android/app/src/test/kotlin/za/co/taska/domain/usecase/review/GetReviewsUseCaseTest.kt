package za.co.taska.domain.usecase.review

import app.cash.turbine.test
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.mockito.kotlin.*
import za.co.taska.domain.model.Resource
import za.co.taska.domain.model.Review
import za.co.taska.domain.repository.ReviewsRepository

/**
 * Unit tests for GetJobReviewsUseCase and GetArtisanReviewsUseCase
 * Tests validation logic and repository interaction
 *
 * Coverage target: >85%
 */
class GetReviewsUseCaseTest {

    private lateinit var getJobReviewsUseCase: GetJobReviewsUseCase
    private lateinit var getArtisanReviewsUseCase: GetArtisanReviewsUseCase
    private lateinit var repository: ReviewsRepository

    @Before
    fun setup() {
        repository = mock()
        getJobReviewsUseCase = GetJobReviewsUseCase(repository)
        getArtisanReviewsUseCase = GetArtisanReviewsUseCase(repository)
    }

    // ========== GetJobReviewsUseCase Tests ==========

    @Test
    fun `GetJobReviewsUseCase should return reviews when jobId valid`() = runTest {
        // Given
        val reviews = listOf(createTestReview())
        whenever(repository.getJobReviews("job_123")).thenReturn(
            flowOf(Resource.Success(reviews))
        )

        // When & Then
        getJobReviewsUseCase("job_123").test {
            val result = awaitItem()
            assertTrue(result is Resource.Success)
            assertEquals(1, (result as Resource.Success).data.size)
            awaitComplete()
        }

        // Verify repository called
        verify(repository).getJobReviews("job_123")
    }

    @Test
    fun `GetJobReviewsUseCase should return error when jobId is blank`() = runTest {
        // When & Then
        getJobReviewsUseCase("").test {
            val result = awaitItem()
            assertTrue(result is Resource.Error)
            assertEquals("Job ID cannot be empty", (result as Resource.Error).message)
            awaitComplete()
        }

        // Verify repository not called
        verify(repository, never()).getJobReviews(any())
    }

    @Test
    fun `GetJobReviewsUseCase should return error when jobId is whitespace`() = runTest {
        // When & Then
        getJobReviewsUseCase("   ").test {
            val result = awaitItem()
            assertTrue(result is Resource.Error)
            assertEquals("Job ID cannot be empty", (result as Resource.Error).message)
            awaitComplete()
        }
    }

    @Test
    fun `GetJobReviewsUseCase should propagate Loading state from repository`() = runTest {
        // Given
        whenever(repository.getJobReviews("job_123")).thenReturn(
            flowOf(
                Resource.Loading(),
                Resource.Success(listOf(createTestReview()))
            )
        )

        // When & Then
        getJobReviewsUseCase("job_123").test {
            val loading = awaitItem()
            assertTrue(loading is Resource.Loading)

            val success = awaitItem()
            assertTrue(success is Resource.Success)

            awaitComplete()
        }
    }

    @Test
    fun `GetJobReviewsUseCase should propagate Error state from repository`() = runTest {
        // Given
        whenever(repository.getJobReviews("job_123")).thenReturn(
            flowOf(Resource.Error("Network error"))
        )

        // When & Then
        getJobReviewsUseCase("job_123").test {
            val error = awaitItem()
            assertTrue(error is Resource.Error)
            assertEquals("Network error", (error as Resource.Error).message)
            awaitComplete()
        }
    }

    @Test
    fun `GetJobReviewsUseCase should handle empty reviews list`() = runTest {
        // Given
        whenever(repository.getJobReviews("job_123")).thenReturn(
            flowOf(Resource.Success(emptyList()))
        )

        // When & Then
        getJobReviewsUseCase("job_123").test {
            val result = awaitItem()
            assertTrue(result is Resource.Success)
            assertTrue((result as Resource.Success).data.isEmpty())
            awaitComplete()
        }
    }

    @Test
    fun `GetJobReviewsUseCase should handle multiple reviews`() = runTest {
        // Given
        val reviews = listOf(
            createTestReview(id = "review_1"),
            createTestReview(id = "review_2"),
            createTestReview(id = "review_3")
        )
        whenever(repository.getJobReviews("job_123")).thenReturn(
            flowOf(Resource.Success(reviews))
        )

        // When & Then
        getJobReviewsUseCase("job_123").test {
            val result = awaitItem()
            assertTrue(result is Resource.Success)
            assertEquals(3, (result as Resource.Success).data.size)
            awaitComplete()
        }
    }

    // ========== GetArtisanReviewsUseCase Tests ==========

    @Test
    fun `GetArtisanReviewsUseCase invoke should return reviews when artisanId valid`() = runTest {
        // Given
        val reviews = listOf(createTestReview())
        whenever(repository.getArtisanReviews("artisan_456")).thenReturn(
            flowOf(Resource.Success(reviews))
        )

        // When & Then
        getArtisanReviewsUseCase("artisan_456").test {
            val result = awaitItem()
            assertTrue(result is Resource.Success)
            assertEquals(1, (result as Resource.Success).data.size)
            awaitComplete()
        }

        // Verify repository called
        verify(repository).getArtisanReviews("artisan_456")
    }

    @Test
    fun `GetArtisanReviewsUseCase should return error when artisanId is blank`() = runTest {
        // When & Then
        getArtisanReviewsUseCase("").test {
            val result = awaitItem()
            assertTrue(result is Resource.Error)
            assertEquals("Artisan ID cannot be empty", (result as Resource.Error).message)
            awaitComplete()
        }

        // Verify repository not called
        verify(repository, never()).getArtisanReviews(any())
    }

    @Test
    fun `GetArtisanReviewsUseCase should return error when artisanId is whitespace`() = runTest {
        // When & Then
        getArtisanReviewsUseCase("   ").test {
            val result = awaitItem()
            assertTrue(result is Resource.Error)
            assertEquals("Artisan ID cannot be empty", (result as Resource.Error).message)
            awaitComplete()
        }
    }

    @Test
    fun `GetArtisanReviewsUseCase should handle empty reviews list`() = runTest {
        // Given
        whenever(repository.getArtisanReviews("artisan_456")).thenReturn(
            flowOf(Resource.Success(emptyList()))
        )

        // When & Then
        getArtisanReviewsUseCase("artisan_456").test {
            val result = awaitItem()
            assertTrue(result is Resource.Success)
            assertTrue((result as Resource.Success).data.isEmpty())
            awaitComplete()
        }
    }

    // ========== GetArtisanReviewsUseCase - getAverageRating Tests ==========

    @Test
    fun `getAverageRating should return average from repository`() = runTest {
        // Given
        whenever(repository.getArtisanAverageRating("artisan_456")).thenReturn(4.5)

        // When
        val result = getArtisanReviewsUseCase.getAverageRating("artisan_456")

        // Then
        assertEquals(4.5, result ?: 0.0, 0.01)
        verify(repository).getArtisanAverageRating("artisan_456")
    }

    @Test
    fun `getAverageRating should return null when artisanId blank`() = runTest {
        // When
        val result = getArtisanReviewsUseCase.getAverageRating("")

        // Then
        assertNull(result)
        verify(repository, never()).getArtisanAverageRating(any())
    }

    @Test
    fun `getAverageRating should return null when no reviews`() = runTest {
        // Given
        whenever(repository.getArtisanAverageRating("artisan_456")).thenReturn(null)

        // When
        val result = getArtisanReviewsUseCase.getAverageRating("artisan_456")

        // Then
        assertNull(result)
    }

    @Test
    fun `getAverageRating should handle various rating averages`() = runTest {
        // Test minimum average
        whenever(repository.getArtisanAverageRating("artisan_1")).thenReturn(1.0)
        assertEquals(1.0, getArtisanReviewsUseCase.getAverageRating("artisan_1") ?: 0.0, 0.01)

        // Test maximum average
        whenever(repository.getArtisanAverageRating("artisan_2")).thenReturn(5.0)
        assertEquals(5.0, getArtisanReviewsUseCase.getAverageRating("artisan_2") ?: 0.0, 0.01)

        // Test decimal average
        whenever(repository.getArtisanAverageRating("artisan_3")).thenReturn(3.7)
        assertEquals(3.7, getArtisanReviewsUseCase.getAverageRating("artisan_3") ?: 0.0, 0.01)
    }

    // ========== GetArtisanReviewsUseCase - getReviewCount Tests ==========

    @Test
    fun `getReviewCount should return count from repository`() = runTest {
        // Given
        whenever(repository.getArtisanReviewCount("artisan_456")).thenReturn(25)

        // When
        val result = getArtisanReviewsUseCase.getReviewCount("artisan_456")

        // Then
        assertEquals(25, result)
        verify(repository).getArtisanReviewCount("artisan_456")
    }

    @Test
    fun `getReviewCount should return zero when artisanId blank`() = runTest {
        // When
        val result = getArtisanReviewsUseCase.getReviewCount("")

        // Then
        assertEquals(0, result)
        verify(repository, never()).getArtisanReviewCount(any())
    }

    @Test
    fun `getReviewCount should return zero when no reviews`() = runTest {
        // Given
        whenever(repository.getArtisanReviewCount("artisan_456")).thenReturn(0)

        // When
        val result = getArtisanReviewsUseCase.getReviewCount("artisan_456")

        // Then
        assertEquals(0, result)
    }

    @Test
    fun `getReviewCount should handle large counts`() = runTest {
        // Given
        whenever(repository.getArtisanReviewCount("artisan_456")).thenReturn(1000)

        // When
        val result = getArtisanReviewsUseCase.getReviewCount("artisan_456")

        // Then
        assertEquals(1000, result)
    }

    // ========== Combined Functionality Tests ==========

    @Test
    fun `should fetch both reviews and stats for artisan profile`() = runTest {
        // Given
        val reviews = listOf(
            createTestReview(id = "review_1", overallRating = 5),
            createTestReview(id = "review_2", overallRating = 4)
        )
        whenever(repository.getArtisanReviews("artisan_456")).thenReturn(
            flowOf(Resource.Success(reviews))
        )
        whenever(repository.getArtisanAverageRating("artisan_456")).thenReturn(4.5)
        whenever(repository.getArtisanReviewCount("artisan_456")).thenReturn(2)

        // When - simulating artisan profile page load
        val reviewsFlow = getArtisanReviewsUseCase("artisan_456")
        val average = getArtisanReviewsUseCase.getAverageRating("artisan_456")
        val count = getArtisanReviewsUseCase.getReviewCount("artisan_456")

        // Then
        reviewsFlow.test {
            val result = awaitItem()
            assertTrue(result is Resource.Success)
            assertEquals(2, (result as Resource.Success).data.size)
            awaitComplete()
        }
        assertEquals(4.5, average ?: 0.0, 0.01)
        assertEquals(2, count)
    }

    // ========== Helper Methods ==========

    private fun createTestReview(
        id: String = "review_123",
        overallRating: Int = 5
    ) = Review(
        id = id,
        jobId = "job_456",
        clientId = "client_789",
        artisanId = "artisan_101",
        overallRating = overallRating,
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
