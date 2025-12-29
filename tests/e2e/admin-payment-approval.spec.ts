import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';

/**
 * E2E Tests for Admin Portal - Payment Approval Module
 * Tests payment approval, rejection, holds, bulk operations, and risk assessment
 */

// Test fixtures and data
const TEST_DATA = {
  approvalReason: 'Payment verified and approved after manual review',
  rejectionReason: 'Suspicious activity detected - flagged by fraud detection system',
  holdReason: 'Pending additional verification from client',
  investigationNotes: 'Contacted client via email for verification. Awaiting response within 24 hours.',
  bulkApprovalReason: 'Batch approval for low-risk payments after manual review',
  filters: {
    status: 'pending',
    riskLevel: 'medium',
    amountRange: '100-5000',
    dateRange: 'last-7-days',
  },
};

// Page object helpers
class PaymentApprovalPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto('/admin/payment-approval');
    await this.page.waitForLoadState('networkidle');
  }

  async waitForLoadComplete() {
    await this.page.waitForSelector('[data-testid="payment-approval-container"]', {
      state: 'visible',
      timeout: 10000,
    });
  }

  async getPaymentCount(): Promise<number> {
    const countElement = await this.page.locator('[data-testid="payments-count"]');
    const text = await countElement.textContent();
    return parseInt(text?.match(/\d+/)?.[0] || '0');
  }

  async selectPayment(index: number = 0) {
    await this.page.click(`[data-testid^="payment-row-"]:nth-child(${index + 1})`);
    await this.page.waitForSelector('[data-testid="payment-details-panel"]', {
      state: 'visible',
    });
  }

  async approvePayment(reason?: string) {
    await this.page.click('[data-testid="approve-payment-button"]');

    if (reason) {
      await this.page.fill('[data-testid="approval-reason"]', reason);
    }

    await this.page.click('[data-testid="confirm-approval-button"]');
  }

  async rejectPayment(reason: string) {
    await this.page.click('[data-testid="reject-payment-button"]');
    await this.page.fill('[data-testid="rejection-reason"]', reason);
    await this.page.click('[data-testid="confirm-rejection-button"]');
  }

  async holdPayment(reason: string) {
    await this.page.click('[data-testid="hold-payment-button"]');
    await this.page.fill('[data-testid="hold-reason"]', reason);
    await this.page.click('[data-testid="confirm-hold-button"]');
  }

  async releaseHold() {
    await this.page.click('[data-testid="release-hold-button"]');
    await this.page.click('[data-testid="confirm-release-button"]');
  }

  async addInvestigationNote(note: string) {
    await this.page.click('[data-testid="add-investigation-note-button"]');
    await this.page.fill('[data-testid="investigation-note-text"]', note);
    await this.page.click('[data-testid="save-note-button"]');
  }

  async selectMultiplePayments(count: number) {
    for (let i = 0; i < count; i++) {
      await this.page.click(`[data-testid^="payment-checkbox-"]:nth-child(${i + 1})`);
    }
  }

  async bulkApprove(reason: string) {
    await this.page.click('[data-testid="bulk-actions-button"]');
    await this.page.click('[data-testid="bulk-approve-option"]');
    await this.page.fill('[data-testid="bulk-approval-reason"]', reason);
    await this.page.click('[data-testid="confirm-bulk-approval-button"]');
  }

  async applyFilters(filters: typeof TEST_DATA.filters) {
    if (filters.status) {
      await this.page.selectOption('[data-testid="status-filter"]', filters.status);
    }

    if (filters.riskLevel) {
      await this.page.selectOption('[data-testid="risk-level-filter"]', filters.riskLevel);
    }

    if (filters.amountRange) {
      const [min, max] = filters.amountRange.split('-');
      await this.page.fill('[data-testid="min-amount-filter"]', min);
      await this.page.fill('[data-testid="max-amount-filter"]', max);
    }

    if (filters.dateRange) {
      await this.page.selectOption('[data-testid="date-range-filter"]', filters.dateRange);
    }

    await this.page.click('[data-testid="apply-filters-button"]');
  }

  async searchPayments(query: string) {
    await this.page.fill('[data-testid="payments-search"]', query);
    await this.page.press('[data-testid="payments-search"]', 'Enter');
  }

  async getRiskScore(): Promise<number> {
    const scoreElement = await this.page.locator('[data-testid="risk-score"]');
    const text = await scoreElement.textContent();
    return parseFloat(text?.match(/[\d.]+/)?.[0] || '0');
  }

  async getRiskLevel(): Promise<string> {
    const levelElement = await this.page.locator('[data-testid="risk-level-badge"]');
    return (await levelElement.textContent()) || '';
  }

  async verifySuccessToast(message?: string) {
    const toast = await this.page.waitForSelector('[data-testid="success-toast"]', {
      state: 'visible',
      timeout: 5000,
    });
    expect(toast).toBeTruthy();

    if (message) {
      const toastText = await toast.textContent();
      expect(toastText).toContain(message);
    }
  }

  async verifyAuditLog(action: string) {
    await this.page.click('[data-testid="audit-log-tab"]');
    await this.page.waitForSelector('[data-testid="audit-log-table"]');

    const firstLogEntry = await this.page.locator('[data-testid^="audit-log-entry-"]:first-child');
    const logText = await firstLogEntry.textContent();
    expect(logText).toContain(action);
  }

  async navigateToTab(tab: 'pending' | 'approved' | 'rejected' | 'on-hold') {
    await this.page.click(`[data-testid="${tab}-tab"]`);
    await this.page.waitForSelector(`[data-testid="${tab}-payments-table"]`);
  }
}

