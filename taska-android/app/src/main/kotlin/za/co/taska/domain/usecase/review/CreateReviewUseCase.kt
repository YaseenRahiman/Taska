package za.co.taska.domain.usecase.review

import za.co.taska.domain.model.Review
import za.co.taska.domain.repository.ReviewsRepository
import javax.inject.Inject

/**
 * Create Review Use Case
 * Business logic for creating a review for a completed job
 *
 * Validates all rating inputs and ensures review compliance
 */
class CreateReviewUseCase @Inject constructor(
    private val reviewsRepository: ReviewsRepository
) {

    /**
     * Execute review creation
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
    suspend operator fun invoke(
        jobId: String,
        artisanId: String,
        overallRating: Int,
        qualityRating: Int,
        professionalismRating: Int,
        timelinessRating: Int,
        valueRating: Int,
        reviewText: String? = null,
        images: List<String> = emptyList(),
        wouldRecommend: Boolean
    ): Result<Review> {

        // Validation
        val validationError = validateInputs(
            jobId, artisanId, overallRating, qualityRating,
            professionalismRating, timelinessRating, valueRating,
            reviewText, images
        )
        if (validationError != null) {
            return Result.failure(IllegalArgumentException(validationError))
        }

        // Create review
        return reviewsRepository.createReview(
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
    }

    /**
     * Validate review inputs
     *
     * @return Error message if invalid, null if valid
     */
    private fun validateInputs(
        jobId: String,
        artisanId: String,
        overallRating: Int,
        qualityRating: Int,
        professionalismRating: Int,
        timelinessRating: Int,
        valueRating: Int,
        reviewText: String?,
        images: List<String>
    ): String? {
        return when {
            jobId.isBlank() -> "Job ID cannot be empty"
            artisanId.isBlank() -> "Artisan ID cannot be empty"
            !isValidRating(overallRating) -> "Overall rating must be between 1 and 5"
            !isValidRating(qualityRating) -> "Quality rating must be between 1 and 5"
            !isValidRating(professionalismRating) -> "Professionalism rating must be between 1 and 5"
            !isValidRating(timelinessRating) -> "Timeliness rating must be between 1 and 5"
            !isValidRating(valueRating) -> "Value rating must be between 1 and 5"
            reviewText != null && reviewText.isBlank() -> "Review text cannot be blank (use null instead)"
            reviewText != null && reviewText.length > 2000 -> "Review text cannot exceed 2000 characters"
            images.size > 5 -> "Maximum 5 review images allowed"
            images.any { it.isBlank() } -> "Image URLs cannot be blank"
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
