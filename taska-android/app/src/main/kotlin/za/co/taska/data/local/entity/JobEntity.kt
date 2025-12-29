package za.co.taska.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Job Entity
 * Room database entity for caching jobs
 */
@Entity(tableName = "jobs")
data class JobEntity(
    @PrimaryKey
    val id: String,

    @ColumnInfo(name = "client_id")
    val clientId: String,

    @ColumnInfo(name = "category_id")
    val categoryId: String,

    val title: String,
    val description: String,
    val budget: Double,

    @ColumnInfo(name = "budget_type")
    val budgetType: String,

    val urgency: String,
    val status: String,

    val latitude: Double,
    val longitude: Double,

    val city: String,
    val province: String,

    @ColumnInfo(name = "address_line1")
    val addressLine1: String,

    val images: List<String>,
    val requirements: List<String>,

    @ColumnInfo(name = "created_at")
    val createdAt: String,

    @ColumnInfo(name = "cached_at")
    val cachedAt: Long = System.currentTimeMillis(),

    // Optional client info
    @ColumnInfo(name = "client_name")
    val clientName: String? = null,

    @ColumnInfo(name = "client_rating")
    val clientRating: Double? = null,

    // Calculated distance (in km)
    val distance: Double? = null
)
