package za.co.taska.presentation.components

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import za.co.taska.domain.model.AdminUser
import za.co.taska.domain.model.UserRole
import za.co.taska.domain.model.UserStatus
import za.co.taska.presentation.theme.Primary600

/**
 * Reusable card for displaying admin users in list
 */
@Composable
fun AdminUserCard(
    user: AdminUser,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        onClick = onClick,
        modifier = modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Header: Name and Status Badge
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = user.fullName,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text = user.email,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }

                UserStatusBadge(status = user.status)
            }

            // Role and Verification
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = getRoleIcon(user.role),
                        contentDescription = null,
                        modifier = Modifier.size(16.dp),
                        tint = Primary600
                    )
                    Text(
                        text = user.role.name,
                        style = MaterialTheme.typography.labelMedium,
                        color = Primary600,
                        fontWeight = FontWeight.Bold
                    )
                }

                if (user.isArtisan && user.isVerified) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.CheckCircle,
                            contentDescription = "Verified",
                            modifier = Modifier.size(16.dp),
                            tint = Color(0xFF4CAF50)
                        )
                        Text(
                            text = "Verified",
                            style = MaterialTheme.typography.labelSmall,
                            color = Color(0xFF4CAF50)
                        )
                    }
                }
            }

            // Stats Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                UserStatItem(
                    icon = Icons.Default.Work,
                    label = "Jobs",
                    value = user.totalJobs.toString()
                )
                UserStatItem(
                    icon = Icons.Default.Assignment,
                    label = "Bids",
                    value = user.totalBids.toString()
                )
                if (user.totalReviews > 0) {
                    UserStatItem(
                        icon = Icons.Default.Star,
                        label = "Rating",
                        value = "%.1f".format(user.averageRating)
                    )
                }
            }

            // Suspension/Ban Info
            if (user.isSuspended && user.suspensionReason != null) {
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.errorContainer
                    )
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(8.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Warning,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp),
                            tint = MaterialTheme.colorScheme.error
                        )
                        Text(
                            text = "Suspended: ${user.suspensionReason}",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onErrorContainer,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }
            }

            if (user.isBanned && user.banReason != null) {
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = Color(0xFFF44336).copy(alpha = 0.1f)
                    )
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(8.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Block,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp),
                            tint = Color(0xFFF44336)
                        )
                        Text(
                            text = "Banned: ${user.banReason}",
                            style = MaterialTheme.typography.labelSmall,
                            color = Color(0xFFF44336),
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun UserStatusBadge(status: UserStatus) {
    val (text, containerColor, contentColor) = when (status) {
        UserStatus.ACTIVE -> Triple("Active", Color(0xFF4CAF50), Color.White)
        UserStatus.SUSPENDED -> Triple("Suspended", Color(0xFFFFC107), Color.Black)
        UserStatus.BANNED -> Triple("Banned", Color(0xFFF44336), Color.White)
        UserStatus.INACTIVE -> Triple("Inactive", Color(0xFF9E9E9E), Color.White)
    }

    Surface(
        color = containerColor,
        shape = MaterialTheme.shapes.small
    ) {
        Text(
            text = text,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Bold,
            color = contentColor
        )
    }
}

@Composable
private fun UserStatItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    value: String
) {
    Row(
        horizontalArrangement = Arrangement.spacedBy(4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            modifier = Modifier.size(14.dp),
            tint = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = value,
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

private fun getRoleIcon(role: UserRole): androidx.compose.ui.graphics.vector.ImageVector {
    return when (role) {
        UserRole.CLIENT -> Icons.Default.Person
        UserRole.ARTISAN -> Icons.Default.Build
        UserRole.ADMIN -> Icons.Default.Shield
        UserRole.ASSESSOR -> Icons.Default.VerifiedUser
    }
}
