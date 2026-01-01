package za.co.taska.presentation.screens.client.bids

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
import za.co.taska.presentation.components.ReceivedBidCard
import za.co.taska.presentation.theme.Primary600

/**
 * View Bids screen - Displays all bids for a job with sorting
 * Allows client to review all bids and navigate to bid details
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ViewBidsScreen(
    jobId: String,
    onNavigateBack: () -> Unit = {},
    onNavigateToBidDetail: (String) -> Unit = {},
    viewModel: ViewBidsViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    val swipeRefreshState = rememberSwipeRefreshState(isRefreshing = state.isLoading)
    var showSortMenu by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "All Bids",
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "${state.allBids.size} ${if (state.allBids.size == 1) "bid" else "bids"}",
                            style = MaterialTheme.typography.labelMedium
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
                    IconButton(onClick = { showSortMenu = true }) {
                        Icon(
                            imageVector = Icons.Default.Sort,
                            contentDescription = "Sort"
                        )
                    }

                    DropdownMenu(
                        expanded = showSortMenu,
                        onDismissRequest = { showSortMenu = false }
                    ) {
                        DropdownMenuItem(
                            text = { Text("Lowest Amount") },
                            onClick = {
                                viewModel.setSortBy(BidSortBy.AMOUNT_LOW)
                                showSortMenu = false
                            },
                            leadingIcon = {
                                Icon(Icons.Default.AttachMoney, contentDescription = null)
                            }
                        )
                        DropdownMenuItem(
                            text = { Text("Highest Amount") },
                            onClick = {
                                viewModel.setSortBy(BidSortBy.AMOUNT_HIGH)
                                showSortMenu = false
                            },
                            leadingIcon = {
                                Icon(Icons.Default.AttachMoney, contentDescription = null)
                            }
                        )
                        DropdownMenuItem(
                            text = { Text("Most Recent") },
                            onClick = {
                                viewModel.setSortBy(BidSortBy.RECENT)
                                showSortMenu = false
                            },
                            leadingIcon = {
                                Icon(Icons.Default.CalendarToday, contentDescription = null)
                            }
                        )
                        DropdownMenuItem(
                            text = { Text("Shortest Duration") },
                            onClick = {
                                viewModel.setSortBy(BidSortBy.DAYS_LOW)
                                showSortMenu = false
                            },
                            leadingIcon = {
                                Icon(Icons.Default.Schedule, contentDescription = null)
                            }
                        )
                        DropdownMenuItem(
                            text = { Text("Longest Duration") },
                            onClick = {
                                viewModel.setSortBy(BidSortBy.DAYS_HIGH)
                                showSortMenu = false
                            },
                            leadingIcon = {
                                Icon(Icons.Default.Schedule, contentDescription = null)
                            }
                        )
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
            onRefresh = { viewModel.loadBids(refresh = true) },
            modifier = Modifier.padding(paddingValues)
        ) {
            when {
                state.error != null && !state.isLoading -> {
                    ErrorState(
                        message = state.error!!,
                        onRetry = { viewModel.loadBids(refresh = true) }
                    )
                }
                state.sortedBids.isEmpty() && !state.isLoading -> {
                    EmptyState()
                }
                else -> {
                    Column(
                        modifier = Modifier.fillMaxSize()
                    ) {
                        // Sort indicator
                        Surface(
                            tonalElevation = 1.dp
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 16.dp, vertical = 8.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Sort,
                                    contentDescription = null,
                                    modifier = Modifier.size(16.dp),
                                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Text(
                                    text = "Sorted by: ${state.sortBy.displayName}",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }

                        // Bids list
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(16.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(state.sortedBids, key = { it.id }) { bid ->
                                ReceivedBidCard(
                                    bid = bid,
                                    artisanName = "Artisan", // TODO: Get from bid.artisan
                                    artisanRating = null,
                                    onClick = { onNavigateToBidDetail(bid.id) }
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
            style = MaterialTheme.typography.bodyLarge
        )
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
            imageVector = Icons.Default.Assignment,
            contentDescription = null,
            modifier = Modifier.size(64.dp),
            tint = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = "No bids yet",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "Artisans will submit bids soon",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

/**
 * Display name for sort options
 */
val BidSortBy.displayName: String
    get() = when (this) {
        BidSortBy.AMOUNT_LOW -> "Lowest Amount"
        BidSortBy.AMOUNT_HIGH -> "Highest Amount"
        BidSortBy.RECENT -> "Most Recent"
        BidSortBy.DAYS_LOW -> "Shortest Duration"
        BidSortBy.DAYS_HIGH -> "Longest Duration"
    }
