package za.co.taska.data.remote.dto.request

import com.google.gson.annotations.SerializedName

/**
 * Request to purchase credits from a bundle
 */
data class PurchaseCreditsRequest(
    @SerializedName("bundleId")
    val bundleId: String,

    @SerializedName("purchaseMethod")
    val purchaseMethod: String,

    @SerializedName("providerTxnId")
    val providerTxnId: String? = null
)

/**
 * Request to redeem a voucher
 */
data class RedeemVoucherRequest(
    @SerializedName("voucherCode")
    val voucherCode: String
)

/**
 * Request to spend credits on an action
 */
data class SpendCreditsRequest(
    @SerializedName("action")
    val action: String,

    @SerializedName("reference")
    val reference: String? = null
)

/**
 * Request to convert wallet balance to credits
 */
data class ConvertWalletToCreditsRequest(
    @SerializedName("amountZar")
    val amountZar: Double
)

/**
 * Request to configure auto top-up settings
 */
data class ConfigureAutoTopUpRequest(
    @SerializedName("enabled")
    val enabled: Boolean,

    @SerializedName("threshold")
    val threshold: Int? = null,

    @SerializedName("amount")
    val amount: Int? = null,

    @SerializedName("source")
    val source: String? = null
)

/**
 * Request to activate a profile boost
 */
data class ActivateBoostRequest(
    @SerializedName("boostType")
    val boostType: String,

    @SerializedName("useFreeBoost")
    val useFreeBoost: Boolean = true
)

/**
 * Request to request verification
 */
data class RequestVerificationRequest(
    @SerializedName("type")
    val type: String
)
