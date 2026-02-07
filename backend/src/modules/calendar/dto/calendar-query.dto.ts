import { IsDateString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CalendarQueryDto {
  @ApiPropertyOptional({ example: '2026-02-01T00:00:00.000Z', description: 'Start of date range' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-02-28T23:59:59.999Z', description: 'End of date range' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
