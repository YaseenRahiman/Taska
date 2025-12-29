package za.co.taska.data.remote.dto.response

import com.google.gson.annotations.SerializedName

/**
 * Image Upload Response DTO
 * API → Client response after uploading job images
 */
data class ImageUploadResponse(
    @SerializedName("url") val url: String,
    @SerializedName("key") val key: String,
    @SerializedName("size") val size: Long
)

/**
 * Multiple Images Upload Response
 */
data class MultipleImagesUploadResponse(
    @SerializedName("urls") val urls: List<String>,
    @SerializedName("keys") val keys: List<String>
)
