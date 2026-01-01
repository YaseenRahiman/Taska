package za.co.taska.domain.usecase.job

import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.mockito.kotlin.*
import za.co.taska.domain.repository.JobsRepository
import java.io.File

/**
 * Unit tests for UploadJobImagesUseCase
 * Tests file validation logic and repository interaction for image uploads
 *
 * Coverage target: >85%
 */
class UploadJobImagesUseCaseTest {

    private lateinit var useCase: UploadJobImagesUseCase
    private lateinit var repository: JobsRepository

    @Before
    fun setup() {
        repository = mock()
        useCase = UploadJobImagesUseCase(repository)
    }

    // ========== Success Cases - Multiple Images ==========

    @Test
    fun `invoke should return success when uploading single valid image`() = runTest {
        // Given
        val file = createMockFile("image.jpg", size = 1024 * 1024) // 1MB
        val imageUrls = listOf("https://example.com/image.jpg")

        whenever(repository.uploadJobImages(any()))
            .thenReturn(Result.success(imageUrls))

        // When
        val result = useCase(listOf(file))

        // Then
        assertTrue(result.isSuccess)
        assertEquals(1, result.getOrNull()?.size)
        verify(repository).uploadJobImages(argThat { this.size == 1 })
    }

    @Test
    fun `invoke should return success when uploading multiple valid images`() = runTest {
        // Given
        val files = listOf(
            createMockFile("image1.jpg", size = 1024 * 1024),
            createMockFile("image2.png", size = 2048 * 1024),
            createMockFile("image3.webp", size = 512 * 1024)
        )
        val imageUrls = listOf(
            "https://example.com/image1.jpg",
            "https://example.com/image2.png",
            "https://example.com/image3.webp"
        )

        whenever(repository.uploadJobImages(any()))
            .thenReturn(Result.success(imageUrls))

        // When
        val result = useCase(files)

        // Then
        assertTrue(result.isSuccess)
        assertEquals(3, result.getOrNull()?.size)
        verify(repository).uploadJobImages(argThat { this.size == 3 })
    }

    @Test
    fun `invoke should return success when uploading maximum 5 images`() = runTest {
        // Given
        val files = (1..5).map {
            createMockFile("image$it.jpg", size = 1024 * 1024)
        }
        val imageUrls = (1..5).map { "https://example.com/image$it.jpg" }

        whenever(repository.uploadJobImages(any()))
            .thenReturn(Result.success(imageUrls))

        // When
        val result = useCase(files)

        // Then
        assertTrue(result.isSuccess)
        assertEquals(5, result.getOrNull()?.size)
        verify(repository).uploadJobImages(argThat { this.size == 5 })
    }

    @Test
    fun `invoke should accept all valid image extensions`() = runTest {
        // Given
        val files = listOf(
            createMockFile("image1.jpg", size = 1024 * 1024),
            createMockFile("image2.jpeg", size = 1024 * 1024),
            createMockFile("image3.png", size = 1024 * 1024),
            createMockFile("image4.webp", size = 1024 * 1024)
        )

        whenever(repository.uploadJobImages(any()))
            .thenReturn(Result.success(listOf("url1", "url2", "url3", "url4")))

        // When
        val result = useCase(files)

        // Then
        assertTrue(result.isSuccess)
    }

    @Test
    fun `invoke should accept maximum file size of 10MB`() = runTest {
        // Given
        val file = createMockFile("large.jpg", size = 10 * 1024 * 1024) // Exactly 10MB

        whenever(repository.uploadJobImages(any()))
            .thenReturn(Result.success(listOf("url")))

        // When
        val result = useCase(listOf(file))

        // Then
        assertTrue(result.isSuccess)
    }

    // ========== Success Cases - Single Image ==========

    @Test
    fun `uploadSingleImage should return success with valid image`() = runTest {
        // Given
        val file = createMockFile("profile.jpg", size = 512 * 1024) // 512KB

        whenever(repository.uploadJobImage(any()))
            .thenReturn(Result.success("https://example.com/profile.jpg"))

        // When
        val result = useCase.uploadSingleImage(file)

        // Then
        assertTrue(result.isSuccess)
        assertEquals("https://example.com/profile.jpg", result.getOrNull())
        verify(repository).uploadJobImage(file)
    }

