# Taska Android App - Complete Implementation Roadmap

**Version:** 1.0.0
**Target:** Feature parity with web frontend
**Architecture:** Clean Architecture (Domain → Data → Presentation)
**Framework:** Jetpack Compose + Material 3

---

## Executive Summary

This document outlines the complete implementation strategy to bring the Taska Android app to feature parity with the web application. The app will support all three user roles (CLIENT, ARTISAN, ADMIN) using the existing backend API.

**Current Status:** 60-70% complete (Data & Domain layers mostly done)
**Estimated Completion:** 8 phases, ~40-50 hours of development
**Testing Target:** >80% code coverage

---

## Phase Breakdown

### ✅ Phase 0: Foundation (COMPLETE - 60%)
**Status:** Most of data/domain layer exists
**What's Done:**
- All API service interfaces (Auth, Jobs, Bids, Messages, Payments, Reviews, Notifications)
- All domain models and DTOs
- Repository implementations with caching
- 30+ use cases across all business domains
- Room database with 6 entities
- Complete Hilt DI setup
- JWT token management with interceptors

---

### 🔄 Phase 1: Complete Authentication & Navigation (PRIORITY: CRITICAL)
**Duration:** 4-6 hours
**Goal:** Fully functional auth system with role-based routing

#### Tasks:

**1.1 Fix RegisterScreen Implementation (2 hours)**
```kotlin
// Create multi-step registration wizard
sealed class RegistrationStep {
    object RoleSelection : RegistrationStep()
    object BasicInfo : RegistrationStep()
    object ProfileDetails : RegistrationStep()
    object Verification : RegistrationStep()
}
```
- Role selection (CLIENT vs ARTISAN)
- Profile picture upload
- Field validation with proper error messages
- Email verification flow

**1.2 Implement Role-Based Navigation (2 hours)**
```kotlin
// Create comprehensive navigation graph
sealed class AppDestination(val route: String) {
    // Auth routes
    object Splash : AppDestination("splash")
    object Login : AppDestination("login")
    object Register : AppDestination("register")

    // CLIENT routes
    object ClientHome : AppDestination("client/home")
    object ClientJobs : AppDestination("client/jobs")
    object CreateJob : AppDestination("client/jobs/create")

    // ARTISAN routes (enhance existing)
    object ArtisanHome : AppDestination("artisan/home")
    object ArtisanJobs : AppDestination("artisan/jobs")

    // ADMIN routes
    object AdminDashboard : AppDestination("admin/dashboard")
    // ... etc
}
```

**1.3 Session Management (1 hour)**
- Token refresh on 401
- Auto-logout on token expiry
- Multiple device session handling

**1.4 Enhance Splash Screen (1 hour)**
- Check authentication state
- Role-based routing to correct home screen

**Deliverables:**
- [ ] Multi-step registration wizard working
- [ ] Role-based navigation graph complete
- [ ] Session management handles edge cases
- [ ] All auth flows tested (unit + UI tests)

---

### 🎯 Phase 2: CLIENT Role Implementation (PRIORITY: HIGH)
**Duration:** 12-16 hours
**Goal:** Complete job posting, bid management, and payment flows

#### 2.1 ClientHomeScreen (2 hours)
```kotlin
@Composable
fun ClientHomeScreen(
    navController: NavController,
    viewModel: ClientHomeViewModel = hiltViewModel()
) {
    // Dashboard metrics
    val stats by viewModel.dashboardStats.collectAsState()

    LazyColumn {
        item { DashboardMetricsCard(stats) }
        item { RecentJobsSection() }
        item { PendingBidsSection() }
        item { RecentMessagesPreview() }
    }

    FloatingActionButton(onClick = { navController.navigate("client/jobs/create") }) {
        Icon(Icons.Default.Add, "Create Job")
    }
}
```

**Components:**
- Dashboard metrics (active jobs, total spent, completed)
- Recent jobs (last 5 with status badges)
- Pending bids requiring action
- Recent messages preview
- FAB for job creation

#### 2.2 CreateJobScreen - Multi-Step Wizard (4 hours)
```kotlin
sealed class JobCreationStep {
    object Category : JobCreationStep()
    object Details : JobCreationStep()
    object BudgetTimeline : JobCreationStep()
    object Location : JobCreationStep()
    object Images : JobCreationStep()
    object Review : JobCreationStep()
}
```

