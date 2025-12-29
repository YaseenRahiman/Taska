package za.co.taska.domain.usecase.review

import kotlinx.coroutines.flow.Flow
import za.co.taska.domain.model.Resource
import za.co.taska.domain.model.Review
import za.co.taska.domain.repository.ReviewsRepository
import javax.inject.Inject

/**
 * Get Artisan Reviews Use Case
 * Business logic for retrieving all reviews for a specific artisan
 *
 * Used for artisan profile pages and reputation display
 */
class GetArtisanReviewsUseCase @Inject constructor(
    private val reviewsRepository: ReviewsRepository
) {

    /**
     * Execute artisan reviews retrieval
     *
     * @param artisanId Artisan ID to get reviews for
     * @return Flow emitting Resource with review list
     */
    operator fun invoke(artisanId: String): Flow<Resource<List<Review>>> {
        // Validation
        if (artisanId.isBlank()) {
            return kotlinx.coroutines.flow.flow {
                emit(Resource.Error("Artisan ID cannot be empty"))
            }
        }

        // Fetch reviews from repository
        return reviewsRepository.getArtisanReviews(artisanId)
    }

    /**
     * Get artisan's average rating
     *
     * @param artisanId Artisan ID
     * @return Average rating or null if no reviews
     */
    suspend fun getAverageRating(artisanId: String): Double? {
        if (artisanId.isBlank()) {
            return null
        }
        return reviewsRepository.getArtisanAverageRating(artisanId)
    }

    /**
     * Get artisan's total review count
     *
     * @param artisanId Artisan ID
     * @return Number of reviews
     */
    suspend fun getReviewCount(artisanId: String): Int {
        if (artisanId.isBlank()) {
            return 0
        }
        return reviewsRepository.getArtisanReviewCount(artisanId)
    }
}
