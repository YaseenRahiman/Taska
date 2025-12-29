package za.co.taska.domain.model

/**
 * Bid Analytics Domain Model
 * Statistical information about bids for a job
 */
data class BidAnalytics(
    val totalBids: Int,
    val averageBid: Double,
    val lowestBid: Double,
    val highestBid: Double,
    val averageRating: Double
) {
    val averageBidDisplay: String
        get() = "R %.2f".format(averageBid)

    val lowestBidDisplay: String
        get() = "R %.2f".format(lowestBid)

    val highestBidDisplay: String
        get() = "R %.2f".format(highestBid)

    val averageRatingDisplay: String
        get() = "★ %.1f".format(averageRating)

    val bidRangeDisplay: String
        get() = "R %.2f - R %.2f".format(lowestBid, highestBid)

    val hasBids: Boolean
        get() = totalBids > 0

    /**
     * Calculate bid spread (difference between highest and lowest)
     */
    val bidSpread: Double
        get() = if (hasBids) highestBid - lowestBid else 0.0

    val bidSpreadDisplay: String
        get() = "R %.2f".format(bidSpread)

    /**
     * Calculate bid spread percentage
     */
    val bidSpreadPercentage: Double
        get() = if (lowestBid > 0) (bidSpread / lowestBid) * 100 else 0.0

    val bidSpreadPercentageDisplay: String
        get() = "%.1f%%".format(bidSpreadPercentage)
}
