package za.co.taska.presentation.screens.client.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import za.co.taska.domain.model.Job
import za.co.taska.domain.model.Resource
import za.co.taska.domain.usecase.bid.GetJobBidsUseCase
import za.co.taska.domain.usecase.job.GetMyJobsUseCase
import javax.inject.Inject

/**
 * ViewModel for Client Home screen
 * Manages dashboard state with jobs and bids statistics
 */
@HiltViewModel
class ClientHomeViewModel @Inject constructor(
    private val getMyJobsUseCase: GetMyJobsUseCase,
    private val getJobBidsUseCase: GetJobBidsUseCase
) : ViewModel() {

    private val _state = MutableStateFlow(ClientHomeState())
    val state: StateFlow<ClientHomeState> = _state.asStateFlow()

    init {
        loadDashboardData()
    }

    fun loadDashboardData() {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }

            // Load client's jobs
            getMyJobsUseCase(status = null).collect { resource ->
                when (resource) {
                    is Resource.Success -> {
                        val jobs = resource.data ?: emptyList()

                        _state.update {
                            it.copy(
                                recentJobs = jobs.sortedByDescending { job -> job.createdAt }.take(3),
                                stats = DashboardStats(
                                    activeJobsCount = jobs.count { job ->
                                        job.status.name == "OPEN" || job.status.name == "IN_PROGRESS"
                                    },
                                    totalJobsCount = jobs.size,
                                    totalBidsReceived = 0 // Will be updated when we load bids
                                ),
                                isLoading = false,
                                error = null
                            )
                        }

                        // Load bid counts for jobs
                        loadBidCounts(jobs)
                    }
                    is Resource.Error -> {
                        _state.update {
                            it.copy(
                                isLoading = false,
                                error = resource.message ?: "Failed to load dashboard data"
                            )
                        }
                    }
                    is Resource.Loading -> {
                        _state.update { it.copy(isLoading = true) }
                    }
                }
            }
        }
    }

    private fun loadBidCounts(jobs: List<Job>) {
        viewModelScope.launch {
            var totalBids = 0
            val bidCounts = mutableMapOf<String, Int>()

            jobs.forEach { job ->
                getJobBidsUseCase(job.id).collect { result ->
                    result.onSuccess { bids ->
                        bidCounts[job.id] = bids.size
                        totalBids += bids.size

                        _state.update {
                            it.copy(
                                bidCounts = bidCounts,
                                stats = it.stats.copy(totalBidsReceived = totalBids)
                            )
                        }
                    }
                }
            }
        }
    }

    fun clearError() {
        _state.update { it.copy(error = null) }
    }
}

/**
 * State for Client Home screen
 */
data class ClientHomeState(
    val isLoading: Boolean = true,
    val error: String? = null,
    val recentJobs: List<Job> = emptyList(),
    val bidCounts: Map<String, Int> = emptyMap(),
    val stats: DashboardStats = DashboardStats()
)

/**
 * Dashboard statistics for client
 */
data class DashboardStats(
    val activeJobsCount: Int = 0,
    val totalJobsCount: Int = 0,
    val totalBidsReceived: Int = 0
)
