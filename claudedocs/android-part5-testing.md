# Part 5: Testing Architecture (CRITICAL PRIORITY!)

## 5.1 Testing Philosophy

**Testing is the #1 priority as emphasized twice by stakeholder.**

### Coverage Targets (NON-NEGOTIABLE)
- ✅ Overall Code Coverage: **>80%**
- ✅ Unit Test Coverage: **>85%**
- ✅ Integration Test Coverage: **>70%**
- ✅ UI Test Coverage: **>60%**
- ✅ Critical Path Coverage: **100%**

### Testing Pyramid
```
      /\
     /E2E\      10% - End-to-End Tests (Maestro/Espresso)
    /____\
   / UI  \      20% - UI Tests (Compose Test)
  /______\
 /  Integ \     30% - Integration Tests (Room, Retrofit)
/__________\
/   Unit    \   40% - Unit Tests (ViewModels, UseCases, Repos)
/______________\
```

## 5.2 Test Infrastructure Setup

### build.gradle.kts (Test Dependencies)
```kotlin
dependencies {
    // Unit Testing
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.mockito.kotlin:mockito-kotlin:5.4.0")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.8.1")
    testImplementation("app.cash.turbine:turbine:1.2.0")              // Flow testing
    testImplementation("androidx.arch.core:core-testing:2.2.0")       // LiveData/ViewModel
    testImplementation("com.google.truth:truth:1.4.4")                // Assertions

    // Integration Testing
    androidTestImplementation("androidx.test.ext:junit:1.2.1")
    androidTestImplementation("androidx.room:room-testing:2.8.3")
    androidTestImplementation("com.squareup.okhttp3:mockwebserver:4.12.0")
    androidTestImplementation("com.google.dagger:hilt-android-testing:2.52")
    kaptAndroidTest("com.google.dagger:hilt-compiler:2.52")

    // UI Testing
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.6.1")
    androidTestImplementation("androidx.test:runner:1.6.1")
    androidTestImplementation("androidx.test:rules:1.6.1")

    // Debug
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}
```

### Test Structure
```
app/
├── src/
│   ├── test/                                   # Unit Tests
│   │   └── kotlin/za/co/taska/
│   │       ├── domain/
│   │       │   └── usecase/
│   │       │       ├── jobs/
│   │       │       │   ├── CreateJobUseCaseTest.kt
│   │       │       │   ├── GetMyJobsUseCaseTest.kt
│   │       │       │   └── PublishJobUseCaseTest.kt
│   │       │       ├── bids/
│   │       │       │   ├── GetJobBidsUseCaseTest.kt
│   │       │       │   ├── AcceptBidUseCaseTest.kt
│   │       │       │   └── RejectBidUseCaseTest.kt
│   │       │       ├── payments/
│   │       │       │   └── InitiatePaymentUseCaseTest.kt
│   │       │       └── reviews/
│   │       │           └── CreateReviewUseCaseTest.kt
│   │       ├── presentation/
│   │       │   └── viewmodel/
│   │       │       ├── PostJobViewModelTest.kt
│   │       │       ├── ClientJobsViewModelTest.kt
│   │       │       ├── BidsViewModelTest.kt
│   │       │       ├── PaymentViewModelTest.kt
│   │       │       └── ReviewViewModelTest.kt
│   │       ├── data/
│   │       │   ├── repository/
│   │       │   │   ├── JobsRepositoryImplTest.kt
│   │       │   │   ├── BidsRepositoryImplTest.kt
│   │       │   │   ├── PaymentsRepositoryImplTest.kt
│   │       │   │   └── ReviewsRepositoryImplTest.kt
│   │       │   └── mapper/
│   │       │       ├── JobMapperTest.kt
│   │       │       ├── BidMapperTest.kt
│   │       │       ├── PaymentMapperTest.kt
│   │       │       └── ReviewMapperTest.kt
│   │       └── util/
│   │           ├── TestDataFactory.kt
│   │           ├── FakeJobsRepository.kt
│   │           └── FakeBidsRepository.kt
│   │
│   └── androidTest/                            # Integration + UI Tests
│       └── kotlin/za/co/taska/
│           ├── data/
│           │   ├── local/
│           │   │   ├── JobDaoTest.kt
│           │   │   ├── BidDaoTest.kt
│           │   │   ├── PaymentDaoTest.kt
│           │   │   └── ReviewDaoTest.kt
│           │   └── remote/
│           │       ├── JobsApiServiceTest.kt
│           │       ├── BidsApiServiceTest.kt
│           │       ├── PaymentsApiServiceTest.kt
│           │       └── ReviewsApiServiceTest.kt
│           ├── presentation/
│           │   └── screens/
│           │       └── client/
│           │           ├── PostJobScreenTest.kt
│           │           ├── ClientJobsScreenTest.kt
│           │           ├── BidsScreenTest.kt
│           │           ├── PaymentScreenTest.kt
│           │           └── ReviewScreenTest.kt
│           └── di/
│               └── TestModule.kt
```

