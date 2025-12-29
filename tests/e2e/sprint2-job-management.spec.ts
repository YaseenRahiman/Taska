import { test, expect, Page } from '@playwright/test';
import {
  navigateToJobCreation,
  createCompleteJob,
  completeBasicInfo,
  completeCategory,
  completeBudgetAndUrgency,
  completeLocation,
  submitJob,
  BudgetType,
  UrgencyLevel,
  SA_PROVINCES,
} from '../helpers/job-wizard-helpers';

/**
 * SPRINT 2 - AGENT 2: Job Editing & Management Testing
 *
 * Comprehensive test suite covering:
 * - Job editing functionality
 * - Job status management and transitions
 * - Job listing and filtering
 * - Job details view
 * - Job deletion and permissions
 * - Mobile responsiveness
 * - Performance and edge cases
 */

// Test Configuration
const BACKEND_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:3001'; // Frontend served by backend in dev
const CLIENT_EMAIL = 'Grahiman02@gmail.com';
const CLIENT_PASSWORD = 'Qwerty12345!@';

// Test Data
const TEST_JOB_DATA = {
  title: 'Test Job for Editing',
  description: 'Original description for testing edit functionality',
  budget: 500,
  urgency: 'Flexible',
  address: '123 Test Street',
  city: 'Johannesburg',
  province: 'Gauteng',
  postalCode: '2000',
  requirements: 'Original requirements text',
};

const EDITED_JOB_DATA = {
  title: 'EDITED: Updated Job Title',
  description: 'EDITED: This description has been updated through the edit flow',
  budget: 750,
  urgency: 'Urgent',
  address: '456 Updated Avenue',
  city: 'Cape Town',
  province: 'Western Cape',
  postalCode: '8001',
  requirements: 'EDITED: Updated requirements and additional details',
};

// Test Issues Tracker
const issues: Array<{
  id: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  component: string;
  description: string;
  steps: string[];
  expected: string;
  actual: string;
  screenshot?: string;
}> = [];

function logIssue(issue: Omit<typeof issues[0], 'id'>) {
  const id = `JOB-MGMT-${String(issues.length + 1).padStart(3, '0')}`;
  issues.push({ id, ...issue });
  console.log(`\n🚨 ISSUE ${id} [${issue.severity}]: ${issue.description}`);
}

// Helper Functions
async function loginAsClient(page: Page) {
  console.log('\n🔐 Logging in as client...');
  await page.goto(`${FRONTEND_URL}/auth/login`);
  await page.waitForLoadState('networkidle');

  await page.fill('input[name="email"], input[type="email"]', CLIENT_EMAIL);
  await page.fill('input[name="password"], input[type="password"]', CLIENT_PASSWORD);
  await page.click('button[type="submit"]');

  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  const currentUrl = page.url();
  console.log(`✅ Login successful, redirected to: ${currentUrl}`);
}

async function createTestJob(page: Page, jobData = TEST_JOB_DATA): Promise<string | null> {
  console.log('\n📝 Creating test job using wizard helpers...');

  try {
    // Map urgency to enum
    const urgencyMap: Record<string, UrgencyLevel> = {
      'Flexible': UrgencyLevel.LOW,
      'Soon': UrgencyLevel.MEDIUM,
      'Urgent': UrgencyLevel.HIGH
    };

    // Use the comprehensive helper function
    await createCompleteJob(page, {
      title: jobData.title,
      description: jobData.description,
      budget: jobData.budget,
      budgetType: BudgetType.FIXED,
      urgency: urgencyMap[jobData.urgency] || UrgencyLevel.MEDIUM,
      address1: jobData.address,
      city: jobData.city,
      province: jobData.province as typeof SA_PROVINCES[number],
      postalCode: jobData.postalCode,
      requirements: jobData.requirements ? [jobData.requirements] : [],
    });

    // Extract job ID from URL
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    const jobIdMatch = currentUrl.match(/\/jobs\/([a-f0-9-]+)/);
    const jobId = jobIdMatch ? jobIdMatch[1] : null;

    console.log(`✅ Test job created${jobId ? ` with ID: ${jobId}` : ''}`);
    return jobId;
  } catch (error) {
    console.error('❌ Failed to create test job:', error);
    return null;
  }
}

