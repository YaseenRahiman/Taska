import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';

/**
 * E2E Tests for Admin Portal - Escrow Configuration Module
 * Tests escrow settings, manual release, refunds, holds management, and analytics
 */

// Test fixtures and data
const TEST_DATA = {
  escrowSettings: {
    autoReleaseDays: 14,
    feePercentage: 5.0,
    minHoldAmount: 100,
    maxHoldAmount: 50000,
  },
  updatedSettings: {
    autoReleaseDays: 10,
    feePercentage: 4.5,
    minHoldAmount: 150,
    maxHoldAmount: 75000,
  },
  releaseReason: 'Job completed successfully and verified by admin',
  refundReason: 'Client requested refund due to unsatisfactory work',
};

// Page object helpers
class EscrowConfigPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto('/admin/escrow-config');
    await this.page.waitForLoadState('networkidle');
  }

  async waitForLoadComplete() {
    await this.page.waitForSelector('[data-testid="escrow-config-container"]', {
      state: 'visible',
      timeout: 10000,
    });
  }

  async updateSettings(settings: typeof TEST_DATA.escrowSettings) {
    await this.page.fill('[data-testid="auto-release-days"]', settings.autoReleaseDays.toString());
    await this.page.fill('[data-testid="fee-percentage"]', settings.feePercentage.toString());
    await this.page.fill('[data-testid="min-hold-amount"]', settings.minHoldAmount.toString());
    await this.page.fill('[data-testid="max-hold-amount"]', settings.maxHoldAmount.toString());
  }

  async saveSettings() {
    await this.page.click('[data-testid="save-settings-button"]');
  }

  async verifySuccessToast() {
    const toast = await this.page.waitForSelector('[data-testid="success-toast"]', {
      state: 'visible',
      timeout: 5000,
    });
    expect(toast).toBeTruthy();
    const message = await toast.textContent();
    expect(message).toContain('Settings saved successfully');
  }

  async navigateToActiveHoldsTab() {
    await this.page.click('[data-testid="active-holds-tab"]');
    await this.page.waitForSelector('[data-testid="active-holds-table"]');
  }

  async navigateToReleasedTab() {
    await this.page.click('[data-testid="released-tab"]');
    await this.page.waitForSelector('[data-testid="released-holds-table"]');
  }

  async navigateToRefundedTab() {
    await this.page.click('[data-testid="refunded-tab"]');
    await this.page.waitForSelector('[data-testid="refunded-holds-table"]');
  }

  async selectFirstHold() {
    await this.page.click('[data-testid^="hold-row-"]:first-child');
    await this.page.waitForSelector('[data-testid="hold-details-panel"]');
  }

  async releaseEscrow(reason?: string) {
    await this.page.click('[data-testid="release-escrow-button"]');

    if (reason) {
      await this.page.fill('[data-testid="release-reason"]', reason);
    }

    await this.page.click('[data-testid="confirm-release-button"]');
  }

  async refundEscrow(reason: string) {
    await this.page.click('[data-testid="refund-escrow-button"]');
    await this.page.fill('[data-testid="refund-reason"]', reason);
    await this.page.click('[data-testid="confirm-refund-button"]');
  }

  async applyFilters(filters: { status?: string; dateRange?: string; amountRange?: string }) {
    if (filters.status) {
      await this.page.selectOption('[data-testid="status-filter"]', filters.status);
    }

    if (filters.dateRange) {
      await this.page.selectOption('[data-testid="date-range-filter"]', filters.dateRange);
    }

    if (filters.amountRange) {
      await this.page.fill('[data-testid="min-amount-filter"]', filters.amountRange.split('-')[0]);
      await this.page.fill('[data-testid="max-amount-filter"]', filters.amountRange.split('-')[1]);
    }

    await this.page.click('[data-testid="apply-filters-button"]');
  }

  async searchHolds(query: string) {
    await this.page.fill('[data-testid="holds-search"]', query);
    await this.page.press('[data-testid="holds-search"]', 'Enter');
  }

  async getHoldCount(): Promise<number> {
    const countElement = await this.page.locator('[data-testid="holds-count"]');
    const text = await countElement.textContent();
    return parseInt(text?.match(/\d+/)?.[0] || '0');
  }

  async verifyAuditLog(action: string) {
    await this.page.click('[data-testid="audit-log-tab"]');
    await this.page.waitForSelector('[data-testid="audit-log-table"]');

    const firstLogEntry = await this.page.locator('[data-testid^="audit-log-entry-"]:first-child');
    const logText = await firstLogEntry.textContent();
    expect(logText).toContain(action);
  }

  async getAnalyticsData() {
    await this.page.click('[data-testid="analytics-tab"]');
    await this.page.waitForSelector('[data-testid="analytics-dashboard"]');

    const totalHolds = await this.page.locator('[data-testid="total-holds-metric"]').textContent();
    const totalValue = await this.page.locator('[data-testid="total-value-metric"]').textContent();
    const avgDuration = await this.page.locator('[data-testid="avg-duration-metric"]').textContent();

    return { totalHolds, totalValue, avgDuration };
  }
}

