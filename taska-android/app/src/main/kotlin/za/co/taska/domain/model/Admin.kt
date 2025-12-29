package za.co.taska.domain.model

/**
 * Admin-specific domain models for platform management
 */

/**
 * Dashboard metrics for admin overview
 */
data class DashboardMetrics(
    val totalUsers: Int = 0,
    val activeUsers: Int = 0,
    val totalClients: Int = 0,
    val totalArtisans: Int = 0,
    val verifiedArtisans: Int = 0,
    val pendingVerifications: Int = 0,
    val totalJobs: Int = 0,
    val activeJobs: Int = 0,
    val completedJobs: Int = 0,
    val totalBids: Int = 0,
    val activeBids: Int = 0,
    val totalRevenue: Double = 0.0,
    val monthlyRevenue: Double = 0.0,
    val pendingDisputes: Int = 0,
    val resolvedDisputes: Int = 0,
    val contentModerationQueue: Int = 0,
    val suspendedUsers: Int = 0,
    val bannedUsers: Int = 0
) {
    val userGrowthRate: Double
        get() = if (totalUsers > 0) (activeUsers.toDouble() / totalUsers * 100) else 0.0

    val artisanVerificationRate: Double
        get() = if (totalArtisans > 0) (verifiedArtisans.toDouble() / totalArtisans * 100) else 0.0

    val jobCompletionRate: Double
        get() = if (totalJobs > 0) (completedJobs.toDouble() / totalJobs * 100) else 0.0
}

/**
 * User status enum for admin management
 */
enum class UserStatus {
    ACTIVE,
    SUSPENDED,
    BANNED,
    INACTIVE
}

/**
 * Admin view of user with management fields
 */
data class AdminUser(
    val id: String,
    val email: String,
    val firstName: String,
    val lastName: String,
    val role: UserRole,
    val status: UserStatus,
    val isVerified: Boolean = false,
    val createdAt: String,
    val lastActive: String? = null,
    val phoneNumber: String? = null,
    val profileImageUrl: String? = null,
    val totalJobs: Int = 0,
    val totalBids: Int = 0,
    val totalReviews: Int = 0,
    val averageRating: Double = 0.0,
    val suspendedUntil: String? = null,
    val suspensionReason: String? = null,
    val banReason: String? = null
) {
    val fullName: String
        get() = "$firstName $lastName"

    val isArtisan: Boolean
        get() = role == UserRole.ARTISAN

    val isSuspended: Boolean
        get() = status == UserStatus.SUSPENDED

    val isBanned: Boolean
        get() = status == UserStatus.BANNED

    val canBeVerified: Boolean
        get() = isArtisan && !isVerified && status == UserStatus.ACTIVE
}

/**
 * Content type for moderation
 */
enum class ContentType {
    JOB,
    MESSAGE,
    REVIEW,
    PROFILE
}

/**
 * Moderation status
 */
enum class ModerationStatus {
    PENDING,
    APPROVED,
    REJECTED,
    ESCALATED
}

/**
 * Content moderation item
 */
data class ModerationItem(
    val id: String,
    val contentType: ContentType,
    val contentId: String,
    val reportedBy: String,
    val reportedByName: String,
    val reportReason: String,
    val reportDetails: String? = null,
    val contentPreview: String,
    val contentOwnerId: String,
    val contentOwnerName: String,
    val status: ModerationStatus = ModerationStatus.PENDING,
    val createdAt: String,
    val reviewedAt: String? = null,
    val reviewedBy: String? = null,
    val moderationNotes: String? = null
) {
    val isPending: Boolean
        get() = status == ModerationStatus.PENDING

    val isEscalated: Boolean
        get() = status == ModerationStatus.ESCALATED
}

/**
 * Platform analytics data
 */
data class PlatformAnalytics(
    val period: String, // "DAILY", "WEEKLY", "MONTHLY", "YEARLY"
    val dateFrom: String,
    val dateTo: String,
    val totalRevenue: Double = 0.0,
    val platformFees: Double = 0.0,
    val newUsers: Int = 0,
    val newJobs: Int = 0,
    val completedJobs: Int = 0,
    val newBids: Int = 0,
    val acceptedBids: Int = 0,
    val averageJobValue: Double = 0.0,
    val averageBidValue: Double = 0.0,
    val disputeRate: Double = 0.0,
    val userRetentionRate: Double = 0.0,
    val artisanUtilizationRate: Double = 0.0
)

/**
 * Report type for generation
 */
enum class ReportType {
    USERS,
    JOBS,
    REVENUE,
    DISPUTES,
    ARTISANS
}

/**
 * Report format
 */
enum class ReportFormat {
    CSV,
    PDF
}

/**
 * User action types for admin
 */
enum class UserActionType {
    BAN,
    SUSPEND,
    UNSUSPEND,
    VERIFY,
    RESET_PASSWORD,
    DELETE_CONTENT
}

/**
 * User filter for admin search
 */
data class UserFilter(
    val role: UserRole? = null,
    val status: UserStatus? = null,
    val isVerified: Boolean? = null,
    val searchQuery: String? = null,
    val dateFrom: String? = null,
    val dateTo: String? = null,
    val skip: Int = 0,
    val take: Int = 20
)

/**
 * Moderation filter
 */
data class ModerationFilter(
    val contentType: ContentType? = null,
    val status: ModerationStatus? = null,
    val skip: Int = 0,
    val take: Int = 20
)
