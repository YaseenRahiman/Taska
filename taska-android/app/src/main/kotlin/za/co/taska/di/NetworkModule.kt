package za.co.taska.di

import com.google.gson.Gson
import com.google.gson.GsonBuilder
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import za.co.taska.BuildConfig
import za.co.taska.data.remote.api.AuthApiService
import za.co.taska.data.remote.api.BidsApiService
import za.co.taska.data.remote.api.JobsApiService
import za.co.taska.data.remote.api.MessagesApiService
import za.co.taska.data.remote.api.NotificationsApiService
import za.co.taska.data.remote.api.PaymentsApiService
import za.co.taska.data.remote.api.ReviewsApiService
import za.co.taska.data.remote.interceptor.AuthInterceptor
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

/**
 * Network Module
 * Provides networking dependencies (Retrofit, OkHttp, API services)
 */
@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun provideGson(): Gson {
        return GsonBuilder()
            .setLenient()
            .create()
    }

    @Provides
    @Singleton
    fun provideLoggingInterceptor(): HttpLoggingInterceptor {
        return HttpLoggingInterceptor().apply {
            level = if (BuildConfig.DEBUG) {
                HttpLoggingInterceptor.Level.BODY
            } else {
                HttpLoggingInterceptor.Level.NONE
            }
        }
    }

    @Provides
    @Singleton
    fun provideAuthInterceptor(): AuthInterceptor {
        return AuthInterceptor()
    }

    @Provides
    @Singleton
    fun provideOkHttpClient(
        loggingInterceptor: HttpLoggingInterceptor,
        authInterceptor: AuthInterceptor
    ): OkHttpClient {
        return OkHttpClient.Builder()
            .addInterceptor(authInterceptor)
            .addInterceptor(loggingInterceptor)
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build()
    }

    @Provides
    @Singleton
    fun provideRetrofit(
        okHttpClient: OkHttpClient,
        gson: Gson
    ): Retrofit {
        return Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create(gson))
            .build()
    }

    @Provides
    @Singleton
    fun provideAuthApiService(retrofit: Retrofit): AuthApiService {
        return retrofit.create(AuthApiService::class.java)
    }

    @Provides
    @Singleton
    fun provideJobsApiService(retrofit: Retrofit): JobsApiService {
        return retrofit.create(JobsApiService::class.java)
    }

    @Provides
    @Singleton
    fun provideBidsApiService(retrofit: Retrofit): BidsApiService {
        return retrofit.create(BidsApiService::class.java)
    }

    @Provides
    @Singleton
    fun provideMessagesApiService(retrofit: Retrofit): MessagesApiService {
        return retrofit.create(MessagesApiService::class.java)
    }

    @Provides
    @Singleton
    fun providePaymentsApiService(retrofit: Retrofit): PaymentsApiService {
        return retrofit.create(PaymentsApiService::class.java)
    }

    @Provides
    @Singleton
    fun provideReviewsApiService(retrofit: Retrofit): ReviewsApiService {
        return retrofit.create(ReviewsApiService::class.java)
    }

    @Provides
    @Singleton
    fun provideNotificationsApiService(retrofit: Retrofit): NotificationsApiService {
        return retrofit.create(NotificationsApiService::class.java)
    }
}
