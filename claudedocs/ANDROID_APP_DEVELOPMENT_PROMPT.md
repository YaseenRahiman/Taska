# Taska Android Mobile App Development Prompt

> **For Claude Sonnet** | SuperClaude Framework | Complete Android Implementation

---

## Mission Statement

Complete the Taska Android mobile application to achieve **feature parity with the web frontend**. The app must support all three user roles (CLIENT, ARTISAN, ADMIN) using the **existing backend API** and leveraging the **existing Android codebase** at `taska-android/`.

**Key Constraints:**
- Use SAME backend API calls as web frontend
- Follow SuperClaude framework conventions (`--task-manage`, `--validate`, `--loop`)
- Leverage existing Clean Architecture foundation
- Include comprehensive testing (unit, integration, UI)

---

## Current State Analysis

### Existing Android Foundation (60-70% Complete)

**Tech Stack Already Configured:**
- Kotlin 2.0.21 + Jetpack Compose
- Material 3 Design System
- Hilt 2.52 (Dependency Injection)
- Retrofit 2.9.0 + OkHttp 4.12.0 (Networking)
- Room 2.8.3 + DataStore 1.1.1 (Local Storage)
- Socket.IO 2.1.1 (Real-time Messaging)
- Firebase Cloud Messaging (Push Notifications)
- CameraX 1.4.1 (Camera Integration)
- Coil 2.7.0 (Image Loading)

**Architecture Pattern:** Clean Architecture with 3 layers:
```
Domain Layer → Business logic, Use Cases, Repository Interfaces
Data Layer   → Repositories, API Services, Room DAOs, Mappers
Presentation → Compose Screens, ViewModels, Navigation
```

**What's Already Built:**
- All 7 Retrofit API service interfaces (Auth, Jobs, Bids, Messages, Payments, Reviews, Notifications)
- All domain models and DTOs
- All repository implementations with caching
- 30+ use cases across all business domains
- Room database with 6 entities
- Complete Hilt DI setup
- JWT token management with interceptors
- FCM push notification service
- Material 3 theme (colors, typography, dimensions)
- Navigation graph with 8 routes

**Screens Implemented (Artisan-focused):**
1. SplashScreen - Token check & routing
2. LoginScreen - Email/password authentication
3. RegisterScreen - Multi-step registration (skeleton)
4. ArtisanHomeScreen - Dashboard (skeleton)
5. JobsScreen - Browse nearby jobs (partial)
6. BidsScreen - View submitted bids (skeleton)
7. ProfileScreen - Profile management (skeleton)

**What Needs Completion:**
1. Full CLIENT role implementation (job posting, bid management, payments)
2. Full ADMIN role implementation (user management, moderation, escrow)
3. Complete screen UI implementations
4. Real-time Socket.IO integration
5. Location services with permission handling
6. Camera/gallery image handling
7. Payment flow integration
8. Comprehensive testing

---

## Backend API Reference

### Base Configuration
```kotlin
// Production
const val BASE_URL = "https://api.taska.co.za/api/v1/"
// Debug (Android Emulator)
const val DEBUG_URL = "http://10.0.2.2:3000/api/v1/"
```

### Authentication Endpoints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login | No |
| POST | `/auth/logout` | Logout | Yes |
| POST | `/auth/refresh-token` | Refresh access token | No |
| GET | `/auth/profile` | Get current user profile | Yes |
| POST | `/auth/verify-email` | Verify email with token | No |
| POST | `/auth/request-password-reset` | Request password reset | No |
| POST | `/auth/reset-password` | Reset password with token | No |
| POST | `/auth/change-password` | Change password | Yes |
| GET | `/auth/sessions` | Get active sessions | Yes |
| POST | `/auth/sessions/:id/terminate` | End specific session | Yes |

