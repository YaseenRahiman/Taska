# Taska Android Client Portal - Comprehensive Requirements Document

**Document Version:** 1.0
**Last Updated:** 2025-10-30
**Priority:** HIGH (Testing emphasized as CRITICAL by stakeholder)

---

## Executive Summary

This document outlines the complete requirements, architecture, and implementation strategy for the **Taska Android Client Portal** - the native Android functionality enabling clients to post jobs, manage bids, communicate with artisans, and handle payments within the Taska mobile application.

### Key Objectives
1. Enable clients to post jobs with comprehensive details, images, and location
2. Provide intuitive bid management and artisan selection workflows
3. Facilitate seamless client-artisan communication
4. Integrate secure payment processing
5. Support offline-first architecture with Room caching
6. **ACHIEVE >80% TEST COVERAGE** (Critical stakeholder requirement)

---

## 1. Current State Analysis

### 1.1 Existing Infrastructure

#### ✅ Completed Components

**Authentication & Session Management**
- Login/Register screens with ViewModels
- JWT token management via AuthInterceptor
- PreferencesManager for session persistence
- Email verification flow

**Core Architecture**
- Clean Architecture (data/domain/presentation layers)
- Hilt dependency injection setup
- Room database with DAOs (JobDao, BidDao, MessageDao)
- Retrofit API services (AuthApiService, JobsApiService, BidsApiService, MessagesApiService)
- Repository pattern with domain mappers
- Resource wrapper for API state management

**UI Foundation**
- Material Design 3 theme system
- Reusable components (TaskaButton, TaskaTextField, TaskaPasswordField, ErrorMessage)
- Navigation Compose setup with Screen sealed class
- Jetpack Compose best practices established

**Device Services**
- LocationManager with GPS and permission handling
- CameraX integration (dependencies present)
- Image loading with Coil
- PermissionHandler for runtime permissions

**Data Models**
- Complete domain models: User, Job, Bid, Message
- DTOs for API communication
- Room entities with converters
- Bidirectional mappers (DTO ↔ Domain ↔ Entity)

#### 📋 Available Backend APIs

**Jobs API (POST /api/v1/jobs)**
- `POST /jobs` - Create job (CLIENT role required)
- `PUT /jobs/:id/publish` - Publish draft job
- `GET /jobs/my-jobs` - Get client's jobs
- `GET /jobs/:id` - Get job details
- `PATCH /jobs/:id` - Update job
- `PUT /jobs/:id/cancel` - Cancel job
- `PUT /jobs/:id/complete` - Mark completed
- `DELETE /jobs/:id` - Delete draft/cancelled job
- `POST /jobs/upload-image` - Upload single image
- `POST /jobs/upload-images` - Upload multiple images (max 5)

**Bids API (GET /api/v1/bids)**
- `GET /bids/job/:jobId` - Get all bids for a job (CLIENT role)
- `GET /bids/job/:jobId/analytics` - Get bid analytics
- `POST /bids/:id/accept` - Accept bid (CLIENT role)
- `POST /bids/:id/reject` - Reject bid with reason (CLIENT role)
- `GET /bids/:id` - Get bid details

**Messages API** (Already implemented in Android)
- `GET /messages/conversations` - Get conversation list
- `POST /messages` - Send message

**Reviews API** (Backend exists, Android implementation needed)
- `POST /reviews` - Create review
- `GET /reviews/job/:jobId` - Get job reviews

**Payments API** (Partial - needs Android integration)
- `POST /payments` - Initiate payment
- `GET /payments/:id` - Get payment status

### 1.2 Gap Analysis

#### ❌ Missing Android Components

**Screens (0% complete)**
- ❌ Client Home/Dashboard
- ❌ Post Job Screen (multi-step form)
- ❌ My Jobs List Screen
- ❌ Job Details Screen (client view)
- ❌ Bids Review Screen
- ❌ Bid Details Screen
- ❌ Job Edit Screen
- ❌ Payment Screen
- ❌ Review Artisan Screen
- ❌ Image Upload Screen/Component

**Navigation Routes**
- ❌ No client-specific routes defined (only artisan routes exist)
- ❌ No nested navigation for client portal

**ViewModels (0% complete)**
- ❌ PostJobViewModel
- ❌ ClientJobsViewModel
- ❌ BidsManagementViewModel
- ❌ PaymentViewModel
- ❌ ReviewViewModel

**Use Cases (Partial)**
- ✅ GetNearbyJobsUseCase (exists)
- ✅ GetJobByIdUseCase (exists)
- ❌ CreateJobUseCase
- ❌ UpdateJobUseCase
- ❌ DeleteJobUseCase
- ❌ PublishJobUseCase
- ❌ GetMyJobsUseCase
- ❌ GetJobBidsUseCase
- ❌ AcceptBidUseCase
- ❌ RejectBidUseCase
- ❌ CreateReviewUseCase
- ❌ InitiatePaymentUseCase

**Repository Methods**
- ❌ JobsRepository lacks: createJob, updateJob, deleteJob, publishJob, getMyJobs
- ❌ BidsRepository missing entirely
- ❌ PaymentsRepository missing entirely
- ❌ ReviewsRepository missing entirely

**Data Layer (DTOs/Requests)**
- ❌ CreateJobRequest
- ❌ UpdateJobRequest
- ❌ AcceptBidRequest
- ❌ RejectBidRequest
- ❌ CreateReviewRequest
- ❌ InitiatePaymentRequest

**API Services**
- ❌ PaymentsApiService (entirely missing)
- ❌ ReviewsApiService (entirely missing)
- ❌ JobsApiService lacks: createJob, updateJob, deleteJob, publishJob, getMyJobs, uploadImage

**Image Handling**
- ❌ Camera capture integration
- ❌ Gallery image picker
- ❌ Image compression before upload
- ❌ Multi-image upload UI
- ❌ Image preview/management

**Testing Infrastructure (0% exists)**
- ❌ No unit tests found
- ❌ No integration tests found
- ❌ No UI tests found
- ❌ No test fixtures/mocks/fakes

---

## 2. Feature Specifications

### 2.1 Post Job Feature

**User Story:**
> As a client, I want to post a job with comprehensive details so that qualified artisans can bid on my project.

**Acceptance Criteria:**
- [ ] Multi-step form with validation at each step
- [ ] All CreateJobDto fields captured
- [ ] Image upload (camera + gallery) with max 5 images
- [ ] Location selection via map + GPS
- [ ] Save as draft functionality
- [ ] Publish immediately option
- [ ] Form state persistence across app restarts
- [ ] Offline draft saving
- [ ] Image compression before upload (max 2MB per image)
- [ ] Real-time validation feedback

**Technical Requirements:**

**Screen Design: PostJobScreen (Multi-Step)**

**Step 1: Basic Information**
```kotlin
@Composable
fun PostJobStep1Screen(
    viewModel: PostJobViewModel,
    onNext: () -> Unit,
    onSaveDraft: () -> Unit
) {
    // Fields:
    // - Title (TextField, 5-100 chars)
    // - Description (TextField, multiline, 20-2000 chars)
    // - Category (Dropdown with icons from API)
    // - Budget (NumberField with currency formatter)
    // - Budget Type (SegmentedButton: FIXED/HOURLY/NEGOTIABLE)
    // - Urgency Level (SegmentedButton: LOW/MEDIUM/HIGH/URGENT)

    // Validation:
    // - Real-time error messages
    // - Next button enabled only when valid
    // - Draft save always available
}
```

**Step 2: Location Details**
```kotlin
@Composable
fun PostJobStep2Screen(
    viewModel: PostJobViewModel,
    onNext: () -> Unit,
    onBack: () -> Unit
) {
    // Fields:
    // - Address Line 1 (TextField, required)
    // - Address Line 2 (TextField, optional)
    // - City (TextField, required)
    // - Province (Dropdown: SA provinces)
    // - Postal Code (TextField, numeric)
    // - Map view showing pin location
    // - "Use Current Location" button (GPS permission)
    // - "Select on Map" button (drag pin)

    // Location Services:
    // - Request location permission if not granted
    // - Reverse geocoding to populate address from coordinates
    // - Forward geocoding to validate address
}
```

**Step 3: Images & Requirements**
```kotlin
@Composable
fun PostJobStep3Screen(
    viewModel: PostJobViewModel,
    onNext: () -> Unit,
    onBack: () -> Unit
) {
    // Image Upload Section:
    // - Max 5 images
    // - Camera capture button
    // - Gallery selection button
    // - Image preview grid with delete option
    // - Upload progress indicators
    // - Compression notification

    // Requirements Section:
    // - Dynamic list of requirement text fields
    // - "Add Requirement" button (max 10)
    // - Each requirement max 200 chars
    // - Delete requirement option

    // Optional Dates:
    // - Start date picker
    // - End date picker
}
```

**Step 4: Review & Publish**
```kotlin
@Composable
fun PostJobStep4Screen(
    viewModel: PostJobViewModel,
    onPublish: () -> Unit,
    onSaveDraft: () -> Unit,
    onBack: () -> Unit
) {
    // Summary View:
    // - All job details displayed in read-only cards
    // - Image carousel
    // - Map preview
    // - Edit buttons for each section (navigate back to step)

    // Actions:
    // - "Publish Job" button (primary)
    // - "Save as Draft" button (secondary)
    // - "Cancel" button

    // Confirmation:
    // - Show confirmation dialog on publish
    // - Loading state during API call
    // - Success/error handling
}
```

