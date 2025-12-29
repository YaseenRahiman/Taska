package za.co.taska.data.mapper

import za.co.taska.data.local.entity.NotificationEntity
import za.co.taska.data.remote.dto.response.NotificationPreferencesResponse
import za.co.taska.data.remote.dto.response.NotificationResponse
import za.co.taska.domain.model.Notification
import za.co.taska.domain.model.NotificationPreferences
import za.co.taska.domain.model.NotificationType

/**
 * Notification Mapper
 * Converts between DTO, Entity, and Domain models
 */

// DTO to Domain
fun NotificationResponse.toDomain(): Notification {
    return Notification(
        id = id,
        userId = userId,
        type = type.toNotificationType(),
        title = title,
        body = body,
        data = data,
        isRead = isRead,
        createdAt = createdAt,
        readAt = readAt
    )
}

// Entity to Domain
fun NotificationEntity.toDomain(): Notification {
    return Notification(
        id = id,
        userId = userId,
        type = type.toNotificationType(),
        title = title,
        body = body,
        data = data,
        isRead = isRead,
        createdAt = createdAt,
        readAt = readAt
    )
}

// Domain to Entity
fun Notification.toEntity(): NotificationEntity {
    return NotificationEntity(
        id = id,
        userId = userId,
        type = type.name,
        title = title,
        body = body,
        data = data,
        isRead = isRead,
        createdAt = createdAt,
        readAt = readAt,
        syncStatus = "SYNCED"
    )
}

// Preferences DTO to Domain
fun NotificationPreferencesResponse.toDomain(): NotificationPreferences {
    return NotificationPreferences(
        userId = userId,
        enableBidNotifications = enableBidNotifications,
        enableMessageNotifications = enableMessageNotifications,
        enablePaymentNotifications = enablePaymentNotifications,
        enableReviewNotifications = enableReviewNotifications,
        enableSystemNotifications = enableSystemNotifications,
        updatedAt = updatedAt
    )
}

// String to Enum converter
fun String.toNotificationType(): NotificationType {
    return try {
        NotificationType.valueOf(this)
    } catch (e: Exception) {
        NotificationType.SYSTEM
    }
}