**Step 1 - Category Selection:**
- Grid of job categories from backend
- Search/filter categories
- Hierarchical categories (parent → subcategory)

**Step 2 - Job Details:**
- Title (validation: 10-100 chars)
- Description (rich text, 50-2000 chars)
- Special requirements (tags)

**Step 3 - Budget & Timeline:**
- Budget amount with currency (ZAR)
- Budget type (FIXED, HOURLY, NEGOTIABLE)
- Urgency level (LOW, MEDIUM, HIGH)
- Preferred start date
- Estimated duration

**Step 4 - Location:**
- Address input with autocomplete
- Map preview with marker
- Geolocation integration
- Distance from current location

**Step 5 - Images:**
- Camera integration (CameraX)
- Gallery picker (max 5 images)
- Image compression before upload
- Preview with remove option

**Step 6 - Review & Submit:**
- Summary of all entered data
- Edit buttons for each section
- Terms & conditions checkbox
- Submit job (POST /jobs)

#### 2.3 ClientJobsScreen (2 hours)
```kotlin
@Composable
fun ClientJobsScreen() {
    var selectedTab by remember { mutableStateOf(JobTab.ALL) }

    TabRow(selectedTabIndex = selectedTab.ordinal) {
        Tab(selected = selectedTab == JobTab.ALL, onClick = { selectedTab = JobTab.ALL }) {
            Text("All")
        }
        // ... more tabs
    }

    LazyColumn {
        items(filteredJobs) { job ->
            JobCard(
                job = job,
                onClick = { navController.navigate("client/jobs/${job.id}") }
            )
        }
    }
}
```

**Features:**
- Tab layout (All | Draft | Open | In Progress | Completed)
- Job cards with bid counts, status badges
- Pull-to-refresh
- Empty states for each tab
- Search/filter functionality

#### 2.4 ClientJobDetailScreen (2 hours)
```kotlin
@Composable
fun ClientJobDetailScreen(jobId: String) {
    val job by viewModel.job.collectAsState()
    val bids by viewModel.bids.collectAsState()

    LazyColumn {
        item { ImageCarousel(job.images) }
        item { JobInfoSection(job) }
        item { LocationMapSection(job.location) }
        item { BidsSection(bids) }
        item { MessagesButton() }
        item { ActionButtons(job.status) }
    }
}
```

**Components:**
- Image carousel with swipe
- Job details (title, description, budget, urgency)
- Location map with marker
- Bids list with artisan cards
- Accept/reject bid actions
- Message artisan button
- Edit/delete/cancel actions based on status

#### 2.5 ClientBidsScreen (1 hour)
- List all bids received across jobs
- Filter by status (Pending, Accepted, Rejected)
- Sort by date, amount
- Artisan preview with ratings
- Navigate to bid details

#### 2.6 ClientPaymentsScreen (1 hour)
- Payment history with status
- Pending payments with "Pay Now" action
- Payment details modal
- Receipt download (PDF)

**Deliverables:**
- [ ] ClientHomeScreen with dashboard
- [ ] Complete job creation wizard (6 steps)
- [ ] Job listing with tabs and filters
- [ ] Job detail screen with bids management
- [ ] Bids and payments screens
- [ ] All CLIENT flows tested

---

### 🔧 Phase 3: Complete ARTISAN Implementation (PRIORITY: HIGH)
**Duration:** 10-12 hours
**Goal:** Full bidding system, projects, and earnings management

#### 3.1 Enhance ArtisanHomeScreen (2 hours)
```kotlin
@Composable
fun ArtisanHomeScreen() {
    val dashboard by viewModel.dashboardData.collectAsState()

    LazyColumn {
        // Dashboard cards
        item { EarningsSummaryCard(dashboard.totalEarnings, dashboard.thisMonth) }
        item { SuccessRateCard(dashboard.successRate, dashboard.rating) }
        item { NearbyJobsCard(dashboard.nearbyJobsCount) }
        item { ActiveProjectsSection(dashboard.activeProjects) }
        item { RecentBidsSection(dashboard.recentBids) }

        // Quick actions
        item {
            Row {
                QuickActionButton("Find Jobs", Icons.Default.Work)
                QuickActionButton("My Bids", Icons.Default.Assignment)
                QuickActionButton("Projects", Icons.Default.Folder)
            }
        }
    }
}
```

