package za.co.taska.presentation.screens.client.bids

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
import za.co.taska.domain.usecase.bid.GetJobBidsUseCase
import javax.inject.Inject

/**
 * ViewModel for View Bids screen
 * Displays all bids for a job with sorting options
 */
@HiltViewModel
class ViewBidsViewModel @Inject constructor(
    private val getJobBidsUseCase: GetJobBidsUseCase,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val jobId: String = checkNotNull(savedStateHandle["jobId"])

    private val _state = MutableStateFlow(ViewBidsState())
    val state: StateFlow<ViewBidsState> = _state.asStateFlow()

    init {
        loadBids()
    }

    fun loadBids(refresh: Boolean = false) {
        viewModelScope.launch {
            if (refresh) {
                _state.update { it.copy(isLoading = true, error = null) }
            }

            getJobBidsUseCase(jobId).collect { result ->
                result.fold(
                    onSuccess = { bids ->
                        _state.update {
                            it.copy(
                                allBids = bids,
                                sortedBids = sortBids(bids, it.sortBy),
                                isLoading = false,
                                error = null
                            )
                        }
                    },
                    onFailure = { error ->
                        _state.update {
                            it.copy(
                                isLoading = false,
                                error = error.message ?: "Failed to load bids"
                            )
                        }
                    }
                )
            }
        }
    }

    fun setSortBy(sortBy: BidSortBy) {
        _state.update {
            it.copy(
                sortBy = sortBy,
                sortedBids = sortBids(it.allBids, sortBy)
            )
        }
    }

    private fun sortBids(bids: List<Bid>, sortBy: BidSortBy): List<Bid> {
        return when (sortBy) {
            BidSortBy.AMOUNT_LOW -> bids.sortedBy { it.amount }
            BidSortBy.AMOUNT_HIGH -> bids.sortedByDescending { it.amount }
            BidSortBy.RECENT -> bids.sortedByDescending { it.createdAt }
            BidSortBy.DAYS_LOW -> bids.sortedBy { it.estimatedDays }
            BidSortBy.DAYS_HIGH -> bids.sortedByDescending { it.estimatedDays }
        }
    }

    fun clearError() {
        _state.update { it.copy(error = null) }
    }
}

/**
 * State for View Bids screen
 */
data class ViewBidsState(
    val isLoading: Boolean = true,
    val error: String? = null,
    val allBids: List<Bid> = emptyList(),
    val sortedBids: List<Bid> = emptyList(),
    val sortBy: BidSortBy = BidSortBy.RECENT
)

/**
 * Sorting options for bids
 */
enum class BidSortBy {
    AMOUNT_LOW,
    AMOUNT_HIGH,
    RECENT,
    DAYS_LOW,
    DAYS_HIGH
}
