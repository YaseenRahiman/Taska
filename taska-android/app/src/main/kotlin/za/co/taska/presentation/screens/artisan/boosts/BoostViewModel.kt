package za.co.taska.presentation.screens.artisan.boosts

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import za.co.taska.domain.model.*
import za.co.taska.domain.repository.MonetizationRepository
import javax.inject.Inject

/**
 * ViewModel for Boost screen
 * Handles profile boosts activation, viewing active boost, and history
 */
@HiltViewModel
class BoostViewModel @Inject constructor(
    private val monetizationRepository: MonetizationRepository
) : ViewModel() {

    private val _state = MutableStateFlow(BoostState())
    val state: StateFlow<BoostState> = _state.asStateFlow()

    init {
        loadInitialData()
    }

    /**
     * Load all boost-related data
     */
    fun loadInitialData() {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }

            // Load in parallel
            launch { loadBoostConfigs() }
            launch { loadActiveBoost() }
            launch { loadBoostHistory() }
            launch { loadCreditBalance() }
            launch { loadLevelInfo() }
        }
    }

    private suspend fun loadBoostConfigs() {
        monetizationRepository.getBoostConfigs()
            .onSuccess { configs ->
                _state.update { it.copy(boostConfigs = configs, isLoading = false) }
            }
            .onFailure { error ->
                _state.update {
                    it.copy(isLoading = false, error = error.message ?: "Failed to load boost options")
                }
            }
    }

    private suspend fun loadActiveBoost() {
        monetizationRepository.getActiveBoost()
            .onSuccess { boost ->
                _state.update { it.copy(activeBoost = boost) }
            }
    }

    private suspend fun loadBoostHistory() {
        monetizationRepository.getBoostHistory()
            .onSuccess { history ->
                _state.update { it.copy(boostHistory = history) }
            }
    }

    private suspend fun loadCreditBalance() {
        monetizationRepository.getCreditBalance()
            .onSuccess { wallet ->
                _state.update { it.copy(creditBalance = wallet.balance) }
            }
    }

    private suspend fun loadLevelInfo() {
        monetizationRepository.getMyLevel()
            .onSuccess { level ->
                _state.update {
                    it.copy(
                        freeBoostsRemaining = level.benefits.freeBoostsRemaining,
                        levelSearchBoost = level.benefits.searchBoostPercent
                    )
                }
            }
    }

    /**
     * Select a boost type to view details
     */
    fun selectBoostType(type: BoostType?) {
        _state.update { it.copy(selectedBoostType = type) }
    }

    /**
     * Activate a profile boost
     */
    fun activateBoost(boostType: BoostType, useFreeBoost: Boolean = true) {
        viewModelScope.launch {
            _state.update { it.copy(isActivating = true, activationError = null) }

            monetizationRepository.activateBoost(boostType, useFreeBoost)
                .onSuccess { boost ->
                    _state.update {
                        it.copy(
                            activeBoost = boost,
                            isActivating = false,
                            showActivationSuccess = true,
                            selectedBoostType = null
                        )
                    }
                    // Reload data to update balance and free boosts
                    loadCreditBalance()
                    loadLevelInfo()
                    loadBoostHistory()
                }
                .onFailure { error ->
                    _state.update {
                        it.copy(
                            isActivating = false,
                            activationError = error.message ?: "Failed to activate boost"
                        )
                    }
                }
        }
    }

    /**
     * Check if user can afford a boost type
     */
    fun canAffordBoost(config: BoostConfig): Boolean {
        // Can use free boost if available and it's a standard boost
        if (config.canUseFreeBid && _state.value.freeBoostsRemaining > 0 && config.type == BoostType.STANDARD) {
            return true
        }
        return _state.value.creditBalance >= config.creditCost
    }

    /**
     * Get the effective cost for a boost (considering free boosts)
     */
    fun getEffectiveCost(config: BoostConfig): Int {
        if (config.canUseFreeBid && _state.value.freeBoostsRemaining > 0 && config.type == BoostType.STANDARD) {
            return 0
        }
        return config.creditCost
    }

    /**
     * Switch between tabs
     */
    fun selectTab(tab: BoostTab) {
        _state.update { it.copy(selectedTab = tab) }

        if (tab == BoostTab.HISTORY) {
            viewModelScope.launch { loadBoostHistory() }
        }
    }

    /**
     * Clear errors
     */
    fun clearError() {
        _state.update { it.copy(error = null, activationError = null) }
    }

    /**
     * Dismiss success message
     */
    fun dismissSuccess() {
        _state.update { it.copy(showActivationSuccess = false) }
    }
}

/**
 * State for Boost screen
 */
data class BoostState(
    val boostConfigs: List<BoostConfig> = emptyList(),
    val activeBoost: ProfileBoost? = null,
    val boostHistory: List<ProfileBoost> = emptyList(),

    // User resources
    val creditBalance: Int = 0,
    val freeBoostsRemaining: Int = 0,
    val levelSearchBoost: Int = 0,

    // Tab and selection state
    val selectedTab: BoostTab = BoostTab.ACTIVATE,
    val selectedBoostType: BoostType? = null,

    // Loading states
    val isLoading: Boolean = false,
    val isActivating: Boolean = false,

    // Success/Error states
    val showActivationSuccess: Boolean = false,
    val error: String? = null,
    val activationError: String? = null
) {
    val hasActiveBoost: Boolean
        get() = activeBoost?.isActive == true

    val currentBoostPercent: Int
        get() = (activeBoost?.boostPercent ?: 0) + levelSearchBoost

    val totalVisibilityBoost: String
        get() = if (currentBoostPercent > 0) "+${currentBoostPercent}%" else "None"
}

/**
 * Boost screen tabs
 */
enum class BoostTab(val displayName: String) {
    ACTIVATE("Boost Profile"),
    ACTIVE("Active Boost"),
    HISTORY("History")
}
