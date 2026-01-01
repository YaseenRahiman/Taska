package za.co.taska.domain.repository

import kotlinx.coroutines.flow.Flow
import za.co.taska.domain.model.Address
import za.co.taska.domain.model.BudgetType
import za.co.taska.domain.model.Job
import za.co.taska.domain.model.Resource
import za.co.taska.domain.model.UrgencyLevel
import java.io.File

/**
 * Jobs Repository Interface
 * Defines job-related operations
 */
interface JobsRepository {

    // ========== Read Operations (Artisan-focused) ==========

    fun getJobs(
        latitude: Double? = null,
        longitude: Double? = null,
        radius: Int = 25,
        categoryId: String? = null,
        minBudget: Double? = null,
        maxBudget: Double? = null
    ): Flow<Resource<List<Job>>>

    fun getNearbyJobs(
        latitude: Double,
        longitude: Double,
        radius: Int = 25
    ): Flow<Resource<List<Job>>>

    suspend fun getJobById(jobId: String): Resource<Job>

    suspend fun searchJobs(
        query: String,
        categoryId: String? = null,
        city: String? = null
    ): Resource<List<Job>>

    suspend fun refreshJobs()

    // ========== Write Operations (Client-focused) ==========

    suspend fun createJob(
        categoryId: String,
        title: String,
        description: String,
        budget: Double,
        budgetType: BudgetType,
        urgency: UrgencyLevel,
        address: Address,
        images: List<String> = emptyList(),
        requirements: List<String> = emptyList(),
        startDate: String? = null,
        endDate: String? = null
    ): Result<Job>

    suspend fun updateJob(
        jobId: String,
        title: String? = null,
        description: String? = null,
        budget: Double? = null,
        budgetType: BudgetType? = null,
        urgency: UrgencyLevel? = null,
        address: Address? = null,
        images: List<String>? = null,
        requirements: List<String>? = null,
        startDate: String? = null,
        endDate: String? = null
    ): Result<Job>

    suspend fun deleteJob(jobId: String): Result<Unit>

    suspend fun cancelJob(jobId: String): Result<Job>

    suspend fun completeJob(jobId: String): Result<Job>

    suspend fun uploadJobImage(imageFile: File): Result<String>

    suspend fun uploadJobImages(imageFiles: List<File>): Result<List<String>>

    fun getMyJobs(status: String? = null): Flow<Resource<List<Job>>>
}
