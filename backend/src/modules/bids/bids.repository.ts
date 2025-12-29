import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, Bid, BidStatus } from '@prisma/client';
import { BidQueryDto, BidStatisticsDto } from './dto/bid-query.dto';
import { CreateBidDto } from './dto/create-bid.dto';
import { UpdateBidDto } from './dto/update-bid.dto';

const bidIncludeConfig = {
  job: {
    include: {
      client: {
        include: {
          profile: true,
        },
      },
      category: true,
    },
  },
  artisan: {
    include: {
      profile: true,
      specializations: {
        include: {
          category: true,
        },
      },
    },
  },
} as const satisfies Prisma.BidInclude;

export type BidWithRelations = Prisma.BidGetPayload<{
  include: typeof bidIncludeConfig;
}>;

@Injectable()
export class BidsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getBidIncludes() {
    return bidIncludeConfig;
  }

  async createBid(artisanId: string, createBidDto: CreateBidDto): Promise<BidWithRelations> {
    const expiresAt = createBidDto.expiresAt ? new Date(createBidDto.expiresAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 7 days

    return this.prisma.bid.create({
      data: {
        jobId: createBidDto.jobId,
        artisanId,
        amount: createBidDto.amount,
        message: createBidDto.message,
        estimatedDays: createBidDto.estimatedDays,
        attachments: createBidDto.attachments || [],
        expiresAt,
        status: BidStatus.PENDING,
      },
      include: this.getBidIncludes(),
    });
  }

  async findBidById(bidId: string): Promise<BidWithRelations | null> {
    return this.prisma.bid.findUnique({
      where: { id: bidId },
      include: this.getBidIncludes(),
    });
  }

  async findBidsByQuery(query: BidQueryDto): Promise<{
    bids: BidWithRelations[];
    total: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }> {
    const { page, limit, sortBy, sortOrder, ...filters } = query;
    const skip = (page - 1) * limit;

    const whereClause: Prisma.BidWhereInput = {
      ...(filters.jobId && { jobId: filters.jobId }),
      ...(filters.artisanId && { artisanId: filters.artisanId }),
      ...(filters.status && { status: filters.status }),
      ...(filters.minAmount && { amount: { gte: filters.minAmount } }),
      ...(filters.maxAmount && { amount: { lte: filters.maxAmount } }),
      ...(filters.createdFrom && { createdAt: { gte: new Date(filters.createdFrom) } }),
      ...(filters.createdTo && { createdAt: { lte: new Date(filters.createdTo) } }),
      ...(!filters.includeExpired && { expiresAt: { gt: new Date() } }),
    };

    const orderBy: Prisma.BidOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [bids, total] = await Promise.all([
      this.prisma.bid.findMany({
        where: whereClause,
        include: this.getBidIncludes(),
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.bid.count({ where: whereClause }),
    ]);

    const hasNextPage = skip + limit < total;
    const hasPreviousPage = page > 1;

    return { bids, total, hasNextPage, hasPreviousPage };
  }

  async findBidsByArtisan(artisanId: string): Promise<BidWithRelations[]> {
    return this.prisma.bid.findMany({
      where: { artisanId },
      include: this.getBidIncludes(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBidsByJob(jobId: string): Promise<BidWithRelations[]> {
    return this.prisma.bid.findMany({
      where: { jobId },
      include: this.getBidIncludes(),
      orderBy: { amount: 'asc' }, // Show cheapest first
    });
  }

  async updateBid(bidId: string, updateBidDto: UpdateBidDto): Promise<BidWithRelations> {
    const updateData: Prisma.BidUpdateInput = {};
    
    if (updateBidDto.amount !== undefined) updateData.amount = updateBidDto.amount;
    if (updateBidDto.message !== undefined) updateData.message = updateBidDto.message;
    if (updateBidDto.estimatedDays !== undefined) updateData.estimatedDays = updateBidDto.estimatedDays;
    if (updateBidDto.attachments !== undefined) updateData.attachments = updateBidDto.attachments;
    if (updateBidDto.expiresAt !== undefined) updateData.expiresAt = new Date(updateBidDto.expiresAt);

    updateData.updatedAt = new Date();

    return this.prisma.bid.update({
      where: { id: bidId },
      data: updateData,
      include: this.getBidIncludes(),
    });
  }

  async updateBidStatus(bidId: string, status: BidStatus): Promise<BidWithRelations> {
    const updateData: Prisma.BidUpdateInput = {
      status,
      updatedAt: new Date(),
    };

    // Set appropriate timestamp based on status
    switch (status) {
      case BidStatus.ACCEPTED:
        updateData.acceptedAt = new Date();
        break;
      case BidStatus.REJECTED:
        updateData.rejectedAt = new Date();
        break;
      case BidStatus.WITHDRAWN:
        updateData.withdrawnAt = new Date();
        break;
    }

    return this.prisma.bid.update({
      where: { id: bidId },
      data: updateData,
      include: this.getBidIncludes(),
    });
  }

  async findExistingBid(jobId: string, artisanId: string): Promise<Bid | null> {
    return this.prisma.bid.findUnique({
      where: {
        jobId_artisanId: {
          jobId,
          artisanId,
        },
      },
    });
  }

  async markExpiredBids(): Promise<number> {
    const result = await this.prisma.bid.updateMany({
      where: {
        status: BidStatus.PENDING,
        expiresAt: {
          lt: new Date(),
        },
      },
      data: {
        status: BidStatus.EXPIRED,
        updatedAt: new Date(),
      },
    });

    return result.count;
  }

  async getBidStatistics(artisanId?: string): Promise<BidStatisticsDto> {
    const whereClause: Prisma.BidWhereInput = artisanId ? { artisanId } : {};

    const [
      total,
      pending,
      accepted,
      rejected,
      withdrawn,
      expired,
      aggregateData,
    ] = await Promise.all([
      this.prisma.bid.count({ where: whereClause }),
      this.prisma.bid.count({ where: { ...whereClause, status: BidStatus.PENDING } }),
      this.prisma.bid.count({ where: { ...whereClause, status: BidStatus.ACCEPTED } }),
      this.prisma.bid.count({ where: { ...whereClause, status: BidStatus.REJECTED } }),
      this.prisma.bid.count({ where: { ...whereClause, status: BidStatus.WITHDRAWN } }),
      this.prisma.bid.count({ where: { ...whereClause, status: BidStatus.EXPIRED } }),
      this.prisma.bid.aggregate({
        where: whereClause,
        _avg: {
          amount: true,
          estimatedDays: true,
        },
        _max: {
          amount: true,
        },
        _min: {
          amount: true,
        },
      }),
    ]);

    const successRate = total > 0 ? accepted / total : 0;
    const averageAmount = aggregateData._avg.amount ? Number(aggregateData._avg.amount) : 0;
    const averageEstimatedDays = aggregateData._avg.estimatedDays || 0;
    const highestAmount = aggregateData._max.amount ? Number(aggregateData._max.amount) : 0;
    const lowestAmount = aggregateData._min.amount ? Number(aggregateData._min.amount) : 0;

    return {
      total,
      pending,
      accepted,
      rejected,
      withdrawn,
      expired,
      averageAmount,
      highestAmount,
      lowestAmount,
      successRate,
      averageEstimatedDays,
    };
  }

  async getBidsNearExpiry(hoursBeforeExpiry: number = 24): Promise<BidWithRelations[]> {
    const expiryThreshold = new Date(Date.now() + hoursBeforeExpiry * 60 * 60 * 1000);

    return this.prisma.bid.findMany({
      where: {
        status: BidStatus.PENDING,
        expiresAt: {
          lte: expiryThreshold,
          gt: new Date(),
        },
      },
      include: this.getBidIncludes(),
      orderBy: { expiresAt: 'asc' },
    });
  }

  async countBidsByJob(jobId: string): Promise<number> {
    return this.prisma.bid.count({
      where: { jobId },
    });
  }

  async getJobBidAnalytics(jobId: string): Promise<{
    totalBids: number;
    averageAmount: number;
    lowestAmount: number;
    highestAmount: number;
    averageEstimatedDays: number;
    statusBreakdown: Record<BidStatus, number>;
  }> {
    const [bidCount, aggregateData, statusCounts] = await Promise.all([
      this.prisma.bid.count({ where: { jobId } }),
      this.prisma.bid.aggregate({
        where: { jobId },
        _avg: {
          amount: true,
          estimatedDays: true,
        },
        _max: {
          amount: true,
        },
        _min: {
          amount: true,
        },
      }),
      this.prisma.bid.groupBy({
        by: ['status'],
        where: { jobId },
        _count: {
          status: true,
        },
      }),
    ]);

    const statusBreakdown = statusCounts.reduce((acc, curr) => {
      acc[curr.status] = curr._count.status;
      return acc;
    }, {} as Record<BidStatus, number>);

    return {
      totalBids: bidCount,
      averageAmount: aggregateData._avg.amount ? Number(aggregateData._avg.amount) : 0,
      lowestAmount: aggregateData._min.amount ? Number(aggregateData._min.amount) : 0,
      highestAmount: aggregateData._max.amount ? Number(aggregateData._max.amount) : 0,
      averageEstimatedDays: aggregateData._avg.estimatedDays || 0,
      statusBreakdown,
    };
  }
}
