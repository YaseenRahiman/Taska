# Part 4: Presentation Layer Design

## 4.1 ViewModel State Management Pattern

All ViewModels follow this pattern:

```kotlin
@HiltViewModel
class ExampleViewModel @Inject constructor(
    private val useCase: ExampleUseCase,
    private val savedStateHandle: SavedStateHandle
) : ViewModel() {

    // UI State (single source of truth)
    private val _state = MutableStateFlow(ExampleState())
    val state: StateFlow<ExampleState> = _state.asStateFlow()

    // One-time events (navigation, snackbar)
    private val _events = Channel<ExampleEvent>()
    val events = _events.receiveAsFlow()

    // State updates
    fun updateField(field: String, value: Any) {
        _state.update { it.copy(/* field = value */) }
    }

    // Actions
    fun performAction() {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true) }
            useCase().fold(
                onSuccess = { result ->
                    _state.update { it.copy(data = result, isLoading = false) }
                    _events.send(ExampleEvent.Success)
                },
                onFailure = { error ->
                    _state.update { it.copy(error = error.message, isLoading = false) }
                }
            )
        }
    }
}

data class ExampleState(
    val data: Data? = null,
    val isLoading: Boolean = false,
    val error: String? = null
)

sealed class ExampleEvent {
    object Success : ExampleEvent()
    data class Navigate(val route: String) : ExampleEvent()
}
```

## 4.2 PostJobViewModel Design

### State

