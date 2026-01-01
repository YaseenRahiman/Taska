package za.co.taska.data.remote.api

import okhttp3.MultipartBody
import retrofit2.Response
import retrofit2.http.*
import za.co.taska.data.remote.dto.request.CreateJobRequest
import za.co.taska.data.remote.dto.request.UpdateJobRequest
import za.co.taska.data.remote.dto.response.ImageUploadResponse
import za.co.taska.data.remote.dto.response.JobResponse
import za.co.taska.data.remote.dto.response.MultipleImagesUploadResponse
import za.co.taska.data.remote.dto.response.PaginatedJobsResponse

/**
 * Jobs API Service
 * Retrofit interface for jobs endpoints
 */
interface JobsApiService {

    // ========== Read Operations (Artisan-focused) ==========

    @GET("jobs")
    suspend fun getJobs(
        @Query("latitude") latitude: Double? = null,
        @Query("longitude") longitude: Double? = null,
        @Query("radius") radius: Int = 25,
        @Query("categoryId") categoryId: String? = null,
        @Query("status") status: String? = null,
        @Query("minBudget") minBudget: Double? = null,
        @Query("maxBudget") maxBudget: Double? = null,
        @Query("urgency") urgency: String? = null,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): Response<PaginatedJobsResponse>

    @GET("jobs/nearby")
    suspend fun getNearbyJobs(
        @Query("latitude") latitude: Double,
        @Query("longitude") longitude: Double,
        @Query("radius") radius: Int = 25,
        @Query("limit") limit: Int = 50
    ): Response<List<JobResponse>>

    @GET("jobs/{id}")
    suspend fun getJobById(@Path("id") jobId: String): Response<JobResponse>

    @GET("jobs/search")
    suspend fun searchJobs(
        @Query("q") query: String,
        @Query("categoryId") categoryId: String? = null,
        @Query("city") city: String? = null,
        @Query("province") province: String? = null,
        @Query("minBudget") minBudget: Double? = null,
        @Query("maxBudget") maxBudget: Double? = null
    ): Response<List<JobResponse>>

    @GET("jobs/statistics")
    suspend fun getJobStatistics(): Response<Any>

    // ========== Write Operations (Client-focused) ==========

    @POST("jobs")
    suspend fun createJob(@Body request: CreateJobRequest): Response<JobResponse>

    @PATCH("jobs/{id}")
    suspend fun updateJob(
        @Path("id") jobId: String,
        @Body request: UpdateJobRequest
    ): Response<JobResponse>

    @DELETE("jobs/{id}")
    suspend fun deleteJob(@Path("id") jobId: String): Response<Unit>

    @PUT("jobs/{id}/cancel")
    suspend fun cancelJob(@Path("id") jobId: String): Response<JobResponse>

    @PUT("jobs/{id}/complete")
    suspend fun completeJob(@Path("id") jobId: String): Response<JobResponse>

    @Multipart
    @POST("jobs/upload-image")
    suspend fun uploadJobImage(
        @Part image: MultipartBody.Part
    ): Response<ImageUploadResponse>

    @Multipart
    @POST("jobs/upload-images")
    suspend fun uploadJobImages(
        @Part images: List<MultipartBody.Part>
    ): Response<MultipleImagesUploadResponse>

    @GET("jobs/my-jobs")
    suspend fun getMyJobs(
        @Query("status") status: String? = null,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): Response<PaginatedJobsResponse>
}
