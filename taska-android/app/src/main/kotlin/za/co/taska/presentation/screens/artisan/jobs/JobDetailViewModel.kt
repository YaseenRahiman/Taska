package za.co.taska.presentation.screens.artisan.jobs

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
import za.co.taska.domain.usecase.jobs.GetJobByIdUseCase
import javax.inject.Inject

/**
 * ViewModel for Job Detail screen
 * Handles loading and displaying full job information
 */
@HiltViewModel
class JobDetailViewModel @Inject constructor(
    private val getJobByIdUseCase: GetJobByIdUseCase,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val jobId: String = checkNotNull(savedStateHandle["jobId"])

    private val _state = MutableStateFlow(JobDetailState())
    val state: StateFlow<JobDetailState> = _state.asStateFlow()

    init {
        loadJobDetails()
    }

    fun loadJobDetails() {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }

            when (val result = getJobByIdUseCase(jobId)) {
                is Resource.Success -> {
                    _state.update {
                        it.copy(
                            job = result.data,
                            isLoading = false,
                            error = null
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

    fun setSelectedImageIndex(index: Int) {
        _state.update { it.copy(selectedImageIndex = index) }
    }

    fun toggleImageGallery() {
        _state.update { it.copy(showImageGallery = !it.showImageGallery) }
    }
}

/**
 * State for Job Detail screen
 */
data class JobDetailState(
    val job: Job? = null,
    val isLoading: Boolean = false,
    val error: String? = null,
    val selectedImageIndex: Int = 0,
    val showImageGallery: Boolean = false
)
