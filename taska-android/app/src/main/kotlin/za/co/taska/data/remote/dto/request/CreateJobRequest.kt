package za.co.taska.data.remote.dto.request

import com.google.gson.annotations.SerializedName

/**
 * Create Job Request DTO
 * Client → API payload for creating new job
 */
data class CreateJobRequest(
    @SerializedName("categoryId") val categoryId: String,
    @SerializedName("title") val title: String,
    @SerializedName("description") val description: String,
    @SerializedName("budget") val budget: Double,
    @SerializedName("budgetType") val budgetType: String, // FIXED, HOURLY, NEGOTIABLE
    @SerializedName("urgency") val urgency: String, // LOW, MEDIUM, HIGH, URGENT
    @SerializedName("address") val address: AddressDto,
    @SerializedName("images") val images: List<String> = emptyList(),
    @SerializedName("requirements") val requirements: List<String> = emptyList(),
    @SerializedName("startDate") val startDate: String? = null,
    @SerializedName("endDate") val endDate: String? = null
)

/**
 * Address DTO for job location
 */
data class AddressDto(
    @SerializedName("addressLine1") val addressLine1: String,
    @SerializedName("addressLine2") val addressLine2: String? = null,
    @SerializedName("city") val city: String,
    @SerializedName("province") val province: String,
    @SerializedName("postalCode") val postalCode: String,
    @SerializedName("latitude") val latitude: Double,
    @SerializedName("longitude") val longitude: Double
)
