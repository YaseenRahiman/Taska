package za.co.taska.data.remote.api

import okhttp3.MultipartBody
import retrofit2.Response
import retrofit2.http.*
import za.co.taska.data.remote.dto.request.CreateReviewRequest
import za.co.taska.data.remote.dto.request.UpdateReviewRequest
import za.co.taska.data.remote.dto.response.ImageUploadResponse
import za.co.taska.data.remote.dto.response.ReviewResponse

/**
 * Reviews API Service
 * Retrofit interface for review endpoints
 */
interface ReviewsApiService {

    /**
     * Create a review for a completed job
     */
    @POST("reviews")
    suspend fun createReview(
        @Body request: CreateReviewRequest
    ): Response<ReviewResponse>

    /**
     * Update an existing review (within 7 days)
     */
    @PATCH("reviews/{id}")
    suspend fun updateReview(
        @Path("id") reviewId: String,
        @Body request: UpdateReviewRequest
    ): Response<ReviewResponse>

    /**
     * Get all reviews for a specific job
     */
    @GET("reviews/job/{jobId}")
    suspend fun getJobReviews(
        @Path("jobId") jobId: String
    ): Response<List<ReviewResponse>>

    /**
     * Get all reviews for an artisan (paginated)
     */
    @GET("reviews/artisan/{artisanId}")
    suspend fun getArtisanReviews(
        @Path("artisanId") artisanId: String,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): Response<List<ReviewResponse>>

    /**
     * Upload images for a review (before/after photos)
     */
    @Multipart
    @POST("reviews/upload-images")
    suspend fun uploadImages(
        @Part images: List<MultipartBody.Part>
    ): Response<List<ImageUploadResponse>>

    /**
     * Get current user's submitted reviews
     */
    @GET("reviews/my-reviews")
    suspend fun getMyReviews(): Response<List<ReviewResponse>>

    /**
     * Delete a review by ID
     */
    @DELETE("reviews/{id}")
    suspend fun deleteReview(
        @Path("id") reviewId: String
    ): Response<Unit>
}