### Jobs Endpoints (CLIENT creates, ARTISAN browses)
| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/jobs` | List all jobs (with filters) | All |
| POST | `/jobs` | Create new job | CLIENT |
| GET | `/jobs/:id` | Get job details | All |
| PATCH | `/jobs/:id` | Update job | CLIENT, ADMIN |
| DELETE | `/jobs/:id` | Delete job | CLIENT, ADMIN |
| GET | `/jobs/my-jobs` | Get user's jobs | CLIENT |
| GET | `/jobs/nearby` | Find jobs near location | ARTISAN |
| GET | `/jobs/search` | Search jobs by keyword | All |
| GET | `/jobs/artisan/active` | Get active projects | ARTISAN |
| PUT | `/jobs/:id/publish` | Publish draft job | CLIENT |
| PUT | `/jobs/:id/complete` | Mark job complete | CLIENT, ARTISAN |
| PUT | `/jobs/:id/cancel` | Cancel job | CLIENT, ADMIN |
| POST | `/jobs/upload-image` | Upload single image | CLIENT |
| POST | `/jobs/upload-images` | Upload multiple images (max 5) | CLIENT |

### Bids Endpoints
| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/bids` | Submit bid | ARTISAN |
| GET | `/bids` | List bids with filters | All |
| GET | `/bids/:id` | Get bid details | All |
| PATCH | `/bids/:id` | Update bid | ARTISAN |
| GET | `/bids/my-bids` | Get artisan's bids | ARTISAN |
| GET | `/bids/job/:jobId` | Get bids for job | CLIENT, ADMIN |
| GET | `/bids/job/:jobId/analytics` | Bid analytics | CLIENT, ADMIN |
| POST | `/bids/:id/accept` | Accept bid | CLIENT, ADMIN |
| POST | `/bids/:id/reject` | Reject bid | CLIENT, ADMIN |
| POST | `/bids/:id/withdraw` | Withdraw bid | ARTISAN |

### Messages Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/messages` | Send message |
| GET | `/messages` | Get messages with filters |
| GET | `/messages/conversations` | Get all conversations |
| POST | `/messages/mark-read` | Mark messages as read |
| GET | `/messages/unread-count` | Get unread count |
| POST | `/messages/upload` | Upload attachment |
| GET | `/messages/job/:jobId` | Get messages for job |

### Payments Endpoints
| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/payments/create-intent` | Create payment intent | CLIENT |
| POST | `/payments/process-success` | Process success | All |
| POST | `/payments/process-failure` | Process failure | All |
| GET | `/payments/:id` | Get payment details | All |
| GET | `/payments` | Get user payments | All |
| PATCH | `/payments/:id/release` | Release to artisan | ADMIN, CLIENT |
| PATCH | `/payments/:id/refund` | Refund payment | ADMIN |

### Wallets Endpoints (ARTISAN only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/wallets/balance` | Get wallet balance |
| GET | `/wallets/transactions` | Get transaction history |
| POST | `/wallets/withdraw` | Request withdrawal |
| GET | `/wallets/statistics` | Get earnings statistics |
| GET | `/wallets/pending` | Get pending withdrawals |
| DELETE | `/wallets/withdraw/:id` | Cancel withdrawal |

### Reviews Endpoints
| Method | Endpoint | Description | Public |
|--------|----------|-------------|--------|
| POST | `/reviews` | Create review | No |
| GET | `/reviews` | Get reviews with filters | Yes |
| GET | `/reviews/:id` | Get specific review | Yes |
| PATCH | `/reviews/:id` | Update review (48h window) | No |
| DELETE | `/reviews/:id` | Delete review | No |
| POST | `/reviews/:id/respond` | Respond to review | No |
| GET | `/reviews/job/:jobId` | Get reviews for job | Yes |
| GET | `/reviews/statistics/:userId` | User review stats | Yes |
| GET | `/reviews/public/user/:userId/reviews` | Public user reviews | Yes |

### Notifications Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications` | Get user notifications |
| POST | `/notifications/:id/read` | Mark as read |
| POST | `/notifications/read-all` | Mark all as read |
| DELETE | `/notifications/:id` | Delete notification |

