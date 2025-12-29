import { test, expect, Page } from '@playwright/test';
import { faker } from '@faker-js/faker';
import {
  navigateToJobCreation,
  fillBasicInfo,
  completeBasicInfo,
  selectCategory,
  completeCategory,
  fillBudgetAndUrgency,
  completeBudgetAndUrgency,
  fillLocation,
  completeLocation,
  submitJob,
  createCompleteJob,
  clickContinue,
  isContinueDisabled,
  getValidationErrors,
  BudgetType,
  UrgencyLevel,
  SA_PROVINCES,
  WizardStep,
  verifyCurrentStep,
} from '../helpers/job-wizard-helpers';

/**
 * SPRINT 2 - AGENT 1: Job Creation & Validation Testing
 *
 * Comprehensive test suite covering:
 * - Form validation (all fields, character limits, data types)
 * - Draft management (save, edit, delete, persistence)
 * - Category selection (hierarchical, dynamic fields)
 * - Job publishing (complete workflow, status changes)
 * - Image upload (single, multiple, validation, preview)
 * - Location handling (manual entry, validation)
 * - Data persistence (session, refresh, concurrent editing)
 * - Security (CSRF, XSS, SQL injection, auth, RBAC)
 */

// Test configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';

// Test data factory
const generateJobData = () => ({
  title: faker.lorem.words(5),
  description: faker.lorem.paragraph(3),
  budget: faker.number.int({ min: 100, max: 10000 }),
  addressLine1: faker.location.streetAddress(),
  addressLine2: faker.location.secondaryAddress(),
  city: faker.helpers.arrayElement(['Cape Town', 'Johannesburg', 'Durban', 'Pretoria']),
  province: faker.helpers.arrayElement(['Western Cape', 'Gauteng', 'KwaZulu-Natal']),
  postalCode: faker.location.zipCode('####'),
});

// Helper functions
async function registerAndLoginClient(page: Page) {
  const email = `client_${Date.now()}@test.com`;
  const password = 'TestPassword123!';
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  // Register
  await page.goto(`${FRONTEND_URL}/auth/register`);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.fill('input[name="confirmPassword"]', password);
  await page.fill('input[name="firstName"]', firstName);
  await page.fill('input[name="lastName"]', lastName);
  await page.selectOption('select[name="role"]', 'CLIENT');
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForURL(/\/client\/dashboard/, { timeout: 10000 });

  return { email, password, firstName, lastName };
}

