package za.co.taska.presentation.auth.register

import androidx.arch.core.executor.testing.InstantTaskExecutorRule
import app.cash.turbine.test
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.*
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.mockito.kotlin.*
import za.co.taska.domain.model.Resource
import za.co.taska.domain.model.User
import za.co.taska.domain.model.UserRole
import za.co.taska.domain.usecase.auth.RegisterUseCase

/**
 * Unit tests for RegisterViewModel
 * Tests role selection, multi-step validation, and registration flow
 *
 * Coverage target: >85%
 */
@OptIn(ExperimentalCoroutinesApi::class)
class RegisterViewModelTest {

    @get:Rule
    val instantTaskExecutorRule = InstantTaskExecutorRule()

    private lateinit var viewModel: RegisterViewModel
    private lateinit var registerUseCase: RegisterUseCase

    private val testDispatcher = StandardTestDispatcher()

    @Before
    fun setup() {
        Dispatchers.setMain(testDispatcher)
        registerUseCase = mock()
        viewModel = RegisterViewModel(registerUseCase)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    // ========== Step 0: Role Selection Tests ==========

    @Test
    fun `onRoleSelected should update state with selected role`() {
        // When
        viewModel.onRoleSelected(UserRole.CLIENT)

        // Then
        assertEquals(UserRole.CLIENT, viewModel.state.selectedRole)
        assertNull(viewModel.state.roleError)
    }

    @Test
    fun `onRoleSelected should clear role error`() {
        // Given - set role error first
        viewModel.onNextStep() // Try to proceed without role
        assertNotNull(viewModel.state.roleError)

        // When
        viewModel.onRoleSelected(UserRole.ARTISAN)

        // Then
        assertNull(viewModel.state.roleError)
    }

    @Test
    fun `onNextStep from Step 0 should show error when no role selected`() {
        // When - try to proceed without selecting role
        viewModel.onNextStep()

        // Then
        assertEquals(0, viewModel.state.currentStep)
        assertEquals("Please select your account type", viewModel.state.roleError)
    }

    @Test
    fun `onNextStep from Step 0 should proceed when role selected`() {
        // Given
        viewModel.onRoleSelected(UserRole.CLIENT)

        // When
        viewModel.onNextStep()

        // Then
        assertEquals(1, viewModel.state.currentStep)
        assertNull(viewModel.state.roleError)
    }

    // ========== Step 1: Email & Password Tests ==========

    @Test
    fun `onEmailChanged should update email state`() {
        // When
        viewModel.onEmailChanged("test@example.com")

        // Then
        assertEquals("test@example.com", viewModel.state.email)
        assertNull(viewModel.state.emailError)
    }

    @Test
    fun `onPasswordChanged should update password state`() {
        // When
        viewModel.onPasswordChanged("SecurePass123!")

        // Then
        assertEquals("SecurePass123!", viewModel.state.password)
        assertNull(viewModel.state.passwordError)
    }

    @Test
    fun `onConfirmPasswordChanged should update confirm password state`() {
        // When
        viewModel.onConfirmPasswordChanged("SecurePass123!")

        // Then
        assertEquals("SecurePass123!", viewModel.state.confirmPassword)
        assertNull(viewModel.state.confirmPasswordError)
    }

    @Test
    fun `onNextStep from Step 1 should show error when email is empty`() {
        // Given
        viewModel.onRoleSelected(UserRole.CLIENT)
        viewModel.onNextStep() // Move to Step 1
        viewModel.onPasswordChanged("SecurePass123!")
        viewModel.onConfirmPasswordChanged("SecurePass123!")

        // When
        viewModel.onNextStep()

        // Then
        assertEquals(1, viewModel.state.currentStep)
        assertEquals("Email cannot be empty", viewModel.state.emailError)
    }

    @Test
    fun `onNextStep from Step 1 should show error when email is invalid`() {
        // Given
        viewModel.onRoleSelected(UserRole.CLIENT)
        viewModel.onNextStep()
        viewModel.onEmailChanged("invalid-email")
        viewModel.onPasswordChanged("SecurePass123!")
        viewModel.onConfirmPasswordChanged("SecurePass123!")

        // When
        viewModel.onNextStep()

        // Then
        assertEquals(1, viewModel.state.currentStep)
        assertEquals("Invalid email format", viewModel.state.emailError)
    }

    @Test
    fun `onNextStep from Step 1 should show error when password is too short`() {
        // Given
        viewModel.onRoleSelected(UserRole.CLIENT)
        viewModel.onNextStep()
        viewModel.onEmailChanged("test@example.com")
        viewModel.onPasswordChanged("short")

        // When
        viewModel.onNextStep()

        // Then
        assertEquals(1, viewModel.state.currentStep)
        assertEquals("Password must be at least 8 characters", viewModel.state.passwordError)
    }

    @Test
    fun `onNextStep from Step 1 should show error when passwords don't match`() {
        // Given
        viewModel.onRoleSelected(UserRole.CLIENT)
        viewModel.onNextStep()
        viewModel.onEmailChanged("test@example.com")
        viewModel.onPasswordChanged("SecurePass123!")
        viewModel.onConfirmPasswordChanged("DifferentPass123!")

        // When
        viewModel.onNextStep()

        // Then
        assertEquals(1, viewModel.state.currentStep)
        assertEquals("Passwords do not match", viewModel.state.confirmPasswordError)
    }

    @Test
    fun `onNextStep from Step 1 should proceed when all validations pass`() {
        // Given
        viewModel.onRoleSelected(UserRole.CLIENT)
        viewModel.onNextStep()
        viewModel.onEmailChanged("test@example.com")
        viewModel.onPasswordChanged("SecurePass123!")
        viewModel.onConfirmPasswordChanged("SecurePass123!")

        // When
        viewModel.onNextStep()

        // Then
        assertEquals(2, viewModel.state.currentStep)
    }

    // ========== Step 2: Personal Information Tests ==========

    @Test
    fun `onFirstNameChanged should update first name state`() {
        // When
        viewModel.onFirstNameChanged("John")

        // Then
        assertEquals("John", viewModel.state.firstName)
        assertNull(viewModel.state.firstNameError)
    }

    @Test
    fun `onLastNameChanged should update last name state`() {
        // When
        viewModel.onLastNameChanged("Doe")

        // Then
        assertEquals("Doe", viewModel.state.lastName)
        assertNull(viewModel.state.lastNameError)
    }

    @Test
    fun `onPhoneNumberChanged should update phone number state`() {
        // When
        viewModel.onPhoneNumberChanged("0821234567")

        // Then
        assertEquals("0821234567", viewModel.state.phoneNumber)
        assertNull(viewModel.state.phoneNumberError)
    }

    @Test
    fun `onNextStep from Step 2 should show error when first name is empty`() {
        // Given - Navigate to Step 2
        setupValidSteps(0, 1, 2)

        // When
        viewModel.onNextStep()

        // Then
        assertEquals(2, viewModel.state.currentStep)
        assertEquals("First name cannot be empty", viewModel.state.firstNameError)
    }

    @Test
    fun `onNextStep from Step 2 should show error when last name is empty`() {
        // Given
        setupValidSteps(0, 1, 2)
        viewModel.onFirstNameChanged("John")

        // When
        viewModel.onNextStep()

        // Then
        assertEquals(2, viewModel.state.currentStep)
        assertEquals("Last name cannot be empty", viewModel.state.lastNameError)
    }

    @Test
    fun `onNextStep from Step 2 should show error when phone number is invalid`() {
        // Given
        setupValidSteps(0, 1, 2)
        viewModel.onFirstNameChanged("John")
        viewModel.onLastNameChanged("Doe")
        viewModel.onPhoneNumberChanged("123") // Too short

        // When
        viewModel.onNextStep()

        // Then
        assertEquals(2, viewModel.state.currentStep)
        assertEquals("Invalid phone number", viewModel.state.phoneNumberError)
    }

    @Test
    fun `onNextStep from Step 2 should proceed when all validations pass`() {
        // Given
        setupValidSteps(0, 1, 2)
        viewModel.onFirstNameChanged("John")
        viewModel.onLastNameChanged("Doe")
        viewModel.onPhoneNumberChanged("0821234567")

        // When
        viewModel.onNextStep()

        // Then - CLIENT should skip to Step 4, ARTISAN to Step 3
        assertTrue(viewModel.state.currentStep >= 3)
    }

    // ========== Role-Based Step Flow Tests ==========

    @Test
    fun `getTotalSteps should return 4 for CLIENT role`() {
        // Given
        viewModel.onRoleSelected(UserRole.CLIENT)

        // When
        val totalSteps = viewModel.state.getTotalSteps()

        // Then
        assertEquals(4, totalSteps)
    }

    @Test
    fun `getTotalSteps should return 5 for ARTISAN role`() {
        // Given
        viewModel.onRoleSelected(UserRole.ARTISAN)

        // When
        val totalSteps = viewModel.state.getTotalSteps()

        // Then
        assertEquals(5, totalSteps)
    }

    @Test
    fun `CLIENT role should skip Step 3 skills selection`() {
        // Given - CLIENT user completes Steps 0, 1, 2
        viewModel.onRoleSelected(UserRole.CLIENT)
        viewModel.onNextStep() // Step 1
        viewModel.onEmailChanged("test@example.com")
        viewModel.onPasswordChanged("SecurePass123!")
        viewModel.onConfirmPasswordChanged("SecurePass123!")
        viewModel.onNextStep() // Step 2
        viewModel.onFirstNameChanged("John")
        viewModel.onLastNameChanged("Doe")
        viewModel.onPhoneNumberChanged("0821234567")

        // When
        viewModel.onNextStep()

        // Then - Should skip Step 3 and go to Step 4
        assertEquals(4, viewModel.state.currentStep)
    }

    @Test
    fun `ARTISAN role should include Step 3 skills selection`() {
        // Given - ARTISAN user completes Steps 0, 1, 2
        viewModel.onRoleSelected(UserRole.ARTISAN)
        viewModel.onNextStep()
        viewModel.onEmailChanged("test@example.com")
        viewModel.onPasswordChanged("SecurePass123!")
        viewModel.onConfirmPasswordChanged("SecurePass123!")
        viewModel.onNextStep()
        viewModel.onFirstNameChanged("John")
        viewModel.onLastNameChanged("Doe")
        viewModel.onPhoneNumberChanged("0821234567")

        // When
        viewModel.onNextStep()

        // Then - Should proceed to Step 3
        assertEquals(3, viewModel.state.currentStep)
    }

    // ========== Step 3: Skills Selection Tests (ARTISAN only) ==========

    @Test
    fun `onSkillToggled should add skill when not selected`() {
        // Given
        val initialSkills = viewModel.state.selectedSkills

        // When
        viewModel.onSkillToggled("Plumbing")

        // Then
        assertTrue(viewModel.state.selectedSkills.contains("Plumbing"))
        assertEquals(initialSkills.size + 1, viewModel.state.selectedSkills.size)
    }

    @Test
    fun `onSkillToggled should remove skill when already selected`() {
        // Given
        viewModel.onSkillToggled("Plumbing")
        assertTrue(viewModel.state.selectedSkills.contains("Plumbing"))

        // When
        viewModel.onSkillToggled("Plumbing")

        // Then
        assertFalse(viewModel.state.selectedSkills.contains("Plumbing"))
    }

    @Test
    fun `onNextStep from Step 3 should show error when no skills selected`() {
        // Given - ARTISAN user at Step 3
        viewModel.onRoleSelected(UserRole.ARTISAN)
        setupValidSteps(0, 1, 2, 3)

        // When
        viewModel.onNextStep()

        // Then
        assertEquals(3, viewModel.state.currentStep)
        assertEquals("Please select at least one skill", viewModel.state.skillsError)
    }

    @Test
    fun `onNextStep from Step 3 should proceed when skills selected`() {
        // Given
        viewModel.onRoleSelected(UserRole.ARTISAN)
        setupValidSteps(0, 1, 2, 3)
        viewModel.onSkillToggled("Plumbing")

        // When
        viewModel.onNextStep()

        // Then
        assertEquals(4, viewModel.state.currentStep)
        assertNull(viewModel.state.skillsError)
    }

    // ========== Registration Submission Tests ==========

    @Test
    fun `onRegister should call use case with correct parameters for CLIENT`() = runTest {
        // Given
        setupCompleteClientRegistration()
        whenever(registerUseCase(any(), any(), any(), any(), any(), any(), any()))
            .thenReturn(Resource.success(createTestUser(UserRole.CLIENT)))

        // When
        viewModel.onRegister()
        testDispatcher.scheduler.advanceUntilIdle()

        // Then
        verify(registerUseCase).invoke(
            email = "test@example.com",
            password = "SecurePass123!",
            confirmPassword = "SecurePass123!",
            role = "CLIENT",
            firstName = "John",
            lastName = "Doe",
            phoneNumber = "0821234567"
        )
    }

    @Test
    fun `onRegister should call use case with correct parameters for ARTISAN`() = runTest {
        // Given
        setupCompleteArtisanRegistration()
        whenever(registerUseCase(any(), any(), any(), any(), any(), any(), any()))
            .thenReturn(Resource.success(createTestUser(UserRole.ARTISAN)))

        // When
        viewModel.onRegister()
        testDispatcher.scheduler.advanceUntilIdle()

        // Then
        verify(registerUseCase).invoke(
            email = "artisan@example.com",
            password = "SecurePass123!",
            confirmPassword = "SecurePass123!",
            role = "ARTISAN",
            firstName = "Jane",
            lastName = "Smith",
            phoneNumber = "0821234568"
        )
    }

    @Test
    fun `onRegister should show loading state during registration`() = runTest {
        // Given
        setupCompleteClientRegistration()
        whenever(registerUseCase(any(), any(), any(), any(), any(), any(), any()))
            .thenReturn(Resource.loading())

        // When
        viewModel.onRegister()

        // Then
        assertTrue(viewModel.state.isLoading)
    }

    @Test
    fun `onRegister should set success state on successful registration`() = runTest {
        // Given
        setupCompleteClientRegistration()
        val testUser = createTestUser(UserRole.CLIENT)
        whenever(registerUseCase(any(), any(), any(), any(), any(), any(), any()))
            .thenReturn(Resource.success(testUser))

        // When
        viewModel.onRegister()
        testDispatcher.scheduler.advanceUntilIdle()

        // Then
        assertFalse(viewModel.state.isLoading)
        assertTrue(viewModel.state.registrationSuccess)
        assertEquals(testUser.role, viewModel.state.userRole)
    }

    @Test
    fun `onRegister should set error state on registration failure`() = runTest {
        // Given
        setupCompleteClientRegistration()
        whenever(registerUseCase(any(), any(), any(), any(), any(), any(), any()))
            .thenReturn(Resource.error("Email already exists"))

        // When
        viewModel.onRegister()
        testDispatcher.scheduler.advanceUntilIdle()

        // Then
        assertFalse(viewModel.state.isLoading)
        assertFalse(viewModel.state.registrationSuccess)
        assertEquals("Email already exists", viewModel.state.error)
    }

    // ========== Navigation Tests ==========

    @Test
    fun `onPreviousStep should decrement step counter`() {
        // Given
        viewModel.onRoleSelected(UserRole.CLIENT)
        viewModel.onNextStep() // Step 1
        viewModel.onNextStep() // Would fail validation but sets attempt

        // When
        viewModel.onPreviousStep()

        // Then
        assertEquals(0, viewModel.state.currentStep)
    }

    @Test
    fun `onPreviousStep should not go below step 0`() {
        // Given
        assertEquals(0, viewModel.state.currentStep)

        // When
        viewModel.onPreviousStep()

        // Then
        assertEquals(0, viewModel.state.currentStep)
    }

    @Test
    fun `ARTISAN should skip from Step 3 back to Step 2 when going back`() {
        // Given - ARTISAN at Step 3
        viewModel.onRoleSelected(UserRole.ARTISAN)
        setupValidSteps(0, 1, 2, 3)

        // When
        viewModel.onPreviousStep()

        // Then
        assertEquals(2, viewModel.state.currentStep)
    }

    // ========== Edge Cases and Error Handling ==========

    @Test
    fun `state should preserve data when navigating between steps`() {
        // Given
        viewModel.onRoleSelected(UserRole.CLIENT)
        viewModel.onNextStep()
        viewModel.onEmailChanged("test@example.com")
        viewModel.onPasswordChanged("SecurePass123!")

        // When - Navigate back and forth
        viewModel.onPreviousStep()
        viewModel.onNextStep()

        // Then - Data should be preserved
        assertEquals("test@example.com", viewModel.state.email)
        assertEquals("SecurePass123!", viewModel.state.password)
    }

    @Test
    fun `error messages should clear when input changes`() {
        // Given - Trigger email error
        viewModel.onRoleSelected(UserRole.CLIENT)
        viewModel.onNextStep()
        viewModel.onNextStep() // Triggers validation errors
        assertNotNull(viewModel.state.emailError)

        // When
        viewModel.onEmailChanged("test@example.com")

        // Then
        assertNull(viewModel.state.emailError)
    }

    // ========== Helper Methods ==========

    private fun setupValidSteps(vararg steps: Int) {
        for (step in steps) {
            when (step) {
                0 -> {
                    if (viewModel.state.selectedRole == null) {
                        viewModel.onRoleSelected(UserRole.CLIENT)
                    }
                    viewModel.onNextStep()
                }
                1 -> {
                    viewModel.onEmailChanged("test@example.com")
                    viewModel.onPasswordChanged("SecurePass123!")
                    viewModel.onConfirmPasswordChanged("SecurePass123!")
                    viewModel.onNextStep()
                }
                2 -> {
                    viewModel.onFirstNameChanged("John")
                    viewModel.onLastNameChanged("Doe")
                    viewModel.onPhoneNumberChanged("0821234567")
                    if (step == steps.last()) return // Don't auto-advance if last step
                    viewModel.onNextStep()
                }
                3 -> {
                    viewModel.onSkillToggled("Plumbing")
                    if (step == steps.last()) return
                    viewModel.onNextStep()
                }
            }
        }
    }

    private fun setupCompleteClientRegistration() {
        viewModel.onRoleSelected(UserRole.CLIENT)
        viewModel.onEmailChanged("test@example.com")
        viewModel.onPasswordChanged("SecurePass123!")
        viewModel.onConfirmPasswordChanged("SecurePass123!")
        viewModel.onFirstNameChanged("John")
        viewModel.onLastNameChanged("Doe")
        viewModel.onPhoneNumberChanged("0821234567")
    }

    private fun setupCompleteArtisanRegistration() {
        viewModel.onRoleSelected(UserRole.ARTISAN)
        viewModel.onEmailChanged("artisan@example.com")
        viewModel.onPasswordChanged("SecurePass123!")
        viewModel.onConfirmPasswordChanged("SecurePass123!")
        viewModel.onFirstNameChanged("Jane")
        viewModel.onLastNameChanged("Smith")
        viewModel.onPhoneNumberChanged("0821234568")
        viewModel.onSkillToggled("Plumbing")
        viewModel.onSkillToggled("Electrical")
    }

    private fun createTestUser(role: UserRole) = User(
        id = "user_123",
        email = "test@example.com",
        role = role,
        verifiedAt = null,
        profile = null
    )
}
