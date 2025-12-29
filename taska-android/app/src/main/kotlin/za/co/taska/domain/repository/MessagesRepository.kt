package za.co.taska.domain.repository

import kotlinx.coroutines.flow.Flow
import za.co.taska.domain.model.Conversation
import za.co.taska.domain.model.Message
import za.co.taska.domain.model.MessageQuery
import za.co.taska.domain.model.SendMessageRequest

/**
 * Messages Repository Interface
 * Defines contract for message data operations
 */
interface MessagesRepository {

    /**
     * Send a message
     */
    suspend fun sendMessage(request: SendMessageRequest): Result<Message>

    /**
     * Send a message (legacy method for backward compatibility)
     */
    suspend fun sendMessage(
        recipientId: String,
        jobId: String,
        content: String,
        messageType: String = "TEXT",
        attachments: List<String>? = null
    ): Result<Message>

    /**
     * Get messages with filtering
     */
    suspend fun getMessages(query: MessageQuery): Result<List<Message>>

    /**
     * Get messages for a specific conversation (job or user)
     * Supports pagination through limit and page parameters
     */
    fun getConversationMessages(
        jobId: String? = null,
        userId: String? = null,
        limit: Int? = null,
        page: Int? = null
    ): Flow<Result<List<Message>>>

    /**
     * Get all conversations for the current user
     */
    fun getConversations(): Flow<Result<List<Conversation>>>

    /**
     * Mark a specific message as read
     */
    suspend fun markMessageAsRead(messageId: String): Result<Unit>

    /**
     * Mark all messages in a job as read
     */
    suspend fun markJobMessagesAsRead(jobId: String): Result<Unit>

    /**
     * Get unread message count
     */
    suspend fun getUnreadCount(jobId: String? = null): Result<Int>

    /**
     * Observe messages in real-time for a conversation
     */
    fun observeMessages(jobId: String): Flow<List<Message>>
}
