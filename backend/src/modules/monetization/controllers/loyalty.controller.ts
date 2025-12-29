import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { LoyaltyService } from '../services/loyalty.service';
import { LoyaltyActionType } from '@prisma/client';
import {
  RedeemRewardDto,
  AwardPointsDto,
  LoyaltyTransactionQueryDto,
  LoyaltyBalanceResponseDto,
  LoyaltyRewardResponseDto,
} from '../dto';

@ApiTags('Loyalty')
@Controller('loyalty')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Get current loyalty points balance' })
  @ApiResponse({ status: 200, type: LoyaltyBalanceResponseDto })
  async getBalance(@Request() req): Promise<LoyaltyBalanceResponseDto> {
    const balance = await this.loyaltyService.getLoyaltyBalance(req.user.id);
    return {
      userId: req.user.id,
      currentPoints: balance.currentPoints,
      lifetimePoints: balance.lifetimePoints,
    };
  }

  @Get('rewards')
  @ApiOperation({ summary: 'Get available loyalty rewards' })
  @ApiResponse({ status: 200, type: [LoyaltyRewardResponseDto] })
  async getRewards(): Promise<LoyaltyRewardResponseDto[]> {
    return this.loyaltyService.getAvailableRewards();
  }

  @Post('redeem')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Redeem a loyalty reward' })
  @ApiResponse({ status: 200, description: 'Reward redeemed successfully' })
  async redeemReward(
    @Request() req,
    @Body() dto: RedeemRewardDto,
  ) {
    return this.loyaltyService.redeemReward(req.user.id, dto.rewardId);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get loyalty points transaction history' })
  @ApiResponse({ status: 200, description: 'Transaction history retrieved' })
  async getTransactions(
    @Request() req,
    @Query() query: LoyaltyTransactionQueryDto,
  ) {
    return this.loyaltyService.getLoyaltyTransactions(
      req.user.id,
      query.page ?? 1,
      query.limit ?? 20,
    );
  }

  @Get('points-config')
  @ApiOperation({ summary: 'Get points earned for each action type' })
  @ApiResponse({ status: 200, description: 'Points configuration retrieved' })
  getPointsConfig() {
    return this.loyaltyService.getPointsConfig();
  }

  // Admin endpoint
  @Post('award')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Award loyalty points to a user (Admin only)' })
  @ApiResponse({ status: 200, description: 'Points awarded successfully' })
  async awardPoints(@Body() dto: AwardPointsDto) {
    return this.loyaltyService.awardPoints(
      dto.userId,
      dto.action as LoyaltyActionType,
      dto.reference,
      dto.description,
    );
  }
}
