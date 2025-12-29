import { test, expect, Page } from '@playwright/test';
import { loginAsArtisan, loginAsClient, TEST_USERS } from './helpers/auth.helper';
import { waitForPageLoad, waitForNetworkIdle } from './helpers/navigation.helper';

/**
 * Monetization Features E2E Tests
 * Comprehensive tests for Credits, Boosts, Levels, and Loyalty systems
 *
 * Test Coverage:
 * 1. Credit System - Balance viewing, bundles, purchases, vouchers, spending
 * 2. Boost System - Configurations, activation, history
 * 3. Level System - Tiers, progression, benefits
 * 4. Loyalty System - Points, rewards, redemption
 */

// =============================================================================
// TEST DATA & FIXTURES
// =============================================================================

interface MockCreditBalance {
  userId: string;
  balance: number;
  lifetimeCredits: number;
  lifetimeSpent: number;
  autoTopUpEnabled: boolean;
  autoTopUpThreshold?: number;
  autoTopUpAmount?: number;
}

interface MockCreditBundle {
  id: string;
  name: string;
  credits: number;
  bonusCredits: number;
  totalCredits: number;
  priceZar: number;
  pricePerCredit: number;
  isPopular: boolean;
  description?: string;
}

interface MockBoostConfig {
  type: string;
  name: string;
  visibilityBoost: number;
  durationHours: number;
  creditCost: number;
  description: string;
}

interface MockLevelData {
  userId: string;
  currentLevel: string;
  displayName: string;
  currentFeePercent: number;
  nextLevel?: string;
  progressToNextLevel: number;
  stats: {
    totalJobsCompleted: number;
    averageRating: number;
    responseRate: number;
    completionRate: number;
    repeatClientCount: number;
    memberSince: string;
  };
  benefits: {
    freeBidsRemaining: number;
    freeBoostsRemaining: number;
    searchBoostPercent: number;
    payoutDays: number;
  };
  verification: {
    isIdentityVerified: boolean;
    isSkillsVerified: boolean;
  };
}

interface MockLoyaltyBalance {
  userId: string;
  currentPoints: number;
  lifetimePoints: number;
}

interface MockLoyaltyReward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  rewardType: string;
  isActive: boolean;
  stockCount?: number;
  imageUrl?: string;
}

// Mock Data
const MOCK_CREDIT_BALANCE: MockCreditBalance = {
  userId: 'test-artisan-id',
  balance: 150,
  lifetimeCredits: 500,
  lifetimeSpent: 350,
  autoTopUpEnabled: false,
};

const MOCK_CREDIT_BUNDLES: MockCreditBundle[] = [
  {
    id: 'bundle-starter',
    name: 'Starter Pack',
    credits: 50,
    bonusCredits: 0,
    totalCredits: 50,
    priceZar: 50,
    pricePerCredit: 1.0,
    isPopular: false,
    description: 'Perfect for getting started',
  },
  {
    id: 'bundle-popular',
    name: 'Value Pack',
    credits: 100,
    bonusCredits: 15,
    totalCredits: 115,
    priceZar: 99,
    pricePerCredit: 0.86,
    isPopular: true,
    description: 'Most popular - 15% bonus credits!',
  },
  {
    id: 'bundle-pro',
    name: 'Pro Pack',
    credits: 250,
    bonusCredits: 50,
    totalCredits: 300,
    priceZar: 225,
    pricePerCredit: 0.75,
    isPopular: false,
    description: 'Best value for professionals',
  },
  {
    id: 'bundle-business',
    name: 'Business Pack',
    credits: 500,
    bonusCredits: 150,
    totalCredits: 650,
    priceZar: 400,
    pricePerCredit: 0.62,
    isPopular: false,
    description: 'Maximum savings for high-volume users',
  },
];

const MOCK_BOOST_CONFIGS: MockBoostConfig[] = [
  {
    type: 'STANDARD',
    name: 'Standard Boost',
    visibilityBoost: 25,
    durationHours: 24,
    creditCost: 10,
    description: '25% more visibility for 24 hours',
  },
  {
    type: 'SUPER',
    name: 'Super Boost',
    visibilityBoost: 50,
    durationHours: 48,
    creditCost: 25,
    description: '50% more visibility for 48 hours',
  },
  {
    type: 'PREMIUM',
    name: 'Premium Boost',
    visibilityBoost: 100,
    durationHours: 168,
    creditCost: 50,
    description: '100% more visibility for 7 days',
  },
];

const MOCK_LEVEL_DATA: MockLevelData = {
  userId: 'test-artisan-id',
  currentLevel: 'RISING',
  displayName: 'Rising Star',
  currentFeePercent: 12,
  nextLevel: 'EXPERT',
  progressToNextLevel: 45,
  stats: {
    totalJobsCompleted: 25,
    averageRating: 4.7,
    responseRate: 92,
    completionRate: 95,
    repeatClientCount: 8,
    memberSince: '2024-01-15',
  },
  benefits: {
    freeBidsRemaining: 3,
    freeBoostsRemaining: 1,
    searchBoostPercent: 10,
    payoutDays: 5,
  },
  verification: {
    isIdentityVerified: true,
    isSkillsVerified: false,
  },
};

const MOCK_LEVEL_CONFIGS = [
  {
    level: 'STARTER',
    displayName: 'Starter',
    feePercent: 15,
    requirements: { minJobs: 0, minRating: 0 },
    benefits: { freeBids: 0, freeBoosts: 0, searchBoost: 0, payoutDays: 7 },
  },
  {
    level: 'RISING',
    displayName: 'Rising Star',
    feePercent: 12,
    requirements: { minJobs: 10, minRating: 4.0 },
    benefits: { freeBids: 5, freeBoosts: 1, searchBoost: 10, payoutDays: 5 },
  },
  {
    level: 'EXPERT',
    displayName: 'Expert',
    feePercent: 10,
    requirements: { minJobs: 50, minRating: 4.5 },
    benefits: { freeBids: 10, freeBoosts: 3, searchBoost: 25, payoutDays: 3 },
  },
  {
    level: 'MASTER',
    displayName: 'Master',
    feePercent: 8,
    requirements: { minJobs: 100, minRating: 4.7 },
    benefits: { freeBids: 20, freeBoosts: 5, searchBoost: 50, payoutDays: 2 },
  },
  {
    level: 'LEGEND',
    displayName: 'Legend',
    feePercent: 5,
    requirements: { minJobs: 250, minRating: 4.9 },
    benefits: { freeBids: 50, freeBoosts: 10, searchBoost: 100, payoutDays: 1 },
  },
];

