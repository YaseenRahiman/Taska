package za.co.taska.data.remote.dto.request

import com.google.gson.annotations.SerializedName

/**
 * Refund Payment DTO
 * Request body for refunding a payment
 * Matches backend: RefundPaymentDto
 */
data class RefundPaymentDto(
    @SerializedName("amount")
    val amount: Double,

    @SerializedName("reason")
    val reason: String
)
