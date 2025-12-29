import { IsEmail, IsString, IsEnum, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'User email address',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    example: 'SecurePassword123!',
    description: 'User password (minimum 8 characters, must contain uppercase, lowercase, number and special character)',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    },
  )
  password: string;

  @ApiPropertyOptional({
    enum: UserRole,
    example: UserRole.CLIENT,
    description: 'User role (defaults to CLIENT)',
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Role must be either CLIENT, ARTISAN, ADMIN, or ASSESSOR' })
  role?: UserRole;

  @ApiProperty({
    example: 'John',
    description: 'User first name',
  })
  @IsString()
  @MaxLength(50, { message: 'First name cannot exceed 50 characters' })
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'User last name',
  })
  @IsString()
  @MaxLength(50, { message: 'Last name cannot exceed 50 characters' })
  lastName: string;

  @ApiPropertyOptional({
    example: '+27821234567',
    description: 'User phone number (South African format - spaces and dashes allowed)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?([0-9]{1,4}[-\s\.]?){1,4}$/, {
    message: 'Please enter a valid phone number',
  })
  phoneNumber?: string;

  // Artisan-specific fields
  @ApiPropertyOptional({
    example: 'plumbing',
    description: 'Primary trade/specialization for artisan users',
  })
  @IsOptional()
  @IsString()
  trade?: string;

  @ApiPropertyOptional({
    example: 5,
    description: 'Years of experience for artisan users',
  })
  @IsOptional()
  experience?: number;

  @ApiPropertyOptional({
    example: 'Johannesburg',
    description: 'City or location for artisan users',
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    example: 'Experienced professional with 5+ years...',
    description: 'Bio/description for artisan users',
  })
  @IsOptional()
  @IsString()
  bio?: string;
}
