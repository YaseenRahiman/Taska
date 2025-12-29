import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import {
  CreateReviewDto,
  UpdateReviewDto,
  ReviewQueryDto,
  ReviewResponseDto,
  ReviewHelpfulVoteDto,
} from './dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Reviews')
@Controller('reviews')
@UseGuards(RolesGuard)
@ApiBearerAuth()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a review after job completion' })
  @ApiResponse({
    status: 201,
    description: 'Review created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid data or business rules violated',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not authorized to review this job',
  })
  @ApiResponse({
    status: 404,
    description: 'Job not found',
  })
  async createReview(
    @Body() createReviewDto: CreateReviewDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.reviewsService.createReview(createReviewDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get reviews with advanced filtering and pagination' })
  @ApiResponse({
    status: 200,
    description: 'Reviews retrieved successfully',
  })
  async getReviews(@Query() query: ReviewQueryDto) {
    return this.reviewsService.getReviews(query);
  }

  @Get('my-reviews-given')
  @ApiOperation({ summary: 'Get reviews given by current user' })
  @ApiResponse({
    status: 200,
    description: 'User reviews retrieved successfully',
  })
  async getMyReviewsGiven(
    @CurrentUser('id') userId: string,
    @Query() query: ReviewQueryDto,
  ) {
    return this.reviewsService.getUserReviewsGiven(userId, query);
  }

  @Get('my-reviews-received')
  @ApiOperation({ summary: 'Get reviews received by current user' })
  @ApiResponse({
    status: 200,
    description: 'User reviews retrieved successfully',
  })
  async getMyReviewsReceived(
    @CurrentUser('id') userId: string,
    @Query() query: ReviewQueryDto,
  ) {
    return this.reviewsService.getUserReviewsReceived(userId, query);
  }

  @Get('statistics/:userId')
  @ApiOperation({ summary: 'Get user review statistics' })
  @ApiParam({
    name: 'userId',
    description: 'ID of the user to get statistics for',
  })
  @ApiResponse({
    status: 200,
    description: 'User statistics retrieved successfully',
  })
  async getUserStatistics(@Param('userId') userId: string) {
    return this.reviewsService.getUserReviewStatistics(userId);
  }

  @Get('aggregate-rating/:userId')
  @ApiOperation({ summary: 'Get user aggregate rating' })
  @ApiParam({
    name: 'userId',
    description: 'ID of the user to get aggregate rating for',
  })
  @ApiResponse({
    status: 200,
    description: 'User aggregate rating retrieved successfully',
  })
  async getUserAggregateRating(@Param('userId') userId: string) {
    return this.reviewsService.getUserAggregateRating(userId);
  }

  @Get('job/:jobId')
  @ApiOperation({ summary: 'Get all reviews for a specific job' })
  @ApiParam({
    name: 'jobId',
    description: 'ID of the job to get reviews for',
  })
  @ApiResponse({
    status: 200,
    description: 'Job reviews retrieved successfully',
  })
  async getJobReviews(@Param('jobId') jobId: string) {
    return this.reviewsService.getJobReviews(jobId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific review by ID' })
  @ApiParam({
    name: 'id',
    description: 'ID of the review to retrieve',
  })
  @ApiResponse({
    status: 200,
    description: 'Review retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Review not found',
  })
  async getReviewById(@Param('id') id: string) {
    return this.reviewsService.getReviewById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a review (within 48-hour window)' })
  @ApiParam({
    name: 'id',
    description: 'ID of the review to update',
  })
  @ApiResponse({
    status: 200,
    description: 'Review updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Review cannot be edited',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not authorized to update this review',
  })
  @ApiResponse({
    status: 404,
    description: 'Review not found',
  })
  async updateReview(
    @Param('id') id: string,
    @Body() updateReviewDto: UpdateReviewDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.reviewsService.updateReview(id, updateReviewDto, userId);
  }

  @Post(':id/respond')
  @ApiOperation({ summary: 'Respond to a review (for reviewee)' })
  @ApiParam({
    name: 'id',
    description: 'ID of the review to respond to',
  })
  @ApiResponse({
    status: 201,
    description: 'Review response added successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Already responded or invalid data',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not authorized to respond to this review',
  })
  @ApiResponse({
    status: 404,
    description: 'Review not found',
  })
  async respondToReview(
    @Param('id') id: string,
    @Body() responseDto: ReviewResponseDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.reviewsService.respondToReview(id, responseDto.response, userId);
  }

  @Post(':id/helpful')
  @ApiOperation({ summary: 'Vote on review helpfulness' })
  @ApiParam({
    name: 'id',
    description: 'ID of the review to vote on',
  })
  @ApiResponse({
    status: 201,
    description: 'Vote recorded successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Cannot vote on own reviews',
  })
  @ApiResponse({
    status: 404,
    description: 'Review not found',
  })
  @HttpCode(HttpStatus.OK)
  async voteHelpfulness(
    @Param('id') id: string,
    @Body() voteDto: ReviewHelpfulVoteDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.reviewsService.voteReviewHelpfulness(id, voteDto.helpful, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a review (within edit window or admin)' })
  @ApiParam({
    name: 'id',
    description: 'ID of the review to delete',
  })
  @ApiResponse({
    status: 204,
    description: 'Review deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Review cannot be deleted',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not authorized to delete this review',
  })
  @ApiResponse({
    status: 404,
    description: 'Review not found',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteReview(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    const isAdmin = userRole === 'ADMIN';
    await this.reviewsService.deleteReview(id, userId, isAdmin);
  }

  // Admin-only endpoints
  @Post(':id/verify')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Mark review as verified (Admin only)' })
  @ApiParam({
    name: 'id',
    description: 'ID of the review to verify',
  })
  @ApiResponse({
    status: 200,
    description: 'Review verified successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({
    status: 404,
    description: 'Review not found',
  })
  async verifyReview(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.reviewsService.markReviewAsVerified(id, adminId);
  }

  @Get('admin/fraud-detection')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Run fraud detection analysis (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Fraud detection analysis completed',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async detectFraud() {
    return this.reviewsService.detectFraudulentReviews();
  }

  // Public endpoints (no authentication required)
  @Get('public/user/:userId/aggregate')
  @ApiOperation({ summary: 'Get public user aggregate rating (no auth required)' })
  @ApiParam({
    name: 'userId',
    description: 'ID of the user to get public rating for',
  })
  @ApiResponse({
    status: 200,
    description: 'Public user rating retrieved successfully',
  })
  async getPublicUserRating(@Param('userId') userId: string) {
    // Only return basic aggregate data for public consumption
    const rating = await this.reviewsService.getUserAggregateRating(userId);
    return {
      averageRating: rating.averageRating,
      totalReviews: rating.totalReviews,
      // Don't expose detailed breakdown publicly
    };
  }

  @Get('public/user/:userId/reviews')
  @ApiOperation({ summary: 'Get public user reviews (no auth required)' })
  @ApiParam({
    name: 'userId',
    description: 'ID of the user to get public reviews for',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of reviews to return (max 20)',
  })
  @ApiResponse({
    status: 200,
    description: 'Public user reviews retrieved successfully',
  })
  async getPublicUserReviews(
    @Param('userId') userId: string,
    @Query('limit') limit?: number,
  ) {
    const maxLimit = Math.min(limit || 10, 20); // Max 20 for public endpoint
    const query = new ReviewQueryDto();
    query.revieweeId = userId;
    query.limit = maxLimit;
    query.isVerified = true; // Only show verified reviews publicly
    
    const reviews = await this.reviewsService.getUserReviewsReceived(userId, query);
    
    // Filter out sensitive information for public consumption
    return reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      qualityRating: review.qualityRating,
      timelinessRating: review.timelinessRating,
      communicationRating: review.communicationRating,
      valueRating: review.valueRating,
      comment: review.comment,
      images: review.images,
      response: review.response,
      isVerified: review.isVerified,
      helpfulCount: review.helpfulCount,
      createdAt: review.createdAt,
      // Don't expose reviewer details or job details publicly
      reviewer: {
        profile: {
          firstName: review.reviewer.profile?.firstName || 'Anonymous',
          // Don't expose other reviewer details
        },
      },
    }));
  }
}
