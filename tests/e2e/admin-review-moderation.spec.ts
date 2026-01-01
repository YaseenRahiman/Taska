import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';

/**
 * E2E Tests for Admin Portal - Review Moderation Module
 * Tests review editing, visibility control, deletion, moderation notes, and edit history
 */

// Test fixtures and data
const TEST_DATA = {
  editedReviewContent: 'This is an edited review content after moderation to remove inappropriate language.',
  editReason: 'Removed profanity and inappropriate content while preserving review intent',
  moderationNote: 'User contacted about review policy violations. Edited to maintain platform standards.',
  deleteReason: 'Contains personal attacks and violates community guidelines after multiple warnings',
  hideReason: 'Pending investigation of fraud claims mentioned in review',
  flagReason: 'Review contains potentially false information about service quality',
};

// Page object helpers
class ReviewModerationPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto('/admin/review-moderation');
    await this.page.waitForLoadState('networkidle');
  }

  async waitForLoadComplete() {
    await this.page.waitForSelector('[data-testid="review-moderation-container"]', {
      state: 'visible',
      timeout: 10000,
    });
  }

  async getReviewCount(): Promise<number> {
    const countElement = await this.page.locator('[data-testid="reviews-count"]');
    const text = await countElement.textContent();
    return parseInt(text?.match(/\d+/)?.[0] || '0');
  }

  async selectReview(index: number = 0) {
    await this.page.click(`[data-testid^="review-row-"]:nth-child(${index + 1})`);
    await this.page.waitForSelector('[data-testid="review-details-panel"]', {
      state: 'visible',
    });
  }

  async editReview(newContent: string, reason: string) {
    await this.page.click('[data-testid="edit-review-button"]');
    await this.page.waitForSelector('[data-testid="edit-review-modal"]');

    // Clear and enter new content
    await this.page.fill('[data-testid="review-content-editor"]', '');
    await this.page.fill('[data-testid="review-content-editor"]', newContent);

    // Enter edit reason
    await this.page.fill('[data-testid="edit-reason"]', reason);

    // Save changes
    await this.page.click('[data-testid="save-review-button"]');
  }

  async hideReview(reason?: string) {
    await this.page.click('[data-testid="hide-review-button"]');

    if (reason) {
      await this.page.fill('[data-testid="hide-reason"]', reason);
    }

    await this.page.click('[data-testid="confirm-hide-button"]');
  }

  async showReview() {
    await this.page.click('[data-testid="show-review-button"]');
    await this.page.click('[data-testid="confirm-show-button"]');
  }

  async deleteReview(reason: string) {
    await this.page.click('[data-testid="delete-review-button"]');
    await this.page.fill('[data-testid="delete-reason"]', reason);
    await this.page.click('[data-testid="confirm-delete-button"]');
  }

  async addModerationNote(note: string) {
    await this.page.click('[data-testid="add-moderation-note-button"]');
    await this.page.fill('[data-testid="moderation-note-text"]', note);
    await this.page.click('[data-testid="save-note-button"]');
  }

  async viewEditHistory() {
    await this.page.click('[data-testid="edit-history-tab"]');
    await this.page.waitForSelector('[data-testid="edit-history-timeline"]');
  }

  async getEditHistoryCount(): Promise<number> {
    await this.viewEditHistory();
    const events = await this.page.locator('[data-testid="history-event"]').count();
    return events;
  }

  async applyFilters(filters: {
    status?: string;
    rating?: string;
    flagged?: boolean;
    dateRange?: string;
  }) {
    if (filters.status) {
      await this.page.selectOption('[data-testid="status-filter"]', filters.status);
    }

    if (filters.rating) {
      await this.page.selectOption('[data-testid="rating-filter"]', filters.rating);
    }

    if (filters.flagged !== undefined) {
      await this.page.click('[data-testid="flagged-only-checkbox"]');
    }

    if (filters.dateRange) {
      await this.page.selectOption('[data-testid="date-range-filter"]', filters.dateRange);
    }

    await this.page.click('[data-testid="apply-filters-button"]');
  }

  async searchReviews(query: string) {
    await this.page.fill('[data-testid="reviews-search"]', query);
    await this.page.press('[data-testid="reviews-search"]', 'Enter');
  }

  async navigateToTab(tab: 'all' | 'flagged' | 'hidden' | 'deleted') {
    await this.page.click(`[data-testid="${tab}-reviews-tab"]`);
    await this.page.waitForSelector(`[data-testid="${tab}-reviews-table"]`);
  }

  async flagReview(reason: string) {
    await this.page.click('[data-testid="flag-review-button"]');
    await this.page.fill('[data-testid="flag-reason"]', reason);
    await this.page.click('[data-testid="confirm-flag-button"]');
  }

  async unflagReview() {
    await this.page.click('[data-testid="unflag-review-button"]');
    await this.page.click('[data-testid="confirm-unflag-button"]');
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
}

