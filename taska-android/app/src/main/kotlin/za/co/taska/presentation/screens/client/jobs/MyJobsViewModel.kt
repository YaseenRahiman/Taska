package za.co.taska.presentation.screens.client.jobs

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import za.co.taska.domain.model.Job
import za.co.taska.domain.model.JobStatus
import za.co.taska.domain.model.Resource
import za.co.taska.domain.usecase.bid.GetJobBidsUseCase
import za.co.taska.domain.usecase.job.GetMyJobsUseCase
import javax.inject.Inject

/**
 * ViewModel for My Jobs screen
 * Manages client's jobs with tab filtering by status
 */
@HiltViewModel
class MyJobsViewModel @Inject constructor(
    private val getMyJobsUseCase: GetMyJobsUseCase,
    private val getJobBidsUseCase: GetJobBidsUseCase
) : ViewModel() {

    private val _state = MutableStateFlow(MyJobsState())
    val state: StateFlow<MyJobsState> = _state.asStateFlow()

    init {
        loadJobs()
    }

    fun loadJobs(refresh: Boolean = false) {
        viewModelScope.launch {
            if (refresh) {
                _state.update { it.copy(isLoading = true, error = null) }
            }

            getMyJobsUseCase(status = null).collect { resource ->
                when (resource) {
                    is Resource.Loading -> {
                        if (!refresh) {
                            _state.update { it.copy(isLoading = true) }
                        }
                    }
                    is Resource.Success -> {
                        val jobs = resource.data ?: emptyList()
                        _state.update {
                            it.copy(
                                allJobs = jobs,
                                filteredJobs = filterJobsByTab(jobs, it.selectedTab),
                                isLoading = false,
                                error = null
                            )
                        }
                        // Load bid counts for each job
                        loadBidCounts(jobs)
                    }
                    is Resource.Error -> {
                        _state.update {
                            it.copy(
                                isLoading = false,
                                error = resource.message ?: "Failed to load jobs"
                            )
                        }
                    }
                }
            }
        }
    }

    fun selectTab(tab: JobTab) {
        _state.update {
            it.copy(
                selectedTab = tab,
                filteredJobs = filterJobsByTab(it.allJobs, tab)
            )
        }
    }

    private fun filterJobsByTab(jobs: List<Job>, tab: JobTab): List<Job> {
        return when (tab) {
            JobTab.ALL -> jobs
            JobTab.OPEN -> jobs.filter { it.status == JobStatus.OPEN }
            JobTab.IN_PROGRESS -> jobs.filter { it.status == JobStatus.IN_PROGRESS }
            JobTab.COMPLETED -> jobs.filter { it.status == JobStatus.COMPLETED }
            JobTab.CANCELLED -> jobs.filter { it.status == JobStatus.CANCELLED }
        }
    }

    private fun loadBidCounts(jobs: List<Job>) {
        viewModelScope.launch {
            val bidCounts = mutableMapOf<String, Int>()
            jobs.forEach { job ->
                getJobBidsUseCase(job.id).collect { result ->
                    result.onSuccess { bids ->
                        bidCounts[job.id] = bids.size
                        _state.update { it.copy(bidCounts = bidCounts) }
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
 * State for My Jobs screen
 */
data class MyJobsState(
    val isLoading: Boolean = true,
    val error: String? = null,
    val allJobs: List<Job> = emptyList(),
    val filteredJobs: List<Job> = emptyList(),
    val bidCounts: Map<String, Int> = emptyMap(),
    val selectedTab: JobTab = JobTab.ALL
)

/**
 * Job tabs for filtering by status
 */
enum class JobTab {
    ALL,
    OPEN,
    IN_PROGRESS,
    COMPLETED,
    CANCELLED
}
