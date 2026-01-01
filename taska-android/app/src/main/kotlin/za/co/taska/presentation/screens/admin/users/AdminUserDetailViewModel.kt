package za.co.taska.presentation.screens.admin.users

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import za.co.taska.domain.model.AdminUser
import za.co.taska.domain.model.UserActionType
import za.co.taska.domain.usecase.admin.*
import javax.inject.Inject

/**
 * ViewModel for Admin User Detail Screen
 * Manages user details and admin actions (ban, suspend, verify)
 */
@HiltViewModel
class AdminUserDetailViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val getUserDetailsUseCase: GetUserDetailsUseCase,
    private val banUserUseCase: BanUserUseCase,
    private val suspendUserUseCase: SuspendUserUseCase,
    private val verifyArtisanUseCase: VerifyArtisanUseCase
) : ViewModel() {

    private val userId: String = checkNotNull(savedStateHandle["userId"])

    private val _state = MutableStateFlow(AdminUserDetailState())
    val state: StateFlow<AdminUserDetailState> = _state.asStateFlow()

    init {
        loadUserDetails()
    }

    fun loadUserDetails() {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }

            getUserDetailsUseCase(userId).fold(
                onSuccess = { user ->
                    _state.update {
                        it.copy(
                            user = user,
                            isLoading = false,
                            error = null
                        )
                    }
                },
                onFailure = { exception ->
                    _state.update {
                        it.copy(
                            isLoading = false,
                            error = exception.message ?: "Failed to load user details"
                        )
                    }
                }
            )
        }
    }

    fun banUser(reason: String) {
        viewModelScope.launch {
            _state.update { it.copy(isPerformingAction = true, actionError = null) }

            banUserUseCase(userId, reason).fold(
                onSuccess = {
                    _state.update {
                        it.copy(
                            actionSuccess = UserActionType.BAN,
                            isPerformingAction = false
                        )
                    }
                    // Reload user details to reflect changes
                    loadUserDetails()
                },
                onFailure = { exception ->
                    _state.update {
                        it.copy(
                            isPerformingAction = false,
                            actionError = exception.message ?: "Failed to ban user"
                        )
                    }
                }
            )
        }
    }

    fun suspendUser(reason: String, suspendUntil: String?) {
        viewModelScope.launch {
            _state.update { it.copy(isPerformingAction = true, actionError = null) }

            suspendUserUseCase(userId, reason, suspendUntil).fold(
                onSuccess = {
                    _state.update {
                        it.copy(
                            actionSuccess = UserActionType.SUSPEND,
                            isPerformingAction = false
                        )
                    }
                    // Reload user details to reflect changes
                    loadUserDetails()
                },
                onFailure = { exception ->
                    _state.update {
                        it.copy(
                            isPerformingAction = false,
                            actionError = exception.message ?: "Failed to suspend user"
                        )
                    }
                }
            )
        }
    }

    fun verifyArtisan() {
        viewModelScope.launch {
            _state.update { it.copy(isPerformingAction = true, actionError = null) }

            verifyArtisanUseCase(userId).fold(
                onSuccess = {
                    _state.update {
                        it.copy(
                            actionSuccess = UserActionType.VERIFY,
                            isPerformingAction = false
                        )
                    }
                    // Reload user details to reflect changes
                    loadUserDetails()
                },
                onFailure = { exception ->
                    _state.update {
                        it.copy(
                            isPerformingAction = false,
                            actionError = exception.message ?: "Failed to verify artisan"
                        )
                    }
                }
            )
        }
    }

    fun clearActionSuccess() {
        _state.update { it.copy(actionSuccess = null) }
    }

    fun clearActionError() {
        _state.update { it.copy(actionError = null) }
    }
}

/**
 * State for Admin User Detail Screen
 */
data class AdminUserDetailState(
    val isLoading: Boolean = true,
    val error: String? = null,
    val user: AdminUser? = null,
    val isPerformingAction: Boolean = false,
    val actionError: String? = null,
    val actionSuccess: UserActionType? = null
)
