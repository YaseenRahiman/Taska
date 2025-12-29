package za.co.taska.data.repository

import app.cash.turbine.test
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.mockito.kotlin.*
import retrofit2.Response
import za.co.taska.data.local.dao.ReviewDao
import za.co.taska.data.local.entity.ReviewEntity
import za.co.taska.data.mapper.ReviewMapper
import za.co.taska.data.remote.api.ReviewsApiService
import za.co.taska.data.remote.dto.request.CreateReviewRequest
import za.co.taska.data.remote.dto.request.UpdateReviewRequest
import za.co.taska.data.remote.dto.response.ReviewResponse
import za.co.taska.domain.model.Resource

/**
 * Unit tests for ReviewsRepositoryImpl
 * Tests network-first caching strategy and error handling
 *
 * Coverage target: >85%
 */
class ReviewsRepositoryImplTest {

    private lateinit var repository: ReviewsRepositoryImpl
    private lateinit var apiService: ReviewsApiService
    private lateinit var reviewDao: ReviewDao
    private lateinit var mapper: ReviewMapper

    @Before
    fun setup() {
        apiService = mock()
        reviewDao = mock()
        mapper = ReviewMapper() // Use real mapper
        repository = ReviewsRepositoryImpl(apiService, reviewDao, mapper)
    }

    // ========== createReview Tests ==========

    @Test
    fun `createReview should return success when API call succeeds`() = runTest {
        // Given
        val reviewResponse = createTestReviewResponse()
        whenever(apiService.createReview(any())).thenReturn(
            Response.success(reviewResponse)
        )

        // When
        val result = repository.createReview(
            jobId = "job_456",
            artisanId = "artisan_101",
            overallRating = 5,
            qualityRating = 5,
            professionalismRating = 4,
            timelinessRating = 5,
            valueRating = 4,
            reviewText = "Excellent!",
            images = listOf("img1.jpg"),
            wouldRecommend = true
        )

        // Then
        assertTrue(result.isSuccess)
        assertEquals("review_123", result.getOrNull()?.id)

        // Verify API called
        verify(apiService).createReview(
            check {
                assertEquals("job_456", it.jobId)
                assertEquals("artisan_101", it.artisanId)
                assertEquals(5, it.overallRating)
            }
        )

        // Verify cache updated
        verify(reviewDao).insertReview(any())
    }

    @Test
    fun `createReview should return failure when API fails`() = runTest {
        // Given
        whenever(apiService.createReview(any())).thenReturn(
            Response.error(400, "Bad Request".toResponseBody())
        )

        // When
        val result = repository.createReview(
            jobId = "job_456",
            artisanId = "artisan_101",
            overallRating = 5,
            qualityRating = 5,
            professionalismRating = 4,
            timelinessRating = 5,
            valueRating = 4,
            reviewText = null,
            images = emptyList(),
            wouldRecommend = true
        )

        // Then
        assertTrue(result.isFailure)
        assertTrue(result.exceptionOrNull()?.message?.contains("Failed to create review") == true)

        // Verify cache not updated
        verify(reviewDao, never()).insertReview(any())
    }

