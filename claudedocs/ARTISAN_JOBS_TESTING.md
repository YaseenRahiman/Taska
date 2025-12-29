# Artisan Jobs Page - Comprehensive Testing Documentation

## Overview

Comprehensive test suite for the artisan jobs page functionality covering both frontend (Playwright) and backend (NestJS) testing.

## Test Files Created

### 1. Frontend E2E Tests (Playwright)
**Location**: `tests/e2e/artisan-jobs-page.spec.ts`

#### Test Suites:
1. **Job Discovery and Browsing**
   - Display job listings with correct structure
   - Display job details correctly
   - Handle loading states
   - Handle empty job lists gracefully

2. **Filtering and Search**
   - Show/hide filters panel
   - Filter by category, budget, urgency, distance, time, verified clients
   - Clear all filters
   - Display filter result counts

3. **Job Actions**
   - View job details
   - Enable bid submission
   - Display job requirements
   - Show client ratings and job counts
   - Display distance information

4. **View Modes**
   - Toggle between List and Map views
   - Display map placeholder

5. **Saved Searches**
   - Display saved searches section
   - Save current search

6. **Refresh and Updates**
   - Refresh jobs functionality

7. **Mobile Responsiveness**
   - Display correctly on mobile devices
   - Touch-friendly buttons

8. **Error Handling**
   - Handle authentication errors
   - Handle network errors gracefully

### 2. Backend Integration Tests
**Location**: `backend/test/artisan-jobs-flow.e2e-spec.ts`

#### Test Suites:
1. **Job Discovery** - Artisan Browse Available Jobs
   - Retrieve all available open jobs
   - View specific job details
   - View client information
   - Display job category information

2. **Job Filtering** - Search and Filter Operations
   - Filter by: category, budget range, urgency, city, province, budget type
   - Keyword search
   - Combined multiple filters

3. **Geographic Search** - Nearby Jobs
   - Find jobs near artisan location
   - Calculate distance for nearby jobs
   - Respect radius parameter
   - Limit nearby job results
   - Reject invalid coordinates

4. **Bid Submission** - Artisan Submit Bids
   - Submit bid on open job
   - Validate bid amount is positive
   - Validate estimated days is positive
   - Prevent duplicate bids
   - Reject bid on non-existent job
   - Validate expiry date is in future

5. **Bid Management** - View and Update Bids
   - Retrieve artisan own bids
   - View specific bid details
   - Update pending bids
   - Withdraw pending bids
   - Prevent updating withdrawn bids
   - View bid statistics

6. **Pagination and Performance**
   - Support pagination for job listings
   - Retrieve second page of results
   - Respect custom page limits
   - Provide total count in pagination

7. **Edge Cases and Error Scenarios**
   - Handle invalid job IDs
   - Reject unauthenticated access
   - Prevent clients from submitting bids
   - Handle empty search results
   - Validate budget range parameters
   - Handle concurrent bid submissions

8. **Job Status Transitions**
   - Show only OPEN jobs by default
   - Don't show cancelled jobs

### 3. Edge Cases and Error Scenarios
**Location**: `backend/test/artisan-edge-cases.e2e-spec.ts`

#### Test Suites:
1. **Input Validation Edge Cases**
   - Reject extremely long search queries
   - Handle special characters in search
   - Handle SQL injection attempts
   - Handle Unicode and emoji in search
   - Validate maximum budget limits
   - Validate negative budget values
   - Handle missing required bid fields
   - Validate bid message length

2. **Boundary Conditions**
   - Handle zero distance radius
   - Handle extremely large radius
   - Handle coordinates at edge of valid ranges
   - Handle maximum pagination page numbers
   - Handle zero/extremely large page limits
   - Handle bid amounts at boundaries

3. **Concurrency and Race Conditions**
   - Handle rapid successive job queries
   - Handle concurrent bid submissions
   - Prevent race conditions on bid expiry

