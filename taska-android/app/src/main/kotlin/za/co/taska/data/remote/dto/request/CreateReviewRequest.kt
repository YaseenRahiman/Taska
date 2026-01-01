package za.co.taska.data.remote.dto.request

import com.google.gson.annotations.SerializedName

/**
 * Create Review Request DTO
 * Request body for creating a new review
 */
data class CreateReviewRequest(
    @SerializedName("jobId")
    val jobId: String,

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
    val reviewText: String? = null,

    @SerializedName("images")
    val images: List<String> = emptyList(),

    @SerializedName("wouldRecommend")
    val wouldRecommend: Boolean
)