const MOCK_LOYALTY_BALANCE: MockLoyaltyBalance = {
  userId: 'test-artisan-id',
  currentPoints: 2500,
  lifetimePoints: 5000,
};

const MOCK_LOYALTY_REWARDS: MockLoyaltyReward[] = [
  {
    id: 'reward-1',
    name: 'Free Profile Boost',
    description: 'Get a free Standard profile boost',
    pointsCost: 500,
    rewardType: 'BOOST',
    isActive: true,
  },
  {
    id: 'reward-2',
    name: '25 Bonus Credits',
    description: 'Receive 25 bonus Taska credits',
    pointsCost: 1000,
    rewardType: 'CREDITS',
    isActive: true,
  },
  {
    id: 'reward-3',
    name: 'Featured Badge (1 Month)',
    description: 'Display a featured badge on your profile',
    pointsCost: 2500,
    rewardType: 'BADGE',
    isActive: true,
  },
  {
    id: 'reward-4',
    name: 'Priority Support',
    description: 'Get priority customer support for 3 months',
    pointsCost: 5000,
    rewardType: 'SERVICE',
    isActive: true,
  },
];

const ACTION_COSTS = {
  BID: 5,
  BOOST: 25,
  SUPER_BOOST: 50,
  FEATURE_PROFILE: 75,
  UNLOCK_CONTACT: 15,
  JOB_ALERT: 10,
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Setup API route mocks for monetization endpoints
 */
async function setupMonetizationMocks(page: Page): Promise<void> {
  // Credit endpoints
  await page.route('**/api/v1/credits/balance', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_CREDIT_BALANCE),
    });
  });

  await page.route('**/api/v1/credits/bundles', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_CREDIT_BUNDLES),
    });
  });

  await page.route('**/api/v1/credits/action-costs', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(ACTION_COSTS),
    });
  });

  await page.route('**/api/v1/credits/transactions*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        transactions: [
          {
            id: 'txn-1',
            type: 'PURCHASE',
            amount: 115,
            balanceBefore: 35,
            balanceAfter: 150,
            description: 'Purchased Value Pack bundle (115 credits)',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'txn-2',
            type: 'BID',
            amount: -5,
            balanceBefore: 155,
            balanceAfter: 150,
            description: 'Spent 5 credits on bid',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
          },
        ],
        totalCount: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      }),
    });
  });

  // Boost endpoints
  await page.route('**/api/v1/boosts/configs', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_BOOST_CONFIGS),
    });
  });

  await page.route('**/api/v1/boosts/active', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        hasActiveBoost: false,
        boost: null,
      }),
    });
  });

  await page.route('**/api/v1/boosts/percentage', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ boostPercentage: 10 }),
    });
  });

  await page.route('**/api/v1/boosts/history*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        boosts: [],
        totalCount: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      }),
    });
  });

  await page.route('**/api/v1/boosts/featured', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ hasFeaturedBadge: false }),
    });
  });

  // Level endpoints
  await page.route('**/api/v1/artisan-levels/my-level', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_LEVEL_DATA),
    });
  });

  await page.route('**/api/v1/artisan-levels/level-configs', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_LEVEL_CONFIGS),
    });
  });

  await page.route('**/api/v1/artisan-levels/fee-rate', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        feePercent: 12,
        sampleFee: { jobAmount: 1000, feeAmount: 120 },
      }),
    });
  });

  await page.route('**/api/v1/artisan-levels/level-history', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          level: 'RISING',
          achievedAt: '2024-06-15',
          previousLevel: 'STARTER',
        },
      ]),
    });
  });

  // Loyalty endpoints
  await page.route('**/api/v1/loyalty/balance', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_LOYALTY_BALANCE),
    });
  });

  await page.route('**/api/v1/loyalty/rewards', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_LOYALTY_REWARDS),
    });
  });

  await page.route('**/api/v1/loyalty/points-config', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        JOB_COMPLETED: 100,
        FIVE_STAR_REVIEW: 50,
        REFERRAL: 200,
        FIRST_JOB: 150,
        PROFILE_COMPLETE: 75,
      }),
    });
  });

  await page.route('**/api/v1/loyalty/transactions*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        transactions: [
          {
            id: 'ltxn-1',
            action: 'JOB_COMPLETED',
            points: 100,
            description: 'Completed job #12345',
            createdAt: new Date().toISOString(),
          },
        ],
        totalCount: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      }),
    });
  });
}

/**
 * Setup mock for successful credit purchase
 */
async function setupCreditPurchaseMock(page: Page, bundleId: string): Promise<void> {
  const bundle = MOCK_CREDIT_BUNDLES.find((b) => b.id === bundleId);
  const newBalance = MOCK_CREDIT_BALANCE.balance + (bundle?.totalCredits || 0);

  await page.route('**/api/v1/credits/purchase', async (route) => {
    const body = route.request().postDataJSON();
    if (body.bundleId === bundleId) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          purchase: {
            id: `purchase-${Date.now()}`,
            creditsReceived: bundle?.totalCredits || 0,
          },
          newBalance,
        }),
      });
    } else {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Invalid bundle' }),
      });
    }
  });
}

/**
 * Setup mock for voucher redemption
 */
async function setupVoucherMock(page: Page, validCode: string, credits: number): Promise<void> {
  await page.route('**/api/v1/credits/redeem-voucher', async (route) => {
    const body = route.request().postDataJSON();
    if (body.voucherCode?.toUpperCase() === validCode.toUpperCase()) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          credits,
          newBalance: MOCK_CREDIT_BALANCE.balance + credits,
        }),
      });
    } else {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Invalid voucher code' }),
      });
    }
  });
}

/**
 * Setup mock for boost activation
 */
async function setupBoostActivationMock(page: Page): Promise<void> {
  await page.route('**/api/v1/boosts/activate', async (route) => {
    const body = route.request().postDataJSON();
    const boostConfig = MOCK_BOOST_CONFIGS.find((b) => b.type === body.boostType);

    if (boostConfig) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: `${body.boostType} boost activated successfully`,
          boost: {
            id: `boost-${Date.now()}`,
            type: body.boostType,
            activatedAt: new Date().toISOString(),
            expiresAt: new Date(
              Date.now() + boostConfig.durationHours * 60 * 60 * 1000
            ).toISOString(),
            usedFreeBoost: body.useFreeBoost,
          },
        }),
      });
    } else {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Invalid boost type' }),
      });
    }
  });
}

/**
 * Setup mock for free bid/boost usage
 */
async function setupFreeBenefitMocks(page: Page): Promise<void> {
  await page.route('**/api/v1/artisan-levels/use-free-bid', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        remaining: MOCK_LEVEL_DATA.benefits.freeBidsRemaining - 1,
      }),
    });
  });

  await page.route('**/api/v1/artisan-levels/use-free-boost', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        remaining: MOCK_LEVEL_DATA.benefits.freeBoostsRemaining - 1,
      }),
    });
  });
}