## 5.3 Unit Test Examples

### PostJobViewModelTest.kt
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
        viewModel.updateTitle("Fix kitchen faucet")
        viewModel.updateDescription("Leaking faucet needs professional repair urgently and immediately")
        viewModel.updateCategory("plumbing_123")
        viewModel.updateBudget("500")

        // When
        val result = viewModel.validateStep1()

        // Then
        assertTrue(result)
        assertTrue(viewModel.state.value.errors.isEmpty())
    }

    @Test
    fun `validateStep1 returns false when title is too short`() = runTest {
        // Given
        viewModel.updateTitle("Fix")  // Less than 5 chars

        // When
        val result = viewModel.validateStep1()

        // Then
        assertFalse(result)
        assertEquals(
            "Title must be at least 5 characters",
            viewModel.state.value.errors["title"]
        )
    }

    @Test
    fun `publishJob emits success event when all validations pass`() = runTest {
        // Given
        setupValidJobData()
        val expectedJob = TestDataFactory.createTestJob()
        whenever(createJobUseCase(any())).thenReturn(Result.success(expectedJob))

        // When
        viewModel.publishJob()
        advanceUntilIdle()  // Wait for coroutine

        // Then
        val event = viewModel.events.receiveAsFlow().first()
        assertTrue(event is PostJobViewModel.PostJobEvent.JobPublished)
        verify(createJobUseCase).invoke(any())
    }

    @Test
    fun `uploadImage successfully uploads and updates state`() = runTest {
        // Given
        val uri = mock<Uri>()
        val expectedUrl = "https://api.taska.co.za/uploads/job_123.webp"
        whenever(uploadJobImageUseCase(uri)).thenReturn(Result.success(expectedUrl))

        // When
        viewModel.uploadImage(uri)
        advanceUntilIdle()

        // Then
        assertEquals(1, viewModel.state.value.uploadedImages.size)
        assertEquals(expectedUrl, viewModel.state.value.uploadedImages[0].url)
    }

    private fun setupValidJobData() {
        viewModel.updateTitle("Fix kitchen faucet")
        viewModel.updateDescription("Leaking faucet needs professional repair urgently")
        viewModel.updateCategory("plumbing_123")
        viewModel.updateBudget("500")
        viewModel.updateAddressLine1("123 Main St")
        viewModel.updateCity("Cape Town")
        viewModel.updateProvince("Western Cape")
        viewModel.updatePostalCode("8001")
        viewModel.updateLocation(-33.9249, 18.4241)
    }
}
```

### AcceptBidUseCaseTest.kt
```kotlin
@ExperimentalCoroutinesTest
class AcceptBidUseCaseTest {

    private lateinit var useCase: AcceptBidUseCase
    private lateinit var bidsRepository: BidsRepository

    @Before
    fun setup() {
        bidsRepository = mock()
        useCase = AcceptBidUseCase(bidsRepository)
    }

    @Test
    fun `invoke returns success when repository accepts bid`() = runTest {
        // Given
        val bidId = "bid_123"
        val expectedBid = TestDataFactory.createTestBid(id = bidId, status = BidStatus.ACCEPTED)
        whenever(bidsRepository.acceptBid(bidId)).thenReturn(Result.success(expectedBid))

        // When
        val result = useCase(bidId)

        // Then
        assertTrue(result.isSuccess)
        assertEquals(expectedBid, result.getOrNull())
        verify(bidsRepository).acceptBid(bidId)
    }

