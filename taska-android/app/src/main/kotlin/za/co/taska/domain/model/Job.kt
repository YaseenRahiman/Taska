package za.co.taska.domain.model

/**
 * Job Domain Model
 * Clean architecture - no framework dependencies
 */
data class Job(
    val id: String,
    val clientId: String,
    val categoryId: String,
    val title: String,
    val description: String,
    val budget: Double,
    val budgetType: BudgetType,
    val urgency: UrgencyLevel,
    val status: JobStatus,
    val address: Address,
    val images: List<String>,
    val requirements: List<String>,
    val startDate: String?,
    val endDate: String?,
    val createdAt: String,
    val client: ClientInfo?,
    val category: Category?,
    val distance: Double? = null // Calculated distance in km
) {
    val budgetDisplay: String
        get() = when (budgetType) {
            BudgetType.FIXED -> "R ${budget.toInt()}"
            BudgetType.HOURLY -> "R ${budget.toInt()}/hr"
            BudgetType.NEGOTIABLE -> "R ${budget.toInt()} (Negotiable)"
        }

    val urgencyDisplay: String
        get() = when (urgency) {
            UrgencyLevel.LOW -> "Flexible"
            UrgencyLevel.MEDIUM -> "This week"
            UrgencyLevel.HIGH -> "Urgent"
            UrgencyLevel.URGENT -> "ASAP"
        }

    val distanceDisplay: String
        get() = distance?.let { "%.1f km away".format(it) } ?: "Location unknown"
}

data class Address(
    val addressLine1: String,
    val addressLine2: String?,
    val city: String,
    val province: String,
    val postalCode: String,
    val latitude: Double,
    val longitude: Double
) {
    val fullAddress: String
        get() = listOfNotNull(addressLine1, addressLine2, city, province, postalCode)
            .joinToString(", ")
}

data class ClientInfo(
    val id: String,
    val firstName: String?,
    val lastName: String?,
    val profilePictureUrl: String?,
    val rating: Double?,
    val completedJobs: Int?
) {
    val displayName: String
        get() = listOfNotNull(firstName, lastName).joinToString(" ")
            .takeIf { it.isNotBlank() } ?: "Client"

    val ratingDisplay: String
        get() = rating?.let { "★ %.1f".format(it) } ?: "New"
}

data class Category(
    val id: String,
    val name: String,
    val iconUrl: String?
)

enum class BudgetType {
    FIXED,
    HOURLY,
    NEGOTIABLE
}

enum class UrgencyLevel {
    LOW,
    MEDIUM,
    HIGH,
    URGENT
}

enum class JobStatus {
    DRAFT,
    OPEN,
    IN_PROGRESS,
    COMPLETED,
    CANCELLED,
    DISPUTED
}
