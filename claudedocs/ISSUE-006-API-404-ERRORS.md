# ISSUE #006: Backend API Endpoints Returning 404 Errors

**Priority**: 🔴 **CRITICAL - BLOCKING**
**Component**: Backend API Routes
**Affects**: Job Creation, Bid Submission, Messaging, Admin Functions
**Status**: 🔴 **OPEN** - Requires Investigation
**Assigned To**: @agent-backend-architect, @agent-quality-engineer

---

## Problem Statement

Multiple backend API endpoints are returning HTTP 404 (Not Found) errors instead of the expected responses. This affects core platform functionality including job posting, bidding, messaging, and admin operations.

### Impact
- ❌ Jobs cannot be created via API
- ❌ Bids cannot be submitted
- ❌ Messages cannot be sent
- ❌ Admin functions inaccessible
- ❌ All E2E tests failing (41/41 tests)

---

## Affected Endpoints

### Job Endpoints
```
POST /jobs
Expected: 201 Created
Actual: 404 Not Found
Test: "should complete full client journey"
```

```
GET /jobs
Expected: 200 OK
Actual: 404 Not Found (suspected)
Test: "should browse available jobs"
```

### Bid Endpoints
```
POST /bids
Expected: 201 Created
Actual: 404 Not Found
Test: "should submit bid on job"
```

```
POST /bids/:id/accept
Expected: 200 OK
Actual: 404 Not Found
Test: "should accept bid"
```

### Message Endpoints
```
POST /messages
Expected: 201 Created
Actual: 404 Not Found
Test: "should send message"
```

### Admin Endpoints
```
GET /admin/jobs
Expected: 200 OK
Actual: 404 Not Found
Test: "should view all jobs as admin"
```

---

## Test Evidence

### Sample Test Failures

**Test 1: Client Journey - Job Creation**
```typescript
// File: backend/test/user-journeys.e2e-spec.ts:35
expect(jobResponse.status).toBe(201);
// Expected: 201
// Received: 404

Endpoint: POST /jobs
Request Body: {
  title: "Fix leaking kitchen tap",
  description: "Need urgent plumbing repair",
  categoryId: "...",
  budget: 500
}
```

**Test 2: Artisan Journey - Job Browsing**
```typescript
// File: backend/test/user-journeys.e2e-spec.ts:176
expect(jobResponse.status).toBe(201);
// Expected: 201
// Received: 404

Same endpoint: POST /jobs
```

**Test 3: Admin Moderation**
```typescript
// File: backend/test/user-journeys.e2e-spec.ts:353
expect(allJobsResponse.status).toBe(200);
// Expected: 200
// Received: 404

Endpoint: GET /admin/jobs (or similar)
```

**Test 4: Bid Expiry**
```typescript
// File: backend/test/user-journeys.e2e-spec.ts:453
expect(acceptResponse.status).toBe(400);
// Expected: 400 (expired bid error)
// Received: 404

Endpoint: POST /bids/:id/accept
```

---

## Server Startup Logs (Routes Registered)

The backend server starts successfully and logs show routes ARE registered:

```
[Nest] 27452 - [RouterExplorer] Mapped {/jobs, POST} route
[Nest] 27452 - [RouterExplorer] Mapped {/jobs, GET} route
[Nest] 27452 - [RouterExplorer] Mapped {/jobs/:id, GET} route
[Nest] 27452 - [RouterExplorer] Mapped {/jobs/:id, PATCH} route
[Nest] 27452 - [RouterExplorer] Mapped {/jobs/:id, DELETE} route

[Nest] 27452 - [RouterExplorer] Mapped {/bids, POST} route
[Nest] 27452 - [RouterExplorer] Mapped {/bids, GET} route
[Nest] 27452 - [RouterExplorer] Mapped {/bids/:id/accept, POST} route

[Nest] 27452 - [RouterExplorer] Mapped {/admin/users, GET} route
[Nest] 27452 - [RouterExplorer] Mapped {/admin/system/settings, GET} route
```

**Conclusion**: Routes ARE registered by NestJS, so the 404 errors indicate a runtime issue, not a configuration issue.

---

## Investigation Steps

### Step 1: Manual API Testing
**Priority**: 🔴 CRITICAL

Test endpoints manually with curl or Postman to isolate the issue:

#### Test 1: Create Job (With Authentication)
```bash
# First, get a valid JWT token by logging in
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@test.com",
    "password": "password123"
  }'

# Use the returned accessToken in subsequent requests
curl -X POST http://localhost:3000/jobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -d '{
    "title": "Test Job",
    "description": "Test description",
    "categoryId": "YOUR_CATEGORY_ID",
    "budget": 500,
    "location": {
      "addressLine1": "123 Test St",
      "city": "Cape Town",
      "province": "Western Cape",
      "postalCode": "8001"
    }
  }'
```

