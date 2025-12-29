import { test, expect, Page } from '@playwright/test';

/**
 * Comprehensive E2E Tests for Admin Portal Sprint 1
 *
 * Coverage:
 * - Authentication and Authorization
 * - Dashboard Analytics
 * - User Management
 * - Financial Management
 * - Content Moderation
 * - System Settings
 *
 * Test Credentials:
 * Admin: admin@taska.com / Admin@123456
 */

test.describe('Admin Portal - Authentication & Authorization', () => {
  test('should redirect non-admin users from admin routes', async ({ page }) => {
    // Login as client
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'client@taska.com');
    await page.fill('input[name="password"]', 'Client@123456');
    await page.click('button[type="submit"]');

    await page.waitForURL('/client/dashboard');

    // Try to access admin dashboard
    await page.goto('/admin/dashboard');

    // Should redirect back to client dashboard
    await expect(page).toHaveURL('/client/dashboard');
  });

  test('should allow admin users to access admin portal', async ({ page }) => {
    // Login as admin
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'admin@taska.com');
    await page.fill('input[name="password"]', 'Admin@123456');
    await page.click('button[type="submit"]');

    // Wait for admin dashboard
    await page.waitForURL('/admin/dashboard');

    // Verify admin portal is accessible
    await expect(page.locator('text=Admin Control Panel')).toBeVisible();
    await expect(page.locator('text=Admin Dashboard')).toBeVisible();
  });

  test('should show admin sidebar navigation', async ({ page }) => {
    // Login as admin
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'admin@taska.com');
    await page.fill('input[name="password"]', 'Admin@123456');
    await page.click('button[type="submit"]');

    await page.waitForURL('/admin/dashboard');

    // Verify all navigation items are present
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=User Management')).toBeVisible();
    await expect(page.locator('text=Financial')).toBeVisible();
    await expect(page.locator('text=Moderation')).toBeVisible();
    await expect(page.locator('text=Settings')).toBeVisible();
  });
});

test.describe('Admin Portal - Dashboard Analytics', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'admin@taska.com');
    await page.fill('input[name="password"]', 'Admin@123456');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');
  });

  test('should display key platform metrics', async ({ page }) => {
    // Check for metric cards
    await expect(page.locator('text=Total Users')).toBeVisible();
    await expect(page.locator('text=Total Jobs')).toBeVisible();
    await expect(page.locator('text=Monthly Revenue')).toBeVisible();
    await expect(page.locator('text=Conversion Rate')).toBeVisible();
  });

  test('should show system health status', async ({ page }) => {
    // Check for system health section
    await expect(page.locator('text=System Health')).toBeVisible();
    await expect(page.locator('text=Database')).toBeVisible();
    await expect(page.locator('text=Cache (Redis)')).toBeVisible();
    await expect(page.locator('text=Storage')).toBeVisible();
    await expect(page.locator('text=Payment Gateway')).toBeVisible();
  });

  test('should display recent activity feed', async ({ page }) => {
    // Check for recent activity section
    await expect(page.locator('text=Recent Activity')).toBeVisible();
  });

  test('should allow refreshing dashboard metrics', async ({ page }) => {
    // Click refresh button
    const refreshButton = page.locator('button:has-text("Refresh")').first();
    await refreshButton.click();

    // Wait for refresh animation
    await page.waitForTimeout(500);

    // Verify data is still displayed
    await expect(page.locator('text=Total Users')).toBeVisible();
  });

  test('should show quick action buttons', async ({ page }) => {
    // Verify quick action buttons
    await expect(page.locator('button:has-text("Manage Users")')).toBeVisible();
    await expect(page.locator('button:has-text("Moderation")')).toBeVisible();
    await expect(page.locator('button:has-text("Financial")')).toBeVisible();
    await expect(page.locator('button:has-text("Settings")')).toBeVisible();
  });
});

test.describe('Admin Portal - User Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin and navigate to user management
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'admin@taska.com');
    await page.fill('input[name="password"]', 'Admin@123456');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');

    await page.click('a[href="/admin/users"]');
    await page.waitForURL('/admin/users');
  });

  test('should display user list with filters', async ({ page }) => {
    // Verify page loaded
    await expect(page.locator('text=User Management')).toBeVisible();

    // Verify filter controls
    await page.click('button:has-text("Filters")');
    await expect(page.locator('select[name="role"]')).toBeVisible();
    await expect(page.locator('select[name="status"]')).toBeVisible();
  });

  test('should filter users by role', async ({ page }) => {
    // Open filters
    await page.click('button:has-text("Filters")');

    // Select ARTISAN role
    await page.selectOption('select', 'ARTISAN');

    // Wait for filtered results
    await page.waitForTimeout(1000);

    // Verify users are displayed
    await expect(page.locator('table')).toBeVisible();
  });

  test('should search users by email or name', async ({ page }) => {
    // Open filters
    await page.click('button:has-text("Filters")');

    // Enter search term
    await page.fill('input[placeholder*="Email or name"]', 'client');

    // Wait for search results
    await page.waitForTimeout(1000);
  });

  test('should display user details modal', async ({ page }) => {
    // Click on first user's view button
    const viewButton = page.locator('button[aria-label="View user"]').first();
    if (await viewButton.isVisible()) {
      await viewButton.click();

      // Verify modal is visible
      await expect(page.locator('text=User Details')).toBeVisible();
    }
  });

  test('should have pagination controls', async ({ page }) => {
    // Verify pagination exists
    const paginationArea = page.locator('text=Showing');
    await expect(paginationArea).toBeVisible();

    // Check for next/previous buttons
    await expect(page.locator('button:has-text("Previous")')).toBeVisible();
    await expect(page.locator('button:has-text("Next")')).toBeVisible();
  });
});

