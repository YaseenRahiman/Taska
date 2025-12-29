package za.co.taska.domain.usecase.bid

import kotlinx.coroutines.flow.Flow
import za.co.taska.domain.model.Bid
import za.co.taska.domain.repository.BidsRepository
import javax.inject.Inject

/**
 * Get Job Bids Use Case
 * Retrieves all bids for a specific job
 *
 * Validation Rules:
 * - jobId: not blank
 */
class GetJobBidsUseCase @Inject constructor(
    private val bidsRepository: BidsRepository
) {
    operator fun invoke(jobId: String): Flow<Result<List<Bid>>> {
        // Validate input
        if (jobId.isBlank()) {
            return kotlinx.coroutines.flow.flow {
                emit(Result.failure(IllegalArgumentException("Job ID cannot be empty")))
            }
        }

        return bidsRepository.getJobBids(jobId.trim())
    }
}
