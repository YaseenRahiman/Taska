import { IsString, IsOptional, IsArray, IsBoolean, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'User full name',
    example: 'John Doe',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '+27821234567',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'Profile bio',
    example: 'Experienced plumber with 10 years of experience',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({
    description: 'Profile picture URL',
    example: 'https://example.com/profile.jpg',
  })
  @IsOptional()
  @IsString()
  profilePicture?: string;

  @ApiPropertyOptional({
    description: 'Location/address',
    example: 'Cape Town, South Africa',
  })
  @IsOptional()
  @IsString()
  location?: string;
}

export class UpdateSpecializationsDto {
  @ApiPropertyOptional({
    description: 'Array of category IDs for artisan specializations',
    example: ['cat_plumbing_123', 'cat_electrical_456'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];
}

export class UpdateAvailabilityDto {
  @ApiPropertyOptional({
    description: 'Whether artisan is currently available for new jobs',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  available?: boolean;
}

export class ProfileResponseDto {
  @ApiPropertyOptional({
    description: 'User ID',
    example: 'user_abc123',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'Email address',
    example: 'john@example.com',
  })
  email: string;

  @ApiPropertyOptional({
    description: 'Full name',
    example: 'John Doe',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '+27821234567',
  })
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'User role',
    enum: ['CLIENT', 'ARTISAN', 'ADMIN'],
    example: 'ARTISAN',
  })
  role: string;

  @ApiPropertyOptional({
    description: 'Profile bio',
    example: 'Experienced plumber',
  })
  bio?: string;

  @ApiPropertyOptional({
    description: 'Profile picture URL',
    example: 'https://example.com/profile.jpg',
  })
  profilePicture?: string;

  @ApiPropertyOptional({
    description: 'Location',
    example: 'Cape Town',
  })
  location?: string;

  @ApiPropertyOptional({
    description: 'Verification status',
    example: true,
  })
  isVerified: boolean;

  @ApiPropertyOptional({
    description: 'Account creation date',
    example: '2025-01-01T00:00:00Z',
  })
  createdAt: Date;
}