    @Test
    fun `invoke returns failure when repository fails`() = runTest {
        // Given
        val bidId = "bid_123"
        val exception = Exception("Network error")
        whenever(bidsRepository.acceptBid(bidId)).thenReturn(Result.failure(exception))

        // When
        val result = useCase(bidId)

        // Then
        assertTrue(result.isFailure)
        assertEquals(exception, result.exceptionOrNull())
    }
}
```

## 5.4 Integration Test Examples

### JobDaoTest.kt
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
        val job = TestDataFactory.createTestJobEntity()

        // When
        jobDao.insertJob(job)
        val retrieved = jobDao.getJobById(job.id)

        // Then
        assertNotNull(retrieved)
        assertEquals(job.id, retrieved?.id)
        assertEquals(job.title, retrieved?.title)
    }

    @Test
    fun getMyJobs_returnsJobsSortedByDateDesc() = runTest {
        // Given
        val jobs = listOf(
            TestDataFactory.createTestJobEntity(id = "1", cachedAt = 1000L),
            TestDataFactory.createTestJobEntity(id = "2", cachedAt = 3000L),
            TestDataFactory.createTestJobEntity(id = "3", cachedAt = 2000L)
        )
        jobs.forEach { jobDao.insertJob(it) }

        // When
        val retrieved = jobDao.getJobs(limit = 10).first()

        // Then
        assertEquals(3, retrieved.size)
        assertEquals("2", retrieved[0].id) // Most recent
        assertEquals("3", retrieved[1].id)
        assertEquals("1", retrieved[2].id)
    }
}
```

### JobsApiServiceTest.kt
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
    fun createJob_returns201_whenApiCallSucceeds() = runTest {
        // Given
        val mockResponse = """
            {
                "id": "job_123",
                "title": "Fix faucet",
                "status": "DRAFT"
            }
        """.trimIndent()

        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(201)
                .setBody(mockResponse)
        )

        val request = TestDataFactory.createTestJobRequest()

        // When
        val response = apiService.createJob(request)

        // Then
        assertTrue(response.isSuccessful)
        assertEquals("job_123", response.body()?.id)
        assertEquals("DRAFT", response.body()?.status)
    }

    @Test
    fun createJob_returns400_whenValidationFails() = runTest {
        // Given
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(400)
                .setBody("""{"message": "Title is required"}""")
        )

        val request = TestDataFactory.createInvalidJobRequest()

        // When
        val response = apiService.createJob(request)

        // Then
        assertFalse(response.isSuccessful)
        assertEquals(400, response.code())
    }
}
```

## 5.5 UI Test Examples

### PostJobScreenTest.kt
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

        // Fill remaining fields...

        // Click Next
        composeTestRule.onNodeWithText("Next")
            .performClick()

        // Verify Step 2 is displayed
        composeTestRule.onNodeWithText("Address Line 1")
            .assertIsDisplayed()
    }
}
```

## 5.6 E2E Tests (Maestro)

### client-post-job-flow.yaml
```yaml
appId: za.co.taska.artisan
---
# Complete job posting flow
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
- tapOn: "Skip"  # Optional step

# Review and Publish
- assertVisible: "Review & Publish"
- tapOn: "Publish Job"
- assertVisible: "Job published successfully"
```

## 5.7 Test Data Factory

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
        description = "Test job description",
        budget = 500.0,
        budgetType = BudgetType.FIXED,
        urgency = UrgencyLevel.MEDIUM,
        status = status,
        address = createTestAddress(),
        images = emptyList(),
        requirements = listOf("Requirement 1", "Requirement 2"),
        startDate = null,
        endDate = null,
        createdAt = "2025-10-30T10:00:00Z",
        client = null,
        category = null
    )

    fun createTestBid(
        id: String = "bid_${UUID.randomUUID()}",
        jobId: String = "job_123",
        amount: Double = 450.0,
        status: BidStatus = BidStatus.PENDING
    ): Bid = Bid(
        id = id,
        jobId = jobId,
        artisanId = "artisan_123",
        amount = amount,
        proposal = "Test bid proposal",
        estimatedDuration = "2 days",
        status = status,
        createdAt = "2025-10-30T10:00:00Z",
        artisan = null
    )
}
```

## 5.8 CI/CD Configuration

### .github/workflows/android-ci.yml
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

    - name: Generate coverage report
      run: ./gradlew jacocoTestReport

    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./app/build/reports/jacoco/jacocoTestReport/jacocoTestReport.xml

    - name: Enforce 80% coverage threshold
      run: |
        coverage=$(cat app/build/reports/jacoco/jacocoTestReport/html/index.html | grep -oP '(?<=Total</td><td class="bar">)[0-9]+')
        if [ $coverage -lt 80 ]; then
          echo "Coverage is below 80%: $coverage%"
          exit 1
        fi
```

## Summary

**Testing is VERY VERY important!**

This testing architecture ensures:
- ✅ >80% overall code coverage
- ✅ Tests written alongside implementation
- ✅ CI/CD enforces coverage thresholds
- ✅ Quality gates prevent regression
- ✅ Comprehensive test infrastructure

All tests must pass before merging PRs. No exceptions!
