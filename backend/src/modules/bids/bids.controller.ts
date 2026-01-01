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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BidsService } from './bids.service';
import { CreateBidDto } from './dto/create-bid.dto';
import { UpdateBidDto } from './dto/update-bid.dto';
import { BidQueryDto, BidStatisticsDto } from './dto/bid-query.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UserRole } from '@prisma/client';

export interface User {
  id: string;
  role: UserRole;
  profile?: {
    latitude?: number;
    longitude?: number;
  };
}

@ApiTags('bids')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bids')
export class BidsController {
  constructor(private readonly bidsService: BidsService) {}

  @Post()
  @Roles(UserRole.ARTISAN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a bid for a job' })
  @ApiResponse({ status: 201, description: 'Bid created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data or duplicate bid' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only artisans can submit bids' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async createBid(
    @CurrentUser() user: User,
    @Body() createBidDto: CreateBidDto,
  ) {
    return this.bidsService.createBid(user, createBidDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all bids with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Bids retrieved successfully' })
  async findAllBids(
    @Query() query: BidQueryDto,
    @CurrentUser() user: User,
  ) {
    return this.bidsService.findAllBids ? this.bidsService.findAllBids(query, user) : [];
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get bid statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully', type: BidStatisticsDto })
  async getBidStatistics(@CurrentUser() user: User): Promise<BidStatisticsDto> {
    return this.bidsService.getBidStatistics(user);
  }

  @Get('my-bids')
  @Roles(UserRole.ARTISAN)
  @ApiOperation({ summary: 'Get artisan\'s own bids' })
  @ApiResponse({ status: 200, description: 'Artisan bids retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only artisans can view their bids' })
  async findMyBids(@CurrentUser() user: User) {
    return this.bidsService.findBidsByArtisan ? this.bidsService.findBidsByArtisan(user) : [];
  }

  @Get('job/:jobId')
  @Roles(UserRole.CLIENT, UserRole.ADMIN, UserRole.ASSESSOR)
  @ApiOperation({ summary: 'Get all bids for a specific job' })
  @ApiResponse({ status: 200, description: 'Job bids retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only job owner can view bids' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async findBidsByJob(
    @Param('jobId') jobId: string,
    @CurrentUser() user: User,
  ) {
    return this.bidsService.findBidsByJob ? this.bidsService.findBidsByJob(jobId, user) : [];
  }

  @Get('job/:jobId/analytics')
  @Roles(UserRole.CLIENT, UserRole.ADMIN, UserRole.ASSESSOR)
  @ApiOperation({ summary: 'Get bid analytics for a specific job' })
  @ApiResponse({ status: 200, description: 'Job bid analytics retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only job owner can view analytics' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async getJobBidAnalytics(
    @Param('jobId') jobId: string,
    @CurrentUser() user: User,
  ) {
    return this.bidsService.getJobBidAnalytics ? this.bidsService.getJobBidAnalytics(jobId, user) : {};
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific bid by ID' })
  @ApiResponse({ status: 200, description: 'Bid retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - No permission to view this bid' })
  @ApiResponse({ status: 404, description: 'Bid not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.bidsService.findBidById ? this.bidsService.findBidById(id, user) : null;
  }

  @Patch(':id')
  @Roles(UserRole.ARTISAN)
  @ApiOperation({ summary: 'Update a bid' })
  @ApiResponse({ status: 200, description: 'Bid updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Bid cannot be updated' })
  @ApiResponse({ status: 403, description: 'Forbidden - Can only update own bids' })
  @ApiResponse({ status: 404, description: 'Bid not found' })
  async updateBid(
    @Param('id') id: string,
    @Body() updateBidDto: UpdateBidDto,
    @CurrentUser() user: User,
  ) {
    return this.bidsService.updateBid ? this.bidsService.updateBid(user, id, updateBidDto) : null;
  }

  @Post(':id/accept')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept a bid' })
  @ApiResponse({ status: 200, description: 'Bid accepted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Bid cannot be accepted' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only job client can accept bids' })
  @ApiResponse({ status: 404, description: 'Bid not found' })
  async acceptBid(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.bidsService.acceptBid(user, id);
  }

  @Post(':id/reject')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a bid' })
  @ApiResponse({ status: 200, description: 'Bid rejected successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Bid cannot be rejected' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only job client can reject bids' })
  @ApiResponse({ status: 404, description: 'Bid not found' })
  async rejectBid(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: User,
  ) {
    return this.bidsService.rejectBid(user, id, reason);
  }

  @Post(':id/withdraw')
  @Roles(UserRole.ARTISAN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Withdraw a bid' })
  @ApiResponse({ status: 200, description: 'Bid withdrawn successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Bid cannot be withdrawn' })
  @ApiResponse({ status: 403, description: 'Forbidden - Can only withdraw own bids' })
  @ApiResponse({ status: 404, description: 'Bid not found' })
  async withdrawBid(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.bidsService.withdrawBid(user, id);
  }
}