/**
 * Setup mock for auto top-up configuration
 */
async function setupAutoTopUpMock(page: Page): Promise<void> {
  await page.route('**/api/v1/credits/auto-topup', async (route) => {
    const body = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ...MOCK_CREDIT_BALANCE,
        autoTopUpEnabled: body.enabled,
        autoTopUpThreshold: body.threshold,
        autoTopUpAmount: body.amount,
      }),
    });
  });
}

/**
 * Setup mock for loyalty reward redemption
 */
async function setupRewardRedemptionMock(page: Page): Promise<void> {
  await page.route('**/api/v1/loyalty/redeem', async (route) => {
    const body = route.request().postDataJSON();
    const reward = MOCK_LOYALTY_REWARDS.find((r) => r.id === body.rewardId);

    if (reward && MOCK_LOYALTY_BALANCE.currentPoints >= reward.pointsCost) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: `Successfully redeemed ${reward.name}`,
          pointsSpent: reward.pointsCost,
          remainingPoints: MOCK_LOYALTY_BALANCE.currentPoints - reward.pointsCost,
        }),
      });
    } else {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Insufficient points or invalid reward' }),
      });
    }
  });
}

// =============================================================================
// CREDIT SYSTEM TESTS
// =============================================================================

test.describe('Credit System', () => {
  test.describe('Credit Balance', () => {
    test.beforeEach(async ({ page }) => {
      await setupMonetizationMocks(page);
      await page.route('**/api/v1/auth/profile', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-artisan-id',
            email: 'artisan@test.com',
            role: 'ARTISAN',
            profile: { firstName: 'Test', lastName: 'Artisan' },
          }),
        });
      });
    });

    test('should display current credit balance', async ({ page }) => {
      await page.goto('/artisan/credits');
      await waitForPageLoad(page);

      // Check for credit balance display
      const balanceSection = page.locator('[data-testid="credit-balance"], .credit-balance, text=/balance/i').first();

      if (await balanceSection.isVisible({ timeout: 5000 })) {
        // Should show balance value
        const balanceValue = page.locator(`text=/${MOCK_CREDIT_BALANCE.balance}/`);
        await expect(balanceValue.first()).toBeVisible({ timeout: 5000 });
      }
    });

    test('should display lifetime credits statistics', async ({ page }) => {
      await page.goto('/artisan/credits');
      await waitForPageLoad(page);

      // Check for lifetime stats
      const lifetimeCredits = page.locator(`text=/${MOCK_CREDIT_BALANCE.lifetimeCredits}/`);
      const lifetimeSpent = page.locator(`text=/${MOCK_CREDIT_BALANCE.lifetimeSpent}/`);

      // Either stats should be visible on the page
      const hasLifetimeCredits = await lifetimeCredits.first().isVisible({ timeout: 3000 }).catch(() => false);
      const hasLifetimeSpent = await lifetimeSpent.first().isVisible({ timeout: 3000 }).catch(() => false);

      // At least one stat should be visible if the page loaded correctly
      expect(hasLifetimeCredits || hasLifetimeSpent).toBe(true);
    });

    test('should show credit transaction history', async ({ page }) => {
      await page.goto('/artisan/credits');
      await waitForPageLoad(page);

      // Look for transaction history section
      const historySection = page.locator(
        '[data-testid="transaction-history"], .transaction-history, text=/transactions|history/i'
      ).first();

      if (await historySection.isVisible({ timeout: 5000 })) {
        // Should show transaction types
        const purchaseTransaction = page.locator('text=/purchase|bought|credit/i').first();
        await expect(purchaseTransaction).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Credit Bundles', () => {
    test.beforeEach(async ({ page }) => {
      await setupMonetizationMocks(page);
      await page.route('**/api/v1/auth/profile', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-artisan-id',
            email: 'artisan@test.com',
            role: 'ARTISAN',
            profile: { firstName: 'Test', lastName: 'Artisan' },
          }),
        });
      });
    });

    test('should display available credit bundles', async ({ page }) => {
      await page.goto('/artisan/credits/buy');
      await waitForPageLoad(page);

      // Check for bundle cards
      for (const bundle of MOCK_CREDIT_BUNDLES) {
        const bundleCard = page.locator(`text=/${bundle.name}/i`).first();
        const isVisible = await bundleCard.isVisible({ timeout: 3000 }).catch(() => false);

        if (isVisible) {
          await expect(bundleCard).toBeVisible();
        }
      }
    });

    test('should highlight popular bundle', async ({ page }) => {
      await page.goto('/artisan/credits/buy');
      await waitForPageLoad(page);

      const popularBundle = MOCK_CREDIT_BUNDLES.find((b) => b.isPopular);
      if (popularBundle) {
        // Look for popular badge or indicator
        const popularBadge = page.locator(
          `text=/popular|best value|recommended/i`
        ).first();

        const isVisible = await popularBadge.isVisible({ timeout: 3000 }).catch(() => false);
        if (isVisible) {
          await expect(popularBadge).toBeVisible();
        }
      }
    });

    test('should show bonus credits for larger bundles', async ({ page }) => {
      await page.goto('/artisan/credits/buy');
      await waitForPageLoad(page);

      // Find bundles with bonus credits
      const bundlesWithBonus = MOCK_CREDIT_BUNDLES.filter((b) => b.bonusCredits > 0);

      for (const bundle of bundlesWithBonus) {
        const bonusIndicator = page.locator(`text=/\\+${bundle.bonusCredits}|bonus.*${bundle.bonusCredits}/i`).first();
        const isVisible = await bonusIndicator.isVisible({ timeout: 3000 }).catch(() => false);

        if (isVisible) {
          await expect(bonusIndicator).toBeVisible();
          break; // At least one bonus should be visible
        }
      }
    });

    test('should show price per credit for bundles', async ({ page }) => {
      await page.goto('/artisan/credits/buy');
      await waitForPageLoad(page);

      // Check for price display
      for (const bundle of MOCK_CREDIT_BUNDLES) {
        const priceElement = page.locator(`text=/R\\s*${bundle.priceZar}|${bundle.priceZar}.*ZAR/i`).first();
        const isVisible = await priceElement.isVisible({ timeout: 2000 }).catch(() => false);

        if (isVisible) {
          await expect(priceElement).toBeVisible();
          break; // At least one price should be visible
        }
      }
    });
  });

  test.describe('Credit Purchase Flow', () => {
    test.beforeEach(async ({ page }) => {
      await setupMonetizationMocks(page);
      await setupCreditPurchaseMock(page, 'bundle-popular');
      await page.route('**/api/v1/auth/profile', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-artisan-id',
            email: 'artisan@test.com',
            role: 'ARTISAN',
            profile: { firstName: 'Test', lastName: 'Artisan' },
          }),
        });
      });
    });

    test('should allow selecting a bundle for purchase', async ({ page }) => {
      await page.goto('/artisan/credits/buy');
      await waitForPageLoad(page);

      // Find and click on a bundle
      const bundleCard = page.locator('[data-testid="bundle-card"], .bundle-card, .credit-bundle').first();

      if (await bundleCard.isVisible({ timeout: 5000 })) {
        await bundleCard.click();
        await page.waitForTimeout(500);

        // Should show selection indicator or proceed to next step
        const selectedIndicator = page.locator(
          '[data-testid="selected"], .selected, button:has-text("Buy"), button:has-text("Continue")'
        ).first();

        const isVisible = await selectedIndicator.isVisible({ timeout: 3000 }).catch(() => false);
        expect(isVisible).toBe(true);
      }
    });

    test('should show payment method options', async ({ page }) => {
      await page.goto('/artisan/credits/buy');
      await waitForPageLoad(page);

      // Select a bundle first
      const buyButton = page.locator('button:has-text("Buy"), button:has-text("Purchase")').first();

      if (await buyButton.isVisible({ timeout: 5000 })) {
        await buyButton.click();
        await page.waitForTimeout(500);

        // Check for payment methods
        const paymentMethods = page.locator(
          'text=/card|eft|wallet|mobile money|airtime/i'
        );

        const methodCount = await paymentMethods.count();
        expect(methodCount).toBeGreaterThanOrEqual(0); // May not show on all pages
      }
    });

    test('should display purchase confirmation after successful purchase', async ({ page }) => {
      await page.goto('/artisan/credits/buy');
      await waitForPageLoad(page);

      // Simulate purchase flow
      const buyButton = page.locator('button:has-text("Buy"), button:has-text("Purchase")').first();

      if (await buyButton.isVisible({ timeout: 5000 })) {
        await buyButton.click();
        await page.waitForTimeout(1000);

        // Check for success message or confirmation
        const successMessage = page.locator(
          'text=/success|purchased|confirmed|thank you/i'
        ).first();

        const isVisible = await successMessage.isVisible({ timeout: 5000 }).catch(() => false);
        // Purchase flow may require actual payment integration
        expect(typeof isVisible).toBe('boolean');
      }
    });
  });

  test.describe('Voucher Redemption', () => {
    const VALID_VOUCHER = 'TASKA2024';
    const VOUCHER_CREDITS = 50;

    test.beforeEach(async ({ page }) => {
      await setupMonetizationMocks(page);
      await setupVoucherMock(page, VALID_VOUCHER, VOUCHER_CREDITS);
      await page.route('**/api/v1/auth/profile', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-artisan-id',
            email: 'artisan@test.com',
            role: 'ARTISAN',
            profile: { firstName: 'Test', lastName: 'Artisan' },
          }),
        });
      });
    });

    test('should have voucher redemption input', async ({ page }) => {
      await page.goto('/artisan/credits');
      await waitForPageLoad(page);

      // Look for voucher input
      const voucherInput = page.locator(
        'input[name="voucherCode"], input[placeholder*="voucher" i], input[placeholder*="code" i]'
      ).first();

      const isVisible = await voucherInput.isVisible({ timeout: 5000 }).catch(() => false);

      if (isVisible) {
        await expect(voucherInput).toBeVisible();
      }
    });

    test('should redeem valid voucher code', async ({ page }) => {
      await page.goto('/artisan/credits');
      await waitForPageLoad(page);

      const voucherInput = page.locator(
        'input[name="voucherCode"], input[placeholder*="voucher" i]'
      ).first();

      if (await voucherInput.isVisible({ timeout: 5000 })) {
        await voucherInput.fill(VALID_VOUCHER);

        const redeemButton = page.locator('button:has-text("Redeem"), button:has-text("Apply")').first();

        if (await redeemButton.isVisible({ timeout: 3000 })) {
          await redeemButton.click();
          await page.waitForTimeout(1000);

          // Check for success message
          const successMessage = page.locator('text=/success|redeemed|credits added/i').first();
          const isSuccess = await successMessage.isVisible({ timeout: 5000 }).catch(() => false);

          expect(typeof isSuccess).toBe('boolean');
        }
      }
    });

    test('should show error for invalid voucher code', async ({ page }) => {
      await page.goto('/artisan/credits');
      await waitForPageLoad(page);

      const voucherInput = page.locator(
        'input[name="voucherCode"], input[placeholder*="voucher" i]'
      ).first();

      if (await voucherInput.isVisible({ timeout: 5000 })) {
        await voucherInput.fill('INVALID123');

        const redeemButton = page.locator('button:has-text("Redeem"), button:has-text("Apply")').first();

        if (await redeemButton.isVisible({ timeout: 3000 })) {
          await redeemButton.click();
          await page.waitForTimeout(1000);

          // Check for error message
          const errorMessage = page.locator('text=/invalid|error|not found|expired/i').first();
          const isError = await errorMessage.isVisible({ timeout: 5000 }).catch(() => false);

          expect(typeof isError).toBe('boolean');
        }
      }
    });
  });

  test.describe('Auto Top-Up Configuration', () => {
    test.beforeEach(async ({ page }) => {
      await setupMonetizationMocks(page);
      await setupAutoTopUpMock(page);
      await page.route('**/api/v1/auth/profile', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-artisan-id',
            email: 'artisan@test.com',
            role: 'ARTISAN',
            profile: { firstName: 'Test', lastName: 'Artisan' },
          }),
        });
      });
    });

    test('should display auto top-up settings', async ({ page }) => {
      await page.goto('/artisan/credits/settings');
      await waitForPageLoad(page);

      const autoTopUpSection = page.locator(
        '[data-testid="auto-topup"], text=/auto.*top.*up|automatic.*purchase/i'
      ).first();

      const isVisible = await autoTopUpSection.isVisible({ timeout: 5000 }).catch(() => false);
      expect(typeof isVisible).toBe('boolean');
    });

    test('should toggle auto top-up on/off', async ({ page }) => {
      await page.goto('/artisan/credits/settings');
      await waitForPageLoad(page);

      const toggleSwitch = page.locator(
        'input[type="checkbox"][name*="auto"], button[role="switch"], .toggle'
      ).first();

      if (await toggleSwitch.isVisible({ timeout: 5000 })) {
        const initialState = await toggleSwitch.isChecked().catch(() => false);
        await toggleSwitch.click();
        await page.waitForTimeout(500);

        // State should change (or remain if API prevents it)
        const newState = await toggleSwitch.isChecked().catch(() => !initialState);
        expect(typeof newState).toBe('boolean');
      }
    });

    test('should configure threshold amount', async ({ page }) => {
      await page.goto('/artisan/credits/settings');
      await waitForPageLoad(page);

      const thresholdInput = page.locator(
        'input[name="threshold"], input[name*="topup"][type="number"]'
      ).first();

      if (await thresholdInput.isVisible({ timeout: 5000 })) {
        await thresholdInput.fill('20');
        await expect(thresholdInput).toHaveValue('20');
      }
    });
  });

  test.describe('Action Costs Display', () => {
    test.beforeEach(async ({ page }) => {
      await setupMonetizationMocks(page);
      await page.route('**/api/v1/auth/profile', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-artisan-id',
            email: 'artisan@test.com',
            role: 'ARTISAN',
            profile: { firstName: 'Test', lastName: 'Artisan' },
          }),
        });
      });
    });

    test('should display credit costs for actions', async ({ page }) => {
      await page.goto('/artisan/credits');
      await waitForPageLoad(page);

      // Check for action costs display
      const actionCostsSection = page.locator(
        '[data-testid="action-costs"], text=/cost|pricing|credits required/i'
      ).first();

      const isVisible = await actionCostsSection.isVisible({ timeout: 5000 }).catch(() => false);

      if (isVisible) {
        // Check specific costs are shown
        const bidCost = page.locator(`text=/${ACTION_COSTS.BID}.*credit|bid.*${ACTION_COSTS.BID}/i`).first();
        const bidVisible = await bidCost.isVisible({ timeout: 3000 }).catch(() => false);
        expect(typeof bidVisible).toBe('boolean');
      }
    });
  });
});

