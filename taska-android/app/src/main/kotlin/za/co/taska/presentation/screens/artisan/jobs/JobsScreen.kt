package za.co.taska.presentation.screens.artisan.jobs

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
import za.co.taska.domain.model.UrgencyLevel
import za.co.taska.presentation.components.JobCard
import za.co.taska.presentation.theme.Primary600
import com.google.accompanist.swiperefresh.SwipeRefresh
import com.google.accompanist.swiperefresh.rememberSwipeRefreshState

/**
 * Jobs browse screen for artisans
 * Shows available jobs with advanced filtering
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun JobsScreen(
    onNavigateBack: () -> Unit = {},
    onNavigateToJobDetails: (String) -> Unit = {},
    viewModel: JobsViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    val swipeRefreshState = rememberSwipeRefreshState(isRefreshing = state.isLoading)

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Browse Jobs",
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
                    // Filter button with active indicator
                    IconButton(onClick = { viewModel.toggleFilterSheet() }) {
                        BadgedBox(
                            badge = {
                                if (state.filters.hasActiveFilters()) {
                                    Badge { Text("•") }
                                }
                            }
                        ) {
                            Icon(
                                imageVector = Icons.Default.FilterList,
                                contentDescription = "Filter Jobs"
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
            onRefresh = { viewModel.loadJobs(refresh = true) },
            modifier = Modifier.padding(paddingValues)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 16.dp)
            ) {
                // Search Bar
                OutlinedTextField(
                    value = state.searchQuery,
                    onValueChange = { viewModel.updateSearchQuery(it) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 12.dp),
                    placeholder = { Text("Search jobs...") },
                    leadingIcon = {
                        Icon(Icons.Default.Search, contentDescription = null)
                    },
                    trailingIcon = {
                        if (state.searchQuery.isNotEmpty()) {
                            IconButton(onClick = { viewModel.updateSearchQuery("") }) {
                                Icon(Icons.Default.Clear, contentDescription = "Clear")
                            }
                        }
                    },
                    singleLine = true
                )

                // Results count
                if (state.filteredJobs.isNotEmpty()) {
                    Text(
                        text = "${state.filteredJobs.size} jobs available",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                }

                // Jobs List
                when {
                    state.error != null -> {
                        ErrorState(
                            message = state.error ?: "",
                            onRetry = { viewModel.loadJobs(refresh = true) }
                        )
                    }
                    state.filteredJobs.isEmpty() && !state.isLoading -> {
                        EmptyState(
                            hasFilters = state.filters.hasActiveFilters(),
                            onClearFilters = { viewModel.updateFilters(JobFilters()) }
                        )
                    }
                    else -> {
                        LazyColumn(
                            verticalArrangement = Arrangement.spacedBy(12.dp),
                            contentPadding = PaddingValues(bottom = 16.dp)
                        ) {
                            items(state.filteredJobs, key = { it.id }) { job ->
                                JobCard(
                                    job = job,
                                    onClick = { onNavigateToJobDetails(job.id) }
                                )
                            }
                        }
                    }
                }
            }
        }

        // Filter Bottom Sheet
        if (state.showFilterSheet) {
            FilterBottomSheet(
                filters = state.filters,
                onApplyFilters = { viewModel.updateFilters(it) },
                onDismiss = { viewModel.toggleFilterSheet() }
            )
        }
    }
}

/**
 * Error state with retry option
 */
@Composable
fun ErrorState(
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
        Text(
            text = message,
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.height(16.dp))
        Button(onClick = onRetry) {
            Text("Retry")
        }
    }
}

/**
 * Empty state with helpful message
 */
@Composable
fun EmptyState(
    hasFilters: Boolean,
    onClearFilters: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = Icons.Default.WorkOff,
            contentDescription = null,
            modifier = Modifier.size(64.dp),
            tint = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = if (hasFilters) "No jobs match your filters" else "No jobs available",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = if (hasFilters) "Try adjusting your search criteria" else "Check back later for new opportunities",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        if (hasFilters) {
            Spacer(modifier = Modifier.height(16.dp))
            OutlinedButton(onClick = onClearFilters) {
                Text("Clear Filters")
            }
        }
    }
}

/**
 * Filter bottom sheet
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FilterBottomSheet(
    filters: JobFilters,
    onApplyFilters: (JobFilters) -> Unit,
    onDismiss: () -> Unit
) {
    var tempFilters by remember { mutableStateOf(filters) }

    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Filter Jobs",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
                TextButton(onClick = { tempFilters = JobFilters() }) {
                    Text("Reset")
                }
            }

            Divider()

            // Distance Filter
            Column {
                Text(
                    text = "Maximum Distance",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    listOf(5.0, 10.0, 25.0, 50.0, 100.0).forEach { distance ->
                        FilterChip(
                            selected = tempFilters.maxDistance == distance,
                            onClick = {
                                tempFilters = tempFilters.copy(
                                    maxDistance = if (tempFilters.maxDistance == distance) null else distance
                                )
                            },
                            label = { Text("${distance.toInt()} km") }
                        )
                    }
                }
            }

            Divider()

            // Urgency Filter
            Column {
                Text(
                    text = "Urgency Level",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(8.dp))
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    UrgencyLevel.values().forEach { urgency ->
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Checkbox(
                                checked = tempFilters.urgencyLevels.contains(urgency),
                                onCheckedChange = { checked ->
                                    tempFilters = tempFilters.copy(
                                        urgencyLevels = if (checked) {
                                            tempFilters.urgencyLevels + urgency
                                        } else {
                                            tempFilters.urgencyLevels - urgency
                                        }
                                    )
                                }
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(text = urgency.name.replace("_", " "))
                        }
                    }
                }
            }

            Divider()

            // Verified Clients Only
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Verified Clients Only",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Show only jobs from clients with good ratings",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Switch(
                    checked = tempFilters.verifiedClientsOnly,
                    onCheckedChange = { tempFilters = tempFilters.copy(verifiedClientsOnly = it) }
                )
            }

            Divider()

            // Sort By
            Column {
                Text(
                    text = "Sort By",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(8.dp))
                JobSortOption.values().forEach { sortOption ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        RadioButton(
                            selected = tempFilters.sortBy == sortOption,
                            onClick = { tempFilters = tempFilters.copy(sortBy = sortOption) }
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(text = sortOption.displayName)
                    }
                }
            }

            // Apply Button
            Button(
                onClick = { onApplyFilters(tempFilters) },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Apply Filters")
            }

            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

/**
 * Extension to check if filters are active
 */
fun JobFilters.hasActiveFilters(): Boolean {
    return selectedCategories.isNotEmpty() ||
            maxDistance != null ||
            budgetRange != null ||
            urgencyLevels.isNotEmpty() ||
            verifiedClientsOnly ||
            sortBy != JobSortOption.DISTANCE
}

/**
 * Display names for sort options
 */
val JobSortOption.displayName: String
    get() = when (this) {
        JobSortOption.DISTANCE -> "Distance (Nearest First)"
        JobSortOption.BUDGET_HIGH -> "Budget (Highest First)"
        JobSortOption.BUDGET_LOW -> "Budget (Lowest First)"
        JobSortOption.RECENT -> "Most Recent"
        JobSortOption.URGENCY -> "Most Urgent"
    }