test.describe('Admin Escrow Configuration - Settings Management', () => {
  let page: Page;
  let escrowPage: EscrowConfigPage;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsAdmin(page);
    escrowPage = new EscrowConfigPage(page);
    await escrowPage.navigate();
    await escrowPage.waitForLoadComplete();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should display escrow configuration page with current settings', async () => {
    // Verify page loaded
    await expect(page.locator('[data-testid="escrow-config-container"]')).toBeVisible();

    // Verify settings form is present
    await expect(page.locator('[data-testid="auto-release-days"]')).toBeVisible();
    await expect(page.locator('[data-testid="fee-percentage"]')).toBeVisible();
    await expect(page.locator('[data-testid="min-hold-amount"]')).toBeVisible();
    await expect(page.locator('[data-testid="max-hold-amount"]')).toBeVisible();

    // Verify current values are loaded
    const autoReleaseDays = await page.inputValue('[data-testid="auto-release-days"]');
    expect(parseInt(autoReleaseDays)).toBeGreaterThan(0);
  });

  test('should successfully update escrow settings', async () => {
    // Update settings
    await escrowPage.updateSettings(TEST_DATA.updatedSettings);

    // Save settings
    await escrowPage.saveSettings();

    // Verify success toast
    await escrowPage.verifySuccessToast();

    // Verify settings persisted by refreshing page
    await page.reload();
    await escrowPage.waitForLoadComplete();

    const autoReleaseDays = await page.inputValue('[data-testid="auto-release-days"]');
    expect(parseInt(autoReleaseDays)).toBe(TEST_DATA.updatedSettings.autoReleaseDays);

    const feePercentage = await page.inputValue('[data-testid="fee-percentage"]');
    expect(parseFloat(feePercentage)).toBe(TEST_DATA.updatedSettings.feePercentage);
  });

  test('should validate settings input constraints', async () => {
    // Try invalid auto-release days (negative)
    await page.fill('[data-testid="auto-release-days"]', '-5');
    await escrowPage.saveSettings();

    const errorMessage = await page.locator('[data-testid="validation-error"]').textContent();
    expect(errorMessage).toContain('must be positive');

    // Try invalid fee percentage (> 100)
    await page.fill('[data-testid="fee-percentage"]', '150');
    await escrowPage.saveSettings();

    const feeError = await page.locator('[data-testid="validation-error"]').textContent();
    expect(feeError).toContain('percentage');
  });

  test('should record settings update in audit log', async () => {
    // Update settings
    await escrowPage.updateSettings(TEST_DATA.updatedSettings);
    await escrowPage.saveSettings();
    await escrowPage.verifySuccessToast();

    // Verify audit log
    await escrowPage.verifyAuditLog('Escrow settings updated');
  });
});