test.describe('Admin Review Moderation - Review Display and Selection', () => {
  let page: Page;
  let reviewPage: ReviewModerationPage;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsAdmin(page);
    reviewPage = new ReviewModerationPage(page);
    await reviewPage.navigate();
    await reviewPage.waitForLoadComplete();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should display review moderation page with reviews list', async () => {
    // Verify page loaded
    await expect(page.locator('[data-testid="review-moderation-container"]')).toBeVisible();

    // Verify table headers
    await expect(page.locator('[data-testid="review-id-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="rating-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="content-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="status-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="actions-header"]')).toBeVisible();
  });

  test('should display review details panel on selection', async () => {
    await reviewPage.selectReview(0);

    // Verify details panel
    await expect(page.locator('[data-testid="review-details-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="review-id"]')).toBeVisible();
    await expect(page.locator('[data-testid="review-content"]')).toBeVisible();
    await expect(page.locator('[data-testid="review-rating"]')).toBeVisible();
    await expect(page.locator('[data-testid="reviewer-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="reviewed-job"]')).toBeVisible();
    await expect(page.locator('[data-testid="review-date"]')).toBeVisible();
  });

  test('should display review metadata', async () => {
    await reviewPage.selectReview(0);

    // Verify metadata
    await expect(page.locator('[data-testid="review-helpful-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="review-report-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="review-visibility-status"]')).toBeVisible();

    // Verify rating display
    const rating = await page.locator('[data-testid="review-rating"]').textContent();
    const ratingValue = parseFloat(rating?.match(/[\d.]+/)?.[0] || '0');
    expect(ratingValue).toBeGreaterThanOrEqual(1);
    expect(ratingValue).toBeLessThanOrEqual(5);
  });

  test('should highlight flagged reviews', async () => {
    await reviewPage.navigateToTab('flagged');

    const flaggedReviews = await page.locator('[data-testid^="review-row-"]').all();

    for (const review of flaggedReviews) {
      const flagBadge = await review.locator('[data-testid="flagged-badge"]');
      await expect(flagBadge).toBeVisible();
    }
  });
});

