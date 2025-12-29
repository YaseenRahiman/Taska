package za.co.taska.domain.usecase.job

import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.mockito.kotlin.*
import za.co.taska.domain.model.*
import za.co.taska.domain.repository.JobsRepository

/**
 * Unit tests for UpdateJobUseCase
 * Tests comprehensive validation logic for partial updates and repository interaction
 *
 * Coverage target: >85%
 */
class UpdateJobUseCaseTest {

    private lateinit var useCase: UpdateJobUseCase
    private lateinit var repository: JobsRepository

    @Before
    fun setup() {
        repository = mock()
        useCase = UpdateJobUseCase(repository)
    }

    // ========== Success Cases - Partial Updates ==========

    @Test
    fun `invoke should return success when updating only title`() = runTest {
        // Given
        val job = createTestJob()
        whenever(repository.updateJob(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
            .thenReturn(Result.success(job))

        // When
        val result = useCase(
            jobId = "job_123",
            title = "Updated plumbing job title here"
        )

        // Then
        assertTrue(result.isSuccess)
        assertEquals("job_123", result.getOrNull()?.id)

        // Verify repository called with only title, rest null
        verify(repository).updateJob(
            jobId = eq("job_123"),
            title = eq("Updated plumbing job title here"),
            description = isNull(),
            budget = isNull(),
            budgetType = isNull(),
            urgency = isNull(),
            address = isNull(),
            images = isNull(),
            requirements = isNull(),
            startDate = isNull(),
            endDate = isNull()
        )
    }

    @Test
    fun `invoke should return success when updating multiple fields`() = runTest {
        // Given
        val job = createTestJob()
        whenever(repository.updateJob(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
            .thenReturn(Result.success(job))

        // When
        val result = useCase(
            jobId = "job_123",
            title = "Updated title here with length",
            budget = 750.0,
            urgency = UrgencyLevel.URGENT
        )

        // Then
        assertTrue(result.isSuccess)
        verify(repository).updateJob(
            jobId = eq("job_123"),
            title = eq("Updated title here with length"),
            description = isNull(),
            budget = eq(750.0),
            budgetType = isNull(),
            urgency = eq(UrgencyLevel.URGENT),
            address = isNull(),
            images = isNull(),
            requirements = isNull(),
            startDate = isNull(),
            endDate = isNull()
        )
    }

    @Test
    fun `invoke should return success when updating all fields`() = runTest {
        // Given
        val job = createTestJob()
        whenever(repository.updateJob(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
            .thenReturn(Result.success(job))

        // When
        val result = useCase(
            jobId = "job_123",
            title = "Complete update job title with sufficient length",
            description = "Complete update description that meets the minimum fifty character length requirement for validation",
            budget = 1000.0,
            budgetType = BudgetType.HOURLY,
            urgency = UrgencyLevel.LOW,
            address = createTestAddress(),
            images = listOf("new1.jpg", "new2.jpg"),
            requirements = listOf("Updated requirement 1", "Updated requirement 2"),
            startDate = "2025-12-01",
            endDate = "2025-12-10"
        )

        // Then
        assertTrue(result.isSuccess)
        verify(repository).updateJob(
            jobId = eq("job_123"),
            title = any(),
            description = any(),
            budget = eq(1000.0),
            budgetType = eq(BudgetType.HOURLY),
            urgency = eq(UrgencyLevel.LOW),
            address = any(),
            images = argThat { this?.size == 2 },
            requirements = argThat { this?.size == 2 },
            startDate = eq("2025-12-01"),
            endDate = eq("2025-12-10")
        )
    }

    @Test
    fun `invoke should trim whitespace from updated title and description`() = runTest {
        // Given
        whenever(repository.updateJob(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
            .thenReturn(Result.success(createTestJob()))

        // When
        val result = useCase(
            jobId = "job_123",
            title = "  Updated job title with spaces  ",
            description = "  Updated description with leading and trailing spaces that should be trimmed  "
        )

        // Then
        assertTrue(result.isSuccess)
        verify(repository).updateJob(
            jobId = any(),
            title = eq("Updated job title with spaces"),
            description = argThat { this != null && !this.startsWith(" ") && !this.endsWith(" ") },
            budget = isNull(),
            budgetType = isNull(),
            urgency = isNull(),
            address = isNull(),
            images = isNull(),
            requirements = isNull(),
            startDate = isNull(),
            endDate = isNull()
        )
    }

    @Test
    fun `invoke should accept maximum valid values for partial update`() = runTest {
        // Given
        whenever(repository.updateJob(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
            .thenReturn(Result.success(createTestJob()))

        val maxTitle = "A".repeat(100)
        val maxDescription = "B".repeat(2000)
        val maxImages = (1..5).map { "img$it.jpg" }
        val maxRequirements = (1..10).map { "Requirement $it with sufficient length" }

        // When
        val result = useCase(
            jobId = "job_123",
            title = maxTitle,
            description = maxDescription,
            budget = 999999.0,
            images = maxImages,
            requirements = maxRequirements
        )

        // Then
        assertTrue(result.isSuccess)
    }

    @Test
    fun `invoke should succeed with null values to keep existing`() = runTest {
        // Given
        whenever(repository.updateJob(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
            .thenReturn(Result.success(createTestJob()))

        // When - All nulls except jobId (keep all existing)
        val result = useCase(jobId = "job_123")

        // Then
        assertTrue(result.isSuccess)
        verify(repository).updateJob(
            jobId = eq("job_123"),
            title = isNull(),
            description = isNull(),
            budget = isNull(),
            budgetType = isNull(),
            urgency = isNull(),
            address = isNull(),
            images = isNull(),
            requirements = isNull(),
            startDate = isNull(),
            endDate = isNull()
        )
    }

    // ========== Validation Error Cases - Job ID ==========

    @Test
    fun `invoke should fail when jobId is blank`() = runTest {
        // When
        val result = useCase(
            jobId = "",
            title = "Valid updated title here"
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Job ID cannot be empty", result.exceptionOrNull()?.message)
        verify(repository, never()).updateJob(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any())
    }

    @Test
    fun `invoke should fail when jobId is whitespace`() = runTest {
        // When
        val result = useCase(
            jobId = "   ",
            title = "Valid updated title here"
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Job ID cannot be empty", result.exceptionOrNull()?.message)
    }

    // ========== Validation Error Cases - Title ==========

    @Test
    fun `invoke should fail when title is blank string not null`() = runTest {
        // When
        val result = useCase(
            jobId = "job_123",
            title = ""
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Job title cannot be blank (use null to keep existing)", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when title is whitespace only`() = runTest {
        // When
        val result = useCase(
            jobId = "job_123",
            title = "   "
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Job title cannot be blank (use null to keep existing)", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when title is too short`() = runTest {
        // When
        val result = useCase(
            jobId = "job_123",
            title = "Short"
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Job title must be at least 10 characters", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when title exceeds 100 characters`() = runTest {
        // When
        val result = useCase(
            jobId = "job_123",
            title = "A".repeat(101)
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Job title cannot exceed 100 characters", result.exceptionOrNull()?.message)
    }

    // ========== Validation Error Cases - Description ==========

    @Test
    fun `invoke should fail when description is blank string not null`() = runTest {
        // When
        val result = useCase(
            jobId = "job_123",
            description = ""
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Job description cannot be blank (use null to keep existing)", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when description is whitespace only`() = runTest {
        // When
        val result = useCase(
            jobId = "job_123",
            description = "   "
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Job description cannot be blank (use null to keep existing)", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when description is too short`() = runTest {
        // When
        val result = useCase(
            jobId = "job_123",
            description = "Too short"
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Job description must be at least 50 characters", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when description exceeds 2000 characters`() = runTest {
        // When
        val result = useCase(
            jobId = "job_123",
            description = "A".repeat(2001)
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
            jobId = "job_123",
            budget = 0.0
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Budget must be greater than zero", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when budget is negative`() = runTest {
        // When
        val result = useCase(
            jobId = "job_123",
            budget = -100.0
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Budget must be greater than zero", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when budget exceeds 1 million`() = runTest {
        // When
        val result = useCase(
            jobId = "job_123",
            budget = 1000001.0
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Budget cannot exceed R1,000,000", result.exceptionOrNull()?.message)
    }

    // ========== Validation Error Cases - Address ==========

    @Test
    fun `invoke should fail when address addressLine1 is blank`() = runTest {
        // When
        val result = useCase(
            jobId = "job_123",
            address = createTestAddress(addressLine1 = "")
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Street address cannot be empty", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when address city is blank`() = runTest {
        // When
        val result = useCase(
            jobId = "job_123",
            address = createTestAddress(city = "")
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("City cannot be empty", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when address province is blank`() = runTest {
        // When
        val result = useCase(
            jobId = "job_123",
            address = createTestAddress(province = "")
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Province cannot be empty", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when address postalCode is blank`() = runTest {
        // When
        val result = useCase(
            jobId = "job_123",
            address = createTestAddress(postalCode = "")
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Postal code cannot be empty", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when address postalCode is invalid`() = runTest {
        // When
        val result = useCase(
            jobId = "job_123",
            address = createTestAddress(postalCode = "ABCD")
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Invalid South African postal code", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when address latitude is out of range`() = runTest {
        // When
        val result = useCase(
            jobId = "job_123",
            address = createTestAddress(latitude = -91.0)
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Invalid latitude", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when address longitude is out of range`() = runTest {
        // When
        val result = useCase(
            jobId = "job_123",
            address = createTestAddress(longitude = 181.0)
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Invalid longitude", result.exceptionOrNull()?.message)
    }

    // ========== Validation Error Cases - Images ==========

    @Test
    fun `invoke should fail when trying to update to empty images list`() = runTest {
        // When
        val result = useCase(
            jobId = "job_123",
            images = emptyList()
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Cannot update to empty images list (use null to keep existing)", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when more than 5 images`() = runTest {
        // When
        val result = useCase(
            jobId = "job_123",
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
            jobId = "job_123",
            images = listOf("img1.jpg", "")
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Image URLs cannot be blank", result.exceptionOrNull()?.message)
    }

    // ========== Validation Error Cases - Requirements ==========

    @Test
    fun `invoke should fail when trying to update to empty requirements list`() = runTest {
        // When
        val result = useCase(
            jobId = "job_123",
            requirements = emptyList()
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Cannot update to empty requirements list (use null to keep existing)", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when more than 10 requirements`() = runTest {
        // When
        val result = useCase(
            jobId = "job_123",
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
            jobId = "job_123",
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
            jobId = "job_123",
            requirements = listOf("A".repeat(201))
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Each requirement cannot exceed 200 characters", result.exceptionOrNull()?.message)
    }

    // ========== Repository Error Propagation ==========

    @Test
    fun `invoke should propagate repository errors`() = runTest {
        // Given
        whenever(repository.updateJob(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
            .thenReturn(Result.failure(RuntimeException("Network error")))

        // When
        val result = useCase(
            jobId = "job_123",
            title = "Valid updated title here"
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Network error", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should propagate job not found errors`() = runTest {
        // Given
        whenever(repository.updateJob(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
            .thenReturn(Result.failure(RuntimeException("Job not found")))

        // When
        val result = useCase(
            jobId = "non_existent_job",
            budget = 500.0
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Job not found", result.exceptionOrNull()?.message)
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