    @Test
    fun `uploadSingleImage should accept all valid extensions`() = runTest {
        // Given
        val jpgFile = createMockFile("test.jpg", size = 1024 * 1024)
        val pngFile = createMockFile("test.png", size = 1024 * 1024)

        whenever(repository.uploadJobImage(any()))
            .thenReturn(Result.success("url"))

        // When
        val jpgResult = useCase.uploadSingleImage(jpgFile)
        val pngResult = useCase.uploadSingleImage(pngFile)

        // Then
        assertTrue(jpgResult.isSuccess)
        assertTrue(pngResult.isSuccess)
    }

    // ========== Validation Error Cases - File Count ==========

    @Test
    fun `invoke should fail when image list is empty`() = runTest {
        // When
        val result = useCase(emptyList())

        // Then
        assertTrue(result.isFailure)
        assertEquals("At least one image is required", result.exceptionOrNull()?.message)
        verify(repository, never()).uploadJobImages(any())
    }

    @Test
    fun `invoke should fail when more than 5 images`() = runTest {
        // Given
        val files = (1..6).map {
            createMockFile("image$it.jpg", size = 1024 * 1024)
        }

        // When
        val result = useCase(files)

        // Then
        assertTrue(result.isFailure)
        assertEquals("Maximum 5 images can be uploaded at once", result.exceptionOrNull()?.message)
        verify(repository, never()).uploadJobImages(any())
    }

    // ========== Validation Error Cases - File Existence ==========

    @Test
    fun `invoke should fail when file does not exist`() = runTest {
        // Given
        val file = createMockFile("missing.jpg", exists = false)

        // When
        val result = useCase(listOf(file))

        // Then
        assertTrue(result.isFailure)
        assertEquals("One or more image files do not exist", result.exceptionOrNull()?.message)
    }

    @Test
    fun `uploadSingleImage should fail when file does not exist`() = runTest {
        // Given
        val file = createMockFile("missing.jpg", exists = false)

        // When
        val result = useCase.uploadSingleImage(file)

        // Then
        assertTrue(result.isFailure)
        assertEquals("Image file does not exist", result.exceptionOrNull()?.message)
    }

    // ========== Validation Error Cases - File Readability ==========

    @Test
    fun `invoke should fail when file is not readable`() = runTest {
        // Given
        val file = createMockFile("locked.jpg", canRead = false)

        // When
        val result = useCase(listOf(file))

        // Then
        assertTrue(result.isFailure)
        assertEquals("One or more image files cannot be read", result.exceptionOrNull()?.message)
    }

    @Test
    fun `uploadSingleImage should fail when file is not readable`() = runTest {
        // Given
        val file = createMockFile("locked.jpg", canRead = false)

        // When
        val result = useCase.uploadSingleImage(file)

        // Then
        assertTrue(result.isFailure)
        assertEquals("Image file cannot be read", result.exceptionOrNull()?.message)
    }

    // ========== Validation Error Cases - File Size ==========

    @Test
    fun `invoke should fail when file is empty`() = runTest {
        // Given
        val file = createMockFile("empty.jpg", size = 0L)

        // When
        val result = useCase(listOf(file))

        // Then
        assertTrue(result.isFailure)
        assertEquals("One or more image files are empty", result.exceptionOrNull()?.message)
    }