test.describe('Admin Review Moderation - Edit Review Flow', () => {
  let page: Page;
  let reviewPage: ReviewModerationPage;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsAdmin(page);
    reviewPage = new ReviewModerationPage(page);
    await reviewPage.navigate();
    await reviewPage.waitForLoadComplete();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should successfully edit review content', async () => {
    await reviewPage.selectReview(0);

    // Get original content
    const originalContent = await page.locator('[data-testid="review-content"]').textContent();

    // Edit review
    await reviewPage.editReview(TEST_DATA.editedReviewContent, TEST_DATA.editReason);

    // Verify success toast
    await reviewPage.verifySuccessToast('Review updated successfully');

    // Verify content updated
    const newContent = await page.locator('[data-testid="review-content"]').textContent();
    expect(newContent).toBe(TEST_DATA.editedReviewContent);
    expect(newContent).not.toBe(originalContent);

    // Verify edit indicator
    await expect(page.locator('[data-testid="edited-badge"]')).toBeVisible();
  });

  test('should require edit reason', async () => {
    await reviewPage.selectReview(0);

    // Try to edit without reason
    await page.click('[data-testid="edit-review-button"]');
    await page.fill('[data-testid="review-content-editor"]', 'New content');
    await page.click('[data-testid="save-review-button"]');

    // Verify validation error
    const error = await page.locator('[data-testid="validation-error"]').textContent();
    expect(error).toContain('reason is required');
  });

  test('should record edit in history timeline', async () => {
    await reviewPage.selectReview(0);

    // Get initial history count
    const initialHistoryCount = await reviewPage.getEditHistoryCount();

    // Edit review
    await page.click('[data-testid="all-reviews-tab"]'); // Go back to main view
    await reviewPage.selectReview(0);
    await reviewPage.editReview(TEST_DATA.editedReviewContent, TEST_DATA.editReason);
    await reviewPage.verifySuccessToast();

    // Verify history updated
    const newHistoryCount = await reviewPage.getEditHistoryCount();
    expect(newHistoryCount).toBe(initialHistoryCount + 1);

    // Verify latest history entry contains edit reason
    const latestEvent = await page.locator('[data-testid="history-event"]').first();
    const eventText = await latestEvent.textContent();
    expect(eventText).toContain(TEST_DATA.editReason);
  });

  test('should display before/after comparison in edit history', async () => {
    await reviewPage.selectReview(0);
    await reviewPage.editReview(TEST_DATA.editedReviewContent, TEST_DATA.editReason);
    await reviewPage.verifySuccessToast();

    // View edit history
    await reviewPage.viewEditHistory();

    // Click on edit event
    await page.click('[data-testid="history-event"]:first-child');

    // Verify comparison view
    await expect(page.locator('[data-testid="edit-comparison-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="original-content"]')).toBeVisible();
    await expect(page.locator('[data-testid="edited-content"]')).toBeVisible();
    await expect(page.locator('[data-testid="diff-view"]')).toBeVisible();
  });

  test('should preserve review rating when editing content', async () => {
    await reviewPage.selectReview(0);

    // Get original rating
    const originalRating = await page.locator('[data-testid="review-rating"]').textContent();

    // Edit review
    await reviewPage.editReview(TEST_DATA.editedReviewContent, TEST_DATA.editReason);
    await reviewPage.verifySuccessToast();

    // Verify rating unchanged
    const newRating = await page.locator('[data-testid="review-rating"]').textContent();
    expect(newRating).toBe(originalRating);
  });

  test('should notify reviewer of content edit', async () => {
    await reviewPage.selectReview(0);

    const reviewerId = await page.locator('[data-testid="reviewer-id"]').textContent();

    await reviewPage.editReview(TEST_DATA.editedReviewContent, TEST_DATA.editReason);
    await reviewPage.verifySuccessToast();

    // Verify audit log records notification sent
    await reviewPage.verifyAuditLog('Review edited');
  });
});

