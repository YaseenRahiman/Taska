package za.co.taska.data.local.dao

import androidx.room.*
import kotlinx.coroutines.flow.Flow
import za.co.taska.data.local.entity.PaymentEntity

/**
 * Payment DAO
 * Room database access object for payments
 */
@Dao
interface PaymentDao {

    @Query("SELECT * FROM payments WHERE id = :paymentId")
    suspend fun getPaymentById(paymentId: String): PaymentEntity?

    @Query("SELECT * FROM payments WHERE jobId = :jobId")
    suspend fun getPaymentsByJobId(jobId: String): List<PaymentEntity>

    @Query("SELECT * FROM payments WHERE clientId = :clientId ORDER BY createdAt DESC")
    fun getClientPayments(clientId: String): Flow<List<PaymentEntity>>

    @Query("SELECT * FROM payments WHERE status = :status ORDER BY createdAt DESC")
    fun getPaymentsByStatus(status: String): Flow<List<PaymentEntity>>

    @Query("SELECT * FROM payments ORDER BY createdAt DESC LIMIT :limit")
    fun getPayments(limit: Int = 50): Flow<List<PaymentEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPayment(payment: PaymentEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPayments(payments: List<PaymentEntity>)

    @Update
    suspend fun updatePayment(payment: PaymentEntity)

    @Delete
    suspend fun deletePayment(payment: PaymentEntity)

    @Query("DELETE FROM payments WHERE cachedAt < :timestamp")
    suspend fun deleteOldPayments(timestamp: Long)

    @Query("DELETE FROM payments")
    suspend fun deleteAllPayments()
}
