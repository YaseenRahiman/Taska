package za.co.taska.data.repository

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import za.co.taska.data.local.dao.ReviewDao
import za.co.taska.data.mapper.ReviewMapper
import za.co.taska.data.remote.api.ReviewsApiService
import za.co.taska.data.remote.dto.request.CreateReviewRequest
import za.co.taska.data.remote.dto.request.UpdateReviewRequest
import za.co.taska.domain.model.Resource
import za.co.taska.domain.model.Review
import za.co.taska.domain.repository.ReviewsRepository
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Reviews Repository Implementation
 * Data layer implementation with network-first caching strategy
 */
@Singleton
class ReviewsRepositoryImpl @Inject constructor(
    private val apiService: ReviewsApiService,
    private val reviewDao: ReviewDao,
    private val mapper: ReviewMapper
) : ReviewsRepository {

    /**
     * Create a new review
     * Network-only operation with cache update
     */
    override suspend fun createReview(
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
    ): Result<Review> {
        return try {
            val request = CreateReviewRequest(
                jobId = jobId,
                artisanId = artisanId,
                overallRating = overallRating,
                qualityRating = qualityRating,
                professionalismRating = professionalismRating,
                timelinessRating = timelinessRating,
                valueRating = valueRating,
                reviewText = reviewText,
                images = images,
                wouldRecommend = wouldRecommend
            )

            val response = apiService.createReview(request)

            if (response.isSuccessful && response.body() != null) {
                val review = mapper.toDomain(response.body()!!)

                // Cache the new review
                reviewDao.insertReview(mapper.toEntity(review))

                Result.success(review)
            } else {
                Result.failure(Exception("Failed to create review: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Update an existing review
     * Network-only operation with cache update
     */
    override suspend fun updateReview(
        reviewId: String,
        overallRating: Int?,
        qualityRating: Int?,
        professionalismRating: Int?,
        timelinessRating: Int?,
        valueRating: Int?,
        reviewText: String?,
        images: List<String>?,
        wouldRecommend: Boolean?
    ): Result<Review> {
        return try {
            val request = UpdateReviewRequest(
                overallRating = overallRating,
                qualityRating = qualityRating,
                professionalismRating = professionalismRating,
                timelinessRating = timelinessRating,
                valueRating = valueRating,
                reviewText = reviewText,
                images = images,
                wouldRecommend = wouldRecommend
            )

            val response = apiService.updateReview(reviewId, request)

            if (response.isSuccessful && response.body() != null) {
                val review = mapper.toDomain(response.body()!!)

                // Update cache
                reviewDao.updateReview(mapper.toEntity(review))

                Result.success(review)
            } else {
                Result.failure(Exception("Failed to update review: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Get reviews for a specific job
     * Network-first with cache fallback
     */
    override fun getJobReviews(jobId: String): Flow<Resource<List<Review>>> = flow {
        emit(Resource.Loading())

        // Try cache first for immediate display
        reviewDao.getReviewsByJobId(jobId).collect { cachedReviews ->
            if (cachedReviews.isNotEmpty()) {
                emit(Resource.Loading(data = mapper.fromEntityList(cachedReviews)))
            }
        }

        // Fetch from network
        try {
            val response = apiService.getJobReviews(jobId)

            if (response.isSuccessful && response.body() != null) {
                val reviews = mapper.toDomainList(response.body()!!)

                // Update cache
                val entities = reviews.map { mapper.toEntity(it) }
                reviewDao.insertReviews(entities)

                emit(Resource.Success(reviews))
            } else {
                // Network failed, emit cached data if available
                val cachedData = reviewDao.getReviewsByJobId(jobId)
                cachedData.collect { cached ->
                    if (cached.isNotEmpty()) {
                        emit(Resource.Error(
                            message = "Failed to fetch latest reviews: ${response.message()}"
                        ))
                    } else {
                        emit(Resource.Error("No reviews found: ${response.message()}"))
                    }
                }
            }
        } catch (e: Exception) {
            // Network error, emit cached data if available
            val cachedData = reviewDao.getReviewsByJobId(jobId)
            cachedData.collect { cached ->
                if (cached.isNotEmpty()) {
                    emit(Resource.Error(
                        message = "Network error: ${e.localizedMessage}"
                    ))
                } else {
                    emit(Resource.Error("Failed to fetch reviews: ${e.localizedMessage}"))
                }
            }
        }
    }

    /**
     * Get reviews for a specific artisan
     * Cache-first strategy for artisan profile pages
     */
    override fun getArtisanReviews(artisanId: String): Flow<Resource<List<Review>>> = flow {
        emit(Resource.Loading())

        // Show cached data first
        reviewDao.getArtisanReviews(artisanId).collect { cachedReviews ->
            if (cachedReviews.isNotEmpty()) {
                emit(Resource.Success(mapper.fromEntityList(cachedReviews)))
            } else {
                emit(Resource.Success(emptyList()))
            }
        }
    }

    /**
     * Get artisan's average rating
     * Cache-based calculation
     */
    override suspend fun getArtisanAverageRating(artisanId: String): Double? {
        return reviewDao.getArtisanAverageRating(artisanId)
    }

    /**
     * Get artisan's review count
     * Cache-based count
     */
    override suspend fun getArtisanReviewCount(artisanId: String): Int {
        return reviewDao.getArtisanReviewCount(artisanId)
    }

    /**
     * Get current user's submitted reviews
     * Network-first with cache fallback
     */
    override fun getMyReviews(): Flow<Resource<List<Review>>> = flow {
        emit(Resource.Loading())

        // Fetch from network (user reviews require server-side filtering)
        try {
            val response = apiService.getMyReviews()

            if (response.isSuccessful && response.body() != null) {
                val reviews = mapper.toDomainList(response.body()!!)

                // Update cache
                val entities = reviews.map { mapper.toEntity(it) }
                reviewDao.insertReviews(entities)

                emit(Resource.Success(reviews))
            } else {
                emit(Resource.Error("Failed to fetch reviews: ${response.message()}"))
            }
        } catch (e: Exception) {
            emit(Resource.Error("Network error: ${e.localizedMessage}"))
        }
    }

    /**
     * Delete a review
     * Network-only operation with cache removal
     */
    override suspend fun deleteReview(reviewId: String): Result<Unit> {
        return try {
            val response = apiService.deleteReview(reviewId)

            if (response.isSuccessful) {
                // Remove from cache
                reviewDao.deleteReviewById(reviewId)

                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to delete review: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
