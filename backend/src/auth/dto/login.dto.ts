import { IsEmail, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'User email address',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    example: 'SecurePassword123!',
    description: 'User password',
  })
  @IsString()
  password: string;

  @ApiPropertyOptional({
    example: 'device-uuid-12345',
    description: 'Device identifier for session management',
  })
  @IsOptional()
  @IsString()
  deviceId?: string;
}
