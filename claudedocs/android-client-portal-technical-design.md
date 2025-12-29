# Taska Android Client Portal - Technical Design Document

**Version:** 1.0
**Date:** 2025-10-31
**Status:** Design Phase
**Priority:** HIGH (Testing emphasis)

---

## Document Overview

This technical design document provides detailed architectural specifications, component designs, and implementation guidelines for the Taska Android Client Portal. It translates the comprehensive requirements into concrete, implementable technical solutions.

### Design Goals

1. **Maintainability**: Clean Architecture with clear separation of concerns
2. **Testability**: >80% code coverage with comprehensive test infrastructure
3. **Scalability**: Extensible design for future features
4. **Performance**: Offline-first with efficient caching and network optimization
5. **User Experience**: Material Design 3 compliance with intuitive flows

### Document Structure

- **Part 1**: System Architecture Overview
- **Part 2**: Data Layer Design
- **Part 3**: Domain Layer Design
- **Part 4**: Presentation Layer Design
- **Part 5**: Navigation Architecture
- **Part 6**: Testing Architecture
- **Part 7**: Implementation Specifications

---

## Part 1: System Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Screens    │  │  ViewModels  │  │  Components  │     │
│  │  (Compose)   │←→│   (State)    │←→│    (UI)      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                      Domain Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Use Cases   │  │ Repositories │  │    Models    │     │
│  │  (Business)  │←→│ (Interfaces) │←→│   (Domain)   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                       Data Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Repositories │  │  API Services│  │  Room DAOs   │     │
│  │    (Impl)    │←→│   (Retrofit) │  │  (Database)  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Mappers    │  │     DTOs     │  │   Entities   │     │
│  │ (Transform)  │←→│   (Network)  │  │    (Local)   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Package Structure

