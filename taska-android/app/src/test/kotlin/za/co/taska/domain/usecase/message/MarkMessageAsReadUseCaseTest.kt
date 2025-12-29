package za.co.taska.domain.usecase.message

import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.mockito.kotlin.*
import za.co.taska.domain.repository.MessagesRepository

/**
 * Unit tests for MarkMessageAsReadUseCase
 * Tests validation logic and repository interaction for both methods
 *
 * Coverage target: >85%
 * Test count: ~12 tests
 */
class MarkMessageAsReadUseCaseTest {

    private lateinit var useCase: MarkMessageAsReadUseCase
    private lateinit var repository: MessagesRepository

    @Before
    fun setup() {
        repository = mock()
        useCase = MarkMessageAsReadUseCase(repository)
    }

    // ========== markMessage Success Cases ==========

    @Test
    fun `markMessage should return success when message marked`() = runTest {
        // Given
        whenever(repository.markMessageAsRead(any()))
            .thenReturn(Result.success(Unit))

        // When
        val result = useCase.markMessage("msg_123")

        // Then
        assertTrue(result.isSuccess)
        verify(repository).markMessageAsRead("msg_123")
    }

    @Test
    fun `markMessage should trim whitespace from messageId`() = runTest {
        // Given
        whenever(repository.markMessageAsRead(any()))
            .thenReturn(Result.success(Unit))

        // When
        useCase.markMessage("  msg_123  ")

        // Then
        verify(repository).markMessageAsRead("msg_123")
    }

    @Test
    fun `markMessage should handle repository success`() = runTest {
        // Given
        whenever(repository.markMessageAsRead(any()))
            .thenReturn(Result.success(Unit))

        // When
        val result = useCase.markMessage("msg_123")

        // Then
        assertTrue(result.isSuccess)
        assertNull(result.exceptionOrNull())
    }

    // ========== markMessage Validation Error Cases ==========

    @Test
    fun `markMessage should fail when messageId is empty`() = runTest {
        // When
        val result = useCase.markMessage("")

        // Then
        assertTrue(result.isFailure)
        assertTrue(result.exceptionOrNull() is IllegalArgumentException)
        assertEquals("Message ID cannot be empty", result.exceptionOrNull()?.message)
        verifyNoInteractions(repository)
    }

    @Test
    fun `markMessage should fail when messageId is whitespace`() = runTest {
        // When
        val result = useCase.markMessage("   ")

        // Then
        assertTrue(result.isFailure)
        assertTrue(result.exceptionOrNull() is IllegalArgumentException)
        assertEquals("Message ID cannot be empty", result.exceptionOrNull()?.message)
        verifyNoInteractions(repository)
    }

    // ========== markMessage Repository Error Cases ==========

    @Test
    fun `markMessage should propagate repository errors`() = runTest {
        // Given
        whenever(repository.markMessageAsRead(any()))
            .thenReturn(Result.failure(Exception("Message not found")))

        // When
        val result = useCase.markMessage("msg_123")

        // Then
        assertTrue(result.isFailure)
        assertEquals("Message not found", result.exceptionOrNull()?.message)
    }

    // ========== markJobMessages Success Cases ==========

    @Test
    fun `markJobMessages should return success when job messages marked`() = runTest {
        // Given
        whenever(repository.markJobMessagesAsRead(any()))
            .thenReturn(Result.success(Unit))

        // When
        val result = useCase.markJobMessages("job_456")

        // Then
        assertTrue(result.isSuccess)
        verify(repository).markJobMessagesAsRead("job_456")
    }

    @Test
    fun `markJobMessages should trim whitespace from jobId`() = runTest {
        // Given
        whenever(repository.markJobMessagesAsRead(any()))
            .thenReturn(Result.success(Unit))

        // When
        useCase.markJobMessages("  job_456  ")

        // Then
        verify(repository).markJobMessagesAsRead("job_456")
    }

    @Test
    fun `markJobMessages should handle repository success`() = runTest {
        // Given
        whenever(repository.markJobMessagesAsRead(any()))
            .thenReturn(Result.success(Unit))

        // When
        val result = useCase.markJobMessages("job_456")

        // Then
        assertTrue(result.isSuccess)
        assertNull(result.exceptionOrNull())
    }

    // ========== markJobMessages Validation Error Cases ==========

    @Test
    fun `markJobMessages should fail when jobId is empty`() = runTest {
        // When
        val result = useCase.markJobMessages("")

        // Then
        assertTrue(result.isFailure)
        assertTrue(result.exceptionOrNull() is IllegalArgumentException)
        assertEquals("Job ID cannot be empty", result.exceptionOrNull()?.message)
        verifyNoInteractions(repository)
    }

    @Test
    fun `markJobMessages should fail when jobId is whitespace`() = runTest {
        // When
        val result = useCase.markJobMessages("   ")

        // Then
        assertTrue(result.isFailure)
        assertTrue(result.exceptionOrNull() is IllegalArgumentException)
        assertEquals("Job ID cannot be empty", result.exceptionOrNull()?.message)
        verifyNoInteractions(repository)
    }

    // ========== markJobMessages Repository Error Cases ==========

    @Test
    fun `markJobMessages should propagate repository errors`() = runTest {
        // Given
        whenever(repository.markJobMessagesAsRead(any()))
            .thenReturn(Result.failure(Exception("Job not found")))

        // When
        val result = useCase.markJobMessages("job_456")

        // Then
        assertTrue(result.isFailure)
        assertEquals("Job not found", result.exceptionOrNull()?.message)
    }

    @Test
    fun `markJobMessages should handle permission errors`() = runTest {
        // Given
        whenever(repository.markJobMessagesAsRead(any()))
            .thenReturn(Result.failure(Exception("You don't have permission to mark these messages as read")))

        // When
        val result = useCase.markJobMessages("job_456")

        // Then
        assertTrue(result.isFailure)
        assertEquals("You don't have permission to mark these messages as read", result.exceptionOrNull()?.message)
    }

    // ========== Edge Cases ==========

    @Test
    fun `markMessage and markJobMessages should be independent`() = runTest {
        // Given
        whenever(repository.markMessageAsRead(any()))
            .thenReturn(Result.success(Unit))
        whenever(repository.markJobMessagesAsRead(any()))
            .thenReturn(Result.success(Unit))

        // When
        val messageResult = useCase.markMessage("msg_123")
        val jobResult = useCase.markJobMessages("job_456")

        // Then
        assertTrue(messageResult.isSuccess)
        assertTrue(jobResult.isSuccess)
        verify(repository).markMessageAsRead("msg_123")
        verify(repository).markJobMessagesAsRead("job_456")
    }
}
