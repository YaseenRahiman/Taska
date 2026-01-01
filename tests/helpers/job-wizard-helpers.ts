import { Page, expect } from '@playwright/test';

/**
 * Job Creation Wizard Test Helpers
 *
 * These utilities help navigate and interact with the multi-step job creation wizard.
 * The wizard has 5 steps that must be completed sequentially.
 */

// Step definitions for the job creation wizard
export enum WizardStep {
  BASIC_INFO = 1,      // Title, Description
  CATEGORY = 2,        // Category Selection
  BUDGET_URGENCY = 3,  // Budget, Budget Type, Urgency, Requirements, Timeline
  LOCATION = 4,        // Address, City, Province, Postal Code
  IMAGES_REVIEW = 5    // Image Upload and Final Review
}

// Budget type options
export enum BudgetType {
  FIXED = 'fixed',
  HOURLY = 'hourly',
  NEGOTIABLE = 'negotiable'
}

// Urgency level options
export enum UrgencyLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

// South African provinces
export const SA_PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'Northern Cape',
  'North West',
  'Western Cape'
] as const;

/**
 * Navigate to the job creation page
 * Assumes user is already logged in as CLIENT
 */
export async function navigateToJobCreation(page: Page): Promise<void> {
  await page.goto('http://localhost:3001/client/jobs/create');
  await page.waitForLoadState('networkidle');

  // Verify we're on the job creation page
  await expect(page).toHaveTitle(/Create Job/i);
}

/**
 * Click the Continue button to progress to the next step
 * Waits for the button to be enabled before clicking
 */
export async function clickContinue(page: Page): Promise<void> {
  const continueButton = page.locator('[data-testid="continue-button"]');

  // Wait for button to be enabled (validation passes)
  await continueButton.waitFor({ state: 'visible' });
  await expect(continueButton).toBeEnabled({ timeout: 10000 });

  await continueButton.click();

  // Wait for step transition
  await page.waitForTimeout(500);
}

/**
 * Fill Step 1: Basic Info (Title and Description)
 */
export async function fillBasicInfo(
  page: Page,
  data: {
    title: string;
    description: string;
  }
): Promise<void> {
  // Fill title
  await page.fill('input[name="title"], #title', data.title);

  // Fill description
  await page.fill('textarea[name="description"], #description', data.description);

  // Optionally verify fields are filled
  await expect(page.locator('#title')).toHaveValue(data.title);
  await expect(page.locator('#description')).toHaveValue(data.description);
}

/**
 * Complete Step 1: Basic Info and progress to Step 2
 */
export async function completeBasicInfo(
  page: Page,
  data: {
    title: string;
    description: string;
  }
): Promise<void> {
  await fillBasicInfo(page, data);
  await clickContinue(page);
}

/**
 * Select a category (Step 2)
 * Can select by index or by name
 */
export async function selectCategory(
  page: Page,
  options: { index?: number; name?: string }
): Promise<void> {
  if (options.index !== undefined) {
    // Select by index (0-based)
    const categories = page.locator('[data-testid^="category-option-"]');
    await categories.nth(options.index).click();
  } else if (options.name) {
    // Select by name
    await page.locator(`[data-category-name="${options.name}"]`).click();
  } else {
    // Default: select first category
    await page.locator('[data-testid^="category-option-"]').first().click();
  }

  // Verify category is selected (hidden input should have value)
  await expect(page.locator('#category')).not.toHaveValue('');
}

/**
 * Complete Step 2: Category Selection and progress to Step 3
 */
export async function completeCategory(
  page: Page,
  options: { index?: number; name?: string } = {}
): Promise<void> {
  await selectCategory(page, options);
  await clickContinue(page);
}

/**
 * Fill Step 3: Budget and Urgency
 */
export async function fillBudgetAndUrgency(
  page: Page,
  data: {
    budget: number;
    budgetType: BudgetType;
    urgency: UrgencyLevel;
    requirements?: string[];
    timeline?: string;
  }
): Promise<void> {
  // Fill budget
  await page.fill('input[name="budget"], #budget', data.budget.toString());

  // Select budget type
  await page.click(`[data-testid="budget-type-${data.budgetType}"]`);

  // Select urgency level
  await page.click(`[data-testid="urgency-${data.urgency}"]`);

  // Add requirements (optional)
  if (data.requirements && data.requirements.length > 0) {
    for (const requirement of data.requirements) {
      await page.fill('input[name="requirements-input"]', requirement);
      await page.click('[data-testid="add-requirement-button"]');
      await page.waitForTimeout(200); // Wait for requirement to be added
    }
  }

  // Fill timeline (optional)
  if (data.timeline) {
    await page.fill('input[name="timeline"], #timeline', data.timeline);
  }
}

/**
 * Complete Step 3: Budget and Urgency and progress to Step 4
 */
export async function completeBudgetAndUrgency(
  page: Page,
  data: {
    budget: number;
    budgetType: BudgetType;
    urgency: UrgencyLevel;
    requirements?: string[];
    timeline?: string;
  }
): Promise<void> {
  await fillBudgetAndUrgency(page, data);
  await clickContinue(page);
}

/**
 * Fill Step 4: Location
 */
