package za.co.taska.domain.usecase.job

import za.co.taska.domain.model.Address
import za.co.taska.domain.model.BudgetType
import za.co.taska.domain.model.Job
import za.co.taska.domain.model.UrgencyLevel
import za.co.taska.domain.repository.JobsRepository
import javax.inject.Inject

/**
 * Update Job Use Case
 * Business logic for updating existing jobs with partial update support
 *
 * All fields optional except jobId - allows granular updates
 */
class UpdateJobUseCase @Inject constructor(
    private val jobsRepository: JobsRepository
) {
    suspend operator fun invoke(
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
    ): Result<Job> {
        // Validate inputs
        val validationError = validateInputs(
            jobId = jobId,
            title = title,
            description = description,
            budget = budget,
            address = address,
            images = images,
            requirements = requirements
        )

        if (validationError != null) {
            return Result.failure(IllegalArgumentException(validationError))
        }

        // Call repository
        return jobsRepository.updateJob(
            jobId = jobId,
            title = title?.trim(),
            description = description?.trim(),
            budget = budget,
            budgetType = budgetType,
            urgency = urgency,
            address = address,
            images = images,
            requirements = requirements?.map { it.trim() },
            startDate = startDate,
            endDate = endDate
        )
    }

    private fun validateInputs(
        jobId: String,
        title: String?,
        description: String?,
        budget: Double?,
        address: Address?,
        images: List<String>?,
        requirements: List<String>?
    ): String? {
        return when {
            jobId.isBlank() -> "Job ID cannot be empty"

            title != null && title.isBlank() -> "Job title cannot be blank (use null to keep existing)"
            title != null && title.trim().length < 10 -> "Job title must be at least 10 characters"
            title != null && title.trim().length > 100 -> "Job title cannot exceed 100 characters"

            description != null && description.isBlank() -> "Job description cannot be blank (use null to keep existing)"
            description != null && description.trim().length < 50 -> "Job description must be at least 50 characters"
            description != null && description.trim().length > 2000 -> "Job description cannot exceed 2000 characters"

            budget != null && budget <= 0 -> "Budget must be greater than zero"
            budget != null && budget > 1000000 -> "Budget cannot exceed R1,000,000"

            address != null && address.addressLine1.isBlank() -> "Street address cannot be empty"
            address != null && address.city.isBlank() -> "City cannot be empty"
            address != null && address.province.isBlank() -> "Province cannot be empty"
            address != null && address.postalCode.isBlank() -> "Postal code cannot be empty"
            address != null && !isValidSouthAfricanPostalCode(address.postalCode) -> "Invalid South African postal code"
            address != null && (address.latitude < -90 || address.latitude > 90) -> "Invalid latitude"
            address != null && (address.longitude < -180 || address.longitude > 180) -> "Invalid longitude"

            images != null && images.isEmpty() -> "Cannot update to empty images list (use null to keep existing)"
            images != null && images.size > 5 -> "Maximum 5 images allowed"
            images != null && images.any { it.isBlank() } -> "Image URLs cannot be blank"

            requirements != null && requirements.isEmpty() -> "Cannot update to empty requirements list (use null to keep existing)"
            requirements != null && requirements.size > 10 -> "Maximum 10 requirements allowed"
            requirements != null && requirements.any { it.isBlank() } -> "Requirements cannot be blank"
            requirements != null && requirements.any { it.length > 200 } -> "Each requirement cannot exceed 200 characters"

            else -> null
        }
    }

    private fun isValidSouthAfricanPostalCode(postalCode: String): Boolean {
        return postalCode.matches(Regex("^[0-9]{4}$"))
    }
}
