package za.co.taska.presentation.screens.auth.login

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import za.co.taska.R
import za.co.taska.presentation.components.*
import za.co.taska.presentation.theme.Primary600

/**
 * Login screen with role-based navigation
 * Simple, accessible design optimized for low-educated users
 */
@Composable
fun LoginScreen(
    onNavigateToRegister: () -> Unit,
    onLoginSuccess: (userRole: za.co.taska.presentation.navigation.UserRole?) -> Unit,
    viewModel: LoginViewModel = hiltViewModel()
) {
    val state = viewModel.state

    LaunchedEffect(state.loginSuccess) {
        if (state.loginSuccess) {
            onLoginSuccess(state.userRole)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.height(48.dp))

        // Logo/Title
        Text(
            text = stringResource(R.string.app_name),
            style = MaterialTheme.typography.displayLarge,
            color = Primary600,
            fontWeight = FontWeight.Bold
        )

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = stringResource(R.string.login_welcome),
            style = MaterialTheme.typography.headlineMedium,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(48.dp))

        // Email field
        TaskaTextField(
            value = state.email,
            onValueChange = { viewModel.onEmailChanged(it) },
            label = stringResource(R.string.email),
            placeholder = stringResource(R.string.email_placeholder),
            keyboardType = KeyboardType.Email,
            isError = state.emailError != null,
            errorMessage = state.emailError,
            enabled = !state.isLoading
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Password field
        TaskaPasswordField(
            value = state.password,
            onValueChange = { viewModel.onPasswordChanged(it) },
            label = stringResource(R.string.password),
            placeholder = stringResource(R.string.password_placeholder),
            isError = state.passwordError != null,
            errorMessage = state.passwordError,
            enabled = !state.isLoading
        )

        Spacer(modifier = Modifier.height(32.dp))

        // Error message
        if (state.error != null) {
            ErrorMessage(
                message = state.error,
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(modifier = Modifier.height(16.dp))
        }

        // Login button
        TaskaButton(
            text = stringResource(R.string.login),
            onClick = { viewModel.onLoginClicked() },
            isLoading = state.isLoading,
            enabled = !state.isLoading,
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(24.dp))

        // Register link
        TextButton(
            onClick = onNavigateToRegister,
            enabled = !state.isLoading
        ) {
            Text(
                text = stringResource(R.string.no_account_register),
                style = MaterialTheme.typography.bodyLarge
            )
        }
    }
}
