package za.co.taska.presentation.screens.artisan.bids

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import za.co.taska.domain.model.Bid
import za.co.taska.domain.model.BidStatus
import za.co.taska.domain.model.Resource
import za.co.taska.domain.usecase.bid.GetMyBidsUseCase
import za.co.taska.domain.usecase.bid.WithdrawBidUseCase
import javax.inject.Inject

/**
 * ViewModel for Bids screen
 * Handles bid listing with tab filtering
 */
@HiltViewModel
class BidsViewModel @Inject constructor(
    private val getMyBidsUseCase: GetMyBidsUseCase,
    private val withdrawBidUseCase: WithdrawBidUseCase
) : ViewModel() {

    private val _state = MutableStateFlow(BidsState())
    val state: StateFlow<BidsState> = _state.asStateFlow()

    init {
        loadBids()
    }

    fun loadBids(refresh: Boolean = false) {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }

            when (val result = getMyBidsUseCase()) {
                is Resource.Success -> {
                    val bids = result.data ?: emptyList()
                    _state.update {
                        it.copy(
                            allBids = bids,
                            filteredBids = filterBidsByTab(bids, it.selectedTab),
                            isLoading = false,
                            error = null
                        )
                    }
                }
                is Resource.Error -> {
                    _state.update {
                        it.copy(
                            isLoading = false,
                            error = result.message ?: "Failed to load bids"
                        )
                    }
                }
                is Resource.Loading -> {
                    _state.update { it.copy(isLoading = true) }
                }
            }
        }
    }

    fun selectTab(tab: BidTab) {
        _state.update {
            it.copy(
                selectedTab = tab,
                filteredBids = filterBidsByTab(it.allBids, tab)
            )
        }
    }

    fun withdrawBid(bidId: String) {
        viewModelScope.launch {
            _state.update { it.copy(isWithdrawing = true) }

            when (val result = withdrawBidUseCase(bidId)) {
                is Resource.Success -> {
                    _state.update { it.copy(isWithdrawing = false) }
                    loadBids(refresh = true)
                }
                is Resource.Error -> {
                    _state.update {
                        it.copy(
                            isWithdrawing = false,
                            error = result.message ?: "Failed to withdraw bid"
                        )
                    }
                }
                is Resource.Loading -> {
                    _state.update { it.copy(isWithdrawing = true) }
                }
            }
        }
    }

    private fun filterBidsByTab(bids: List<Bid>, tab: BidTab): List<Bid> {
        return when (tab) {
            BidTab.ALL -> bids
            BidTab.PENDING -> bids.filter { it.status == BidStatus.PENDING }
            BidTab.ACCEPTED -> bids.filter { it.status == BidStatus.ACCEPTED }
            BidTab.REJECTED -> bids.filter { it.status == BidStatus.REJECTED }
            BidTab.WITHDRAWN -> bids.filter { it.status == BidStatus.WITHDRAWN }
        }
    }

    fun clearError() {
        _state.update { it.copy(error = null) }
    }
}

/**
 * State for Bids screen
 */
data class BidsState(
    val allBids: List<Bid> = emptyList(),
    val filteredBids: List<Bid> = emptyList(),
    val selectedTab: BidTab = BidTab.ALL,
    val isLoading: Boolean = false,
    val isWithdrawing: Boolean = false,
    val error: String? = null
)

/**
 * Bid tab filter options
 */
enum class BidTab {
    ALL,
    PENDING,
    ACCEPTED,
    REJECTED,
    WITHDRAWN
}
