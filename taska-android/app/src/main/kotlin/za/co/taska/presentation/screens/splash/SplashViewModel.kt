package za.co.taska.presentation.screens.splash

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import za.co.taska.data.local.preferences.PreferencesManager
import za.co.taska.presentation.navigation.UserRole
import javax.inject.Inject

/**
 * ViewModel for splash screen
 * Checks authentication status and determines role-based navigation
 */
@HiltViewModel
class SplashViewModel @Inject constructor(
    private val preferencesManager: PreferencesManager
) : ViewModel() {

    var state by mutableStateOf(SplashState())
        private set

    init {
        checkAuthStatus()
    }

    private fun checkAuthStatus() {
        viewModelScope.launch {
            // Minimum splash display time for branding
            delay(1500)

            val token = preferencesManager.getAccessToken()
            val userId = preferencesManager.getUserId()
            val userRoleString = preferencesManager.getUserRole()

            state = if (!token.isNullOrBlank() && !userId.isNullOrBlank()) {
                // User is logged in - determine role
                val userRole = try {
                    UserRole.valueOf(userRoleString ?: "")
                } catch (e: IllegalArgumentException) {
                    null
                }

                state.copy(
                    isAuthenticated = true,
                    userRole = userRole,
                    navigationEvent = SplashNavigationEvent.NavigateToHome(userRole)
                )
            } else {
                // User needs to log in
                state.copy(
                    isAuthenticated = false,
                    userRole = null,
                    navigationEvent = SplashNavigationEvent.NavigateToLogin
                )
            }
        }
    }
}

data class SplashState(
    val isAuthenticated: Boolean = false,
    val userRole: UserRole? = null,
    val navigationEvent: SplashNavigationEvent? = null
)

sealed class SplashNavigationEvent {
    object NavigateToLogin : SplashNavigationEvent()
    data class NavigateToHome(val userRole: UserRole?) : SplashNavigationEvent()
}