**ViewModel: PostJobViewModel**
```kotlin
@HiltViewModel
class PostJobViewModel @Inject constructor(
    private val createJobUseCase: CreateJobUseCase,
    private val uploadJobImageUseCase: UploadJobImageUseCase,
    private val publishJobUseCase: PublishJobUseCase,
    private val locationManager: LocationManager,
    private val savedStateHandle: SavedStateHandle
) : ViewModel() {

    // State
    data class PostJobState(
        val currentStep: Int = 1,
        val jobDraft: JobDraftData = JobDraftData(),
        val uploadedImages: List<UploadedImage> = emptyList(),
        val isLoading: Boolean = false,
        val errors: Map<String, String> = emptyMap(),
        val currentLocation: Location? = null
    )

    // Data classes
    data class JobDraftData(
        val title: String = "",
        val description: String = "",
        val categoryId: String = "",
        val budget: String = "",
        val budgetType: BudgetType = BudgetType.FIXED,
        val urgency: UrgencyLevel = UrgencyLevel.MEDIUM,
        val addressLine1: String = "",
        val addressLine2: String = "",
        val city: String = "",
        val province: String = "",
        val postalCode: String = "",
        val latitude: Double = 0.0,
        val longitude: Double = 0.0,
        val requirements: List<String> = emptyList(),
        val startDate: String? = null,
        val endDate: String? = null
    )

    // Functions
    fun validateStep1(): Boolean
    fun validateStep2(): Boolean
    fun validateStep3(): Boolean
    suspend fun uploadImage(uri: Uri): Result<String>
    suspend fun compressImage(uri: Uri): ByteArray
    suspend fun getCurrentLocation(): Location?
    suspend fun reverseGeocode(lat: Double, lng: Double): Address?
    suspend fun saveDraft(): Result<String>
    suspend fun publishJob(): Result<Job>
    fun updateField(field: String, value: Any)
    fun addRequirement(requirement: String)
    fun removeRequirement(index: Int)
    fun removeImage(index: Int)
}
```

**Use Cases:**
```kotlin
class CreateJobUseCase @Inject constructor(
    private val jobsRepository: JobsRepository
) {
    suspend operator fun invoke(jobData: CreateJobDto): Result<Job>
}

class UploadJobImageUseCase @Inject constructor(
    private val jobsRepository: JobsRepository
) {
    suspend operator fun invoke(imageUri: Uri): Result<String>
}

class PublishJobUseCase @Inject constructor(
    private val jobsRepository: JobsRepository
) {
    suspend operator fun invoke(jobId: String): Result<Job>
}
```

**Repository Extensions:**
```kotlin
interface JobsRepository {
    // New methods needed:
    suspend fun createJob(jobData: CreateJobDto): Result<Job>
    suspend fun updateJob(jobId: String, jobData: UpdateJobDto): Result<Job>
    suspend fun deleteJob(jobId: String): Result<Unit>
    suspend fun publishJob(jobId: String): Result<Job>
    suspend fun getMyJobs(): Flow<Resource<List<Job>>>
    suspend fun uploadJobImage(imageUri: Uri): Result<String>
    suspend fun uploadJobImages(imageUris: List<Uri>): Result<List<String>>
}
```

**API Service Extensions:**
```kotlin
interface JobsApiService {
    @POST("jobs")
    suspend fun createJob(@Body request: CreateJobRequest): Response<JobResponse>

    @PATCH("jobs/{id}")
    suspend fun updateJob(
        @Path("id") jobId: String,
        @Body request: UpdateJobRequest
    ): Response<JobResponse>

    @DELETE("jobs/{id}")
    suspend fun deleteJob(@Path("id") jobId: String): Response<Unit>

    @PUT("jobs/{id}/publish")
    suspend fun publishJob(@Path("id") jobId: String): Response<JobResponse>

    @GET("jobs/my-jobs")
    suspend fun getMyJobs(): Response<List<JobResponse>>

    @Multipart
    @POST("jobs/upload-image")
    suspend fun uploadImage(
        @Part image: MultipartBody.Part
    ): Response<ImageUploadResponse>

    @Multipart
    @POST("jobs/upload-images")
    suspend fun uploadImages(
        @Part images: List<MultipartBody.Part>
    ): Response<List<ImageUploadResponse>>
}
```

**DTOs:**
```kotlin
data class CreateJobRequest(
    val title: String,
    val description: String,
    val categoryId: String,
    val budget: Double,
    val budgetType: String,
    val urgency: String,
    val addressLine1: String,
    val addressLine2: String?,
    val city: String,
    val province: String,
    val postalCode: String,
    val latitude: Double,
    val longitude: Double,
    val images: List<String>,
    val requirements: List<String>,
    val startDate: String?,
    val endDate: String?,
    val isDraft: Boolean = true
)

data class ImageUploadResponse(
    val url: String,
    val size: Long,
    val format: String
)
```

---

### 2.2 View My Jobs Feature

**User Story:**
> As a client, I want to view all my posted jobs so I can track their status and manage them.

**Acceptance Criteria:**
- [ ] List view with job cards
- [ ] Filter by status (DRAFT, OPEN, IN_PROGRESS, COMPLETED, CANCELLED)
- [ ] Sort by date (newest/oldest)
- [ ] Pull-to-refresh
- [ ] Offline support with cached data
- [ ] Empty state for no jobs
- [ ] Search functionality
- [ ] Status badges with colors
- [ ] Bid count indicator per job

**Screen Design: ClientJobsScreen**
```kotlin
@Composable
fun ClientJobsScreen(
    viewModel: ClientJobsViewModel,
    onNavigateToJobDetails: (String) -> Unit,
    onNavigateToPostJob: () -> Unit,
    onNavigateBack: () -> Unit
) {
    // Top Bar:
    // - Title: "My Jobs"
    // - Filter icon button
    // - Search icon button

    // FAB:
    // - "Post New Job" button

    // Content:
    // - Tab row: All, Draft, Open, In Progress, Completed
    // - Pull-to-refresh
    // - LazyColumn of JobCards
    // - Loading state
    // - Error state with retry
    // - Empty state

    // JobCard Component:
    // - Job title
    // - Category icon + name
    // - Status badge
    // - Budget display
    // - Location (city)
    // - Date posted
    // - Bid count badge
    // - Image thumbnail
    // - Tap to view details
}
```

**ViewModel:**
```kotlin
@HiltViewModel
class ClientJobsViewModel @Inject constructor(
    private val getMyJobsUseCase: GetMyJobsUseCase,
    private val deleteJobUseCase: DeleteJobUseCase
) : ViewModel() {

    data class ClientJobsState(
        val jobs: List<Job> = emptyList(),
        val filteredJobs: List<Job> = emptyList(),
        val isLoading: Boolean = false,
        val isRefreshing: Boolean = false,
        val error: String? = null,
        val selectedFilter: JobStatus? = null,
        val searchQuery: String = ""
    )

    fun loadJobs()
    fun refreshJobs()
    fun filterByStatus(status: JobStatus?)
    fun searchJobs(query: String)
    fun deleteJob(jobId: String)
}
```

---

### 2.3 Job Details & Management Feature

**User Story:**
> As a client, I want to view job details and manage the job (edit, cancel, complete) so I can maintain control over my projects.

**Acceptance Criteria:**
- [ ] Display all job information
- [ ] Image gallery with zoom
- [ ] Map showing job location
- [ ] Edit button (only for DRAFT/OPEN status)
- [ ] Cancel button with reason input
- [ ] Complete button (only for IN_PROGRESS)
- [ ] Delete button (only for DRAFT/CANCELLED)
- [ ] View bids button (navigates to bids screen)
- [ ] Contact artisan button (if bid accepted)
- [ ] View artisan profile button (if bid accepted)

**Screen Design: JobDetailsScreen (Client View)**
```kotlin
@Composable
fun JobDetailsClientScreen(
    jobId: String,
    viewModel: JobDetailsViewModel,
    onNavigateToBids: (String) -> Unit,
    onNavigateToMessages: (String, String) -> Unit,
    onNavigateToEdit: (String) -> Unit,
    onNavigateBack: () -> Unit
) {
    // Sections:
    // 1. Image Gallery (if images exist)
    // 2. Job Header Card:
    //    - Title
    //    - Status badge
    //    - Category
    //    - Date posted
    //    - Urgency indicator
    // 3. Budget Card:
    //    - Budget amount
    //    - Budget type
    // 4. Description Card
    // 5. Location Card:
    //    - Full address
    //    - Map preview (clickable for full map)
    // 6. Requirements Card (if exists)
    // 7. Dates Card (if exists)
    // 8. Bids Summary Card:
    //    - Bid count
    //    - Lowest/average/highest bid
    //    - "View All Bids" button
    // 9. Accepted Artisan Card (if bid accepted):
    //    - Artisan profile
    //    - Contact button
    //    - View profile button
    // 10. Actions (Bottom Bar):
    //     - Edit (if DRAFT/OPEN)
    //     - Cancel (if DRAFT/OPEN/IN_PROGRESS)
    //     - Complete (if IN_PROGRESS)
    //     - Delete (if DRAFT/CANCELLED)
}
```

**ViewModel:**
```kotlin
@HiltViewModel
class JobDetailsViewModel @Inject constructor(
    private val getJobByIdUseCase: GetJobByIdUseCase,
    private val updateJobUseCase: UpdateJobUseCase,
    private val cancelJobUseCase: CancelJobUseCase,
    private val completeJobUseCase: CompleteJobUseCase,
    private val deleteJobUseCase: DeleteJobUseCase,
    private val getJobBidsUseCase: GetJobBidsUseCase
) : ViewModel() {

    data class JobDetailsState(
        val job: Job? = null,
        val bids: List<Bid> = emptyList(),
        val bidStats: BidStatistics? = null,
        val isLoading: Boolean = false,
        val error: String? = null
    )

    data class BidStatistics(
        val count: Int,
        val lowest: Double,
        val average: Double,
        val highest: Double
    )

    fun loadJobDetails(jobId: String)
    fun cancelJob(jobId: String, reason: String)
    fun completeJob(jobId: String)
    fun deleteJob(jobId: String)
}
```

---

### 2.4 Bid Management Feature

**User Story:**
> As a client, I want to review all bids submitted for my job so I can select the best artisan for the work.

**Acceptance Criteria:**
- [ ] List all bids for a specific job
- [ ] Display artisan profile information
- [ ] Show bid amount, estimated duration, proposal
- [ ] Display artisan rating and completed jobs
- [ ] Accept bid action (with confirmation)
- [ ] Reject bid action (with reason)
- [ ] Only one bid can be accepted
- [ ] Accepting bid closes job to new bids
- [ ] Sort by: price (low/high), rating, date
- [ ] Filter by: pending, accepted, rejected

