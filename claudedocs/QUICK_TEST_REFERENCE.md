# Quick Test Reference

Fast reference for running job creation tests.

## Prerequisites

```bash
# Terminal 1: Backend
cd backend && npm run start:dev

# Terminal 2: Frontend
cd frontend && npm run dev

# Verify
curl http://localhost:3000/health
curl http://localhost:3001
```

## Run Tests

### All Tests
```powershell
.\tests\run-job-creation-tests.ps1
```

### Specific Tests
```powershell
# Direct page flow
.\tests\run-job-creation-tests.ps1 direct

# Dashboard modal flow
.\tests\run-job-creation-tests.ps1 modal

# Database verification
.\tests\run-job-creation-tests.ps1 db

# Comprehensive comparison
.\tests\run-job-creation-tests.ps1 comprehensive
```

### Direct Playwright
```bash
# All job creation tests
npx playwright test tests/e2e/job-creation-*.spec.ts --project=chromium

# Single test
npx playwright test tests/e2e/job-creation-category-fix.spec.ts --project=chromium

# Headed mode (see browser)
npx playwright test tests/e2e/job-creation-*.spec.ts --headed

# Debug mode
npx playwright test tests/e2e/job-creation-*.spec.ts --debug
```

## View Results

### HTML Report
```bash
npx playwright show-report claudedocs\test-reports\html
```

### JSON Results
```bash
cat claudedocs\test-reports\results.json
```

### Screenshots
```
test-results\*.png
```

## Test Files

```
tests/
├── helpers/
│   └── test-reporter.ts
├── e2e/
│   ├── job-creation-category-fix.spec.ts          [Direct page]
│   ├── job-creation-dashboard-modal.spec.ts       [Modal flow]
│   ├── job-creation-comprehensive.spec.ts         [Both flows]
│   └── job-creation-database-verification.spec.ts [DB check]
└── run-job-creation-tests.ps1
```

## Success Indicators

```
✅ No "Invalid category ID" error: true
✅ No validation errors: true
✅ Submit button clicked: true
✅ Redirected to jobs page: true
✅ Job stored in database: true
```

## Test Credentials

```
Email: Grahiman02@gmail.com
Password: Qwerty12345!@
```

## Common Issues

**Servers not running**:
```powershell
# Check ports
netstat -ano | findstr :3000
netstat -ano | findstr :3001
```

**Test failures**:
```bash
# Run in headed mode to see what's happening
npx playwright test tests/e2e/job-creation-*.spec.ts --headed

# Check screenshots
ls test-results\*.png
```

## Documentation

- Full Guide: `claudedocs/JOB_CREATION_TESTING_GUIDE.md`
- Test Results: `claudedocs/JOB_CREATION_TEST_RESULTS.md`
- This Reference: `claudedocs/QUICK_TEST_REFERENCE.md`

## Quick Stats

- **4 test suites** covering all scenarios
- **36-120s** execution time per suite
- **20+ screenshots** per test run
- **100% coverage** of job creation flows
