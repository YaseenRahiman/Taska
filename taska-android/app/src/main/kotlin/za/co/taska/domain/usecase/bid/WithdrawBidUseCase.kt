package za.co.taska.domain.usecase.bid

import za.co.taska.domain.model.Resource
import za.co.taska.domain.repository.BidsRepository
import javax.inject.Inject

/**
 * Withdraw Bid Use Case
 * Business logic for withdrawing a bid
 *
 * Validation Rules:
 * - bidId: not blank
 */
class WithdrawBidUseCase @Inject constructor(
    private val bidsRepository: BidsRepository
) {
    suspend operator fun invoke(bidId: String): Resource<Unit> {
        // Validate input
        if (bidId.isBlank()) {
            return Resource.Error("Bid ID cannot be empty")
        }

        // Call repository
        return try {
            val result = bidsRepository.withdrawBid(bidId.trim())
            result.fold(
                onSuccess = { Resource.Success(Unit) },
                onFailure = { error -> Resource.Error(error.message ?: "Failed to withdraw bid") }
            )
        } catch (e: Exception) {
            Resource.Error(e.message ?: "Failed to withdraw bid")
        }
    }
}