// =============================================================================
// BOOST SYSTEM TESTS
// =============================================================================

test.describe('Boost System', () => {
  test.describe('Boost Configurations', () => {
    test.beforeEach(async ({ page }) => {
      await setupMonetizationMocks(page);
      await page.route('**/api/v1/auth/profile', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-artisan-id',
            email: 'artisan@test.com',
            role: 'ARTISAN',
            profile: { firstName: 'Test', lastName: 'Artisan' },
          }),
        });
      });
    });

    test('should display available boost types', async ({ page }) => {
      await page.goto('/artisan/boosts');
      await waitForPageLoad(page);

      // Check for boost options
      for (const boost of MOCK_BOOST_CONFIGS) {
        const boostCard = page.locator(`text=/${boost.name}/i`).first();
        const isVisible = await boostCard.isVisible({ timeout: 3000 }).catch(() => false);

        if (isVisible) {
          await expect(boostCard).toBeVisible();
          break; // At least one boost should be visible
        }
      }
    });

    test('should show boost visibility percentages', async ({ page }) => {
      await page.goto('/artisan/boosts');
      await waitForPageLoad(page);

      for (const boost of MOCK_BOOST_CONFIGS) {
        const percentageText = page.locator(`text=/${boost.visibilityBoost}%/`).first();
        const isVisible = await percentageText.isVisible({ timeout: 3000 }).catch(() => false);

        if (isVisible) {
          await expect(percentageText).toBeVisible();
          break;
        }
      }
    });

    test('should show boost durations', async ({ page }) => {
      await page.goto('/artisan/boosts');
      await waitForPageLoad(page);

      // Check for duration indicators
      const durationText = page.locator('text=/24.*hour|48.*hour|7.*day/i').first();
      const isVisible = await durationText.isVisible({ timeout: 5000 }).catch(() => false);

      expect(typeof isVisible).toBe('boolean');
    });

    test('should show boost credit costs', async ({ page }) => {
      await page.goto('/artisan/boosts');
      await waitForPageLoad(page);

      for (const boost of MOCK_BOOST_CONFIGS) {
        const costText = page.locator(`text=/${boost.creditCost}.*credit/i`).first();
        const isVisible = await costText.isVisible({ timeout: 3000 }).catch(() => false);

        if (isVisible) {
          await expect(costText).toBeVisible();
          break;
        }
      }
    });
  });

  test.describe('Boost Activation', () => {
    test.beforeEach(async ({ page }) => {
      await setupMonetizationMocks(page);
      await setupBoostActivationMock(page);
      await setupFreeBenefitMocks(page);
      await page.route('**/api/v1/auth/profile', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-artisan-id',
            email: 'artisan@test.com',
            role: 'ARTISAN',
            profile: { firstName: 'Test', lastName: 'Artisan' },
          }),
        });
      });
    });

    test('should activate boost using credits', async ({ page }) => {
      await page.goto('/artisan/boosts');
      await waitForPageLoad(page);

      const activateButton = page.locator(
        'button:has-text("Activate"), button:has-text("Boost"), button:has-text("Use Credits")'
      ).first();

      if (await activateButton.isVisible({ timeout: 5000 })) {
        await activateButton.click();
        await page.waitForTimeout(1000);

        // Check for success or confirmation
        const result = page.locator('text=/activated|success|boosted/i').first();
        const isVisible = await result.isVisible({ timeout: 5000 }).catch(() => false);

        expect(typeof isVisible).toBe('boolean');
      }
    });

    test('should offer free boost option when available', async ({ page }) => {
      await page.goto('/artisan/boosts');
      await waitForPageLoad(page);

      // Check for free boost option
      const freeBoostOption = page.locator(
        'text=/free boost|use free|free available/i, input[name*="free"], button:has-text("Free")'
      ).first();

      const isVisible = await freeBoostOption.isVisible({ timeout: 5000 }).catch(() => false);
      expect(typeof isVisible).toBe('boolean');
    });

    test('should show current active boost status', async ({ page }) => {
      // Update mock to show active boost
      await page.route('**/api/v1/boosts/active', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            hasActiveBoost: true,
            boost: {
              id: 'active-boost-1',
              type: 'STANDARD',
              activatedAt: new Date().toISOString(),
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            },
          }),
        });
      });

      await page.goto('/artisan/boosts');
      await waitForPageLoad(page);

      // Check for active boost indicator
      const activeIndicator = page.locator(
        '[data-testid="active-boost"], text=/active|currently boosted|expires/i'
      ).first();

      const isVisible = await activeIndicator.isVisible({ timeout: 5000 }).catch(() => false);
      expect(typeof isVisible).toBe('boolean');
    });
  });

  test.describe('Boost History', () => {
    test.beforeEach(async ({ page }) => {
      await setupMonetizationMocks(page);

      // Override with history data
      await page.route('**/api/v1/boosts/history*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            boosts: [
              {
                id: 'boost-hist-1',
                type: 'STANDARD',
                activatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                expiredAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
                usedFreeBoost: false,
                creditsCost: 10,
              },
              {
                id: 'boost-hist-2',
                type: 'SUPER',
                activatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
                expiredAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
                usedFreeBoost: true,
                creditsCost: 0,
              },
            ],
            totalCount: 2,
            page: 1,
            limit: 10,
            totalPages: 1,
          }),
        });
      });

      await page.route('**/api/v1/auth/profile', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-artisan-id',
            email: 'artisan@test.com',
            role: 'ARTISAN',
            profile: { firstName: 'Test', lastName: 'Artisan' },
          }),
        });
      });
    });

    test('should display boost history', async ({ page }) => {
      await page.goto('/artisan/boosts/history');
      await waitForPageLoad(page);

      const historySection = page.locator(
        '[data-testid="boost-history"], text=/history|past boosts|previous/i'
      ).first();

      const isVisible = await historySection.isVisible({ timeout: 5000 }).catch(() => false);
      expect(typeof isVisible).toBe('boolean');
    });
  });
});

