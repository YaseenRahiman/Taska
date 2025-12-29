package za.co.taska.data.remote.dto.request

import com.google.gson.annotations.SerializedName

/**
 * Mark As Read Request DTO
 * Can mark individual message, multiple messages, or all messages in a job
 */
data class MarkAsReadRequest(
    @SerializedName("messageId")
    val messageId: String? = null,

    @SerializedName("messageIds")
    val messageIds: List<String>? = null,

    @SerializedName("jobId")
    val jobId: String? = null
)