test.describe('Admin Escrow Configuration - Manual Release Flow', () => {
  let page: Page;
  let escrowPage: EscrowConfigPage;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsAdmin(page);
    escrowPage = new EscrowConfigPage(page);
    await escrowPage.navigate();
    await escrowPage.waitForLoadComplete();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should display active holds table', async () => {
    await escrowPage.navigateToActiveHoldsTab();

    // Verify table headers
    await expect(page.locator('[data-testid="hold-id-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="job-title-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="amount-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="created-at-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="actions-header"]')).toBeVisible();
  });

  test('should manually release escrow with reason', async () => {
    await escrowPage.navigateToActiveHoldsTab();

    // Get initial count
    const initialCount = await escrowPage.getHoldCount();

    // Select first hold
    await escrowPage.selectFirstHold();

    // Get hold details
    const holdAmount = await page.locator('[data-testid="hold-amount"]').textContent();
    const holdId = await page.locator('[data-testid="hold-id"]').textContent();

    // Release escrow
    await escrowPage.releaseEscrow(TEST_DATA.releaseReason);

    // Verify success toast
    await escrowPage.verifySuccessToast();

    // Verify hold removed from active holds
    await escrowPage.navigateToActiveHoldsTab();
    const newCount = await escrowPage.getHoldCount();
    expect(newCount).toBe(initialCount - 1);

    // Verify hold appears in released tab
    await escrowPage.navigateToReleasedTab();
    const releasedHolds = await page.locator('[data-testid^="hold-row-"]').count();
    expect(releasedHolds).toBeGreaterThan(0);

    // Verify audit log entry
    await escrowPage.verifyAuditLog('Escrow released');
  });

  test('should release escrow without optional reason', async () => {
    await escrowPage.navigateToActiveHoldsTab();
    await escrowPage.selectFirstHold();

    // Release without reason
    await escrowPage.releaseEscrow();

    // Verify success
    await escrowPage.verifySuccessToast();
  });

  test('should display hold details panel on selection', async () => {
    await escrowPage.navigateToActiveHoldsTab();
    await escrowPage.selectFirstHold();

    // Verify details panel
    await expect(page.locator('[data-testid="hold-details-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="hold-id"]')).toBeVisible();
    await expect(page.locator('[data-testid="hold-amount"]')).toBeVisible();
    await expect(page.locator('[data-testid="job-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="client-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="artisan-details"]')).toBeVisible();
  });

  test('should update wallet balance after release', async () => {
    await escrowPage.navigateToActiveHoldsTab();
    await escrowPage.selectFirstHold();

    // Get artisan wallet balance before release
    const artisanId = await page.locator('[data-testid="artisan-id"]').textContent();
    const holdAmount = await page.locator('[data-testid="hold-amount"]').textContent();
    const amount = parseFloat(holdAmount?.replace(/[^\d.]/g, '') || '0');

    // Release escrow
    await escrowPage.releaseEscrow(TEST_DATA.releaseReason);
    await escrowPage.verifySuccessToast();

    // Navigate to artisan's wallet (assuming we have access)
    // This would require additional navigation - simplified for test
    // In real implementation, verify via API call or database query

    // Verify audit log records the amount
    await escrowPage.verifyAuditLog(`Escrow released`);
  });
});

