package za.co.taska.presentation.screens.artisan.boosts

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.google.accompanist.swiperefresh.SwipeRefresh
import com.google.accompanist.swiperefresh.rememberSwipeRefreshState
import za.co.taska.domain.model.*
import za.co.taska.presentation.theme.*

/**
 * Boost management screen for artisans
 * Allows activating profile boosts to increase visibility
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BoostScreen(
    onNavigateBack: () -> Unit = {},
    onNavigateToCredits: () -> Unit = {},
    viewModel: BoostViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    val swipeRefreshState = rememberSwipeRefreshState(isRefreshing = state.isLoading)

    val snackbarHostState = remember { SnackbarHostState() }

    // Show success message
    LaunchedEffect(state.showActivationSuccess) {
        if (state.showActivationSuccess) {
            snackbarHostState.showSnackbar("Boost activated successfully!")
            viewModel.dismissSuccess()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Profile Boost",
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
                    // Credit balance chip
                    Surface(
                        shape = RoundedCornerShape(16.dp),
                        color = White.copy(alpha = 0.2f),
                        modifier = Modifier.padding(end = 8.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .clickable { onNavigateToCredits() }
                                .padding(horizontal = 12.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Default.MonetizationOn,
                                contentDescription = null,
                                tint = White,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "${state.creditBalance}",
                                style = MaterialTheme.typography.labelLarge,
                                color = White
                            )
                        }
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
            // Current boost status card
            CurrentBoostCard(
                activeBoost = state.activeBoost,
                levelBoost = state.levelSearchBoost,
                modifier = Modifier.padding(16.dp)
            )

            // Tab Row
            TabRow(
                selectedTabIndex = state.selectedTab.ordinal,
                containerColor = MaterialTheme.colorScheme.surface
            ) {
                BoostTab.values().forEach { tab ->
                    Tab(
                        selected = state.selectedTab == tab,
                        onClick = { viewModel.selectTab(tab) },
                        text = { Text(tab.displayName) }
                    )
                }
            }

            // Content based on tab
            SwipeRefresh(
                state = swipeRefreshState,
                onRefresh = { viewModel.loadInitialData() }
            ) {
                when (state.selectedTab) {
                    BoostTab.ACTIVATE -> ActivateBoostContent(
                        configs = state.boostConfigs,
                        freeBoostsRemaining = state.freeBoostsRemaining,
                        creditBalance = state.creditBalance,
                        hasActiveBoost = state.hasActiveBoost,
                        isActivating = state.isActivating,
                        activationError = state.activationError,
                        onActivate = viewModel::activateBoost,
                        canAfford = viewModel::canAffordBoost,
                        getEffectiveCost = viewModel::getEffectiveCost,
                        onNavigateToCredits = onNavigateToCredits
                    )
                    BoostTab.ACTIVE -> ActiveBoostContent(
                        activeBoost = state.activeBoost,
                        levelBoost = state.levelSearchBoost
                    )
                    BoostTab.HISTORY -> BoostHistoryContent(
                        history = state.boostHistory,
                        isLoading = state.isLoading
                    )
                }
            }
        }

        // Error dialog
        if (state.error != null || state.activationError != null) {
            AlertDialog(
                onDismissRequest = { viewModel.clearError() },
                icon = { Icon(Icons.Default.Error, contentDescription = null) },
                title = { Text("Error") },
                text = { Text(state.error ?: state.activationError ?: "") },
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
fun CurrentBoostCard(
    activeBoost: ProfileBoost?,
    levelBoost: Int,
    modifier: Modifier = Modifier
) {
    val totalBoost = (activeBoost?.boostPercent ?: 0) + levelBoost
    val hasBoost = totalBoost > 0

    // Pulsing animation for active boost
    val infiniteTransition = rememberInfiniteTransition(label = "boost_pulse")
    val scale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 1.05f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000),
            repeatMode = RepeatMode.Reverse
        ),
        label = "scale"
    )

    Card(
        modifier = modifier
            .fillMaxWidth()
            .then(if (hasBoost) Modifier.scale(scale) else Modifier),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = if (hasBoost) 8.dp else 2.dp)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    if (hasBoost) {
                        Brush.horizontalGradient(listOf(Accent600, Accent500))
                    } else {
                        Brush.horizontalGradient(listOf(Gray400, Gray500))
                    }
                )
                .padding(20.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Current Visibility",
                        style = MaterialTheme.typography.titleSmall,
                        color = White.copy(alpha = 0.8f)
                    )
                    Row(verticalAlignment = Alignment.Bottom) {
                        Text(
                            text = if (hasBoost) "+$totalBoost%" else "Normal",
                            style = MaterialTheme.typography.headlineLarge,
                            fontWeight = FontWeight.Bold,
                            color = White
                        )
                        if (hasBoost) {
                            Spacer(modifier = Modifier.width(8.dp))
                            Icon(
                                imageVector = Icons.Default.TrendingUp,
                                contentDescription = null,
                                tint = White,
                                modifier = Modifier.size(24.dp)
                            )
                        }
                    }

                    if (activeBoost?.isActive == true) {
                        Text(
                            text = "Expires in ${activeBoost.timeRemaining}",
                            style = MaterialTheme.typography.labelMedium,
                            color = White.copy(alpha = 0.9f)
                        )
                    } else if (levelBoost > 0) {
                        Text(
                            text = "From your level",
                            style = MaterialTheme.typography.labelMedium,
                            color = White.copy(alpha = 0.9f)
                        )
                    }
                }

                if (hasBoost) {
                    Surface(
                        shape = CircleShape,
                        color = White.copy(alpha = 0.2f)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Bolt,
                            contentDescription = null,
                            tint = White,
                            modifier = Modifier
                                .padding(12.dp)
                                .size(32.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun ActivateBoostContent(
    configs: List<BoostConfig>,
    freeBoostsRemaining: Int,
    creditBalance: Int,
    hasActiveBoost: Boolean,
    isActivating: Boolean,
    activationError: String?,
    onActivate: (BoostType, Boolean) -> Unit,
    canAfford: (BoostConfig) -> Boolean,
    getEffectiveCost: (BoostConfig) -> Int,
    onNavigateToCredits: () -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Free boosts info
        if (freeBoostsRemaining > 0) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = SuccessLight)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.CardGiftcard,
                            contentDescription = null,
                            tint = Success
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(
                                text = "$freeBoostsRemaining Free Boost${if (freeBoostsRemaining > 1) "s" else ""} Available",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold,
                                color = Success
                            )
                            Text(
                                text = "Use them for Standard boosts",
                                style = MaterialTheme.typography.bodySmall,
                                color = Success.copy(alpha = 0.8f)
                            )
                        }
                    }
                }
            }
        }

        // Warning if boost already active
        if (hasActiveBoost) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = WarningLight)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Info,
                            contentDescription = null,
                            tint = Warning
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(
                            text = "You have an active boost. Activating a new boost will replace it.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = Gray800
                        )
                    }
                }
            }
        }

        item {
            Text(
                text = "Choose a Boost",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
        }

        // Boost options
        items(configs) { config ->
            BoostOptionCard(
                config = config,
                canAfford = canAfford(config),
                effectiveCost = getEffectiveCost(config),
                freeBoostAvailable = freeBoostsRemaining > 0 && config.type == BoostType.STANDARD,
                isActivating = isActivating,
                onActivate = { useFree ->
                    onActivate(config.type, useFree)
                }
            )
        }

        // Low balance warning
        if (creditBalance < 20) {
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onNavigateToCredits() },
                    colors = CardDefaults.cardColors(containerColor = Cream100)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.AddCircle,
                            contentDescription = null,
                            tint = Primary600
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Need more credits?",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Tap here to purchase credit bundles",
                                style = MaterialTheme.typography.bodySmall,
                                color = Gray500
                            )
                        }
                        Icon(
                            imageVector = Icons.Default.ChevronRight,
                            contentDescription = null,
                            tint = Gray400
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun BoostOptionCard(
    config: BoostConfig,
    canAfford: Boolean,
    effectiveCost: Int,
    freeBoostAvailable: Boolean,
    isActivating: Boolean,
    onActivate: (Boolean) -> Unit
) {
    val borderColor = when (config.type) {
        BoostType.STANDARD -> Primary400
        BoostType.SUPER -> Accent500
        BoostType.PREMIUM -> Color(0xFFFFD700) // Gold
    }

    val isPremium = config.type == BoostType.PREMIUM

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .then(
                if (isPremium) {
                    Modifier.border(2.dp, borderColor, RoundedCornerShape(12.dp))
                } else Modifier
            ),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column {
            // Premium banner
            if (isPremium) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(borderColor)
                        .padding(vertical = 4.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "MAXIMUM VISIBILITY",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = Gray900
                    )
                }
            }

            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Top
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = config.type.displayName,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )

                        Spacer(modifier = Modifier.height(4.dp))

                        Text(
                            text = config.type.description,
                            style = MaterialTheme.typography.bodySmall,
                            color = Gray500
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        // Stats row
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            BoostStat(
                                icon = Icons.Default.TrendingUp,
                                value = "+${config.boostPercent}%",
                                label = "Visibility"
                            )
                            BoostStat(
                                icon = Icons.Default.Schedule,
                                value = "${config.durationHours}h",
                                label = "Duration"
                            )
                        }
                    }

                    // Price and activate button
                    Column(
                        horizontalAlignment = Alignment.End
                    ) {
                        if (freeBoostAvailable) {
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = SuccessLight
                            ) {
                                Text(
                                    text = "FREE",
                                    style = MaterialTheme.typography.labelLarge,
                                    fontWeight = FontWeight.Bold,
                                    color = Success,
                                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp)
                                )
                            }
                        } else {
                            Text(
                                text = "${config.creditCost}",
                                style = MaterialTheme.typography.headlineSmall,
                                fontWeight = FontWeight.Bold,
                                color = if (canAfford) Primary600 else Error
                            )
                            Text(
                                text = "credits",
                                style = MaterialTheme.typography.labelSmall,
                                color = Gray500
                            )
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        Button(
                            onClick = { onActivate(freeBoostAvailable) },
                            enabled = canAfford && !isActivating,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = when (config.type) {
                                    BoostType.STANDARD -> Primary600
                                    BoostType.SUPER -> Accent600
                                    BoostType.PREMIUM -> Color(0xFFFFD700)
                                },
                                contentColor = if (isPremium) Gray900 else White
                            ),
                            modifier = Modifier.widthIn(min = 100.dp)
                        ) {
                            if (isActivating) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(16.dp),
                                    strokeWidth = 2.dp,
                                    color = if (isPremium) Gray900 else White
                                )
                            } else {
                                Text(if (freeBoostAvailable) "Use Free" else "Activate")
                            }
                        }

                        if (!canAfford && !freeBoostAvailable) {
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Not enough credits",
                                style = MaterialTheme.typography.labelSmall,
                                color = Error
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun BoostStat(
    icon: ImageVector,
    value: String,
    label: String
) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = Primary600,
            modifier = Modifier.size(16.dp)
        )
        Spacer(modifier = Modifier.width(4.dp))
        Column {
            Text(
                text = value,
                style = MaterialTheme.typography.labelLarge,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = Gray500
            )
        }
    }
}

@Composable
fun ActiveBoostContent(
    activeBoost: ProfileBoost?,
    levelBoost: Int
) {
    if (activeBoost == null || !activeBoost.isActive) {
        // No active boost
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.padding(32.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.RocketLaunch,
                    contentDescription = null,
                    modifier = Modifier.size(80.dp),
                    tint = Gray400
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = "No Active Boost",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Activate a boost to increase your profile visibility",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Gray500,
                    textAlign = TextAlign.Center
                )

                if (levelBoost > 0) {
                    Spacer(modifier = Modifier.height(16.dp))
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Primary100)
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Default.Star,
                                contentDescription = null,
                                tint = Primary600
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Your level gives you +$levelBoost% visibility",
                                style = MaterialTheme.typography.bodyMedium,
                                color = Primary600
                            )
                        }
                    }
                }
            }
        }
    } else {
        // Active boost details
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                ActiveBoostDetailCard(boost = activeBoost)
            }

            item {
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "Boost Benefits",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(12.dp))

                        BenefitItem(
                            icon = Icons.Default.Visibility,
                            title = "Increased Visibility",
                            description = "Your profile appears +${activeBoost.boostPercent}% higher in search results"
                        )

                        if (activeBoost.type == BoostType.SUPER || activeBoost.type == BoostType.PREMIUM) {
                            BenefitItem(
                                icon = Icons.Default.Star,
                                title = "Featured Badge",
                                description = "Your profile shows a featured badge to clients"
                            )
                        }

                        if (activeBoost.type == BoostType.PREMIUM) {
                            BenefitItem(
                                icon = Icons.Default.Notifications,
                                title = "Client Notifications",
                                description = "Clients in your area receive notifications about your availability"
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ActiveBoostDetailCard(boost: ProfileBoost) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Cream50)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = boost.type.displayName,
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = boost.type.description,
                        style = MaterialTheme.typography.bodyMedium,
                        color = Gray500
                    )
                }

                Surface(
                    shape = CircleShape,
                    color = Accent500
                ) {
                    Icon(
                        imageVector = Icons.Default.Bolt,
                        contentDescription = null,
                        tint = White,
                        modifier = Modifier
                            .padding(12.dp)
                            .size(28.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Progress bar
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = "Time Remaining",
                        style = MaterialTheme.typography.labelMedium,
                        color = Gray500
                    )
                    Text(
                        text = boost.timeRemaining,
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.Bold
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                LinearProgressIndicator(
                    progress = { 1f - (boost.progressPercent / 100f) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(8.dp)
                        .clip(RoundedCornerShape(4.dp)),
                    color = Accent500,
                    trackColor = Gray200
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Details
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                DetailItem(label = "Started", value = boost.startedAt.toLocalDate().toString())
                DetailItem(label = "Expires", value = boost.formattedExpiry)
                DetailItem(
                    label = "Cost",
                    value = if (boost.usedFreeBoost) "Free" else "${boost.creditsCost} credits"
                )
            }
        }
    }
}

@Composable
fun BenefitItem(
    icon: ImageVector,
    title: String,
    description: String
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        verticalAlignment = Alignment.Top
    ) {
        Surface(
            shape = RoundedCornerShape(8.dp),
            color = Primary100
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = Primary600,
                modifier = Modifier.padding(8.dp)
            )
        }
        Spacer(modifier = Modifier.width(12.dp))
        Column {
            Text(
                text = title,
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Medium
            )
            Text(
                text = description,
                style = MaterialTheme.typography.bodySmall,
                color = Gray500
            )
        }
    }
}

@Composable
fun DetailItem(
    label: String,
    value: String
) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = value,
            style = MaterialTheme.typography.labelLarge,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = Gray500
        )
    }
}

@Composable
fun BoostHistoryContent(
    history: List<ProfileBoost>,
    isLoading: Boolean
) {
    if (isLoading) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            CircularProgressIndicator(color = Primary600)
        }
    } else if (history.isEmpty()) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.padding(32.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.History,
                    contentDescription = null,
                    modifier = Modifier.size(64.dp),
                    tint = Gray400
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = "No Boost History",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Your past boosts will appear here",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Gray500
                )
            }
        }
    } else {
        LazyColumn(
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(history) { boost ->
                BoostHistoryItem(boost = boost)
            }
        }
    }
}

@Composable
fun BoostHistoryItem(boost: ProfileBoost) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = if (boost.isActive) Accent500.copy(alpha = 0.1f) else Cream50
        )
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
                    color = if (boost.isActive) Accent500 else Gray300
                ) {
                    Icon(
                        imageVector = Icons.Default.Bolt,
                        contentDescription = null,
                        tint = if (boost.isActive) White else Gray600,
                        modifier = Modifier.padding(8.dp)
                    )
                }

                Spacer(modifier = Modifier.width(12.dp))

                Column {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = boost.type.displayName,
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Medium
                        )
                        if (boost.isActive) {
                            Spacer(modifier = Modifier.width(8.dp))
                            Surface(
                                shape = RoundedCornerShape(4.dp),
                                color = Success
                            ) {
                                Text(
                                    text = "ACTIVE",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = White,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                        }
                    }
                    Text(
                        text = if (boost.isActive) {
                            "Expires ${boost.timeRemaining}"
                        } else {
                            "Expired ${boost.formattedExpiry}"
                        },
                        style = MaterialTheme.typography.labelSmall,
                        color = Gray500
                    )
                }
            }

            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = "+${boost.boostPercent}%",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    color = if (boost.isActive) Accent600 else Gray600
                )
                Text(
                    text = if (boost.usedFreeBoost) "Free" else "${boost.creditsCost} cr",
                    style = MaterialTheme.typography.labelSmall,
                    color = Gray500
                )
            }
        }
    }
}
