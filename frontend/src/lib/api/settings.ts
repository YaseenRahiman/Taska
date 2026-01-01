import axios from 'axios';

export interface JobValidationSettings {
  minBudget: number;
  maxBudget: number;
  maxImages: number;
  maxFileSizeMB: number;
  expiryDays: number;
}

export interface PublicSettings {
  MIN_JOB_BUDGET: number;
  MAX_JOB_BUDGET: number;
  PLATFORM_FEE_PERCENTAGE: number;
  VAT_PERCENTAGE: number;
  JOB_EXPIRY_DAYS: number;
  MAX_JOB_IMAGES: number;
  MAX_FILE_SIZE_MB: number;
  PASSWORD_MIN_LENGTH: number;
  [key: string]: number | string;
}

// Default settings to use as fallback
export const DEFAULT_JOB_VALIDATION_SETTINGS: JobValidationSettings = {
  minBudget: 100,
  maxBudget: 100000,
  maxImages: 5,
  maxFileSizeMB: 5,
  expiryDays: 30,
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

/**
 * Fetch job validation settings from the backend
 * These settings are public and don't require authentication
 */
export async function getJobValidationSettings(): Promise<JobValidationSettings> {
  try {
    const response = await axios.get<JobValidationSettings>(
      `${apiUrl}/settings/job-validation`
    );
    return response.data;
  } catch (error) {
    console.error('Failed to fetch job validation settings:', error);
    // Return defaults if API call fails
    return DEFAULT_JOB_VALIDATION_SETTINGS;
  }
}

/**
 * Fetch all public settings from the backend
 * These settings are public and don't require authentication
 */
export async function getPublicSettings(): Promise<PublicSettings> {
  try {
    const response = await axios.get<PublicSettings>(
      `${apiUrl}/settings/public`
    );
    return response.data;
  } catch (error) {
    console.error('Failed to fetch public settings:', error);
    // Return defaults if API call fails
    return {
      MIN_JOB_BUDGET: 100,
      MAX_JOB_BUDGET: 100000,
      PLATFORM_FEE_PERCENTAGE: 12.5,
      VAT_PERCENTAGE: 15,
      JOB_EXPIRY_DAYS: 30,
      MAX_JOB_IMAGES: 5,
      MAX_FILE_SIZE_MB: 5,
      PASSWORD_MIN_LENGTH: 8,
    };
  }
}

// Cache for settings to avoid repeated API calls
let settingsCache: JobValidationSettings | null = null;
let settingsCacheTime: number = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get job validation settings with caching
 */
export async function getCachedJobValidationSettings(): Promise<JobValidationSettings> {
  const now = Date.now();

  if (settingsCache && now - settingsCacheTime < CACHE_DURATION_MS) {
    return settingsCache;
  }

  settingsCache = await getJobValidationSettings();
  settingsCacheTime = now;
  return settingsCache;
}

/**
 * Clear the settings cache (useful when admin updates settings)
 */
export function clearSettingsCache(): void {
  settingsCache = null;
  settingsCacheTime = 0;
}
