import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { LoggingService } from '../../common/logging/logging.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JobsRepository, JobWithRelations } from './jobs.repository';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobQueryDto, JobStatisticsDto } from './dto/job-query.dto';
import { ConfirmJobCompletionDto, JobCompletionStatusDto } from './dto/confirm-completion.dto';
import { JobMatchingService } from './services/job-matching.service';
import { ImageProcessingService } from './services/image-processing.service';
import { GeocodingService } from './services/geocoding.service';
import { EscrowService } from '../payments/services/escrow.service';
import { SubscriptionService } from '../monetization/services/subscription.service';
import { JobStatus, UserRole, NotificationType } from '@prisma/client';

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
    @Inject(forwardRef(() => SubscriptionService))
    private readonly subscriptionService: SubscriptionService,
  ) {}

  async createJob(user: User, createJobDto: CreateJobDto): Promise<JobWithRelations> {
    if (user.role !== UserRole.CLIENT) {
      throw new ForbiddenException('Only clients can create jobs');
    }

    this.logger.info(`Creating job for user ${user.id}`, 'JobsService');

    try {
      // Check subscription limits before creating job
      const canPost = await this.subscriptionService.canPostJob(user.id);
      if (!canPost.allowed) {
        throw new BadRequestException(canPost.reason);
      }

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

      // Increment subscription usage counter
      await this.subscriptionService.incrementJobUsage(user.id);

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
      // Strip isDraft (not a DB field) before passing to Prisma
      const { isDraft: _isDraft, ...updateData } = updateJobDto as UpdateJobDto & { isDraft?: boolean };
      const updatedJob = await this.prisma.job.update({
        where: { id },
        data: {
          ...updateData,
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

  /**
   * Confirm job completion - Both client and artisan must confirm
   * This replaces the direct completeJob flow with a mutual confirmation process
   */
  async confirmJobCompletion(
    user: User,
    jobId: string,
    dto: ConfirmJobCompletionDto,
  ): Promise<{ job: JobWithRelations; message: string; isFullyConfirmed: boolean }> {
    const job = await this.findJobById(jobId, user);

    // Only IN_PROGRESS jobs can be confirmed
    if (job.status !== JobStatus.IN_PROGRESS) {
      throw new BadRequestException('Only in-progress jobs can have completion confirmed');
    }

    // Find the accepted bid to get the artisan
    const acceptedBid = job.bids.find(bid => bid.status === 'ACCEPTED');
    if (!acceptedBid) {
      throw new BadRequestException('No accepted bid found for this job');
    }

    // Determine if user is client or artisan for this job
    const isClient = job.clientId === user.id;
    const isArtisan = acceptedBid.artisanId === user.id;

    if (!isClient && !isArtisan && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You are not authorized to confirm completion for this job');
    }

    // Determine the role for confirmation
    const confirmationRole = isClient ? UserRole.CLIENT : UserRole.ARTISAN;

    // Check if user has already confirmed
    const alreadyConfirmed = await this.jobsRepository.hasUserConfirmed(jobId, confirmationRole);
    if (alreadyConfirmed) {
      throw new BadRequestException(`${confirmationRole} has already confirmed completion for this job`);
    }

    try {
      // Create the confirmation record with optional rating
      await this.jobsRepository.createCompletionConfirmation(
        jobId,
        user.id,
        confirmationRole,
        dto,
      );

      // Update job with confirmation timestamp
      let updatedJob = await this.jobsRepository.updateJobConfirmation(jobId, confirmationRole);

      // Log activity
      await this.logActivity(user.id, jobId, 'CONFIRM_JOB_COMPLETION', 'Job', jobId, null, {
        role: confirmationRole,
        rating: dto.rating,
      });

      // Check if both parties have now confirmed
      const completionStatus = await this.jobsRepository.getJobCompletionStatus(jobId);

      if (completionStatus.isFullyConfirmed) {
        // Both parties confirmed - complete the job and release escrow
        updatedJob = await this.finalizeJobCompletion(user, jobId, acceptedBid.artisanId);

        // Create reviews from the confirmation ratings if provided
        await this.createReviewsFromConfirmations(jobId, job.clientId, acceptedBid.artisanId);

        this.logger.info(`Job ${jobId} fully confirmed and completed`, 'JobsService');

        return {
          job: updatedJob,
          message: 'Both parties have confirmed. Job is now completed and payment has been released.',
          isFullyConfirmed: true,
        };
      } else {
        // Only one party confirmed - notify the other party
        const otherPartyId = isClient ? acceptedBid.artisanId : job.clientId;
        await this.createCompletionRequestNotification(jobId, otherPartyId, confirmationRole);

        this.logger.info(`Job ${jobId} completion confirmed by ${confirmationRole}, waiting for other party`, 'JobsService');

        return {
          job: updatedJob,
          message: `Your confirmation has been recorded. Waiting for the ${isClient ? 'artisan' : 'client'} to confirm completion.`,
          isFullyConfirmed: false,
        };
      }
    } catch (error) {
      this.logger.error(`Error confirming job completion for job ${jobId}`, 'JobsService');
      throw error;
    }
  }

  /**
   * Get the completion status of a job
   */
  async getJobCompletionStatus(user: User, jobId: string): Promise<JobCompletionStatusDto> {
    const job = await this.findJobById(jobId, user);

    const status = await this.jobsRepository.getJobCompletionStatus(jobId);

    return {
      jobId,
      clientConfirmed: status.clientConfirmed,
      clientConfirmedAt: status.clientConfirmedAt || undefined,
      artisanConfirmed: status.artisanConfirmed,
      artisanConfirmedAt: status.artisanConfirmedAt || undefined,
      isFullyConfirmed: status.isFullyConfirmed,
      jobStatus: job.status,
    };
  }

  /**
   * Finalize job completion after both parties confirm
   */
  private async finalizeJobCompletion(
    user: User,
    jobId: string,
    artisanId: string,
  ): Promise<JobWithRelations> {
    // Find the payment record for this job
    const payment = await this.prisma.payment.findFirst({
      where: {
        jobId,
        escrowStatus: 'HELD',
      },
    });

    if (payment) {
      // Check if this is a repeat client
      const job = await this.prisma.job.findUnique({ where: { id: jobId } });
      let isRepeatClient = false;

      if (job) {
        const previousJobs = await this.prisma.job.count({
          where: {
            clientId: job.clientId,
            status: 'COMPLETED',
            bids: {
              some: {
                artisanId,
                status: 'ACCEPTED',
              },
            },
            id: { not: jobId },
          },
        });
        isRepeatClient = previousJobs > 0;
      }

      // Release escrow
      await this.escrowService.releaseFunds(
        payment.id,
        user.id,
        'Job completed - both parties confirmed',
        undefined,
        isRepeatClient,
      );

      this.logger.info(`Escrow released for job ${jobId}`, 'JobsService');
    }

    // Update job status to COMPLETED
    const completedJob = await this.jobsRepository.completeJobWithBothConfirmations(jobId);

    // Log activity
    await this.logActivity(user.id, jobId, 'COMPLETE_JOB', 'Job', jobId,
      { status: JobStatus.IN_PROGRESS },
      { status: JobStatus.COMPLETED }
    );

    return completedJob;
  }

  /**
   * Create reviews from confirmation ratings
   */
  private async createReviewsFromConfirmations(
    jobId: string,
    clientId: string,
    artisanId: string,
  ): Promise<void> {
    const confirmations = await this.jobsRepository.getCompletionConfirmations(jobId);

    for (const confirmation of confirmations) {
      // Only create review if rating was provided
      if (confirmation.rating) {
        const reviewerId = confirmation.userRole === UserRole.CLIENT ? clientId : artisanId;
        const revieweeId = confirmation.userRole === UserRole.CLIENT ? artisanId : clientId;

        // Check if review already exists
        const existingReview = await this.prisma.review.findUnique({
          where: {
            jobId_reviewerId: {
              jobId,
              reviewerId,
            },
          },
        });

        if (!existingReview) {
          await this.prisma.review.create({
            data: {
              jobId,
              reviewerId,
              revieweeId,
              rating: confirmation.rating,
              qualityRating: confirmation.qualityRating || confirmation.rating,
              timelinessRating: confirmation.timelinessRating || confirmation.rating,
              communicationRating: confirmation.communicationRating || confirmation.rating,
              valueRating: confirmation.valueRating || confirmation.rating,
              comment: confirmation.feedback,
              isVerified: true,
            },
          });

          this.logger.info(`Review created from confirmation for job ${jobId}`, 'JobsService');
        }
      }
    }
  }

  /**
   * Create notification for completion request
   */
  private async createCompletionRequestNotification(
    jobId: string,
    userId: string,
    confirmedByRole: UserRole,
  ): Promise<void> {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      select: { title: true },
    });

    await this.prisma.notification.create({
      data: {
        userId,
        type: NotificationType.JOB_COMPLETION_REQUESTED,
        title: 'Job Completion Confirmation Requested',
        message: `The ${confirmedByRole.toLowerCase()} has confirmed completion of "${job?.title}". Please confirm to complete the job and release payment.`,
        data: { jobId },
      },
    });
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
