import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsNumber,
  IsLatitude,
  IsLongitude,
  Min,
  Max,
  IsDecimal,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { JobStatus, BudgetType, UrgencyLevel } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class JobQueryDto extends PaginationDto {
  @ApiProperty({
    description: 'Search term in title or description',
    example: 'plumber kitchen',
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    description: 'Filter by category ID',
    example: 'ckxxx...',
    required: false,
  })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({
    description: 'Filter by job status',
    enum: JobStatus,
    required: false,
  })
  @IsEnum(JobStatus)
  @IsOptional()
  status?: JobStatus;

  @ApiProperty({
    description: 'Filter by budget type',
    enum: BudgetType,
    required: false,
  })
  @IsEnum(BudgetType)
  @IsOptional()
  budgetType?: BudgetType;

  @ApiProperty({
    description: 'Filter by urgency level',
    enum: UrgencyLevel,
    required: false,
  })
  @IsEnum(UrgencyLevel)
  @IsOptional()
  urgency?: UrgencyLevel;

  @ApiProperty({
    description: 'Minimum budget amount',
    example: 100,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  minBudget?: number;

  @ApiProperty({
    description: 'Maximum budget amount',
    example: 5000,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Max(100000)
  maxBudget?: number;

  @ApiProperty({
    description: 'Filter by city',
    example: 'Cape Town',
    required: false,
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({
    description: 'Filter by province',
    example: 'Western Cape',
    required: false,
  })
  @IsString()
  @IsOptional()
  province?: string;

  @ApiProperty({
    description: 'Latitude for distance-based search',
    example: -33.9249,
    required: false,
  })
  @IsLatitude()
  @IsOptional()
  @Type(() => Number)
  latitude?: number;

  @ApiProperty({
    description: 'Longitude for distance-based search',
    example: 18.4241,
    required: false,
  })
  @IsLongitude()
  @IsOptional()
  @Type(() => Number)
  longitude?: number;

  @ApiProperty({
    description: 'Maximum distance in kilometers',
    example: 25,
    minimum: 1,
    maximum: 200,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(200)
  radius?: number;

  @ApiProperty({
    description: 'Sort field',
    enum: ['createdAt', 'budget', 'distance', 'urgency'],
    example: 'createdAt',
    required: false,
  })
  @IsString()
  @IsOptional()
  sortBy?: 'createdAt' | 'budget' | 'distance' | 'urgency';

  @ApiProperty({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    example: 'desc',
    required: false,
  })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}

export class JobStatisticsDto {
  @ApiProperty({
    description: 'Total jobs count',
    example: 156,
  })
  total: number;

  @ApiProperty({
    description: 'Open jobs count',
    example: 45,
  })
  open: number;

  @ApiProperty({
    description: 'In progress jobs count',
    example: 23,
  })
  inProgress: number;

  @ApiProperty({
    description: 'Completed jobs count',
    example: 88,
  })
  completed: number;

  @ApiProperty({
    description: 'Average budget',
    example: 850.50,
  })
  averageBudget: number;

  @ApiProperty({
    description: 'Total budget value',
    example: 134678.50,
  })
  totalBudget: number;
}
