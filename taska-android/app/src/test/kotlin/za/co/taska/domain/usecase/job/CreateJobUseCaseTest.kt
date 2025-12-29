package za.co.taska.domain.usecase.job

import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.mockito.kotlin.*
import za.co.taska.domain.model.*
import za.co.taska.domain.repository.JobsRepository

/**
 * Unit tests for CreateJobUseCase
 * Tests comprehensive validation logic and repository interaction
 *
 * Coverage target: >85%
 */
class CreateJobUseCaseTest {

    private lateinit var useCase: CreateJobUseCase
    private lateinit var repository: JobsRepository

    @Before
    fun setup() {
        repository = mock()
        useCase = CreateJobUseCase(repository)
    }

    // ========== Success Cases ==========

    @Test
    fun `invoke should return success when all inputs valid and repository succeeds`() = runTest {
        // Given
        val job = createTestJob()
        whenever(repository.createJob(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
            .thenReturn(Result.success(job))

        // When
        val result = useCase(
            categoryId = "cat_123",
            title = "Need plumbing repair in kitchen",
            description = "The kitchen sink is leaking and needs urgent repair. Water is dripping constantly from the pipes under the sink.",
            budget = 500.0,
            budgetType = BudgetType.FIXED,
            urgency = UrgencyLevel.HIGH,
            address = createTestAddress(),
            images = listOf("img1.jpg"),
            requirements = listOf("Licensed plumber", "Same day service"),
            startDate = "2025-11-01",
            endDate = "2025-11-02"
        )

        // Then
        assertTrue(result.isSuccess)
        assertEquals("job_123", result.getOrNull()?.id)

        // Verify repository called with trimmed inputs
        verify(repository).createJob(
            categoryId = eq("cat_123"),
            title = eq("Need plumbing repair in kitchen"),
            description = any(),
            budget = eq(500.0),
            budgetType = eq(BudgetType.FIXED),
            urgency = eq(UrgencyLevel.HIGH),
            address = any(),
            images = eq(listOf("img1.jpg")),
            requirements = argThat { this.size == 2 },
            startDate = eq("2025-11-01"),
            endDate = eq("2025-11-02")
        )
    }

    @Test
    fun `invoke should succeed with minimum required fields`() = runTest {
        // Given
        whenever(repository.createJob(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
            .thenReturn(Result.success(createTestJob()))

        // When - Only required fields, no images/requirements/dates
        val result = useCase(
            categoryId = "cat_123",
            title = "Test job title minimum length here",
            description = "This is a test job description that meets the minimum fifty character requirement for validation purposes.",
            budget = 100.0,
            budgetType = BudgetType.NEGOTIABLE,
            urgency = UrgencyLevel.LOW,
            address = createTestAddress()
        )

        // Then
        assertTrue(result.isSuccess)
        verify(repository).createJob(
            categoryId = any(),
            title = any(),
            description = any(),
            budget = any(),
            budgetType = any(),
            urgency = any(),
            address = any(),
            images = eq(emptyList()),
            requirements = eq(emptyList()),
            startDate = isNull(),
            endDate = isNull()
        )
    }

    @Test
    fun `invoke should trim whitespace from title and description`() = runTest {
        // Given
        whenever(repository.createJob(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
            .thenReturn(Result.success(createTestJob()))

        // When
        val result = useCase(
            categoryId = "cat_123",
            title = "  Plumbing job with spaces  ",
            description = "  This description has leading and trailing spaces that should be trimmed properly for validation  ",
            budget = 300.0,
            budgetType = BudgetType.HOURLY,
            urgency = UrgencyLevel.MEDIUM,
            address = createTestAddress()
        )

        // Then
        assertTrue(result.isSuccess)
        verify(repository).createJob(
            categoryId = eq("cat_123"),
            title = eq("Plumbing job with spaces"),
            description = argThat { !this.startsWith(" ") && !this.endsWith(" ") },
            budget = eq(300.0),
            budgetType = eq(BudgetType.HOURLY),
            urgency = eq(UrgencyLevel.MEDIUM),
            address = any(),
            images = eq(emptyList()),
            requirements = eq(emptyList()),
            startDate = isNull(),
            endDate = isNull()
        )
    }

    @Test
    fun `invoke should accept maximum valid values`() = runTest {
        // Given
        whenever(repository.createJob(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
            .thenReturn(Result.success(createTestJob()))

        val maxTitle = "A".repeat(100)
        val maxDescription = "B".repeat(2000)
        val maxImages = (1..5).map { "img$it.jpg" }
        val maxRequirements = (1..10).map { "Requirement $it" }

        // When
        val result = useCase(
            categoryId = "cat_123",
            title = maxTitle,
            description = maxDescription,
            budget = 999999.0, // Just under 1M limit
            budgetType = BudgetType.FIXED,
            urgency = UrgencyLevel.URGENT,
            address = createTestAddress(),
            images = maxImages,
            requirements = maxRequirements
        )

        // Then
        assertTrue(result.isSuccess)
    }

    // ========== Validation Error Cases - Category ==========

    @Test
    fun `invoke should fail when categoryId is blank`() = runTest {
        // When
        val result = useCase(
            categoryId = "",
            title = "Valid title here",
            description = "Valid description that meets the minimum length requirement",
            budget = 500.0,
            budgetType = BudgetType.FIXED,
            urgency = UrgencyLevel.HIGH,
            address = createTestAddress()
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Category must be selected", result.exceptionOrNull()?.message)
        verify(repository, never()).createJob(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any())
    }

    // ========== Validation Error Cases - Title ==========

    @Test
    fun `invoke should fail when title is blank`() = runTest {
        // When
        val result = useCase(
            categoryId = "cat_123",
            title = "",
            description = "Valid description that meets the minimum length requirement",
            budget = 500.0,
            budgetType = BudgetType.FIXED,
            urgency = UrgencyLevel.HIGH,
            address = createTestAddress()
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Job title cannot be empty", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when title is too short`() = runTest {
        // When
        val result = useCase(
            categoryId = "cat_123",
            title = "Short",
            description = "Valid description that meets the minimum length requirement",
            budget = 500.0,
            budgetType = BudgetType.FIXED,
            urgency = UrgencyLevel.HIGH,
            address = createTestAddress()
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Job title must be at least 10 characters", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when title exceeds 100 characters`() = runTest {
        // When
        val result = useCase(
            categoryId = "cat_123",
            title = "A".repeat(101),
            description = "Valid description that meets the minimum length requirement",
            budget = 500.0,
            budgetType = BudgetType.FIXED,
            urgency = UrgencyLevel.HIGH,
            address = createTestAddress()
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Job title cannot exceed 100 characters", result.exceptionOrNull()?.message)
    }

    // ========== Validation Error Cases - Description ==========

    @Test
    fun `invoke should fail when description is blank`() = runTest {
        // When
        val result = useCase(
            categoryId = "cat_123",
            title = "Valid title here",
            description = "",
            budget = 500.0,
            budgetType = BudgetType.FIXED,
            urgency = UrgencyLevel.HIGH,
            address = createTestAddress()
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Job description cannot be empty", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when description is too short`() = runTest {
        // When
        val result = useCase(
            categoryId = "cat_123",
            title = "Valid title here",
            description = "Too short",
            budget = 500.0,
            budgetType = BudgetType.FIXED,
            urgency = UrgencyLevel.HIGH,
            address = createTestAddress()
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Job description must be at least 50 characters", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when description exceeds 2000 characters`() = runTest {
        // When
        val result = useCase(
            categoryId = "cat_123",
            title = "Valid title here",
            description = "A".repeat(2001),
            budget = 500.0,
            budgetType = BudgetType.FIXED,
            urgency = UrgencyLevel.HIGH,
            address = createTestAddress()
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Job description cannot exceed 2000 characters", result.exceptionOrNull()?.message)
    }

    // ========== Validation Error Cases - Budget ==========

    @Test
    fun `invoke should fail when budget is zero`() = runTest {
        // When
        val result = useCase(
            categoryId = "cat_123",
            title = "Valid title here",
            description = "Valid description that meets the minimum length requirement",
            budget = 0.0,
            budgetType = BudgetType.FIXED,
            urgency = UrgencyLevel.HIGH,
            address = createTestAddress()
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Budget must be greater than zero", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when budget is negative`() = runTest {
        // When
        val result = useCase(
            categoryId = "cat_123",
            title = "Valid title here",
            description = "Valid description that meets the minimum length requirement",
            budget = -100.0,
            budgetType = BudgetType.FIXED,
            urgency = UrgencyLevel.HIGH,
            address = createTestAddress()
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Budget must be greater than zero", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when budget exceeds 1 million`() = runTest {
        // When
        val result = useCase(
            categoryId = "cat_123",
            title = "Valid title here",
            description = "Valid description that meets the minimum length requirement",
            budget = 1000001.0,
            budgetType = BudgetType.FIXED,
            urgency = UrgencyLevel.HIGH,
            address = createTestAddress()
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Budget cannot exceed R1,000,000", result.exceptionOrNull()?.message)
    }

    // ========== Validation Error Cases - Address ==========

    @Test
    fun `invoke should fail when addressLine1 is blank`() = runTest {
        // When
        val result = useCase(
            categoryId = "cat_123",
            title = "Valid title here",
            description = "Valid description that meets the minimum length requirement",
            budget = 500.0,
            budgetType = BudgetType.FIXED,
            urgency = UrgencyLevel.HIGH,
            address = createTestAddress(addressLine1 = "")
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Street address is required", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when city is blank`() = runTest {
        // When
        val result = useCase(
            categoryId = "cat_123",
            title = "Valid title here",
            description = "Valid description that meets the minimum length requirement",
            budget = 500.0,
            budgetType = BudgetType.FIXED,
            urgency = UrgencyLevel.HIGH,
            address = createTestAddress(city = "")
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("City is required", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when province is blank`() = runTest {
        // When
        val result = useCase(
            categoryId = "cat_123",
            title = "Valid title here",
            description = "Valid description that meets the minimum length requirement",
            budget = 500.0,
            budgetType = BudgetType.FIXED,
            urgency = UrgencyLevel.HIGH,
            address = createTestAddress(province = "")
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Province is required", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when postalCode is blank`() = runTest {
        // When
        val result = useCase(
            categoryId = "cat_123",
            title = "Valid title here",
            description = "Valid description that meets the minimum length requirement",
            budget = 500.0,
            budgetType = BudgetType.FIXED,
            urgency = UrgencyLevel.HIGH,
            address = createTestAddress(postalCode = "")
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Postal code is required", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when postalCode is invalid`() = runTest {
        // When
        val result = useCase(
            categoryId = "cat_123",
            title = "Valid title here",
            description = "Valid description that meets the minimum length requirement",
            budget = 500.0,
            budgetType = BudgetType.FIXED,
            urgency = UrgencyLevel.HIGH,
            address = createTestAddress(postalCode = "ABCD")
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Invalid South African postal code", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when latitude is out of range`() = runTest {
        // When
        val result = useCase(
            categoryId = "cat_123",
            title = "Valid title here",
            description = "Valid description that meets the minimum length requirement",
            budget = 500.0,
            budgetType = BudgetType.FIXED,
            urgency = UrgencyLevel.HIGH,
            address = createTestAddress(latitude = -91.0)
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Invalid latitude", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when longitude is out of range`() = runTest {
        // When
        val result = useCase(
            categoryId = "cat_123",
            title = "Valid title here",
            description = "Valid description that meets the minimum length requirement",
            budget = 500.0,
            budgetType = BudgetType.FIXED,
            urgency = UrgencyLevel.HIGH,
            address = createTestAddress(longitude = 181.0)
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Invalid longitude", result.exceptionOrNull()?.message)
    }

    // ========== Validation Error Cases - Images ==========

    @Test
    fun `invoke should fail when more than 5 images`() = runTest {
        // When
        val result = useCase(
            categoryId = "cat_123",
            title = "Valid title here",
            description = "Valid description that meets the minimum length requirement",
            budget = 500.0,
            budgetType = BudgetType.FIXED,
            urgency = UrgencyLevel.HIGH,
            address = createTestAddress(),
            images = (1..6).map { "img$it.jpg" }
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Maximum 5 images allowed", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when image URL is blank`() = runTest {
        // When
        val result = useCase(
            categoryId = "cat_123",
            title = "Valid title here",
            description = "Valid description that meets the minimum length requirement",
            budget = 500.0,
            budgetType = BudgetType.FIXED,
            urgency = UrgencyLevel.HIGH,
            address = createTestAddress(),
            images = listOf("img1.jpg", "")
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Image URLs cannot be blank", result.exceptionOrNull()?.message)
    }

    // ========== Validation Error Cases - Requirements ==========

    @Test
    fun `invoke should fail when more than 10 requirements`() = runTest {
        // When
        val result = useCase(
            categoryId = "cat_123",
            title = "Valid title here",
            description = "Valid description that meets the minimum length requirement",
            budget = 500.0,
            budgetType = BudgetType.FIXED,
            urgency = UrgencyLevel.HIGH,
            address = createTestAddress(),
            requirements = (1..11).map { "Requirement $it" }
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Maximum 10 requirements allowed", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when requirement is blank`() = runTest {
        // When
        val result = useCase(
            categoryId = "cat_123",
            title = "Valid title here",
            description = "Valid description that meets the minimum length requirement",
            budget = 500.0,
            budgetType = BudgetType.FIXED,
            urgency = UrgencyLevel.HIGH,
            address = createTestAddress(),
            requirements = listOf("Valid requirement", "")
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Requirements cannot be blank", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when requirement exceeds 200 characters`() = runTest {
        // When
        val result = useCase(
            categoryId = "cat_123",
            title = "Valid title here",
            description = "Valid description that meets the minimum length requirement",
            budget = 500.0,
            budgetType = BudgetType.FIXED,
            urgency = UrgencyLevel.HIGH,
            address = createTestAddress(),
            requirements = listOf("A".repeat(201))
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Each requirement cannot exceed 200 characters", result.exceptionOrNull()?.message)
    }

    // ========== Validation Error Cases - Dates ==========

    @Test
    fun `invoke should fail when startDate is after endDate`() = runTest {
        // When
        val result = useCase(
            categoryId = "cat_123",
            title = "Valid title here",
            description = "Valid description that meets the minimum length requirement",
            budget = 500.0,
            budgetType = BudgetType.FIXED,
            urgency = UrgencyLevel.HIGH,
            address = createTestAddress(),
            startDate = "2025-11-10",
            endDate = "2025-11-01"
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Start date must be before end date", result.exceptionOrNull()?.message)
    }

    // ========== Repository Error Propagation ==========

    @Test
    fun `invoke should propagate repository errors`() = runTest {
        // Given
        whenever(repository.createJob(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
            .thenReturn(Result.failure(RuntimeException("Network error")))

        // When
        val result = useCase(
            categoryId = "cat_123",
            title = "Valid title here",
            description = "Valid description that meets the minimum length requirement",
            budget = 500.0,
            budgetType = BudgetType.FIXED,
            urgency = UrgencyLevel.HIGH,
            address = createTestAddress()
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Network error", result.exceptionOrNull()?.message)
    }

    // ========== Helper Methods ==========

    private fun createTestJob() = Job(
        id = "job_123",
        clientId = "client_456",
        categoryId = "cat_789",
        title = "Test Job",
        description = "Test Description",
        budget = 500.0,
        budgetType = BudgetType.FIXED,
        urgency = UrgencyLevel.HIGH,
        status = JobStatus.DRAFT,
        address = createTestAddress(),
        images = emptyList(),
        requirements = emptyList(),
        startDate = null,
        endDate = null,
        createdAt = "2025-10-31T10:00:00Z",
        client = null,
        category = null
    )

    private fun createTestAddress(
        addressLine1: String = "123 Main Street",
        addressLine2: String? = null,
        city: String = "Cape Town",
        province: String = "Western Cape",
        postalCode: String = "8001",
        latitude: Double = -33.9249,
        longitude: Double = 18.4241
    ) = Address(
        addressLine1 = addressLine1,
        addressLine2 = addressLine2,
        city = city,
        province = province,
        postalCode = postalCode,
        latitude = latitude,
        longitude = longitude
    )
}
