package za.co.taska.data.remote.dto.request

import com.google.gson.annotations.SerializedName

/**
 * Update Job Request DTO
 * Client → API payload for updating existing job
 * All fields optional for partial updates
 */
data class UpdateJobRequest(
    @SerializedName("title") val title: String? = null,
    @SerializedName("description") val description: String? = null,
    @SerializedName("budget") val budget: Double? = null,
    @SerializedName("budgetType") val budgetType: String? = null, // FIXED, HOURLY, NEGOTIABLE
    @SerializedName("urgency") val urgency: String? = null, // LOW, MEDIUM, HIGH, URGENT
    @SerializedName("address") val address: AddressDto? = null,
    @SerializedName("images") val images: List<String>? = null,
    @SerializedName("requirements") val requirements: List<String>? = null,
    @SerializedName("startDate") val startDate: String? = null,
    @SerializedName("endDate") val endDate: String? = null
)
