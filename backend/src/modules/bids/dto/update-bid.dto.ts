import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsArray, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UpdateBidDto {
  @ApiProperty({
    description: 'Updated bid amount in ZAR',
    example: 2200.00,
    minimum: 50,
    required: false,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(50, { message: 'Minimum bid amount is R50' })
  @Transform(({ value }) => parseFloat(value))
  amount?: number;

  @ApiProperty({
    description: 'Updated bid message',
    example: 'Updated proposal with better pricing and timeline.',
    minLength: 50,
    maxLength: 1000,
    required: false,
  })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiProperty({
    description: 'Updated estimated completion time in days',
    example: 2,
    minimum: 1,
    maximum: 365,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Minimum estimated days is 1' })
  @Max(365, { message: 'Maximum estimated days is 365' })
  estimatedDays?: number;

  @ApiProperty({
    description: 'Updated portfolio attachments',
    example: ['https://example.com/updated-portfolio.jpg'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @ApiProperty({
    description: 'Updated bid expiry date and time (ISO string)',
    example: '2025-09-15T23:59:59.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
