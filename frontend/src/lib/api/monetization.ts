import { api } from '@/lib/api';

// Types for monetization system

export interface CreditBalance {
  userId: string;
  balance: number;
  freeBidsRemaining: number;
  freeBoostsRemaining: number;
  lastUpdated: string;
}

export interface CreditBundle {
  id: string;
  name: string;
  credits: number;
  price: number;
  bonusPercentage: number;
  isPopular?: boolean;
  description?: string;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  type: 'PURCHASE' | 'BID_DEBIT' | 'BOOST_DEBIT' | 'VOUCHER_CREDIT' | 'REFUND' | 'AUTO_TOPUP' | 'LEVEL_BONUS';
  amount: number;
  balanceAfter: number;
  description: string;
  referenceId?: string;
  createdAt: string;
}

export interface VoucherRedemptionResult {
  success: boolean;
  creditsAdded: number;
  newBalance: number;
  message: string;
}

export interface AutoTopUpSettings {
  enabled: boolean;
  triggerBalance: number;
  bundleId: string;
  paymentMethodId?: string;
}

export interface ProfileBoost {
  id: string;
  userId: string;
  type: 'STANDARD' | 'SUPER' | 'PREMIUM';
  isActive: boolean;
  startedAt: string;
  expiresAt: string;
  creditsCost: number;
  usedFreeBoost: boolean;
}

export interface BoostOption {
  type: 'STANDARD' | 'SUPER' | 'PREMIUM';
  name: string;
  description: string;
  duration: string;
  creditsCost: number;
  multiplier: number;
  features: string[];
}

export interface ArtisanLevel {
  userId: string;
  level: 'STARTER' | 'RISING' | 'ESTABLISHED' | 'TOP_RATED' | 'ELITE';
  levelNumber: number;
  emoji: string;
  displayName: string;
  currentFeePercentage: number;
  completedJobs: number;
  averageRating: number;
  totalEarnings: number;
  memberSince: string;
  freeBidsPerMonth: number;
  freeBoostsPerMonth: number;
  nextLevel?: {
    level: string;
    displayName: string;
    emoji: string;
    requiredJobs: number;
    requiredRating: number;
    feePercentage: number;
    freeBidsPerMonth: number;
    freeBoostsPerMonth: number;
  };
  progressToNextLevel?: {
    jobsProgress: number;
    ratingProgress: number;
    overallProgress: number;
  };
}

export interface LevelHistory {
  id: string;
  userId: string;
  fromLevel: string;
  toLevel: string;
  achievedAt: string;
  reason: string;
}

// API Functions

/**
 * Get the current credit balance for the authenticated artisan
 */
export async function getCreditBalance(): Promise<CreditBalance> {
  const response = await api.get('/credits/balance');
  return response.data;
}

/**
 * Get available credit bundles for purchase
 */
export async function getCreditBundles(): Promise<CreditBundle[]> {
  const response = await api.get('/credits/bundles');
  return response.data;
}

/**
 * Purchase credits using a specific bundle
 */
export async function purchaseCredits(
  bundleId: string,
  paymentMethod: 'card' | 'eft' | 'wallet'
): Promise<{ success: boolean; transactionId: string; newBalance: number; message: string }> {
  const response = await api.post('/credits/purchase', {
    bundleId,
    paymentMethod,
  });
  return response.data;
}

/**
 * Redeem a voucher code for credits
 */
export async function redeemVoucher(code: string): Promise<VoucherRedemptionResult> {
  const response = await api.post('/credits/voucher/redeem', { code });
  return response.data;
}

/**
 * Get credit transaction history
 */
export async function getCreditTransactions(params?: {
  page?: number;
  limit?: number;
  type?: string;
}): Promise<{ transactions: CreditTransaction[]; total: number; page: number; limit: number }> {
  const response = await api.get('/credits/transactions', { params });
  return response.data;
}

/**
 * Get auto top-up settings
 */
export async function getAutoTopUpSettings(): Promise<AutoTopUpSettings> {
  const response = await api.get('/credits/auto-topup');
  return response.data;
}

/**
 * Update auto top-up settings
 */
export async function updateAutoTopUpSettings(
  settings: Partial<AutoTopUpSettings>
): Promise<AutoTopUpSettings> {
  const response = await api.patch('/credits/auto-topup', settings);
  return response.data;
}

/**
 * Get active boost for the authenticated artisan
 */
export async function getActiveBoost(): Promise<ProfileBoost | null> {
  const response = await api.get('/boosts/active');
  return response.data;
}

/**
 * Get available boost options
 */
export async function getBoostOptions(): Promise<BoostOption[]> {
  const response = await api.get('/boosts/options');
  return response.data;
}

/**
 * Activate a profile boost
 */
export async function activateBoost(
  type: 'STANDARD' | 'SUPER' | 'PREMIUM',
  useFreeBoost: boolean = false
): Promise<{ success: boolean; boost: ProfileBoost; newBalance?: number; message: string }> {
  const response = await api.post('/boosts/activate', { type, useFreeBoost });
  return response.data;
}

/**
 * Get boost history
 */
export async function getBoostHistory(params?: {
  page?: number;
  limit?: number;
}): Promise<{ boosts: ProfileBoost[]; total: number }> {
  const response = await api.get('/boosts/history', { params });
  return response.data;
}

/**
 * Get current artisan level and progress
 */
export async function getArtisanLevel(): Promise<ArtisanLevel> {
  const response = await api.get('/levels/current');
  return response.data;
}

/**
 * Get level history
 */
export async function getLevelHistory(): Promise<LevelHistory[]> {
  const response = await api.get('/levels/history');
  return response.data;
}

/**
 * Get level requirements information
 */
export async function getLevelRequirements(): Promise<{
  levels: Array<{
    level: string;
    displayName: string;
    emoji: string;
    requiredJobs: number;
    requiredRating: number;
    feePercentage: number;
    freeBidsPerMonth: number;
    freeBoostsPerMonth: number;
  }>;
}> {
  const response = await api.get('/levels/requirements');
  return response.data;
}
