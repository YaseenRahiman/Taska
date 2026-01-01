package za.co.taska.data.local.dao

import androidx.room.*
import kotlinx.coroutines.flow.Flow
import za.co.taska.data.local.entity.JobEntity

/**
 * Job DAO
 * Data Access Object for Job operations
 */
@Dao
interface JobDao {

    @Query("SELECT * FROM jobs WHERE status = 'OPEN' ORDER BY cached_at DESC LIMIT :limit")
    fun getJobs(limit: Int = 50): Flow<List<JobEntity>>

    @Query("SELECT * FROM jobs WHERE id = :jobId")
    suspend fun getJobById(jobId: String): JobEntity?

    @Query("SELECT * FROM jobs WHERE status = 'OPEN' AND city = :city ORDER BY cached_at DESC")
    fun getJobsByCity(city: String): Flow<List<JobEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertJob(job: JobEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertJobs(jobs: List<JobEntity>)

    @Update
    suspend fun updateJob(job: JobEntity)

    @Delete
    suspend fun deleteJob(job: JobEntity)

    @Query("DELETE FROM jobs WHERE cached_at < :timestamp")
    suspend fun deleteOldJobs(timestamp: Long)

    @Query("DELETE FROM jobs")
    suspend fun clearAll()
}
