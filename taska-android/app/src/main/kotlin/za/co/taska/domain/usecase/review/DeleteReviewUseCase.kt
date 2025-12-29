package za.co.taska.domain.usecase.review

import za.co.taska.domain.repository.ReviewsRepository
import javax.inject.Inject

/**
 * Delete Review Use Case
 * Business logic for deleting a review
 *
 * Validates reviewId and ensures proper deletion
 */
class DeleteReviewUseCase @Inject constructor(
    private val reviewsRepository: ReviewsRepository
) {

    /**
     * Execute review deletion
     *
     * @param reviewId Review ID to delete
     * @return Result indicating success or error
     */
    suspend operator fun invoke(reviewId: String): Result<Unit> {
        // Validation
        if (reviewId.isBlank()) {
            return Result.failure(IllegalArgumentException("Review ID cannot be blank"))
        }

        // Delete review
        return reviewsRepository.deleteReview(reviewId)
    }
}
