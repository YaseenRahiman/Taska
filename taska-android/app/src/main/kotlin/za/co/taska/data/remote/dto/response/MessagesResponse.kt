package za.co.taska.data.remote.dto.response

import com.google.gson.annotations.SerializedName

/**
 * Message Response DTO
 * Maps to backend Message model
 */
data class MessagesResponse(
    @SerializedName("id")
    val id: String,

    @SerializedName("jobId")
    val jobId: String,

    @SerializedName("senderId")
    val senderId: String,

    @SerializedName("receiverId")
    val receiverId: String,

    @SerializedName("content")
    val content: String,

    @SerializedName("messageType")
    val messageType: String,

    @SerializedName("attachments")
    val attachments: List<String>,

    @SerializedName("isRead")
    val isRead: Boolean,

    @SerializedName("readAt")
    val readAt: String?,

    @SerializedName("createdAt")
    val createdAt: String,

    @SerializedName("sender")
    val sender: MessageUserDto?,

    @SerializedName("fileUrl")
    val fileUrl: String? = null,

    @SerializedName("fileName")
    val fileName: String? = null,

    @SerializedName("fileSize")
    val fileSize: Long? = null
)

/**
 * Message User DTO (nested in MessagesResponse)
 */
data class MessageUserDto(
    @SerializedName("id")
    val id: String,

    @SerializedName("firstName")
    val firstName: String?,

    @SerializedName("lastName")
    val lastName: String?,

    @SerializedName("profilePictureUrl")
    val profilePictureUrl: String?
)
