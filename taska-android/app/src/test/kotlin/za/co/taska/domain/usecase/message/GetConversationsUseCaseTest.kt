package za.co.taska.domain.usecase.message

import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.mockito.kotlin.*
import za.co.taska.domain.model.Conversation
import za.co.taska.domain.repository.MessagesRepository

/**
 * Unit tests for GetConversationsUseCase
 * Tests Flow handling and repository interaction
 *
 * Coverage target: >85%
 * Test count: ~8 tests
 */
class GetConversationsUseCaseTest {

    private lateinit var useCase: GetConversationsUseCase
    private lateinit var repository: MessagesRepository

    @Before
    fun setup() {
        repository = mock()
        useCase = GetConversationsUseCase(repository)
    }

    // ========== Success Cases ==========

    @Test
    fun `invoke should return flow with conversations`() = runTest {
        // Given
        val conversations = listOf(createTestConversation())
        whenever(repository.getConversations())
            .thenReturn(flow { emit(Result.success(conversations)) })

        // When
        val result = useCase().first()

        // Then
        assertTrue(result.isSuccess)
        assertEquals(1, result.getOrNull()?.size)
        verify(repository).getConversations()
    }

    @Test
    fun `invoke should handle empty conversations list`() = runTest {
        // Given
        whenever(repository.getConversations())
            .thenReturn(flow { emit(Result.success(emptyList())) })

        // When
        val result = useCase().first()

        // Then
        assertTrue(result.isSuccess)
        assertEquals(0, result.getOrNull()?.size)
    }

    @Test
    fun `invoke should handle multiple conversations`() = runTest {
        // Given
        val conversations = listOf(
            createTestConversation(jobId = "job_1"),
            createTestConversation(jobId = "job_2"),
            createTestConversation(jobId = "job_3")
        )
        whenever(repository.getConversations())
            .thenReturn(flow { emit(Result.success(conversations)) })

        // When
        val result = useCase().first()

        // Then
        assertTrue(result.isSuccess)
        assertEquals(3, result.getOrNull()?.size)
    }

    @Test
    fun `invoke should preserve conversation order from repository`() = runTest {
        // Given
        val conversations = listOf(
            createTestConversation(jobId = "job_1", lastMessage = "First"),
            createTestConversation(jobId = "job_2", lastMessage = "Second"),
            createTestConversation(jobId = "job_3", lastMessage = "Third")
        )
        whenever(repository.getConversations())
            .thenReturn(flow { emit(Result.success(conversations)) })

        // When
        val result = useCase().first()

        // Then
        assertTrue(result.isSuccess)
        val resultList = result.getOrNull()!!
        assertEquals("First", resultList[0].lastMessage)
        assertEquals("Second", resultList[1].lastMessage)
        assertEquals("Third", resultList[2].lastMessage)
    }

    @Test
    fun `invoke should handle conversations with unread messages`() = runTest {
        // Given
        val conversations = listOf(
            createTestConversation(unreadCount = 5),
            createTestConversation(unreadCount = 0),
            createTestConversation(unreadCount = 10)
        )
        whenever(repository.getConversations())
            .thenReturn(flow { emit(Result.success(conversations)) })

        // When
        val result = useCase().first()

        // Then
        assertTrue(result.isSuccess)
        val resultList = result.getOrNull()!!
        assertEquals(5, resultList[0].unreadCount)
        assertEquals(0, resultList[1].unreadCount)
        assertEquals(10, resultList[2].unreadCount)
    }

    // ========== Repository Error Cases ==========

    @Test
    fun `invoke should propagate repository errors`() = runTest {
        // Given
        whenever(repository.getConversations())
            .thenReturn(flow { emit(Result.failure(Exception("Network error"))) })

        // When
        val result = useCase().first()

        // Then
        assertTrue(result.isFailure)
        assertEquals("Network error", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should handle authentication errors`() = runTest {
        // Given
        whenever(repository.getConversations())
            .thenReturn(flow { emit(Result.failure(Exception("Please login to view your conversations"))) })

        // When
        val result = useCase().first()

        // Then
        assertTrue(result.isFailure)
        assertEquals("Please login to view your conversations", result.exceptionOrNull()?.message)
    }

    // ========== Edge Cases ==========

    @Test
    fun `invoke should handle conversation with null participant avatar`() = runTest {
        // Given
        val conversation = createTestConversation(participantAvatar = null)
        whenever(repository.getConversations())
            .thenReturn(flow { emit(Result.success(listOf(conversation))) })

        // When
        val result = useCase().first()

        // Then
        assertTrue(result.isSuccess)
        assertNull(result.getOrNull()?.first()?.participantAvatar)
    }

    // ========== Helper Methods ==========

    private fun createTestConversation(
        jobId: String = "job_123",
        lastMessage: String = "Last message",
        unreadCount: Int = 0,
        participantAvatar: String? = "https://example.com/avatar.jpg"
    ) = Conversation(
        jobId = jobId,
        jobTitle = "Test Job",
        participantId = "user_456",
        participantName = "John Doe",
        participantAvatar = participantAvatar,
        lastMessage = lastMessage,
        lastMessageAt = "2024-01-01T00:00:00Z",
        unreadCount = unreadCount,
        totalMessages = 10
    )
}
