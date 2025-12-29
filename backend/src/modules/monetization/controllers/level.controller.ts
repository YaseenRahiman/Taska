import {
  Controller,
  Get,
  Post,
  Body,
  Param,
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
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { LevelService } from '../services/level.service';
import {
  UpdateStatsDto,
  RequestVerificationDto,
  CompleteVerificationDto,
  ArtisanLevelResponseDto,
} from '../dto';

@ApiTags('Artisan Levels')
@Controller('artisan-levels')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LevelController {
  constructor(private readonly levelService: LevelService) {}

  @Get('my-level')
  @ApiOperation({ summary: 'Get current artisan level and stats' })
  @ApiResponse({ status: 200, type: ArtisanLevelResponseDto })
  async getMyLevel(@Request() req): Promise<ArtisanLevelResponseDto> {
    return this.levelService.getArtisanLevel(req.user.id);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get artisan level for a specific user' })
  @ApiParam({ name: 'userId', description: 'User ID to lookup' })
  @ApiResponse({ status: 200, type: ArtisanLevelResponseDto })
  async getUserLevel(@Param('userId') userId: string): Promise<ArtisanLevelResponseDto> {
    return this.levelService.getArtisanLevel(userId);
  }

  @Get('fee-rate')
  @ApiOperation({ summary: 'Get current platform fee rate based on level' })
  @ApiResponse({ status: 200, description: 'Fee rate returned as percentage and sample amount' })
  async getFeeRate(@Request() req): Promise<{ feePercent: number; sampleFee: { jobAmount: number; feeAmount: number } }> {
    const result = await this.levelService.calculatePlatformFee(req.user.id, 1000);
    return {
      feePercent: result.feePercent,
      sampleFee: { jobAmount: 1000, feeAmount: result.feeAmount },
    };
  }

  @Get('level-configs')
  @ApiOperation({ summary: 'Get all level configurations and requirements' })
  @ApiResponse({ status: 200, description: 'Level configurations retrieved' })
  async getLevelConfigs() {
    return this.levelService.getLevelConfigs();
  }

  @Get('level-history')
  @ApiOperation({ summary: 'Get level progression history' })
  @ApiResponse({ status: 200, description: 'Level history retrieved' })
  async getLevelHistory(@Request() req) {
    return this.levelService.getLevelHistory(req.user.id);
  }

  @Post('use-free-bid')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Use a free bid from level benefits' })
  @ApiResponse({ status: 200, description: 'Free bid used successfully' })
  @ApiResponse({ status: 400, description: 'No free bids available' })
  async useFreeBid(@Request() req): Promise<{ success: boolean; remaining: number }> {
    const result = await this.levelService.useFreeBid(req.user.id);
    return { success: result.usedFreeBid, remaining: result.remaining };
  }

  @Post('use-free-boost')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Use a free boost from level benefits' })
  @ApiResponse({ status: 200, description: 'Free boost used successfully' })
  @ApiResponse({ status: 400, description: 'No free boosts available' })
  async useFreeBoost(@Request() req): Promise<{ success: boolean; remaining: number }> {
    const result = await this.levelService.useFreeBoost(req.user.id);
    return { success: result.usedFreeBoost, remaining: result.remaining };
  }

  @Post('request-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request identity or skills verification' })
  @ApiResponse({ status: 200, description: 'Verification requested' })
  async requestVerification(
    @Request() req,
    @Body() dto: RequestVerificationDto,
  ) {
    return this.levelService.requestVerification(req.user.id, dto.type);
  }

  // Admin endpoints
  @Post('update-stats')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update artisan stats after job completion (System/Admin)' })
  @ApiResponse({ status: 200, description: 'Stats updated successfully' })
  async updateStats(
    @Request() req,
    @Body() dto: UpdateStatsDto,
  ) {
    await this.levelService.updateStatsAfterJobCompletion(
      req.user.id,
      dto.jobId,
      dto.rating,
      dto.isRepeatClient,
    );
    return { success: true, message: 'Stats updated successfully' };
  }

  @Post('complete-verification')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete verification for an artisan (Admin only)' })
  @ApiResponse({ status: 200, description: 'Verification completed' })
  async completeVerification(@Body() dto: CompleteVerificationDto) {
    return this.levelService.completeVerification(dto.userId, dto.type);
  }

  @Post('reset-monthly-allocations')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset monthly free bids/boosts for all artisans (Admin only)' })
  @ApiResponse({ status: 200, description: 'Monthly allocations reset' })
  async resetMonthlyAllocations() {
    await this.levelService.resetMonthlyAllocations();
    return { message: 'Monthly allocations reset for all artisans' };
  }
}
