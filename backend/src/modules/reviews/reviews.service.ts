import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ReviewsRepository, ReviewWithRelations, ReviewStatistics } from './reviews.repository';
import { LoggingService } from '../../common/logging/logging.service';
import { CreateReviewDto, UpdateReviewDto, ReviewQueryDto } from './dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly reviewsRepository: ReviewsRepository,
    private readonly prisma: PrismaService,
    private readonly logger: LoggingService,
  ) {}

  /**
   * Create a new review after job completion
   */
  async createReview(
    createReviewDto: CreateReviewDto,
    reviewerId: string,
    requestId?: string,
  ): Promise<any> {
    const { jobId, revieweeId, ...reviewData } = createReviewDto;

    // Validate job exists and is completed
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        client: true,
        bids: {
          where: { status: 'ACCEPTED' },
          include: { artisan: true },
        },
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.status !== 'COMPLETED') {
      throw new BadRequestException('Cannot review uncompleted job');
    }

    // Validate reviewer is part of this job (client or artisan)
    const acceptedBid = job.bids[0];
    const isClient = job.clientId === reviewerId;
    const isArtisan = acceptedBid?.artisanId === reviewerId;

    if (!isClient && !isArtisan) {
      throw new ForbiddenException('You are not authorized to review this job');
    }

    // Validate reviewee is the other party
    if (isClient && revieweeId !== acceptedBid?.artisanId) {
      throw new BadRequestException('Invalid reviewee for client review');
    }
    if (isArtisan && revieweeId !== job.clientId) {
      throw new BadRequestException('Invalid reviewee for artisan review');
    }

    // Check if review already exists
    const existingReview = await this.reviewsRepository.findByJobAndReviewer(jobId, reviewerId);
    if (existingReview) {
      throw new BadRequestException('Review already exists for this job');
    }

    // Create review with job verification
    const review = await this.reviewsRepository.create({
      ...reviewData,
      jobId,
      reviewerId,
      revieweeId,
      isVerified: true, // Auto-verify reviews from completed jobs
    }, requestId);

    // Log business event
    this.logger.logBusinessEvent(
      'Review created',
      {
        reviewId: review.id,
        jobId,
        reviewerId,
        revieweeId,
        rating: reviewData.rating,
      },
      undefined,
      requestId,
    );

    // TODO: Send notification to reviewee
    // await this.notificationService.notifyReviewReceived(revieweeId, review);

    return review;
  }

  /**
   * Update existing review (within 48-hour window)
   */
  async updateReview(
    reviewId: string,
    updateReviewDto: UpdateReviewDto,
    userId: string,
    requestId?: string,
  ): Promise<any> {
    const review = await this.reviewsRepository.findById(reviewId);
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Check ownership
    if (review.reviewerId !== userId) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    // Check if review is within edit window (48 hours)
    const editWindowHours = 48;
    const reviewAge = Date.now() - new Date(review.createdAt).getTime();
    const editWindowMs = editWindowHours * 60 * 60 * 1000;

    if (reviewAge > editWindowMs) {
      throw new BadRequestException('Review can only be edited within 48 hours of creation');
    }

    // Cannot edit if reviewee has already responded
    if (review.response) {
      throw new BadRequestException('Cannot edit review after response has been given');
    }

    const updatedReview = await this.reviewsRepository.update(reviewId, updateReviewDto, requestId);

    this.logger.logBusinessEvent(
      'Review updated',
      {
        reviewId,
        userId,
        changes: Object.keys(updateReviewDto),
      },
      undefined,
      requestId,
    );

    return updatedReview;
  }

  /**
   * Get reviews with advanced filtering
   */
  async getReviews(query: ReviewQueryDto): Promise<{
    reviews: ReviewWithRelations[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      hasMore: boolean;
    };
  }> {
    const result = await this.reviewsRepository.findWithFilters(query);

    return {
      reviews: result.reviews,
      pagination: {
        page: query.page || 1,
        limit: query.limit || 10,
        total: result.total,
        hasMore: result.hasMore,
      },
    };
  }

  /**
   * Get single review by ID
   */
  async getReviewById(reviewId: string): Promise<ReviewWithRelations> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                profilePictureUrl: true,
              },
            },
          },
        },
        reviewee: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                profilePictureUrl: true,
              },
            },
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review as ReviewWithRelations;
  }

  /**
   * Get user's review statistics
   */
  async getUserReviewStatistics(userId: string): Promise<ReviewStatistics> {
    return this.reviewsRepository.getReviewStatistics(userId);
  }

  /**
   * Respond to a review (for reviewee)
   */
  async respondToReview(
    reviewId: string,
    response: string,
    userId: string,
    requestId?: string,
  ): Promise<any> {
    const review = await this.reviewsRepository.findById(reviewId);
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Check if user is the reviewee
    if (review.revieweeId !== userId) {
      throw new ForbiddenException('You can only respond to reviews about you');
    }

    // Check if already responded
    if (review.response) {
      throw new BadRequestException('You have already responded to this review');
    }

    const updatedReview = await this.reviewsRepository.updateReviewResponse(
      reviewId,
      response,
      new Date(),
    );

    this.logger.logBusinessEvent(
      'Review response added',
      {
        reviewId,
        revieweeId: userId,
        responseLength: response.length,
      },
      undefined,
      requestId,
    );

    return updatedReview;
  }

  /**
   * Vote on review helpfulness
   */
  async voteReviewHelpfulness(
    reviewId: string,
    helpful: boolean,
    userId: string,
    requestId?: string,
  ): Promise<any> {
    const review = await this.reviewsRepository.findById(reviewId);
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Prevent voting on own reviews
    if (review.reviewerId === userId || review.revieweeId === userId) {
      throw new BadRequestException('Cannot vote on your own reviews');
    }

    // TODO: Implement vote tracking to prevent duplicate votes
    // For now, we'll just increment/decrement the count

    let updatedReview;
    if (helpful) {
      updatedReview = await this.reviewsRepository.incrementHelpfulCount(reviewId);
    } else {
      updatedReview = await this.reviewsRepository.decrementHelpfulCount(reviewId);
    }

    this.logger.logBusinessEvent(
      'Review helpful vote',
      {
        reviewId,
        userId,
        helpful,
        newCount: updatedReview.helpfulCount,
      },
      undefined,
      requestId,
    );

    return updatedReview;
  }

  /**
   * Get reviews for a specific job
   */
  async getJobReviews(jobId: string): Promise<ReviewWithRelations[]> {
    const query = new ReviewQueryDto();
    query.jobId = jobId;
    query.limit = 50;
    
    const result = await this.reviewsRepository.findWithFilters(query);

    return result.reviews;
  }

  /**
   * Get user's reviews (as reviewer)
   */
  async getUserReviewsGiven(
    userId: string,
    query?: Partial<ReviewQueryDto>,
  ): Promise<ReviewWithRelations[]> {
    const searchQuery = new ReviewQueryDto();
    Object.assign(searchQuery, query, {
      reviewerId: userId,
      limit: query?.limit || 50,
    });
    
    const result = await this.reviewsRepository.findWithFilters(searchQuery);

    return result.reviews;
  }

  /**
   * Get reviews received by user (as reviewee)
   */
  async getUserReviewsReceived(
    userId: string,
    query?: Partial<ReviewQueryDto>,
  ): Promise<ReviewWithRelations[]> {
    const searchQuery = new ReviewQueryDto();
    Object.assign(searchQuery, query, {
      revieweeId: userId,
      limit: query?.limit || 50,
    });
    
    const result = await this.reviewsRepository.findWithFilters(searchQuery);

    return result.reviews;
  }

  /**
   * Admin: Mark review as verified
   */
  async markReviewAsVerified(reviewId: string, adminId: string, requestId?: string): Promise<any> {
    const review = await this.reviewsRepository.findById(reviewId);
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    const verifiedReview = await this.reviewsRepository.markAsVerified(reviewId);

    this.logger.logBusinessEvent(
      'Review verified by admin',
      {
        reviewId,
        adminId,
        previousStatus: review.isVerified,
      },
      undefined,
      requestId,
    );

    return verifiedReview;
  }

  /**
   * Fraud detection: Find suspicious review patterns
   */
  async detectFraudulentReviews(requestId?: string): Promise<{
    duplicateReviews: any[];
    suspiciousPatterns: string[];
  }> {
    const duplicateReviews = await this.reviewsRepository.findDuplicateReviews();
    const suspiciousPatterns: string[] = [];

    // Check for rapid review submissions (potential bot activity)
    const recentReviews = await this.prisma.review.groupBy({
      by: ['reviewerId'],
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      _count: {
        id: true,
      },
      having: {
        id: {
          _count: {
            gt: 5, // More than 5 reviews in 24 hours
          },
        },
      },
    });

    if (recentReviews.length > 0) {
      suspiciousPatterns.push(`${recentReviews.length} users with excessive review activity`);
    }

    // Check for identical review text (copy-paste reviews)
    const identicalReviews = await this.prisma.$queryRaw<{comment: string, count: bigint}[]>`
      SELECT comment, COUNT(*) as count
      FROM reviews
      WHERE comment IS NOT NULL AND LENGTH(comment) > 20
      GROUP BY comment
      HAVING COUNT(*) > 1
    `;

    if (identicalReviews.length > 0) {
      suspiciousPatterns.push(`${identicalReviews.length} sets of identical review text found`);
    }

    this.logger.logBusinessEvent(
      'Fraud detection scan completed',
      {
        duplicateReviews: duplicateReviews.length,
        suspiciousPatterns: suspiciousPatterns.length,
      },
      undefined,
      requestId,
    );

    return {
      duplicateReviews,
      suspiciousPatterns,
    };
  }

  /**
   * Get aggregate rating for a user
   */
  async getUserAggregateRating(userId: string): Promise<{
    averageRating: number;
    totalReviews: number;
    ratingBreakdown: { [key: number]: number };
  }> {
    const stats = await this.reviewsRepository.getReviewStatistics(userId);

    const ratingBreakdown: { [key: number]: number } = {};
    for (let i = 1; i <= 5; i++) {
      ratingBreakdown[i] = 0;
    }

    stats.ratingDistribution.forEach(item => {
      ratingBreakdown[item.rating] = item.count;
    });

    return {
      averageRating: stats.averageRating,
      totalReviews: stats.totalReviews,
      ratingBreakdown,
    };
  }

  /**
   * Delete review (admin only or within edit window)
   */
  async deleteReview(reviewId: string, userId: string, isAdmin: boolean = false, requestId?: string): Promise<void> {
    const review = await this.reviewsRepository.findById(reviewId);
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (!isAdmin) {
      // Check ownership
      if (review.reviewerId !== userId) {
        throw new ForbiddenException('You can only delete your own reviews');
      }

      // Check edit window
      const editWindowHours = 48;
      const reviewAge = Date.now() - new Date(review.createdAt).getTime();
      const editWindowMs = editWindowHours * 60 * 60 * 1000;

      if (reviewAge > editWindowMs) {
        throw new BadRequestException('Review can only be deleted within 48 hours of creation');
      }
    }

    await this.reviewsRepository.delete(reviewId, requestId);

    this.logger.logBusinessEvent(
      'Review deleted',
      {
        reviewId,
        deletedBy: userId,
        isAdmin,
      },
      undefined,
      requestId,
    );
  }
}
