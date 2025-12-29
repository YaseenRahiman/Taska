# Implementation Plan & Agent Coordination Strategy
## Taska Client Portal - Execution Roadmap

**Document Version:** 1.0
**Date:** 2025-10-30
**Prepared by:** Requirements Analyst (Claude)
**Status:** ✅ READY FOR EXECUTION

---

## Executive Summary

This document provides a concrete execution plan for implementing the Taska Client Portal based on the comprehensive requirements specification. The plan is organized by priority phases with specific agent assignments and coordination strategies.

**Implementation Timeline:** 5 weeks
**Total Effort:** ~180 hours
**Risk Level:** LOW (solid foundation exists)

---

## Agent Coordination Strategy

### Available Agents & Specializations

Based on the SuperClaude framework, these agents are available for task delegation:

1. **/sc:implement** - Feature and code implementation specialist
   - **Best For:** Building new pages, components, features
   - **Capabilities:** MCP integration, persona activation, full-stack development
   - **When to Use:** Creating job detail page, bid management, new features

2. **/sc:test** - Testing specialist with coverage analysis
   - **Best For:** E2E tests, component tests, test infrastructure
   - **Capabilities:** Playwright, Vitest, coverage reports, quality analysis
   - **When to Use:** Building comprehensive test suite (user's #1 priority)

3. **/sc:improve** - Code quality and enhancement specialist
   - **Best For:** Refactoring, optimization, UX polish
   - **Capabilities:** Systematic improvements, performance, maintainability
   - **When to Use:** Phase 5 optimizations, accessibility improvements

4. **/sc:troubleshoot** - Debugging and issue resolution specialist
   - **Best For:** Fixing bugs, diagnosing issues, error handling
   - **Capabilities:** System diagnostics, error resolution, build issues
   - **When to Use:** Image upload fix, geocoding integration issues

5. **/sc:design** - Architecture and system design specialist
   - **Best For:** API design, component architecture, technical specifications
   - **Capabilities:** Comprehensive specifications, architecture decisions
   - **When to Use:** Designing new API endpoints, component hierarchies

### Coordination Principles

1. **Sequential for Dependencies:** Complete Phase 1 before Phase 2
2. **Parallel for Independence:** Multiple agents can work simultaneously within a phase
3. **Testing Integration:** Every feature implementation should be followed by testing
4. **Validation Gates:** Each phase requires sign-off before proceeding

---

## Phase 1: Critical Fixes (Week 1) 🔴 HIGHEST PRIORITY

**Objective:** Fix broken functionality and unblock testing infrastructure

**Total Effort:** 21 hours
**Agent Assignments:** /sc:troubleshoot + /sc:implement + /sc:test

### Task 1.1: Fix Image Upload (4 hours)
**Agent:** `/sc:troubleshoot`
**Priority:** P0 (Critical)

**Context:**
- Current implementation collects images but doesn't upload
- Wrong API endpoint used (`/upload/job-images` vs `/jobs/upload-images`)
- Backend endpoint exists and works (tested)

**Specific Tasks:**
```bash
/sc:troubleshoot "Fix image upload in job creation flow:
1. Update API endpoint from /upload/job-images to /jobs/upload-images
2. Implement proper upload before job submission
3. Add upload progress indicators
4. Add error handling and retry logic
5. Test with various image sizes and formats

Files to modify:
- frontend/src/app/client/jobs/create/page.tsx (lines 172-183)

Expected behavior:
- Images upload to /jobs/upload-images before job creation
- Progress shown for each image
- Errors handled gracefully with retry option
- Uploaded image URLs included in job creation payload"
```

**Acceptance Criteria:**
- ✅ User can upload 5 images
- ✅ Progress indicator shows for each image
- ✅ Upload errors display user-friendly messages
- ✅ Uploaded images appear in job detail view
- ✅ Console shows no errors

**Validation:**
```bash
# Manual test
1. Navigate to /client/jobs/create
2. Complete steps 1-5
3. Upload 5 images in step 6
4. Verify progress shown for each
5. Submit job
6. Verify images appear in job detail

# Automated test (Phase 4)
- E2E test for image upload flow
```

### Task 1.2: Implement Geocoding (6 hours)
**Agent:** `/sc:implement`
**Priority:** P0 (Critical)

**Context:**
- Frontend currently uses hardcoded (0, 0) coordinates
- Backend has GeocodingService but not integrated
- Need address → coordinates conversion

**Specific Tasks:**
```bash
/sc:implement "Implement geocoding for job posting:

Backend Integration:
1. Review GeocodingService at backend/src/modules/jobs/services/geocoding.service.ts
2. Add geocoding to job creation flow in jobs.service.ts
3. Accept address string, return lat/long

Frontend Implementation:
1. Add address autocomplete using Google Places API or alternative
2. Update CreateJobDto to send full address
3. Remove manual lat/long fields from frontend
4. Display location on map preview (optional but nice)

Files to modify:
- backend/src/modules/jobs/jobs.service.ts (createJob method)
- frontend/src/app/client/jobs/create/page.tsx (Step 4)

Expected behavior:
- User enters address with autocomplete
- Backend geocodes address to coordinates
- All jobs have valid lat/long for proximity search"
```

**Acceptance Criteria:**
- ✅ Address autocomplete works
- ✅ Backend geocodes address successfully
- ✅ All new jobs have valid coordinates
- ✅ Geocoding errors handled gracefully (fallback to city center)

**Validation:**
```bash
# Manual test
1. Create job with address "123 Long Street, Cape Town"
2. Check database: lat/long should be ~(-33.925, 18.424)
3. Verify job appears in nearby search

# Automated test
- E2E test for geocoding accuracy
```

### Task 1.3: Frontend E2E Testing Infrastructure (8 hours)
**Agent:** `/sc:test`
**Priority:** P0 (Critical - User's #1 request)

**Context:**
- User emphasized "Testing is VERY VERY important" (twice)
- Backend has excellent E2E tests
- Frontend has ZERO tests currently
- Need Playwright setup and initial test suite

**Specific Tasks:**
```bash
/sc:test "Set up comprehensive frontend E2E testing infrastructure:

Phase 1 - Infrastructure Setup:
1. Install Playwright and dependencies
2. Create playwright.config.ts with environments (dev, staging)
3. Set up test fixtures (authenticated users, test data)
4. Create test helpers (login, navigation, assertions)
5. Configure CI/CD integration

Phase 2 - Initial Test Suite:
Write these 5 critical E2E tests:

1. Complete Job Posting Flow
   - Navigate to /client/jobs/create
   - Fill all 7 steps
   - Upload 2 images
   - Submit job
   - Verify redirect to job detail
   - Verify job appears in /client/jobs

2. Job Creation Validation
   - Try to submit without required fields
   - Verify error messages appear
   - Fill missing fields
   - Verify errors clear
   - Submit successfully

3. Category Selection
   - Load category selection step
   - Verify categories load from API
   - Select a subcategory
   - Verify selection highlights
   - Verify budget suggestions appear

4. Draft Save (when implemented)
   - Fill partial job information
   - Click 'Save as Draft'
   - Verify draft appears in jobs list
   - Resume editing
   - Complete and publish

5. Job List Filtering
   - Create jobs with various statuses via API
   - Navigate to /client/jobs
   - Click each filter (ALL, DRAFT, OPEN, etc.)
   - Verify only matching jobs displayed
   - Verify statistics update

Test Data Management:
- Create seed data for test database
- Factory functions for jobs, categories, users
- Cleanup after each test

CI/CD Integration:
- Run on every PR
- Block merge if tests fail
- Generate coverage report
- Run in parallel for speed"
```

**Deliverables:**
- ✅ Playwright configured and working
- ✅ 5 E2E tests passing
- ✅ Test fixtures and helpers created
- ✅ CI/CD pipeline configured
- ✅ Documentation for running tests

**Acceptance Criteria:**
- ✅ `npm run test:e2e` runs all tests
- ✅ All 5 tests pass consistently
- ✅ Tests run in CI/CD
- ✅ Clear test output with screenshots on failure

### Task 1.4: Budget Suggestions Decision (3 hours)
**Agent:** `/sc:implement` (quick decision + implementation)
**Priority:** P1 (High)

**Context:**
- Frontend has budget suggestions UI
- Backend endpoint `/jobs/budget-suggestions` doesn't exist
- Need to either implement or remove

**Specific Tasks:**
```bash
/sc:implement "Resolve budget suggestions functionality:

Decision Path 1 - Implement Endpoint (if valuable):
1. Create GET /jobs/budget-suggestions?categoryId={id} endpoint
2. Query jobs table for min/avg/max budget by category
3. Return {min: number, average: number, max: number}
4. Cache results for performance

Decision Path 2 - Remove UI (if not valuable):
1. Remove budget suggestions section from Step 3
2. Remove getBudgetSuggestions function
3. Remove budgetSuggestions state
4. Clean up UI (lines 326-347)

Recommendation: Implement - provides value to users

Files to modify:
- backend/src/modules/jobs/jobs.controller.ts (add endpoint)
- backend/src/modules/jobs/jobs.service.ts (add method)
- frontend/src/app/client/jobs/create/page.tsx (already implemented)

Test:
- Select category 'Plumbing'
- Verify budget suggestions appear
- Verify numbers are realistic (based on actual jobs)"
```

**Acceptance Criteria:**
- ✅ Decision made and documented
- ✅ If implemented: endpoint works and returns data
- ✅ If removed: UI cleaned up
- ✅ No console errors

---

## Phase 2: Job Detail & Management (Week 2) 🟡 HIGH PRIORITY

**Objective:** Complete core job management functionality

**Total Effort:** 32 hours
**Agent Assignments:** /sc:implement + /sc:test

### Task 2.1: Job Detail Page (12 hours)
**Agent:** `/sc:implement`
**Priority:** P0 (Critical - Core feature)

**Context:**
- Job list has "View" button but page doesn't exist
- Need comprehensive job detail view
- Foundation for all job management actions

**Specific Tasks:**
```bash
/sc:implement "Create comprehensive job detail page at /client/jobs/[id]/page.tsx:

Page Structure:
1. Job Header
   - Title (h1)
   - Status badge (DRAFT, OPEN, IN_PROGRESS, COMPLETED, CANCELLED)
   - Urgency badge
   - Action buttons (Edit, Publish, Cancel, Complete, Delete)

2. Job Body
   - Full description (formatted with line breaks)
   - Category badge
   - Budget display (with budget type)
   - Location section:
     * Full address (line1, line2, city, province, postal)
     * Map display (Google Maps or OpenStreetMap)
     * Distance from user (if available)
   - Requirements list (if any)
   - Timeline/dates (posted, updated, start date)

3. Image Gallery (if images exist)
   - Grid of thumbnails
   - Click to open lightbox
   - Navigation between images
   - Use existing mobile-image-gallery component

4. Bids Section
   - Bid count badge
   - List of recent bids (3-5)
   - 'View All Bids' button → expand/separate page
   - Bid cards showing:
     * Artisan avatar + name
     * Bid amount
     * Estimated days
     * Message preview
     * Status badge
     * Action buttons (Accept, Reject, Message)

5. Action Buttons (status-dependent)
   - DRAFT: Edit, Publish, Delete
   - OPEN: Edit, Cancel, Delete
   - IN_PROGRESS: Complete, Cancel
   - COMPLETED: View Review, Message Artisan
   - CANCELLED: Delete

Authorization:
- Only job owner can view (or ADMIN)
- Only job owner can perform actions
- Use backend /jobs/:id endpoint

Responsive:
- Mobile: single column
- Tablet: 2 columns (main + sidebar)
- Desktop: optimized layout

Components to create:
- JobHeader component
- JobBody component
- JobImageGallery component
- JobLocation component
- JobBidsSection component
- JobActionButtons component

API Integration:
- GET /jobs/:id (already exists)
- Handle loading states
- Handle error states (404, 403)
- Real-time updates (polling or WebSocket)

Testing:
- Test with various job statuses
- Test with/without images
- Test with/without bids
- Test permissions"
```

**Deliverables:**
- ✅ Job detail page fully functional
- ✅ All information displayed correctly
- ✅ Image gallery working
- ✅ Map showing correct location
- ✅ Action buttons appropriate for status
- ✅ Responsive on all devices

**Acceptance Criteria:**
- ✅ Job owner can view all job details
- ✅ Images display in gallery with lightbox
- ✅ Location shown on map
- ✅ Bids section shows recent bids
- ✅ Action buttons work (wired up in Task 2.3)
- ✅ Non-owners get 403 error

**Follow-up Testing:**
```bash
/sc:test "Create E2E tests for job detail page:

Tests:
1. View job detail as owner
2. View job detail as non-owner (expect 403)
3. View job with images
4. View job without images
5. View job with bids
6. View job without bids
7. Action buttons visibility based on status
8. Mobile responsive layout"
```

### Task 2.2: Job Edit Page (8 hours)
**Agent:** `/sc:implement`
**Priority:** P1 (High)

**Context:**
- Edit button exists but page doesn't
- Should reuse creation wizard
- Need validation for bid-related restrictions

**Specific Tasks:**
```bash
/sc:implement "Create job edit page at /client/jobs/[id]/edit/page.tsx:

Requirements:
1. Reuse CreateJobPage component structure
2. Load existing job data via GET /jobs/:id
3. Pre-fill all form fields with current values
4. Same 7-step wizard
5. Validation rules:
   - Cannot change category if bids exist
   - Cannot change budget if bid accepted
   - Cannot edit if status is COMPLETED or CANCELLED

Implementation:
1. Create EditJobPage component
2. Fetch job data on mount
3. Transform job data to form format
4. Pre-populate Zod form with values
5. Disable restricted fields based on job state
6. Handle update via PATCH /jobs/:id
7. Redirect to job detail on success

Edge Cases:
- Job not found → 404
- Not owner → 403
- Job completed → show message, disable edit
- Category change with bids → show warning, disable field
- Budget change with accepted bid → show warning, disable field

Files to create:
- frontend/src/app/client/jobs/[id]/edit/page.tsx

Files to reference:
- frontend/src/app/client/jobs/create/page.tsx (reuse structure)

Testing:
- Edit draft job (all fields editable)
- Edit open job with bids (category disabled)
- Edit job with accepted bid (budget disabled)
- Try to edit completed job (redirect)"
```

**Deliverables:**
- ✅ Edit page fully functional
- ✅ Existing data pre-filled
- ✅ Validation rules enforced
- ✅ Successful update flow
- ✅ Error handling

**Acceptance Criteria:**
- ✅ Draft jobs fully editable
- ✅ Category locked if bids exist
- ✅ Budget locked if bid accepted
- ✅ Can't edit completed/cancelled jobs
- ✅ Changes saved via API
- ✅ User redirected to detail page

### Task 2.3: Job Actions Implementation (8 hours)
**Agent:** `/sc:implement`
**Priority:** P0 (Critical - Core workflow)

**Context:**
- Backend endpoints exist for all actions
- Need frontend UI and confirmation flows
- Actions: Publish, Cancel, Complete, Delete

**Specific Tasks:**
```bash
/sc:implement "Implement job action flows:

1. Publish Draft
   - Button: 'Publish Job'
   - Confirmation modal: 'Job will be visible to artisans'
   - API: PUT /jobs/:id/publish
   - Success: Status → OPEN, show success toast
   - Notification: Matching artisans notified

2. Cancel Job
   - Button: 'Cancel Job' (OPEN or IN_PROGRESS only)
   - Modal with:
     * Reason textarea (required)
     * Warning: 'Artisans will be notified'
     * If IN_PROGRESS: 'Payment refund will be processed'
   - API: PUT /jobs/:id/cancel with {reason: string}
   - Success: Status → CANCELLED, show toast
   - Handle: Refund logic on backend

3. Complete Job
   - Button: 'Mark as Complete' (IN_PROGRESS only)
   - Confirmation modal:
     * 'Confirm work is complete?'
     * 'Payment will be released to artisan'
   - API: PUT /jobs/:id/complete
   - Success: Status → COMPLETED, redirect to review page
   - Trigger: Payment release on backend

4. Delete Job
   - Button: 'Delete Job' (DRAFT or CANCELLED only)
   - Confirmation modal:
     * 'This action cannot be undone'
     * 'All job data and images will be deleted'
   - API: DELETE /jobs/:id
   - Success: Redirect to /client/jobs
   - Handle: Image cleanup on backend

Components to create:
- PublishJobModal
- CancelJobModal (with reason textarea)
- CompleteJobModal
- DeleteJobModal
- useJobActions hook (for action logic)

Error Handling:
- Network errors → show error toast, allow retry
- Validation errors → show in modal
- Permission errors → show 403 message

Integration:
- Wire up buttons in JobActionButtons component
- Update job detail page after action
- Show loading states on buttons
- Disable buttons during action

Files to modify:
- frontend/src/app/client/jobs/[id]/page.tsx
- Create: frontend/src/components/client/JobActionModals.tsx
- Create: frontend/src/hooks/useJobActions.ts"
```

**Deliverables:**
- ✅ All 4 action flows working
- ✅ Confirmation modals for each action
- ✅ API integration complete
- ✅ Error handling implemented
- ✅ Success feedback (toasts)

**Acceptance Criteria:**
- ✅ Publish: DRAFT → OPEN
- ✅ Cancel: any → CANCELLED (with reason)
- ✅ Complete: IN_PROGRESS → COMPLETED
- ✅ Delete: DRAFT/CANCELLED → removed
- ✅ All have confirmation prompts
- ✅ Errors handled gracefully

**Follow-up Testing:**
```bash
/sc:test "Create E2E tests for job actions:

Tests:
1. Publish draft job
2. Cancel open job with reason
3. Cancel in-progress job (verify refund logic)
4. Complete in-progress job
5. Delete draft job
6. Delete cancelled job
7. Try to delete job with bids (expect error)
8. Error handling for each action"
```

### Task 2.4: Dashboard Statistics Enhancement (4 hours)
**Agent:** `/sc:improve`
**Priority:** P2 (Nice to have)

**Context:**
- Dashboard currently calculates stats manually
- Backend has `/jobs/statistics` endpoint
- Should use API for consistency

**Specific Tasks:**
```bash
/sc:improve "Enhance dashboard statistics:

Changes:
1. Replace manual calculation with API call
2. Use GET /jobs/statistics endpoint
3. Add real-time updates (polling every 30s)
4. Add loading skeletons for stats cards
5. Add refresh button

Files to modify:
- frontend/src/app/client/dashboard/page.tsx (lines 113-127)

Implementation:
- Create useJobStatistics hook
- Implement polling with useEffect + setInterval
- Add loading states
- Add error handling
- Add manual refresh button

Benefits:
- Consistent with backend calculations
- Supports complex stats in future
- Reduces frontend calculation logic
- Real-time accuracy"
```

**Deliverables:**
- ✅ Dashboard uses `/jobs/statistics` API
- ✅ Stats update in real-time
- ✅ Loading states added
- ✅ Manual refresh option

---

## Phase 3: Bid Management (Week 3) 🟡 MEDIUM-HIGH PRIORITY

**Objective:** Enable bid review and artisan selection

**Total Effort:** 24 hours
**Agent Assignments:** /sc:implement + /sc:test

### Task 3.1: Bid Display Enhancement (6 hours)
**Agent:** `/sc:implement`
**Priority:** P1 (High - Core business value)

**Context:**
- Job detail page shows limited bid info
- Need comprehensive bid display and management
- Foundation for bid actions

**Specific Tasks:**
```bash
/sc:implement "Enhance bid display in job detail page:

Expand Bids Section:
1. Full Bid List
   - Show all bids (not just 3-5)
   - Pagination or infinite scroll if >10 bids
   - Each bid card shows:
     * Artisan avatar (circular, 48px)
     * Artisan name + rating (stars)
     * Bid amount (large, prominent)
     * Budget difference (e.g., '+R200' or '-R150')
     * Estimated days with calendar icon
     * Full message (expandable)
     * Submission date (relative time)
     * Status badge (PENDING, ACCEPTED, REJECTED)
     * Artisan badges (verified, top rated, etc.)

2. Sorting Options
   - Dropdown: 'Sort by...'
   - Options:
     * Lowest Amount (default)
     * Highest Amount
     * Newest First
     * Oldest First
     * Shortest Timeline
     * Highest Rated Artisan

3. Filtering Options
   - Status filter: PENDING, ACCEPTED, REJECTED, ALL
   - Amount range slider
   - Timeline range (days)
   - Verified artisans only toggle

4. Bid Statistics
   - Total bids count
   - Average bid amount
   - Bid range (min - max)
   - Average timeline

5. Empty State
   - Show when no bids
   - Message: 'No bids yet. Your job is visible to X artisans nearby'
   - Suggestions to improve bid response

API Integration:
- GET /jobs/:id already includes bids
- GET /bids?jobId={id} (if separate endpoint exists)

Components:
- BidCard (enhanced)
- BidFilters
- BidSort
- BidStatistics

Files to modify:
- frontend/src/app/client/jobs/[id]/page.tsx (Bids Section)
- Create: frontend/src/components/client/BidCard.tsx
- Create: frontend/src/components/client/BidFilters.tsx"
```

**Deliverables:**
- ✅ Comprehensive bid display
- ✅ Sorting and filtering
- ✅ Bid statistics
- ✅ Empty states
- ✅ Responsive design

**Acceptance Criteria:**
- ✅ All bids displayed with complete info
- ✅ Sorting works correctly
- ✅ Filtering narrows results
- ✅ Statistics accurate
- ✅ Mobile-friendly layout

### Task 3.2: Bid Actions (Accept/Reject) (8 hours)
**Agent:** `/sc:implement`
**Priority:** P0 (Critical - Core transaction)

**Context:**
- Bid actions are THE key business transaction
- Accepting bid triggers payment flow
- Need careful confirmation and error handling

**Specific Tasks:**
```bash
/sc:implement "Implement bid acceptance and rejection flows:

1. Accept Bid Flow
   Button: 'Accept Bid' (green, prominent)

   Confirmation Modal:
   - Title: 'Accept Bid from [Artisan Name]?'
   - Summary:
     * Bid amount: R{amount}
     * Timeline: {days} days
     * Job total: R{amount + platform fee}
   - Platform fee breakdown
   - Payment method selection
   - Terms acceptance checkbox
   - Warning: 'Other bids will be automatically rejected'

   On Confirm:
   - Call API: PUT /bids/:id/accept
   - Trigger payment flow (integrate with payments module)
   - Update job status: OPEN → IN_PROGRESS
   - Update bid status: PENDING → ACCEPTED
   - Other bids: PENDING → REJECTED
   - Send notifications to all artisans
   - Redirect to payment page OR show success modal

   Success Modal:
   - 'Bid Accepted!'
   - 'Next: Complete payment to start work'
   - Button: 'Proceed to Payment'
   - Button: 'Message Artisan'

2. Reject Bid Flow
   Button: 'Reject' (subtle, secondary)

   Confirmation Modal:
   - Title: 'Reject Bid from [Artisan Name]?'
   - Optional reason textarea
   - Predefined reasons (checkboxes):
     * Too expensive
     * Timeline too long
     * Prefer another artisan
     * Insufficient experience
     * Other (specify)
   - Warning: 'Artisan will be notified'

   On Confirm:
   - Call API: PUT /bids/:id/reject with {reason}
   - Update bid status: PENDING → REJECTED
   - Send notification to artisan
   - Show success toast
   - Bid card updates in place

3. Permission Checks
   - Only job owner can accept/reject
   - Only PENDING bids can be accepted/rejected
   - Can't accept if job status != OPEN
   - Can't accept multiple bids

4. Error Handling
   - Payment fails: keep bid ACCEPTED, prompt to retry payment
   - Network error: show error, allow retry
   - Bid already accepted by someone else: refresh page
   - Insufficient funds: redirect to add payment method

Components to create:
- AcceptBidModal
- RejectBidModal
- PaymentSummary component
- useBidActions hook

API Endpoints (check if exist, create if not):
- PUT /bids/:id/accept
- PUT /bids/:id/reject
- GET /payments/calculate (for fee breakdown)

Payment Integration:
- Integrate with PayFast/Stripe service
- Handle escrow payment creation
- Show payment status

Files to modify:
- frontend/src/components/client/BidCard.tsx (add action buttons)
- Create: frontend/src/components/client/AcceptBidModal.tsx
- Create: frontend/src/components/client/RejectBidModal.tsx
- Create: frontend/src/hooks/useBidActions.ts
- Check: backend/src/modules/bids/bids.controller.ts"
```

**Deliverables:**
- ✅ Accept bid flow complete
- ✅ Reject bid flow complete
- ✅ Payment integration working
- ✅ All confirmations and validations
- ✅ Error handling robust

**Acceptance Criteria:**
- ✅ Accept bid → payment → job IN_PROGRESS
- ✅ Reject bid → artisan notified
- ✅ Only one bid can be accepted
- ✅ Other bids auto-rejected
- ✅ Permissions enforced
- ✅ Errors handled gracefully

**Follow-up Testing:**
```bash
/sc:test "Create E2E tests for bid actions:

Tests:
1. Accept bid successfully
2. Accept bid → complete payment
3. Accept bid → verify other bids rejected
4. Reject bid with reason
5. Try to accept multiple bids (expect error)
6. Try to accept as non-owner (expect 403)
7. Payment failure handling
8. Network error handling"
```

### Task 3.3: Bid Comparison Tool (6 hours)
**Agent:** `/sc:implement`
**Priority:** P2 (Nice to have)

**Context:**
- Clients may want to compare bids side-by-side
- Helps decision-making with visual comparison

**Specific Tasks:**
```bash
/sc:implement "Create bid comparison modal:

Features:
1. Trigger: 'Compare Bids' button above bid list
2. Select up to 3 bids (checkbox on bid cards)
3. Open comparison modal

Comparison View:
- Side-by-side grid (1-3 columns based on selection)
- Rows:
  * Artisan avatar + name + rating
  * Bid amount (highlighted differences)
  * % difference from budget
  * Timeline (days)
  * Message/proposal
  * Portfolio samples (if available)
  * Experience (years)
  * Completed jobs count
  * Response time
  * Reviews summary
  * Verification badges

- Highlight:
  * Lowest bid (green)
  * Fastest timeline (blue)
  * Highest rated (gold star)

- Actions at bottom:
  * Accept buttons for each
  * Close comparison
  * View full profile

Responsive:
- Desktop: 3 columns
- Tablet: 2 columns
- Mobile: swipe carousel

Components:
- BidComparisonModal
- BidComparisonCard
- useBidComparison hook

Files to create:
- frontend/src/components/client/BidComparisonModal.tsx"
```

**Deliverables:**
- ✅ Comparison modal functional
- ✅ Side-by-side comparison clear
- ✅ Highlights for best values
- ✅ Responsive design
- ✅ Accept from comparison

### Task 3.4: Artisan Messaging Integration (4 hours)
**Agent:** `/sc:implement`
**Priority:** P2 (Important but can defer)

**Context:**
- Message button exists on bid cards
- Need integration with messages module
- In-context job-specific messaging

**Specific Tasks:**
```bash
/sc:implement "Integrate messaging with bid management:

Requirements:
1. 'Message' button on each bid card
2. Click opens messaging interface
3. Pre-populated with job context
4. Message thread specific to job + artisan

Implementation Options:

Option A - Modal Chat:
- Open modal with chat interface
- Job context shown at top
- Real-time messaging
- Close returns to job detail

Option B - Navigate to Messages:
- Navigate to /client/messages?jobId={id}&artisanId={id}
- Messages page shows conversation
- Job context sidebar

Recommendation: Option A for better UX

Chat Interface:
- Message history (job-specific)
- Text input
- Send button
- File attachment (optional)
- Real-time updates (WebSocket or polling)

API Integration:
- GET /messages?jobId={id}&senderId={userId}&receiverId={artisanId}
- POST /messages {jobId, receiverId, content}

Components:
- MessageModal
- MessageThread
- MessageInput
- useMessages hook

Files to modify:
- frontend/src/components/client/BidCard.tsx (wire Message button)
- Create: frontend/src/components/client/MessageModal.tsx
- Check: backend/src/modules/messages/ for existing endpoints"
```

**Deliverables:**
- ✅ Message button functional
- ✅ Chat interface opens
- ✅ Messages sent/received
- ✅ Job context displayed
- ✅ Real-time updates

**Note:** If messages module not ready, stub with placeholder modal showing "Coming Soon"

---

## Phase 4: Comprehensive Testing (Week 4) ⚠️ CRITICAL

**Objective:** Achieve >80% frontend test coverage (USER'S #1 PRIORITY)

**Total Effort:** 40 hours
**Agent Assignment:** `/sc:test`

**Context:**
User emphasized "Testing is VERY VERY important" (mentioned twice). This is the highest priority non-functional requirement.

### Task 4.1: E2E Test Suite Expansion (16 hours)
**Agent:** `/sc:test`
**Priority:** P0 (Critical)

**Specific Tasks:**
```bash
/sc:test "Expand E2E test coverage to comprehensive level:

Test Suites to Create:

1. Job Posting Flow (10 scenarios)
   - Complete job posting with all fields
   - Job posting with minimal fields
   - Draft save and resume
   - Image upload (multiple images)
   - Validation error handling
   - Category selection across all categories
   - Different budget types and urgencies
   - Location with different provinces
   - Requirements and timeline variations
   - Mobile responsive flow

2. Job Management Flow (15 scenarios)
   - View job detail (all statuses)
   - Edit draft job
   - Edit open job with restrictions
   - Publish draft job
   - Cancel job with reason
   - Cancel job with refund (IN_PROGRESS)
   - Complete job
   - Delete draft job
   - Delete cancelled job
   - Try to delete with bids (expect error)
   - Job list filtering (all filters)
   - Job search functionality
   - Pagination/infinite scroll
   - Mobile responsive views
   - Permission boundary testing

3. Bid Management Flow (8 scenarios)
   - View bids on job
   - Sort bids (all options)
   - Filter bids
   - Accept bid → payment
   - Accept bid → verify other bids rejected
   - Reject bid with reason
   - Compare bids
   - Message artisan from bid

4. Error Handling (10 scenarios)
   - Network offline
   - API errors (400, 403, 404, 500)
   - Session expiration
   - Concurrent modification
   - Image upload failures
   - Payment failures
   - Form validation errors
   - Geocoding failures
   - Large file uploads
   - Slow network conditions

5. Responsive Design (5 viewports)
   - Mobile (375px)
   - Mobile landscape (667px)
   - Tablet (768px)
   - Desktop (1024px)
   - Large desktop (1920px)

Test each viewport for:
- Job creation flow
- Job detail page
- Job list page
- Dashboard
- All modals

Configuration:
- Parallel execution (4 workers)
- Screenshot on failure
- Video recording for debugging
- Retry flaky tests (max 2 retries)
- Generate HTML report

Coverage Target: >70% user flows

Files to create:
- tests/e2e/job-posting.spec.ts
- tests/e2e/job-management.spec.ts
- tests/e2e/bid-management.spec.ts
- tests/e2e/error-handling.spec.ts
- tests/e2e/responsive.spec.ts
- tests/helpers/test-data.ts
- tests/helpers/assertions.ts
- tests/fixtures/users.ts"
```

**Deliverables:**
- ✅ 48+ E2E tests covering all flows
- ✅ Test documentation
- ✅ Test data factories
- ✅ CI/CD integration
- ✅ Coverage report >70%

### Task 4.2: Component Tests (12 hours)
**Agent:** `/sc:test`
**Priority:** P1 (High)

**Specific Tasks:**
```bash
/sc:test "Create comprehensive component test suite:

Testing Framework:
- Vitest + React Testing Library
- Mock Service Worker (MSW) for API mocking
- @testing-library/user-event for interactions

Component Tests:

1. CreateJobModal (5 tests)
   - Opens when triggered
   - Closes on cancel
   - Closes on successful submission
   - Displays error messages
   - Passes data to onSuccess callback

2. Job Creation Wizard (10 tests)
   - Navigation forward on valid step
   - Navigation blocked on invalid step
   - Navigation backward freely
   - Step indicator updates
   - Form pre-fill from existing data
   - Step-specific validation
   - Final submission
   - Progress persistence
   - Mobile layout
   - Accessibility (keyboard nav)

3. Category Selection (6 tests)
   - Loads categories from API
   - Displays hierarchical structure
   - Highlights selected category
   - Triggers budget suggestions
   - Handles API errors
   - Searches categories

4. Image Upload (8 tests)
   - Accepts image files
   - Rejects non-image files
   - Enforces 5 image limit
   - Displays thumbnails
   - Removes images
   - Handles upload errors
   - Shows upload progress
   - Clears all on cancel

5. Job List (7 tests)
   - Displays all jobs
   - Filters by status
   - Empty state when no jobs
   - Navigates to detail on click
   - Triggers actions (edit, delete)
   - Updates after action
   - Loading states

6. Job Detail Components (10 tests)
   - JobHeader displays correctly
   - JobBody renders all info
   - JobImageGallery shows images
   - JobLocation renders map
   - JobBidsSection shows bids
   - JobActionButtons visibility
   - Action button clicks
   - Status-dependent rendering
   - Permission-based rendering
   - Empty states

7. Bid Components (6 tests)
   - BidCard displays correctly
   - BidFilters work
   - BidSort works
   - BidComparison modal
   - Bid action buttons
   - Bid statistics

Coverage Target: >80%

Files to create:
- tests/components/CreateJobModal.test.tsx
- tests/components/JobCreationWizard.test.tsx
- tests/components/CategorySelection.test.tsx
- tests/components/ImageUpload.test.tsx
- tests/components/JobList.test.tsx
- tests/components/JobDetail.test.tsx
- tests/components/BidComponents.test.tsx
- tests/utils/test-utils.tsx (render helpers)
- tests/mocks/handlers.ts (MSW handlers)"
```

**Deliverables:**
- ✅ 52+ component tests
- ✅ MSW mocks for APIs
- ✅ Test utilities and helpers
- ✅ Coverage report >80%

### Task 4.3: Integration Tests (8 hours)
**Agent:** `/sc:test`
**Priority:** P1 (High)

**Specific Tasks:**
```bash
/sc:test "Create integration test suite:

Integration Tests:

1. Form Validation (15 tests)
   - Title length (5-100)
   - Description length (20-2000)
   - Category required
   - Budget range (100-100000)
   - Urgency required
   - Address fields validation
   - Postal code format
   - Coordinates validation
   - Optional fields handling
   - Cross-field validation
   - Date validations
   - Array field validations
   - Enum validations
   - Zod schema integration
   - Backend validation alignment

2. API Integration (10 tests)
   - Create job via API
   - Fetch categories from API
   - Upload images before submission
   - Handle API errors gracefully
   - Retry failed requests
   - Handle authentication errors
   - Parse API responses
   - Transform data correctly
   - Handle rate limiting
   - Handle timeouts

3. State Management (5 tests)
   - Job creation state flow
   - Draft persistence
   - Filter state management
   - Sorting state
   - Pagination state

4. Navigation (5 tests)
   - Job creation navigation
   - Job detail navigation
   - Edit job navigation
   - Protected routes
   - Redirects after actions

Files to create:
- tests/integration/form-validation.test.ts
- tests/integration/api-integration.test.ts
- tests/integration/state-management.test.ts
- tests/integration/navigation.test.ts"
```

**Deliverables:**
- ✅ 35+ integration tests
- ✅ All validation rules tested
- ✅ API integration verified
- ✅ Coverage gaps identified

### Task 4.4: Visual Regression Tests (4 hours)
**Agent:** `/sc:test`
**Priority:** P2 (Nice to have)

**Specific Tasks:**
```bash
/sc:test "Create visual regression test suite:

Tool: Playwright with screenshot comparison

Test Scenarios:

1. Job Creation Wizard
   - Screenshot each of 7 steps
   - Desktop + mobile views
   - Empty states
   - Filled states
   - Error states

2. Dashboard
   - Empty state (no jobs)
   - With data (jobs, bids, payments)
   - Different user scenarios
   - Mobile responsive

3. Job List
   - All filters
   - With various job counts
   - Empty states
   - Loading states

4. Job Detail
   - All job statuses
   - With/without images
   - With/without bids
   - Mobile views

5. Modals
   - All action modals
   - Bid comparison
   - Message modal
   - Error modals

6. Responsive Breakpoints
   - 375px, 768px, 1024px, 1920px
   - All key pages

Configuration:
- Baseline images stored
- Threshold: 0.1% difference
- Update baseline on approval
- CI/CD integration (optional)

Files to create:
- tests/visual/job-creation.spec.ts
- tests/visual/dashboard.spec.ts
- tests/visual/job-list.spec.ts
- tests/visual/job-detail.spec.ts
- tests/visual/modals.spec.ts
- tests/visual/__screenshots__/ (baseline images)"
```

**Deliverables:**
- ✅ Visual regression suite
- ✅ Baseline screenshots
- ✅ Comparison reports
- ✅ CI/CD integration (optional)

---

## Phase 5: Polish & Optimization (Week 5) 🟢 LOW PRIORITY

**Objective:** Enhance UX and performance (can defer if needed)

**Total Effort:** 28 hours
**Agent Assignment:** `/sc:improve`

### Task 5.1: UX Enhancements (8 hours)
**Agent:** `/sc:improve`

```bash
/sc:improve "Polish user experience across client portal:

Enhancements:
1. Toast Notifications
   - Replace alert() with toast library (react-hot-toast or sonner)
   - Success toasts for all actions
   - Error toasts with retry buttons
   - Info toasts for guidance

2. Loading States
   - Skeleton loaders for all data fetching
   - Progressive image loading
   - Shimmer effects
   - Loading progress for long operations

3. Empty States
   - Illustrations for empty states
   - Helpful messages
   - Clear CTAs
   - Guide users to next action

4. Success Animations
   - Check mark animations
   - Confetti for job posted
   - Smooth transitions
   - Micro-interactions

5. Error States
   - User-friendly error messages
   - Suggested actions
   - Contact support option
   - Error illustration"
```

### Task 5.2: Performance Optimization (8 hours)
**Agent:** `/sc:improve`

```bash
/sc:improve "Optimize performance across client portal:

Optimizations:
1. Image Optimization
   - Lazy loading for all images
   - Progressive images (blur-up)
   - WebP format
   - Responsive images
   - CDN integration

2. Code Splitting
   - Route-based splitting
   - Component lazy loading
   - Dynamic imports
   - Bundle analysis

3. API Optimization
   - React Query for caching
   - Request deduplication
   - Optimistic updates
   - Stale-while-revalidate

4. Rendering Optimization
   - Memo for expensive components
   - Virtual scrolling for long lists
   - Debounce search inputs
   - Throttle scroll handlers

Target:
- Lighthouse score >90
- Bundle size <500KB
- Page load <2s
- Time to interactive <3s"
```

### Task 5.3: Accessibility Improvements (6 hours)
**Agent:** `/sc:improve`

```bash
/sc:improve "Improve accessibility to WCAG 2.1 AA:

Improvements:
1. ARIA Labels
   - All interactive elements
   - Form fields
   - Buttons
   - Icons

2. Keyboard Navigation
   - Tab order logical
   - Focus visible
   - Skip links
   - Keyboard shortcuts

3. Screen Reader Support
   - Semantic HTML
   - Alt text for images
   - Announcements for actions
   - Status messages

4. Color Contrast
   - All text meets 4.5:1 ratio
   - Focus indicators visible
   - Error messages clear

5. Testing
   - Run axe-core
   - Screen reader testing (NVDA/JAWS)
   - Keyboard-only navigation
   - Generate accessibility report"
```

### Task 5.4: Mobile Optimization (6 hours)
**Agent:** `/sc:improve`

```bash
/sc:improve "Optimize mobile experience:

Optimizations:
1. Touch Interactions
   - Touch-friendly button sizes (44x44px)
   - Swipe gestures for gallery
   - Pull-to-refresh
   - Touch feedback

2. Mobile Layouts
   - Single column layouts
   - Collapsible sections
   - Bottom sheets for modals
   - Sticky headers

3. Mobile Performance
   - Reduce initial payload
   - Optimize fonts
   - Minimize reflows
   - Fast tap response

4. Mobile Testing
   - Test on real devices
   - iOS Safari
   - Android Chrome
   - Various screen sizes"
```

---

## Implementation Checklist

### Week 1: Critical Fixes ✅ Must Complete
- [ ] Image upload fixed and working
- [ ] Geocoding implemented
- [ ] 5 E2E tests passing
- [ ] Budget suggestions resolved
- [ ] CI/CD running tests

### Week 2: Job Management ✅ Core Features
- [ ] Job detail page complete
- [ ] Job edit page functional
- [ ] All job actions working (publish, cancel, complete, delete)
- [ ] Dashboard using statistics API
- [ ] 10+ E2E tests for job management

### Week 3: Bid Management ✅ Business Value
- [ ] Bid display enhanced with sorting/filtering
- [ ] Accept/reject bids working
- [ ] Payment integration complete
- [ ] Bid comparison tool functional
- [ ] Messaging integrated or stubbed
- [ ] 8+ E2E tests for bid management

### Week 4: Testing ⚠️ CRITICAL (User Priority)
- [ ] 48+ E2E tests passing
- [ ] 52+ component tests passing
- [ ] 35+ integration tests passing
- [ ] Visual regression suite created
- [ ] Coverage >80% frontend
- [ ] All tests run in CI/CD
- [ ] Test documentation complete

### Week 5: Polish ⭐ Nice to Have
- [ ] Toast notifications implemented
- [ ] Loading states polished
- [ ] Performance optimized (Lighthouse >90)
- [ ] Accessibility WCAG 2.1 AA
- [ ] Mobile optimized

---

## Coordination Protocol

### Daily Standups
- Agent responsible reports progress
- Blockers identified and resolved
- Next tasks clarified
- Dependencies coordinated

### Agent Handoffs
```bash
# Example handoff from /sc:implement to /sc:test
/sc:implement completes job detail page
→ Notify: "Job detail page complete at /client/jobs/[id]/page.tsx"
→ /sc:test begins: "Create E2E tests for job detail page"
→ Tests reveal bugs → /sc:troubleshoot fixes
→ Tests pass → Feature marked complete
```

### Progress Tracking
- Use TodoWrite for phase-level tasks
- Update requirements spec with completion status
- Mark acceptance criteria as ✅ or ❌
- Document any scope changes

### Communication
- Clear task descriptions with context
- Expected deliverables listed
- Acceptance criteria defined
- Files to modify specified
- Testing requirements included

---

## Success Criteria

### Phase 1 Complete When:
- ✅ Image upload works end-to-end
- ✅ All jobs have valid geolocation
- ✅ 5 E2E tests passing in CI/CD
- ✅ Budget suggestions resolved
- ✅ No console errors in job creation

### Phase 2 Complete When:
- ✅ Job detail page shows all information
- ✅ Job editing works with restrictions
- ✅ All status transitions work (publish, cancel, complete, delete)
- ✅ Dashboard uses API statistics
- ✅ 15+ E2E tests passing

### Phase 3 Complete When:
- ✅ Bids display with sort/filter
- ✅ Accept bid → payment → job IN_PROGRESS
- ✅ Reject bid → artisan notified
- ✅ Bid comparison works
- ✅ 8+ E2E tests passing

### Phase 4 Complete When:
- ✅ >60 E2E tests passing
- ✅ >50 component tests passing
- ✅ >30 integration tests passing
- ✅ Coverage >80%
- ✅ Visual regression baseline created
- ✅ All tests in CI/CD

### Phase 5 Complete When:
- ✅ Lighthouse score >90
- ✅ WCAG 2.1 AA compliance
- ✅ Mobile optimized
- ✅ UX polished

---

## Risk Mitigation

### Technical Risks
1. **Image upload complexity**
   - Mitigation: Start with basic upload, enhance later
   - Fallback: Skip upload if blocking, add in Phase 5

2. **Geocoding API costs**
   - Mitigation: Cache results, rate limit
   - Fallback: Manual lat/long entry option

3. **Payment integration complexity**
   - Mitigation: Stub payment flow if service not ready
   - Coordination: Work with payment team

4. **Test flakiness**
   - Mitigation: Proper waits, retry logic, stable selectors
   - Monitoring: Track flake rate, fix immediately

### Schedule Risks
1. **Phase 4 (testing) takes longer than estimated**
   - Mitigation: Start testing in parallel with Phase 2-3
   - Buffer: Week 5 can be deferred if needed

2. **Dependencies on other modules**
   - Mitigation: Stub external dependencies
   - Coordination: Clear interfaces, mock data

### User Expectation Risks
1. **Testing priority not met**
   - Mitigation: Make Phase 4 mandatory gate
   - Communication: Show coverage reports

2. **Feature expectations not met**
   - Mitigation: Validate with user after Phase 1
   - Flexibility: Adjust priorities based on feedback

---

## Conclusion

This implementation plan provides a clear roadmap for completing the Taska Client Portal. The plan:

1. **Prioritizes Critical Fixes** (Week 1) to unblock functionality
2. **Delivers Core Features** (Weeks 2-3) for business value
3. **Emphasizes Testing** (Week 4) per user's explicit priority
4. **Adds Polish** (Week 5) for professional quality

**Key Success Factors:**
- Clear agent assignments with expertise matching
- Sequential phases with defined handoffs
- Testing integrated throughout, not just at end
- User priority (testing) given appropriate weight
- Realistic effort estimates with built-in buffer

**Recommendation:** Begin Phase 1 immediately with parallel workstreams:
- `/sc:troubleshoot` on image upload
- `/sc:implement` on geocoding
- `/sc:test` on testing infrastructure

This approach maximizes velocity while maintaining quality and addressing the user's explicit testing priority.

---

**Status:** ✅ READY FOR EXECUTION
**Next Action:** User approval → Begin Phase 1 implementation
**Contact:** Requirements Analyst available for clarifications
