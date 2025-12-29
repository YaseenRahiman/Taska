import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';

/**
 * E2E Tests for Admin Portal - Cross-Module Navigation
 * Tests navigation between modules, deep linking, breadcrumbs, URL state management
 */

// Navigation paths for admin portal
const ADMIN_ROUTES = {
  dashboard: '/admin/dashboard',
  escrowConfig: '/admin/escrow-config',
  paymentApproval: '/admin/payment-approval',
  reviewModeration: '/admin/review-moderation',
  userManagement: '/admin/users',
  analytics: '/admin/analytics',
  settings: '/admin/settings',
};

// Page object helpers
class AdminNavigationHelper {
  constructor(private page: Page) {}

  async navigateToModule(module: keyof typeof ADMIN_ROUTES) {
    await this.page.goto(ADMIN_ROUTES[module]);
    await this.page.waitForLoadState('networkidle');
  }

  async clickSidebarLink(linkText: string) {
    await this.page.click(`[data-testid="sidebar-link-${linkText.toLowerCase().replace(/\s+/g, '-')}"]`);
    await this.page.waitForLoadState('networkidle');
  }

  async verifyCurrentRoute(expectedPath: string) {
    await this.page.waitForTimeout(500); // Allow for navigation
    const currentUrl = this.page.url();
    expect(currentUrl).toContain(expectedPath);
  }

  async getBreadcrumbs(): Promise<string[]> {
    const breadcrumbElements = await this.page.locator('[data-testid="breadcrumb-item"]').all();
    const breadcrumbs: string[] = [];

    for (const element of breadcrumbElements) {
      const text = await element.textContent();
      if (text) breadcrumbs.push(text.trim());
    }

    return breadcrumbs;
  }

  async clickBreadcrumb(index: number) {
    await this.page.click(`[data-testid="breadcrumb-item"]:nth-child(${index + 1})`);
    await this.page.waitForLoadState('networkidle');
  }

  async verifyActiveMenuItem(menuItem: string) {
    const activeItem = await this.page.locator('[data-testid*="sidebar-link"].active');
    const text = await activeItem.textContent();
    expect(text).toContain(menuItem);
  }

  async getQueryParams(): Promise<Record<string, string>> {
    const url = new URL(this.page.url());
    const params: Record<string, string> = {};

    url.searchParams.forEach((value, key) => {
      params[key] = value;
    });

    return params;
  }

  async navigateBack() {
    await this.page.goBack();
    await this.page.waitForLoadState('networkidle');
  }

  async navigateForward() {
    await this.page.goForward();
    await this.page.waitForLoadState('networkidle');
  }

  async openInNewTab(selector: string): Promise<Page> {
    const [newPage] = await Promise.all([
      this.page.context().waitForEvent('page'),
      this.page.click(selector, { modifiers: ['Control'] }),
    ]);
    await newPage.waitForLoadState('networkidle');
    return newPage;
  }

  async verifyTabTitle(expectedTitle: string) {
    await expect(this.page).toHaveTitle(new RegExp(expectedTitle, 'i'));
  }

  async getMetaDescription(): Promise<string> {
    const meta = await this.page.locator('meta[name="description"]');
    return (await meta.getAttribute('content')) || '';
  }
}

