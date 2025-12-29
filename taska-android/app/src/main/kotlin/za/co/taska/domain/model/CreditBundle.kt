package za.co.taska.domain.model

import java.text.NumberFormat
import java.util.Locale

/**
 * Credit Bundle Domain Model
 * Represents a purchasable credit package
 */
data class CreditBundle(
    val id: String,
    val name: String,
    val credits: Int,
    val bonusCredits: Int,
    val priceZar: Double,
    val isPopular: Boolean,
    val description: String?
) {
    /**
     * Total credits including bonus
     */
    val totalCredits: Int
        get() = credits + bonusCredits

    /**
     * Price per credit (based on total credits)
     */
    val pricePerCredit: Double
        get() = if (totalCredits > 0) priceZar / totalCredits else 0.0

    /**
     * Formatted price in South African Rand
     */
    val formattedPrice: String
        get() = formatCurrency(priceZar)

    /**
     * Formatted price per credit
     */
    val formattedPricePerCredit: String
        get() = formatCurrency(pricePerCredit)

    /**
     * Bonus percentage for display
     */
    val bonusPercentage: Int
        get() = if (credits > 0) (bonusCredits * 100) / credits else 0

    /**
     * Display text for bonus
     */
    val bonusText: String?
        get() = if (bonusCredits > 0) "+$bonusCredits bonus" else null

    private fun formatCurrency(amount: Double): String {
        val format = NumberFormat.getCurrencyInstance(Locale("en", "ZA"))
        return format.format(amount)
    }
}
