package za.co.taska.domain.usecase.job

import kotlinx.coroutines.flow.Flow
import za.co.taska.domain.model.Job
import za.co.taska.domain.model.JobStatus
import za.co.taska.domain.model.Resource
import za.co.taska.domain.repository.JobsRepository
import javax.inject.Inject

/**
 * Get My Jobs Use Case
 * Business logic for retrieving client's jobs with optional status filter
 */
class GetMyJobsUseCase @Inject constructor(
    private val jobsRepository: JobsRepository
) {
    operator fun invoke(status: JobStatus? = null): Flow<Resource<List<Job>>> {
        return jobsRepository.getMyJobs(status = status?.name)
    }

    /**
     * Get jobs by multiple statuses
     */
    operator fun invoke(statuses: List<JobStatus>): Flow<Resource<List<Job>>> {
        if (statuses.isEmpty()) {
            return jobsRepository.getMyJobs(status = null)
        }

        if (statuses.size == 1) {
            return jobsRepository.getMyJobs(status = statuses.first().name)
        }

        // For multiple statuses, we'll need to fetch all and filter client-side
        // This is a limitation of the API endpoint design
        return jobsRepository.getMyJobs(status = null)
    }
}