**Expected**: 201 Created with job object
**Document**: Actual response status and body

#### Test 2: List Jobs (Public Endpoint)
```bash
curl -X GET http://localhost:3000/jobs
```

**Expected**: 200 OK with array of jobs
**Document**: Actual response

#### Test 3: Create Job (Without Authentication)
```bash
curl -X POST http://localhost:3000/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Job",
    "description": "Test"
  }'
```

**Expected**: 401 Unauthorized or 403 Forbidden
**Document**: What actually happens

---

### Step 2: Check Authentication in Tests
**Priority**: 🔴 CRITICAL

The 404 errors might actually be authentication failures being misreported.

**Check test setup file**: `backend/test/setup-e2e.ts`

Look for:
```typescript
// How are test users authenticated?
const testUsers = {
  client: {
    token: '...',  // ← Is this token valid?
  }
};

// How are requests authenticated?
request(app.getHttpServer())
  .post('/jobs')
  .set('Authorization', `Bearer ${token}`)  // ← Is header set correctly?
```

**Verify**:
1. Are JWT tokens being generated correctly in test setup?
2. Are tokens being sent in request headers?
3. Are tokens valid and not expired?
4. Does the JWT secret match between test and application?

---

### Step 3: Check Route Guards and Middleware
**Priority**: 🔴 CRITICAL

Investigate if guards or middleware are rejecting requests:

#### Check Jobs Controller
**File**: `backend/src/modules/jobs/jobs.controller.ts`

```typescript
@Controller('jobs')
export class JobsController {

  @Post()
  @UseGuards(JwtAuthGuard)  // ← Could be blocking requests
  async create(@Body() createJobDto: CreateJobDto) {
    // ...
  }
}
```

**Questions**:
1. What guards are applied to POST /jobs?
2. Are guards configured correctly?
3. Is JwtAuthGuard returning 404 instead of 401?

#### Check Global Guards
**File**: `backend/src/app.module.ts` or `backend/src/main.ts`

```typescript
// Check for global guards
app.useGlobalGuards(new SomeGuard());
```

---

### Step 4: Check Request Logging
**Priority**: 🟡 HIGH

Add logging to see what requests the backend is actually receiving:

**Add to main.ts**:
```typescript
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});
```

**Then run tests and observe**:
- Are requests reaching the backend?
- What URLs are being requested?
- Are headers present (Authorization, Content-Type)?
- Is request body formatted correctly?

---

### Step 5: Check Error Response Format
**Priority**: 🟡 HIGH

Verify what the backend is actually returning:

**In test file**, add logging:
```typescript
const response = await request(app.getHttpServer())
  .post('/jobs')
  .send(jobData);

console.log('Response status:', response.status);
console.log('Response body:', response.body);
console.log('Response headers:', response.headers);
```

**Check if**:
- Response is actually 404
- Response body contains error details
- Error message indicates why request failed

---

## Possible Root Causes

### Hypothesis #1: Authentication Tokens Invalid
**Likelihood**: 🔴 Very High

**Theory**: Tests are sending requests without valid JWT tokens, and the auth guard is returning 404 instead of 401.

**Why This Happens**:
```typescript
// Some auth guards return 404 for security reasons
// (to hide the existence of protected routes)
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info) {
    if (err || !user) {
      throw new NotFoundException();  // ← Returns 404 instead of 401
    }
    return user;
  }
}
```

**Test**:
1. Check `backend/src/auth/guards/jwt-auth.guard.ts` (if exists)
2. Look for `NotFoundException` or custom error handling
3. Verify test tokens are valid

**Fix**: Ensure tests generate valid JWT tokens OR change guard to return 401

---

### Hypothesis #2: Test Route Mismatch
**Likelihood**: 🟡 Medium

**Theory**: Tests are calling `/jobs` but actual route is `/api/jobs` or different base path.

**Check**:
```typescript
// In app.module.ts or main.ts
app.setGlobalPrefix('api');  // ← Would make routes /api/jobs

// Or in controller
@Controller('api/jobs')  // ← Different path than expected
```

**Test**:
```bash
# Try different paths
curl http://localhost:3000/jobs
curl http://localhost:3000/api/jobs
```

**Fix**: Update test URLs to match actual routes OR remove global prefix

---

### Hypothesis #3: CORS or Middleware Blocking
**Likelihood**: 🟢 Low

**Theory**: CORS or other middleware rejecting requests.

**Check**: main.ts for:
```typescript
app.enableCors({
  origin: 'http://localhost:3001',  // ← Only allows frontend
  methods: ['GET', 'POST'],  // ← Might block PATCH, DELETE
});
```

**Test**: Check if OPTIONS preflight requests are working

**Fix**: Configure CORS to allow test requests

---

### Hypothesis #4: Controller Module Not Imported
**Likelihood**: 🟢 Low (routes are registered per logs)

