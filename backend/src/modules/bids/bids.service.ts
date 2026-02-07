import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { LoggingService } from '../../common/logging/logging.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BidsRepository, BidWithRelations } from './bids.repository';
import { CreateBidDto } from './dto/create-bid.dto';
import { UpdateBidDto } from './dto/update-bid.dto';
import { BidQueryDto, BidStatisticsDto } from './dto/bid-query.dto';
import { BidStatus, UserRole, JobStatus } from '@prisma/client';
import { LevelService } from '../monetization/services/level.service';
import { CreditService } from '../monetization/services/credit.service';
import { SubscriptionService } from '../monetization/services/subscription.service';
import { CalendarService } from '../calendar/calendar.service';

export interface User {
  id: string;
  role: UserRole;
  profile?: {
    latitude?: number;
    longitude?: number;
  };
}

@Injectable()
export class BidsService {
  constructor(
    private readonly bidsRepository: BidsRepository,
    private readonly logger: LoggingService,
    private readonly prisma: PrismaService,
    private readonly levelService: LevelService,
    private readonly creditService: CreditService,
    private readonly subscriptionService: SubscriptionService,
    private readonly calendarService: CalendarService,
  ) {}

  async createBid(user: User, createBidDto: CreateBidDto): Promise<BidWithRelations> {
    if (user.role !== UserRole.ARTISAN) {
      throw new ForbiddenException('Only artisans can submit bids');
    }

    this.logger.info(`Creating bid for job ${createBidDto.jobId}`, 'BidsService');

    try {
      // Validate job exists and is open for bidding
      await this.validateJobForBidding(createBidDto.jobId, user.id);

      // Check for existing bid
      const existingBid = await this.bidsRepository.findExistingBid(createBidDto.jobId, user.id);
      if (existingBid) {
        throw new BadRequestException('You have already submitted a bid for this job');
      }

      // Validate artisan specialization matches job category
      await this.validateArtisanSpecialization(user.id, createBidDto.jobId);

      // Check subscription limits first (primary limit system)
      const canBid = await this.subscriptionService.canPlaceBid(user.id);
      let usedSubscriptionBid = false;
      let usedFreeBid = false;
      let usedCredits = false;

      if (canBid.allowed) {
        // User has subscription bids remaining
        usedSubscriptionBid = true;
        this.logger.info(`Artisan ${user.id} using subscription bid (${canBid.remaining} remaining)`, 'BidsService');
      } else {
        // Subscription limit reached, try free bids from level system as fallback
        try {
          const freeBidResult = await this.levelService.useFreeBid(user.id);
          usedFreeBid = freeBidResult.usedFreeBid;
          if (usedFreeBid) {
            this.logger.info(`Artisan ${user.id} used a level free bid (${freeBidResult.remaining} remaining)`, 'BidsService');
          }
        } catch {
          // No free bids available, try credits as last resort
          this.logger.info(`No level free bids available for artisan ${user.id}, checking credits`, 'BidsService');
        }

        // If no free bid was used, try to deduct credits
        if (!usedFreeBid) {
          try {
            await this.creditService.spendCredits(user.id, 'BID', createBidDto.jobId);
            usedCredits = true;
            this.logger.info(`Artisan ${user.id} spent credits for bid on job ${createBidDto.jobId}`, 'BidsService');
          } catch {
            this.logger.error(`Insufficient credits for artisan ${user.id}`, 'BidsService');
            throw new BadRequestException(
              canBid.reason || 'You have reached your monthly bid limit. Upgrade to Premium for more bids or purchase credits.',
            );
          }
        }
      }

      // Create the bid
      const bid = await this.bidsRepository.createBid(user.id, createBidDto);

      // Track subscription usage if subscription bid was used
      if (usedSubscriptionBid) {
        await this.subscriptionService.incrementBidUsage(user.id);
      }

      // Send notification to job client
      await this.notifyJobClient(bid);

      // Log activity
      await this.logActivity(user.id, bid.jobId, 'CREATE_BID', 'Bid', bid.id, null, {
        amount: bid.amount,
        estimatedDays: bid.estimatedDays,
        usedSubscriptionBid,
        usedFreeBid,
        usedCredits,
      });

      this.logger.info(`Bid created successfully`, 'BidsService');

      return bid;
    } catch (error) {
      this.logger.error('Error creating bid', 'BidsService');
      throw error;
    }
  }

  async getBidStatistics(user?: User): Promise<BidStatisticsDto> {
    try {
      const artisanId = user?.role === UserRole.ARTISAN ? user.id : undefined;
      const stats = await this.bidsRepository.getBidStatistics(artisanId);

      this.logger.info(`Bid statistics retrieved`, 'BidsService');

      return stats;
    } catch (error) {
      this.logger.error('Error getting bid statistics', 'BidsService');
      throw error;
    }
  }

  private async validateJobForBidding(jobId: string, artisanId: string): Promise<void> {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        status: true,
        clientId: true,
        categoryId: true,
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.status !== JobStatus.OPEN) {
      throw new BadRequestException('Job is not open for bidding');
    }

