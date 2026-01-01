import {
  Controller,
  Get,
  Put,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { EscrowConfigService } from '../services/escrow-config.service';
import {
  UpdateEscrowConfigDto,
  EscrowConfigResponseDto,
  EscrowHoldDto,
  EscrowActionDto,
  EscrowAnalyticsDto,
  EscrowHoldsQueryDto,
} from '../dto/escrow-config.dto';

@ApiTags('Admin - Escrow Management')
@ApiBearerAuth()
@Controller('admin/escrow')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class EscrowController {
  constructor(private readonly escrowConfigService: EscrowConfigService) {}

  /**
   * Get current escrow configuration
   */
  @Get('config')
  @ApiOperation({
    summary: 'Get escrow configuration',
    description: 'Retrieve the current active escrow configuration settings',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Escrow configuration retrieved successfully',
    type: EscrowConfigResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Valid JWT required',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Admin role required',
  })
  async getConfig(): Promise<EscrowConfigResponseDto> {
    return this.escrowConfigService.getConfig();
  }

  /**
   * Update escrow configuration
   */
  @Put('config')
  @ApiOperation({
    summary: 'Update escrow configuration',
    description: 'Update escrow configuration settings (admin only)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Escrow configuration updated successfully',
    type: EscrowConfigResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid configuration values',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Valid JWT required',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Admin role required',
  })
  async updateConfig(
    @Body() updateDto: UpdateEscrowConfigDto,
    @Request() req: any,
  ): Promise<EscrowConfigResponseDto> {
    const adminUserId = req.user.userId;
    return this.escrowConfigService.updateConfig(updateDto, adminUserId);
  }

  /**
   * Get all escrow holds with filtering
   */
  @Get('holds')
  @ApiOperation({
    summary: 'Get escrow holds',
    description: 'Retrieve all escrow holds with optional filtering and pagination',
  })
  @ApiQuery({ name: 'status', required: false, enum: ['HELD', 'RELEASED', 'DISPUTED', 'REFUNDED'] })
  @ApiQuery({ name: 'jobId', required: false, type: String })
  @ApiQuery({ name: 'clientId', required: false, type: String })
  @ApiQuery({ name: 'artisanId', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Escrow holds retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        holds: { type: 'array', items: { $ref: '#/components/schemas/EscrowHoldDto' } },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Valid JWT required',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Admin role required',
  })
  async getHolds(@Query() query: EscrowHoldsQueryDto): Promise<{
    holds: EscrowHoldDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.escrowConfigService.getActiveHolds(query);
  }

  /**
   * Get single escrow hold by ID
   */
  @Get('holds/:id')
  @ApiOperation({
    summary: 'Get escrow hold by ID',
    description: 'Retrieve detailed information about a specific escrow hold',
  })
  @ApiParam({
    name: 'id',
    description: 'Payment/Hold ID',
    example: 'cmgzjb71a0003aexl2yrhmcbf',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Escrow hold retrieved successfully',
    type: EscrowHoldDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Escrow hold not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Valid JWT required',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Admin role required',
  })
  async getHoldById(@Param('id') id: string): Promise<EscrowHoldDto> {
    return this.escrowConfigService.getHoldById(id);
  }

  /**
   * Release escrow hold
   */
  @Post('holds/:id/release')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Release escrow hold',
    description: 'Release funds from escrow to artisan (admin action)',
  })
  @ApiParam({
    name: 'id',
    description: 'Payment/Hold ID to release',
    example: 'cmgzjb71a0003aexl2yrhmcbf',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Escrow hold released successfully',
    type: EscrowHoldDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid hold status or hold cannot be released',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Escrow hold not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Valid JWT required',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Admin role required',
  })
  async releaseHold(
    @Param('id') id: string,
    @Body() actionDto: EscrowActionDto,
    @Request() req: any,
  ): Promise<EscrowHoldDto> {
    const adminUserId = req.user.userId;
    return this.escrowConfigService.releaseHold(
      id,
      actionDto.reason,
      adminUserId,
      actionDto.notes,
    );
  }

  /**
   * Refund escrow hold
   */
  @Post('holds/:id/refund')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refund escrow hold',
    description: 'Refund held funds back to client (admin action)',
  })
  @ApiParam({
    name: 'id',
    description: 'Payment/Hold ID to refund',
    example: 'cmgzjb71a0003aexl2yrhmcbf',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Escrow hold refunded successfully',
    type: EscrowHoldDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid hold status or hold cannot be refunded',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Escrow hold not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Valid JWT required',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Admin role required',
  })
  async refundHold(
    @Param('id') id: string,
    @Body() actionDto: EscrowActionDto,
    @Request() req: any,
  ): Promise<EscrowHoldDto> {
    const adminUserId = req.user.userId;
    return this.escrowConfigService.refundHold(
      id,
      actionDto.reason,
      adminUserId,
      actionDto.notes,
    );
  }

  /**
   * Get escrow analytics
   */
  @Get('analytics')
  @ApiOperation({
    summary: 'Get escrow analytics',
    description: 'Retrieve comprehensive escrow analytics and statistics',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Escrow analytics retrieved successfully',
    type: EscrowAnalyticsDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Valid JWT required',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Admin role required',
  })
  async getAnalytics(): Promise<EscrowAnalyticsDto> {
    return this.escrowConfigService.getAnalytics();
  }
}
