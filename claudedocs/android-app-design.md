# Taska Android App - Comprehensive Design Specification

## Executive Summary

This document outlines the complete technical design for the Taska Android mobile application, designed specifically for South African artisans with varying literacy levels. The app focuses on accessibility, simplicity, and seamless integration with existing backend services.

### Design Principles
- **Accessibility First**: Large touch targets, simple language, visual icons
- **Offline Capable**: Core features work without internet
- **Low Data Usage**: Optimized for South African mobile networks
- **Simple Navigation**: Maximum 3 taps to any feature
- **Visual Communication**: Icons and images over text

---

## 1. System Architecture

### 1.1 Technology Stack

```
┌─────────────────────────────────────────┐
│         Android Application              │
├─────────────────────────────────────────┤
│  Language: Kotlin                        │
│  Min SDK: 24 (Android 7.0)              │
│  Target SDK: 34 (Android 14)            │
│  Architecture: MVVM + Clean Architecture │
└─────────────────────────────────────────┘
```

**Core Libraries:**
- **UI Framework**: Jetpack Compose (Material 3)
- **Networking**: Retrofit2 + OkHttp3
- **Local Database**: Room Persistence Library
- **Image Loading**: Coil
- **Dependency Injection**: Hilt
- **Async Operations**: Coroutines + Flow
- **Navigation**: Jetpack Navigation Compose
- **State Management**: ViewModel + StateFlow
- **Authentication**: JWT with Secure Storage
- **Location Services**: Google Play Services Location
- **Real-time Messaging**: Socket.IO Android Client
- **Camera**: CameraX
- **Permissions**: Accompanist Permissions

### 1.2 Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Composables │  │  ViewModels  │  │  Navigation  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                     Domain Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Use Cases   │  │  Repositories│  │  Domain      │ │
│  │              │  │  Interfaces  │  │  Models      │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                      Data Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Remote      │  │  Local       │  │  DTOs &      │ │
│  │  Data Source │  │  Data Source │  │  Mappers     │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 1.3 Project Structure

```
taska-android/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── kotlin/
│   │   │   │   └── za/co/taska/
│   │   │   │       ├── TaskaApplication.kt
│   │   │   │       ├── di/                  # Dependency Injection
│   │   │   │       │   ├── AppModule.kt
│   │   │   │       │   ├── NetworkModule.kt
│   │   │   │       │   ├── DatabaseModule.kt
│   │   │   │       │   └── RepositoryModule.kt
│   │   │   │       ├── data/
│   │   │   │       │   ├── local/
│   │   │   │       │   │   ├── dao/
│   │   │   │       │   │   ├── entities/
│   │   │   │       │   │   └── TaskaDatabase.kt
│   │   │   │       │   ├── remote/
│   │   │   │       │   │   ├── api/
│   │   │   │       │   │   ├── dto/
│   │   │   │       │   │   └── interceptors/
│   │   │   │       │   └── repository/
│   │   │   │       ├── domain/
│   │   │   │       │   ├── model/
│   │   │   │       │   ├── repository/
│   │   │   │       │   └── usecase/
│   │   │   │       └── presentation/
│   │   │   │           ├── MainActivity.kt
│   │   │   │           ├── navigation/
│   │   │   │           ├── theme/
│   │   │   │           ├── components/      # Reusable UI
│   │   │   │           └── screens/
│   │   │   │               ├── auth/
│   │   │   │               ├── home/
│   │   │   │               ├── jobs/
│   │   │   │               ├── bids/
│   │   │   │               ├── messages/
│   │   │   │               ├── profile/
│   │   │   │               └── wallet/
│   │   │   ├── res/
│   │   │   │   ├── drawable/
│   │   │   │   ├── values/
│   │   │   │   └── xml/
│   │   │   └── AndroidManifest.xml
│   │   └── test/
│   └── build.gradle.kts
├── buildSrc/                                # Build configuration
├── gradle/
└── build.gradle.kts
```

---

## 2. User Interface Design

### 2.1 Design System (Based on Website)

**Color Palette (from website layout.tsx):**
```kotlin
object TaskaColors {
    // Primary (Teal - #16A085)
    val Primary600 = Color(0xFF16A085)
    val Primary500 = Color(0xFF1ABC9C)
    val Primary100 = Color(0xFFD5F5F0)
    val Primary50 = Color(0xFFEBFAF7)

    // Secondary
    val Secondary600 = Color(0xFF2C3E50)
    val Secondary500 = Color(0xFF34495E)

    // Accent (Orange)
    val Accent600 = Color(0xFFE67E22)
    val Accent400 = Color(0xFFF39C12)
    val Accent900 = Color(0xFFD35400)

    // Cream/Background
    val Cream50 = Color(0xFFFAF9F7)
    val Cream200 = Color(0xFFE8E6E3)

    // Grayscale
    val Gray900 = Color(0xFF111827)
    val Gray600 = Color(0xFF4B5563)
    val Gray300 = Color(0xFFD1D5DB)

    // Status Colors
    val Success = Color(0xFF10B981)
    val Warning = Color(0xFFF59E0B)
    val Error = Color(0xFFEF4444)
    val Info = Color(0xFF3B82F6)
}
```

