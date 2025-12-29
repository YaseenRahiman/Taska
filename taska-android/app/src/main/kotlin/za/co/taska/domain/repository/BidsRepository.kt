package za.co.taska.domain.repository

import kotlinx.coroutines.flow.Flow
import za.co.taska.domain.model.Bid

/**
 * Bids Repository Interface
 * Defines contract for bid data operations
 */
interface BidsRepository {

    /**
     * Create a new bid for a job
     */
    suspend fun createBid(
        jobId: String,
        amount: Double,
        message: String,
        estimatedDays: Int,
        attachments: List<String>? = null
    ): Result<Bid>

    /**
     * Update an existing bid
     */
    suspend fun updateBid(
        bidId: String,
        amount: Double? = null,
        message: String? = null,
        estimatedDays: Int? = null
    ): Result<Bid>

    /**
     * Withdraw a bid
     */
    suspend fun withdrawBid(bidId: String): Result<Unit>

    /**
     * Accept a bid (Client action)
     */
    suspend fun acceptBid(bidId: String): Result<Unit>

    /**
     * Reject a bid (Client action)
     */
    suspend fun rejectBid(bidId: String): Result<Unit>

    /**
     * Get a specific bid by ID
     */
    suspend fun getBidById(bidId: String): Result<Bid>

    /**
     * Get all bids created by the current user (artisan)
     */
    fun getMyBids(): Flow<Result<List<Bid>>>

    /**
     * Get all bids for a specific job
     */
    fun getJobBids(jobId: String): Flow<Result<List<Bid>>>
}