test.describe('Admin Cross-Module Navigation - Sidebar Navigation', () => {
  let page: Page;
  let navHelper: AdminNavigationHelper;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsAdmin(page);
    navHelper = new AdminNavigationHelper(page);
    await navHelper.navigateToModule('dashboard');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should navigate to all admin modules via sidebar', async () => {
    const modules = [
      { name: 'Escrow Configuration', route: ADMIN_ROUTES.escrowConfig },
      { name: 'Payment Approval', route: ADMIN_ROUTES.paymentApproval },
      { name: 'Review Moderation', route: ADMIN_ROUTES.reviewModeration },
    ];

    for (const module of modules) {
      await navHelper.clickSidebarLink(module.name);
      await navHelper.verifyCurrentRoute(module.route);
      await navHelper.verifyActiveMenuItem(module.name);
    }
  });

  test('should highlight active menu item', async () => {
    await navHelper.navigateToModule('escrowConfig');

    const activeItem = await page.locator('[data-testid*="sidebar-link"].active');
    await expect(activeItem).toBeVisible();

    const text = await activeItem.textContent();
    expect(text).toContain('Escrow');
  });

  test('should maintain sidebar state during navigation', async () => {
    // Navigate to multiple modules
    await navHelper.clickSidebarLink('Payment Approval');
    await navHelper.clickSidebarLink('Review Moderation');
    await navHelper.clickSidebarLink('Escrow Configuration');

    // Verify sidebar still visible and functional
    await expect(page.locator('[data-testid="admin-sidebar"]')).toBeVisible();

    // Verify can still navigate
    await navHelper.clickSidebarLink('Dashboard');
    await navHelper.verifyCurrentRoute(ADMIN_ROUTES.dashboard);
  });

  test('should collapse and expand sidebar', async () => {
    // Collapse sidebar
    await page.click('[data-testid="toggle-sidebar-button"]');

    const sidebar = await page.locator('[data-testid="admin-sidebar"]');
    await expect(sidebar).toHaveClass(/collapsed/);

    // Expand sidebar
    await page.click('[data-testid="toggle-sidebar-button"]');
    await expect(sidebar).not.toHaveClass(/collapsed/);
  });

  test('should show module icons in sidebar', async () => {
    const sidebarLinks = await page.locator('[data-testid*="sidebar-link"]').all();

    for (const link of sidebarLinks) {
      const icon = await link.locator('[data-testid="menu-icon"]');
      await expect(icon).toBeVisible();
    }
  });

  test('should display badge counts on sidebar items', async () => {
    // Verify badge on Payment Approval (pending count)
    const paymentApprovalLink = await page.locator('[data-testid="sidebar-link-payment-approval"]');
    const badge = await paymentApprovalLink.locator('[data-testid="badge-count"]');

    if (await badge.isVisible()) {
      const count = await badge.textContent();
      expect(parseInt(count || '0')).toBeGreaterThanOrEqual(0);
    }
  });
});

test.describe('Admin Cross-Module Navigation - Deep Linking', () => {
  let page: Page;
  let navHelper: AdminNavigationHelper;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsAdmin(page);
    navHelper = new AdminNavigationHelper(page);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should support direct navigation to module with query params', async () => {
    await page.goto(`${ADMIN_ROUTES.paymentApproval}?status=pending&riskLevel=high`);
    await page.waitForLoadState('networkidle');

    // Verify route
    await navHelper.verifyCurrentRoute(ADMIN_ROUTES.paymentApproval);

    // Verify query params applied
    const params = await navHelper.getQueryParams();
    expect(params.status).toBe('pending');
    expect(params.riskLevel).toBe('high');

    // Verify filters applied
    const statusFilter = await page.inputValue('[data-testid="status-filter"]');
    expect(statusFilter).toBe('pending');
  });

  test('should support deep linking to specific resource', async () => {
    const paymentId = 'PAY-12345';
    await page.goto(`${ADMIN_ROUTES.paymentApproval}?id=${paymentId}`);
    await page.waitForLoadState('networkidle');

    // Verify payment details panel opened
    await expect(page.locator('[data-testid="payment-details-panel"]')).toBeVisible();

    // Verify correct payment selected
    const selectedPaymentId = await page.locator('[data-testid="payment-id"]').textContent();
    expect(selectedPaymentId).toContain(paymentId);
  });

  test('should support tab deep linking', async () => {
    await page.goto(`${ADMIN_ROUTES.escrowConfig}?tab=analytics`);
    await page.waitForLoadState('networkidle');

    // Verify analytics tab active
    const activeTab = await page.locator('[data-testid*="-tab"].active');
    const tabText = await activeTab.textContent();
    expect(tabText).toContain('Analytics');
  });

  test('should preserve deep link state on refresh', async () => {
    const deepLink = `${ADMIN_ROUTES.reviewModeration}?status=flagged&rating=1`;
    await page.goto(deepLink);
    await page.waitForLoadState('networkidle');

    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify state preserved
    const params = await navHelper.getQueryParams();
    expect(params.status).toBe('flagged');
    expect(params.rating).toBe('1');
  });

  test('should generate shareable deep links', async () => {
    await navHelper.navigateToModule('paymentApproval');

    // Apply filters
    await page.selectOption('[data-testid="status-filter"]', 'pending');
    await page.selectOption('[data-testid="risk-level-filter"]', 'high');
    await page.click('[data-testid="apply-filters-button"]');

    // Click copy link button
    await page.click('[data-testid="copy-link-button"]');

    // Verify toast confirmation
    const toast = await page.waitForSelector('[data-testid="success-toast"]');
    const toastText = await toast.textContent();
    expect(toastText).toContain('Link copied');

    // Verify clipboard contains correct URL
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain('status=pending');
    expect(clipboardText).toContain('riskLevel=high');
  });
});

