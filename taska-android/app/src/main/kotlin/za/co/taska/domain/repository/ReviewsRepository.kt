package za.co.taska.domain.repository

import kotlinx.coroutines.flow.Flow
import za.co.taska.domain.model.Resource
import za.co.taska.domain.model.Review

/**
 * Reviews Repository Interface
 * Domain layer interface for review operations
 */
interface ReviewsRepository {

    /**
     * Create a new review for a completed job
     *
     * @param jobId Job ID to review
     * @param artisanId Artisan being reviewed
     * @param overallRating Overall rating (1-5)
     * @param qualityRating Quality rating (1-5)
     * @param professionalismRating Professionalism rating (1-5)
     * @param timelinessRating Timeliness rating (1-5)
     * @param valueRating Value rating (1-5)
     * @param reviewText Optional review text
     * @param images Optional review images
     * @param wouldRecommend Would recommend this artisan
     * @return Result containing created Review or error
     */
    suspend fun createReview(
        jobId: String,
        artisanId: String,
        overallRating: Int,
        qualityRating: Int,
        professionalismRating: Int,
        timelinessRating: Int,
        valueRating: Int,
        reviewText: String?,
        images: List<String>,
        wouldRecommend: Boolean
    ): Result<Review>

    /**
     * Update an existing review
     *
     * @param reviewId Review ID to update
     * @param overallRating Optional new overall rating
     * @param qualityRating Optional new quality rating
     * @param professionalismRating Optional new professionalism rating
     * @param timelinessRating Optional new timeliness rating
     * @param valueRating Optional new value rating
     * @param reviewText Optional new review text
     * @param images Optional new review images
     * @param wouldRecommend Optional new recommendation status
     * @return Result containing updated Review or error
     */
    suspend fun updateReview(
        reviewId: String,
        overallRating: Int? = null,
        qualityRating: Int? = null,
        professionalismRating: Int? = null,
        timelinessRating: Int? = null,
        valueRating: Int? = null,
        reviewText: String? = null,
        images: List<String>? = null,
        wouldRecommend: Boolean? = null
    ): Result<Review>

    /**
     * Get all reviews for a specific job
     *
     * @param jobId Job ID
     * @return Flow emitting Resource with review list
     */
    fun getJobReviews(jobId: String): Flow<Resource<List<Review>>>

    /**
     * Get all reviews for a specific artisan
     *
     * @param artisanId Artisan ID
     * @return Flow emitting Resource with review list
     */
    fun getArtisanReviews(artisanId: String): Flow<Resource<List<Review>>>

    /**
     * Get artisan's average rating
     *
     * @param artisanId Artisan ID
     * @return Average rating or null if no reviews
     */
    suspend fun getArtisanAverageRating(artisanId: String): Double?

    /**
     * Get artisan's total review count
     *
     * @param artisanId Artisan ID
     * @return Number of reviews
     */
    suspend fun getArtisanReviewCount(artisanId: String): Int

    /**
     * Get all reviews submitted by current user
     *
     * @return Flow emitting Resource with review list
     */
    fun getMyReviews(): Flow<Resource<List<Review>>>

    /**
     * Delete a review by ID
     *
     * @param reviewId Review ID to delete
     * @return Result indicating success or error
     */
    suspend fun deleteReview(reviewId: String): Result<Unit>
}