```
za.co.taska/
├── di/                              # Dependency Injection
│   ├── NetworkModule.kt             # ✅ Exists
│   ├── DatabaseModule.kt            # ✅ Exists
│   ├── RepositoryModule.kt          # ✅ Exists
│   ├── AppModule.kt                 # ✅ Exists
│   ├── ApiModule.kt                 # 🆕 NEW (Payments, Reviews)
│   └── UseCaseModule.kt             # 🆕 NEW (Client use cases)
│
├── data/                            # Data Layer
│   ├── remote/
│   │   ├── api/
│   │   │   ├── AuthApiService.kt           # ✅ Exists
│   │   │   ├── JobsApiService.kt           # ⚠️ EXTEND
│   │   │   ├── BidsApiService.kt           # ⚠️ EXTEND
│   │   │   ├── MessagesApiService.kt       # ✅ Exists
│   │   │   ├── PaymentsApiService.kt       # 🆕 NEW
│   │   │   └── ReviewsApiService.kt        # 🆕 NEW
│   │   ├── dto/
│   │   │   ├── request/
│   │   │   │   ├── CreateJobRequest.kt     # 🆕 NEW
│   │   │   │   ├── UpdateJobRequest.kt     # 🆕 NEW
│   │   │   │   ├── AcceptBidRequest.kt     # 🆕 NEW
│   │   │   │   ├── RejectBidRequest.kt     # 🆕 NEW
│   │   │   │   ├── CreatePaymentRequest.kt # 🆕 NEW
│   │   │   │   └── CreateReviewRequest.kt  # 🆕 NEW
│   │   │   └── response/
│   │   │       ├── JobResponse.kt          # ✅ Exists
│   │   │       ├── BidResponse.kt          # ✅ Exists
│   │   │       ├── PaymentResponse.kt      # 🆕 NEW
│   │   │       ├── ReviewResponse.kt       # 🆕 NEW
│   │   │       └── BidAnalyticsResponse.kt # 🆕 NEW
│   │   └── interceptor/
│   │       └── AuthInterceptor.kt          # ✅ Exists
│   ├── local/
│   │   ├── TaskaDatabase.kt                # ⚠️ EXTEND (v2)
│   │   ├── dao/
│   │   │   ├── JobDao.kt                   # ✅ Exists
│   │   │   ├── BidDao.kt                   # ✅ Exists
│   │   │   ├── MessageDao.kt               # ✅ Exists
│   │   │   ├── PaymentDao.kt               # 🆕 NEW
│   │   │   └── ReviewDao.kt                # 🆕 NEW
│   │   ├── entity/
│   │   │   ├── JobEntity.kt                # ✅ Exists
│   │   │   ├── BidEntity.kt                # ✅ Exists
│   │   │   ├── MessageEntity.kt            # ✅ Exists
│   │   │   ├── PaymentEntity.kt            # 🆕 NEW
│   │   │   └── ReviewEntity.kt             # 🆕 NEW
│   │   ├── converter/
│   │   │   └── Converters.kt               # ✅ Exists
│   │   └── preferences/
│   │       └── PreferencesManager.kt       # ✅ Exists
│   ├── repository/
│   │   ├── AuthRepositoryImpl.kt           # ✅ Exists
│   │   ├── JobsRepositoryImpl.kt           # ⚠️ EXTEND
│   │   ├── BidsRepositoryImpl.kt           # 🆕 NEW
│   │   ├── PaymentsRepositoryImpl.kt       # 🆕 NEW
│   │   └── ReviewsRepositoryImpl.kt        # 🆕 NEW
│   └── mapper/
│       ├── JobMapper.kt                    # ✅ Exists
│       ├── BidMapper.kt                    # ✅ Exists
│       ├── MessageMapper.kt                # ✅ Exists
│       ├── UserMapper.kt                   # ✅ Exists
│       ├── PaymentMapper.kt                # 🆕 NEW
│       └── ReviewMapper.kt                 # 🆕 NEW
│
├── domain/                          # Domain Layer
│   ├── model/
│   │   ├── User.kt                         # ✅ Exists
│   │   ├── Job.kt                          # ✅ Exists
│   │   ├── Bid.kt                          # ✅ Exists
│   │   ├── Message.kt                      # ✅ Exists
│   │   ├── Resource.kt                     # ✅ Exists
│   │   ├── Payment.kt                      # 🆕 NEW
│   │   ├── Review.kt                       # 🆕 NEW
│   │   └── BidAnalytics.kt                 # 🆕 NEW
│   ├── repository/
│   │   ├── AuthRepository.kt               # ✅ Exists
│   │   ├── JobsRepository.kt               # ⚠️ EXTEND
│   │   ├── BidsRepository.kt               # 🆕 NEW
│   │   ├── PaymentsRepository.kt           # 🆕 NEW
│   │   └── ReviewsRepository.kt            # 🆕 NEW
│   ├── usecase/
│   │   ├── auth/                           # ✅ Exists
│   │   │   ├── LoginUseCase.kt
│   │   │   └── RegisterUseCase.kt
│   │   ├── jobs/
│   │   │   ├── GetNearbyJobsUseCase.kt     # ✅ Exists
│   │   │   ├── GetJobByIdUseCase.kt        # ✅ Exists
│   │   │   ├── CreateJobUseCase.kt         # 🆕 NEW
│   │   │   ├── UpdateJobUseCase.kt         # 🆕 NEW
│   │   │   ├── DeleteJobUseCase.kt         # 🆕 NEW
│   │   │   ├── PublishJobUseCase.kt        # 🆕 NEW
│   │   │   ├── GetMyJobsUseCase.kt         # 🆕 NEW
│   │   │   ├── CancelJobUseCase.kt         # 🆕 NEW
│   │   │   ├── CompleteJobUseCase.kt       # 🆕 NEW
│   │   │   └── UploadJobImageUseCase.kt    # 🆕 NEW
│   │   ├── bids/
│   │   │   ├── GetJobBidsUseCase.kt        # 🆕 NEW
│   │   │   ├── AcceptBidUseCase.kt         # 🆕 NEW
│   │   │   ├── RejectBidUseCase.kt         # 🆕 NEW
│   │   │   └── GetBidAnalyticsUseCase.kt   # 🆕 NEW
│   │   ├── payments/
│   │   │   ├── InitiatePaymentUseCase.kt   # 🆕 NEW
│   │   │   └── GetPaymentStatusUseCase.kt  # 🆕 NEW
│   │   └── reviews/
│   │       ├── CreateReviewUseCase.kt      # 🆕 NEW
│   │       └── UploadReviewImagesUseCase.kt# 🆕 NEW
│   └── location/
│       └── LocationManager.kt              # ✅ Exists
│
└── presentation/                    # Presentation Layer
    ├── MainActivity.kt                     # ✅ Exists
    ├── navigation/
    │   ├── NavGraph.kt                     # ⚠️ EXTEND
    │   └── Screen.kt                       # ⚠️ EXTEND
    ├── theme/                              # ✅ Exists
    │   ├── Color.kt
    │   ├── Type.kt
    │   ├── Theme.kt
    │   └── Dimensions.kt
    ├── components/                         # ✅ Partial
    │   ├── TaskaButton.kt                  # ✅ Exists
    │   ├── TaskaTextField.kt               # ✅ Exists
    │   ├── TaskaPasswordField.kt           # ✅ Exists
    │   ├── ErrorMessage.kt                 # ✅ Exists
    │   ├── JobCard.kt                      # 🆕 NEW
    │   ├── BidCard.kt                      # 🆕 NEW
    │   ├── ImageUploadSection.kt           # 🆕 NEW
    │   ├── LocationPicker.kt               # 🆕 NEW
    │   ├── CategorySelector.kt             # 🆕 NEW
    │   ├── BudgetInput.kt                  # 🆕 NEW
    │   ├── UrgencySelector.kt              # 🆕 NEW
    │   ├── RatingBar.kt                    # 🆕 NEW
    │   └── PaymentMethodSelector.kt        # 🆕 NEW
    ├── screens/
    │   ├── splash/                         # ✅ Exists
    │   │   ├── SplashScreen.kt
    │   │   └── SplashViewModel.kt
    │   ├── auth/                           # ✅ Exists
    │   │   ├── login/
    │   │   │   ├── LoginScreen.kt
    │   │   │   └── LoginViewModel.kt
    │   │   └── register/
    │   │       ├── RegisterScreen.kt
    │   │       └── RegisterViewModel.kt
    │   ├── artisan/                        # ✅ Exists (not our focus)
    │   └── client/                         # 🆕 NEW SECTION
    │       ├── home/
    │       │   ├── ClientHomeScreen.kt     # 🆕 NEW
    │       │   └── ClientHomeViewModel.kt  # 🆕 NEW
    │       ├── jobs/
    │       │   ├── post/
    │       │   │   ├── PostJobScreen.kt
    │       │   │   ├── PostJobStep1Screen.kt
    │       │   │   ├── PostJobStep2Screen.kt
    │       │   │   ├── PostJobStep3Screen.kt
    │       │   │   ├── PostJobStep4Screen.kt
    │       │   │   └── PostJobViewModel.kt
    │       │   ├── list/
    │       │   │   ├── ClientJobsScreen.kt
    │       │   │   └── ClientJobsViewModel.kt
    │       │   ├── details/
    │       │   │   ├── JobDetailsClientScreen.kt
    │       │   │   └── JobDetailsViewModel.kt
    │       │   └── edit/
    │       │       ├── EditJobScreen.kt
    │       │       └── EditJobViewModel.kt
    │       ├── bids/
    │       │   ├── list/
    │       │   │   ├── BidsScreen.kt
    │       │   │   └── BidsViewModel.kt
    │       │   └── details/
    │       │       └── BidDetailsScreen.kt
    │       ├── payment/
    │       │   ├── PaymentScreen.kt
    │       │   ├── PaymentSuccessScreen.kt
    │       │   └── PaymentViewModel.kt
    │       └── review/
    │           ├── ReviewArtisanScreen.kt
    │           └── ReviewViewModel.kt
    └── permissions/
        └── PermissionHandler.kt            # ✅ Exists
```

