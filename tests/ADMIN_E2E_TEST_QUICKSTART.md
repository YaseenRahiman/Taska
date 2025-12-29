# Admin Portal E2E Test - Quick Start Guide

## Overview

Comprehensive E2E test suite for Admin Portal Sprint 4 modules:
- ✅ Escrow Configuration (622 lines, 28 tests)
- ✅ Payment Approval (816 lines, 35 tests)
- ✅ Review Moderation (905 lines, 32 tests)
- ✅ Cross-Module Navigation (736 lines, 24 tests)

**Total**: 3,079 lines of test code, 119 test cases

---

## Prerequisites

### 1. Install Dependencies
```bash
npm install
npx playwright install
```

### 2. Start Servers
```bash
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 3. Verify Servers Running
- Backend: http://localhost:3000
- Frontend: http://localhost:3001

---

## Running Tests

### Run All Admin Tests
```bash
npx playwright test --config=playwright.config.admin.ts
```

### Run Specific Module

#### Escrow Configuration Tests
```bash
npx playwright test admin-escrow-config.spec.ts
```

#### Payment Approval Tests
```bash
npx playwright test admin-payment-approval.spec.ts
```

#### Review Moderation Tests
```bash
npx playwright test admin-review-moderation.spec.ts
```

#### Cross-Module Navigation Tests
```bash
npx playwright test admin-cross-module-navigation.spec.ts
```

### Run Single Test
```bash
npx playwright test admin-escrow-config.spec.ts -g "should successfully update escrow settings"
```

---

## Debug Mode

### Interactive Debugging
```bash
npx playwright test --config=playwright.config.admin.ts --debug
```

### UI Mode (Recommended)
```bash
npx playwright test --config=playwright.config.admin.ts --ui
```

### Headed Mode (See Browser)
```bash
npx playwright test --config=playwright.config.admin.ts --headed
```

---

## Test Reports

### View HTML Report
```bash
npx playwright show-report claudedocs/test-reports/admin-portal/html
```

### Generate Report After Tests
```bash
npx playwright test --config=playwright.config.admin.ts --reporter=html
```

---

## Test Files

```
tests/
├── e2e/
│   ├── admin-escrow-config.spec.ts       (622 lines, 28 tests)
│   ├── admin-payment-approval.spec.ts    (816 lines, 35 tests)
│   ├── admin-review-moderation.spec.ts   (905 lines, 32 tests)
│   └── admin-cross-module-navigation.spec.ts (736 lines, 24 tests)
├── fixtures/
│   └── admin-test-data.ts                (309 lines)
└── helpers/
    └── auth.ts                           (authentication)
```

---

## Test Coverage

### Escrow Configuration (28 tests)
- Settings management (6)
- Manual release flow (5)
- Refund flow (3)
- Table filtering (6)
- Analytics dashboard (4)
- Audit logging (4)

### Payment Approval (35 tests)
- Payment details (4)
- Approval flow (4)
- Rejection flow (4)
- Hold/release (4)
- Bulk operations (5)
- Filtering (8)
- Risk visualization (4)
- Accessibility (2)

### Review Moderation (32 tests)
- Review display (4)
- Edit flow (6)
- Visibility control (4)
- Delete review (5)
- Moderation notes (5)
- Flagged queue (4)
- Filtering (7)
- Edit history (4)

### Cross-Module Navigation (24 tests)
- Sidebar navigation (6)
- Deep linking (6)
- Breadcrumbs (5)
- URL state (6)
- Browser navigation (5)
- Context preservation (3)
- SEO/metadata (3)
- Performance (3)
- Error handling (3)

---

## Common Commands

### Run tests matching pattern
```bash
npx playwright test --config=playwright.config.admin.ts -g "filter"
```

### Run only failed tests
```bash
npx playwright test --config=playwright.config.admin.ts --last-failed
```

### Run with specific browser
```bash
npx playwright test --config=playwright.config.admin.ts --project=admin-portal-chromium
```

### Generate traces
```bash
npx playwright test --config=playwright.config.admin.ts --trace on
```

### View trace
```bash
npx playwright show-trace trace.zip
```

---

## Environment Variables

```bash
# Set frontend URL (default: http://localhost:3001)
export FRONTEND_URL=http://localhost:3001

# Set backend URL (if needed)
export BACKEND_URL=http://localhost:3000
```

---

## Troubleshooting

### Tests Failing?

1. **Check servers running**
   ```bash
   curl http://localhost:3000/health
   curl http://localhost:3001
   ```

2. **Clear browser state**
   ```bash
   rm -rf tests/.auth
   ```

3. **Update Playwright**
   ```bash
   npx playwright install --with-deps
   ```

4. **Check admin credentials**
   - Default: admin@taska.com / AdminTest123!
   - Update in `tests/fixtures/admin-test-data.ts`

### Slow Tests?

1. **Run single test**
   ```bash
   npx playwright test admin-escrow-config.spec.ts -g "should display"
   ```

2. **Use headed mode for debugging**
   ```bash
   npx playwright test --headed --debug
   ```

### Screenshots/Videos Not Saving?

1. **Check output directory**
   ```bash
   ls -la claudedocs/test-reports/admin-portal/
   ```

2. **Enable video for all tests**
   - Edit `playwright.config.admin.ts`
   - Change `video: 'retain-on-failure'` to `video: 'on'`

---

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Admin E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run start:backend &
      - run: npm run start:frontend &
      - run: sleep 10
      - run: npx playwright test --config=playwright.config.admin.ts
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: claudedocs/test-reports/admin-portal/
```

---

## Next Steps

1. **Execute Tests**
   ```bash
   npx playwright test --config=playwright.config.admin.ts
   ```

2. **Review Report**
   ```bash
   npx playwright show-report claudedocs/test-reports/admin-portal/html
   ```

3. **Fix Failures**
   - Check screenshots in report
   - Review test output
   - Debug failing tests

4. **Add to CI/CD**
   - Integrate into deployment pipeline
   - Setup automated test runs
   - Configure notifications

---

## Documentation

- **Full Report**: `claudedocs/ADMIN_PORTAL_SPRINT_4_E2E_TEST_REPORT.md`
- **Test Data**: `tests/fixtures/admin-test-data.ts`
- **Config**: `playwright.config.admin.ts`

---

**Need Help?**
- Check test report for detailed documentation
- Review test files for examples
- Run in UI mode for interactive debugging
