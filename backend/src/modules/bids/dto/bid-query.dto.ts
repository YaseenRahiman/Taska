import { IsOptional, IsString, IsNumber, IsEnum, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { BidStatus } from '@prisma/client';

export class BidQueryDto {
  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  page: number = 1;

  @ApiProperty({
    description: 'Number of results per page',
    example: 20,
    minimum: 1,
    maximum: 100,
    required: false,
    default: 20,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value))
  limit: number = 20;

  @ApiProperty({
    description: 'Job ID to filter bids by',
    example: 'clh123456789',
    required: false,
  })
  @IsOptional()
  @IsString()
  jobId?: string;

  @ApiProperty({
    description: 'Artisan ID to filter bids by',
    example: 'clh987654321',
    required: false,
  })
  @IsOptional()
  @IsString()
  artisanId?: string;

  @ApiProperty({
    description: 'Bid status to filter by',
    enum: BidStatus,
    example: BidStatus.PENDING,
    required: false,
  })
  @IsOptional()
  @IsEnum(BidStatus)
  status?: BidStatus;

  @ApiProperty({
    description: 'Minimum bid amount in ZAR',
    example: 1000.00,
    required: false,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Transform(({ value }) => parseFloat(value))
  minAmount?: number;

  @ApiProperty({
    description: 'Maximum bid amount in ZAR',
    example: 5000.00,
    required: false,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Transform(({ value }) => parseFloat(value))
  maxAmount?: number;

  @ApiProperty({
    description: 'Sort field',
    example: 'amount',
    enum: ['amount', 'createdAt', 'estimatedDays', 'expiresAt'],
    required: false,
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiProperty({
    description: 'Sort order',
    example: 'desc',
    enum: ['asc', 'desc'],
    required: false,
    default: 'desc',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiProperty({
    description: 'Filter by creation date from (ISO string)',
    example: '2025-09-01T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @ApiProperty({
    description: 'Filter by creation date to (ISO string)',
    example: '2025-09-30T23:59:59.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  createdTo?: string;

  @ApiProperty({
    description: 'Include expired bids',
    example: false,
    required: false,
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  includeExpired?: boolean = false;
}

export class BidStatisticsDto {
  @ApiProperty({ description: 'Total number of bids', example: 150 })
  total: number;

  @ApiProperty({ description: 'Number of pending bids', example: 45 })
  pending: number;

  @ApiProperty({ description: 'Number of accepted bids', example: 30 })
  accepted: number;

  @ApiProperty({ description: 'Number of rejected bids', example: 25 })
  rejected: number;

  @ApiProperty({ description: 'Number of withdrawn bids', example: 15 })
  withdrawn: number;

  @ApiProperty({ description: 'Number of expired bids', example: 35 })
  expired: number;

  @ApiProperty({ description: 'Average bid amount', example: 2750.50 })
  averageAmount: number;

  @ApiProperty({ description: 'Highest bid amount', example: 8500.00 })
  highestAmount: number;

  @ApiProperty({ description: 'Lowest bid amount', example: 150.00 })
  lowestAmount: number;

  @ApiProperty({ description: 'Success rate (accepted/total)', example: 0.20 })
  successRate: number;

  @ApiProperty({ description: 'Average estimated days', example: 4.5 })
  averageEstimatedDays: number;
}