**Screen Design: BidsScreen**
```kotlin
@Composable
fun BidsScreen(
    jobId: String,
    viewModel: BidsViewModel,
    onNavigateToArtisanProfile: (String) -> Unit,
    onNavigateToBidDetails: (String) -> Unit,
    onNavigateBack: () -> Unit
) {
    // Top Bar:
    // - Title: "Bids for [Job Title]"
    // - Sort icon button
    // - Filter icon button

    // Summary Card:
    // - Total bids count
    // - Lowest bid
    // - Average bid
    // - Highest bid
    // - Recommended bid (ML suggestion - future)

    // Content:
    // - LazyColumn of BidCards
    // - Loading state
    // - Error state
    // - Empty state ("No bids yet")

    // BidCard Component:
    // - Artisan profile picture
    // - Artisan name
    // - Rating stars + count
    // - Completed jobs count
    // - Bid amount (prominent)
    // - Estimated duration
    // - Proposal snippet (2 lines, expandable)
    // - Status badge (Pending/Accepted/Rejected)
    // - Action buttons:
    //   - "View Details" (always)
    //   - "Accept" (if pending)
    //   - "Reject" (if pending)
    // - Tap to expand/collapse full proposal
}
```

**Screen Design: BidDetailsScreen**
```kotlin
@Composable
fun BidDetailsScreen(
    bidId: String,
    viewModel: BidsViewModel,
    onNavigateToArtisanProfile: (String) -> Unit,
    onAccept: () -> Unit,
    onReject: () -> Unit,
    onNavigateBack: () -> Unit
) {
    // Sections:
    // 1. Artisan Profile Card:
    //    - Profile picture
    //    - Name
    //    - Rating + review count
    //    - Completed jobs
    //    - Member since
    //    - "View Full Profile" button
    // 2. Bid Details Card:
    //    - Bid amount
    //    - Budget type (fixed/hourly)
    //    - Estimated duration
    //    - Availability
    //    - Date submitted
    // 3. Proposal Card:
    //    - Full proposal text
    //    - Approach/methodology
    //    - Materials/equipment
    // 4. Portfolio Card (if artisan has images):
    //    - Previous work images
    // 5. Actions (Bottom Bar):
    //    - "Accept Bid" button (primary)
    //    - "Reject Bid" button (secondary)
    //    - "Contact Artisan" button
}
```

**ViewModel:**
```kotlin
@HiltViewModel
class BidsViewModel @Inject constructor(
    private val getJobBidsUseCase: GetJobBidsUseCase,
    private val acceptBidUseCase: AcceptBidUseCase,
    private val rejectBidUseCase: RejectBidUseCase,
    private val getBidAnalyticsUseCase: GetBidAnalyticsUseCase
) : ViewModel() {

    data class BidsState(
        val bids: List<Bid> = emptyList(),
        val filteredBids: List<Bid> = emptyList(),
        val analytics: BidAnalytics? = null,
        val isLoading: Boolean = false,
        val error: String? = null,
        val sortBy: SortOption = SortOption.PRICE_LOW_TO_HIGH,
        val filterStatus: BidStatus? = null
    )

    data class BidAnalytics(
        val totalBids: Int,
        val averageBid: Double,
        val lowestBid: Double,
        val highestBid: Double,
        val averageRating: Double
    )

    enum class SortOption {
        PRICE_LOW_TO_HIGH,
        PRICE_HIGH_TO_LOW,
        RATING_HIGH_TO_LOW,
        DATE_NEWEST,
        DATE_OLDEST
    }

    fun loadBids(jobId: String)
    fun acceptBid(bidId: String)
    fun rejectBid(bidId: String, reason: String)
    fun sortBids(sortBy: SortOption)
    fun filterByStatus(status: BidStatus?)
}
```

**Use Cases:**
```kotlin
class GetJobBidsUseCase @Inject constructor(
    private val bidsRepository: BidsRepository
) {
    suspend operator fun invoke(jobId: String): Result<List<Bid>>
}

class AcceptBidUseCase @Inject constructor(
    private val bidsRepository: BidsRepository
) {
    suspend operator fun invoke(bidId: String): Result<Bid>
}

class RejectBidUseCase @Inject constructor(
    private val bidsRepository: BidsRepository
) {
    suspend operator fun invoke(bidId: String, reason: String): Result<Bid>
}

class GetBidAnalyticsUseCase @Inject constructor(
    private val bidsRepository: BidsRepository
) {
    suspend operator fun invoke(jobId: String): Result<BidAnalytics>
}
```

**Repository:**
```kotlin
interface BidsRepository {
    suspend fun getJobBids(jobId: String): Result<List<Bid>>
    suspend fun getBidById(bidId: String): Result<Bid>
    suspend fun acceptBid(bidId: String): Result<Bid>
    suspend fun rejectBid(bidId: String, reason: String): Result<Bid>
    suspend fun getBidAnalytics(jobId: String): Result<BidAnalytics>
    fun observeJobBids(jobId: String): Flow<Resource<List<Bid>>>
}
```

**API Service:**
```kotlin
interface BidsApiService {
    @GET("bids/job/{jobId}")
    suspend fun getJobBids(@Path("jobId") jobId: String): Response<List<BidResponse>>

    @GET("bids/job/{jobId}/analytics")
    suspend fun getBidAnalytics(@Path("jobId") jobId: String): Response<BidAnalyticsResponse>

    @POST("bids/{id}/accept")
    suspend fun acceptBid(@Path("id") bidId: String): Response<BidResponse>

    @POST("bids/{id}/reject")
    suspend fun rejectBid(
        @Path("id") bidId: String,
        @Body request: RejectBidRequest
    ): Response<BidResponse>
}
```

---

### 2.5 Payment Feature

**User Story:**
> As a client, I want to securely pay the artisan after job completion so the transaction is recorded and protected.

**Acceptance Criteria:**
- [ ] Initiate payment after accepting bid
- [ ] Display payment amount (bid amount + platform fee)
- [ ] Support multiple payment methods (Credit/Debit card, EFT)
- [ ] Secure payment processing via Stripe/PayFast
- [ ] Payment confirmation screen
- [ ] Payment receipt generation
- [ ] Payment history view
- [ ] Escrow system (hold funds until completion)

**Screen Design: PaymentScreen**
```kotlin
@Composable
fun PaymentScreen(
    jobId: String,
    bidId: String,
    amount: Double,
    viewModel: PaymentViewModel,
    onPaymentSuccess: () -> Unit,
    onNavigateBack: () -> Unit
) {
    // Payment Summary Card:
    // - Job title
    // - Artisan name
    // - Bid amount
    // - Platform fee (15%)
    // - Total amount (prominent)

    // Payment Method Selection:
    // - Radio buttons:
    //   - Credit Card (Visa/Mastercard icons)
    //   - Debit Card
    //   - EFT
    //   - Mobile Money (future)

    // Payment Details Form:
    // (Conditional based on selected method)
    // - Card payment:
    //   - Card number
    //   - Expiry date
    //   - CVV
    //   - Cardholder name
    // - EFT payment:
    //   - Bank account details form
    //   - Reference number generation

    // Security Indicators:
    // - Lock icon
    // - "Secure payment" text
    // - SSL certificate info

    // Actions:
    // - "Pay Now" button (primary)
    // - "Cancel" button

    // Loading State:
    // - Processing payment animation
    // - "Do not close or refresh" warning
}
```

**Screen Design: PaymentSuccessScreen**
```kotlin
@Composable
fun PaymentSuccessScreen(
    paymentId: String,
    amount: Double,
    onNavigateToJobDetails: () -> Unit,
    onDownloadReceipt: () -> Unit
) {
    // Success Animation:
    // - Checkmark animation
    // - "Payment Successful" title

    // Payment Summary:
    // - Amount paid
    // - Payment method
    // - Transaction ID
    // - Date & time
    // - Receipt number

    // Actions:
    // - "Download Receipt" button
    // - "View Job" button
    // - "Done" button
}
```

**ViewModel:**
```kotlin
@HiltViewModel
class PaymentViewModel @Inject constructor(
    private val initiatePaymentUseCase: InitiatePaymentUseCase,
    private val getPaymentStatusUseCase: GetPaymentStatusUseCase
) : ViewModel() {

    data class PaymentState(
        val amount: Double = 0.0,
        val platformFee: Double = 0.0,
        val totalAmount: Double = 0.0,
        val selectedMethod: PaymentMethod = PaymentMethod.CREDIT_CARD,
        val isProcessing: Boolean = false,
        val error: String? = null,
        val paymentSuccess: Boolean = false,
        val transactionId: String? = null
    )

    enum class PaymentMethod {
        CREDIT_CARD,
        DEBIT_CARD,
        EFT,
        MOBILE_MONEY
    }

    fun calculateTotal(bidAmount: Double)
    suspend fun initiatePayment(paymentDetails: PaymentDetails): Result<Payment>
    fun selectPaymentMethod(method: PaymentMethod)
    fun validateCardDetails(cardNumber: String, expiry: String, cvv: String): Boolean
}
```

**Use Cases:**
```kotlin
class InitiatePaymentUseCase @Inject constructor(
    private val paymentsRepository: PaymentsRepository
) {
    suspend operator fun invoke(paymentData: CreatePaymentDto): Result<Payment>
}

class GetPaymentStatusUseCase @Inject constructor(
    private val paymentsRepository: PaymentsRepository
) {
    suspend operator fun invoke(paymentId: String): Result<Payment>
}
```

**Repository:**
```kotlin
interface PaymentsRepository {
    suspend fun initiatePayment(paymentData: CreatePaymentDto): Result<Payment>
    suspend fun getPaymentStatus(paymentId: String): Result<Payment>
    suspend fun getPaymentHistory(): Result<List<Payment>>
    fun observePaymentStatus(paymentId: String): Flow<Resource<Payment>>
}
```

**API Service:**
```kotlin
interface PaymentsApiService {
    @POST("payments")
    suspend fun initiatePayment(@Body request: CreatePaymentRequest): Response<PaymentResponse>

    @GET("payments/{id}")
    suspend fun getPaymentStatus(@Path("id") paymentId: String): Response<PaymentResponse>

    @GET("payments/history")
    suspend fun getPaymentHistory(): Response<List<PaymentResponse>>
}
```