    @Test
    fun `uploadSingleImage should fail when file is empty`() = runTest {
        // Given
        val file = createMockFile("empty.jpg", size = 0L)

        // When
        val result = useCase.uploadSingleImage(file)

        // Then
        assertTrue(result.isFailure)
        assertEquals("Image file is empty", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail when file exceeds 10MB limit`() = runTest {
        // Given
        val file = createMockFile("huge.jpg", size = 11 * 1024 * 1024) // 11MB

        // When
        val result = useCase(listOf(file))

        // Then
        assertTrue(result.isFailure)
        assertEquals("One or more images exceed maximum file size (10MB)", result.exceptionOrNull()?.message)
    }

    @Test
    fun `uploadSingleImage should fail when file exceeds 10MB limit`() = runTest {
        // Given
        val file = createMockFile("huge.jpg", size = 11 * 1024 * 1024) // 11MB

        // When
        val result = useCase.uploadSingleImage(file)

        // Then
        assertTrue(result.isFailure)
        assertEquals("Image exceeds maximum file size (10MB)", result.exceptionOrNull()?.message)
    }

    // ========== Validation Error Cases - File Type ==========

    @Test
    fun `invoke should fail when file has invalid extension`() = runTest {
        // Given
        val file = createMockFile("document.pdf", size = 1024 * 1024)

        // When
        val result = useCase(listOf(file))

        // Then
        assertTrue(result.isFailure)
        assertEquals("One or more files are not valid image types (jpg, jpeg, png, webp)", result.exceptionOrNull()?.message)
    }

    @Test
    fun `uploadSingleImage should fail when file has invalid extension`() = runTest {
        // Given
        val file = createMockFile("document.pdf", size = 1024 * 1024)

        // When
        val result = useCase.uploadSingleImage(file)

        // Then
        assertTrue(result.isFailure)
        assertEquals("File is not a valid image type (jpg, jpeg, png, webp)", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invoke should fail with gif extension`() = runTest {
        // Given
        val file = createMockFile("animated.gif", size = 1024 * 1024)

        // When
        val result = useCase(listOf(file))

        // Then
        assertTrue(result.isFailure)
        assertTrue(result.exceptionOrNull()?.message?.contains("not valid image types") == true)
    }

    // ========== Repository Error Propagation ==========

    @Test
    fun `invoke should propagate repository errors`() = runTest {
        // Given
        val file = createMockFile("valid.jpg", size = 1024 * 1024)
        whenever(repository.uploadJobImages(any()))
            .thenReturn(Result.failure(RuntimeException("Upload failed")))

        // When
        val result = useCase(listOf(file))

        // Then
        assertTrue(result.isFailure)
        assertEquals("Upload failed", result.exceptionOrNull()?.message)
    }

    @Test
    fun `uploadSingleImage should propagate repository errors`() = runTest {
        // Given
        val file = createMockFile("valid.jpg", size = 1024 * 1024)
        whenever(repository.uploadJobImage(any()))
            .thenReturn(Result.failure(RuntimeException("Network error")))

        // When
        val result = useCase.uploadSingleImage(file)

        // Then
        assertTrue(result.isFailure)
        assertEquals("Network error", result.exceptionOrNull()?.message)
    }

    // ========== Edge Cases ==========

    @Test
    fun `invoke should handle mixed valid and invalid files correctly`() = runTest {
        // Given - One valid file, one that doesn't exist
        val validFile = createMockFile("valid.jpg", size = 1024 * 1024)
        val invalidFile = createMockFile("missing.jpg", exists = false)

        // When
        val result = useCase(listOf(validFile, invalidFile))

        // Then
        assertTrue(result.isFailure)
        assertTrue(result.exceptionOrNull()?.message?.contains("do not exist") == true)
    }

    @Test
    fun `invoke should handle case-insensitive extensions`() = runTest {
        // Given
        val files = listOf(
            createMockFile("image1.JPG", size = 1024 * 1024),
            createMockFile("image2.Png", size = 1024 * 1024),
            createMockFile("image3.WEBP", size = 1024 * 1024)
        )

        whenever(repository.uploadJobImages(any()))
            .thenReturn(Result.success(listOf("url1", "url2", "url3")))

        // When
        val result = useCase(files)

        // Then
        assertTrue(result.isSuccess)
    }

    // ========== Helper Methods ==========

    private fun createMockFile(
        name: String,
        exists: Boolean = true,
        canRead: Boolean = true,
        size: Long = 1024 * 1024L // Default 1MB
    ): File {
        // Create a spy on a real File object so Kotlin extension properties work
        val file = spy(File(name))

        // Override the behavior of methods
        doReturn(exists).whenever(file).exists()
        doReturn(canRead).whenever(file).canRead()
        doReturn(size).whenever(file).length()

        // name and extension will work automatically since it's a real File object

        return file
    }
}
