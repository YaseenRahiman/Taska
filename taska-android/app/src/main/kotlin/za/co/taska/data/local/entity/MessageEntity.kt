package za.co.taska.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Message Entity
 * Room database entity for caching messages
 */
@Entity(tableName = "messages")
data class MessageEntity(
    @PrimaryKey
    val id: String,

    @ColumnInfo(name = "job_id")
    val jobId: String,

    @ColumnInfo(name = "sender_id")
    val senderId: String,

    @ColumnInfo(name = "receiver_id")
    val receiverId: String,

    val content: String,

    @ColumnInfo(name = "message_type")
    val messageType: String,

    val attachments: List<String>,

    @ColumnInfo(name = "is_read")
    val isRead: Boolean,

    @ColumnInfo(name = "created_at")
    val createdAt: String,

    @ColumnInfo(name = "sync_status")
    val syncStatus: String = "SYNCED", // SYNCED, PENDING, FAILED

    // Sender info for display
    @ColumnInfo(name = "sender_name")
    val senderName: String? = null,

    @ColumnInfo(name = "sender_avatar")
    val senderAvatar: String? = null
)
