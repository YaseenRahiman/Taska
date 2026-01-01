package za.co.taska.domain.usecase.bid

import kotlinx.coroutines.flow.first
import za.co.taska.domain.model.Bid
import za.co.taska.domain.model.Resource
import za.co.taska.domain.repository.BidsRepository
import javax.inject.Inject

/**
 * Get My Bids Use Case
 * Retrieves all bids created by the current user (artisan)
 */
class GetMyBidsUseCase @Inject constructor(
    private val bidsRepository: BidsRepository
) {
    suspend operator fun invoke(): Resource<List<Bid>> {
        return try {
            val result = bidsRepository.getMyBids().first()
            // Convert Result to Resource
            result.fold(
                onSuccess = { bids -> Resource.Success(bids) },
                onFailure = { error -> Resource.Error(error.message ?: "Failed to get bids") }
            )
        } catch (e: Exception) {
            Resource.Error(e.message ?: "Failed to get bids")
        }
    }
}
