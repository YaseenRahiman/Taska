package za.co.taska.data.remote.dto.response

import com.google.gson.annotations.SerializedName

/**
 * Conversation Response DTO
 * Maps to backend ConversationSummary
 */
data class ConversationResponse(
    @SerializedName("id")
    val id: String,

    @SerializedName("jobId")
    val jobId: String,

    @SerializedName("jobTitle")
    val jobTitle: String,

    @SerializedName("participantId")
    val participantId: String? = null,  // Legacy field

    @SerializedName("otherUserId")
    val otherUserId: String? = null,

    @SerializedName("participantName")
    val participantName: String? = null,  // Legacy field

    @SerializedName("otherUserName")
    val otherUserName: String? = null,

    @SerializedName("otherUserRole")
    val otherUserRole: String = "CLIENT",

    @SerializedName("participantAvatar")
    val participantAvatar: String? = null,  // Legacy field

    @SerializedName("otherUserAvatar")
    val otherUserAvatar: String? = null,

    @SerializedName("lastMessage")
    val lastMessage: String,

    @SerializedName("lastMessageAt")
    val lastMessageAt: String? = null,  // Legacy field

    @SerializedName("lastMessageTime")
    val lastMessageTime: String? = null,

    @SerializedName("lastMessageType")
    val lastMessageType: String = "TEXT",

    @SerializedName("unreadCount")
    val unreadCount: Int = 0,

    @SerializedName("totalMessages")
    val totalMessages: Int = 0,  // Legacy field

    @SerializedName("isOnline")
    val isOnline: Boolean = false,

    @SerializedName("isTyping")
    val isTyping: Boolean = false
)