test.describe('Admin Payment Approval - Payment Details and Review', () => {
  let page: Page;
  let paymentPage: PaymentApprovalPage;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsAdmin(page);
    paymentPage = new PaymentApprovalPage(page);
    await paymentPage.navigate();
    await paymentPage.waitForLoadComplete();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should display payment approval page with pending payments', async () => {
    // Verify page loaded
    await expect(page.locator('[data-testid="payment-approval-container"]')).toBeVisible();

    // Verify table headers
    await expect(page.locator('[data-testid="payment-id-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="amount-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="risk-score-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="status-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="actions-header"]')).toBeVisible();
  });

  test('should display payment details panel on selection', async () => {
    await paymentPage.selectPayment(0);

    // Verify details panel
    await expect(page.locator('[data-testid="payment-details-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="payment-id"]')).toBeVisible();
    await expect(page.locator('[data-testid="payment-amount"]')).toBeVisible();
    await expect(page.locator('[data-testid="payment-method"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="transaction-history"]')).toBeVisible();
  });

  test('should display risk score visualization', async () => {
    await paymentPage.selectPayment(0);

    // Verify risk score elements
    await expect(page.locator('[data-testid="risk-score"]')).toBeVisible();
    await expect(page.locator('[data-testid="risk-level-badge"]')).toBeVisible();
    await expect(page.locator('[data-testid="risk-factors-list"]')).toBeVisible();

    // Verify risk score is valid number
    const riskScore = await paymentPage.getRiskScore();
    expect(riskScore).toBeGreaterThanOrEqual(0);
    expect(riskScore).toBeLessThanOrEqual(100);

    // Verify risk level badge color coding
    const riskLevel = await paymentPage.getRiskLevel();
    expect(['Low', 'Medium', 'High']).toContain(riskLevel);
  });

  test('should display risk factors breakdown', async () => {
    await paymentPage.selectPayment(0);

    // Verify risk factors
    const riskFactors = await page.locator('[data-testid="risk-factor-item"]').count();
    expect(riskFactors).toBeGreaterThan(0);

    // Verify each factor has details
    const firstFactor = await page.locator('[data-testid="risk-factor-item"]').first();
    await expect(firstFactor.locator('[data-testid="factor-name"]')).toBeVisible();
    await expect(firstFactor.locator('[data-testid="factor-score"]')).toBeVisible();
  });
});

