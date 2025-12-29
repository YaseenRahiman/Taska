package za.co.taska.presentation.screens.admin.users

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import za.co.taska.domain.model.AdminUser
import za.co.taska.domain.model.UserFilter
import za.co.taska.domain.model.UserRole
import za.co.taska.domain.model.UserStatus
import za.co.taska.domain.usecase.admin.GetUsersUseCase
import javax.inject.Inject

/**
 * ViewModel for Admin Users Screen
 * Manages user listing with advanced filtering
 */
@HiltViewModel
class AdminUsersViewModel @Inject constructor(
    private val getUsersUseCase: GetUsersUseCase
) : ViewModel() {

    private val _state = MutableStateFlow(AdminUsersState())
    val state: StateFlow<AdminUsersState> = _state.asStateFlow()

    init {
        loadUsers()
    }

    fun loadUsers() {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }

            val filter = UserFilter(
                role = _state.value.selectedRole,
                status = _state.value.selectedStatus,
                isVerified = _state.value.verifiedFilter,
                searchQuery = _state.value.searchQuery.ifBlank { null }
            )

            getUsersUseCase(filter).fold(
                onSuccess = { users ->
                    _state.update {
                        it.copy(
                            users = users,
                            isLoading = false,
                            error = null
                        )
                    }
                },
                onFailure = { exception ->
                    _state.update {
                        it.copy(
                            isLoading = false,
                            error = exception.message ?: "Failed to load users"
                        )
                    }
                }
            )
        }
    }

    fun updateSearchQuery(query: String) {
        _state.update { it.copy(searchQuery = query) }
    }

    fun applyFilters() {
        loadUsers()
    }

    fun setRoleFilter(role: UserRole?) {
        _state.update { it.copy(selectedRole = role) }
        loadUsers()
    }

    fun setStatusFilter(status: UserStatus?) {
        _state.update { it.copy(selectedStatus = status) }
        loadUsers()
    }

    fun setVerifiedFilter(verified: Boolean?) {
        _state.update { it.copy(verifiedFilter = verified) }
        loadUsers()
    }

    fun clearFilters() {
        _state.update {
            it.copy(
                searchQuery = "",
                selectedRole = null,
                selectedStatus = null,
                verifiedFilter = null
            )
        }
        loadUsers()
    }

    fun clearError() {
        _state.update { it.copy(error = null) }
    }
}

/**
 * State for Admin Users Screen
 */
data class AdminUsersState(
    val isLoading: Boolean = true,
    val error: String? = null,
    val users: List<AdminUser> = emptyList(),
    val searchQuery: String = "",
    val selectedRole: UserRole? = null,
    val selectedStatus: UserStatus? = null,
    val verifiedFilter: Boolean? = null
) {
    val hasActiveFilters: Boolean
        get() = selectedRole != null || selectedStatus != null || verifiedFilter != null
}
