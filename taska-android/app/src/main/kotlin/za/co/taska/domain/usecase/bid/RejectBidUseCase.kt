package za.co.taska.domain.usecase.bid

import za.co.taska.domain.repository.BidsRepository
import javax.inject.Inject

/**
 * Reject Bid Use Case
 * Business logic for rejecting a bid on a job (CLIENT action)
 *
 * Validation Rules:
 * - bidId: not blank
 * - Only the job owner can reject bids
 * - Bid must be in PENDING status
 */
class RejectBidUseCase @Inject constructor(
    private val bidsRepository: BidsRepository
) {
    suspend operator fun invoke(bidId: String): Result<Unit> {
        // Validate input
        if (bidId.isBlank()) {
            return Result.failure(IllegalArgumentException("Bid ID cannot be empty"))
        }

        // Call repository to reject bid
        return bidsRepository.rejectBid(bidId.trim())
    }
}
