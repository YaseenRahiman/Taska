package za.co.taska.domain.model

/**
 * Resource wrapper for async operations
 * Represents loading, success, and error states
 */
sealed class Resource<out T> {
    data class Success<out T>(
        val data: T,
        val isCached: Boolean = false
    ) : Resource<T>()

    data class Error(
        val message: String,
        val exception: Throwable? = null
    ) : Resource<Nothing>()

    data class Loading<out T>(
        val data: T? = null
    ) : Resource<T>()

    companion object {
        fun <T> success(data: T, isCached: Boolean = false): Resource<T> {
            return Success(data, isCached)
        }

        fun error(message: String, exception: Throwable? = null): Resource<Nothing> {
            return Error(message, exception)
        }

        fun <T> loading(data: T? = null): Resource<T> {
            return Loading(data)
        }
    }
}
