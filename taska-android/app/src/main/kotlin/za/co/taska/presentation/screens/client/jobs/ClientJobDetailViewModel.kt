package za.co.taska.presentation.screens.client.jobs

import androidx.lifecycle.SavedStateHandle
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
import za.co.taska.domain.usecase.bid.GetJobBidsUseCase
import za.co.taska.domain.usecase.jobs.GetJobByIdUseCase
import za.co.taska.domain.usecase.job.CancelJobUseCase
import javax.inject.Inject

/**
 * ViewModel for Client Job Detail screen
 * Loads job details and received bids for client's job
 */
@HiltViewModel
class ClientJobDetailViewModel @Inject constructor(
    private val getJobByIdUseCase: GetJobByIdUseCase,
    private val getJobBidsUseCase: GetJobBidsUseCase,
    private val cancelJobUseCase: CancelJobUseCase,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val jobId: String = checkNotNull(savedStateHandle["jobId"])

    private val _state = MutableStateFlow(ClientJobDetailState())
    val state: StateFlow<ClientJobDetailState> = _state.asStateFlow()

    init {
        loadJobDetails()
        loadBids()
    }

    private fun loadJobDetails() {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }

            when (val result = getJobByIdUseCase(jobId)) {
                is Resource.Success -> {
                    _state.update {
                        it.copy(
                            job = result.data,
                            isLoading = false
                        )
                    }
                }
                is Resource.Error -> {
                    _state.update {
                        it.copy(
                            isLoading = false,
                            error = result.message ?: "Failed to load job details"
                        )
                    }
                }
                is Resource.Loading -> {
                    _state.update { it.copy(isLoading = true) }
                }
            }
        }
    }

    private fun loadBids() {
        viewModelScope.launch {
            getJobBidsUseCase(jobId).collect { result ->
                result.onSuccess { bids ->
                    _state.update {
                        it.copy(
                            allBids = bids,
                            recentBids = bids.sortedByDescending { bid -> bid.createdAt }.take(3)
                        )
                    }
                }
            }
        }
    }

    fun cancelJob() {
        viewModelScope.launch {
            _state.update { it.copy(isCancelling = true, error = null) }

            cancelJobUseCase(jobId).fold(
                onSuccess = {
                    _state.update { it.copy(
                        isCancelling = false,
                        jobCancelled = true
                    ) }
                    loadJobDetails() // Reload to update status
                },
                onFailure = { error ->
                    _state.update { it.copy(
                        isCancelling = false,
                        error = error.message ?: "Failed to cancel job"
                    ) }
                }
            )
        }
    }

    fun clearError() {
        _state.update { it.copy(error = null) }
    }
}

/**
 * State for Client Job Detail screen
 */
data class ClientJobDetailState(
    val isLoading: Boolean = true,
    val isCancelling: Boolean = false,
    val error: String? = null,
    val job: Job? = null,
    val allBids: List<Bid> = emptyList(),
    val recentBids: List<Bid> = emptyList(),
    val jobCancelled: Boolean = false
)
