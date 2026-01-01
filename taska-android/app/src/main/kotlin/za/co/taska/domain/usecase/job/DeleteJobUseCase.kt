package za.co.taska.domain.usecase.job

import za.co.taska.domain.repository.JobsRepository
import javax.inject.Inject

/**
 * Delete Job Use Case
 * Business logic for deleting jobs (draft or cancelled jobs only)
 */
class DeleteJobUseCase @Inject constructor(
    private val jobsRepository: JobsRepository
) {
    suspend operator fun invoke(jobId: String): Result<Unit> {
        if (jobId.isBlank()) {
            return Result.failure(IllegalArgumentException("Job ID cannot be empty"))
        }

        return jobsRepository.deleteJob(jobId)
    }
}
