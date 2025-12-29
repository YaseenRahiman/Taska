package za.co.taska.presentation.screens.client.jobs

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import za.co.taska.domain.model.Address
import za.co.taska.domain.model.BudgetType
import za.co.taska.domain.model.Category
import za.co.taska.domain.model.UrgencyLevel
import za.co.taska.domain.usecase.job.CreateJobUseCase
import javax.inject.Inject

/**
 * ViewModel for Create Job screen
 * Manages job creation form state and validation
 */
@HiltViewModel
class CreateJobViewModel @Inject constructor(
    private val createJobUseCase: CreateJobUseCase
) : ViewModel() {

    private val _state = MutableStateFlow(CreateJobState())
    val state: StateFlow<CreateJobState> = _state.asStateFlow()

    fun updateCategory(category: Category) {
        _state.update { it.copy(
            selectedCategory = category,
            categoryError = null
        ) }
    }

    fun updateTitle(title: String) {
        _state.update { it.copy(
            title = title,
            titleError = null
        ) }
    }

    fun updateDescription(description: String) {
        _state.update { it.copy(
            description = description,
            descriptionError = null
        ) }
    }

    fun updateBudget(budget: String) {
        _state.update { it.copy(
            budget = budget,
            budgetError = null
        ) }
    }

    fun updateBudgetType(budgetType: BudgetType) {
        _state.update { it.copy(budgetType = budgetType) }
    }

    fun updateUrgency(urgency: UrgencyLevel) {
        _state.update { it.copy(urgency = urgency) }
    }

    fun updateAddressLine1(addressLine1: String) {
        _state.update { it.copy(
            addressLine1 = addressLine1,
            addressError = null
        ) }
    }

    fun updateAddressLine2(addressLine2: String) {
        _state.update { it.copy(addressLine2 = addressLine2) }
    }

    fun updateCity(city: String) {
        _state.update { it.copy(
            city = city,
            addressError = null
        ) }
    }

    fun updateProvince(province: String) {
        _state.update { it.copy(province = province) }
    }

    fun updatePostalCode(postalCode: String) {
        _state.update { it.copy(
            postalCode = postalCode,
            addressError = null
        ) }
    }

    fun addRequirement(requirement: String) {
        if (requirement.isNotBlank() && _state.value.requirements.size < 10) {
            _state.update {
                it.copy(requirements = it.requirements + requirement.trim())
            }
        }
    }

    fun removeRequirement(index: Int) {
        _state.update {
            it.copy(requirements = it.requirements.filterIndexed { i, _ -> i != index })
        }
    }

    fun addImage(imageUrl: String) {
        if (imageUrl.isNotBlank() && _state.value.images.size < 5) {
            _state.update {
                it.copy(images = it.images + imageUrl)
            }
        }
    }

    fun removeImage(index: Int) {
        _state.update {
            it.copy(images = it.images.filterIndexed { i, _ -> i != index })
        }
    }

    fun createJob() {
        if (!validateInputs()) {
            return
        }

        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }

            val result = createJobUseCase(
                categoryId = _state.value.selectedCategory!!.id,
                title = _state.value.title,
                description = _state.value.description,
                budget = _state.value.budget.toDoubleOrNull() ?: 0.0,
                budgetType = _state.value.budgetType,
                urgency = _state.value.urgency,
                address = Address(
                    addressLine1 = _state.value.addressLine1,
                    addressLine2 = _state.value.addressLine2.ifBlank { null },
                    city = _state.value.city,
                    province = _state.value.province,
                    postalCode = _state.value.postalCode,
                    latitude = 0.0, // TODO: Get from geocoding or location picker
                    longitude = 0.0
                ),
                images = _state.value.images,
                requirements = _state.value.requirements,
                startDate = _state.value.startDate,
                endDate = _state.value.endDate
            )

            result.fold(
                onSuccess = {
                    _state.update { it.copy(
                        isLoading = false,
                        jobCreated = true
                    ) }
                },
                onFailure = { error ->
                    _state.update { it.copy(
                        isLoading = false,
                        error = error.message ?: "Failed to create job"
                    ) }
                }
            )
        }
    }

    private fun validateInputs(): Boolean {
        var isValid = true

        // Validate category
        if (_state.value.selectedCategory == null) {
            _state.update { it.copy(categoryError = "Please select a category") }
            isValid = false
        }

        // Validate title
        val title = _state.value.title.trim()
        when {
            title.isBlank() -> {
                _state.update { it.copy(titleError = "Job title cannot be empty") }
                isValid = false
            }
            title.length < 10 -> {
                _state.update { it.copy(titleError = "Job title must be at least 10 characters") }
                isValid = false
            }
            title.length > 100 -> {
                _state.update { it.copy(titleError = "Job title cannot exceed 100 characters") }
                isValid = false
            }
        }

        // Validate description
        val description = _state.value.description.trim()
        when {
            description.isBlank() -> {
                _state.update { it.copy(descriptionError = "Description cannot be empty") }
                isValid = false
            }
            description.length < 50 -> {
                _state.update { it.copy(descriptionError = "Description must be at least 50 characters") }
                isValid = false
            }
            description.length > 2000 -> {
                _state.update { it.copy(descriptionError = "Description cannot exceed 2000 characters") }
                isValid = false
            }
        }

        // Validate budget
        val budgetValue = _state.value.budget.toDoubleOrNull()
        when {
            _state.value.budget.isBlank() -> {
                _state.update { it.copy(budgetError = "Budget cannot be empty") }
                isValid = false
            }
            budgetValue == null -> {
                _state.update { it.copy(budgetError = "Budget must be a valid number") }
                isValid = false
            }
            budgetValue <= 0 -> {
                _state.update { it.copy(budgetError = "Budget must be greater than zero") }
                isValid = false
            }
            budgetValue > 1000000 -> {
                _state.update { it.copy(budgetError = "Budget cannot exceed R1,000,000") }
                isValid = false
            }
        }

        // Validate address
        when {
            _state.value.addressLine1.isBlank() -> {
                _state.update { it.copy(addressError = "Street address is required") }
                isValid = false
            }
            _state.value.city.isBlank() -> {
                _state.update { it.copy(addressError = "City is required") }
                isValid = false
            }
            _state.value.postalCode.isBlank() -> {
                _state.update { it.copy(addressError = "Postal code is required") }
                isValid = false
            }
            !_state.value.postalCode.matches(Regex("^[0-9]{4}$")) -> {
                _state.update { it.copy(addressError = "Invalid postal code (must be 4 digits)") }
                isValid = false
            }
        }

        return isValid
    }

    fun clearError() {
        _state.update { it.copy(error = null) }
    }
}

/**
 * State for Create Job screen
 */
data class CreateJobState(
    val isLoading: Boolean = false,
    val error: String? = null,
    val jobCreated: Boolean = false,

    // Form fields
    val selectedCategory: Category? = null,
    val title: String = "",
    val description: String = "",
    val budget: String = "",
    val budgetType: BudgetType = BudgetType.FIXED,
    val urgency: UrgencyLevel = UrgencyLevel.MEDIUM,

    val addressLine1: String = "",
    val addressLine2: String = "",
    val city: String = "",
    val province: String = "Gauteng",
    val postalCode: String = "",

    val images: List<String> = emptyList(),
    val requirements: List<String> = emptyList(),

    val startDate: String? = null,
    val endDate: String? = null,

    // Validation errors
    val categoryError: String? = null,
    val titleError: String? = null,
    val descriptionError: String? = null,
    val budgetError: String? = null,
    val addressError: String? = null
) {
    val canSubmit: Boolean
        get() = selectedCategory != null &&
                title.isNotBlank() &&
                description.isNotBlank() &&
                budget.isNotBlank() &&
                addressLine1.isNotBlank() &&
                city.isNotBlank() &&
                postalCode.isNotBlank() &&
                !isLoading
}
