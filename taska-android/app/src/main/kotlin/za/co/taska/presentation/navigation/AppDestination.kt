package za.co.taska.presentation.navigation

/**
 * Complete navigation destinations for all user roles
 * Supports CLIENT, ARTISAN, and ADMIN flows
 */
sealed class AppDestination(val route: String) {

    // ========================================
    // AUTH ROUTES (Public)
    // ========================================
    object Splash : AppDestination("splash")
    object Login : AppDestination("login")
    object Register : AppDestination("register")
    object ForgotPassword : AppDestination("forgot_password")
    object ResetPassword : AppDestination("reset_password/{token}") {
        fun createRoute(token: String) = "reset_password/$token"
    }
    object VerifyEmail : AppDestination("verify_email/{email}") {
        fun createRoute(email: String) = "verify_email/$email"
    }

    // ========================================
    // CLIENT ROUTES
    // ========================================
    object ClientHome : AppDestination("client/home")

    // Jobs
    object ClientJobs : AppDestination("client/jobs")
    object ClientJobDetail : AppDestination("client/jobs/{jobId}") {
        fun createRoute(jobId: String) = "client/jobs/$jobId"
    }
    object CreateJob : AppDestination("client/jobs/create")
    object EditJob : AppDestination("client/jobs/{jobId}/edit") {
        fun createRoute(jobId: String) = "client/jobs/$jobId/edit"
    }

    // Bids
    object ClientBids : AppDestination("client/bids")
    object ViewJobBids : AppDestination("client/jobs/{jobId}/bids") {
        fun createRoute(jobId: String) = "client/jobs/$jobId/bids"
    }
    object ClientBidDetail : AppDestination("client/bids/{bidId}") {
        fun createRoute(bidId: String) = "client/bids/$bidId"
    }

    // Payments
    object ClientPayments : AppDestination("client/payments")
    object PaymentDetail : AppDestination("client/payments/{paymentId}") {
        fun createRoute(paymentId: String) = "client/payments/$paymentId"
    }
    object MakePayment : AppDestination("client/payments/make/{jobId}") {
        fun createRoute(jobId: String) = "client/payments/make/$jobId"
    }

    // Messages
    object ClientMessages : AppDestination("client/messages")
    object ClientChat : AppDestination("client/messages/chat/{conversationId}") {
        fun createRoute(conversationId: String) = "client/messages/chat/$conversationId"
    }

    // Profile & Settings
    object ClientProfile : AppDestination("client/profile")
    object ClientSettings : AppDestination("client/settings")

    // ========================================
    // ARTISAN ROUTES
    // ========================================
    object ArtisanHome : AppDestination("artisan/home")

    // Jobs (browsing)
    object ArtisanJobs : AppDestination("artisan/jobs")
    object ArtisanJobDetail : AppDestination("artisan/jobs/{jobId}") {
        fun createRoute(jobId: String) = "artisan/jobs/$jobId"
    }

    // Bids (submitted by artisan)
    object ArtisanBids : AppDestination("artisan/bids")
    object ArtisanBidDetail : AppDestination("artisan/bids/{bidId}") {
        fun createRoute(bidId: String) = "artisan/bids/$bidId"
    }
    object SubmitBid : AppDestination("artisan/bids/submit/{jobId}") {
        fun createRoute(jobId: String) = "artisan/bids/submit/$jobId"
    }

    // Projects (active work)
    object ArtisanProjects : AppDestination("artisan/projects")
    object ArtisanProjectDetail : AppDestination("artisan/projects/{projectId}") {
        fun createRoute(projectId: String) = "artisan/projects/$projectId"
    }

    // Earnings & Wallet
    object ArtisanEarnings : AppDestination("artisan/earnings")
    object ArtisanWithdraw : AppDestination("artisan/earnings/withdraw")
    object ArtisanTransactionHistory : AppDestination("artisan/earnings/history")

    // Messages
    object ArtisanMessages : AppDestination("artisan/messages")
    object ArtisanChat : AppDestination("artisan/messages/chat/{conversationId}") {
        fun createRoute(conversationId: String) = "artisan/messages/chat/$conversationId"
    }

