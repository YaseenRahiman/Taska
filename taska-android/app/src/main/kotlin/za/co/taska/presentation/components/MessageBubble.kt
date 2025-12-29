package za.co.taska.presentation.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import za.co.taska.domain.model.Message
import za.co.taska.domain.model.MessageType

/**
 * Message Bubble Component
 * Displays a single message in the chat screen
 *
 * Features:
 * - Different styling for sent vs received messages
 * - Support for text, image, document, file, and system messages
 * - File attachment display with size
 * - Read status indicator
 * - Timestamp display
 * - Sender name for group contexts
 */
@Composable
fun MessageBubble(
    message: Message,
    isOwnMessage: Boolean,
    showSenderName: Boolean = false,
    onImageClick: ((String) -> Unit)? = null,
    onFileClick: ((Message) -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 4.dp),
        horizontalAlignment = if (isOwnMessage) Alignment.End else Alignment.Start
    ) {
        // Sender name (for received messages in group contexts)
        if (!isOwnMessage && showSenderName && message.sender != null) {
            Text(
                text = message.sender.displayName,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(start = 12.dp, bottom = 2.dp)
            )
        }

        // Message content
        when (message.messageType) {
            MessageType.SYSTEM -> SystemMessageBubble(message)
            MessageType.IMAGE -> ImageMessageBubble(message, isOwnMessage, onImageClick)
            MessageType.DOCUMENT, MessageType.FILE -> FileMessageBubble(message, isOwnMessage, onFileClick)
            MessageType.TEXT -> TextMessageBubble(message, isOwnMessage)
        }

        // Timestamp and read status
        Row(
            modifier = Modifier.padding(
                start = if (isOwnMessage) 0.dp else 12.dp,
                end = if (isOwnMessage) 12.dp else 0.dp,
                top = 2.dp
            ),
            horizontalArrangement = Arrangement.spacedBy(4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = message.formattedTime,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            // Read indicator (only for own messages)
            if (isOwnMessage) {
                Icon(
                    imageVector = if (message.isRead) Icons.Default.DoneAll else Icons.Default.Done,
                    contentDescription = if (message.isRead) "Read" else "Sent",
                    modifier = Modifier.size(16.dp),
                    tint = if (message.isRead) {
                        MaterialTheme.colorScheme.primary
                    } else {
                        MaterialTheme.colorScheme.onSurfaceVariant
                    }
                )
            }
        }
    }
}

@Composable
private fun TextMessageBubble(
    message: Message,
    isOwnMessage: Boolean
) {
    Surface(
        shape = RoundedCornerShape(
            topStart = 16.dp,
            topEnd = 16.dp,
            bottomStart = if (isOwnMessage) 16.dp else 4.dp,
            bottomEnd = if (isOwnMessage) 4.dp else 16.dp
        ),
        color = if (isOwnMessage) {
            MaterialTheme.colorScheme.primary
        } else {
            MaterialTheme.colorScheme.surfaceVariant
        },
        shadowElevation = 1.dp
    ) {
        Text(
            text = message.content,
            style = MaterialTheme.typography.bodyMedium,
            color = if (isOwnMessage) {
                MaterialTheme.colorScheme.onPrimary
            } else {
                MaterialTheme.colorScheme.onSurfaceVariant
            },
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)
        )
    }
}

@Composable
private fun ImageMessageBubble(
    message: Message,
    isOwnMessage: Boolean,
    onImageClick: ((String) -> Unit)?
) {
    Column(
        verticalArrangement = Arrangement.spacedBy(4.dp),
        horizontalAlignment = if (isOwnMessage) Alignment.End else Alignment.Start
    ) {
        // Image placeholder (in real implementation, use AsyncImage from Coil)
        Surface(
            shape = RoundedCornerShape(
                topStart = 16.dp,
                topEnd = 16.dp,
                bottomStart = if (isOwnMessage) 16.dp else 4.dp,
                bottomEnd = if (isOwnMessage) 4.dp else 16.dp
            ),
            color = MaterialTheme.colorScheme.surfaceVariant,
            shadowElevation = 1.dp,
            modifier = Modifier.size(width = 200.dp, height = 200.dp)
        ) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Image,
                    contentDescription = "Image message",
                    modifier = Modifier.size(48.dp),
                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        // Caption if present
        if (message.content.isNotBlank()) {
            Surface(
                shape = RoundedCornerShape(8.dp),
                color = if (isOwnMessage) {
                    MaterialTheme.colorScheme.primary
                } else {
                    MaterialTheme.colorScheme.surfaceVariant
                }
            ) {
                Text(
                    text = message.content,
                    style = MaterialTheme.typography.bodySmall,
                    color = if (isOwnMessage) {
                        MaterialTheme.colorScheme.onPrimary
                    } else {
                        MaterialTheme.colorScheme.onSurfaceVariant
                    },
                    modifier = Modifier.padding(8.dp)
                )
            }
        }
    }
}

