package za.co.taska.data.mapper

import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import za.co.taska.data.local.entity.ReviewEntity
import za.co.taska.data.remote.dto.response.ReviewResponse
import za.co.taska.domain.model.Review

/**
 * Unit tests for ReviewMapper
 * Tests DTO ↔ Domain ↔ Entity transformations
 *
 * Coverage target: >85%
 */
class ReviewMapperTest {

    private lateinit var mapper: ReviewMapper

    @Before
    fun setup() {
        mapper = ReviewMapper()
    }

    // ========== DTO → Domain Tests ==========

    @Test
    fun `toDomain should map ReviewResponse to Review correctly`() {
        // Given
        val dto = ReviewResponse(
            id = "review_123",
            jobId = "job_456",
            clientId = "client_789",
            artisanId = "artisan_101",
            overallRating = 5,
            qualityRating = 5,
            professionalismRating = 4,
            timelinessRating = 5,
            valueRating = 4,
            reviewText = "Excellent work!",
            images = listOf("image1.jpg", "image2.jpg"),
            wouldRecommend = true,
            createdAt = "2025-10-31T10:00:00Z",
            updatedAt = null
        )

        // When
        val result = mapper.toDomain(dto)

        // Then
        assertEquals("review_123", result.id)
        assertEquals("job_456", result.jobId)
        assertEquals("client_789", result.clientId)
        assertEquals("artisan_101", result.artisanId)
        assertEquals(5, result.overallRating)
        assertEquals(5, result.qualityRating)
        assertEquals(4, result.professionalismRating)
        assertEquals(5, result.timelinessRating)
        assertEquals(4, result.valueRating)
        assertEquals("Excellent work!", result.reviewText)
        assertEquals(2, result.images.size)
        assertTrue(result.wouldRecommend)
        assertEquals("2025-10-31T10:00:00Z", result.createdAt)
        assertNull(result.updatedAt)
    }

    @Test
    fun `toDomain should handle null reviewText`() {
        // Given
        val dto = createTestReviewResponse(reviewText = null)

        // When
        val result = mapper.toDomain(dto)

        // Then
        assertNull(result.reviewText)
    }

    @Test
    fun `toDomain should handle empty images list`() {
        // Given
        val dto = createTestReviewResponse(images = emptyList())

        // When
        val result = mapper.toDomain(dto)

        // Then
        assertTrue(result.images.isEmpty())
    }

    @Test
    fun `toDomain should handle updated review with updatedAt`() {
        // Given
        val dto = createTestReviewResponse(updatedAt = "2025-11-01T15:00:00Z")

        // When
        val result = mapper.toDomain(dto)

        // Then
        assertEquals("2025-11-01T15:00:00Z", result.updatedAt)
    }

    @Test
    fun `toDomain should handle all rating variations`() {
        // Given - test minimum ratings
        val minDto = createTestReviewResponse(
            overallRating = 1,
            qualityRating = 1,
            professionalismRating = 1,
            timelinessRating = 1,
            valueRating = 1
        )

        // When
        val minResult = mapper.toDomain(minDto)

        // Then
        assertEquals(1, minResult.overallRating)
        assertEquals(1, minResult.qualityRating)
        assertEquals(1, minResult.professionalismRating)
        assertEquals(1, minResult.timelinessRating)
        assertEquals(1, minResult.valueRating)

        // Given - test maximum ratings
        val maxDto = createTestReviewResponse(
            overallRating = 5,
            qualityRating = 5,
            professionalismRating = 5,
            timelinessRating = 5,
            valueRating = 5
        )

        // When
        val maxResult = mapper.toDomain(maxDto)

        // Then
        assertEquals(5, maxResult.overallRating)
        assertEquals(5, maxResult.qualityRating)
        assertEquals(5, maxResult.professionalismRating)
        assertEquals(5, maxResult.timelinessRating)
        assertEquals(5, maxResult.valueRating)
    }

    @Test
    fun `toDomainList should map list of DTOs correctly`() {
        // Given
        val dtoList = listOf(
            createTestReviewResponse(id = "review_1"),
            createTestReviewResponse(id = "review_2"),
            createTestReviewResponse(id = "review_3")
        )

        // When
        val result = mapper.toDomainList(dtoList)

        // Then
        assertEquals(3, result.size)
        assertEquals("review_1", result[0].id)
        assertEquals("review_2", result[1].id)
        assertEquals("review_3", result[2].id)
    }