**Domain Model:**
```kotlin
data class Payment(
    val id: String,
    val jobId: String,
    val clientId: String,
    val artisanId: String,
    val amount: Double,
    val platformFee: Double,
    val totalAmount: Double,
    val paymentMethod: PaymentMethod,
    val status: PaymentStatus,
    val transactionId: String?,
    val receiptUrl: String?,
    val createdAt: String,
    val completedAt: String?
)

enum class PaymentStatus {
    PENDING,
    PROCESSING,
    COMPLETED,
    FAILED,
    REFUNDED,
    CANCELLED
}
```

---

### 2.6 Review & Rating Feature

**User Story:**
> As a client, I want to review and rate the artisan after job completion so others can make informed decisions.

**Acceptance Criteria:**
- [ ] Review only available after job completion
- [ ] Star rating (1-5)
- [ ] Written review (optional, min 20 chars if provided)
- [ ] Review categories (quality, professionalism, timeliness, value)
- [ ] Image upload (before/after photos)
- [ ] Review submission with validation
- [ ] Edit review within 7 days
- [ ] View my reviews history

**Screen Design: ReviewArtisanScreen**
```kotlin
@Composable
fun ReviewArtisanScreen(
    jobId: String,
    artisanId: String,
    viewModel: ReviewViewModel,
    onReviewSubmitted: () -> Unit,
    onNavigateBack: () -> Unit
) {
    // Job Summary Card:
    // - Job title
    // - Artisan name + profile picture
    // - Completion date

    // Rating Section:
    // - Overall Rating (5 stars, interactive)
    // - Category Ratings:
    //   - Quality of Work (5 stars)
    //   - Professionalism (5 stars)
    //   - Timeliness (5 stars)
    //   - Value for Money (5 stars)

    // Written Review Section:
    // - Multiline TextField
    // - "Share your experience..." placeholder
    // - Character count (min 20, max 1000)
    // - Optional label

    // Photos Section (Optional):
    // - "Add Before/After Photos" button
    // - Image grid
    // - Camera/gallery options
    // - Max 4 images

    // Recommendation:
    // - Toggle: "Would you recommend this artisan?"

    // Actions:
    // - "Submit Review" button (primary)
    // - "Skip for Now" button (secondary)

    // Validation:
    // - Submit enabled only if overall rating selected
    // - If review text provided, min 20 chars required
}
```

**ViewModel:**
```kotlin
@HiltViewModel
class ReviewViewModel @Inject constructor(
    private val createReviewUseCase: CreateReviewUseCase,
    private val uploadReviewImagesUseCase: UploadReviewImagesUseCase
) : ViewModel() {

    data class ReviewState(
        val overallRating: Int = 0,
        val qualityRating: Int = 0,
        val professionalismRating: Int = 0,
        val timelinessRating: Int = 0,
        val valueRating: Int = 0,
        val reviewText: String = "",
        val images: List<Uri> = emptyList(),
        val wouldRecommend: Boolean = true,
        val isSubmitting: Boolean = false,
        val error: String? = null,
        val submitted: Boolean = false
    )

    fun setOverallRating(rating: Int)
    fun setCategoryRating(category: RatingCategory, rating: Int)
    fun setReviewText(text: String)
    fun addImage(uri: Uri)
    fun removeImage(index: Int)
    fun setRecommendation(recommend: Boolean)
    fun validateReview(): Boolean
    suspend fun submitReview(): Result<Review>
}
```

**Use Cases:**
```kotlin
class CreateReviewUseCase @Inject constructor(
    private val reviewsRepository: ReviewsRepository
) {
    suspend operator fun invoke(reviewData: CreateReviewDto): Result<Review>
}

class UploadReviewImagesUseCase @Inject constructor(
    private val reviewsRepository: ReviewsRepository
) {
    suspend operator fun invoke(images: List<Uri>): Result<List<String>>
}
```

**Repository:**
```kotlin
interface ReviewsRepository {
    suspend fun createReview(reviewData: CreateReviewDto): Result<Review>
    suspend fun updateReview(reviewId: String, reviewData: UpdateReviewDto): Result<Review>
    suspend fun getJobReviews(jobId: String): Result<List<Review>>
    suspend fun getArtisanReviews(artisanId: String): Result<List<Review>>
    suspend fun uploadReviewImages(images: List<Uri>): Result<List<String>>
}
```

**API Service:**
```kotlin
interface ReviewsApiService {
    @POST("reviews")
    suspend fun createReview(@Body request: CreateReviewRequest): Response<ReviewResponse>

    @PATCH("reviews/{id}")
    suspend fun updateReview(
        @Path("id") reviewId: String,
        @Body request: UpdateReviewRequest
    ): Response<ReviewResponse>

    @GET("reviews/job/{jobId}")
    suspend fun getJobReviews(@Path("jobId") jobId: String): Response<List<ReviewResponse>>

    @Multipart
    @POST("reviews/upload-images")
    suspend fun uploadImages(
        @Part images: List<MultipartBody.Part>
    ): Response<List<ImageUploadResponse>>
}
```

**Domain Model:**
```kotlin
data class Review(
    val id: String,
    val jobId: String,
    val clientId: String,
    val artisanId: String,
    val overallRating: Int,
    val qualityRating: Int,
    val professionalismRating: Int,
    val timelinessRating: Int,
    val valueRating: Int,
    val reviewText: String?,
    val images: List<String>,
    val wouldRecommend: Boolean,
    val createdAt: String,
    val updatedAt: String?
)
```

---

## 3. Navigation Architecture

### 3.1 Navigation Routes

**Add to NavGraph.kt:**
```kotlin
sealed class Screen(val route: String) {
    // ... existing routes ...

    // Client routes
    object ClientHome : Screen("client/home")
    object ClientJobs : Screen("client/jobs")
    object PostJob : Screen("client/post-job")
    object JobDetailsClient : Screen("client/job/{jobId}") {
        fun createRoute(jobId: String) = "client/job/$jobId"
    }
    object EditJob : Screen("client/job/{jobId}/edit") {
        fun createRoute(jobId: String) = "client/job/$jobId/edit"
    }
    object ViewBids : Screen("client/job/{jobId}/bids") {
        fun createRoute(jobId: String) = "client/job/$jobId/bids"
    }
    object BidDetails : Screen("client/bid/{bidId}") {
        fun createRoute(bidId: String) = "client/bid/$bidId"
    }
    object Payment : Screen("client/payment/{jobId}/{bidId}") {
        fun createRoute(jobId: String, bidId: String) = "client/payment/$jobId/$bidId"
    }
    object PaymentSuccess : Screen("client/payment-success/{paymentId}") {
        fun createRoute(paymentId: String) = "client/payment-success/$paymentId"
    }
    object ReviewArtisan : Screen("client/review/{jobId}/{artisanId}") {
        fun createRoute(jobId: String, artisanId: String) = "client/review/$jobId/$artisanId"
    }
    object Messages : Screen("client/messages")
    object Conversation : Screen("client/conversation/{conversationId}") {
        fun createRoute(conversationId: String) = "client/conversation/$conversationId"
    }
}
```

### 3.2 Navigation Flow Diagram

```
SplashScreen
    ↓
LoginScreen → (if CLIENT role) → ClientHomeScreen
    ↓                                    ↓
RegisterScreen                           ├→ PostJobScreen (multi-step)
                                        ├→ ClientJobsScreen
                                        │      ↓
                                        │  JobDetailsClientScreen
                                        │      ↓
                                        │  ├→ EditJobScreen
                                        │  ├→ ViewBidsScreen
                                        │  │      ↓
                                        │  │  BidDetailsScreen
                                        │  │      ↓
                                        │  │  PaymentScreen
                                        │  │      ↓
                                        │  │  PaymentSuccessScreen
                                        │  │      ↓
                                        │  │  ReviewArtisanScreen
                                        │  ↓
                                        │  MessagesScreen
                                        │      ↓
                                        │  ConversationScreen
                                        ↓
                                    ProfileScreen
```

---

## 4. Technical Architecture

### 4.1 Layer Structure

**Presentation Layer (`presentation/screens/client/`)**
```
client/
├── home/
│   ├── ClientHomeScreen.kt
│   └── ClientHomeViewModel.kt
├── jobs/
│   ├── post/
│   │   ├── PostJobScreen.kt
│   │   ├── PostJobStep1Screen.kt
│   │   ├── PostJobStep2Screen.kt
│   │   ├── PostJobStep3Screen.kt
│   │   ├── PostJobStep4Screen.kt
│   │   └── PostJobViewModel.kt
│   ├── list/
│   │   ├── ClientJobsScreen.kt
│   │   └── ClientJobsViewModel.kt
│   ├── details/
│   │   ├── JobDetailsClientScreen.kt
│   │   └── JobDetailsViewModel.kt
│   └── edit/
│       ├── EditJobScreen.kt
│       └── EditJobViewModel.kt
├── bids/
│   ├── list/
│   │   ├── BidsScreen.kt
│   │   └── BidsViewModel.kt
│   └── details/
│       ├── BidDetailsScreen.kt
│       └── BidDetailsViewModel.kt (shared)
├── payment/
│   ├── PaymentScreen.kt
│   ├── PaymentSuccessScreen.kt
│   └── PaymentViewModel.kt
├── review/
│   ├── ReviewArtisanScreen.kt
│   └── ReviewViewModel.kt
└── components/
    ├── JobCard.kt
    ├── BidCard.kt
    ├── ImageUploadSection.kt
    ├── LocationPicker.kt
    ├── CategorySelector.kt
    ├── BudgetInput.kt
    ├── UrgencySelector.kt
    ├── RatingBar.kt
    └── PaymentMethodSelector.kt
```

