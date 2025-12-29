import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
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
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { WalletsService } from './wallets.service';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { WalletQueryDto } from './dto/wallet-query.dto';
import {
  WalletBalanceResponseDto,
  PaginatedTransactionsDto,
  WithdrawalResponseDto,
  PaginatedWithdrawalsDto,
  WalletStatisticsDto,
} from './dto/wallet-response.dto';

/**
 * Controller for wallet and earnings management
 *
 * Provides REST API endpoints for artisans to:
 * - View wallet balance and transaction history
 * - Request withdrawals
 * - Track earnings statistics
 * - Manage pending withdrawals
 */
@ApiTags('Wallets & Earnings')
@ApiBearerAuth()
@Controller('wallets')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ARTISAN')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  /**
   * Get wallet balance for authenticated artisan
   */
  @Get('balance')
  @ApiOperation({
    summary: 'Get wallet balance',
    description: 'Retrieve current wallet balance, pending balance, and totals for authenticated artisan',
  })
  @ApiResponse({
    status: 200,
    description: 'Wallet balance retrieved successfully',
    type: WalletBalanceResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Wallet not found (will be created automatically)',
  })
  async getBalance(@Request() req): Promise<WalletBalanceResponseDto> {
    return this.walletsService.getOrCreateWallet(req.user.userId);
  }

  /**
   * Get wallet transaction history with pagination
   */
  @Get('transactions')
  @ApiOperation({
    summary: 'Get transaction history',
    description: 'Retrieve paginated wallet transaction history including credits, debits, and withdrawals',
  })
  @ApiResponse({
    status: 200,
    description: 'Transactions retrieved successfully',
    type: PaginatedTransactionsDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Wallet not found',
  })
  async getTransactions(
    @Request() req,
    @Query() query: WalletQueryDto,
  ): Promise<PaginatedTransactionsDto> {
    return this.walletsService.getWalletTransactions(
      req.user.userId,
      query.page,
      query.limit,
    );
  }

  /**
   * Request a withdrawal
   */
  @Post('withdraw')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Request withdrawal',
    description: 'Submit a withdrawal request to transfer funds from wallet to bank account',
  })
  @ApiResponse({
    status: 201,
    description: 'Withdrawal request created successfully',
    type: WithdrawalResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid withdrawal request (insufficient funds, below minimum, exceeded daily limit)',
  })
  @ApiResponse({
    status: 404,
    description: 'Wallet not found',
  })
  async requestWithdrawal(
    @Request() req,
    @Body() withdrawalDto: CreateWithdrawalDto,
  ): Promise<WithdrawalResponseDto> {
    return this.walletsService.requestWithdrawal(req.user.userId, withdrawalDto);
  }

  /**
   * Get earnings statistics
   */
  @Get('statistics')
  @ApiOperation({
    summary: 'Get earnings statistics',
    description: 'Retrieve detailed earnings statistics including monthly earnings, completed jobs, and averages',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    type: WalletStatisticsDto,
  })
  async getStatistics(@Request() req): Promise<WalletStatisticsDto> {
    return this.walletsService.getWalletStatistics(req.user.userId);
  }

  /**
   * Get pending withdrawals
   */
  @Get('pending')
  @ApiOperation({
    summary: 'Get pending withdrawals',
    description: 'Retrieve all pending and processing withdrawal requests',
  })
  @ApiResponse({
    status: 200,
    description: 'Pending withdrawals retrieved successfully',
    type: PaginatedWithdrawalsDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Wallet not found',
  })
  async getPendingWithdrawals(
    @Request() req,
    @Query() query: WalletQueryDto,
  ): Promise<PaginatedWithdrawalsDto> {
    return this.walletsService.getWithdrawalHistory(
      req.user.userId,
      query.page,
      query.limit,
    );
  }

  /**
   * Cancel a pending withdrawal
   */
  @Delete('withdraw/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Cancel withdrawal',
    description: 'Cancel a pending withdrawal request (only pending withdrawals can be cancelled)',
  })
  @ApiResponse({
    status: 204,
    description: 'Withdrawal cancelled successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Withdrawal cannot be cancelled (not pending or unauthorized)',
  })
  @ApiResponse({
    status: 404,
    description: 'Withdrawal not found',
  })
  @ApiParam({
    name: 'id',
    description: 'Withdrawal ID',
    example: 'withdraw_abc123',
  })
  async cancelWithdrawal(
    @Request() req,
    @Param('id') withdrawalId: string,
  ): Promise<void> {
    await this.walletsService.cancelWithdrawal(req.user.userId, withdrawalId);
  }
}
