package za.co.taska.di

import android.content.Context
import androidx.room.Room
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import za.co.taska.data.local.TaskaDatabase
import za.co.taska.data.local.dao.BidDao
import za.co.taska.data.local.dao.JobDao
import za.co.taska.data.local.dao.MessageDao
import za.co.taska.data.local.dao.NotificationDao
import za.co.taska.data.local.dao.PaymentDao
import za.co.taska.data.local.dao.ReviewDao
import za.co.taska.data.local.preferences.PreferencesManager
import javax.inject.Singleton

/**
 * Database Module
 * Provides Room database and DAOs
 */
@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideTaskaDatabase(@ApplicationContext context: Context): TaskaDatabase {
        return Room.databaseBuilder(
            context,
            TaskaDatabase::class.java,
            TaskaDatabase.DATABASE_NAME
        )
            .fallbackToDestructiveMigration()
            .build()
    }

    @Provides
    @Singleton
    fun provideJobDao(database: TaskaDatabase): JobDao {
        return database.jobDao()
    }

    @Provides
    @Singleton
    fun provideBidDao(database: TaskaDatabase): BidDao {
        return database.bidDao()
    }

    @Provides
    @Singleton
    fun provideMessageDao(database: TaskaDatabase): MessageDao {
        return database.messageDao()
    }

    @Provides
    @Singleton
    fun providePaymentDao(database: TaskaDatabase): PaymentDao {
        return database.paymentDao()
    }

    @Provides
    @Singleton
    fun provideReviewDao(database: TaskaDatabase): ReviewDao {
        return database.reviewDao()
    }

    @Provides
    @Singleton
    fun provideNotificationDao(database: TaskaDatabase): NotificationDao {
        return database.notificationDao()
    }

    @Provides
    @Singleton
    fun providePreferencesManager(@ApplicationContext context: Context): PreferencesManager {
        return PreferencesManager(context)
    }
}