**Typography (Accessibility-Optimized):**
```kotlin
object TaskaTypography {
    val Hero = TextStyle(
        fontSize = 36.sp,
        fontWeight = FontWeight.Bold,
        lineHeight = 40.sp
    )

    val Heading1 = TextStyle(
        fontSize = 28.sp,
        fontWeight = FontWeight.Bold,
        lineHeight = 34.sp
    )

    val Heading2 = TextStyle(
        fontSize = 24.sp,
        fontWeight = FontWeight.SemiBold,
        lineHeight = 30.sp
    )

    val Body = TextStyle(
        fontSize = 18.sp,      // Larger for accessibility
        fontWeight = FontWeight.Normal,
        lineHeight = 26.sp
    )

    val Button = TextStyle(
        fontSize = 20.sp,      // Large touch targets
        fontWeight = FontWeight.Medium,
        lineHeight = 24.sp
    )

    val Caption = TextStyle(
        fontSize = 16.sp,
        fontWeight = FontWeight.Normal,
        lineHeight = 20.sp
    )
}
```

**Component Sizing (Accessibility Standards):**
```kotlin
object TaskaDimensions {
    // Touch Targets (Minimum 48dp per Material Design)
    val TouchTargetMinSize = 56.dp     // Extra large for accessibility
    val ButtonHeight = 56.dp
    val IconButtonSize = 56.dp

    // Spacing
    val SpaceXSmall = 4.dp
    val SpaceSmall = 8.dp
    val SpaceMedium = 16.dp
    val SpaceLarge = 24.dp
    val SpaceXLarge = 32.dp

    // Borders and Corners
    val CornerRadius = 12.dp
    val BorderWidth = 2.dp

    // Icons
    val IconSmall = 20.dp
    val IconMedium = 28.dp
    val IconLarge = 36.dp
}
```

### 2.2 Screen Designs (Artisan-Focused)

#### 2.2.1 Authentication Screens

**Splash Screen:**
- Large Taska logo with South African flag colors
- Loading animation
- Auto-login if credentials stored
- Language selection button (English/Afrikaans/Zulu)

**Login Screen:**
- Large "Welcome Back" heading
- Phone number OR email input (with helper text)
- Password input with show/hide toggle
- Large "Sign In" button
- "Forgot Password?" link
- "New to Taska? Register" link
- Icons for all inputs

**Registration Screen (Artisan-Specific):**
- Step 1: Basic Info
  - First name, Last name
  - Phone number (primary contact)
  - Email (optional)
  - Password with strength indicator

- Step 2: Profile
  - Profile photo (camera or gallery)
  - ID number (for verification)
  - Address with location picker

- Step 3: Skills
  - Visual category selector (icons + names)
  - Years of experience per category
  - Portfolio photos (optional but encouraged)

- Step 4: Verification
  - ID photo upload
  - Certificate uploads (optional)
  - Terms acceptance with simple language

#### 2.2.2 Home/Dashboard Screen

**Layout:**
```
┌─────────────────────────────────────┐
│  👤 Thabo M.    🔔(3)    ⚙️        │  Header
├─────────────────────────────────────┤
│  📊 Today's Summary                 │
│  ┌─────────┬─────────┬─────────┐  │
│  │ 🎯 New  │ 💬 Msgs │ 💰 Earn │  │  Stats Cards
│  │   5     │   12    │ R2,400  │  │
│  └─────────┴─────────┴─────────┘  │
├─────────────────────────────────────┤
│  📍 Jobs Near You                   │  Section
│  ┌───────────────────────────────┐ │
│  │ 🔨 Fix Kitchen Sink            │ │
│  │ 📍 Soweto, 2.3km               │ │  Job Card
│  │ 💰 R800-R1,200                 │ │
│  │ ⏰ URGENT • 2 hours ago        │ │
│  └───────────────────────────────┘ │
│  ┌───────────────────────────────┐ │
│  │ ⚡ Electrical Repair           │ │
│  │ 📍 Sandton, 8.5km              │ │
│  │ 💰 R1,500-R2,000               │ │
│  │ ⏰ Posted today                │ │
│  └───────────────────────────────┘ │
├─────────────────────────────────────┤
│  🔥 🏠 💬 👤 💰                    │  Bottom Nav
└─────────────────────────────────────┘
```