@Composable
private fun FileMessageBubble(
    message: Message,
    isOwnMessage: Boolean,
    onFileClick: ((Message) -> Unit)?
) {
    Surface(
        shape = RoundedCornerShape(
            topStart = 16.dp,
            topEnd = 16.dp,
            bottomStart = if (isOwnMessage) 16.dp else 4.dp,
            bottomEnd = if (isOwnMessage) 4.dp else 16.dp
        ),
        color = if (isOwnMessage) {
            MaterialTheme.colorScheme.primary
        } else {
            MaterialTheme.colorScheme.surfaceVariant
        },
        shadowElevation = 1.dp
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // File icon
            Icon(
                imageVector = when (message.messageType) {
                    MessageType.DOCUMENT -> Icons.Default.Description
                    MessageType.FILE -> Icons.Default.AttachFile
                    else -> Icons.Default.InsertDriveFile
                },
                contentDescription = "File",
                modifier = Modifier.size(32.dp),
                tint = if (isOwnMessage) {
                    MaterialTheme.colorScheme.onPrimary
                } else {
                    MaterialTheme.colorScheme.onSurfaceVariant
                }
            )

            // File info
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(2.dp)
            ) {
                Text(
                    text = message.fileName ?: "File",
                    style = MaterialTheme.typography.bodyMedium,
                    color = if (isOwnMessage) {
                        MaterialTheme.colorScheme.onPrimary
                    } else {
                        MaterialTheme.colorScheme.onSurfaceVariant
                    },
                    maxLines = 2
                )

                message.fileSizeFormatted?.let { size ->
                    Text(
                        text = size,
                        style = MaterialTheme.typography.bodySmall,
                        color = if (isOwnMessage) {
                            MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.7f)
                        } else {
                            MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                        }
                    )
                }

                // Caption if present
                if (message.content.isNotBlank()) {
                    Text(
                        text = message.content,
                        style = MaterialTheme.typography.bodySmall,
                        color = if (isOwnMessage) {
                            MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.9f)
                        } else {
                            MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.9f)
                        },
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
            }

            // Download icon
            Icon(
                imageVector = Icons.Default.Download,
                contentDescription = "Download",
                modifier = Modifier.size(24.dp),
                tint = if (isOwnMessage) {
                    MaterialTheme.colorScheme.onPrimary
                } else {
                    MaterialTheme.colorScheme.onSurfaceVariant
                }
            )
        }
    }
}

@Composable
private fun SystemMessageBubble(message: Message) {
    Surface(
        shape = RoundedCornerShape(16.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
        modifier = Modifier.fillMaxWidth(0.8f)
    ) {
        Text(
            text = message.content,
            style = MaterialTheme.typography.bodySmall,
            fontStyle = FontStyle.Italic,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
        )
    }
}

/**
 * Typing indicator component
 */
@Composable
fun TypingIndicator(
    userName: String,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Surface(
            shape = RoundedCornerShape(16.dp),
            color = MaterialTheme.colorScheme.surfaceVariant
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "$userName is typing",
                    style = MaterialTheme.typography.bodySmall,
                    fontStyle = FontStyle.Italic,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                // Animated dots (simplified version)
                repeat(3) {
                    Box(
                        modifier = Modifier
                            .size(4.dp)
                            .background(
                                MaterialTheme.colorScheme.onSurfaceVariant,
                                shape = androidx.compose.foundation.shape.CircleShape
                            )
                    )
                }
            }
        }
    }
}