### 1.3 Dependency Flow

```
Presentation Layer
    ↓ (depends on)
Domain Layer (interfaces only)
    ↑ (implemented by)
Data Layer (concrete implementations)
```

**Key Principles:**
- Presentation depends on Domain (interfaces)
- Domain has NO dependencies on other layers
- Data implements Domain interfaces
- Dependency Inversion via Hilt

### 1.4 Data Flow Patterns

#### Pattern 1: Network-First with Cache Fallback
```kotlin
// For real-time critical data (bids, payments)
suspend fun getBids(jobId: String): Flow<Resource<List<Bid>>> = flow {
    emit(Resource.Loading())

    // Try network first
    try {
        val response = apiService.getJobBids(jobId)
        if (response.isSuccessful) {
            val bids = response.body()!!.map { mapper.toDomain(it) }

            // Cache in Room
            bidDao.insertBids(bids.map { mapper.toEntity(it) })

            emit(Resource.Success(bids))
        } else {
            // Network failed, use cache
            val cached = bidDao.getBidsByJobId(jobId).first()
            emit(Resource.Success(cached.map { mapper.toDomain(it) }))
        }
    } catch (e: Exception) {
        // Network error, use cache
        val cached = bidDao.getBidsByJobId(jobId).first()
        if (cached.isNotEmpty()) {
            emit(Resource.Success(cached.map { mapper.toDomain(it) }))
        } else {
            emit(Resource.Error(e.message ?: "Unknown error"))
        }
    }
}
```

