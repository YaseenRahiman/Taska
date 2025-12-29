package za.co.taska.domain.usecase.job

import app.cash.turbine.test
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.mockito.kotlin.*
import za.co.taska.domain.model.*
import za.co.taska.domain.repository.JobsRepository

/**
 * Unit tests for GetMyJobsUseCase
 * Tests Flow emission and repository interaction for job retrieval
 *
 * Coverage target: >85%
 */
class GetMyJobsUseCaseTest {

    private lateinit var useCase: GetMyJobsUseCase
    private lateinit var repository: JobsRepository

    @Before
    fun setup() {
        repository = mock()
        useCase = GetMyJobsUseCase(repository)
    }

    // ========== Success Cases - Single Status Filter ==========

    @Test
    fun `invoke with no status filter should return all jobs`() = runTest {
        // Given
        val jobs = listOf(
            createTestJob(status = JobStatus.DRAFT),
            createTestJob(status = JobStatus.OPEN)
        )
        whenever(repository.getMyJobs(status = null))
            .thenReturn(flowOf(Resource.Success(jobs)))

        // When & Then
        useCase(status = null).test {
            val result = awaitItem()
            assertTrue(result is Resource.Success)
            assertEquals(2, (result as Resource.Success).data.size)
            awaitComplete()
        }

        verify(repository).getMyJobs(status = null)
    }

    @Test
    fun `invoke with single status filter should return filtered jobs`() = runTest {
        // Given
        val activeJobs = listOf(
            createTestJob(status = JobStatus.OPEN),
            createTestJob(status = JobStatus.OPEN)
        )
        whenever(repository.getMyJobs(status = "OPEN"))
            .thenReturn(flowOf(Resource.Success(activeJobs)))

        // When & Then
        useCase(status = JobStatus.OPEN).test {
            val result = awaitItem()
            assertTrue(result is Resource.Success)
            val successResult = result as Resource.Success
            assertEquals(2, successResult.data.size)
            assertTrue(successResult.data.all { it.status == JobStatus.OPEN })
            awaitComplete()
        }

        verify(repository).getMyJobs(status = "OPEN")
    }

    @Test
    fun `invoke should handle all job statuses`() = runTest {
        // Test DRAFT status
        whenever(repository.getMyJobs(status = "DRAFT"))
            .thenReturn(flowOf(Resource.Success(listOf(createTestJob(status = JobStatus.DRAFT)))))

        useCase(status = JobStatus.DRAFT).test {
            val result = awaitItem()
            assertTrue(result is Resource.Success)
            awaitComplete()
        }

        // Test CANCELLED status
        whenever(repository.getMyJobs(status = "CANCELLED"))
            .thenReturn(flowOf(Resource.Success(listOf(createTestJob(status = JobStatus.CANCELLED)))))

        useCase(status = JobStatus.CANCELLED).test {
            val result = awaitItem()
            assertTrue(result is Resource.Success)
            awaitComplete()
        }

        verify(repository).getMyJobs(status = "DRAFT")
        verify(repository).getMyJobs(status = "CANCELLED")
    }

    // ========== Success Cases - Multiple Statuses Filter ==========

    @Test
    fun `invoke with empty status list should return all jobs`() = runTest {
        // Given
        val jobs = listOf(createTestJob(), createTestJob())
        whenever(repository.getMyJobs(status = null))
            .thenReturn(flowOf(Resource.Success(jobs)))

        // When & Then
        useCase(statuses = emptyList()).test {
            val result = awaitItem()
            assertTrue(result is Resource.Success)
            assertEquals(2, (result as Resource.Success).data.size)
            awaitComplete()
        }

        verify(repository).getMyJobs(status = null)
    }

    @Test
    fun `invoke with single status in list should use single status filter`() = runTest {
        // Given
        val activeJobs = listOf(createTestJob(status = JobStatus.OPEN))
        whenever(repository.getMyJobs(status = "OPEN"))
            .thenReturn(flowOf(Resource.Success(activeJobs)))

        // When & Then
        useCase(statuses = listOf(JobStatus.OPEN)).test {
            val result = awaitItem()
            assertTrue(result is Resource.Success)
            assertEquals(1, (result as Resource.Success).data.size)
            awaitComplete()
        }

        verify(repository).getMyJobs(status = "OPEN")
    }

