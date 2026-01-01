# Artisan Frontend E2E Tests - Complete Documentation

## Overview
Comprehensive end-to-end tests for the Artisan user journey, including full authentication flow with user creation and login.

## Test Files

### `04-artisan-journey-complete.spec.ts`
**Complete artisan user journey with authentication**

Contains three test suites:

#### 1. Complete Artisan Journey - New User Registration
Tests the full flow for a brand new artisan user:
- ✅ User registration with form validation
- ✅ Automatic login after registration
- ✅ Dashboard access
- ✅ Browse available jobs
- ✅ View job details
- ✅ Place bids (validation only, doesn't submit)
- ✅ Access bids page
- ✅ Access profile page
- ✅ Cleanup and logout

**Key Test:** `should register a new artisan user and complete full journey`

#### 2. Complete Artisan Journey - Existing User Login
Tests workflows for returning artisan users:

**Tests included:**
- ✅ `should create artisan user for reuse in subsequent tests` - Setup test user
- ✅ `should login with existing artisan user` - Basic login flow
- ✅ `should complete full job browsing flow with existing user` - Navigate all sections
- ✅ `should handle job search and filtering with existing user` - Search functionality
- ✅ `should display job details correctly for existing user` - Job details page
- ✅ `should validate bid form with existing user` - Bid form validation
- ✅ `should navigate between artisan pages using menu` - Navigation menu

#### 3. Artisan Authentication Edge Cases
Tests authentication security and validation:
- ✅ Invalid login credentials handling
- ✅ Email format validation
- ✅ Password requirements validation
- ✅ Protected route access (requires authentication)

## Helper Files

### `helpers/user-management.helper.ts`
**User creation and authentication utilities**

#### Key Functions:

```typescript
// Generate unique test user
generateTestUser(role: 'CLIENT' | 'ARTISAN' | 'ADMIN'): TestUser

// Create new user via registration
createUser(page: Page, user: TestUser): Promise<TestUser>

// Login with existing credentials
loginWithUser(page: Page, user: TestUser): Promise<void>

// Create or reuse user (intelligent)
getOrCreateUser(page: Page, role): Promise<TestUser>

// Attempt login and return success/failure
tryLogin(page: Page, email: string, password: string): Promise<boolean>

// Cleanup - logout current user
cleanupUser(page: Page): Promise<void>
```

#### User Generation Strategy:
- **Unique emails** using timestamp + random number
- **South African phone format** validation support
- **Role-based registration paths** (artisan vs client)
- **Automatic retry** on registration failure

### `helpers/auth.helper.ts`
**Original authentication helpers** (still used in other tests)

Contains:
- Pre-defined test users (requires backend setup)
- Basic login/logout functions
- Role-specific login helpers

### `helpers/navigation.helper.ts`
**Page navigation utilities**

Contains:
- `waitForPageLoad()` - Intelligent page load waiting
- Network idle detection
- URL stability checks

## Running the Tests

### Prerequisites
```bash
# 1. Backend must be running
cd backend
npm run start:dev

# 2. Frontend must be running
cd frontend
npm run dev
```

### Run All Artisan Tests
```bash
cd frontend
npx playwright test 04-artisan-journey-complete
```

### Run Specific Test Suites
```bash
# New user registration flow
npx playwright test 04-artisan-journey-complete -g "New User Registration"

# Existing user flow
npx playwright test 04-artisan-journey-complete -g "Existing User Login"

# Edge cases
npx playwright test 04-artisan-journey-complete -g "Edge Cases"
```

### Run with UI
```bash
npx playwright test 04-artisan-journey-complete --ui
```

### Debug Mode
```bash
npx playwright test 04-artisan-journey-complete --debug
```

## Test Data

### User Credentials Format
```typescript
{
  email: 'test.artisan.[timestamp].[random]@playwright.test',
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'ARTISAN [timestamp]',
  role: 'ARTISAN',
  phoneNumber: '+2782[7-digits]'
}
```

### Bid Test Data (from `fixtures/test-data.ts`)
```typescript
TEST_BID = {
  amount: 450,
  message: 'I have 10 years of experience...',
  estimatedDays: 1,
  availability: 'Available this week'
}
```

## Test Flow Diagrams

### New User Registration Flow
```
Start
  ↓
Navigate to /artisan/register
  ↓
Fill registration form
  ↓
Submit
  ↓
Wait for redirect (dashboard or login)
  ↓
If login page → Login automatically
  ↓
Verify dashboard access
  ↓
Browse jobs (/artisan/jobs)
  ↓
View job details
  ↓
Open bid form (validate only)
  ↓
Check bids page (/artisan/bids)
  ↓
Check profile page (/artisan/profile)
  ↓
Logout
  ↓
End
```

### Existing User Login Flow
```
Start
  ↓
Navigate to /auth/login
  ↓
Fill credentials
  ↓
Submit
  ↓
Wait for dashboard redirect
  ↓
Verify authenticated
  ↓
Test specific workflow
  ↓
Logout
  ↓
End
```

## Authentication Backend Requirements

### Registration Endpoint
**POST /auth/register**

Required fields:
```json
{
  "email": "string",
  "password": "string (min 8 chars, uppercase, lowercase, number, special char)",
  "firstName": "string (max 50 chars)",
  "lastName": "string (max 50 chars)",
  "phoneNumber": "string (optional, SA format)",
  "role": "CLIENT | ARTISAN | ADMIN (optional, defaults to CLIENT)"
}
```

Response:
```json
{
  "accessToken": "string",
  "refreshToken": "string",
  "expiresIn": "number",
  "user": {
    "id": "string",
    "email": "string",
    "role": "string",
    "profile": {
      "firstName": "string",
      "lastName": "string"
    }
  }
}
```

### Login Endpoint
**POST /auth/login**

Required fields:
```json
{
  "email": "string",
  "password": "string"
}
```

Response: Same as registration

## Troubleshooting

### Tests Failing with Timeout
**Problem:** `TimeoutError: page.waitForURL: Timeout exceeded`

**Solutions:**
1. Verify backend is running on expected port
2. Check frontend .env configuration
3. Ensure database is accessible
4. Check browser console for API errors

### Registration Not Working
**Problem:** Registration form doesn't redirect

**Solutions:**
1. Check backend logs for validation errors
2. Verify password meets requirements
3. Ensure email format is valid
4. Check for duplicate emails in database

### User Already Exists
**Problem:** Registration fails with "email already exists"

**Solutions:**
1. User management helper generates unique emails
2. Check database and remove test users if needed
3. Ensure timestamp generation is working

### Protected Routes Not Redirecting
**Problem:** Can access /artisan/dashboard without login

**Solutions:**
1. Check frontend middleware configuration
2. Verify JWT token handling
3. Check session storage/cookies

## Best Practices

### 1. Always Cleanup
```typescript
test.afterEach(async ({ page }) => {
  await cleanupUser(page);
});
```

### 2. Use Unique Users Per Test
```typescript
// Good - generates unique user
const user = generateTestUser('ARTISAN');

// Bad - reuses same email (may conflict)
const user = { email: 'fixed@test.com', ... };
```

### 3. Handle Async Properly
```typescript
// Good - awaits completion
await createUser(page, user);
await loginWithUser(page, user);

// Bad - missing await
createUser(page, user); // Returns promise, doesn't wait
```

### 4. Check Element Visibility
```typescript
// Good - checks before interaction
if (await element.isVisible({ timeout: 2000 })) {
  await element.click();
}

// Bad - assumes element exists
await element.click(); // May fail if not visible
```

### 5. Use Appropriate Timeouts
```typescript
// Good - reasonable timeouts
await page.waitForURL(/dashboard/, { timeout: 10000 });

// Bad - too short or too long
await page.waitForURL(/dashboard/, { timeout: 1000 }); // Too short
await page.waitForURL(/dashboard/, { timeout: 60000 }); // Too long
```

## Test Coverage

### Artisan Features Tested
- ✅ User registration
- ✅ User login
- ✅ Dashboard access
- ✅ Job browsing
- ✅ Job details viewing
- ✅ Job search and filtering
- ✅ Bid form validation
- ✅ Bid submission UI
- ✅ My bids page
- ✅ Projects page
- ✅ Profile page
- ✅ Navigation menu
- ✅ Logout functionality

### Security Features Tested
- ✅ Protected route access
- ✅ Invalid credentials handling
- ✅ Email format validation
- ✅ Password strength requirements
- ✅ Authentication state management

## Future Enhancements

### Planned Improvements
- [ ] API mocking for faster tests
- [ ] Test user cleanup in database
- [ ] Visual regression testing
- [ ] Accessibility testing
- [ ] Performance metrics
- [ ] Mobile responsive testing
- [ ] Multi-browser testing
- [ ] Parallel test execution optimization

### Additional Test Scenarios
- [ ] File upload for profile pictures
- [ ] Portfolio/work examples upload
- [ ] Rating and review system
- [ ] Message system integration
- [ ] Payment workflow
- [ ] Job acceptance flow
- [ ] Project completion flow

## Contributing

When adding new tests:
1. Follow existing patterns in `04-artisan-journey-complete.spec.ts`
2. Use helper functions from `user-management.helper.ts`
3. Add proper logging with `console.log()`
4. Include test cleanup
5. Update this README with new test descriptions

## Support

For issues or questions:
- Check Playwright documentation: https://playwright.dev
- Review backend API documentation
- Check frontend routing configuration
- Review test execution logs

## License
Part of the Taska platform - Internal testing documentation
