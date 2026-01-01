package za.co.taska.data.remote.dto.response

import com.google.gson.annotations.SerializedName

/**
 * Payment Response
 * Complete payment object from backend
 */
data class PaymentResponse(
    @SerializedName("id")
    val id: String,

    @SerializedName("jobId")
    val jobId: String,

    @SerializedName("bidId")
    val bidId: String,

    @SerializedName("payerId")
    val payerId: String,

    @SerializedName("payeeId")
    val payeeId: String,

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

    @SerializedName("paymentMethod")
    val paymentMethod: String,

    @SerializedName("paymentProvider")
    val paymentProvider: String,

    @SerializedName("status")
    val status: String,

    @SerializedName("transactionId")
    val transactionId: String?,

    @SerializedName("clientSecret")
    val clientSecret: String?,

    @SerializedName("escrowStatus")
    val escrowStatus: String?,

    @SerializedName("escrowedAt")
    val escrowedAt: String?,

    @SerializedName("releasedAt")
    val releasedAt: String?,

    @SerializedName("createdAt")
    val createdAt: String,

    @SerializedName("updatedAt")
    val updatedAt: String,

    @SerializedName("metadata")
    val metadata: Map<String, Any>? = null
)