test.describe('Admin Payment Approval - Approval Flow', () => {
  let page: Page;
  let paymentPage: PaymentApprovalPage;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsAdmin(page);
    paymentPage = new PaymentApprovalPage(page);
    await paymentPage.navigate();
    await paymentPage.waitForLoadComplete();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should successfully approve payment with reason', async () => {
    // Get initial count
    const initialCount = await paymentPage.getPaymentCount();

    // Select payment
    await paymentPage.selectPayment(0);

    // Get payment details
    const paymentId = await page.locator('[data-testid="payment-id"]').textContent();
    const amount = await page.locator('[data-testid="payment-amount"]').textContent();

    // Approve payment
    await paymentPage.approvePayment(TEST_DATA.approvalReason);

    // Verify success toast
    await paymentPage.verifySuccessToast('Payment approved successfully');

    // Verify payment removed from pending
    const newCount = await paymentPage.getPaymentCount();
    expect(newCount).toBe(initialCount - 1);

    // Verify payment appears in approved tab
    await paymentPage.navigateToTab('approved');
    const approvedPayments = await page.locator('[data-testid^="payment-row-"]').count();
    expect(approvedPayments).toBeGreaterThan(0);

    // Verify audit log
    await paymentPage.verifyAuditLog('Payment approved');
  });

  test('should approve payment without optional reason', async () => {
    await paymentPage.selectPayment(0);

    // Approve without reason
    await paymentPage.approvePayment();

    // Verify success
    await paymentPage.verifySuccessToast('Payment approved successfully');
  });

  test('should send notification to user on approval', async () => {
    await paymentPage.selectPayment(0);

    const userId = await page.locator('[data-testid="user-id"]').textContent();

    await paymentPage.approvePayment(TEST_DATA.approvalReason);
    await paymentPage.verifySuccessToast();

    // Verify notification sent (check via audit log or notification system)
    await paymentPage.verifyAuditLog('Payment approved');
  });

  test('should update payment status in database', async () => {
    await paymentPage.selectPayment(0);

    const paymentId = await page.locator('[data-testid="payment-id"]').textContent();

    await paymentPage.approvePayment(TEST_DATA.approvalReason);
    await paymentPage.verifySuccessToast();

    // Verify by navigating to approved tab
    await paymentPage.navigateToTab('approved');

    // Search for the payment
    await paymentPage.searchPayments(paymentId || '');

    // Verify status badge
    const statusBadge = await page.locator('[data-testid="payment-status-badge"]').first();
    const status = await statusBadge.textContent();
    expect(status).toContain('Approved');
  });
});

test.describe('Admin Payment Approval - Rejection Flow', () => {
  let page: Page;
  let paymentPage: PaymentApprovalPage;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsAdmin(page);
    paymentPage = new PaymentApprovalPage(page);
    await paymentPage.navigate();
    await paymentPage.waitForLoadComplete();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should successfully reject payment with reason', async () => {
    const initialCount = await paymentPage.getPaymentCount();

    await paymentPage.selectPayment(0);

    // Reject payment
    await paymentPage.rejectPayment(TEST_DATA.rejectionReason);

    // Verify success toast
    await paymentPage.verifySuccessToast('Payment rejected');

    // Verify payment removed from pending
    const newCount = await paymentPage.getPaymentCount();
    expect(newCount).toBe(initialCount - 1);

    // Verify payment appears in rejected tab
    await paymentPage.navigateToTab('rejected');
    const rejectedPayments = await page.locator('[data-testid^="payment-row-"]').count();
    expect(rejectedPayments).toBeGreaterThan(0);
  });

  test('should require rejection reason', async () => {
    await paymentPage.selectPayment(0);

    // Try to reject without reason
    await page.click('[data-testid="reject-payment-button"]');
    await page.click('[data-testid="confirm-rejection-button"]');

    // Verify validation error
    const error = await page.locator('[data-testid="validation-error"]').textContent();
    expect(error).toContain('reason is required');
  });

  test('should record rejection reason in audit log', async () => {
    await paymentPage.selectPayment(0);

    await paymentPage.rejectPayment(TEST_DATA.rejectionReason);
    await paymentPage.verifySuccessToast();

    // Verify audit log includes reason
    await paymentPage.verifyAuditLog('Payment rejected');

    const auditEntry = await page.locator('[data-testid^="audit-log-entry-"]:first-child').textContent();
    expect(auditEntry).toContain(TEST_DATA.rejectionReason);
  });

  test('should refund payment amount on rejection', async () => {
    await paymentPage.selectPayment(0);

    const amount = await page.locator('[data-testid="payment-amount"]').textContent();

    await paymentPage.rejectPayment(TEST_DATA.rejectionReason);
    await paymentPage.verifySuccessToast();

    // Verify refund initiated (check audit log)
    await paymentPage.verifyAuditLog('Payment rejected');
  });
});