```kotlin
@HiltViewModel
class PostJobViewModel @Inject constructor(
    private val createJobUseCase: CreateJobUseCase,
    private val uploadJobImageUseCase: UploadJobImageUseCase,
    private val publishJobUseCase: PublishJobUseCase,
    private val locationManager: LocationManager,
    private val savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val _state = MutableStateFlow(PostJobState())
    val state: StateFlow<PostJobState> = _state.asStateFlow()

    private val _events = Channel<PostJobEvent>()
    val events = _events.receiveAsFlow()

    init {
        // Restore state from savedStateHandle if exists
        savedStateHandle.get<PostJobState>("job_draft")?.let {
            _state.value = it
        }
    }

    data class PostJobState(
        val currentStep: Int = 1,
        val jobDraft: JobDraftData = JobDraftData(),
        val uploadedImages: List<UploadedImage> = emptyList(),
        val isLoading: Boolean = false,
        val isUploading: Boolean = false,
        val uploadProgress: Int = 0,
        val errors: Map<String, String> = emptyMap(),
        val currentLocation: Location? = null,
        val categories: List<Category> = emptyList()
    )

    data class JobDraftData(
        val title: String = "",
        val description: String = "",
        val categoryId: String = "",
        val budget: String = "",
        val budgetType: BudgetType = BudgetType.FIXED,
        val urgency: UrgencyLevel = UrgencyLevel.MEDIUM,
        val addressLine1: String = "",
        val addressLine2: String = "",
        val city: String = "",
        val province: String = "",
        val postalCode: String = "",
        val latitude: Double = 0.0,
        val longitude: Double = 0.0,
        val requirements: List<String> = emptyList(),
        val startDate: String? = null,
        val endDate: String? = null
    )

    data class UploadedImage(
        val url: String,
        val localUri: Uri? = null,
        val size: Long = 0
    )

    sealed class PostJobEvent {
        object JobPublished : PostJobEvent()
        object DraftSaved : PostJobEvent()
        data class ShowError(val message: String) : PostJobEvent()
        data class NavigateToStep(val step: Int) : PostJobEvent()
    }

    // Step Navigation
    fun nextStep() {
        when (_state.value.currentStep) {
            1 -> if (validateStep1()) _state.update { it.copy(currentStep = 2) }
            2 -> if (validateStep2()) _state.update { it.copy(currentStep = 3) }
            3 -> if (validateStep3()) _state.update { it.copy(currentStep = 4) }
        }
    }

    fun previousStep() {
        if (_state.value.currentStep > 1) {
            _state.update { it.copy(currentStep = _state.value.currentStep - 1) }
        }
    }

    fun goToStep(step: Int) {
        if (step in 1..4) {
            _state.update { it.copy(currentStep = step) }
        }
    }

    // Field Updates
    fun updateTitle(title: String) {
        _state.update {
            it.copy(jobDraft = it.jobDraft.copy(title = title))
        }
        clearError("title")
    }

    fun updateDescription(description: String) {
        _state.update {
            it.copy(jobDraft = it.jobDraft.copy(description = description))
        }
        clearError("description")
    }

    // ... other field update methods

    // Validation
    fun validateStep1(): Boolean {
        val errors = mutableMapOf<String, String>()
        val draft = _state.value.jobDraft

        if (draft.title.length < 5) {
            errors["title"] = "Title must be at least 5 characters"
        }
        if (draft.title.length > 100) {
            errors["title"] = "Title must be at most 100 characters"
        }
        if (draft.description.length < 20) {
            errors["description"] = "Description must be at least 20 characters"
        }
        if (draft.description.length > 2000) {
            errors["description"] = "Description must be at most 2000 characters"
        }
        if (draft.categoryId.isEmpty()) {
            errors["category"] = "Please select a category"
        }
        if (draft.budget.toDoubleOrNull() == null || draft.budget.toDouble() <= 0) {
            errors["budget"] = "Please enter a valid budget"
        }

        _state.update { it.copy(errors = errors) }
        return errors.isEmpty()
    }

    fun validateStep2(): Boolean {
        val errors = mutableMapOf<String, String>()
        val draft = _state.value.jobDraft

        if (draft.addressLine1.isEmpty()) {
            errors["addressLine1"] = "Address is required"
        }
        if (draft.city.isEmpty()) {
            errors["city"] = "City is required"
        }
        if (draft.province.isEmpty()) {
            errors["province"] = "Province is required"
        }
        if (draft.postalCode.isEmpty()) {
            errors["postalCode"] = "Postal code is required"
        }
        if (draft.latitude == 0.0 || draft.longitude == 0.0) {
            errors["location"] = "Please set location on map"
        }

        _state.update { it.copy(errors = errors) }
        return errors.isEmpty()
    }

    fun validateStep3(): Boolean {
        // Step 3 is optional (images and requirements)
        return true
    }

    // Image Upload
    fun uploadImage(uri: Uri) {
        viewModelScope.launch {
            _state.update { it.copy(isUploading = true, uploadProgress = 0) }

            try {
                // Compress image first
                val compressedUri = compressImage(uri)

                // Upload to server
                uploadJobImageUseCase(compressedUri).fold(
                    onSuccess = { imageUrl ->
                        val uploadedImage = UploadedImage(url = imageUrl, localUri = uri)
                        _state.update {
                            it.copy(
                                uploadedImages = it.uploadedImages + uploadedImage,
                                isUploading = false,
                                uploadProgress = 100
                            )
                        }
                    },
                    onFailure = { error ->
                        _state.update { it.copy(isUploading = false) }
                        _events.send(PostJobEvent.ShowError("Image upload failed: ${error.message}"))
                    }
                )
            } catch (e: Exception) {
                _state.update { it.copy(isUploading = false) }
                _events.send(PostJobEvent.ShowError("Image processing failed"))
            }
        }
    }

    private suspend fun compressImage(uri: Uri): Uri {
        // Compress image to max 2MB
        // Implementation details...
        return uri
    }

    fun removeImage(index: Int) {
        _state.update {
            it.copy(uploadedImages = it.uploadedImages.filterIndexed { i, _ -> i != index })
        }
    }

    // Location
    fun getCurrentLocation() {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true) }

            locationManager.getCurrentLocation().fold(
                onSuccess = { location ->
                    _state.update {
                        it.copy(
                            currentLocation = location,
                            jobDraft = it.jobDraft.copy(
                                latitude = location.latitude,
                                longitude = location.longitude
                            ),
                            isLoading = false
                        )
                    }

                    // Reverse geocode to get address
                    reverseGeocode(location.latitude, location.longitude)
                },
                onFailure = { error ->
                    _state.update { it.copy(isLoading = false) }
                    _events.send(PostJobEvent.ShowError("Location error: ${error.message}"))
                }
            )
        }
    }

    private suspend fun reverseGeocode(lat: Double, lng: Double) {
        // Get address from coordinates
        // Implementation details...
    }

    // Save Draft
    fun saveDraft() {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true) }

            val jobData = CreateJobDto(
                title = _state.value.jobDraft.title,
                description = _state.value.jobDraft.description,
                categoryId = _state.value.jobDraft.categoryId,
                budget = _state.value.jobDraft.budget.toDouble(),
                budgetType = _state.value.jobDraft.budgetType.name,
                urgency = _state.value.jobDraft.urgency.name,
                addressLine1 = _state.value.jobDraft.addressLine1,
                addressLine2 = _state.value.jobDraft.addressLine2,
                city = _state.value.jobDraft.city,
                province = _state.value.jobDraft.province,
                postalCode = _state.value.jobDraft.postalCode,
                latitude = _state.value.jobDraft.latitude,
                longitude = _state.value.jobDraft.longitude,
                images = _state.value.uploadedImages.map { it.url },
                requirements = _state.value.jobDraft.requirements,
                startDate = _state.value.jobDraft.startDate,
                endDate = _state.value.jobDraft.endDate,
                isDraft = true
            )

            createJobUseCase(jobData).fold(
                onSuccess = { job ->
                    _state.update { it.copy(isLoading = false) }
                    savedStateHandle["job_draft"] = null // Clear draft
                    _events.send(PostJobEvent.DraftSaved)
                },
                onFailure = { error ->
                    _state.update { it.copy(isLoading = false) }
                    _events.send(PostJobEvent.ShowError("Save failed: ${error.message}"))
                }
            )
        }
    }

    // Publish Job
    fun publishJob() {
        viewModelScope.launch {
            if (!validateStep1() || !validateStep2()) {
                _events.send(PostJobEvent.ShowError("Please complete all required fields"))
                return@launch
            }

            _state.update { it.copy(isLoading = true) }

            val jobData = CreateJobDto(
                title = _state.value.jobDraft.title,
                description = _state.value.jobDraft.description,
                categoryId = _state.value.jobDraft.categoryId,
                budget = _state.value.jobDraft.budget.toDouble(),
                budgetType = _state.value.jobDraft.budgetType.name,
                urgency = _state.value.jobDraft.urgency.name,
                addressLine1 = _state.value.jobDraft.addressLine1,
                addressLine2 = _state.value.jobDraft.addressLine2,
                city = _state.value.jobDraft.city,
                province = _state.value.jobDraft.province,
                postalCode = _state.value.jobDraft.postalCode,
                latitude = _state.value.jobDraft.latitude,
                longitude = _state.value.jobDraft.longitude,
                images = _state.value.uploadedImages.map { it.url },
                requirements = _state.value.jobDraft.requirements,
                startDate = _state.value.jobDraft.startDate,
                endDate = _state.value.jobDraft.endDate,
                isDraft = false
            )

            createJobUseCase(jobData).fold(
                onSuccess = { job ->
                    _state.update { it.copy(isLoading = false) }
                    savedStateHandle["job_draft"] = null // Clear draft
                    _events.send(PostJobEvent.JobPublished)
                },
                onFailure = { error ->
                    _state.update { it.copy(isLoading = false) }
                    _events.send(PostJobEvent.ShowError("Publish failed: ${error.message}"))
                }
            )
        }
    }

    private fun clearError(field: String) {
        _state.update {
            it.copy(errors = it.errors - field)
        }
    }

    override fun onCleared() {
        super.onCleared()
        // Save draft to savedStateHandle
        savedStateHandle["job_draft"] = _state.value
    }
}

enum class BudgetType {
    FIXED, HOURLY, NEGOTIABLE
}

enum class UrgencyLevel {
    LOW, MEDIUM, HIGH, URGENT
}
```

