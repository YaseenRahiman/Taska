package za.co.taska.data.remote.dto.response

import com.google.gson.annotations.SerializedName

/**
 * Paginated Payments Response
 * Response for payment list with pagination
 */
data class PaginatedPaymentsResponse(
    @SerializedName("data")
    val data: List<PaymentResponse>,

    @SerializedName("pagination")
    val pagination: PaginationMeta
)

data class PaginationMeta(
    @SerializedName("page")
    val page: Int,

    @SerializedName("limit")
    val limit: Int,

    @SerializedName("total")
    val total: Int,

    @SerializedName("totalPages")
    val totalPages: Int,

    @SerializedName("hasNextPage")
    val hasNextPage: Boolean,

    @SerializedName("hasPreviousPage")
    val hasPreviousPage: Boolean
)