**Key Features:**
- Weather-based greeting: "Good morning Thabo! ☀️"
- Quick stats with large numbers and icons
- Job cards with distance sorting
- Pull to refresh
- Floating action button: "🔍 Find More Jobs"

#### 2.2.3 Jobs Browse Screen

**Filters (Top Bar):**
- 📍 Distance (2km, 5km, 10km, 20km, 50km)
- 💰 Budget range (slider with ZAR)
- 🔨 My Skills only (toggle)
- ⏰ Urgency (All, Urgent, This Week, Flexible)

**Job List:**
Each card shows:
- Category icon (large, colored)
- Job title (bold, 20sp)
- Distance with map pin
- Budget with money icon
- Client rating (stars)
- Urgency badge (color-coded)
- "View Details" button

**Sorting:**
- Nearest First (default)
- Highest Pay
- Most Urgent
- Recently Posted

#### 2.2.4 Job Details Screen

**Layout:**
```
┌─────────────────────────────────────┐
│  ← Job Details              ⋮       │  Header
├─────────────────────────────────────┤
│  🔨 Fix Kitchen Sink                │  Title
│  ⭐⭐⭐⭐⭐ John D. (15 jobs)       │  Client
├─────────────────────────────────────┤
│  📸 Photo Gallery (swipe)           │  Images
│  [  image  ] [  image  ] [  image  ]│
├─────────────────────────────────────┤
│  📝 Description                     │
│  The kitchen sink is leaking from   │
│  the pipe underneath. Need urgent   │
│  repair. Photos attached.           │
├─────────────────────────────────────┤
│  📍 Location                        │  Location
│  123 Main Road, Soweto              │
│  📏 2.3km from you                  │
│  [View Map]                         │
├─────────────────────────────────────┤
│  💰 Budget: R800 - R1,200           │  Budget
│  📅 Date: ASAP (Next 2 days)        │  Timeline
│  ⏰ Posted: 2 hours ago             │  Posted
├─────────────────────────────────────┤
│  ✅ Requirements                    │  Requirements
│  • Plumbing experience required     │
│  • Own tools needed                 │
│  • ID verification required         │
├─────────────────────────────────────┤
│  [    💬 Send Message    ]          │  Actions
│  [    💰 Place Bid       ]          │
└─────────────────────────────────────┘
```

**Accessibility Features:**
- Text-to-speech for description
- Image zoom with pinch
- High contrast mode option
- Font size adjustment

#### 2.2.5 Place Bid Screen

**Form (Large Inputs):**
```
┌─────────────────────────────────────┐
│  ← Place Your Bid                   │
├─────────────────────────────────────┤
│  💰 Your Price                      │
│  ┌───────────────────────────────┐ │
│  │  R [ 1,000 ]                  │ │  Large input
│  └───────────────────────────────┘ │
│  Client Budget: R800 - R1,200       │
├─────────────────────────────────────┤
│  📅 Time Needed                     │
│  ┌───────────────────────────────┐ │
│  │  [  1  ] days                 │ │  Number picker
│  └───────────────────────────────┘ │
├─────────────────────────────────────┤
│  📝 Your Message (Optional)         │
│  ┌───────────────────────────────┐ │
│  │  I can start tomorrow and     │ │  Text area
│  │  complete in 1 day. I have    │ │
│  │  10 years experience...       │ │
│  └───────────────────────────────┘ │
│  [🎤 Voice Message] [📸 Photos]    │  Attachments
├─────────────────────────────────────┤
│  📎 Attachments                     │
│  [Previous work photo 1]            │
│  [Previous work photo 2]            │
│  [+ Add More]                       │
├─────────────────────────────────────┤
│  [ Cancel ]    [ Submit Bid → ]    │  Actions
└─────────────────────────────────────┘
```

**Features:**
- Voice-to-text for message
- Template messages: "I can do this job", "When do you need it?", etc.
- Bid tips: "Jobs at R1,000 get 3x more responses"
- Auto-save draft

#### 2.2.6 My Bids Screen

**Tabs:**
- 🟡 Pending (default)
- 🟢 Accepted
- 🔴 Rejected
- ⚪ Expired

