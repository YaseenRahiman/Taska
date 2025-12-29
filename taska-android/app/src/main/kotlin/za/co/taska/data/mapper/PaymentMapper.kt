package za.co.taska.data.mapper

import za.co.taska.data.local.entity.PaymentEntity
import za.co.taska.data.remote.dto.response.PaymentResponse
import za.co.taska.domain.model.Payment
import za.co.taska.domain.model.PaymentMethod
import za.co.taska.domain.model.PaymentStatus
import javax.inject.Inject

/**
 * Payment Mapper
 * Transforms Payment between DTO ↔ Domain ↔ Entity
 */
class PaymentMapper @Inject constructor() {

    /**
     * Map PaymentResponse (DTO) to Payment (Domain)
     */
    fun toDomain(dto: PaymentResponse): Payment {
        return Payment(
            id = dto.id,
            jobId = dto.jobId,
            clientId = dto.payerId,
            artisanId = dto.payeeId,
            bidId = dto.bidId,
            amount = dto.amount,
            platformFee = dto.platformFee,
            totalAmount = dto.totalAmount,
            paymentMethod = PaymentMethod.fromString(dto.paymentMethod),
            status = PaymentStatus.fromString(dto.status),
            transactionId = dto.transactionId,
            receiptUrl = null, // Backend doesn't provide this yet
            createdAt = dto.createdAt,
            completedAt = dto.releasedAt
        )
    }

    /**
     * Map Payment (Domain) to PaymentEntity (Room)
     */
    fun toEntity(domain: Payment): PaymentEntity {
        return PaymentEntity(
            id = domain.id,
            jobId = domain.jobId,
            clientId = domain.clientId,
            artisanId = domain.artisanId,
            bidId = domain.bidId,
            amount = domain.amount,
            platformFee = domain.platformFee,
            totalAmount = domain.totalAmount,
            paymentMethod = domain.paymentMethod.name,
            status = domain.status.name,
            transactionId = domain.transactionId,
            receiptUrl = domain.receiptUrl,
            createdAt = domain.createdAt,
            completedAt = domain.completedAt,
            cachedAt = System.currentTimeMillis()
        )
    }

    /**
     * Map PaymentEntity (Room) to Payment (Domain)
     */
    fun fromEntity(entity: PaymentEntity): Payment {
        return Payment(
            id = entity.id,
            jobId = entity.jobId,
            clientId = entity.clientId,
            artisanId = entity.artisanId,
            bidId = entity.bidId,
            amount = entity.amount,
            platformFee = entity.platformFee,
            totalAmount = entity.totalAmount,
            paymentMethod = PaymentMethod.valueOf(entity.paymentMethod),
            status = PaymentStatus.valueOf(entity.status),
            transactionId = entity.transactionId,
            receiptUrl = entity.receiptUrl,
            createdAt = entity.createdAt,
            completedAt = entity.completedAt
        )
    }

    /**
     * Map list of DTOs to Domain
     */
    fun toDomainList(dtoList: List<PaymentResponse>): List<Payment> {
        return dtoList.map { toDomain(it) }
    }

    /**
     * Map list of Entities to Domain
     */
    fun fromEntityList(entityList: List<PaymentEntity>): List<Payment> {
        return entityList.map { fromEntity(it) }
    }
}