### Admin Endpoints (ADMIN role only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/users` | Get all users |
| GET | `/admin/users/:id` | Get user details |
| POST | `/admin/users/:id/ban` | Ban user |
| POST | `/admin/users/:id/suspend` | Suspend user |
| PATCH | `/admin/users/:id/verify` | Verify artisan |
| GET | `/admin/dashboard/metrics` | Dashboard metrics |
| GET | `/admin/analytics` | Platform analytics |
| GET | `/admin/moderation` | Moderation queue |
| POST | `/admin/moderation/content` | Moderate content |
| GET | `/admin/escrow/config` | Get escrow config |
| PUT | `/admin/escrow/config` | Update escrow config |
| GET | `/admin/escrow/holds` | Get escrow holds |
| POST | `/admin/escrow/holds/:id/release` | Release escrow |
| POST | `/admin/escrow/holds/:id/refund` | Refund escrow |
| GET | `/admin/payments` | Get all payments |
| POST | `/admin/payments/:id/approve` | Approve payment |
| POST | `/admin/payments/:id/reject` | Reject payment |

---

## Implementation Plan

### Phase 1: Complete Authentication & Navigation (Priority: CRITICAL)

**Tasks:**
1. Fix RegisterScreen implementation
   - Multi-step wizard (role selection, details, verification)
   - Support CLIENT and ARTISAN registration
   - Field validation with proper error messages
   - Profile picture upload

2. Implement role-based navigation
   ```kotlin
   sealed class AppDestination {
       // Auth routes
       object Splash, Login, Register, ForgotPassword

       // Client routes
       object ClientHome, ClientJobs, ClientJobDetail, CreateJob
       object ClientBids, ClientBidDetail, ClientPayments
       object ClientMessages, ClientProfile, ClientSettings

       // Artisan routes (partially done)
       object ArtisanHome, ArtisanJobs, ArtisanBids
       object ArtisanProjects, ArtisanEarnings, ArtisanProfile

       // Admin routes
       object AdminDashboard, AdminUsers, AdminUserDetail
       object AdminModeration, AdminEscrow, AdminPayments
       object AdminAnalytics, AdminSettings
   }
   ```

3. Session management
   - Token refresh on 401
   - Auto-logout on token expiry
   - Multiple device session handling

### Phase 2: CLIENT Role Implementation (Priority: HIGH)

**Screens to Build:**

#### ClientHomeScreen
```kotlin
@Composable
fun ClientHomeScreen(navController: NavController, viewModel: ClientHomeViewModel) {
    // Display:
    // - Active jobs count, Total spent, Completed jobs
    // - Recent jobs (last 5) with status badges
    // - Pending bids requiring action
    // - Recent messages preview
    // - FAB: Create new job
}
```

#### CreateJobScreen (Multi-step wizard)
```kotlin
// Step 1: Category selection (grid of categories)
// Step 2: Job details (title, description, requirements)
// Step 3: Budget & timeline (amount, type, urgency, dates)
// Step 4: Location (address input, map preview)
// Step 5: Images (camera/gallery, max 5)
// Step 6: Review & submit
```

#### ClientJobsScreen
```kotlin
// - Tab layout: All | Draft | Open | In Progress | Completed
// - Job cards with bid counts, status badges
// - Pull-to-refresh
// - Empty states for each tab
```

#### ClientJobDetailScreen
```kotlin
// - Job info (images carousel, details, location map)
// - Bids section with artisan cards
// - Accept/reject bid actions
// - Messages button (opens conversation)
// - Edit/delete/cancel actions based on status
```

#### ClientBidsScreen
```kotlin
// - List of all bids received across jobs
// - Filter by status (Pending, Accepted, Rejected)
// - Sort by date, amount
// - Artisan preview with ratings
```

#### ClientPaymentsScreen
```kotlin
// - Payment history with status
// - Pending payments with "Pay Now" action
// - Payment details modal
// - Receipt download
```

### Phase 3: Complete ARTISAN Implementation (Priority: HIGH)

**Enhance Existing Screens:**

#### ArtisanHomeScreen (Complete implementation)
```kotlin
// Dashboard cards:
// - Total earnings, This month earnings
// - Success rate percentage
// - Average rating with stars
// - Available jobs near me (count + preview)
// - Active projects (count + preview)
// - Recent bids with status
// Quick actions: Find Jobs, View Bids, My Projects
```

