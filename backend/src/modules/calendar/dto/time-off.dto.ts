import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TimeOffReason } from '@prisma/client';

export class CreateTimeOffDto {
  @ApiProperty({ example: '2026-03-01T00:00:00.000Z' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-03-05T00:00:00.000Z' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ enum: TimeOffReason, default: TimeOffReason.PERSONAL })
  @IsEnum(TimeOffReason)
  reason: TimeOffReason;

  @ApiPropertyOptional({ example: 'Family vacation' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class UpdateTimeOffDto {
  @ApiPropertyOptional({ example: '2026-03-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-03-05T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: TimeOffReason })
  @IsOptional()
  @IsEnum(TimeOffReason)
  reason?: TimeOffReason;

  @ApiPropertyOptional({ example: 'Family vacation' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
