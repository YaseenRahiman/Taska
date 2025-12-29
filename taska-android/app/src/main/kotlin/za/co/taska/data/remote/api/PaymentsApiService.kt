package za.co.taska.data.remote.api

import retrofit2.Response
import retrofit2.http.*
import za.co.taska.data.remote.dto.request.CreatePaymentDto
import za.co.taska.data.remote.dto.request.RefundPaymentDto
import za.co.taska.data.remote.dto.request.ReleasePaymentDto
import za.co.taska.data.remote.dto.response.PaymentIntent
import za.co.taska.data.remote.dto.response.PaymentResponse
import za.co.taska.data.remote.dto.response.PaginatedPaymentsResponse

/**
 * Payments API Service
 * Retrofit interface for payment endpoints (matches backend specification)
 *
 * Backend: /payments
 * Auth: JWT Bearer token required (CLIENT or ADMIN role)
 * Platform Fee: 10%
 * VAT: 15%
 */
interface PaymentsApiService {

    /**
     * Create payment intent (Stripe/PayFast)
     * POST /payments/create-intent
     * Requires: CLIENT or ADMIN role
     */
    @POST("payments/create-intent")
    suspend fun createPaymentIntent(
        @Body request: CreatePaymentDto
    ): Response<PaymentIntent>

    /**
     * Get payment by ID
     * GET /payments/:id
     * Returns payment if user is payer or payee
     */
    @GET("payments/{id}")
    suspend fun getPayment(
        @Path("id") paymentId: String
    ): Response<PaymentResponse>

    /**
     * Get user's payments (paginated)
     * GET /payments?status=...&page=...&limit=...
     */
    @GET("payments")
    suspend fun getUserPayments(
        @Query("status") status: String? = null,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): Response<PaginatedPaymentsResponse>

    /**
     * Release payment to artisan (escrow)
     * POST /payments/:id/release
     * Requires: CLIENT role (job owner only)
     */
    @POST("payments/{id}/release")
    suspend fun releasePayment(
        @Path("id") paymentId: String,
        @Body request: ReleasePaymentDto
    ): Response<PaymentResponse>

    /**
     * Get payment statistics
     * GET /payments/statistics
     */
    @GET("payments/statistics")
    suspend fun getPaymentStatistics(): Response<Any>

    /**
     * Refund a payment
     * POST /payments/:id/refund
     * Requires: ADMIN role or original payer
     */
    @POST("payments/{id}/refund")
    suspend fun refundPayment(
        @Path("id") paymentId: String,
        @Body request: RefundPaymentDto
    ): Response<PaymentResponse>
}
