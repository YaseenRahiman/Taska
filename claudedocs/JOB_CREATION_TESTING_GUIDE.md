# Job Creation Testing Guide

Comprehensive testing documentation for Taska job creation flows.

## Overview

This test suite verifies both job creation entry points and ensures database consistency:
1. **Direct URL Navigation**: `/client/jobs/create`
2. **Dashboard Modal**: "Post a New Job" button on dashboard

## Test Structure

### Test Files

```
tests/
├── helpers/
│   └── test-reporter.ts          # Test result capturing and reporting utilities
├── e2e/
│   ├── job-creation-category-fix.spec.ts       # Direct page flow test
│   ├── job-creation-dashboard-modal.spec.ts    # Dashboard modal flow test
│   ├── job-creation-comprehensive.spec.ts      # Unified test comparing both flows
│   └── job-creation-database-verification.spec.ts  # Database verification
└── run-job-creation-tests.ps1    # PowerShell test runner
└── run-job-creation-tests.sh     # Bash test runner
```

### Test Coverage

#### 1. Direct Page Flow Test
**File**: `job-creation-category-fix.spec.ts`

Tests job creation via direct URL navigation:
- ✅ User login
- ✅ Direct navigation to `/client/jobs/create`
- ✅ Form filling (all 8 steps)
- ✅ Category selection validation
- ✅ Job submission
- ✅ No "Invalid category ID" errors
- ✅ Successful redirect to job page

#### 2. Dashboard Modal Flow Test
**File**: `job-creation-dashboard-modal.spec.ts`

Tests job creation via dashboard button:
- ✅ User login
- ✅ Dashboard access
- ✅ "Post a New Job" button click
- ✅ Modal/page opening
- ✅ Form filling (all steps)
- ✅ Job submission from modal
- ✅ Modal closure after submission
- ✅ Dashboard update with new job

#### 3. Comprehensive Test Suite
**File**: `job-creation-comprehensive.spec.ts`

Compares both flows for consistency:
- ✅ Direct URL flow execution
- ✅ Dashboard modal flow execution
- ✅ Consistency validation
- ✅ Both flows produce identical results
- ✅ No errors in either flow

#### 4. Database Verification Test
**File**: `job-creation-database-verification.spec.ts`

Verifies database storage:
- ✅ Job creation
- ✅ Job ID extraction from URL
- ✅ Authentication token retrieval
- ✅ API job fetch verification
- ✅ Job data consistency
- ✅ Category ID validation
- ✅ Job appears in user's job list

## Running Tests

### Prerequisites

1. **Start Backend Server**:
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Start Frontend Server**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Verify Servers**:
   - Frontend: http://localhost:3001
   - Backend: http://localhost:3000/health

### Run All Tests

**PowerShell** (Windows):
```powershell
.\tests\run-job-creation-tests.ps1
```

**Bash** (Linux/Mac):
```bash
chmod +x tests/run-job-creation-tests.sh
./tests/run-job-creation-tests.sh
```

**Direct Playwright**:
```bash
npx playwright test tests/e2e/job-creation-*.spec.ts --project=chromium
```

### Run Specific Tests

**Direct Page Flow Only**:
```powershell
.\tests\run-job-creation-tests.ps1 direct
```

**Dashboard Modal Flow Only**:
```powershell
.\tests\run-job-creation-tests.ps1 modal
```

**Database Verification Only**:
```powershell
.\tests\run-job-creation-tests.ps1 db
```

**Comprehensive Suite Only**:
```powershell
.\tests\run-job-creation-tests.ps1 comprehensive
```

## Test Results

### Output Locations

```
claudedocs/test-reports/
├── results.json          # JSON test results
├── junit.xml             # JUnit XML format
├── html/                 # HTML test report
│   └── index.html
└── detailed/             # Detailed per-test JSON reports
    └── *.json

test-results/
├── screenshots/          # Test screenshots
│   └── *.png
└── *.png                 # Step-by-step screenshots
```

### Viewing Results

**HTML Report**:
```bash
npx playwright show-report claudedocs/test-reports/html
```

**JSON Results**:
```bash
cat claudedocs/test-reports/results.json
```

**Screenshots**:
- All screenshots saved in `test-results/`
- Named sequentially: `01-login-page.png`, `02-credentials-entered.png`, etc.

## Test Credentials

```
Email: Grahiman02@gmail.com
Password: Qwerty12345!@
```

## Critical Validations

Each test verifies:

### ✅ No "Invalid category ID" Error
```typescript
expect(hasInvalidCategoryError).toBe(false);
```

### ✅ No Validation Errors
```typescript
expect(hasValidationError).toBe(false);
```

### ✅ Successful Submission
```typescript
expect(submitClicked).toBe(true);
```

### ✅ Proper Redirect
```typescript
expect(finalUrl).toContain('/jobs/');
```

