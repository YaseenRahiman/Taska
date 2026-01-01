package za.co.taska.domain.usecase.payment

import za.co.taska.domain.model.Payment
import za.co.taska.domain.repository.PaymentsRepository
import javax.inject.Inject

/**
 * Refund Payment Use Case
 * Business logic for processing payment refunds
 *
 * Validation Rules:
 * - paymentId: not blank
 * - amount: >0 and ≤ original payment amount
 * - reason: 10-500 characters
 *
 * Only admin or original payer can refund payments
 */
class RefundPaymentUseCase @Inject constructor(
    private val paymentsRepository: PaymentsRepository
) {

    /**
     * Execute payment refund
     *
     * @param paymentId Payment ID to refund
     * @param amount Refund amount (must be ≤ original amount)
     * @param reason Reason for refund (required for audit trail)
     * @return Result containing refunded Payment or error
     */
    suspend operator fun invoke(
        paymentId: String,
        amount: Double,
        reason: String
    ): Result<Payment> {

        // Validation
        val validationError = validateInputs(paymentId, amount, reason)
        if (validationError != null) {
            return Result.failure(IllegalArgumentException(validationError))
        }

        // Process refund
        return paymentsRepository.refundPayment(
            paymentId = paymentId,
            amount = amount,
            reason = reason.trim()
        )
    }

    /**
     * Validate refund inputs
     *
     * @return Error message if invalid, null if valid
     */
    private fun validateInputs(
        paymentId: String,
        amount: Double,
        reason: String
    ): String? {
        return when {
            paymentId.isBlank() -> "Payment ID cannot be empty"

            amount <= 0 -> "Refund amount must be greater than zero"
            amount > 1_000_000.0 -> "Refund amount cannot exceed R1,000,000.00"

            reason.isBlank() -> "Refund reason is required"
            reason.trim().length < 10 -> "Refund reason must be at least 10 characters"
            reason.trim().length > 500 -> "Refund reason cannot exceed 500 characters"

            else -> null
        }
    }
}