**Bid Card:**
```
┌───────────────────────────────────┐
│  🔨 Fix Kitchen Sink              │
│  📍 Soweto, 2.3km                 │
│  ─────────────────────────────    │
│  Your Bid: R1,000 • 1 day        │
│  Status: 🟡 Waiting for response │
│  ⏰ Bid placed 2 hours ago        │
│  ─────────────────────────────    │
│  [  View Details  ]  [  Edit  ]  │
└───────────────────────────────────┘
```

**Actions:**
- Edit bid (if pending)
- Withdraw bid
- Message client
- View competition (number of bids)

#### 2.2.7 Messages Screen

**Message List:**
```
┌─────────────────────────────────────┐
│  💬 Messages            [Search]    │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │ 👤 John D.              Now │   │
│  │ Re: Kitchen Sink            │   │
│  │ Thanks, I'll accept your... │ 3 │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 👤 Sarah M.           2h ago│   │
│  │ Re: Electrical Repair       │   │
│  │ Can you start tomorrow?     │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Chat Screen:**
- WhatsApp-style interface
- Voice messages (record & send)
- Photo sharing
- Job context at top
- Quick replies: "Yes", "No", "On my way", "Completed"
- Real-time typing indicator
- Read receipts

#### 2.2.8 Profile Screen

**Layout:**
```
┌─────────────────────────────────────┐
│  ⚙️ Settings                        │
├─────────────────────────────────────┤
│      [ Profile Photo ]              │
│      Thabo Mokoena                  │
│      ⭐⭐⭐⭐⭐ 4.8 (23 reviews)     │
│      📍 Soweto, Johannesburg        │
├─────────────────────────────────────┤
│  📊 Your Stats                      │
│  ┌────────┬────────┬────────┐      │
│  │Jobs    │Success │Response│      │
│  │Completed Rate  │Time    │      │
│  │   23   │  96%  │  2hrs  │      │
│  └────────┴────────┴────────┘      │
├─────────────────────────────────────┤
│  🔨 Your Skills                     │
│  • Plumbing (10 years)       [Edit]│
│  • Electrical (5 years)      [Edit]│
│  • General Repairs (15 years)[Edit]│
│  [+ Add Skill]                      │
├─────────────────────────────────────┤
│  📸 Portfolio                       │
│  [Previous Work Photos Grid]        │
│  [+ Add Photos]                     │
├─────────────────────────────────────┤
│  ⚙️ Settings                        │
│  • 📱 Notifications         [>]     │
│  • 📍 Location Settings     [>]     │
│  • 🌐 Language             [>]     │
│  • 🔒 Privacy              [>]     │
│  • ℹ️  Help & Support      [>]     │
│  • 🚪 Logout               [>]     │
└─────────────────────────────────────┘
```

#### 2.2.9 Wallet Screen

**Balance Card:**
```
┌─────────────────────────────────────┐
│  💰 Your Wallet                     │
├─────────────────────────────────────┤
│      Available Balance              │
│      R 2,450.00                     │
│  ┌────────────────────────────┐    │
│  │ Pending: R 800.00           │    │
│  │ Total Earned: R 45,230.00   │    │
│  └────────────────────────────┘    │
│  [   💸 Withdraw   ]                │
├─────────────────────────────────────┤
│  📊 Recent Transactions             │
│  ┌────────────────────────────┐    │
│  │ + R 1,000  Kitchen Sink    │    │
│  │   Released • 2 days ago    │    │
│  └────────────────────────────┘    │
│  ┌────────────────────────────┐    │
│  │ + R 800    Electrical Work │    │
│  │   Released • 5 days ago    │    │
│  └────────────────────────────┘    │
└─────────────────────────────────────┘
```

**Withdraw Flow:**
- Enter amount
- Select bank account (saved)
- Processing time: 2-3 business days
- Fee breakdown display

### 2.3 Bottom Navigation

**5 Core Sections:**
1. 🔥 **Home** - Dashboard & nearby jobs
2. 🏠 **Jobs** - Browse all jobs with filters
3. 💬 **Messages** - Chat with clients
4. 👤 **Profile** - Settings & portfolio
5. 💰 **Wallet** - Earnings & payments

**Design:**
- Always visible
- Active state: Icon + label colored
- Inactive: Gray icons
- Notification badges on Messages & Jobs

---

## 3. API Integration

### 3.1 Retrofit Service Interfaces

**AuthApiService.kt:**
```kotlin
interface AuthApiService {
    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<AuthResponse>

    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<AuthResponse>

    @POST("auth/refresh-token")
    suspend fun refreshToken(@Body refreshToken: String): Response<AuthResponse>

    @GET("auth/profile")
    suspend fun getProfile(): Response<UserProfile>

    @POST("auth/logout")
    suspend fun logout(): Response<Unit>

