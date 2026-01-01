package za.co.taska.data.remote.dto.response

import com.google.gson.annotations.SerializedName

data class MessageResponse(
    @SerializedName("message")
    val message: String
)

data class UserProfileResponse(
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

data class UploadResponse(
    @SerializedName("url")
    val url: String,

    @SerializedName("size")
    val size: Long,

    @SerializedName("format")
    val format: String
)
