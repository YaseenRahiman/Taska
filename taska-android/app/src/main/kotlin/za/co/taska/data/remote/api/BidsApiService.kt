package za.co.taska.data.remote.api

import retrofit2.Response
import retrofit2.http.*
import za.co.taska.data.remote.dto.request.CreateBidRequest
import za.co.taska.data.remote.dto.request.UpdateBidRequest
import za.co.taska.data.remote.dto.response.BidResponse
import za.co.taska.data.remote.dto.response.MessageResponse

/**
 * Bids API Service
 * Retrofit interface for bids endpoints
 */
interface BidsApiService {

    @POST("bids")
    suspend fun createBid(@Body request: CreateBidRequest): Response<BidResponse>

    @GET("bids/my-bids")
    suspend fun getMyBids(): Response<List<BidResponse>>

    @GET("bids/{id}")
    suspend fun getBidById(@Path("id") bidId: String): Response<BidResponse>

    @PATCH("bids/{id}")
    suspend fun updateBid(
        @Path("id") bidId: String,
        @Body request: UpdateBidRequest
    ): Response<BidResponse>

    @POST("bids/{id}/withdraw")
    suspend fun withdrawBid(@Path("id") bidId: String): Response<MessageResponse>

    @GET("bids/statistics")
    suspend fun getBidStatistics(): Response<Any>

    @GET("bids/job/{jobId}")
    suspend fun getJobBids(@Path("jobId") jobId: String): Response<List<BidResponse>>

    @GET("bids/job/{jobId}/analytics")
    suspend fun getJobBidAnalytics(@Path("jobId") jobId: String): Response<Any>

    @POST("bids/{id}/accept")
    suspend fun acceptBid(@Path("id") bidId: String): Response<MessageResponse>

    @POST("bids/{id}/reject")
    suspend fun rejectBid(@Path("id") bidId: String): Response<MessageResponse>

    @GET("bids")
    suspend fun getAllBids(): Response<List<BidResponse>>
}
