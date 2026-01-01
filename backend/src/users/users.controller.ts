import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  UpdateProfileDto,
  UpdateSpecializationsDto,
  UpdateAvailabilityDto,
  ProfileResponseDto,
} from './dto/update-profile.dto';

/**
 * Controller for user profile management
 *
 * Provides REST API endpoints for users to:
 * - View their profile
 * - Update profile information
 * - Manage specializations (artisans)
 * - Update availability status
 */
@ApiTags('Users & Profile')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Get current user's profile
   */
  @Get('profile')
  @ApiOperation({
    summary: 'Get my profile',
    description: 'Retrieve complete profile information for authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
    type: ProfileResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getMyProfile(@Request() req): Promise<any> {
    const user = await this.usersService.getFullProfile(req.user.userId) as any;

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phoneNumber: user.profile?.phoneNumber,
      role: user.role,
      bio: user.profile?.bio,
      profilePicture: user.profile?.profilePictureUrl,
      location: `${user.profile?.city || ''}, ${user.profile?.province || ''}`.trim(),
      isVerified: user.verifiedAt !== null,
      createdAt: user.createdAt,
      profile: user.profile,
      specializations: user.specializations,
      wallet: user.wallet,
      recentJobs: user.clientJobs,
      recentBids: user.artisanBids,
      reviews: user.reviews,
    };
  }

  /**
   * Update profile information
   */
  @Patch('profile')
  @ApiOperation({
    summary: 'Update profile',
    description: 'Update basic profile information (name, phone, bio, etc.)',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: ProfileResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid profile data',
  })
  async updateProfile(
    @Request() req,
    @Body() updateDto: UpdateProfileDto,
  ): Promise<any> {
    const userId = req.user.userId;

    // Update user basic info
    const updateData: any = {};
    if (updateDto.name !== undefined) updateData.name = updateDto.name;

    // Update profile fields
    const profileData: any = { userId };
    if (updateDto.phoneNumber !== undefined) profileData.phoneNumber = updateDto.phoneNumber;
    if (updateDto.bio !== undefined) profileData.bio = updateDto.bio;
    if (updateDto.profilePicture !== undefined) profileData.profilePictureUrl = updateDto.profilePicture;
    if (updateDto.location !== undefined) {
      // Parse location as "City, Province"
      const [city, province] = updateDto.location.split(',').map(s => s.trim());
      if (city) profileData.city = city;
      if (province) profileData.province = province;
    }

    // If we have profile data, include it in the update
    if (Object.keys(profileData).length > 1) { // More than just userId
      updateData.profile = {
        upsert: {
          create: profileData,
          update: profileData,
        },
      };
    }

    const user = await this.usersService.update(userId, updateData) as any;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phoneNumber: user.profile?.phoneNumber,
      role: user.role,
      bio: user.profile?.bio,
      profilePicture: user.profile?.profilePictureUrl,
      location: `${user.profile?.city || ''}, ${user.profile?.province || ''}`.trim(),
      isVerified: user.verifiedAt !== null,
      createdAt: user.createdAt,
    };
  }

  /**
   * Update artisan specializations
   */
  @Patch('specializations')
  @ApiOperation({
    summary: 'Update specializations',
    description: 'Update artisan category specializations (artisans only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Specializations updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Specializations updated successfully' },
        count: { type: 'number', example: 3 },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid specializations or user is not an artisan',
  })
  async updateSpecializations(
    @Request() req,
    @Body() updateDto: UpdateSpecializationsDto,
  ): Promise<{ message: string; count: number }> {
    const userId = req.user.userId;

    // Verify user is an artisan
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== 'ARTISAN') {
      throw new BadRequestException('Only artisans can update specializations');
    }

    if (!updateDto.categoryIds || updateDto.categoryIds.length === 0) {
      throw new BadRequestException('At least one category must be specified');
    }

    // Verify all categories exist
    const categories = await this.prisma.category.findMany({
      where: {
        id: { in: updateDto.categoryIds },
      },
    });

    if (categories.length !== updateDto.categoryIds.length) {
      throw new BadRequestException('One or more invalid category IDs');
    }

    // Delete existing specializations and create new ones in a transaction
    await this.prisma.$transaction(async (tx) => {
      // Delete existing
      await tx.artisanSpecialization.deleteMany({
        where: { userId: userId },
      });

      // Create new
      await tx.artisanSpecialization.createMany({
        data: updateDto.categoryIds.map((categoryId) => ({
          userId: userId,
          categoryId,
          experience: 0, // Default to 0, can be updated later
          portfolio: [],
          certifications: [],
        })),
      });
    });

    return {
      message: 'Specializations updated successfully',
      count: updateDto.categoryIds.length,
    };
  }


  /**
   * Get user's specializations
   */
  @Get('specializations')
  @ApiOperation({
    summary: 'Get my specializations',
    description: 'Get current artisan specializations',
  })
  @ApiResponse({
    status: 200,
    description: 'Specializations retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        specializations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              categoryId: { type: 'string' },
              categoryName: { type: 'string' },
            },
          },
        },
      },
    },
  })
  async getSpecializations(@Request() req): Promise<any> {
    const userId = req.user.userId;

    const specializations = await this.prisma.artisanSpecialization.findMany({
      where: { userId: userId },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    return {
      specializations: specializations.map((spec) => ({
        id: spec.id,
        categoryId: spec.categoryId,
        experience: spec.experience,
        categoryName: spec.category.name,
        categoryDescription: spec.category.description,
      })),
    };
  }
}
