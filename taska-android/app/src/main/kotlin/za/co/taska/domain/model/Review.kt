package za.co.taska.domain.model

/**
 * Review Domain Model
 * Represents a client review of an artisan's work
 */
data class Review(
    val id: String,
    val jobId: String,
    val clientId: String,
    val artisanId: String,
    val overallRating: Int,
    val qualityRating: Int,
    val professionalismRating: Int,
    val timelinessRating: Int,
    val valueRating: Int,
    val reviewText: String?,
    val images: List<String>,
    val wouldRecommend: Boolean,
    val createdAt: String,
    val updatedAt: String?
) {
    /**
     * Calculate average of category ratings
     */
    val averageCategoryRating: Double
        get() = (qualityRating + professionalismRating + timelinessRating + valueRating) / 4.0

    /**
     * Check if review has text
     */
    val hasReviewText: Boolean
        get() = !reviewText.isNullOrBlank()

    /**
     * Check if review has images
     */
    val hasImages: Boolean
        get() = images.isNotEmpty()

    /**
     * Check if review was edited
     */
    val wasEdited: Boolean
        get() = updatedAt != null && updatedAt != createdAt

    /**
     * Get rating display string
     */
    val ratingDisplay: String
        get() = "★ %.1f".format(overallRating.toDouble())
}

/**
 * Rating Category Enum
 * Different aspects of artisan work that can be rated
 */
enum class RatingCategory {
    OVERALL,
    QUALITY,
    PROFESSIONALISM,
    TIMELINESS,
    VALUE;

    val displayName: String
        get() = when (this) {
            OVERALL -> "Overall"
            QUALITY -> "Quality of Work"
            PROFESSIONALISM -> "Professionalism"
            TIMELINESS -> "Timeliness"
            VALUE -> "Value for Money"
        }
}
