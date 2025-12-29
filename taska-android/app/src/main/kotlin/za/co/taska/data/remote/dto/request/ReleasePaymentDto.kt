package za.co.taska.data.remote.dto.request

import com.google.gson.annotations.SerializedName

/**
 * Release Payment DTO
 * Request body for releasing escrowed payment to artisan
 */
data class ReleasePaymentDto(
    @SerializedName("completionNotes")
    val completionNotes: String? = null,

    @SerializedName("rating")
    val rating: Int? = null
)
