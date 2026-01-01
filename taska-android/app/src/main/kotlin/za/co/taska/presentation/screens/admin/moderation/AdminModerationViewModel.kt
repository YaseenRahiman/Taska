package za.co.taska.presentation.screens.admin.moderation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import za.co.taska.domain.model.ContentType
import za.co.taska.domain.model.ModerationFilter
import za.co.taska.domain.model.ModerationItem
import za.co.taska.domain.model.ModerationStatus
import za.co.taska.domain.usecase.admin.ApproveContentUseCase
import za.co.taska.domain.usecase.admin.GetModerationQueueUseCase
import za.co.taska.domain.usecase.admin.RejectContentUseCase
import javax.inject.Inject

/**
 * ViewModel for Admin Moderation Screen
 * Manages content moderation queue
 */
@HiltViewModel
class AdminModerationViewModel @Inject constructor(
    private val getModerationQueueUseCase: GetModerationQueueUseCase,
    private val approveContentUseCase: ApproveContentUseCase,
    private val rejectContentUseCase: RejectContentUseCase
) : ViewModel() {

    private val _state = MutableStateFlow(AdminModerationState())
    val state: StateFlow<AdminModerationState> = _state.asStateFlow()

    init {
        loadModerationQueue()
    }

    fun loadModerationQueue() {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }

            val filter = ModerationFilter(
                contentType = _state.value.selectedContentType,
                status = _state.value.selectedStatus
            )

            getModerationQueueUseCase(filter).fold(
                onSuccess = { items ->
                    _state.update {
                        it.copy(
                            items = items,
                            isLoading = false,
                            error = null
                        )
                    }
                },
                onFailure = { exception ->
                    _state.update {
                        it.copy(
                            isLoading = false,
                            error = exception.message ?: "Failed to load moderation queue"
                        )
                    }
                }
            )
        }
    }

    fun approveContent(contentId: String, notes: String?) {
        viewModelScope.launch {
            _state.update { it.copy(isPerformingAction = true, actionError = null) }

            approveContentUseCase(contentId, notes).fold(
                onSuccess = {
                    _state.update {
                        it.copy(
                            isPerformingAction = false,
                            actionSuccess = "Content approved successfully"
                        )
                    }
                    // Reload queue
                    loadModerationQueue()
                },
                onFailure = { exception ->
                    _state.update {
                        it.copy(
                            isPerformingAction = false,
                            actionError = exception.message ?: "Failed to approve content"
                        )
                    }
                }
            )
        }
    }

    fun rejectContent(contentId: String, notes: String?) {
        viewModelScope.launch {
            _state.update { it.copy(isPerformingAction = true, actionError = null) }

            rejectContentUseCase(contentId, notes).fold(
                onSuccess = {
                    _state.update {
                        it.copy(
                            isPerformingAction = false,
                            actionSuccess = "Content rejected successfully"
                        )
                    }
                    // Reload queue
                    loadModerationQueue()
                },
                onFailure = { exception ->
                    _state.update {
                        it.copy(
                            isPerformingAction = false,
                            actionError = exception.message ?: "Failed to reject content"
                        )
                    }
                }
            )
        }
    }

    fun setContentTypeFilter(type: ContentType?) {
        _state.update { it.copy(selectedContentType = type) }
        loadModerationQueue()
    }

    fun setStatusFilter(status: ModerationStatus?) {
        _state.update { it.copy(selectedStatus = status) }
        loadModerationQueue()
    }

    fun clearFilters() {
        _state.update {
            it.copy(
                selectedContentType = null,
                selectedStatus = null
            )
        }
        loadModerationQueue()
    }

    fun clearActionSuccess() {
        _state.update { it.copy(actionSuccess = null) }
    }

    fun clearActionError() {
        _state.update { it.copy(actionError = null) }
    }
}

/**
 * State for Admin Moderation Screen
 */
data class AdminModerationState(
    val isLoading: Boolean = true,
    val error: String? = null,
    val items: List<ModerationItem> = emptyList(),
    val selectedContentType: ContentType? = null,
    val selectedStatus: ModerationStatus? = null,
    val isPerformingAction: Boolean = false,
    val actionError: String? = null,
    val actionSuccess: String? = null
) {
    val hasActiveFilters: Boolean
        get() = selectedContentType != null || selectedStatus != null

    val pendingCount: Int
        get() = items.count { it.status == ModerationStatus.PENDING }
}