#### JobsScreen (Enhance with filters)
```kotlin
// Filter drawer with:
// - Category multi-select
// - Distance slider (1-100km)
// - Budget range (min-max)
// - Urgency level checkboxes
// - Posted within dropdown
// - Verified clients only toggle

// Job card improvements:
// - Distance from current location
// - Client verification badge
// - Budget display with type
// - Urgency indicator
// - Posted time ago
```

#### BidsScreen (Complete implementation)
```kotlin
// Tab layout: All | Pending | Accepted | Rejected | Withdrawn
// Bid cards with:
// - Job title and client info
// - Bid amount and estimated days
// - Status badge with color
// - Submitted date
// - Actions: View Job, Withdraw (if pending)
```

#### ArtisanEarningsScreen (New)
```kotlin
// Summary cards:
// - Total earnings, Available balance, Pending
// - This month, Last month comparison
// Earnings chart (last 6 months)
// Transaction history list
// Withdraw button (opens withdrawal flow)
```

#### ArtisanProjectsScreen (New)
```kotlin
// Active projects (accepted bids with status IN_PROGRESS)
// Project cards with:
// - Job details, client info
// - Progress indicator
// - Message client button
// - Mark complete button
// Completed projects history
```

### Phase 4: ADMIN Role Implementation (Priority: MEDIUM)

**Screens to Build:**

#### AdminDashboardScreen
```kotlin
// Metrics cards:
// - Total users (new today)
// - Total jobs (active)
// - Total revenue (this month)
// - Pending verifications
// Charts:
// - User growth (line chart)
// - Revenue trend (bar chart)
// - Jobs by category (pie chart)
// Quick actions: Pending verifications, Flagged content, Pending payments
```

#### AdminUsersScreen
```kotlin
// User list with filters:
// - Role filter (Client, Artisan, Admin)
// - Status filter (Active, Suspended, Banned)
// - Verification status
// - Search by name/email
// User cards with:
// - Profile picture, name, email
// - Role badge, status badge
// - Actions: View, Suspend, Ban, Verify
```

#### AdminUserDetailScreen
```kotlin
// Full user profile
// Activity history
// Jobs/bids/reviews summary
// Action buttons: Suspend, Ban, Verify, Reset Password
// Moderation notes section
```

#### AdminModerationScreen
```kotlin
// Tabs: Reported Content | Flagged Reviews | Disputes
// Content cards with:
// - Content preview
// - Reporter info, reason
// - Actions: Approve, Remove, Warn User
```

#### AdminEscrowScreen
```kotlin
// Escrow holds list with filters
// Hold cards with:
// - Job info, amount
// - Payer/payee info
// - Hold status, duration
// - Actions: Release, Refund, Investigate
// Escrow configuration panel
```

#### AdminPaymentsScreen
```kotlin
// Payment list with filters:
// - Status (Pending, Processing, Completed, Failed)
// - Date range
// - Amount range
// Payment cards with:
// - Transaction ID, amount
// - Payer/payee info
// - Status, method
// - Actions: Approve, Reject, Hold, Release
```

### Phase 5: Real-time & Communication (Priority: HIGH)

**Socket.IO Integration:**
```kotlin
class SocketManager @Inject constructor(
    private val preferencesManager: PreferencesManager
) {
    private var socket: Socket? = null

    fun connect() {
        val token = preferencesManager.getAccessToken()
        val options = IO.Options().apply {
            auth = mapOf("token" to token)
            reconnection = true
            reconnectionAttempts = 5
        }
        socket = IO.socket(SOCKET_URL, options)
        socket?.connect()
    }

    // Events to handle:
    // - "message:new" -> New message received
    // - "bid:new" -> New bid on your job (CLIENT)
    // - "bid:accepted" -> Your bid was accepted (ARTISAN)
    // - "payment:received" -> Payment received (ARTISAN)
    // - "job:status" -> Job status changed
}
```

