package za.co.taska.data.local.dao

import androidx.room.*
import kotlinx.coroutines.flow.Flow
import za.co.taska.data.local.entity.ReviewEntity

/**
 * Review DAO
 * Room database access object for reviews
 */
@Dao
interface ReviewDao {

    @Query("SELECT * FROM reviews WHERE id = :reviewId")
    suspend fun getReviewById(reviewId: String): ReviewEntity?

    @Query("SELECT * FROM reviews WHERE jobId = :jobId ORDER BY createdAt DESC")
    fun getReviewsByJobId(jobId: String): Flow<List<ReviewEntity>>

    @Query("SELECT * FROM reviews WHERE artisanId = :artisanId ORDER BY createdAt DESC")
    fun getArtisanReviews(artisanId: String): Flow<List<ReviewEntity>>

    @Query("SELECT * FROM reviews WHERE clientId = :clientId ORDER BY createdAt DESC")
    fun getClientReviews(clientId: String): Flow<List<ReviewEntity>>

    @Query("SELECT AVG(overallRating) FROM reviews WHERE artisanId = :artisanId")
    suspend fun getArtisanAverageRating(artisanId: String): Double?

    @Query("SELECT COUNT(*) FROM reviews WHERE artisanId = :artisanId")
    suspend fun getArtisanReviewCount(artisanId: String): Int

    @Query("SELECT * FROM reviews ORDER BY createdAt DESC LIMIT :limit")
    fun getReviews(limit: Int = 50): Flow<List<ReviewEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertReview(review: ReviewEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertReviews(reviews: List<ReviewEntity>)

    @Update
    suspend fun updateReview(review: ReviewEntity)

    @Delete
    suspend fun deleteReview(review: ReviewEntity)

    @Query("DELETE FROM reviews WHERE id = :reviewId")
    suspend fun deleteReviewById(reviewId: String)

    @Query("DELETE FROM reviews WHERE cachedAt < :timestamp")
    suspend fun deleteOldReviews(timestamp: Long)

    @Query("DELETE FROM reviews")
    suspend fun deleteAllReviews()
}
