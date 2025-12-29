package za.co.taska.data.remote.dto.request

import com.google.gson.annotations.SerializedName

/**
 * Request body for token refresh endpoint
 */
data class RefreshTokenRequest(
    @SerializedName("refreshToken")
    val refreshToken: String
)
