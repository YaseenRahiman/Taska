package za.co.taska.presentation.screens.admin.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import za.co.taska.domain.model.DashboardMetrics
import za.co.taska.domain.usecase.admin.GetDashboardMetricsUseCase
import javax.inject.Inject

/**
 * ViewModel for Admin Dashboard
 * Manages platform-wide metrics and statistics
 */
@HiltViewModel
class AdminDashboardViewModel @Inject constructor(
    private val getDashboardMetricsUseCase: GetDashboardMetricsUseCase
) : ViewModel() {

    private val _state = MutableStateFlow(AdminDashboardState())
    val state: StateFlow<AdminDashboardState> = _state.asStateFlow()

    init {
        loadDashboardMetrics()
    }

    fun loadDashboardMetrics() {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }

            getDashboardMetricsUseCase().fold(
                onSuccess = { metrics ->
                    _state.update {
                        it.copy(
                            metrics = metrics,
                            isLoading = false,
                            error = null
                        )
                    }
                },
                onFailure = { exception ->
                    _state.update {
                        it.copy(
                            isLoading = false,
                            error = exception.message ?: "Failed to load dashboard metrics"
                        )
                    }
                }
            )
        }
    }

    fun clearError() {
        _state.update { it.copy(error = null) }
    }
}

/**
 * State for Admin Dashboard
 */
data class AdminDashboardState(
    val isLoading: Boolean = true,
    val error: String? = null,
    val metrics: DashboardMetrics = DashboardMetrics()
)
