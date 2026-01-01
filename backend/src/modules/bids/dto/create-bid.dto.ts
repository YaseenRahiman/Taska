import { IsNotEmpty, IsString, IsNumber, IsArray, IsOptional, IsDateString, Min, Max, IsDecimal } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { Decimal } from '@prisma/client/runtime/library';

export class CreateBidDto {
  @ApiProperty({
    description: 'Job ID to bid on',
    example: 'clh123456789',
  })
  @IsNotEmpty()
  @IsString()
  jobId: string;

  @ApiProperty({
    description: 'Bid amount in ZAR',
    example: 2500.00,
    minimum: 50,
  })
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(50, { message: 'Minimum bid amount is R50' })
  @Transform(({ value }) => parseFloat(value))
  amount: number;

  @ApiProperty({
    description: 'Bid message explaining the proposal',
    example: 'I have 5 years experience in plumbing and can complete this job within the specified timeframe.',
    minLength: 50,
    maxLength: 1000,
  })
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Estimated completion time in days',
    example: 3,
    minimum: 1,
    maximum: 365,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1, { message: 'Minimum estimated days is 1' })
  @Max(365, { message: 'Maximum estimated days is 365' })
  estimatedDays: number;

  @ApiProperty({
    description: 'Portfolio attachments (URLs to images, documents, etc.)',
    example: ['https://example.com/portfolio1.jpg', 'https://example.com/quote.pdf'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @ApiProperty({
    description: 'Bid expiry date and time (ISO string)',
    example: '2025-09-12T23:59:59.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
