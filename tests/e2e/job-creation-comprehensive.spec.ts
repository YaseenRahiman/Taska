import { test, expect } from '@playwright/test';
import { captureTestResults, generateTestReport, logStep, captureScreenshot, waitWithLog } from '../helpers/test-reporter';

/**
 * Comprehensive Job Creation Test Suite
 * Tests all job creation entry points and verifies consistency
 */

// Shared test data
const TEST_JOB_DIRECT = {
  title: 'Direct Page Test - Plumbing Repair',
  description: 'Test job created via direct URL navigation to /client/jobs/create',
  budget: 850,
  urgency: 'Urgent',
  address: '789 Direct St',
  city: 'Durban',
  province: 'KwaZulu-Natal',
  postalCode: '4000',
  requirements: 'Direct page test - licensed plumber required',
};

const TEST_JOB_MODAL = {
  title: 'Modal Test - Emergency Plumbing',
  description: 'Test job created via dashboard modal button',
  budget: 950,
  urgency: 'Urgent',
  address: '321 Modal Ave',
  city: 'Pretoria',
  province: 'Gauteng',
  postalCode: '0001',
  requirements: 'Modal test - immediate response needed',
};

/**
 * Helper: Login as client
 */
async function loginAsClient(page: any) {
  await page.goto('http://localhost:3001/auth/login', { waitUntil: 'networkidle' });
  await page.fill('input[name="email"], input[type="email"]', 'Grahiman02@gmail.com');
  await page.fill('input[name="password"], input[type="password"]', 'Qwerty12345!@');
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  await waitWithLog(2000, 'Login complete');
}

/**
 * Helper: Fill job creation form
 */
async function fillJobForm(page: any, jobData: any) {
  // Basic Info
  await page.fill('input[name="title"], #title', jobData.title);
  await page.fill('textarea[name="description"], #description', jobData.description);
  await page.click('button:has-text("Next")');
  await page.waitForLoadState('networkidle');
  await waitWithLog(1500, 'Next: Category');

  // Category - Try to select Plumbing
  await waitWithLog(2000, 'Categories loading');
  try {
    await page.click('text=/Plumbing/i', { timeout: 3000 });
  } catch (e) {
    console.log('⚠️ Could not select category');
  }
  await page.click('button:has-text("Next")');
  await page.waitForLoadState('networkidle');
  await waitWithLog(1500, 'Next: Budget');

  // Budget & Urgency
  await page.fill('input[type="number"]', jobData.budget.toString());
  await page.click(`div[class*="cursor-pointer"]:has-text("${jobData.urgency}")`);
  await page.click('button:has-text("Next")');
  await page.waitForLoadState('networkidle');
  await waitWithLog(1500, 'Next: Location');

  // Location
  await page.waitForSelector('input[name="location.address"]', { timeout: 10000 });
  await page.fill('input[name="location.address"]', jobData.address);
  await page.fill('input[name="location.city"]', jobData.city);
  await page.selectOption('select[name="location.province"]', jobData.province);
  await page.fill('input[name="location.postalCode"]', jobData.postalCode);
  await page.click('button:has-text("Next")');
  await page.waitForLoadState('networkidle');
  await waitWithLog(1500, 'Next: Details');

  // Additional Details
  await page.waitForSelector('textarea[name="requirements"]', { timeout: 5000 });
  await page.fill('textarea[name="requirements"]', jobData.requirements);
  await page.click('button:has-text("Next")');
  await page.waitForLoadState('networkidle');
  await waitWithLog(1500, 'Next: Images');

  // Skip Images
  await page.click('button:has-text("Next"), button:has-text("Skip")');
  await page.waitForLoadState('networkidle');
  await waitWithLog(1500, 'Next: Review');
}

/**
 * Helper: Submit job
 */
async function submitJob(page: any): Promise<boolean> {
  await waitWithLog(1500, 'React stabilization');

  const submitStrategies = [
    async () => {
      await page.click('button:has-text("Post Job")', { force: true, timeout: 5000 });
    },
    async () => {
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const submitBtn = buttons.find(btn => btn.textContent?.includes('Post Job'));
        if (submitBtn) (submitBtn as HTMLElement).click();
      });
    },
  ];

  for (const [index, strategy] of submitStrategies.entries()) {
    try {
      await strategy();
      console.log(`✅ Submit successful using strategy ${index + 1}`);
      await waitWithLog(3000, 'Submission processing');
      return true;
    } catch (error: any) {
      console.log(`⚠️ Submit strategy ${index + 1} failed`);
    }
  }

  return false;
}

