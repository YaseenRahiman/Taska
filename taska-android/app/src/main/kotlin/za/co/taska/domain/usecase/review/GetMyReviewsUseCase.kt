package za.co.taska.domain.usecase.review

import kotlinx.coroutines.flow.Flow
import za.co.taska.domain.model.Resource
import za.co.taska.domain.model.Review
import za.co.taska.domain.repository.ReviewsRepository
import javax.inject.Inject

/**
 * Get My Reviews Use Case
 * Business logic for retrieving current user's submitted reviews
 *
 * No validation needed as it uses authenticated user context
 */
class GetMyReviewsUseCase @Inject constructor(
    private val reviewsRepository: ReviewsRepository
) {

    /**
     * Execute user's reviews retrieval
     *
     * @return Flow emitting Resource with review list
     */
    operator fun invoke(): Flow<Resource<List<Review>>> {
        return reviewsRepository.getMyReviews()
    }
}