    @POST("auth/verify-email")
    suspend fun verifyEmail(@Body token: String): Response<MessageResponse>
}
```

**JobsApiService.kt:**
```kotlin
interface JobsApiService {
    @GET("jobs")
    suspend fun getJobs(
        @Query("latitude") latitude: Double,
        @Query("longitude") longitude: Double,
        @Query("radius") radius: Int = 25,
        @Query("categoryId") categoryId: String?,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): Response<PaginatedJobsResponse>

    @GET("jobs/nearby")
    suspend fun getNearbyJobs(
        @Query("latitude") latitude: Double,
        @Query("longitude") longitude: Double,
        @Query("radius") radius: Int = 25,
        @Query("limit") limit: Int = 50
    ): Response<List<Job>>

    @GET("jobs/{id}")
    suspend fun getJobById(@Path("id") jobId: String): Response<Job>

    @GET("jobs/search")
    suspend fun searchJobs(
        @Query("q") query: String,
        @Query("categoryId") categoryId: String?,
        @Query("city") city: String?,
        @Query("minBudget") minBudget: Double?,
        @Query("maxBudget") maxBudget: Double?
    ): Response<List<Job>>
}
```

**BidsApiService.kt:**
```kotlin
interface BidsApiService {
    @POST("bids")
    suspend fun createBid(@Body request: CreateBidRequest): Response<Bid>

    @GET("bids/my-bids")
    suspend fun getMyBids(): Response<List<Bid>>

    @GET("bids/{id}")
    suspend fun getBidById(@Path("id") bidId: String): Response<Bid>

    @PATCH("bids/{id}")
    suspend fun updateBid(
        @Path("id") bidId: String,
        @Body request: UpdateBidRequest
    ): Response<Bid>

    @POST("bids/{id}/withdraw")
    suspend fun withdrawBid(@Path("id") bidId: String): Response<MessageResponse>

    @GET("bids/statistics")
    suspend fun getBidStatistics(): Response<BidStatistics>
}
```

**MessagesApiService.kt:**
```kotlin
interface MessagesApiService {
    @GET("messages")
    suspend fun getMessages(
        @Query("jobId") jobId: String?,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 50
    ): Response<List<Message>>

    @POST("messages")
    suspend fun sendMessage(@Body request: SendMessageRequest): Response<Message>

    @PATCH("messages/{id}/read")
    suspend fun markAsRead(@Path("id") messageId: String): Response<Unit>

    @Multipart
    @POST("messages/upload")
    suspend fun uploadAttachment(
        @Part file: MultipartBody.Part
    ): Response<UploadResponse>
}
```

### 3.2 Data Models

**Domain Models (domain/model/):**

```kotlin
data class User(
    val id: String,
    val email: String,
    val role: UserRole,
    val profile: Profile?,
    val verifiedAt: String?
)

data class Profile(
    val firstName: String?,
    val lastName: String?,
    val phoneNumber: String?,
    val city: String?,
    val province: String?,
    val latitude: Double?,
    val longitude: Double?,
    val profilePictureUrl: String?,
    val bio: String?,
    val isVerified: Boolean
)

data class Job(
    val id: String,
    val clientId: String,
    val categoryId: String,
    val title: String,
    val description: String,
    val budget: Double,
    val budgetType: BudgetType,
    val urgency: UrgencyLevel,
    val status: JobStatus,
    val address: Address,
    val images: List<String>,
    val requirements: List<String>,
    val distance: Double?,
    val createdAt: String,
    val client: ClientInfo?
)

data class Bid(
    val id: String,
    val jobId: String,
    val artisanId: String,
    val amount: Double,
    val message: String,
    val estimatedDays: Int,
    val attachments: List<String>,
    val status: BidStatus,
    val createdAt: String,
    val job: Job?
)

data class Message(
    val id: String,
    val jobId: String,
    val senderId: String,
    val receiverId: String,
    val content: String,
    val messageType: MessageType,
    val attachments: List<String>,
    val isRead: Boolean,
    val createdAt: String,
    val sender: UserInfo?
)