    if (job.clientId === artisanId) {
      throw new BadRequestException('You cannot bid on your own job');
    }
  }

  private async validateArtisanSpecialization(artisanId: string, jobId: string): Promise<void> {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      select: { categoryId: true },
    });

    const hasSpecialization = await this.prisma.artisanSpecialization.findFirst({
      where: {
        userId: artisanId,
        categoryId: job.categoryId,
      },
    });

    if (!hasSpecialization) {
      this.logger.warn(`Artisan ${artisanId} bidding without specialization for category ${job.categoryId}`);
      // Allow bid but log warning - business decision
    }
  }

  private async notifyJobClient(bid: BidWithRelations): Promise<void> {
    try {
      await this.prisma.notification.create({
        data: {
          userId: bid.job.clientId,
          type: 'BID_RECEIVED',
          title: 'New Bid Received',
          message: `${bid.artisan.profile?.firstName || 'An artisan'} has submitted a bid of R${bid.amount} for your job "${bid.job.title}".`,
          data: {
            bidId: bid.id,
            jobId: bid.jobId,
            amount: bid.amount,
            estimatedDays: bid.estimatedDays,
          },
        },
      });
    } catch (error) {
      this.logger.error('Error sending notification to job client', 'BidsService');
    }
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
      this.logger.error('Error logging activity', 'BidsService');
    }
  }

  async findAllBids(query: BidQueryDto, user: User): Promise<{
    bids: BidWithRelations[];
    total: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }> {
    this.logger.info('Finding all bids with query', 'BidsService');
    return await this.bidsRepository.findBidsByQuery(query);
  }

  async findBidsByArtisan(user: User): Promise<BidWithRelations[]> {
    if (user.role !== UserRole.ARTISAN) {
      throw new ForbiddenException('Only artisans can access their bids');
    }
    this.logger.info('Finding bids by artisan', 'BidsService');
    return await this.bidsRepository.findBidsByArtisan(user.id);
  }

  async findBidsByJob(jobId: string, user: User): Promise<BidWithRelations[]> {
    this.logger.info('Finding bids by job', 'BidsService');
    return await this.bidsRepository.findBidsByJob(jobId);
  }

  async getJobBidAnalytics(jobId: string, user: User): Promise<{
    totalBids: number;
    averageAmount: number;
    lowestAmount: number;
    highestAmount: number;
    averageEstimatedDays: number;
    statusBreakdown: Record<BidStatus, number>;
  }> {
    this.logger.info('Getting job bid analytics', 'BidsService');
    return await this.bidsRepository.getJobBidAnalytics(jobId);
  }

  async findBidById(id: string, user: User): Promise<BidWithRelations> {
    this.logger.info('Finding bid by ID', 'BidsService');
    const bid = await this.bidsRepository.findBidById(id);
    if (!bid) {
      throw new NotFoundException(`Bid with ID ${id} not found`);
    }
    return bid;
  }

  async updateBid(user: User, id: string, updateBidDto: UpdateBidDto): Promise<BidWithRelations> {
    if (user.role !== UserRole.ARTISAN) {
      throw new ForbiddenException('Only artisans can update bids');
    }

    this.logger.info('Updating bid', 'BidsService');

    const bid = await this.bidsRepository.findBidById(id);
    if (!bid) {
      throw new NotFoundException(`Bid with ID ${id} not found`);
    }

    if (bid.artisanId !== user.id) {
      throw new ForbiddenException('You can only update your own bids');
    }

    if (bid.status !== BidStatus.PENDING) {
      throw new BadRequestException('Only pending bids can be updated');
    }

    return await this.bidsRepository.updateBid(id, updateBidDto);
  }

  async acceptBid(user: User, id: string): Promise<BidWithRelations> {
    this.logger.info('Accepting bid', 'BidsService');

    const bid = await this.bidsRepository.findBidById(id);
    if (!bid) {
      throw new NotFoundException(`Bid with ID ${id} not found`);
    }

    if (bid.job.clientId !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only job owners can accept bids');
    }

    if (bid.status !== BidStatus.PENDING) {
      throw new BadRequestException('Only pending bids can be accepted');
    }

    const acceptedBid = await this.bidsRepository.updateBidStatus(id, BidStatus.ACCEPTED);

    // Schedule job reminders if the job has a startDate
    if (bid.job.startDate) {
      try {
        await this.calendarService.scheduleJobReminders(
          bid.artisanId,
          bid.jobId,
          new Date(bid.job.startDate),
        );
      } catch (error) {
        this.logger.error('Error scheduling job reminders', 'BidsService');
      }
    }

    return acceptedBid;
  }

  async rejectBid(user: User, id: string, reason: string): Promise<BidWithRelations> {
    this.logger.info('Rejecting bid', 'BidsService');

    const bid = await this.bidsRepository.findBidById(id);
    if (!bid) {
      throw new NotFoundException(`Bid with ID ${id} not found`);
    }

    if (bid.job.clientId !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only job owners can reject bids');
    }

    if (bid.status !== BidStatus.PENDING) {
      throw new BadRequestException('Only pending bids can be rejected');
    }

    return await this.bidsRepository.updateBidStatus(id, BidStatus.REJECTED);
  }

  async withdrawBid(user: User, id: string): Promise<BidWithRelations> {
    this.logger.info('Withdrawing bid', 'BidsService');

    const bid = await this.bidsRepository.findBidById(id);
    if (!bid) {
      throw new NotFoundException(`Bid with ID ${id} not found`);
    }

    if (bid.artisanId !== user.id) {
      throw new ForbiddenException('You can only withdraw your own bids');
    }

    if (bid.status !== BidStatus.PENDING) {
      throw new BadRequestException('Only pending bids can be withdrawn');
    }

    return await this.bidsRepository.updateBidStatus(id, BidStatus.WITHDRAWN);
  }
}
