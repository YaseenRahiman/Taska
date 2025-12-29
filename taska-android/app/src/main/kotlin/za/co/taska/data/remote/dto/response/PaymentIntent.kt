package za.co.taska.data.remote.dto.response

import com.google.gson.annotations.SerializedName

/**
 * Payment Intent Response
 * Response from creating a payment intent
 * Contains client secret for frontend payment processing
 */
data class PaymentIntent(
    @SerializedName("paymentId")
    val paymentId: String,

    @SerializedName("clientSecret")
    val clientSecret: String,

    @SerializedName("amount")
    val amount: Double,

    @SerializedName("platformFee")
    val platformFee: Double,

    @SerializedName("vat")
    val vat: Double,

    @SerializedName("totalAmount")
    val totalAmount: Double,

    @SerializedName("currency")
    val currency: String,

    @SerializedName("paymentProvider")
    val paymentProvider: String,

    @SerializedName("expiresAt")
    val expiresAt: String,

    @SerializedName("metadata")
    val metadata: Map<String, Any>? = null
)
