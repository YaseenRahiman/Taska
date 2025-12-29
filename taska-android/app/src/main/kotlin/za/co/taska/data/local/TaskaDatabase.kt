package za.co.taska.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import za.co.taska.data.local.dao.BidDao
import za.co.taska.data.local.dao.JobDao
import za.co.taska.data.local.dao.MessageDao
import za.co.taska.data.local.dao.NotificationDao
import za.co.taska.data.local.dao.PaymentDao
import za.co.taska.data.local.dao.ReviewDao
import za.co.taska.data.local.entity.BidEntity
import za.co.taska.data.local.entity.JobEntity
import za.co.taska.data.local.entity.MessageEntity
import za.co.taska.data.local.entity.NotificationEntity
import za.co.taska.data.local.entity.PaymentEntity
import za.co.taska.data.local.entity.ReviewEntity
import za.co.taska.data.local.converter.Converters

/**
 * Taska Database
 * Room database for offline storage
 */
@Database(
    entities = [
        JobEntity::class,
        BidEntity::class,
        MessageEntity::class,
        PaymentEntity::class,
        ReviewEntity::class,
        NotificationEntity::class
    ],
    version = 4,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class TaskaDatabase : RoomDatabase() {

    abstract fun jobDao(): JobDao
    abstract fun bidDao(): BidDao
    abstract fun messageDao(): MessageDao
    abstract fun paymentDao(): PaymentDao
    abstract fun reviewDao(): ReviewDao
    abstract fun notificationDao(): NotificationDao

    companion object {
        const val DATABASE_NAME = "taska_database"
    }
}
