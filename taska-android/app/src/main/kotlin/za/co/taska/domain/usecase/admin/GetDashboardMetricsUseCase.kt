package za.co.taska.domain.usecase.admin

import za.co.taska.domain.model.DashboardMetrics
import za.co.taska.domain.repository.AdminRepository
import javax.inject.Inject

/**
 * Use case for retrieving admin dashboard metrics
 * Returns platform-wide statistics and KPIs
 */
class GetDashboardMetricsUseCase @Inject constructor(
    private val adminRepository: AdminRepository
) {
    suspend operator fun invoke(): Result<DashboardMetrics> {
        return adminRepository.getDashboardMetrics()
    }
}
