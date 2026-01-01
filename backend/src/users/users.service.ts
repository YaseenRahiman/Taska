import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, UserRole, Prisma } from '@prisma/client';
import { LoggingService } from '../common/logging/logging.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggingService,
  ) {}

  /**
   * Find user by ID with optional includes
   */
  async findById(
    id: string,
    include?: Prisma.UserInclude
  ): Promise<User | null> {
    try {
      return await this.prisma.user.findUnique({
        where: { id },
        include,
      });
    } catch (error) {
      this.logger.error(`Error finding user by ID ${id}: ${error.message}`, 'UsersService');
      throw error;
    }
  }

  /**
   * Find user by email with optional includes
   */
  async findByEmail(
    email: string,
    include?: Prisma.UserInclude
  ): Promise<User | null> {
    try {
      return await this.prisma.user.findUnique({
        where: { email },
        include,
      });
    } catch (error) {
      this.logger.error(`Error finding user by email ${email}: ${error.message}`, 'UsersService');
      throw error;
    }
  }

  /**
   * Create a new user
   */
  async create(data: Prisma.UserCreateInput): Promise<User> {
    try {
      const user = await this.prisma.user.create({
        data,
        include: {
          profile: true,
        },
      });

      this.logger.log(`User created successfully: ${user.email}`, 'UsersService');
      return user;
    } catch (error) {
      this.logger.error(`Error creating user: ${error.message}`, 'UsersService');
      throw error;
    }
  }

  /**
   * Update user by ID
   */
  async update(
    id: string,
    data: Prisma.UserUpdateInput
  ): Promise<User> {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data,
        include: {
          profile: true,
        },
      });

      this.logger.log(`User updated successfully: ${user.email}`, 'UsersService');
      return user;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      this.logger.error(`Error updating user ${id}: ${error.message}`, 'UsersService');
      throw error;
    }
  }

  /**
   * Get users with pagination and filtering
   */
  async findMany(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.UserWhereUniqueInput;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
    include?: Prisma.UserInclude;
  }): Promise<User[]> {
    const { skip, take, cursor, where, orderBy, include } = params;

    try {
      return await this.prisma.user.findMany({
        skip,
        take,
        cursor,
        where,
        orderBy,
        include,
      });
    } catch (error) {
      this.logger.error(`Error finding users: ${error.message}`, 'UsersService');
      throw error;
    }
  }

  /**
   * Count users with optional filtering
   */
  async count(where?: Prisma.UserWhereInput): Promise<number> {
    try {
      return await this.prisma.user.count({ where });
    } catch (error) {
      this.logger.error(`Error counting users: ${error.message}`, 'UsersService');
      throw error;
    }
  }

  /**
   * Delete user (soft delete by updating a status field or hard delete)
   */
  async delete(id: string): Promise<User> {
    try {
      const user = await this.prisma.user.delete({
        where: { id },
      });

      this.logger.log(`User deleted successfully: ${user.email}`, 'UsersService');
      return user;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      this.logger.error(`Error deleting user ${id}: ${error.message}`, 'UsersService');
      throw error;
    }
  }

  /**
   * Get user profile with all relations
   */
  async getFullProfile(userId: string): Promise<User | null> {
    try {
      return await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          wallet: true,
          specializations: {
            include: {
              category: true,
            },
          },
          clientJobs: {
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
          artisanBids: {
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
          reviews: {
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    } catch (error) {
      this.logger.error(`Error getting full profile for user ${userId}: ${error.message}`, 'UsersService');
      throw error;
    }
  }

  /**
   * Verify user email
   */
  async verifyEmail(userId: string): Promise<User> {
    try {
      return await this.update(userId, {
        verifiedAt: new Date(),
      });
    } catch (error) {
      this.logger.error(`Error verifying email for user ${userId}: ${error.message}`, 'UsersService');
      throw error;
    }
  }

  /**
   * Get users by role
   */
  async findByRole(role: UserRole, params?: {
    skip?: number;
    take?: number;
    include?: Prisma.UserInclude;
  }): Promise<User[]> {
    try {
      return await this.prisma.user.findMany({
        where: { role },
        skip: params?.skip,
        take: params?.take,
        include: params?.include,
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(`Error finding users by role ${role}: ${error.message}`, 'UsersService');
      throw error;
    }
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    try {
      const count = await this.prisma.user.count({
        where: { email },
      });
      return count > 0;
    } catch (error) {
      this.logger.error(`Error checking if email exists ${email}: ${error.message}`, 'UsersService');
      throw error;
    }
  }
}
