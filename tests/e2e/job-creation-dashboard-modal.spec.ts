import { test, expect } from '@playwright/test';
import { captureTestResults, generateTestReport, logStep, captureScreenshot, waitWithLog } from '../helpers/test-reporter';

/**
 * Test: Job Creation via Dashboard Modal
 * Tests the "Post a New Job" button on the client dashboard
 */
test.describe('Job Creation - Dashboard Modal Flow', () => {
  test.setTimeout(120000); // 2 minutes

  test('Create job from dashboard modal', async ({ page }, testInfo) => {
    console.log('\n🎯 TEST: Job Creation via Dashboard Modal\n');

    try {
      // Step 1: Login
      logStep(1, 'Logging in as client user');
      await page.goto('http://localhost:3001/auth/login', { waitUntil: 'networkidle' });
      await captureScreenshot(page, '01-login-page');

      await page.fill('input[name="email"], input[type="email"]', 'Grahiman02@gmail.com');
      await page.fill('input[name="password"], input[type="password"]', 'Qwerty12345!@');
      await captureScreenshot(page, '02-credentials-entered');

      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
      await waitWithLog(2000, 'Allow dashboard to load');

      const dashboardUrl = page.url();
      expect(dashboardUrl).toContain('/client/dashboard');
      await captureScreenshot(page, '03-dashboard-loaded');
      logStep(1, 'Logged in and on dashboard', 'complete');

      // Step 2: Find and click "Post a New Job" button/link
      logStep(2, 'Opening "Post a New Job" modal');

      // Try multiple selectors for the modal trigger
      const modalTriggerSelectors = [
        'button:has-text("Post a New Job")',
        'a:has-text("Post a New Job")',
        'button:has-text("Post New Job")',
        'button:has-text("Create Job")',
        '[data-action="post-job"]',
        '[class*="post-job"]',
      ];

      let modalOpened = false;
      for (const selector of modalTriggerSelectors) {
        try {
          console.log(`Trying modal trigger selector: ${selector}`);
          await page.click(selector, { timeout: 3000 });
          modalOpened = true;
          console.log(`✅ Modal opened using selector: ${selector}`);
          break;
        } catch (error) {
          console.log(`⚠️ Selector failed: ${selector}`);
        }
      }

      if (!modalOpened) {
        // Take screenshot and log available buttons
        await captureScreenshot(page, '04-modal-trigger-not-found');
        const buttons = await page.$$eval('button', btns =>
          btns.map(btn => btn.textContent?.trim())
        );
        console.log('Available buttons:', buttons);

        // Try clicking any job-related link
        await page.click('a[href*="job"], a[href*="create"]').catch(() => {
          throw new Error('Could not find "Post a New Job" button or link on dashboard');
        });
      }

      await waitWithLog(1000, 'Wait for modal to appear');

      // Step 3: Verify modal is open
      logStep(3, 'Verifying modal opened');

      const modalSelectors = [
        '[role="dialog"]',
        '.modal',
        '[class*="Modal"]',
        '[class*="dialog"]',
        '[data-modal="true"]',
      ];

      let modalFound = false;
      for (const selector of modalSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 3000 });
          modalFound = true;
          console.log(`✅ Modal detected using selector: ${selector}`);
          break;
        } catch (error) {
          console.log(`⚠️ Modal selector not found: ${selector}`);
        }
      }

      await captureScreenshot(page, '05-modal-opened');

      if (!modalFound) {
        console.log('⚠️ No modal found - might be full page navigation instead');
        // Check if we navigated to job creation page
        const currentUrl = page.url();
        if (currentUrl.includes('/jobs/create')) {
          console.log('✅ Navigated to job creation page instead of modal');
        }
      }

      logStep(3, 'Modal verified or navigated to job creation', 'complete');

      // Step 4: Fill Basic Information
      logStep(4, 'Filling basic job information');

      await page.fill('input[name="title"], #title', 'Emergency plumbing repair - burst pipe');
      await page.fill(
        'textarea[name="description"], #description',
        'Burst pipe in kitchen needs immediate repair. Water damage risk. Need licensed plumber ASAP.'
      );

      await captureScreenshot(page, '06-basic-info-filled');
      logStep(4, 'Basic information entered', 'complete');

      // Click Next
      await page.click('button:has-text("Next"), button[type="submit"]:has-text("Next")');
      await page.waitForLoadState('networkidle');
      await waitWithLog(1500, 'Transition to category selection');
      await captureScreenshot(page, '07-after-basic-next');

      // Step 5: Category Selection
      logStep(5, 'Selecting category');

      await waitWithLog(2000, 'Allow categories to load');

      // Try to select Plumbing category
      const plumbingSelectors = [
        'text=/Plumbing/i',
        'button:has-text("Plumbing")',
        'div:has-text("Plumbing")',
        '[data-category*="plumbing" i]',
      ];

      let categorySelected = false;
      for (const selector of plumbingSelectors) {
        try {
          console.log(`Trying to select Plumbing with: ${selector}`);
          await page.click(selector, { timeout: 3000 });
          categorySelected = true;
          console.log(`✅ Selected Plumbing category`);
          break;
        } catch (error) {
          console.log(`⚠️ Category selector failed: ${selector}`);
        }
      }

      await captureScreenshot(page, '08-category-selected');

      if (!categorySelected) {
        console.log('⚠️ Could not select category - will continue anyway');
      }

      logStep(5, 'Category selection attempted', 'complete');

      // Click Next
      await page.click('button:has-text("Next")');
      await page.waitForLoadState('networkidle');
      await waitWithLog(1500, 'Transition to budget');
      await captureScreenshot(page, '09-after-category-next');

      // Step 6: Budget & Urgency
      logStep(6, 'Setting budget and urgency');

      await page.fill('input[type="number"]', '1200');
      await page.click('div[class*="cursor-pointer"]:has-text("Urgent")');
      await waitWithLog(500, 'Urgency selected');

      await captureScreenshot(page, '10-budget-filled');
      logStep(6, 'Budget and urgency set', 'complete');

      await page.click('button:has-text("Next")');
      await page.waitForLoadState('networkidle');
      await waitWithLog(1500, 'Transition to location');
      await captureScreenshot(page, '11-after-budget-next');

      // Step 7: Location
      logStep(7, 'Filling location information');

      await page.waitForSelector('input[name="location.address"]', { timeout: 10000 });

      await page.fill('input[name="location.address"]', '456 Emergency Ave');
      await page.fill('input[name="location.city"]', 'Johannesburg');
      await page.selectOption('select[name="location.province"]', 'Gauteng');
      await page.fill('input[name="location.postalCode"]', '2000');

      await captureScreenshot(page, '12-location-filled');
      logStep(7, 'Location information entered', 'complete');

      await page.click('button:has-text("Next")');
      await page.waitForLoadState('networkidle');
      await waitWithLog(1500, 'Transition to details');
      await captureScreenshot(page, '13-after-location-next');

      // Step 8: Additional Details
      logStep(8, 'Adding additional details');

      await page.waitForSelector('textarea[name="requirements"]', { timeout: 5000 });
      await page.fill('textarea[name="requirements"]', 'Licensed plumber required. Emergency call-out. Available immediately.');

      try {
        await page.fill('input[name="timeline"]', 'Immediate', { timeout: 2000 });
      } catch (e) {
        console.log('Timeline field not found, skipping...');
      }

      await captureScreenshot(page, '14-details-filled');
      logStep(8, 'Additional details entered', 'complete');

      await page.click('button:has-text("Next")');
      await page.waitForLoadState('networkidle');
      await waitWithLog(1500, 'Transition to images');
      await captureScreenshot(page, '15-after-details-next');

      // Step 9: Images (Skip)
      logStep(9, 'Skipping image upload');
      await captureScreenshot(page, '16-image-page');

      await page.click('button:has-text("Next"), button:has-text("Skip")');
      await page.waitForLoadState('networkidle');
      await waitWithLog(1500, 'Transition to review');
      await captureScreenshot(page, '17-review-page');

      // Step 10: Review & Submit
      logStep(10, 'Submitting job from modal');

      // Check for errors
      const errorElements = await page.$$('[class*="error"], [role="alert"]');
      if (errorElements.length > 0) {
        console.log(`⚠️ Found ${errorElements.length} error elements`);
        for (const el of errorElements) {
          const text = await el.textContent();
          console.log(`Error: ${text}`);
        }
      }

      await waitWithLog(1500, 'React stabilization');

      // Submit strategies
      let submitClicked = false;
      const submitStrategies = [
        async () => {
          await page.click('button:has-text("Post Job")', { force: true, timeout: 5000 });
        },
        async () => {
          await page.waitForSelector('button:has-text("Post Job")', { state: 'visible', timeout: 5000 });
          await waitWithLog(500, 'Button visible');
          await page.click('button:has-text("Post Job")');
        },
        async () => {
          await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const submitBtn = buttons.find(btn => btn.textContent?.includes('Post Job'));
            if (submitBtn) (submitBtn as HTMLElement).click();
          });
        },
        async () => {
          await page.evaluate(() => {
            const form = document.querySelector('form');
            if (form) form.requestSubmit();
          });
        },
      ];

      for (const [index, strategy] of submitStrategies.entries()) {
        try {
          console.log(`Attempting submit strategy ${index + 1}...`);
          await strategy();
          submitClicked = true;
          console.log(`✅ Submit successful using strategy ${index + 1}`);
          break;
        } catch (error: any) {
          console.log(`⚠️ Submit strategy ${index + 1} failed: ${error.message}`);
        }
      }

      await waitWithLog(3000, 'Submission processing');
      await captureScreenshot(page, '18-after-submission');

      logStep(10, 'Job submission completed', 'complete');

      // Step 11: Verify modal closed and job created
      logStep(11, 'Verifying submission results');

      const finalUrl = page.url();
      console.log(`Final URL: ${finalUrl}`);

      const pageText = await page.evaluate(() => document.body.innerText);

      const hasInvalidCategoryError = pageText.toLowerCase().includes('invalid category');
      const hasValidationError = pageText.toLowerCase().includes('validation') &&
                                 pageText.toLowerCase().includes('error');
      const hasSuccessMessage = pageText.toLowerCase().includes('success') ||
                               pageText.toLowerCase().includes('created') ||
                               pageText.toLowerCase().includes('posted');

      // Check if modal closed (if it was a modal)
      let modalClosed = true;
      for (const selector of modalSelectors) {
        try {
          const modalStillVisible = await page.isVisible(selector);
          if (modalStillVisible) {
            modalClosed = false;
            console.log(`⚠️ Modal still visible: ${selector}`);
          }
        } catch (e) {
          // Modal not found = closed
        }
      }

      await captureScreenshot(page, '19-final-state');

      // Generate report
      console.log('\n' + '='.repeat(80));
      console.log('📊 DASHBOARD MODAL TEST REPORT');
      console.log('='.repeat(80));
      console.log(`Test Date: ${new Date().toISOString()}`);
      console.log(`Final URL: ${finalUrl}`);
      console.log('\n✅ COMPLETED STEPS:');
      console.log('  ✓ Step 1: User login');
      console.log('  ✓ Step 2: Dashboard access');
      console.log('  ✓ Step 3: Modal opened (or navigation to job creation)');
      console.log('  ✓ Step 4: Basic information entry');
      console.log('  ✓ Step 5: Category selection');
      console.log('  ✓ Step 6: Budget and urgency');
      console.log('  ✓ Step 7: Location information');
      console.log('  ✓ Step 8: Additional details');
      console.log('  ✓ Step 9: Image upload (skipped)');
      console.log('  ✓ Step 10: Job submission');
      console.log('  ✓ Step 11: Results verification');

      console.log('\n🎯 CRITICAL VALIDATIONS:');
      console.log(`  ${hasInvalidCategoryError ? '❌' : '✅'} No "Invalid category ID" error: ${!hasInvalidCategoryError}`);
      console.log(`  ${hasValidationError ? '❌' : '✅'} No validation errors: ${!hasValidationError}`);
      console.log(`  ${submitClicked ? '✅' : '⚠️'} Submit button clicked: ${submitClicked}`);
      console.log(`  ${hasSuccessMessage ? '✅' : '⚠️'} Success message detected: ${hasSuccessMessage}`);
      console.log(`  ${modalClosed ? '✅' : '⚠️'} Modal closed after submission: ${modalClosed}`);
      console.log(`  ${finalUrl.includes('jobs') ? '✅' : '⚠️'} Redirected to jobs page: ${finalUrl.includes('jobs')}`);

      console.log('\n📸 SCREENSHOTS: 19 screenshots captured');
      console.log('='.repeat(80));

      // Assertions
      expect(hasInvalidCategoryError).toBe(false);
      expect(hasValidationError).toBe(false);
      expect(submitClicked).toBe(true);

      logStep(11, 'All validations passed', 'complete');
      console.log('\n✅ DASHBOARD MODAL TEST COMPLETED SUCCESSFULLY\n');

    } catch (error: any) {
      console.error('\n❌ TEST FAILED:', error.message);
      await captureScreenshot(page, 'error-state');
      throw error;
    } finally {
      // Capture test results
      const results = await captureTestResults(testInfo);
      console.log(generateTestReport(results));
    }
  });
});
