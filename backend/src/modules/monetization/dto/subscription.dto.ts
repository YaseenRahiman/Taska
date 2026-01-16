import { IsString, IsEnum, IsOptional, IsNumber, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { BillingCycle } from '@prisma/client';

export class SubscribeDto {
  @IsString()
  planId: string;

  @IsEnum(BillingCycle)
  @IsOptional()
  billingCycle?: BillingCycle = BillingCycle.MONTHLY;

  @IsString()
  @IsOptional()
  paymentMethodId?: string; // Stripe payment method ID
}

export class CancelSubscriptionDto {
  @IsBoolean()
  @IsOptional()
  cancelAtPeriodEnd?: boolean = true;
}

export class UpdatePlanDto {
  @IsString()
  @IsOptional()
  displayName?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @Max(1000)
  @IsOptional()
  @Type(() => Number)
  clientJobsPerMonth?: number;

  @IsNumber()
  @Min(0)
  @Max(1000)
  @IsOptional()
  @Type(() => Number)
  artisanBidsPerMonth?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  pricePerMonthZar?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  pricePerYearZar?: number;

  @IsOptional()
  features?: Record<string, unknown>;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  sortOrder?: number;
}

export class UsageLimitsResponseDto {
  jobsPerMonth: number;
  bidsPerMonth: number;
  jobsUsed: number;
  bidsUsed: number;
  jobsRemaining: number;
  bidsRemaining: number;
  periodStart: Date;
  periodEnd: Date;
}

export class SubscriptionInfoResponseDto {
  subscription: {
    id: string;
    status: string;
    billingCycle: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
  } | null;
  plan: {
    id: string;
    name: string;
    displayName: string;
    description: string | null;
    clientJobsPerMonth: number;
    artisanBidsPerMonth: number;
    pricePerMonthZar: number;
    pricePerYearZar: number;
    features: Record<string, unknown> | null;
  };
  usage: UsageLimitsResponseDto;
  isSubscribed: boolean;
  canUpgrade: boolean;
}

export class CanPerformActionResponseDto {
  allowed: boolean;
  reason?: string;
  remaining: number;
}

export class SubscriptionStatsResponseDto {
  totalSubscriptions: number;
  activeSubscriptions: number;
  premiumSubscriptions: number;
  freeSubscriptions: number;
  revenueThisMonth: number;
}
