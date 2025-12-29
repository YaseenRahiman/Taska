package za.co.taska.presentation.screens.messages

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import za.co.taska.presentation.components.ConversationCard

/**
 * Conversations Screen
 * Displays list of all conversations for the current user
 * Shared across all user roles (CLIENT, ARTISAN, ADMIN)
 *
 * Features:
 * - Real-time conversation updates
 * - Search conversations by name, job, or message content
 * - Filter by unread status
 * - Pull-to-refresh
 * - Empty state handling
 * - Error state handling
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ConversationsScreen(
    onNavigateBack: () -> Unit,
    onNavigateToChat: (conversationId: String, jobId: String, otherUserId: String) -> Unit,
    viewModel: ConversationsViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Messages")
                        if (state.totalUnreadCount > 0) {
                            Text(
                                text = "${state.totalUnreadCount} unread",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(
                            imageVector = Icons.Default.ArrowBack,
                            contentDescription = "Back"
                        )
                    }
                },
                actions = {
                    // Unread filter toggle
                    IconButton(
                        onClick = { viewModel.toggleUnreadFilter() }
                    ) {
                        Icon(
                            imageVector = if (state.showUnreadOnly) {
                                Icons.Default.MarkEmailRead
                            } else {
                                Icons.Default.MarkEmailUnread
                            },
                            contentDescription = if (state.showUnreadOnly) {
                                "Show all"
                            } else {
                                "Show unread only"
                            },
                            tint = if (state.showUnreadOnly) {
                                MaterialTheme.colorScheme.primary
                            } else {
                                MaterialTheme.colorScheme.onSurface
                            }
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Search bar
            SearchBar(
                query = state.searchQuery,
                onQueryChange = { viewModel.onSearchQueryChange(it) },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp)
            )

            // Content
            when {
                state.isLoading && state.conversations.isEmpty() -> {
                    LoadingState()
                }

                state.error != null -> {
                    ErrorState(
                        error = state.error!!,
                        onRetry = { viewModel.refresh() }
                    )
                }

                state.isEmpty -> {
                    EmptyState(
                        hasActiveFilters = state.hasActiveFilters,
                        onClearFilters = {
                            viewModel.onSearchQueryChange("")
                            if (state.showUnreadOnly) {
                                viewModel.toggleUnreadFilter()
                            }
                        }
                    )
                }

                else -> {
                    ConversationsList(
                        conversations = state.filteredConversations,
                        onConversationClick = { conversation ->
                            onNavigateToChat(
                                conversation.id,
                                conversation.jobId,
                                conversation.otherUserId
                            )
                        }
                    )
                }
            }
        }
    }

    // Show error snackbar
    state.error?.let { error ->
        LaunchedEffect(error) {
            // Auto-dismiss after showing
            kotlinx.coroutines.delay(3000)
            viewModel.clearError()
        }
    }
}

@Composable
private fun SearchBar(
    query: String,
    onQueryChange: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    OutlinedTextField(
        value = query,
        onValueChange = onQueryChange,
        modifier = modifier,
        placeholder = {
            Text("Search conversations...")
        },
        leadingIcon = {
            Icon(
                imageVector = Icons.Default.Search,
                contentDescription = "Search"
            )
        },
        trailingIcon = {
            if (query.isNotBlank()) {
                IconButton(onClick = { onQueryChange("") }) {
                    Icon(
                        imageVector = Icons.Default.Clear,
                        contentDescription = "Clear search"
                    )
                }
            }
        },
        singleLine = true,
        shape = MaterialTheme.shapes.large,
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = MaterialTheme.colorScheme.primary,
            unfocusedBorderColor = MaterialTheme.colorScheme.outline
        )
    )
}

@Composable
private fun ConversationsList(
    conversations: List<za.co.taska.domain.model.Conversation>,
    onConversationClick: (za.co.taska.domain.model.Conversation) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items(
            items = conversations,
            key = { it.id }
        ) { conversation ->
            ConversationCard(
                conversation = conversation,
                onClick = { onConversationClick(conversation) },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
            )
        }
    }
}

@Composable
private fun LoadingState() {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        CircularProgressIndicator()
    }
}

@Composable
private fun ErrorState(
    error: String,
    onRetry: () -> Unit
) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp),
            modifier = Modifier.padding(32.dp)
        ) {
            Icon(
                imageVector = Icons.Default.Error,
                contentDescription = "Error",
                modifier = Modifier.size(64.dp),
                tint = MaterialTheme.colorScheme.error
            )

            Text(
                text = error,
                style = MaterialTheme.typography.bodyLarge,
                textAlign = TextAlign.Center,
                color = MaterialTheme.colorScheme.onSurface
            )

            Button(onClick = onRetry) {
                Icon(
                    imageVector = Icons.Default.Refresh,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text("Retry")
            }
        }
    }
}

@Composable
private fun EmptyState(
    hasActiveFilters: Boolean,
    onClearFilters: () -> Unit
) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp),
            modifier = Modifier.padding(32.dp)
        ) {
            Icon(
                imageVector = if (hasActiveFilters) {
                    Icons.Default.FilterAltOff
                } else {
                    Icons.Default.Chat
                },
                contentDescription = "No conversations",
                modifier = Modifier.size(64.dp),
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Text(
                text = if (hasActiveFilters) {
                    "No conversations match your filters"
                } else {
                    "No conversations yet"
                },
                style = MaterialTheme.typography.titleMedium,
                textAlign = TextAlign.Center,
                color = MaterialTheme.colorScheme.onSurface
            )

            Text(
                text = if (hasActiveFilters) {
                    "Try adjusting your search or filters"
                } else {
                    "Start a conversation by bidding on a job or posting a job"
                },
                style = MaterialTheme.typography.bodyMedium,
                textAlign = TextAlign.Center,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            if (hasActiveFilters) {
                OutlinedButton(onClick = onClearFilters) {
                    Text("Clear Filters")
                }
            }
        }
    }
}
