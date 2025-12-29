package za.co.taska.domain.usecase.payment

import kotlinx.coroutines.flow.Flow
import za.co.taska.domain.model.Payment
import za.co.taska.domain.model.PaymentStatus
import za.co.taska.domain.model.Resource
import za.co.taska.domain.repository.PaymentsRepository
import javax.inject.Inject

/**
 * Get User Payments Use Case
 * Business logic for retrieving user payment history with filtering
 *
 * Supports pagination and status filtering
 */
class GetUserPaymentsUseCase @Inject constructor(
    private val paymentsRepository: PaymentsRepository
) {

    /**
     * Execute user payments retrieval
     *
     * @param status Optional payment status filter (pending, completed, escrowed, released, failed)
     * @param page Page number (1-based)
     * @param limit Items per page
     * @return Flow emitting Resource with payment list
     */
    suspend operator fun invoke(
        status: PaymentStatus? = null,
        page: Int = 1,
        limit: Int = 20
    ): Flow<Resource<List<Payment>>> {

        // Validation
        val validationError = validateInputs(page, limit)
        if (validationError != null) {
            return kotlinx.coroutines.flow.flow {
                emit(Resource.Error(validationError))
            }
        }

        // Fetch payments from repository
        return paymentsRepository.getUserPayments(
            status = status?.name?.lowercase(),
            page = page,
            limit = limit
        )
    }

    /**
     * Validate inputs
     *
     * @return Error message if invalid, null if valid
     */
    private fun validateInputs(page: Int, limit: Int): String? {
        return when {
            page < 1 -> "Page number must be at least 1"
            limit < 1 -> "Limit must be at least 1"
            limit > 100 -> "Maximum limit is 100 items per page"
            else -> null
        }
    }
}
