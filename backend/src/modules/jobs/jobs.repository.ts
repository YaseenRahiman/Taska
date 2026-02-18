import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LoggingService } from '../../common/logging/logging.service';
import { Job, JobStatus, Prisma, UserRole, JobCompletionConfirmation } from '@prisma/client';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobQueryDto } from './dto/job-query.dto';
import { ConfirmJobCompletionDto } from './dto/confirm-completion.dto';

const safeUserSelect = {
  id: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
  profile: true,
} as const;

const jobIncludeConfig = {
  client: {
    select: safeUserSelect,
  },
  category: true,
  bids: {
    include: {
      artisan: {
        select: safeUserSelect,
      },
    },
    orderBy: {
      createdAt: 'asc' as const,
    },
  },
  completionConfirmations: true,
  _count: {
    select: {
      bids: true,
      messages: true,
    },
  },
} as const satisfies Prisma.JobInclude;

export type JobWithRelations = Prisma.JobGetPayload<{
  include: typeof jobIncludeConfig;
}>;

@Injectable()
export class JobsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getJobIncludes() {
    return jobIncludeConfig;
  }

  async createJob(clientId: string, data: CreateJobDto): Promise<JobWithRelations> {
    return this.prisma.job.create({
      data: {
        clientId,
        categoryId: data.categoryId,
        title: data.title,
        description: data.description,
        budget: new Prisma.Decimal(data.budget),
        budgetType: data.budgetType,
        urgency: data.urgency,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        province: data.province,
        postalCode: data.postalCode,
        latitude: data.latitude,
        longitude: data.longitude,
        images: data.images || [],
        requirements: data.requirements || [],
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        status: JobStatus.DRAFT,
      },
      include: this.getJobIncludes(),
    });
  }

  async findJobsByQuery(query: JobQueryDto): Promise<{
    jobs: JobWithRelations[];
    total: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }> {
    const where = this.buildWhereClause(query);
    const orderBy = this.buildOrderByClause(query);

    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        include: this.getJobIncludes(),
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.job.count({ where }),
    ]);

    const totalPages = Math.ceil(total / query.limit);

    return {
      jobs,
      total,
      hasNextPage: query.page < totalPages,
      hasPreviousPage: query.page > 1,
    };
  }

  async findJobById(id: string): Promise<JobWithRelations | null> {
    return this.prisma.job.findUnique({
      where: { id },
      include: this.getJobIncludes(),
    });
  }

  async findJobsByClient(clientId: string): Promise<JobWithRelations[]> {
    return this.prisma.job.findMany({
      where: { clientId },
      include: this.getJobIncludes(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async findNearbyJobs(
    latitude: number,
    longitude: number,
    radiusKm: number = 25,
    limit: number = 50,
  ): Promise<JobWithRelations[]> {
    // Using PostgreSQL earthdistance extension for geospatial queries
    const jobs = await this.prisma.$queryRaw<JobWithRelations[]>`
      SELECT j.*, 
             earth_distance(
               ll_to_earth(j.latitude, j.longitude),
               ll_to_earth(${latitude}, ${longitude})
             ) / 1000 as distance_km
      FROM jobs j
      WHERE j.status = 'OPEN'
        AND earth_box(ll_to_earth(${latitude}, ${longitude}), ${radiusKm * 1000}) @> ll_to_earth(j.latitude, j.longitude)
        AND earth_distance(ll_to_earth(j.latitude, j.longitude), ll_to_earth(${latitude}, ${longitude})) <= ${radiusKm * 1000}
      ORDER BY distance_km ASC
      LIMIT ${limit}
    `;

    // Fetch full job details with relations
    const jobIds = jobs.map((job) => job.id);
    return this.prisma.job.findMany({
      where: { id: { in: jobIds } },
      include: this.getJobIncludes(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateJobStatus(id: string, status: JobStatus, userId: string): Promise<JobWithRelations> {
    return this.prisma.job.update({
      where: { id },
      data: { 
        status,
        updatedAt: new Date(),
        ...(status === JobStatus.COMPLETED && { completedAt: new Date() }),
        ...(status === JobStatus.CANCELLED && { cancelledAt: new Date() }),
      },
      include: this.getJobIncludes(),
    });
  }

  async getJobStatistics(clientId?: string) {
    const where = clientId ? { clientId } : {};

    const [
      total,
      open,
      inProgress,
      completed,
      budgetStats,
    ] = await Promise.all([
      this.prisma.job.count({ where }),
      this.prisma.job.count({ where: { ...where, status: JobStatus.OPEN } }),
      this.prisma.job.count({ where: { ...where, status: JobStatus.IN_PROGRESS } }),
      this.prisma.job.count({ where: { ...where, status: JobStatus.COMPLETED } }),
      this.prisma.job.aggregate({
        where,
        _avg: { budget: true },
        _sum: { budget: true },
      }),
    ]);

    return {
      total,
      open,
      inProgress,
      completed,
      averageBudget: budgetStats._avg.budget ? parseFloat(budgetStats._avg.budget.toString()) : 0,
      totalBudget: budgetStats._sum.budget ? parseFloat(budgetStats._sum.budget.toString()) : 0,
    };
  }

  private buildWhereClause(query: JobQueryDto): Prisma.JobWhereInput {
    const where: Prisma.JobWhereInput = {};

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.status) {
      where.status = query.status;
    } else {
      // Default to show only OPEN and IN_PROGRESS jobs
      where.status = { in: [JobStatus.OPEN, JobStatus.IN_PROGRESS] };
    }

    if (query.budgetType) {
      where.budgetType = query.budgetType;
    }

    if (query.urgency) {
      where.urgency = query.urgency;
    }

    if (query.minBudget !== undefined || query.maxBudget !== undefined) {
      where.budget = {};
      if (query.minBudget !== undefined) {
        where.budget.gte = new Prisma.Decimal(query.minBudget);
      }
      if (query.maxBudget !== undefined) {
        where.budget.lte = new Prisma.Decimal(query.maxBudget);
      }
    }

    if (query.city) {
      where.city = { contains: query.city, mode: 'insensitive' };
    }

    if (query.province) {
      where.province = { contains: query.province, mode: 'insensitive' };
    }

    return where;
  }

  private buildOrderByClause(query: JobQueryDto): Prisma.JobOrderByWithRelationInput[] {
    const orderBy: Prisma.JobOrderByWithRelationInput[] = [];

    if (query.sortBy) {
      switch (query.sortBy) {
        case 'createdAt':
          orderBy.push({ createdAt: query.sortOrder || 'desc' });
          break;
        case 'budget':
          orderBy.push({ budget: query.sortOrder || 'desc' });
          break;
        case 'urgency':
          // Custom urgency ordering: URGENT -> HIGH -> MEDIUM -> LOW
          orderBy.push({
            urgency: query.sortOrder === 'asc' ? 'asc' : 'desc'
          });
          break;
        case 'distance':
          // Distance sorting handled in geospatial queries
          orderBy.push({ createdAt: 'desc' });
          break;
        default:
          orderBy.push({ createdAt: 'desc' });
      }
    } else {
      // Default sorting: Urgent jobs first, then by creation date
      orderBy.push({ urgency: 'desc' });
      orderBy.push({ createdAt: 'desc' });
    }

    return orderBy;
  }

  // ============================================================================
  // JOB COMPLETION CONFIRMATION METHODS
  // ============================================================================

  /**
   * Create a job completion confirmation record
   */
  async createCompletionConfirmation(
    jobId: string,
    userId: string,
    userRole: UserRole,
    dto: ConfirmJobCompletionDto,
  ): Promise<JobCompletionConfirmation> {
    return this.prisma.jobCompletionConfirmation.create({
      data: {
        jobId,
        userId,
        userRole,
        rating: dto.rating,
        qualityRating: dto.qualityRating,
        timelinessRating: dto.timelinessRating,
        communicationRating: dto.communicationRating,
        valueRating: dto.valueRating,
        feedback: dto.feedback,
      },
    });
  }

  /**
   * Get completion confirmations for a job
   */
  async getCompletionConfirmations(jobId: string): Promise<JobCompletionConfirmation[]> {
    return this.prisma.jobCompletionConfirmation.findMany({
      where: { jobId },
    });
  }

  /**
   * Check if a user has already confirmed completion for a job
   */
  async hasUserConfirmed(jobId: string, userRole: UserRole): Promise<boolean> {
    const confirmation = await this.prisma.jobCompletionConfirmation.findUnique({
      where: {
        jobId_userRole: {
          jobId,
          userRole,
        },
      },
    });
    return !!confirmation;
  }

  /**
   * Update job with completion confirmation timestamps
   */
  async updateJobConfirmation(
    jobId: string,
    userRole: UserRole,
  ): Promise<JobWithRelations> {
    const updateData: Prisma.JobUpdateInput = {};

    if (userRole === UserRole.CLIENT) {
      updateData.clientConfirmedAt = new Date();
    } else if (userRole === UserRole.ARTISAN) {
      updateData.artisanConfirmedAt = new Date();
    }

    return this.prisma.job.update({
      where: { id: jobId },
      data: updateData,
      include: this.getJobIncludes(),
    });
  }

  /**
   * Complete job after both parties confirmed
   */
  async completeJobWithBothConfirmations(jobId: string): Promise<JobWithRelations> {
    return this.prisma.job.update({
      where: { id: jobId },
      data: {
        status: JobStatus.COMPLETED,
        completedAt: new Date(),
      },
      include: this.getJobIncludes(),
    });
  }

  /**
   * Get job completion status
   */
  async getJobCompletionStatus(jobId: string): Promise<{
    clientConfirmed: boolean;
    clientConfirmedAt: Date | null;
    artisanConfirmed: boolean;
    artisanConfirmedAt: Date | null;
    isFullyConfirmed: boolean;
  }> {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      select: {
        clientConfirmedAt: true,
        artisanConfirmedAt: true,
        status: true,
      },
    });

    if (!job) {
      throw new Error('Job not found');
    }

    return {
      clientConfirmed: !!job.clientConfirmedAt,
      clientConfirmedAt: job.clientConfirmedAt,
      artisanConfirmed: !!job.artisanConfirmedAt,
      artisanConfirmedAt: job.artisanConfirmedAt,
      isFullyConfirmed: !!job.clientConfirmedAt && !!job.artisanConfirmedAt,
    };
  }
}
