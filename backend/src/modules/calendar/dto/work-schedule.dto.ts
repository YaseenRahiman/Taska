import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DayOfWeek } from '@prisma/client';

export class WorkScheduleDayDto {
  @ApiProperty({ enum: DayOfWeek })
  @IsEnum(DayOfWeek)
  dayOfWeek: DayOfWeek;

  @ApiProperty({ default: true })
  @IsBoolean()
  isAvailable: boolean;

  @ApiProperty({ example: '09:00', description: 'HH:mm format' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'startTime must be in HH:mm format' })
  startTime: string;

  @ApiProperty({ example: '17:00', description: 'HH:mm format' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'endTime must be in HH:mm format' })
  endTime: string;

  @ApiPropertyOptional({ example: '12:00', description: 'HH:mm format' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'breakStart must be in HH:mm format' })
  breakStart?: string;

  @ApiPropertyOptional({ example: '13:00', description: 'HH:mm format' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'breakEnd must be in HH:mm format' })
  breakEnd?: string;
}

export class BulkUpdateScheduleDto {
  @ApiProperty({ type: [WorkScheduleDayDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkScheduleDayDto)
  schedule: WorkScheduleDayDto[];
}

export class UpdateSingleDayDto {
  @ApiProperty({ default: true })
  @IsBoolean()
  isAvailable: boolean;

  @ApiProperty({ example: '09:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'startTime must be in HH:mm format' })
  startTime: string;

  @ApiProperty({ example: '17:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'endTime must be in HH:mm format' })
  endTime: string;

  @ApiPropertyOptional({ example: '12:00' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'breakStart must be in HH:mm format' })
  breakStart?: string;

  @ApiPropertyOptional({ example: '13:00' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'breakEnd must be in HH:mm format' })
  breakEnd?: string;
}
