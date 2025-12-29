package za.co.taska.data.local.dao

import android.content.Context
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import app.cash.turbine.test
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import za.co.taska.data.local.TaskaDatabase
import za.co.taska.data.local.entity.PaymentEntity

/**
 * Integration tests for PaymentDao
 * Tests Room database operations with in-memory database
 *
 * Coverage target: >70%
 */
@RunWith(AndroidJUnit4::class)
class PaymentDaoTest {

    private lateinit var database: TaskaDatabase
    private lateinit var paymentDao: PaymentDao

    @Before
    fun setup() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        database = Room.inMemoryDatabaseBuilder(
            context,
            TaskaDatabase::class.java
        ).allowMainThreadQueries().build()

        paymentDao = database.paymentDao()
    }

    @After
    fun teardown() {
        database.close()
    }

    // ========== Insert Tests ==========

    @Test
    fun insertPayment_shouldInsertAndRetrieve() = runTest {
        // Given
        val payment = createTestPaymentEntity(id = "payment_123")

        // When
        paymentDao.insertPayment(payment)

        // Then
        val retrieved = paymentDao.getPaymentById("payment_123")
        assertNotNull(retrieved)
        assertEquals("payment_123", retrieved?.id)
        assertEquals("job_456", retrieved?.jobId)
        assertEquals(1000.0, retrieved?.amount, 0.01)
    }

    @Test
    fun insertPayment_shouldReplaceOnConflict() = runTest {
        // Given
        val payment1 = createTestPaymentEntity(id = "payment_123", amount = 1000.0)
        val payment2 = createTestPaymentEntity(id = "payment_123", amount = 2000.0)

        // When
        paymentDao.insertPayment(payment1)
        paymentDao.insertPayment(payment2) // Should replace

        // Then
        val retrieved = paymentDao.getPaymentById("payment_123")
        assertEquals(2000.0, retrieved?.amount, 0.01)
    }

    @Test
    fun insertPayments_shouldInsertMultiple() = runTest {
        // Given
        val payments = listOf(
            createTestPaymentEntity(id = "payment_1"),
            createTestPaymentEntity(id = "payment_2"),
            createTestPaymentEntity(id = "payment_3")
        )

        // When
        paymentDao.insertPayments(payments)

        // Then
        val payment1 = paymentDao.getPaymentById("payment_1")
        val payment2 = paymentDao.getPaymentById("payment_2")
        val payment3 = paymentDao.getPaymentById("payment_3")

        assertNotNull(payment1)
        assertNotNull(payment2)
        assertNotNull(payment3)
    }

    // ========== Query Tests ==========

    @Test
    fun getPaymentById_shouldReturnNull_whenNotFound() = runTest {
        // When
        val retrieved = paymentDao.getPaymentById("nonexistent")

        // Then
        assertNull(retrieved)
    }

    @Test
    fun getPaymentsByJobId_shouldReturnAllPaymentsForJob() = runTest {
        // Given
        val job456Payments = listOf(
            createTestPaymentEntity(id = "payment_1", jobId = "job_456"),
            createTestPaymentEntity(id = "payment_2", jobId = "job_456")
        )
        val job789Payment = createTestPaymentEntity(id = "payment_3", jobId = "job_789")

        paymentDao.insertPayments(job456Payments + job789Payment)

        // When
        val retrieved = paymentDao.getPaymentsByJobId("job_456")

        // Then
        assertEquals(2, retrieved.size)
        assertTrue(retrieved.all { it.jobId == "job_456" })
    }

    @Test
    fun getPaymentsByJobId_shouldReturnEmpty_whenNoPayments() = runTest {
        // When
        val retrieved = paymentDao.getPaymentsByJobId("job_nonexistent")

        // Then
        assertTrue(retrieved.isEmpty())
    }

    @Test
    fun getClientPayments_shouldReturnFlowOrderedByDate() = runTest {
        // Given
        val now = System.currentTimeMillis()
        val payments = listOf(
            createTestPaymentEntity(
                id = "payment_1",
                clientId = "client_123",
                createdAt = "2025-10-31T10:00:00Z"
            ),
            createTestPaymentEntity(
                id = "payment_2",
                clientId = "client_123",
                createdAt = "2025-10-31T11:00:00Z"
            ),
            createTestPaymentEntity(
                id = "payment_3",
                clientId = "client_456",
                createdAt = "2025-10-31T12:00:00Z"
            )
        )

        paymentDao.insertPayments(payments)

        // When & Then
        paymentDao.getClientPayments("client_123").test {
            val result = awaitItem()
            assertEquals(2, result.size)
            // Should be ordered by createdAt DESC
            assertEquals("payment_2", result[0].id) // Latest first
            assertEquals("payment_1", result[1].id)
            assertTrue(result.all { it.clientId == "client_123" })
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun getPaymentsByStatus_shouldReturnFlowFilteredByStatus() = runTest {
        // Given
        val payments = listOf(
            createTestPaymentEntity(id = "payment_1", status = "ESCROWED"),
            createTestPaymentEntity(id = "payment_2", status = "ESCROWED"),
            createTestPaymentEntity(id = "payment_3", status = "RELEASED")
        )

        paymentDao.insertPayments(payments)

        // When & Then
        paymentDao.getPaymentsByStatus("ESCROWED").test {
            val result = awaitItem()
            assertEquals(2, result.size)
            assertTrue(result.all { it.status == "ESCROWED" })
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun getPayments_shouldRespectLimit() = runTest {
        // Given
        val payments = (1..10).map { createTestPaymentEntity(id = "payment_$it") }
        paymentDao.insertPayments(payments)

        // When & Then
        paymentDao.getPayments(limit = 5).test {
            val result = awaitItem()
            assertEquals(5, result.size)
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun getPayments_shouldOrderByCreatedAtDesc() = runTest {
        // Given
        val payments = listOf(
            createTestPaymentEntity(id = "payment_1", createdAt = "2025-10-31T10:00:00Z"),
            createTestPaymentEntity(id = "payment_2", createdAt = "2025-10-31T12:00:00Z"),
            createTestPaymentEntity(id = "payment_3", createdAt = "2025-10-31T11:00:00Z")
        )

        paymentDao.insertPayments(payments)

        // When & Then
        paymentDao.getPayments(limit = 50).test {
            val result = awaitItem()
            assertEquals(3, result.size)
            // Should be ordered by createdAt DESC
            assertEquals("payment_2", result[0].id) // Latest
            assertEquals("payment_3", result[1].id) // Middle
            assertEquals("payment_1", result[2].id) // Oldest
            cancelAndIgnoreRemainingEvents()
        }
    }

    // ========== Update Tests ==========

    @Test
    fun updatePayment_shouldModifyExistingPayment() = runTest {
        // Given
        val original = createTestPaymentEntity(id = "payment_123", status = "ESCROWED")
        paymentDao.insertPayment(original)

        // When
        val updated = original.copy(status = "RELEASED", completedAt = "2025-11-01T15:00:00Z")
        paymentDao.updatePayment(updated)

        // Then
        val retrieved = paymentDao.getPaymentById("payment_123")
        assertEquals("RELEASED", retrieved?.status)
        assertEquals("2025-11-01T15:00:00Z", retrieved?.completedAt)
    }

    @Test
    fun updatePayment_shouldUpdateAmount() = runTest {
        // Given
        val original = createTestPaymentEntity(id = "payment_123", amount = 1000.0)
        paymentDao.insertPayment(original)

        // When
        val updated = original.copy(amount = 1500.0, totalAmount = 1725.0)
        paymentDao.updatePayment(updated)

        // Then
        val retrieved = paymentDao.getPaymentById("payment_123")
        assertEquals(1500.0, retrieved?.amount, 0.01)
        assertEquals(1725.0, retrieved?.totalAmount, 0.01)
    }

    // ========== Delete Tests ==========

    @Test
    fun deletePayment_shouldRemovePayment() = runTest {
        // Given
        val payment = createTestPaymentEntity(id = "payment_123")
        paymentDao.insertPayment(payment)

        // When
        paymentDao.deletePayment(payment)

        // Then
        val retrieved = paymentDao.getPaymentById("payment_123")
        assertNull(retrieved)
    }

    @Test
    fun deleteOldPayments_shouldRemovePaymentsOlderThanTimestamp() = runTest {
        // Given
        val now = System.currentTimeMillis()
        val oneDayAgo = now - (24 * 60 * 60 * 1000)
        val twoDaysAgo = now - (48 * 60 * 60 * 1000)

        val payments = listOf(
            createTestPaymentEntity(id = "payment_old", cachedAt = twoDaysAgo),
            createTestPaymentEntity(id = "payment_recent", cachedAt = now)
        )

        paymentDao.insertPayments(payments)

        // When - Delete payments cached before yesterday
        paymentDao.deleteOldPayments(oneDayAgo)

        // Then
        val oldPayment = paymentDao.getPaymentById("payment_old")
        val recentPayment = paymentDao.getPaymentById("payment_recent")

        assertNull(oldPayment) // Should be deleted
        assertNotNull(recentPayment) // Should remain
    }

    @Test
    fun deleteAllPayments_shouldClearTable() = runTest {
        // Given
        val payments = (1..5).map { createTestPaymentEntity(id = "payment_$it") }
        paymentDao.insertPayments(payments)

        // When
        paymentDao.deleteAllPayments()

        // Then
        paymentDao.getPayments(50).test {
            val result = awaitItem()
            assertTrue(result.isEmpty())
            cancelAndIgnoreRemainingEvents()
        }
    }

    // ========== Flow Observation Tests ==========

    @Test
    fun getClientPayments_shouldEmitUpdates_whenDataChanges() = runTest {
        // Given
        val payment1 = createTestPaymentEntity(id = "payment_1", clientId = "client_123")
        paymentDao.insertPayment(payment1)

        // When & Then
        paymentDao.getClientPayments("client_123").test {
            // Initial emission
            val initial = awaitItem()
            assertEquals(1, initial.size)

            // Insert another payment
            val payment2 = createTestPaymentEntity(id = "payment_2", clientId = "client_123")
            paymentDao.insertPayment(payment2)

            // Should emit update
            val updated = awaitItem()
            assertEquals(2, updated.size)

            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun getPaymentsByStatus_shouldEmitUpdates_whenStatusChanges() = runTest {
        // Given
        val payment = createTestPaymentEntity(id = "payment_123", status = "PENDING")
        paymentDao.insertPayment(payment)

        // When & Then
        paymentDao.getPaymentsByStatus("ESCROWED").test {
            // Initial emission - empty
            val initial = awaitItem()
            assertEquals(0, initial.size)

            // Update status
            val updated = payment.copy(status = "ESCROWED")
            paymentDao.updatePayment(updated)

            // Should emit update
            val result = awaitItem()
            assertEquals(1, result.size)
            assertEquals("ESCROWED", result[0].status)

            cancelAndIgnoreRemainingEvents()
        }
    }

    // ========== Edge Cases ==========

    @Test
    fun insertPayment_shouldHandleNullableFields() = runTest {
        // Given
        val payment = createTestPaymentEntity(
            id = "payment_123",
            transactionId = null,
            receiptUrl = null,
            completedAt = null
        )

        // When
        paymentDao.insertPayment(payment)

        // Then
        val retrieved = paymentDao.getPaymentById("payment_123")
        assertNotNull(retrieved)
        assertNull(retrieved?.transactionId)
        assertNull(retrieved?.receiptUrl)
        assertNull(retrieved?.completedAt)
    }

    @Test
    fun getPayments_shouldReturnEmpty_whenDatabaseEmpty() = runTest {
        // When & Then
        paymentDao.getPayments(50).test {
            val result = awaitItem()
            assertTrue(result.isEmpty())
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun insertPayments_shouldHandleEmptyList() = runTest {
        // When
        paymentDao.insertPayments(emptyList())

        // Then - Should not crash
        paymentDao.getPayments(50).test {
            val result = awaitItem()
            assertTrue(result.isEmpty())
            cancelAndIgnoreRemainingEvents()
        }
    }

    // ========== Helper Methods ==========

    private fun createTestPaymentEntity(
        id: String = "payment_123",
        jobId: String = "job_456",
        clientId: String = "client_789",
        artisanId: String = "artisan_101",
        bidId: String = "bid_112",
        amount: Double = 1000.0,
        platformFee: Double = 100.0,
        totalAmount: Double = 1150.0,
        paymentMethod: String = "CARD",
        status: String = "ESCROWED",
        transactionId: String? = "txn_xyz",
        receiptUrl: String? = null,
        createdAt: String = "2025-10-31T10:00:00Z",
        completedAt: String? = null,
        cachedAt: Long = System.currentTimeMillis()
    ) = PaymentEntity(
        id = id,
        jobId = jobId,
        clientId = clientId,
        artisanId = artisanId,
        bidId = bidId,
        amount = amount,
        platformFee = platformFee,
        totalAmount = totalAmount,
        paymentMethod = paymentMethod,
        status = status,
        transactionId = transactionId,
        receiptUrl = receiptUrl,
        createdAt = createdAt,
        completedAt = completedAt,
        cachedAt = cachedAt
    )
}
