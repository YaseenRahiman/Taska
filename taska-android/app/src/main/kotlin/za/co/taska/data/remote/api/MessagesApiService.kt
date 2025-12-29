package za.co.taska.data.remote.api

import okhttp3.MultipartBody
import retrofit2.Response
import retrofit2.http.*
import za.co.taska.data.remote.dto.request.MarkAsReadRequest
import za.co.taska.data.remote.dto.request.SendMessageRequest
import za.co.taska.data.remote.dto.response.ConversationResponse
import za.co.taska.data.remote.dto.response.MessagesResponse
import za.co.taska.data.remote.dto.response.UploadResponse

/**
 * Messages API Service
 * Retrofit interface for messages endpoints matching backend API
 */
interface MessagesApiService {

    /**
     * Get messages with filtering and pagination
     * GET /messages?jobId=...&userId=...&page=...&limit=...
     */
    @GET("messages")
    suspend fun getMessages(
        @Query("jobId") jobId: String? = null,
        @Query("userId") userId: String? = null,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 50
    ): Response<List<MessagesResponse>>

    /**
     * Send a message
     * POST /messages
     */
    @POST("messages")
    suspend fun sendMessage(
        @Body request: SendMessageRequest
    ): Response<MessagesResponse>

    /**
     * Get all conversations for the current user
     * GET /messages/conversations
     */
    @GET("messages/conversations")
    suspend fun getConversations(): Response<List<ConversationResponse>>

    /**
     * Mark messages as read (can mark single, multiple, or all in a job)
     * POST /messages/mark-read
     */
    @POST("messages/mark-read")
    suspend fun markAsRead(
        @Body request: MarkAsReadRequest
    ): Response<Unit>

    /**
     * Get unread message count
     * GET /messages/unread-count?jobId=...
     */
    @GET("messages/unread-count")
    suspend fun getUnreadCount(
        @Query("jobId") jobId: String? = null
    ): Response<UnreadCountResponse>

    /**
     * Upload file for message attachment
     * POST /messages/upload
     */
    @Multipart
    @POST("messages/upload")
    suspend fun uploadAttachment(
        @Part file: MultipartBody.Part
    ): Response<UploadResponse>
}

/**
 * Unread count response
 */
data class UnreadCountResponse(
    val count: Int
)