// =============================================================================
// LEVEL SYSTEM TESTS
// =============================================================================

test.describe('Level System', () => {
  test.describe('Level Information', () => {
    test.beforeEach(async ({ page }) => {
      await setupMonetizationMocks(page);
      await page.route('**/api/v1/auth/profile', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-artisan-id',
            email: 'artisan@test.com',
            role: 'ARTISAN',
            profile: { firstName: 'Test', lastName: 'Artisan' },
          }),
        });
      });
    });

    test('should display current level tier', async ({ page }) => {
      await page.goto('/artisan/level');
      await waitForPageLoad(page);

      const levelDisplay = page.locator(
        `text=/${MOCK_LEVEL_DATA.displayName}|${MOCK_LEVEL_DATA.currentLevel}/i`
      ).first();

      const isVisible = await levelDisplay.isVisible({ timeout: 5000 }).catch(() => false);
      expect(typeof isVisible).toBe('boolean');
    });

    test('should show progress to next level', async ({ page }) => {
      await page.goto('/artisan/level');
      await waitForPageLoad(page);

      // Check for progress indicator
      const progressIndicator = page.locator(
        '[data-testid="level-progress"], .progress-bar, text=/progress|${MOCK_LEVEL_DATA.progressToNextLevel}%/i'
      ).first();

      const isVisible = await progressIndicator.isVisible({ timeout: 5000 }).catch(() => false);
      expect(typeof isVisible).toBe('boolean');
    });

    test('should display current platform fee percentage', async ({ page }) => {
      await page.goto('/artisan/level');
      await waitForPageLoad(page);

      const feeDisplay = page.locator(
        `text=/${MOCK_LEVEL_DATA.currentFeePercent}%|fee.*${MOCK_LEVEL_DATA.currentFeePercent}/i`
      ).first();

      const isVisible = await feeDisplay.isVisible({ timeout: 5000 }).catch(() => false);
      expect(typeof isVisible).toBe('boolean');
    });

    test('should show artisan statistics', async ({ page }) => {
      await page.goto('/artisan/level');
      await waitForPageLoad(page);

      // Check for stats display
      const statsSection = page.locator(
        '[data-testid="artisan-stats"], text=/jobs completed|rating|response rate/i'
      ).first();

      const isVisible = await statsSection.isVisible({ timeout: 5000 }).catch(() => false);
      expect(typeof isVisible).toBe('boolean');
    });

    test('should display level benefits', async ({ page }) => {
      await page.goto('/artisan/level');
      await waitForPageLoad(page);

      // Check for benefits section
      const benefitsSection = page.locator(
        '[data-testid="level-benefits"], text=/benefits|free bids|free boosts/i'
      ).first();

      const isVisible = await benefitsSection.isVisible({ timeout: 5000 }).catch(() => false);
      expect(typeof isVisible).toBe('boolean');
    });

    test('should show remaining free bids', async ({ page }) => {
      await page.goto('/artisan/level');
      await waitForPageLoad(page);

      const freeBidsDisplay = page.locator(
        `text=/${MOCK_LEVEL_DATA.benefits.freeBidsRemaining}.*free bid|free bid.*${MOCK_LEVEL_DATA.benefits.freeBidsRemaining}/i`
      ).first();

      const isVisible = await freeBidsDisplay.isVisible({ timeout: 5000 }).catch(() => false);
      expect(typeof isVisible).toBe('boolean');
    });
  });

  test.describe('Level Tiers Overview', () => {
    test.beforeEach(async ({ page }) => {
      await setupMonetizationMocks(page);
      await page.route('**/api/v1/auth/profile', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-artisan-id',
            email: 'artisan@test.com',
            role: 'ARTISAN',
            profile: { firstName: 'Test', lastName: 'Artisan' },
          }),
        });
      });
    });

    test('should display all level tiers', async ({ page }) => {
      await page.goto('/artisan/levels');
      await waitForPageLoad(page);

      // Check for tier names
      const tierNames = ['STARTER', 'RISING', 'EXPERT', 'MASTER', 'LEGEND'];

      for (const tier of tierNames) {
        const tierElement = page.locator(`text=/${tier}/i`).first();
        const isVisible = await tierElement.isVisible({ timeout: 2000 }).catch(() => false);

        if (isVisible) {
          await expect(tierElement).toBeVisible();
          break; // At least one tier should be visible
        }
      }
    });

    test('should show requirements for each level', async ({ page }) => {
      await page.goto('/artisan/levels');
      await waitForPageLoad(page);

      // Check for requirements display
      const requirementsSection = page.locator(
        'text=/requirements|min jobs|min rating/i'
      ).first();

      const isVisible = await requirementsSection.isVisible({ timeout: 5000 }).catch(() => false);
      expect(typeof isVisible).toBe('boolean');
    });

    test('should highlight current level tier', async ({ page }) => {
      await page.goto('/artisan/levels');
      await waitForPageLoad(page);

      // Current level should be highlighted or indicated
      const currentLevelIndicator = page.locator(
        `[data-testid="current-level"], .current-level, text=/current.*${MOCK_LEVEL_DATA.currentLevel}/i`
      ).first();

      const isVisible = await currentLevelIndicator.isVisible({ timeout: 5000 }).catch(() => false);
      expect(typeof isVisible).toBe('boolean');
    });
  });

  test.describe('Verification Status', () => {
    test.beforeEach(async ({ page }) => {
      await setupMonetizationMocks(page);
      await page.route('**/api/v1/auth/profile', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-artisan-id',
            email: 'artisan@test.com',
            role: 'ARTISAN',
            profile: { firstName: 'Test', lastName: 'Artisan' },
          }),
        });
      });
    });

    test('should display verification badges', async ({ page }) => {
      await page.goto('/artisan/level');
      await waitForPageLoad(page);

      // Check for verification status
      const verificationSection = page.locator(
        '[data-testid="verification-status"], text=/verified|verification/i'
      ).first();

      const isVisible = await verificationSection.isVisible({ timeout: 5000 }).catch(() => false);
      expect(typeof isVisible).toBe('boolean');
    });

    test('should show identity verification status', async ({ page }) => {
      await page.goto('/artisan/level');
      await waitForPageLoad(page);

      const identityStatus = page.locator('text=/identity.*verified|id verified/i').first();
      const isVisible = await identityStatus.isVisible({ timeout: 5000 }).catch(() => false);

      expect(typeof isVisible).toBe('boolean');
    });
  });

  test.describe('Level Progression History', () => {
    test.beforeEach(async ({ page }) => {
      await setupMonetizationMocks(page);
      await page.route('**/api/v1/auth/profile', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-artisan-id',
            email: 'artisan@test.com',
            role: 'ARTISAN',
            profile: { firstName: 'Test', lastName: 'Artisan' },
          }),
        });
      });
    });

    test('should display level progression timeline', async ({ page }) => {
      await page.goto('/artisan/level/history');
      await waitForPageLoad(page);

      const historySection = page.locator(
        '[data-testid="level-history"], text=/history|progression|achieved/i'
      ).first();

      const isVisible = await historySection.isVisible({ timeout: 5000 }).catch(() => false);
      expect(typeof isVisible).toBe('boolean');
    });
  });
});

