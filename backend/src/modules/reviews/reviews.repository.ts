import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseRepository } from '../../common/database/base.repository';
import { LoggingService } from '../../common/logging/logging.service';
import { ReviewQueryDto } from './dto';

export interface ReviewWithRelations {
  id: string;
  jobId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  qualityRating: number;
  timelinessRating: number;
  communicationRating: number;
  valueRating: number;
  comment: string | null;
  images: string[];
  response: string | null;
  respondedAt: Date | null;
  isVerified: boolean;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
  job: {
    id: string;
    title: string;
    status: string;
  };
  reviewer: {
    id: string;
    profile: {
      firstName: string | null;
      lastName: string | null;
      profilePictureUrl: string | null;
    } | null;
  };
  reviewee: {
    id: string;
    profile: {
      firstName: string | null;
      lastName: string | null;
      profilePictureUrl: string | null;
    } | null;
  };
}

export interface ReviewStatistics {
  totalReviews: number;
  averageRating: number;
  averageQualityRating: number;
  averageTimelinessRating: number;
  averageCommunicationRating: number;
  averageValueRating: number;
  ratingDistribution: { rating: number; count: number }[];
  verifiedReviewsCount: number;
  reviewsWithResponseCount: number;
}

@Injectable()
export class ReviewsRepository extends BaseRepository<any> {
  constructor(prisma: PrismaService, logger: LoggingService) {
    super(prisma, logger, 'review');
  }

  async findWithFilters(
    query: ReviewQueryDto,
  ): Promise<{ reviews: ReviewWithRelations[]; total: number; hasMore: boolean }> {
    const {
      page = 1,
      limit = 10,
      revieweeId,
      reviewerId,
      jobId,
      minRating,
      maxRating,
      isVerified,
      hasResponse,
      createdAfter,
      createdBefore,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
    } = query;

    const skip = (page - 1) * limit;
    const take = limit + 1; // Get one extra to check if there are more results

    // Build where clause
    const where: any = {};

    if (revieweeId) where.revieweeId = revieweeId;
    if (reviewerId) where.reviewerId = reviewerId;
    if (jobId) where.jobId = jobId;
    if (isVerified !== undefined) where.isVerified = isVerified;

    if (minRating || maxRating) {
      where.rating = {};
      if (minRating) where.rating.gte = minRating;
      if (maxRating) where.rating.lte = maxRating;
    }

    if (hasResponse !== undefined) {
      if (hasResponse) {
        where.response = { not: null };
      } else {
        where.response = null;
      }
    }

    if (createdAfter || createdBefore) {
      where.createdAt = {};
      if (createdAfter) where.createdAt.gte = new Date(createdAfter);
      if (createdBefore) where.createdAt.lte = new Date(createdBefore);
    }

    if (search) {
      where.OR = [
        { comment: { contains: search, mode: 'insensitive' } },
        { response: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build order by
    const orderBy: any = {
      [sortBy]: sortOrder,
    };

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
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
        orderBy,
        skip,
        take,
      }),
      this.prisma.review.count({ where }),
    ]);

    const hasMore = reviews.length > limit;
    const reviewsToReturn = hasMore ? reviews.slice(0, -1) : reviews;

    return {
      reviews: reviewsToReturn as ReviewWithRelations[],
      total,
      hasMore,
    };
  }

  async findByJobAndReviewer(jobId: string, reviewerId: string): Promise<any | null> {
    return this.prisma.review.findUnique({
      where: {
        jobId_reviewerId: {
          jobId,
          reviewerId,
        },
      },
    });
  }

  async getReviewStatistics(revieweeId: string): Promise<ReviewStatistics> {
    const [reviews, ratingDistribution] = await Promise.all([
      this.prisma.review.findMany({
        where: { revieweeId },
        select: {
          rating: true,
          qualityRating: true,
          timelinessRating: true,
          communicationRating: true,
          valueRating: true,
          isVerified: true,
          response: true,
        },
      }),
      this.prisma.review.groupBy({
        by: ['rating'],
        where: { revieweeId },
        _count: {
          rating: true,
        },
        orderBy: {
          rating: 'asc',
        },
      }),
    ]);

    const totalReviews = reviews.length;
    
    if (totalReviews === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        averageQualityRating: 0,
        averageTimelinessRating: 0,
        averageCommunicationRating: 0,
        averageValueRating: 0,
        ratingDistribution: [],
        verifiedReviewsCount: 0,
        reviewsWithResponseCount: 0,
      };
    }

    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
    const averageQualityRating = reviews.reduce((sum, review) => sum + review.qualityRating, 0) / totalReviews;
    const averageTimelinessRating = reviews.reduce((sum, review) => sum + review.timelinessRating, 0) / totalReviews;
    const averageCommunicationRating = reviews.reduce((sum, review) => sum + review.communicationRating, 0) / totalReviews;
    const averageValueRating = reviews.reduce((sum, review) => sum + review.valueRating, 0) / totalReviews;
    
    const verifiedReviewsCount = reviews.filter(review => review.isVerified).length;
    const reviewsWithResponseCount = reviews.filter(review => review.response !== null).length;

    return {
      totalReviews,
      averageRating: Math.round(averageRating * 100) / 100,
      averageQualityRating: Math.round(averageQualityRating * 100) / 100,
      averageTimelinessRating: Math.round(averageTimelinessRating * 100) / 100,
      averageCommunicationRating: Math.round(averageCommunicationRating * 100) / 100,
      averageValueRating: Math.round(averageValueRating * 100) / 100,
      ratingDistribution: ratingDistribution.map(item => ({
        rating: item.rating,
        count: item._count.rating,
      })),
      verifiedReviewsCount,
      reviewsWithResponseCount,
    };
  }

  async incrementHelpfulCount(reviewId: string): Promise<any> {
    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        helpfulCount: {
          increment: 1,
        },
      },
    });
  }

  async decrementHelpfulCount(reviewId: string): Promise<any> {
    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        helpfulCount: {
          decrement: 1,
        },
      },
    });
  }

  async findReviewsWithinEditWindow(): Promise<any[]> {
    const editWindowHours = 48; // 48 hours edit window
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - editWindowHours);

    return this.prisma.review.findMany({
      where: {
        createdAt: {
          gte: cutoffDate,
        },
        response: null, // Only reviews without responses can be edited
      },
    });
  }

  async findDuplicateReviews(): Promise<any[]> {
    // Find potential duplicate reviews (same reviewer giving multiple reviews to same reviewee)
    const duplicates = await this.prisma.$queryRaw<{reviewerId: string, revieweeId: string, count: bigint}[]>`
      SELECT "reviewerId", "revieweeId", COUNT(*) as count
      FROM "reviews"
      GROUP BY "reviewerId", "revieweeId"
      HAVING COUNT(*) > 1
    `;

    if (duplicates.length === 0) return [];

    const reviewIds = [];
    for (const duplicate of duplicates) {
      const reviews = await this.prisma.review.findMany({
        where: {
          reviewerId: duplicate.reviewerId,
          revieweeId: duplicate.revieweeId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      // Keep the latest review, mark others as duplicates
      reviewIds.push(...reviews.slice(1).map(r => r.id));
    }

    return this.prisma.review.findMany({
      where: {
        id: {
          in: reviewIds,
        },
      },
    });
  }

  async updateReviewResponse(reviewId: string, response: string, respondedAt: Date): Promise<any> {
    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        response,
        respondedAt,
      },
    });
  }

  async markAsVerified(reviewId: string): Promise<any> {
    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        isVerified: true,
      },
    });
  }
}
