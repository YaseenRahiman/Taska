package za.co.taska.data.remote.dto.request

import com.google.gson.annotations.SerializedName

/**
 * Update Review Request DTO
 * Request body for updating an existing review
 */
data class UpdateReviewRequest(
    @SerializedName("overallRating")
    val overallRating: Int? = null,

    @SerializedName("qualityRating")
    val qualityRating: Int? = null,

    @SerializedName("professionalismRating")
    val professionalismRating: Int? = null,

    @SerializedName("timelinessRating")
    val timelinessRating: Int? = null,

    @SerializedName("valueRating")
    val valueRating: Int? = null,

    @SerializedName("reviewText")
    val reviewText: String? = null,

    @SerializedName("images")
    val images: List<String>? = null,

    @SerializedName("wouldRecommend")
    val wouldRecommend: Boolean? = null
)
