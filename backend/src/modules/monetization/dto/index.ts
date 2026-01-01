import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean, Min, Max, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreditPurchaseMethod } from '@prisma/client';

// ============================================================================
// CREDIT DTOs
// ============================================================================

export class PurchaseCreditsDto {
  @ApiProperty({ description: 'ID of the credit bundle to purchase' })
  @IsString()
  @IsNotEmpty()
  bundleId: string;

  @ApiProperty({ enum: ['CARD', 'EFT', 'WALLET', 'MOBILE_MONEY', 'AIRTIME'] })
  @IsEnum(['CARD', 'EFT', 'WALLET', 'MOBILE_MONEY', 'AIRTIME'])
  purchaseMethod: 'CARD' | 'EFT' | 'WALLET' | 'MOBILE_MONEY' | 'AIRTIME';

  @ApiPropertyOptional({ description: 'Transaction ID from payment provider' })
  @IsOptional()
  @IsString()
  providerTxnId?: string;
}

export class RedeemVoucherDto {
  @ApiProperty({ description: 'Voucher code to redeem' })
  @IsString()
  @IsNotEmpty()
  voucherCode: string;
}

export class SpendCreditsDto {
  @ApiProperty({ enum: ['BID', 'BOOST', 'SUPER_BOOST', 'FEATURE_PROFILE', 'UNLOCK_CONTACT', 'JOB_ALERT'] })
  @IsEnum(['BID', 'BOOST', 'SUPER_BOOST', 'FEATURE_PROFILE', 'UNLOCK_CONTACT', 'JOB_ALERT'])
  action: 'BID' | 'BOOST' | 'SUPER_BOOST' | 'FEATURE_PROFILE' | 'UNLOCK_CONTACT' | 'JOB_ALERT';

  @ApiPropertyOptional({ description: 'Reference ID (e.g., job ID, bid ID)' })
  @IsOptional()
  @IsString()
  reference?: string;
}

export class ConvertWalletToCreditsDto {
  @ApiProperty({ description: 'Amount in ZAR to convert to credits', minimum: 10 })
  @IsNumber()
  @Min(10)
  amountZar: number;
}

export class ConfigureAutoTopUpDto {
  @ApiProperty({ description: 'Enable or disable auto top-up' })
  @IsBoolean()
  enabled: boolean;

  @ApiPropertyOptional({ description: 'Credit balance threshold to trigger top-up', minimum: 10 })
  @IsOptional()
  @IsNumber()
  @Min(10)
  threshold?: number;

  @ApiPropertyOptional({ description: 'Number of credits to purchase on top-up', minimum: 50 })
  @IsOptional()
  @IsNumber()
  @Min(50)
  amount?: number;

  @ApiPropertyOptional({ enum: ['WALLET', 'CARD'], description: 'Source for auto top-up' })
  @IsOptional()
  @IsEnum(['WALLET', 'CARD'])
  source?: 'WALLET' | 'CARD';
}

export class CreditTransactionQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Filter by transaction type' })
  @IsOptional()
  @IsString()
  type?: string;
}

// ============================================================================
// LOYALTY DTOs
// ============================================================================

export class RedeemRewardDto {
  @ApiProperty({ description: 'ID of the reward to redeem' })
  @IsString()
  @IsNotEmpty()
  rewardId: string;
}

export class AwardPointsDto {
  @ApiProperty({ description: 'User ID to award points to' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Action type for the points award' })
  @IsString()
  @IsNotEmpty()
  action: string;

  @ApiPropertyOptional({ description: 'Reference ID (e.g., job ID)' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ description: 'Custom description' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class LoyaltyTransactionQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

// ============================================================================
// LEVEL DTOs
// ============================================================================

export class UpdateStatsDto {
  @ApiProperty({ description: 'Job ID that was completed' })
  @IsString()
  @IsNotEmpty()
  jobId: string;

  @ApiPropertyOptional({ description: 'Rating received (1-5)', minimum: 1, maximum: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ description: 'Whether client is a repeat customer' })
  @IsOptional()
  @IsBoolean()
  isRepeatClient?: boolean;

  @ApiPropertyOptional({ description: 'Whether job was completed early' })
  @IsOptional()
  @IsBoolean()
  completedEarly?: boolean;
}

export class RequestVerificationDto {
  @ApiProperty({ enum: ['identity', 'skills'], description: 'Type of verification requested' })
  @IsEnum(['identity', 'skills'])
  type: 'identity' | 'skills';
}

export class CompleteVerificationDto {
  @ApiProperty({ description: 'User ID to complete verification for' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ enum: ['identity', 'skills'], description: 'Type of verification completed' })
  @IsEnum(['identity', 'skills'])
  type: 'identity' | 'skills';
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

export class CreditBalanceResponseDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  balance: number;

  @ApiProperty()
  lifetimeCredits: number;

  @ApiProperty()
  lifetimeSpent: number;

  @ApiProperty()
  autoTopUpEnabled: boolean;

  @ApiPropertyOptional()
  autoTopUpThreshold?: number;

  @ApiPropertyOptional()
  autoTopUpAmount?: number;
}

export class CreditBundleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  credits: number;

  @ApiProperty()
  bonusCredits: number;

  @ApiProperty()
  totalCredits: number;

  @ApiProperty()
  priceZar: number;

  @ApiProperty()
  pricePerCredit: number;

  @ApiProperty()
  isPopular: boolean;

  @ApiPropertyOptional()
  description?: string;
}

export class LoyaltyBalanceResponseDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  currentPoints: number;

  @ApiProperty()
  lifetimePoints: number;
}

export class LoyaltyRewardResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  pointsCost: number;

  @ApiProperty()
  rewardType: string;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional()
  stockCount?: number;

  @ApiPropertyOptional()
  imageUrl?: string;
}

export class ArtisanLevelResponseDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  currentLevel: string;

  @ApiProperty()
  displayName: string;

  @ApiProperty()
  currentFeePercent: number;

  @ApiPropertyOptional()
  nextLevel?: string;

  @ApiProperty()
  progressToNextLevel: number;

  @ApiProperty()
  stats: {
    totalJobsCompleted: number;
    averageRating: number;
    responseRate: number;
    completionRate: number;
    repeatClientCount: number;
    memberSince: Date;
  };

  @ApiProperty()
  benefits: {
    freeBidsRemaining: number;
    freeBoostsRemaining: number;
    searchBoostPercent: number;
    payoutDays: number;
  };

  @ApiProperty()
  verification: {
    isIdentityVerified: boolean;
    isSkillsVerified: boolean;
  };
}