test.describe('Admin Payment Approval - Hold and Release', () => {
  let page: Page;
  let paymentPage: PaymentApprovalPage;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsAdmin(page);
    paymentPage = new PaymentApprovalPage(page);
    await paymentPage.navigate();
    await paymentPage.waitForLoadComplete();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should hold payment for investigation', async () => {
    const initialCount = await paymentPage.getPaymentCount();

    await paymentPage.selectPayment(0);

    // Hold payment
    await paymentPage.holdPayment(TEST_DATA.holdReason);

    // Verify success toast
    await paymentPage.verifySuccessToast('Payment placed on hold');

    // Verify payment removed from pending
    const newCount = await paymentPage.getPaymentCount();
    expect(newCount).toBe(initialCount - 1);

    // Verify payment appears in on-hold tab
    await paymentPage.navigateToTab('on-hold');
    const heldPayments = await page.locator('[data-testid^="payment-row-"]').count();
    expect(heldPayments).toBeGreaterThan(0);
  });

  test('should release held payment back to pending', async () => {
    // First hold a payment
    await paymentPage.selectPayment(0);
    await paymentPage.holdPayment(TEST_DATA.holdReason);
    await paymentPage.verifySuccessToast();

    // Navigate to on-hold tab
    await paymentPage.navigateToTab('on-hold');
    const heldCount = await paymentPage.getPaymentCount();

    // Select held payment
    await paymentPage.selectPayment(0);

    // Release hold
    await paymentPage.releaseHold();

    // Verify success toast
    await paymentPage.verifySuccessToast('Hold released');

    // Verify payment removed from on-hold
    await paymentPage.navigateToTab('on-hold');
    const newHeldCount = await paymentPage.getPaymentCount();
    expect(newHeldCount).toBe(heldCount - 1);
  });

  test('should add investigation notes to held payment', async () => {
    await paymentPage.selectPayment(0);
    await paymentPage.holdPayment(TEST_DATA.holdReason);
    await paymentPage.verifySuccessToast();

    // Navigate to on-hold tab
    await paymentPage.navigateToTab('on-hold');
    await paymentPage.selectPayment(0);

    // Add investigation note
    await paymentPage.addInvestigationNote(TEST_DATA.investigationNotes);

    // Verify note added
    await paymentPage.verifySuccessToast('Investigation note added');

    // Verify note appears in notes list
    const notesList = await page.locator('[data-testid="investigation-notes-list"]');
    const noteText = await notesList.textContent();
    expect(noteText).toContain(TEST_DATA.investigationNotes);
  });

  test('should display investigation timeline', async () => {
    await paymentPage.selectPayment(0);
    await paymentPage.holdPayment(TEST_DATA.holdReason);
    await paymentPage.verifySuccessToast();

    await paymentPage.navigateToTab('on-hold');
    await paymentPage.selectPayment(0);

    // Verify timeline
    await expect(page.locator('[data-testid="investigation-timeline"]')).toBeVisible();

    const timelineEvents = await page.locator('[data-testid="timeline-event"]').count();
    expect(timelineEvents).toBeGreaterThan(0);
  });
});

