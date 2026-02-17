import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ReviewStatus, ReviewFlagReason } from '@prisma/client';
import {
  FlaggedReviewsQueryDto,
  EditReviewDto,
  ToggleVisibilityDto,
  DeleteReviewDto,
  FlagReviewDto,
  AddModerationNoteDto,
  BatchModerationDto,
  ExportReviewsDto,
  ReviewStatusDto,
  ReviewFlagReasonDto,
  PaginatedFlaggedReviewsDto,
  ReviewStatisticsDto,
  ReviewResponseDto,
  ReviewModerationActionResponseDto,
} from '../dto/review-moderation.dto';

@Injectable()
export class ReviewModerationService {
  constructor(private readonly prisma: PrismaService) {}

  private mapReviewToResponse(review: any): ReviewResponseDto {
    return {
      id: review.id,
      rating: review.rating,
      content: review.comment,
      jobId: review.jobId,
      reviewerId: review.reviewerId,
      artisanId: review.revieweeId,
      reviewer: {
        id: review.reviewer.id,
        email: review.reviewer.email,
        profile: review.reviewer.profile ? {
          firstName: review.reviewer.profile.firstName,
          lastName: review.reviewer.profile.lastName,
        } : undefined,
      },
      artisan: {
        id: review.reviewee.id,
        email: review.reviewee.email,
        profile: review.reviewee.profile ? {
          firstName: review.reviewee.profile.firstName,
          lastName: review.reviewee.profile.lastName,
                  } : undefined,
      },
      job: review.job ? {
        id: review.job.id,
        title: review.job.title,
      } : undefined,
      moderation: {
        id: review.id,
        reviewId: review.id,
        flagCount: review.flagCount,
        flags: review.flags || [],
        status: review.status as ReviewStatusDto,
        moderatedBy: review.moderatedBy,
        moderatedAt: review.moderatedAt,
        moderationNotes: review.moderationNotes || [],
        editHistory: review.editHistory || [],
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      },
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }

  async getAllReviews(query: FlaggedReviewsQueryDto): Promise<PaginatedFlaggedReviewsDto> {
    const { page = 1, limit = 20, status, flagReason, minRating, maxRating, startDate, endDate, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    if (minRating || maxRating) {
      where.rating = {};
      if (minRating) where.rating.gte = minRating;
      if (maxRating) where.rating.lte = maxRating;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (search) {
      where.OR = [
        { comment: { contains: search, mode: 'insensitive' } },
        { reviewer: { email: { contains: search, mode: 'insensitive' } } },
        { reviewee: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (flagReason) {
      where.flags = {
        some: {
          reason: flagReason,
        },
      };
    }

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          reviewer: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          reviewee: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                                  },
              },
            },
          },
          job: {
            select: {
              id: true,
              title: true,
            },
          },
          flags: true,
          moderationNotes: {
            include: {
              admin: {
                select: {
                  id: true,
                  email: true,
                  profile: {
                    select: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
          editHistory: {
            include: {
              editor: {
                select: {
                  id: true,
                  email: true,
                  profile: {
                    select: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      reviews: reviews.map(r => this.mapReviewToResponse(r)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getFlaggedReviews(query: FlaggedReviewsQueryDto): Promise<PaginatedFlaggedReviewsDto> {
    const { page = 1, limit = 20, status, flagReason, minRating, maxRating, startDate, endDate, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      isFlagged: true,
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    if (minRating || maxRating) {
      where.rating = {};
      if (minRating) where.rating.gte = minRating;
      if (maxRating) where.rating.lte = maxRating;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (search) {
      where.OR = [
        { comment: { contains: search, mode: 'insensitive' } },
        { reviewer: { email: { contains: search, mode: 'insensitive' } } },
        { reviewee: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (flagReason) {
      where.flags = {
        some: {
          reason: flagReason,
        },
      };
    }

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          reviewer: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          reviewee: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                                  },
              },
            },
          },
          job: {
            select: {
              id: true,
              title: true,
            },
          },
          flags: true,
          moderationNotes: {
            include: {
              admin: {
                select: {
                  id: true,
                  email: true,
                  profile: {
                    select: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
          editHistory: {
            include: {
              editor: {
                select: {
                  id: true,
                  email: true,
                  profile: {
                    select: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: [{ flagCount: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      reviews: reviews.map(r => this.mapReviewToResponse(r)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getReviewById(reviewId: string): Promise<ReviewResponseDto> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        reviewer: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        reviewee: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                              },
            },
          },
        },
        job: {
          select: {
            id: true,
            title: true,
          },
        },
        flags: true,
        moderationNotes: {
          include: {
            admin: {
              select: {
                id: true,
                email: true,
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        editHistory: {
          include: {
            editor: {
              select: {
                id: true,
                email: true,
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return this.mapReviewToResponse(review);
  }

  async editReview(
    reviewId: string,
    dto: EditReviewDto,
    adminId: string,
  ): Promise<ReviewModerationActionResponseDto> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Create edit history record
    await this.prisma.reviewEditHistory.create({
      data: {
        reviewId,
        previousRating: review.rating,
        newRating: dto.rating,
        previousContent: review.comment,
        newContent: dto.content,
        editedBy: adminId,
        editReason: dto.editReason,
      },
    });

    // Update the review
    const updatedReview = await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        rating: dto.rating,
        comment: dto.content,
        moderatedBy: adminId,
        moderatedAt: new Date(),
      },
      include: {
        reviewer: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        reviewee: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                              },
            },
          },
        },
        job: {
          select: {
            id: true,
            title: true,
          },
        },
        flags: true,
        moderationNotes: true,
        editHistory: true,
      },
    });

    return {
      success: true,
      message: 'Review edited successfully',
      review: this.mapReviewToResponse(updatedReview),
    };
  }

  async toggleVisibility(
    reviewId: string,
    dto: ToggleVisibilityDto,
    adminId: string,
  ): Promise<ReviewModerationActionResponseDto> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    const newStatus = dto.visible ? ReviewStatus.VISIBLE : ReviewStatus.HIDDEN;

    // Add moderation note
    await this.prisma.reviewModerationNote.create({
      data: {
        reviewId,
        content: `Review ${dto.visible ? 'shown' : 'hidden'}: ${dto.reason}`,
        createdBy: adminId,
      },
    });

    // Update review status
    const updatedReview = await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        status: newStatus,
        moderatedBy: adminId,
        moderatedAt: new Date(),
      },
      include: {
        reviewer: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        reviewee: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                              },
            },
          },
        },
        job: {
          select: {
            id: true,
            title: true,
          },
        },
        flags: true,
        moderationNotes: true,
        editHistory: true,
      },
    });

    return {
      success: true,
      message: `Review ${dto.visible ? 'shown' : 'hidden'} successfully`,
      review: this.mapReviewToResponse(updatedReview),
    };
  }

  async deleteReview(
    reviewId: string,
    dto: DeleteReviewDto,
    adminId: string,
  ): Promise<ReviewModerationActionResponseDto> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Add moderation note
    await this.prisma.reviewModerationNote.create({
      data: {
        reviewId,
        content: `Review deleted: ${dto.reason}`,
        createdBy: adminId,
      },
    });

    // Soft delete the review
    await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        status: ReviewStatus.DELETED,
        deletedAt: new Date(),
        moderatedBy: adminId,
        moderatedAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Review deleted successfully',
    };
  }

  async flagReview(
    reviewId: string,
    dto: FlagReviewDto,
    userId: string,
  ): Promise<ReviewModerationActionResponseDto> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Check if user already flagged this review
    const existingFlag = await this.prisma.reviewFlag.findUnique({
      where: {
        reviewId_flaggedBy: {
          reviewId,
          flaggedBy: userId,
        },
      },
    });

    if (existingFlag) {
      throw new BadRequestException('You have already flagged this review');
    }

    // Create flag
    await this.prisma.reviewFlag.create({
      data: {
        reviewId,
        flaggedBy: userId,
        reason: dto.reason as ReviewFlagReason,
        description: dto.description,
      },
    });

    // Update review flag count and status
    const updatedReview = await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        isFlagged: true,
        flagCount: { increment: 1 },
      },
      include: {
        reviewer: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        reviewee: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                              },
            },
          },
        },
        job: {
          select: {
            id: true,
            title: true,
          },
        },
        flags: true,
        moderationNotes: true,
        editHistory: true,
      },
    });

    return {
      success: true,
      message: 'Review flagged successfully',
      review: this.mapReviewToResponse(updatedReview),
    };
  }

  async unflagReview(
    reviewId: string,
    adminId: string,
  ): Promise<ReviewModerationActionResponseDto> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Remove all flags
    await this.prisma.reviewFlag.deleteMany({
      where: { reviewId },
    });

    // Add moderation note
    await this.prisma.reviewModerationNote.create({
      data: {
        reviewId,
        content: 'Review unflagged by admin - all flags cleared',
        createdBy: adminId,
      },
    });

    // Update review
    const updatedReview = await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        isFlagged: false,
        flagCount: 0,
        moderatedBy: adminId,
        moderatedAt: new Date(),
      },
      include: {
        reviewer: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        reviewee: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                              },
            },
          },
        },
        job: {
          select: {
            id: true,
            title: true,
          },
        },
        flags: true,
        moderationNotes: true,
        editHistory: true,
      },
    });

    return {
      success: true,
      message: 'Review unflagged successfully',
      review: this.mapReviewToResponse(updatedReview),
    };
  }

  async addModerationNote(
    reviewId: string,
    dto: AddModerationNoteDto,
    adminId: string,
  ): Promise<ReviewModerationActionResponseDto> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    await this.prisma.reviewModerationNote.create({
      data: {
        reviewId,
        content: dto.content,
        createdBy: adminId,
      },
    });

    const updatedReview = await this.getReviewById(reviewId);

    return {
      success: true,
      message: 'Moderation note added successfully',
      review: updatedReview,
    };
  }

  async getModerationNotes(reviewId: string) {
    const notes = await this.prisma.reviewModerationNote.findMany({
      where: { reviewId },
      include: {
        admin: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return notes;
  }

  async getEditHistory(reviewId: string) {
    const history = await this.prisma.reviewEditHistory.findMany({
      where: { reviewId },
      include: {
        editor: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return history;
  }

  async batchModeration(
    dto: BatchModerationDto,
    adminId: string,
  ): Promise<ReviewModerationActionResponseDto> {
    const { reviewIds, action, reason } = dto;

    for (const reviewId of reviewIds) {
      switch (action) {
        case 'HIDE':
          await this.toggleVisibility(reviewId, { visible: false, reason }, adminId);
          break;
        case 'SHOW':
          await this.toggleVisibility(reviewId, { visible: true, reason }, adminId);
          break;
        case 'DELETE':
          await this.deleteReview(reviewId, { reason }, adminId);
          break;
      }
    }

    return {
      success: true,
      message: `Successfully ${action.toLowerCase()}ed ${reviewIds.length} reviews`,
    };
  }

  async exportFlaggedReviews(dto: ExportReviewsDto): Promise<string> {
    const { filters = {}, format } = dto;
    const reviews = await this.getFlaggedReviews({ ...filters, limit: 10000 });

    if (format === 'JSON') {
      return JSON.stringify(reviews.reviews, null, 2);
    }

    // CSV format
    const headers = ['ID', 'Rating', 'Content', 'Reviewer', 'Artisan', 'Job', 'Status', 'Flag Count', 'Created At'];
    const rows = reviews.reviews.map(review => [
      review.id,
      review.rating,
      `"${(review.content || '').replace(/"/g, '""')}"`,
      `${review.reviewer.profile?.firstName || ''} ${review.reviewer.profile?.lastName || ''}`.trim() || review.reviewer.email,
      `${review.artisan.profile?.firstName || ''} ${review.artisan.profile?.lastName || ''}`.trim() || review.artisan.email,
      review.job?.title || '',
      review.moderation?.status || 'VISIBLE',
      review.moderation?.flagCount || 0,
      review.createdAt,
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  async getStatistics(): Promise<ReviewStatisticsDto> {
    const [totalFlagged, visible, hidden, deleted] = await Promise.all([
      this.prisma.review.count({ where: { isFlagged: true, deletedAt: null } }),
      this.prisma.review.count({ where: { status: ReviewStatus.VISIBLE, deletedAt: null } }),
      this.prisma.review.count({ where: { status: ReviewStatus.HIDDEN, deletedAt: null } }),
      this.prisma.review.count({ where: { status: ReviewStatus.DELETED } }),
    ]);

    return {
      totalFlagged,
      visible,
      hidden,
      deleted,
    };
  }
}
