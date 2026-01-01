package za.co.taska.data.repository

import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import za.co.taska.data.mapper.toDomain
import za.co.taska.data.remote.api.MessagesApiService
import za.co.taska.data.remote.dto.request.MarkAsReadRequest
import za.co.taska.data.remote.dto.request.SendMessageRequest as SendMessageRequestDto
import za.co.taska.domain.model.Conversation
import za.co.taska.domain.model.Message
import za.co.taska.domain.model.MessageQuery
import za.co.taska.domain.model.SendMessageRequest
import za.co.taska.domain.repository.MessagesRepository
import javax.inject.Inject

/**
 * Messages Repository Implementation
 * Handles message data operations with comprehensive error handling
 */
class MessagesRepositoryImpl @Inject constructor(
    private val messagesApiService: MessagesApiService
) : MessagesRepository {

    /**
     * Send message with SendMessageRequest (new domain model)
     */
    override suspend fun sendMessage(request: SendMessageRequest): Result<Message> {
        return try {
            val dto = SendMessageRequestDto(
                jobId = request.jobId,
                receiverId = request.recipientId,
                content = request.content,
                messageType = request.type.name,
                attachments = emptyList(),
                fileUrl = request.fileUrl,
                fileName = request.fileName,
                fileSize = request.fileSize
            )

            val response = messagesApiService.sendMessage(dto)

            if (response.isSuccessful && response.body() != null) {
                val message = response.body()!!.toDomain()
                Result.success(message)
            } else {
                val errorMessage = when (response.code()) {
                    400 -> "Invalid message data provided"
                    403 -> "You don't have permission to send messages in this conversation"
                    404 -> "Job or recipient not found"
                    else -> "Failed to send message: ${response.message()}"
                }
                Result.failure(Exception(errorMessage))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Network error: ${e.message}", e))
        }
    }

    /**
     * Send message (legacy method for backward compatibility)
     */
    override suspend fun sendMessage(
        recipientId: String,
        jobId: String,
        content: String,
        messageType: String,
        attachments: List<String>?
    ): Result<Message> {
        return try {
            val request = SendMessageRequestDto(
                jobId = jobId,
                receiverId = recipientId,
                content = content,
                messageType = messageType,
                attachments = attachments ?: emptyList()
            )

            val response = messagesApiService.sendMessage(request)

            if (response.isSuccessful && response.body() != null) {
                val message = response.body()!!.toDomain()
                Result.success(message)
            } else {
                val errorMessage = when (response.code()) {
                    400 -> "Invalid message data provided"
                    403 -> "You don't have permission to send messages in this conversation"
                    404 -> "Job or recipient not found"
                    else -> "Failed to send message: ${response.message()}"
                }
                Result.failure(Exception(errorMessage))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Network error: ${e.message}", e))
        }
    }

    override fun getConversationMessages(
        jobId: String?,
        userId: String?,
        limit: Int?,
        page: Int?
    ): Flow<Result<List<Message>>> = flow {
        try {
            val response = messagesApiService.getMessages(
                jobId = jobId,
                userId = userId,
                page = page ?: 1,
                limit = limit ?: 50
            )

            if (response.isSuccessful && response.body() != null) {
                val messages = response.body()!!.map { it.toDomain() }
                emit(Result.success(messages))
            } else {
                val errorMessage = when (response.code()) {
                    400 -> "Invalid query parameters"
                    403 -> "You don't have permission to view these messages"
                    404 -> "Conversation not found"
                    else -> "Failed to fetch messages: ${response.message()}"
                }
                emit(Result.failure(Exception(errorMessage)))
            }
        } catch (e: Exception) {
            emit(Result.failure(Exception("Network error: ${e.message}", e)))
        }
    }

    override fun getConversations(): Flow<Result<List<Conversation>>> = flow {
        try {
            val response = messagesApiService.getConversations()

            if (response.isSuccessful && response.body() != null) {
                val conversations = response.body()!!.map { it.toDomain() }
                emit(Result.success(conversations))
            } else {
                val errorMessage = when (response.code()) {
                    401 -> "Please login to view your conversations"
                    else -> "Failed to fetch conversations: ${response.message()}"
                }
                emit(Result.failure(Exception(errorMessage)))
            }
        } catch (e: Exception) {
            emit(Result.failure(Exception("Network error: ${e.message}", e)))
        }
    }

    override suspend fun markMessageAsRead(messageId: String): Result<Unit> {
        return try {
            val request = MarkAsReadRequest(messageId = messageId)
            val response = messagesApiService.markAsRead(request)

            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                val errorMessage = when (response.code()) {
                    400 -> "Invalid message ID"
                    403 -> "You can only mark your own messages as read"
                    404 -> "Message not found"
                    else -> "Failed to mark message as read: ${response.message()}"
                }
                Result.failure(Exception(errorMessage))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Network error: ${e.message}", e))
        }
    }

    override suspend fun markJobMessagesAsRead(jobId: String): Result<Unit> {
        return try {
            val request = MarkAsReadRequest(jobId = jobId)
            val response = messagesApiService.markAsRead(request)

            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                val errorMessage = when (response.code()) {
                    400 -> "Invalid job ID"
                    403 -> "You don't have permission to mark these messages as read"
                    404 -> "Job not found"
                    else -> "Failed to mark messages as read: ${response.message()}"
                }
                Result.failure(Exception(errorMessage))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Network error: ${e.message}", e))
        }
    }

    override suspend fun getUnreadCount(jobId: String?): Result<Int> {
        return try {
            val response = messagesApiService.getUnreadCount(jobId)

            if (response.isSuccessful && response.body() != null) {
                val count = response.body()!!.count
                Result.success(count)
            } else {
                val errorMessage = when (response.code()) {
                    400 -> "Invalid job ID"
                    403 -> "You don't have permission to view unread count"
                    else -> "Failed to fetch unread count: ${response.message()}"
                }
                Result.failure(Exception(errorMessage))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Network error: ${e.message}", e))
        }
    }

    /**
     * Get messages with MessageQuery filtering
     */
    override suspend fun getMessages(query: MessageQuery): Result<List<Message>> {
        return try {
            val response = messagesApiService.getMessages(
                jobId = query.jobId,
                userId = query.userId,
                page = (query.skip / query.take) + 1,
                limit = query.take
            )

            if (response.isSuccessful && response.body() != null) {
                var messages = response.body()!!.map { it.toDomain() }

                // Apply additional filters not supported by API
                if (query.type != null) {
                    messages = messages.filter { it.messageType == query.type }
                }

                if (query.search != null && query.search.isNotBlank()) {
                    val searchLower = query.search.lowercase()
                    messages = messages.filter {
                        it.content.lowercase().contains(searchLower) ||
                        it.sender?.displayName?.lowercase()?.contains(searchLower) == true
                    }
                }

                if (query.fromDate != null) {
                    messages = messages.filter { it.createdAt >= query.fromDate }
                }

                if (query.toDate != null) {
                    messages = messages.filter { it.createdAt <= query.toDate }
                }

                if (query.unreadOnly) {
                    messages = messages.filter { !it.isRead }
                }

                Result.success(messages)
            } else {
                val errorMessage = when (response.code()) {
                    400 -> "Invalid query parameters"
                    403 -> "You don't have permission to view these messages"
                    404 -> "Conversation not found"
                    else -> "Failed to fetch messages: ${response.message()}"
                }
                Result.failure(Exception(errorMessage))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Network error: ${e.message}", e))
        }
    }

    /**
     * Observe messages in real-time for a conversation
     * Simulates real-time updates via polling (WebSocket support pending)
     */
    override fun observeMessages(jobId: String): Flow<List<Message>> = flow {
        while (true) {
            try {
                val response = messagesApiService.getMessages(
                    jobId = jobId,
                    limit = 100
                )

                if (response.isSuccessful && response.body() != null) {
                    val messages = response.body()!!.map { it.toDomain() }
                    emit(messages)
                }

                // Poll every 3 seconds (will be replaced with WebSocket)
                delay(3000)
            } catch (e: Exception) {
                // Emit empty list on error and continue polling
                emit(emptyList())
                delay(5000)
            }
        }
    }
}