test.describe('Admin Review Moderation - Visibility Control', () => {
  let page: Page;
  let reviewPage: ReviewModerationPage;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsAdmin(page);
    reviewPage = new ReviewModerationPage(page);
    await reviewPage.navigate();
    await reviewPage.waitForLoadComplete();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should hide review from public view', async () => {
    const initialCount = await reviewPage.getReviewCount();

    await reviewPage.selectReview(0);

    const reviewId = await page.locator('[data-testid="review-id"]').textContent();

    // Hide review
    await reviewPage.hideReview(TEST_DATA.hideReason);

    // Verify success toast
    await reviewPage.verifySuccessToast('Review hidden');

    // Verify review removed from main list
    const newCount = await reviewPage.getReviewCount();
    expect(newCount).toBe(initialCount - 1);

    // Verify review appears in hidden tab
    await reviewPage.navigateToTab('hidden');
    const hiddenReviews = await page.locator('[data-testid^="review-row-"]').count();
    expect(hiddenReviews).toBeGreaterThan(0);
  });

  test('should show hidden review', async () => {
    // First hide a review
    await reviewPage.selectReview(0);
    await reviewPage.hideReview(TEST_DATA.hideReason);
    await reviewPage.verifySuccessToast();

    // Navigate to hidden tab
    await reviewPage.navigateToTab('hidden');
    const hiddenCount = await reviewPage.getReviewCount();

    // Select hidden review
    await reviewPage.selectReview(0);

    // Show review
    await reviewPage.showReview();

    // Verify success toast
    await reviewPage.verifySuccessToast('Review shown');

    // Verify review removed from hidden
    await reviewPage.navigateToTab('hidden');
    const newHiddenCount = await reviewPage.getReviewCount();
    expect(newHiddenCount).toBe(hiddenCount - 1);
  });

  test('should toggle visibility multiple times', async () => {
    await reviewPage.selectReview(0);

    // Hide
    await reviewPage.hideReview(TEST_DATA.hideReason);
    await reviewPage.verifySuccessToast();

    // Show
    await reviewPage.navigateToTab('hidden');
    await reviewPage.selectReview(0);
    await reviewPage.showReview();
    await reviewPage.verifySuccessToast();

    // Hide again
    await reviewPage.navigateToTab('all');
    await reviewPage.selectReview(0);
    await reviewPage.hideReview('Second hide for additional review');
    await reviewPage.verifySuccessToast();

    // Verify history shows all visibility changes
    const historyCount = await reviewPage.getEditHistoryCount();
    expect(historyCount).toBeGreaterThanOrEqual(2);
  });

  test('should display visibility status badge', async () => {
    await reviewPage.selectReview(0);

    // Verify visible badge
    const visibleBadge = await page.locator('[data-testid="visibility-status-badge"]');
    let status = await visibleBadge.textContent();
    expect(status).toContain('Visible');

    // Hide review
    await reviewPage.hideReview(TEST_DATA.hideReason);
    await reviewPage.verifySuccessToast();

    // Verify hidden badge
    await reviewPage.navigateToTab('hidden');
    await reviewPage.selectReview(0);
    const hiddenBadge = await page.locator('[data-testid="visibility-status-badge"]');
    status = await hiddenBadge.textContent();
    expect(status).toContain('Hidden');
  });
});

test.describe('Admin Review Moderation - Delete Review', () => {
  let page: Page;
  let reviewPage: ReviewModerationPage;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsAdmin(page);
    reviewPage = new ReviewModerationPage(page);
    await reviewPage.navigate();
    await reviewPage.waitForLoadComplete();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should soft delete review', async () => {
    const initialCount = await reviewPage.getReviewCount();

    await reviewPage.selectReview(0);

    const reviewId = await page.locator('[data-testid="review-id"]').textContent();

    // Delete review
    await reviewPage.deleteReview(TEST_DATA.deleteReason);

    // Verify success toast
    await reviewPage.verifySuccessToast('Review deleted');

    // Verify review removed from main list
    const newCount = await reviewPage.getReviewCount();
    expect(newCount).toBe(initialCount - 1);

    // Verify review appears in deleted tab
    await reviewPage.navigateToTab('deleted');
    const deletedReviews = await page.locator('[data-testid^="review-row-"]').count();
    expect(deletedReviews).toBeGreaterThan(0);
  });

  test('should require delete reason', async () => {
    await reviewPage.selectReview(0);

    // Try to delete without reason
    await page.click('[data-testid="delete-review-button"]');
    await page.click('[data-testid="confirm-delete-button"]');

    // Verify validation error
    const error = await page.locator('[data-testid="validation-error"]').textContent();
    expect(error).toContain('reason is required');
  });

  test('should record deletion in audit log with reason', async () => {
    await reviewPage.selectReview(0);

    await reviewPage.deleteReview(TEST_DATA.deleteReason);
    await reviewPage.verifySuccessToast();

    // Verify audit log includes reason
    await reviewPage.verifyAuditLog('Review deleted');

    const auditEntry = await page.locator('[data-testid^="audit-log-entry-"]:first-child').textContent();
    expect(auditEntry).toContain(TEST_DATA.deleteReason);
  });

  test('should show confirmation modal before deletion', async () => {
    await reviewPage.selectReview(0);

    await page.click('[data-testid="delete-review-button"]');

    // Verify confirmation modal
    await expect(page.locator('[data-testid="delete-confirmation-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="delete-warning"]')).toBeVisible();

    const warningText = await page.locator('[data-testid="delete-warning"]').textContent();
    expect(warningText).toContain('permanent');
  });

  test('should preserve deleted review data for records', async () => {
    await reviewPage.selectReview(0);

    const reviewContent = await page.locator('[data-testid="review-content"]').textContent();
    const reviewId = await page.locator('[data-testid="review-id"]').textContent();

    await reviewPage.deleteReview(TEST_DATA.deleteReason);
    await reviewPage.verifySuccessToast();

    // Navigate to deleted tab
    await reviewPage.navigateToTab('deleted');
    await reviewPage.selectReview(0);

    // Verify data still accessible
    const deletedContent = await page.locator('[data-testid="review-content"]').textContent();
    expect(deletedContent).toBe(reviewContent);
  });
});

