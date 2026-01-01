package za.co.taska.data.mapper

import za.co.taska.data.local.entity.BidEntity
import za.co.taska.data.remote.dto.response.BidResponse
import za.co.taska.domain.model.Bid
import za.co.taska.domain.model.BidStatus

/**
 * Bid Mapper
 * Converts between DTO, Entity, and Domain models
 */

// DTO to Domain
fun BidResponse.toDomain(): Bid {
    return Bid(
        id = id,
        jobId = jobId,
        artisanId = artisanId,
        amount = amount,
        message = message,
        estimatedDays = estimatedDays,
        attachments = attachments,
        status = status.toBidStatus(),
        acceptedAt = acceptedAt,
        rejectedAt = rejectedAt,
        withdrawnAt = withdrawnAt,
        expiresAt = expiresAt,
        createdAt = createdAt,
        job = job?.toDomain()
    )
}

// Entity to Domain
fun BidEntity.toDomain(): Bid {
    return Bid(
        id = id,
        jobId = jobId,
        artisanId = "",
        amount = amount,
        message = message,
        estimatedDays = estimatedDays,
        attachments = attachments,
        status = status.toBidStatus(),
        acceptedAt = null,
        rejectedAt = null,
        withdrawnAt = null,
        expiresAt = "",
        createdAt = createdAt,
        job = null
    )
}

// Domain to Entity
fun Bid.toEntity(): BidEntity {
    return BidEntity(
        id = id,
        jobId = jobId,
        amount = amount,
        message = message,
        estimatedDays = estimatedDays,
        attachments = attachments,
        status = status.name,
        createdAt = createdAt,
        syncStatus = "SYNCED",
        jobTitle = job?.title,
        jobCity = job?.address?.city
    )
}

// String to Enum converter
fun String.toBidStatus(): BidStatus {
    return try {
        BidStatus.valueOf(this)
    } catch (e: Exception) {
        BidStatus.PENDING
    }
}