test.describe('Admin Portal - Financial Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin and navigate to financial management
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'admin@taska.com');
    await page.fill('input[name="password"]', 'Admin@123456');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');

    await page.click('a[href="/admin/financial"]');
    await page.waitForURL('/admin/financial');
  });

  test('should display financial metrics', async ({ page }) => {
    // Verify page loaded
    await expect(page.locator('text=Financial Management')).toBeVisible();

    // Check for key financial metrics
    await expect(page.locator('text=Total Revenue')).toBeVisible();
    await expect(page.locator('text=Platform Fees')).toBeVisible();
    await expect(page.locator('text=Total Payouts')).toBeVisible();
    await expect(page.locator('text=Escrow Balance')).toBeVisible();
  });

  test('should show financial tabs', async ({ page }) => {
    // Verify tabs are present
    await expect(page.locator('button:has-text("Overview")')).toBeVisible();
    await expect(page.locator('button:has-text("Transactions")')).toBeVisible();
    await expect(page.locator('button:has-text("Reconciliation")')).toBeVisible();
  });

  test('should navigate between financial tabs', async ({ page }) => {
    // Click Transactions tab
    await page.click('button:has-text("Transactions")');
    await expect(page.locator('text=Recent Transactions')).toBeVisible();

    // Click Reconciliation tab
    await page.click('button:has-text("Reconciliation")');
    await expect(page.locator('text=Financial Reconciliation')).toBeVisible();

    // Click Overview tab
    await page.click('button:has-text("Overview")');
    await expect(page.locator('text=Revenue Trends')).toBeVisible();
  });

  test('should allow date range filtering', async ({ page }) => {
    // Verify date range inputs exist
    await expect(page.locator('input[type="date"]').first()).toBeVisible();
    await expect(page.locator('input[type="date"]').last()).toBeVisible();
  });

  test('should have export functionality', async ({ page }) => {
    // Verify export button exists
    await expect(page.locator('button:has-text("Export")')).toBeVisible();
  });
});

test.describe('Admin Portal - Content Moderation', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin and navigate to moderation
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'admin@taska.com');
    await page.fill('input[name="password"]', 'Admin@123456');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');

    await page.click('a[href="/admin/moderation"]');
    await page.waitForURL('/admin/moderation');
  });

  test('should display moderation tabs', async ({ page }) => {
    // Verify page loaded
    await expect(page.locator('text=Content Moderation')).toBeVisible();

    // Check for tabs
    await expect(page.locator('button:has-text("Reported Content")')).toBeVisible();
    await expect(page.locator('button:has-text("Disputes")')).toBeVisible();
  });

  test('should filter reported content by type', async ({ page }) => {
    // Open filters
    await page.click('button:has-text("Filters")');

    // Verify content type filter exists
    await expect(page.locator('select[name="contentType"]')).toBeVisible();

    // Select Jobs
    await page.selectOption('select[name="contentType"]', 'JOB');
    await page.waitForTimeout(1000);
  });

  test('should navigate to disputes tab', async ({ page }) => {
    // Click Disputes tab
    await page.click('button:has-text("Disputes")');

    // Verify disputes content is visible
    await expect(page.locator('text=Disputes')).toBeVisible();
  });

  test('should have moderation action buttons', async ({ page }) => {
    // Check if any reported content exists
    const contentItems = page.locator('[data-testid="reported-content-item"]');
    const count = await contentItems.count();

    if (count > 0) {
      // Verify action buttons exist
      await expect(page.locator('button[aria-label="View content"]').first()).toBeVisible();
    }
  });
});

