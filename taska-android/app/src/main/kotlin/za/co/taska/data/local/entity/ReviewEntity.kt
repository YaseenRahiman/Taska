package za.co.taska.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Review Entity
 * Room database entity for offline review storage
 */
@Entity(tableName = "reviews")
data class ReviewEntity(
    @PrimaryKey
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
    val images: String, // Stored as comma-separated string
    val wouldRecommend: Boolean,
    val createdAt: String,
    val updatedAt: String?,
    val cachedAt: Long = System.currentTimeMillis()
)
