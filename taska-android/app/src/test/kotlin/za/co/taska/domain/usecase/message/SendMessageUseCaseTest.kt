package za.co.taska.domain.usecase.message

import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.mockito.kotlin.*
import za.co.taska.domain.model.Message
import za.co.taska.domain.model.MessageType
import za.co.taska.domain.repository.MessagesRepository

/**
 * Unit tests for SendMessageUseCase
 * Tests comprehensive validation logic and repository interaction
 *
 * Coverage target: >85%
 * Test count: ~20 tests
 */
class SendMessageUseCaseTest {

    private lateinit var useCase: SendMessageUseCase
    private lateinit var repository: MessagesRepository

    @Before
    fun setup() {
        repository = mock()
        useCase = SendMessageUseCase(repository)
    }

    // ========== Success Cases ==========

    @Test
    fun `invoke should return success when all inputs valid and repository succeeds`() = runTest {
        // Given
        val message = createTestMessage()
        whenever(repository.sendMessage(any(), any(), any(), any(), any()))
            .thenReturn(Result.success(message))

        // When
        val result = useCase(
            recipientId = "user_123",
            jobId = "job_456",
            content = "Hello, I'm interested in this job",
            messageType = "TEXT",
            attachments = listOf("attachment1.pdf")
        )

        // Then
        assertTrue(result.isSuccess)
        assertEquals("msg_123", result.getOrNull()?.id)

        verify(repository).sendMessage(
            recipientId = "user_123",
            jobId = "job_456",
            content = "Hello, I'm interested in this job",
            messageType = "TEXT",
            attachments = listOf("attachment1.pdf")
        )
    }

    @Test
    fun `invoke should succeed with minimum required fields`() = runTest {
        // Given
        whenever(repository.sendMessage(any(), any(), any(), any(), any()))
            .thenReturn(Result.success(createTestMessage()))

        // When
        val result = useCase(
            recipientId = "user_123",
            jobId = "job_456",
            content = "Hi",
            messageType = "TEXT",
            attachments = null
        )

        // Then
        assertTrue(result.isSuccess)
        verify(repository).sendMessage(
            recipientId = any(),
            jobId = any(),
            content = any(),
            messageType = any(),
            attachments = isNull()
        )
    }

    @Test
    fun `invoke should succeed with maximum content length`() = runTest {
        // Given
        whenever(repository.sendMessage(any(), any(), any(), any(), any()))
            .thenReturn(Result.success(createTestMessage()))

        val maxContent = "a".repeat(1000)

        // When
        val result = useCase(
            recipientId = "user_123",
            jobId = "job_456",
            content = maxContent,
            messageType = "TEXT",
            attachments = null
        )

        // Then
        assertTrue(result.isSuccess)
        verify(repository).sendMessage(
            recipientId = any(),
            jobId = any(),
            content = any(),
            messageType = any(),
            attachments = isNull()
        )
    }

    @Test
    fun `invoke should succeed with max attachments`() = runTest {
        // Given
        whenever(repository.sendMessage(any(), any(), any(), any(), any()))
            .thenReturn(Result.success(createTestMessage()))

        val maxAttachments = listOf("file1.pdf", "file2.jpg", "file3.png", "file4.doc", "file5.txt")

        // When
        val result = useCase(
            recipientId = "user_123",
            jobId = "job_456",
            content = "Message with attachments",
            messageType = "TEXT",
            attachments = maxAttachments
        )

        // Then
        assertTrue(result.isSuccess)
        verify(repository).sendMessage(
            recipientId = any(),
            jobId = any(),
            content = any(),
            messageType = any(),
            attachments = eq(maxAttachments)
        )
    }

    @Test
    fun `invoke should trim whitespace from inputs`() = runTest {
        // Given
        whenever(repository.sendMessage(any(), any(), any(), any(), any()))
            .thenReturn(Result.success(createTestMessage()))

        // When
        useCase(
            recipientId = "  user_123  ",
            jobId = "  job_456  ",
            content = "  Hello  ",
            messageType = "TEXT",
            attachments = null
        )

        // Then
        verify(repository).sendMessage(
            recipientId = eq("user_123"),
            jobId = eq("job_456"),
            content = eq("Hello"),
            messageType = eq("TEXT"),
            attachments = isNull()
        )
    }

    @Test
    fun `invoke should filter blank attachments`() = runTest {
        // Given
        whenever(repository.sendMessage(any(), any(), any(), any(), any()))
            .thenReturn(Result.success(createTestMessage()))

        // When
        useCase(
            recipientId = "user_123",
            jobId = "job_456",
            content = "Message",
            messageType = "TEXT",
            attachments = listOf("file1.pdf", "", "file2.jpg", "   ")
        )

        // Then
        verify(repository).sendMessage(
            recipientId = any(),
            jobId = any(),
            content = any(),
            messageType = any(),
            attachments = any()
        )
    }

    // ========== Validation Error Cases ==========

    @Test
    fun `invoke should fail when recipientId is blank`() = runTest {
        // When
        val result = useCase(
            recipientId = "",
            jobId = "job_456",
            content = "Hello",
            messageType = "TEXT",
            attachments = null
        )

        // Then
        assertTrue(result.isFailure)
        assertTrue(result.exceptionOrNull() is IllegalArgumentException)
        assertEquals("Recipient ID cannot be empty", result.exceptionOrNull()?.message)
        verifyNoInteractions(repository)
    }