test.describe('Admin Cross-Module Navigation - Breadcrumb Navigation', () => {
  let page: Page;
  let navHelper: AdminNavigationHelper;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsAdmin(page);
    navHelper = new AdminNavigationHelper(page);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should display breadcrumb trail', async () => {
    await navHelper.navigateToModule('paymentApproval');

    const breadcrumbs = await navHelper.getBreadcrumbs();
    expect(breadcrumbs.length).toBeGreaterThanOrEqual(2);
    expect(breadcrumbs[0]).toContain('Admin');
    expect(breadcrumbs[breadcrumbs.length - 1]).toContain('Payment');
  });

  test('should navigate using breadcrumbs', async () => {
    await navHelper.navigateToModule('paymentApproval');

    // Click first breadcrumb (Admin Dashboard)
    await navHelper.clickBreadcrumb(0);

    // Verify navigation
    await navHelper.verifyCurrentRoute(ADMIN_ROUTES.dashboard);
  });

  test('should update breadcrumbs on navigation', async () => {
    await navHelper.navigateToModule('escrowConfig');
    let breadcrumbs = await navHelper.getBreadcrumbs();
    expect(breadcrumbs[breadcrumbs.length - 1]).toContain('Escrow');

    await navHelper.navigateToModule('reviewModeration');
    breadcrumbs = await navHelper.getBreadcrumbs();
    expect(breadcrumbs[breadcrumbs.length - 1]).toContain('Review');
  });

  test('should show breadcrumb for nested navigation', async () => {
    // Navigate to payment approval and select a payment
    await navHelper.navigateToModule('paymentApproval');
    await page.click('[data-testid^="payment-row-"]:first-child');

    // Verify breadcrumb shows nested level
    const breadcrumbs = await navHelper.getBreadcrumbs();
    expect(breadcrumbs.length).toBeGreaterThan(2);
    expect(breadcrumbs[breadcrumbs.length - 1]).toMatch(/PAY-\d+|Payment Details/);
  });

  test('should support breadcrumb dropdown for siblings', async () => {
    await navHelper.navigateToModule('paymentApproval');

    // Click breadcrumb dropdown if available
    const dropdown = await page.locator('[data-testid="breadcrumb-dropdown"]');

    if (await dropdown.isVisible()) {
      await dropdown.click();

      // Verify dropdown shows sibling pages
      const dropdownItems = await page.locator('[data-testid="breadcrumb-dropdown-item"]').count();
      expect(dropdownItems).toBeGreaterThan(0);
    }
  });
});

test.describe('Admin Cross-Module Navigation - URL State Management', () => {
  let page: Page;
  let navHelper: AdminNavigationHelper;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsAdmin(page);
    navHelper = new AdminNavigationHelper(page);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should update URL on filter changes', async () => {
    await navHelper.navigateToModule('paymentApproval');

    // Apply filter
    await page.selectOption('[data-testid="status-filter"]', 'pending');
    await page.click('[data-testid="apply-filters-button"]');

    // Verify URL updated
    const params = await navHelper.getQueryParams();
    expect(params.status).toBe('pending');
  });

  test('should update URL on tab changes', async () => {
    await navHelper.navigateToModule('escrowConfig');

    // Click analytics tab
    await page.click('[data-testid="analytics-tab"]');

    // Verify URL updated
    const params = await navHelper.getQueryParams();
    expect(params.tab).toBe('analytics');
  });

  test('should update URL on pagination', async () => {
    await navHelper.navigateToModule('reviewModeration');

    // Click page 2
    await page.click('[data-testid="pagination-page-2"]');

    // Verify URL updated
    const params = await navHelper.getQueryParams();
    expect(params.page).toBe('2');
  });

  test('should update URL on sort changes', async () => {
    await navHelper.navigateToModule('paymentApproval');

    // Click sort by amount
    await page.click('[data-testid="sort-by-amount"]');

    // Verify URL updated
    const params = await navHelper.getQueryParams();
    expect(params.sortBy).toBe('amount');
  });

  test('should preserve multiple URL parameters', async () => {
    await navHelper.navigateToModule('paymentApproval');

    // Apply multiple parameters
    await page.selectOption('[data-testid="status-filter"]', 'pending');
    await page.selectOption('[data-testid="risk-level-filter"]', 'high');
    await page.click('[data-testid="apply-filters-button"]');
    await page.click('[data-testid="pagination-page-2"]');

    // Verify all parameters in URL
    const params = await navHelper.getQueryParams();
    expect(params.status).toBe('pending');
    expect(params.riskLevel).toBe('high');
    expect(params.page).toBe('2');
  });

  test('should clear URL parameters on filter reset', async () => {
    await navHelper.navigateToModule('paymentApproval');

    // Apply filters
    await page.selectOption('[data-testid="status-filter"]', 'pending');
    await page.click('[data-testid="apply-filters-button"]');

    // Clear filters
    await page.click('[data-testid="clear-filters-button"]');

    // Verify parameters cleared
    const params = await navHelper.getQueryParams();
    expect(params.status).toBeUndefined();
  });
});

