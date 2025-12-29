package za.co.taska.data.repository

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import za.co.taska.data.local.dao.NotificationDao
import za.co.taska.data.mapper.toDomain
import za.co.taska.data.mapper.toEntity
import za.co.taska.data.remote.api.NotificationsApiService
import za.co.taska.data.remote.dto.request.MarkMultipleNotificationsAsReadRequest
import za.co.taska.data.remote.dto.request.RegisterFcmTokenRequest
import za.co.taska.data.remote.dto.request.UpdateNotificationPreferencesRequest
import za.co.taska.domain.model.Notification
import za.co.taska.domain.model.NotificationPreferences
import za.co.taska.domain.repository.NotificationsRepository
import java.time.Instant
import javax.inject.Inject

/**
 * Notifications Repository Implementation
 * Handles notification data operations with network-first + cache fallback strategy
 */
class NotificationsRepositoryImpl @Inject constructor(
    private val notificationsApiService: NotificationsApiService,
    private val notificationDao: NotificationDao
) : NotificationsRepository {

    override fun getNotifications(
        type: String?,
        isRead: Boolean?,
        limit: Int,
        offset: Int
    ): Flow<Result<List<Notification>>> = flow {
        try {
            // Try network first
            val response = notificationsApiService.getNotifications(
                type = type,
                isRead = isRead,
                page = (offset / limit) + 1,
                limit = limit
            )

            if (response.isSuccessful && response.body() != null) {
                val notifications = response.body()!!.notifications.map { it.toDomain() }

                // Cache notifications in database
                val entities = notifications.map { it.toEntity() }
                notificationDao.insertNotifications(entities)

                emit(Result.success(notifications))
            } else {
                // Fallback to cache
                val cachedFlow = when {
                    type != null -> notificationDao.getNotificationsByType(type)
                    isRead != null -> notificationDao.getNotificationsByReadStatus(isRead)
                    else -> notificationDao.getNotifications(limit, offset)
                }

                cachedFlow.collect { entities ->
                    val notifications = entities.map { it.toDomain() }
                    emit(Result.success(notifications))
                }
            }
        } catch (e: Exception) {
            // Fallback to cache on network error
            try {
                val cachedFlow = when {
                    type != null -> notificationDao.getNotificationsByType(type)
                    isRead != null -> notificationDao.getNotificationsByReadStatus(isRead)
                    else -> notificationDao.getNotifications(limit, offset)
                }

                cachedFlow.collect { entities ->
                    val notifications = entities.map { it.toDomain() }
                    emit(Result.success(notifications))
                }
            } catch (cacheError: Exception) {
                emit(Result.failure(Exception("Failed to fetch notifications: ${e.message}", e)))
            }
        }
    }

    override suspend fun markNotificationAsRead(notificationId: String): Result<Unit> {
        return try {
            // Update on server
            val response = notificationsApiService.markAsRead(notificationId)

            if (response.isSuccessful) {
                // Update in local cache
                val now = Instant.now().toString()
                notificationDao.markAsRead(notificationId, now)
                Result.success(Unit)
            } else {
                val errorMessage = when (response.code()) {
                    400 -> "Invalid notification ID"
                    403 -> "You can only mark your own notifications as read"
                    404 -> "Notification not found"
                    else -> "Failed to mark notification as read: ${response.message()}"
                }
                Result.failure(Exception(errorMessage))
            }
        } catch (e: Exception) {
            // Update locally even on network error
            try {
                val now = Instant.now().toString()
                notificationDao.markAsRead(notificationId, now)
                Result.success(Unit)
            } catch (dbError: Exception) {
                Result.failure(Exception("Network error: ${e.message}", e))
            }
        }
    }

    override suspend fun markMultipleNotificationsAsRead(notificationIds: List<String>): Result<Unit> {
        return try {
            val request = MarkMultipleNotificationsAsReadRequest(notificationIds)
            val response = notificationsApiService.markMultipleAsRead(request)

            if (response.isSuccessful) {
                // Update in local cache
                val now = Instant.now().toString()
                notificationDao.markMultipleAsRead(notificationIds, now)
                Result.success(Unit)
            } else {
                val errorMessage = when (response.code()) {
                    400 -> "Invalid notification IDs"
                    403 -> "You can only mark your own notifications as read"
                    else -> "Failed to mark notifications as read: ${response.message()}"
                }
                Result.failure(Exception(errorMessage))
            }
        } catch (e: Exception) {
            // Update locally even on network error
            try {
                val now = Instant.now().toString()
                notificationDao.markMultipleAsRead(notificationIds, now)
                Result.success(Unit)
            } catch (dbError: Exception) {
                Result.failure(Exception("Network error: ${e.message}", e))
            }
        }
    }

    override suspend fun markAllNotificationsAsRead(): Result<Unit> {
        return try {
            val response = notificationsApiService.markAllAsRead()

            if (response.isSuccessful) {
                // Update in local cache
                val now = Instant.now().toString()
                notificationDao.markAllAsRead(now)
                Result.success(Unit)
            } else {
                val errorMessage = "Failed to mark all notifications as read: ${response.message()}"
                Result.failure(Exception(errorMessage))
            }
        } catch (e: Exception) {
            // Update locally even on network error
            try {
                val now = Instant.now().toString()
                notificationDao.markAllAsRead(now)
                Result.success(Unit)
            } catch (dbError: Exception) {
                Result.failure(Exception("Network error: ${e.message}", e))
            }
        }
    }

    override suspend fun clearReadNotifications(): Result<Unit> {
        return try {
            val response = notificationsApiService.clearReadNotifications()

            if (response.isSuccessful) {
                // Clear from local cache
                notificationDao.deleteReadNotifications()
                Result.success(Unit)
            } else {
                val errorMessage = "Failed to clear notifications: ${response.message()}"
                Result.failure(Exception(errorMessage))
            }
        } catch (e: Exception) {
            // Clear locally even on network error
            try {
                notificationDao.deleteReadNotifications()
                Result.success(Unit)
            } catch (dbError: Exception) {
                Result.failure(Exception("Network error: ${e.message}", e))
            }
        }
    }

    override suspend fun deleteNotification(notificationId: String): Result<Unit> {
        return try {
            val response = notificationsApiService.deleteNotification(notificationId)

            if (response.isSuccessful) {
                // Delete from local cache
                notificationDao.deleteNotificationById(notificationId)
                Result.success(Unit)
            } else {
                val errorMessage = when (response.code()) {
                    400 -> "Invalid notification ID"
                    403 -> "You can only delete your own notifications"
                    404 -> "Notification not found"
                    else -> "Failed to delete notification: ${response.message()}"
                }
                Result.failure(Exception(errorMessage))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Network error: ${e.message}", e))
        }
    }

    override suspend fun getNotificationPreferences(): Result<NotificationPreferences> {
        return try {
            val response = notificationsApiService.getNotificationPreferences()

            if (response.isSuccessful && response.body() != null) {
                val preferences = response.body()!!.toDomain()
                Result.success(preferences)
            } else {
                val errorMessage = when (response.code()) {
                    401 -> "Please login to view preferences"
                    else -> "Failed to fetch preferences: ${response.message()}"
                }
                Result.failure(Exception(errorMessage))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Network error: ${e.message}", e))
        }
    }

    override suspend fun updateNotificationPreferences(
        enableBidNotifications: Boolean?,
        enableMessageNotifications: Boolean?,
        enablePaymentNotifications: Boolean?,
        enableReviewNotifications: Boolean?,
        enableSystemNotifications: Boolean?
    ): Result<NotificationPreferences> {
        return try {
            val request = UpdateNotificationPreferencesRequest(
                enableBidNotifications = enableBidNotifications,
                enableMessageNotifications = enableMessageNotifications,
                enablePaymentNotifications = enablePaymentNotifications,
                enableReviewNotifications = enableReviewNotifications,
                enableSystemNotifications = enableSystemNotifications
            )

            val response = notificationsApiService.updateNotificationPreferences(request)

            if (response.isSuccessful && response.body() != null) {
                val preferences = response.body()!!.toDomain()
                Result.success(preferences)
            } else {
                val errorMessage = when (response.code()) {
                    400 -> "Invalid preferences data"
                    401 -> "Please login to update preferences"
                    else -> "Failed to update preferences: ${response.message()}"
                }
                Result.failure(Exception(errorMessage))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Network error: ${e.message}", e))
        }
    }

    override suspend fun getUnreadCount(): Result<Int> {
        return try {
            val response = notificationsApiService.getUnreadCount()

            if (response.isSuccessful && response.body() != null) {
                val count = response.body()!!.count
                Result.success(count)
            } else {
                // Fallback to local cache
                try {
                    // This won't work with Flow, so we'll return an error
                    Result.failure(Exception("Failed to fetch unread count"))
                } catch (dbError: Exception) {
                    Result.failure(Exception("Failed to fetch unread count: ${response.message()}"))
                }
            }
        } catch (e: Exception) {
            Result.failure(Exception("Network error: ${e.message}", e))
        }
    }

    override suspend fun registerFcmToken(token: String, deviceId: String): Result<Unit> {
        return try {
            val request = RegisterFcmTokenRequest(
                token = token,
                deviceId = deviceId,
                platform = "android"
            )

            val response = notificationsApiService.registerFcmToken(request)

            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                val errorMessage = when (response.code()) {
                    400 -> "Invalid token or device ID"
                    401 -> "Please login to register for push notifications"
                    else -> "Failed to register FCM token: ${response.message()}"
                }
                Result.failure(Exception(errorMessage))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Network error: ${e.message}", e))
        }
    }
}
