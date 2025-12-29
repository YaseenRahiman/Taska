import {
  IsInt,
  IsDecimal,
  IsBoolean,
  IsOptional,
  Min,
  Max,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO for updating escrow configuration
 */
export class UpdateEscrowConfigDto {
  @ApiPropertyOptional({
    description: 'Number of days before auto-releasing funds (1-90 days)',
    example: 7,
    minimum: 1,
    maximum: 90,
  })
  @IsOptional()
  @IsInt()
  @Min(1, { message: 'Auto-release days must be at least 1 day' })
  @Max(90, { message: 'Auto-release days cannot exceed 90 days' })
  @Type(() => Number)
  autoReleaseDays?: number;

  @ApiPropertyOptional({
    description: 'Maximum duration to hold funds in escrow (1-365 days)',
    example: 14,
    minimum: 1,
    maximum: 365,
  })
  @IsOptional()
  @IsInt()
  @Min(1, { message: 'Hold duration must be at least 1 day' })
  @Max(365, { message: 'Hold duration cannot exceed 365 days' })
  @Type(() => Number)
  holdDurationDays?: number;

  @ApiPropertyOptional({
    description: 'Number of days for dispute window after completion (1-60 days)',
    example: 14,
    minimum: 1,
    maximum: 60,
  })
  @IsOptional()
  @IsInt()
  @Min(1, { message: 'Dispute window must be at least 1 day' })
  @Max(60, { message: 'Dispute window cannot exceed 60 days' })
  @Type(() => Number)
  disputeWindowDays?: number;

  @ApiPropertyOptional({
    description: 'Platform fee percentage (0-10%)',
    example: 10.00,
    minimum: 0,
    maximum: 10,
  })
  @IsOptional()
  @IsDecimal({ decimal_digits: '2' }, { message: 'Fee percentage must have at most 2 decimal places' })
  @Min(0, { message: 'Fee percentage cannot be negative' })
  @Max(10, { message: 'Fee percentage cannot exceed 10%' })
  @Type(() => Number)
  feePercentage?: number;

  @ApiPropertyOptional({
    description: 'Minimum amount that can be held in escrow (ZAR)',
    example: 0.00,
    minimum: 0,
  })
  @IsOptional()
  @IsDecimal({ decimal_digits: '2' }, { message: 'Minimum hold amount must have at most 2 decimal places' })
  @Min(0, { message: 'Minimum hold amount cannot be negative' })
  @Type(() => Number)
  minHoldAmount?: number;

  @ApiPropertyOptional({
    description: 'Maximum amount that can be held in escrow (ZAR)',
    example: 100000.00,
    minimum: 0,
  })
  @IsOptional()
  @IsDecimal({ decimal_digits: '2' }, { message: 'Maximum hold amount must have at most 2 decimal places' })
  @Min(0, { message: 'Maximum hold amount must be greater than minimum' })
  @Type(() => Number)
  maxHoldAmount?: number;

  @ApiPropertyOptional({
    description: 'Whether the configuration is active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/**
 * Response DTO for escrow configuration
 */
export class EscrowConfigResponseDto {
  @ApiProperty({ description: 'Configuration ID' })
  id: string;

  @ApiProperty({ description: 'Auto-release days' })
  autoReleaseDays: number;

  @ApiProperty({ description: 'Hold duration days' })
  holdDurationDays: number;

  @ApiProperty({ description: 'Dispute window days' })
  disputeWindowDays: number;

  @ApiProperty({ description: 'Platform fee percentage' })
  feePercentage: number;

  @ApiProperty({ description: 'Minimum hold amount (ZAR)' })
  minHoldAmount: number;

  @ApiProperty({ description: 'Maximum hold amount (ZAR)' })
  maxHoldAmount: number;

  @ApiProperty({ description: 'Configuration active status' })
  isActive: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

/**
 * DTO for escrow hold details
 */
export class EscrowHoldDto {
  @ApiProperty({ description: 'Payment/Hold ID' })
  id: string;

  @ApiProperty({ description: 'Associated job ID' })
  jobId: string;

  @ApiProperty({ description: 'Job title' })
  jobTitle: string;

  @ApiProperty({ description: 'Client ID' })
  clientId: string;

  @ApiProperty({ description: 'Client name' })
  clientName: string;

  @ApiProperty({ description: 'Artisan ID' })
  artisanId: string;

  @ApiProperty({ description: 'Artisan name' })
  artisanName: string;

  @ApiProperty({ description: 'Hold amount (ZAR)' })
  amount: number;

  @ApiProperty({ description: 'Platform fee (ZAR)' })
  platformFee: number;

  @ApiProperty({ description: 'Total amount including fees (ZAR)' })
  totalAmount: number;

  @ApiProperty({ description: 'Escrow status', enum: ['HELD', 'RELEASED', 'DISPUTED', 'REFUNDED'] })
  escrowStatus: string;

  @ApiProperty({ description: 'Payment status' })
  paymentStatus: string;

  @ApiProperty({ description: 'Days held' })
  daysHeld: number;

  @ApiProperty({ description: 'Days until auto-release' })
  daysUntilAutoRelease: number;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Paid timestamp' })
  paidAt?: Date;

  @ApiProperty({ description: 'Released timestamp' })
  releasedAt?: Date;
}

/**
 * DTO for release/refund action
 */
export class EscrowActionDto {
  @ApiProperty({
    description: 'Reason for the action',
    example: 'Job completed successfully',
  })
  @IsString()
  reason: string;

  @ApiPropertyOptional({
    description: 'Additional notes for audit trail',
    example: 'Client confirmed work completion',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO for escrow analytics
 */
export class EscrowAnalyticsDto {
  @ApiProperty({ description: 'Total amount currently held in escrow (ZAR)' })
  totalHeld: number;

  @ApiProperty({ description: 'Total amount released this period (ZAR)' })
  totalReleased: number;

  @ApiProperty({ description: 'Total amount in disputed holds (ZAR)' })
  totalDisputed: number;

  @ApiProperty({ description: 'Total amount refunded this period (ZAR)' })
  totalRefunded: number;

  @ApiProperty({ description: 'Number of active holds' })
  activeHoldsCount: number;

  @ApiProperty({ description: 'Number of holds pending auto-release' })
  pendingAutoReleaseCount: number;

  @ApiProperty({ description: 'Average hold duration (days)' })
  averageHoldDuration: number;

  @ApiProperty({ description: 'Total platform fees collected (ZAR)' })
  platformFeesCollected: number;

  @ApiProperty({ description: 'Holds by status breakdown' })
  holdsByStatus: {
    held: number;
    released: number;
    disputed: number;
    refunded: number;
  };

  @ApiProperty({ description: 'Holds requiring attention (near expiry, disputed)' })
  holdsRequiringAttention: number;
}

/**
 * Query DTO for filtering escrow holds
 */
export class EscrowHoldsQueryDto {
  @ApiPropertyOptional({ description: 'Filter by escrow status' })
  @IsOptional()
  @IsString()
  status?: 'HELD' | 'RELEASED' | 'DISPUTED' | 'REFUNDED';

  @ApiPropertyOptional({ description: 'Filter by job ID' })
  @IsOptional()
  @IsString()
  jobId?: string;

  @ApiPropertyOptional({ description: 'Filter by client ID' })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Filter by artisan ID' })
  @IsOptional()
  @IsString()
  artisanId?: string;

  @ApiPropertyOptional({ description: 'Page number for pagination', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page', default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;
}
