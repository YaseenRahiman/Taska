import { Injectable, BadRequestException } from '@nestjs/common';
import { LoggingService } from '../../../common/logging/logging.service';
import * as sharp from 'sharp';
import { promises as fs } from 'fs';
import { join } from 'path';

@Injectable()
export class ImageProcessingService {
  private readonly uploadPath = join(process.cwd(), 'uploads', 'jobs');
  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB
  private readonly allowedFormats = ['jpeg', 'jpg', 'png', 'webp'];

  constructor(private readonly logger: LoggingService) {
    this.ensureUploadDirectory();
  }

  async processJobImages(imageUrls: string[]): Promise<string[]> {
    const processedImages: string[] = [];

    for (const imageUrl of imageUrls) {
      try {
        const processedUrl = await this.processImage(imageUrl);
        processedImages.push(processedUrl);
      } catch (error) {
        this.logger.error('Error processing image', 'ImageProcessingService');
        // Continue with other images, don't fail the entire job creation
      }
    }

    return processedImages;
  }

  async processImage(imageUrl: string): Promise<string> {
    try {
      // For now, return the URL as-is since we're not implementing actual image processing
      // In a real implementation, this would:
      // 1. Download the image from the URL
      // 2. Validate format and size
      // 3. Generate thumbnails
      // 4. Optimize/compress
      // 5. Upload to storage (S3/MinIO)
      // 6. Return the new URL

      this.validateImageUrl(imageUrl);
      return imageUrl;
    } catch (error) {
      this.logger.error('Error processing image', 'ImageProcessingService');
      throw new BadRequestException(`Failed to process image: ${imageUrl}`);
    }
  }

  async generateThumbnail(imagePath: string, width: number = 300, height: number = 300): Promise<string> {
    try {
      const filename = `thumb_${Date.now()}.webp`;
      const outputPath = join(this.uploadPath, 'thumbnails', filename);

      await sharp(imagePath)
        .resize(width, height, { fit: 'cover' })
        .webp({ quality: 80 })
        .toFile(outputPath);

      return `/uploads/jobs/thumbnails/${filename}`;
    } catch (error) {
      this.logger.error('Error generating thumbnail', 'ImageProcessingService');
      throw new BadRequestException('Failed to generate thumbnail');
    }
  }

  async validateAndOptimizeImage(buffer: Buffer, filename: string): Promise<{
    path: string;
    size: number;
    format: string;
  }> {
    try {
      // Validate file size
      if (buffer.length > this.maxFileSize) {
        throw new BadRequestException('Image file too large. Maximum size is 5MB.');
      }

      const image = sharp(buffer);
      const metadata = await image.metadata();

      if (!metadata.format || !this.allowedFormats.includes(metadata.format)) {
        throw new BadRequestException('Invalid image format. Allowed formats: JPEG, PNG, WebP');
      }

      // Generate unique filename
      const timestamp = Date.now();
      const optimizedFilename = `job_${timestamp}.webp`;
      const outputPath = join(this.uploadPath, optimizedFilename);

      // Optimize and save
      await image
        .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(outputPath);

      const stats = await fs.stat(outputPath);

      return {
        path: `/uploads/jobs/${optimizedFilename}`,
        size: stats.size,
        format: 'webp',
      };
    } catch (error) {
      this.logger.error('Error validating and optimizing image', 'ImageProcessingService');
      throw error;
    }
  }

  async deleteImage(imagePath: string): Promise<void> {
    try {
      const fullPath = join(process.cwd(), imagePath);
      await fs.unlink(fullPath);
      this.logger.info(`Image deleted: ${imagePath}`, 'ImageProcessingService');
    } catch (error) {
      this.logger.error('Error deleting image', 'ImageProcessingService');
    }
  }

  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.uploadPath, { recursive: true });
      await fs.mkdir(join(this.uploadPath, 'thumbnails'), { recursive: true });
    } catch (error) {
      this.logger.error('Error creating upload directories', error);
    }
  }

  private validateImageUrl(url: string): void {
    try {
      const parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new BadRequestException('Invalid image URL protocol');
      }
    } catch (error) {
      throw new BadRequestException('Invalid image URL format');
    }
  }
}
