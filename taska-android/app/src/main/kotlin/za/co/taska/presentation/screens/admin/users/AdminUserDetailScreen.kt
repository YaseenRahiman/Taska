package za.co.taska.presentation.screens.admin.users

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import za.co.taska.domain.model.UserActionType
import za.co.taska.presentation.theme.Primary600

/**
 * Admin User Detail Screen - View and manage user
 * Provides admin actions: ban, suspend, verify
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminUserDetailScreen(
    userId: String,
    onNavigateBack: () -> Unit = {},
    viewModel: AdminUserDetailViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    var showBanDialog by remember { mutableStateOf(false) }
    var showSuspendDialog by remember { mutableStateOf(false) }
    var showVerifyDialog by remember { mutableStateOf(false) }

    // Handle action success
    LaunchedEffect(state.actionSuccess) {
        if (state.actionSuccess != null) {
            kotlinx.coroutines.delay(2000)
            viewModel.clearActionSuccess()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "User Details",
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
        when {
            state.error != null && state.user == null -> {
                ErrorState(
                    message = state.error!!,
                    onRetry = { viewModel.loadUserDetails() }
                )
            }
            state.isLoading && state.user == null -> {
                LoadingState()
            }
            state.user != null -> {
                val user = state.user!!

                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues)
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // User Info Card
                    item {
                        UserInfoCard(user = user)
                    }

                    // Stats Card
                    item {
                        UserStatsCard(user = user)
                    }

                    // Admin Actions
                    item {
                        Text(
                            text = "Admin Actions",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    item {
                        AdminActionsCard(
                            user = user,
                            isPerformingAction = state.isPerformingAction,
                            onBanClick = { showBanDialog = true },
                            onSuspendClick = { showSuspendDialog = true },
                            onVerifyClick = { showVerifyDialog = true }
                        )
                    }

                    // Success Message
                    if (state.actionSuccess != null) {
                        item {
                            ActionSuccessMessage(action = state.actionSuccess!!)
                        }
                    }

                    // Error Message
                    if (state.actionError != null) {
                        item {
                            ActionErrorMessage(
                                message = state.actionError!!,
                                onDismiss = { viewModel.clearActionError() }
                            )
                        }
                    }
                }
            }
        }
    }

    // Action Dialogs
    if (showBanDialog) {
        BanUserDialog(
            userName = state.user?.fullName ?: "",
            onDismiss = { showBanDialog = false },
            onConfirm = { reason ->
                viewModel.banUser(reason)
                showBanDialog = false
            }
        )
    }

    if (showSuspendDialog) {
        SuspendUserDialog(
            userName = state.user?.fullName ?: "",
            onDismiss = { showSuspendDialog = false },
            onConfirm = { reason, until ->
                viewModel.suspendUser(reason, until)
                showSuspendDialog = false
            }
        )
    }

    if (showVerifyDialog) {
        VerifyArtisanDialog(
            userName = state.user?.fullName ?: "",
            onDismiss = { showVerifyDialog = false },
            onConfirm = {
                viewModel.verifyArtisan()
                showVerifyDialog = false
            }
        )
    }
}

@Composable
private fun UserInfoCard(user: za.co.taska.domain.model.AdminUser) {
    Card {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = user.fullName,
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold
                )
            }

            InfoRow(Icons.Default.Email, "Email", user.email)
            if (user.phoneNumber != null) {
                InfoRow(Icons.Default.Phone, "Phone", user.phoneNumber)
            }
            InfoRow(Icons.Default.Person, "Role", user.role.name)
            InfoRow(Icons.Default.Circle, "Status", user.status.name)
            InfoRow(Icons.Default.CalendarToday, "Joined", user.createdAt.substring(0, 10))

            if (user.isArtisan) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = if (user.isVerified) Icons.Default.CheckCircle else Icons.Default.Warning,
                        contentDescription = null,
                        tint = if (user.isVerified) Color(0xFF4CAF50) else Color(0xFFFFC107),
                        modifier = Modifier.size(16.dp)
                    )
                    Text(
                        text = if (user.isVerified) "Verified Artisan" else "Unverified Artisan",
                        style = MaterialTheme.typography.labelLarge
                    )
                }
            }
        }
    }
}

@Composable
private fun UserStatsCard(user: za.co.taska.domain.model.AdminUser) {
    Card {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = "Activity Statistics",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                StatItem(Icons.Default.Work, "Jobs", user.totalJobs.toString())
                StatItem(Icons.Default.Assignment, "Bids", user.totalBids.toString())
                StatItem(Icons.Default.Reviews, "Reviews", user.totalReviews.toString())
                if (user.averageRating > 0) {
                    StatItem(Icons.Default.Star, "Rating", "%.1f".format(user.averageRating))
                }
            }
        }
    }
}

@Composable
private fun AdminActionsCard(
    user: za.co.taska.domain.model.AdminUser,
    isPerformingAction: Boolean,
    onBanClick: () -> Unit,
    onSuspendClick: () -> Unit,
    onVerifyClick: () -> Unit
) {
    Card {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Verify Artisan Button
            if (user.canBeVerified) {
                Button(
                    onClick = onVerifyClick,
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !isPerformingAction,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color(0xFF4CAF50)
                    )
                ) {
                    Icon(Icons.Default.CheckCircle, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Verify Artisan")
                }
            }

            // Suspend Button
            if (!user.isSuspended && !user.isBanned) {
                OutlinedButton(
                    onClick = onSuspendClick,
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !isPerformingAction
                ) {
                    Icon(Icons.Default.Warning, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Suspend User")
                }
            }

            // Ban Button
            if (!user.isBanned) {
                Button(
                    onClick = onBanClick,
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !isPerformingAction,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.error
                    )
                ) {
                    Icon(Icons.Default.Block, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Ban User")
                }
            }
        }
    }
}

@Composable
private fun BanUserDialog(
    userName: String,
    onDismiss: () -> Unit,
    onConfirm: (String) -> Unit
) {
    var reason by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        icon = { Icon(Icons.Default.Block, contentDescription = null, tint = MaterialTheme.colorScheme.error) },
        title = { Text("Ban User") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("Are you sure you want to ban $userName?")
                OutlinedTextField(
                    value = reason,
                    onValueChange = { reason = it },
                    label = { Text("Reason (min 10 chars)") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 3,
                    maxLines = 5
                )
            }
        },
        confirmButton = {
            Button(
                onClick = { onConfirm(reason) },
                enabled = reason.length >= 10,
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
            ) {
                Text("Ban")
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
private fun SuspendUserDialog(
    userName: String,
    onDismiss: () -> Unit,
    onConfirm: (String, String?) -> Unit
) {
    var reason by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        icon = { Icon(Icons.Default.Warning, contentDescription = null, tint = Color(0xFFFFC107)) },
        title = { Text("Suspend User") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("Suspend $userName temporarily?")
                OutlinedTextField(
                    value = reason,
                    onValueChange = { reason = it },
                    label = { Text("Reason (min 10 chars)") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 3,
                    maxLines = 5
                )
            }
        },
        confirmButton = {
            Button(
                onClick = { onConfirm(reason, null) },
                enabled = reason.length >= 10
            ) {
                Text("Suspend")
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
private fun VerifyArtisanDialog(
    userName: String,
    onDismiss: () -> Unit,
    onConfirm: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        icon = { Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Color(0xFF4CAF50)) },
        title = { Text("Verify Artisan") },
        text = {
            Text("Verify $userName as a trusted artisan? This will give them verified status.")
        },
        confirmButton = {
            Button(
                onClick = onConfirm,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF4CAF50))
            ) {
                Text("Verify")
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
private fun ActionSuccessMessage(action: UserActionType) {
    val message = when (action) {
        UserActionType.BAN -> "User banned successfully"
        UserActionType.SUSPEND -> "User suspended successfully"
        UserActionType.VERIFY -> "Artisan verified successfully"
        else -> "Action completed"
    }

    Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF4CAF50).copy(alpha = 0.1f))) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Color(0xFF4CAF50))
            Text(message, color = Color(0xFF4CAF50))
        }
    }
}

@Composable
private fun ActionErrorMessage(message: String, onDismiss: () -> Unit) {
    Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Icon(Icons.Default.Error, contentDescription = null, tint = MaterialTheme.colorScheme.error)
                Text(message)
            }
            IconButton(onClick = onDismiss) {
                Icon(Icons.Default.Close, contentDescription = "Dismiss")
            }
        }
    }
}

@Composable
private fun InfoRow(icon: androidx.compose.ui.graphics.vector.ImageVector, label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icon, contentDescription = null, tint = Primary600, modifier = Modifier.size(20.dp))
        Column {
            Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text(value, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun StatItem(icon: androidx.compose.ui.graphics.vector.ImageVector, label: String, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Icon(icon, contentDescription = null, tint = Primary600)
        Text(value, fontWeight = FontWeight.Bold)
        Text(label, style = MaterialTheme.typography.labelSmall)
    }
}

@Composable
private fun ErrorState(message: String, onRetry: () -> Unit) {
    Column(
        modifier = Modifier.fillMaxSize().padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(Icons.Default.Error, contentDescription = null, modifier = Modifier.size(64.dp))
        Spacer(modifier = Modifier.height(16.dp))
        Text(message)
        Spacer(modifier = Modifier.height(16.dp))
        Button(onClick = onRetry) { Text("Retry") }
    }
}

@Composable
private fun LoadingState() {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        CircularProgressIndicator()
    }
}
