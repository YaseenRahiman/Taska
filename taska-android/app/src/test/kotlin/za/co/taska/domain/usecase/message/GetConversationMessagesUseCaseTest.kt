package za.co.taska.domain.usecase.message

import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.mockito.kotlin.*
import za.co.taska.domain.model.Message
import za.co.taska.domain.model.MessageType
import za.co.taska.domain.repository.MessagesRepository

/**
 * Unit tests for GetConversationMessagesUseCase
 * Tests validation logic, Flow handling, and repository interaction
 *
 * Coverage target: >85%
 * Test count: ~12 tests
 */
class GetConversationMessagesUseCaseTest {

    private lateinit var useCase: GetConversationMessagesUseCase
    private lateinit var repository: MessagesRepository

    @Before
    fun setup() {
        repository = mock()
        useCase = GetConversationMessagesUseCase(repository)
    }

    // ========== Success Cases ==========

    @Test
    fun `invoke should return flow with messages when jobId provided`() = runTest {
        // Given
        val messages = listOf(createTestMessage())
        whenever(repository.getConversationMessages(eq("job_123"), eq(null), eq(null), eq(null)))
            .thenReturn(flow { emit(Result.success(messages)) })

        // When
        val result = useCase(jobId = "job_123").first()

        // Then
        assertTrue(result.isSuccess)
        assertEquals(1, result.getOrNull()?.size)
        verify(repository).getConversationMessages(
            jobId = "job_123",
            userId = null,
            limit = null,
            page = null
        )
    }

    @Test
    fun `invoke should return flow with messages when userId provided`() = runTest {
        // Given
        val messages = listOf(createTestMessage())
        whenever(repository.getConversationMessages(eq(null), eq("user_456"), eq(null), eq(null)))
            .thenReturn(flow { emit(Result.success(messages)) })

        // When
        val result = useCase(userId = "user_456").first()

        // Then
        assertTrue(result.isSuccess)
        verify(repository).getConversationMessages(
            jobId = null,
            userId = "user_456",
            limit = null,
            page = null
        )
    }

    @Test
    fun `invoke should handle pagination parameters`() = runTest {
        // Given
        val messages = listOf(createTestMessage())
        whenever(repository.getConversationMessages(eq("job_123"), eq(null), eq(20), eq(2)))
            .thenReturn(flow { emit(Result.success(messages)) })

        // When
        val result = useCase(
            jobId = "job_123",
            limit = 20,
            page = 2
        ).first()

        // Then
        assertTrue(result.isSuccess)
        verify(repository).getConversationMessages(
            jobId = "job_123",
            userId = null,
            limit = 20,
            page = 2
        )
    }

    @Test
    fun `invoke should handle both jobId and userId`() = runTest {
        // Given
        val messages = listOf(createTestMessage())
        whenever(repository.getConversationMessages(eq("job_123"), eq("user_456"), eq(null), eq(null)))
            .thenReturn(flow { emit(Result.success(messages)) })

        // When
        val result = useCase(
            jobId = "job_123",
            userId = "user_456"
        ).first()

        // Then
        assertTrue(result.isSuccess)
        verify(repository).getConversationMessages(
            jobId = "job_123",
            userId = "user_456",
            limit = null,
            page = null
        )
    }

    @Test
    fun `invoke should trim whitespace from IDs`() = runTest {
        // Given
        whenever(repository.getConversationMessages(eq("job_123"), eq("user_456"), eq(null), eq(null)))
            .thenReturn(flow { emit(Result.success(emptyList())) })

        // When
        useCase(
            jobId = "  job_123  ",
            userId = "  user_456  "
        ).first()

        // Then
        verify(repository).getConversationMessages(
            jobId = "job_123",
            userId = "user_456",
            limit = null,
            page = null
        )
    }

    @Test
    fun `invoke should handle empty messages list`() = runTest {
        // Given
        whenever(repository.getConversationMessages(eq("job_123"), eq(null), eq(null), eq(null)))
            .thenReturn(flow { emit(Result.success(emptyList())) })

        // When
        val result = useCase(jobId = "job_123").first()

        // Then
        assertTrue(result.isSuccess)
        assertEquals(0, result.getOrNull()?.size)
    }