    // ========== Domain → Entity Tests ==========

    @Test
    fun `toEntity should map Review to ReviewEntity correctly`() {
        // Given
        val domain = Review(
            id = "review_123",
            jobId = "job_456",
            clientId = "client_789",
            artisanId = "artisan_101",
            overallRating = 5,
            qualityRating = 5,
            professionalismRating = 4,
            timelinessRating = 5,
            valueRating = 4,
            reviewText = "Great service!",
            images = listOf("img1.jpg", "img2.jpg", "img3.jpg"),
            wouldRecommend = true,
            createdAt = "2025-10-31T10:00:00Z",
            updatedAt = null
        )

        // When
        val result = mapper.toEntity(domain)

        // Then
        assertEquals("review_123", result.id)
        assertEquals("job_456", result.jobId)
        assertEquals("client_789", result.clientId)
        assertEquals("artisan_101", result.artisanId)
        assertEquals(5, result.overallRating)
        assertEquals(5, result.qualityRating)
        assertEquals(4, result.professionalismRating)
        assertEquals(5, result.timelinessRating)
        assertEquals(4, result.valueRating)
        assertEquals("Great service!", result.reviewText)
        assertEquals("img1.jpg,img2.jpg,img3.jpg", result.images) // Comma-separated
        assertTrue(result.wouldRecommend)
        assertEquals("2025-10-31T10:00:00Z", result.createdAt)
        assertNull(result.updatedAt)
        assertTrue(result.cachedAt > 0) // Should have timestamp
    }

    @Test
    fun `toEntity should convert empty images list to empty string`() {
        // Given
        val domain = createTestReview(images = emptyList())

        // When
        val result = mapper.toEntity(domain)

        // Then
        assertEquals("", result.images)
    }

    @Test
    fun `toEntity should convert single image to non-comma string`() {
        // Given
        val domain = createTestReview(images = listOf("single.jpg"))

        // When
        val result = mapper.toEntity(domain)

        // Then
        assertEquals("single.jpg", result.images)
    }

    // ========== Entity → Domain Tests ==========

    @Test
    fun `fromEntity should map ReviewEntity to Review correctly`() {
        // Given
        val entity = ReviewEntity(
            id = "review_123",
            jobId = "job_456",
            clientId = "client_789",
            artisanId = "artisan_101",
            overallRating = 4,
            qualityRating = 5,
            professionalismRating = 4,
            timelinessRating = 3,
            valueRating = 5,
            reviewText = "Good work",
            images = "img1.jpg,img2.jpg",
            wouldRecommend = true,
            createdAt = "2025-10-31T10:00:00Z",
            updatedAt = null,
            cachedAt = System.currentTimeMillis()
        )

        // When
        val result = mapper.fromEntity(entity)

        // Then
        assertEquals("review_123", result.id)
        assertEquals("job_456", result.jobId)
        assertEquals("client_789", result.clientId)
        assertEquals("artisan_101", result.artisanId)
        assertEquals(4, result.overallRating)
        assertEquals(5, result.qualityRating)
        assertEquals(4, result.professionalismRating)
        assertEquals(3, result.timelinessRating)
        assertEquals(5, result.valueRating)
        assertEquals("Good work", result.reviewText)
        assertEquals(2, result.images.size)
        assertEquals("img1.jpg", result.images[0])
        assertEquals("img2.jpg", result.images[1])
        assertTrue(result.wouldRecommend)
    }

    @Test
    fun `fromEntity should convert empty string to empty images list`() {
        // Given
        val entity = createTestReviewEntity(images = "")

        // When
        val result = mapper.fromEntity(entity)

        // Then
        assertTrue(result.images.isEmpty())
    }

    @Test
    fun `fromEntity should convert blank string to empty images list`() {
        // Given
        val entity = createTestReviewEntity(images = "   ")

        // When
        val result = mapper.fromEntity(entity)

        // Then
        assertTrue(result.images.isEmpty())
    }

