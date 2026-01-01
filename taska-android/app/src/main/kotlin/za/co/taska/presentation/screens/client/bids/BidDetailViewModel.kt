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
import za.co.taska.domain.usecase.bid.AcceptBidUseCase
import za.co.taska.domain.usecase.bid.GetBidByIdUseCase
import za.co.taska.domain.usecase.bid.RejectBidUseCase
import javax.inject.Inject

/**
 * ViewModel for Bid Detail screen
 * Manages bid details and accept/reject actions
 */
@HiltViewModel
class BidDetailViewModel @Inject constructor(
    private val getBidByIdUseCase: GetBidByIdUseCase,
    private val acceptBidUseCase: AcceptBidUseCase,
    private val rejectBidUseCase: RejectBidUseCase,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val bidId: String = checkNotNull(savedStateHandle["bidId"])

    private val _state = MutableStateFlow(BidDetailState())
    val state: StateFlow<BidDetailState> = _state.asStateFlow()

    init {
        loadBidDetails()
    }

    private fun loadBidDetails() {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }

            getBidByIdUseCase(bidId).fold(
                onSuccess = { bid ->
                    _state.update {
                        it.copy(
                            bid = bid,
                            isLoading = false
                        )
                    }
                },
                onFailure = { error ->
                    _state.update {
                        it.copy(
                            isLoading = false,
                            error = error.message ?: "Failed to load bid details"
                        )
                    }
                }
            )
        }
    }

    fun acceptBid() {
        viewModelScope.launch {
            _state.update { it.copy(isAccepting = true, error = null) }

            acceptBidUseCase(bidId).fold(
                onSuccess = {
                    _state.update {
                        it.copy(
                            isAccepting = false,
                            bidAccepted = true
                        )
                    }
                    loadBidDetails() // Reload to update status
                },
                onFailure = { error ->
                    _state.update {
                        it.copy(
                            isAccepting = false,
                            error = error.message ?: "Failed to accept bid"
                        )
                    }
                }
            )
        }
    }

    fun rejectBid() {
        viewModelScope.launch {
            _state.update { it.copy(isRejecting = true, error = null) }

            rejectBidUseCase(bidId).fold(
                onSuccess = {
                    _state.update {
                        it.copy(
                            isRejecting = false,
                            bidRejected = true
                        )
                    }
                    loadBidDetails() // Reload to update status
                },
                onFailure = { error ->
                    _state.update {
                        it.copy(
                            isRejecting = false,
                            error = error.message ?: "Failed to reject bid"
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
 * State for Bid Detail screen
 */
data class BidDetailState(
    val isLoading: Boolean = true,
    val isAccepting: Boolean = false,
    val isRejecting: Boolean = false,
    val error: String? = null,
    val bid: Bid? = null,
    val bidAccepted: Boolean = false,
    val bidRejected: Boolean = false
)