**Messaging Screen:**
```kotlin
@Composable
fun ConversationsScreen() {
    // List of conversations grouped by job
    // Unread count badges
    // Last message preview
    // Tap to open chat
}

@Composable
fun ChatScreen(jobId: String, recipientId: String) {
    // Message bubbles (sent/received styling)
    // Image/file attachments
    // Typing indicator
    // Send message input with attachment button
    // Real-time message updates via Socket
}
```

### Phase 6: Location & Camera Services (Priority: MEDIUM)

**Location Manager Implementation:**
```kotlin
class LocationManagerImpl @Inject constructor(
    private val fusedLocationClient: FusedLocationProviderClient
) : LocationManager {

    override suspend fun getCurrentLocation(): Location? {
        // Request permissions if needed
        // Get last known or request fresh location
        // Return lat/lng
    }

    override fun getLocationUpdates(): Flow<Location> {
        // Continuous location updates for nearby jobs
    }

    override fun calculateDistance(from: Location, to: Location): Float {
        // Haversine formula for distance
    }
}
```

**Camera Integration:**
```kotlin
@Composable
fun ImagePickerBottomSheet(
    onImageSelected: (List<Uri>) -> Unit,
    maxImages: Int = 5
) {
    // Options: Camera, Gallery
    // Camera: Use CameraX
    // Gallery: Use ActivityResultContracts.GetMultipleContents
    // Image preview with remove option
    // Compression before upload
}
```

### Phase 7: Payments Integration (Priority: HIGH)

**Payment Flow:**
```kotlin
// 1. Create payment intent
data class CreatePaymentIntent(
    val jobId: String,
    val amount: BigDecimal,
    val paymentMethod: PaymentMethod
)

// 2. Integrate with payment providers
sealed class PaymentProvider {
    object Stripe : PaymentProvider()  // International cards
    object PayFast : PaymentProvider() // South African payments
}

// 3. Handle payment result
sealed class PaymentResult {
    data class Success(val transactionId: String) : PaymentResult()
    data class Failed(val error: String) : PaymentResult()
    object Cancelled : PaymentResult()
}
```

**PaymentScreen:**
```kotlin
@Composable
fun PaymentScreen(jobId: String, amount: BigDecimal) {
    // Payment method selection
    // Amount summary with platform fee
    // Secure payment form (Stripe Elements or PayFast)
    // Processing state
    // Success/failure result
}
```

---

## Testing Requirements

### Unit Tests (Required Coverage: >80%)

**Location:** `app/src/test/kotlin/za/co/taska/`

#### ViewModel Tests
```kotlin
// Test each ViewModel with:
// - Initial state verification
// - Action handling
// - State updates
// - Error handling
// - Loading states

class ClientHomeViewModelTest {
    @Test fun `initial state should show loading`()
    @Test fun `loadDashboard should update stats on success`()
    @Test fun `loadDashboard should show error on failure`()
    @Test fun `refresh should reload all data`()
}
```

#### UseCase Tests
```kotlin
// Test business logic with mocked repositories
class CreateJobUseCaseTest {
    @Test fun `execute with valid data should return success`()
    @Test fun `execute with invalid title should return validation error`()
    @Test fun `execute with network error should return failure`()
}
```

#### Repository Tests
```kotlin
// Test data layer with MockWebServer
class JobsRepositoryTest {
    @Test fun `getJobs should return cached data when available`()
    @Test fun `getJobs should fetch from network when cache expired`()
    @Test fun `createJob should post and update cache`()
}
```

#### Mapper Tests
```kotlin
// Test DTO <-> Domain mapping
class JobMapperTest {
    @Test fun `toJob should map all fields correctly`()
    @Test fun `toJobDto should map domain to request`()
}
```

### Integration Tests

**Location:** `app/src/androidTest/kotlin/za/co/taska/`

#### API Integration Tests
```kotlin
@HiltAndroidTest
class AuthApiIntegrationTest {
    @Test fun `login with valid credentials should return tokens`()
    @Test fun `login with invalid credentials should return 401`()
    @Test fun `register should create user and return tokens`()
}
```

