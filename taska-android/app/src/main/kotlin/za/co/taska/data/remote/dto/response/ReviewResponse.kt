package za.co.taska.data.remote.dto.response

import com.google.gson.annotations.SerializedName

/**
 * Review Response DTO
 * Response object for review data from API
 */
data class ReviewResponse(
    @SerializedName("id")
    val id: String,

    @SerializedName("jobId")
    val jobId: String,

    @SerializedName("clientId")
    val clientId: String,

    @SerializedName("artisanId")
    val artisanId: String,

    @SerializedName("overallRating")
    val overallRating: Int,

    @SerializedName("qualityRating")
    val qualityRating: Int,

    @SerializedName("professionalismRating")
    val professionalismRating: Int,

    @SerializedName("timelinessRating")
    val timelinessRating: Int,

    @SerializedName("valueRating")
    val valueRating: Int,

    @SerializedName("reviewText")
    val reviewText: String?,

    @SerializedName("images")
    val images: List<String>,

    @SerializedName("wouldRecommend")
    val wouldRecommend: Boolean,

    @SerializedName("createdAt")
    val createdAt: String,

    @SerializedName("updatedAt")
    val updatedAt: String?
)
