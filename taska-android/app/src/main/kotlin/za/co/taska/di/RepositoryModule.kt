package za.co.taska.di

import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import za.co.taska.data.repository.AdminRepositoryImpl
import za.co.taska.data.repository.AuthRepositoryImpl
import za.co.taska.data.repository.BidsRepositoryImpl
import za.co.taska.data.repository.JobsRepositoryImpl
import za.co.taska.data.repository.MessagesRepositoryImpl
import za.co.taska.data.repository.NotificationsRepositoryImpl
import za.co.taska.data.repository.PaymentsRepositoryImpl
import za.co.taska.data.repository.ReviewsRepositoryImpl
import za.co.taska.domain.repository.AdminRepository
import za.co.taska.domain.repository.AuthRepository
import za.co.taska.domain.repository.BidsRepository
import za.co.taska.domain.repository.JobsRepository
import za.co.taska.domain.repository.MessagesRepository
import za.co.taska.domain.repository.MonetizationRepository
import za.co.taska.domain.repository.NotificationsRepository
import za.co.taska.domain.repository.PaymentsRepository
import za.co.taska.domain.repository.ReviewsRepository
import za.co.taska.data.repository.MonetizationRepositoryImpl
import javax.inject.Singleton

/**
 * Repository Module
 * Binds repository implementations to interfaces
 */
@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {

    @Binds
    @Singleton
    abstract fun bindAuthRepository(
        authRepositoryImpl: AuthRepositoryImpl
    ): AuthRepository

    @Binds
    @Singleton
    abstract fun bindJobsRepository(
        jobsRepositoryImpl: JobsRepositoryImpl
    ): JobsRepository

    @Binds
    @Singleton
    abstract fun bindPaymentsRepository(
        paymentsRepositoryImpl: PaymentsRepositoryImpl
    ): PaymentsRepository

    @Binds
    @Singleton
    abstract fun bindReviewsRepository(
        reviewsRepositoryImpl: ReviewsRepositoryImpl
    ): ReviewsRepository

    @Binds
    @Singleton
    abstract fun bindNotificationsRepository(
        notificationsRepositoryImpl: NotificationsRepositoryImpl
    ): NotificationsRepository

    @Binds
    @Singleton
    abstract fun bindBidsRepository(
        bidsRepositoryImpl: BidsRepositoryImpl
    ): BidsRepository

    @Binds
    @Singleton
    abstract fun bindMessagesRepository(
        messagesRepositoryImpl: MessagesRepositoryImpl
    ): MessagesRepository

    @Binds
    @Singleton
    abstract fun bindAdminRepository(
        adminRepositoryImpl: AdminRepositoryImpl
    ): AdminRepository

    @Binds
    @Singleton
    abstract fun bindMonetizationRepository(
        monetizationRepositoryImpl: MonetizationRepositoryImpl
    ): MonetizationRepository
}
