package za.co.taska.domain.repository

import za.co.taska.domain.model.*

/**
 * Repository interface for admin operations
 * Handles platform management, user administration, and content moderation
 */
interface AdminRepository {

    /**
     * Get dashboard metrics for admin overview
     */
    suspend fun getDashboardMetrics(): Result<DashboardMetrics>

    /**
     * Get all users with filtering
     */
    suspend fun getUsers(filter: UserFilter): Result<List<AdminUser>>

    /**
     * Get detailed user information
     */
    suspend fun getUserDetails(userId: String): Result<AdminUser>

    /**
     * Ban a user permanently
     */
    suspend fun banUser(userId: String, reason: String): Result<Unit>

    /**
     * Suspend a user temporarily
     */
    suspend fun suspendUser(
        userId: String,
        reason: String,
        suspendUntil: String? = null
    ): Result<Unit>

    /**
     * Unsuspend a user
     */
    suspend fun unsuspendUser(userId: String): Result<Unit>

    /**
     * Verify an artisan
     */
    suspend fun verifyArtisan(userId: String): Result<Unit>

    /**
     * Reset user password
     */
    suspend fun resetUserPassword(userId: String): Result<String> // Returns temporary password

    /**
     * Get content moderation queue
     */
    suspend fun getModerationQueue(filter: ModerationFilter): Result<List<ModerationItem>>

    /**
     * Approve moderated content
     */
    suspend fun approveContent(contentId: String, notes: String?): Result<Unit>

    /**
     * Reject moderated content
     */
    suspend fun rejectContent(contentId: String, notes: String?): Result<Unit>

    /**
     * Get platform analytics
     */
    suspend fun getAnalytics(
        period: String,
        dateFrom: String,
        dateTo: String
    ): Result<PlatformAnalytics>

    /**
     * Generate report
     */
    suspend fun generateReport(
        type: ReportType,
        format: ReportFormat,
        dateFrom: String,
        dateTo: String
    ): Result<String> // Returns file URL or base64

    /**
     * Get pending artisan verifications
     */
    suspend fun getPendingVerifications(): Result<List<AdminUser>>

    /**
     * Get financial reconciliation data
     */
    suspend fun getFinancialReconciliation(): Result<Map<String, Any>>
}
