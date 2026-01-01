package za.co.taska.domain.usecase.bid

import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.mockito.kotlin.*
import za.co.taska.domain.repository.BidsRepository

/**
 * Unit tests for WithdrawBidUseCase
 * Tests validation logic and repository interaction
 *
 * Coverage target: >85%
 * Test count: 6 tests
 */
class WithdrawBidUseCaseTest {

    private lateinit var useCase: WithdrawBidUseCase
    private lateinit var repository: BidsRepository

    @Before
    fun setup() {
        repository = mock()
        useCase = WithdrawBidUseCase(repository)
    }

    // ========== Success Cases ==========

    @Test
    fun `invoke should return success when bidId is valid and repository succeeds`() = runTest {
        // Given
        whenever(repository.withdrawBid(any())).thenReturn(Result.success(Unit))

        // When
        val result = useCase(bidId = "bid_123")

        // Then
        assertTrue(result.isSuccess)
        verify(repository).withdrawBid("bid_123")
    }

    @Test
    fun `invoke should trim whitespace from bidId`() = runTest {
        // Given
        whenever(repository.withdrawBid(any())).thenReturn(Result.success(Unit))

        // When
        val result = useCase(bidId = "  bid_123  ")

        // Then
        assertTrue(result.isSuccess)
        verify(repository).withdrawBid("bid_123")
    }

    // ========== Validation Failures ==========

    @Test
    fun `invoke should fail when bidId is blank`() = runTest {
        // When
        val result = useCase(bidId = "")

        // Then
        assertTrue(result.isFailure)
        assertTrue(result.exceptionOrNull() is IllegalArgumentException)
        assertEquals("Bid ID cannot be empty", result.exceptionOrNull()?.message)
        verify(repository, never()).withdrawBid(any())
    }

    @Test
    fun `invoke should fail when bidId is whitespace`() = runTest {
        // When
        val result = useCase(bidId = "   ")

        // Then
        assertTrue(result.isFailure)
        assertEquals("Bid ID cannot be empty", result.exceptionOrNull()?.message)
        verify(repository, never()).withdrawBid(any())
    }

    // ========== Repository Error Handling ==========

    @Test
    fun `invoke should propagate repository errors`() = runTest {
        // Given
        whenever(repository.withdrawBid(any()))
            .thenReturn(Result.failure(Exception("Network error")))

        // When
        val result = useCase(bidId = "bid_123")

        // Then
        assertTrue(result.isFailure)
        assertEquals("Network error", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should handle repository permission errors`() = runTest {
        // Given
        whenever(repository.withdrawBid(any()))
            .thenReturn(Result.failure(Exception("You can only withdraw your own pending bids")))

        // When
        val result = useCase(bidId = "bid_123")

        // Then
        assertTrue(result.isFailure)
        assertEquals("You can only withdraw your own pending bids", result.exceptionOrNull()?.message)
    }
}