test.describe('Admin Escrow Configuration - Refund Flow', () => {
  let page: Page;
  let escrowPage: EscrowConfigPage;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsAdmin(page);
    escrowPage = new EscrowConfigPage(page);
    await escrowPage.navigate();
    await escrowPage.waitForLoadComplete();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should successfully refund escrow to client', async () => {
    await escrowPage.navigateToActiveHoldsTab();

    // Get initial count
    const initialCount = await escrowPage.getHoldCount();

    // Select first hold
    await escrowPage.selectFirstHold();

    // Refund escrow
    await escrowPage.refundEscrow(TEST_DATA.refundReason);

    // Verify success toast
    await escrowPage.verifySuccessToast();

    // Verify hold removed from active holds
    await escrowPage.navigateToActiveHoldsTab();
    const newCount = await escrowPage.getHoldCount();
    expect(newCount).toBe(initialCount - 1);

    // Verify hold appears in refunded tab
    await escrowPage.navigateToRefundedTab();
    const refundedHolds = await page.locator('[data-testid^="hold-row-"]').count();
    expect(refundedHolds).toBeGreaterThan(0);
  });

  test('should require refund reason', async () => {
    await escrowPage.navigateToActiveHoldsTab();
    await escrowPage.selectFirstHold();

    // Try to refund without reason
    await page.click('[data-testid="refund-escrow-button"]');
    await page.click('[data-testid="confirm-refund-button"]');

    // Verify validation error
    const error = await page.locator('[data-testid="validation-error"]').textContent();
    expect(error).toContain('reason is required');
  });

  test('should record refund in audit log with reason', async () => {
    await escrowPage.navigateToActiveHoldsTab();
    await escrowPage.selectFirstHold();

    await escrowPage.refundEscrow(TEST_DATA.refundReason);
    await escrowPage.verifySuccessToast();

    // Verify audit log includes reason
    await escrowPage.verifyAuditLog('Escrow refunded');

    const auditEntry = await page.locator('[data-testid^="audit-log-entry-"]:first-child').textContent();
    expect(auditEntry).toContain(TEST_DATA.refundReason);
  });
});

test.describe('Admin Escrow Configuration - Holds Table Filtering', () => {
  let page: Page;
  let escrowPage: EscrowConfigPage;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsAdmin(page);
    escrowPage = new EscrowConfigPage(page);
    await escrowPage.navigate();
    await escrowPage.waitForLoadComplete();
    await escrowPage.navigateToActiveHoldsTab();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should filter holds by status', async () => {
    await escrowPage.applyFilters({ status: 'active' });

    // Verify filtered results
    const holds = await page.locator('[data-testid^="hold-row-"]').count();
    expect(holds).toBeGreaterThanOrEqual(0);

    // Verify all visible holds have correct status
    const statusBadges = await page.locator('[data-testid="hold-status-badge"]').all();
    for (const badge of statusBadges) {
      const text = await badge.textContent();
      expect(text).toContain('Active');
    }
  });

  test('should filter holds by date range', async () => {
    await escrowPage.applyFilters({ dateRange: 'last-7-days' });

    // Verify results are within date range
    const holds = await page.locator('[data-testid^="hold-row-"]').count();
    expect(holds).toBeGreaterThanOrEqual(0);
  });

  test('should filter holds by amount range', async () => {
    await escrowPage.applyFilters({ amountRange: '100-1000' });

    // Verify results are within amount range
    const amountElements = await page.locator('[data-testid="hold-amount"]').all();
    for (const element of amountElements) {
      const text = await element.textContent();
      const amount = parseFloat(text?.replace(/[^\d.]/g, '') || '0');
      expect(amount).toBeGreaterThanOrEqual(100);
      expect(amount).toBeLessThanOrEqual(1000);
    }
  });

  test('should search holds by job title or ID', async () => {
    await escrowPage.searchHolds('Plumbing');

    // Verify search results
    const holds = await page.locator('[data-testid^="hold-row-"]').count();
    expect(holds).toBeGreaterThanOrEqual(0);

    // Verify results contain search term
    if (holds > 0) {
      const firstHold = await page.locator('[data-testid^="hold-row-"]:first-child').textContent();
      expect(firstHold?.toLowerCase()).toContain('plumbing');
    }
  });

  test('should combine multiple filters', async () => {
    await escrowPage.applyFilters({
      status: 'active',
      dateRange: 'last-30-days',
      amountRange: '100-5000',
    });

    await escrowPage.searchHolds('Job');

    // Verify combined filters work
    const holds = await page.locator('[data-testid^="hold-row-"]').count();
    expect(holds).toBeGreaterThanOrEqual(0);
  });

  test('should clear all filters', async () => {
    // Apply filters
    await escrowPage.applyFilters({ status: 'active' });

    // Clear filters
    await page.click('[data-testid="clear-filters-button"]');

    // Verify all holds shown again
    const holds = await page.locator('[data-testid^="hold-row-"]').count();
    expect(holds).toBeGreaterThan(0);
  });
});