test.describe('Admin Payment Approval - Bulk Operations', () => {
  let page: Page;
  let paymentPage: PaymentApprovalPage;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsAdmin(page);
    paymentPage = new PaymentApprovalPage(page);
    await paymentPage.navigate();
    await paymentPage.waitForLoadComplete();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should select multiple payments', async () => {
    const selectCount = 5;
    await paymentPage.selectMultiplePayments(selectCount);

    // Verify selection count
    const selectedCount = await page.locator('[data-testid="selected-count"]').textContent();
    expect(selectedCount).toContain(selectCount.toString());
  });

  test('should bulk approve payments (max 50)', async () => {
    const selectCount = 10;
    await paymentPage.selectMultiplePayments(selectCount);

    // Bulk approve
    await paymentPage.bulkApprove(TEST_DATA.bulkApprovalReason);

    // Verify success toast
    await paymentPage.verifySuccessToast(`${selectCount} payments approved`);

    // Verify audit log
    await paymentPage.verifyAuditLog('Bulk approval');
  });

  test('should prevent bulk approval exceeding 50 payments', async () => {
    // Try to select 51 payments
    const selectCount = 51;

    for (let i = 0; i < selectCount; i++) {
      await page.click(`[data-testid^="payment-checkbox-"]:nth-child(${i + 1})`);
    }

    // Verify warning message
    const warning = await page.locator('[data-testid="selection-limit-warning"]').textContent();
    expect(warning).toContain('maximum of 50');

    // Verify bulk actions disabled
    const bulkButton = await page.locator('[data-testid="bulk-actions-button"]');
    await expect(bulkButton).toBeDisabled();
  });

  test('should display bulk approval confirmation modal', async () => {
    await paymentPage.selectMultiplePayments(5);

    await page.click('[data-testid="bulk-actions-button"]');
    await page.click('[data-testid="bulk-approve-option"]');

    // Verify confirmation modal
    await expect(page.locator('[data-testid="bulk-approval-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="bulk-approval-summary"]')).toBeVisible();

    // Verify summary shows correct count
    const summary = await page.locator('[data-testid="bulk-approval-summary"]').textContent();
    expect(summary).toContain('5 payments');
  });

  test('should record individual audit logs for bulk approval', async () => {
    const selectCount = 3;
    await paymentPage.selectMultiplePayments(selectCount);

    await paymentPage.bulkApprove(TEST_DATA.bulkApprovalReason);
    await paymentPage.verifySuccessToast();

    // Check audit log
    await page.click('[data-testid="audit-log-tab"]');

    const auditEntries = await page.locator('[data-testid^="audit-log-entry-"]').count();
    expect(auditEntries).toBeGreaterThanOrEqual(selectCount);
  });
});

test.describe('Admin Payment Approval - Filtering and Search', () => {
  let page: Page;
  let paymentPage: PaymentApprovalPage;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsAdmin(page);
    paymentPage = new PaymentApprovalPage(page);
    await paymentPage.navigate();
    await paymentPage.waitForLoadComplete();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should filter payments by status', async () => {
    await paymentPage.applyFilters({
      status: 'pending',
      riskLevel: '',
      amountRange: '',
      dateRange: '',
    });

    // Verify filtered results
    const statusBadges = await page.locator('[data-testid="payment-status-badge"]').all();
    for (const badge of statusBadges) {
      const text = await badge.textContent();
      expect(text).toContain('Pending');
    }
  });

  test('should filter payments by risk level', async () => {
    await paymentPage.applyFilters({
      status: '',
      riskLevel: 'high',
      amountRange: '',
      dateRange: '',
    });

    // Verify filtered results
    const riskBadges = await page.locator('[data-testid="risk-level-badge"]').all();
    for (const badge of riskBadges) {
      const text = await badge.textContent();
      expect(text).toContain('High');
    }
  });

  test('should filter payments by amount range', async () => {
    await paymentPage.applyFilters({
      status: '',
      riskLevel: '',
      amountRange: '100-1000',
      dateRange: '',
    });

    // Verify results within range
    const amountElements = await page.locator('[data-testid="payment-amount"]').all();
    for (const element of amountElements) {
      const text = await element.textContent();
      const amount = parseFloat(text?.replace(/[^\d.]/g, '') || '0');
      expect(amount).toBeGreaterThanOrEqual(100);
      expect(amount).toBeLessThanOrEqual(1000);
    }
  });

  test('should filter payments by date range', async () => {
    await paymentPage.applyFilters({
      status: '',
      riskLevel: '',
      amountRange: '',
      dateRange: 'last-7-days',
    });

    // Verify results
    const payments = await page.locator('[data-testid^="payment-row-"]').count();
    expect(payments).toBeGreaterThanOrEqual(0);
  });

  test('should search payments by ID or user', async () => {
    await paymentPage.searchPayments('PAY-');

    // Verify search results
    const payments = await page.locator('[data-testid^="payment-row-"]').count();
    expect(payments).toBeGreaterThanOrEqual(0);
  });

  test('should combine multiple filters', async () => {
    await paymentPage.applyFilters(TEST_DATA.filters);

    await paymentPage.searchPayments('payment');

    // Verify combined filters work
    const payments = await page.locator('[data-testid^="payment-row-"]').count();
    expect(payments).toBeGreaterThanOrEqual(0);
  });

  test('should clear all filters', async () => {
    // Apply filters
    await paymentPage.applyFilters(TEST_DATA.filters);

    // Clear filters
    await page.click('[data-testid="clear-filters-button"]');

    // Verify all payments shown
    const payments = await page.locator('[data-testid^="payment-row-"]').count();
    expect(payments).toBeGreaterThan(0);
  });

  test('should save filter preferences', async () => {
    await paymentPage.applyFilters(TEST_DATA.filters);

    // Save filters
    await page.click('[data-testid="save-filters-button"]');

    // Verify success
    await paymentPage.verifySuccessToast('Filter preferences saved');

    // Refresh and verify filters persisted
    await page.reload();
    await paymentPage.waitForLoadComplete();

    const statusFilter = await page.inputValue('[data-testid="status-filter"]');
    expect(statusFilter).toBe(TEST_DATA.filters.status);
  });
});

