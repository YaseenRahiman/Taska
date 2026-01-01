package za.co.taska.domain.model

/**
 * User Domain Model
 * Clean architecture - no framework dependencies
 */
data class User(
    val id: String,
    val email: String,
    val role: UserRole,
    val verifiedAt: String?,
    val profile: Profile?
)

data class Profile(
    val firstName: String?,
    val lastName: String?,
    val phoneNumber: String?,
    val city: String?,
    val province: String?,
    val latitude: Double?,
    val longitude: Double?,
    val profilePictureUrl: String?,
    val bio: String?,
    val isVerified: Boolean
) {
    val fullName: String
        get() = listOfNotNull(firstName, lastName).joinToString(" ")

    val displayName: String
        get() = fullName.takeIf { it.isNotBlank() } ?: "Artisan"
}

enum class UserRole {
    CLIENT,
    ARTISAN,
    ADMIN,
    ASSESSOR
}
