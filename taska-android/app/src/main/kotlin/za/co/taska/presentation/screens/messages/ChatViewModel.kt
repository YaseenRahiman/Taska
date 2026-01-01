package za.co.taska.presentation.screens.messages

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import za.co.taska.domain.model.Message
import za.co.taska.domain.model.MessageType
import za.co.taska.domain.model.SendMessageRequest
import za.co.taska.domain.usecase.messages.GetMessagesUseCase
import za.co.taska.domain.usecase.messages.MarkMessagesAsReadUseCase
import za.co.taska.domain.usecase.messages.SendMessageUseCase
import java.util.UUID
import javax.inject.Inject

/**
 * ViewModel for Chat Screen
 * Manages real-time messaging with a specific user about a job
 * Supports text messages, file attachments, and read receipts
 */
@HiltViewModel
class ChatViewModel @Inject constructor(
    private val getMessagesUseCase: GetMessagesUseCase,
    private val sendMessageUseCase: SendMessageUseCase,
    private val markMessagesAsReadUseCase: MarkMessagesAsReadUseCase,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val jobId: String = checkNotNull(savedStateHandle["jobId"])
    private val otherUserId: String = checkNotNull(savedStateHandle["otherUserId"])

    private val _state = MutableStateFlow(ChatState(jobId = jobId, otherUserId = otherUserId))
    val state: StateFlow<ChatState> = _state.asStateFlow()

    init {
        loadMessages()
        observeMessagesRealtime()
    }

    /**
     * Load initial messages for the conversation
     */
    private fun loadMessages() {
        viewModelScope.launch {
            getMessagesUseCase.getConversationMessages(
                jobId = jobId,
                limit = 50,
                page = 1
            ).collect { result ->
                result.fold(
                    onSuccess = { messages ->
                        _state.update { it.copy(
                            isLoading = false,
                            messages = messages,
                            error = null
                        ) }

                        // Mark messages as read
                        markMessagesAsRead()
                    },
                    onFailure = { error ->
                        _state.update { it.copy(
                            isLoading = false,
                            error = error.message ?: "Failed to load messages"
                        ) }
                    }
                )
            }
        }
    }

    /**
     * Observe real-time message updates
     */
    private fun observeMessagesRealtime() {
        viewModelScope.launch {
            getMessagesUseCase.observeMessages(jobId)
                .collect { messages ->
                    _state.update { currentState ->
                        // Merge with existing messages, avoiding duplicates
                        val existingIds = currentState.messages.map { it.id }.toSet()
                        val newMessages = messages.filter { it.id !in existingIds }

                        currentState.copy(
                            messages = (currentState.messages + newMessages)
                                .sortedBy { it.createdAt }
                        )
                    }

                    // Mark new messages as read
                    markMessagesAsRead()
                }
        }
    }

    /**
     * Send a text message
     */
    fun sendMessage() {
        val messageText = _state.value.messageText.trim()
        if (messageText.isBlank()) return

        viewModelScope.launch {
            _state.update { it.copy(isSending = true, sendError = null) }

            val request = SendMessageRequest(
                recipientId = otherUserId,
                jobId = jobId,
                content = messageText,
                type = MessageType.TEXT,
                localId = UUID.randomUUID().toString()
            )

            sendMessageUseCase(request).fold(
                onSuccess = { sentMessage ->
                    _state.update { currentState ->
                        currentState.copy(
                            isSending = false,
                            messageText = "",
                            messages = currentState.messages + sentMessage
                        )
                    }
                },
                onFailure = { error ->
                    _state.update { it.copy(
                        isSending = false,
                        sendError = error.message ?: "Failed to send message"
                    ) }
                }
            )
        }
    }

    /**
     * Send a file message
     */
    fun sendFileMessage(
        fileUrl: String,
        fileName: String,
        fileSize: Long,
        messageType: MessageType,
        caption: String = ""
    ) {
        viewModelScope.launch {
            _state.update { it.copy(isSending = true, sendError = null) }

            val request = SendMessageRequest(
                recipientId = otherUserId,
                jobId = jobId,
                content = caption,
                type = messageType,
                fileUrl = fileUrl,
                fileName = fileName,
                fileSize = fileSize,
                localId = UUID.randomUUID().toString()
            )

            sendMessageUseCase(request).fold(
                onSuccess = { sentMessage ->
                    _state.update { currentState ->
                        currentState.copy(
                            isSending = false,
                            messages = currentState.messages + sentMessage
                        )
                    }
                },
                onFailure = { error ->
                    _state.update { it.copy(
                        isSending = false,
                        sendError = error.message ?: "Failed to send file"
                    ) }
                }
            )
        }
    }

    /**
     * Update message text input
     */
    fun onMessageTextChange(text: String) {
        _state.update { it.copy(messageText = text) }
    }

    /**
     * Mark all messages in the conversation as read
     */
    private fun markMessagesAsRead() {
        viewModelScope.launch {
            markMessagesAsReadUseCase.markJobMessagesAsRead(jobId)
        }
    }

    /**
     * Refresh messages
     */
    fun refresh() {
        _state.update { it.copy(isLoading = true, error = null) }
        loadMessages()
    }

    /**
     * Clear error state
     */
    fun clearError() {
        _state.update { it.copy(error = null, sendError = null) }
    }

    /**
     * Show/hide attachment options
     */
    fun toggleAttachmentOptions() {
        _state.update { it.copy(showAttachmentOptions = !it.showAttachmentOptions) }
    }
}

/**
 * State for Chat Screen
 */
data class ChatState(
    val isLoading: Boolean = true,
    val error: String? = null,
    val messages: List<Message> = emptyList(),
    val jobId: String,
    val otherUserId: String,
    val messageText: String = "",
    val isSending: Boolean = false,
    val sendError: String? = null,
    val showAttachmentOptions: Boolean = false,
    val otherUserTyping: Boolean = false
) {
    /**
     * Get current user ID from messages
     * Assumes the first message sender/receiver not matching otherUserId is current user
     */
    val currentUserId: String?
        get() = messages.firstOrNull()?.let { message ->
            if (message.senderId == otherUserId) message.receiverId else message.senderId
        }

    /**
     * Check if a message was sent by current user
     */
    fun isOwnMessage(message: Message): Boolean {
        return currentUserId?.let { message.senderId == it } ?: false
    }

    /**
     * Get unread message count
     */
    val unreadCount: Int
        get() = messages.count { !it.isRead && it.senderId == otherUserId }
}
