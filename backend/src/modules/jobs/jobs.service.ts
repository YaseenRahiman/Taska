import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { LoggingService } from '../../common/logging/logging.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JobsRepository, JobWithRelations } from './jobs.repository';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobQueryDto, JobStatisticsDto } from './dto/job-query.dto';
import { JobMatchingService } from './services/job-matching.service';
import { ImageProcessingService } from './services/image-processing.service';
import { GeocodingService } from './services/geocoding.service';
import { EscrowService } from '../payments/services/escrow.service';
import { JobStatus, UserRole } from '@prisma/client';

export interface User {
  id: string;
  role: UserRole;
  profile?: {
    latitude?: number;
    longitude?: number;
  };
}

@Injectable()
export class JobsService {
  constructor(
    private readonly jobsRepository: JobsRepository,
    private readonly jobMatchingService: JobMatchingService,
    private readonly imageProcessingService: ImageProcessingService,
    private readonly geocodingService: GeocodingService,
    private readonly logger: LoggingService,
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => EscrowService))
    private readonly escrowService: EscrowService,
  ) {}

  async createJob(user: User, createJobDto: CreateJobDto): Promise<JobWithRelations> {
    if (user.role !== UserRole.CLIENT) {
      throw new ForbiddenException('Only clients can create jobs');
    }

    this.logger.info(`Creating job for user ${user.id}`, 'JobsService');

    try {
      // Validate budget against system settings
      await this.validateBudget(createJobDto.budget);

      // Validate category exists
      await this.validateCategory(createJobDto.categoryId);

      // Process images if provided
      let processedImages: string[] = [];
      if (createJobDto.images && createJobDto.images.length > 0) {
        processedImages = await this.imageProcessingService.processJobImages(createJobDto.images);
      }

      // Create job with processed images
      const { isDraft, ...jobData } = createJobDto;
      const job = await this.jobsRepository.createJob(user.id, {
        ...jobData,
        images: processedImages,
      });

      // If not saving as draft, publish immediately
      let finalJob = job;
      if (isDraft === false) {
        finalJob = await this.jobsRepository.updateJobStatus(job.id, JobStatus.OPEN, user.id);
      }

      // Log activity
      await this.logActivity(user.id, finalJob.id, 'CREATE_JOB', 'Job', finalJob.id, null, {
        title: finalJob.title,
        budget: finalJob.budget,
        categoryId: finalJob.categoryId,
      });

      this.logger.info(`Job created successfully`, 'JobsService');

      return finalJob;
    } catch (error) {
      this.logger.error('Error creating job', 'JobsService');
      throw error;
    }
  }

  async publishJob(user: User, jobId: string): Promise<JobWithRelations> {
    const job = await this.findJobById(jobId, user);
    
    if (job.clientId !== user.id) {
      throw new ForbiddenException('You can only publish your own jobs');
    }

    if (job.status !== JobStatus.DRAFT) {
      throw new BadRequestException('Only draft jobs can be published');
    }

    try {
      const publishedJob = await this.jobsRepository.updateJobStatus(jobId, JobStatus.OPEN, user.id);

      // Find and notify matching artisans
      await this.jobMatchingService.notifyMatchingArtisans(publishedJob);

      // Log activity
      await this.logActivity(user.id, jobId, 'PUBLISH_JOB', 'Job', jobId, 
        { status: JobStatus.DRAFT }, 
        { status: JobStatus.OPEN }
      );

      this.logger.info(`Job published successfully`, 'JobsService');

      return publishedJob;
    } catch (error) {
      this.logger.error('Error publishing job', 'JobsService');
      throw error;
    }
  }

  async findAllJobs(query: JobQueryDto, user?: User): Promise<{
    data: JobWithRelations[];
    meta: {
      total: number;
      page: number;
      limit: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }> {
    try {
      // If user is artisan and location-based search is requested
      if (user?.role === UserRole.ARTISAN && query.latitude && query.longitude) {
        const nearbyJobs = await this.jobsRepository.findNearbyJobs(
          query.latitude,
          query.longitude,
          query.radius || 25,
          query.limit || 20,
        );

        return {
          data: nearbyJobs,
          meta: {
            total: nearbyJobs.length,
            page: 1,
            limit: nearbyJobs.length,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        };
      }

      const result = await this.jobsRepository.findJobsByQuery(query);

      return {
        data: result.jobs,
        meta: {
          total: result.total,
          page: query.page,
          limit: query.limit,
          hasNextPage: result.hasNextPage,
          hasPreviousPage: result.hasPreviousPage,
        },
      };
    } catch (error) {
      this.logger.error('Error finding jobs', 'JobsService');
      throw error;
    }
  }

  async findJobById(id: string, user?: User): Promise<JobWithRelations> {
    const job = await this.jobsRepository.findJobById(id);
    
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Check permissions
    if (user) {
      const canView = await this.canUserViewJob(user, job);
      if (!canView) {
        throw new ForbiddenException('You do not have permission to view this job');
      }
    }

    return job;
  }

  async findJobsByClient(user: User): Promise<JobWithRelations[]> {
    if (user.role !== UserRole.CLIENT) {
      throw new ForbiddenException('Only clients can view their jobs');
    }

    return this.jobsRepository.findJobsByClient(user.id);
  }

  async findArtisanActiveJobs(user: User): Promise<JobWithRelations[]> {
    if (user.role !== UserRole.ARTISAN) {
      throw new ForbiddenException('Only artisans can view their active jobs');
    }

    // Find jobs where the artisan has an accepted bid and job is IN_PROGRESS
    const jobs = await this.prisma.job.findMany({
      where: {
        status: JobStatus.IN_PROGRESS,
        bids: {
          some: {
            artisanId: user.id,
            status: 'ACCEPTED',
          },
        },
      },
      include: {
        client: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                profilePictureUrl: true,
              },
            },
          },
        },
        category: true,
        bids: {
          where: {
            artisanId: user.id,
          },
          include: {
            artisan: {
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
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return jobs as JobWithRelations[];
  }

  async updateJob(user: User, id: string, updateJobDto: UpdateJobDto): Promise<JobWithRelations> {
    const job = await this.findJobById(id, user);

    if (job.clientId !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only update your own jobs');
    }

    // Check if job can be updated
    if (job.status === JobStatus.COMPLETED || job.status === JobStatus.CANCELLED) {
      throw new BadRequestException('Cannot update completed or cancelled jobs');
    }

    // Check if job has accepted bids
    const hasAcceptedBids = job.bids.some(bid => bid.status === 'ACCEPTED');
    if (hasAcceptedBids && updateJobDto.budget) {
      throw new BadRequestException('Cannot change budget after accepting a bid');
    }

    try {
      const oldData = { ...job };
      const updatedJob = await this.prisma.job.update({
        where: { id },
        data: {
          ...updateJobDto,
          updatedAt: new Date(),
        },
        include: this.jobsRepository['getJobIncludes'](),
      });

      // Log activity
      await this.logActivity(user.id, id, 'UPDATE_JOB', 'Job', id, oldData, updateJobDto);

      this.logger.info(`Job updated successfully`, 'JobsService');

      return updatedJob;
    } catch (error) {
      this.logger.error('Error updating job', 'JobsService');
      throw error;
    }
  }

  async cancelJob(user: User, id: string, reason: string): Promise<JobWithRelations> {
    const job = await this.findJobById(id, user);

    if (job.clientId !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only cancel your own jobs');
    }

    if (job.status === JobStatus.COMPLETED || job.status === JobStatus.CANCELLED) {
      throw new BadRequestException('Job is already completed or cancelled');
    }

    try {
      const cancelledJob = await this.prisma.job.update({
        where: { id },
        data: {
          status: JobStatus.CANCELLED,
          cancelledAt: new Date(),
          cancellationReason: reason,
          updatedAt: new Date(),
        },
        include: this.jobsRepository['getJobIncludes'](),
      });

      // Handle refunds for jobs with accepted bids
      const acceptedBids = job.bids.filter(bid => bid.status === 'ACCEPTED');
      if (acceptedBids.length > 0) {
        // TODO: Process refunds through payment service
        this.logger.info(`Processing refunds for cancelled job`, 'JobsService');
      }

      // Log activity
      await this.logActivity(user.id, id, 'CANCEL_JOB', 'Job', id,
        { status: job.status },
        { status: JobStatus.CANCELLED, reason }
      );

      this.logger.info(`Job cancelled successfully`, 'JobsService');

      return cancelledJob;
    } catch (error) {
      this.logger.error('Error cancelling job', 'JobsService');
      throw error;
    }
  }

  async completeJob(user: User, id: string, rating?: number): Promise<JobWithRelations> {
    const job = await this.findJobById(id, user);

    // Allow both client and assigned artisan to mark as complete
    const acceptedBid = job.bids.find(bid => bid.status === 'ACCEPTED');
    const hasPermission = job.clientId === user.id ||
      (acceptedBid && acceptedBid.artisanId === user.id) ||
      user.role === UserRole.ADMIN;

    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission to complete this job');
    }

    if (job.status !== JobStatus.IN_PROGRESS) {
      throw new BadRequestException('Only in-progress jobs can be completed');
    }

    try {
      // Find the payment record for this job
      const payment = await this.prisma.payment.findFirst({
        where: {
          jobId: id,
          escrowStatus: 'HELD',
        },
      });

      if (payment) {
        // Check if this is a repeat client (has previous completed jobs with this artisan)
        let isRepeatClient = false;
        if (acceptedBid) {
          const previousJobs = await this.prisma.job.count({
            where: {
              clientId: job.clientId,
              status: 'COMPLETED',
              bids: {
                some: {
                  artisanId: acceptedBid.artisanId,
                  status: 'ACCEPTED',
                },
              },
              id: { not: id }, // Exclude current job
            },
          });
          isRepeatClient = previousJobs > 0;
        }

        // Release escrow with dynamic platform fee based on artisan level
        // This also updates artisan stats and awards loyalty points
        await this.escrowService.releaseFunds(
          payment.id,
          user.id,
          'Job completed successfully',
          rating,
          isRepeatClient,
        );

        this.logger.info(`Escrow released for job ${id} with dynamic platform fee`, 'JobsService');
      } else {
        this.logger.warn(`No held escrow payment found for job ${id}`, 'JobsService');
      }

      // Update job status
      const completedJob = await this.jobsRepository.updateJobStatus(id, JobStatus.COMPLETED, user.id);

      // Log activity
      await this.logActivity(user.id, id, 'COMPLETE_JOB', 'Job', id,
        { status: JobStatus.IN_PROGRESS },
        { status: JobStatus.COMPLETED, rating }
      );

      this.logger.info(`Job completed successfully`, 'JobsService');

      return completedJob;
    } catch (error) {
      this.logger.error('Error completing job', 'JobsService');
      throw error;
    }
  }

  async getJobStatistics(user?: User): Promise<JobStatisticsDto> {
    try {
      const clientId = user?.role === UserRole.CLIENT ? user.id : undefined;
      const stats = await this.jobsRepository.getJobStatistics(clientId);

      this.logger.info(`Job statistics retrieved`, 'JobsService');

      return stats;
    } catch (error) {
      this.logger.error('Error getting job statistics', 'JobsService');
      throw error;
    }
  }

  async findJobsNearLocation(
    latitude: number,
    longitude: number,
    radiusKm: number = 25,
    limit: number = 50,
  ): Promise<JobWithRelations[]> {
    try {
      return this.jobsRepository.findNearbyJobs(latitude, longitude, radiusKm, limit);
    } catch (error) {
      this.logger.error('Error finding nearby jobs', 'JobsService');
      throw error;
    }
  }

  async searchJobs(searchTerm: string, filters?: Partial<JobQueryDto>): Promise<JobWithRelations[]> {
    const query = Object.assign(new JobQueryDto(), {
      search: searchTerm,
      page: 1,
      limit: 50,
      ...filters,
    });

    const result = await this.jobsRepository.findJobsByQuery(query);
    return result.jobs;
  }

  async uploadJobImage(user: User, file: Express.Multer.File): Promise<{ url: string; size: number; format: string }> {
    if (user.role !== UserRole.CLIENT) {
      throw new ForbiddenException('Only clients can upload job images');
    }

    try {
      this.logger.info('Processing uploaded job image', 'JobsService');

      const result = await this.imageProcessingService.validateAndOptimizeImage(file.buffer, file.originalname);

      return {
        url: result.path,
        size: result.size,
        format: result.format,
      };
    } catch (error) {
      this.logger.error('Error uploading job image', 'JobsService');
      throw error;
    }
  }

  async uploadMultipleJobImages(user: User, files: Express.Multer.File[]): Promise<Array<{ url: string; size: number; format: string }>> {
    if (user.role !== UserRole.CLIENT) {
      throw new ForbiddenException('Only clients can upload job images');
    }

    if (files.length > 5) {
      throw new BadRequestException('Maximum 5 images allowed per job');
    }

    try {
      this.logger.info(`Processing ${files.length} uploaded job images`, 'JobsService');

      const results = await Promise.all(
        files.map(file => this.imageProcessingService.validateAndOptimizeImage(file.buffer, file.originalname))
      );

      return results.map(result => ({
        url: result.path,
        size: result.size,
        format: result.format,
      }));
    } catch (error) {
      this.logger.error('Error uploading job images', 'JobsService');
      throw error;
    }
  }

  async deleteJob(user: User, id: string): Promise<void> {
    const job = await this.findJobById(id, user);

    if (job.clientId !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only delete your own jobs');
    }

    // Only allow deletion of draft or cancelled jobs
    if (job.status !== JobStatus.DRAFT && job.status !== JobStatus.CANCELLED && user.role !== UserRole.ADMIN) {
      throw new BadRequestException('Only draft or cancelled jobs can be deleted');
    }

    // Check if job has any bids
    if (job.bids && job.bids.length > 0 && user.role !== UserRole.ADMIN) {
      throw new BadRequestException('Cannot delete jobs with existing bids');
    }

    try {
      // Delete associated images
      if (job.images && job.images.length > 0) {
        await Promise.all(
          job.images.map(imagePath => this.imageProcessingService.deleteImage(imagePath))
        );
      }

      // Delete the job
      await this.prisma.job.delete({
        where: { id },
      });

      // Log activity
      await this.logActivity(user.id, id, 'DELETE_JOB', 'Job', id, { title: job.title }, null);

      this.logger.info('Job deleted successfully', 'JobsService');
    } catch (error) {
      this.logger.error('Error deleting job', 'JobsService');
      throw error;
    }
  }

  private async validateBudget(budget: number): Promise<void> {
    // Fetch dynamic budget limits from system settings
    const settings = await this.prisma.systemSetting.findMany({
      where: {
        key: { in: ['MIN_JOB_BUDGET', 'MAX_JOB_BUDGET'] },
      },
    });

    const settingsMap = new Map(settings.map(s => [s.key, parseInt(s.value, 10)]));
    const minBudget = settingsMap.get('MIN_JOB_BUDGET') || 100;
    const maxBudget = settingsMap.get('MAX_JOB_BUDGET') || 100000;

    if (budget < minBudget) {
      throw new BadRequestException(`Budget must be at least R${minBudget}`);
    }

    if (budget > maxBudget) {
      throw new BadRequestException(`Budget cannot exceed R${maxBudget}`);
    }
  }

  private async validateCategory(categoryId: string): Promise<void> {
    if (!categoryId || categoryId.trim() === '') {
      throw new BadRequestException('Category ID is required');
    }

    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      // Get list of valid categories for better error message
      const validCategories = await this.prisma.category.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        take: 5,
      });

      const categoryNames = validCategories.map(c => c.name).join(', ');
      throw new BadRequestException(
        `Invalid category ID: "${categoryId}". Please select a valid category. Available categories include: ${categoryNames}${validCategories.length === 5 ? '...' : ''}`
      );
    }

    if (!category.isActive) {
      throw new BadRequestException(`Category "${category.name}" is not currently active. Please select a different category.`);
    }
  }

  private async canUserViewJob(user: User, job: JobWithRelations): Promise<boolean> {
    // Admin can view all jobs
    if (user.role === UserRole.ADMIN || user.role === UserRole.ASSESSOR) {
      return true;
    }

    // Client can view their own jobs
    if (user.role === UserRole.CLIENT && job.clientId === user.id) {
      return true;
    }

    // Artisans can view open jobs and jobs they've bid on
    if (user.role === UserRole.ARTISAN) {
      // Can view open jobs
      if (job.status === JobStatus.OPEN) {
        return true;
      }
      
      // Can view jobs they've bid on
      const hasBid = job.bids.some(bid => bid.artisanId === user.id);
      if (hasBid) {
        return true;
      }
    }

    return false;
  }

  private async logActivity(
    userId: string,
    jobId: string,
    action: string,
    entityType: string,
    entityId: string,
    oldData?: any,
    newData?: any,
  ): Promise<void> {
    try {
      await this.prisma.activityLog.create({
        data: {
          userId,
          jobId,
          action,
          entityType,
          entityId,
          oldData: oldData ? JSON.stringify(oldData) : null,
          newData: newData ? JSON.stringify(newData) : null,
        },
      });
    } catch (error) {
      this.logger.error('Error logging activity', 'JobsService');
    }
  }
}
