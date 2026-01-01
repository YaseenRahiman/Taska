package za.co.taska.domain.usecase.admin

import za.co.taska.domain.model.PlatformAnalytics
import za.co.taska.domain.repository.AdminRepository
import javax.inject.Inject

/**
 * Use case for retrieving platform analytics
 * Returns comprehensive analytics data for specified period
 */
class GetAnalyticsUseCase @Inject constructor(
    private val adminRepository: AdminRepository
) {
    suspend operator fun invoke(
        period: String = "MONTHLY",
        dateFrom: String,
        dateTo: String
    ): Result<PlatformAnalytics> {
        if (dateFrom.isBlank() || dateTo.isBlank()) {
            return Result.failure(IllegalArgumentException("Date range cannot be empty"))
        }
        return adminRepository.getAnalytics(period, dateFrom, dateTo)
    }
}
