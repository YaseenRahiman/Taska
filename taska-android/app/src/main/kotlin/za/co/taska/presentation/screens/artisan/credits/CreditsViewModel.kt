package za.co.taska.presentation.screens.artisan.credits

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
import za.co.taska.domain.repository.PaginatedTransactions
import javax.inject.Inject

/**
 * ViewModel for Credits screen
 * Handles credit wallet, bundles, transactions, vouchers, and auto top-up
 */
@HiltViewModel
class CreditsViewModel @Inject constructor(
    private val monetizationRepository: MonetizationRepository
) : ViewModel() {

    private val _state = MutableStateFlow(CreditsState())
    val state: StateFlow<CreditsState> = _state.asStateFlow()

    init {
        loadInitialData()
    }

    /**
     * Load all initial credit data in parallel
     */
    fun loadInitialData() {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }

            // Load wallet balance
            launch { loadWallet() }
            // Load available bundles
            launch { loadBundles() }
            // Load action costs
            launch { loadActionCosts() }
            // Load recent transactions
            launch { loadTransactions() }
        }
    }

    private suspend fun loadWallet() {
        monetizationRepository.getCreditBalance()
            .onSuccess { wallet ->
                _state.update {
                    it.copy(
                        wallet = wallet,
                        isLoading = false,
                        error = null
                    )
                }
            }
            .onFailure { error ->
                _state.update {
                    it.copy(
                        isLoading = false,
                        error = error.message ?: "Failed to load wallet"
                    )
                }
            }
    }

    private suspend fun loadBundles() {
        monetizationRepository.getCreditBundles()
            .onSuccess { bundles ->
                _state.update { it.copy(bundles = bundles) }
            }
            .onFailure { error ->
                _state.update {
                    it.copy(error = error.message ?: "Failed to load bundles")
                }
            }
    }

    private suspend fun loadActionCosts() {
        monetizationRepository.getActionCosts()
            .onSuccess { costs ->
                _state.update { it.copy(actionCosts = costs) }
            }
    }

    private suspend fun loadTransactions(page: Int = 1) {
        monetizationRepository.getCreditTransactions(page = page)
            .onSuccess { result ->
                _state.update {
                    it.copy(
                        transactions = result.transactions,
                        transactionPage = result.page,
                        totalTransactionPages = result.totalPages
                    )
                }
            }
    }

    /**
     * Select credit tab
     */
    fun selectTab(tab: CreditTab) {
        _state.update { it.copy(selectedTab = tab) }

        when (tab) {
            CreditTab.OVERVIEW -> viewModelScope.launch { loadWallet() }
            CreditTab.BUY -> viewModelScope.launch { loadBundles() }
            CreditTab.HISTORY -> viewModelScope.launch { loadTransactions() }
            CreditTab.VOUCHER -> { /* No additional load needed */ }
            CreditTab.SETTINGS -> loadAutoTopUpSettings()
        }
    }

    private fun loadAutoTopUpSettings() {
        viewModelScope.launch {
            loadWallet()
        }
    }

    /**
     * Purchase credits from a bundle
     */
    fun purchaseBundle(bundle: CreditBundle) {
        viewModelScope.launch {
            _state.update { it.copy(isPurchasing = true, purchaseError = null) }

            monetizationRepository.purchaseCredits(
                bundleId = bundle.id,
                purchaseMethod = CreditPurchaseMethod.CARD
            )
                .onSuccess { wallet ->
                    _state.update {
                        it.copy(
                            wallet = wallet,
                            isPurchasing = false,
                            showPurchaseSuccess = true
                        )
                    }
                }
                .onFailure { error ->
                    _state.update {
                        it.copy(
                            isPurchasing = false,
                            purchaseError = error.message ?: "Purchase failed"
                        )
                    }
                }
        }
    }

    /**
     * Redeem a voucher code
     */
    fun redeemVoucher(code: String) {
        if (code.isBlank()) {
            _state.update { it.copy(voucherError = "Please enter a voucher code") }
            return
        }

        viewModelScope.launch {
            _state.update { it.copy(isRedeemingVoucher = true, voucherError = null) }

            monetizationRepository.redeemVoucher(code.trim().uppercase())
                .onSuccess { result ->
                    _state.update {
                        it.copy(
                            isRedeemingVoucher = false,
                            voucherSuccess = "Successfully redeemed ${result.creditsAwarded} credits!",
                            voucherCode = ""
                        )
                    }
                    // Reload wallet balance
                    loadWallet()
                }
                .onFailure { error ->
                    _state.update {
                        it.copy(
                            isRedeemingVoucher = false,
                            voucherError = error.message ?: "Invalid voucher code"
                        )
                    }
                }
        }
    }

    /**
     * Update voucher code input
     */
    fun updateVoucherCode(code: String) {
        _state.update { it.copy(voucherCode = code, voucherError = null, voucherSuccess = null) }
    }

    /**
     * Configure auto top-up settings
     */
    fun updateAutoTopUp(
        enabled: Boolean,
        threshold: Int? = null,
        amount: Int? = null,
        source: AutoTopUpSource? = null
    ) {
        viewModelScope.launch {
            _state.update { it.copy(isSavingSettings = true) }

            monetizationRepository.configureAutoTopUp(
                enabled = enabled,
                threshold = threshold,
                amount = amount,
                source = source
            )
                .onSuccess { wallet ->
                    _state.update {
                        it.copy(
                            wallet = wallet,
                            isSavingSettings = false,
                            settingsSaved = true
                        )
                    }
                }
                .onFailure { error ->
                    _state.update {
                        it.copy(
                            isSavingSettings = false,
                            error = error.message ?: "Failed to save settings"
                        )
                    }
                }
        }
    }

    /**
     * Load more transactions
     */
    fun loadMoreTransactions() {
        val currentPage = _state.value.transactionPage
        val totalPages = _state.value.totalTransactionPages

        if (currentPage < totalPages) {
            viewModelScope.launch {
                _state.update { it.copy(isLoadingMore = true) }
                loadTransactions(currentPage + 1)
                _state.update { it.copy(isLoadingMore = false) }
            }
        }
    }

    /**
     * Filter transactions by type
     */
    fun filterTransactions(type: CreditTransactionType?) {
        viewModelScope.launch {
            _state.update { it.copy(selectedTransactionType = type, isLoading = true) }

            monetizationRepository.getCreditTransactions(
                page = 1,
                type = type
            )
                .onSuccess { result ->
                    _state.update {
                        it.copy(
                            transactions = result.transactions,
                            transactionPage = 1,
                            totalTransactionPages = result.totalPages,
                            isLoading = false
                        )
                    }
                }
                .onFailure { error ->
                    _state.update {
                        it.copy(
                            isLoading = false,
                            error = error.message ?: "Failed to load transactions"
                        )
                    }
                }
        }
    }

    /**
     * Clear errors
     */
    fun clearError() {
        _state.update { it.copy(error = null, purchaseError = null, voucherError = null) }
    }

    /**
     * Dismiss success messages
     */
    fun dismissSuccess() {
        _state.update { it.copy(showPurchaseSuccess = false, voucherSuccess = null, settingsSaved = false) }
    }
}

