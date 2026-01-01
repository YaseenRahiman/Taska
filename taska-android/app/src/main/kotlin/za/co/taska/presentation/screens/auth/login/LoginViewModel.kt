package za.co.taska.presentation.screens.auth.login

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import za.co.taska.domain.model.Resource
import za.co.taska.domain.usecase.auth.LoginUseCase
import za.co.taska.presentation.navigation.UserRole
import javax.inject.Inject

/**
 * ViewModel for login screen
 * Handles authentication logic and validation
 */
@HiltViewModel
class LoginViewModel @Inject constructor(
    private val loginUseCase: LoginUseCase
) : ViewModel() {

    var state by mutableStateOf(LoginState())
        private set

    fun onEmailChanged(email: String) {
        state = state.copy(
            email = email,
            emailError = null,
            error = null
        )
    }

    fun onPasswordChanged(password: String) {
        state = state.copy(
            password = password,
            passwordError = null,
            error = null
        )
    }

    fun onLoginClicked() {
        // Clear previous errors
        state = state.copy(
            emailError = null,
            passwordError = null,
            error = null
        )

        // Validate inputs
        if (!validateInputs()) {
            return
        }

        // Perform login
        viewModelScope.launch {
            state = state.copy(isLoading = true)

            when (val result = loginUseCase(state.email, state.password)) {
                is Resource.Success -> {
                    // Extract user role from login response and convert to presentation UserRole
                    val userRole = result.data?.role?.let { domainRole ->
                        when (domainRole) {
                            za.co.taska.domain.model.UserRole.CLIENT -> UserRole.CLIENT
                            za.co.taska.domain.model.UserRole.ARTISAN -> UserRole.ARTISAN
                            za.co.taska.domain.model.UserRole.ADMIN -> UserRole.ADMIN
                            za.co.taska.domain.model.UserRole.ASSESSOR -> UserRole.ADMIN // Map ASSESSOR to ADMIN
                        }
                    }

                    state = state.copy(
                        isLoading = false,
                        loginSuccess = true,
                        userRole = userRole
                    )
                }
                is Resource.Error -> {
                    state = state.copy(
                        isLoading = false,
                        error = result.message
                    )
                }
                is Resource.Loading -> {
                    // Already set loading state
                }
            }
        }
    }

    private fun validateInputs(): Boolean {
        var isValid = true

        // Validate email
        if (state.email.isBlank()) {
            state = state.copy(emailError = "Email is required")
            isValid = false
        } else if (!android.util.Patterns.EMAIL_ADDRESS.matcher(state.email).matches()) {
            state = state.copy(emailError = "Invalid email format")
            isValid = false
        }

        // Validate password
        if (state.password.isBlank()) {
            state = state.copy(passwordError = "Password is required")
            isValid = false
        } else if (state.password.length < 8) {
            state = state.copy(passwordError = "Password must be at least 8 characters")
            isValid = false
        }

        return isValid
    }
}

data class LoginState(
    val email: String = "",
    val password: String = "",
    val emailError: String? = null,
    val passwordError: String? = null,
    val error: String? = null,
    val isLoading: Boolean = false,
    val loginSuccess: Boolean = false,
    val userRole: UserRole? = null
)