**Features:**
- Total earnings + This month earnings
- Success rate percentage
- Average rating with stars
- Available jobs near me (count + preview)
- Active projects preview
- Recent bids with status
- Quick action buttons

#### 3.2 Enhance JobsScreen with Advanced Filters (3 hours)
```kotlin
@Composable
fun JobsScreen() {
    var showFilters by remember { mutableStateOf(false) }
    val nearbyJobs by viewModel.nearbyJobs.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Available Jobs") },
                actions = {
                    IconButton(onClick = { showFilters = true }) {
                        Icon(Icons.Default.FilterList, "Filters")
                    }
                }
            )
        }
    ) {
        LazyColumn {
            items(nearbyJobs) { job ->
                EnhancedJobCard(job)
            }
        }
    }

    if (showFilters) {
        FilterDrawer(
            onDismiss = { showFilters = false },
            onApply = { filters -> viewModel.applyFilters(filters) }
        )
    }
}
```

**Filter Drawer:**
- Category multi-select
- Distance slider (1-100km)
- Budget range (min-max)
- Urgency level checkboxes
- Posted within dropdown (24h, 3d, 7d, 30d)
- Verified clients only toggle

**Enhanced Job Card:**
- Distance from current location
- Client verification badge
- Budget display with type
- Urgency indicator (color-coded)
- Posted time ago (relative time)
- Bid count indicator

#### 3.3 Complete BidsScreen Implementation (2 hours)
```kotlin
@Composable
fun BidsScreen() {
    var selectedTab by remember { mutableStateOf(BidTab.ALL) }

    TabRow(selectedTabIndex = selectedTab.ordinal) {
        Tab(selected = selectedTab == BidTab.ALL, onClick = { selectedTab = BidTab.ALL }) {
            Text("All")
        }
        Tab(selected = selectedTab == BidTab.PENDING, onClick = { selectedTab = BidTab.PENDING }) {
            Text("Pending")
        }
        // ... more tabs
    }

    LazyColumn {
        items(filteredBids) { bid ->
            BidCard(
                bid = bid,
                onClick = { navController.navigate("artisan/bids/${bid.id}") }
            )
        }
    }
}
```

**Features:**
- Tab layout (All | Pending | Accepted | Rejected | Withdrawn)
- Bid cards with job title, client info
- Bid amount and estimated days
- Status badge with color coding
- Submitted date
- Actions: View Job, Withdraw (if pending)

#### 3.4 NEW: ArtisanProjectsScreen (2 hours)
```kotlin
@Composable
fun ArtisanProjectsScreen() {
    val activeProjects by viewModel.activeProjects.collectAsState()
    val completedProjects by viewModel.completedProjects.collectAsState()

    var selectedTab by remember { mutableStateOf(ProjectTab.ACTIVE) }

    TabRow(selectedTabIndex = selectedTab.ordinal) {
        Tab(selected = selectedTab == ProjectTab.ACTIVE, onClick = { selectedTab = ProjectTab.ACTIVE }) {
            Text("Active (${activeProjects.size})")
        }
        Tab(selected = selectedTab == ProjectTab.COMPLETED, onClick = { selectedTab = ProjectTab.COMPLETED }) {
            Text("Completed")
        }
    }

    LazyColumn {
        when (selectedTab) {
            ProjectTab.ACTIVE -> {
                items(activeProjects) { project ->
                    ActiveProjectCard(
                        project = project,
                        onMessageClient = { /* Open chat */ },
                        onMarkComplete = { viewModel.markComplete(project.id) }
                    )
                }
            }
            ProjectTab.COMPLETED -> {
                items(completedProjects) { project ->
                    CompletedProjectCard(project)
                }
            }
        }
    }
}
```

**Active Project Card:**
- Job title and client info
- Progress indicator (milestones)
- Earnings amount
- Message client button
- Mark complete button
- View details link

