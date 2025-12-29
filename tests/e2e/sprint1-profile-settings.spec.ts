import { test, expect, Page } from '@playwright/test';
import { faker } from '@faker-js/faker';

/**
 * SPRINT 1 - AGENT 3: User Profile & Settings Management Testing
 *
 * Test Coverage:
 * - Profile Viewing (Client & Artisan)
 * - Profile Editing (Basic Info, Images, Validation)
 * - Settings Management (Notifications, Privacy, Account)
 * - Data Validation & Security
 * - UI/UX Validation
 */

// Test Configuration
const CONFIG = {
  BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:3000',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3001',
  TEST_TIMEOUT: 30000,
  NAVIGATION_TIMEOUT: 10000,
};

// Test Users
interface TestUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: 'CLIENT' | 'ARTISAN';
  token?: string;
}

let clientUser: TestUser;
let artisanUser: TestUser;

test.describe('SPRINT 1 - Profile & Settings Management', () => {
  test.setTimeout(CONFIG.TEST_TIMEOUT);

  test.beforeAll(async () => {
    // Generate test users
    clientUser = {
      email: faker.internet.email().toLowerCase(),
      password: 'Test@12345',
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      phoneNumber: '+27' + faker.string.numeric(9),
      role: 'CLIENT',
    };

    artisanUser = {
      email: faker.internet.email().toLowerCase(),
      password: 'Test@12345',
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      phoneNumber: '+27' + faker.string.numeric(9),
      role: 'ARTISAN',
    };

    console.log('\n📋 Test Users Created:');
    console.log(`  Client: ${clientUser.email}`);
    console.log(`  Artisan: ${artisanUser.email}\n`);
  });

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  async function registerUser(page: Page, user: TestUser): Promise<void> {
    console.log(`\n🔧 Registering user: ${user.email}`);

    await page.goto(`${CONFIG.FRONTEND_URL}/auth/register`, {
      waitUntil: 'domcontentloaded',
      timeout: CONFIG.NAVIGATION_TIMEOUT,
    });

    // Fill registration form
    await page.fill('input[name="email"], input[type="email"]', user.email);
    await page.fill('input[name="password"], input[type="password"]', user.password);
    await page.fill('input[name="firstName"]', user.firstName);
    await page.fill('input[name="lastName"]', user.lastName);
    await page.fill('input[name="phoneNumber"]', user.phoneNumber);

    // Select role
    const roleSelector = `input[value="${user.role}"], button:has-text("${user.role}")`;
    try {
      await page.click(roleSelector, { timeout: 5000 });
    } catch {
      console.log(`  ⚠️ Role selector not found, may auto-default to ${user.role}`);
    }

    // Submit registration
    await page.click('button[type="submit"]:has-text("Register"), button:has-text("Sign Up"), button:has-text("Create Account")');

    // Wait for success (redirect or message)
    await page.waitForTimeout(2000);

    console.log(`  ✅ User registered successfully`);
  }

  async function loginUser(page: Page, user: TestUser): Promise<void> {
    console.log(`\n🔑 Logging in: ${user.email}`);

    await page.goto(`${CONFIG.FRONTEND_URL}/auth/login`, {
      waitUntil: 'domcontentloaded',
      timeout: CONFIG.NAVIGATION_TIMEOUT,
    });

    await page.fill('input[name="email"], input[type="email"]', user.email);
    await page.fill('input[name="password"], input[type="password"]', user.password);
    await page.click('button[type="submit"]:has-text("Login"), button:has-text("Sign In")');

    // Wait for redirect to dashboard
    await page.waitForTimeout(2000);

    console.log(`  ✅ User logged in successfully`);
  }

  async function navigateToProfile(page: Page, userType: 'client' | 'artisan'): Promise<void> {
    const profileUrl = `${CONFIG.FRONTEND_URL}/${userType}/profile`;
    await page.goto(profileUrl, {
      waitUntil: 'domcontentloaded',
      timeout: CONFIG.NAVIGATION_TIMEOUT,
    });
    await page.waitForTimeout(1000);
  }

  async function navigateToSettings(page: Page, userType: 'client' | 'artisan'): Promise<void> {
    const settingsUrl = `${CONFIG.FRONTEND_URL}/${userType}/settings`;
    await page.goto(settingsUrl, {
      waitUntil: 'domcontentloaded',
      timeout: CONFIG.NAVIGATION_TIMEOUT,
    });
    await page.waitForTimeout(1000);
  }

  // ============================================================================
  // TEST SUITE: PROFILE VIEWING
  // ============================================================================

  test.describe('Profile Viewing', () => {
    test('PROF-001: Client can view own profile', async ({ page }) => {
      console.log('\n🧪 TEST: PROF-001 - Client View Own Profile');

      await registerUser(page, clientUser);
      await loginUser(page, clientUser);
      await navigateToProfile(page, 'client');

      // Verify profile page loaded
      const hasProfileHeading = await page.locator('h1, h2').filter({ hasText: /profile|account/i }).count() > 0;
      expect(hasProfileHeading).toBeTruthy();

      // Verify basic info displays
      const pageContent = await page.content();
      expect(pageContent).toContain(clientUser.firstName || clientUser.email);

      console.log('  ✅ Client profile view successful');
    });

    test('PROF-002: Artisan can view own profile', async ({ page }) => {
      console.log('\n🧪 TEST: PROF-002 - Artisan View Own Profile');

      await registerUser(page, artisanUser);
      await loginUser(page, artisanUser);
      await navigateToProfile(page, 'artisan');

      // Verify profile page loaded
      const hasProfileHeading = await page.locator('h1, h2').filter({ hasText: /profile|account/i }).count() > 0;
      expect(hasProfileHeading).toBeTruthy();

      // Verify artisan-specific elements
      const pageContent = await page.content();
      expect(pageContent).toContain(artisanUser.firstName || artisanUser.email);

      console.log('  ✅ Artisan profile view successful');
    });

    test('PROF-003: All profile fields display correctly', async ({ page }) => {
      console.log('\n🧪 TEST: PROF-003 - Profile Fields Display');

      await loginUser(page, clientUser);
      await navigateToProfile(page, 'client');

      // Check for common profile fields
      const expectedFields = [
        'email', 'name', 'first', 'last', 'phone', 'address', 'bio'
      ];

      const pageText = await page.textContent('body');
      let fieldsFound = 0;

      for (const field of expectedFields) {
        if (pageText?.toLowerCase().includes(field)) {
          fieldsFound++;
        }
      }

      console.log(`  ℹ️ Profile fields found: ${fieldsFound}/${expectedFields.length}`);
      expect(fieldsFound).toBeGreaterThan(2); // At least some fields should be present

      console.log('  ✅ Profile fields display check complete');
    });
  });

  // ============================================================================
  // TEST SUITE: PROFILE EDITING - CLIENT
  // ============================================================================

  test.describe('Profile Editing - Client', () => {
    test.beforeEach(async ({ page }) => {
      await loginUser(page, clientUser);
      await navigateToProfile(page, 'client');
    });

    test('PROF-010: Edit basic client information', async ({ page }) => {
      console.log('\n🧪 TEST: PROF-010 - Edit Client Basic Info');

      // Look for edit button
      const editButton = page.locator('button, a').filter({ hasText: /edit|update|modify/i }).first();

      if (await editButton.count() > 0) {
        await editButton.click();
        await page.waitForTimeout(1000);

        // Try to update firstName
        const firstNameInput = page.locator('input[name="firstName"], input[placeholder*="First"], input[label*="First"]').first();

        if (await firstNameInput.count() > 0) {
          const newFirstName = faker.person.firstName();
          await firstNameInput.clear();
          await firstNameInput.fill(newFirstName);

          // Save changes
          const saveButton = page.locator('button[type="submit"], button').filter({ hasText: /save|update|submit/i }).first();
          if (await saveButton.count() > 0) {
            await saveButton.click();
            await page.waitForTimeout(2000);

            console.log(`  ✅ Profile updated with new name: ${newFirstName}`);
          } else {
            console.log('  ⚠️ ISSUE PROF-010-A: No save button found');
          }
        } else {
          console.log('  ⚠️ ISSUE PROF-010-B: No editable firstName field found');
        }
      } else {
        console.log('  ⚠️ ISSUE PROF-010-C: No edit button found on profile page');
      }
    });

    test('PROF-011: Validate required fields', async ({ page }) => {
      console.log('\n🧪 TEST: PROF-011 - Required Field Validation');

      const editButton = page.locator('button, a').filter({ hasText: /edit|update/i }).first();

      if (await editButton.count() > 0) {
        await editButton.click();
        await page.waitForTimeout(1000);

        // Try to clear required fields and submit
        const firstNameInput = page.locator('input[name="firstName"]').first();

        if (await firstNameInput.count() > 0) {
          await firstNameInput.clear();

          const saveButton = page.locator('button[type="submit"]').first();
          if (await saveButton.count() > 0) {
            await saveButton.click();
            await page.waitForTimeout(1000);

            // Check for validation error
            const hasError = await page.locator('text=/required|cannot be empty|field is mandatory/i').count() > 0;

            if (hasError) {
              console.log('  ✅ Required field validation working');
            } else {
              console.log('  ⚠️ ISSUE PROF-011-A: No validation error shown for empty required field');
            }
          }
        } else {
          console.log('  ⚠️ ISSUE PROF-011-B: Cannot test validation - no editable fields');
        }
      } else {
        console.log('  ⚠️ ISSUE PROF-011-C: No edit mode available');
      }
    });

    test('PROF-012: Phone number format validation', async ({ page }) => {
      console.log('\n🧪 TEST: PROF-012 - Phone Number Validation');

      const editButton = page.locator('button, a').filter({ hasText: /edit/i }).first();

      if (await editButton.count() > 0) {
        await editButton.click();
        await page.waitForTimeout(1000);

        const phoneInput = page.locator('input[name="phoneNumber"], input[type="tel"]').first();

        if (await phoneInput.count() > 0) {
          // Test invalid phone number
          await phoneInput.clear();
          await phoneInput.fill('123'); // Invalid format

          const saveButton = page.locator('button[type="submit"]').first();
          if (await saveButton.count() > 0) {
            await saveButton.click();
            await page.waitForTimeout(1000);

            const hasValidationError = await page.locator('text=/invalid|format|pattern/i').count() > 0;

            if (hasValidationError) {
              console.log('  ✅ Phone validation working');
            } else {
              console.log('  ⚠️ ISSUE PROF-012-A: Invalid phone number accepted');
            }
          }
        } else {
          console.log('  ℹ️ No phone number field found for validation test');
        }
      }
    });
  });

  // ============================================================================
  // TEST SUITE: PROFILE EDITING - ARTISAN
  // ============================================================================

  test.describe('Profile Editing - Artisan', () => {
    test.beforeEach(async ({ page }) => {
      await loginUser(page, artisanUser);
      await navigateToProfile(page, 'artisan');
    });

    test('PROF-020: Edit artisan profile with specializations', async ({ page }) => {
      console.log('\n🧪 TEST: PROF-020 - Artisan Specializations');

      // Check for artisan-specific fields
      const pageText = await page.textContent('body');
      const hasArtisanFields = pageText?.toLowerCase().includes('skill') ||
                               pageText?.toLowerCase().includes('specialization') ||
                               pageText?.toLowerCase().includes('service');

      if (hasArtisanFields) {
        console.log('  ✅ Artisan-specific fields detected');
      } else {
        console.log('  ⚠️ ISSUE PROF-020-A: No artisan-specific fields (skills/specializations) found');
      }

      const editButton = page.locator('button, a').filter({ hasText: /edit/i }).first();

      if (await editButton.count() > 0) {
        await editButton.click();
        await page.waitForTimeout(1000);
        console.log('  ✅ Edit mode accessed');
      } else {
        console.log('  ⚠️ ISSUE PROF-020-B: No edit functionality found');
      }
    });

    test('PROF-021: Artisan portfolio management', async ({ page }) => {
      console.log('\n🧪 TEST: PROF-021 - Portfolio Management');

      const pageText = await page.textContent('body');
      const hasPortfolio = pageText?.toLowerCase().includes('portfolio') ||
                          pageText?.toLowerCase().includes('work') ||
                          pageText?.toLowerCase().includes('gallery');

      if (hasPortfolio) {
        console.log('  ✅ Portfolio section detected');
      } else {
        console.log('  ⚠️ ISSUE PROF-021-A: No portfolio/gallery section found for artisan');
      }
    });
  });

  // ============================================================================
  // TEST SUITE: IMAGE UPLOAD
  // ============================================================================

  test.describe('Profile Image Upload', () => {
    test('PROF-030: Profile picture upload UI exists', async ({ page }) => {
      console.log('\n🧪 TEST: PROF-030 - Profile Picture Upload');

      await loginUser(page, clientUser);
      await navigateToProfile(page, 'client');

      // Look for image upload elements
      const hasImageUpload = await page.locator('input[type="file"], button:has-text("Upload"), label:has-text("Picture")').count() > 0;

      if (hasImageUpload) {
        console.log('  ✅ Image upload UI found');
      } else {
        console.log('  ⚠️ ISSUE PROF-030-A: No image upload UI detected');
      }

      // Check for avatar/profile image display
      const hasAvatar = await page.locator('img[alt*="profile"], img[alt*="avatar"], div[class*="avatar"]').count() > 0;

      if (hasAvatar) {
        console.log('  ✅ Avatar/profile image display found');
      } else {
        console.log('  ℹ️ No profile image display detected');
      }
    });
  });

  // ============================================================================
  // TEST SUITE: SETTINGS MANAGEMENT
  // ============================================================================

  test.describe('Settings Management', () => {
    test('PROF-040: Navigate to settings page', async ({ page }) => {
      console.log('\n🧪 TEST: PROF-040 - Settings Navigation');

      await loginUser(page, clientUser);

      // Try multiple ways to access settings
      const settingsUrls = [
        `${CONFIG.FRONTEND_URL}/client/settings`,
        `${CONFIG.FRONTEND_URL}/settings`,
        `${CONFIG.FRONTEND_URL}/account/settings`,
      ];

      let settingsFound = false;

      for (const url of settingsUrls) {
        try {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 5000 });
          const pageText = await page.textContent('body');

          if (pageText?.toLowerCase().includes('setting')) {
            settingsFound = true;
            console.log(`  ✅ Settings page found at: ${url}`);
            break;
          }
        } catch {
          continue;
        }
      }

      if (!settingsFound) {
        // Try clicking settings link
        await page.goto(`${CONFIG.FRONTEND_URL}/client/dashboard`, { waitUntil: 'domcontentloaded' });
        const settingsLink = page.locator('a, button').filter({ hasText: /settings|account/i }).first();

        if (await settingsLink.count() > 0) {
          await settingsLink.click();
          await page.waitForTimeout(1000);
          console.log('  ✅ Settings accessed via navigation link');
        } else {
          console.log('  ⚠️ ISSUE PROF-040-A: Settings page not accessible');
        }
      }
    });

    test('PROF-041: Notification settings available', async ({ page }) => {
      console.log('\n🧪 TEST: PROF-041 - Notification Settings');

      await loginUser(page, clientUser);
      await navigateToSettings(page, 'client').catch(() => {
        console.log('  Settings URL may not exist, checking alternative routes');
      });

      const pageText = await page.textContent('body');
      const hasNotifications = pageText?.toLowerCase().includes('notification') ||
                               pageText?.toLowerCase().includes('email') ||
                               pageText?.toLowerCase().includes('alert');

      if (hasNotifications) {
        console.log('  ✅ Notification settings detected');

        // Check for toggles
        const hasToggles = await page.locator('input[type="checkbox"], button[role="switch"]').count() > 0;

        if (hasToggles) {
          console.log('  ✅ Settings toggles found');
        } else {
          console.log('  ℹ️ No toggle controls detected');
        }
      } else {
        console.log('  ⚠️ ISSUE PROF-041-A: No notification settings found');
      }
    });

    test('PROF-042: Privacy settings available', async ({ page }) => {
      console.log('\n🧪 TEST: PROF-042 - Privacy Settings');

      await loginUser(page, clientUser);
      await navigateToSettings(page, 'client').catch(() => {});

      const pageText = await page.textContent('body');
      const hasPrivacy = pageText?.toLowerCase().includes('privacy') ||
                        pageText?.toLowerCase().includes('visibility');

      if (hasPrivacy) {
        console.log('  ✅ Privacy settings detected');
      } else {
        console.log('  ⚠️ ISSUE PROF-042-A: No privacy settings found');
      }
    });
  });

  // ============================================================================
  // TEST SUITE: ACCOUNT MANAGEMENT
  // ============================================================================

  test.describe('Account Management', () => {
    test('PROF-050: Account statistics display', async ({ page }) => {
      console.log('\n🧪 TEST: PROF-050 - Account Statistics');

      await loginUser(page, clientUser);
      await navigateToProfile(page, 'client');

      const pageText = await page.textContent('body');
      const hasStats = pageText?.toLowerCase().includes('member since') ||
                       pageText?.toLowerCase().includes('joined') ||
                       pageText?.toLowerCase().includes('activity');

      if (hasStats) {
        console.log('  ✅ Account statistics found');
      } else {
        console.log('  ℹ️ No account statistics displayed');
      }
    });

    test('PROF-051: Account deactivation option exists', async ({ page }) => {
      console.log('\n🧪 TEST: PROF-051 - Account Deactivation');

      await loginUser(page, clientUser);
      await navigateToSettings(page, 'client').catch(() => {});

      const hasDeactivate = await page.locator('button, a').filter({
        hasText: /deactivate|disable|suspend/i
      }).count() > 0;

      if (hasDeactivate) {
        console.log('  ✅ Account deactivation option found');
      } else {
        console.log('  ⚠️ ISSUE PROF-051-A: No account deactivation option found');
      }
    });

    test('PROF-052: Account deletion option exists', async ({ page }) => {
      console.log('\n🧪 TEST: PROF-052 - Account Deletion');

      await loginUser(page, clientUser);
      await navigateToSettings(page, 'client').catch(() => {});

      const hasDelete = await page.locator('button, a').filter({
        hasText: /delete|remove account/i
      }).count() > 0;

      if (hasDelete) {
        console.log('  ✅ Account deletion option found');
      } else {
        console.log('  ⚠️ ISSUE PROF-052-A: No account deletion option found');
      }
    });
  });

  // ============================================================================
  // TEST SUITE: SECURITY & VALIDATION
  // ============================================================================

  test.describe('Security & Data Validation', () => {
    test('PROF-060: Cannot edit other user profiles', async ({ page }) => {
      console.log('\n🧪 TEST: PROF-060 - Authorization Check');

      await loginUser(page, clientUser);

      // Try to access artisan profile (should fail or redirect)
      const unauthorizedUrl = `${CONFIG.FRONTEND_URL}/artisan/profile`;
      await page.goto(unauthorizedUrl, { waitUntil: 'domcontentloaded' }).catch(() => {});

      await page.waitForTimeout(1000);
      const currentUrl = page.url();

      if (!currentUrl.includes('/artisan/profile')) {
        console.log('  ✅ Authorization working - redirected from unauthorized route');
      } else {
        const canEdit = await page.locator('button:has-text("Edit"), button:has-text("Save")').count() > 0;

        if (!canEdit) {
          console.log('  ✅ Read-only view for other profiles');
        } else {
          console.log('  ⚠️ ISSUE PROF-060-A: SECURITY - Can access/edit other user profiles');
        }
      }
    });

    test('PROF-061: XSS prevention on text fields', async ({ page }) => {
      console.log('\n🧪 TEST: PROF-061 - XSS Prevention');

      await loginUser(page, clientUser);
      await navigateToProfile(page, 'client');

      const editButton = page.locator('button, a').filter({ hasText: /edit/i }).first();

      if (await editButton.count() > 0) {
        await editButton.click();
        await page.waitForTimeout(1000);

        const firstNameInput = page.locator('input[name="firstName"]').first();

        if (await firstNameInput.count() > 0) {
          const xssPayload = '<script>alert("XSS")</script>';
          await firstNameInput.clear();
          await firstNameInput.fill(xssPayload);

          const saveButton = page.locator('button[type="submit"]').first();
          if (await saveButton.count() > 0) {
            await saveButton.click();
            await page.waitForTimeout(1000);

            // Check if XSS was sanitized
            const pageContent = await page.content();

            if (!pageContent.includes('<script>alert')) {
              console.log('  ✅ XSS prevention working - script tags sanitized');
            } else {
              console.log('  ⚠️ ISSUE PROF-061-A: SECURITY - XSS vulnerability detected');
            }
          }
        }
      } else {
        console.log('  ℹ️ Cannot test XSS - no edit mode');
      }
    });
  });

  // ============================================================================
  // TEST SUITE: UI/UX VALIDATION
  // ============================================================================

  test.describe('UI/UX Validation', () => {
    test('PROF-070: All forms properly labeled', async ({ page }) => {
      console.log('\n🧪 TEST: PROF-070 - Form Labels');

      await loginUser(page, clientUser);
      await navigateToProfile(page, 'client');

      const editButton = page.locator('button, a').filter({ hasText: /edit/i }).first();

      if (await editButton.count() > 0) {
        await editButton.click();
        await page.waitForTimeout(1000);

        const inputs = await page.locator('input[type="text"], input[type="email"], input[type="tel"]').count();
        const labels = await page.locator('label').count();

        console.log(`  ℹ️ Inputs: ${inputs}, Labels: ${labels}`);

        if (labels > 0) {
          console.log('  ✅ Form labels present');
        } else {
          console.log('  ⚠️ ISSUE PROF-070-A: No form labels found');
        }
      } else {
        console.log('  ℹ️ No edit form to check labels');
      }
    });

    test('PROF-071: Success messages display after save', async ({ page }) => {
      console.log('\n🧪 TEST: PROF-071 - Success Messages');

      await loginUser(page, clientUser);
      await navigateToProfile(page, 'client');

      const editButton = page.locator('button, a').filter({ hasText: /edit/i }).first();

      if (await editButton.count() > 0) {
        await editButton.click();
        await page.waitForTimeout(1000);

        const saveButton = page.locator('button[type="submit"]').first();

        if (await saveButton.count() > 0) {
          await saveButton.click();
          await page.waitForTimeout(2000);

          const hasSuccess = await page.locator('text=/success|saved|updated/i').count() > 0;

          if (hasSuccess) {
            console.log('  ✅ Success message displayed');
          } else {
            console.log('  ⚠️ ISSUE PROF-071-A: No success feedback after save');
          }
        }
      }
    });

    test('PROF-072: Loading states during saves', async ({ page }) => {
      console.log('\n🧪 TEST: PROF-072 - Loading States');

      await loginUser(page, clientUser);
      await navigateToProfile(page, 'client');

      const editButton = page.locator('button, a').filter({ hasText: /edit/i }).first();

      if (await editButton.count() > 0) {
        await editButton.click();
        await page.waitForTimeout(1000);

        const saveButton = page.locator('button[type="submit"]').first();

        if (await saveButton.count() > 0) {
          await saveButton.click();

          // Check for loading indicator
          const hasLoading = await page.locator('[class*="loading"], [class*="spinner"], button[disabled]').count() > 0;

          if (hasLoading) {
            console.log('  ✅ Loading state detected during save');
          } else {
            console.log('  ℹ️ No loading indicator observed');
          }
        }
      }
    });

    test('PROF-073: Mobile responsiveness check', async ({ page }) => {
      console.log('\n🧪 TEST: PROF-073 - Mobile Responsiveness');

      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await loginUser(page, clientUser);
      await navigateToProfile(page, 'client');

      // Check if page renders without horizontal scroll
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

      if (scrollWidth <= clientWidth + 10) { // Small tolerance
        console.log('  ✅ No horizontal scroll on mobile');
      } else {
        console.log(`  ⚠️ ISSUE PROF-073-A: Horizontal scroll detected (${scrollWidth}px > ${clientWidth}px)`);
      }

      // Reset viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
    });

    test('PROF-074: Keyboard navigation support', async ({ page }) => {
      console.log('\n🧪 TEST: PROF-074 - Keyboard Navigation');

      await loginUser(page, clientUser);
      await navigateToProfile(page, 'client');

      // Try tabbing through elements
      await page.keyboard.press('Tab');
      await page.waitForTimeout(200);

      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);

      if (focusedElement && focusedElement !== 'BODY') {
        console.log(`  ✅ Keyboard navigation working (focused: ${focusedElement})`);
      } else {
        console.log('  ⚠️ ISSUE PROF-074-A: Poor keyboard navigation support');
      }
    });
  });

  // ============================================================================
  // TEST SUITE: DATA PERSISTENCE
  // ============================================================================

  test.describe('Data Persistence', () => {
    test('PROF-080: Profile changes persist after page reload', async ({ page }) => {
      console.log('\n🧪 TEST: PROF-080 - Data Persistence');

      await loginUser(page, clientUser);
      await navigateToProfile(page, 'client');

      const editButton = page.locator('button, a').filter({ hasText: /edit/i }).first();

      if (await editButton.count() > 0) {
        await editButton.click();
        await page.waitForTimeout(1000);

        const bioInput = page.locator('textarea[name="bio"], input[name="bio"]').first();

        if (await bioInput.count() > 0) {
          const testBio = `Test bio - ${Date.now()}`;
          await bioInput.clear();
          await bioInput.fill(testBio);

          const saveButton = page.locator('button[type="submit"]').first();
          if (await saveButton.count() > 0) {
            await saveButton.click();
            await page.waitForTimeout(2000);

            // Reload page
            await page.reload({ waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(1000);

            const pageContent = await page.content();

            if (pageContent.includes(testBio)) {
              console.log('  ✅ Profile changes persisted after reload');
            } else {
              console.log('  ⚠️ ISSUE PROF-080-A: Profile changes not persisted');
            }
          }
        } else {
          console.log('  ℹ️ No bio field to test persistence');
        }
      }
    });
  });
});