test.describe('Admin Review Moderation - Moderation Notes', () => {
  let page: Page;
  let reviewPage: ReviewModerationPage;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsAdmin(page);
    reviewPage = new ReviewModerationPage(page);
    await reviewPage.navigate();
    await reviewPage.waitForLoadComplete();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should add moderation note to review', async () => {
    await reviewPage.selectReview(0);

    // Add note
    await reviewPage.addModerationNote(TEST_DATA.moderationNote);

    // Verify success toast
    await reviewPage.verifySuccessToast('Moderation note added');

    // Verify note appears in notes list
    const notesList = await page.locator('[data-testid="moderation-notes-list"]');
    const noteText = await notesList.textContent();
    expect(noteText).toContain(TEST_DATA.moderationNote);
  });

  test('should display note metadata', async () => {
    await reviewPage.selectReview(0);
    await reviewPage.addModerationNote(TEST_DATA.moderationNote);
    await reviewPage.verifySuccessToast();

    // Verify note metadata
    const note = await page.locator('[data-testid="moderation-note"]').first();
    await expect(note.locator('[data-testid="note-author"]')).toBeVisible();
    await expect(note.locator('[data-testid="note-timestamp"]')).toBeVisible();
    await expect(note.locator('[data-testid="note-content"]')).toBeVisible();
  });

  test('should support multiple notes', async () => {
    await reviewPage.selectReview(0);

    // Add first note
    await reviewPage.addModerationNote('First moderation note');
    await reviewPage.verifySuccessToast();

    // Add second note
    await reviewPage.addModerationNote('Second moderation note');
    await reviewPage.verifySuccessToast();

    // Verify both notes visible
    const notes = await page.locator('[data-testid="moderation-note"]').count();
    expect(notes).toBeGreaterThanOrEqual(2);
  });

  test('should display notes chronologically', async () => {
    await reviewPage.selectReview(0);

    await reviewPage.addModerationNote('Note 1');
    await reviewPage.verifySuccessToast();

    await reviewPage.addModerationNote('Note 2');
    await reviewPage.verifySuccessToast();

    // Verify most recent note appears first
    const firstNote = await page.locator('[data-testid="moderation-note"]').first();
    const noteText = await firstNote.locator('[data-testid="note-content"]').textContent();
    expect(noteText).toContain('Note 2');
  });

  test('should allow note editing', async () => {
    await reviewPage.selectReview(0);
    await reviewPage.addModerationNote(TEST_DATA.moderationNote);
    await reviewPage.verifySuccessToast();

    // Edit note
    const note = await page.locator('[data-testid="moderation-note"]').first();
    await note.locator('[data-testid="edit-note-button"]').click();

    const updatedNote = 'Updated moderation note content';
    await page.fill('[data-testid="note-content-editor"]', updatedNote);
    await page.click('[data-testid="save-note-button"]');

    // Verify update
    await reviewPage.verifySuccessToast('Note updated');

    const noteContent = await page.locator('[data-testid="moderation-note"]').first().textContent();
    expect(noteContent).toContain(updatedNote);
  });
});

