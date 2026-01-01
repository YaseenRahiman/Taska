package za.co.taska.domain.usecase.job

import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.mockito.kotlin.*
import za.co.taska.domain.repository.JobsRepository

/**
 * Unit tests for DeleteJobUseCase
 * Tests job ID validation and repository interaction
 *
 * Coverage target: >85%
 */
class DeleteJobUseCaseTest {

    private lateinit var useCase: DeleteJobUseCase
    private lateinit var repository: JobsRepository

    @Before
    fun setup() {
        repository = mock()
        useCase = DeleteJobUseCase(repository)
    }

    // ========== Success Cases ==========

    @Test
    fun `invoke should return success when jobId is valid and repository succeeds`() = runTest {
        // Given
        whenever(repository.deleteJob(any()))
            .thenReturn(Result.success(Unit))

        // When
        val result = useCase("job_123")

        // Then
        assertTrue(result.isSuccess)
        verify(repository).deleteJob("job_123")
    }

    @Test
    fun `invoke should call repository with correct jobId`() = runTest {
        // Given
        val jobId = "job_abc_xyz_123"
        whenever(repository.deleteJob(any()))
            .thenReturn(Result.success(Unit))

        // When
        val result = useCase(jobId)

        // Then
        assertTrue(result.isSuccess)
        verify(repository).deleteJob(jobId)
    }

    // ========== Validation Error Cases ==========

    @Test
    fun `invoke should fail when jobId is empty string`() = runTest {
        // When
        val result = useCase("")

        // Then
        assertTrue(result.isFailure)
        assertEquals("Job ID cannot be empty", result.exceptionOrNull()?.message)
        verify(repository, never()).deleteJob(any())
    }

    @Test
    fun `invoke should fail when jobId is blank whitespace`() = runTest {
        // When
        val result = useCase("   ")

        // Then
        assertTrue(result.isFailure)
        assertEquals("Job ID cannot be empty", result.exceptionOrNull()?.message)
        verify(repository, never()).deleteJob(any())
    }

    @Test
    fun `invoke should fail when jobId is tab and newline characters`() = runTest {
        // When
        val result = useCase("\t\n")

        // Then
        assertTrue(result.isFailure)
        assertEquals("Job ID cannot be empty", result.exceptionOrNull()?.message)
        verify(repository, never()).deleteJob(any())
    }

    // ========== Repository Error Propagation ==========

    @Test
    fun `invoke should propagate repository errors`() = runTest {
        // Given
        whenever(repository.deleteJob(any()))
            .thenReturn(Result.failure(RuntimeException("Failed to delete job")))

        // When
        val result = useCase("job_123")

        // Then
        assertTrue(result.isFailure)
        assertEquals("Failed to delete job", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should propagate job not found errors`() = runTest {
        // Given
        whenever(repository.deleteJob(any()))
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
        whenever(repository.deleteJob(any()))
            .thenReturn(Result.failure(RuntimeException("Cannot delete job in active status")))

        // When
        val result = useCase("active_job_123")

        // Then
        assertTrue(result.isFailure)
        assertTrue(result.exceptionOrNull()?.message?.contains("Cannot delete") == true)
    }
}