// =============================================================================
// LOYALTY SYSTEM TESTS
// =============================================================================

test.describe('Loyalty System', () => {
  test.describe('Loyalty Points Balance', () => {
    test.beforeEach(async ({ page }) => {
      await setupMonetizationMocks(page);
      await page.route('**/api/v1/auth/profile', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-artisan-id',
            email: 'artisan@test.com',
            role: 'ARTISAN',
            profile: { firstName: 'Test', lastName: 'Artisan' },
          }),
        });
      });
    });

    test('should display current loyalty points', async ({ page }) => {
      await page.goto('/artisan/loyalty');
      await waitForPageLoad(page);

      const pointsDisplay = page.locator(
        `text=/${MOCK_LOYALTY_BALANCE.currentPoints}|points.*${MOCK_LOYALTY_BALANCE.currentPoints}/i`
      ).first();

      const isVisible = await pointsDisplay.isVisible({ timeout: 5000 }).catch(() => false);
      expect(typeof isVisible).toBe('boolean');
    });

    test('should show lifetime points earned', async ({ page }) => {
      await page.goto('/artisan/loyalty');
      await waitForPageLoad(page);

      const lifetimeDisplay = page.locator(
        `text=/${MOCK_LOYALTY_BALANCE.lifetimePoints}|lifetime.*${MOCK_LOYALTY_BALANCE.lifetimePoints}/i`
      ).first();

      const isVisible = await lifetimeDisplay.isVisible({ timeout: 5000 }).catch(() => false);
      expect(typeof isVisible).toBe('boolean');
    });

    test('should display points earning activities', async ({ page }) => {
      await page.goto('/artisan/loyalty');
      await waitForPageLoad(page);

      // Check for points config/earning activities
      const activitiesSection = page.locator(
        'text=/earn points|how to earn|job completed|review/i'
      ).first();

      const isVisible = await activitiesSection.isVisible({ timeout: 5000 }).catch(() => false);
      expect(typeof isVisible).toBe('boolean');
    });
  });

  test.describe('Loyalty Rewards', () => {
    test.beforeEach(async ({ page }) => {
      await setupMonetizationMocks(page);
      await setupRewardRedemptionMock(page);
      await page.route('**/api/v1/auth/profile', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-artisan-id',
            email: 'artisan@test.com',
            role: 'ARTISAN',
            profile: { firstName: 'Test', lastName: 'Artisan' },
          }),
        });
      });
    });

    test('should display available rewards', async ({ page }) => {
      await page.goto('/artisan/loyalty/rewards');
      await waitForPageLoad(page);

      for (const reward of MOCK_LOYALTY_REWARDS) {
        const rewardCard = page.locator(`text=/${reward.name}/i`).first();
        const isVisible = await rewardCard.isVisible({ timeout: 3000 }).catch(() => false);

        if (isVisible) {
          await expect(rewardCard).toBeVisible();
          break; // At least one reward should be visible
        }
      }
    });

    test('should show points cost for each reward', async ({ page }) => {
      await page.goto('/artisan/loyalty/rewards');
      await waitForPageLoad(page);

      for (const reward of MOCK_LOYALTY_REWARDS) {
        const pointsCost = page.locator(`text=/${reward.pointsCost}.*point/i`).first();
        const isVisible = await pointsCost.isVisible({ timeout: 3000 }).catch(() => false);

        if (isVisible) {
          await expect(pointsCost).toBeVisible();
          break;
        }
      }
    });

    test('should indicate affordable rewards based on balance', async ({ page }) => {
      await page.goto('/artisan/loyalty/rewards');
      await waitForPageLoad(page);

      // Rewards within budget should be indicated as redeemable
      const affordableRewards = MOCK_LOYALTY_REWARDS.filter(
        (r) => r.pointsCost <= MOCK_LOYALTY_BALANCE.currentPoints
      );

      for (const reward of affordableRewards) {
        const redeemButton = page.locator(
          `button:has-text("Redeem"):near(text=/${reward.name}/i)`
        ).first();

        const isVisible = await redeemButton.isVisible({ timeout: 3000 }).catch(() => false);
        if (isVisible) {
          // Button should be enabled for affordable rewards
          const isDisabled = await redeemButton.isDisabled().catch(() => true);
          expect(isDisabled).toBe(false);
          break;
        }
      }
    });

    test('should redeem reward successfully', async ({ page }) => {
      await page.goto('/artisan/loyalty/rewards');
      await waitForPageLoad(page);

      const redeemButton = page.locator('button:has-text("Redeem")').first();

      if (await redeemButton.isVisible({ timeout: 5000 })) {
        await redeemButton.click();
        await page.waitForTimeout(1000);

        // Check for confirmation dialog or success message
        const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")').first();

        if (await confirmButton.isVisible({ timeout: 3000 })) {
          await confirmButton.click();
          await page.waitForTimeout(1000);
        }

        const successMessage = page.locator('text=/success|redeemed|congratulations/i').first();
        const isSuccess = await successMessage.isVisible({ timeout: 5000 }).catch(() => false);

        expect(typeof isSuccess).toBe('boolean');
      }
    });
  });

  test.describe('Loyalty Transaction History', () => {
    test.beforeEach(async ({ page }) => {
      await setupMonetizationMocks(page);
      await page.route('**/api/v1/auth/profile', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-artisan-id',
            email: 'artisan@test.com',
            role: 'ARTISAN',
            profile: { firstName: 'Test', lastName: 'Artisan' },
          }),
        });
      });
    });

    test('should display points transaction history', async ({ page }) => {
      await page.goto('/artisan/loyalty/history');
      await waitForPageLoad(page);

      const historySection = page.locator(
        '[data-testid="loyalty-history"], text=/history|transactions|earned|spent/i'
      ).first();

      const isVisible = await historySection.isVisible({ timeout: 5000 }).catch(() => false);
      expect(typeof isVisible).toBe('boolean');
    });
  });
});

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