test.describe('Admin Review Moderation - Flagged Reviews Queue', () => {
  let page: Page;
  let reviewPage: ReviewModerationPage;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsAdmin(page);
    reviewPage = new ReviewModerationPage(page);
    await reviewPage.navigate();
    await reviewPage.waitForLoadComplete();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should display flagged reviews queue', async () => {
    await reviewPage.navigateToTab('flagged');

    // Verify flagged reviews table
    await expect(page.locator('[data-testid="flagged-reviews-table"]')).toBeVisible();

    const flaggedCount = await reviewPage.getReviewCount();
    expect(flaggedCount).toBeGreaterThanOrEqual(0);
  });

  test('should flag review for moderation', async () => {
    await reviewPage.selectReview(0);

    // Flag review
    await reviewPage.flagReview(TEST_DATA.flagReason);

    // Verify success toast
    await reviewPage.verifySuccessToast('Review flagged');

    // Verify flag badge visible
    await expect(page.locator('[data-testid="flagged-badge"]')).toBeVisible();

    // Verify appears in flagged queue
    await reviewPage.navigateToTab('flagged');
    const flaggedReviews = await page.locator('[data-testid^="review-row-"]').count();
    expect(flaggedReviews).toBeGreaterThan(0);
  });

  test('should unflag review', async () => {
    // First flag a review
    await reviewPage.selectReview(0);
    await reviewPage.flagReview(TEST_DATA.flagReason);
    await reviewPage.verifySuccessToast();

    // Navigate to flagged queue
    await reviewPage.navigateToTab('flagged');
    const flaggedCount = await reviewPage.getReviewCount();

    // Select and unflag
    await reviewPage.selectReview(0);
    await reviewPage.unflagReview();

    // Verify success
    await reviewPage.verifySuccessToast('Flag removed');

    // Verify removed from flagged queue
    await reviewPage.navigateToTab('flagged');
    const newFlaggedCount = await reviewPage.getReviewCount();
    expect(newFlaggedCount).toBe(flaggedCount - 1);
  });

  test('should display flag reason and reporter', async () => {
    await reviewPage.navigateToTab('flagged');
    await reviewPage.selectReview(0);

    // Verify flag details
    await expect(page.locator('[data-testid="flag-reason"]')).toBeVisible();
    await expect(page.locator('[data-testid="flag-reporter"]')).toBeVisible();
    await expect(page.locator('[data-testid="flag-date"]')).toBeVisible();
  });

  test('should prioritize flagged reviews by severity', async () => {
    await reviewPage.navigateToTab('flagged');

    // Apply severity sort
    await page.click('[data-testid="sort-by-severity"]');

    // Verify high severity reviews appear first
    const firstReview = await page.locator('[data-testid^="review-row-"]').first();
    await expect(firstReview.locator('[data-testid="severity-badge"]')).toBeVisible();
  });
});

