package za.co.taska.data.mapper

import za.co.taska.data.local.entity.MessageEntity
import za.co.taska.data.remote.dto.response.ConversationResponse
import za.co.taska.data.remote.dto.response.MessageUserDto
import za.co.taska.data.remote.dto.response.MessagesResponse
import za.co.taska.domain.model.Conversation
import za.co.taska.domain.model.Message
import za.co.taska.domain.model.MessageType
import za.co.taska.domain.model.MessageUser

/**
 * Message Mapper
 * Converts between DTO, Entity, and Domain models
 */

// DTO to Domain
fun MessagesResponse.toDomain(): Message {
    return Message(
        id = id,
        jobId = jobId,
        senderId = senderId,
        receiverId = receiverId,
        content = content,
        messageType = messageType.toMessageType(),
        attachments = attachments,
        isRead = isRead,
        readAt = readAt,
        createdAt = createdAt,
        sender = sender?.toMessageUser(),
        fileUrl = fileUrl,
        fileName = fileName,
        fileSize = fileSize,
        localId = null
    )
}

fun MessageUserDto.toMessageUser(): MessageUser {
    return MessageUser(
        id = id,
        firstName = firstName,
        lastName = lastName,
        profilePictureUrl = profilePictureUrl
    )
}

// Entity to Domain
fun MessageEntity.toDomain(): Message {
    return Message(
        id = id,
        jobId = jobId,
        senderId = senderId,
        receiverId = receiverId,
        content = content,
        messageType = messageType.toMessageType(),
        attachments = attachments,
        isRead = isRead,
        readAt = null,
        createdAt = createdAt,
        sender = senderName?.let {
            MessageUser(
                id = senderId,
                firstName = it,
                lastName = null,
                profilePictureUrl = senderAvatar
            )
        }
    )
}

// Domain to Entity
fun Message.toEntity(): MessageEntity {
    return MessageEntity(
        id = id,
        jobId = jobId,
        senderId = senderId,
        receiverId = receiverId,
        content = content,
        messageType = messageType.name,
        attachments = attachments,
        isRead = isRead,
        createdAt = createdAt,
        syncStatus = "SYNCED",
        senderName = sender?.displayName,
        senderAvatar = sender?.profilePictureUrl
    )
}

// Conversation DTO to Domain
fun ConversationResponse.toDomain(): Conversation {
    return Conversation(
        id = id,
        jobId = jobId,
        jobTitle = jobTitle,
        otherUserId = otherUserId ?: participantId ?: "",  // Support legacy field
        otherUserName = otherUserName ?: participantName ?: "User",  // Support legacy field
        otherUserRole = otherUserRole,
        otherUserAvatar = otherUserAvatar ?: participantAvatar,  // Support legacy field
        lastMessage = lastMessage,
        lastMessageTime = lastMessageTime ?: lastMessageAt ?: "",  // Support legacy field
        lastMessageType = lastMessageType.toMessageType(),
        unreadCount = unreadCount,
        isOnline = isOnline,
        isTyping = isTyping
    )
}

// String to Enum converter
fun String.toMessageType(): MessageType {
    return try {
        MessageType.valueOf(this)
    } catch (e: Exception) {
        MessageType.TEXT
    }
}