**Theory**: JobsController or BidsController not imported in AppModule.

**Check**: `backend/src/app.module.ts`
```typescript
@Module({
  imports: [
    JobsModule,  // ← Should be here
    BidsModule,  // ← Should be here
  ],
})
```

**Evidence Against**: Startup logs show routes ARE registered, so this is unlikely.

---

### Hypothesis #5: Route Parameter Validation Failing
**Likelihood**: 🟡 Medium

**Theory**: Validation pipes rejecting requests before they reach controller.

**Check**: Global validation pipe configuration:
```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,  // ← Might reject valid requests
  transform: true,
}));
```

**Test**: Send request with minimal valid data

**Fix**: Adjust validation rules or DTO definitions

---

## Files to Investigate

### Critical Files
1. **backend/src/modules/jobs/jobs.controller.ts**
   - Check route decorators
   - Check guards applied
   - Verify controller methods exist

2. **backend/src/modules/jobs/jobs.module.ts**
   - Verify controller is registered
   - Check imports and exports

3. **backend/src/auth/guards/jwt-auth.guard.ts** (or similar)
   - Check error handling
   - Verify it returns correct HTTP status codes

4. **backend/src/app.module.ts**
   - Verify JobsModule imported
   - Check global middleware configuration

5. **backend/src/main.ts**
   - Check global prefix
   - Check CORS configuration
   - Check global pipes and guards

6. **backend/test/setup-e2e.ts**
   - Verify JWT token generation
   - Check how tokens are used in requests
   - Verify test data setup

### Test Files
7. **backend/test/api-integration.e2e-spec.ts**
   - Check request format
   - Verify headers are set
   - Check how authentication is handled

8. **backend/test/user-journeys.e2e-spec.ts**
   - Same checks as above

---

## Quick Diagnosis Commands

Run these to quickly identify the issue:

```bash
# 1. Check if backend is running
curl http://localhost:3000/health

# 2. Check auth endpoint (should work)
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"client@test.com","password":"password123"}'

# 3. Try to create job without auth (expect 401 or 403)
curl -X POST http://localhost:3000/jobs \
  -H "Content-Type: application/json" \
  -d '{"title":"Test"}'

# 4. List jobs (might be public)
curl http://localhost:3000/jobs

# 5. Check API documentation
curl http://localhost:3000/api/docs
```

**Document the responses** for each command.

---

## Recommended Fix Strategy

### Phase 1: Identify (30 minutes)
1. Run manual curl tests (Step 1)
2. Add request logging (Step 4)
3. Check actual error responses (Step 5)
4. **Goal**: Determine if issue is authentication, routing, or middleware

### Phase 2: Isolate (30 minutes)
1. Test with valid JWT token from login
2. Test without token
3. Compare responses
4. **Goal**: Confirm root cause hypothesis

### Phase 3: Fix (30-60 minutes)
Based on findings from Phase 1 & 2:

**If authentication issue**:
- Fix JWT guard to return 401 instead of 404
- Ensure tests generate valid tokens
- Verify token format and expiration

**If routing issue**:
- Update test URLs to match actual routes
- Remove/adjust global prefix if needed
- Fix route decorators in controllers

**If middleware issue**:
- Adjust CORS configuration
- Review validation pipe rules
- Check middleware order

### Phase 4: Verify (15 minutes)
1. Rerun E2E tests
2. Verify tests pass
3. Test manually with curl
4. Check all affected endpoints

---

## Success Criteria

Issue is considered FIXED when:

1. ✅ POST /jobs returns 201 with valid data
2. ✅ GET /jobs returns 200 with job list
3. ✅ POST /bids returns 201 with valid data
4. ✅ POST /messages returns 201 with valid data
5. ✅ Admin endpoints return expected status codes
6. ✅ Invalid requests return appropriate errors (401, 403, 400)
7. ✅ Backend E2E tests pass (41 tests)
8. ✅ Manual API testing confirms all endpoints work

---

## Testing Checklist

After fix, verify:

- [ ] POST /jobs with valid auth returns 201
- [ ] POST /jobs without auth returns 401
- [ ] GET /jobs returns 200
- [ ] POST /bids with valid data returns 201
- [ ] POST /bids/:id/accept returns 200
- [ ] POST /messages returns 201
- [ ] Admin endpoints accessible with admin token
- [ ] All E2E tests pass
- [ ] No regression in working endpoints

---

## Related Issues

- **ISSUE #001**: Registration/Login Flow (may be affected by same auth issues)
- **ISSUE #003**: Job Posting Form (blocked by this issue)
- **ISSUE #005**: Browse Jobs Empty (may be related)

---

**Issue Created**: October 20, 2025
**Last Updated**: October 20, 2025
**Status**: 🔴 OPEN - Investigation Required
**Estimated Fix Time**: 1-2 hours
