import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { LoggingService } from '../../../common/logging/logging.service';
import { JobWithRelations } from '../jobs.repository';
import { UserRole, UrgencyLevel } from '@prisma/client';
import { BoostService } from '../../monetization/services/boost.service';

export interface MatchingArtisan {
  id: string;
  profile: {
    firstName?: string;
    lastName?: string;
    latitude?: number;
    longitude?: number;
  } | null;
  specializations: {
    categoryId: string;
    experience: number;
    isVerified: boolean;
  }[];
  rating?: number;
  distance?: number;
  matchScore: number;
  boostPercent?: number;
  isBoosted?: boolean;
  hasFeaturedBadge?: boolean;
}

@Injectable()
export class JobMatchingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggingService,
    @Inject(forwardRef(() => BoostService))
    private readonly boostService: BoostService,
  ) {}

  async findMatchingArtisans(job: JobWithRelations): Promise<MatchingArtisan[]> {
    try {
      // Find artisans with matching specializations
      const artisans = await this.prisma.user.findMany({
        where: {
          role: UserRole.ARTISAN,
          verifiedAt: { not: null },
          specializations: {
            some: {
              categoryId: job.categoryId,
              isVerified: true,
            },
          },
        },
        include: {
          profile: {
            select: {
              firstName: true,
              lastName: true,
              latitude: true,
              longitude: true,
            },
          },
          specializations: {
            where: {
              categoryId: job.categoryId,
            },
            select: {
              categoryId: true,
              experience: true,
              isVerified: true,
            },
          },
          givenReviews: {
            select: {
              rating: true,
            },
          },
        },
      });

      // Calculate match scores, distances, and boost info
      const matchingArtisans: MatchingArtisan[] = await Promise.all(
        artisans.map(async (artisan) => {
          const distance = this.calculateDistance(
            job.latitude,
            job.longitude,
            artisan.profile?.latitude || 0,
            artisan.profile?.longitude || 0,
          );

          const rating = this.calculateAverageRating(
            artisan.givenReviews.map(r => r.rating),
          );

          // Get boost information for this artisan
          const boostPercent = await this.boostService.getBoostPercentage(artisan.id);
          const hasFeaturedBadge = await this.boostService.hasFeaturedBadge(artisan.id);

          const matchScore = this.calculateMatchScore(
            artisan.specializations[0],
            distance,
            rating,
            job.urgency,
            boostPercent, // Pass boost to scoring
          );

          return {
            id: artisan.id,
            profile: artisan.profile,
            specializations: artisan.specializations,
            rating,
            distance,
            matchScore,
            boostPercent,
            isBoosted: boostPercent > 0,
            hasFeaturedBadge,
          };
        }),
      );

      // Sort by: Featured first, then by boosted match score (highest first), then distance
      return matchingArtisans
        .filter(artisan => artisan.distance <= 50) // Within 50km
        .sort((a, b) => {
          // Featured artisans always come first
          if (a.hasFeaturedBadge && !b.hasFeaturedBadge) return -1;
          if (!a.hasFeaturedBadge && b.hasFeaturedBadge) return 1;

          // Then sort by match score (which includes boost)
          if (Math.abs(a.matchScore - b.matchScore) < 0.1) {
            return a.distance - b.distance; // If scores are close, prefer closer
          }
          return b.matchScore - a.matchScore; // Higher score first
        })
        .slice(0, 20); // Top 20 matches

    } catch (error) {
      this.logger.error('Error finding matching artisans', 'JobMatchingService');
      return [];
    }
  }

  async notifyMatchingArtisans(job: JobWithRelations): Promise<void> {
    try {
      const matchingArtisans = await this.findMatchingArtisans(job);

      this.logger.info(`Found ${matchingArtisans.length} matching artisans for job`, 'JobMatchingService');

      // Create notifications for matching artisans
      const notifications = matchingArtisans.map((artisan) => ({
        userId: artisan.id,
        type: 'JOB_POSTED' as const,
        title: 'New Job Match',
        message: `A new ${job.category.name} job "${job.title}" is available in ${job.city}`,
        data: {
          jobId: job.id,
          jobTitle: job.title,
          jobBudget: job.budget,
          jobLocation: `${job.city}, ${job.province}`,
          matchScore: artisan.matchScore,
          distance: artisan.distance,
        },
      }));

      await this.prisma.notification.createMany({
        data: notifications,
      });

      this.logger.info(`Created ${notifications.length} notifications for job matching`, 'JobMatchingService');

    } catch (error) {
      this.logger.error('Error notifying matching artisans', 'JobMatchingService');
    }
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private calculateAverageRating(ratings: number[]): number {
    if (ratings.length === 0) return 0;
    return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  }

  private calculateMatchScore(
    specialization: {
      experience: number;
      isVerified: boolean;
    },
    distance: number,
    rating: number,
    urgency: UrgencyLevel,
    boostPercent: number = 0,
  ): number {
    let score = 0;

    // Experience weight (40%)
    score += Math.min(specialization.experience / 10, 1) * 40;

    // Distance weight (30%) - closer is better
    const distanceScore = Math.max(0, 1 - distance / 50) * 30;
    score += distanceScore;

    // Rating weight (20%)
    score += (rating / 5) * 20;

    // Verification bonus (10%)
    if (specialization.isVerified) {
      score += 10;
    }

    // Urgency bonus
    if (urgency === UrgencyLevel.URGENT) {
      score += 5;
    } else if (urgency === UrgencyLevel.HIGH) {
      score += 2;
    }

    // Apply boost percentage to final score
    // Boost increases the score proportionally (e.g., 25% boost = 1.25x score)
    if (boostPercent > 0) {
      score = score * (1 + boostPercent / 100);
    }

    return Math.round(score * 100) / 100; // Round to 2 decimal places
  }
}
