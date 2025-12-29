package za.co.taska.presentation.screens.auth.register

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Work
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import za.co.taska.R
import za.co.taska.presentation.components.*
import za.co.taska.presentation.navigation.UserRole
import za.co.taska.presentation.theme.Primary600

/**
 * Multi-step registration screen supporting CLIENT and ARTISAN roles
 * Dynamic step flow based on selected role
 */
@Composable
fun RegisterScreen(
    onNavigateBack: () -> Unit,
    onNavigateToLogin: () -> Unit,
    onRegistrationSuccess: (String) -> Unit,
    viewModel: RegisterViewModel = hiltViewModel()
) {
    val state = viewModel.state

    LaunchedEffect(state.registrationSuccess) {
        if (state.registrationSuccess) {
            onRegistrationSuccess(state.email)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.height(32.dp))

        // Header
        Text(
            text = stringResource(R.string.register_welcome),
            style = MaterialTheme.typography.displayMedium,
            color = Primary600,
            fontWeight = FontWeight.Bold
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = stringResource(R.string.register_subtitle),
            style = MaterialTheme.typography.bodyLarge,
            textAlign = TextAlign.Center,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(modifier = Modifier.height(32.dp))

        // Step indicator
        StepIndicator(
            currentStep = state.currentStep,
            totalSteps = state.getTotalSteps()
        )

        Spacer(modifier = Modifier.height(32.dp))

        // Step content
        when (state.currentStep) {
            0 -> Step0RoleSelection(viewModel, state)
            1 -> Step1PersonalDetails(viewModel, state)
            2 -> Step2ContactInfo(viewModel, state)
            3 -> Step3SkillsExperience(viewModel, state)
            4 -> Step4CreateAccount(viewModel, state)
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Error message
        if (state.error != null) {
            ErrorMessage(
                message = state.error,
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(modifier = Modifier.height(16.dp))
        }

        // Navigation buttons
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Previous button
            if (state.currentStep > 0) {
                TaskaButton(
                    text = stringResource(R.string.previous),
                    onClick = { viewModel.previousStep() },
                    variant = ButtonVariant.Outline,
                    enabled = !state.isLoading,
                    modifier = Modifier.weight(1f)
                )
            }

            // Next/Finish button
            TaskaButton(
                text = if (state.currentStep == 4) {
                    stringResource(R.string.finish)
                } else {
                    stringResource(R.string.next)
                },
                onClick = { viewModel.nextStep() },
                isLoading = state.isLoading,
                enabled = !state.isLoading,
                modifier = Modifier.weight(1f)
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Login link
        TextButton(
            onClick = onNavigateToLogin,
            enabled = !state.isLoading
        ) {
            Text(
                text = stringResource(R.string.already_have_account),
                style = MaterialTheme.typography.bodyLarge
            )
        }
    }
}

@Composable
private fun Step0RoleSelection(
    viewModel: RegisterViewModel,
    state: RegisterState
) {
    Column {
        Text(
            text = "Choose Your Account Type",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = "Select how you want to use Taska",
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(modifier = Modifier.height(24.dp))

        // CLIENT card
        RoleSelectionCard(
            role = UserRole.CLIENT,
            title = "I Need Services",
            description = "Post jobs and hire skilled artisans for your projects",
            icon = Icons.Default.Person,
            isSelected = state.selectedRole == UserRole.CLIENT,
            onClick = { viewModel.onRoleSelected(UserRole.CLIENT) }
        )

        Spacer(modifier = Modifier.height(16.dp))

        // ARTISAN card
        RoleSelectionCard(
            role = UserRole.ARTISAN,
            title = "I Provide Services",
            description = "Offer your skills and find work opportunities",
            icon = Icons.Default.Work,
            isSelected = state.selectedRole == UserRole.ARTISAN,
            onClick = { viewModel.onRoleSelected(UserRole.ARTISAN) }
        )

        // Error message
        if (state.roleError != null) {
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = state.roleError,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.error
            )
        }
    }
}

@Composable
private fun RoleSelectionCard(
    role: UserRole,
    title: String,
    description: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = MaterialTheme.shapes.medium,
        colors = CardDefaults.cardColors(
            containerColor = if (isSelected) {
                Primary600.copy(alpha = 0.1f)
            } else {
                MaterialTheme.colorScheme.surface
            }
        ),
        border = BorderStroke(
            width = 2.dp,
            color = if (isSelected) Primary600 else MaterialTheme.colorScheme.outline
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Icon
            Surface(
                shape = MaterialTheme.shapes.medium,
                color = if (isSelected) {
                    Primary600
                } else {
                    MaterialTheme.colorScheme.surfaceVariant
                },
                modifier = Modifier.size(56.dp)
            ) {
                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier.fillMaxSize()
                ) {
                    Icon(
                        imageVector = icon,
                        contentDescription = title,
                        tint = if (isSelected) {
                            MaterialTheme.colorScheme.onPrimary
                        } else {
                            MaterialTheme.colorScheme.onSurfaceVariant
                        },
                        modifier = Modifier.size(32.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.width(16.dp))

            // Text content
            Column(
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = if (isSelected) Primary600 else MaterialTheme.colorScheme.onSurface
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = description,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            // Selection indicator
            if (isSelected) {
                Icon(
                    imageVector = Icons.Default.CheckCircle,
                    contentDescription = "Selected",
                    tint = Primary600,
                    modifier = Modifier.size(28.dp)
                )
            }
        }
    }
}

@Composable
private fun StepIndicator(
    currentStep: Int,
    totalSteps: Int
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        repeat(totalSteps) { step ->
            val isActive = step + 1 <= currentStep
            Surface(
                modifier = Modifier
                    .size(if (step + 1 == currentStep) 16.dp else 12.dp),
                shape = MaterialTheme.shapes.small,
                color = if (isActive) Primary600 else MaterialTheme.colorScheme.surfaceVariant
            ) {}

            if (step < totalSteps - 1) {
                Spacer(modifier = Modifier.width(8.dp))
            }
        }
    }

    Spacer(modifier = Modifier.height(8.dp))

    Text(
        text = stringResource(R.string.step_indicator, currentStep, totalSteps),
        style = MaterialTheme.typography.bodyMedium,
        color = MaterialTheme.colorScheme.onSurfaceVariant
    )
}

@Composable
private fun Step1PersonalDetails(
    viewModel: RegisterViewModel,
    state: RegisterState
) {
    Column {
        Text(
            text = stringResource(R.string.step_1_title),
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = stringResource(R.string.step_1_subtitle),
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(modifier = Modifier.height(24.dp))

        TaskaTextField(
            value = state.firstName,
            onValueChange = { viewModel.onFirstNameChanged(it) },
            label = stringResource(R.string.first_name),
            isError = state.firstNameError != null,
            errorMessage = state.firstNameError,
            enabled = !state.isLoading
        )

        Spacer(modifier = Modifier.height(16.dp))

        TaskaTextField(
            value = state.lastName,
            onValueChange = { viewModel.onLastNameChanged(it) },
            label = stringResource(R.string.last_name),
            isError = state.lastNameError != null,
            errorMessage = state.lastNameError,
            enabled = !state.isLoading
        )
    }
}

@Composable
private fun Step2ContactInfo(
    viewModel: RegisterViewModel,
    state: RegisterState
) {
    Column {
        Text(
            text = stringResource(R.string.step_2_title),
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = stringResource(R.string.step_2_subtitle),
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(modifier = Modifier.height(24.dp))

        TaskaTextField(
            value = state.email,
            onValueChange = { viewModel.onEmailChanged(it) },
            label = stringResource(R.string.email),
            placeholder = stringResource(R.string.email_placeholder),
            isError = state.emailError != null,
            errorMessage = state.emailError,
            enabled = !state.isLoading
        )

        Spacer(modifier = Modifier.height(16.dp))

        TaskaTextField(
            value = state.phoneNumber,
            onValueChange = { viewModel.onPhoneNumberChanged(it) },
            label = stringResource(R.string.phone_number),
            placeholder = "0XX XXX XXXX",
            isError = state.phoneNumberError != null,
            errorMessage = state.phoneNumberError,
            enabled = !state.isLoading
        )
    }
}

@Composable
private fun Step3SkillsExperience(
    viewModel: RegisterViewModel,
    state: RegisterState
) {
    Column {
        Text(
            text = stringResource(R.string.step_3_title),
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = stringResource(R.string.step_3_subtitle),
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(modifier = Modifier.height(24.dp))

        Text(
            text = stringResource(R.string.select_skills),
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Medium
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Skills will be shown after categories are fetched
        // For now, show a placeholder
        Text(
            text = "Skills selection will be available after backend integration",
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(modifier = Modifier.height(16.dp))

        TaskaTextField(
            value = state.bio,
            onValueChange = { viewModel.onBioChanged(it) },
            label = stringResource(R.string.bio),
            placeholder = stringResource(R.string.bio_placeholder),
            maxLines = 4,
            singleLine = false,
            enabled = !state.isLoading
        )
    }
}

@Composable
private fun Step4CreateAccount(
    viewModel: RegisterViewModel,
    state: RegisterState
) {
    Column {
        Text(
            text = stringResource(R.string.step_4_title),
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = stringResource(R.string.step_4_subtitle),
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(modifier = Modifier.height(24.dp))

        TaskaPasswordField(
            value = state.password,
            onValueChange = { viewModel.onPasswordChanged(it) },
            label = stringResource(R.string.password),
            placeholder = stringResource(R.string.password_placeholder),
            isError = state.passwordError != null,
            errorMessage = state.passwordError,
            enabled = !state.isLoading
        )

        Spacer(modifier = Modifier.height(16.dp))

        TaskaPasswordField(
            value = state.confirmPassword,
            onValueChange = { viewModel.onConfirmPasswordChanged(it) },
            label = stringResource(R.string.confirm_password),
            placeholder = stringResource(R.string.password_placeholder),
            isError = state.confirmPasswordError != null,
            errorMessage = state.confirmPasswordError,
            enabled = !state.isLoading
        )
    }
}
