package za.co.taska.domain.usecase.jobs

import kotlinx.coroutines.flow.Flow
import za.co.taska.domain.model.Job
import za.co.taska.domain.model.Resource
import za.co.taska.domain.repository.JobsRepository
import javax.inject.Inject

/**
 * Get Nearby Jobs Use Case
 * Single responsibility: Fetch jobs near user's location
 */
class GetNearbyJobsUseCase @Inject constructor(
    private val jobsRepository: JobsRepository
) {
    operator fun invoke(
        latitude: Double,
        longitude: Double,
        radius: Int = 25
    ): Flow<Resource<List<Job>>> {
        // Validate inputs
        if (latitude < -90 || latitude > 90) {
            throw IllegalArgumentException("Invalid latitude")
        }

        if (longitude < -180 || longitude > 180) {
            throw IllegalArgumentException("Invalid longitude")
        }

        if (radius <= 0 || radius > 100) {
            throw IllegalArgumentException("Radius must be between 1 and 100 km")
        }

        return jobsRepository.getNearbyJobs(latitude, longitude, radius)
    }
}