#### 3.5 NEW: ArtisanEarningsScreen (2 hours)
```kotlin
@Composable
fun ArtisanEarningsScreen() {
    val wallet by viewModel.walletBalance.collectAsState()
    val transactions by viewModel.transactions.collectAsState()

    LazyColumn {
        // Summary cards
        item { TotalEarningsCard(wallet.totalEarnings) }
        item { AvailableBalanceCard(wallet.availableBalance) }
        item { PendingAmountCard(wallet.pending) }
        item { MonthComparisonCard(wallet.thisMonth, wallet.lastMonth) }

        // Earnings chart (last 6 months)
        item { EarningsChart(viewModel.chartData.collectAsState().value) }

        // Transaction history
        item { Text("Transaction History", style = MaterialTheme.typography.titleMedium) }
        items(transactions) { transaction ->
            TransactionCard(transaction)
        }

        // Withdraw button
        item {
            Button(
                onClick = { navController.navigate("artisan/earnings/withdraw") },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Request Withdrawal")
            }
        }
    }
}
```

**Features:**
- Wallet summary (total, available, pending)
- Month-over-month comparison
- Line chart showing last 6 months
- Transaction history list
- Withdrawal flow

**Deliverables:**
- [ ] Enhanced artisan dashboard
- [ ] Advanced job filters
- [ ] Complete bids management
- [ ] Projects screen (active + completed)
- [ ] Earnings screen with withdrawal
- [ ] All ARTISAN flows tested

---

### 👑 Phase 4: ADMIN Role Implementation (PRIORITY: MEDIUM)
**Duration:** 8-10 hours
**Goal:** Full admin panel for platform management

#### 4.1 AdminDashboardScreen (2 hours)
- Platform metrics (users, jobs, revenue)
- Charts (user growth, revenue trend, jobs by category)
- Quick actions (verifications, moderation, payments)

#### 4.2 AdminUsersScreen (2 hours)
- User list with filters (role, status, verification)
- Search by name/email
- User cards with actions (View, Suspend, Ban, Verify)

#### 4.3 AdminUserDetailScreen (1 hour)
- Full user profile
- Activity history
- Jobs/bids/reviews summary
- Action buttons

#### 4.4 AdminModerationScreen (1.5 hours)
- Reported content queue
- Flagged reviews
- Dispute resolution
- Moderation actions

#### 4.5 AdminEscrowScreen (1.5 hours)
- Escrow holds list
- Release/refund actions
- Configuration panel

#### 4.6 AdminPaymentsScreen (1 hour)
- All payments with filters
- Approve/reject actions
- Transaction details

**Deliverables:**
- [ ] Complete admin dashboard
- [ ] User management system
- [ ] Moderation tools
- [ ] Escrow management
- [ ] Payment administration
- [ ] Admin flows tested

---

### 💬 Phase 5: Real-time Socket.IO Messaging (PRIORITY: HIGH)
**Duration:** 6-8 hours
**Goal:** Full messaging system with real-time updates

#### 5.1 SocketManager Implementation (2 hours)
```kotlin
class SocketManager @Inject constructor(
    private val preferencesManager: PreferencesManager
) {
    private var socket: Socket? = null
    private val _connectionState = MutableStateFlow<ConnectionState>(ConnectionState.Disconnected)
    val connectionState = _connectionState.asStateFlow()

    fun connect() {
        val token = preferencesManager.getAccessToken()
        val options = IO.Options().apply {
            auth = mapOf("token" to token)
            reconnection = true
            reconnectionAttempts = 5
            reconnectionDelay = 1000
        }

        socket = IO.socket(SOCKET_URL, options).apply {
            on(Socket.EVENT_CONNECT) { _connectionState.value = ConnectionState.Connected }
            on(Socket.EVENT_DISCONNECT) { _connectionState.value = ConnectionState.Disconnected }
            on("message:new") { handleNewMessage(it) }
            on("bid:new") { handleNewBid(it) }
            on("bid:accepted") { handleBidAccepted(it) }
            on("payment:received") { handlePaymentReceived(it) }
            on("job:status") { handleJobStatusChange(it) }
        }
        socket?.connect()
    }

    fun sendMessage(recipientId: String, content: String, jobId: String?) {
        socket?.emit("message:send", JSONObject().apply {
            put("recipientId", recipientId)
            put("content", content)
            jobId?.let { put("jobId", it) }
        })
    }
}
```