#### Pattern 2: Cache-First with Background Refresh
```kotlin
// For less critical data (job list)
suspend fun getMyJobs(): Flow<Resource<List<Job>>> = flow {
    // Emit cached data immediately
    val cached = jobDao.getMyJobs().first()
    if (cached.isNotEmpty()) {
        emit(Resource.Success(cached.map { mapper.toDomain(it) }))
    }

    // Fetch fresh data in background
    try {
        val response = apiService.getMyJobs()
        if (response.isSuccessful) {
            val jobs = response.body()!!.map { mapper.toDomain(it) }

            // Update cache
            jobDao.insertJobs(jobs.map { mapper.toEntity(it) })

            // Emit fresh data
            emit(Resource.Success(jobs))
        }
    } catch (e: Exception) {
        // If cache was empty, emit error
        if (cached.isEmpty()) {
            emit(Resource.Error(e.message ?: "Unknown error"))
        }
    }
}
```

#### Pattern 3: Offline-First for Writes
```kotlin
// For mutations (create job, draft save)
suspend fun createJob(jobData: CreateJobDto): Result<Job> {
    return try {
        if (networkMonitor.isOnline()) {
            // Online: Send to API
            val response = apiService.createJob(mapper.toRequest(jobData))
            if (response.isSuccessful) {
                val job = mapper.toDomain(response.body()!!)

                // Cache locally
                jobDao.insertJob(mapper.toEntity(job))

                Result.success(job)
            } else {
                Result.failure(HttpException(response))
            }
        } else {
            // Offline: Save locally with pending sync flag
            val draftJob = createDraftJob(jobData)
            jobDao.insertJobWithSyncPending(mapper.toEntity(draftJob))

            Result.success(draftJob)
        }
    } catch (e: Exception) {
        Result.failure(e)
    }
}
```

---

## Part 2: Data Layer Design

### 2.1 API Service Extensions

#### JobsApiService.kt (Extensions)
```kotlin
@Headers("Content-Type: application/json")
interface JobsApiService {

    // ✅ EXISTING (don't modify)
    @GET("jobs/nearby")
    suspend fun getNearbyJobs(
        @Query("latitude") latitude: Double,
        @Query("longitude") longitude: Double,
        @Query("radius") radius: Double = 50.0
    ): Response<List<JobResponse>>

    @GET("jobs/{id}")
    suspend fun getJobById(@Path("id") jobId: String): Response<JobResponse>

    // 🆕 NEW CLIENT ENDPOINTS

    @POST("jobs")
    suspend fun createJob(
        @Body request: CreateJobRequest
    ): Response<JobResponse>

    @PATCH("jobs/{id}")
    suspend fun updateJob(
        @Path("id") jobId: String,
        @Body request: UpdateJobRequest
    ): Response<JobResponse>

    @DELETE("jobs/{id}")
    suspend fun deleteJob(
        @Path("id") jobId: String
    ): Response<Unit>

    @PUT("jobs/{id}/publish")
    suspend fun publishJob(
        @Path("id") jobId: String
    ): Response<JobResponse>

    @GET("jobs/my-jobs")
    suspend fun getMyJobs(): Response<List<JobResponse>>

    @PUT("jobs/{id}/cancel")
    suspend fun cancelJob(
        @Path("id") jobId: String,
        @Body request: CancelJobRequest
    ): Response<JobResponse>

    @PUT("jobs/{id}/complete")
    suspend fun completeJob(
        @Path("id") jobId: String
    ): Response<JobResponse>

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

#### PaymentsApiService.kt (New)
```kotlin
@Headers("Content-Type: application/json")
interface PaymentsApiService {

