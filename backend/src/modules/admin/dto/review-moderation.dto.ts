import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsBoolean,
  Min,
  Max,
  IsArray,
  IsDateString,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum ReviewStatusDto {
  VISIBLE = 'VISIBLE',
  HIDDEN = 'HIDDEN',
  DELETED = 'DELETED',
}

export enum ReviewFlagReasonDto {
  SPAM = 'SPAM',
  INAPPROPRIATE = 'INAPPROPRIATE',
  FAKE = 'FAKE',
  OFFENSIVE = 'OFFENSIVE',
  OTHER = 'OTHER',
}

export class FlaggedReviewsQueryDto {
  @ApiPropertyOptional({ enum: ReviewStatusDto })
  @IsOptional()
  @IsEnum(ReviewStatusDto)
  status?: ReviewStatusDto;

  @ApiPropertyOptional({ enum: ReviewFlagReasonDto })
  @IsOptional()
  @IsEnum(ReviewFlagReasonDto)
  flagReason?: ReviewFlagReasonDto;

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  minRating?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  maxRating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class EditReviewDto {
  @ApiProperty()
  @IsString()
  content: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty()
  @IsString()
  editReason: string;
}

export class ToggleVisibilityDto {
  @ApiProperty()
  @IsBoolean()
  visible: boolean;

  @ApiProperty()
  @IsString()
  reason: string;
}

export class DeleteReviewDto {
  @ApiProperty()
  @IsString()
  reason: string;
}

export class FlagReviewDto {
  @ApiProperty({ enum: ReviewFlagReasonDto })
  @IsEnum(ReviewFlagReasonDto)
  reason: ReviewFlagReasonDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class AddModerationNoteDto {
  @ApiProperty()
  @IsString()
  content: string;
}

export class BatchModerationDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  reviewIds: string[];

  @ApiProperty({ enum: ['HIDE', 'SHOW', 'DELETE'] })
  @IsEnum(['HIDE', 'SHOW', 'DELETE'])
  action: 'HIDE' | 'SHOW' | 'DELETE';

  @ApiProperty()
  @IsString()
  reason: string;
}

export class ExportReviewsDto {
  @ApiPropertyOptional()
  @IsOptional()
  filters?: FlaggedReviewsQueryDto;

  @ApiProperty({ enum: ['CSV', 'JSON'] })
  @IsEnum(['CSV', 'JSON'])
  format: 'CSV' | 'JSON';
}

// Response DTOs
export class ReviewFlagResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  reviewId: string;

  @ApiProperty()
  flaggedBy: string;

  @ApiProperty({ enum: ReviewFlagReasonDto })
  reason: ReviewFlagReasonDto;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  createdAt: Date;
}

export class ModerationNoteResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  reviewId: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  createdBy: string;

  @ApiPropertyOptional()
  admin?: {
    id: string;
    email: string;
    profile?: {
      firstName?: string;
      lastName?: string;
    };
  };

  @ApiProperty()
  createdAt: Date;
}

export class EditHistoryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  reviewId: string;

  @ApiProperty()
  previousRating: number;

  @ApiProperty()
  newRating: number;

  @ApiPropertyOptional()
  previousContent?: string;

  @ApiPropertyOptional()
  newContent?: string;

  @ApiProperty()
  editedBy: string;

  @ApiProperty()
  editReason: string;

  @ApiPropertyOptional()
  editor?: {
    id: string;
    email: string;
    profile?: {
      firstName?: string;
      lastName?: string;
    };
  };

  @ApiProperty()
  createdAt: Date;
}

export class ReviewModerationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  reviewId: string;

  @ApiProperty()
  flagCount: number;

  @ApiProperty({ type: [ReviewFlagResponseDto] })
  flags: ReviewFlagResponseDto[];

  @ApiProperty({ enum: ReviewStatusDto })
  status: ReviewStatusDto;

  @ApiPropertyOptional()
  moderatedBy?: string;

  @ApiPropertyOptional()
  moderatedAt?: Date;

  @ApiPropertyOptional({ type: [ModerationNoteResponseDto] })
  moderationNotes?: ModerationNoteResponseDto[];

  @ApiPropertyOptional({ type: [EditHistoryResponseDto] })
  editHistory?: EditHistoryResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ReviewResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  rating: number;

  @ApiPropertyOptional()
  content?: string;

  @ApiProperty()
  jobId: string;

  @ApiProperty()
  reviewerId: string;

  @ApiProperty()
  artisanId: string;

  @ApiProperty()
  reviewer: {
    id: string;
    email: string;
    profile?: {
      firstName?: string;
      lastName?: string;
    };
  };

  @ApiProperty()
  artisan: {
    id: string;
    email: string;
    profile?: {
      firstName?: string;
      lastName?: string;
      businessName?: string;
    };
  };

  @ApiPropertyOptional()
  job?: {
    id: string;
    title: string;
  };

  @ApiPropertyOptional({ type: ReviewModerationResponseDto })
  moderation?: ReviewModerationResponseDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PaginatedFlaggedReviewsDto {
  @ApiProperty({ type: [ReviewResponseDto] })
  reviews: ReviewResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class ReviewStatisticsDto {
  @ApiProperty()
  totalFlagged: number;

  @ApiProperty()
  visible: number;

  @ApiProperty()
  hidden: number;

  @ApiProperty()
  deleted: number;
}

export class ReviewModerationActionResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiPropertyOptional({ type: ReviewResponseDto })
  review?: ReviewResponseDto;
}
