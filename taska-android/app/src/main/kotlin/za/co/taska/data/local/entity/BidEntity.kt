package za.co.taska.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Bid Entity
 * Room database entity for caching user's bids
 */
@Entity(tableName = "bids")
data class BidEntity(
    @PrimaryKey
    val id: String,

    @ColumnInfo(name = "job_id")
    val jobId: String,

    val amount: Double,
    val message: String,

    @ColumnInfo(name = "estimated_days")
    val estimatedDays: Int,

    val attachments: List<String>,
    val status: String,

    @ColumnInfo(name = "created_at")
    val createdAt: String,

    @ColumnInfo(name = "sync_status")
    val syncStatus: String = "SYNCED", // SYNCED, PENDING, FAILED

    // Job info for display
    @ColumnInfo(name = "job_title")
    val jobTitle: String? = null,

    @ColumnInfo(name = "job_city")
    val jobCity: String? = null
)
