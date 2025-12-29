package za.co.taska.data.remote.dto.request

import com.google.gson.annotations.SerializedName

data class UpdateBidRequest(
    @SerializedName("amount")
    val amount: Double?,

    @SerializedName("message")
    val message: String?,

    @SerializedName("estimatedDays")
    val estimatedDays: Int?
)