export async function fillLocation(
  page: Page,
  data: {
    address1: string;
    address2?: string;
    city: string;
    postalCode: string;
    province: typeof SA_PROVINCES[number];
  }
): Promise<void> {
  // Fill address line 1
  await page.fill('input[name="addressLine1"], #address1', data.address1);

  // Fill address line 2 (optional)
  if (data.address2) {
    await page.fill('input[name="addressLine2"], #address2', data.address2);
  }

  // Fill city
  await page.fill('input[name="city"], #city', data.city);

  // Fill postal code
  await page.fill('input[name="postalCode"], #postalCode', data.postalCode);

  // Select province
  await page.selectOption('select[name="province"], #province', data.province);
}

/**
 * Complete Step 4: Location and progress to Step 5
 */
export async function completeLocation(
  page: Page,
  data: {
    address1: string;
    address2?: string;
    city: string;
    postalCode: string;
    province: typeof SA_PROVINCES[number];
  }
): Promise<void> {
  await fillLocation(page, data);
  await clickContinue(page);
}

/**
 * Upload images (Step 5)
 */
export async function uploadImages(
  page: Page,
  imagePaths: string[]
): Promise<void> {
  if (imagePaths.length === 0) return;

  const fileInput = page.locator('input[type="file"], [data-testid="image-upload-input"]');

  // Upload multiple files at once
  await fileInput.setInputFiles(imagePaths);

  // Wait for images to be processed
  await page.waitForTimeout(500);
}

/**
 * Submit the job (Step 5)
 */
export async function submitJob(page: Page): Promise<void> {
  await page.click('[data-testid="submit-job-button"]');

  // Wait for submission to complete
  await page.waitForLoadState('networkidle');
}

/**
 * Complete the entire job creation wizard with default/test data
 * This is a convenience function for tests that just need a job created
 */
export async function createCompleteJob(
  page: Page,
  data?: {
    title?: string;
    description?: string;
    budget?: number;
    budgetType?: BudgetType;
    urgency?: UrgencyLevel;
    address1?: string;
    city?: string;
    postalCode?: string;
    province?: typeof SA_PROVINCES[number];
    requirements?: string[];
    imagePaths?: string[];
  }
): Promise<void> {
  // Default test data
  const defaults = {
    title: 'Test Job - Automated Test',
    description: 'This is a test job created by automated testing. It contains enough characters to pass validation requirements for the description field.',
    budget: 1000,
    budgetType: BudgetType.FIXED,
    urgency: UrgencyLevel.MEDIUM,
    address1: '123 Test Street',
    city: 'Cape Town',
    postalCode: '8001',
    province: 'Western Cape' as const,
    requirements: [],
    imagePaths: []
  };

  const jobData = { ...defaults, ...data };

  // Navigate to job creation
  await navigateToJobCreation(page);

  // Step 1: Basic Info
  await completeBasicInfo(page, {
    title: jobData.title,
    description: jobData.description
  });

  // Step 2: Category (select first available)
  await completeCategory(page, { index: 0 });

  // Step 3: Budget and Urgency
  await completeBudgetAndUrgency(page, {
    budget: jobData.budget,
    budgetType: jobData.budgetType,
    urgency: jobData.urgency,
    requirements: jobData.requirements
  });

  // Step 4: Location
  await completeLocation(page, {
    address1: jobData.address1,
    city: jobData.city,
    postalCode: jobData.postalCode,
    province: jobData.province
  });

  // Step 5: Images and Submit
  if (jobData.imagePaths && jobData.imagePaths.length > 0) {
    await uploadImages(page, jobData.imagePaths);
  }

  await submitJob(page);
}

/**
 * Verify we're on a specific wizard step
 */
export async function verifyCurrentStep(page: Page, step: WizardStep): Promise<void> {
  // Check if the step indicator shows the correct step
  const stepIndicator = page.locator(`[data-step="${step}"]`);
  await expect(stepIndicator).toBeVisible({ timeout: 5000 });
}

/**
 * Wait for form validation to complete
 * Useful when you need to ensure Continue button is enabled
 */
export async function waitForValidation(page: Page): Promise<void> {
  await page.waitForTimeout(300);
  const continueButton = page.locator('[data-testid="continue-button"]');
  await expect(continueButton).toBeEnabled({ timeout: 5000 });
}

/**
 * Check if Continue button is disabled (form has errors)
 */
export async function isContinueDisabled(page: Page): Promise<boolean> {
  const continueButton = page.locator('[data-testid="continue-button"]');
  return await continueButton.isDisabled();
}

/**
 * Get current validation errors on the page
 */
export async function getValidationErrors(page: Page): Promise<string[]> {
  const errorElements = page.locator('.text-red-600, .text-error, [role="alert"]');
  const count = await errorElements.count();

  const errors: string[] = [];
  for (let i = 0; i < count; i++) {
    const text = await errorElements.nth(i).textContent();
    if (text) errors.push(text.trim());
  }

  return errors;
}

/**
 * Save job as draft instead of publishing
 * Note: This function assumes a "Save Draft" button exists in the wizard
 */
export async function saveAsDraft(page: Page): Promise<void> {
  const draftButton = page.locator('button:has-text("Save Draft"), [data-testid="save-draft-button"]');
  await draftButton.click();
  await page.waitForLoadState('networkidle');
}