enum class UserRole { CLIENT, ARTISAN, ADMIN, ASSESSOR }
enum class BudgetType { FIXED, HOURLY, NEGOTIABLE }
enum class UrgencyLevel { LOW, MEDIUM, HIGH, URGENT }
enum class JobStatus { DRAFT, OPEN, IN_PROGRESS, COMPLETED, CANCELLED, DISPUTED }
enum class BidStatus { PENDING, ACCEPTED, REJECTED, WITHDRAWN, EXPIRED }
enum class MessageType { TEXT, IMAGE, DOCUMENT, SYSTEM }
```

### 3.3 Local Database (Room)

**Entities:**

```kotlin
@Entity(tableName = "jobs")
data class JobEntity(
    @PrimaryKey val id: String,
    val clientId: String,
    val categoryId: String,
    val title: String,
    val description: String,
    val budget: Double,
    val budgetType: String,
    val urgency: String,
    val status: String,
    val latitude: Double,
    val longitude: Double,
    val city: String,
    val province: String,
    @ColumnInfo(name = "images") val imagesJson: String,
    @ColumnInfo(name = "requirements") val requirementsJson: String,
    val createdAt: String,
    val cachedAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "bids")
data class BidEntity(
    @PrimaryKey val id: String,
    val jobId: String,
    val amount: Double,
    val message: String,
    val estimatedDays: Int,
    val status: String,
    @ColumnInfo(name = "attachments") val attachmentsJson: String,
    val createdAt: String,
    val syncStatus: SyncStatus = SyncStatus.SYNCED
)

@Entity(tableName = "messages")
data class MessageEntity(
    @PrimaryKey val id: String,
    val jobId: String,
    val senderId: String,
    val receiverId: String,
    val content: String,
    val messageType: String,
    val isRead: Boolean,
    val createdAt: String,
    val syncStatus: SyncStatus = SyncStatus.SYNCED
)

enum class SyncStatus { SYNCED, PENDING, FAILED }
```

**DAOs:**

```kotlin
@Dao
interface JobDao {
    @Query("SELECT * FROM jobs WHERE status = 'OPEN' ORDER BY cachedAt DESC LIMIT :limit")
    fun getJobs(limit: Int = 50): Flow<List<JobEntity>>

    @Query("SELECT * FROM jobs WHERE id = :jobId")
    suspend fun getJobById(jobId: String): JobEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertJobs(jobs: List<JobEntity>)

    @Query("DELETE FROM jobs WHERE cachedAt < :timestamp")
    suspend fun deleteOldJobs(timestamp: Long)
}

@Dao
interface BidDao {
    @Query("SELECT * FROM bids ORDER BY createdAt DESC")
    fun getMyBids(): Flow<List<BidEntity>>

    @Query("SELECT * FROM bids WHERE syncStatus != 'SYNCED'")
    suspend fun getUnsyncedBids(): List<BidEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertBid(bid: BidEntity)

