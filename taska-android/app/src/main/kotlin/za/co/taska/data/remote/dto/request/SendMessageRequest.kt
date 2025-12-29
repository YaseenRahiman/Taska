package za.co.taska.data.remote.dto.request

import com.google.gson.annotations.SerializedName

/**
 * Send Message Request DTO
 * Maps to backend CreateMessageDto
 */
data class SendMessageRequest(
    @SerializedName("jobId")
    val jobId: String,

    @SerializedName("receiverId")
    val receiverId: String,

    @SerializedName("content")
    val content: String,

    @SerializedName("messageType")
    val messageType: String = "TEXT",

    @SerializedName("attachments")
    val attachments: List<String> = emptyList(),

    @SerializedName("fileUrl")
    val fileUrl: String? = null,

    @SerializedName("fileName")
    val fileName: String? = null,

    @SerializedName("fileSize")
    val fileSize: Long? = null
)
