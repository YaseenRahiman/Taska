package za.co.taska.presentation.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.unit.dp

/**
 * Chat Input Bar Component
 * Message input field with send button and attachment options
 *
 * Features:
 * - Text input with multi-line support
 * - Send button (enabled only when text is present)
 * - Attachment button (images, files, documents)
 * - Character limit indicator
 * - Loading state during message send
 */
@Composable
fun ChatInputBar(
    messageText: String,
    onMessageTextChange: (String) -> Unit,
    onSendClick: () -> Unit,
    onAttachmentClick: () -> Unit,
    isLoading: Boolean = false,
    enabled: Boolean = true,
    modifier: Modifier = Modifier,
    maxLength: Int = 5000
) {
    Surface(
        modifier = modifier.fillMaxWidth(),
        color = MaterialTheme.colorScheme.surface,
        shadowElevation = 8.dp
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.Bottom
            ) {
                // Attachment button
                IconButton(
                    onClick = onAttachmentClick,
                    enabled = enabled && !isLoading
                ) {
                    Icon(
                        imageVector = Icons.Default.AttachFile,
                        contentDescription = "Attach file",
                        tint = if (enabled && !isLoading) {
                            MaterialTheme.colorScheme.primary
                        } else {
                            MaterialTheme.colorScheme.onSurface.copy(alpha = 0.38f)
                        }
                    )
                }

                // Message input field
                OutlinedTextField(
                    value = messageText,
                    onValueChange = { newText ->
                        if (newText.length <= maxLength) {
                            onMessageTextChange(newText)
                        }
                    },
                    modifier = Modifier.weight(1f),
                    placeholder = {
                        Text(
                            text = "Type a message...",
                            style = MaterialTheme.typography.bodyMedium
                        )
                    },
                    enabled = enabled && !isLoading,
                    maxLines = 5,
                    keyboardOptions = KeyboardOptions(
                        capitalization = KeyboardCapitalization.Sentences,
                        imeAction = ImeAction.Send
                    ),
                    keyboardActions = KeyboardActions(
                        onSend = {
                            if (messageText.isNotBlank() && !isLoading) {
                                onSendClick()
                            }
                        }
                    ),
                    shape = MaterialTheme.shapes.large,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = MaterialTheme.colorScheme.primary,
                        unfocusedBorderColor = MaterialTheme.colorScheme.outline
                    )
                )

                // Send button
                FilledIconButton(
                    onClick = onSendClick,
                    enabled = enabled && !isLoading && messageText.isNotBlank(),
                    modifier = Modifier.size(48.dp),
                    colors = IconButtonDefaults.filledIconButtonColors(
                        containerColor = MaterialTheme.colorScheme.primary,
                        contentColor = MaterialTheme.colorScheme.onPrimary,
                        disabledContainerColor = MaterialTheme.colorScheme.surfaceVariant,
                        disabledContentColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.38f)
                    )
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(24.dp),
                            color = MaterialTheme.colorScheme.onPrimary,
                            strokeWidth = 2.dp
                        )
                    } else {
                        Icon(
                            imageVector = Icons.Default.Send,
                            contentDescription = "Send message"
                        )
                    }
                }
            }

            // Character count indicator (show when approaching limit)
            if (messageText.length > maxLength * 0.8) {
                Text(
                    text = "${messageText.length} / $maxLength",
                    style = MaterialTheme.typography.labelSmall,
                    color = if (messageText.length >= maxLength) {
                        MaterialTheme.colorScheme.error
                    } else {
                        MaterialTheme.colorScheme.onSurfaceVariant
                    },
                    modifier = Modifier
                        .align(Alignment.End)
                        .padding(top = 4.dp)
                )
            }
        }
    }
}

/**
 * Attachment options bottom sheet
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AttachmentOptionsSheet(
    onDismiss: () -> Unit,
    onImageClick: () -> Unit,
    onDocumentClick: () -> Unit,
    onFileClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        modifier = modifier
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
                modifier = Modifier
                    .fillMaxWidth()
                    .clickableWithoutRipple { onImageClick() }
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
                modifier = Modifier
                    .fillMaxWidth()
                    .clickableWithoutRipple { onDocumentClick() }
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
                modifier = Modifier
                    .fillMaxWidth()
                    .clickableWithoutRipple { onFileClick() }
            )

            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

/**
 * Helper extension for clickable without ripple effect
 */
private fun Modifier.clickableWithoutRipple(onClick: () -> Unit): Modifier = composed {
    clickable(
        onClick = onClick,
        indication = null,
        interactionSource = remember { MutableInteractionSource() }
    )
}
