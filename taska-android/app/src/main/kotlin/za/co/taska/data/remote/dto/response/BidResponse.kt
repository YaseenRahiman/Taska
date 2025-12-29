package za.co.taska.data.remote.dto.response

import com.google.gson.annotations.SerializedName

data class BidResponse(
    @SerializedName("id")
    val id: String,

    @SerializedName("jobId")
    val jobId: String,

    @SerializedName("artisanId")
    val artisanId: String,

    @SerializedName("amount")
    val amount: Double,

    @SerializedName("message")
    val message: String,

    @SerializedName("estimatedDays")
    val estimatedDays: Int,

    @SerializedName("attachments")
    val attachments: List<String>,

    @SerializedName("status")
    val status: String,

    @SerializedName("acceptedAt")
    val acceptedAt: String?,

    @SerializedName("rejectedAt")
    val rejectedAt: String?,

    @SerializedName("withdrawnAt")
    val withdrawnAt: String?,

    @SerializedName("expiresAt")
    val expiresAt: String,

    @SerializedName("createdAt")
    val createdAt: String,

    @SerializedName("updatedAt")
    val updatedAt: String,

    @SerializedName("job")
    val job: JobResponse?
)