### ✅ Database Storage
```typescript
expect(job.categoryId).toBeTruthy();
expect(job.title).toBe(expectedTitle);
```

## Test Flow Details

### Job Creation Steps (Both Flows)

1. **Basic Information**
   - Title
   - Description

2. **Category Selection**
   - Parent category (e.g., Plumbing)
   - Subcategory (if applicable)

3. **Budget & Urgency**
   - Budget amount
   - Urgency level (Urgent/Flexible)

4. **Location**
   - Address
   - City
   - Province
   - Postal Code

5. **Additional Details**
   - Requirements
   - Timeline (optional)

6. **Images**
   - Upload images (optional)
   - Skipped in tests

7. **Review & Submit**
   - Review all information
   - Submit job

## Troubleshooting

### Test Failures

**"Servers not running"**:
- Ensure both frontend and backend servers are running
- Check ports 3000 and 3001

**"Could not find modal trigger"**:
- Dashboard UI may have changed
- Check dashboard for "Post a New Job" button
- Update selectors in test if needed

**"Submit button not found"**:
- Review page may have changed
- Multiple submit strategies implemented
- Check console output for errors

**"Invalid category ID" error**:
- Category selection may have failed
- Check category hierarchy in database
- Verify subcategory IDs are correct

### Debug Mode

Run tests in headed mode to see browser:
```bash
npx playwright test tests/e2e/job-creation-*.spec.ts --project=chromium --headed
```

Enable debug mode:
```bash
npx playwright test tests/e2e/job-creation-*.spec.ts --project=chromium --debug
```

### Screenshot Analysis

All tests capture screenshots at every step:
- Review `test-results/*.png` files
- Screenshots show exact UI state
- Numbered sequentially for easy tracking

## Test Helper Functions

### captureTestResults(testInfo)
Captures comprehensive test results including:
- Test status (passed/failed)
- Duration
- Errors
- Attachments
- Screenshots

### generateTestReport(results)
Generates formatted test report with:
- Test execution summary
- Error details
- Attachment list
- Validation results

### logStep(stepNumber, description, status)
Logs test steps with visual indicators:
- 🔄 Start
- ✅ Complete
- ❌ Error

### captureScreenshot(page, name, options)
Captures and saves screenshots with:
- Descriptive names
- Timestamps
- Full page capture

### waitWithLog(ms, reason)
Waits with console logging:
- Duration
- Reason for wait

## Success Criteria

A successful test run should show:

```
✅ All tests passed!

📊 Test Report Summary
======================

Test Statistics:
  Total: 4
  Passed: 4
  Failed: 0
  Skipped: 0
  Duration: 120.5s

🎯 CRITICAL VALIDATIONS:
  ✅ No "Invalid category ID" error: true
  ✅ No validation errors: true
  ✅ Submit button clicked: true
  ✅ Redirected to jobs page: true
  ✅ Job stored in database: true
  ✅ Category ID is valid: true
```

## Maintenance

### Updating Tests

**When UI changes**:
1. Update selectors in test files
2. Add new selectors to arrays (multiple strategies)
3. Test in headed mode to verify

**When adding new fields**:
1. Add to test data objects
2. Add field filling in `fillJobForm()` helper
3. Verify in database validation

**When API changes**:
1. Update `fetchJobFromApi()` in database test
2. Update `JobResponse` interface
3. Adjust validation assertions

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Run Job Creation Tests
  run: |
    npm run test:job-creation
  env:
    FRONTEND_URL: http://localhost:3001
    BACKEND_URL: http://localhost:3000
```

### Test Reports in CI

Configure Playwright to upload artifacts:
```yaml
- uses: actions/upload-artifact@v3
  if: always()
  with:
    name: test-results
    path: |
      claudedocs/test-reports/
      test-results/
```

## Performance

### Test Execution Times

- Direct Page Flow: ~40s
- Dashboard Modal Flow: ~45s
- Database Verification: ~35s
- Comprehensive Suite: ~120s

### Optimization Tips

1. **Parallel Execution**: Tests run sequentially to avoid conflicts
2. **Single Worker**: Configured to prevent race conditions
3. **Network Idle**: Ensures page fully loaded
4. **Smart Waits**: Strategic waits for React rendering

## Best Practices

1. **Always check servers before running tests**
2. **Review screenshots after test failures**
3. **Update selectors when UI changes**
4. **Keep test data consistent**
5. **Verify database state after tests**
6. **Clean up test data periodically**
7. **Run tests in isolation first**
8. **Use headed mode for debugging**

## Contact & Support

For issues or questions about these tests:
1. Check screenshots in `test-results/`
2. Review console output
3. Check Playwright documentation
4. Verify server status

## Changelog

### v1.0.0 (2025-10-30)
- Initial comprehensive test suite
- Four test files covering all scenarios
- Test helper utilities
- PowerShell and Bash runners
- Complete documentation
- Database verification
- Screenshot capture
- Detailed reporting
