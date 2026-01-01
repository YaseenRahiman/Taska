package za.co.taska.presentation.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import za.co.taska.presentation.screens.auth.login.LoginScreen
import za.co.taska.presentation.screens.auth.register.RegisterScreen
import za.co.taska.presentation.screens.splash.SplashScreen
import za.co.taska.presentation.screens.client.home.ClientHomeScreen
import za.co.taska.presentation.screens.client.jobs.CreateJobScreen
import za.co.taska.presentation.screens.client.jobs.MyJobsScreen
import za.co.taska.presentation.screens.client.jobs.ClientJobDetailScreen
import za.co.taska.presentation.screens.client.bids.ViewBidsScreen
import za.co.taska.presentation.screens.client.bids.BidDetailScreen
import za.co.taska.presentation.screens.artisan.home.ArtisanHomeScreen
import za.co.taska.presentation.screens.artisan.jobs.JobsScreen
import za.co.taska.presentation.screens.artisan.jobs.JobDetailScreen
import za.co.taska.presentation.screens.artisan.bids.BidsScreen
import za.co.taska.presentation.screens.artisan.bids.PlaceBidScreen
import za.co.taska.presentation.screens.artisan.profile.ProfileScreen
import za.co.taska.presentation.screens.artisan.credits.CreditsScreen
import za.co.taska.presentation.screens.artisan.boosts.BoostScreen
import za.co.taska.presentation.screens.admin.dashboard.AdminDashboardScreen
import za.co.taska.presentation.screens.admin.users.AdminUsersScreen
import za.co.taska.presentation.screens.admin.users.AdminUserDetailScreen
import za.co.taska.presentation.screens.admin.moderation.AdminModerationScreen
import za.co.taska.presentation.screens.messages.ConversationsScreen
import za.co.taska.presentation.screens.messages.ChatScreen

/**
 * Helper function to get home destination route based on user role
 */
fun getHomeRouteForRole(role: UserRole?): String {
    return when (role) {
        UserRole.CLIENT -> AppDestination.ClientHome.route
        UserRole.ARTISAN -> AppDestination.ArtisanHome.route
        UserRole.ADMIN -> AppDestination.AdminDashboard.route
        null -> AppDestination.Login.route
    }
}

/**
 * Main navigation graph with role-based routing
 * Supports CLIENT, ARTISAN, and ADMIN user roles
 */
