package za.co.taska.presentation.screens.client.jobs

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.google.accompanist.swiperefresh.SwipeRefresh
import com.google.accompanist.swiperefresh.rememberSwipeRefreshState
import za.co.taska.presentation.components.MyJobCard
import za.co.taska.presentation.theme.Primary600

/**
 * My Jobs screen - Displays client's posted jobs with status filtering
 * Shows job cards with bid counts and allows filtering by status
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MyJobsScreen(
    onNavigateBack: () -> Unit = {},
    onNavigateToJobDetails: (String) -> Unit = {},
    viewModel: MyJobsViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    val swipeRefreshState = rememberSwipeRefreshState(isRefreshing = state.isLoading)

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "My Jobs",
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
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Primary600,
                    titleContentColor = MaterialTheme.colorScheme.onPrimary,
                    navigationIconContentColor = MaterialTheme.colorScheme.onPrimary
                )
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Tab Row
            TabRow(
                selectedTabIndex = state.selectedTab.ordinal,
                containerColor = MaterialTheme.colorScheme.surface
            ) {
                JobTab.values().forEach { tab ->
                    Tab(
                        selected = state.selectedTab == tab,
                        onClick = { viewModel.selectTab(tab) },
                        text = {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Text(tab.displayName)
                                if (tab == JobTab.ALL) {
                                    Text(
                                        text = "(${state.allJobs.size})",
                                        style = MaterialTheme.typography.labelSmall
                                    )
                                } else {
                                    val count = state.allJobs.count {
                                        when (tab) {
                                            JobTab.OPEN -> it.status.name == "OPEN"
                                            JobTab.IN_PROGRESS -> it.status.name == "IN_PROGRESS"
                                            JobTab.COMPLETED -> it.status.name == "COMPLETED"
                                            JobTab.CANCELLED -> it.status.name == "CANCELLED"
                                            else -> false
                                        }
                                    }
                                    if (count > 0) {
                                        Text(
                                            text = "($count)",
                                            style = MaterialTheme.typography.labelSmall
                                        )
                                    }
                                }
                            }
                        }
                    )
                }
            }

            // Jobs List
            SwipeRefresh(
                state = swipeRefreshState,
                onRefresh = { viewModel.loadJobs(refresh = true) }
            ) {
                when {
                    state.error != null && !state.isLoading -> {
                        ErrorState(
                            message = state.error!!,
                            onRetry = { viewModel.loadJobs(refresh = true) }
                        )
                    }
                    state.filteredJobs.isEmpty() && !state.isLoading -> {
                        EmptyJobsState(selectedTab = state.selectedTab)
                    }
                    else -> {
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(16.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(state.filteredJobs, key = { it.id }) { job ->
                                MyJobCard(
                                    job = job,
                                    bidCount = state.bidCounts[job.id] ?: 0,
                                    onClick = { onNavigateToJobDetails(job.id) }
                                )
                            }
                        }
                    }
                }
            }
        }
    }
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

@Composable
private fun EmptyJobsState(selectedTab: JobTab) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = Icons.Default.Work,
            contentDescription = null,
            modifier = Modifier.size(64.dp),
            tint = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = when (selectedTab) {
                JobTab.ALL -> "No jobs posted yet"
                JobTab.OPEN -> "No open jobs"
                JobTab.IN_PROGRESS -> "No jobs in progress"
                JobTab.COMPLETED -> "No completed jobs"
                JobTab.CANCELLED -> "No cancelled jobs"
            },
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = when (selectedTab) {
                JobTab.ALL -> "Post your first job to get started!"
                JobTab.OPEN -> "Open jobs will appear here"
                JobTab.IN_PROGRESS -> "Jobs in progress will show here"
                JobTab.COMPLETED -> "Completed jobs will appear here"
                JobTab.CANCELLED -> "Cancelled jobs will show here"
            },
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

/**
 * Display name for job tabs
 */
val JobTab.displayName: String
    get() = when (this) {
        JobTab.ALL -> "All"
        JobTab.OPEN -> "Open"
        JobTab.IN_PROGRESS -> "Active"
        JobTab.COMPLETED -> "Completed"
        JobTab.CANCELLED -> "Cancelled"
    }
