package za.co.taska.data.remote.dto.response

import com.google.gson.annotations.SerializedName

data class AuthResponse(
    @SerializedName("accessToken")
    val accessToken: String,

    @SerializedName("refreshToken")
    val refreshToken: String,

    @SerializedName("expiresIn")
    val expiresIn: Int,

    @SerializedName("user")
    val user: UserDto? = null
)

data class UserDto(
    @SerializedName("id")
    val id: String,

    @SerializedName("email")
    val email: String,

    @SerializedName("role")
    val role: String,

    @SerializedName("verifiedAt")
    val verifiedAt: String?,

    @SerializedName("profile")
    val profile: ProfileDto?
)

data class ProfileDto(
    @SerializedName("firstName")
    val firstName: String?,

    @SerializedName("lastName")
    val lastName: String?,

    @SerializedName("phoneNumber")
    val phoneNumber: String?,

    @SerializedName("city")
    val city: String?,

    @SerializedName("province")
    val province: String?,

    @SerializedName("latitude")
    val latitude: Double?,

    @SerializedName("longitude")
    val longitude: Double?,

    @SerializedName("profilePictureUrl")
    val profilePictureUrl: String?,

    @SerializedName("bio")
    val bio: String?,

    @SerializedName("isVerified")
    val isVerified: Boolean
)
