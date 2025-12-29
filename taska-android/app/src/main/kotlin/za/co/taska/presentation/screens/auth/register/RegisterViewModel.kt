package za.co.taska.presentation.screens.auth.register

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import za.co.taska.domain.model.Resource
import za.co.taska.domain.usecase.auth.RegisterUseCase
import za.co.taska.presentation.navigation.UserRole
import javax.inject.Inject

/**
 * ViewModel for multi-step registration flow
 * Supports CLIENT and ARTISAN registration with role selection
 * Steps: 0=Role Selection, 1=Personal Details, 2=Contact Info, 3=Skills (ARTISAN only), 4=Create Account
 */
@HiltViewModel
class RegisterViewModel @Inject constructor(
    private val registerUseCase: RegisterUseCase
) : ViewModel() {

    var state by mutableStateOf(RegisterState())
        private set

    // Step 0: Role Selection
    fun onRoleSelected(role: UserRole) {
        state = state.copy(
            selectedRole = role,
            roleError = null,
            error = null
        )
    }

    // Step 1: Personal Details
    fun onFirstNameChanged(firstName: String) {
        state = state.copy(
            firstName = firstName,
            firstNameError = null,
            error = null
        )
    }

    fun onLastNameChanged(lastName: String) {
        state = state.copy(
            lastName = lastName,
            lastNameError = null,
            error = null
        )
    }

    // Step 2: Contact Info
    fun onEmailChanged(email: String) {
        state = state.copy(
            email = email,
            emailError = null,
            error = null
        )
    }

    fun onPhoneNumberChanged(phoneNumber: String) {
        state = state.copy(
            phoneNumber = phoneNumber,
            phoneNumberError = null,
            error = null
        )
    }

    // Step 3: Skills & Experience
    fun onBioChanged(bio: String) {
        state = state.copy(bio = bio)
    }

    // Step 4: Create Account
    fun onPasswordChanged(password: String) {
        state = state.copy(
            password = password,
            passwordError = null,
            error = null
        )
    }

    fun onConfirmPasswordChanged(confirmPassword: String) {
        state = state.copy(
            confirmPassword = confirmPassword,
            confirmPasswordError = null,
            error = null
        )
    }

    // Navigation
    fun nextStep() {
        // Validate current step
        if (!validateCurrentStep()) {
            return
        }

        // Determine next step based on current step and role
        val nextStep = when (state.currentStep) {
            0 -> 1  // Role → Personal Details
            1 -> 2  // Personal Details → Contact Info
            2 -> if (state.selectedRole == UserRole.ARTISAN) 3 else 4  // Contact → Skills (ARTISAN) or Account (CLIENT)
            3 -> 4  // Skills → Account
            else -> state.currentStep
        }

        if (nextStep == 4 && state.currentStep == 4) {
            // Final step - register
            performRegistration()
        } else {
            // Move to next step
            state = state.copy(currentStep = nextStep)
        }
    }

    fun previousStep() {
        if (state.currentStep > 0) {
            val prevStep = when (state.currentStep) {
                1 -> 0  // Personal Details → Role
                2 -> 1  // Contact Info → Personal Details
                3 -> 2  // Skills → Contact Info
                4 -> if (state.selectedRole == UserRole.ARTISAN) 3 else 2  // Account → Skills (ARTISAN) or Contact (CLIENT)
                else -> state.currentStep
            }

            state = state.copy(
                currentStep = prevStep,
                error = null
            )
        }
    }

    private fun validateCurrentStep(): Boolean {
        return when (state.currentStep) {
            0 -> validateStep0()
            1 -> validateStep1()
            2 -> validateStep2()
            3 -> validateStep3()
            4 -> validateStep4()
            else -> false
        }
    }

    private fun validateStep0(): Boolean {
        if (state.selectedRole == null) {
            state = state.copy(roleError = "Please select your account type")
            return false
        }
        return true
    }

    private fun validateStep1(): Boolean {
        var isValid = true

        if (state.firstName.isBlank()) {
            state = state.copy(firstNameError = "First name is required")
            isValid = false
        } else if (state.firstName.length < 2) {
            state = state.copy(firstNameError = "First name is too short")
            isValid = false
        }

        if (state.lastName.isBlank()) {
            state = state.copy(lastNameError = "Last name is required")
            isValid = false
        } else if (state.lastName.length < 2) {
            state = state.copy(lastNameError = "Last name is too short")
            isValid = false
        }

        return isValid
    }

    private fun validateStep2(): Boolean {
        var isValid = true

        if (state.email.isBlank()) {
            state = state.copy(emailError = "Email is required")
            isValid = false
        } else if (!android.util.Patterns.EMAIL_ADDRESS.matcher(state.email).matches()) {
            state = state.copy(emailError = "Invalid email format")
            isValid = false
        }

        if (state.phoneNumber.isNotBlank()) {
            // Optional but validate if provided
            if (!state.phoneNumber.startsWith("0") && !state.phoneNumber.startsWith("+27")) {
                state = state.copy(phoneNumberError = "Phone must start with 0 or +27")
                isValid = false
            } else if (state.phoneNumber.startsWith("0") && state.phoneNumber.length != 10) {
                state = state.copy(phoneNumberError = "Phone must be 10 digits (0XXXXXXXXX)")
                isValid = false
            } else if (state.phoneNumber.startsWith("+27") && state.phoneNumber.length != 12) {
                state = state.copy(phoneNumberError = "Phone must be 12 digits (+27XXXXXXXXX)")
                isValid = false
            }
        }

        return isValid
    }

    private fun validateStep3(): Boolean {
        // Skills selection is optional for now
        // Bio is optional
        return true
    }

    private fun validateStep4(): Boolean {
        var isValid = true

        if (state.password.isBlank()) {
            state = state.copy(passwordError = "Password is required")
            isValid = false
        } else if (state.password.length < 8) {
            state = state.copy(passwordError = "Password must be at least 8 characters")
            isValid = false
        }

        if (state.confirmPassword.isBlank()) {
            state = state.copy(confirmPasswordError = "Please confirm your password")
            isValid = false
        } else if (state.password != state.confirmPassword) {
            state = state.copy(confirmPasswordError = "Passwords do not match")
            isValid = false
        }

        return isValid
    }

    private fun performRegistration() {
        viewModelScope.launch {
            state = state.copy(isLoading = true, error = null)

            // Ensure role is selected (should be validated before this point)
            val role = state.selectedRole?.name ?: return@launch

            when (val result = registerUseCase(
                email = state.email,
                password = state.password,
                confirmPassword = state.confirmPassword,
                role = role,
                firstName = state.firstName.ifBlank { null },
                lastName = state.lastName.ifBlank { null },
                phoneNumber = state.phoneNumber.ifBlank { null }
            )) {
                is Resource.Success -> {
                    state = state.copy(
                        isLoading = false,
                        registrationSuccess = true
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
}

data class RegisterState(
    // Step 0: Role Selection
    val selectedRole: UserRole? = null,
    val roleError: String? = null,

    // Step 1: Personal Details
    val firstName: String = "",
    val lastName: String = "",
    val firstNameError: String? = null,
    val lastNameError: String? = null,

    // Step 2: Contact Info
    val email: String = "",
    val phoneNumber: String = "",
    val emailError: String? = null,
    val phoneNumberError: String? = null,

    // Step 3: Skills & Experience (ARTISAN only)
    val selectedSkills: List<String> = emptyList(),
    val bio: String = "",

    // Step 4: Create Account
    val password: String = "",
    val confirmPassword: String = "",
    val passwordError: String? = null,
    val confirmPasswordError: String? = null,

    // Navigation & State
    val currentStep: Int = 0,  // Start at role selection
    val isLoading: Boolean = false,
    val error: String? = null,
    val registrationSuccess: Boolean = false
) {
    // Calculate total steps based on role
    fun getTotalSteps(): Int {
        return when (selectedRole) {
            UserRole.CLIENT -> 4  // Steps 0, 1, 2, 4 (skip skills)
            UserRole.ARTISAN -> 5 // Steps 0, 1, 2, 3, 4 (all steps)
            else -> 5  // Default to max
        }
    }
}