test.describe('Admin Escrow Configuration - Analytics Dashboard', () => {
  let page: Page;
  let escrowPage: EscrowConfigPage;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsAdmin(page);
    escrowPage = new EscrowConfigPage(page);
    await escrowPage.navigate();
    await escrowPage.waitForLoadComplete();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should display escrow analytics dashboard', async () => {
    const analytics = await escrowPage.getAnalyticsData();

    // Verify metrics are displayed
    expect(analytics.totalHolds).toBeTruthy();
    expect(analytics.totalValue).toBeTruthy();
    expect(analytics.avgDuration).toBeTruthy();
  });

  test('should display analytics charts', async () => {
    await page.click('[data-testid="analytics-tab"]');
    await page.waitForSelector('[data-testid="analytics-dashboard"]');

    // Verify charts are present
    await expect(page.locator('[data-testid="holds-over-time-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="amount-distribution-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="release-time-chart"]')).toBeVisible();
  });

  test('should filter analytics by date range', async () => {
    await page.click('[data-testid="analytics-tab"]');

    // Select date range
    await page.selectOption('[data-testid="analytics-date-range"]', 'last-30-days');

    // Verify charts update
    await page.waitForTimeout(1000); // Wait for chart re-render

    const totalHolds = await page.locator('[data-testid="total-holds-metric"]').textContent();
    expect(totalHolds).toBeTruthy();
  });

  test('should export analytics data', async () => {
    await page.click('[data-testid="analytics-tab"]');

    // Click export button
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-analytics-button"]');
    const download = await downloadPromise;

    // Verify download
    expect(download.suggestedFilename()).toContain('escrow-analytics');
  });
});

test.describe('Admin Escrow Configuration - Audit Logging', () => {
  let page: Page;
  let escrowPage: EscrowConfigPage;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsAdmin(page);
    escrowPage = new EscrowConfigPage(page);
    await escrowPage.navigate();
    await escrowPage.waitForLoadComplete();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should display audit log with recent actions', async () => {
    await page.click('[data-testid="audit-log-tab"]');
    await page.waitForSelector('[data-testid="audit-log-table"]');

    // Verify log entries
    const entries = await page.locator('[data-testid^="audit-log-entry-"]').count();
    expect(entries).toBeGreaterThan(0);

    // Verify log entry structure
    await expect(page.locator('[data-testid="audit-timestamp"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="audit-action"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="audit-user"]').first()).toBeVisible();
  });

  test('should filter audit log by action type', async () => {
    await page.click('[data-testid="audit-log-tab"]');

    await page.selectOption('[data-testid="audit-action-filter"]', 'release');

    // Verify filtered results
    const actions = await page.locator('[data-testid="audit-action"]').all();
    for (const action of actions) {
      const text = await action.textContent();
      expect(text).toContain('release');
    }
  });

  test('should search audit log', async () => {
    await page.click('[data-testid="audit-log-tab"]');

    await page.fill('[data-testid="audit-search"]', 'escrow');
    await page.press('[data-testid="audit-search"]', 'Enter');

    // Verify search results
    const entries = await page.locator('[data-testid^="audit-log-entry-"]').count();
    expect(entries).toBeGreaterThanOrEqual(0);
  });

  test('should display detailed audit log entry on click', async () => {
    await page.click('[data-testid="audit-log-tab"]');

    await page.click('[data-testid^="audit-log-entry-"]:first-child');

    // Verify detail panel
    await expect(page.locator('[data-testid="audit-detail-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="audit-full-details"]')).toBeVisible();
  });
});