@Composable
fun NavGraph(
    navController: NavHostController,
    startDestination: String = AppDestination.Splash.route
) {
    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        // ========================================
        // AUTHENTICATION ROUTES
        // ========================================

        // Splash screen - determines initial navigation based on auth state
        composable(AppDestination.Splash.route) {
            SplashScreen(
                onNavigateToLogin = {
                    navController.navigate(AppDestination.Login.route) {
                        popUpTo(AppDestination.Splash.route) { inclusive = true }
                    }
                },
                onNavigateToHome = { userRole ->
                    // Role-based routing after splash screen check
                    val homeRoute = getHomeRouteForRole(userRole)
                    navController.navigate(homeRoute) {
                        popUpTo(AppDestination.Splash.route) { inclusive = true }
                    }
                }
            )
        }

        // Login screen
        composable(AppDestination.Login.route) {
            LoginScreen(
                onNavigateToRegister = {
                    navController.navigate(AppDestination.Register.route)
                },
                onLoginSuccess = { userRole ->
                    // Role-based routing after successful login
                    val homeRoute = getHomeRouteForRole(userRole)
                    navController.navigate(homeRoute) {
                        popUpTo(AppDestination.Login.route) { inclusive = true }
                    }
                }
            )
        }

        // Register screen
        composable(AppDestination.Register.route) {
            RegisterScreen(
                onNavigateBack = {
                    navController.popBackStack()
                },
                onNavigateToLogin = {
                    navController.navigate(AppDestination.Login.route) {
                        popUpTo(AppDestination.Register.route) { inclusive = true }
                    }
                },
                onRegistrationSuccess = { email ->
                    navController.navigate(AppDestination.VerifyEmail.createRoute(email)) {
                        popUpTo(AppDestination.Register.route) { inclusive = true }
                    }
                }
            )
        }

        // ========================================
        // CLIENT ROUTES (Phase 4 - COMPLETE ✅)
        // ========================================

        // Client Home Screen - Dashboard
        composable(AppDestination.ClientHome.route) {
            ClientHomeScreen(
                onNavigateToCreateJob = {
                    navController.navigate(AppDestination.CreateJob.route)
                },
                onNavigateToMyJobs = {
                    navController.navigate(AppDestination.ClientJobs.route)
                },
                onNavigateToBids = {
                    // TODO: Navigate to all bids screen (Phase 5)
                },
                onNavigateToMessages = {
                    navController.navigate(AppDestination.Messages.route)
                },
                onNavigateToPayments = {
                    // TODO: Navigate to payments screen (Phase 5)
                },
                onNavigateToProfile = {
                    // TODO: Navigate to profile screen (Phase 5)
                },
                onNavigateToJobDetails = { jobId ->
                    navController.navigate(AppDestination.ClientJobDetail.createRoute(jobId))
                }
            )
        }

        // Create Job Screen - Post new job
        composable(AppDestination.CreateJob.route) {
            CreateJobScreen(
                onNavigateBack = {
                    navController.popBackStack()
                },
                onJobCreated = { _ ->
                    navController.navigate(AppDestination.ClientJobs.route) {
                        popUpTo(AppDestination.ClientHome.route)
                    }
                }
            )
        }

        // My Jobs Screen - List client's jobs
        composable(AppDestination.ClientJobs.route) {
            MyJobsScreen(
                onNavigateBack = {
                    navController.popBackStack()
                },
                onNavigateToJobDetails = { jobId ->
                    navController.navigate(AppDestination.ClientJobDetail.createRoute(jobId))
                }
            )
        }

        // Client Job Detail Screen - View job and received bids
        composable(
            route = AppDestination.ClientJobDetail.route,
            arguments = listOf(
                navArgument("jobId") {
                    type = NavType.StringType
                }
            )
        ) { backStackEntry ->
            val jobId = backStackEntry.arguments?.getString("jobId") ?: return@composable

            ClientJobDetailScreen(
                jobId = jobId,
                onNavigateBack = {
                    navController.popBackStack()
                },
                onNavigateToViewBids = { jobId ->
                    navController.navigate(AppDestination.ViewJobBids.createRoute(jobId))
                },
                onNavigateToBidDetail = { bidId ->
                    navController.navigate(AppDestination.ClientBidDetail.createRoute(bidId))
                }
            )
        }

        // View Job Bids Screen - All bids for a job
        composable(
            route = AppDestination.ViewJobBids.route,
            arguments = listOf(
                navArgument("jobId") {
                    type = NavType.StringType
                }
            )
        ) { backStackEntry ->
            val jobId = backStackEntry.arguments?.getString("jobId") ?: return@composable

            ViewBidsScreen(
                jobId = jobId,
                onNavigateBack = {
                    navController.popBackStack()
                },
                onNavigateToBidDetail = { bidId ->
                    navController.navigate(AppDestination.ClientBidDetail.createRoute(bidId))
                }
            )
        }

        // Bid Detail Screen - View bid and accept/reject
        composable(
            route = AppDestination.ClientBidDetail.route,
            arguments = listOf(
                navArgument("bidId") {
                    type = NavType.StringType
                }
            )
        ) { backStackEntry ->
            val bidId = backStackEntry.arguments?.getString("bidId") ?: return@composable

            BidDetailScreen(
                bidId = bidId,
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }

        // ========================================
        // ARTISAN ROUTES (Phase 3 - COMPLETE ✅)
        // ========================================

        // Artisan Home Screen - Dashboard
        composable(AppDestination.ArtisanHome.route) {
            ArtisanHomeScreen(
                onNavigateToJobs = {
                    navController.navigate(AppDestination.ArtisanJobs.route)
                },
                onNavigateToBids = {
                    navController.navigate(AppDestination.ArtisanBids.route)
                },
                onNavigateToProfile = {
                    navController.navigate(AppDestination.ArtisanProfile.route)
                },
                onNavigateToJobDetails = { jobId ->
                    navController.navigate(AppDestination.ArtisanJobDetail.createRoute(jobId))
                }
            )
        }

        // Artisan Jobs Screen - Browse available jobs with filtering
        composable(AppDestination.ArtisanJobs.route) {
            JobsScreen(
                onNavigateBack = {
                    navController.popBackStack()
                },
                onNavigateToJobDetails = { jobId ->
                    navController.navigate(AppDestination.ArtisanJobDetail.createRoute(jobId))
                }
            )
        }

        // Artisan Job Detail Screen - View full job information
        composable(
            route = AppDestination.ArtisanJobDetail.route,
            arguments = listOf(
                navArgument("jobId") {
                    type = NavType.StringType
                }
            )
        ) { backStackEntry ->
            val jobId = backStackEntry.arguments?.getString("jobId") ?: return@composable

            JobDetailScreen(
                jobId = jobId,
                onNavigateBack = {
                    navController.popBackStack()
                },
                onNavigateToPlaceBid = { jobId ->
                    navController.navigate(AppDestination.SubmitBid.createRoute(jobId))
                }
            )
        }

        // Place Bid Screen - Submit bid for a job
        composable(
            route = AppDestination.SubmitBid.route,
            arguments = listOf(
                navArgument("jobId") {
                    type = NavType.StringType
                }
            )
        ) { backStackEntry ->
            val jobId = backStackEntry.arguments?.getString("jobId") ?: return@composable

            PlaceBidScreen(
                jobId = jobId,
                onNavigateBack = {
                    navController.popBackStack()
                },
                onBidSubmitted = {
                    // Navigate back to job detail after successful bid submission
                    navController.popBackStack()
                }
            )
        }

        // Artisan Bids Screen - View all submitted bids with tabs
        composable(AppDestination.ArtisanBids.route) {
            BidsScreen(
                onNavigateBack = {
                    navController.popBackStack()
                },
                onNavigateToJobDetails = { jobId ->
                    navController.navigate(AppDestination.ArtisanJobDetail.createRoute(jobId))
                }
            )
        }

        // Artisan Profile Screen
        composable(AppDestination.ArtisanProfile.route) {
            ProfileScreen(
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }

        // ========================================
        // ARTISAN MONETIZATION ROUTES
        // ========================================

        // Artisan Credits Screen - Manage credits, bundles, vouchers
        composable(AppDestination.ArtisanCredits.route) {
            CreditsScreen(
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }

        // Artisan Boosts Screen - Activate profile boosts
        composable(AppDestination.ArtisanBoosts.route) {
            BoostScreen(
                onNavigateBack = {
                    navController.popBackStack()
                },
                onNavigateToCredits = {
                    navController.navigate(AppDestination.ArtisanCredits.route)
                }
            )
        }

        // ========================================
        // ADMIN ROUTES (Phase 5 - COMPLETE ✅)
        // ========================================

        // Admin Dashboard - Platform overview
        composable(AppDestination.AdminDashboard.route) {
            AdminDashboardScreen(
                onNavigateToUsers = {
                    navController.navigate(AppDestination.AdminUsers.route)
                },
                onNavigateToModeration = {
                    navController.navigate(AppDestination.AdminModeration.route)
                },
                onNavigateToAnalytics = {
                    navController.navigate(AppDestination.AdminAnalytics.route)
                },
                onNavigateToSettings = {
                    navController.navigate(AppDestination.AdminSettings.route)
                }
            )
        }

        // Admin Users - User management with filtering
        composable(AppDestination.AdminUsers.route) {
            AdminUsersScreen(
                onNavigateBack = {
                    navController.popBackStack()
                },
                onNavigateToUserDetail = { userId ->
                    navController.navigate(AppDestination.AdminUserDetail.createRoute(userId))
                }
            )
        }

        // Admin User Detail - View and manage user
        composable(
            route = AppDestination.AdminUserDetail.route,
            arguments = listOf(
                navArgument("userId") {
                    type = NavType.StringType
                }
            )
        ) { backStackEntry ->
            val userId = backStackEntry.arguments?.getString("userId") ?: return@composable

            AdminUserDetailScreen(
                userId = userId,
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }

        // Admin Moderation - Content review queue
        composable(AppDestination.AdminModeration.route) {
            AdminModerationScreen(
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }

        // TODO: AdminAnalytics and AdminSettings screens (future enhancement)

        // ========================================
        // SHARED MESSAGING ROUTES (All Roles)
        // ========================================

        // Conversations List - Shared across all roles
        composable(AppDestination.Messages.route) {
            ConversationsScreen(
                onNavigateBack = {
                    navController.popBackStack()
                },
                onNavigateToChat = { conversationId, jobId, otherUserId ->
                    navController.navigate(
                        "messages/chat/$conversationId?jobId=$jobId&otherUserId=$otherUserId"
                    )
                }
            )
        }

        // Chat Screen - Real-time messaging
        composable(
            route = "messages/chat/{conversationId}?jobId={jobId}&otherUserId={otherUserId}",
            arguments = listOf(
                navArgument("conversationId") {
                    type = NavType.StringType
                },
                navArgument("jobId") {
                    type = NavType.StringType
                },
                navArgument("otherUserId") {
                    type = NavType.StringType
                }
            )
        ) { backStackEntry ->
            val conversationId = backStackEntry.arguments?.getString("conversationId") ?: return@composable
            val jobId = backStackEntry.arguments?.getString("jobId") ?: return@composable
            val otherUserId = backStackEntry.arguments?.getString("otherUserId") ?: return@composable

            // TODO: Get job title and other user name from conversation or job details
            val jobTitle = "Job Title"  // Placeholder
            val otherUserName = "User"  // Placeholder

            ChatScreen(
                jobTitle = jobTitle,
                otherUserName = otherUserName,
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }
    }
}
