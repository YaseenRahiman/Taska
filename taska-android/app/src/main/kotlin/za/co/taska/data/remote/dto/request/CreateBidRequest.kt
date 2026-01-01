package za.co.taska.data.remote.dto.request

import com.google.gson.annotations.SerializedName

data class CreateBidRequest(
    @SerializedName("jobId")
    val jobId: String,

    @SerializedName("amount")
    val amount: Double,

    @SerializedName("message")
    val message: String,

    @SerializedName("estimatedDays")
    val estimatedDays: Int,

    @SerializedName("attachments")
    val attachments: List<String> = emptyList()
)
