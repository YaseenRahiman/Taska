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
import { CreditService } from '../services/credit.service';
import { CreditTransactionType } from '@prisma/client';
import {
  PurchaseCreditsDto,
  RedeemVoucherDto,
  SpendCreditsDto,
  ConvertWalletToCreditsDto,
  ConfigureAutoTopUpDto,
  CreditTransactionQueryDto,
  CreditBalanceResponseDto,
  CreditBundleResponseDto,
} from '../dto';

@ApiTags('Credits')
@Controller('credits')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CreditController {
  constructor(private readonly creditService: CreditService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Get current credit balance' })
  @ApiResponse({ status: 200, type: CreditBalanceResponseDto })
  async getBalance(@Request() req): Promise<CreditBalanceResponseDto> {
    const wallet = await this.creditService.getOrCreateCreditWallet(req.user.id);
    return {
      userId: wallet.userId,
      balance: wallet.balance,
      lifetimeCredits: wallet.lifetimeCredits,
      lifetimeSpent: wallet.lifetimeSpent,
      autoTopUpEnabled: wallet.autoTopUpEnabled,
      autoTopUpThreshold: wallet.autoTopUpThreshold ?? undefined,
      autoTopUpAmount: wallet.autoTopUpAmount ?? undefined,
    };
  }

  @Get('bundles')
  @ApiOperation({ summary: 'Get available credit bundles' })
  @ApiResponse({ status: 200, type: [CreditBundleResponseDto] })
  async getBundles(): Promise<CreditBundleResponseDto[]> {
    return this.creditService.getCreditBundles();
  }

  @Post('purchase')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Purchase credits from a bundle' })
  @ApiResponse({ status: 200, description: 'Credits purchased successfully' })
  async purchaseCredits(
    @Request() req,
    @Body() dto: PurchaseCreditsDto,
  ) {
    return this.creditService.purchaseCredits(
      req.user.id,
      dto.bundleId,
      dto.purchaseMethod,
      dto.providerTxnId,
    );
  }

  @Post('redeem-voucher')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Redeem a credit voucher' })
  @ApiResponse({ status: 200, description: 'Voucher redeemed successfully' })
  async redeemVoucher(
    @Request() req,
    @Body() dto: RedeemVoucherDto,
  ) {
    return this.creditService.redeemVoucher(req.user.id, dto.voucherCode);
  }

  @Post('spend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Spend credits on an action' })
  @ApiResponse({ status: 200, description: 'Credits spent successfully' })
  async spendCredits(
    @Request() req,
    @Body() dto: SpendCreditsDto,
  ) {
    return this.creditService.spendCredits(
      req.user.id,
      dto.action,
      dto.reference,
    );
  }

  @Post('convert-from-wallet')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Convert wallet balance (ZAR) to credits' })
  @ApiResponse({ status: 200, description: 'Wallet converted to credits' })
  async convertFromWallet(
    @Request() req,
    @Body() dto: ConvertWalletToCreditsDto,
  ) {
    return this.creditService.convertWalletToCredits(req.user.id, dto.amountZar);
  }

  @Post('auto-topup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Configure auto top-up settings' })
  @ApiResponse({ status: 200, description: 'Auto top-up configured' })
  async configureAutoTopUp(
    @Request() req,
    @Body() dto: ConfigureAutoTopUpDto,
  ) {
    return this.creditService.configureAutoTopUp(
      req.user.id,
      dto.enabled,
      dto.threshold,
      dto.amount,
      dto.source,
    );
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get credit transaction history' })
  @ApiResponse({ status: 200, description: 'Transaction history retrieved' })
  async getTransactions(
    @Request() req,
    @Query() query: CreditTransactionQueryDto,
  ) {
    return this.creditService.getCreditTransactions(
      req.user.id,
      query.page ?? 1,
      query.limit ?? 20,
      query.type as CreditTransactionType | undefined,
    );
  }

  @Get('action-costs')
  @ApiOperation({ summary: 'Get credit costs for each action type' })
  @ApiResponse({ status: 200, description: 'Action costs retrieved' })
  getActionCosts() {
    return this.creditService.getActionCosts();
  }
}
