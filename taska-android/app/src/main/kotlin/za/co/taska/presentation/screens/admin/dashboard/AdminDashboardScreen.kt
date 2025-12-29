package za.co.taska.presentation.screens.admin.dashboard

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.google.accompanist.swiperefresh.SwipeRefresh
import com.google.accompanist.swiperefresh.rememberSwipeRefreshState
import za.co.taska.presentation.components.CompactMetricCard
import za.co.taska.presentation.components.MetricCard
import za.co.taska.presentation.theme.Primary600

/**
 * Admin Dashboard - Platform overview with metrics
 * Shows key statistics and quick access to admin functions
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminDashboardScreen(
    onNavigateToUsers: () -> Unit = {},
    onNavigateToModeration: () -> Unit = {},
    onNavigateToAnalytics: () -> Unit = {},
    onNavigateToSettings: () -> Unit = {},
    viewModel: AdminDashboardViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    val swipeRefreshState = rememberSwipeRefreshState(isRefreshing = state.isLoading)

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Admin Dashboard",
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.Bold
                    )
                },
                actions = {
                    IconButton(onClick = onNavigateToSettings) {
                        Icon(
                            imageVector = Icons.Default.Settings,
                            contentDescription = "Settings"
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
            onRefresh = { viewModel.loadDashboardMetrics() },
            modifier = Modifier.padding(paddingValues)
        ) {
            when {
                state.error != null && !state.isLoading -> {
                    ErrorState(
                        message = state.error!!,
                        onRetry = { viewModel.loadDashboardMetrics() }
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
                                onNavigateToUsers = onNavigateToUsers,
                                onNavigateToModeration = onNavigateToModeration,
                                onNavigateToAnalytics = onNavigateToAnalytics
                            )
                        }

                        // User Metrics
                        item {
                            Text(
                                text = "User Metrics",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        item {
                            UserMetricsGrid(metrics = state.metrics)
                        }

                        // Platform Activity
                        item {
                            Text(
                                text = "Platform Activity",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        item {
                            PlatformActivityGrid(metrics = state.metrics)
                        }

                        // Financial Overview
                        item {
                            Text(
                                text = "Financial Overview",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        item {
                            FinancialMetricsGrid(metrics = state.metrics)
                        }

                        // Moderation Queue
                        if (state.metrics.contentModerationQueue > 0 || state.metrics.pendingDisputes > 0) {
                            item {
                                Text(
                                    text = "Requires Attention",
                                    style = MaterialTheme.typography.titleLarge,
                                    fontWeight = FontWeight.Bold
                                )
                            }

                            item {
                                AttentionRequiredSection(
                                    metrics = state.metrics,
                                    onNavigateToModeration = onNavigateToModeration
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
                text = "Platform Management",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Monitor platform health and manage operations",
                style = MaterialTheme.typography.bodyLarge
            )
        }
    }
}

@Composable
private fun QuickActionsGrid(
    onNavigateToUsers: () -> Unit,
    onNavigateToModeration: () -> Unit,
    onNavigateToAnalytics: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        QuickActionCard(
            icon = Icons.Default.People,
            title = "Users",
            onClick = onNavigateToUsers,
            modifier = Modifier.weight(1f)
        )
        QuickActionCard(
            icon = Icons.Default.Security,
            title = "Moderation",
            onClick = onNavigateToModeration,
            modifier = Modifier.weight(1f)
        )
        QuickActionCard(
            icon = Icons.Default.Analytics,
            title = "Analytics",
            onClick = onNavigateToAnalytics,
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
                modifier = Modifier.size(32.dp),
                tint = Primary600
            )
            Text(
                text = title,
                style = MaterialTheme.typography.labelLarge,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
private fun UserMetricsGrid(metrics: za.co.taska.domain.model.DashboardMetrics) {
    Column(
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            MetricCard(
                icon = Icons.Default.People,
                label = "Total Users",
                value = metrics.totalUsers.toString(),
                subtitle = "${metrics.activeUsers} active",
                modifier = Modifier.weight(1f),
                iconTint = Primary600
            )
            MetricCard(
                icon = Icons.Default.Person,
                label = "Clients",
                value = metrics.totalClients.toString(),
                modifier = Modifier.weight(1f),
                iconTint = Color(0xFF2196F3)
            )
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            MetricCard(
                icon = Icons.Default.Build,
                label = "Artisans",
                value = metrics.totalArtisans.toString(),
                subtitle = "${metrics.verifiedArtisans} verified",
                modifier = Modifier.weight(1f),
                iconTint = Color(0xFFFF9800)
            )
            MetricCard(
                icon = Icons.Default.HourglassEmpty,
                label = "Pending Verification",
                value = metrics.pendingVerifications.toString(),
                modifier = Modifier.weight(1f),
                iconTint = if (metrics.pendingVerifications > 0) Color(0xFFFFC107) else MaterialTheme.colorScheme.outline
            )
        }
    }
}

@Composable
private fun PlatformActivityGrid(metrics: za.co.taska.domain.model.DashboardMetrics) {
    Column(
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        CompactMetricCard(
            icon = Icons.Default.Work,
            label = "Total Jobs",
            value = "${metrics.totalJobs} (${metrics.activeJobs} active)",
            iconTint = Primary600
        )
        CompactMetricCard(
            icon = Icons.Default.CheckCircle,
            label = "Completed Jobs",
            value = metrics.completedJobs.toString(),
            iconTint = Color(0xFF4CAF50)
        )
        CompactMetricCard(
            icon = Icons.Default.Assignment,
            label = "Total Bids",
            value = "${metrics.totalBids} (${metrics.activeBids} active)",
            iconTint = Color(0xFF2196F3)
        )
    }
}

@Composable
private fun FinancialMetricsGrid(metrics: za.co.taska.domain.model.DashboardMetrics) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        MetricCard(
            icon = Icons.Default.AttachMoney,
            label = "Total Revenue",
            value = "R%.2f".format(metrics.totalRevenue),
            modifier = Modifier.weight(1f),
            iconTint = Color(0xFF4CAF50)
        )
        MetricCard(
            icon = Icons.Default.TrendingUp,
            label = "Monthly Revenue",
            value = "R%.2f".format(metrics.monthlyRevenue),
            modifier = Modifier.weight(1f),
            iconTint = Color(0xFF2196F3)
        )
    }
}

@Composable
private fun AttentionRequiredSection(
    metrics: za.co.taska.domain.model.DashboardMetrics,
    onNavigateToModeration: () -> Unit
) {
    Column(
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        if (metrics.contentModerationQueue > 0) {
            Card(
                onClick = onNavigateToModeration,
                colors = CardDefaults.cardColors(
                    containerColor = Color(0xFFFFC107).copy(alpha = 0.1f)
                )
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Warning,
                        contentDescription = null,
                        modifier = Modifier.size(32.dp),
                        tint = Color(0xFFFFC107)
                    )
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Content Moderation Queue",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "${metrics.contentModerationQueue} items pending review",
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }
                    Icon(
                        imageVector = Icons.Default.ChevronRight,
                        contentDescription = null
                    )
                }
            }
        }

        if (metrics.pendingDisputes > 0) {
            Card(
                onClick = onNavigateToModeration,
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.errorContainer
                )
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Error,
                        contentDescription = null,
                        modifier = Modifier.size(32.dp),
                        tint = MaterialTheme.colorScheme.error
                    )
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Pending Disputes",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "${metrics.pendingDisputes} disputes require resolution",
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }
                    Icon(
                        imageVector = Icons.Default.ChevronRight,
                        contentDescription = null
                    )
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
