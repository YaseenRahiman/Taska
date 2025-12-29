import { IsOptional, IsString, IsEnum, IsDateString, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { MessageType } from './create-message.dto';
import { IsCuid } from '../../../common/validators/is-cuid.validator';

export class MessageQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by job ID',
    example: 'cmgzjb71a0003aexl2yrhmcbf',
  })
  @IsOptional()
  @IsString()
  @IsCuid()
  jobId?: string;

  @ApiPropertyOptional({
    description: 'Filter by conversation with specific user',
    example: 'cmgzjb71a0003aexl2yrhmcbf',
  })
  @IsOptional()
  @IsString()
  @IsCuid()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Filter by message type',
    enum: MessageType,
  })
  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;

  @ApiPropertyOptional({
    description: 'Search in message content',
    example: 'project requirements',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter messages from date',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({
    description: 'Filter messages to date',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({
    description: 'Show only unread messages',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  unreadOnly?: boolean;
}

export class MarkAsReadDto {
  @ApiPropertyOptional({
    description: 'Mark all messages in job as read',
    example: 'cmgzjb71a0003aexl2yrhmcbf',
  })
  @IsOptional()
  @IsString()
  @IsCuid()
  jobId?: string;

  @ApiPropertyOptional({
    description: 'Mark specific message as read',
    example: 'cmgzjb71a0003aexl2yrhmcbf',
  })
  @IsOptional()
  @IsString()
  @IsCuid()
  messageId?: string;

  @ApiPropertyOptional({
    description: 'Mark multiple specific messages as read',
    example: ['cmgzjb71a0003aexl2yrhmcbf', 'cmgzjb71a0003aexl2yrhmcbf'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  messageIds?: string[];
}

export class TypingIndicatorDto {
  @ApiPropertyOptional({
    description: 'Job ID where typing is happening',
    example: 'cmgzjb71a0003aexl2yrhmcbf',
  })
  @IsString()
  @IsCuid()
  jobId: string;

  @ApiPropertyOptional({
    description: 'User ID who is typing',
    example: 'cmgzjb71a0003aexl2yrhmcbf',
  })
  @IsString()
  @IsCuid()
  recipientId: string;

  @ApiPropertyOptional({
    description: 'Whether user is typing',
    example: true,
  })
  @Type(() => Boolean)
  isTyping: boolean;
}