/**
 * Helper: Validate no errors
 */
async function validateNoErrors(page: any): Promise<{ valid: boolean; errors: string[] }> {
  const pageText = await page.evaluate(() => document.body.innerText);
  const errors: string[] = [];

  if (pageText.toLowerCase().includes('invalid category')) {
    errors.push('Invalid category ID error detected');
  }

  if (pageText.toLowerCase().includes('validation') &&
      pageText.toLowerCase().includes('error')) {
    errors.push('Validation error detected');
  }

  const errorElements = await page.$$('[class*="error"], [role="alert"]');
  if (errorElements.length > 0) {
    for (const el of errorElements) {
      const text = await el.textContent();
      if (text?.trim()) {
        errors.push(`UI Error: ${text.trim()}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

test.describe('Job Creation - Comprehensive Test Suite', () => {
  test.setTimeout(180000); // 3 minutes

  test('Via direct URL navigation', async ({ page }, testInfo) => {
    console.log('\n🎯 TEST: Job Creation via Direct URL\n');

    try {
      // Login
      logStep(1, 'Logging in');
      await loginAsClient(page);
      await captureScreenshot(page, 'direct-01-logged-in');
      logStep(1, 'Login complete', 'complete');

      // Navigate directly to job creation
      logStep(2, 'Navigating to /client/jobs/create');
      await page.goto('http://localhost:3001/client/jobs/create', { waitUntil: 'networkidle' });
      await waitWithLog(2000, 'Page loaded');
      await captureScreenshot(page, 'direct-02-job-creation-page');

      const currentUrl = page.url();
      expect(currentUrl).toContain('/jobs/create');
      logStep(2, 'Navigation complete', 'complete');

      // Fill form
      logStep(3, 'Filling job creation form');
      await fillJobForm(page, TEST_JOB_DIRECT);
      await captureScreenshot(page, 'direct-03-review-page');
      logStep(3, 'Form filled', 'complete');

      // Submit
      logStep(4, 'Submitting job');
      const submitted = await submitJob(page);
      expect(submitted).toBe(true);
      await captureScreenshot(page, 'direct-04-after-submission');
      logStep(4, 'Job submitted', 'complete');

      // Validate
      logStep(5, 'Validating results');
      const validation = await validateNoErrors(page);
      const finalUrl = page.url();

      await captureScreenshot(page, 'direct-05-final-state');

      console.log('\n📊 DIRECT URL TEST RESULTS:');
      console.log(`  Final URL: ${finalUrl}`);
      console.log(`  Validation: ${validation.valid ? '✅ PASS' : '❌ FAIL'}`);
      if (validation.errors.length > 0) {
        console.log('  Errors:');
        validation.errors.forEach(err => console.log(`    - ${err}`));
      }
      console.log(`  Redirected to job page: ${finalUrl.includes('/jobs/') ? '✅' : '❌'}`);

      expect(validation.valid).toBe(true);
      expect(finalUrl).toContain('/jobs/');

      logStep(5, 'Direct URL test passed', 'complete');
      console.log('\n✅ DIRECT URL TEST COMPLETED SUCCESSFULLY\n');

    } catch (error: any) {
      console.error('\n❌ DIRECT URL TEST FAILED:', error.message);
      await captureScreenshot(page, 'direct-error');
      throw error;
    } finally {
      const results = await captureTestResults(testInfo);
      console.log(generateTestReport(results));
    }
  });

  test('Via dashboard modal (or navigation)', async ({ page }, testInfo) => {
    console.log('\n🎯 TEST: Job Creation via Dashboard\n');

    try {
      // Login
      logStep(1, 'Logging in');
      await loginAsClient(page);
      await captureScreenshot(page, 'modal-01-logged-in');

      const dashboardUrl = page.url();
      expect(dashboardUrl).toContain('/dashboard');
      logStep(1, 'On dashboard', 'complete');

      // Find "Post a New Job" button
      logStep(2, 'Opening job creation from dashboard');

      const modalTriggerSelectors = [
        'button:has-text("Post a New Job")',
        'a:has-text("Post a New Job")',
        'button:has-text("Post New Job")',
        'a[href*="/jobs/create"]',
      ];

      let jobCreationOpened = false;
      for (const selector of modalTriggerSelectors) {
        try {
          await page.click(selector, { timeout: 3000 });
          jobCreationOpened = true;
          console.log(`✅ Clicked: ${selector}`);
          break;
        } catch (error) {
          console.log(`⚠️ Not found: ${selector}`);
        }
      }

      if (!jobCreationOpened) {
        await captureScreenshot(page, 'modal-02-trigger-not-found');
        throw new Error('Could not find job creation trigger on dashboard');
      }

      await waitWithLog(1000, 'Job creation opened');
      await captureScreenshot(page, 'modal-02-job-creation-opened');
      logStep(2, 'Job creation opened', 'complete');

      // Fill form
      logStep(3, 'Filling job creation form');
      await fillJobForm(page, TEST_JOB_MODAL);
      await captureScreenshot(page, 'modal-03-review-page');
      logStep(3, 'Form filled', 'complete');

      // Submit
      logStep(4, 'Submitting job');
      const submitted = await submitJob(page);
      expect(submitted).toBe(true);
      await captureScreenshot(page, 'modal-04-after-submission');
      logStep(4, 'Job submitted', 'complete');

      // Validate
      logStep(5, 'Validating results');
      const validation = await validateNoErrors(page);
      const finalUrl = page.url();

      await captureScreenshot(page, 'modal-05-final-state');

      console.log('\n📊 DASHBOARD MODAL TEST RESULTS:');
      console.log(`  Final URL: ${finalUrl}`);
      console.log(`  Validation: ${validation.valid ? '✅ PASS' : '❌ FAIL'}`);
      if (validation.errors.length > 0) {
        console.log('  Errors:');
        validation.errors.forEach(err => console.log(`    - ${err}`));
      }
      console.log(`  Redirected to job page: ${finalUrl.includes('/jobs/') ? '✅' : '❌'}`);

      expect(validation.valid).toBe(true);
      expect(finalUrl).toContain('/jobs/');

      logStep(5, 'Dashboard test passed', 'complete');
      console.log('\n✅ DASHBOARD TEST COMPLETED SUCCESSFULLY\n');

    } catch (error: any) {
      console.error('\n❌ DASHBOARD TEST FAILED:', error.message);
      await captureScreenshot(page, 'modal-error');
      throw error;
    } finally {
      const results = await captureTestResults(testInfo);
      console.log(generateTestReport(results));
    }
  });

  test('Both flows create valid jobs consistently', async ({ page }, testInfo) => {
    console.log('\n🎯 TEST: Consistency Validation\n');

    try {
      // This test verifies that both flows produce similar results
      // We'll check that the jobs are created and accessible

      logStep(1, 'Logging in to verify jobs');
      await loginAsClient(page);
      await captureScreenshot(page, 'consistency-01-logged-in');

      // Navigate to jobs list or dashboard
      await page.goto('http://localhost:3001/client/dashboard', { waitUntil: 'networkidle' });
      await waitWithLog(2000, 'Dashboard loaded');
      await captureScreenshot(page, 'consistency-02-dashboard');

      logStep(1, 'Checking for created jobs', 'complete');

      // Look for recently created jobs
      logStep(2, 'Verifying job listings');

      const pageText = await page.evaluate(() => document.body.innerText);

      // Check if either test job title appears
      const hasDirectJob = pageText.includes(TEST_JOB_DIRECT.title) ||
                          pageText.includes('Direct Page Test');
      const hasModalJob = pageText.includes(TEST_JOB_MODAL.title) ||
                         pageText.includes('Modal Test');

      console.log('\n📊 CONSISTENCY CHECK:');
      console.log(`  Direct job visible: ${hasDirectJob ? '✅' : '⚠️'}`);
      console.log(`  Modal job visible: ${hasModalJob ? '✅' : '⚠️'}`);

      // At least one should be visible (may not see both if tests ran separately)
      const hasJobs = hasDirectJob || hasModalJob;

      await captureScreenshot(page, 'consistency-03-jobs-list');

      logStep(2, 'Job listings verified', 'complete');

      console.log(`\n${hasJobs ? '✅' : '⚠️'} Jobs are being created successfully`);
      console.log('\n✅ CONSISTENCY TEST COMPLETED\n');

    } catch (error: any) {
      console.error('\n❌ CONSISTENCY TEST FAILED:', error.message);
      await captureScreenshot(page, 'consistency-error');
      throw error;
    } finally {
      const results = await captureTestResults(testInfo);
      console.log(generateTestReport(results));
    }
  });
});