**Domain Layer (`domain/`)**
```
domain/
├── usecase/
│   ├── jobs/
│   │   ├── CreateJobUseCase.kt
│   │   ├── UpdateJobUseCase.kt
│   │   ├── DeleteJobUseCase.kt
│   │   ├── PublishJobUseCase.kt
│   │   ├── GetMyJobsUseCase.kt
│   │   ├── CancelJobUseCase.kt
│   │   ├── CompleteJobUseCase.kt
│   │   └── UploadJobImageUseCase.kt
│   ├── bids/
│   │   ├── GetJobBidsUseCase.kt
│   │   ├── AcceptBidUseCase.kt
│   │   ├── RejectBidUseCase.kt
│   │   └── GetBidAnalyticsUseCase.kt
│   ├── payments/
│   │   ├── InitiatePaymentUseCase.kt
│   │   └── GetPaymentStatusUseCase.kt
│   └── reviews/
│       ├── CreateReviewUseCase.kt
│       └── UploadReviewImagesUseCase.kt
├── repository/
│   ├── BidsRepository.kt (new)
│   ├── PaymentsRepository.kt (new)
│   └── ReviewsRepository.kt (new)
└── model/
    ├── Payment.kt (new)
    ├── Review.kt (new)
    └── BidAnalytics.kt (new)
```

**Data Layer (`data/`)**
```
data/
├── repository/
│   ├── BidsRepositoryImpl.kt (new)
│   ├── PaymentsRepositoryImpl.kt (new)
│   └── ReviewsRepositoryImpl.kt (new)
├── remote/
│   ├── api/
│   │   ├── PaymentsApiService.kt (new)
│   │   └── ReviewsApiService.kt (new)
│   └── dto/
│       ├── request/
│       │   ├── CreateJobRequest.kt
│       │   ├── UpdateJobRequest.kt
│       │   ├── AcceptBidRequest.kt
│       │   ├── RejectBidRequest.kt
│       │   ├── CreatePaymentRequest.kt
│       │   └── CreateReviewRequest.kt
│       └── response/
│           ├── PaymentResponse.kt
│           ├── ReviewResponse.kt
│           └── BidAnalyticsResponse.kt
├── local/
│   ├── dao/
│   │   ├── PaymentDao.kt (new)
│   │   └── ReviewDao.kt (new)
│   └── entity/
│       ├── PaymentEntity.kt (new)
│       └── ReviewEntity.kt (new)
└── mapper/
    ├── PaymentMapper.kt (new)
    └── ReviewMapper.kt (new)
```

### 4.2 Dependency Injection

**New Hilt Modules:**
```kotlin
@Module
@InstallIn(SingletonComponent::class)
object ApiModule {
    @Provides
    @Singleton
    fun providePaymentsApiService(retrofit: Retrofit): PaymentsApiService {
        return retrofit.create(PaymentsApiService::class.java)
    }

    @Provides
    @Singleton
    fun provideReviewsApiService(retrofit: Retrofit): ReviewsApiService {
        return retrofit.create(ReviewsApiService::class.java)
    }
}

@Module
@InstallIn(SingletonComponent::class)
object RepositoryModule {
    @Provides
    @Singleton
    fun provideBidsRepository(
        bidsApiService: BidsApiService,
        bidDao: BidDao,
        bidMapper: BidMapper
    ): BidsRepository {
        return BidsRepositoryImpl(bidsApiService, bidDao, bidMapper)
    }

    @Provides
    @Singleton
    fun providePaymentsRepository(
        paymentsApiService: PaymentsApiService,
        paymentDao: PaymentDao,
        paymentMapper: PaymentMapper
    ): PaymentsRepository {
        return PaymentsRepositoryImpl(paymentsApiService, paymentDao, paymentMapper)
    }

    @Provides
    @Singleton
    fun provideReviewsRepository(
        reviewsApiService: ReviewsApiService,
        reviewDao: ReviewDao,
        reviewMapper: ReviewMapper
    ): ReviewsRepository {
        return ReviewsRepositoryImpl(reviewsApiService, reviewDao, reviewMapper)
    }
}
```

### 4.3 Offline-First Strategy

**Room Database Schema Updates:**
```kotlin
@Database(
    entities = [
        JobEntity::class,
        BidEntity::class,
        MessageEntity::class,
        PaymentEntity::class,  // New
        ReviewEntity::class     // New
    ],
    version = 2,  // Increment version
    exportSchema = true
)
abstract class TaskaDatabase : RoomDatabase() {
    abstract fun jobDao(): JobDao
    abstract fun bidDao(): BidDao
    abstract fun messageDao(): MessageDao
    abstract fun paymentDao(): PaymentDao  // New
    abstract fun reviewDao(): ReviewDao    // New
}
```

**Caching Strategy:**
1. **Jobs**: Cache for 5 minutes, force refresh on pull-to-refresh
2. **Bids**: Real-time updates via socket, cache fallback
3. **Payments**: Cache transaction history, real-time status updates
4. **Reviews**: Cache read reviews, submit queue for offline writes
5. **Draft Jobs**: Persist locally until published or deleted

---

## 5. TESTING STRATEGY (CRITICAL PRIORITY)

### 5.1 Testing Philosophy

**Testing is the #1 priority as emphasized by stakeholder.**

**Coverage Goals:**
- **Overall Code Coverage**: >80%
- **Unit Test Coverage**: >85%
- **Integration Test Coverage**: >70%
- **UI Test Coverage**: >60%
- **Critical Path Coverage**: 100%

**Testing Pyramid:**
```
        /\
       /  \  E2E Tests (10%)
      /____\
     /      \  UI Tests (20%)
    /________\
   /          \  Integration Tests (30%)
  /__________\
 /              \  Unit Tests (40%)
/________________\
```

### 5.2 Unit Testing

**Tools:**
- JUnit 4
- Mockito-Kotlin
- Kotlinx-Coroutines-Test
- Turbine (Flow testing)
- AndroidX Arch Core Testing

**Test Structure:**
```
app/src/test/kotlin/za/co/taska/
├── domain/
│   └── usecase/
│       ├── jobs/
│       │   ├── CreateJobUseCaseTest.kt
│       │   ├── UpdateJobUseCaseTest.kt
│       │   ├── GetMyJobsUseCaseTest.kt
│       │   └── PublishJobUseCaseTest.kt
│       ├── bids/
│       │   ├── GetJobBidsUseCaseTest.kt
│       │   ├── AcceptBidUseCaseTest.kt
│       │   └── RejectBidUseCaseTest.kt
│       ├── payments/
│       │   └── InitiatePaymentUseCaseTest.kt
│       └── reviews/
│           └── CreateReviewUseCaseTest.kt
├── presentation/
│   └── viewmodel/
│       ├── PostJobViewModelTest.kt
│       ├── ClientJobsViewModelTest.kt
│       ├── BidsViewModelTest.kt
│       ├── PaymentViewModelTest.kt
│       └── ReviewViewModelTest.kt
├── data/
│   ├── repository/
│   │   ├── JobsRepositoryImplTest.kt
│   │   ├── BidsRepositoryImplTest.kt
│   │   ├── PaymentsRepositoryImplTest.kt
│   │   └── ReviewsRepositoryImplTest.kt
│   └── mapper/
│       ├── JobMapperTest.kt
│       ├── BidMapperTest.kt
│       ├── PaymentMapperTest.kt
│       └── ReviewMapperTest.kt
└── util/
    ├── ValidationUtilsTest.kt
    └── FormatterUtilsTest.kt
```

**Example Test: PostJobViewModelTest.kt**
```kotlin
@ExperimentalCoroutinesTest
class PostJobViewModelTest {
    @get:Rule
    val instantExecutorRule = InstantTaskExecutorRule()

    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    private lateinit var viewModel: PostJobViewModel
    private lateinit var createJobUseCase: CreateJobUseCase
    private lateinit var uploadJobImageUseCase: UploadJobImageUseCase
    private lateinit var publishJobUseCase: PublishJobUseCase
    private lateinit var locationManager: LocationManager
    private lateinit var savedStateHandle: SavedStateHandle

    @Before
    fun setup() {
        createJobUseCase = mock()
        uploadJobImageUseCase = mock()
        publishJobUseCase = mock()
        locationManager = mock()
        savedStateHandle = SavedStateHandle()

        viewModel = PostJobViewModel(
            createJobUseCase,
            uploadJobImageUseCase,
            publishJobUseCase,
            locationManager,
            savedStateHandle
        )
    }

    @Test
    fun `validateStep1 returns true when all required fields are valid`() = runTest {
        // Given
        viewModel.updateField("title", "Fix kitchen faucet")
        viewModel.updateField("description", "Leaking faucet needs professional repair urgently")
        viewModel.updateField("categoryId", "plumbing_123")
        viewModel.updateField("budget", "500")
        viewModel.updateField("budgetType", BudgetType.FIXED)
        viewModel.updateField("urgency", UrgencyLevel.HIGH)

        // When
        val result = viewModel.validateStep1()

        // Then
        assertThat(result).isTrue()
        assertThat(viewModel.state.value.errors).isEmpty()
    }

    @Test
    fun `validateStep1 returns false and shows error when title is too short`() = runTest {
        // Given
        viewModel.updateField("title", "Fix")  // Less than 5 chars

        // When
        val result = viewModel.validateStep1()

        // Then
        assertThat(result).isFalse()
        assertThat(viewModel.state.value.errors["title"]).isEqualTo("Title must be at least 5 characters")
    }

    @Test
    fun `uploadImage successfully uploads and adds URL to state`() = runTest {
        // Given
        val uri = mock<Uri>()
        val expectedUrl = "https://api.taska.co.za/uploads/jobs/job_123.webp"
        whenever(uploadJobImageUseCase(uri)).thenReturn(Result.success(expectedUrl))

        // When
        val result = viewModel.uploadImage(uri)

        // Then
        assertThat(result.isSuccess).isTrue()
        assertThat(result.getOrNull()).isEqualTo(expectedUrl)
        assertThat(viewModel.state.value.uploadedImages).hasSize(1)
        assertThat(viewModel.state.value.uploadedImages[0].url).isEqualTo(expectedUrl)
    }

    @Test
    fun `publishJob emits success when all validations pass`() = runTest {
        // Given
        setupValidJobData()
        val expectedJob = createMockJob()
        whenever(createJobUseCase(any())).thenReturn(Result.success(expectedJob))
        whenever(publishJobUseCase(expectedJob.id)).thenReturn(Result.success(expectedJob))

        // When
        val result = viewModel.publishJob()

        // Then
        assertThat(result.isSuccess).isTrue()
        verify(createJobUseCase).invoke(any())
        verify(publishJobUseCase).invoke(expectedJob.id)
    }

    @Test
    fun `saveDraft persists job locally even without internet`() = runTest {
        // Given
        setupValidJobData()
        whenever(createJobUseCase(any())).thenReturn(Result.failure(IOException("No internet")))

        // When
        val result = viewModel.saveDraft()

        // Then
        // Should save to Room database via repository
        // Verify draft saved locally
    }

    private fun setupValidJobData() {
        // Helper method to setup complete valid job data
    }

    private fun createMockJob() = Job(
        id = "job_123",
        clientId = "client_456",
        categoryId = "plumbing_123",
        title = "Fix kitchen faucet",
        description = "Leaking faucet needs professional repair urgently",
        budget = 500.0,
        budgetType = BudgetType.FIXED,
        urgency = UrgencyLevel.HIGH,
        status = JobStatus.DRAFT,
        address = Address(
            addressLine1 = "123 Main St",
            addressLine2 = null,
            city = "Cape Town",
            province = "Western Cape",
            postalCode = "8001",
            latitude = -33.9249,
            longitude = 18.4241
        ),
        images = emptyList(),
        requirements = emptyList(),
        startDate = null,
        endDate = null,
        createdAt = "2025-10-30T10:00:00Z",
        client = null,
        category = null
    )
}
```

