package za.co.taska.data.local.dao

import androidx.room.*
import kotlinx.coroutines.flow.Flow
import za.co.taska.data.local.entity.MessageEntity

/**
 * Message DAO
 * Data Access Object for Message operations
 */
@Dao
interface MessageDao {

    @Query("SELECT * FROM messages WHERE job_id = :jobId ORDER BY created_at ASC")
    fun getMessagesByJob(jobId: String): Flow<List<MessageEntity>>

    @Query("SELECT * FROM messages WHERE id = :messageId")
    suspend fun getMessageById(messageId: String): MessageEntity?

    @Query("SELECT * FROM messages WHERE sync_status != 'SYNCED'")
    suspend fun getUnsyncedMessages(): List<MessageEntity>

    @Query("SELECT * FROM messages WHERE is_read = 0")
    fun getUnreadMessages(): Flow<List<MessageEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMessage(message: MessageEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMessages(messages: List<MessageEntity>)

    @Update
    suspend fun updateMessage(message: MessageEntity)

    @Query("UPDATE messages SET is_read = 1 WHERE id = :messageId")
    suspend fun markAsRead(messageId: String)

    @Delete
    suspend fun deleteMessage(message: MessageEntity)

    @Query("DELETE FROM messages WHERE job_id = :jobId")
    suspend fun deleteMessagesByJob(jobId: String)

    @Query("DELETE FROM messages")
    suspend fun clearAll()
}
