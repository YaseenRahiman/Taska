package za.co.taska.domain.usecase.bid

import za.co.taska.domain.model.Bid
import za.co.taska.domain.repository.BidsRepository
import javax.inject.Inject

/**
 * Update Bid Use Case
 * Business logic for updating existing bids with validation
 *
 * Validation Rules:
 * - bidId: not blank
 * - amount: if provided, >0 and ≤1,000,000
 * - message: if provided, 20-500 characters
 * - estimatedDays: if provided, 1-365
 * - at least one field must be provided
 */
class UpdateBidUseCase @Inject constructor(
    private val bidsRepository: BidsRepository
) {
    suspend operator fun invoke(
        bidId: String,
        amount: Double? = null,
        message: String? = null,
        estimatedDays: Int? = null
    ): Result<Bid> {
        // Validate inputs
        val validationError = validateInputs(
            bidId = bidId,
            amount = amount,
            message = message,
            estimatedDays = estimatedDays
        )

        if (validationError != null) {
            return Result.failure(IllegalArgumentException(validationError))
        }

        // Call repository
        return bidsRepository.updateBid(
            bidId = bidId.trim(),
            amount = amount,
            message = message?.trim(),
            estimatedDays = estimatedDays
        )
    }

    private fun validateInputs(
        bidId: String,
        amount: Double?,
        message: String?,
        estimatedDays: Int?
    ): String? {
        return when {
            bidId.isBlank() -> "Bid ID cannot be empty"

            amount == null && message == null && estimatedDays == null ->
                "At least one field must be provided for update"

            amount != null && amount <= 0 -> "Bid amount must be greater than zero"
            amount != null && amount > 1000000 -> "Bid amount cannot exceed R1,000,000"

            message != null && message.isBlank() -> "Bid message cannot be empty"
            message != null && message.trim().length < 20 -> "Bid message must be at least 20 characters"
            message != null && message.trim().length > 500 -> "Bid message cannot exceed 500 characters"

            estimatedDays != null && estimatedDays < 1 -> "Estimated days must be at least 1"
            estimatedDays != null && estimatedDays > 365 -> "Estimated days cannot exceed 365"

            else -> null
        }
    }
}
