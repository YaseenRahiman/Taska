# Taska Platform - E2E Test Plan & User Stories

## User Stories and Test Coverage

### 1. **Guest/Visitor User Journey**
**User Story**: As a visitor, I want to explore the platform before signing up

**Test Scenarios**:
- ✅ Home page loads with all sections visible
- ✅ Navigation links work (Browse, Categories, How It Works, About)
- ✅ Call-to-action buttons navigate correctly
- ✅ Footer links work properly
- ✅ Popular categories display
- ✅ Can navigate to auth pages (Sign In, Get Started)

**Pages Tested**:
- `/` - Home page
- `/browse` - Browse artisans
- `/categories` - All categories
- `/how-it-works` - Platform explanation
- `/about` - About page
- `/contact` - Contact page
- `/pricing` - Pricing information
- `/careers`, `/privacy`, `/terms`, `/safety`, `/insurance`, `/press`, `/success-stories`, `/resources`

---

### 2. **Client Registration & Onboarding Journey**
**User Story**: As a new client, I want to register and post my first job

**Test Scenarios**:
- ✅ Can navigate to registration page
- ✅ Registration form validates inputs correctly
- ✅ Can successfully register with valid data
- ✅ Redirects to client dashboard after registration
- ✅ Can complete profile information
- ✅ Can post first job with all required fields
- ✅ Job appears in dashboard after creation

**Pages Tested**:
- `/auth/register` - Registration
- `/client/dashboard` - Client dashboard
- `/client/jobs/create` - Create job
- `/client/profile` - Profile management

---

### 3. **Client Job Management Journey**
**User Story**: As a client, I want to manage my jobs and interact with artisans

**Test Scenarios**:
- ✅ Can view all my jobs
- ✅ Can view job details
- ✅ Can edit job information
- ✅ Can view bids on my jobs
- ✅ Can accept/reject bids
- ✅ Can message artisans
- ✅ Can mark job as complete
- ✅ Can leave reviews for artisans
- ✅ Dashboard stats update correctly

**Pages Tested**:
- `/client/dashboard` - Dashboard overview
- `/client/jobs` - All jobs list
- `/client/jobs/[id]` - Job details
- `/client/jobs/[id]/edit` - Edit job
- `/client/messages` - Messaging (if exists)
- `/client/payments` - Payment management (if exists)

---

### 4. **Artisan Registration & Onboarding Journey**
**User Story**: As a new artisan, I want to register and start bidding on jobs

**Test Scenarios**:
- ✅ Can navigate to artisan registration
- ✅ Registration form includes artisan-specific fields
- ✅ Can successfully register as artisan
- ✅ Redirects to artisan dashboard
- ✅ Can complete professional profile
- ✅ Can browse available jobs
- ✅ Can submit first bid

**Pages Tested**:
- `/artisan/register` - Artisan registration
- `/artisan/dashboard` - Artisan dashboard
- `/artisan/profile` - Profile management
- `/artisan/jobs` - Browse jobs

---

### 5. **Artisan Job Bidding Journey**
**User Story**: As an artisan, I want to find jobs, submit bids, and manage projects

**Test Scenarios**:
- ✅ Can browse available jobs
- ✅ Can filter jobs by category/location
- ✅ Can view job details
- ✅ Can submit bid with price and timeline
- ✅ Can view my bids status
- ✅ Can edit pending bids
- ✅ Can withdraw bids
- ✅ Can view accepted projects
- ✅ Can update project status
- ✅ Dashboard shows correct statistics

**Pages Tested**:
- `/artisan/dashboard` - Dashboard overview
- `/artisan/jobs` - Available jobs
- `/artisan/bids` - My bids
- `/artisan/projects` - Active projects
- `/artisan/profile` - Profile and portfolio

---

### 6. **Admin Platform Management Journey**
**User Story**: As an admin, I want to manage users, moderate content, and view analytics

**Test Scenarios**:
- ✅ Can access admin dashboard
- ✅ Can view platform analytics
- ✅ Can manage users (view, edit, suspend)
- ✅ Can moderate content (jobs, reviews)
- ✅ Can view financial reports
- ✅ Can configure platform settings
- ✅ Can manage payment approvals
- ✅ Can configure escrow settings
- ✅ Can perform bulk operations
- ✅ Can view and moderate reviews

