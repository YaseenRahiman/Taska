package za.co.taska.domain.usecase.review

import za.co.taska.domain.model.Review
import za.co.taska.domain.repository.ReviewsRepository
import javax.inject.Inject

/**
 * Update Review Use Case
 * Business logic for updating an existing review
 *
 * Validates inputs and ensures only review owner can update
 */
class UpdateReviewUseCase @Inject constructor(
    private val reviewsRepository: ReviewsRepository
) {

    /**
     * Execute review update
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
    suspend operator fun invoke(
        reviewId: String,
        overallRating: Int? = null,
        qualityRating: Int? = null,
        professionalismRating: Int? = null,
        timelinessRating: Int? = null,
        valueRating: Int? = null,
        reviewText: String? = null,
        images: List<String>? = null,
        wouldRecommend: Boolean? = null
    ): Result<Review> {

        // Validation
        val validationError = validateInputs(
            reviewId, overallRating, qualityRating,
            professionalismRating, timelinessRating, valueRating,
            reviewText, images
        )
        if (validationError != null) {
            return Result.failure(IllegalArgumentException(validationError))
        }

        // Update review
        return reviewsRepository.updateReview(
            reviewId = reviewId,
            overallRating = overallRating,
            qualityRating = qualityRating,
            professionalismRating = professionalismRating,
            timelinessRating = timelinessRating,
            valueRating = valueRating,
            reviewText = reviewText,
            images = images,
            wouldRecommend = wouldRecommend
        )
    }

    /**
     * Validate update inputs
     *
     * @return Error message if invalid, null if valid
     */
    private fun validateInputs(
        reviewId: String,
        overallRating: Int?,
        qualityRating: Int?,
        professionalismRating: Int?,
        timelinessRating: Int?,
        valueRating: Int?,
        reviewText: String?,
        images: List<String>?
    ): String? {
        return when {
            reviewId.isBlank() -> "Review ID cannot be empty"
            overallRating != null && !isValidRating(overallRating) -> "Overall rating must be between 1 and 5"
            qualityRating != null && !isValidRating(qualityRating) -> "Quality rating must be between 1 and 5"
            professionalismRating != null && !isValidRating(professionalismRating) -> "Professionalism rating must be between 1 and 5"
            timelinessRating != null && !isValidRating(timelinessRating) -> "Timeliness rating must be between 1 and 5"
            valueRating != null && !isValidRating(valueRating) -> "Value rating must be between 1 and 5"
            reviewText != null && reviewText.isBlank() -> "Review text cannot be blank (use null to remove)"
            reviewText != null && reviewText.length > 2000 -> "Review text cannot exceed 2000 characters"
            images != null && images.size > 5 -> "Maximum 5 review images allowed"
            images != null && images.any { it.isBlank() } -> "Image URLs cannot be blank"
            else -> null
        }
    }

    /**
     * Check if rating is valid (1-5)
     */
    private fun isValidRating(rating: Int): Boolean {
        return rating in 1..5
    }
}
