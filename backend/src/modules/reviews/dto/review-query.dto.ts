import { ApiProperty } from '@nestjs/swagger';
import { 
  IsOptional, 
  IsString, 
  IsInt, 
  Min, 
  Max, 
  IsBoolean, 
  IsEnum,
  IsDateString 
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export enum ReviewSortBy {
  CREATED_AT = 'createdAt',
  RATING = 'rating',
  HELPFUL_COUNT = 'helpfulCount',
  UPDATED_AT = 'updatedAt',
}

export enum ReviewSortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class ReviewQueryDto extends PaginationDto {
  @ApiProperty({
    description: 'Filter by reviewee (user being reviewed)',
    required: false,
    example: 'clm7x1y2z0002abc123def789',
  })
  @IsOptional()
  @IsString()
  revieweeId?: string;

  @ApiProperty({
    description: 'Filter by reviewer (user giving the review)',
    required: false,
    example: 'clm7x1y2z0001abc123def456',
  })
  @IsOptional()
  @IsString()
  reviewerId?: string;

  @ApiProperty({
    description: 'Filter by job ID',
    required: false,
    example: 'clm7x1y2z0003abc123def123',
  })
  @IsOptional()
  @IsString()
  jobId?: string;

  @ApiProperty({
    description: 'Filter by minimum rating',
    minimum: 1,
    maximum: 5,
    required: false,
    example: 4,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(5)
  minRating?: number;

  @ApiProperty({
    description: 'Filter by maximum rating',
    minimum: 1,
    maximum: 5,
    required: false,
    example: 5,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(5)
  maxRating?: number;

  @ApiProperty({
    description: 'Filter by verified reviews only',
    required: false,
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isVerified?: boolean;

  @ApiProperty({
    description: 'Filter reviews that have responses',
    required: false,
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  hasResponse?: boolean;

  @ApiProperty({
    description: 'Filter reviews created after this date',
    required: false,
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  createdAfter?: string;

  @ApiProperty({
    description: 'Filter reviews created before this date',
    required: false,
    example: '2024-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  createdBefore?: string;

  @ApiProperty({
    description: 'Sort reviews by field',
    enum: ReviewSortBy,
    required: false,
    example: ReviewSortBy.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(ReviewSortBy)
  sortBy?: ReviewSortBy = ReviewSortBy.CREATED_AT;

  @ApiProperty({
    description: 'Sort order',
    enum: ReviewSortOrder,
    required: false,
    example: ReviewSortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(ReviewSortOrder)
  sortOrder?: ReviewSortOrder = ReviewSortOrder.DESC;

  @ApiProperty({
    description: 'Search in review comments',
    required: false,
    example: 'excellent work',
  })
  @IsOptional()
  @IsString()
  search?: string;
}

export class ReviewResponseDto {
  @ApiProperty({
    description: 'Response to the review from the reviewee',
    example: 'Thank you for the positive feedback! It was a pleasure working with you.',
  })
  @IsString()
  response: string;
}

export class ReviewHelpfulVoteDto {
  @ApiProperty({
    description: 'Whether the review was helpful',
    example: true,
  })
  @IsBoolean()
  helpful: boolean;
}