#### Database Integration Tests
```kotlin
@HiltAndroidTest
class JobsDaoTest {
    @Test fun `insertJob should add to database`()
    @Test fun `getJobsByStatus should filter correctly`()
    @Test fun `deleteJob should remove from database`()
}
```

### UI Tests (Compose)

**Location:** `app/src/androidTest/kotlin/za/co/taska/ui/`

#### Screen Tests
```kotlin
class LoginScreenTest {
    @get:Rule val composeTestRule = createComposeRule()

    @Test fun `login button should be disabled with empty fields`()
    @Test fun `should show error for invalid email format`()
    @Test fun `should navigate to dashboard on successful login`()
}

class CreateJobScreenTest {
    @Test fun `should navigate through all wizard steps`()
    @Test fun `should validate required fields before next`()
    @Test fun `should show image picker on add image click`()
    @Test fun `should submit job on final step`()
}
```

#### Navigation Tests
```kotlin
class NavigationTest {
    @Test fun `client should navigate to client routes only`()
    @Test fun `artisan should navigate to artisan routes only`()
    @Test fun `admin should navigate to admin routes only`()
    @Test fun `unauthenticated user should redirect to login`()
}
```

### End-to-End Tests

#### User Journey Tests
```kotlin
class ClientJourneyTest {
    @Test fun `complete job posting flow`() {
        // Register as CLIENT
        // Create job with all details
        // Verify job appears in my jobs
        // Receive bid notification
        // Accept bid
        // Make payment
        // Mark job complete
        // Leave review
    }
}

class ArtisanJourneyTest {
    @Test fun `complete bidding flow`() {
        // Register as ARTISAN
        // Browse jobs
        // Submit bid
        // Bid accepted notification
        // Complete project
        // Receive payment
        // Check earnings
    }
}
```

### Test Utilities

```kotlin
// Fake repository for testing
class FakeJobsRepository : JobsRepository {
    private val jobs = mutableListOf<Job>()

    override suspend fun getJobs(): Resource<List<Job>> = Resource.Success(jobs)
    override suspend fun createJob(job: CreateJobRequest): Resource<Job> { ... }
    // ... implement all methods with test data
}

// Test data builders
object TestData {
    fun createJob(
        id: String = UUID.randomUUID().toString(),
        title: String = "Test Job",
        status: JobStatus = JobStatus.OPEN
    ) = Job(id, title, status, ...)

    fun createBid(...) = Bid(...)
    fun createUser(...) = User(...)
}
```

---

## Code Quality Requirements

### Kotlin Style
- Follow Kotlin coding conventions
- Use data classes for DTOs and models
- Prefer sealed classes for state/result types
- Use extension functions for utilities
- Avoid nullable types where possible

### Compose Best Practices
- Extract reusable composables
- Use `remember` and `derivedStateOf` appropriately
- Handle configuration changes
- Support dark/light themes
- Accessibility (content descriptions, semantic properties)

### Architecture Rules
- ViewModels should not reference Android framework
- Use Cases contain business logic only
- Repositories abstract data sources
- Mappers handle all conversions
- No business logic in Composables

### Error Handling
```kotlin
sealed class Resource<T> {
    data class Success<T>(val data: T) : Resource<T>()
    data class Error<T>(val message: String, val code: Int? = null) : Resource<T>()
    class Loading<T> : Resource<T>()
}

// Use in ViewModels
when (val result = useCase.execute(params)) {
    is Resource.Success -> updateState { copy(data = result.data, isLoading = false) }
    is Resource.Error -> updateState { copy(error = result.message, isLoading = false) }
    is Resource.Loading -> updateState { copy(isLoading = true) }
}
```

---

## File Structure to Create

