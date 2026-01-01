package za.co.taska.presentation.screens.artisan.bids

import androidx.lifecycle.SavedStateHandle
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
import za.co.taska.domain.usecase.bid.CreateBidUseCase
import za.co.taska.domain.usecase.jobs.GetJobByIdUseCase
import javax.inject.Inject

/**
 * ViewModel for Place Bid screen
 * Handles bid submission with validation
 */
@HiltViewModel
class PlaceBidViewModel @Inject constructor(
    private val getJobByIdUseCase: GetJobByIdUseCase,
    private val createBidUseCase: CreateBidUseCase,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val jobId: String = checkNotNull(savedStateHandle["jobId"])

    private val _state = MutableStateFlow(PlaceBidState())
    val state: StateFlow<PlaceBidState> = _state.asStateFlow()

    init {
        loadJob()
    }

    private fun loadJob() {
        viewModelScope.launch {
            _state.update { it.copy(isLoadingJob = true) }

            when (val result = getJobByIdUseCase(jobId)) {
                is Resource.Success -> {
                    _state.update {
                        it.copy(
                            job = result.data,
                            isLoadingJob = false
                        )
                    }
                }
                is Resource.Error -> {
                    _state.update {
                        it.copy(
                            isLoadingJob = false,
                            error = result.message
                        )
                    }
                }
                is Resource.Loading -> {
                    _state.update { it.copy(isLoadingJob = true) }
                }
            }
        }
    }

    fun onAmountChanged(amount: String) {
        // Only allow numbers and decimal point
        val filtered = amount.filter { it.isDigit() || it == '.' }

        _state.update {
            it.copy(
                amount = filtered,
                amountError = null
            )
        }
    }

    fun onEstimatedDaysChanged(days: String) {
        // Only allow numbers
        val filtered = days.filter { it.isDigit() }

        _state.update {
            it.copy(
                estimatedDays = filtered,
                estimatedDaysError = null
            )
        }
    }

    fun onMessageChanged(message: String) {
        _state.update {
            it.copy(
                message = message,
                messageError = null
            )
        }
    }

    fun submitBid() {
        if (!validateInputs()) {
            return
        }

        viewModelScope.launch {
            _state.update { it.copy(isSubmitting = true, error = null) }

            val result = createBidUseCase(
                jobId = jobId,
                amount = _state.value.amount.toDoubleOrNull() ?: 0.0,
                message = _state.value.message,
                estimatedDays = _state.value.estimatedDays.toIntOrNull() ?: 0,
                attachments = _state.value.attachments
            )

            when (result) {
                is Resource.Success<*> -> {
                    _state.update {
                        it.copy(
                            isSubmitting = false,
                            bidSubmitted = true
                        )
                    }
                }
                is Resource.Error -> {
                    _state.update {
                        it.copy(
                            isSubmitting = false,
                            error = result.message
                        )
                    }
                }
                is Resource.Loading<*> -> {
                    _state.update { it.copy(isSubmitting = true) }
                }
            }
        }
    }

    private fun validateInputs(): Boolean {
        var isValid = true

        // Validate amount
        val amount = _state.value.amount.toDoubleOrNull()
        if (amount == null || amount <= 0) {
            _state.update { it.copy(amountError = "Please enter a valid amount") }
            isValid = false
        } else if (_state.value.job != null && amount < _state.value.job!!.budget * 0.5) {
            _state.update { it.copy(amountError = "Amount seems too low for this job") }
            isValid = false
        } else if (_state.value.job != null && amount > _state.value.job!!.budget * 2) {
            _state.update { it.copy(amountError = "Amount seems too high for this job") }
            isValid = false
        }

        // Validate estimated days
        val days = _state.value.estimatedDays.toIntOrNull()
        if (days == null || days <= 0) {
            _state.update { it.copy(estimatedDaysError = "Please enter estimated days") }
            isValid = false
        } else if (days > 365) {
            _state.update { it.copy(estimatedDaysError = "Duration cannot exceed 365 days") }
            isValid = false
        }

        // Validate message
        if (_state.value.message.trim().length < 20) {
            _state.update { it.copy(messageError = "Please provide a detailed proposal (minimum 20 characters)") }
            isValid = false
        } else if (_state.value.message.trim().length > 2000) {
            _state.update { it.copy(messageError = "Proposal too long (maximum 2000 characters)") }
            isValid = false
        }

        return isValid
    }

    fun clearError() {
        _state.update { it.copy(error = null) }
    }
}

/**
 * State for Place Bid screen
 */
data class PlaceBidState(
    val job: Job? = null,
    val isLoadingJob: Boolean = false,
    val amount: String = "",
    val amountError: String? = null,
    val estimatedDays: String = "",
    val estimatedDaysError: String? = null,
    val message: String = "",
    val messageError: String? = null,
    val attachments: List<String> = emptyList(),
    val isSubmitting: Boolean = false,
    val error: String? = null,
    val bidSubmitted: Boolean = false
)