    // Profile & Settings
    object ArtisanProfile : AppDestination("artisan/profile")
    object ArtisanSettings : AppDestination("artisan/settings")
    object ArtisanVerification : AppDestination("artisan/verification")

    // Monetization (Credits, Boosts, Levels)
    object ArtisanCredits : AppDestination("artisan/credits")
    object ArtisanBoosts : AppDestination("artisan/boosts")
    object ArtisanLevel : AppDestination("artisan/level")

    // ========================================
    // ADMIN ROUTES
    // ========================================
    object AdminDashboard : AppDestination("admin/dashboard")

    // User Management
    object AdminUsers : AppDestination("admin/users")
    object AdminUserDetail : AppDestination("admin/users/{userId}") {
        fun createRoute(userId: String) = "admin/users/$userId"
    }

    // Moderation
    object AdminModeration : AppDestination("admin/moderation")
    object AdminModerationDetail : AppDestination("admin/moderation/{contentId}") {
        fun createRoute(contentId: String) = "admin/moderation/$contentId"
    }

    // Escrow Management
    object AdminEscrow : AppDestination("admin/escrow")
    object AdminEscrowDetail : AppDestination("admin/escrow/{escrowId}") {
        fun createRoute(escrowId: String) = "admin/escrow/$escrowId"
    }

    // Payments
    object AdminPayments : AppDestination("admin/payments")
    object AdminPaymentDetail : AppDestination("admin/payments/{paymentId}") {
        fun createRoute(paymentId: String) = "admin/payments/$paymentId"
    }

    // Analytics
    object AdminAnalytics : AppDestination("admin/analytics")

    // Settings
    object AdminSettings : AppDestination("admin/settings")

    // ========================================
    // SHARED/COMMON ROUTES
    // ========================================
    object Messages : AppDestination("messages")  // Shared messaging (role-agnostic)
    object Chat : AppDestination("messages/chat/{conversationId}") {
        fun createRoute(conversationId: String) = "messages/chat/$conversationId"
    }
    object Reviews : AppDestination("reviews")  // Shared reviews
    object ReviewDetail : AppDestination("reviews/{reviewId}") {
        fun createRoute(reviewId: String) = "reviews/$reviewId"
    }
    object WriteReview : AppDestination("reviews/write/{jobId}") {
        fun createRoute(jobId: String) = "reviews/write/$jobId"
    }
    object Notifications : AppDestination("notifications")  // Shared notifications
}

/**
 * User role enum matching backend roles
 */
enum class UserRole {
    CLIENT,
    ARTISAN,
    ADMIN
}

/**
 * Get home destination based on user role
 */
fun UserRole.getHomeDestination(): AppDestination {
    return when (this) {
        UserRole.CLIENT -> AppDestination.ClientHome
        UserRole.ARTISAN -> AppDestination.ArtisanHome
        UserRole.ADMIN -> AppDestination.AdminDashboard
    }
}

/**
 * Check if a destination requires authentication
 */
fun AppDestination.requiresAuth(): Boolean {
    return when (this) {
        is AppDestination.Splash,
        is AppDestination.Login,
        is AppDestination.Register,
        is AppDestination.ForgotPassword,
        is AppDestination.ResetPassword,
        is AppDestination.VerifyEmail -> false
        else -> true
    }
}

/**
 * Check if a destination is allowed for a specific role
 */
fun AppDestination.isAllowedForRole(role: UserRole): Boolean {
    return when {
        // Public routes - allowed for all
        !this.requiresAuth() -> true

        // CLIENT-only routes
        this.route.startsWith("client/") -> role == UserRole.CLIENT

        // ARTISAN-only routes
        this.route.startsWith("artisan/") -> role == UserRole.ARTISAN

        // ADMIN-only routes
        this.route.startsWith("admin/") -> role == UserRole.ADMIN

        // Shared routes (messages, reviews, notifications) - allowed for authenticated users
        this.route.startsWith("messages/") ||
        this.route.startsWith("reviews/") ||
        this == AppDestination.Notifications -> true

        // Default deny
        else -> false
    }
}
