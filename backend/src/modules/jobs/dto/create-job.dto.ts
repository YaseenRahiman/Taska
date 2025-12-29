import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
  IsArray,
  IsDateString,
  IsLatitude,
  IsLongitude,
  MinLength,
  MaxLength,
  IsNumberString,
  ArrayMaxSize,
  IsUrl,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { BudgetType, UrgencyLevel } from '@prisma/client';

export class CreateJobDto {
  @ApiProperty({
    description: 'Job title',
    example: 'Fix leaking kitchen faucet',
    minLength: 5,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(100)
  title: string;

  @ApiProperty({
    description: 'Detailed job description',
    example: 'Kitchen faucet has been dripping for a week. Need professional plumber to fix or replace.',
    minLength: 20,
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(20)
  @MaxLength(2000)
  description: string;

  @ApiProperty({
    description: 'Job category ID',
    example: 'ckxxx...',
  })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({
    description: 'Budget amount in ZAR',
    example: 5000.00,
    minimum: 1000,
    maximum: 100000,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1000)
  @Max(100000)
  budget: number;

  @ApiProperty({
    description: 'Budget type',
    enum: BudgetType,
    example: BudgetType.FIXED,
  })
  @IsEnum(BudgetType)
  budgetType: BudgetType;

  @ApiProperty({
    description: 'Job urgency level',
    enum: UrgencyLevel,
    example: UrgencyLevel.MEDIUM,
  })
  @IsEnum(UrgencyLevel)
  urgency: UrgencyLevel;

  @ApiProperty({
    description: 'Street address line 1',
    example: '123 Main Street',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  addressLine1: string;

  @ApiProperty({
    description: 'Street address line 2 (optional)',
    example: 'Apartment 4B',
    maxLength: 255,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  addressLine2?: string;

  @ApiProperty({
    description: 'City',
    example: 'Cape Town',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city: string;

  @ApiProperty({
    description: 'Province',
    example: 'Western Cape',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  province: string;

  @ApiProperty({
    description: 'Postal code',
    example: '8001',
    maxLength: 10,
  })
  @IsNumberString()
  @IsNotEmpty()
  @MaxLength(10)
  postalCode: string;

  @ApiProperty({
    description: 'Latitude coordinate',
    example: -33.9249,
  })
  @IsLatitude()
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: 18.4241,
  })
  @IsLongitude()
  longitude: number;

  @ApiProperty({
    description: 'Job images URLs (max 5)',
    type: [String],
    example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    required: false,
    maxItems: 5,
  })
  @IsArray()
  @IsOptional()
  @ArrayMaxSize(5)
  @IsUrl({}, { each: true })
  images?: string[];

  @ApiProperty({
    description: 'Specific job requirements',
    type: [String],
    example: ['Must have plumbing license', 'Provide own tools', 'Available weekends'],
    required: false,
    maxItems: 10,
  })
  @IsArray()
  @IsOptional()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  requirements?: string[];

  @ApiProperty({
    description: 'Preferred start date (optional)',
    example: '2024-01-15T09:00:00Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: 'Preferred end date (optional)',
    example: '2024-01-15T17:00:00Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({
    description: 'Save as draft (default: true - job will not be published immediately)',
    example: true,
    default: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isDraft?: boolean = true;
}
