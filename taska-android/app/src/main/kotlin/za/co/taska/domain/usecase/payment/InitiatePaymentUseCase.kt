package za.co.taska.domain.usecase.payment

import za.co.taska.domain.repository.PaymentIntent
import za.co.taska.domain.repository.PaymentsRepository
import javax.inject.Inject

/**
 * Initiate Payment Use Case
 * Business logic for creating a payment intent for a job
 *
 * Validates inputs and creates payment intent with provider
 */
class InitiatePaymentUseCase @Inject constructor(
    private val paymentsRepository: PaymentsRepository
) {

    /**
     * Execute payment initiation
     *
     * @param jobId Job ID to pay for
     * @param bidId Accepted bid ID
     * @param amount Bid amount
     * @param paymentMethod Payment method (card, eft, payfast)
     * @param paymentProvider Provider (stripe, payfast)
     * @return Result containing PaymentIntent or error
     */
    suspend operator fun invoke(
        jobId: String,
        bidId: String,
        amount: Double,
        paymentMethod: String,
        paymentProvider: String
    ): Result<PaymentIntent> {

        // Validation
        val validationError = validateInputs(jobId, bidId, amount, paymentMethod, paymentProvider)
        if (validationError != null) {
            return Result.failure(IllegalArgumentException(validationError))
        }

        // Create payment intent
        return paymentsRepository.createPaymentIntent(
            jobId = jobId,
            bidId = bidId,
            amount = amount,
            paymentMethod = paymentMethod,
            paymentProvider = paymentProvider
        )
    }

    /**
     * Validate payment initiation inputs
     *
     * @return Error message if invalid, null if valid
     */
    private fun validateInputs(
        jobId: String,
        bidId: String,
        amount: Double,
        paymentMethod: String,
        paymentProvider: String
    ): String? {
        return when {
            jobId.isBlank() -> "Job ID cannot be empty"
            bidId.isBlank() -> "Bid ID cannot be empty"
            amount <= 0 -> "Amount must be greater than zero"
            amount < 50.0 -> "Minimum payment amount is R50.00" // South African minimum
            amount > 1_000_000.0 -> "Maximum payment amount is R1,000,000.00"
            paymentMethod.isBlank() -> "Payment method is required"
            !isValidPaymentMethod(paymentMethod) -> "Invalid payment method: $paymentMethod"
            paymentProvider.isBlank() -> "Payment provider is required"
            !isValidPaymentProvider(paymentProvider) -> "Invalid payment provider: $paymentProvider"
            !isCompatibleProviderMethod(paymentProvider, paymentMethod) -> "Payment method $paymentMethod not supported by $paymentProvider"
            else -> null
        }
    }

    /**
     * Check if payment method is valid
     */
    private fun isValidPaymentMethod(method: String): Boolean {
        return method.lowercase() in listOf("card", "eft", "payfast", "instant_eft")
    }

    /**
     * Check if payment provider is valid
     */
    private fun isValidPaymentProvider(provider: String): Boolean {
        return provider.lowercase() in listOf("stripe", "payfast")
    }

    /**
     * Check if payment method is compatible with provider
     */
    private fun isCompatibleProviderMethod(provider: String, method: String): Boolean {
        return when (provider.lowercase()) {
            "stripe" -> method.lowercase() in listOf("card")
            "payfast" -> method.lowercase() in listOf("card", "eft", "payfast", "instant_eft")
            else -> false
        }
    }
}
