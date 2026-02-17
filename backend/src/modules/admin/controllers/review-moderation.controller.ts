import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { ReviewModerationService } from '../services/review-moderation.service';
import {
  FlaggedReviewsQueryDto,
  EditReviewDto,
  ToggleVisibilityDto,
  DeleteReviewDto,
  FlagReviewDto,
  AddModerationNoteDto,
  BatchModerationDto,
  ExportReviewsDto,
  PaginatedFlaggedReviewsDto,
  ReviewStatisticsDto,
  ReviewResponseDto,
  ReviewModerationActionResponseDto,
} from '../dto/review-moderation.dto';

@ApiTags('Admin - Review Moderation')
@Controller('admin/reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class ReviewModerationController {
  constructor(private readonly reviewModerationService: ReviewModerationService) {}

  @Get()
  @ApiOperation({ summary: 'Get all reviews with filtering' })
  @ApiQuery({ name: 'status', required: false, enum: ['VISIBLE', 'HIDDEN', 'DELETED'] })
  @ApiQuery({ name: 'flagReason', required: false, enum: ['SPAM', 'INAPPROPRIATE', 'FAKE', 'OFFENSIVE', 'OTHER'] })
  @ApiQuery({ name: 'minRating', required: false, type: Number })
  @ApiQuery({ name: 'maxRating', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of reviews' })
  async getAllReviews(
    @Query() query: FlaggedReviewsQueryDto,
  ): Promise<PaginatedFlaggedReviewsDto> {
    return this.reviewModerationService.getAllReviews(query);
  }

  @Get('flagged')
  @ApiOperation({ summary: 'Get flagged reviews only' })
  @ApiQuery({ name: 'status', required: false, enum: ['VISIBLE', 'HIDDEN', 'DELETED'] })
  @ApiQuery({ name: 'flagReason', required: false, enum: ['SPAM', 'INAPPROPRIATE', 'FAKE', 'OFFENSIVE', 'OTHER'] })
  @ApiQuery({ name: 'minRating', required: false, type: Number })
  @ApiQuery({ name: 'maxRating', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of flagged reviews' })
  async getFlaggedReviews(
    @Query() query: FlaggedReviewsQueryDto,
  ): Promise<PaginatedFlaggedReviewsDto> {
    return this.reviewModerationService.getFlaggedReviews(query);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get review moderation statistics' })
  @ApiResponse({ status: 200, description: 'Review statistics' })
  async getStatistics(): Promise<ReviewStatisticsDto> {
    return this.reviewModerationService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get review details by ID' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ status: 200, description: 'Review details' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async getReviewById(@Param('id') reviewId: string): Promise<ReviewResponseDto> {
    return this.reviewModerationService.getReviewById(reviewId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Edit review content and rating' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ status: 200, description: 'Review edited successfully' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async editReview(
    @Param('id') reviewId: string,
    @Body() dto: EditReviewDto,
    @CurrentUser('id') adminId: string,
  ): Promise<ReviewModerationActionResponseDto> {
    return this.reviewModerationService.editReview(reviewId, dto, adminId);
  }

  @Patch(':id/visibility')
  @ApiOperation({ summary: 'Toggle review visibility (hide/show)' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ status: 200, description: 'Visibility updated successfully' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async toggleVisibility(
    @Param('id') reviewId: string,
    @Body() dto: ToggleVisibilityDto,
    @CurrentUser('id') adminId: string,
  ): Promise<ReviewModerationActionResponseDto> {
    return this.reviewModerationService.toggleVisibility(reviewId, dto, adminId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete review (soft delete)' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ status: 200, description: 'Review deleted successfully' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async deleteReview(
    @Param('id') reviewId: string,
    @Body() dto: DeleteReviewDto,
    @CurrentUser('id') adminId: string,
  ): Promise<ReviewModerationActionResponseDto> {
    return this.reviewModerationService.deleteReview(reviewId, dto, adminId);
  }

  @Post(':id/flag')
  @ApiOperation({ summary: 'Flag a review' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ status: 201, description: 'Review flagged successfully' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async flagReview(
    @Param('id') reviewId: string,
    @Body() dto: FlagReviewDto,
    @CurrentUser('id') userId: string,
  ): Promise<ReviewModerationActionResponseDto> {
    return this.reviewModerationService.flagReview(reviewId, dto, userId);
  }

  @Post(':id/unflag')
  @ApiOperation({ summary: 'Unflag a review (admin only)' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ status: 200, description: 'Review unflagged successfully' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async unflagReview(
    @Param('id') reviewId: string,
    @CurrentUser('id') adminId: string,
  ): Promise<ReviewModerationActionResponseDto> {
    return this.reviewModerationService.unflagReview(reviewId, adminId);
  }

  @Post(':id/notes')
  @ApiOperation({ summary: 'Add moderation note to a review' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ status: 201, description: 'Note added successfully' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async addModerationNote(
    @Param('id') reviewId: string,
    @Body() dto: AddModerationNoteDto,
    @CurrentUser('id') adminId: string,
  ): Promise<ReviewModerationActionResponseDto> {
    return this.reviewModerationService.addModerationNote(reviewId, dto, adminId);
  }

  @Get(':id/notes')
  @ApiOperation({ summary: 'Get moderation notes for a review' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ status: 200, description: 'Moderation notes' })
  async getModerationNotes(@Param('id') reviewId: string) {
    return this.reviewModerationService.getModerationNotes(reviewId);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get edit history for a review' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ status: 200, description: 'Edit history' })
  async getEditHistory(@Param('id') reviewId: string) {
    return this.reviewModerationService.getEditHistory(reviewId);
  }

  @Post('batch')
  @ApiOperation({ summary: 'Perform batch moderation action' })
  @ApiResponse({ status: 200, description: 'Batch action completed' })
  async batchModeration(
    @Body() dto: BatchModerationDto,
    @CurrentUser('id') adminId: string,
  ): Promise<ReviewModerationActionResponseDto> {
    return this.reviewModerationService.batchModeration(dto, adminId);
  }

  @Post('export')
  @ApiOperation({ summary: 'Export flagged reviews' })
  @ApiResponse({ status: 200, description: 'Exported reviews' })
  async exportReviews(
    @Body() dto: ExportReviewsDto,
    @Res() res: Response,
  ) {
    const data = await this.reviewModerationService.exportFlaggedReviews(dto);

    const contentType = dto.format === 'JSON' ? 'application/json' : 'text/csv';
    const extension = dto.format.toLowerCase();
    const filename = `flagged-reviews-${new Date().toISOString().split('T')[0]}.${extension}`;

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(data);
  }
}