    @Update
    suspend fun updateBid(bid: BidEntity)
}
```

---

## 4. Key Features Implementation

### 4.1 Offline Mode

**Strategy:**
- Cache last 50 jobs viewed
- Store all user's bids locally
- Queue outgoing bids for sync
- Show offline indicator
- Sync on connectivity restore

**Implementation:**
```kotlin
class OfflineFirstRepository(
    private val remoteDataSource: RemoteDataSource,
    private val localDataSource: LocalDataSource,
    private val connectivityManager: ConnectivityManager
) {
    fun getJobs(): Flow<Resource<List<Job>>> = flow {
        // Emit cached data first
        emit(Resource.Loading(localDataSource.getJobs()))

        if (connectivityManager.isNetworkAvailable()) {
            try {
                val remoteJobs = remoteDataSource.getJobs()
                localDataSource.cacheJobs(remoteJobs)
                emit(Resource.Success(remoteJobs))
            } catch (e: Exception) {
                emit(Resource.Error(e.message, localDataSource.getJobs()))
            }
        } else {
            emit(Resource.Success(localDataSource.getJobs(), isCached = true))
        }
    }
}
```

### 4.2 Location Services

**Features:**
- Background location updates (when app open)
- Distance calculation to jobs
- Map view for job location
- "Jobs near me" sorting
- Location permission handling

**Implementation:**
```kotlin
class LocationManager @Inject constructor(
    private val fusedLocationClient: FusedLocationProviderClient,
    private val context: Context
) {
    private val _locationFlow = MutableStateFlow<Location?>(null)
    val locationFlow: StateFlow<Location?> = _locationFlow.asStateFlow()

    suspend fun getCurrentLocation(): Location? {
        if (!hasLocationPermission()) return null

        return suspendCancellableCoroutine { continuation ->
            fusedLocationClient.lastLocation
                .addOnSuccessListener { location ->
                    _locationFlow.value = location
                    continuation.resume(location)
                }
                .addOnFailureListener {
                    continuation.resume(null)
                }
        }
    }

    fun calculateDistance(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
        val results = FloatArray(1)
        Location.distanceBetween(lat1, lon1, lat2, lon2, results)
        return (results[0] / 1000.0) // Convert to km
    }
}
```

### 4.3 Real-time Messaging

**Socket.IO Integration:**
```kotlin
class SocketManager @Inject constructor(
    private val authRepository: AuthRepository
) {
    private lateinit var socket: Socket
    private val _messages = MutableSharedFlow<Message>()
    val messages: SharedFlow<Message> = _messages.asSharedFlow()

    fun connect() {
        val token = authRepository.getAccessToken()
        val opts = IO.Options().apply {
            auth = mapOf("token" to token)
            reconnection = true
        }

        socket = IO.socket("https://api.taska.co.za", opts)

        socket.on("message:received") { args ->
            val message = parseMessage(args[0])
            CoroutineScope(Dispatchers.IO).launch {
                _messages.emit(message)
            }
        }

        socket.connect()
    }

    fun sendMessage(message: SendMessageRequest) {
        socket.emit("message:send", message.toJson())
    }

    fun disconnect() {
        socket.disconnect()
    }
}
```

### 4.4 Image Handling

**Features:**
- Camera capture
- Gallery selection
- Image compression
- Multiple image upload
- Image viewer

**Implementation:**
```kotlin
class ImageManager @Inject constructor(
    private val context: Context
) {
    suspend fun compressImage(uri: Uri): File {
        return withContext(Dispatchers.IO) {
            val bitmap = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                ImageDecoder.decodeBitmap(ImageDecoder.createSource(context.contentResolver, uri))
            } else {
                MediaStore.Images.Media.getBitmap(context.contentResolver, uri)
            }

            val compressedFile = File(context.cacheDir, "compressed_${System.currentTimeMillis()}.jpg")
            FileOutputStream(compressedFile).use { out ->
                bitmap.compress(Bitmap.CompressFormat.JPEG, 80, out)
            }

            compressedFile
        }
    }

    suspend fun uploadImages(files: List<File>): List<String> {
        return files.map { file ->
            val requestBody = file.asRequestBody("image/jpeg".toMediaTypeOrNull())
            val part = MultipartBody.Part.createFormData("file", file.name, requestBody)
            apiService.uploadImage(part).body()?.url ?: ""
        }
    }
}
```

### 4.5 Push Notifications

**Firebase Cloud Messaging:**
```kotlin
class TaskaFirebaseMessagingService : FirebaseMessagingService() {

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        val notification = remoteMessage.notification
        val data = remoteMessage.data

        when (data["type"]) {
            "BID_ACCEPTED" -> showBidAcceptedNotification(data)
            "BID_REJECTED" -> showBidRejectedNotification(data)
            "MESSAGE_RECEIVED" -> showMessageNotification(data)
            "NEW_JOB" -> showNewJobNotification(data)
        }
    }

    private fun showBidAcceptedNotification(data: Map<String, String>) {
        val notification = NotificationCompat.Builder(this, CHANNEL_BID_UPDATES)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle("🎉 Bid Accepted!")
            .setContentText(data["message"])
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build()

        NotificationManagerCompat.from(this).notify(NOTIFICATION_ID_BID, notification)
    }
}
```

---

## 5. Accessibility Features

### 5.1 Accessibility Implementation

```kotlin
@Composable
fun AccessibleJobCard(job: Job) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .semantics {
                contentDescription = buildAccessibilityDescription(job)
                role = Role.Button
            }
            .clickable { onJobClick(job) }
    ) {
        // Card content with large text and icons
    }
}

private fun buildAccessibilityDescription(job: Job): String {
    return """
        Job: ${job.title}.
        Location: ${job.address.city}, ${job.distance?.let { "%.1f kilometers away".format(it) } ?: "location unknown"}.
        Budget: ${formatCurrency(job.budget)}.
        Urgency: ${job.urgency.name.lowercase()}.
        Posted ${formatRelativeTime(job.createdAt)}.
        Tap to view details.
    """.trimIndent()
}

// Text scaling support
@Composable
fun AccessibleText(
    text: String,
    style: TextStyle,
    modifier: Modifier = Modifier
) {
    val fontScale = LocalDensity.current.fontScale
    Text(
        text = text,
        style = style.copy(
            fontSize = style.fontSize * minOf(fontScale, 1.3f) // Cap at 130%
        ),
        modifier = modifier
    )
}
```

### 5.2 Language Support

**String Resources (values-zu/strings.xml for Zulu):**
```xml
<resources>
    <string name="app_name">Taska</string>
    <string name="welcome">Siyakwamukela</string>
    <string name="login">Ngena</string>
    <string name="register">Bhalisa</string>
    <string name="find_jobs">Thola Imisebenzi</string>
    <string name="my_bids">Amabhidi Ami</string>
    <string name="messages">Imilayezo</string>
    <string name="profile">Iphrofayela</string>
    <string name="wallet">Isikhwama</string>
