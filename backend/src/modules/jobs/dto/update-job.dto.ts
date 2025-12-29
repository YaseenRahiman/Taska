import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateJobDto } from './create-job.dto';
import { IsOptional, IsEnum } from 'class-validator';
import { JobStatus } from '@prisma/client';

export class UpdateJobDto extends PartialType(CreateJobDto) {
  @ApiProperty({
    description: 'Job status',
    enum: JobStatus,
    example: JobStatus.OPEN,
    required: false,
  })
  @IsEnum(JobStatus)
  @IsOptional()
  status?: JobStatus;
}