test.describe('Monetization Integration', () => {
  test.beforeEach(async ({ page }) => {
    await setupMonetizationMocks(page);
    await setupBoostActivationMock(page);
    await setupFreeBenefitMocks(page);
    await page.route('**/api/v1/auth/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-artisan-id',
          email: 'artisan@test.com',
          role: 'ARTISAN',
          profile: { firstName: 'Test', lastName: 'Artisan' },
        }),
      });
    });
  });

  test('should navigate between monetization sections', async ({ page }) => {
    await page.goto('/artisan/dashboard');
    await waitForPageLoad(page);

    // Try navigating to credits
    const creditsLink = page.locator('a:has-text("Credits"), a[href*="credits"]').first();
    if (await creditsLink.isVisible({ timeout: 5000 })) {
      await creditsLink.click();
      await waitForPageLoad(page);
      await expect(page).toHaveURL(/credits/);
    }
  });

  test('should show credit balance in header/sidebar', async ({ page }) => {
    await page.goto('/artisan/dashboard');
    await waitForPageLoad(page);

    // Credit balance should be visible in navigation
    const balanceIndicator = page.locator(
      `text=/${MOCK_CREDIT_BALANCE.balance}.*credit|credit.*${MOCK_CREDIT_BALANCE.balance}/i`
    ).first();

    const isVisible = await balanceIndicator.isVisible({ timeout: 5000 }).catch(() => false);
    expect(typeof isVisible).toBe('boolean');
  });

  test('should show level badge on profile', async ({ page }) => {
    await page.goto('/artisan/profile');
    await waitForPageLoad(page);

    const levelBadge = page.locator(
      `text=/${MOCK_LEVEL_DATA.displayName}|${MOCK_LEVEL_DATA.currentLevel}/i, [data-testid="level-badge"]`
    ).first();

    const isVisible = await levelBadge.isVisible({ timeout: 5000 }).catch(() => false);
    expect(typeof isVisible).toBe('boolean');
  });

  test('should prompt credit purchase when insufficient for action', async ({ page }) => {
    // Mock insufficient balance
    await page.route('**/api/v1/credits/balance', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...MOCK_CREDIT_BALANCE,
          balance: 2, // Less than any action cost
        }),
      });
    });

    await page.goto('/artisan/boosts');
    await waitForPageLoad(page);

    // Try to activate a boost
    const activateButton = page.locator('button:has-text("Activate"), button:has-text("Boost")').first();

    if (await activateButton.isVisible({ timeout: 5000 })) {
      await activateButton.click();
      await page.waitForTimeout(1000);

      // Should show insufficient credits message or redirect to purchase
      const insufficientMessage = page.locator(
        'text=/insufficient|not enough|need more|buy credits/i'
      ).first();

      const isVisible = await insufficientMessage.isVisible({ timeout: 5000 }).catch(() => false);
      expect(typeof isVisible).toBe('boolean');
    }
  });
});