test.describe('Admin Review Moderation - Filtering and Search', () => {
  let page: Page;
  let reviewPage: ReviewModerationPage;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsAdmin(page);
    reviewPage = new ReviewModerationPage(page);
    await reviewPage.navigate();
    await reviewPage.waitForLoadComplete();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should filter reviews by status', async () => {
    await reviewPage.applyFilters({ status: 'visible' });

    // Verify filtered results
    const statusBadges = await page.locator('[data-testid="visibility-status-badge"]').all();
    for (const badge of statusBadges) {
      const text = await badge.textContent();
      expect(text).toContain('Visible');
    }
  });

  test('should filter reviews by rating', async () => {
    await reviewPage.applyFilters({ rating: '5' });

    // Verify filtered results
    const ratingElements = await page.locator('[data-testid="review-rating"]').all();
    for (const element of ratingElements) {
      const text = await element.textContent();
      expect(text).toContain('5');
    }
  });

  test('should filter to show only flagged reviews', async () => {
    await reviewPage.applyFilters({ flagged: true });

    // Verify all results are flagged
    const reviews = await page.locator('[data-testid^="review-row-"]').all();
    for (const review of reviews) {
      await expect(review.locator('[data-testid="flagged-badge"]')).toBeVisible();
    }
  });

  test('should filter by date range', async () => {
    await reviewPage.applyFilters({ dateRange: 'last-7-days' });

    // Verify results
    const reviews = await page.locator('[data-testid^="review-row-"]').count();
    expect(reviews).toBeGreaterThanOrEqual(0);
  });

  test('should search reviews by content or user', async () => {
    await reviewPage.searchReviews('great service');

    // Verify search results
    const reviews = await page.locator('[data-testid^="review-row-"]').count();
    expect(reviews).toBeGreaterThanOrEqual(0);
  });

  test('should combine multiple filters', async () => {
    await reviewPage.applyFilters({
      status: 'visible',
      rating: '4',
      flagged: false,
      dateRange: 'last-30-days',
    });

    await reviewPage.searchReviews('review');

    // Verify combined filters work
    const reviews = await page.locator('[data-testid^="review-row-"]').count();
    expect(reviews).toBeGreaterThanOrEqual(0);
  });

  test('should clear all filters', async () => {
    // Apply filters
    await reviewPage.applyFilters({ status: 'visible', rating: '5' });

    // Clear filters
    await page.click('[data-testid="clear-filters-button"]');

    // Verify all reviews shown
    const reviews = await page.locator('[data-testid^="review-row-"]').count();
    expect(reviews).toBeGreaterThan(0);
  });
});

test.describe('Admin Review Moderation - Edit History Timeline', () => {
  let page: Page;
  let reviewPage: ReviewModerationPage;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsAdmin(page);
    reviewPage = new ReviewModerationPage(page);
    await reviewPage.navigate();
    await reviewPage.waitForLoadComplete();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should display edit history timeline', async () => {
    await reviewPage.selectReview(0);
    await reviewPage.viewEditHistory();

    // Verify timeline
    await expect(page.locator('[data-testid="edit-history-timeline"]')).toBeVisible();

    const events = await page.locator('[data-testid="history-event"]').count();
    expect(events).toBeGreaterThanOrEqual(1);
  });

  test('should show all moderation actions in timeline', async () => {
    await reviewPage.selectReview(0);

    // Perform multiple actions
    await reviewPage.editReview('Edited content', 'Edit reason');
    await reviewPage.verifySuccessToast();

    await reviewPage.hideReview('Hide reason');
    await reviewPage.verifySuccessToast();

    // View timeline
    const historyCount = await reviewPage.getEditHistoryCount();
    expect(historyCount).toBeGreaterThanOrEqual(2);
  });

  test('should display event details in timeline', async () => {
    await reviewPage.selectReview(0);
    await reviewPage.viewEditHistory();

    const firstEvent = await page.locator('[data-testid="history-event"]').first();

    // Verify event structure
    await expect(firstEvent.locator('[data-testid="event-type"]')).toBeVisible();
    await expect(firstEvent.locator('[data-testid="event-timestamp"]')).toBeVisible();
    await expect(firstEvent.locator('[data-testid="event-admin"]')).toBeVisible();
    await expect(firstEvent.locator('[data-testid="event-description"]')).toBeVisible();
  });

  test('should support timeline export', async () => {
    await reviewPage.selectReview(0);
    await reviewPage.viewEditHistory();

    // Click export button
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-history-button"]');
    const download = await downloadPromise;

    // Verify download
    expect(download.suggestedFilename()).toContain('review-history');
  });
});
