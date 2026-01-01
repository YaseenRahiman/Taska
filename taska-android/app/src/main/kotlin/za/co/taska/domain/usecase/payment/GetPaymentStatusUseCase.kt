package za.co.taska.domain.usecase.payment

import kotlinx.coroutines.flow.Flow
import za.co.taska.domain.model.Payment
import za.co.taska.domain.model.Resource
import za.co.taska.domain.repository.PaymentsRepository
import javax.inject.Inject

/**
 * Get Payment Status Use Case
 * Business logic for retrieving payment status with real-time updates
 *
 * Provides single payment details and status tracking
 */
class GetPaymentStatusUseCase @Inject constructor(
    private val paymentsRepository: PaymentsRepository
) {

    /**
     * Execute payment status retrieval
     *
     * @param paymentId Payment ID to fetch
     * @return Flow emitting Resource with payment data
     */
    suspend operator fun invoke(paymentId: String): Flow<Resource<Payment>> {
        // Validation
        if (paymentId.isBlank()) {
            return kotlinx.coroutines.flow.flow {
                emit(Resource.Error("Payment ID cannot be empty"))
            }
        }

        // Fetch payment from repository
        return paymentsRepository.getPayment(paymentId)
    }

    /**
     * Observe payment status for real-time updates
     * Used for payment confirmation screens
     *
     * @param paymentId Payment ID to observe
     * @return Flow emitting real-time payment updates
     */
    fun observeStatus(paymentId: String): Flow<Resource<Payment>> {
        if (paymentId.isBlank()) {
            return kotlinx.coroutines.flow.flow {
                emit(Resource.Error("Payment ID cannot be empty"))
            }
        }

        return paymentsRepository.observePaymentStatus(paymentId)
    }
}