## 4.3 BidsViewModel Design

```kotlin
@HiltViewModel
class BidsViewModel @Inject constructor(
    private val getJobBidsUseCase: GetJobBidsUseCase,
    private val acceptBidUseCase: AcceptBidUseCase,
    private val rejectBidUseCase: RejectBidUseCase,
    private val getBidAnalyticsUseCase: GetBidAnalyticsUseCase
) : ViewModel() {

    private val _state = MutableStateFlow(BidsState())
    val state: StateFlow<BidsState> = _state.asStateFlow()

    private val _events = Channel<BidEvent>()
    val events = _events.receiveAsFlow()

    data class BidsState(
        val bids: List<Bid> = emptyList(),
        val filteredBids: List<Bid> = emptyList(),
        val analytics: BidAnalytics? = null,
        val isLoading: Boolean = false,
        val error: String? = null,
        val sortBy: SortOption = SortOption.PRICE_LOW_TO_HIGH,
        val filterStatus: BidStatus? = null,
        val selectedBidId: String? = null
    )

    enum class SortOption {
        PRICE_LOW_TO_HIGH,
        PRICE_HIGH_TO_LOW,
        RATING_HIGH_TO_LOW,
        DATE_NEWEST,
        DATE_OLDEST
    }

    sealed class BidEvent {
        data class BidAccepted(val bidId: String) : BidEvent()
        data class BidRejected(val bidId: String) : BidEvent()
        data class ShowError(val message: String) : BidEvent()
        data class NavigateToBidDetails(val bidId: String) : BidEvent()
    }

    fun loadBids(jobId: String) {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true) }

            // Load bids
            getJobBidsUseCase(jobId).collectLatest { result ->
                when (result) {
                    is Resource.Success -> {
                        _state.update {
                            it.copy(
                                bids = result.data ?: emptyList(),
                                filteredBids = applyFiltersAndSort(result.data ?: emptyList()),
                                isLoading = false
                            )
                        }
                    }
                    is Resource.Error -> {
                        _state.update {
                            it.copy(error = result.message, isLoading = false)
                        }
                    }
                    is Resource.Loading -> {
                        _state.update { it.copy(isLoading = true) }
                    }
                }
            }

            // Load analytics
            getBidAnalyticsUseCase(jobId).collectLatest { result ->
                if (result is Resource.Success) {
                    _state.update { it.copy(analytics = result.data) }
                }
            }
        }
    }

    fun acceptBid(bidId: String) {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true) }

            acceptBidUseCase(bidId).fold(
                onSuccess = {
                    _state.update { it.copy(isLoading = false) }
                    _events.send(BidEvent.BidAccepted(bidId))
                },
                onFailure = { error ->
                    _state.update { it.copy(isLoading = false) }
                    _events.send(BidEvent.ShowError("Failed to accept bid: ${error.message}"))
                }
            )
        }
    }

    fun rejectBid(bidId: String, reason: String) {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true) }

            rejectBidUseCase(bidId, reason).fold(
                onSuccess = {
                    _state.update { it.copy(isLoading = false) }
                    _events.send(BidEvent.BidRejected(bidId))
                },
                onFailure = { error ->
                    _state.update { it.copy(isLoading = false) }
                    _events.send(BidEvent.ShowError("Failed to reject bid: ${error.message}"))
                }
            )
        }
    }

    fun sortBids(sortOption: SortOption) {
        _state.update {
            it.copy(
                sortBy = sortOption,
                filteredBids = applyFiltersAndSort(it.bids)
            )
        }
    }

    fun filterByStatus(status: BidStatus?) {
        _state.update {
            it.copy(
                filterStatus = status,
                filteredBids = applyFiltersAndSort(it.bids)
            )
        }
    }

    private fun applyFiltersAndSort(bids: List<Bid>): List<Bid> {
        var filtered = bids

        // Apply status filter
        _state.value.filterStatus?.let { status ->
            filtered = filtered.filter { it.status == status }
        }

        // Apply sort
        return when (_state.value.sortBy) {
            SortOption.PRICE_LOW_TO_HIGH -> filtered.sortedBy { it.amount }
            SortOption.PRICE_HIGH_TO_LOW -> filtered.sortedByDescending { it.amount }
            SortOption.RATING_HIGH_TO_LOW -> filtered.sortedByDescending { it.artisan?.rating ?: 0.0 }
            SortOption.DATE_NEWEST -> filtered.sortedByDescending { it.createdAt }
            SortOption.DATE_OLDEST -> filtered.sortedBy { it.createdAt }
        }
    }
}
```

This covers ViewModels. The complete design document would include all screens, navigation, and testing architecture. Would you like me to continue with additional parts?
