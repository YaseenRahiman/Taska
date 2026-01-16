import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsString,
  MaxLength
} from 'class-validator';

/**
 * DTO for confirming job completion with optional rating
 * Both client and artisan must confirm for job to be marked as completed
 */
export class ConfirmJobCompletionDto {
  @ApiProperty({
    description: 'Overall rating for the other party (1-5 stars)',
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
    description: 'Quality of work/service rating (1-5 stars)',
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
    description: 'Optional feedback or comment',
    example: 'Great work! Very professional and completed on time.',
    required: false,
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Feedback cannot exceed 1000 characters' })
  feedback?: string;
}

/**
 * Response DTO for job completion status
 */
export class JobCompletionStatusDto {
  @ApiProperty({
    description: 'ID of the job',
    example: 'clm7x1y2z0001abc123def456',
  })
  jobId: string;

  @ApiProperty({
    description: 'Whether client has confirmed completion',
    example: true,
  })
  clientConfirmed: boolean;

  @ApiProperty({
    description: 'Timestamp when client confirmed',
    example: '2024-01-15T10:30:00.000Z',
    required: false,
  })
  clientConfirmedAt?: Date;

  @ApiProperty({
    description: 'Whether artisan has confirmed completion',
    example: false,
  })
  artisanConfirmed: boolean;

  @ApiProperty({
    description: 'Timestamp when artisan confirmed',
    example: null,
    required: false,
  })
  artisanConfirmedAt?: Date;

  @ApiProperty({
    description: 'Whether both parties have confirmed and job is completed',
    example: false,
  })
  isFullyConfirmed: boolean;

  @ApiProperty({
    description: 'Current job status',
    example: 'IN_PROGRESS',
  })
  jobStatus: string;
}