/**
 * State for Credits screen
 */
data class CreditsState(
    val wallet: CreditWallet? = null,
    val bundles: List<CreditBundle> = emptyList(),
    val transactions: List<CreditTransaction> = emptyList(),
    val actionCosts: Map<CreditAction, Int> = emptyMap(),

    // Tab state
    val selectedTab: CreditTab = CreditTab.OVERVIEW,

    // Transaction pagination
    val transactionPage: Int = 1,
    val totalTransactionPages: Int = 1,
    val selectedTransactionType: CreditTransactionType? = null,

    // Voucher state
    val voucherCode: String = "",
    val voucherSuccess: String? = null,
    val voucherError: String? = null,
    val isRedeemingVoucher: Boolean = false,

    // Loading states
    val isLoading: Boolean = false,
    val isLoadingMore: Boolean = false,
    val isPurchasing: Boolean = false,
    val isSavingSettings: Boolean = false,

    // Success/Error states
    val showPurchaseSuccess: Boolean = false,
    val settingsSaved: Boolean = false,
    val error: String? = null,
    val purchaseError: String? = null
) {
    val balance: Int
        get() = wallet?.balance ?: 0

    val formattedBalance: String
        get() = wallet?.formattedBalance ?: "0 credits"

    val hasAutoTopUp: Boolean
        get() = wallet?.hasAutoTopUp ?: false

    val isLowBalance: Boolean
        get() = wallet?.isLowBalance ?: false
}

/**
 * Credit screen tabs
 */
enum class CreditTab(val displayName: String) {
    OVERVIEW("Overview"),
    BUY("Buy Credits"),
    HISTORY("History"),
    VOUCHER("Voucher"),
    SETTINGS("Settings")
}