```
app/src/main/kotlin/za/co/taska/
├── presentation/
│   ├── screens/
│   │   ├── client/
│   │   │   ├── home/
│   │   │   │   ├── ClientHomeScreen.kt
│   │   │   │   ├── ClientHomeViewModel.kt
│   │   │   │   └── ClientHomeState.kt
│   │   │   ├── jobs/
│   │   │   │   ├── ClientJobsScreen.kt
│   │   │   │   ├── ClientJobDetailScreen.kt
│   │   │   │   ├── CreateJobScreen.kt
│   │   │   │   └── [ViewModels...]
│   │   │   ├── bids/
│   │   │   │   ├── ClientBidsScreen.kt
│   │   │   │   └── [ViewModels...]
│   │   │   ├── payments/
│   │   │   │   ├── ClientPaymentsScreen.kt
│   │   │   │   ├── PaymentScreen.kt
│   │   │   │   └── [ViewModels...]
│   │   │   ├── messages/
│   │   │   │   ├── ConversationsScreen.kt
│   │   │   │   ├── ChatScreen.kt
│   │   │   │   └── [ViewModels...]
│   │   │   └── profile/
│   │   │       ├── ClientProfileScreen.kt
│   │   │       └── ClientSettingsScreen.kt
│   │   ├── artisan/
│   │   │   ├── home/
│   │   │   │   └── [Complete existing]
│   │   │   ├── jobs/
│   │   │   │   └── [Enhance existing]
│   │   │   ├── bids/
│   │   │   │   └── [Complete existing]
│   │   │   ├── projects/
│   │   │   │   ├── ArtisanProjectsScreen.kt
│   │   │   │   └── ProjectDetailScreen.kt
│   │   │   ├── earnings/
│   │   │   │   ├── EarningsScreen.kt
│   │   │   │   └── WithdrawScreen.kt
│   │   │   └── profile/
│   │   │       └── [Complete existing]
│   │   ├── admin/
│   │   │   ├── dashboard/
│   │   │   │   ├── AdminDashboardScreen.kt
│   │   │   │   └── AdminDashboardViewModel.kt
│   │   │   ├── users/
│   │   │   │   ├── AdminUsersScreen.kt
│   │   │   │   ├── AdminUserDetailScreen.kt
│   │   │   │   └── [ViewModels...]
│   │   │   ├── moderation/
│   │   │   │   ├── ModerationScreen.kt
│   │   │   │   └── [ViewModels...]
│   │   │   ├── escrow/
│   │   │   │   ├── EscrowManagementScreen.kt
│   │   │   │   └── [ViewModels...]
│   │   │   ├── payments/
│   │   │   │   ├── AdminPaymentsScreen.kt
│   │   │   │   └── [ViewModels...]
│   │   │   └── analytics/
│   │   │       ├── AnalyticsScreen.kt
│   │   │       └── [ViewModels...]
│   │   └── common/
│   │       ├── MessagesScreen.kt (shared)
│   │       └── ReviewsScreen.kt (shared)
│   ├── components/
│   │   ├── cards/
│   │   │   ├── JobCard.kt
│   │   │   ├── BidCard.kt
│   │   │   ├── UserCard.kt
│   │   │   └── PaymentCard.kt
│   │   ├── dialogs/
│   │   │   ├── ConfirmDialog.kt
│   │   │   ├── FilterDialog.kt
│   │   │   └── ImagePickerDialog.kt
│   │   ├── inputs/
│   │   │   ├── SearchBar.kt
│   │   │   ├── LocationPicker.kt
│   │   │   └── ImageUploader.kt
│   │   ├── charts/
│   │   │   ├── LineChart.kt
│   │   │   ├── BarChart.kt
│   │   │   └── PieChart.kt
│   │   └── common/
│   │       ├── LoadingIndicator.kt
│   │       ├── ErrorMessage.kt
│   │       ├── EmptyState.kt
│   │       └── StatusBadge.kt
│   └── navigation/
│       ├── NavGraph.kt (enhance)
│       ├── ClientNavGraph.kt
│       ├── ArtisanNavGraph.kt
│       └── AdminNavGraph.kt
├── domain/
│   └── usecase/
│       ├── client/
│       │   ├── GetClientDashboardUseCase.kt
│       │   ├── GetClientJobsUseCase.kt
│       │   └── AcceptBidUseCase.kt
│       └── admin/
│           ├── GetAdminMetricsUseCase.kt
│           ├── BanUserUseCase.kt
│           ├── VerifyArtisanUseCase.kt
│           └── ReleaseEscrowUseCase.kt
├── data/
│   └── remote/
│       └── api/
│           └── AdminApiService.kt (new)
└── util/
    ├── SocketManager.kt
    ├── LocationUtils.kt
    └── ImageCompressor.kt

app/src/test/kotlin/za/co/taska/
├── viewmodel/
│   ├── ClientHomeViewModelTest.kt
│   ├── CreateJobViewModelTest.kt
│   └── [All ViewModel tests...]
├── usecase/
│   ├── CreateJobUseCaseTest.kt
│   └── [All UseCase tests...]
├── repository/
│   ├── JobsRepositoryTest.kt
│   └── [All Repository tests...]
└── mapper/
    └── [All Mapper tests...]

app/src/androidTest/kotlin/za/co/taska/
├── ui/
│   ├── LoginScreenTest.kt
│   ├── CreateJobScreenTest.kt
│   └── [All Screen tests...]
├── navigation/
│   └── NavigationTest.kt
├── integration/
│   ├── AuthApiTest.kt
│   └── JobsApiTest.kt
└── e2e/
    ├── ClientJourneyTest.kt
    └── ArtisanJourneyTest.kt
```

