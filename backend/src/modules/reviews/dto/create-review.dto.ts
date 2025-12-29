import { ApiProperty } from '@nestjs/swagger';
import { 
  IsNotEmpty, 
  IsString, 
  IsInt, 
  Min, 
  Max, 
  IsOptional, 
  IsArray, 
  IsUrl, 
  MaxLength, 
  MinLength 
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({
    description: 'ID of the job being reviewed',
    example: 'clm7x1y2z0001abc123def456',
  })
  @IsNotEmpty()
  @IsString()
  jobId: string;

  @ApiProperty({
    description: 'ID of the user being reviewed (artisan or client)',
    example: 'clm7x1y2z0002abc123def789',
  })
  @IsNotEmpty()
  @IsString()
  revieweeId: string;

  @ApiProperty({
    description: 'Overall rating (1-5 stars)',
    minimum: 1,
    maximum: 5,
    example: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({
    description: 'Quality of work rating (1-5 stars)',
    minimum: 1,
    maximum: 5,
    example: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  qualityRating: number;

  @ApiProperty({
    description: 'Timeliness rating (1-5 stars)',
    minimum: 1,
    maximum: 5,
    example: 4,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  timelinessRating: number;

  @ApiProperty({
    description: 'Communication rating (1-5 stars)',
    minimum: 1,
    maximum: 5,
    example: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  communicationRating: number;

  @ApiProperty({
    description: 'Value for money rating (1-5 stars)',
    minimum: 1,
    maximum: 5,
    example: 4,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  valueRating: number;

  @ApiProperty({
    description: 'Written review comment (minimum 10 characters)',
    example: 'Excellent work! The plumber arrived on time and fixed the issue quickly. Very professional and clean work.',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(10, { message: 'Review comment must be at least 10 characters long' })
  @MaxLength(1000, { message: 'Review comment cannot exceed 1000 characters' })
  comment?: string;

  @ApiProperty({
    description: 'Array of image URLs showing completed work',
    type: [String],
    required: false,
    example: ['https://example.com/completed-work-1.jpg', 'https://example.com/completed-work-2.jpg'],
  })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  images?: string[];
}