**Test Coverage Requirements:**

**ViewModels (Critical - 100% coverage):**
- All state transformations
- All user interactions
- Error handling paths
- Loading states
- Success/failure scenarios

**Use Cases (Critical - 100% coverage):**
- Business logic validation
- Repository interactions
- Error handling
- Edge cases

**Repositories (High - >85% coverage):**
- API call handling
- Response mapping
- Error handling
- Caching logic
- Offline scenarios

**Mappers (High - 100% coverage):**
- DTO to Domain transformations
- Domain to Entity transformations
- Null handling
- Default value assignments

### 5.3 Integration Testing

**Tools:**
- AndroidX Test (JUnit)
- Room Testing
- Retrofit MockWebServer
- Hilt Testing

**Test Structure:**
```
app/src/androidTest/kotlin/za/co/taska/
├── data/
│   ├── local/
│   │   ├── JobDaoTest.kt
│   │   ├── BidDaoTest.kt
│   │   ├── PaymentDaoTest.kt
│   │   └── ReviewDaoTest.kt
│   └── remote/
│       ├── JobsApiServiceTest.kt
│       ├── BidsApiServiceTest.kt
│       ├── PaymentsApiServiceTest.kt
│       └── ReviewsApiServiceTest.kt
└── di/
    └── TestDatabaseModule.kt
```

**Example Test: JobDaoTest.kt**
```kotlin
@RunWith(AndroidJUnit4::class)
class JobDaoTest {
    private lateinit var database: TaskaDatabase
    private lateinit var jobDao: JobDao

    @Before
    fun setup() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        database = Room.inMemoryDatabaseBuilder(context, TaskaDatabase::class.java)
            .allowMainThreadQueries()
            .build()
        jobDao = database.jobDao()
    }

    @After
    fun tearDown() {
        database.close()
    }

    @Test
    fun insertJob_and_getJobById_returnsCorrectJob() = runTest {
        // Given
        val job = createTestJobEntity()

        // When
        jobDao.insertJob(job)
        val retrieved = jobDao.getJobById(job.id)

        // Then
        assertThat(retrieved).isNotNull()
        assertThat(retrieved?.id).isEqualTo(job.id)
        assertThat(retrieved?.title).isEqualTo(job.title)
    }

    @Test
    fun getJobs_returnsJobsSortedByDateDesc() = runTest {
        // Given
        val jobs = listOf(
            createTestJobEntity(id = "1", cachedAt = 1000L),
            createTestJobEntity(id = "2", cachedAt = 3000L),
            createTestJobEntity(id = "3", cachedAt = 2000L)
        )
        jobs.forEach { jobDao.insertJob(it) }

        // When
        val retrieved = jobDao.getJobs(limit = 10).first()

        // Then
        assertThat(retrieved).hasSize(3)
        assertThat(retrieved[0].id).isEqualTo("2") // Most recent
        assertThat(retrieved[1].id).isEqualTo("3")
        assertThat(retrieved[2].id).isEqualTo("1")
    }

    @Test
    fun deleteOldJobs_removesJobsOlderThanTimestamp() = runTest {
        // Given
        val oldJob = createTestJobEntity(id = "old", cachedAt = 1000L)
        val newJob = createTestJobEntity(id = "new", cachedAt = 5000L)
        jobDao.insertJob(oldJob)
        jobDao.insertJob(newJob)

        // When
        jobDao.deleteOldJobs(timestamp = 3000L)
        val remaining = jobDao.getJobs().first()

        // Then
        assertThat(remaining).hasSize(1)
        assertThat(remaining[0].id).isEqualTo("new")
    }
}
```

**Example Test: JobsApiServiceTest.kt**
```kotlin
@RunWith(AndroidJUnit4::class)
class JobsApiServiceTest {
    private lateinit var mockWebServer: MockWebServer
    private lateinit var apiService: JobsApiService

    @Before
    fun setup() {
        mockWebServer = MockWebServer()
        mockWebServer.start()

        val retrofit = Retrofit.Builder()
            .baseUrl(mockWebServer.url("/"))
            .addConverterFactory(GsonConverterFactory.create())
            .build()

        apiService = retrofit.create(JobsApiService::class.java)
    }

    @After
    fun tearDown() {
        mockWebServer.shutdown()
    }

    @Test
    fun createJob_returnsJobResponse_whenApiCallSucceeds() = runTest {
        // Given
        val mockResponse = """
            {
                "id": "job_123",
                "title": "Fix faucet",
                "status": "DRAFT",
                ...
            }
        """.trimIndent()

        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(201)
                .setBody(mockResponse)
        )

        val request = createTestJobRequest()

        // When
        val response = apiService.createJob(request)

        // Then
        assertThat(response.isSuccessful).isTrue()
        assertThat(response.body()?.id).isEqualTo("job_123")
        assertThat(response.body()?.status).isEqualTo("DRAFT")
    }

    @Test
    fun createJob_returns400_whenValidationFails() = runTest {
        // Given
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(400)
                .setBody("""{"message": "Title is required"}""")
        )

        val request = createInvalidJobRequest()

        // When
        val response = apiService.createJob(request)

        // Then
        assertThat(response.isSuccessful).isFalse()
        assertThat(response.code()).isEqualTo(400)
    }
}
```

### 5.4 UI Testing (Compose)

**Tools:**
- Compose UI Test
- Espresso
- Hilt Testing
- Screenshot Testing (Paparazzi/Shot)

**Test Structure:**
```
app/src/androidTest/kotlin/za/co/taska/
└── presentation/
    └── screens/
        └── client/
            ├── PostJobScreenTest.kt
            ├── ClientJobsScreenTest.kt
            ├── BidsScreenTest.kt
            ├── PaymentScreenTest.kt
            └── ReviewScreenTest.kt
```

**Example Test: PostJobScreenTest.kt**
```kotlin
@HiltAndroidTest
@RunWith(AndroidJUnit4::class)
class PostJobScreenTest {
    @get:Rule(order = 0)
    val hiltRule = HiltAndroidRule(this)

    @get:Rule(order = 1)
    val composeTestRule = createAndroidComposeRule<MainActivity>()

    @Before
    fun setup() {
        hiltRule.inject()
    }

    @Test
    fun postJobScreen_displaysStep1_onInitialLoad() {
        composeTestRule.setContent {
            PostJobScreen(
                viewModel = hiltViewModel(),
                onJobPublished = {},
                onNavigateBack = {}
            )
        }

        // Verify Step 1 fields are displayed
        composeTestRule.onNodeWithText("Job Title").assertIsDisplayed()
        composeTestRule.onNodeWithText("Description").assertIsDisplayed()
        composeTestRule.onNodeWithText("Category").assertIsDisplayed()
        composeTestRule.onNodeWithText("Budget").assertIsDisplayed()
    }

    @Test
    fun postJobScreen_showsValidationError_whenTitleTooShort() {
        composeTestRule.setContent {
            PostJobScreen(
                viewModel = hiltViewModel(),
                onJobPublished = {},
                onNavigateBack = {}
            )
        }

        // Enter short title
        composeTestRule.onNodeWithText("Job Title")
            .performTextInput("Fix")

        // Try to proceed
        composeTestRule.onNodeWithText("Next")
            .performClick()

        // Verify error message
        composeTestRule.onNodeWithText("Title must be at least 5 characters")
            .assertIsDisplayed()
    }

    @Test
    fun postJobScreen_navigatesToStep2_whenStep1Valid() {
        composeTestRule.setContent {
            PostJobScreen(
                viewModel = hiltViewModel(),
                onJobPublished = {},
                onNavigateBack = {}
            )
        }

        // Fill valid data
        composeTestRule.onNodeWithText("Job Title")
            .performTextInput("Fix kitchen faucet")
        composeTestRule.onNodeWithText("Description")
            .performTextInput("Leaking faucet needs professional repair urgently")
        // ... fill remaining fields

        // Click Next
        composeTestRule.onNodeWithText("Next")
            .performClick()

        // Verify Step 2 is displayed
        composeTestRule.onNodeWithText("Address Line 1")
            .assertIsDisplayed()
    }

    @Test
    fun postJobScreen_uploadsImage_whenCameraButtonClicked() {
        composeTestRule.setContent {
            PostJobScreen(
                viewModel = hiltViewModel(),
                onJobPublished = {},
                onNavigateBack = {}
            )
        }

        // Navigate to Step 3
        navigateToStep3()

        // Click camera button
        composeTestRule.onNodeWithContentDescription("Take Photo")
            .performClick()

        // Verify camera permission requested or launched
        // (This requires Espresso intents or permission testing)
    }

    @Test
    fun postJobScreen_savesAsDraft_whenSaveDraftClicked() {
        composeTestRule.setContent {
            PostJobScreen(
                viewModel = hiltViewModel(),
                onJobPublished = {},
                onNavigateBack = {}
            )
        }

        // Fill partial data
        composeTestRule.onNodeWithText("Job Title")
            .performTextInput("Fix kitchen faucet")

        // Click Save Draft
        composeTestRule.onNodeWithText("Save as Draft")
            .performClick()

        // Verify success snackbar
        composeTestRule.onNodeWithText("Draft saved successfully")
            .assertIsDisplayed()
    }
}
```

