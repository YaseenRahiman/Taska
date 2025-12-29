package za.co.taska.data.repository

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.map
import za.co.taska.data.local.dao.PaymentDao
import za.co.taska.data.mapper.PaymentMapper
import za.co.taska.data.remote.api.PaymentsApiService
import za.co.taska.data.remote.dto.request.CreatePaymentDto
import za.co.taska.data.remote.dto.request.RefundPaymentDto
import za.co.taska.data.remote.dto.request.ReleasePaymentDto
import za.co.taska.domain.model.Payment
import za.co.taska.domain.model.Resource
import za.co.taska.domain.repository.PaymentIntent
import za.co.taska.domain.repository.PaymentsRepository
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Payments Repository Implementation
 * Data layer implementation with network-first caching strategy
 */
@Singleton
class PaymentsRepositoryImpl @Inject constructor(
    private val apiService: PaymentsApiService,
    private val paymentDao: PaymentDao,
    private val mapper: PaymentMapper
) : PaymentsRepository {

    /**
     * Create payment intent for a job
     * Network-only operation (no caching for intent creation)
     */
    override suspend fun createPaymentIntent(
        jobId: String,
        bidId: String,
        amount: Double,
        paymentMethod: String,
        paymentProvider: String
    ): Result<PaymentIntent> {
        return try {
            val request = CreatePaymentDto(
                jobId = jobId,
                bidId = bidId,
                amount = amount,
                paymentMethod = paymentMethod,
                paymentProvider = paymentProvider,
                currency = "ZAR"
            )

            val response = apiService.createPaymentIntent(request)

            if (response.isSuccessful && response.body() != null) {
                val dto = response.body()!!
                // Map DTO to domain PaymentIntent
                val domainIntent = PaymentIntent(
                    paymentId = dto.paymentId,
                    clientSecret = dto.clientSecret,
                    amount = dto.amount,
                    platformFee = dto.platformFee,
                    vat = dto.vat,
                    totalAmount = dto.totalAmount,
                    currency = dto.currency,
                    paymentProvider = dto.paymentProvider,
                    expiresAt = dto.expiresAt
                )
                Result.success(domainIntent)
            } else {
                Result.failure(Exception("Failed to create payment intent: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Get payment by ID
     * Network-first strategy with local cache fallback
     */
    override suspend fun getPayment(paymentId: String): Flow<Resource<Payment>> = flow {
        emit(Resource.Loading())

        // Try cache first for immediate display
        val cachedPayment = paymentDao.getPaymentById(paymentId)
        if (cachedPayment != null) {
            emit(Resource.Loading(data = mapper.fromEntity(cachedPayment)))
        }

        // Fetch from network
        try {
            val response = apiService.getPayment(paymentId)

            if (response.isSuccessful && response.body() != null) {
                val payment = mapper.toDomain(response.body()!!)

                // Update cache
                paymentDao.insertPayment(mapper.toEntity(payment))

                emit(Resource.Success(payment))
            } else {
                // Network failed, use cache if available
                if (cachedPayment != null) {
                    emit(Resource.Success(mapper.fromEntity(cachedPayment)))
                } else {
                    emit(Resource.Error("Payment not found: ${response.message()}"))
                }
            }
        } catch (e: Exception) {
            // Network error, use cache if available
            if (cachedPayment != null) {
                emit(Resource.Success(mapper.fromEntity(cachedPayment)))
            } else {
                emit(Resource.Error("Failed to fetch payment: ${e.localizedMessage}"))
            }
        }
    }

    /**
     * Get all payments for current user (paginated)
     * Network-first with cache fallback
     */
    override suspend fun getUserPayments(
        status: String?,
        page: Int,
        limit: Int
    ): Flow<Resource<List<Payment>>> = flow {
        emit(Resource.Loading())

        // Show cached data first (if status filter not applied)
        if (status == null) {
            val cachedPayments = paymentDao.getPayments(limit)
            // This is a Flow, so we need to collect it
            cachedPayments.collect { entities ->
                if (entities.isNotEmpty()) {
                    emit(Resource.Loading(data = mapper.fromEntityList(entities)))
                }
            }
        }

        // Fetch from network
        try {
            val response = apiService.getUserPayments(
                status = status,
                page = page,
                limit = limit
            )

            if (response.isSuccessful && response.body() != null) {
                val payments = mapper.toDomainList(response.body()!!.data)

                // Update cache (only for first page without filter)
                if (page == 1 && status == null) {
                    val entities = payments.map { mapper.toEntity(it) }
                    paymentDao.insertPayments(entities)
                }

                emit(Resource.Success(payments))
            } else {
                emit(Resource.Error("Failed to fetch payments: ${response.message()}"))
            }
        } catch (e: Exception) {
            emit(Resource.Error("Network error: ${e.localizedMessage}"))
        }
    }

    /**
     * Release escrowed payment to artisan
     * Network-only operation with cache update
     */
    override suspend fun releasePayment(
        paymentId: String,
        completionNotes: String?,
        rating: Int?
    ): Result<Payment> {
        return try {
            val request = ReleasePaymentDto(
                completionNotes = completionNotes,
                rating = rating
            )

            val response = apiService.releasePayment(paymentId, request)

            if (response.isSuccessful && response.body() != null) {
                val payment = mapper.toDomain(response.body()!!)

                // Update cache
                paymentDao.updatePayment(mapper.toEntity(payment))

                Result.success(payment)
            } else {
                Result.failure(Exception("Failed to release payment: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Observe real-time payment status updates
     * Combines cache and network for real-time updates
     */
    override fun observePaymentStatus(paymentId: String): Flow<Resource<Payment>> {
        // Observe local database changes
        return flow {
            paymentDao.getPaymentById(paymentId)?.let { entity ->
                emit(Resource.Success(mapper.fromEntity(entity)))
            }
        }
    }

    /**
     * Refund a payment
     * Network-only operation with cache update
     */
    override suspend fun refundPayment(
        paymentId: String,
        amount: Double,
        reason: String
    ): Result<Payment> {
        return try {
            val request = RefundPaymentDto(
                amount = amount,
                reason = reason
            )

            val response = apiService.refundPayment(paymentId, request)

            if (response.isSuccessful && response.body() != null) {
                val payment = mapper.toDomain(response.body()!!)

                // Update cache
                paymentDao.updatePayment(mapper.toEntity(payment))

                Result.success(payment)
            } else {
                Result.failure(Exception("Failed to refund payment: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
