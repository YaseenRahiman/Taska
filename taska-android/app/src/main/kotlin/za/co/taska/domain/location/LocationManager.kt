package za.co.taska.domain.location

import android.location.Location

/**
 * Interface for location management
 * Provides current location and permission handling
 */
interface LocationManager {
    /**
     * Get the current device location
     * Returns null if location is unavailable or permission denied
     */
    suspend fun getCurrentLocation(): Location?

    /**
     * Check if location permissions are granted
     */
    fun hasLocationPermission(): Boolean

    /**
     * Calculate distance between two coordinates in kilometers
     */
    fun calculateDistance(
        lat1: Double,
        lon1: Double,
        lat2: Double,
        lon2: Double
    ): Double
}
