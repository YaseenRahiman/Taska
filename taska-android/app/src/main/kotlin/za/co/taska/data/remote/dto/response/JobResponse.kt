package za.co.taska.data.remote.dto.response

import com.google.gson.annotations.SerializedName

data class JobResponse(
    @SerializedName("id")
    val id: String,

    @SerializedName("clientId")
    val clientId: String,

    @SerializedName("categoryId")
    val categoryId: String,

    @SerializedName("title")
    val title: String,

    @SerializedName("description")
    val description: String,

    @SerializedName("budget")
    val budget: Double,

    @SerializedName("budgetType")
    val budgetType: String,

    @SerializedName("urgency")
    val urgency: String,

    @SerializedName("status")
    val status: String,

    @SerializedName("addressLine1")
    val addressLine1: String,

    @SerializedName("addressLine2")
    val addressLine2: String?,

    @SerializedName("city")
    val city: String,

    @SerializedName("province")
    val province: String,

    @SerializedName("postalCode")
    val postalCode: String,

    @SerializedName("latitude")
    val latitude: Double,

    @SerializedName("longitude")
    val longitude: Double,

    @SerializedName("images")
    val images: List<String>,

    @SerializedName("requirements")
    val requirements: List<String>,

    @SerializedName("startDate")
    val startDate: String?,

    @SerializedName("endDate")
    val endDate: String?,

    @SerializedName("createdAt")
    val createdAt: String,

    @SerializedName("updatedAt")
    val updatedAt: String,

    @SerializedName("client")
    val client: ClientInfoDto?,

    @SerializedName("category")
    val category: CategoryDto?
)

data class ClientInfoDto(
    @SerializedName("id")
    val id: String,

    @SerializedName("firstName")
    val firstName: String?,

    @SerializedName("lastName")
    val lastName: String?,

    @SerializedName("profilePictureUrl")
    val profilePictureUrl: String?,

    @SerializedName("rating")
    val rating: Double?,

    @SerializedName("completedJobs")
    val completedJobs: Int?
)

data class CategoryDto(
    @SerializedName("id")
    val id: String,

    @SerializedName("name")
    val name: String,

    @SerializedName("iconUrl")
    val iconUrl: String?
)

data class PaginatedJobsResponse(
    @SerializedName("jobs")
    val jobs: List<JobResponse>,

    @SerializedName("total")
    val total: Int,

    @SerializedName("page")
    val page: Int,

    @SerializedName("limit")
    val limit: Int,

    @SerializedName("totalPages")
    val totalPages: Int
)