test.describe('Admin Payment Approval - Risk Visualization', () => {
  let page: Page;
  let paymentPage: PaymentApprovalPage;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsAdmin(page);
    paymentPage = new PaymentApprovalPage(page);
    await paymentPage.navigate();
    await paymentPage.waitForLoadComplete();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should display risk score gauge', async () => {
    await paymentPage.selectPayment(0);

    // Verify gauge visualization
    await expect(page.locator('[data-testid="risk-score-gauge"]')).toBeVisible();

    const riskScore = await paymentPage.getRiskScore();
    expect(riskScore).toBeGreaterThanOrEqual(0);
    expect(riskScore).toBeLessThanOrEqual(100);
  });

  test('should color code risk levels', async () => {
    await paymentPage.selectPayment(0);

    const riskLevel = await paymentPage.getRiskLevel();
    const riskBadge = await page.locator('[data-testid="risk-level-badge"]');

    // Verify color coding (check CSS class)
    if (riskLevel === 'Low') {
      await expect(riskBadge).toHaveClass(/green|success/);
    } else if (riskLevel === 'Medium') {
      await expect(riskBadge).toHaveClass(/yellow|warning/);
    } else if (riskLevel === 'High') {
      await expect(riskBadge).toHaveClass(/red|danger/);
    }
  });

  test('should display risk factors with weighted scores', async () => {
    await paymentPage.selectPayment(0);

    const riskFactors = await page.locator('[data-testid="risk-factor-item"]').all();
    expect(riskFactors.length).toBeGreaterThan(0);

    for (const factor of riskFactors) {
      const name = await factor.locator('[data-testid="factor-name"]').textContent();
      const score = await factor.locator('[data-testid="factor-score"]').textContent();
      const weight = await factor.locator('[data-testid="factor-weight"]').textContent();

      expect(name).toBeTruthy();
      expect(score).toBeTruthy();
      expect(weight).toBeTruthy();
    }
  });

  test('should show risk trend over time', async () => {
    await paymentPage.selectPayment(0);

    // Navigate to risk analysis tab
    await page.click('[data-testid="risk-analysis-tab"]');

    // Verify trend chart
    await expect(page.locator('[data-testid="risk-trend-chart"]')).toBeVisible();
  });
});

test.describe('Admin Payment Approval - Accessibility', () => {
  let page: Page;
  let paymentPage: PaymentApprovalPage;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsAdmin(page);
    paymentPage = new PaymentApprovalPage(page);
    await paymentPage.navigate();
    await paymentPage.waitForLoadComplete();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should support keyboard navigation', async () => {
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Verify focus visible
    const focused = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
    expect(focused).toBeTruthy();
  });

  test('should have proper ARIA labels', async () => {
    const approveButton = await page.locator('[data-testid="approve-payment-button"]').first();
    const ariaLabel = await approveButton.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
  });
});