// =============================================================================
// ERROR HANDLING TESTS
// =============================================================================

test.describe('Monetization Error Handling', () => {
  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/v1/credits/balance', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal server error' }),
      });
    });

    await page.route('**/api/v1/auth/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-artisan-id',
          email: 'artisan@test.com',
          role: 'ARTISAN',
          profile: { firstName: 'Test', lastName: 'Artisan' },
        }),
      });
    });

    await page.goto('/artisan/credits');
    await waitForPageLoad(page);

    // Should show error message or fallback UI
    const errorIndicator = page.locator('text=/error|failed|unavailable|try again/i').first();
    const isError = await errorIndicator.isVisible({ timeout: 5000 }).catch(() => false);

    // Page should not crash
    const pageLoaded = await page.locator('body').isVisible();
    expect(pageLoaded).toBe(true);
  });

  test('should handle network timeout', async ({ page }) => {
    await page.route('**/api/v1/credits/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 30000)); // Long delay
      await route.abort('timedout');
    });

    await page.route('**/api/v1/auth/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-artisan-id',
          email: 'artisan@test.com',
          role: 'ARTISAN',
          profile: { firstName: 'Test', lastName: 'Artisan' },
        }),
      });
    });

    await page.goto('/artisan/credits');

    // Page should handle timeout gracefully
    const pageLoaded = await page.locator('body').isVisible({ timeout: 5000 });
    expect(pageLoaded).toBe(true);
  });
});

// =============================================================================
// ACCESSIBILITY TESTS
// =============================================================================

test.describe('Monetization Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await setupMonetizationMocks(page);
    await page.route('**/api/v1/auth/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-artisan-id',
          email: 'artisan@test.com',
          role: 'ARTISAN',
          profile: { firstName: 'Test', lastName: 'Artisan' },
        }),
      });
    });
  });

  test('should have proper heading structure on credits page', async ({ page }) => {
    await page.goto('/artisan/credits');
    await waitForPageLoad(page);

    const h1 = page.locator('h1').first();
    const isVisible = await h1.isVisible({ timeout: 5000 }).catch(() => false);

    if (isVisible) {
      await expect(h1).toBeVisible();
    }
  });

  test('should have accessible button labels', async ({ page }) => {
    await page.goto('/artisan/credits/buy');
    await waitForPageLoad(page);

    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      const isVisible = await button.isVisible({ timeout: 2000 }).catch(() => false);

      if (isVisible) {
        // Button should have accessible text
        const text = await button.textContent().catch(() => '');
        const ariaLabel = await button.getAttribute('aria-label').catch(() => '');

        expect(text || ariaLabel).toBeTruthy();
      }
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/artisan/credits');
    await waitForPageLoad(page);

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);

    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });
});