    @Test
    fun `createReview should return failure when exception thrown`() = runTest {
        // Given
        whenever(apiService.createReview(any())).thenThrow(
            RuntimeException("Network error")
        )

        // When
        val result = repository.createReview(
            jobId = "job_456",
            artisanId = "artisan_101",
            overallRating = 5,
            qualityRating = 5,
            professionalismRating = 4,
            timelinessRating = 5,
            valueRating = 4,
            reviewText = "Great",
            images = listOf("img1.jpg", "img2.jpg"),
            wouldRecommend = true
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Network error", result.exceptionOrNull()?.message)
    }

    // ========== updateReview Tests ==========

    @Test
    fun `updateReview should return success when API call succeeds`() = runTest {
        // Given
        val updatedReview = createTestReviewResponse(
            overallRating = 4,
            reviewText = "Updated review",
            updatedAt = "2025-11-01T10:00:00Z"
        )
        whenever(apiService.updateReview(eq("review_123"), any())).thenReturn(
            Response.success(updatedReview)
        )

        // When
        val result = repository.updateReview(
            reviewId = "review_123",
            overallRating = 4,
            reviewText = "Updated review"
        )

        // Then
        assertTrue(result.isSuccess)
        assertEquals(4, result.getOrNull()?.overallRating)
        assertEquals("Updated review", result.getOrNull()?.reviewText)

        // Verify cache updated
        verify(reviewDao).updateReview(any())
    }

    @Test
    fun `updateReview should handle partial updates`() = runTest {
        // Given
        val reviewResponse = createTestReviewResponse()
        whenever(apiService.updateReview(any(), any())).thenReturn(
            Response.success(reviewResponse)
        )

        // When - update only rating
        val result = repository.updateReview(
            reviewId = "review_123",
            overallRating = 3
        )

        // Then
        assertTrue(result.isSuccess)

        // Verify API called with partial update
        verify(apiService).updateReview(
            eq("review_123"),
            check {
                assertEquals(3, it.overallRating)
                assertNull(it.reviewText)
                assertNull(it.images)
            }
        )
    }

    @Test
    fun `updateReview should return failure when API fails`() = runTest {
        // Given
        whenever(apiService.updateReview(any(), any())).thenReturn(
            Response.error(403, "Forbidden".toResponseBody())
        )

        // When
        val result = repository.updateReview(
            reviewId = "review_123",
            reviewText = "New text"
        )

        // Then
        assertTrue(result.isFailure)
        assertTrue(result.exceptionOrNull()?.message?.contains("Failed to update review") == true)
    }

    // ========== getJobReviews Tests ==========

    @Test
    fun `getJobReviews should emit Loading then Success when API succeeds`() = runTest {
        // Given
        val cachedEntities = listOf(createTestReviewEntity())
        val reviewResponses = listOf(createTestReviewResponse())

        whenever(reviewDao.getReviewsByJobId("job_456")).thenReturn(
            flowOf(cachedEntities)
        )
        whenever(apiService.getJobReviews("job_456")).thenReturn(
            Response.success(reviewResponses)
        )

        // When & Then
        repository.getJobReviews("job_456").test {
            // Loading
            val loading1 = awaitItem()
            assertTrue(loading1 is Resource.Loading)

            // Loading with cache
            val loading2 = awaitItem()
            assertTrue(loading2 is Resource.Loading)
            if (loading2 is Resource.Loading) {
                assertEquals(1, loading2.data?.size)
            }

            // Success with network data
            val success = awaitItem()
            assertTrue(success is Resource.Success)
            if (success is Resource.Success) {
                assertEquals(1, success.data?.size)
            }

            awaitComplete()
        }

        // Verify cache updated
        verify(reviewDao).insertReviews(any())
    }

    @Test
    fun `getJobReviews should emit Error with cache when API fails`() = runTest {
        // Given
        val cachedEntities = listOf(createTestReviewEntity())

        whenever(reviewDao.getReviewsByJobId("job_456")).thenReturn(
            flowOf(cachedEntities)
        )
        whenever(apiService.getJobReviews("job_456")).thenReturn(
            Response.error(500, "Server Error".toResponseBody())
        )

        // When & Then
        repository.getJobReviews("job_456").test {
            // Loading
            awaitItem()

            // Loading with cache
            val loading = awaitItem()
            assertTrue(loading is Resource.Loading)

            // Error with cache
            val error = awaitItem()
            assertTrue(error is Resource.Error)
            // Note: Resource.Error doesn't have data field

            awaitComplete()
        }
    }

    @Test
    fun `getJobReviews should emit Error without cache when both fail`() = runTest {
        // Given
        whenever(reviewDao.getReviewsByJobId("job_456")).thenReturn(
            flowOf(emptyList())
        )
        whenever(apiService.getJobReviews("job_456")).thenReturn(
            Response.error(404, "Not Found".toResponseBody())
        )

        // When & Then
        repository.getJobReviews("job_456").test {
            // Loading
            awaitItem()

            // Error without data
            val error = awaitItem()
            assertTrue(error is Resource.Error)
            // Note: Resource.Error doesn't have data field

            awaitComplete()
        }
    }

    // ========== getArtisanReviews Tests ==========

    @Test
    fun `getArtisanReviews should emit cached reviews`() = runTest {
        // Given
        val cachedEntities = listOf(
            createTestReviewEntity(id = "review_1"),
            createTestReviewEntity(id = "review_2")
        )

        whenever(reviewDao.getArtisanReviews("artisan_101")).thenReturn(
            flowOf(cachedEntities)
        )

        // When & Then
        repository.getArtisanReviews("artisan_101").test {
            // Loading
            val loading = awaitItem()
            assertTrue(loading is Resource.Loading)

            // Success with cached data
            val success = awaitItem()
            assertTrue(success is Resource.Success)
            if (success is Resource.Success) {
                assertEquals(2, success.data?.size)
            }

            awaitComplete()
        }
    }

    @Test
    fun `getArtisanReviews should emit empty list when no cache`() = runTest {
        // Given
        whenever(reviewDao.getArtisanReviews("artisan_101")).thenReturn(
            flowOf(emptyList())
        )

        // When & Then
        repository.getArtisanReviews("artisan_101").test {
            // Loading
            awaitItem()

            // Success with empty list
            val success = awaitItem()
            assertTrue(success is Resource.Success)
            if (success is Resource.Success) {
                assertTrue(success.data?.isEmpty() == true)
            }

            awaitComplete()
        }
    }

    // ========== getArtisanAverageRating Tests ==========

    @Test
    fun `getArtisanAverageRating should return average from cache`() = runTest {
        // Given
        whenever(reviewDao.getArtisanAverageRating("artisan_101")).thenReturn(4.5)

        // When
        val result = repository.getArtisanAverageRating("artisan_101")

        // Then
        assertEquals(4.5, result ?: 0.0, 0.01)
    }

    @Test
    fun `getArtisanAverageRating should return null when no reviews`() = runTest {
        // Given
        whenever(reviewDao.getArtisanAverageRating("artisan_101")).thenReturn(null)

        // When
        val result = repository.getArtisanAverageRating("artisan_101")

        // Then
        assertNull(result)
    }

    // ========== getArtisanReviewCount Tests ==========

    @Test
    fun `getArtisanReviewCount should return count from cache`() = runTest {
        // Given
        whenever(reviewDao.getArtisanReviewCount("artisan_101")).thenReturn(25)

        // When
        val result = repository.getArtisanReviewCount("artisan_101")

        // Then
        assertEquals(25, result)
    }

    @Test
    fun `getArtisanReviewCount should return zero when no reviews`() = runTest {
        // Given
        whenever(reviewDao.getArtisanReviewCount("artisan_101")).thenReturn(0)

        // When
        val result = repository.getArtisanReviewCount("artisan_101")

        // Then
        assertEquals(0, result)
    }

    // ========== Helper Methods ==========

    private fun createTestReviewResponse(
        id: String = "review_123",
        overallRating: Int = 5,
        reviewText: String? = "Great work!",
        updatedAt: String? = null
    ) = ReviewResponse(
        id = id,
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
        updatedAt = updatedAt
    )

    private fun createTestReviewEntity(
        id: String = "review_123"
    ) = ReviewEntity(
        id = id,
        jobId = "job_456",
        clientId = "client_789",
        artisanId = "artisan_101",
        overallRating = 5,
        qualityRating = 5,
        professionalismRating = 4,
        timelinessRating = 5,
        valueRating = 4,
        reviewText = "Great!",
        images = "img1.jpg",
        wouldRecommend = true,
        createdAt = "2025-10-31T10:00:00Z",
        updatedAt = null,
        cachedAt = System.currentTimeMillis()
    )
}