#### 5.2 ConversationsScreen (2 hours)
```kotlin
@Composable
fun ConversationsScreen() {
    val conversations by viewModel.conversations.collectAsState()

    LazyColumn {
        items(conversations) { conversation ->
            ConversationCard(
                conversation = conversation,
                onClick = {
                    navController.navigate("messages/chat/${conversation.id}")
                }
            )
        }
    }
}
```

**Features:**
- List of conversations grouped by job
- Unread count badges
- Last message preview with timestamp
- User avatar and name
- Swipe to delete

#### 5.3 ChatScreen (2 hours)
```kotlin
@Composable
fun ChatScreen(conversationId: String) {
    val messages by viewModel.messages.collectAsState()
    val typingIndicator by viewModel.isOtherUserTyping.collectAsState()

    Scaffold(
        topBar = {
            ChatTopBar(
                userName = conversation.otherUser.name,
                jobTitle = conversation.job?.title
            )
        }
    ) {
        Column {
            // Messages list
            LazyColumn(
                modifier = Modifier.weight(1f),
                reverseLayout = true
            ) {
                item { if (typingIndicator) TypingIndicator() }
                items(messages) { message ->
                    MessageBubble(
                        message = message,
                        isOwnMessage = message.senderId == currentUserId
                    )
                }
            }

            // Input area
            ChatInputBar(
                onSendMessage = { text -> viewModel.sendMessage(text) },
                onAttachFile = { uri -> viewModel.attachFile(uri) }
            )
        }
    }
}
```

**Features:**
- Message bubbles (sent/received styling)
- Typing indicator
- Image/file attachments
- Message timestamps
- Read receipts (double checkmark)
- Auto-scroll to latest

**Deliverables:**
- [ ] Socket.IO manager with reconnection
- [ ] Conversations list
- [ ] Real-time chat interface
- [ ] Typing indicators
- [ ] File attachments
- [ ] Push notification integration
- [ ] Messaging tests

---

### 📍 Phase 6: Location & Camera Services (PRIORITY: MEDIUM)
**Duration:** 4-6 hours
**Goal:** Location services and camera integration

#### 6.1 LocationManager Implementation (2 hours)
```kotlin
class LocationManagerImpl @Inject constructor(
    private val fusedLocationClient: FusedLocationProviderClient,
    private val context: Context
) : LocationManager {

    @RequiresPermission(anyOf = [
        Manifest.permission.ACCESS_FINE_LOCATION,
        Manifest.permission.ACCESS_COARSE_LOCATION
    ])
    override suspend fun getCurrentLocation(): Location? {
        return suspendCancellableCoroutine { continuation ->
            fusedLocationClient.lastLocation
                .addOnSuccessListener { location ->
                    continuation.resume(location)
                }
                .addOnFailureListener { exception ->
                    continuation.resumeWithException(exception)
                }
        }
    }

    override fun getLocationUpdates(): Flow<Location> = callbackFlow {
        val locationCallback = object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {
                result.lastLocation?.let { trySend(it) }
            }
        }

        val locationRequest = LocationRequest.Builder(
            Priority.PRIORITY_HIGH_ACCURACY,
            10000 // 10 seconds
        ).build()

        fusedLocationClient.requestLocationUpdates(
            locationRequest,
            locationCallback,
            Looper.getMainLooper()
        )

        awaitClose { fusedLocationClient.removeLocationUpdates(locationCallback) }
    }

    override fun calculateDistance(from: Location, to: Location): Float {
        val results = FloatArray(1)
        android.location.Location.distanceBetween(
            from.latitude, from.longitude,
            to.latitude, to.longitude,
            results
        )
        return results[0] / 1000 // Convert to km
    }
}
```

#### 6.2 Permission Handler (1 hour)
```kotlin
@Composable
fun LocationPermissionHandler(
    onPermissionGranted: () -> Unit,
    onPermissionDenied: () -> Unit
) {
    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        when {
            permissions[Manifest.permission.ACCESS_FINE_LOCATION] == true ||
            permissions[Manifest.permission.ACCESS_COARSE_LOCATION] == true -> {
                onPermissionGranted()
            }
            else -> {
                onPermissionDenied()
            }
        }
    }

    LaunchedEffect(Unit) {
        permissionLauncher.launch(arrayOf(
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION
        ))
    }
}
```

