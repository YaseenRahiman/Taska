package za.co.taska.presentation.screens.artisan.jobs

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import za.co.taska.domain.model.*
import za.co.taska.domain.usecase.jobs.GetNearbyJobsUseCase
import za.co.taska.domain.usecase.jobs.GetJobByIdUseCase
import javax.inject.Inject

/**
 * ViewModel for Jobs browsing screen
 * Handles job listing, filtering, and sorting
 */
@HiltViewModel
class JobsViewModel @Inject constructor(
    private val getNearbyJobsUseCase: GetNearbyJobsUseCase,
    private val getJobByIdUseCase: GetJobByIdUseCase
) : ViewModel() {

    private val _state = MutableStateFlow(JobsState())
    val state: StateFlow<JobsState> = _state.asStateFlow()

    init {
        loadJobs()
    }

    fun loadJobs(refresh: Boolean = false) {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }

            when (val result = getNearbyJobsUseCase(
                latitude = _state.value.userLocation?.first ?: 0.0,
                longitude = _state.value.userLocation?.second ?: 0.0,
                radius = _state.value.filters.maxDistance?.toInt() ?: 25
            )) {
                is Resource.Success<*> -> {
                    val jobs: List<Job> = result.data as? List<Job> ?: emptyList()
                    _state.update {
                        it.copy(
                            jobs = jobs,
                            filteredJobs = applyFilters(jobs),
                            isLoading = false,
                            error = null
                        )
                    }
                }
                is Resource.Error -> {
                    _state.update {
                        it.copy(
                            isLoading = false,
                            error = result.message
                        )
                    }
                }
                is Resource.Loading<*> -> {
                    _state.update { it.copy(isLoading = true) }
                }
            }
        }
    }

    fun updateFilters(filters: JobFilters) {
        _state.update {
            it.copy(
                filters = filters,
                filteredJobs = applyFilters(it.jobs),
                showFilterSheet = false
            )
        }
    }

    fun toggleFilterSheet() {
        _state.update { it.copy(showFilterSheet = !it.showFilterSheet) }
    }

    fun updateSearchQuery(query: String) {
        _state.update {
            it.copy(
                searchQuery = query,
                filteredJobs = applyFilters(it.jobs)
            )
        }
    }

    fun updateUserLocation(latitude: Double, longitude: Double) {
        _state.update { it.copy(userLocation = Pair(latitude, longitude)) }
        loadJobs(refresh = true)
    }

    private fun applyFilters(jobs: List<Job>): List<Job> {
        var filtered = jobs

        // Search query filter
        val query = _state.value.searchQuery.trim()
        if (query.isNotEmpty()) {
            filtered = filtered.filter {
                it.title.contains(query, ignoreCase = true) ||
                it.description.contains(query, ignoreCase = true) ||
                it.category?.name?.contains(query, ignoreCase = true) == true
            }
        }

        // Category filter
        val selectedCategories = _state.value.filters.selectedCategories
        if (selectedCategories.isNotEmpty()) {
            filtered = filtered.filter { job ->
                selectedCategories.contains(job.categoryId)
            }
        }

        // Distance filter
        val maxDistance = _state.value.filters.maxDistance
        if (maxDistance != null) {
            filtered = filtered.filter { job ->
                (job.distance ?: Double.MAX_VALUE) <= maxDistance
            }
        }

        // Budget filter
        val budgetRange = _state.value.filters.budgetRange
        if (budgetRange != null) {
            filtered = filtered.filter { job ->
                job.budget >= budgetRange.first && job.budget <= budgetRange.second
            }
        }

        // Urgency filter
        val urgencyLevels = _state.value.filters.urgencyLevels
        if (urgencyLevels.isNotEmpty()) {
            filtered = filtered.filter { job ->
                urgencyLevels.contains(job.urgency)
            }
        }

        // Verified clients only
        if (_state.value.filters.verifiedClientsOnly) {
            filtered = filtered.filter { job ->
                job.client?.rating != null && (job.client.rating ?: 0.0) >= 4.0
            }
        }

        // Sorting
        filtered = when (_state.value.filters.sortBy) {
            JobSortOption.DISTANCE -> filtered.sortedBy { it.distance ?: Double.MAX_VALUE }
            JobSortOption.BUDGET_HIGH -> filtered.sortedByDescending { it.budget }
            JobSortOption.BUDGET_LOW -> filtered.sortedBy { it.budget }
            JobSortOption.RECENT -> filtered.sortedByDescending { it.createdAt }
            JobSortOption.URGENCY -> filtered.sortedByDescending { it.urgency.ordinal }
        }

        return filtered
    }
}

/**
 * State for Jobs screen
 */
data class JobsState(
    val jobs: List<Job> = emptyList(),
    val filteredJobs: List<Job> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val searchQuery: String = "",
    val filters: JobFilters = JobFilters(),
    val showFilterSheet: Boolean = false,
    val userLocation: Pair<Double, Double>? = null
)

/**
 * Job filters configuration
 */
data class JobFilters(
    val selectedCategories: Set<String> = emptySet(),
    val maxDistance: Double? = null,
    val budgetRange: Pair<Double, Double>? = null,
    val urgencyLevels: Set<UrgencyLevel> = emptySet(),
    val verifiedClientsOnly: Boolean = false,
    val sortBy: JobSortOption = JobSortOption.DISTANCE
)

/**
 * Job sorting options
 */
enum class JobSortOption {
    DISTANCE,
    BUDGET_HIGH,
    BUDGET_LOW,
    RECENT,
    URGENCY
}