4. **Authorization and Security**
   - Prevent cross-artisan bid viewing
   - Prevent artisan from accessing admin endpoints
   - Prevent artisan from creating jobs
   - Validate JWT token expiry
   - Prevent cross-artisan bid updates

5. **Data Integrity**
   - Maintain consistent data across filter operations
   - Handle database constraint violations
   - Preserve job data consistency during concurrent access

6. **Performance Edge Cases**
   - Handle requests with all optional filters
   - Handle empty filter values
   - Handle rapid pagination requests

7. **Error Recovery**
   - Recover from invalid filter combinations
   - Handle malformed query parameters
   - Provide meaningful error messages

## Running the Tests

### Prerequisites
```bash
# Ensure backend and frontend servers are running
cd backend
npm run start:dev  # Backend on http://localhost:3000

cd frontend
npm run dev        # Frontend on http://localhost:3001
```

### Run Playwright E2E Tests
```bash
# Run all E2E tests
npx playwright test tests/e2e/artisan-jobs-page.spec.ts

# Run with UI mode for debugging
npx playwright test tests/e2e/artisan-jobs-page.spec.ts --ui

# Run specific test suite
npx playwright test tests/e2e/artisan-jobs-page.spec.ts -g "Job Discovery"

# Run in headed mode
npx playwright test tests/e2e/artisan-jobs-page.spec.ts --headed

# Run on specific browser
npx playwright test tests/e2e/artisan-jobs-page.spec.ts --project=chromium
npx playwright test tests/e2e/artisan-jobs-page.spec.ts --project=mobile
```

### Run Backend Integration Tests
```bash
cd backend

# Run all artisan job tests
npm run test:e2e -- artisan-jobs-flow
npm run test:e2e -- artisan-edge-cases

# Run with coverage
npm run test:e2e:cov

# Run specific test suite
npm run test:e2e -- artisan-jobs-flow -t "Job Discovery"

# Run all E2E tests
npm run test:e2e
```

### Run All Tests Together
```bash
# From project root
npm run test:all

# Or sequentially
npm run test:e2e      # Backend tests
npx playwright test   # Frontend tests
```

## Test Coverage Summary

### Frontend Coverage (Playwright)
- **Job Browsing**: 4 tests
- **Filtering**: 9 tests
- **Job Actions**: 5 tests
- **View Modes**: 2 tests
- **Saved Searches**: 2 tests
- **Refresh**: 1 test
- **Mobile**: 2 tests
- **Error Handling**: 2 tests
- **Total**: 27 tests

### Backend Coverage (Integration)
- **Job Discovery**: 4 tests
- **Filtering**: 8 tests
- **Geographic Search**: 5 tests
- **Bid Submission**: 6 tests
- **Bid Management**: 6 tests
- **Pagination**: 4 tests
- **Edge Cases**: 8 tests
- **Status Transitions**: 2 tests
- **Total**: 43 tests

### Backend Coverage (Edge Cases)
- **Input Validation**: 8 tests
- **Boundary Conditions**: 8 tests
- **Concurrency**: 3 tests
- **Authorization**: 5 tests
- **Data Integrity**: 3 tests
- **Performance**: 3 tests
- **Error Recovery**: 3 tests
- **Total**: 33 tests

**Grand Total**: 103 comprehensive tests

## Test Scenarios Covered

### Functional Testing
✅ Job listing and browsing
✅ Job details viewing
✅ Category filtering
✅ Budget range filtering
✅ Urgency level filtering
✅ Location filtering (city, province)
✅ Distance-based filtering
✅ Time-based filtering (posted within)
✅ Verified clients filtering
✅ Keyword search
✅ Combined filters
✅ Geographic proximity search
✅ Bid submission
✅ Bid viewing
✅ Bid updating
✅ Bid withdrawal
✅ Pagination
✅ Sorting

