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
  HttpStatus,
  HttpCode,
  Put,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { JobsService, User } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobQueryDto, JobStatisticsDto } from './dto/job-query.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UserRole } from '@prisma/client';

@ApiTags('Jobs')
@ApiBearerAuth()
@Controller('jobs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Create a new job' })
  @ApiResponse({ status: 201, description: 'Job created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - only clients can create jobs' })
  async create(@CurrentUser() user: User, @Body() createJobDto: CreateJobDto) {
    return this.jobsService.createJob(user, createJobDto);
  }

  @Put(':id/publish')
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Publish a draft job' })
  @ApiResponse({ status: 200, description: 'Job published successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - job cannot be published' })
  @ApiResponse({ status: 403, description: 'Forbidden - not job owner' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async publish(@CurrentUser() user: User, @Param('id') id: string) {
    return this.jobsService.publishJob(user, id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all jobs with filtering and pagination' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in title and description' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'budgetType', required: false, description: 'Filter by budget type' })
  @ApiQuery({ name: 'urgency', required: false, description: 'Filter by urgency' })
  @ApiQuery({ name: 'minBudget', required: false, description: 'Minimum budget' })
  @ApiQuery({ name: 'maxBudget', required: false, description: 'Maximum budget' })
  @ApiQuery({ name: 'city', required: false, description: 'Filter by city' })
  @ApiQuery({ name: 'province', required: false, description: 'Filter by province' })
  @ApiQuery({ name: 'latitude', required: false, description: 'Latitude for location search' })
  @ApiQuery({ name: 'longitude', required: false, description: 'Longitude for location search' })
  @ApiQuery({ name: 'radius', required: false, description: 'Search radius in km (default: 25)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 20)' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort by field' })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Sort order (asc/desc)' })
  @ApiResponse({ status: 200, description: 'Jobs retrieved successfully' })
  async findAll(@Query() query: JobQueryDto, @CurrentUser() user?: User) {
    return this.jobsService.findAllJobs(query, user);
  }

  @Get('my-jobs')
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Get current user jobs' })
  @ApiResponse({ status: 200, description: 'User jobs retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - only clients can view their jobs' })
  async findMyJobs(@CurrentUser() user: User) {
    return this.jobsService.findJobsByClient(user);
  }

  @Get('artisan/active')
  @Roles(UserRole.ARTISAN)
  @ApiOperation({ summary: 'Get active jobs for current artisan' })
  @ApiResponse({ status: 200, description: 'Active jobs retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - only artisans can view their active jobs' })
  async findArtisanActiveJobs(@CurrentUser() user: User) {
    return this.jobsService.findArtisanActiveJobs(user);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get job statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully', type: JobStatisticsDto })
  async getStatistics(@CurrentUser() user?: User): Promise<JobStatisticsDto> {
    return this.jobsService.getJobStatistics(user);
  }

  @Get('nearby')
  @Roles(UserRole.ARTISAN)
  @ApiOperation({ summary: 'Find jobs near location' })
  @ApiQuery({ name: 'latitude', required: true, description: 'Latitude coordinate' })
  @ApiQuery({ name: 'longitude', required: true, description: 'Longitude coordinate' })
  @ApiQuery({ name: 'radius', required: false, description: 'Search radius in km (default: 25)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum results (default: 50)' })
  @ApiResponse({ status: 200, description: 'Nearby jobs retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid coordinates' })
  async findNearbyJobs(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('radius') radius?: number,
    @Query('limit') limit?: number,
  ) {
    return this.jobsService.findJobsNearLocation(
      Number(latitude),
      Number(longitude),
      Number(radius) || 25,
      Number(limit) || 50,
    );
  }

  @Get('search')
  @ApiOperation({ summary: 'Search jobs by keyword' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category' })
  @ApiQuery({ name: 'city', required: false, description: 'Filter by city' })
  @ApiQuery({ name: 'province', required: false, description: 'Filter by province' })
  @ApiQuery({ name: 'minBudget', required: false, description: 'Minimum budget' })
  @ApiQuery({ name: 'maxBudget', required: false, description: 'Maximum budget' })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid search query' })
  async searchJobs(
    @Query('q') searchTerm: string,
    @Query('categoryId') categoryId?: string,
    @Query('city') city?: string,
    @Query('province') province?: string,
    @Query('minBudget') minBudget?: number,
    @Query('maxBudget') maxBudget?: number,
  ) {
    const filters = {
      categoryId,
      city,
      province,
      minBudget: minBudget ? Number(minBudget) : undefined,
      maxBudget: maxBudget ? Number(maxBudget) : undefined,
    };

    return this.jobsService.searchJobs(searchTerm, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get job by ID' })
  @ApiResponse({ status: 200, description: 'Job retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - no permission to view job' })
  async findOne(@Param('id') id: string, @CurrentUser() user?: User) {
    return this.jobsService.findJobById(id, user);
  }

  @Patch(':id')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update job' })
  @ApiResponse({ status: 200, description: 'Job updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error or job cannot be updated' })
  @ApiResponse({ status: 403, description: 'Forbidden - not job owner' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateJobDto: UpdateJobDto,
  ) {
    return this.jobsService.updateJob(user, id, updateJobDto);
  }

  @Put(':id/cancel')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Cancel a job' })
  @ApiResponse({ status: 200, description: 'Job cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - job cannot be cancelled' })
  @ApiResponse({ status: 403, description: 'Forbidden - not job owner' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async cancel(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.jobsService.cancelJob(user, id, reason);
  }

  @Put(':id/complete')
  @Roles(UserRole.CLIENT, UserRole.ARTISAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Mark job as completed (optionally with rating for artisan)' })
  @ApiResponse({ status: 200, description: 'Job completed successfully, escrow released with dynamic platform fee' })
  @ApiResponse({ status: 400, description: 'Bad request - job cannot be completed' })
  @ApiResponse({ status: 403, description: 'Forbidden - no permission to complete job' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async complete(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body?: { rating?: number },
  ) {
    return this.jobsService.completeJob(user, id, body?.rating);
  }

  @Delete(':id')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete job (clients can delete their own draft/cancelled jobs)' })
  @ApiResponse({ status: 204, description: 'Job deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - job cannot be deleted (has bids or wrong status)' })
  @ApiResponse({ status: 403, description: 'Forbidden - not job owner' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    await this.jobsService.deleteJob(user, id);
  }

  @Post('upload-image')
  @Roles(UserRole.CLIENT)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a single job image' })
  @ApiResponse({
    status: 201,
    description: 'Image uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string', example: '/uploads/jobs/job_1234567890.webp' },
        size: { type: 'number', example: 245678 },
        format: { type: 'string', example: 'webp' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid file type or size' })
  @ApiResponse({ status: 403, description: 'Forbidden - only clients can upload' })
  async uploadImage(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.jobsService.uploadJobImage(user, file);
  }

  @Post('upload-images')
  @Roles(UserRole.CLIENT)
  @UseInterceptors(FilesInterceptor('files', 5))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload multiple job images (max 5)' })
  @ApiResponse({
    status: 201,
    description: 'Images uploaded successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          url: { type: 'string', example: '/uploads/jobs/job_1234567890.webp' },
          size: { type: 'number', example: 245678 },
          format: { type: 'string', example: 'webp' },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid file type, size, or too many files' })
  @ApiResponse({ status: 403, description: 'Forbidden - only clients can upload' })
  async uploadImages(
    @CurrentUser() user: User,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.jobsService.uploadMultipleJobImages(user, files);
  }
}
