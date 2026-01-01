package za.co.taska.data.mapper

import za.co.taska.data.remote.dto.response.ProfileDto
import za.co.taska.data.remote.dto.response.UserDto
import za.co.taska.domain.model.Profile
import za.co.taska.domain.model.User
import za.co.taska.domain.model.UserRole

/**
 * User Mapper
 * Converts between DTO and Domain models
 */

// DTO to Domain
fun UserDto.toDomain(): User {
    return User(
        id = id,
        email = email,
        role = role.toUserRole(),
        verifiedAt = verifiedAt,
        profile = profile?.toProfile()
    )
}

fun ProfileDto.toProfile(): Profile {
    return Profile(
        firstName = firstName,
        lastName = lastName,
        phoneNumber = phoneNumber,
        city = city,
        province = province,
        latitude = latitude,
        longitude = longitude,
        profilePictureUrl = profilePictureUrl,
        bio = bio,
        isVerified = isVerified
    )
}

// String to Enum converter
fun String.toUserRole(): UserRole {
    return try {
        UserRole.valueOf(this)
    } catch (e: Exception) {
        UserRole.ARTISAN
    }
}
