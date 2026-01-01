package za.co.taska.presentation.screens.artisan.credits

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.google.accompanist.swiperefresh.SwipeRefresh
import com.google.accompanist.swiperefresh.rememberSwipeRefreshState
import za.co.taska.domain.model.*
import za.co.taska.presentation.theme.*

/**
 * Credits management screen for artisans
 * Shows credit balance, bundles for purchase, transactions, voucher redemption, and auto top-up
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreditsScreen(
    onNavigateBack: () -> Unit = {},
    viewModel: CreditsViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    val swipeRefreshState = rememberSwipeRefreshState(isRefreshing = state.isLoading)

    val snackbarHostState = remember { SnackbarHostState() }

    // Show success messages
    LaunchedEffect(state.showPurchaseSuccess) {
        if (state.showPurchaseSuccess) {
            snackbarHostState.showSnackbar("Purchase successful! Credits added to your wallet.")
            viewModel.dismissSuccess()
        }
    }

    LaunchedEffect(state.settingsSaved) {
        if (state.settingsSaved) {
            snackbarHostState.showSnackbar("Settings saved successfully!")
            viewModel.dismissSuccess()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Credits",
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
                    titleContentColor = White,
                    navigationIconContentColor = White
                )
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Credit Balance Card (always visible)
            CreditBalanceCard(
                balance = state.balance,
                isLowBalance = state.isLowBalance,
                hasAutoTopUp = state.hasAutoTopUp,
                modifier = Modifier.padding(16.dp)
            )

            // Tab Row
            ScrollableTabRow(
                selectedTabIndex = state.selectedTab.ordinal,
                containerColor = MaterialTheme.colorScheme.surface,
                edgePadding = 16.dp
            ) {
                CreditTab.values().forEach { tab ->
                    Tab(
                        selected = state.selectedTab == tab,
                        onClick = { viewModel.selectTab(tab) },
                        text = { Text(tab.displayName) }
                    )
                }
            }

            // Content based on selected tab
            SwipeRefresh(
                state = swipeRefreshState,
                onRefresh = { viewModel.loadInitialData() }
            ) {
                when (state.selectedTab) {
                    CreditTab.OVERVIEW -> OverviewContent(
                        wallet = state.wallet,
                        actionCosts = state.actionCosts,
                        recentTransactions = state.transactions.take(5)
                    )
                    CreditTab.BUY -> BuyCreditsContent(
                        bundles = state.bundles,
                        isPurchasing = state.isPurchasing,
                        purchaseError = state.purchaseError,
                        onPurchase = viewModel::purchaseBundle
                    )
                    CreditTab.HISTORY -> TransactionHistoryContent(
                        transactions = state.transactions,
                        isLoading = state.isLoading,
                        isLoadingMore = state.isLoadingMore,
                        selectedType = state.selectedTransactionType,
                        onFilterChange = viewModel::filterTransactions,
                        onLoadMore = viewModel::loadMoreTransactions,
                        hasMore = state.transactionPage < state.totalTransactionPages
                    )
                    CreditTab.VOUCHER -> VoucherContent(
                        voucherCode = state.voucherCode,
                        isRedeeming = state.isRedeemingVoucher,
                        error = state.voucherError,
                        success = state.voucherSuccess,
                        onCodeChange = viewModel::updateVoucherCode,
                        onRedeem = { viewModel.redeemVoucher(state.voucherCode) }
                    )
                    CreditTab.SETTINGS -> AutoTopUpContent(
                        wallet = state.wallet,
                        isSaving = state.isSavingSettings,
                        onSave = viewModel::updateAutoTopUp
                    )
                }
            }
        }

        // Error dialog
        if (state.error != null) {
            AlertDialog(
                onDismissRequest = { viewModel.clearError() },
                icon = { Icon(Icons.Default.Error, contentDescription = null) },
                title = { Text("Error") },
                text = { Text(state.error!!) },
                confirmButton = {
                    TextButton(onClick = { viewModel.clearError() }) {
                        Text("OK")
                    }
                }
            )
        }
    }
}

@Composable
fun CreditBalanceCard(
    balance: Int,
    isLowBalance: Boolean,
    hasAutoTopUp: Boolean,
    modifier: Modifier = Modifier
) {
    val gradientColors = if (isLowBalance) {
        listOf(Accent600, Accent900)
    } else {
        listOf(Primary600, Primary500)
    }

    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Brush.horizontalGradient(gradientColors))
                .padding(24.dp)
        ) {
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Credit Balance",
                        style = MaterialTheme.typography.titleMedium,
                        color = White.copy(alpha = 0.8f)
                    )
                    if (hasAutoTopUp) {
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = White.copy(alpha = 0.2f)
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Autorenew,
                                    contentDescription = null,
                                    tint = White,
                                    modifier = Modifier.size(14.dp)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = "Auto Top-Up",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = White
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = "$balance",
                    style = MaterialTheme.typography.displayMedium,
                    fontWeight = FontWeight.Bold,
                    color = White
                )

                Text(
                    text = "credits available",
                    style = MaterialTheme.typography.bodyMedium,
                    color = White.copy(alpha = 0.8f)
                )

                if (isLowBalance) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Warning,
                            contentDescription = null,
                            tint = White,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "Low balance - consider topping up",
                            style = MaterialTheme.typography.labelMedium,
                            color = White
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun OverviewContent(
    wallet: CreditWallet?,
    actionCosts: Map<CreditAction, Int>,
    recentTransactions: List<CreditTransaction>
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Credit Usage Info
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Cream50)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Credit Costs",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    CostItem(icon = Icons.Default.Send, label = "Place a Bid", cost = actionCosts[CreditAction.BID] ?: 5)
                    CostItem(icon = Icons.Default.Bolt, label = "Standard Boost", cost = actionCosts[CreditAction.BOOST] ?: 20)
                    CostItem(icon = Icons.Default.Star, label = "Super Boost", cost = actionCosts[CreditAction.SUPER_BOOST] ?: 50)
                }
            }
        }

        // Lifetime Stats
        if (wallet != null) {
            item {
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "Lifetime Stats",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(12.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceEvenly
                        ) {
                            StatItem(
                                value = wallet.lifetimeCredits.toString(),
                                label = "Purchased"
                            )
                            StatItem(
                                value = wallet.lifetimeSpent.toString(),
                                label = "Spent"
                            )
                            StatItem(
                                value = wallet.balance.toString(),
                                label = "Current"
                            )
                        }
                    }
                }
            }
        }

        // Recent Transactions
        if (recentTransactions.isNotEmpty()) {
            item {
                Text(
                    text = "Recent Activity",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            }

            items(recentTransactions) { transaction ->
                TransactionItem(transaction = transaction)
            }
        }
    }
}

@Composable
fun CostItem(
    icon: ImageVector,
    label: String,
    cost: Int
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = Primary600,
                modifier = Modifier.size(20.dp)
            )
            Spacer(modifier = Modifier.width(12.dp))
            Text(text = label, style = MaterialTheme.typography.bodyMedium)
        }
        Text(
            text = "$cost credits",
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.SemiBold,
            color = Primary600
        )
    }
}

@Composable
fun StatItem(
    value: String,
    label: String
) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = value,
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold,
            color = Primary600
        )
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = Gray500
        )
    }
}

@Composable
fun BuyCreditsContent(
    bundles: List<CreditBundle>,
    isPurchasing: Boolean,
    purchaseError: String?,
    onPurchase: (CreditBundle) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text(
                text = "Choose a Credit Bundle",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "Credits are used to place bids and boost your profile",
                style = MaterialTheme.typography.bodyMedium,
                color = Gray500
            )
        }

        items(bundles) { bundle ->
            CreditBundleCard(
                bundle = bundle,
                isPurchasing = isPurchasing,
                onPurchase = { onPurchase(bundle) }
            )
        }

        if (purchaseError != null) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = ErrorLight)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Error,
                            contentDescription = null,
                            tint = Error
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(text = purchaseError, color = Error)
                    }
                }
            }
        }
    }
}

@Composable
fun CreditBundleCard(
    bundle: CreditBundle,
    isPurchasing: Boolean,
    onPurchase: () -> Unit
) {
    val isPopular = bundle.bonusCredits > 0 && bundle.bonusCredits >= bundle.credits * 0.1

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        border = if (isPopular) {
            CardDefaults.outlinedCardBorder().copy(width = 2.dp)
        } else null
    ) {
        Column {
            if (isPopular) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Accent500)
                        .padding(vertical = 4.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "BEST VALUE",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = White
                    )
                }
            }

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = "${bundle.credits}",
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold
                        )
                        if (bundle.bonusCredits > 0) {
                            Text(
                                text = " + ${bundle.bonusCredits}",
                                style = MaterialTheme.typography.titleMedium,
                                color = Success
                            )
                        }
                        Text(
                            text = " credits",
                            style = MaterialTheme.typography.bodyMedium,
                            color = Gray500
                        )
                    }

                    if (bundle.bonusCredits > 0) {
                        Text(
                            text = "${bundle.bonusCredits} bonus credits included",
                            style = MaterialTheme.typography.labelSmall,
                            color = Success
                        )
                    }

                    Text(
                        text = "R${String.format("%.2f", bundle.priceZar)}",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = Primary600
                    )
                }

                Button(
                    onClick = onPurchase,
                    enabled = !isPurchasing,
                    colors = ButtonDefaults.buttonColors(containerColor = Primary600)
                ) {
                    if (isPurchasing) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(16.dp),
                            color = White,
                            strokeWidth = 2.dp
                        )
                    } else {
                        Text("Buy")
                    }
                }
            }
        }
    }
}

@Composable
fun TransactionHistoryContent(
    transactions: List<CreditTransaction>,
    isLoading: Boolean,
    isLoadingMore: Boolean,
    selectedType: CreditTransactionType?,
    onFilterChange: (CreditTransactionType?) -> Unit,
    onLoadMore: () -> Unit,
    hasMore: Boolean
) {
    Column(modifier = Modifier.fillMaxSize()) {
        // Filter chips
        LazyRow(
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            item {
                FilterChip(
                    selected = selectedType == null,
                    onClick = { onFilterChange(null) },
                    label = { Text("All") }
                )
            }
            item {
                FilterChip(
                    selected = selectedType == CreditTransactionType.PURCHASE,
                    onClick = { onFilterChange(CreditTransactionType.PURCHASE) },
                    label = { Text("Purchases") }
                )
            }
            item {
                FilterChip(
                    selected = selectedType == CreditTransactionType.SPEND,
                    onClick = { onFilterChange(CreditTransactionType.SPEND) },
                    label = { Text("Spent") }
                )
            }
            item {
                FilterChip(
                    selected = selectedType == CreditTransactionType.VOUCHER,
                    onClick = { onFilterChange(CreditTransactionType.VOUCHER) },
                    label = { Text("Vouchers") }
                )
            }
        }

        if (isLoading && transactions.isEmpty()) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(color = Primary600)
            }
        } else if (transactions.isEmpty()) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        imageVector = Icons.Default.Receipt,
                        contentDescription = null,
                        modifier = Modifier.size(64.dp),
                        tint = Gray400
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "No transactions yet",
                        style = MaterialTheme.typography.titleMedium,
                        color = Gray500
                    )
                }
            }
        } else {
            LazyColumn(
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(transactions) { transaction ->
                    TransactionItem(transaction = transaction)
                }

                if (hasMore) {
                    item {
                        Box(
                            modifier = Modifier.fillMaxWidth(),
                            contentAlignment = Alignment.Center
                        ) {
                            if (isLoadingMore) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(24.dp),
                                    color = Primary600
                                )
                            } else {
                                TextButton(onClick = onLoadMore) {
                                    Text("Load More")
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun TransactionItem(transaction: CreditTransaction) {
    val isCredit = transaction.type == CreditTransactionType.PURCHASE ||
            transaction.type == CreditTransactionType.VOUCHER ||
            transaction.type == CreditTransactionType.BONUS ||
            transaction.type == CreditTransactionType.REFUND

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Cream50)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                modifier = Modifier.weight(1f),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = if (isCredit) SuccessLight else ErrorLight
                ) {
                    Icon(
                        imageVector = if (isCredit) Icons.Default.Add else Icons.Default.Remove,
                        contentDescription = null,
                        tint = if (isCredit) Success else Error,
                        modifier = Modifier.padding(8.dp)
                    )
                }

                Spacer(modifier = Modifier.width(12.dp))

                Column {
                    Text(
                        text = transaction.description,
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium
                    )
                    Text(
                        text = transaction.formattedDate,
                        style = MaterialTheme.typography.labelSmall,
                        color = Gray500
                    )
                }
            }

            Text(
                text = "${if (isCredit) "+" else "-"}${transaction.amount}",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = if (isCredit) Success else Error
            )
        }
    }
}

@Composable
fun VoucherContent(
    voucherCode: String,
    isRedeeming: Boolean,
    error: String?,
    success: String?,
    onCodeChange: (String) -> Unit,
    onRedeem: () -> Unit
) {
    val focusManager = LocalFocusManager.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.height(32.dp))

        Icon(
            imageVector = Icons.Default.CardGiftcard,
            contentDescription = null,
            modifier = Modifier.size(80.dp),
            tint = Primary600
        )

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "Redeem Voucher",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold
        )

        Text(
            text = "Enter your voucher code to receive free credits",
            style = MaterialTheme.typography.bodyMedium,
            color = Gray500,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(32.dp))

        OutlinedTextField(
            value = voucherCode,
            onValueChange = onCodeChange,
            label = { Text("Voucher Code") },
            placeholder = { Text("e.g., TASKA-XXXX-XXXX") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(
                capitalization = KeyboardCapitalization.Characters,
                imeAction = ImeAction.Done
            ),
            keyboardActions = KeyboardActions(
                onDone = {
                    focusManager.clearFocus()
                    onRedeem()
                }
            ),
            isError = error != null,
            supportingText = {
                if (error != null) {
                    Text(error, color = Error)
                }
            },
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(16.dp))

        Button(
            onClick = {
                focusManager.clearFocus()
                onRedeem()
            },
            enabled = !isRedeeming && voucherCode.isNotBlank(),
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(containerColor = Primary600)
        ) {
            if (isRedeeming) {
                CircularProgressIndicator(
                    modifier = Modifier.size(20.dp),
                    color = White,
                    strokeWidth = 2.dp
                )
            } else {
                Text("Redeem Voucher")
            }
        }

        if (success != null) {
            Spacer(modifier = Modifier.height(16.dp))
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = SuccessLight)
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.CheckCircle,
                        contentDescription = null,
                        tint = Success
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(text = success, color = Success)
                }
            }
        }
    }
}

@Composable
fun AutoTopUpContent(
    wallet: CreditWallet?,
    isSaving: Boolean,
    onSave: (Boolean, Int?, Int?, AutoTopUpSource?) -> Unit
) {
    var enabled by remember(wallet) { mutableStateOf(wallet?.autoTopUpEnabled ?: false) }
    var threshold by remember(wallet) { mutableStateOf(wallet?.autoTopUpThreshold?.toString() ?: "20") }
    var amount by remember(wallet) { mutableStateOf(wallet?.autoTopUpAmount?.toString() ?: "50") }
    var source by remember(wallet) { mutableStateOf(wallet?.autoTopUpSource ?: AutoTopUpSource.WALLET) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "Auto Top-Up",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Automatically purchase credits when balance is low",
                            style = MaterialTheme.typography.bodySmall,
                            color = Gray500
                        )
                    }
                    Switch(
                        checked = enabled,
                        onCheckedChange = { enabled = it },
                        colors = SwitchDefaults.colors(checkedTrackColor = Primary600)
                    )
                }

                if (enabled) {
                    Spacer(modifier = Modifier.height(24.dp))

                    OutlinedTextField(
                        value = threshold,
                        onValueChange = { threshold = it.filter { c -> c.isDigit() } },
                        label = { Text("When balance falls below") },
                        suffix = { Text("credits") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    OutlinedTextField(
                        value = amount,
                        onValueChange = { amount = it.filter { c -> c.isDigit() } },
                        label = { Text("Top up amount") },
                        suffix = { Text("credits") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    Text(
                        text = "Payment Source",
                        style = MaterialTheme.typography.labelLarge
                    )

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 8.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        FilterChip(
                            selected = source == AutoTopUpSource.WALLET,
                            onClick = { source = AutoTopUpSource.WALLET },
                            label = { Text("Wallet Balance") },
                            leadingIcon = {
                                if (source == AutoTopUpSource.WALLET) {
                                    Icon(
                                        imageVector = Icons.Default.Check,
                                        contentDescription = null,
                                        modifier = Modifier.size(16.dp)
                                    )
                                }
                            }
                        )
                        FilterChip(
                            selected = source == AutoTopUpSource.CARD,
                            onClick = { source = AutoTopUpSource.CARD },
                            label = { Text("Saved Card") },
                            leadingIcon = {
                                if (source == AutoTopUpSource.CARD) {
                                    Icon(
                                        imageVector = Icons.Default.Check,
                                        contentDescription = null,
                                        modifier = Modifier.size(16.dp)
                                    )
                                }
                            }
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        Button(
            onClick = {
                onSave(
                    enabled,
                    threshold.toIntOrNull(),
                    amount.toIntOrNull(),
                    source
                )
            },
            enabled = !isSaving,
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(containerColor = Primary600)
        ) {
            if (isSaving) {
                CircularProgressIndicator(
                    modifier = Modifier.size(20.dp),
                    color = White,
                    strokeWidth = 2.dp
                )
            } else {
                Text("Save Settings")
            }
        }
    }
}
