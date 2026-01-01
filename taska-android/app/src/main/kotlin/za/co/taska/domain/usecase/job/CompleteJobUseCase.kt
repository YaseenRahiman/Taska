package za.co.taska.domain.usecase.job

import za.co.taska.domain.model.Job
import za.co.taska.domain.repository.JobsRepository
import javax.inject.Inject

/**
 * Complete Job Use Case
 * Business logic for marking jobs as completed
 */
class CompleteJobUseCase @Inject constructor(
    private val jobsRepository: JobsRepository
) {
    suspend operator fun invoke(jobId: String): Result<Job> {
        if (jobId.isBlank()) {
            return Result.failure(IllegalArgumentException("Job ID cannot be empty"))
        }

        return jobsRepository.completeJob(jobId)
    }
}
