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
import { BoostService } from '../services/boost.service';
import { BoostType } from '@prisma/client';

class ActivateBoostDto {
  boostType: BoostType;
  useFreeBoost?: boolean;
}

class BoostHistoryQueryDto {
  page?: number;
  limit?: number;
}

@ApiTags('Profile Boosts')
@Controller('boosts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BoostController {
  constructor(private readonly boostService: BoostService) {}

  @Get('configs')
  @ApiOperation({ summary: 'Get available boost configurations and pricing' })
  @ApiResponse({ status: 200, description: 'Boost configurations retrieved' })
  getBoostConfigs() {
    return this.boostService.getBoostConfigs();
  }

  @Get('active')
  @ApiOperation({ summary: 'Get current active boost status' })
  @ApiResponse({ status: 200, description: 'Active boost retrieved (or null if none)' })
  async getActiveBoost(@Request() req) {
    const boost = await this.boostService.getActiveBoost(req.user.id);
    return {
      hasActiveBoost: boost !== null,
      boost,
    };
  }

  @Get('percentage')
  @ApiOperation({ summary: 'Get current boost percentage (includes level-based boost)' })
  @ApiResponse({ status: 200, description: 'Boost percentage retrieved' })
  async getBoostPercentage(@Request() req) {
    const percentage = await this.boostService.getBoostPercentage(req.user.id);
    return { boostPercentage: percentage };
  }

  @Post('activate')
  @Roles('ARTISAN')
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate a profile boost (uses free boost or credits)' })
  @ApiResponse({ status: 200, description: 'Boost activated successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient credits or already boosted' })
  async activateBoost(
    @Request() req,
    @Body() dto: ActivateBoostDto,
  ) {
    const boost = await this.boostService.activateBoost(
      req.user.id,
      dto.boostType,
      dto.useFreeBoost ?? true,
    );

    return {
      success: true,
      message: `${dto.boostType} boost activated successfully`,
      boost,
    };
  }

  @Get('history')
  @ApiOperation({ summary: 'Get boost activation history' })
  @ApiResponse({ status: 200, description: 'Boost history retrieved' })
  async getBoostHistory(
    @Request() req,
    @Query() query: BoostHistoryQueryDto,
  ) {
    return this.boostService.getBoostHistory(
      req.user.id,
      query.page ?? 1,
      query.limit ?? 10,
    );
  }

  @Get('featured')
  @ApiOperation({ summary: 'Check if user has featured badge' })
  @ApiResponse({ status: 200, description: 'Featured badge status retrieved' })
  async hasFeaturedBadge(@Request() req) {
    const hasBadge = await this.boostService.hasFeaturedBadge(req.user.id);
    return { hasFeaturedBadge: hasBadge };
  }
}