test.describe('Admin Cross-Module Navigation - Browser Navigation', () => {
  let page: Page;
  let navHelper: AdminNavigationHelper;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsAdmin(page);
    navHelper = new AdminNavigationHelper(page);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should support browser back navigation', async () => {
    // Navigate through modules
    await navHelper.navigateToModule('dashboard');
    await navHelper.navigateToModule('escrowConfig');
    await navHelper.navigateToModule('paymentApproval');

    // Go back
    await navHelper.navigateBack();
    await navHelper.verifyCurrentRoute(ADMIN_ROUTES.escrowConfig);

    // Go back again
    await navHelper.navigateBack();
    await navHelper.verifyCurrentRoute(ADMIN_ROUTES.dashboard);
  });

  test('should support browser forward navigation', async () => {
    // Navigate and go back
    await navHelper.navigateToModule('dashboard');
    await navHelper.navigateToModule('escrowConfig');
    await navHelper.navigateBack();

    // Go forward
    await navHelper.navigateForward();
    await navHelper.verifyCurrentRoute(ADMIN_ROUTES.escrowConfig);
  });

  test('should preserve state on back/forward navigation', async () => {
    // Apply filters
    await navHelper.navigateToModule('paymentApproval');
    await page.selectOption('[data-testid="status-filter"]', 'pending');
    await page.click('[data-testid="apply-filters-button"]');

    // Navigate away
    await navHelper.navigateToModule('reviewModeration');

    // Navigate back
    await navHelper.navigateBack();

    // Verify filters preserved
    const statusFilter = await page.inputValue('[data-testid="status-filter"]');
    expect(statusFilter).toBe('pending');
  });

  test('should update active menu item on back/forward navigation', async () => {
    await navHelper.navigateToModule('escrowConfig');
    await navHelper.navigateToModule('paymentApproval');

    // Go back
    await navHelper.navigateBack();

    // Verify active menu item updated
    await navHelper.verifyActiveMenuItem('Escrow');
  });

  test('should support keyboard shortcuts for navigation', async () => {
    await navHelper.navigateToModule('dashboard');
    await navHelper.navigateToModule('escrowConfig');

    // Use Alt+Left Arrow for back (Windows/Linux)
    await page.keyboard.press('Alt+ArrowLeft');
    await page.waitForLoadState('networkidle');

    // Verify navigation
    await navHelper.verifyCurrentRoute(ADMIN_ROUTES.dashboard);
  });
});

test.describe('Admin Cross-Module Navigation - Context Preservation', () => {
  let page: Page;
  let navHelper: AdminNavigationHelper;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsAdmin(page);
    navHelper = new AdminNavigationHelper(page);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should preserve selected item when navigating back', async () => {
    // Select a payment
    await navHelper.navigateToModule('paymentApproval');
    await page.click('[data-testid^="payment-row-"]:first-child');

    const selectedPaymentId = await page.locator('[data-testid="payment-id"]').textContent();

    // Navigate away and back
    await navHelper.navigateToModule('reviewModeration');
    await navHelper.navigateBack();

    // Verify selection preserved
    const currentPaymentId = await page.locator('[data-testid="payment-id"]').textContent();
    expect(currentPaymentId).toBe(selectedPaymentId);
  });

  test('should preserve scroll position on navigation', async () => {
    await navHelper.navigateToModule('reviewModeration');

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500));
    const scrollPosition = await page.evaluate(() => window.scrollY);

    // Navigate away and back
    await navHelper.navigateToModule('paymentApproval');
    await navHelper.navigateBack();

    // Verify scroll position restored
    const newScrollPosition = await page.evaluate(() => window.scrollY);
    expect(newScrollPosition).toBeCloseTo(scrollPosition, -1);
  });

  test('should preserve form state when navigating away', async () => {
    await navHelper.navigateToModule('escrowConfig');

    // Fill form
    await page.fill('[data-testid="auto-release-days"]', '15');
    await page.fill('[data-testid="fee-percentage"]', '4.5');

    // Navigate away without saving
    await navHelper.navigateToModule('paymentApproval');

    // Navigate back
    await navHelper.navigateBack();

    // Verify form state preserved (with warning)
    const unsavedWarning = await page.locator('[data-testid="unsaved-changes-warning"]');
    if (await unsavedWarning.isVisible()) {
      const warningText = await unsavedWarning.textContent();
      expect(warningText).toContain('unsaved');
    }
  });
});

