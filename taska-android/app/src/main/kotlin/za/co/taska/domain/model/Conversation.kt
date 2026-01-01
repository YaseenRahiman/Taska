package za.co.taska.domain.model

/**
 * Conversation model - represents a chat between two users about a job
 */
data class Conversation(
    val id: String,
    val jobId: String,
    val jobTitle: String,
    val otherUserId: String,
    val otherUserName: String,
    val otherUserRole: String,
    val otherUserAvatar: String? = null,
    val lastMessage: String,
    val lastMessageTime: String,
    val lastMessageType: MessageType = MessageType.TEXT,
    val unreadCount: Int = 0,
    val isOnline: Boolean = false,
    val isTyping: Boolean = false
) {
    val hasUnread: Boolean
        get() = unreadCount > 0

    val lastMessagePreview: String
        get() = when (lastMessageType) {
            MessageType.TEXT -> if (lastMessage.length > 50)
                lastMessage.take(50) + "..." else lastMessage
            MessageType.IMAGE -> "\uD83D\uDCF7 Image"
            MessageType.FILE, MessageType.DOCUMENT -> "\uD83D\uDCCE File"
            MessageType.SYSTEM -> lastMessage
        }

    val otherUserInitials: String
        get() = otherUserName.split(" ")
            .mapNotNull { it.firstOrNull()?.uppercaseChar() }
            .take(2)
            .joinToString("")

    val formattedTime: String
        get() {
            return try {
                val messageDate = lastMessageTime.substring(0, 10)
                val now = java.time.LocalDate.now().toString()

                if (messageDate == now) {
                    lastMessageTime.substring(11, 16) // "HH:mm"
                } else {
                    val month = when (lastMessageTime.substring(5, 7)) {
                        "01" -> "Jan"; "02" -> "Feb"; "03" -> "Mar"
                        "04" -> "Apr"; "05" -> "May"; "06" -> "Jun"
                        "07" -> "Jul"; "08" -> "Aug"; "09" -> "Sep"
                        "10" -> "Oct"; "11" -> "Nov"; "12" -> "Dec"
                        else -> ""
                    }
                    val day = lastMessageTime.substring(8, 10)
                    "$month $day"
                }
            } catch (e: Exception) {
                lastMessageTime
            }
        }
}
