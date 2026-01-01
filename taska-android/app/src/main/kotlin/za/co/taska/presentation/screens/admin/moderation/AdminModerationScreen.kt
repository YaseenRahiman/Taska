package za.co.taska.presentation.screens.admin.moderation

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.google.accompanist.swiperefresh.SwipeRefresh
import com.google.accompanist.swiperefresh.rememberSwipeRefreshState
import za.co.taska.domain.model.ContentType
import za.co.taska.domain.model.ModerationStatus
import za.co.taska.presentation.components.ModerationItemCard
import za.co.taska.presentation.theme.Primary600

/**
 * Admin Moderation Screen - Content review queue
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminModerationScreen(
    onNavigateBack: () -> Unit = {},
    viewModel: AdminModerationViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    val swipeRefreshState = rememberSwipeRefreshState(isRefreshing = state.isLoading)
    var showFilterDialog by remember { mutableStateOf(false) }
    var selectedItemId by remember { mutableStateOf<String?>(null) }
    var showApproveDialog by remember { mutableStateOf(false) }
    var showRejectDialog by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "Content Moderation",
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold
                        )
                        if (state.pendingCount > 0) {
                            Text(
                                text = "${state.pendingCount} pending",
                                style = MaterialTheme.typography.labelMedium
                            )
                        }
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = { showFilterDialog = true }) {
                        Badge(
                            containerColor = if (state.hasActiveFilters) Primary600 else MaterialTheme.colorScheme.surface
                        ) {
                            Icon(Icons.Default.FilterList, contentDescription = "Filter")
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Primary600,
                    titleContentColor = MaterialTheme.colorScheme.onPrimary,
                    navigationIconContentColor = MaterialTheme.colorScheme.onPrimary,
                    actionIconContentColor = MaterialTheme.colorScheme.onPrimary
                )
            )
        }
    ) { paddingValues ->
        SwipeRefresh(
            state = swipeRefreshState,
            onRefresh = { viewModel.loadModerationQueue() },
            modifier = Modifier.padding(paddingValues)
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                // Active Filters
                if (state.hasActiveFilters) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            state.selectedContentType?.let {
                                FilterChip(selected = true, onClick = {}, label = { Text(it.name) })
                            }
                            state.selectedStatus?.let {
                                FilterChip(selected = true, onClick = {}, label = { Text(it.name) })
                            }
                        }
                        TextButton(onClick = { viewModel.clearFilters() }) {
                            Text("Clear")
                        }
                    }
                }

                when {
                    state.error != null && !state.isLoading -> ErrorState(state.error!!, { viewModel.loadModerationQueue() })
                    state.items.isEmpty() && !state.isLoading -> EmptyState()
                    else -> {
                        LazyColumn(
                            contentPadding = PaddingValues(16.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(state.items, key = { it.id }) { item ->
                                ModerationItemCard(
                                    item = item,
                                    onClick = {
                                        selectedItemId = item.id
                                        if (item.isPending) {
                                            // Show action buttons
                                        }
                                    }
                                )
                                if (item.isPending) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp),
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        OutlinedButton(
                                            onClick = {
                                                selectedItemId = item.id
                                                showRejectDialog = true
                                            },
                                            modifier = Modifier.weight(1f)
                                        ) {
                                            Icon(Icons.Default.Close, contentDescription = null)
                                            Spacer(Modifier.width(4.dp))
                                            Text("Reject")
                                        }
                                        Button(
                                            onClick = {
                                                selectedItemId = item.id
                                                showApproveDialog = true
                                            },
                                            modifier = Modifier.weight(1f)
                                        ) {
                                            Icon(Icons.Default.CheckCircle, contentDescription = null)
                                            Spacer(Modifier.width(4.dp))
                                            Text("Approve")
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Dialogs
    if (showFilterDialog) {
        FilterDialog(
            state = state,
            onDismiss = { showFilterDialog = false },
            onApply = {
                viewModel.loadModerationQueue()
                showFilterDialog = false
            },
            onContentTypeChange = { viewModel.setContentTypeFilter(it) },
            onStatusChange = { viewModel.setStatusFilter(it) }
        )
    }

    if (showApproveDialog && selectedItemId != null) {
        ApproveContentDialog(
            onDismiss = { showApproveDialog = false },
            onConfirm = { notes ->
                viewModel.approveContent(selectedItemId!!, notes)
                showApproveDialog = false
            }
        )
    }

    if (showRejectDialog && selectedItemId != null) {
        RejectContentDialog(
            onDismiss = { showRejectDialog = false },
            onConfirm = { notes ->
                viewModel.rejectContent(selectedItemId!!, notes)
                showRejectDialog = false
            }
        )
    }
}

@Composable
private fun FilterDialog(
    state: AdminModerationState,
    onDismiss: () -> Unit,
    onApply: () -> Unit,
    onContentTypeChange: (ContentType?) -> Unit,
    onStatusChange: (ModerationStatus?) -> Unit
) {
    var selectedType by remember { mutableStateOf(state.selectedContentType) }
    var selectedStatus by remember { mutableStateOf(state.selectedStatus) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Filter Content") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Column {
                    Text("Content Type", fontWeight = FontWeight.Bold)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        FilterChip(selected = selectedType == null, onClick = { selectedType = null }, label = { Text("All") })
                        ContentType.values().forEach { type ->
                            FilterChip(selected = selectedType == type, onClick = { selectedType = type }, label = { Text(type.name) })
                        }
                    }
                }
                Column {
                    Text("Status", fontWeight = FontWeight.Bold)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        FilterChip(selected = selectedStatus == null, onClick = { selectedStatus = null }, label = { Text("All") })
                        ModerationStatus.values().forEach { status ->
                            FilterChip(selected = selectedStatus == status, onClick = { selectedStatus = status }, label = { Text(status.name) })
                        }
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = {
                onContentTypeChange(selectedType)
                onStatusChange(selectedStatus)
                onApply()
            }) {
                Text("Apply")
            }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } }
    )
}

@Composable
private fun ApproveContentDialog(onDismiss: () -> Unit, onConfirm: (String?) -> Unit) {
    var notes by remember { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Approve Content") },
        text = {
            Column {
                Text("Approve this content? It will remain visible on the platform.")
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = { Text("Notes (optional)") },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = { Button(onClick = { onConfirm(notes.ifBlank { null }) }) { Text("Approve") } },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } }
    )
}

@Composable
private fun RejectContentDialog(onDismiss: () -> Unit, onConfirm: (String?) -> Unit) {
    var notes by remember { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Reject Content") },
        text = {
            Column {
                Text("Reject this content? It will be hidden or removed.")
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = { Text("Notes (optional)") },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = { Button(onClick = { onConfirm(notes.ifBlank { null }) }) { Text("Reject") } },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } }
    )
}

@Composable
private fun ErrorState(message: String, onRetry: () -> Unit) {
    Column(
        modifier = Modifier.fillMaxSize().padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(Icons.Default.Error, contentDescription = null, modifier = Modifier.size(64.dp))
        Spacer(Modifier.height(16.dp))
        Text(message)
        Spacer(Modifier.height(16.dp))
        Button(onClick = onRetry) { Text("Retry") }
    }
}

@Composable
private fun EmptyState() {
    Column(
        modifier = Modifier.fillMaxSize().padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(Icons.Default.CheckCircle, contentDescription = null, modifier = Modifier.size(64.dp))
        Spacer(Modifier.height(16.dp))
        Text("No content requires moderation", style = MaterialTheme.typography.titleMedium)
    }
}