#### 6.3 Camera Integration (2 hours)
```kotlin
@Composable
fun ImagePickerBottomSheet(
    onImageSelected: (List<Uri>) -> Unit,
    maxImages: Int = 5,
    onDismiss: () -> Unit
) {
    var selectedUris by remember { mutableStateOf<List<Uri>>(emptyList()) }

    val cameraLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.TakePicture()
    ) { success ->
        if (success) {
            // Handle captured image
        }
    }

    val galleryLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.GetMultipleContents()
    ) { uris ->
        selectedUris = uris.take(maxImages)
    }

    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column {
            // Camera option
            ListItem(
                headlineContent = { Text("Take Photo") },
                leadingContent = { Icon(Icons.Default.Camera, null) },
                modifier = Modifier.clickable {
                    cameraLauncher.launch(createImageUri())
                }
            )

            // Gallery option
            ListItem(
                headlineContent = { Text("Choose from Gallery") },
                leadingContent = { Icon(Icons.Default.PhotoLibrary, null) },
                modifier = Modifier.clickable {
                    galleryLauncher.launch("image/*")
                }
            )

            // Preview selected images
            if (selectedUris.isNotEmpty()) {
                LazyRow {
                    items(selectedUris) { uri ->
                        ImagePreview(uri = uri, onRemove = { /* Remove */ })
                    }
                }
            }

            // Confirm button
            Button(
                onClick = { onImageSelected(selectedUris) },
                enabled = selectedUris.isNotEmpty()
            ) {
                Text("Confirm (${selectedUris.size}/$maxImages)")
            }
        }
    }
}
```

**Deliverables:**
- [ ] Location manager with Flow support
- [ ] Permission handling UI
- [ ] Camera integration (CameraX)
- [ ] Gallery picker (multi-select)
- [ ] Image compression
- [ ] Location/camera tests

---

### 💳 Phase 7: Payment Integration (PRIORITY: HIGH)
**Duration:** 6-8 hours
**Goal:** Full payment processing with Stripe/PayFast

#### 7.1 Payment Flow Implementation (3 hours)
```kotlin
// PaymentViewModel.kt
class PaymentViewModel @Inject constructor(
    private val initiatePaymentUseCase: InitiatePaymentUseCase,
    private val processPaymentUseCase: ProcessPaymentUseCase
) : ViewModel() {

    fun initiatePayment(jobId: String, amount: BigDecimal, provider: PaymentProvider) {
        viewModelScope.launch {
            _state.value = PaymentState.Loading

            when (val result = initiatePaymentUseCase(jobId, amount, provider)) {
                is Resource.Success -> {
                    // Open payment provider UI
                    _paymentIntent.value = result.data
                    _state.value = PaymentState.ReadyForPayment
                }
                is Resource.Error -> {
                    _state.value = PaymentState.Error(result.message)
                }
                is Resource.Loading -> {
                    _state.value = PaymentState.Loading
                }
            }
        }
    }
}
```

#### 7.2 Stripe Integration (2 hours)
```kotlin
@Composable
fun StripePaymentScreen(
    jobId: String,
    amount: BigDecimal,
    viewModel: PaymentViewModel = hiltViewModel()
) {
    val paymentIntent by viewModel.paymentIntent.collectAsState()

    // Stripe UI integration
    StripeContainer(
        publishableKey = STRIPE_PUBLISHABLE_KEY,
        stripeAccountId = null
    ) {
        Column {
            // Payment summary
            PaymentSummaryCard(
                amount = amount,
                platformFee = amount * 0.05.toBigDecimal(),
                total = amount * 1.05.toBigDecimal()
            )

            // Card input
            CardInputWidget(
                modifier = Modifier.fillMaxWidth()
            )

            // Pay button
            Button(
                onClick = { viewModel.processPayment() },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Pay ${formatCurrency(amount * 1.05.toBigDecimal())}")
            }
        }
    }
}
```

#### 7.3 PayFast Integration (2 hours)
```kotlin
@Composable
fun PayFastPaymentScreen(
    jobId: String,
    amount: BigDecimal,
    viewModel: PaymentViewModel = hiltViewModel()
) {
    // PayFast redirect flow
    LaunchedEffect(Unit) {
        val paymentUrl = viewModel.getPayFastUrl(jobId, amount)
        // Open WebView or external browser
    }
}
```