**Screenshot Testing Example:**
```kotlin
@RunWith(PaparazziTestRunner::class)
class PostJobScreenshotTest {
    @get:Rule
    val paparazzi = Paparazzi(
        deviceConfig = DeviceConfig.PIXEL_5,
        theme = "Theme.Taska"
    )

    @Test
    fun postJobScreen_step1_lightTheme() {
        paparazzi.snapshot {
            PostJobStep1Screen(
                viewModel = createMockViewModel(),
                onNext = {},
                onSaveDraft = {}
            )
        }
    }

    @Test
    fun postJobScreen_step1_withValidationErrors() {
        paparazzi.snapshot {
            PostJobStep1Screen(
                viewModel = createMockViewModelWithErrors(),
                onNext = {},
                onSaveDraft = {}
            )
        }
    }
}
```

### 5.5 End-to-End Testing

**Tools:**
- Maestro (recommended for mobile E2E)
- Espresso (alternative)

**Test Flows:**
```yaml
# maestro/client-post-job-flow.yaml
appId: za.co.taska.artisan
---
- launchApp
- tapOn: "Login"
- inputText: "client@test.com"
- tapOn: "Password"
- inputText: "password123"
- tapOn: "Log In"
- assertVisible: "Welcome"

# Navigate to Post Job
- tapOn: "Post Job"
- assertVisible: "Job Title"

# Fill Step 1
- tapOn: "Job Title"
- inputText: "Fix kitchen faucet"
- tapOn: "Description"
- inputText: "Leaking faucet needs professional repair urgently"
- tapOn: "Category"
- tapOn: "Plumbing"
- tapOn: "Budget"
- inputText: "500"
- tapOn: "Next"

# Fill Step 2
- assertVisible: "Address Line 1"
- tapOn: "Address Line 1"
- inputText: "123 Main Street"
- tapOn: "City"
- inputText: "Cape Town"
- tapOn: "Province"
- tapOn: "Western Cape"
- tapOn: "Postal Code"
- inputText: "8001"
- tapOn: "Use Current Location"
- tapOn: "Next"

# Fill Step 3
- assertVisible: "Upload Images"
- tapOn: "Take Photo"
# (Camera flow)
- tapOn: "Next"

# Review and Publish
- assertVisible: "Review & Publish"
- tapOn: "Publish Job"
- assertVisible: "Job published successfully"
- assertVisible: "My Jobs"
```

**Critical E2E Flows to Test:**
1. **Complete Job Posting Flow** (above)
2. **Bid Acceptance Flow**: View job → View bids → Accept bid → Confirm
3. **Payment Flow**: Accepted bid → Initiate payment → Enter payment details → Confirm → Success
4. **Review Flow**: Completed job → Review artisan → Submit review → Success
5. **Edit Job Flow**: My jobs → Select draft → Edit → Save → Publish
6. **Cancel Job Flow**: My jobs → Select job → Cancel → Enter reason → Confirm

### 5.6 Test Data & Fixtures

**Test Data Factory:**
```kotlin
object TestDataFactory {
    fun createTestJob(
        id: String = "job_${UUID.randomUUID()}",
        title: String = "Test Job",
        status: JobStatus = JobStatus.DRAFT
    ): Job = Job(
        id = id,
        clientId = "client_123",
        categoryId = "category_123",
        title = title,
        description = "Test job description for testing purposes",
        budget = 500.0,
        budgetType = BudgetType.FIXED,
        urgency = UrgencyLevel.MEDIUM,
        status = status,
        address = createTestAddress(),
        images = emptyList(),
        requirements = listOf("Test requirement 1", "Test requirement 2"),
        startDate = null,
        endDate = null,
        createdAt = "2025-10-30T10:00:00Z",
        client = createTestClientInfo(),
        category = createTestCategory()
    )

    fun createTestBid(
        id: String = "bid_${UUID.randomUUID()}",
        jobId: String = "job_123",
        amount: Double = 450.0
    ): Bid = Bid(
        id = id,
        jobId = jobId,
        artisanId = "artisan_123",
        amount = amount,
        proposal = "Test bid proposal",
        estimatedDuration = "2 days",
        status = BidStatus.PENDING,
        createdAt = "2025-10-30T10:00:00Z",
        artisan = createTestArtisanInfo()
    )

    fun createTestPayment(
        id: String = "payment_${UUID.randomUUID()}",
        amount: Double = 575.0
    ): Payment = Payment(
        id = id,
        jobId = "job_123",
        clientId = "client_123",
        artisanId = "artisan_123",
        amount = 500.0,
        platformFee = 75.0,
        totalAmount = amount,
        paymentMethod = PaymentMethod.CREDIT_CARD,
        status = PaymentStatus.COMPLETED,
        transactionId = "txn_123",
        receiptUrl = "https://example.com/receipt.pdf",
        createdAt = "2025-10-30T10:00:00Z",
        completedAt = "2025-10-30T10:05:00Z"
    )

    fun createTestReview(
        id: String = "review_${UUID.randomUUID()}",
        rating: Int = 5
    ): Review = Review(
        id = id,
        jobId = "job_123",
        clientId = "client_123",
        artisanId = "artisan_123",
        overallRating = rating,
        qualityRating = rating,
        professionalismRating = rating,
        timelinessRating = rating,
        valueRating = rating,
        reviewText = "Great work, highly recommended!",
        images = emptyList(),
        wouldRecommend = true,
        createdAt = "2025-10-30T10:00:00Z",
        updatedAt = null
    )

    // Helper methods
    private fun createTestAddress() = Address(...)
    private fun createTestClientInfo() = ClientInfo(...)
    private fun createTestCategory() = Category(...)
    private fun createTestArtisanInfo() = ArtisanInfo(...)
}
```

**Mock Repositories:**
```kotlin
class FakeJobsRepository : JobsRepository {
    private val jobs = mutableListOf<Job>()

    override suspend fun createJob(jobData: CreateJobDto): Result<Job> {
        val job = TestDataFactory.createTestJob(
            title = jobData.title,
            status = if (jobData.isDraft) JobStatus.DRAFT else JobStatus.OPEN
        )
        jobs.add(job)
        return Result.success(job)
    }

    override suspend fun getMyJobs(): Flow<Resource<List<Job>>> = flow {
        emit(Resource.Success(jobs))
    }

    // ... other methods
}
```

### 5.7 Continuous Testing

**GitHub Actions Workflow:**
```yaml
name: Android CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Set up JDK 17
      uses: actions/setup-java@v3
      with:
        java-version: '17'
        distribution: 'temurin'

    - name: Grant execute permission for gradlew
      run: chmod +x gradlew

    - name: Run unit tests
      run: ./gradlew test

    - name: Run instrumentation tests
      run: ./gradlew connectedAndroidTest

    - name: Generate coverage report
      run: ./gradlew jacocoTestReport

    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./app/build/reports/jacoco/jacocoTestReport/jacocoTestReport.xml

    - name: Enforce coverage threshold
      run: |
        coverage=$(cat app/build/reports/jacoco/jacocoTestReport/html/index.html | grep -oP '(?<=Total</td><td class="bar">)[0-9]+')
        if [ $coverage -lt 80 ]; then
          echo "Coverage is below 80%: $coverage%"
          exit 1
        fi
```

### 5.8 Test Checklist

**Before Merging PR:**
- [ ] All unit tests pass (>85% coverage)
- [ ] All integration tests pass (>70% coverage)
- [ ] All UI tests pass (>60% coverage)
- [ ] At least one E2E test per critical flow passes
- [ ] No new code without tests
- [ ] No test skips without justification
- [ ] Code coverage did not decrease
- [ ] All tests run in <5 minutes

**Before Release:**
- [ ] All automated tests pass
- [ ] Manual QA on physical devices (min 3 devices)
- [ ] Performance testing completed
- [ ] Security testing completed
- [ ] Accessibility testing completed
- [ ] Beta testing with 10+ users
- [ ] No critical/high severity bugs

---

## 6. Implementation Roadmap

### Phase 1: Foundation (Week 1)
**Goal:** Setup infrastructure and basic job posting

**Tasks:**
1. Create new API services (PaymentsApiService, ReviewsApiService)
2. Extend JobsApiService with client methods
3. Create DTOs (requests/responses)
4. Create domain models (Payment, Review, BidAnalytics)
5. Setup Room entities and DAOs
6. Create mappers
7. Implement repositories
8. Create use cases for job posting
9. **Write unit tests for all above components** ✅

**Deliverables:**
- Complete data layer for client features
- 100% test coverage for data layer
- CI/CD pipeline running tests

### Phase 2: Post Job Feature (Week 2)
**Goal:** Complete job posting flow with all steps

**Tasks:**
1. Create PostJobViewModel with validation logic
2. Implement PostJobStep1Screen (basic info)
3. Implement PostJobStep2Screen (location)
4. Implement PostJobStep3Screen (images & requirements)
5. Implement PostJobStep4Screen (review & publish)
6. Integrate CameraX for image capture
7. Implement image compression
8. Implement LocationPicker component
9. Add navigation routes
10. **Write unit tests for ViewModel** ✅
11. **Write UI tests for all steps** ✅
12. **Write E2E test for complete flow** ✅

**Deliverables:**
- Fully functional job posting
- >80% test coverage
- E2E test passing

### Phase 3: Job Management (Week 3)
**Goal:** View, edit, and manage jobs

**Tasks:**
1. Create ClientJobsViewModel
2. Implement ClientJobsScreen
3. Implement JobDetailsClientScreen
4. Implement EditJobScreen
5. Create JobCard component
6. Implement job filtering and sorting
7. Implement cancel/complete/delete actions
8. Add offline support
9. **Write unit tests** ✅
10. **Write UI tests** ✅
11. **Write integration tests for offline sync** ✅

**Deliverables:**
- Complete job management
- Offline-first implementation
- >80% test coverage

### Phase 4: Bid Management (Week 4)
**Goal:** Review and manage bids

