package za.co.taska.presentation.screens.client.home

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
 * Client Home screen - Dashboard for clients
 * Shows stats, quick actions, and recent jobs
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ClientHomeScreen(
    onNavigateToCreateJob: () -> Unit = {},
    onNavigateToMyJobs: () -> Unit = {},
    onNavigateToBids: () -> Unit = {},
    onNavigateToMessages: () -> Unit = {},
    onNavigateToPayments: () -> Unit = {},
    onNavigateToProfile: () -> Unit = {},
    onNavigateToJobDetails: (String) -> Unit = {},
    viewModel: ClientHomeViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    val swipeRefreshState = rememberSwipeRefreshState(isRefreshing = state.isLoading)

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Taska - Client",
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.Bold
                    )
                },
                actions = {
                    IconButton(onClick = onNavigateToProfile) {
                        Icon(
                            imageVector = Icons.Default.Person,
                            contentDescription = "Profile"
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Primary600,
                    titleContentColor = MaterialTheme.colorScheme.onPrimary,
                    actionIconContentColor = MaterialTheme.colorScheme.onPrimary
                )
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = onNavigateToCreateJob,
                containerColor = Primary600
            ) {
                Icon(
                    imageVector = Icons.Default.Add,
                    contentDescription = "Post Job",
                    tint = MaterialTheme.colorScheme.onPrimary
                )
            }
        }
    ) { paddingValues ->
        SwipeRefresh(
            state = swipeRefreshState,
            onRefresh = { viewModel.loadDashboardData() },
            modifier = Modifier.padding(paddingValues)
        ) {
            when {
                state.error != null && !state.isLoading -> {
                    ErrorState(
                        message = state.error!!,
                        onRetry = { viewModel.loadDashboardData() }
                    )
                }
                else -> {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        // Welcome Card
                        item {
                            WelcomeCard()
                        }

                        // Dashboard Stats
                        item {
                            DashboardStatsRow(stats = state.stats)
                        }

                        // Quick Actions
                        item {
                            Text(
                                text = "Quick Actions",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        item {
                            QuickActionsGrid(
                                onNavigateToCreateJob = onNavigateToCreateJob,
                                onNavigateToMyJobs = onNavigateToMyJobs
                            )
                        }

                        // Recent Jobs Section
                        if (state.recentJobs.isNotEmpty()) {
                            item {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = "Recent Jobs",
                                        style = MaterialTheme.typography.titleLarge,
                                        fontWeight = FontWeight.Bold
                                    )
                                    TextButton(onClick = onNavigateToMyJobs) {
                                        Text("See All")
                                    }
                                }
                            }

                            items(state.recentJobs, key = { it.id }) { job ->
                                MyJobCard(
                                    job = job,
                                    bidCount = state.bidCounts[job.id] ?: 0,
                                    onClick = { onNavigateToJobDetails(job.id) }
                                )
                            }
                        }

                        // Empty state for new users
                        if (state.recentJobs.isEmpty() && !state.isLoading) {
                            item {
                                NewUserEmptyState(onNavigateToCreateJob = onNavigateToCreateJob)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun WelcomeCard() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.primaryContainer
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = "Welcome back!",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Post jobs and find skilled artisans",
                style = MaterialTheme.typography.bodyLarge
            )
        }
    }
}

@Composable
private fun DashboardStatsRow(stats: DashboardStats) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        StatCard(
            icon = Icons.Default.Work,
            title = "Active Jobs",
            value = stats.activeJobsCount.toString(),
            modifier = Modifier.weight(1f)
        )

        StatCard(
            icon = Icons.Default.Assignment,
            title = "Total Bids",
            value = stats.totalBidsReceived.toString(),
            modifier = Modifier.weight(1f)
        )

        StatCard(
            icon = Icons.Default.CheckCircle,
            title = "All Jobs",
            value = stats.totalJobsCount.toString(),
            modifier = Modifier.weight(1f),
            tint = MaterialTheme.colorScheme.primary
        )
    }
}

@Composable
private fun StatCard(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    value: String,
    modifier: Modifier = Modifier,
    tint: androidx.compose.ui.graphics.Color = MaterialTheme.colorScheme.onSurfaceVariant
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                modifier = Modifier.size(32.dp),
                tint = tint
            )
            Text(
                text = value,
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = title,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun QuickActionsGrid(
    onNavigateToCreateJob: () -> Unit,
    onNavigateToMyJobs: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        QuickActionCard(
            icon = Icons.Default.Add,
            title = "Post Job",
            onClick = onNavigateToCreateJob,
            modifier = Modifier.weight(1f)
        )

        QuickActionCard(
            icon = Icons.Default.Work,
            title = "My Jobs",
            onClick = onNavigateToMyJobs,
            modifier = Modifier.weight(1f)
        )
    }
}

@Composable
private fun QuickActionCard(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        onClick = onClick,
        modifier = modifier
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = title,
                modifier = Modifier.size(48.dp),
                tint = Primary600
            )
            Text(
                text = title,
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.Bold
            )
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
private fun NewUserEmptyState(onNavigateToCreateJob: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Icon(
                imageVector = Icons.Default.Work,
                contentDescription = null,
                modifier = Modifier.size(64.dp),
                tint = MaterialTheme.colorScheme.primary
            )
            Text(
                text = "Ready to Get Started?",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "Post your first job and connect with skilled artisans!",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Button(onClick = onNavigateToCreateJob) {
                Icon(Icons.Default.Add, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Post a Job")
            }
        }
    }
}