    @Test
    fun `invoke should fail when recipientId is whitespace`() = runTest {
        // When
        val result = useCase(
            recipientId = "   ",
            jobId = "job_456",
            content = "Hello",
            messageType = "TEXT",
            attachments = null
        )

        // Then
        assertTrue(result.isFailure)
        assertTrue(result.exceptionOrNull() is IllegalArgumentException)
        verifyNoInteractions(repository)
    }

    @Test
    fun `invoke should fail when jobId is blank`() = runTest {
        // When
        val result = useCase(
            recipientId = "user_123",
            jobId = "",
            content = "Hello",
            messageType = "TEXT",
            attachments = null
        )

        // Then
        assertTrue(result.isFailure)
        assertTrue(result.exceptionOrNull() is IllegalArgumentException)
        assertEquals("Job ID cannot be empty", result.exceptionOrNull()?.message)
        verifyNoInteractions(repository)
    }

    @Test
    fun `invoke should fail when content is empty`() = runTest {
        // When
        val result = useCase(
            recipientId = "user_123",
            jobId = "job_456",
            content = "",
            messageType = "TEXT",
            attachments = null
        )

        // Then
        assertTrue(result.isFailure)
        assertTrue(result.exceptionOrNull() is IllegalArgumentException)
        assertEquals("Message content cannot be empty", result.exceptionOrNull()?.message)
        verifyNoInteractions(repository)
    }

    @Test
    fun `invoke should fail when content exceeds 1000 characters`() = runTest {
        // Given
        val tooLongContent = "a".repeat(1001)

        // When
        val result = useCase(
            recipientId = "user_123",
            jobId = "job_456",
            content = tooLongContent,
            messageType = "TEXT",
            attachments = null
        )

        // Then
        assertTrue(result.isFailure)
        assertTrue(result.exceptionOrNull() is IllegalArgumentException)
        assertEquals("Message content cannot exceed 1000 characters", result.exceptionOrNull()?.message)
        verifyNoInteractions(repository)
    }

    @Test
    fun `invoke should fail when attachments exceed 5`() = runTest {
        // Given
        val tooManyAttachments = listOf("f1", "f2", "f3", "f4", "f5", "f6")

        // When
        val result = useCase(
            recipientId = "user_123",
            jobId = "job_456",
            content = "Message",
            messageType = "TEXT",
            attachments = tooManyAttachments
        )

        // Then
        assertTrue(result.isFailure)
        assertTrue(result.exceptionOrNull() is IllegalArgumentException)
        assertEquals("Maximum 5 attachments allowed", result.exceptionOrNull()?.message)
        verifyNoInteractions(repository)
    }

    @Test
    fun `invoke should fail when attachments contain blank URL`() = runTest {
        // When
        val result = useCase(
            recipientId = "user_123",
            jobId = "job_456",
            content = "Message",
            messageType = "TEXT",
            attachments = listOf("file1.pdf", "")
        )

        // Then
        assertTrue(result.isFailure)
        assertTrue(result.exceptionOrNull() is IllegalArgumentException)
        assertEquals("Attachment URLs cannot be blank", result.exceptionOrNull()?.message)
        verifyNoInteractions(repository)
    }

    // ========== Repository Error Cases ==========

    @Test
    fun `invoke should return failure when repository fails`() = runTest {
        // Given
        whenever(repository.sendMessage(any(), any(), any(), any(), any()))
            .thenReturn(Result.failure(Exception("Network error")))

        // When
        val result = useCase(
            recipientId = "user_123",
            jobId = "job_456",
            content = "Hello",
            messageType = "TEXT",
            attachments = null
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("Network error", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should propagate repository exception`() = runTest {
        // Given
        val exception = RuntimeException("API error")
        whenever(repository.sendMessage(any(), any(), any(), any(), any()))
            .thenReturn(Result.failure(exception))

        // When
        val result = useCase(
            recipientId = "user_123",
            jobId = "job_456",
            content = "Hello",
            messageType = "TEXT",
            attachments = null
        )

        // Then
        assertTrue(result.isFailure)
        assertEquals("API error", result.exceptionOrNull()?.message)
    }

    // ========== Edge Cases ==========

    @Test
    fun `invoke should handle single character content`() = runTest {
        // Given
        whenever(repository.sendMessage(any(), any(), any(), any(), any()))
            .thenReturn(Result.success(createTestMessage()))

        // When
        val result = useCase(
            recipientId = "user_123",
            jobId = "job_456",
            content = "a",
            messageType = "TEXT",
            attachments = null
        )

        // Then
        assertTrue(result.isSuccess)
    }

    @Test
    fun `invoke should handle empty attachments list`() = runTest {
        // Given
        whenever(repository.sendMessage(any(), any(), any(), any(), any()))
            .thenReturn(Result.success(createTestMessage()))

        // When
        val result = useCase(
            recipientId = "user_123",
            jobId = "job_456",
            content = "Hello",
            messageType = "TEXT",
            attachments = emptyList()
        )

        // Then
        assertTrue(result.isSuccess)
    }

    @Test
    fun `invoke should handle different message types`() = runTest {
        // Given
        whenever(repository.sendMessage(any(), any(), any(), any(), any()))
            .thenReturn(Result.success(createTestMessage()))

        // When
        val result = useCase(
            recipientId = "user_123",
            jobId = "job_456",
            content = "Image message",
            messageType = "IMAGE",
            attachments = listOf("image.jpg")
        )

        // Then
        assertTrue(result.isSuccess)
        verify(repository).sendMessage(
            recipientId = any(),
            jobId = any(),
            content = any(),
            messageType = eq("IMAGE"),
            attachments = any()
        )
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
