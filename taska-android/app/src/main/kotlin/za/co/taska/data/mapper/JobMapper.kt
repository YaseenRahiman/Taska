package za.co.taska.data.mapper

import za.co.taska.data.local.entity.JobEntity
import za.co.taska.data.remote.dto.response.*
import za.co.taska.domain.model.*

/**
 * Job Mapper
 * Converts between DTO, Entity, and Domain models
 */

// DTO to Domain
fun JobResponse.toDomain(): Job {
    return Job(
        id = id,
        clientId = clientId,
        categoryId = categoryId,
        title = title,
        description = description,
        budget = budget,
        budgetType = budgetType.toBudgetType(),
        urgency = urgency.toUrgencyLevel(),
        status = status.toJobStatus(),
        address = Address(
            addressLine1 = addressLine1,
            addressLine2 = addressLine2,
            city = city,
            province = province,
            postalCode = postalCode,
            latitude = latitude,
            longitude = longitude
        ),
        images = images,
        requirements = requirements,
        startDate = startDate,
        endDate = endDate,
        createdAt = createdAt,
        client = client?.toClientInfo(),
        category = category?.toCategory()
    )
}

fun ClientInfoDto.toClientInfo(): ClientInfo {
    return ClientInfo(
        id = id,
        firstName = firstName,
        lastName = lastName,
        profilePictureUrl = profilePictureUrl,
        rating = rating,
        completedJobs = completedJobs
    )
}

fun CategoryDto.toCategory(): Category {
    return Category(
        id = id,
        name = name,
        iconUrl = iconUrl
    )
}

// Entity to Domain
fun JobEntity.toDomain(): Job {
    return Job(
        id = id,
        clientId = clientId,
        categoryId = categoryId,
        title = title,
        description = description,
        budget = budget,
        budgetType = budgetType.toBudgetType(),
        urgency = urgency.toUrgencyLevel(),
        status = status.toJobStatus(),
        address = Address(
            addressLine1 = addressLine1,
            addressLine2 = null,
            city = city,
            province = province,
            postalCode = "",
            latitude = latitude,
            longitude = longitude
        ),
        images = images,
        requirements = requirements,
        startDate = null,
        endDate = null,
        createdAt = createdAt,
        client = clientName?.let {
            ClientInfo(
                id = clientId,
                firstName = it,
                lastName = null,
                profilePictureUrl = null,
                rating = clientRating,
                completedJobs = null
            )
        },
        category = null,
        distance = distance
    )
}

// Domain to Entity
fun Job.toEntity(): JobEntity {
    return JobEntity(
        id = id,
        clientId = clientId,
        categoryId = categoryId,
        title = title,
        description = description,
        budget = budget,
        budgetType = budgetType.name,
        urgency = urgency.name,
        status = status.name,
        latitude = address.latitude,
        longitude = address.longitude,
        city = address.city,
        province = address.province,
        addressLine1 = address.addressLine1,
        images = images,
        requirements = requirements,
        createdAt = createdAt,
        clientName = client?.displayName,
        clientRating = client?.rating,
        distance = distance
    )
}

// String to Enum converters
fun String.toBudgetType(): BudgetType {
    return try {
        BudgetType.valueOf(this)
    } catch (e: Exception) {
        BudgetType.NEGOTIABLE
    }
}

fun String.toUrgencyLevel(): UrgencyLevel {
    return try {
        UrgencyLevel.valueOf(this)
    } catch (e: Exception) {
        UrgencyLevel.MEDIUM
    }
}

fun String.toJobStatus(): JobStatus {
    return try {
        JobStatus.valueOf(this)
    } catch (e: Exception) {
        JobStatus.OPEN
    }
}
