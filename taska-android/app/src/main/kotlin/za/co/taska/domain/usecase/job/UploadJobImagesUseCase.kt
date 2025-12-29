package za.co.taska.domain.usecase.job

import za.co.taska.domain.repository.JobsRepository
import java.io.File
import javax.inject.Inject

/**
 * Upload Job Images Use Case
 * Business logic for uploading job images with validation
 *
 * Validation Rules:
 * - Maximum 5 images per upload
 * - Each file must exist and be readable
 * - File size limits enforced by API
 */
class UploadJobImagesUseCase @Inject constructor(
    private val jobsRepository: JobsRepository
) {
    suspend operator fun invoke(imageFiles: List<File>): Result<List<String>> {
        // Validate inputs
        val validationError = validateInputs(imageFiles)

        if (validationError != null) {
            return Result.failure(IllegalArgumentException(validationError))
        }

        // Call repository
        return jobsRepository.uploadJobImages(imageFiles)
    }

    suspend fun uploadSingleImage(imageFile: File): Result<String> {
        // Validate single image
        val validationError = validateSingleImage(imageFile)

        if (validationError != null) {
            return Result.failure(IllegalArgumentException(validationError))
        }

        // Call repository
        return jobsRepository.uploadJobImage(imageFile)
    }

    private fun validateInputs(imageFiles: List<File>): String? {
        return when {
            imageFiles.isEmpty() -> "At least one image is required"
            imageFiles.size > 5 -> "Maximum 5 images can be uploaded at once"
            imageFiles.any { !it.exists() } -> "One or more image files do not exist"
            imageFiles.any { !it.canRead() } -> "One or more image files cannot be read"
            imageFiles.any { it.length() == 0L } -> "One or more image files are empty"
            imageFiles.any { it.length() > MAX_FILE_SIZE } -> "One or more images exceed maximum file size (${MAX_FILE_SIZE_MB}MB)"
            imageFiles.any { !isValidImageExtension(it.extension) } -> "One or more files are not valid image types (jpg, jpeg, png, webp)"
            else -> null
        }
    }

    private fun validateSingleImage(imageFile: File): String? {
        return when {
            !imageFile.exists() -> "Image file does not exist"
            !imageFile.canRead() -> "Image file cannot be read"
            imageFile.length() == 0L -> "Image file is empty"
            imageFile.length() > MAX_FILE_SIZE -> "Image exceeds maximum file size (${MAX_FILE_SIZE_MB}MB)"
            !isValidImageExtension(imageFile.extension) -> "File is not a valid image type (jpg, jpeg, png, webp)"
            else -> null
        }
    }

    private fun isValidImageExtension(extension: String): Boolean {
        val validExtensions = listOf("jpg", "jpeg", "png", "webp")
        return extension.lowercase() in validExtensions
    }

    companion object {
        private const val MAX_FILE_SIZE_MB = 10
        private const val MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024L // 10MB in bytes
    }
}
