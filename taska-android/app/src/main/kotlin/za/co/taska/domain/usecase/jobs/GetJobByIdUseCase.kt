package za.co.taska.domain.usecase.jobs

import za.co.taska.domain.model.Job
import za.co.taska.domain.model.Resource
import za.co.taska.domain.repository.JobsRepository
import javax.inject.Inject

/**
 * Get Job By ID Use Case
 * Single responsibility: Fetch job details by ID
 */
class GetJobByIdUseCase @Inject constructor(
    private val jobsRepository: JobsRepository
) {
    suspend operator fun invoke(jobId: String): Resource<Job> {
        if (jobId.isBlank()) {
            return Resource.error("Job ID cannot be empty")
        }

        return jobsRepository.getJobById(jobId)
    }
}
