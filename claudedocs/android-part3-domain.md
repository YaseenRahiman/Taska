# Part 3: Domain Layer Design

## 3.1 Domain Models

### Payment.kt
```kotlin
package za.co.taska.domain.model

data class Payment(
    val id: String,
    val jobId: String,
    val clientId: String,
    val artisanId: String,
    val bidId: String,
    val amount: Double,
    val platformFee: Double,
    val totalAmount: Double,
    val paymentMethod: PaymentMethod,
    val status: PaymentStatus,
    val transactionId: String?,
    val receiptUrl: String?,
    val createdAt: String,
    val completedAt: String?
)

enum class PaymentMethod {
    CREDIT_CARD, DEBIT_CARD, EFT, MOBILE_MONEY
}

enum class PaymentStatus {
    PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED, CANCELLED
}
```

### Review.kt
```kotlin
package za.co.taska.domain.model

data class Review(
    val id: String,
    val jobId: String,
    val clientId: String,
    val artisanId: String,
    val overallRating: Int,
    val qualityRating: Int,
    val professionalismRating: Int,
    val timelinessRating: Int,
    val valueRating: Int,
    val reviewText: String?,
    val images: List<String>,
    val wouldRecommend: Boolean,
    val createdAt: String,
    val updatedAt: String?
)
```

### BidAnalytics.kt
```kotlin
package za.co.taska.domain.model

data class BidAnalytics(
    val totalBids: Int,
    val averageBid: Double,
    val lowestBid: Double,
    val highestBid: Double,
    val averageRating: Double
)
```

## 3.2 Use Case Examples

### CreateJobUseCase.kt
```kotlin
class CreateJobUseCase @Inject constructor(
    private val jobsRepository: JobsRepository
) {
    suspend operator fun invoke(jobData: CreateJobDto): Result<Job> {
        return when {
            jobData.title.length !in 5..100 ->
                Result.failure(IllegalArgumentException("Title 5-100 chars"))
            jobData.description.length !in 20..2000 ->
                Result.failure(IllegalArgumentException("Description 20-2000 chars"))
            jobData.budget <= 0 ->
                Result.failure(IllegalArgumentException("Budget > 0"))
            jobData.images.size > 5 ->
                Result.failure(IllegalArgumentException("Max 5 images"))
            else -> jobsRepository.createJob(jobData)
        }
    }
}
```

### AcceptBidUseCase.kt
```kotlin
class AcceptBidUseCase @Inject constructor(
    private val bidsRepository: BidsRepository
) {
    suspend operator fun invoke(bidId: String): Result<Bid> {
        return bidsRepository.acceptBid(bidId)
    }
}
```

### InitiatePaymentUseCase.kt
```kotlin
class InitiatePaymentUseCase @Inject constructor(
    private val paymentsRepository: PaymentsRepository
) {
    companion object {
        const val PLATFORM_FEE_PERCENTAGE = 0.15 // 15%
    }

    suspend operator fun invoke(paymentData: CreatePaymentDto): Result<Payment> {
        if (paymentData.amount <= 0) {
            return Result.failure(IllegalArgumentException("Amount must be > 0"))
        }
        return paymentsRepository.initiatePayment(paymentData)
    }

    fun calculateTotalAmount(bidAmount: Double): Double {
        return bidAmount + (bidAmount * PLATFORM_FEE_PERCENTAGE)
    }
}
```

This is a summary version. The full design document is being created in chunks.