**Pages Tested**:
- `/admin/dashboard` - Admin overview
- `/admin/analytics` - Platform analytics
- `/admin/users` - User management
- `/admin/moderation` - Content moderation
- `/admin/financial` - Financial reports
- `/admin/settings` - Platform settings
- `/admin/payment-approval` - Payment approvals
- `/admin/escrow-config` - Escrow configuration
- `/admin/bulk-operations` - Bulk operations
- `/admin/review-moderation` - Review moderation

---

### 7. **Authentication & Security Journey**
**User Story**: As a user, I want secure access to my account

**Test Scenarios**:
- ✅ Can log in with valid credentials
- ✅ Cannot log in with invalid credentials
- ✅ Error messages display correctly
- ✅ Can log out successfully
- ✅ Can access forgot password flow
- ✅ Protected routes redirect to login
- ✅ Session persists across page refresh
- ✅ Role-based access control works

**Pages Tested**:
- `/auth/login` - Login page
- `/auth/register` - Registration
- `/auth/forgot-password` - Password recovery

---

## Test Coverage Matrix

| User Role | Pages | Critical Flows | Button Interactions | Forms | Navigation |
|-----------|-------|----------------|-------------------|--------|------------|
| Guest | 15 | 3 | 20+ | 0 | Full |
| Client | 10 | 5 | 40+ | 5 | Role-specific |
| Artisan | 8 | 4 | 35+ | 4 | Role-specific |
| Admin | 10 | 6 | 50+ | 10+ | Admin-only |

**Total Pages**: 43
**Total User Flows**: 18+
**Estimated Test Cases**: 200+

---

## Critical User Flows (Priority Order)

### P0 - Critical (Must Work)
1. User registration (Client & Artisan)
2. User login/logout
3. Client: Post a job
4. Artisan: Submit a bid
5. Client: Accept a bid
6. Payment processing flow

### P1 - Important (Should Work)
7. Profile management (Client & Artisan)
8. Job editing
9. Bid management
10. Messaging between users
11. Admin user management
12. Admin content moderation

### P2 - Nice to Have (Good to Work)
13. Advanced filtering
14. Analytics dashboards
15. Bulk operations
16. Export functionality

---

## Test Data Requirements

### Users
- **Guest**: No auth required
- **Client**: test-client@taska.co.za / TestPass123!
- **Artisan**: test-artisan@taska.co.za / TestPass123!
- **Admin**: admin@taska.co.za / AdminPass123!

### Jobs
- Sample job with all required fields
- Jobs in different statuses (OPEN, IN_PROGRESS, COMPLETED)
- Jobs with and without images

### Bids
- Sample bids from different artisans
- Bids in different statuses

---

## Testing Environment Setup

### Prerequisites
1. Backend server running on `http://localhost:3000`
2. Frontend server running on `http://localhost:3001`
3. Test database with seed data
4. Playwright installed and configured

### Configuration
- Base URL: `http://localhost:3001`
- API URL: `http://localhost:3000`
- Test timeout: 60 seconds
- Retries: 2
- Browsers: Chromium, Firefox, WebKit

---

## Success Criteria

### Functional
- ✅ All user journeys complete successfully
- ✅ All buttons and links work as expected
- ✅ All forms validate and submit correctly
- ✅ Navigation flows correctly between pages
- ✅ Error states handled gracefully

### Non-Functional
- ✅ Pages load within 3 seconds
- ✅ No console errors during navigation
- ✅ Mobile responsive layouts work
- ✅ Accessibility standards met (basic)

---

## Test Execution Plan

### Phase 1: Setup (30 mins)
- Install Playwright
- Configure test environment
- Create test utilities and helpers

### Phase 2: Core Flows (2-3 hours)
- Guest navigation tests
- Authentication tests
- Client job posting flow
- Artisan bidding flow

### Phase 3: Advanced Flows (2-3 hours)
- Job management tests
- Bid management tests
- Admin functionality tests
- Edge cases and error handling

### Phase 4: Validation (1 hour)
- Cross-browser testing
- Mobile viewport testing
- Performance checks
- Generate test report

**Total Estimated Time**: 6-8 hours for comprehensive testing
