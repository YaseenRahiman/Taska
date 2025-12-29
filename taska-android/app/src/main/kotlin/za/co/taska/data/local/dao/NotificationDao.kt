package za.co.taska.data.local.dao

import androidx.room.*
import kotlinx.coroutines.flow.Flow
import za.co.taska.data.local.entity.NotificationEntity

/**
 * Notification DAO
 * Data Access Object for Notification operations
 */
@Dao
interface NotificationDao {

    @Query("SELECT * FROM notifications ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    fun getNotifications(limit: Int, offset: Int): Flow<List<NotificationEntity>>

    @Query("SELECT * FROM notifications WHERE type = :type ORDER BY created_at DESC")
    fun getNotificationsByType(type: String): Flow<List<NotificationEntity>>

    @Query("SELECT * FROM notifications WHERE is_read = :isRead ORDER BY created_at DESC")
    fun getNotificationsByReadStatus(isRead: Boolean): Flow<List<NotificationEntity>>

    @Query("SELECT * FROM notifications WHERE id = :notificationId")
    suspend fun getNotificationById(notificationId: String): NotificationEntity?

    @Query("SELECT * FROM notifications WHERE is_read = 0")
    fun getUnreadNotifications(): Flow<List<NotificationEntity>>

    @Query("SELECT COUNT(*) FROM notifications WHERE is_read = 0")
    fun getUnreadCount(): Flow<Int>

    @Query("SELECT * FROM notifications WHERE sync_status != 'SYNCED'")
    suspend fun getUnsyncedNotifications(): List<NotificationEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertNotification(notification: NotificationEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertNotifications(notifications: List<NotificationEntity>)

    @Update
    suspend fun updateNotification(notification: NotificationEntity)

    @Query("UPDATE notifications SET is_read = 1, read_at = :readAt WHERE id = :notificationId")
    suspend fun markAsRead(notificationId: String, readAt: String)

    @Query("UPDATE notifications SET is_read = 1, read_at = :readAt WHERE id IN (:notificationIds)")
    suspend fun markMultipleAsRead(notificationIds: List<String>, readAt: String)

    @Query("UPDATE notifications SET is_read = 1, read_at = :readAt")
    suspend fun markAllAsRead(readAt: String)

    @Delete
    suspend fun deleteNotification(notification: NotificationEntity)

    @Query("DELETE FROM notifications WHERE id = :notificationId")
    suspend fun deleteNotificationById(notificationId: String)

    @Query("DELETE FROM notifications WHERE is_read = 1")
    suspend fun deleteReadNotifications()

    @Query("DELETE FROM notifications WHERE type = :type")
    suspend fun deleteNotificationsByType(type: String)

    @Query("DELETE FROM notifications")
    suspend fun clearAll()
}
