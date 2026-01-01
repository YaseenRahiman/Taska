import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Public settings controller - provides access to public system settings
 * without authentication for frontend validation purposes
 */
@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('public')
  @ApiOperation({
    summary: 'Get public system settings',
    description: 'Retrieve public system settings for frontend validation (job budget limits, etc.)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Public settings retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        MIN_JOB_BUDGET: { type: 'number', example: 100 },
        MAX_JOB_BUDGET: { type: 'number', example: 100000 },
        PLATFORM_FEE_PERCENTAGE: { type: 'number', example: 12.5 },
        VAT_PERCENTAGE: { type: 'number', example: 15 },
        JOB_EXPIRY_DAYS: { type: 'number', example: 30 },
        MAX_JOB_IMAGES: { type: 'number', example: 5 },
        MAX_FILE_SIZE_MB: { type: 'number', example: 5 },
        PASSWORD_MIN_LENGTH: { type: 'number', example: 8 },
      },
    },
  })
  async getPublicSettings(): Promise<Record<string, number | string>> {
    const settings = await this.prisma.systemSetting.findMany({
      where: { isPublic: true },
    });

    // Convert settings array to object with appropriate types
    const result: Record<string, number | string> = {};
    for (const setting of settings) {
      // Convert numeric values to numbers
      const numericKeys = [
        'MIN_JOB_BUDGET',
        'MAX_JOB_BUDGET',
        'PLATFORM_FEE_PERCENTAGE',
        'VAT_PERCENTAGE',
        'JOB_EXPIRY_DAYS',
        'MAX_JOB_IMAGES',
        'MAX_FILE_SIZE_MB',
        'PASSWORD_MIN_LENGTH',
      ];

      if (numericKeys.includes(setting.key)) {
        result[setting.key] = parseFloat(setting.value);
      } else {
        result[setting.key] = setting.value;
      }
    }

    return result;
  }

  @Get('job-validation')
  @ApiOperation({
    summary: 'Get job creation validation settings',
    description: 'Get minimum and maximum budget limits for job creation form validation',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Job validation settings retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        minBudget: { type: 'number', example: 100, description: 'Minimum job budget in ZAR' },
        maxBudget: { type: 'number', example: 100000, description: 'Maximum job budget in ZAR' },
        maxImages: { type: 'number', example: 5, description: 'Maximum images per job' },
        maxFileSizeMB: { type: 'number', example: 5, description: 'Maximum file size in MB' },
        expiryDays: { type: 'number', example: 30, description: 'Days until job expires' },
      },
    },
  })
  async getJobValidationSettings(): Promise<{
    minBudget: number;
    maxBudget: number;
    maxImages: number;
    maxFileSizeMB: number;
    expiryDays: number;
  }> {
    const settings = await this.prisma.systemSetting.findMany({
      where: {
        key: {
          in: ['MIN_JOB_BUDGET', 'MAX_JOB_BUDGET', 'MAX_JOB_IMAGES', 'MAX_FILE_SIZE_MB', 'JOB_EXPIRY_DAYS'],
        },
      },
    });

    // Create a map for easy lookup
    const settingsMap = new Map(settings.map((s) => [s.key, s.value]));

    return {
      minBudget: parseInt(settingsMap.get('MIN_JOB_BUDGET') || '100', 10),
      maxBudget: parseInt(settingsMap.get('MAX_JOB_BUDGET') || '100000', 10),
      maxImages: parseInt(settingsMap.get('MAX_JOB_IMAGES') || '5', 10),
      maxFileSizeMB: parseInt(settingsMap.get('MAX_FILE_SIZE_MB') || '5', 10),
      expiryDays: parseInt(settingsMap.get('JOB_EXPIRY_DAYS') || '30', 10),
    };
  }
}