---

## Execution Instructions

### Step 1: Setup & Verification
```bash
# Verify existing code compiles
cd taska-android
./gradlew assembleDebug

# Run existing tests
./gradlew test
```

### Step 2: Implement in Order
1. Authentication completion → Verify login/register works
2. Navigation structure → All routes defined and accessible
3. Client role → Full job posting and management flow
4. Artisan completion → Full bidding and earnings flow
5. Admin role → User management and moderation
6. Real-time features → Socket.IO messaging
7. Testing → Achieve >80% coverage

### Step 3: Testing After Each Phase
```bash
# Run unit tests
./gradlew test

# Run instrumented tests (requires emulator/device)
./gradlew connectedAndroidTest

# Generate coverage report
./gradlew jacocoTestReport
```

### Step 4: Quality Checks
```bash
# Lint checks
./gradlew lint

# Kotlin code style
./gradlew ktlintCheck

# Build release APK
./gradlew assembleRelease
```

---

## SuperClaude Framework Integration

Use these flags during implementation:

```
--task-manage     # Enable todo tracking for complex phases
--validate        # Pre-execution validation for risky changes
--loop            # Iterative improvement for UI polish
--delegate        # Split large phases into sub-tasks
--think-hard      # Deep analysis for architecture decisions
```

**Session Pattern:**
```
/sc:load → Work on phase → Checkpoint every 30 min → /sc:save
```

**Quality Gates:**
- Each phase must compile without errors
- Tests must pass before moving to next phase
- UI must be responsive and follow Material 3 guidelines
- No hardcoded strings (use strings.xml)
- No hardcoded colors (use theme)

---

## Deliverables Checklist

- [ ] All CLIENT screens implemented and tested
- [ ] All ARTISAN screens completed and tested
- [ ] All ADMIN screens implemented and tested
- [ ] Socket.IO real-time messaging working
- [ ] Location services with permission handling
- [ ] Camera/gallery image picking working
- [ ] Payment flow integrated (Stripe/PayFast)
- [ ] Push notifications handling all types
- [ ] Unit test coverage >80%
- [ ] Integration tests for all API endpoints
- [ ] UI tests for critical user journeys
- [ ] E2E tests for client and artisan flows
- [ ] No lint errors or warnings
- [ ] Release APK builds successfully
- [ ] Dark mode support
- [ ] Accessibility features (content descriptions, semantic properties)

---

## Notes

- **Backend URL**: Update `NetworkModule.kt` with correct production URL
- **API Keys**: Firebase, Stripe, PayFast keys in `local.properties`
- **Maps**: Google Maps API key for location features
- **ProGuard**: Rules already configured in `proguard-rules.pro`
- **Signing**: Release signing config needed in `build.gradle.kts`

---

**End of Prompt**

*Generated for SuperClaude Framework execution with Claude Sonnet*