**Deliverables:**
- [ ] Payment intent creation
- [ ] Stripe integration
- [ ] PayFast integration
- [ ] Payment success/failure handling
- [ ] Receipt generation
- [ ] Payment tests

---

### 🧪 Phase 8: Comprehensive Testing (PRIORITY: CRITICAL)
**Duration:** 10-12 hours
**Goal:** >80% code coverage with all test types

#### 8.1 Unit Tests (4 hours)
**ViewModels (20+ tests):**
- Initial state verification
- Action handling
- State updates
- Error handling
- Loading states

**Use Cases (30+ tests):**
- Business logic validation
- Success cases
- Error cases
- Edge cases

**Repositories (15+ tests):**
- Cache management
- Network calls
- Data mapping

**Mappers (10+ tests):**
- DTO ↔ Domain conversions
- Null handling
- Field mapping

#### 8.2 Integration Tests (3 hours)
**API Integration (10+ tests):**
- Auth flow end-to-end
- Job creation flow
- Bid submission flow
- Payment flow

**Database Integration (10+ tests):**
- CRUD operations
- Queries with filters
- Cascade deletes
- Data integrity

#### 8.3 UI Tests (3 hours)
**Screen Tests (15+ tests):**
- Login flow
- Registration flow
- Job creation wizard
- Navigation between screens
- Error states
- Empty states

#### 8.4 E2E Tests (2 hours)
**User Journeys (5+ tests):**
- Complete CLIENT journey (register → post job → accept bid → pay)
- Complete ARTISAN journey (register → find job → submit bid → complete project)
- Admin moderation flow

**Deliverables:**
- [ ] >80% code coverage
- [ ] All critical paths tested
- [ ] CI/CD pipeline with tests
- [ ] Test report generated

---

## Implementation Guidelines

### Code Quality Standards

**Kotlin Style:**
- Follow official Kotlin coding conventions
- Use data classes for DTOs and models
- Prefer sealed classes for state/result types
- Use extension functions for utilities
- Avoid nullable types where possible

**Compose Best Practices:**
- Extract reusable composables
- Use `remember` and `derivedStateOf` appropriately
- Handle configuration changes
- Support dark/light themes
- Accessibility (content descriptions, semantic properties)

**Architecture Rules:**
- ViewModels should not reference Android framework
- Use Cases contain business logic only
- Repositories abstract data sources
- Mappers handle all conversions
- No business logic in Composables

### Error Handling Pattern

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

## Build & Deployment

### Prerequisites
- Android Studio Giraffe or later
- JDK 17
- Android SDK 24-34

### Build Commands
```bash
# Compile
./gradlew assembleDebug

# Run tests
./gradlew test
./gradlew connectedAndroidTest

# Generate coverage
./gradlew jacocoTestReport

# Lint
./gradlew lint

# Release build
./gradlew assembleRelease
```

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
- [ ] Accessibility features

---

## Timeline Estimate

| Phase | Duration | Priority |
|-------|----------|----------|
| Phase 1: Auth & Navigation | 4-6 hours | CRITICAL |
| Phase 2: CLIENT Role | 12-16 hours | HIGH |
| Phase 3: ARTISAN Complete | 10-12 hours | HIGH |
| Phase 4: ADMIN Role | 8-10 hours | MEDIUM |
| Phase 5: Real-time Messaging | 6-8 hours | HIGH |
| Phase 6: Location & Camera | 4-6 hours | MEDIUM |
| Phase 7: Payments | 6-8 hours | HIGH |
| Phase 8: Testing | 10-12 hours | CRITICAL |
| **TOTAL** | **60-78 hours** | |

**Realistic Timeline:** 2-3 weeks of full-time development

---

## Next Steps

1. **Review this roadmap** and approve the approach
2. **Set up development environment** (Android Studio, dependencies)
3. **Start with Phase 1** (Authentication & Navigation)
4. **Checkpoint after each phase** for testing and review
5. **Iterate based on feedback**

---

**Document Version:** 1.0.0
**Last Updated:** 2025-12-25
**Status:** Ready for Implementation