### Security Testing
✅ Authentication validation
✅ Authorization checks (role-based)
✅ SQL injection prevention
✅ Cross-user data access prevention
✅ JWT token validation
✅ Input sanitization

### Performance Testing
✅ Pagination efficiency
✅ Concurrent request handling
✅ Large dataset handling
✅ Rapid successive requests
✅ Filter application performance

### Error Handling
✅ Invalid input validation
✅ Missing required fields
✅ Database constraint violations
✅ Network error handling
✅ Authentication errors
✅ Authorization errors
✅ Duplicate submission prevention
✅ Expired bid handling

### Edge Cases
✅ Boundary value testing
✅ Special character handling
✅ Unicode/emoji support
✅ Extremely large values
✅ Zero/negative values
✅ Empty values
✅ Null/undefined handling
✅ Concurrent operations
✅ Race conditions

### UI/UX Testing
✅ Loading states
✅ Empty states
✅ Mobile responsiveness
✅ Touch-friendly buttons
✅ View mode toggles
✅ Filter panel visibility
✅ Button state management

## Test Data Requirements

### Test Users
- **Client**: `client@test.com` (password: `password123`)
- **Artisan**: `artisan@test.com` (password: `password123`)
- **Admin**: `admin@test.com` (password: `admin123`)

### Test Categories
- Plumbing (ID: 1)
- Electrical (ID: 2)
- Carpentry (ID: 3)

### Test Jobs
Created dynamically in tests with various attributes:
- Different categories
- Budget ranges: R500 - R10,000
- Urgency levels: LOW, MEDIUM, HIGH, URGENT
- Locations: Johannesburg, Cape Town, Durban, Pretoria
- Budget types: FIXED, HOURLY, NEGOTIABLE

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Artisan Jobs Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run backend tests
        run: |
          cd backend
          npm run test:e2e -- artisan

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run Playwright tests
        run: npx playwright test tests/e2e/artisan-jobs-page.spec.ts

      - name: Upload test reports
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-reports
          path: |
            claudedocs/test-reports/
            playwright-report/
```

## Known Limitations and Future Enhancements

### Current Limitations
1. Mock data used for some frontend tests (API not fully integrated)
2. Map view testing is placeholder (awaiting map integration)
3. Real-time updates not tested (WebSocket testing)
4. Image upload functionality not tested
5. Notification testing not included

### Planned Enhancements
1. Visual regression testing with Percy/Chromatic
2. Performance benchmarking with Lighthouse
3. Accessibility testing (a11y)
4. Load testing with k6
5. API contract testing with Pact
6. Real-time update testing
7. File upload testing
8. Cross-browser compatibility matrix

## Troubleshooting

### Common Issues

**Issue**: Tests fail with "Cannot connect to backend"
```bash
# Solution: Ensure backend is running
cd backend && npm run start:dev
```

**Issue**: Playwright tests timeout
```bash
# Solution: Increase timeout in playwright.config.ts
timeout: 60000  # 60 seconds
```

**Issue**: Database connection errors
```bash
# Solution: Reset test database
cd backend
npm run prisma:reset
npm run prisma:seed
```

**Issue**: Authentication failures
```bash
# Solution: Recreate test users
npm run test:e2e:setup
```

## Test Maintenance

### When to Update Tests
- New features added to artisan jobs page
- API endpoints modified
- UI/UX changes
- Business logic changes
- Security requirements updated

### Best Practices
1. Keep tests independent and isolated
2. Use descriptive test names
3. Clean up test data after each test
4. Mock external dependencies
5. Use page objects for UI tests
6. Keep tests focused (single responsibility)
7. Update tests when features change
8. Review and refactor regularly

## Contact and Support

For issues or questions about these tests:
- Create an issue in the project repository
- Contact the QA team
- Review test documentation in this file

---

**Last Updated**: 2025-11-02
**Test Framework Versions**:
- Playwright: Latest
- Jest: Latest
- Supertest: Latest
