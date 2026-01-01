package za.co.taska.domain.model

/**
 * Message Domain Model
 * Clean architecture - no framework dependencies
 */
data class Message(
    val id: String,
    val jobId: String,
    val senderId: String,
    val receiverId: String,
    val content: String,
    val messageType: MessageType,
    val attachments: List<String> = emptyList(),
    val isRead: Boolean = false,
    val readAt: String? = null,
    val createdAt: String,
    val sender: MessageUser? = null,
    val fileUrl: String? = null,
    val fileName: String? = null,
    val fileSize: Long? = null,
    val localId: String? = null // For optimistic UI updates
) {
    val isImage: Boolean
        get() = messageType == MessageType.IMAGE

    val isDocument: Boolean
        get() = messageType == MessageType.DOCUMENT

    val isSystem: Boolean
        get() = messageType == MessageType.SYSTEM

    val isText: Boolean
        get() = messageType == MessageType.TEXT

    val formattedTime: String
        get() {
            return try {
                createdAt.substring(11, 16) // "HH:mm"
            } catch (e: Exception) {
                createdAt
            }
        }

    val formattedDate: String
        get() {
            return try {
                createdAt.substring(0, 10) // "YYYY-MM-DD"
            } catch (e: Exception) {
                createdAt
            }
        }

    val fileSizeFormatted: String?
        get() {
            return fileSize?.let { size ->
                when {
                    size < 1024 -> "$size B"
                    size < 1024 * 1024 -> "${size / 1024} KB"
                    else -> "${size / (1024 * 1024)} MB"
                }
            }
        }
}

data class MessageUser(
    val id: String,
    val firstName: String? = null,
    val lastName: String? = null,
    val profilePictureUrl: String? = null
) {
    val displayName: String
        get() = listOfNotNull(firstName, lastName).joinToString(" ")
            .takeIf { it.isNotBlank() } ?: "User"
}

enum class MessageType {
    TEXT,
    IMAGE,
    DOCUMENT,
    SYSTEM,
    FILE
}

/**
 * Message send request
 */
data class SendMessageRequest(
    val recipientId: String,
    val jobId: String,
    val content: String,
    val type: MessageType = MessageType.TEXT,
    val fileUrl: String? = null,
    val fileName: String? = null,
    val fileSize: Long? = null,
    val localId: String? = null
)

/**
 * Message query filters
 */
data class MessageQuery(
    val jobId: String? = null,
    val userId: String? = null,
    val type: MessageType? = null,
    val search: String? = null,
    val fromDate: String? = null,
    val toDate: String? = null,
    val unreadOnly: Boolean = false,
    val skip: Int = 0,
    val take: Int = 50
)
