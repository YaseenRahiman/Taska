package za.co.taska.domain.usecase.review

import kotlinx.coroutines.flow.Flow
import za.co.taska.domain.model.Resource
import za.co.taska.domain.model.Review
import za.co.taska.domain.repository.ReviewsRepository
import javax.inject.Inject

/**
 * Get Job Reviews Use Case
 * Business logic for retrieving reviews for a specific job
 *
 * Provides reviews to display on job detail pages
 */
class GetJobReviewsUseCase @Inject constructor(
    private val reviewsRepository: ReviewsRepository
) {

    /**
     * Execute job reviews retrieval
     *
     * @param jobId Job ID to get reviews for
     * @return Flow emitting Resource with review list
     */
    operator fun invoke(jobId: String): Flow<Resource<List<Review>>> {
        // Validation
        if (jobId.isBlank()) {
            return kotlinx.coroutines.flow.flow {
                emit(Resource.Error("Job ID cannot be empty"))
            }
        }

        // Fetch reviews from repository
        return reviewsRepository.getJobReviews(jobId)
    }
}
