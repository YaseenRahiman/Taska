import { IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({
    example: 'verification-token-uuid-12345',
    description: 'Email verification token',
  })
  @IsString()
  token: string;

  @ApiProperty({
    example: 'clxxx123456789',
    description: 'User ID',
  })
  @IsString()
  @IsUUID('4', { message: 'User ID must be a valid UUID' })
  userId: string;
}
