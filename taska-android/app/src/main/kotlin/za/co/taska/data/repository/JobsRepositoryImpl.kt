package za.co.taska.data.repository

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.map
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import za.co.taska.data.local.dao.JobDao
import za.co.taska.data.mapper.toDomain
import za.co.taska.data.mapper.toEntity
import za.co.taska.data.remote.api.JobsApiService
import za.co.taska.data.remote.dto.request.AddressDto
import za.co.taska.data.remote.dto.request.CreateJobRequest
import za.co.taska.data.remote.dto.request.UpdateJobRequest
import za.co.taska.domain.model.Address
import za.co.taska.domain.model.BudgetType
import za.co.taska.domain.model.Job
import za.co.taska.domain.model.Resource
import za.co.taska.domain.model.UrgencyLevel
import za.co.taska.domain.repository.JobsRepository
import java.io.File
import javax.inject.Inject

/**
 * Jobs Repository Implementation
 * Offline-first architecture: Cache → Network → Update Cache
 */
class JobsRepositoryImpl @Inject constructor(
    private val jobsApiService: JobsApiService,
    private val jobDao: JobDao
) : JobsRepository {

    override fun getJobs(
        latitude: Double?,
        longitude: Double?,
        radius: Int,
        categoryId: String?,
        minBudget: Double?,
        maxBudget: Double?
    ): Flow<Resource<List<Job>>> = flow {
        // Emit cached data first
        emit(Resource.loading())

        val cachedJobs = jobDao.getJobs().map { entities ->
            entities.map { it.toDomain() }
        }

        cachedJobs.collect { jobs ->
            emit(Resource.success(jobs, isCached = true))
        }

        // Fetch from network
        try {
            val response = jobsApiService.getJobs(
                latitude = latitude,
                longitude = longitude,
                radius = radius,
                categoryId = categoryId,
                minBudget = minBudget,
                maxBudget = maxBudget
            )

            if (response.isSuccessful && response.body() != null) {
                val jobsResponse = response.body()!!
                val jobs = jobsResponse.jobs.map { it.toDomain() }

                // Update cache
                jobDao.insertJobs(jobs.map { it.toEntity() })

                emit(Resource.success(jobs, isCached = false))
            }
        } catch (e: Exception) {
            // If network fails, we already emitted cached data
            // Just log the error
        }
    }

    override fun getNearbyJobs(
        latitude: Double,
        longitude: Double,
        radius: Int
    ): Flow<Resource<List<Job>>> = flow {
        emit(Resource.loading())

        try {
            val response = jobsApiService.getNearbyJobs(
                latitude = latitude,
                longitude = longitude,
                radius = radius
            )

            if (response.isSuccessful && response.body() != null) {
                val jobs = response.body()!!.map { it.toDomain() }

                // Cache nearby jobs
                jobDao.insertJobs(jobs.map { it.toEntity() })

                emit(Resource.success(jobs))
            } else {
                emit(Resource.error(response.message() ?: "Failed to fetch nearby jobs"))
            }
        } catch (e: Exception) {
            // Fall back to cached data
            val cachedJobs = jobDao.getJobs().map { entities ->
                entities.map { it.toDomain() }
            }

            cachedJobs.collect { jobs ->
                emit(Resource.error(e.message ?: "Network error", e))
            }
        }
    }

    override suspend fun getJobById(jobId: String): Resource<Job> {
        return try {
            // Try network first
            val response = jobsApiService.getJobById(jobId)

            if (response.isSuccessful && response.body() != null) {
                val job = response.body()!!.toDomain()

                // Cache the job
                jobDao.insertJob(job.toEntity())

                Resource.success(job)
            } else {
                // Fallback to cache
                val cachedJob = jobDao.getJobById(jobId)
                if (cachedJob != null) {
                    Resource.success(cachedJob.toDomain(), isCached = true)
                } else {
                    Resource.error(response.message() ?: "Job not found")
                }
            }
        } catch (e: Exception) {
            // Network error - try cache
            val cachedJob = jobDao.getJobById(jobId)
            if (cachedJob != null) {
                Resource.success(cachedJob.toDomain(), isCached = true)
            } else {
                Resource.error(e.message ?: "Error fetching job", e)
            }
        }
    }

    override suspend fun searchJobs(
        query: String,
        categoryId: String?,
        city: String?
    ): Resource<List<Job>> {
        return try {
            val response = jobsApiService.searchJobs(
                query = query,
                categoryId = categoryId,
                city = city
            )

            if (response.isSuccessful && response.body() != null) {
                val jobs = response.body()!!.map { it.toDomain() }
                Resource.success(jobs)
            } else {
                Resource.error(response.message() ?: "Search failed")
            }
        } catch (e: Exception) {
            Resource.error(e.message ?: "Search error", e)
        }
    }

    override suspend fun refreshJobs() {
        try {
            val response = jobsApiService.getJobs()

            if (response.isSuccessful && response.body() != null) {
                val jobs = response.body()!!.jobs.map { it.toDomain() }
                jobDao.clearAll()
                jobDao.insertJobs(jobs.map { it.toEntity() })
            }
        } catch (e: Exception) {
            // Ignore errors on refresh
        }
    }

    // ========== Write Operations (Client-focused) ==========

    override suspend fun createJob(
        categoryId: String,
        title: String,
        description: String,
        budget: Double,
        budgetType: BudgetType,
        urgency: UrgencyLevel,
        address: Address,
        images: List<String>,
        requirements: List<String>,
        startDate: String?,
        endDate: String?
    ): Result<Job> {
        return try {
            val request = CreateJobRequest(
                categoryId = categoryId,
                title = title,
                description = description,
                budget = budget,
                budgetType = budgetType.name,
                urgency = urgency.name,
                address = AddressDto(
                    addressLine1 = address.addressLine1,
                    addressLine2 = address.addressLine2,
                    city = address.city,
                    province = address.province,
                    postalCode = address.postalCode,
                    latitude = address.latitude,
                    longitude = address.longitude
                ),
                images = images,
                requirements = requirements,
                startDate = startDate,
                endDate = endDate
            )

            val response = jobsApiService.createJob(request)

            if (response.isSuccessful && response.body() != null) {
                val job = response.body()!!.toDomain()

                // Cache the created job
                jobDao.insertJob(job.toEntity())

                Result.success(job)
            } else {
                Result.failure(Exception("Failed to create job: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun updateJob(
        jobId: String,
        title: String?,
        description: String?,
        budget: Double?,
        budgetType: BudgetType?,
        urgency: UrgencyLevel?,
        address: Address?,
        images: List<String>?,
        requirements: List<String>?,
        startDate: String?,
        endDate: String?
    ): Result<Job> {
        return try {
            val request = UpdateJobRequest(
                title = title,
                description = description,
                budget = budget,
                budgetType = budgetType?.name,
                urgency = urgency?.name,
                address = address?.let {
                    AddressDto(
                        addressLine1 = it.addressLine1,
                        addressLine2 = it.addressLine2,
                        city = it.city,
                        province = it.province,
                        postalCode = it.postalCode,
                        latitude = it.latitude,
                        longitude = it.longitude
                    )
                },
                images = images,
                requirements = requirements,
                startDate = startDate,
                endDate = endDate
            )

            val response = jobsApiService.updateJob(jobId, request)

            if (response.isSuccessful && response.body() != null) {
                val job = response.body()!!.toDomain()

                // Update cache
                jobDao.updateJob(job.toEntity())

                Result.success(job)
            } else {
                Result.failure(Exception("Failed to update job: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun deleteJob(jobId: String): Result<Unit> {
        return try {
            val response = jobsApiService.deleteJob(jobId)

            if (response.isSuccessful) {
                // Remove from cache
                val cachedJob = jobDao.getJobById(jobId)
                if (cachedJob != null) {
                    jobDao.deleteJob(cachedJob)
                }

                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to delete job: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun cancelJob(jobId: String): Result<Job> {
        return try {
            val response = jobsApiService.cancelJob(jobId)

            if (response.isSuccessful && response.body() != null) {
                val job = response.body()!!.toDomain()

                // Update cache with cancelled status
                jobDao.updateJob(job.toEntity())

                Result.success(job)
            } else {
                Result.failure(Exception("Failed to cancel job: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun completeJob(jobId: String): Result<Job> {
        return try {
            val response = jobsApiService.completeJob(jobId)

            if (response.isSuccessful && response.body() != null) {
                val job = response.body()!!.toDomain()

                // Update cache with completed status
                jobDao.updateJob(job.toEntity())

                Result.success(job)
            } else {
                Result.failure(Exception("Failed to complete job: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun uploadJobImage(imageFile: File): Result<String> {
        return try {
            val requestBody = imageFile.asRequestBody("image/*".toMediaTypeOrNull())
            val multipartBody = MultipartBody.Part.createFormData(
                "image",
                imageFile.name,
                requestBody
            )

            val response = jobsApiService.uploadJobImage(multipartBody)

            if (response.isSuccessful && response.body() != null) {
                val imageUrl = response.body()!!.url
                Result.success(imageUrl)
            } else {
                Result.failure(Exception("Failed to upload image: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun uploadJobImages(imageFiles: List<File>): Result<List<String>> {
        return try {
            val parts = imageFiles.map { file ->
                val requestBody = file.asRequestBody("image/*".toMediaTypeOrNull())
                MultipartBody.Part.createFormData(
                    "images",
                    file.name,
                    requestBody
                )
            }

            val response = jobsApiService.uploadJobImages(parts)

            if (response.isSuccessful && response.body() != null) {
                val imageUrls = response.body()!!.urls
                Result.success(imageUrls)
            } else {
                Result.failure(Exception("Failed to upload images: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override fun getMyJobs(status: String?): Flow<Resource<List<Job>>> = flow {
        emit(Resource.loading())

        try {
            val response = jobsApiService.getMyJobs(status = status)

            if (response.isSuccessful && response.body() != null) {
                val jobs = response.body()!!.jobs.map { it.toDomain() }

                // Cache user's jobs
                jobDao.insertJobs(jobs.map { it.toEntity() })

                emit(Resource.success(jobs))
            } else {
                emit(Resource.error(response.message() ?: "Failed to fetch my jobs"))
            }
        } catch (e: Exception) {
            emit(Resource.error(e.message ?: "Error fetching my jobs", e))
        }
    }
}