test.describe('Admin Portal - System Settings', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin and navigate to settings
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'admin@taska.com');
    await page.fill('input[name="password"]', 'Admin@123456');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');

    await page.click('a[href="/admin/settings"]');
    await page.waitForURL('/admin/settings');
  });

  test('should display settings tabs', async ({ page }) => {
    // Verify page loaded
    await expect(page.locator('text=System Settings')).toBeVisible();

    // Check for tabs
    await expect(page.locator('button:has-text("General Settings")')).toBeVisible();
    await expect(page.locator('button:has-text("Email Templates")')).toBeVisible();
    await expect(page.locator('button:has-text("Feature Flags")')).toBeVisible();
    await expect(page.locator('button:has-text("Announcements")')).toBeVisible();
  });

  test('should show platform configuration settings', async ({ page }) => {
    // Verify general settings are visible
    await expect(page.locator('text=Platform Configuration')).toBeVisible();
    await expect(page.locator('text=Security Settings')).toBeVisible();
    await expect(page.locator('text=Content Settings')).toBeVisible();
    await expect(page.locator('text=Notification Settings')).toBeVisible();
  });

  test('should navigate to email templates tab', async ({ page }) => {
    // Click Email Templates tab
    await page.click('button:has-text("Email Templates")');

    // Verify email templates content
    await expect(page.locator('text=Email Templates')).toBeVisible();
    await expect(page.locator('text=Welcome Email')).toBeVisible();
  });

  test('should navigate to feature flags tab', async ({ page }) => {
    // Click Feature Flags tab
    await page.click('button:has-text("Feature Flags")');

    // Verify feature flags content
    await expect(page.locator('text=Feature Flags')).toBeVisible();
    await expect(page.locator('text=Enable or disable platform features')).toBeVisible();
  });

  test('should navigate to announcements tab', async ({ page }) => {
    // Click Announcements tab
    await page.click('button:has-text("Announcements")');

    // Verify announcements content
    await expect(page.locator('text=Create System Announcement')).toBeVisible();
    await expect(page.locator('input[placeholder="Announcement title"]')).toBeVisible();
  });
});

test.describe('Admin Portal - Navigation & Layout', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'admin@taska.com');
    await page.fill('input[name="password"]', 'Admin@123456');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');
  });

  test('should navigate between all admin sections', async ({ page }) => {
    // Navigate to Users
    await page.click('a[href="/admin/users"]');
    await page.waitForURL('/admin/users');
    await expect(page.locator('text=User Management')).toBeVisible();

    // Navigate to Financial
    await page.click('a[href="/admin/financial"]');
    await page.waitForURL('/admin/financial');
    await expect(page.locator('text=Financial Management')).toBeVisible();

    // Navigate to Moderation
    await page.click('a[href="/admin/moderation"]');
    await page.waitForURL('/admin/moderation');
    await expect(page.locator('text=Content Moderation')).toBeVisible();

    // Navigate to Settings
    await page.click('a[href="/admin/settings"]');
    await page.waitForURL('/admin/settings');
    await expect(page.locator('text=System Settings')).toBeVisible();

    // Navigate back to Dashboard
    await page.click('a[href="/admin/dashboard"]');
    await page.waitForURL('/admin/dashboard');
    await expect(page.locator('text=Admin Dashboard')).toBeVisible();
  });

  test('should highlight active navigation item', async ({ page }) => {
    // Click Users navigation
    await page.click('a[href="/admin/users"]');
    await page.waitForURL('/admin/users');

    // Verify active state
    const usersNav = page.locator('a[href="/admin/users"]');
    await expect(usersNav).toHaveClass(/bg-blue-50/);
  });

  test('should display admin info in sidebar', async ({ page }) => {
    // Verify admin user info is displayed
    await expect(page.locator('text=Admin')).toBeVisible();
    await expect(page.locator('text=admin@taska.com')).toBeVisible();
  });

  test('should have logout functionality', async ({ page }) => {
    // Click logout button
    await page.click('button:has-text("Logout")');

    // Verify redirected to login
    await page.waitForURL('/auth/login');
    await expect(page.locator('text=Login')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify mobile menu button is visible
    await expect(page.locator('button[aria-label="Open menu"]')).toBeVisible();

    // Click to open mobile menu
    await page.click('button[aria-label="Open menu"]');

    // Verify navigation is visible
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });
});

test.describe('Admin Portal - Security & Performance', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'admin@taska.com');
    await page.fill('input[name="password"]', 'Admin@123456');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');
  });

  test('should load dashboard within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    // Navigate to dashboard
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept API call and force error
    await page.route('**/api/admin/dashboard/metrics', route => {
      route.abort('failed');
    });

    // Reload page
    await page.reload();

    // Should show error state
    await expect(page.locator('text=Error Loading Dashboard')).toBeVisible();
  });

  test('should maintain session across page refreshes', async ({ page }) => {
    // Refresh page
    await page.reload();

    // Should still be on admin dashboard
    await expect(page).toHaveURL('/admin/dashboard');
    await expect(page.locator('text=Admin Dashboard')).toBeVisible();
  });
});
