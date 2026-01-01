package za.co.taska.presentation.screens.messages

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import kotlinx.coroutines.launch
import za.co.taska.domain.model.Message
import za.co.taska.domain.model.MessageType
import za.co.taska.presentation.components.ChatInputBar
import za.co.taska.presentation.components.MessageBubble
import za.co.taska.presentation.components.TypingIndicator

/**
 * Chat Screen
 * Real-time messaging interface for conversations about jobs
 * Supports text messages, file attachments, and read receipts
 *
 * Features:
 * - Real-time message updates
 * - Auto-scroll to latest message
 * - Message grouping by date
 * - Typing indicators
 * - Read receipts
 * - File attachments
 * - Pull-to-refresh for message history
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatScreen(
    jobTitle: String,
    otherUserName: String,
    onNavigateBack: () -> Unit,
    viewModel: ChatViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    val listState = rememberLazyListState()
    val coroutineScope = rememberCoroutineScope()

    // Auto-scroll to bottom when new messages arrive
    LaunchedEffect(state.messages.size) {
        if (state.messages.isNotEmpty()) {
            coroutineScope.launch {
                listState.animateScrollToItem(state.messages.size - 1)
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(otherUserName)
                        Text(
                            text = jobTitle,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
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
                    IconButton(onClick = { /* TODO: Navigate to job details */ }) {
                        Icon(
                            imageVector = Icons.Default.Info,
                            contentDescription = "Job details"
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        },
        bottomBar = {
            ChatInputBar(
                messageText = state.messageText,
                onMessageTextChange = { viewModel.onMessageTextChange(it) },
                onSendClick = { viewModel.sendMessage() },
                onAttachmentClick = { viewModel.toggleAttachmentOptions() },
                isLoading = state.isSending,
                enabled = !state.isSending
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when {
                state.isLoading && state.messages.isEmpty() -> {
                    LoadingState()
                }

                state.error != null -> {
                    ErrorState(
                        error = state.error!!,
                        onRetry = { viewModel.refresh() }
                    )
                }

                state.messages.isEmpty() -> {
                    EmptyState()
                }

                else -> {
                    MessagesList(
                        messages = state.messages,
                        isOwnMessage = { message -> state.isOwnMessage(message) },
                        otherUserTyping = state.otherUserTyping,
                        otherUserName = otherUserName,
                        listState = listState
                    )
                }
            }

            // Send error snackbar
            state.sendError?.let { error ->
                Snackbar(
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .padding(16.dp),
                    action = {
                        TextButton(onClick = { viewModel.clearError() }) {
                            Text("Dismiss")
                        }
                    }
                ) {
                    Text(error)
                }
            }
        }
    }

    // Attachment options bottom sheet
    if (state.showAttachmentOptions) {
        AttachmentOptionsSheet(
            onDismiss = { viewModel.toggleAttachmentOptions() },
            onImageSelected = { /* TODO: Handle image selection */ },
            onDocumentSelected = { /* TODO: Handle document selection */ },
            onFileSelected = { /* TODO: Handle file selection */ }
        )
    }
}

@Composable
private fun MessagesList(
    messages: List<Message>,
    isOwnMessage: (Message) -> Boolean,
    otherUserTyping: Boolean,
    otherUserName: String,
    listState: androidx.compose.foundation.lazy.LazyListState
) {
    LazyColumn(
        state = listState,
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(vertical = 16.dp),
        reverseLayout = false
    ) {
        // Group messages by date
        val groupedMessages = messages.groupBy { it.formattedDate }

        groupedMessages.forEach { (date, messagesForDate) ->
            // Date separator
            item(key = "date_$date") {
                DateSeparator(date = date)
            }

            // Messages for this date
            items(
                items = messagesForDate,
                key = { it.id }
            ) { message ->
                MessageBubble(
                    message = message,
                    isOwnMessage = isOwnMessage(message),
                    showSenderName = false,
                    onImageClick = { /* TODO: Handle image click */ },
                    onFileClick = { /* TODO: Handle file click */ }
                )
            }
        }

        // Typing indicator
        if (otherUserTyping) {
            item(key = "typing_indicator") {
                TypingIndicator(
                    userName = otherUserName,
                    modifier = Modifier.padding(top = 8.dp)
                )
            }
        }
    }
}

@Composable
private fun DateSeparator(date: String) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 16.dp),
        contentAlignment = Alignment.Center
    ) {
        Surface(
            shape = MaterialTheme.shapes.small,
            color = MaterialTheme.colorScheme.surfaceVariant
        ) {
            Text(
                text = formatDate(date),
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp)
            )
        }
    }
}

/**
 * Format date for display (convert YYYY-MM-DD to readable format)
 */
private fun formatDate(date: String): String {
    return try {
        val today = java.time.LocalDate.now().toString()
        val yesterday = java.time.LocalDate.now().minusDays(1).toString()

        when (date) {
            today -> "Today"
            yesterday -> "Yesterday"
            else -> {
                val parts = date.split("-")
                val month = when (parts[1]) {
                    "01" -> "Jan"; "02" -> "Feb"; "03" -> "Mar"
                    "04" -> "Apr"; "05" -> "May"; "06" -> "Jun"
                    "07" -> "Jul"; "08" -> "Aug"; "09" -> "Sep"
                    "10" -> "Oct"; "11" -> "Nov"; "12" -> "Dec"
                    else -> parts[1]
                }
                "$month ${parts[2]}, ${parts[0]}"
            }
        }
    } catch (e: Exception) {
        date
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
private fun EmptyState() {
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
                imageVector = Icons.Default.Chat,
                contentDescription = "No messages",
                modifier = Modifier.size(64.dp),
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Text(
                text = "No messages yet",
                style = MaterialTheme.typography.titleMedium,
                textAlign = TextAlign.Center,
                color = MaterialTheme.colorScheme.onSurface
            )

            Text(
                text = "Start the conversation by sending a message",
                style = MaterialTheme.typography.bodyMedium,
                textAlign = TextAlign.Center,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AttachmentOptionsSheet(
    onDismiss: () -> Unit,
    onImageSelected: () -> Unit,
    onDocumentSelected: () -> Unit,
    onFileSelected: () -> Unit
) {
    ModalBottomSheet(
        onDismissRequest = onDismiss
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = "Attach file",
                style = MaterialTheme.typography.titleMedium,
                modifier = Modifier.padding(bottom = 8.dp)
            )

            // Image option
            ListItem(
                headlineContent = { Text("Image") },
                supportingContent = { Text("Send a photo") },
                leadingContent = {
                    Icon(
                        imageVector = Icons.Default.Image,
                        contentDescription = "Image",
                        tint = MaterialTheme.colorScheme.primary
                    )
                },
                modifier = Modifier.fillMaxWidth()
            )

            // Document option
            ListItem(
                headlineContent = { Text("Document") },
                supportingContent = { Text("Send a PDF or document") },
                leadingContent = {
                    Icon(
                        imageVector = Icons.Default.Description,
                        contentDescription = "Document",
                        tint = MaterialTheme.colorScheme.primary
                    )
                },
                modifier = Modifier.fillMaxWidth()
            )

            // File option
            ListItem(
                headlineContent = { Text("File") },
                supportingContent = { Text("Send any file type") },
                leadingContent = {
                    Icon(
                        imageVector = Icons.Default.AttachFile,
                        contentDescription = "File",
                        tint = MaterialTheme.colorScheme.primary
                    )
                },
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}
