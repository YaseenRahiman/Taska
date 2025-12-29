package za.co.taska.domain.usecase.job

import za.co.taska.domain.model.Job
import za.co.taska.domain.repository.JobsRepository
import javax.inject.Inject

/**
 * Cancel Job Use Case
 * Business logic for cancelling active jobs
 */
class CancelJobUseCase @Inject constructor(
    private val jobsRepository: JobsRepository
) {
    suspend operator fun invoke(jobId: String): Result<Job> {
        if (jobId.isBlank()) {
            return Result.failure(IllegalArgumentException("Job ID cannot be empty"))
        }

        return jobsRepository.cancelJob(jobId)
    }
}
