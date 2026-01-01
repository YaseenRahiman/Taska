package za.co.taska.domain.usecase.bid

import za.co.taska.domain.repository.BidsRepository
import javax.inject.Inject

/**
 * Accept Bid Use Case
 * Business logic for accepting a bid on a job (CLIENT action)
 *
 * Validation Rules:
 * - bidId: not blank
 * - Only the job owner can accept bids
 * - Bid must be in PENDING status
 */
class AcceptBidUseCase @Inject constructor(
    private val bidsRepository: BidsRepository
) {
    suspend operator fun invoke(bidId: String): Result<Unit> {
        // Validate input
        if (bidId.isBlank()) {
            return Result.failure(IllegalArgumentException("Bid ID cannot be empty"))
        }

        // Call repository to accept bid
        return bidsRepository.acceptBid(bidId.trim())
    }
}
