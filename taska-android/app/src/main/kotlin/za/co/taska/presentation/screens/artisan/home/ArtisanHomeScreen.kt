package za.co.taska.presentation.screens.artisan.home

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
import za.co.taska.presentation.components.BidCard
import za.co.taska.presentation.components.JobCard
import za.co.taska.presentation.theme.Primary600

/**
 * Artisan home screen - main dashboard for artisans
 * Shows dashboard stats, nearby jobs, and recent bids
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ArtisanHomeScreen(
    onNavigateToJobs: () -> Unit = {},
    onNavigateToBids: () -> Unit = {},
    onNavigateToProfile: () -> Unit = {},
    onNavigateToJobDetails: (String) -> Unit = {},
    viewModel: ArtisanHomeViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    val swipeRefreshState = rememberSwipeRefreshState(isRefreshing = state.isLoading)

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Taska - Artisan",
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
                            QuickActionsRow(
                                onNavigateToJobs = onNavigateToJobs,
                                onNavigateToBids = onNavigateToBids,
                                onNavigateToProfile = onNavigateToProfile
                            )
                        }

                        // Nearby Jobs Section
                        if (state.nearbyJobs.isNotEmpty()) {
                            item {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = "Nearby Jobs (${state.stats.nearbyJobsCount})",
                                        style = MaterialTheme.typography.titleLarge,
                                        fontWeight = FontWeight.Bold
                                    )
                                    TextButton(onClick = onNavigateToJobs) {
                                        Text("See All")
                                    }
                                }
                            }

                            items(state.nearbyJobs, key = { it.id }) { job ->
                                JobCard(
                                    job = job,
                                    onClick = { onNavigateToJobDetails(job.id) }
                                )
                            }
                        }

                        // Recent Bids Section
                        if (state.recentBids.isNotEmpty()) {
                            item {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = "Recent Bids",
                                        style = MaterialTheme.typography.titleLarge,
                                        fontWeight = FontWeight.Bold
                                    )
                                    TextButton(onClick = onNavigateToBids) {
                                        Text("See All")
                                    }
                                }
                            }

                            items(state.recentBids, key = { it.id }) { bid ->
                                BidCard(
                                    bid = bid,
                                    onClick = {
                                        bid.job?.id?.let { onNavigateToJobDetails(it) }
                                    }
                                )
                            }
                        }

                        // Empty state for new users
                        if (state.nearbyJobs.isEmpty() && state.recentBids.isEmpty() && !state.isLoading) {
                            item {
                                NewUserEmptyState(onNavigateToJobs = onNavigateToJobs)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun WelcomeCard() {
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
                text = "Find new jobs and manage your bids",
                style = MaterialTheme.typography.bodyLarge
            )
        }
    }
}

@Composable
fun DashboardStatsRow(stats: DashboardStats) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        StatCard(
            icon = Icons.Default.Work,
            title = "Nearby Jobs",
            value = stats.nearbyJobsCount.toString(),
            modifier = Modifier.weight(1f)
        )

        StatCard(
            icon = Icons.Default.Assignment,
            title = "My Bids",
            value = stats.totalBids.toString(),
            modifier = Modifier.weight(1f)
        )

        StatCard(
            icon = Icons.Default.CheckCircle,
            title = "Accepted",
            value = stats.acceptedBidsCount.toString(),
            modifier = Modifier.weight(1f),
            tint = MaterialTheme.colorScheme.primary
        )
    }
}

@Composable
fun StatCard(
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
fun QuickActionsRow(
    onNavigateToJobs: () -> Unit,
    onNavigateToBids: () -> Unit,
    onNavigateToProfile: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        QuickActionCard(
            icon = Icons.Default.Work,
            title = "Browse Jobs",
            onClick = onNavigateToJobs,
            modifier = Modifier.weight(1f)
        )

        QuickActionCard(
            icon = Icons.Default.Assignment,
            title = "My Bids",
            onClick = onNavigateToBids,
            modifier = Modifier.weight(1f)
        )
    }
}

@Composable
fun QuickActionCard(
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

@Composable
fun NewUserEmptyState(onNavigateToJobs: () -> Unit) {
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
                text = "Ready to Start Earning?",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "Browse available jobs in your area and start bidding!",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Button(onClick = onNavigateToJobs) {
                Icon(Icons.Default.Work, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Browse Jobs")
            }
        }
    }
}
