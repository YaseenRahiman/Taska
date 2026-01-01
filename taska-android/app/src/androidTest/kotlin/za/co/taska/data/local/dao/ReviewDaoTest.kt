package za.co.taska.data.local.dao

import android.content.Context
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import app.cash.turbine.test
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import za.co.taska.data.local.TaskaDatabase
import za.co.taska.data.local.entity.ReviewEntity

/**
 * Integration tests for ReviewDao
 * Tests Room database operations with in-memory database
 *
 * Coverage target: >70%
 */
@RunWith(AndroidJUnit4::class)
class ReviewDaoTest {

    private lateinit var database: TaskaDatabase
    private lateinit var reviewDao: ReviewDao

    @Before
    fun setup() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        database = Room.inMemoryDatabaseBuilder(
            context,
            TaskaDatabase::class.java
        ).allowMainThreadQueries().build()

        reviewDao = database.reviewDao()
    }

    @After
    fun teardown() {
        database.close()
    }

    // ========== Insert Tests ==========

    @Test
    fun insertReview_shouldInsertAndRetrieve() = runTest {
        // Given
        val review = createTestReviewEntity(id = "review_123")

        // When
        reviewDao.insertReview(review)

        // Then
        val retrieved = reviewDao.getReviewById("review_123")
        assertNotNull(retrieved)
        assertEquals("review_123", retrieved?.id)
        assertEquals("job_456", retrieved?.jobId)
        assertEquals(5, retrieved?.overallRating)
    }

    @Test
    fun insertReview_shouldReplaceOnConflict() = runTest {
        // Given
        val review1 = createTestReviewEntity(id = "review_123", overallRating = 5)
        val review2 = createTestReviewEntity(id = "review_123", overallRating = 3)

        // When
        reviewDao.insertReview(review1)
        reviewDao.insertReview(review2) // Should replace

        // Then
        val retrieved = reviewDao.getReviewById("review_123")
        assertEquals(3, retrieved?.overallRating)
    }

    @Test
    fun insertReviews_shouldInsertMultiple() = runTest {
        // Given
        val reviews = listOf(
            createTestReviewEntity(id = "review_1"),
            createTestReviewEntity(id = "review_2"),
            createTestReviewEntity(id = "review_3")
        )

        // When
        reviewDao.insertReviews(reviews)

        // Then
        val review1 = reviewDao.getReviewById("review_1")
        val review2 = reviewDao.getReviewById("review_2")
        val review3 = reviewDao.getReviewById("review_3")

        assertNotNull(review1)
        assertNotNull(review2)
        assertNotNull(review3)
    }

    // ========== Query Tests ==========

    @Test
    fun getReviewById_shouldReturnNull_whenNotFound() = runTest {
        // When
        val retrieved = reviewDao.getReviewById("nonexistent")

        // Then
        assertNull(retrieved)
    }

    @Test
    fun getReviewsByJobId_shouldReturnAllReviewsForJob() = runTest {
        // Given
        val job456Reviews = listOf(
            createTestReviewEntity(id = "review_1", jobId = "job_456"),
            createTestReviewEntity(id = "review_2", jobId = "job_456")
        )
        val job789Review = createTestReviewEntity(id = "review_3", jobId = "job_789")

        reviewDao.insertReviews(job456Reviews + job789Review)

        // When & Then
        reviewDao.getReviewsByJobId("job_456").test {
            val result = awaitItem()
            assertEquals(2, result.size)
            assertTrue(result.all { it.jobId == "job_456" })
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun getReviewsByJobId_shouldReturnEmpty_whenNoReviews() = runTest {
        // When & Then
        reviewDao.getReviewsByJobId("job_nonexistent").test {
            val result = awaitItem()
            assertTrue(result.isEmpty())
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun getReviewsByJobId_shouldOrderByCreatedAtDesc() = runTest {
        // Given
        val reviews = listOf(
            createTestReviewEntity(id = "review_1", jobId = "job_456", createdAt = "2025-10-31T10:00:00Z"),
            createTestReviewEntity(id = "review_2", jobId = "job_456", createdAt = "2025-10-31T12:00:00Z"),
            createTestReviewEntity(id = "review_3", jobId = "job_456", createdAt = "2025-10-31T11:00:00Z")
        )

        reviewDao.insertReviews(reviews)

        // When & Then
        reviewDao.getReviewsByJobId("job_456").test {
            val result = awaitItem()
            assertEquals(3, result.size)
            // Should be ordered by createdAt DESC
            assertEquals("review_2", result[0].id) // Latest
            assertEquals("review_3", result[1].id) // Middle
            assertEquals("review_1", result[2].id) // Oldest
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun getArtisanReviews_shouldReturnFlowFilteredByArtisan() = runTest {
        // Given
        val reviews = listOf(
            createTestReviewEntity(id = "review_1", artisanId = "artisan_123"),
            createTestReviewEntity(id = "review_2", artisanId = "artisan_123"),
            createTestReviewEntity(id = "review_3", artisanId = "artisan_456")
        )

        reviewDao.insertReviews(reviews)

        // When & Then
        reviewDao.getArtisanReviews("artisan_123").test {
            val result = awaitItem()
            assertEquals(2, result.size)
            assertTrue(result.all { it.artisanId == "artisan_123" })
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun getClientReviews_shouldReturnFlowFilteredByClient() = runTest {
        // Given
        val reviews = listOf(
            createTestReviewEntity(id = "review_1", clientId = "client_789"),
            createTestReviewEntity(id = "review_2", clientId = "client_789"),
            createTestReviewEntity(id = "review_3", clientId = "client_101")
        )

        reviewDao.insertReviews(reviews)

        // When & Then
        reviewDao.getClientReviews("client_789").test {
            val result = awaitItem()
            assertEquals(2, result.size)
            assertTrue(result.all { it.clientId == "client_789" })
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun getArtisanAverageRating_shouldCalculateAverage() = runTest {
        // Given
        val reviews = listOf(
            createTestReviewEntity(id = "review_1", artisanId = "artisan_123", overallRating = 5),
            createTestReviewEntity(id = "review_2", artisanId = "artisan_123", overallRating = 4),
            createTestReviewEntity(id = "review_3", artisanId = "artisan_123", overallRating = 3)
        )

        reviewDao.insertReviews(reviews)

        // When
        val average = reviewDao.getArtisanAverageRating("artisan_123")

        // Then
        assertEquals(4.0, average!!, 0.01) // (5+4+3)/3 = 4.0
    }

    @Test
    fun getArtisanAverageRating_shouldReturnNull_whenNoReviews() = runTest {
        // When
        val average = reviewDao.getArtisanAverageRating("artisan_nonexistent")

        // Then
        assertNull(average)
    }

    @Test
    fun getArtisanReviewCount_shouldCountReviews() = runTest {
        // Given
        val reviews = listOf(
            createTestReviewEntity(id = "review_1", artisanId = "artisan_123"),
            createTestReviewEntity(id = "review_2", artisanId = "artisan_123"),
            createTestReviewEntity(id = "review_3", artisanId = "artisan_456")
        )

        reviewDao.insertReviews(reviews)

        // When
        val count = reviewDao.getArtisanReviewCount("artisan_123")

        // Then
        assertEquals(2, count)
    }

    @Test
    fun getArtisanReviewCount_shouldReturnZero_whenNoReviews() = runTest {
        // When
        val count = reviewDao.getArtisanReviewCount("artisan_nonexistent")

        // Then
        assertEquals(0, count)
    }

    @Test
    fun getReviews_shouldRespectLimit() = runTest {
        // Given
        val reviews = (1..10).map { createTestReviewEntity(id = "review_$it") }
        reviewDao.insertReviews(reviews)

        // When & Then
        reviewDao.getReviews(limit = 5).test {
            val result = awaitItem()
            assertEquals(5, result.size)
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun getReviews_shouldOrderByCreatedAtDesc() = runTest {
        // Given
        val reviews = listOf(
            createTestReviewEntity(id = "review_1", createdAt = "2025-10-31T10:00:00Z"),
            createTestReviewEntity(id = "review_2", createdAt = "2025-10-31T12:00:00Z"),
            createTestReviewEntity(id = "review_3", createdAt = "2025-10-31T11:00:00Z")
        )

        reviewDao.insertReviews(reviews)

        // When & Then
        reviewDao.getReviews(50).test {
            val result = awaitItem()
            assertEquals(3, result.size)
            assertEquals("review_2", result[0].id) // Latest
            assertEquals("review_3", result[1].id)
            assertEquals("review_1", result[2].id) // Oldest
            cancelAndIgnoreRemainingEvents()
        }
    }

    // ========== Update Tests ==========

    @Test
    fun updateReview_shouldModifyExistingReview() = runTest {
        // Given
        val original = createTestReviewEntity(id = "review_123", overallRating = 5)
        reviewDao.insertReview(original)

        // When
        val updated = original.copy(overallRating = 4, updatedAt = "2025-11-01T10:00:00Z")
        reviewDao.updateReview(updated)

        // Then
        val retrieved = reviewDao.getReviewById("review_123")
        assertEquals(4, retrieved?.overallRating)
        assertEquals("2025-11-01T10:00:00Z", retrieved?.updatedAt)
    }

    @Test
    fun updateReview_shouldUpdateReviewText() = runTest {
        // Given
        val original = createTestReviewEntity(id = "review_123", reviewText = "Original")
        reviewDao.insertReview(original)

        // When
        val updated = original.copy(reviewText = "Updated text")
        reviewDao.updateReview(updated)

        // Then
        val retrieved = reviewDao.getReviewById("review_123")
        assertEquals("Updated text", retrieved?.reviewText)
    }

    // ========== Delete Tests ==========

    @Test
    fun deleteReview_shouldRemoveReview() = runTest {
        // Given
        val review = createTestReviewEntity(id = "review_123")
        reviewDao.insertReview(review)

        // When
        reviewDao.deleteReview(review)

        // Then
        val retrieved = reviewDao.getReviewById("review_123")
        assertNull(retrieved)
    }

    @Test
    fun deleteOldReviews_shouldRemoveReviewsOlderThanTimestamp() = runTest {
        // Given
        val now = System.currentTimeMillis()
        val oneDayAgo = now - (24 * 60 * 60 * 1000)
        val twoDaysAgo = now - (48 * 60 * 60 * 1000)

        val reviews = listOf(
            createTestReviewEntity(id = "review_old", cachedAt = twoDaysAgo),
            createTestReviewEntity(id = "review_recent", cachedAt = now)
        )

        reviewDao.insertReviews(reviews)

        // When - Delete reviews cached before yesterday
        reviewDao.deleteOldReviews(oneDayAgo)

        // Then
        val oldReview = reviewDao.getReviewById("review_old")
        val recentReview = reviewDao.getReviewById("review_recent")

        assertNull(oldReview) // Should be deleted
        assertNotNull(recentReview) // Should remain
    }

    @Test
    fun deleteAllReviews_shouldClearTable() = runTest {
        // Given
        val reviews = (1..5).map { createTestReviewEntity(id = "review_$it") }
        reviewDao.insertReviews(reviews)

        // When
        reviewDao.deleteAllReviews()

        // Then
        reviewDao.getReviews(50).test {
            val result = awaitItem()
            assertTrue(result.isEmpty())
            cancelAndIgnoreRemainingEvents()
        }
    }

    // ========== Flow Observation Tests ==========

    @Test
    fun getReviewsByJobId_shouldEmitUpdates_whenDataChanges() = runTest {
        // Given
        val review1 = createTestReviewEntity(id = "review_1", jobId = "job_456")
        reviewDao.insertReview(review1)

        // When & Then
        reviewDao.getReviewsByJobId("job_456").test {
            // Initial emission
            val initial = awaitItem()
            assertEquals(1, initial.size)

            // Insert another review
            val review2 = createTestReviewEntity(id = "review_2", jobId = "job_456")
            reviewDao.insertReview(review2)

            // Should emit update
            val updated = awaitItem()
            assertEquals(2, updated.size)

            cancelAndIgnoreRemainingEvents()
        }
    }

    // ========== Edge Cases ==========

    @Test
    fun insertReview_shouldHandleNullableFields() = runTest {
        // Given
        val review = createTestReviewEntity(
            id = "review_123",
            reviewText = null,
            updatedAt = null
        )

        // When
        reviewDao.insertReview(review)

        // Then
        val retrieved = reviewDao.getReviewById("review_123")
        assertNotNull(retrieved)
        assertNull(retrieved?.reviewText)
        assertNull(retrieved?.updatedAt)
    }

    @Test
    fun getReviews_shouldReturnEmpty_whenDatabaseEmpty() = runTest {
        // When & Then
        reviewDao.getReviews(50).test {
            val result = awaitItem()
            assertTrue(result.isEmpty())
            cancelAndIgnoreRemainingEvents()
        }
    }

    // ========== Helper Methods ==========

    private fun createTestReviewEntity(
        id: String = "review_123",
        jobId: String = "job_456",
        clientId: String = "client_789",
        artisanId: String = "artisan_101",
        overallRating: Int = 5,
        qualityRating: Int = 5,
        professionalismRating: Int = 4,
        timelinessRating: Int = 5,
        valueRating: Int = 4,
        reviewText: String? = "Great work!",
        images: String = "img1.jpg,img2.jpg",
        wouldRecommend: Boolean = true,
        createdAt: String = "2025-10-31T10:00:00Z",
        updatedAt: String? = null,
        cachedAt: Long = System.currentTimeMillis()
    ) = ReviewEntity(
        id = id,
        jobId = jobId,
        clientId = clientId,
        artisanId = artisanId,
        overallRating = overallRating,
        qualityRating = qualityRating,
        professionalismRating = professionalismRating,
        timelinessRating = timelinessRating,
        valueRating = valueRating,
        reviewText = reviewText,
        images = images,
        wouldRecommend = wouldRecommend,
        createdAt = createdAt,
        updatedAt = updatedAt,
        cachedAt = cachedAt
    )
}
