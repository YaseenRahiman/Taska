package za.co.taska.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Payment Entity
 * Room database entity for offline payment storage
 */
@Entity(tableName = "payments")
data class PaymentEntity(
    @PrimaryKey
    val id: String,
    val jobId: String,
    val clientId: String,
    val artisanId: String,
    val bidId: String,
    val amount: Double,
    val platformFee: Double,
    val totalAmount: Double,
    val paymentMethod: String,
    val status: String,
    val transactionId: String?,
    val receiptUrl: String?,
    val createdAt: String,
    val completedAt: String?,
    val cachedAt: Long = System.currentTimeMillis()
)
