package za.co.taska

import android.app.Application
import dagger.hilt.android.HiltAndroidApp
import za.co.taska.data.local.preferences.PreferencesManager
import za.co.taska.data.remote.api.AuthApiService
import za.co.taska.data.remote.interceptor.AuthInterceptor
import javax.inject.Inject

/**
 * Taska Application Class
 * Entry point for the Android app with Hilt dependency injection
 */
@HiltAndroidApp
class TaskaApplication : Application() {

    @Inject
    lateinit var authInterceptor: AuthInterceptor

    @Inject
    lateinit var preferencesManager: PreferencesManager

    @Inject
    lateinit var authApiService: AuthApiService

    override fun onCreate() {
        super.onCreate()

        // Initialize app-level components
        initializeApp()
    }

    private fun initializeApp() {
        // Initialize AuthInterceptor with dependencies for token refresh
        authInterceptor.setPreferencesManager(preferencesManager)
        authInterceptor.setAuthApiService(authApiService)

        // TODO: Initialize analytics, crash reporting, etc.
        // Firebase will be initialized automatically
    }
}
