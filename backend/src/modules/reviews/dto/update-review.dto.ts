import { ApiProperty } from '@nestjs/swagger';
import { 
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

export class UpdateReviewDto {
  @ApiProperty({
    description: 'Overall rating (1-5 stars)',
    minimum: 1,
    maximum: 5,
    example: 5,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiProperty({
    description: 'Quality of work rating (1-5 stars)',
    minimum: 1,
    maximum: 5,
    example: 5,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  qualityRating?: number;

  @ApiProperty({
    description: 'Timeliness rating (1-5 stars)',
    minimum: 1,
    maximum: 5,
    example: 4,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  timelinessRating?: number;

  @ApiProperty({
    description: 'Communication rating (1-5 stars)',
    minimum: 1,
    maximum: 5,
    example: 5,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  communicationRating?: number;

  @ApiProperty({
    description: 'Value for money rating (1-5 stars)',
    minimum: 1,
    maximum: 5,
    example: 4,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  valueRating?: number;

  @ApiProperty({
    description: 'Written review comment (minimum 10 characters)',
    example: 'Updated review: Excellent work! The plumber arrived on time and fixed the issue quickly.',
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
