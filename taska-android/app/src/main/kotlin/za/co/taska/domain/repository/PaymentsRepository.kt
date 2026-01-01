package za.co.taska.domain.repository

import kotlinx.coroutines.flow.Flow
import za.co.taska.domain.model.Payment
import za.co.taska.domain.model.Resource

/**
 * Payments Repository Interface
 * Domain layer interface for payment operations
 */
interface PaymentsRepository {

    /**
     * Create payment intent for a job
     * Returns PaymentIntent with client secret for frontend processing
     */
    suspend fun createPaymentIntent(
        jobId: String,
        bidId: String,
        amount: Double,
        paymentMethod: String,
        paymentProvider: String
    ): Result<PaymentIntent>

    /**
     * Get payment by ID
     */
    suspend fun getPayment(paymentId: String): Flow<Resource<Payment>>

    /**
     * Get all payments for current user (paginated)
     */
    suspend fun getUserPayments(
        status: String? = null,
        page: Int = 1,
        limit: Int = 20
    ): Flow<Resource<List<Payment>>>

    /**
     * Release escrowed payment to artisan
     * Only job owner (client) can release
     */
    suspend fun releasePayment(
        paymentId: String,
        completionNotes: String? = null,
        rating: Int? = null
    ): Result<Payment>

    /**
     * Observe real-time payment status updates
     */
    fun observePaymentStatus(paymentId: String): Flow<Resource<Payment>>

    /**
     * Refund a payment
     * Only admin or original payer can refund
     */
    suspend fun refundPayment(
        paymentId: String,
        amount: Double,
        reason: String
    ): Result<Payment>
}

/**
 * Payment Intent Data Class
 * Contains info needed for frontend payment processing
 */
data class PaymentIntent(
    val paymentId: String,
    val clientSecret: String,
    val amount: Double,
    val platformFee: Double,
    val vat: Double,
    val totalAmount: Double,
    val currency: String,
    val paymentProvider: String,
    val expiresAt: String
)