    @Test
    fun `fromEntity should handle single image without comma`() {
        // Given
        val entity = createTestReviewEntity(images = "single.jpg")

        // When
        val result = mapper.fromEntity(entity)

        // Then
        assertEquals(1, result.images.size)
        assertEquals("single.jpg", result.images[0])
    }

    @Test
    fun `fromEntityList should map list of entities correctly`() {
        // Given
        val entityList = listOf(
            createTestReviewEntity(id = "review_1"),
            createTestReviewEntity(id = "review_2"),
            createTestReviewEntity(id = "review_3")
        )

        // When
        val result = mapper.fromEntityList(entityList)

        // Then
        assertEquals(3, result.size)
        assertEquals("review_1", result[0].id)
        assertEquals("review_2", result[1].id)
        assertEquals("review_3", result[2].id)
    }

    // ========== Round-trip Tests ==========

    @Test
    fun `round trip DTO to Domain to Entity should preserve data`() {
        // Given
        val dto = createTestReviewResponse()

        // When
        val domain = mapper.toDomain(dto)
        val entity = mapper.toEntity(domain)
        val backToDomain = mapper.fromEntity(entity)

        // Then
        assertEquals(domain.id, backToDomain.id)
        assertEquals(domain.jobId, backToDomain.jobId)
        assertEquals(domain.overallRating, backToDomain.overallRating)
        assertEquals(domain.qualityRating, backToDomain.qualityRating)
        assertEquals(domain.images.size, backToDomain.images.size)
        assertEquals(domain.wouldRecommend, backToDomain.wouldRecommend)
    }

    @Test
    fun `round trip should handle complex images list`() {
        // Given
        val dto = createTestReviewResponse(
            images = listOf("a.jpg", "b.png", "c.gif", "d.webp", "e.jpg")
        )

        // When
        val domain = mapper.toDomain(dto)
        val entity = mapper.toEntity(domain)
        val backToDomain = mapper.fromEntity(entity)

        // Then
        assertEquals(5, backToDomain.images.size)
        assertEquals("a.jpg", backToDomain.images[0])
        assertEquals("e.jpg", backToDomain.images[4])
    }

    // ========== Helper Methods ==========

    private fun createTestReviewResponse(
        id: String = "review_123",
        overallRating: Int = 5,
        qualityRating: Int = 5,
        professionalismRating: Int = 4,
        timelinessRating: Int = 5,
        valueRating: Int = 4,
        reviewText: String? = "Great work!",
        images: List<String> = listOf("img1.jpg", "img2.jpg"),
        updatedAt: String? = null
    ) = ReviewResponse(
        id = id,
        jobId = "job_456",
        clientId = "client_789",
        artisanId = "artisan_101",
        overallRating = overallRating,
        qualityRating = qualityRating,
        professionalismRating = professionalismRating,
        timelinessRating = timelinessRating,
        valueRating = valueRating,
        reviewText = reviewText,
        images = images,
        wouldRecommend = true,
        createdAt = "2025-10-31T10:00:00Z",
        updatedAt = updatedAt
    )

    private fun createTestReview(
        id: String = "review_123",
        images: List<String> = listOf("img1.jpg", "img2.jpg")
    ) = Review(
        id = id,
        jobId = "job_456",
        clientId = "client_789",
        artisanId = "artisan_101",
        overallRating = 5,
        qualityRating = 5,
        professionalismRating = 4,
        timelinessRating = 5,
        valueRating = 4,
        reviewText = "Great!",
        images = images,
        wouldRecommend = true,
        createdAt = "2025-10-31T10:00:00Z",
        updatedAt = null
    )

    private fun createTestReviewEntity(
        id: String = "review_123",
        images: String = "img1.jpg,img2.jpg"
    ) = ReviewEntity(
        id = id,
        jobId = "job_456",
        clientId = "client_789",
        artisanId = "artisan_101",
        overallRating = 5,
        qualityRating = 5,
        professionalismRating = 4,
        timelinessRating = 5,
        valueRating = 4,
        reviewText = "Great!",
        images = images,
        wouldRecommend = true,
        createdAt = "2025-10-31T10:00:00Z",
        updatedAt = null,
        cachedAt = System.currentTimeMillis()
    )
}
