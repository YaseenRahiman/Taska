package za.co.taska.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Notification Entity
 * Room database entity for caching notifications
 */
@Entity(tableName = "notifications")
data class NotificationEntity(
    @PrimaryKey
    val id: String,

    @ColumnInfo(name = "user_id")
    val userId: String,

    @ColumnInfo(name = "type")
    val type: String,

    @ColumnInfo(name = "title")
    val title: String,

    @ColumnInfo(name = "body")
    val body: String,

    @ColumnInfo(name = "data")
    val data: Map<String, String>,

    @ColumnInfo(name = "is_read")
    val isRead: Boolean,

    @ColumnInfo(name = "created_at")
    val createdAt: String,

    @ColumnInfo(name = "read_at")
    val readAt: String? = null,

    @ColumnInfo(name = "sync_status")
    val syncStatus: String = "SYNCED" // SYNCED, PENDING, FAILED
)