</resources>
```

---

## 6. Testing Strategy

### 6.1 Unit Tests

**ViewModel Tests:**
```kotlin
class JobsViewModelTest {
    @Test
    fun `getJobs should emit loading then success state`() = runTest {
        // Given
        val mockJobs = listOf(mockJob1, mockJob2)
        coEvery { repository.getJobs() } returns flowOf(Resource.Success(mockJobs))

        // When
        viewModel.getJobs()

        // Then
        viewModel.jobsState.test {
            assertEquals(UiState.Loading, awaitItem())
            assertEquals(UiState.Success(mockJobs), awaitItem())
        }
    }
}
```

### 6.2 UI Tests

**Compose Tests:**
```kotlin
class JobDetailsScreenTest {
    @Test
    fun jobDetailsScreen_displaysJobInformation() {
        composeTestRule.setContent {
            JobDetailsScreen(job = mockJob, onBidClick = {})
        }

        composeTestRule.onNodeWithText(mockJob.title).assertIsDisplayed()
        composeTestRule.onNodeWithText(mockJob.description).assertIsDisplayed()
        composeTestRule.onNodeWithText("Place Bid").assertIsDisplayed()
    }
}
```

---

## 7. Performance Optimization

### 7.1 Image Optimization
- Coil caching with memory/disk limits
- Thumbnail generation for lists
- Lazy loading with pagination
- WebP format support

### 7.2 Network Optimization
- Request caching with OkHttp
- Gzip compression
- Batch API calls where possible
- Retry with exponential backoff

### 7.3 Battery Optimization
- WorkManager for background sync
- Doze mode compliance
- Location updates only when needed
- Socket.IO reconnection strategy

---

## 8. Security

### 8.1 Authentication
- JWT tokens stored in EncryptedSharedPreferences
- Biometric authentication option
- Auto-logout after inactivity
- Certificate pinning for API

### 8.2 Data Protection
- SQL injection prevention with Room
- Input validation and sanitization
- Secure file storage
- ProGuard/R8 obfuscation

---

## 9. Build Configuration

**build.gradle.kts (app):**
```kotlin
android {
    namespace = "za.co.taska"
    compileSdk = 34

    defaultConfig {
        applicationId = "za.co.taska.artisan"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        buildConfigField("String", "API_BASE_URL", "\"https://api.taska.co.za\"")
        buildConfigField("String", "SOCKET_URL", "\"https://api.taska.co.za\"")
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            buildConfigField("String", "API_BASE_URL", "\"http://10.0.2.2:3000\"")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.3"
    }
}

dependencies {
    // Kotlin
    implementation("org.jetbrains.kotlin:kotlin-stdlib:1.9.10")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")

    // Jetpack Compose
    implementation(platform("androidx.compose:compose-bom:2023.10.01"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.activity:activity-compose:1.8.0")
    implementation("androidx.navigation:navigation-compose:2.7.5")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.6.2")

    // Hilt
    implementation("com.google.dagger:hilt-android:2.48")
    kapt("com.google.dagger:hilt-compiler:2.48")
    implementation("androidx.hilt:hilt-navigation-compose:1.1.0")

    // Networking
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

    // Room
    implementation("androidx.room:room-runtime:2.6.0")
    implementation("androidx.room:room-ktx:2.6.0")
    kapt("androidx.room:room-compiler:2.6.0")

    // Image Loading
    implementation("io.coil-kt:coil-compose:2.5.0")

    // Location
    implementation("com.google.android.gms:play-services-location:21.0.1")

    // Socket.IO
    implementation("io.socket:socket.io-client:2.1.0")

    // Firebase
    implementation(platform("com.google.firebase:firebase-bom:32.5.0"))
    implementation("com.google.firebase:firebase-messaging-ktx")
    implementation("com.google.firebase:firebase-analytics-ktx")

    // Security
    implementation("androidx.security:security-crypto:1.1.0-alpha06")

    // CameraX
    implementation("androidx.camera:camera-camera2:1.3.0")
    implementation("androidx.camera:camera-lifecycle:1.3.0")
    implementation("androidx.camera:camera-view:1.3.0")

    // Testing
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.mockito.kotlin:mockito-kotlin:5.1.0")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.7.3")
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
    debugImplementation("androidx.compose.ui:ui-tooling")
}
```

---

## Conclusion

This design provides a complete blueprint for building an accessible, offline-capable Android app for South African artisans, matching the existing web platform's functionality and design language.
