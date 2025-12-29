package za.co.taska.presentation.screens.artisan.bids

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
import za.co.taska.presentation.theme.Primary600

/**
 * Bids management screen for artisans
 * Shows artisan's bids with tab filtering
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BidsScreen(
    onNavigateBack: () -> Unit = {},
    onNavigateToJobDetails: (String) -> Unit = {},
    viewModel: BidsViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    val swipeRefreshState = rememberSwipeRefreshState(isRefreshing = state.isLoading)

    var showWithdrawDialog by remember { mutableStateOf<String?>(null) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "My Bids",
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
                BidTab.values().forEach { tab ->
                    Tab(
                        selected = state.selectedTab == tab,
                        onClick = { viewModel.selectTab(tab) },
                        text = {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Text(tab.displayName)
                                if (tab == BidTab.ALL) {
                                    Text(
                                        text = "(${state.allBids.size})",
                                        style = MaterialTheme.typography.labelSmall
                                    )
                                } else {
                                    val count = state.allBids.count {
                                        when (tab) {
                                            BidTab.PENDING -> it.status.name == "PENDING"
                                            BidTab.ACCEPTED -> it.status.name == "ACCEPTED"
                                            BidTab.REJECTED -> it.status.name == "REJECTED"
                                            BidTab.WITHDRAWN -> it.status.name == "WITHDRAWN"
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

            // Bids List
            SwipeRefresh(
                state = swipeRefreshState,
                onRefresh = { viewModel.loadBids(refresh = true) }
            ) {
                when {
                    state.error != null && !state.isLoading -> {
                        ErrorState(
                            message = state.error!!,
                            onRetry = { viewModel.loadBids(refresh = true) }
                        )
                    }
                    state.filteredBids.isEmpty() && !state.isLoading -> {
                        EmptyBidsState(selectedTab = state.selectedTab)
                    }
                    else -> {
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(16.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(state.filteredBids, key = { it.id }) { bid ->
                                BidCard(
                                    bid = bid,
                                    onClick = {
                                        bid.job?.id?.let { onNavigateToJobDetails(it) }
                                    },
                                    onWithdraw = if (bid.canWithdraw) {
                                        { showWithdrawDialog = bid.id }
                                    } else null
                                )
                            }
                        }
                    }
                }
            }
        }

        // Withdraw Confirmation Dialog
        if (showWithdrawDialog != null) {
            AlertDialog(
                onDismissRequest = { showWithdrawDialog = null },
                icon = { Icon(Icons.Default.Warning, contentDescription = null) },
                title = { Text("Withdraw Bid?") },
                text = { Text("Are you sure you want to withdraw this bid? This action cannot be undone.") },
                confirmButton = {
                    TextButton(
                        onClick = {
                            showWithdrawDialog?.let { viewModel.withdrawBid(it) }
                            showWithdrawDialog = null
                        }
                    ) {
                        Text("Withdraw")
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showWithdrawDialog = null }) {
                        Text("Cancel")
                    }
                }
            )
        }

        // Error Snackbar
        if (state.error != null) {
            LaunchedEffect(state.error) {
                kotlinx.coroutines.delay(3000)
                viewModel.clearError()
            }
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
fun EmptyBidsState(selectedTab: BidTab) {
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
            text = when (selectedTab) {
                BidTab.ALL -> "No bids yet"
                BidTab.PENDING -> "No pending bids"
                BidTab.ACCEPTED -> "No accepted bids"
                BidTab.REJECTED -> "No rejected bids"
                BidTab.WITHDRAWN -> "No withdrawn bids"
            },
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = when (selectedTab) {
                BidTab.ALL -> "Start browsing jobs and submit your first bid!"
                BidTab.PENDING -> "All your pending bids will appear here"
                BidTab.ACCEPTED -> "Accepted bids will show here"
                BidTab.REJECTED -> "Rejected bids will appear here"
                BidTab.WITHDRAWN -> "Withdrawn bids will show here"
            },
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

/**
 * Display name for bid tabs
 */
val BidTab.displayName: String
    get() = when (this) {
        BidTab.ALL -> "All"
        BidTab.PENDING -> "Pending"
        BidTab.ACCEPTED -> "Accepted"
        BidTab.REJECTED -> "Rejected"
        BidTab.WITHDRAWN -> "Withdrawn"
    }
