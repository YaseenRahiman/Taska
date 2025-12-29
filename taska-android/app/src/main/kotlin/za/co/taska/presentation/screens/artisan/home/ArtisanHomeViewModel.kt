package za.co.taska.presentation.screens.artisan.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import za.co.taska.domain.model.Bid
import za.co.taska.domain.model.Job
import za.co.taska.domain.model.Resource
import za.co.taska.domain.usecase.bid.GetMyBidsUseCase
import za.co.taska.domain.usecase.jobs.GetNearbyJobsUseCase
import javax.inject.Inject

/**
 * ViewModel for artisan home screen
 * Manages dashboard state and displays key metrics
 */
@HiltViewModel
class ArtisanHomeViewModel @Inject constructor(
    private val getNearbyJobsUseCase: GetNearbyJobsUseCase,
    private val getMyBidsUseCase: GetMyBidsUseCase
) : ViewModel() {

    private val _state = MutableStateFlow(ArtisanHomeState())
    val state: StateFlow<ArtisanHomeState> = _state.asStateFlow()

    init {
        loadDashboardData()
    }

    fun loadDashboardData() {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }

            // Load nearby jobs (use default location if not available)
            val jobsResult = getNearbyJobsUseCase(
                latitude = 0.0,  // TODO: Get actual user location
                longitude = 0.0,
                radius = 25
            )

            // Load my bids
            val bidsResult = getMyBidsUseCase()

            // Update state based on results
            when {
                jobsResult is Resource.Success<*> && bidsResult is Resource.Success<*> -> {
                    val jobs: List<Job> = jobsResult.data as? List<Job> ?: emptyList()
                    val bids: List<Bid> = bidsResult.data as? List<Bid> ?: emptyList()

                    _state.update {
                        it.copy(
                            nearbyJobs = jobs.take(5), // Show top 5
                            recentBids = bids.sortedByDescending { bid -> bid.createdAt }.take(3),
                            stats = DashboardStats(
                                nearbyJobsCount = jobs.size,
                                pendingBidsCount = bids.count { bid -> bid.status.name == "PENDING" },
                                acceptedBidsCount = bids.count { bid -> bid.status.name == "ACCEPTED" },
                                totalBids = bids.size
                            ),
                            isLoading = false,
                            error = null
                        )
                    }
                }
                jobsResult is Resource.Error -> {
                    _state.update {
                        it.copy(
                            isLoading = false,
                            error = jobsResult.message ?: "Failed to load dashboard data"
                        )
                    }
                }
                bidsResult is Resource.Error -> {
                    _state.update {
                        it.copy(
                            isLoading = false,
                            error = bidsResult.message ?: "Failed to load bids"
                        )
                    }
                }
                else -> {
                    _state.update { it.copy(isLoading = true) }
                }
            }
        }
    }
}

/**
 * State for Artisan Home screen
 */
data class ArtisanHomeState(
    val isLoading: Boolean = true,
    val error: String? = null,
    val nearbyJobs: List<Job> = emptyList(),
    val recentBids: List<Bid> = emptyList(),
    val stats: DashboardStats = DashboardStats()
)

/**
 * Dashboard statistics
 */
data class DashboardStats(
    val nearbyJobsCount: Int = 0,
    val pendingBidsCount: Int = 0,
    val acceptedBidsCount: Int = 0,
    val totalBids: Int = 0
)