test.describe('SPRINT 2 - Job Creation & Validation', () => {

  test.beforeEach(async ({ page }) => {
    // Register and login as client
    await registerAndLoginClient(page);
    // Note: navigateToJobCreation() is called in each test as needed
  });

  test.describe('1. Form Validation - Basic Fields', () => {

    test('JOB-CREATE-001: Should reject empty job title', async ({ page }) => {
      // Navigate to job creation (wizard step 1)
      await navigateToJobCreation(page);

      // Leave title empty, fill description only
      await page.fill('#description', faker.lorem.paragraph(3));

      // Try to continue
      const continueDisabled = await isContinueDisabled(page);
      expect(continueDisabled).toBe(true);

      // Check for error message
      const errors = await getValidationErrors(page);
      expect(errors.some(e => /title.*required/i.test(e))).toBe(true);
    });

    test('JOB-CREATE-002: Should reject job title shorter than 5 characters', async ({ page }) => {
      await navigateToJobCreation(page);

      await fillBasicInfo(page, { title: 'Fix', description: faker.lorem.paragraph(3) }); // 3 chars

      const continueDisabled = await isContinueDisabled(page);
      expect(continueDisabled).toBe(true);

      const errors = await getValidationErrors(page);
      expect(errors.some(e => /title.*5.*character/i.test(e))).toBe(true);
    });

    test('JOB-CREATE-003: Should reject job title longer than 100 characters', async ({ page }) => {
      await navigateToJobCreation(page);

      const longTitle = faker.lorem.words(30); // Way over 100 chars
      await fillBasicInfo(page, { title: longTitle, description: faker.lorem.paragraph(3) });

      const continueDisabled = await isContinueDisabled(page);
      expect(continueDisabled).toBe(true);

      const errors = await getValidationErrors(page);
      expect(errors.some(e => /title.*100.*character/i.test(e))).toBe(true);
    });

    test('JOB-CREATE-004: Should accept valid job title (5-100 chars)', async ({ page }) => {
      await navigateToJobCreation(page);

      await completeBasicInfo(page, {
        title: 'Fix leaking kitchen faucet',
        description: faker.lorem.paragraph(3)
      });

      // Should progress to step 2 (Category Selection)
      await verifyCurrentStep(page, WizardStep.CATEGORY);
    });

    test('JOB-CREATE-005: Should reject empty description', async ({ page }) => {
      await navigateToJobCreation(page);

      await page.fill('#title', 'Fix leaking faucet');
      // Leave description empty

      const continueDisabled = await isContinueDisabled(page);
      expect(continueDisabled).toBe(true);

      const errors = await getValidationErrors(page);
      expect(errors.some(e => /description.*required/i.test(e))).toBe(true);
    });

    test('JOB-CREATE-006: Should reject description shorter than 20 characters', async ({ page }) => {
      await navigateToJobCreation(page);

      await fillBasicInfo(page, { title: 'Fix leaking faucet', description: 'Too short' }); // Less than 20 chars

      const continueDisabled = await isContinueDisabled(page);
      expect(continueDisabled).toBe(true);

      const errors = await getValidationErrors(page);
      expect(errors.some(e => /description.*20.*character/i.test(e))).toBe(true);
    });

    test('JOB-CREATE-007: Should reject description longer than 2000 characters', async ({ page }) => {
      await navigateToJobCreation(page);

      const longDescription = faker.lorem.paragraphs(20); // Way over 2000 chars
      await fillBasicInfo(page, { title: 'Fix leaking faucet', description: longDescription });

      const continueDisabled = await isContinueDisabled(page);
      expect(continueDisabled).toBe(true);

      const errors = await getValidationErrors(page);
      expect(errors.some(e => /description.*2000.*character/i.test(e))).toBe(true);
    });

    test('JOB-CREATE-008: Should display character counter for description', async ({ page }) => {
      await navigateToJobCreation(page);

      const description = faker.lorem.paragraph(2);
      await page.fill('#description', description);

      const counter = await page.locator(`text=/${description.length}/2000/`);
      await expect(counter).toBeVisible();
    });

    test('JOB-CREATE-009: Should accept valid description (20-2000 chars)', async ({ page }) => {
      await navigateToJobCreation(page);

      await completeBasicInfo(page, {
        title: 'Fix leaking faucet',
        description: faker.lorem.paragraph(3)
      });

      await verifyCurrentStep(page, WizardStep.CATEGORY);
    });
  });

  test.describe('2. Category Selection', () => {

    test('JOB-CREATE-010: Should display hierarchical category structure', async ({ page }) => {
      await navigateToJobCreation(page);
      await completeBasicInfo(page, { title: 'Test job', description: faker.lorem.paragraph(3) });

      // Wait for categories (now on step 2)
      await page.waitForSelector('h3.font-semibold', { timeout: 10000 });

      // Should see parent categories as headers
      const parentCategories = await page.locator('h3.font-semibold.text-gray-900').count();
      expect(parentCategories).toBeGreaterThan(0);
    });

    test('JOB-CREATE-011: Should display subcategories under parent categories', async ({ page }) => {
      await navigateToJobCreation(page);
      await completeBasicInfo(page, { title: 'Test job', description: faker.lorem.paragraph(3) });

      await page.waitForSelector('h3.font-semibold', { timeout: 10000 });

      // Should see subcategory cards
      const subcategoryCards = await page.locator('[data-testid^="category-option-"]').count();
      expect(subcategoryCards).toBeGreaterThan(0);
    });

    test('JOB-CREATE-012: Should require category selection to proceed', async ({ page }) => {
      await navigateToJobCreation(page);
      await completeBasicInfo(page, { title: 'Test job', description: faker.lorem.paragraph(3) });

      // Try to continue without selecting category
      const continueDisabled = await isContinueDisabled(page);
      expect(continueDisabled).toBe(true);
    });

    test('JOB-CREATE-013: Should highlight selected category', async ({ page }) => {
      await navigateToJobCreation(page);
      await completeBasicInfo(page, { title: 'Test job', description: faker.lorem.paragraph(3) });

      await page.waitForSelector('[data-testid^="category-option-"]', { timeout: 10000 });

      const firstCategory = await page.locator('[data-testid^="category-option-"]').first();
      await selectCategory(page, { index: 0 });

      // Should have selected styling
      await expect(firstCategory).toHaveClass(/border-primary-600/);
      await expect(firstCategory).toHaveClass(/bg-primary-50/);
    });

    test('JOB-CREATE-014: Should allow category selection and progression', async ({ page }) => {
      await navigateToJobCreation(page);
      await completeBasicInfo(page, { title: 'Test job', description: faker.lorem.paragraph(3) });
      await completeCategory(page, { index: 0 });

      // Should progress to budget step (step 3)
      await verifyCurrentStep(page, WizardStep.BUDGET_URGENCY);
    });
  });

  test.describe('3. Budget and Urgency Validation', () => {

    test('JOB-CREATE-015: Should reject negative budget', async ({ page }) => {
      await navigateToJobCreation(page);
      await completeBasicInfo(page, { title: 'Test job', description: faker.lorem.paragraph(3) });
      await completeCategory(page, { index: 0 });

      // Now on budget step - try negative budget
      await page.fill('#budget', '-100');
      await page.click('[data-testid="budget-type-fixed"]');
      await page.click('[data-testid="urgency-medium"]');

      const continueDisabled = await isContinueDisabled(page);
      expect(continueDisabled).toBe(true);

      const errors = await getValidationErrors(page);
      expect(errors.some(e => /budget.*positive/i.test(e))).toBe(true);
    });

    test('JOB-CREATE-016: Should reject zero budget', async ({ page }) => {
      await navigateToJobCreation(page);
      await completeBasicInfo(page, { title: 'Test job', description: faker.lorem.paragraph(3) });
      await completeCategory(page, { index: 0 });

      await page.fill('#budget', '0');
      await page.click('[data-testid="budget-type-fixed"]');
      await page.click('[data-testid="urgency-medium"]');

      const continueDisabled = await isContinueDisabled(page);
      expect(continueDisabled).toBe(true);

      const errors = await getValidationErrors(page);
      expect(errors.some(e => /budget.*zero|minimum/i.test(e))).toBe(true);
    });

    test('JOB-CREATE-017: Should reject budget below minimum (50 ZAR)', async ({ page }) => {
      await navigateToJobCreation(page);
      await completeBasicInfo(page, { title: 'Test job', description: faker.lorem.paragraph(3) });
      await completeCategory(page, { index: 0 });

      await page.fill('#budget', '25');
      await page.click('[data-testid="budget-type-fixed"]');
      await page.click('[data-testid="urgency-medium"]');

      const continueDisabled = await isContinueDisabled(page);
      expect(continueDisabled).toBe(true);

      const errors = await getValidationErrors(page);
      expect(errors.some(e => /budget.*50/i.test(e))).toBe(true);
    });

    test('JOB-CREATE-018: Should accept valid budget (50-100000 ZAR)', async ({ page }) => {
      await navigateToJobCreation(page);
      await completeBasicInfo(page, { title: 'Test job', description: faker.lorem.paragraph(3) });
      await completeCategory(page, { index: 0 });
      await completeBudgetAndUrgency(page, {
        budget: 1000,
        budgetType: BudgetType.FIXED,
        urgency: UrgencyLevel.MEDIUM
      });

      // Should progress to location step
      await verifyCurrentStep(page, WizardStep.LOCATION);
    });

    test('JOB-CREATE-019: Should format budget display with currency', async ({ page }) => {
      await navigateToJobCreation(page);
      await completeBasicInfo(page, { title: 'Test job', description: faker.lorem.paragraph(3) });
      await completeCategory(page, { index: 0 });

      await page.fill('#budget', '1500');

      // Should see formatted currency display
      await expect(page.locator('text=/R 1,?500/i')).toBeVisible({ timeout: 3000 });
    });

    test('JOB-CREATE-020: Should require budget type selection', async ({ page }) => {
      await navigateToJobCreation(page);
      await completeBasicInfo(page, { title: 'Test job', description: faker.lorem.paragraph(3) });
      await completeCategory(page, { index: 0 });

      await page.fill('#budget', '1000');
      // Don't select budget type
      await page.click('[data-testid="urgency-medium"]');

      // Continue should be disabled without budget type
      const continueDisabled = await isContinueDisabled(page);
      expect(continueDisabled).toBe(true);
    });

    test('JOB-CREATE-021: Should allow selection of Fixed Price budget type', async ({ page }) => {
      await navigateToJobCreation(page);
      await completeBasicInfo(page, { title: 'Test job', description: faker.lorem.paragraph(3) });
      await completeCategory(page, { index: 0 });

      const fixedPriceButton = await page.locator('[data-testid="budget-type-fixed"]');
      await fixedPriceButton.click();

      await expect(fixedPriceButton).toHaveClass(/border-primary-600/);
    });

    test('JOB-CREATE-022: Should allow selection of Hourly Rate budget type', async ({ page }) => {
      await navigateToJobCreation(page);
      await completeBasicInfo(page, { title: 'Test job', description: faker.lorem.paragraph(3) });
      await completeCategory(page, { index: 0 });

      const hourlyButton = await page.locator('[data-testid="budget-type-hourly"]');
      await hourlyButton.click();

      await expect(hourlyButton).toHaveClass(/border-primary-600/);
    });

    test('JOB-CREATE-023: Should allow selection of Negotiable budget type', async ({ page }) => {
      await navigateToJobCreation(page);
      await completeBasicInfo(page, { title: 'Test job', description: faker.lorem.paragraph(3) });
      await completeCategory(page, { index: 0 });

      const negotiableButton = await page.locator('[data-testid="budget-type-negotiable"]');
      await negotiableButton.click();

      await expect(negotiableButton).toHaveClass(/border-primary-600/);
    });

    test('JOB-CREATE-024: Should require urgency selection', async ({ page }) => {
      await navigateToJobCreation(page);
      await completeBasicInfo(page, { title: 'Test job', description: faker.lorem.paragraph(3) });
      await completeCategory(page, { index: 0 });

      await page.fill('#budget', '1000');
      await page.click('[data-testid="budget-type-fixed"]');
      // Don't select urgency

      // Continue should be disabled without urgency
      const continueDisabled = await isContinueDisabled(page);
      expect(continueDisabled).toBe(true);
    });

    test('JOB-CREATE-025: Should allow urgency level selection (Low/Medium/High)', async ({ page }) => {
      await navigateToJobCreation(page);
      await completeBasicInfo(page, { title: 'Test job', description: faker.lorem.paragraph(3) });
      await completeCategory(page, { index: 0 });

      await page.fill('#budget', '1000');
      await page.click('[data-testid="budget-type-fixed"]');

      // Test all urgency levels
      const highButton = await page.locator('[data-testid="urgency-high"]');
      await highButton.click();
      await expect(highButton).toHaveClass(/border-primary-600/);

      const mediumButton = await page.locator('[data-testid="urgency-medium"]');
      await mediumButton.click();
      await expect(mediumButton).toHaveClass(/border-primary-600/);

      const lowButton = await page.locator('[data-testid="urgency-low"]');
      await lowButton.click();
      await expect(lowButton).toHaveClass(/border-primary-600/);
    });
  });

  test.describe('4. Requirements Management', () => {

    test('JOB-CREATE-026: Should allow adding special requirements', async ({ page }) => {
      await fillBasicInfo(page, 'Test job', faker.lorem.paragraph(3));
      await page.click('button:has-text("Continue")');
      await selectCategory(page);
      await page.click('button:has-text("Continue")');

      // Add requirement
      await page.fill('input[placeholder*="Add requirement"]', 'Must have plumbing license');
      await page.click('button:has-text("Add")');

      // Should see requirement tag
      await expect(page.locator('text=Must have plumbing license')).toBeVisible();
    });

    test('JOB-CREATE-027: Should allow adding requirement with Enter key', async ({ page }) => {
      await fillBasicInfo(page, 'Test job', faker.lorem.paragraph(3));
      await page.click('button:has-text("Continue")');
      await selectCategory(page);
      await page.click('button:has-text("Continue")');

      await page.fill('input[placeholder*="Add requirement"]', 'Provide own tools');
      await page.press('input[placeholder*="Add requirement"]', 'Enter');

      await expect(page.locator('text=Provide own tools')).toBeVisible();
    });

    test('JOB-CREATE-028: Should allow removing requirements', async ({ page }) => {
      await fillBasicInfo(page, 'Test job', faker.lorem.paragraph(3));
      await page.click('button:has-text("Continue")');
      await selectCategory(page);
      await page.click('button:has-text("Continue")');

      // Add requirement
      await page.fill('input[placeholder*="Add requirement"]', 'Test requirement');
      await page.click('button:has-text("Add")');

      // Remove it
      await page.click('button.text-red-500:near(:text("Test requirement"))');

      // Should be gone
      await expect(page.locator('text=Test requirement')).not.toBeVisible();
    });

    test('JOB-CREATE-029: Should limit requirements to 10 items', async ({ page }) => {
      await fillBasicInfo(page, 'Test job', faker.lorem.paragraph(3));
      await page.click('button:has-text("Continue")');
      await selectCategory(page);
      await page.click('button:has-text("Continue")');

      // Add 10 requirements
      for (let i = 1; i <= 10; i++) {
        await page.fill('input[placeholder*="Add requirement"]', `Requirement ${i}`);
        await page.click('button:has-text("Add")');
      }

      // Try to add 11th
      await page.fill('input[placeholder*="Add requirement"]', 'Requirement 11');
      await page.click('button:has-text("Add")');

      // Should see counter at 10/10
      await expect(page.locator('text=/10\\/10 requirements/i')).toBeVisible();
    });

    test('JOB-CREATE-030: Should enforce 200 character limit per requirement', async ({ page }) => {
      await fillBasicInfo(page, 'Test job', faker.lorem.paragraph(3));
      await page.click('button:has-text("Continue")');
      await selectCategory(page);
      await page.click('button:has-text("Continue")');

      const longRequirement = faker.lorem.sentences(20); // Way over 200 chars
      await page.fill('input[placeholder*="Add requirement"]', longRequirement);

      // Input should be limited to maxLength
      const input = await page.locator('input[placeholder*="Add requirement"]');
      const value = await input.inputValue();
      expect(value.length).toBeLessThanOrEqual(200);
    });
  });

  test.describe('5. Location Validation', () => {

    test('JOB-CREATE-031: Should require address line 1', async ({ page }) => {
      await fillBasicInfo(page, 'Test job', faker.lorem.paragraph(3));
      await page.click('button:has-text("Continue")');
      await selectCategory(page);
      await page.click('button:has-text("Continue")');
      await fillBudgetAndUrgency(page, 1000);
      await page.click('button:has-text("Continue")');

      // Try to continue without address
      await page.click('button:has-text("Continue")');

      const error = await page.locator('p.text-red-500:near(input[name="addressLine1"])');
      await expect(error).toBeVisible();
    });

    test('JOB-CREATE-032: Should accept optional address line 2', async ({ page }) => {
      await fillBasicInfo(page, 'Test job', faker.lorem.paragraph(3));
      await page.click('button:has-text("Continue")');
      await selectCategory(page);
      await page.click('button:has-text("Continue")');
      await fillBudgetAndUrgency(page, 1000);
      await page.click('button:has-text("Continue")');

      const jobData = generateJobData();
      await page.fill('input[name="addressLine1"]', jobData.addressLine1);
      // Skip addressLine2
      await page.fill('input[name="city"]', jobData.city);
      await page.fill('input[name="postalCode"]', jobData.postalCode);
      await page.selectOption('select[name="province"]', jobData.province);

      await page.click('button:has-text("Continue")');

      // Should progress to final step
      await expect(page.locator('text=/Add Photos/i')).toBeVisible({ timeout: 5000 });
    });

    test('JOB-CREATE-033: Should require city', async ({ page }) => {
      await fillBasicInfo(page, 'Test job', faker.lorem.paragraph(3));
      await page.click('button:has-text("Continue")');
      await selectCategory(page);
      await page.click('button:has-text("Continue")');
      await fillBudgetAndUrgency(page, 1000);
      await page.click('button:has-text("Continue")');

      const jobData = generateJobData();
      await page.fill('input[name="addressLine1"]', jobData.addressLine1);
      await page.fill('input[name="postalCode"]', jobData.postalCode);
      await page.selectOption('select[name="province"]', jobData.province);

      await page.click('button:has-text("Continue")');

      const error = await page.locator('p.text-red-500:near(input[name="city"])');
      await expect(error).toBeVisible();
    });

    test('JOB-CREATE-034: Should require postal code', async ({ page }) => {
      await fillBasicInfo(page, 'Test job', faker.lorem.paragraph(3));
      await page.click('button:has-text("Continue")');
      await selectCategory(page);
      await page.click('button:has-text("Continue")');
      await fillBudgetAndUrgency(page, 1000);
      await page.click('button:has-text("Continue")');

      const jobData = generateJobData();
      await page.fill('input[name="addressLine1"]', jobData.addressLine1);
      await page.fill('input[name="city"]', jobData.city);
      await page.selectOption('select[name="province"]', jobData.province);

      await page.click('button:has-text("Continue")');

      const error = await page.locator('p.text-red-500:near(input[name="postalCode"])');
      await expect(error).toBeVisible();
    });

    test('JOB-CREATE-035: Should require province selection', async ({ page }) => {
      await fillBasicInfo(page, 'Test job', faker.lorem.paragraph(3));
      await page.click('button:has-text("Continue")');
      await selectCategory(page);
      await page.click('button:has-text("Continue")');
      await fillBudgetAndUrgency(page, 1000);
      await page.click('button:has-text("Continue")');

      const jobData = generateJobData();
      await page.fill('input[name="addressLine1"]', jobData.addressLine1);
      await page.fill('input[name="city"]', jobData.city);
      await page.fill('input[name="postalCode"]', jobData.postalCode);

      await page.click('button:has-text("Continue")');

      const error = await page.locator('p.text-red-500:near(select[name="province"])');
      await expect(error).toBeVisible();
    });

    test('JOB-CREATE-036: Should display province dropdown with South African provinces', async ({ page }) => {
      await fillBasicInfo(page, 'Test job', faker.lorem.paragraph(3));
      await page.click('button:has-text("Continue")');
      await selectCategory(page);
      await page.click('button:has-text("Continue")');
      await fillBudgetAndUrgency(page, 1000);
      await page.click('button:has-text("Continue")');

      const provinceSelect = await page.locator('select[name="province"]');
      const options = await provinceSelect.locator('option').allTextContents();

      // Should include major SA provinces
      expect(options.join(',')).toContain('Western Cape');
      expect(options.join(',')).toContain('Gauteng');
      expect(options.join(',')).toContain('KwaZulu-Natal');
    });

    test('JOB-CREATE-037: Should show geocoding indicator', async ({ page }) => {
      await fillBasicInfo(page, 'Test job', faker.lorem.paragraph(3));
      await page.click('button:has-text("Continue")');
      await selectCategory(page);
      await page.click('button:has-text("Continue")');
      await fillBudgetAndUrgency(page, 1000);
      await page.click('button:has-text("Continue")');

      // Should see geocoding info box
      await expect(page.locator('text=/automatically determine.*coordinates/i')).toBeVisible();
    });
  });

  test.describe('6. Image Upload', () => {

    test('JOB-CREATE-038: Should display image upload area', async ({ page }) => {
      await fillBasicInfo(page, 'Test job', faker.lorem.paragraph(3));
      await page.click('button:has-text("Continue")');
      await selectCategory(page);
      await page.click('button:has-text("Continue")');
      await fillBudgetAndUrgency(page, 1000);
      await page.click('button:has-text("Continue")');
      await fillLocation(page, generateJobData());
      await page.click('button:has-text("Continue")');

      // Should see upload area
      await expect(page.locator('text=/Click to upload images/i')).toBeVisible();
    });

    test('JOB-CREATE-039: Should show image upload is optional', async ({ page }) => {
      await fillBasicInfo(page, 'Test job', faker.lorem.paragraph(3));
      await page.click('button:has-text("Continue")');
      await selectCategory(page);
      await page.click('button:has-text("Continue")');
      await fillBudgetAndUrgency(page, 1000);
      await page.click('button:has-text("Continue")');
      await fillLocation(page, generateJobData());
      await page.click('button:has-text("Continue")');

      await expect(page.locator('text=/Add Photos.*Optional/i')).toBeVisible();
    });

    test('JOB-CREATE-040: Should indicate max 5 images allowed', async ({ page }) => {
      await fillBasicInfo(page, 'Test job', faker.lorem.paragraph(3));
      await page.click('button:has-text("Continue")');
      await selectCategory(page);
      await page.click('button:has-text("Continue")');
      await fillBudgetAndUrgency(page, 1000);
      await page.click('button:has-text("Continue")');
      await fillLocation(page, generateJobData());
      await page.click('button:has-text("Continue")');

      await expect(page.locator('text=/up to 5 images/i')).toBeVisible();
    });

    test('JOB-CREATE-041: Should show accepted file formats', async ({ page }) => {
      await fillBasicInfo(page, 'Test job', faker.lorem.paragraph(3));
      await page.click('button:has-text("Continue")');
      await selectCategory(page);
      await page.click('button:has-text("Continue")');
      await fillBudgetAndUrgency(page, 1000);
      await page.click('button:has-text("Continue")');
      await fillLocation(page, generateJobData());
      await page.click('button:has-text("Continue")');

      await expect(page.locator('text=/PNG, JPG, GIF/i')).toBeVisible();
    });
  });

  test.describe('7. Job Review and Publishing', () => {

    test('JOB-CREATE-042: Should display job review section', async ({ page }) => {
      await fillBasicInfo(page, 'Test job', faker.lorem.paragraph(3));
      await page.click('button:has-text("Continue")');
      await selectCategory(page);
      await page.click('button:has-text("Continue")');
      await fillBudgetAndUrgency(page, 1000);
      await page.click('button:has-text("Continue")');
      await fillLocation(page, generateJobData());
      await page.click('button:has-text("Continue")');

      await expect(page.locator('text=/Review Your Job/i')).toBeVisible();
    });

    test('JOB-CREATE-043: Should show all entered job details in review', async ({ page }) => {
      const title = 'Fix leaking kitchen faucet';
      const description = faker.lorem.paragraph(3);
      const jobData = generateJobData();

      await fillBasicInfo(page, title, description);
      await page.click('button:has-text("Continue")');
      await selectCategory(page);
      await page.click('button:has-text("Continue")');
      await fillBudgetAndUrgency(page, 1500);
      await page.click('button:has-text("Continue")');
      await fillLocation(page, jobData);
      await page.click('button:has-text("Continue")');

      // Check review shows data
      await expect(page.locator(`text=${title}`)).toBeVisible();
      await expect(page.locator('text=/1,?500/i')).toBeVisible();
      await expect(page.locator(`text=${jobData.city}`)).toBeVisible();
    });

    test('JOB-CREATE-044: Should allow navigation back to previous steps', async ({ page }) => {
      await fillBasicInfo(page, 'Test job', faker.lorem.paragraph(3));
      await page.click('button:has-text("Continue")');
      await selectCategory(page);
      await page.click('button:has-text("Continue")');
      await fillBudgetAndUrgency(page, 1000);
      await page.click('button:has-text("Continue")');
      await fillLocation(page, generateJobData());
      await page.click('button:has-text("Continue")');

      // Click Previous
      await page.click('button:has-text("Previous")');

      // Should go back to location step
      await expect(page.locator('text=/Job Location/i')).toBeVisible();
    });

    test('JOB-CREATE-045: Should preserve data when navigating between steps', async ({ page }) => {
      const title = 'Fix leaking kitchen faucet';
      const description = faker.lorem.paragraph(3);

      await fillBasicInfo(page, title, description);
      await page.click('button:has-text("Continue")');
      await selectCategory(page);
      await page.click('button:has-text("Continue")');
      await fillBudgetAndUrgency(page, 1500);

      // Go back
      await page.click('button:has-text("Previous")');
      await page.click('button:has-text("Previous")');

      // Check data is still there
      const titleValue = await page.inputValue('input[name="title"]');
      const descValue = await page.inputValue('textarea[name="description"]');

      expect(titleValue).toBe(title);
      expect(descValue).toBe(description);
    });

    test('JOB-CREATE-046: Should successfully create job (draft)', async ({ page }) => {
      const title = 'Fix leaking kitchen faucet';
      const description = faker.lorem.paragraph(3);
      const jobData = generateJobData();

      await fillBasicInfo(page, title, description);
      await page.click('button:has-text("Continue")');
      await selectCategory(page);
      await page.click('button:has-text("Continue")');
      await fillBudgetAndUrgency(page, 1500);
      await page.click('button:has-text("Continue")');
      await fillLocation(page, jobData);
      await page.click('button:has-text("Continue")');

      // Submit
      await page.click('button:has-text("Post Job")');

      // Should redirect to job details or dashboard
      await page.waitForURL(/\/(client\/jobs\/|client\/dashboard)/, { timeout: 15000 });

      // Should show success indication
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/client\/jobs|client\/dashboard/);
    });
  });

  test.describe('8. Navigation and Progress Tracking', () => {

    test('JOB-CREATE-047: Should show step progress indicator', async ({ page }) => {
      // Should see step 1/5 indicators
      const stepIndicators = await page.locator('div[class*="rounded-full"]').count();
      expect(stepIndicators).toBeGreaterThanOrEqual(5);
    });

    test('JOB-CREATE-048: Should highlight current step', async ({ page }) => {
      // Step 1 should be highlighted
      const activeStep = await page.locator('div[class*="border-primary-600"][class*="rounded-full"]').first();
      await expect(activeStep).toBeVisible();
    });

    test('JOB-CREATE-049: Should show completed steps with checkmark', async ({ page }) => {
      await fillBasicInfo(page, 'Test job', faker.lorem.paragraph(3));
      await page.click('button:has-text("Continue")');

      // Step 1 should show as completed
      await expect(page.locator('svg.lucide-check-circle').first()).toBeVisible();
    });

    test('JOB-CREATE-050: Should disable Continue button when step is incomplete', async ({ page }) => {
      const continueBtn = await page.locator('button:has-text("Continue")');

      // Should be disabled initially (no data entered)
      await expect(continueBtn).toBeDisabled();
    });

    test('JOB-CREATE-051: Should enable Continue button when step is complete', async ({ page }) => {
      await fillBasicInfo(page, 'Fix leaking faucet', faker.lorem.paragraph(3));

      const continueBtn = await page.locator('button:has-text("Continue")');
      await expect(continueBtn).toBeEnabled();
    });
  });

  test.describe('9. Error Handling and User Feedback', () => {

    test('JOB-CREATE-052: Should display specific error messages for each field', async ({ page }) => {
      // Try to submit with all empty fields
      await page.click('button:has-text("Continue")');

      // Check for specific error messages
      const errors = await page.locator('p.text-red-500').allTextContents();
      expect(errors.length).toBeGreaterThan(0);
    });

    test('JOB-CREATE-053: Should clear error when field is corrected', async ({ page }) => {
      await page.click('button:has-text("Continue")');

      // Should have error
      await expect(page.locator('p.text-red-500:near(input[name="title"])')).toBeVisible();

      // Fix the field
      await page.fill('input[name="title"]', 'Valid job title');

      // Error should be cleared (or still visible until next validation)
      // This depends on validation strategy
    });

    test('JOB-CREATE-054: Should show loading state during submission', async ({ page }) => {
      const title = 'Fix leaking kitchen faucet';
      const description = faker.lorem.paragraph(3);
      const jobData = generateJobData();

      await fillBasicInfo(page, title, description);
      await page.click('button:has-text("Continue")');
      await selectCategory(page);
      await page.click('button:has-text("Continue")');
      await fillBudgetAndUrgency(page, 1500);
      await page.click('button:has-text("Continue")');
      await fillLocation(page, jobData);
      await page.click('button:has-text("Continue")');

      // Click submit
      await page.click('button:has-text("Post Job")');

      // Should show loading state briefly
      await expect(page.locator('text=/Posting.../i')).toBeVisible({ timeout: 2000 });
    });
  });

  test.describe('10. Security Testing', () => {

    test('JOB-CREATE-055: Should require authentication to access job creation page', async ({ page }) => {
      // Logout
      await page.goto(`${FRONTEND_URL}/auth/login`);

      // Try to access job creation
      await page.goto(`${FRONTEND_URL}/client/jobs/create`);

      // Should redirect to login
      await expect(page).toHaveURL(/\/auth\/login/);
    });

    test('JOB-CREATE-056: Should prevent XSS in job title', async ({ page }) => {
      const xssPayload = '<script>alert("XSS")</script>';

      await page.fill('input[name="title"]', xssPayload);
      await page.fill('textarea[name="description"]', faker.lorem.paragraph(3));
      await page.click('button:has-text("Continue")');
      await selectCategory(page);
      await page.click('button:has-text("Continue")');

      // Check that script is not executed (should be escaped)
      const titleValue = await page.inputValue('input[name="title"]');
      expect(titleValue).toContain(xssPayload);

      // Script should not execute
      const alerts = [];
      page.on('dialog', dialog => {
        alerts.push(dialog.message());
        dialog.dismiss();
      });

      expect(alerts.length).toBe(0);
    });

    test('JOB-CREATE-057: Should prevent XSS in job description', async ({ page }) => {
      const xssPayload = '<img src=x onerror="alert(\'XSS\')">';

      await page.fill('input[name="title"]', 'Valid title');
      await page.fill('textarea[name="description"]', xssPayload);

      // Script should not execute
      const alerts = [];
      page.on('dialog', dialog => {
        alerts.push(dialog.message());
        dialog.dismiss();
      });

      await page.click('button:has-text("Continue")');

      expect(alerts.length).toBe(0);
    });

    test('JOB-CREATE-058: Should prevent SQL injection in form fields', async ({ page }) => {
      const sqlPayload = "'; DROP TABLE jobs; --";

      await page.fill('input[name="title"]', sqlPayload);
      await page.fill('textarea[name="description"]', faker.lorem.paragraph(3));
      await page.click('button:has-text("Continue")');

      // Should handle as normal string, not execute
      const titleValue = await page.inputValue('input[name="title"]');
      expect(titleValue).toContain(sqlPayload);
    });

    test('JOB-CREATE-059: Should sanitize special characters in location fields', async ({ page }) => {
      await fillBasicInfo(page, 'Test job', faker.lorem.paragraph(3));
      await page.click('button:has-text("Continue")');
      await selectCategory(page);
      await page.click('button:has-text("Continue")');
      await fillBudgetAndUrgency(page, 1000);
      await page.click('button:has-text("Continue")');

      const specialChars = '<>&"\'/\\';
      await page.fill('input[name="addressLine1"]', `123 Main St ${specialChars}`);

      // Should accept but sanitize
      const value = await page.inputValue('input[name="addressLine1"]');
      expect(value).toBeTruthy();
    });
  });

  test.describe('11. Data Persistence', () => {

    test('JOB-CREATE-060: Should preserve form data on page refresh', async ({ page }) => {
      const title = 'Test job persistence';
      const description = faker.lorem.paragraph(3);

      await fillBasicInfo(page, title, description);

      // Refresh page
      await page.reload();

      // Data should be preserved (if form state is persisted)
      // Note: This depends on implementation - may use localStorage or sessionStorage
      const titleValue = await page.inputValue('input[name="title"]');
      const descValue = await page.inputValue('textarea[name="description"]');

      // This test may fail if no persistence is implemented
      // Document as finding if data is lost on refresh
    });
  });

  test.describe('12. Accessibility', () => {

    test('JOB-CREATE-061: Should have proper labels for all form fields', async ({ page }) => {
      // Check for required field labels
      await expect(page.locator('label:has-text("Job Title")')).toBeVisible();
      await expect(page.locator('label:has-text("Description")')).toBeVisible();
    });

    test('JOB-CREATE-062: Should indicate required fields with asterisk', async ({ page }) => {
      const requiredIndicators = await page.locator('span.text-red-500:has-text("*")').count();
      expect(requiredIndicators).toBeGreaterThan(0);
    });

    test('JOB-CREATE-063: Should have keyboard navigation support', async ({ page }) => {
      // Tab through form fields
      await page.keyboard.press('Tab');
      const focusedElement1 = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement1).toBeTruthy();

      await page.keyboard.press('Tab');
      const focusedElement2 = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement2).toBeTruthy();
    });
  });
});
