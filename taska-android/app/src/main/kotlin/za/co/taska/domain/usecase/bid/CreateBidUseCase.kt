package za.co.taska.domain.usecase.bid

import za.co.taska.domain.model.Bid
import za.co.taska.domain.repository.BidsRepository
import javax.inject.Inject

/**
 * Create Bid Use Case
 * Business logic for creating new bids with comprehensive validation
 *
 * Validation Rules:
 * - jobId: not blank
 * - amount: >0 and ≤1,000,000
 * - message: 20-500 characters
 * - estimatedDays: 1-365
 * - attachments: max 3 files (optional)
 */
class CreateBidUseCase @Inject constructor(
    private val bidsRepository: BidsRepository
) {
    suspend operator fun invoke(
        jobId: String,
        amount: Double,
        message: String,
        estimatedDays: Int,
        attachments: List<String>? = null
    ): Result<Bid> {
        // Validate inputs
        val validationError = validateInputs(
            jobId = jobId,
            amount = amount,
            message = message,
            estimatedDays = estimatedDays,
            attachments = attachments
        )

        if (validationError != null) {
            return Result.failure(IllegalArgumentException(validationError))
        }

        // Call repository
        return bidsRepository.createBid(
            jobId = jobId.trim(),
            amount = amount,
            message = message.trim(),
            estimatedDays = estimatedDays,
            attachments = attachments?.filter { it.isNotBlank() }
        )
    }

    private fun validateInputs(
        jobId: String,
        amount: Double,
        message: String,
        estimatedDays: Int,
        attachments: List<String>?
    ): String? {
        return when {
            jobId.isBlank() -> "Job ID cannot be empty"

            amount <= 0 -> "Bid amount must be greater than zero"
            amount > 1000000 -> "Bid amount cannot exceed R1,000,000"

            message.isBlank() -> "Bid message cannot be empty"
            message.trim().length < 20 -> "Bid message must be at least 20 characters"
            message.trim().length > 500 -> "Bid message cannot exceed 500 characters"

            estimatedDays < 1 -> "Estimated days must be at least 1"
            estimatedDays > 365 -> "Estimated days cannot exceed 365"

            attachments != null && attachments.size > 3 -> "Maximum 3 attachments allowed"
            attachments?.any { it.isBlank() } == true -> "Attachment URLs cannot be blank"

            else -> null
        }
    }
}