    @Test
    fun `invoke with multiple statuses should fetch all and rely on server filtering`() = runTest {
        // Given
        val jobs = listOf(
            createTestJob(status = JobStatus.OPEN),
            createTestJob(status = JobStatus.COMPLETED)
        )
        whenever(repository.getMyJobs(status = null))
            .thenReturn(flowOf(Resource.Success(jobs)))

        // When & Then - API limitation: fetch all for multi-status
        useCase(statuses = listOf(JobStatus.OPEN, JobStatus.COMPLETED)).test {
            val result = awaitItem()
            assertTrue(result is Resource.Success)
            assertEquals(2, (result as Resource.Success).data.size)
            awaitComplete()
        }

        verify(repository).getMyJobs(status = null)
    }

    // ========== Flow Emission Tests ==========

    @Test
    fun `invoke should propagate Loading state from repository`() = runTest {
        // Given
        whenever(repository.getMyJobs(status = null))
            .thenReturn(
                flowOf(
                    Resource.Loading(),
                    Resource.Success(listOf(createTestJob()))
                )
            )

        // When & Then
        useCase(status = null).test {
            val loading = awaitItem()
            assertTrue(loading is Resource.Loading)

            val success = awaitItem()
            assertTrue(success is Resource.Success)
            assertEquals(1, (success as Resource.Success).data.size)

            awaitComplete()
        }
    }

    @Test
    fun `invoke should propagate Error state from repository`() = runTest {
        // Given
        whenever(repository.getMyJobs(status = null))
            .thenReturn(flowOf(Resource.Error("Network error")))

        // When & Then
        useCase(status = null).test {
            val result = awaitItem()
            assertTrue(result is Resource.Error)
            assertEquals("Network error", (result as Resource.Error).message)
            awaitComplete()
        }
    }

    @Test
    fun `invoke should handle empty job list successfully`() = runTest {
        // Given
        whenever(repository.getMyJobs(status = null))
            .thenReturn(flowOf(Resource.Success(emptyList())))

        // When & Then
        useCase(status = null).test {
            val result = awaitItem()
            assertTrue(result is Resource.Success)
            assertEquals(0, (result as Resource.Success).data.size)
            awaitComplete()
        }
    }

    @Test
    fun `invoke should emit multiple Loading and Success states`() = runTest {
        // Given
        whenever(repository.getMyJobs(status = "OPEN"))
            .thenReturn(
                flowOf(
                    Resource.Loading(),
                    Resource.Success(emptyList()),
                    Resource.Loading(),
                    Resource.Success(listOf(createTestJob()))
                )
            )

        // When & Then
        useCase(status = JobStatus.OPEN).test {
            assertTrue(awaitItem() is Resource.Loading)
            assertTrue(awaitItem() is Resource.Success)
            assertTrue(awaitItem() is Resource.Loading)

            val finalSuccess = awaitItem()
            assertTrue(finalSuccess is Resource.Success)
            assertEquals(1, (finalSuccess as Resource.Success).data.size)

            awaitComplete()
        }
    }

    // ========== Repository Interaction Tests ==========

    @Test
    fun `invoke should convert JobStatus to string for repository call`() = runTest {
        // Given
        whenever(repository.getMyJobs(status = "COMPLETED"))
            .thenReturn(flowOf(Resource.Success(emptyList())))

        // When
        useCase(status = JobStatus.COMPLETED).test {
            awaitItem()
            awaitComplete()
        }

        // Then - Verify correct string conversion
        verify(repository).getMyJobs(status = "COMPLETED")
    }

    @Test
    fun `invoke should pass null status correctly to repository`() = runTest {
        // Given
        whenever(repository.getMyJobs(status = null))
            .thenReturn(flowOf(Resource.Success(emptyList())))

        // When
        useCase(status = null).test {
            awaitItem()
            awaitComplete()
        }

        // Then
        verify(repository).getMyJobs(status = eq(null))
    }

    // ========== Helper Methods ==========

    private fun createTestJob(
        id: String = "job_123",
        status: JobStatus = JobStatus.OPEN
    ) = Job(
        id = id,
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
