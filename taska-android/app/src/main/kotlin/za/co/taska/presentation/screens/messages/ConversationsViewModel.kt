package za.co.taska.presentation.screens.messages

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import za.co.taska.domain.model.Conversation
import za.co.taska.domain.usecase.messages.GetConversationsUseCase
import za.co.taska.domain.usecase.messages.GetUnreadCountUseCase
import javax.inject.Inject

/**
 * ViewModel for Conversations Screen
 * Manages conversation list state with search and filtering
 * Shared across all user roles (CLIENT, ARTISAN, ADMIN)
 */
@HiltViewModel
class ConversationsViewModel @Inject constructor(
    private val getConversationsUseCase: GetConversationsUseCase,
    private val getUnreadCountUseCase: GetUnreadCountUseCase
) : ViewModel() {

    private val _state = MutableStateFlow(ConversationsState())
    val state: StateFlow<ConversationsState> = _state.asStateFlow()

    init {
        loadConversations()
        loadUnreadCount()
    }

    /**
     * Load conversations from repository
     * Observes real-time updates via Flow
     */
    private fun loadConversations() {
        viewModelScope.launch {
            getConversationsUseCase()
                .collect { result ->
                    result.fold(
                        onSuccess = { conversations ->
                            _state.update { it.copy(
                                isLoading = false,
                                conversations = conversations,
                                error = null
                            ) }
                        },
                        onFailure = { error ->
                            _state.update { it.copy(
                                isLoading = false,
                                error = error.message ?: "Failed to load conversations"
                            ) }
                        }
                    )
                }
        }
    }

    /**
     * Load total unread count
     */
    private fun loadUnreadCount() {
        viewModelScope.launch {
            getUnreadCountUseCase().fold(
                onSuccess = { count ->
                    _state.update { it.copy(totalUnreadCount = count) }
                },
                onFailure = { /* Silent fail for unread count */ }
            )
        }
    }

    /**
     * Update search query and filter conversations
     */
    fun onSearchQueryChange(query: String) {
        _state.update { it.copy(searchQuery = query) }
    }

    /**
     * Filter conversations by unread status
     */
    fun toggleUnreadFilter() {
        _state.update { it.copy(showUnreadOnly = !it.showUnreadOnly) }
    }

    /**
     * Refresh conversations list
     */
    fun refresh() {
        _state.update { it.copy(isLoading = true, error = null) }
        loadConversations()
        loadUnreadCount()
    }

    /**
     * Clear error state
     */
    fun clearError() {
        _state.update { it.copy(error = null) }
    }
}

/**
 * State for Conversations Screen
 */
data class ConversationsState(
    val isLoading: Boolean = true,
    val error: String? = null,
    val conversations: List<Conversation> = emptyList(),
    val searchQuery: String = "",
    val showUnreadOnly: Boolean = false,
    val totalUnreadCount: Int = 0
) {
    /**
     * Filtered conversations based on search and unread filter
     */
    val filteredConversations: List<Conversation>
        get() {
            var filtered = conversations

            // Apply unread filter
            if (showUnreadOnly) {
                filtered = filtered.filter { it.hasUnread }
            }

            // Apply search filter
            if (searchQuery.isNotBlank()) {
                val query = searchQuery.lowercase()
                filtered = filtered.filter { conversation ->
                    conversation.otherUserName.lowercase().contains(query) ||
                    conversation.jobTitle.lowercase().contains(query) ||
                    conversation.lastMessage.lowercase().contains(query)
                }
            }

            return filtered
        }

    /**
     * Check if list is empty after filtering
     */
    val isEmpty: Boolean
        get() = filteredConversations.isEmpty() && !isLoading

    /**
     * Check if there are active filters
     */
    val hasActiveFilters: Boolean
        get() = searchQuery.isNotBlank() || showUnreadOnly
}
