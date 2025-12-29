package za.co.taska.domain.usecase.job

import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.mockito.kotlin.*
import za.co.taska.domain.model.*
import za.co.taska.domain.repository.JobsRepository

/**
 * Unit tests for CancelJobUseCase
 * Tests job ID validation and repository interaction
 *
 * Coverage target: >85%
 */
class CancelJobUseCaseTest {

    private lateinit var useCase: CancelJobUseCase
    private lateinit var repository: JobsRepository

    @Before
    fun setup() {
        repository = mock()
        useCase = CancelJobUseCase(repository)
    }

    // ========== Success Cases ==========

    @Test
    fun `invoke should return success with cancelled job when jobId is valid`() = runTest {
        // Given
        val cancelledJob = createTestJob(status = JobStatus.CANCELLED)
        whenever(repository.cancelJob(any()))
            .thenReturn(Result.success(cancelledJob))

        // When
        val result = useCase("job_123")

        // Then
        assertTrue(result.isSuccess)
        assertEquals("job_123", result.getOrNull()?.id)
        assertEquals(JobStatus.CANCELLED, result.getOrNull()?.status)
        verify(repository).cancelJob("job_123")
    }

    @Test
    fun `invoke should call repository with correct jobId`() = runTest {
        // Given
        val jobId = "job_abc_xyz_123"
        whenever(repository.cancelJob(any()))
            .thenReturn(Result.success(createTestJob()))

        // When
        val result = useCase(jobId)

        // Then
        assertTrue(result.isSuccess)
        verify(repository).cancelJob(jobId)
    }

    // ========== Validation Error Cases ==========

    @Test
    fun `invoke should fail when jobId is empty string`() = runTest {
        // When
        val result = useCase("")

        // Then
        assertTrue(result.isFailure)
        assertEquals("Job ID cannot be empty", result.exceptionOrNull()?.message)
        verify(repository, never()).cancelJob(any())
    }

    @Test
    fun `invoke should fail when jobId is blank whitespace`() = runTest {
        // When
        val result = useCase("   ")

        // Then
        assertTrue(result.isFailure)
        assertEquals("Job ID cannot be empty", result.exceptionOrNull()?.message)
        verify(repository, never()).cancelJob(any())
    }

    @Test
    fun `invoke should fail when jobId is tab and newline characters`() = runTest {
        // When
        val result = useCase("\t\n")

        // Then
        assertTrue(result.isFailure)
        assertEquals("Job ID cannot be empty", result.exceptionOrNull()?.message)
        verify(repository, never()).cancelJob(any())
    }

    // ========== Repository Error Propagation ==========

    @Test
    fun `invoke should propagate repository errors`() = runTest {
        // Given
        whenever(repository.cancelJob(any()))
            .thenReturn(Result.failure(RuntimeException("Failed to cancel job")))

        // When
        val result = useCase("job_123")

        // Then
        assertTrue(result.isFailure)
        assertEquals("Failed to cancel job", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should propagate job not found errors`() = runTest {
        // Given
        whenever(repository.cancelJob(any()))
            .thenReturn(Result.failure(RuntimeException("Job not found")))

        // When
        val result = useCase("non_existent_job")

        // Then
        assertTrue(result.isFailure)
        assertEquals("Job not found", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should propagate permission denied errors`() = runTest {
        // Given
        whenever(repository.cancelJob(any()))
            .thenReturn(Result.failure(RuntimeException("Cannot cancel completed job")))

        // When
        val result = useCase("completed_job_123")

        // Then
        assertTrue(result.isFailure)
        assertTrue(result.exceptionOrNull()?.message?.contains("Cannot cancel") == true)
    }

    // ========== Helper Methods ==========

    private fun createTestJob(status: JobStatus = JobStatus.CANCELLED) = Job(
        id = "job_123",
        clientId = "client_456",
        categoryId = "cat_789",
        title = "Test Job",
        description = "Test Description",
        budget = 500.0,
        budgetType = BudgetType.FIXED,
        urgency = UrgencyLevel.HIGH,
        status = status,
        address = Address(
            addressLine1 = "123 Main Street",
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
        createdAt = "2025-10-31T10:00:00Z",
        client = null,
        category = null
    )
}
