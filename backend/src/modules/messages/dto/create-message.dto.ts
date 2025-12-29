import { IsNotEmpty, IsString, IsUUID, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsCuid } from '../../../common/validators/is-cuid.validator';

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
  SYSTEM = 'SYSTEM',
}

export class CreateMessageDto {
  @ApiProperty({
    description: 'The recipient user ID',
    example: 'cmgzj9oqc0005vou9xebok1wu',
  })
  @IsNotEmpty()
  @IsCuid()
  recipientId: string;

  @ApiProperty({
    description: 'The job ID this conversation is related to',
    example: 'cmgzj9ok40003vou9khnwc109',
  })
  @IsNotEmpty()
  @IsCuid()
  jobId: string;

  @ApiProperty({
    description: 'The message content',
    example: 'Hello, I have a question about the job requirements.',
    maxLength: 1000,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
  content: string;

  @ApiPropertyOptional({
    description: 'The type of message',
    enum: MessageType,
    default: MessageType.TEXT,
  })
  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType = MessageType.TEXT;

  @ApiPropertyOptional({
    description: 'File URL if message contains file/image',
    example: 'https://storage.example.com/files/image.jpg',
  })
  @IsOptional()
  @IsString()
  fileUrl?: string;

  @ApiPropertyOptional({
    description: 'Original filename if file is attached',
    example: 'project_requirements.pdf',
  })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional({
    description: 'File size in bytes',
    example: 1024000,
  })
  @IsOptional()
  fileSize?: number;

  @ApiPropertyOptional({
    description: 'Local ID for tracking message on client side',
    example: 'temp-msg-123',
  })
  @IsOptional()
  @IsString()
  localId?: string;
}