    @POST("payments")
    suspend fun initiatePayment(
        @Body request: CreatePaymentRequest
    ): Response<PaymentResponse>

    @GET("payments/{id}")
    suspend fun getPaymentStatus(
        @Path("id") paymentId: String
    ): Response<PaymentResponse>

    @GET("payments/job/{jobId}")
    suspend fun getPaymentByJobId(
        @Path("jobId") jobId: String
    ): Response<PaymentResponse>

    @GET("payments/history")
    suspend fun getPaymentHistory(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): Response<PaginatedResponse<PaymentResponse>>
}
```

#### ReviewsApiService.kt (New)
```kotlin
@Headers("Content-Type: application/json")
interface ReviewsApiService {

    @POST("reviews")
    suspend fun createReview(
        @Body request: CreateReviewRequest
    ): Response<ReviewResponse>

    @PATCH("reviews/{id}")
    suspend fun updateReview(
        @Path("id") reviewId: String,
        @Body request: UpdateReviewRequest
    ): Response<ReviewResponse>

    @GET("reviews/job/{jobId}")
    suspend fun getJobReviews(
        @Path("jobId") jobId: String
    ): Response<List<ReviewResponse>>

    @GET("reviews/artisan/{artisanId}")
    suspend fun getArtisanReviews(
        @Path("artisanId") artisanId: String,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): Response<PaginatedResponse<ReviewResponse>>

    @Multipart
    @POST("reviews/upload-images")
    suspend fun uploadImages(
        @Part images: List<MultipartBody.Part>
    ): Response<List<ImageUploadResponse>>
}
```

### 2.2 DTO Design

#### CreateJobRequest.kt
```kotlin
data class CreateJobRequest(
    val title: String,
    val description: String,
    val categoryId: String,
    val budget: Double,
    val budgetType: String,           // "FIXED" | "HOURLY" | "NEGOTIABLE"
    val urgency: String,              // "LOW" | "MEDIUM" | "HIGH" | "URGENT"
    val addressLine1: String,
    val addressLine2: String?,
    val city: String,
    val province: String,
    val postalCode: String,
    val latitude: Double,
    val longitude: Double,
    val images: List<String>,         // Image URLs from upload
    val requirements: List<String>,
    val startDate: String?,           // ISO 8601 format
    val endDate: String?,             // ISO 8601 format
    val isDraft: Boolean = true
)
```

**Validation Rules:**
- `title`: 5-100 characters
- `description`: 20-2000 characters
- `budget`: > 0
- `addressLine1`: required, max 200 chars
- `city`: required, max 100 chars
- `postalCode`: 4 digits (SA format)
- `images`: max 5
- `requirements`: max 10, each max 200 chars

#### PaymentResponse.kt
```kotlin
data class PaymentResponse(
    val id: String,
    val jobId: String,
    val clientId: String,
    val artisanId: String,
    val bidId: String,
    val amount: Double,
    val platformFee: Double,
    val totalAmount: Double,
    val paymentMethod: String,        // "CREDIT_CARD" | "DEBIT_CARD" | "EFT"
    val status: String,               // "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED"
    val transactionId: String?,
    val receiptUrl: String?,
    val createdAt: String,
    val completedAt: String?,
    val metadata: Map<String, Any>?
)
```

This is Part 1 of the design document. Shall I continue with the remaining parts?