    // ========== Validation Error Cases ==========

    @Test
    fun `invoke should fail when both jobId and userId are null`() = runTest {
        // When
        val result = useCase().first()

        // Then
        assertTrue(result.isFailure)
        assertTrue(result.exceptionOrNull() is IllegalArgumentException)
        assertEquals("At least one of jobId or userId must be provided", result.exceptionOrNull()?.message)
        verifyNoInteractions(repository)
    }

    @Test
    fun `invoke should fail when jobId is blank`() = runTest {
        // When
        val result = useCase(jobId = "   ", userId = "user_123").first()

        // Then
        assertTrue(result.isFailure)
        assertTrue(result.exceptionOrNull() is IllegalArgumentException)
        assertEquals("Job ID cannot be blank", result.exceptionOrNull()?.message)
        verifyNoInteractions(repository)
    }

    @Test
    fun `invoke should fail when userId is blank`() = runTest {
        // When
        val result = useCase(jobId = "job_123", userId = "   ").first()

        // Then
        assertTrue(result.isFailure)
        assertTrue(result.exceptionOrNull() is IllegalArgumentException)
        assertEquals("User ID cannot be blank", result.exceptionOrNull()?.message)
        verifyNoInteractions(repository)
    }

    @Test
    fun `invoke should fail when limit is less than 1`() = runTest {
        // When
        val result = useCase(jobId = "job_123", limit = 0).first()

        // Then
        assertTrue(result.isFailure)
        assertTrue(result.exceptionOrNull() is IllegalArgumentException)
        assertEquals("Limit must be at least 1", result.exceptionOrNull()?.message)
        verifyNoInteractions(repository)
    }

    @Test
    fun `invoke should fail when limit exceeds 100`() = runTest {
        // When
        val result = useCase(jobId = "job_123", limit = 101).first()

        // Then
        assertTrue(result.isFailure)
        assertTrue(result.exceptionOrNull() is IllegalArgumentException)
        assertEquals("Limit cannot exceed 100", result.exceptionOrNull()?.message)
        verifyNoInteractions(repository)
    }

    @Test
    fun `invoke should fail when page is less than 1`() = runTest {
        // When
        val result = useCase(jobId = "job_123", page = 0).first()

        // Then
        assertTrue(result.isFailure)
        assertTrue(result.exceptionOrNull() is IllegalArgumentException)
        assertEquals("Page must be at least 1", result.exceptionOrNull()?.message)
        verifyNoInteractions(repository)
    }

    // ========== Repository Error Cases ==========

    @Test
    fun `invoke should propagate repository errors`() = runTest {
        // Given
        whenever(repository.getConversationMessages(eq("job_123"), eq(null), eq(null), eq(null)))
            .thenReturn(flow { emit(Result.failure(Exception("Network error"))) })

        // When
        val result = useCase(jobId = "job_123").first()

        // Then
        assertTrue(result.isFailure)
        assertEquals("Network error", result.exceptionOrNull()?.message)
    }

    // ========== Edge Cases ==========

    @Test
    fun `invoke should handle minimum valid limit`() = runTest {
        // Given
        whenever(repository.getConversationMessages(eq("job_123"), eq(null), eq(1), eq(null)))
            .thenReturn(flow { emit(Result.success(emptyList())) })

        // When
        val result = useCase(jobId = "job_123", limit = 1).first()

        // Then
        assertTrue(result.isSuccess)
    }

    @Test
    fun `invoke should handle maximum valid limit`() = runTest {
        // Given
        whenever(repository.getConversationMessages(eq("job_123"), eq(null), eq(100), eq(null)))
            .thenReturn(flow { emit(Result.success(emptyList())) })

        // When
        val result = useCase(jobId = "job_123", limit = 100).first()

        // Then
        assertTrue(result.isSuccess)
    }

    // ========== Helper Methods ==========

    private fun createTestMessage() = Message(
        id = "msg_123",
        jobId = "job_456",
        senderId = "sender_789",
        receiverId = "user_123",
        content = "Test message",
        messageType = MessageType.TEXT,
        attachments = emptyList(),
        isRead = false,
        readAt = null,
        createdAt = "2024-01-01T00:00:00Z",
        sender = null
    )
}
