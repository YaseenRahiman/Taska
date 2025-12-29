package za.co.taska.data.repository

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import za.co.taska.data.mapper.toDomain
import za.co.taska.data.remote.api.BidsApiService
import za.co.taska.data.remote.dto.request.CreateBidRequest
import za.co.taska.data.remote.dto.request.UpdateBidRequest
import za.co.taska.domain.model.Bid
import za.co.taska.domain.repository.BidsRepository
import javax.inject.Inject

/**
 * Bids Repository Implementation
 * Handles bid data operations with comprehensive error handling
 */
class BidsRepositoryImpl @Inject constructor(
    private val bidsApiService: BidsApiService
) : BidsRepository {

    override suspend fun createBid(
        jobId: String,
        amount: Double,
        message: String,
        estimatedDays: Int,
        attachments: List<String>?
    ): Result<Bid> {
        return try {
            val request = CreateBidRequest(
                jobId = jobId,
                amount = amount,
                message = message,
                estimatedDays = estimatedDays,
                attachments = attachments ?: emptyList()
            )

            val response = bidsApiService.createBid(request)

            if (response.isSuccessful && response.body() != null) {
                val bid = response.body()!!.toDomain()
                Result.success(bid)
            } else {
                val errorMessage = when (response.code()) {
                    400 -> "Invalid bid details provided"
                    403 -> "You don't have permission to bid on this job"
                    404 -> "Job not found"
                    409 -> "You have already bid on this job"
                    else -> "Failed to create bid: ${response.message()}"
                }
                Result.failure(Exception(errorMessage))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Network error: ${e.message}", e))
        }
    }

    override suspend fun updateBid(
        bidId: String,
        amount: Double?,
        message: String?,
        estimatedDays: Int?
    ): Result<Bid> {
        return try {
            val request = UpdateBidRequest(
                amount = amount,
                message = message,
                estimatedDays = estimatedDays
            )

            val response = bidsApiService.updateBid(bidId, request)

            if (response.isSuccessful && response.body() != null) {
                val bid = response.body()!!.toDomain()
                Result.success(bid)
            } else {
                val errorMessage = when (response.code()) {
                    400 -> "Invalid bid update details"
                    403 -> "You can only update your own pending bids"
                    404 -> "Bid not found"
                    else -> "Failed to update bid: ${response.message()}"
                }
                Result.failure(Exception(errorMessage))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Network error: ${e.message}", e))
        }
    }

    override suspend fun withdrawBid(bidId: String): Result<Unit> {
        return try {
            val response = bidsApiService.withdrawBid(bidId)

            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                val errorMessage = when (response.code()) {
                    403 -> "You can only withdraw your own pending bids"
                    404 -> "Bid not found"
                    else -> "Failed to withdraw bid: ${response.message()}"
                }
                Result.failure(Exception(errorMessage))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Network error: ${e.message}", e))
        }
    }

    override suspend fun acceptBid(bidId: String): Result<Unit> {
        return try {
            val response = bidsApiService.acceptBid(bidId)

            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                val errorMessage = when (response.code()) {
                    400 -> "Cannot accept this bid"
                    403 -> "You don't have permission to accept this bid"
                    404 -> "Bid not found"
                    else -> "Failed to accept bid: ${response.message()}"
                }
                Result.failure(Exception(errorMessage))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Network error: ${e.message}", e))
        }
    }

    override suspend fun rejectBid(bidId: String): Result<Unit> {
        return try {
            val response = bidsApiService.rejectBid(bidId)

            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                val errorMessage = when (response.code()) {
                    400 -> "Cannot reject this bid"
                    403 -> "You don't have permission to reject this bid"
                    404 -> "Bid not found"
                    else -> "Failed to reject bid: ${response.message()}"
                }
                Result.failure(Exception(errorMessage))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Network error: ${e.message}", e))
        }
    }

    override suspend fun getBidById(bidId: String): Result<Bid> {
        return try {
            val response = bidsApiService.getBidById(bidId)

            if (response.isSuccessful && response.body() != null) {
                val bid = response.body()!!.toDomain()
                Result.success(bid)
            } else {
                val errorMessage = when (response.code()) {
                    403 -> "You don't have permission to view this bid"
                    404 -> "Bid not found"
                    else -> "Failed to fetch bid: ${response.message()}"
                }
                Result.failure(Exception(errorMessage))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Network error: ${e.message}", e))
        }
    }

    override fun getMyBids(): Flow<Result<List<Bid>>> = flow {
        try {
            val response = bidsApiService.getMyBids()

            if (response.isSuccessful && response.body() != null) {
                val bids = response.body()!!.map { it.toDomain() }
                emit(Result.success(bids))
            } else {
                val errorMessage = when (response.code()) {
                    401 -> "Please login to view your bids"
                    else -> "Failed to fetch your bids: ${response.message()}"
                }
                emit(Result.failure(Exception(errorMessage)))
            }
        } catch (e: Exception) {
            emit(Result.failure(Exception("Network error: ${e.message}", e)))
        }
    }

    override fun getJobBids(jobId: String): Flow<Result<List<Bid>>> = flow {
        try {
            val response = bidsApiService.getJobBids(jobId)

            if (response.isSuccessful && response.body() != null) {
                val bids = response.body()!!.map { it.toDomain() }
                emit(Result.success(bids))
            } else {
                val errorMessage = when (response.code()) {
                    403 -> "You don't have permission to view bids for this job"
                    404 -> "Job not found"
                    else -> "Failed to fetch job bids: ${response.message()}"
                }
                emit(Result.failure(Exception(errorMessage)))
            }
        } catch (e: Exception) {
            emit(Result.failure(Exception("Network error: ${e.message}", e)))
        }
    }
}
