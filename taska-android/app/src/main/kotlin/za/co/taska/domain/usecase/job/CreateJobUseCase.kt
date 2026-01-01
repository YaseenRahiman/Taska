package za.co.taska.domain.usecase.job

import za.co.taska.domain.model.Address
import za.co.taska.domain.model.BudgetType
import za.co.taska.domain.model.Job
import za.co.taska.domain.model.UrgencyLevel
import za.co.taska.domain.repository.JobsRepository
import javax.inject.Inject

/**
 * Create Job Use Case
 * Business logic for creating new jobs with comprehensive validation
 *
 * Validation Rules:
 * - Title: 10-100 characters
 * - Description: 50-2000 characters
 * - Budget: Must be positive
 * - Images: Maximum 5
 * - Requirements: Maximum 10 items
 */
class CreateJobUseCase @Inject constructor(
    private val jobsRepository: JobsRepository
) {
    suspend operator fun invoke(
        categoryId: String,
        title: String,
        description: String,
        budget: Double,
        budgetType: BudgetType,
        urgency: UrgencyLevel,
        address: Address,
        images: List<String> = emptyList(),
        requirements: List<String> = emptyList(),
        startDate: String? = null,
        endDate: String? = null
    ): Result<Job> {
        // Validate inputs
        val validationError = validateInputs(
            categoryId = categoryId,
            title = title,
            description = description,
            budget = budget,
            address = address,
            images = images,
            requirements = requirements,
            startDate = startDate,
            endDate = endDate
        )

        if (validationError != null) {
            return Result.failure(IllegalArgumentException(validationError))
        }

        // Call repository
        return jobsRepository.createJob(
            categoryId = categoryId,
            title = title.trim(),
            description = description.trim(),
            budget = budget,
            budgetType = budgetType,
            urgency = urgency,
            address = address,
            images = images,
            requirements = requirements.map { it.trim() },
            startDate = startDate,
            endDate = endDate
        )
    }

    private fun validateInputs(
        categoryId: String,
        title: String,
        description: String,
        budget: Double,
        address: Address,
        images: List<String>,
        requirements: List<String>,
        startDate: String?,
        endDate: String?
    ): String? {
        return when {
            categoryId.isBlank() -> "Category must be selected"

            title.isBlank() -> "Job title cannot be empty"
            title.trim().length < 10 -> "Job title must be at least 10 characters"
            title.trim().length > 100 -> "Job title cannot exceed 100 characters"

            description.isBlank() -> "Job description cannot be empty"
            description.trim().length < 50 -> "Job description must be at least 50 characters"
            description.trim().length > 2000 -> "Job description cannot exceed 2000 characters"

            budget <= 0 -> "Budget must be greater than zero"
            budget > 1000000 -> "Budget cannot exceed R1,000,000"

            address.addressLine1.isBlank() -> "Street address is required"
            address.city.isBlank() -> "City is required"
            address.province.isBlank() -> "Province is required"
            address.postalCode.isBlank() -> "Postal code is required"
            !isValidSouthAfricanPostalCode(address.postalCode) -> "Invalid South African postal code"

            address.latitude < -90 || address.latitude > 90 -> "Invalid latitude"
            address.longitude < -180 || address.longitude > 180 -> "Invalid longitude"

            images.size > 5 -> "Maximum 5 images allowed"
            images.any { it.isBlank() } -> "Image URLs cannot be blank"

            requirements.size > 10 -> "Maximum 10 requirements allowed"
            requirements.any { it.isBlank() } -> "Requirements cannot be blank"
            requirements.any { it.length > 200 } -> "Each requirement cannot exceed 200 characters"

            startDate != null && endDate != null && startDate > endDate -> "Start date must be before end date"

            else -> null
        }
    }

    private fun isValidSouthAfricanPostalCode(postalCode: String): Boolean {
        // South African postal codes are 4 digits
        return postalCode.matches(Regex("^[0-9]{4}$"))
    }
}
