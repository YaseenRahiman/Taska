package za.co.taska.data.remote.dto.request

import com.google.gson.annotations.SerializedName

/**
 * Create Payment DTO
 * Request body for creating a payment intent
 * Matches backend: CreatePaymentDto
 */
data class CreatePaymentDto(
    @SerializedName("jobId")
    val jobId: String,

    @SerializedName("bidId")
    val bidId: String,

    @SerializedName("amount")
    val amount: Double,

    @SerializedName("paymentMethod")
    val paymentMethod: String, // "CREDIT_CARD" | "DEBIT_CARD" | "EFT" | "MOBILE_MONEY"

    @SerializedName("paymentProvider")
    val paymentProvider: String, // "STRIPE" | "PAYFAST"

    @SerializedName("currency")
    val currency: String = "ZAR",

    @SerializedName("metadata")
    val metadata: Map<String, Any>? = null
)