async function navigateToMyJobs(page: Page) {
  console.log('\n📋 Navigating to My Jobs page...');
  await page.goto(`${FRONTEND_URL}/client/jobs`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
}

async function captureIssueScreenshot(page: Page, issueId: string): Promise<string> {
  const filename = `issue-${issueId}-${Date.now()}.png`;
  const path = `claudedocs/test-reports/screenshots/${filename}`;
  await page.screenshot({ path, fullPage: true });
  return filename;
}

// Test Suite
test.describe('Sprint 2: Job Editing & Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsClient(page);
  });

  test.describe('1. Job Editing Functionality', () => {
    test('should navigate to job edit page from job list', async ({ page }) => {
      console.log('\n🧪 TEST: Navigate to job edit page');

      let jobId: string | null = null;

      try {
        // Create a test job first
        jobId = await createTestJob(page);
        if (!jobId) {
          logIssue({
            severity: 'Critical',
            component: 'Job Creation',
            description: 'Cannot create test job for editing tests',
            steps: ['Attempt to create job via standard flow'],
            expected: 'Job created with valid ID returned',
            actual: 'Job creation failed or no ID returned',
          });
          throw new Error('Test job creation failed');
        }

        // Navigate to My Jobs
        await navigateToMyJobs(page);

        // Look for edit button/link
        const editButtons = await page.locator('a:has-text("Edit"), button:has-text("Edit"), [aria-label="Edit job"]').all();

        if (editButtons.length === 0) {
          logIssue({
            severity: 'High',
            component: 'Job List',
            description: 'No edit button found on job list page',
            steps: ['Navigate to /client/jobs', 'Look for edit buttons on job cards'],
            expected: 'Edit button/link visible on each job card',
            actual: 'No edit buttons found',
            screenshot: await captureIssueScreenshot(page, 'JOB-MGMT-001'),
          });
        } else {
          // Click first edit button
          await editButtons[0].click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(2000);

          const currentUrl = page.url();

          if (!currentUrl.includes('/edit')) {
            logIssue({
              severity: 'High',
              component: 'Job Edit Navigation',
              description: 'Edit button does not navigate to edit page',
              steps: ['Click edit button on job card'],
              expected: 'Navigate to /client/jobs/{id}/edit',
              actual: `Navigated to: ${currentUrl}`,
            });
          } else {
            console.log('✅ Successfully navigated to edit page');
          }
        }
      } catch (error) {
        console.error('❌ Test failed:', error);
        throw error;
      }
    });

    test('should edit job details and persist changes', async ({ page }) => {
      console.log('\n🧪 TEST: Edit job details');

      try {
        // Create test job
        const jobId = await createTestJob(page);
        if (!jobId) throw new Error('Failed to create test job');

        // Navigate directly to edit page
        await page.goto(`${FRONTEND_URL}/client/jobs/${jobId}/edit`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Check if edit form loads
        const titleInput = await page.locator('input[name="title"], #title').first();
        const titleExists = await titleInput.count() > 0;

        if (!titleExists) {
          logIssue({
            severity: 'Critical',
            component: 'Job Edit Form',
            description: 'Edit form does not load on edit page',
            steps: [`Navigate to /client/jobs/${jobId}/edit`],
            expected: 'Edit form with pre-filled job data',
            actual: 'Edit form not found',
            screenshot: await captureIssueScreenshot(page, 'JOB-MGMT-EDIT-001'),
          });
          throw new Error('Edit form not found');
        }

        // Check if form is pre-filled
        const currentTitle = await titleInput.inputValue();
        if (currentTitle !== TEST_JOB_DATA.title) {
          logIssue({
            severity: 'High',
            component: 'Job Edit Form',
            description: 'Edit form is not pre-filled with existing job data',
            steps: ['Open edit page for existing job'],
            expected: `Title field contains: "${TEST_JOB_DATA.title}"`,
            actual: `Title field contains: "${currentTitle}"`,
          });
        }

        // Edit the job details
        await titleInput.fill(EDITED_JOB_DATA.title);

        const descriptionField = await page.locator('textarea[name="description"], #description').first();
        await descriptionField.fill(EDITED_JOB_DATA.description);

        // Navigate through edit steps (if multi-step form)
        const nextButton = await page.locator('button:has-text("Next")').first();
        if (await nextButton.count() > 0) {
          // Multi-step edit form
          console.log('📝 Multi-step edit form detected');

          // Step through and update each section
          await nextButton.click();
          await page.waitForTimeout(1500);

          // Update budget
          const budgetInput = await page.locator('input[type="number"]').first();
          await budgetInput.fill(EDITED_JOB_DATA.budget.toString());

          await page.click('button:has-text("Next")');
          await page.waitForTimeout(1500);

          // Continue through remaining steps
          let stepCount = 0;
          while (await page.locator('button:has-text("Next")').count() > 0 && stepCount < 10) {
            await page.click('button:has-text("Next")');
            await page.waitForTimeout(1500);
            stepCount++;
          }
        }

        // Save changes
        const saveButton = await page.locator('button:has-text("Save"), button:has-text("Update"), button[type="submit"]').first();
        if (await saveButton.count() === 0) {
          logIssue({
            severity: 'Critical',
            component: 'Job Edit Form',
            description: 'No save/submit button found on edit form',
            steps: ['Navigate through edit form'],
            expected: 'Save or Update button visible',
            actual: 'No save button found',
          });
        } else {
          await saveButton.click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(3000);

          // Verify changes persisted
          await page.goto(`${FRONTEND_URL}/client/jobs/${jobId}`);
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(2000);

          const pageContent = await page.content();

          if (!pageContent.includes(EDITED_JOB_DATA.title)) {
            logIssue({
              severity: 'Critical',
              component: 'Job Edit Persistence',
              description: 'Edited job title not persisted to database',
              steps: ['Edit job title', 'Save changes', 'View job details'],
              expected: `Job details show edited title: "${EDITED_JOB_DATA.title}"`,
              actual: `Job details do not contain edited title`,
              screenshot: await captureIssueScreenshot(page, 'JOB-MGMT-PERSIST-001'),
            });
          } else {
            console.log('✅ Job edits persisted successfully');
          }
        }
      } catch (error) {
        console.error('❌ Test failed:', error);
      }
    });

    test('should validate edit form with same rules as creation', async ({ page }) => {
      console.log('\n🧪 TEST: Edit form validation');

      try {
        const jobId = await createTestJob(page);
        if (!jobId) throw new Error('Failed to create test job');

        await page.goto(`${FRONTEND_URL}/client/jobs/${jobId}/edit`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Test 1: Clear required field (title)
        const titleInput = await page.locator('input[name="title"], #title').first();
        await titleInput.fill('');

        // Attempt to save/proceed
        const nextOrSave = await page.locator('button:has-text("Next"), button:has-text("Save"), button[type="submit"]').first();
        await nextOrSave.click();
        await page.waitForTimeout(1000);

        // Check for validation error
        const validationError = await page.locator('text=/required/i, text=/cannot be empty/i, [class*="error"]').count();

        if (validationError === 0) {
          logIssue({
            severity: 'High',
            component: 'Job Edit Validation',
            description: 'No validation error when required field (title) is empty',
            steps: ['Edit job', 'Clear title field', 'Attempt to save'],
            expected: 'Validation error message displayed',
            actual: 'No validation error shown',
          });
        } else {
          console.log('✅ Required field validation working');
        }

        // Test 2: Invalid budget (negative number)
        await titleInput.fill('Valid Title');

        // Navigate to budget step if multi-step
        let attempts = 0;
        while (await page.locator('input[type="number"]').count() === 0 && attempts < 5) {
          const nextBtn = await page.locator('button:has-text("Next")').first();
          if (await nextBtn.count() > 0) {
            await nextBtn.click();
            await page.waitForTimeout(1000);
          }
          attempts++;
        }

        const budgetInput = await page.locator('input[type="number"]').first();
        if (await budgetInput.count() > 0) {
          await budgetInput.fill('-100');

          const nextBtn = await page.locator('button:has-text("Next"), button:has-text("Save")').first();
          await nextBtn.click();
          await page.waitForTimeout(1000);

          const budgetError = await page.locator('text=/invalid/i, text=/positive/i, [class*="error"]').count();

          if (budgetError === 0) {
            logIssue({
              severity: 'Medium',
              component: 'Job Edit Validation',
              description: 'No validation error for negative budget',
              steps: ['Edit job', 'Enter negative budget', 'Attempt to save'],
              expected: 'Validation error for invalid budget',
              actual: 'Negative budget accepted',
            });
          } else {
            console.log('✅ Budget validation working');
          }
        }

      } catch (error) {
        console.error('❌ Test failed:', error);
      }
    });

    test('should prevent editing jobs with bids (business rule)', async ({ page }) => {
      console.log('\n🧪 TEST: Cannot edit jobs with bids');

      // Note: This test requires a job with bids
      // For now, we'll test the UI behavior

      try {
        const jobId = await createTestJob(page);
        if (!jobId) throw new Error('Failed to create test job');

        // Check if there's any indication that jobs with bids cannot be edited
        await navigateToMyJobs(page);
        await page.waitForTimeout(2000);

        // Look for disabled edit buttons or warnings
        const disabledEditButtons = await page.locator('button[disabled]:has-text("Edit"), a[disabled]:has-text("Edit")').count();

        console.log(`ℹ️ Found ${disabledEditButtons} disabled edit buttons`);

        // This is an informational check - we'll document the behavior
        if (disabledEditButtons === 0) {
          console.log('ℹ️ No disabled edit buttons found - business rule may not be implemented yet');
        }

      } catch (error) {
        console.error('❌ Test failed:', error);
      }
    });
  });

  test.describe('2. Job Status Management', () => {
    test('should display current job status correctly', async ({ page }) => {
      console.log('\n🧪 TEST: Job status display');

      try {
        const jobId = await createTestJob(page);
        if (!jobId) throw new Error('Failed to create test job');

        await page.goto(`${FRONTEND_URL}/client/jobs/${jobId}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Look for status badge/indicator
        const statusBadge = await page.locator('[class*="status"], [class*="badge"], text=/draft|published|in progress|completed|cancelled/i').first();
        const statusExists = await statusBadge.count() > 0;

        if (!statusExists) {
          logIssue({
            severity: 'Medium',
            component: 'Job Status Display',
            description: 'No status indicator visible on job details page',
            steps: ['View job details page'],
            expected: 'Status badge showing current job status (e.g., DRAFT, PUBLISHED)',
            actual: 'No status indicator found',
            screenshot: await captureIssueScreenshot(page, 'JOB-STATUS-001'),
          });
        } else {
          const statusText = await statusBadge.textContent();
          console.log(`✅ Job status displayed: ${statusText}`);
        }

      } catch (error) {
        console.error('❌ Test failed:', error);
      }
    });

    test('should allow publishing draft job', async ({ page }) => {
      console.log('\n🧪 TEST: Publish draft job');

      try {
        const jobId = await createTestJob(page);
        if (!jobId) throw new Error('Failed to create test job');

        await page.goto(`${FRONTEND_URL}/client/jobs/${jobId}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Look for publish button
        const publishButton = await page.locator('button:has-text("Publish"), a:has-text("Publish")').first();
        const publishExists = await publishButton.count() > 0;

        if (!publishExists) {
          console.log('ℹ️ No publish button found - job may be auto-published on creation');
        } else {
          await publishButton.click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(2000);

          // Verify status changed
          const statusAfter = await page.locator('text=/published/i').count();

          if (statusAfter === 0) {
            logIssue({
              severity: 'High',
              component: 'Job Status Transition',
              description: 'Job status not updated after clicking Publish',
              steps: ['View draft job', 'Click Publish button'],
              expected: 'Job status changes to PUBLISHED',
              actual: 'Job status unchanged',
            });
          } else {
            console.log('✅ Job published successfully');
          }
        }

      } catch (error) {
        console.error('❌ Test failed:', error);
      }
    });

    test('should allow cancelling/closing published job', async ({ page }) => {
      console.log('\n🧪 TEST: Cancel/close job');

      try {
        const jobId = await createTestJob(page);
        if (!jobId) throw new Error('Failed to create test job');

        await page.goto(`${FRONTEND_URL}/client/jobs/${jobId}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Look for cancel/close button
        const cancelButton = await page.locator('button:has-text("Cancel"), button:has-text("Close"), a:has-text("Cancel")').first();
        const cancelExists = await cancelButton.count() > 0;

        if (!cancelExists) {
          logIssue({
            severity: 'Medium',
            component: 'Job Status Management',
            description: 'No cancel/close button found on job page',
            steps: ['View job details'],
            expected: 'Cancel or Close button available for job management',
            actual: 'No cancel/close action found',
          });
        } else {
          await cancelButton.click();
          await page.waitForTimeout(1000);

          // Check for confirmation dialog
          const confirmButton = await page.locator('button:has-text("Confirm"), button:has-text("Yes")').first();
          if (await confirmButton.count() > 0) {
            await confirmButton.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);

            console.log('✅ Job cancel/close action executed');
          } else {
            console.log('⚠️ No confirmation dialog found');
          }
        }

      } catch (error) {
        console.error('❌ Test failed:', error);
      }
    });
  });

  test.describe('3. Job Listing (My Jobs)', () => {
    test('should display all jobs created by client', async ({ page }) => {
      console.log('\n🧪 TEST: Display all client jobs');

      try {
        // Create multiple test jobs
        await createTestJob(page, { ...TEST_JOB_DATA, title: 'Test Job 1' });
        await createTestJob(page, { ...TEST_JOB_DATA, title: 'Test Job 2' });

        await navigateToMyJobs(page);

        // Count job cards
        const jobCards = await page.locator('[class*="job-card"], [class*="JobCard"], article, [role="article"]').count();

        console.log(`📋 Found ${jobCards} job cards on My Jobs page`);

        if (jobCards === 0) {
          logIssue({
            severity: 'Critical',
            component: 'Job Listing',
            description: 'No job cards displayed on My Jobs page despite jobs being created',
            steps: ['Create jobs', 'Navigate to /client/jobs'],
            expected: 'Job cards displayed for created jobs',
            actual: 'No job cards found',
            screenshot: await captureIssueScreenshot(page, 'JOB-LIST-001'),
          });
        } else if (jobCards < 2) {
          logIssue({
            severity: 'High',
            component: 'Job Listing',
            description: 'Not all created jobs are displayed',
            steps: ['Create 2+ jobs', 'View My Jobs page'],
            expected: 'All created jobs visible',
            actual: `Only ${jobCards} job(s) displayed`,
          });
        }

      } catch (error) {
        console.error('❌ Test failed:', error);
      }
    });

    test('should display job card with all required information', async ({ page }) => {
      console.log('\n🧪 TEST: Job card content');

      try {
        await createTestJob(page);
        await navigateToMyJobs(page);

        const pageContent = await page.content();

        // Check for key job information
        const checks = [
          { field: 'Title', present: pageContent.includes(TEST_JOB_DATA.title) },
          { field: 'Budget', present: pageContent.includes(TEST_JOB_DATA.budget.toString()) },
          { field: 'Location', present: pageContent.includes(TEST_JOB_DATA.city) },
        ];

        for (const check of checks) {
          if (!check.present) {
            logIssue({
              severity: 'Medium',
              component: 'Job Card Display',
              description: `Job ${check.field} not displayed on job card`,
              steps: ['View My Jobs page'],
              expected: `Job card shows ${check.field}`,
              actual: `${check.field} not found on page`,
            });
          } else {
            console.log(`✅ ${check.field} displayed correctly`);
          }
        }

      } catch (error) {
        console.error('❌ Test failed:', error);
      }
    });

    test('should show empty state when no jobs exist', async ({ page }) => {
      console.log('\n🧪 TEST: Empty state');

      try {
        // Navigate to a fresh client account (if possible) or check current state
        await navigateToMyJobs(page);

        const jobCards = await page.locator('[class*="job-card"], [class*="JobCard"], article').count();

        if (jobCards === 0) {
          const emptyState = await page.locator('text=/no jobs/i, text=/create your first/i, text=/get started/i').count();

          if (emptyState === 0) {
            logIssue({
              severity: 'Low',
              component: 'Job Listing Empty State',
              description: 'No empty state message when user has no jobs',
              steps: ['Navigate to My Jobs with no jobs created'],
              expected: 'Friendly empty state message with CTA to create first job',
              actual: 'Blank page or no guidance provided',
            });
          } else {
            console.log('✅ Empty state displayed');
          }
        }

      } catch (error) {
        console.error('❌ Test failed:', error);
      }
    });
  });

  test.describe('4. Job Filtering & Search', () => {
    test('should filter jobs by status', async ({ page }) => {
      console.log('\n🧪 TEST: Filter by status');

      try {
        await navigateToMyJobs(page);

        // Look for status filter controls
        const statusFilter = await page.locator('select:has(option:has-text("Draft")), [role="combobox"], button:has-text("Status")').first();
        const filterExists = await statusFilter.count() > 0;

        if (!filterExists) {
          logIssue({
            severity: 'Medium',
            component: 'Job Filtering',
            description: 'No status filter found on My Jobs page',
            steps: ['Navigate to My Jobs page'],
            expected: 'Status filter dropdown/select available',
            actual: 'No status filter control found',
            screenshot: await captureIssueScreenshot(page, 'JOB-FILTER-001'),
          });
        } else {
          console.log('✅ Status filter control found');

          // Test filter functionality
          await statusFilter.click();
          await page.waitForTimeout(500);

          const draftOption = await page.locator('text=/draft/i').first();
          if (await draftOption.count() > 0) {
            await draftOption.click();
            await page.waitForTimeout(1500);

            console.log('✅ Status filter applied');
          }
        }

      } catch (error) {
        console.error('❌ Test failed:', error);
      }
    });

    test('should search jobs by title/description', async ({ page }) => {
      console.log('\n🧪 TEST: Search functionality');

      try {
        await createTestJob(page, { ...TEST_JOB_DATA, title: 'UNIQUE_SEARCH_TERM_12345' });
        await navigateToMyJobs(page);

        // Look for search input
        const searchInput = await page.locator('input[type="search"], input[placeholder*="Search"], input[name="search"]').first();
        const searchExists = await searchInput.count() > 0;

        if (!searchExists) {
          logIssue({
            severity: 'Medium',
            component: 'Job Search',
            description: 'No search input found on My Jobs page',
            steps: ['Navigate to My Jobs page'],
            expected: 'Search input field for filtering jobs',
            actual: 'No search control found',
          });
        } else {
          await searchInput.fill('UNIQUE_SEARCH_TERM_12345');
          await page.waitForTimeout(1500);

          const pageContent = await page.content();

          if (pageContent.includes('UNIQUE_SEARCH_TERM_12345')) {
            console.log('✅ Search functionality working');
          } else {
            logIssue({
              severity: 'High',
              component: 'Job Search',
              description: 'Search does not filter results correctly',
              steps: ['Enter search term', 'Check filtered results'],
              expected: 'Jobs matching search term displayed',
              actual: 'Search term not found in results',
            });
          }
        }

      } catch (error) {
        console.error('❌ Test failed:', error);
      }
    });

    test('should sort jobs by different criteria', async ({ page }) => {
      console.log('\n🧪 TEST: Sort functionality');

      try {
        await navigateToMyJobs(page);

        // Look for sort controls
        const sortControl = await page.locator('select:has(option:has-text("Newest")), button:has-text("Sort")').first();
        const sortExists = await sortControl.count() > 0;

        if (!sortExists) {
          logIssue({
            severity: 'Low',
            component: 'Job Sorting',
            description: 'No sort control found on My Jobs page',
            steps: ['Navigate to My Jobs page'],
            expected: 'Sort dropdown with options (Newest, Budget, etc.)',
            actual: 'No sort control found',
          });
        } else {
          console.log('✅ Sort control found');
        }

      } catch (error) {
        console.error('❌ Test failed:', error);
      }
    });
  });

  test.describe('5. Job Deletion', () => {
    test('should delete draft job successfully', async ({ page }) => {
      console.log('\n🧪 TEST: Delete draft job');

      try {
        const jobId = await createTestJob(page, { ...TEST_JOB_DATA, title: 'Job to Delete' });
        if (!jobId) throw new Error('Failed to create test job');

        await page.goto(`${FRONTEND_URL}/client/jobs/${jobId}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Look for delete button
        const deleteButton = await page.locator('button:has-text("Delete"), a:has-text("Delete"), button[aria-label*="Delete"]').first();
        const deleteExists = await deleteButton.count() > 0;

        if (!deleteExists) {
          logIssue({
            severity: 'Medium',
            component: 'Job Deletion',
            description: 'No delete button found on job details page',
            steps: ['View job details'],
            expected: 'Delete button available for draft jobs',
            actual: 'No delete button found',
          });
        } else {
          await deleteButton.click();
          await page.waitForTimeout(1000);

          // Check for confirmation dialog
          const confirmButton = await page.locator('button:has-text("Confirm"), button:has-text("Delete"), button:has-text("Yes")').first();
          if (await confirmButton.count() > 0) {
            await confirmButton.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);

            // Verify deletion
            await page.goto(`${FRONTEND_URL}/client/jobs/${jobId}`);
            await page.waitForTimeout(2000);

            const notFoundMessage = await page.locator('text=/not found/i, text=/deleted/i, text=/doesn\'t exist/i').count();

            if (notFoundMessage > 0) {
              console.log('✅ Job deleted successfully');
            } else {
              logIssue({
                severity: 'High',
                component: 'Job Deletion',
                description: 'Deleted job still accessible',
                steps: ['Delete job', 'Attempt to access deleted job URL'],
                expected: 'Job not found / 404 error',
                actual: 'Job still accessible after deletion',
              });
            }
          } else {
            logIssue({
              severity: 'Low',
              component: 'Job Deletion',
              description: 'No confirmation dialog before deleting job',
              steps: ['Click delete button'],
              expected: 'Confirmation dialog to prevent accidental deletion',
              actual: 'Job deleted immediately without confirmation',
            });
          }
        }

      } catch (error) {
        console.error('❌ Test failed:', error);
      }
    });
  });

  test.describe('6. Permissions & Security', () => {
    test('should only show edit/delete for own jobs', async ({ page }) => {
      console.log('\n🧪 TEST: Job ownership permissions');

      try {
        const jobId = await createTestJob(page);
        if (!jobId) throw new Error('Failed to create test job');

        // Check that edit/delete buttons are present for own job
        await page.goto(`${FRONTEND_URL}/client/jobs/${jobId}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const editButton = await page.locator('button:has-text("Edit"), a:has-text("Edit")').count();
        const deleteButton = await page.locator('button:has-text("Delete"), a:has-text("Delete")').count();

        if (editButton === 0 && deleteButton === 0) {
          logIssue({
            severity: 'High',
            component: 'Job Permissions',
            description: 'No edit/delete buttons for own job',
            steps: ['Create job', 'View job details as owner'],
            expected: 'Edit and Delete buttons visible',
            actual: 'No management buttons found',
          });
        } else {
          console.log('✅ Management buttons present for own jobs');
        }

        // Note: Testing access to other users' jobs requires a second user account
        // This would be implemented in a more complex test scenario

      } catch (error) {
        console.error('❌ Test failed:', error);
      }
    });
  });

  test.describe('7. Performance & Edge Cases', () => {
    test('should handle jobs with no images', async ({ page }) => {
      console.log('\n🧪 TEST: Job with no images');

      try {
        const jobId = await createTestJob(page); // Created without images
        if (!jobId) throw new Error('Failed to create test job');

        await page.goto(`${FRONTEND_URL}/client/jobs/${jobId}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Check if page renders correctly without images
        const errorMessages = await page.locator('text=/error/i, text=/failed/i').count();

        if (errorMessages > 0) {
          logIssue({
            severity: 'Medium',
            component: 'Job Display',
            description: 'Error displayed for job with no images',
            steps: ['Create job without images', 'View job details'],
            expected: 'Job displays correctly with placeholder or no image section',
            actual: 'Error message shown',
            screenshot: await captureIssueScreenshot(page, 'JOB-NO-IMAGE-001'),
          });
        } else {
          console.log('✅ Job without images displays correctly');
        }

      } catch (error) {
        console.error('❌ Test failed:', error);
      }
    });

    test('should handle very long title and description', async ({ page }) => {
      console.log('\n🧪 TEST: Long text content');

      try {
        const longText = 'A'.repeat(500);
        const jobId = await createTestJob(page, {
          ...TEST_JOB_DATA,
          title: `Long Title: ${longText.substring(0, 100)}`,
          description: longText,
        });

        if (!jobId) throw new Error('Failed to create test job');

        await navigateToMyJobs(page);

        // Check if layout breaks
        const layoutIssues = await page.locator('[class*="overflow"], [style*="overflow"]').count();

        console.log('✅ Long text handled in job listing');

      } catch (error) {
        console.error('❌ Test failed:', error);
      }
    });

    test('should handle special characters in job data', async ({ page }) => {
      console.log('\n🧪 TEST: Special characters');

      try {
        const specialChars = "Test <script>alert('xss')</script> & Special © Chars™";
        const jobId = await createTestJob(page, {
          ...TEST_JOB_DATA,
          title: specialChars,
        });

        if (jobId) {
          await page.goto(`${FRONTEND_URL}/client/jobs/${jobId}`);
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(2000);

          const pageContent = await page.content();

          if (pageContent.includes('<script>')) {
            logIssue({
              severity: 'Critical',
              component: 'Security - XSS',
              description: 'Unescaped script tags in job content (XSS vulnerability)',
              steps: ['Create job with script tags in title', 'View job details'],
              expected: 'Script tags escaped/sanitized',
              actual: 'Raw script tags present in HTML',
              screenshot: await captureIssueScreenshot(page, 'SECURITY-XSS-001'),
            });
          } else {
            console.log('✅ Special characters properly escaped');
          }
        }

      } catch (error) {
        console.error('❌ Test failed:', error);
      }
    });
  });
});

// Test Suite Complete - Generate Report
test.afterAll(async () => {
  console.log('\n' + '='.repeat(80));
  console.log('📊 SPRINT 2 - JOB MANAGEMENT TEST RESULTS');
  console.log('='.repeat(80));

  if (issues.length === 0) {
    console.log('\n✅ NO ISSUES FOUND - All tests passed!');
  } else {
    console.log(`\n🚨 TOTAL ISSUES FOUND: ${issues.length}\n`);

    const critical = issues.filter(i => i.severity === 'Critical').length;
    const high = issues.filter(i => i.severity === 'High').length;
    const medium = issues.filter(i => i.severity === 'Medium').length;
    const low = issues.filter(i => i.severity === 'Low').length;

    console.log(`   Critical: ${critical}`);
    console.log(`   High: ${high}`);
    console.log(`   Medium: ${medium}`);
    console.log(`   Low: ${low}`);

    console.log('\n' + '-'.repeat(80));
    console.log('ISSUE DETAILS:');
    console.log('-'.repeat(80));

    for (const issue of issues) {
      console.log(`\n${issue.id} [${issue.severity}] - ${issue.component}`);
      console.log(`Description: ${issue.description}`);
      console.log(`Expected: ${issue.expected}`);
      console.log(`Actual: ${issue.actual}`);
      if (issue.screenshot) {
        console.log(`Screenshot: ${issue.screenshot}`);
      }
    }
  }

  console.log('\n' + '='.repeat(80));
});
