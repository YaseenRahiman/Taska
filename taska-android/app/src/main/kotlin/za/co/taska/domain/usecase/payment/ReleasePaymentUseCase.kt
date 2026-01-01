package za.co.taska.domain.usecase.payment

import za.co.taska.domain.model.Payment
import za.co.taska.domain.repository.PaymentsRepository
import javax.inject.Inject

/**
 * Release Payment Use Case
 * Business logic for releasing escrowed payment to artisan
 *
 * Only job owner (client) can release payment after job completion
 * Optionally includes rating and completion notes
 */
class ReleasePaymentUseCase @Inject constructor(
    private val paymentsRepository: PaymentsRepository
) {

    /**
     * Execute payment release
     *
     * @param paymentId Payment ID to release
     * @param completionNotes Optional notes about job completion
     * @param rating Optional rating (1-5) for the artisan
     * @return Result containing updated Payment or error
     */
    suspend operator fun invoke(
        paymentId: String,
        completionNotes: String? = null,
        rating: Int? = null
    ): Result<Payment> {

        // Validation
        val validationError = validateInputs(paymentId, completionNotes, rating)
        if (validationError != null) {
            return Result.failure(IllegalArgumentException(validationError))
        }

        // Release payment
        return paymentsRepository.releasePayment(
            paymentId = paymentId,
            completionNotes = completionNotes,
            rating = rating
        )
    }

    /**
     * Validate payment release inputs
     *
     * @return Error message if invalid, null if valid
     */
    private fun validateInputs(
        paymentId: String,
        completionNotes: String?,
        rating: Int?
    ): String? {
        return when {
            paymentId.isBlank() -> "Payment ID cannot be empty"
            rating != null && rating !in 1..5 -> "Rating must be between 1 and 5"
            completionNotes != null && completionNotes.length > 1000 -> "Completion notes cannot exceed 1000 characters"
            completionNotes != null && completionNotes.isBlank() -> "Completion notes cannot be blank (use null instead)"
            else -> null
        }
    }
}