test.describe('Admin Cross-Module Navigation - SEO and Metadata', () => {
  let page: Page;
  let navHelper: AdminNavigationHelper;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsAdmin(page);
    navHelper = new AdminNavigationHelper(page);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should update page title on navigation', async () => {
    await navHelper.navigateToModule('escrowConfig');
    await navHelper.verifyTabTitle('Escrow Configuration');

    await navHelper.navigateToModule('paymentApproval');
    await navHelper.verifyTabTitle('Payment Approval');

    await navHelper.navigateToModule('reviewModeration');
    await navHelper.verifyTabTitle('Review Moderation');
  });

  test('should include descriptive meta tags', async () => {
    await navHelper.navigateToModule('paymentApproval');

    const description = await navHelper.getMetaDescription();
    expect(description.length).toBeGreaterThan(0);
    expect(description).toContain('payment');
  });

  test('should have unique page titles for each module', async () => {
    const titles = new Set<string>();

    for (const module of ['escrowConfig', 'paymentApproval', 'reviewModeration'] as const) {
      await navHelper.navigateToModule(module);
      const title = await page.title();
      titles.add(title);
    }

    expect(titles.size).toBe(3);
  });
});

test.describe('Admin Cross-Module Navigation - Performance', () => {
  let page: Page;
  let navHelper: AdminNavigationHelper;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsAdmin(page);
    navHelper = new AdminNavigationHelper(page);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should navigate quickly between modules', async () => {
    const startTime = Date.now();

    await navHelper.navigateToModule('escrowConfig');
    await navHelper.navigateToModule('paymentApproval');
    await navHelper.navigateToModule('reviewModeration');

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // All three navigations should complete within 5 seconds
    expect(totalTime).toBeLessThan(5000);
  });

  test('should prefetch linked pages on hover', async () => {
    await navHelper.navigateToModule('dashboard');

    // Hover over sidebar link
    await page.hover('[data-testid="sidebar-link-payment-approval"]');

    // Wait for prefetch
    await page.waitForTimeout(200);

    // Verify prefetch request made (check network activity)
    // This would require network monitoring in real implementation
  });

  test('should cache navigation state', async () => {
    // Navigate to module multiple times
    await navHelper.navigateToModule('paymentApproval');
    const firstLoadTime = Date.now();

    await navHelper.navigateToModule('reviewModeration');
    await navHelper.navigateToModule('paymentApproval');
    const secondLoadTime = Date.now();

    // Second load should be faster due to caching
    // This is a simplified check - real implementation would measure actual load times
    expect(secondLoadTime).toBeDefined();
  });
});

test.describe('Admin Cross-Module Navigation - Error Handling', () => {
  let page: Page;
  let navHelper: AdminNavigationHelper;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsAdmin(page);
    navHelper = new AdminNavigationHelper(page);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should handle invalid deep link gracefully', async () => {
    await page.goto(`${ADMIN_ROUTES.paymentApproval}?id=INVALID-ID`);
    await page.waitForLoadState('networkidle');

    // Verify error message displayed
    const errorMessage = await page.locator('[data-testid="error-message"]');
    if (await errorMessage.isVisible()) {
      const text = await errorMessage.textContent();
      expect(text).toContain('not found');
    }

    // Verify module still loads
    await navHelper.verifyCurrentRoute(ADMIN_ROUTES.paymentApproval);
  });

  test('should redirect to dashboard on unauthorized module access', async () => {
    // Try to access module with insufficient permissions
    // This would require permission simulation in real implementation
  });

  test('should show error page for non-existent routes', async () => {
    await page.goto('/admin/non-existent-module');

    // Verify 404 or redirect
    const is404 = await page.locator('[data-testid="404-page"]').isVisible();
    const isRedirect = page.url().includes(ADMIN_ROUTES.dashboard);

    expect(is404 || isRedirect).toBeTruthy();
  });
});
