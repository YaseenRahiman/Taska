package za.co.taska.domain.usecase.bid

import za.co.taska.domain.model.Bid
import za.co.taska.domain.repository.BidsRepository
import javax.inject.Inject

/**
 * Get Bid By ID Use Case
 * Retrieves a specific bid by its ID
 *
 * Validation Rules:
 * - bidId: not blank
 */
class GetBidByIdUseCase @Inject constructor(
    private val bidsRepository: BidsRepository
) {
    suspend operator fun invoke(bidId: String): Result<Bid> {
        // Validate input
        if (bidId.isBlank()) {
            return Result.failure(IllegalArgumentException("Bid ID cannot be empty"))
        }

        return bidsRepository.getBidById(bidId.trim())
    }
}