**Tasks:**
1. Create BidsViewModel
2. Implement BidsScreen
3. Implement BidDetailsScreen
4. Create BidCard component
5. Implement bid analytics display
6. Implement accept/reject actions
7. Integrate real-time bid updates (Socket.IO)
8. **Write unit tests** ✅
9. **Write UI tests** ✅
10. **Write E2E test for bid acceptance** ✅

**Deliverables:**
- Complete bid management
- Real-time updates working
- >80% test coverage

### Phase 5: Payment Integration (Week 5)
**Goal:** Secure payment processing

**Tasks:**
1. Create PaymentViewModel
2. Implement PaymentScreen
3. Implement PaymentSuccessScreen
4. Integrate Stripe SDK
5. Implement payment method selection
6. Implement card input with validation
7. Implement receipt generation
8. Add payment history view
9. **Write unit tests** ✅
10. **Write UI tests** ✅
11. **Write integration tests with mock payment gateway** ✅
12. **Security testing** ✅

**Deliverables:**
- Functional payment system
- PCI-DSS compliant implementation
- >80% test coverage

### Phase 6: Reviews (Week 6)
**Goal:** Review and rating system

**Tasks:**
1. Create ReviewViewModel
2. Implement ReviewArtisanScreen
3. Create RatingBar component
4. Implement image upload for reviews
5. Implement review submission
6. Add review history view
7. **Write unit tests** ✅
8. **Write UI tests** ✅

**Deliverables:**
- Complete review system
- >80% test coverage

### Phase 7: Testing & Polish (Week 7)
**Goal:** Comprehensive testing and bug fixes

**Tasks:**
1. Run full test suite
2. Fix all failing tests
3. Achieve >80% code coverage
4. Manual QA on multiple devices
5. Performance optimization
6. Accessibility improvements
7. UI/UX polish
8. Documentation

**Deliverables:**
- All tests passing
- >80% code coverage achieved
- Zero critical bugs
- Production-ready code

### Phase 8: Beta & Release (Week 8)
**Goal:** Beta testing and production release

**Tasks:**
1. Internal beta testing
2. External beta with 10+ users
3. Collect and address feedback
4. Final regression testing
5. Prepare release notes
6. Submit to Play Store (if applicable)

**Deliverables:**
- Beta feedback incorporated
- Production release ready
- Release documentation

---

## 7. Risk Assessment

### 7.1 Technical Risks

**High Risk:**
- **Payment Integration Complexity**
  - Mitigation: Start early, use well-documented SDKs, extensive testing

- **Image Upload Performance**
  - Mitigation: Implement compression, background upload, progress indication

- **Offline Sync Conflicts**
  - Mitigation: Timestamp-based conflict resolution, user notification

**Medium Risk:**
- **Real-time Bid Updates**
  - Mitigation: Fallback to polling, test Socket.IO thoroughly

- **Location Accuracy**
  - Mitigation: Multiple location sources, user verification

**Low Risk:**
- **Navigation Complexity**
  - Mitigation: Well-structured navigation graph, deep link testing

### 7.2 Testing Risks

**High Risk:**
- **Insufficient Test Coverage**
  - Mitigation: Enforce 80% threshold in CI/CD, code review focus on tests

- **Flaky Tests**
  - Mitigation: Test stability monitoring, rerun failed tests, fix flakiness

**Medium Risk:**
- **Long Test Execution Time**
  - Mitigation: Parallel test execution, test optimization, test sharding

### 7.3 Schedule Risks

**High Risk:**
- **Underestimated Complexity**
  - Mitigation: 20% buffer in timeline, iterative delivery

- **Testing Phase Delays**
  - Mitigation: Write tests alongside implementation, dedicated testing time

---

## 8. Success Criteria

### 8.1 Functional Success

- [ ] Clients can post jobs with all required fields
- [ ] Clients can view and manage their jobs
- [ ] Clients can review and accept/reject bids
- [ ] Clients can process payments securely
- [ ] Clients can review artisans
- [ ] All offline scenarios handled gracefully
- [ ] Real-time updates working

### 8.2 Quality Success

- [ ] **>80% overall code coverage** ✅ (Critical requirement)
- [ ] >85% unit test coverage
- [ ] >70% integration test coverage
- [ ] >60% UI test coverage
- [ ] 100% critical path coverage
- [ ] Zero critical bugs in production
- [ ] <1% crash rate

### 8.3 Performance Success

- [ ] Job posting completes in <3 seconds
- [ ] Image upload with compression <5 seconds per image
- [ ] App startup time <2 seconds
- [ ] Smooth 60fps scrolling
- [ ] Memory usage <150MB

### 8.4 User Experience Success

- [ ] Intuitive navigation (tested with 5+ users)
- [ ] Clear error messages
- [ ] Accessibility score >90
- [ ] Material Design 3 compliance
- [ ] Positive beta user feedback (>4.0/5.0)

---

## 9. Agent Coordination Strategy

### 9.1 Recommended Agent Sequence

**Phase 1-2: Foundation + Post Job**
1. `/sc:design` - Design system architecture, screen layouts, and data flow
   - Input: This requirements document
   - Output: Detailed technical design, component breakdown

2. `/sc:implement` - Implement data layer and core use cases
   - Input: Design document
   - Output: Repositories, API services, use cases, mappers

3. `/sc:test` - Write unit tests for data layer
   - Input: Implemented components
   - Output: Comprehensive test suite with >85% coverage

4. `/sc:implement` - Implement PostJob screens and ViewModels
   - Input: Design + tested data layer
   - Output: All PostJob screens, ViewModels, components

5. `/sc:test` - Write UI and integration tests
   - Input: Implemented screens
   - Output: UI tests, E2E tests for job posting

**Phase 3-4: Job Management + Bids**
6. `/sc:implement` - Job management features
   - Input: Design + existing codebase
   - Output: ClientJobs, JobDetails, Edit screens

7. `/sc:test` - Write tests for job management
   - Input: Implemented features
   - Output: Unit + UI tests

8. `/sc:implement` - Bid management features
   - Input: Design + existing codebase
   - Output: Bids, BidDetails screens

9. `/sc:test` - Write tests for bid management
   - Input: Implemented features
   - Output: Unit + UI + E2E tests

**Phase 5-6: Payment + Reviews**
10. `/sc:implement` - Payment integration
    - Input: Design + payment provider docs
    - Output: Payment screens, Stripe integration

11. `/sc:test` - Write payment tests (including security)
    - Input: Payment implementation
    - Output: Comprehensive test suite

12. `/sc:implement` - Review system
    - Input: Design + existing codebase
    - Output: Review screens, submission logic

13. `/sc:test` - Write review tests
    - Input: Review implementation
    - Output: Unit + UI tests

**Phase 7-8: Quality + Release**
14. `/sc:test` - Run full test suite, fix failing tests
    - Input: Complete codebase
    - Output: All tests passing, >80% coverage

15. `/sc:troubleshoot` - Fix any integration issues or bugs
    - Input: Test results, bug reports
    - Output: Bug fixes, optimizations

16. `/sc:document` - Generate final documentation
    - Input: Complete implementation
    - Output: API docs, user guides, deployment docs

### 9.2 Coordination Principles

**Sequential Dependencies:**
- Design before implementation
- Data layer before presentation layer
- Implementation before testing (per component)
- Unit tests before integration tests
- Integration tests before E2E tests

**Parallel Opportunities:**
- Multiple screen implementations (same phase)
- Different test types (unit, integration, UI)
- Documentation during final testing

**Handoff Requirements:**
- Each agent provides clear deliverables document
- Code must compile before handoff
- Existing tests must pass before new work
- Design decisions documented for next agent

---

## 10. Documentation Requirements

### 10.1 Code Documentation

- [ ] KDoc comments for all public APIs
- [ ] Inline comments for complex logic
- [ ] README per module
- [ ] Architecture decision records (ADRs)

### 10.2 Testing Documentation

- [ ] Test coverage report (HTML)
- [ ] Test execution report
- [ ] Manual test cases document
- [ ] Bug tracking report

### 10.3 User Documentation

- [ ] Feature user guide
- [ ] FAQ document
- [ ] Video tutorials (optional)

---

## 11. Appendix

### 11.1 Backend API Reference

**Base URL (Debug):** `http://10.0.2.2:3000/api/v1/`
**Base URL (Production):** `https://api.taska.co.za/api/v1/`

**Authentication:** Bearer token in Authorization header

See [Backend Jobs Controller](C:\Users\Yaseen\OneDrive\Documents\Investments\Taska\backend\src\modules\jobs\jobs.controller.ts) for complete API specification.

### 11.2 Design System Reference

**Colors:** See `presentation/theme/Color.kt`
**Typography:** See `presentation/theme/Type.kt`
**Dimensions:** See `presentation/theme/Dimensions.kt`

### 11.3 Dependencies

All dependencies already present in `app/build.gradle.kts`:
- Jetpack Compose (Material 3)
- Hilt
- Room
- Retrofit
- Coil
- CameraX
- Accompanist (Permissions)
- Testing libraries (JUnit, Mockito, Turbine, Espresso)

**Additional Needed:**
- Stripe SDK (for payments)
- Google Maps SDK (for location picker)

---

## Summary

This comprehensive requirements document provides:

1. **Complete Feature Specifications** for all 6 client portal features
2. **Detailed Gap Analysis** showing what exists vs. what's needed
3. **Extensive Testing Strategy** with >80% coverage goal (stakeholder priority)
4. **8-Week Implementation Roadmap** with clear milestones
5. **Agent Coordination Strategy** for systematic implementation
6. **Risk Assessment** with mitigation strategies
7. **Technical Architecture** aligned with existing clean architecture

**Next Steps:**
1. Review and approve this requirements document
2. Invoke `/sc:design` to create detailed technical design
3. Begin Phase 1 implementation
4. Maintain focus on testing at every phase (CRITICAL!)

**Testing Emphasis:**
- **Every implementation task includes corresponding test task**
- **80% coverage is non-negotiable success criterion**
- **Tests must be written alongside implementation, not after**
- **CI/CD enforces coverage thresholds**
- **Code review checklist includes test coverage verification**

This document serves as the single source of truth for the Android client portal implementation.
