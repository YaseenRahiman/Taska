package za.co.taska.data.mapper

import za.co.taska.data.local.entity.ReviewEntity
import za.co.taska.data.remote.dto.response.ReviewResponse
import za.co.taska.domain.model.Review
import javax.inject.Inject

/**
 * Review Mapper
 * Transforms Review between DTO ↔ Domain ↔ Entity
 */
class ReviewMapper @Inject constructor() {

    /**
     * Map ReviewResponse (DTO) to Review (Domain)
     */
    fun toDomain(dto: ReviewResponse): Review {
        return Review(
            id = dto.id,
            jobId = dto.jobId,
            clientId = dto.clientId,
            artisanId = dto.artisanId,
            overallRating = dto.overallRating,
            qualityRating = dto.qualityRating,
            professionalismRating = dto.professionalismRating,
            timelinessRating = dto.timelinessRating,
            valueRating = dto.valueRating,
            reviewText = dto.reviewText,
            images = dto.images,
            wouldRecommend = dto.wouldRecommend,
            createdAt = dto.createdAt,
            updatedAt = dto.updatedAt
        )
    }

    /**
     * Map Review (Domain) to ReviewEntity (Room)
     */
    fun toEntity(domain: Review): ReviewEntity {
        return ReviewEntity(
            id = domain.id,
            jobId = domain.jobId,
            clientId = domain.clientId,
            artisanId = domain.artisanId,
            overallRating = domain.overallRating,
            qualityRating = domain.qualityRating,
            professionalismRating = domain.professionalismRating,
            timelinessRating = domain.timelinessRating,
            valueRating = domain.valueRating,
            reviewText = domain.reviewText,
            images = domain.images.joinToString(","), // Convert list to comma-separated string
            wouldRecommend = domain.wouldRecommend,
            createdAt = domain.createdAt,
            updatedAt = domain.updatedAt,
            cachedAt = System.currentTimeMillis()
        )
    }

    /**
     * Map ReviewEntity (Room) to Review (Domain)
     */
    fun fromEntity(entity: ReviewEntity): Review {
        return Review(
            id = entity.id,
            jobId = entity.jobId,
            clientId = entity.clientId,
            artisanId = entity.artisanId,
            overallRating = entity.overallRating,
            qualityRating = entity.qualityRating,
            professionalismRating = entity.professionalismRating,
            timelinessRating = entity.timelinessRating,
            valueRating = entity.valueRating,
            reviewText = entity.reviewText,
            images = if (entity.images.isBlank()) emptyList() else entity.images.split(","), // Convert string to list
            wouldRecommend = entity.wouldRecommend,
            createdAt = entity.createdAt,
            updatedAt = entity.updatedAt
        )
    }

    /**
     * Map list of DTOs to Domain
     */
    fun toDomainList(dtoList: List<ReviewResponse>): List<Review> {
        return dtoList.map { toDomain(it) }
    }

    /**
     * Map list of Entities to Domain
     */
    fun fromEntityList(entityList: List<ReviewEntity>): List<Review> {
        return entityList.map { fromEntity(it) }
    }
}
