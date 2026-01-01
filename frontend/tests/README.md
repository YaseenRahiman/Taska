# Taska Platform E2E Tests

Comprehensive End-to-End testing suite for the Taska platform using Playwright.

## 📋 Test Coverage

### Test Suites
1. **01-guest-navigation.spec.ts** - Guest/visitor navigation and public pages (17 tests)
2. **02-authentication.spec.ts** - Login, registration, and auth flows (18 tests)
3. **03-client-journey.spec.ts** - Client user journey and job management (25+ tests)
4. **04-artisan-journey.spec.ts** - Artisan user journey and bidding (22+ tests)
5. **05-admin-journey.spec.ts** - Admin platform management (20+ tests)
6. **06-comprehensive-interactions.spec.ts** - All button and interaction testing (30+ tests)

**Total Tests**: ~130+ comprehensive test cases

### User Stories Covered
- ✅ Guest navigation and exploration
- ✅ User registration (Client & Artisan)
- ✅ User authentication (Login/Logout)
- ✅ Client job posting and management
- ✅ Artisan job browsing and bidding
- ✅ Admin platform management
- ✅ All page navigation
- ✅ All button interactions
- ✅ Form validations
- ✅ Protected route access

## 🚀 Quick Start

### Prerequisites
```bash
# Ensure backend is running
cd backend
npm run start:dev

# Ensure frontend dev server is running
cd frontend
npm run dev
```

### Running Tests

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run tests with browser visible
npm run test:e2e:headed

# Run tests in UI mode (interactive)
npm run test:e2e:ui

# Debug tests
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

### Running Specific Test Suites

```bash
# Run only guest navigation tests
npx playwright test 01-guest-navigation

# Run only authentication tests
npx playwright test 02-authentication

# Run only client journey tests
npx playwright test 03-client-journey

# Run only artisan journey tests
npx playwright test 04-artisan-journey

# Run only admin tests
npx playwright test 05-admin-journey

# Run only interaction tests
npx playwright test 06-comprehensive-interactions
```

## 📊 Test Reports

After running tests, view the HTML report:

```bash
npm run test:e2e:report
```

Reports are generated in:
- `playwright-report/` - HTML report (interactive)
- `test-results/` - JSON results and screenshots
- `test-results/screenshots/` - Failure screenshots

## 🔧 Configuration

### Environment Variables

Create `.env.test` file in the frontend directory:

```env
# Frontend URL
FRONTEND_URL=http://localhost:3001

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3000

# Test users (set to "true" when test data is seeded)
TEST_USER_EXISTS=false
```

### Test Data Setup

For authenticated user tests to work, you need to:

1. **Seed test users in backend**:
```bash
cd backend
npm run seed:test
```

2. **Set environment variable**:
```env
TEST_USER_EXISTS=true
```

Test users (defined in `helpers/auth.helper.ts`):
- **Client**: client@test.com / TestPassword123!
- **Artisan**: artisan@test.com / TestPassword123!
- **Admin**: admin@test.com / AdminPass123!

## 📝 Test Structure

```
tests/
├── e2e/
│   ├── helpers/           # Test utilities
│   │   ├── auth.helper.ts
│   │   └── navigation.helper.ts
│   ├── fixtures/          # Test data
│   │   └── test-data.ts
│   ├── 01-guest-navigation.spec.ts
│   ├── 02-authentication.spec.ts
│   ├── 03-client-journey.spec.ts
│   ├── 04-artisan-journey.spec.ts
│   ├── 05-admin-journey.spec.ts
│   └── 06-comprehensive-interactions.spec.ts
├── playwright.config.ts   # Playwright configuration
└── README.md             # This file
```

## 🎯 Test Execution Strategy

### Phase 1: Core Functionality (No Auth Required)
```bash
npx playwright test 01-guest-navigation 02-authentication
```
**Duration**: ~2-3 minutes
**Coverage**: Guest navigation, public pages, auth forms

### Phase 2: Client Journey (Auth Required)
```bash
npx playwright test 03-client-journey
```
**Duration**: ~3-4 minutes
**Coverage**: Client dashboard, job posting, job management

### Phase 3: Artisan Journey (Auth Required)
```bash
npx playwright test 04-artisan-journey
```
**Duration**: ~3-4 minutes
**Coverage**: Artisan dashboard, job browsing, bidding

### Phase 4: Admin Journey (Auth Required)
```bash
npx playwright test 05-admin-journey
```
**Duration**: ~3-4 minutes
**Coverage**: Admin dashboard, user management, analytics

### Phase 5: Comprehensive Interactions
```bash
npx playwright test 06-comprehensive-interactions
```
**Duration**: ~4-5 minutes
**Coverage**: All buttons, forms, navigation, accessibility

**Total Estimated Time**: 15-20 minutes for full suite

## 🔍 Test Categories

### Functional Tests
- ✅ User registration and onboarding
- ✅ User authentication (login/logout)
- ✅ Job creation and management
- ✅ Bid submission and management
- ✅ Admin operations
- ✅ Navigation flows

### UI/UX Tests
- ✅ Button interactions
- ✅ Form validations
- ✅ Navigation menus
- ✅ Modal interactions
- ✅ Responsive design
- ✅ Hover effects

### Accessibility Tests
- ✅ Keyboard navigation
- ✅ Form labels and ARIA
- ✅ Link accessibility
- ✅ Button types

### Performance Tests
- ✅ Page load times
- ✅ Image loading
- ✅ Network idle states

## 🐛 Debugging Tests

### Debug Specific Test
```bash
npx playwright test 03-client-journey --debug
```

### Run with Trace
```bash
npx playwright test --trace on
```

### View Traces
```bash
npx playwright show-trace trace.zip
```

### Screenshots on Failure
Screenshots are automatically captured on test failures and saved to:
```
test-results/screenshots/
```

## 📈 Continuous Integration

### CI Configuration (GitHub Actions Example)

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: |
          cd frontend
          npm ci

      - name: Install Playwright
        run: |
          cd frontend
          npx playwright install --with-deps

      - name: Run E2E tests
        run: |
          cd frontend
          npm run test:e2e

      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: frontend/playwright-report/
```

## 🎨 Test Best Practices

1. **Use Test IDs**: Add `data-testid` attributes to important elements
2. **Wait for Load**: Always wait for page load states
3. **Isolation**: Each test should be independent
4. **Cleanup**: Reset state between tests
5. **Assertions**: Use meaningful assertion messages
6. **Selectors**: Prefer semantic selectors over CSS classes

## 📚 Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Test Patterns](https://playwright.dev/docs/test-patterns)
- [Debugging Guide](https://playwright.dev/docs/debug)

## 🤝 Contributing

When adding new tests:

1. Follow existing naming conventions
2. Add tests to appropriate spec file
3. Update test data in fixtures if needed
4. Document test coverage in this README
5. Ensure tests pass before committing

## 📞 Support

For issues or questions:
- Review test output and screenshots
- Check Playwright documentation
- Review test helper functions
- Check browser console for errors
