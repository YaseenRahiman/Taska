package za.co.taska.presentation.screens.admin.users

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
import za.co.taska.domain.model.UserRole
import za.co.taska.domain.model.UserStatus
import za.co.taska.presentation.components.AdminUserCard
import za.co.taska.presentation.theme.Primary600

/**
 * Admin Users Screen - User management with filtering
 * Allows admins to search, filter, and manage users
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminUsersScreen(
    onNavigateBack: () -> Unit = {},
    onNavigateToUserDetail: (String) -> Unit = {},
    viewModel: AdminUsersViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    val swipeRefreshState = rememberSwipeRefreshState(isRefreshing = state.isLoading)
    var showFilterDialog by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "User Management",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold
                    )
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
                    IconButton(onClick = { showFilterDialog = true }) {
                        Badge(
                            containerColor = if (state.hasActiveFilters) Primary600 else MaterialTheme.colorScheme.surface
                        ) {
                            Icon(
                                imageVector = Icons.Default.FilterList,
                                contentDescription = "Filter"
                            )
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
            onRefresh = { viewModel.loadUsers() },
            modifier = Modifier.padding(paddingValues)
        ) {
            Column(
                modifier = Modifier.fillMaxSize()
            ) {
                // Search Bar
                SearchBar(
                    query = state.searchQuery,
                    onQueryChange = { viewModel.updateSearchQuery(it) },
                    onSearch = { viewModel.applyFilters() },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                )

                // Active Filters Chips
                if (state.hasActiveFilters) {
                    ActiveFiltersRow(
                        state = state,
                        onClearFilters = { viewModel.clearFilters() },
                        modifier = Modifier.padding(horizontal = 16.dp)
                    )
                }

                // User List
                when {
                    state.error != null && !state.isLoading -> {
                        ErrorState(
                            message = state.error!!,
                            onRetry = { viewModel.loadUsers() }
                        )
                    }
                    state.users.isEmpty() && !state.isLoading -> {
                        EmptyState()
                    }
                    else -> {
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(16.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            item {
                                Text(
                                    text = "${state.users.size} users found",
                                    style = MaterialTheme.typography.labelLarge,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }

                            items(state.users, key = { it.id }) { user ->
                                AdminUserCard(
                                    user = user,
                                    onClick = { onNavigateToUserDetail(user.id) }
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    // Filter Dialog
    if (showFilterDialog) {
        FilterDialog(
            state = state,
            onDismiss = { showFilterDialog = false },
            onApplyFilters = {
                viewModel.applyFilters()
                showFilterDialog = false
            },
            onRoleChange = { viewModel.setRoleFilter(it) },
            onStatusChange = { viewModel.setStatusFilter(it) },
            onVerifiedChange = { viewModel.setVerifiedFilter(it) }
        )
    }
}

@Composable
@OptIn(ExperimentalMaterial3Api::class)
private fun SearchBar(
    query: String,
    onQueryChange: (String) -> Unit,
    onSearch: () -> Unit,
    modifier: Modifier = Modifier
) {
    OutlinedTextField(
        value = query,
        onValueChange = onQueryChange,
        modifier = modifier,
        placeholder = { Text("Search by name or email") },
        leadingIcon = {
            Icon(
                imageVector = Icons.Default.Search,
                contentDescription = null
            )
        },
        trailingIcon = {
            if (query.isNotEmpty()) {
                IconButton(onClick = { onQueryChange("") }) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Clear"
                    )
                }
            }
        },
        singleLine = true,
        shape = MaterialTheme.shapes.medium
    )
}

@Composable
private fun ActiveFiltersRow(
    state: AdminUsersState,
    onClearFilters: () -> Unit,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(bottom = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = "Filters:",
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        if (state.selectedRole != null) {
            FilterChip(
                selected = true,
                onClick = {},
                label = { Text(state.selectedRole.name) }
            )
        }

        if (state.selectedStatus != null) {
            FilterChip(
                selected = true,
                onClick = {},
                label = { Text(state.selectedStatus.name) }
            )
        }

        if (state.verifiedFilter != null) {
            FilterChip(
                selected = true,
                onClick = {},
                label = { Text(if (state.verifiedFilter) "Verified" else "Unverified") }
            )
        }

        TextButton(onClick = onClearFilters) {
            Text("Clear All")
        }
    }
}

@Composable
private fun FilterDialog(
    state: AdminUsersState,
    onDismiss: () -> Unit,
    onApplyFilters: () -> Unit,
    onRoleChange: (UserRole?) -> Unit,
    onStatusChange: (UserStatus?) -> Unit,
    onVerifiedChange: (Boolean?) -> Unit
) {
    var selectedRole by remember { mutableStateOf(state.selectedRole) }
    var selectedStatus by remember { mutableStateOf(state.selectedStatus) }
    var verifiedFilter by remember { mutableStateOf(state.verifiedFilter) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Filter Users") },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Role Filter
                Column {
                    Text(
                        text = "Role",
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        FilterChip(
                            selected = selectedRole == null,
                            onClick = { selectedRole = null },
                            label = { Text("All") }
                        )
                        UserRole.values().forEach { role ->
                            FilterChip(
                                selected = selectedRole == role,
                                onClick = { selectedRole = role },
                                label = { Text(role.name) }
                            )
                        }
                    }
                }

                // Status Filter
                Column {
                    Text(
                        text = "Status",
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        FilterChip(
                            selected = selectedStatus == null,
                            onClick = { selectedStatus = null },
                            label = { Text("All") }
                        )
                        UserStatus.values().forEach { status ->
                            FilterChip(
                                selected = selectedStatus == status,
                                onClick = { selectedStatus = status },
                                label = { Text(status.name) }
                            )
                        }
                    }
                }

                // Verification Filter
                Column {
                    Text(
                        text = "Verification (Artisans)",
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        FilterChip(
                            selected = verifiedFilter == null,
                            onClick = { verifiedFilter = null },
                            label = { Text("All") }
                        )
                        FilterChip(
                            selected = verifiedFilter == true,
                            onClick = { verifiedFilter = true },
                            label = { Text("Verified") }
                        )
                        FilterChip(
                            selected = verifiedFilter == false,
                            onClick = { verifiedFilter = false },
                            label = { Text("Unverified") }
                        )
                    }
                }
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    onRoleChange(selectedRole)
                    onStatusChange(selectedStatus)
                    onVerifiedChange(verifiedFilter)
                    onApplyFilters()
                }
            ) {
                Text("Apply")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@Composable
private fun ErrorState(
    message: String,
    onRetry: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = Icons.Default.Error,
            contentDescription = null,
            modifier = Modifier.size(64.dp),
            tint = MaterialTheme.colorScheme.error
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(text = message)
        Spacer(modifier = Modifier.height(16.dp))
        Button(onClick = onRetry) {
            Text("Retry")
        }
    }
}

@Composable
private fun EmptyState() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = Icons.Default.PersonSearch,
            contentDescription = null,
            modifier = Modifier.size(64.dp),
            tint = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = "No users found",
            style = MaterialTheme.typography.titleMedium
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "Try adjusting your filters",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}
