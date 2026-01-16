# Bugs Found During Exploratory Testing
**Date**: 2026-01-16
**Testing Environment**: Chrome, localhost:3001 (Frontend), localhost:3000 (Backend)

## Summary
**Total Bugs Found**: 5 (3 previous + 2 new from latest testing)
**Total Bugs Fixed**: 3 ✅
**Open Bugs**: 2 ❌
- **Critical (P0)**: 3 bugs total
  - Homepage SVG rendering ✅ FIXED
  - Registration page module error ✅ FIXED
  - **Backend not starting - Prisma client issue ❌ OPEN** (BUG-004)
- **High (P1)**: 1 bug - **All backend features non-functional ❌ OPEN** (BUG-005)
- **Medium (P2)**: 1 bug - Mobile menu not functioning ✅ FIXED

### Testing Coverage
✅ **Tested Successfully**:
- Homepage content and layout (after SVG workaround)
- Categories page (fully functional)
- How It Works page (fully functional)
- About page (fully functional)
- Desktop navigation (functional)
- Mobile responsive layout (renders correctly)

❌ **Unable to Test** (Blocked by Bugs):
- User registration flow (Client)
- User registration flow (Artisan)
- Login functionality
- Job posting features
- Artisan browsing with authentication
- Profile management
- Messaging system
- Payment/escrow flow
- Complete mobile navigation experience

---

## BUG-001: Homepage Content Hidden by Logo Overlay ✅ FIXED
**Severity**: Critical
**Priority**: P0
**Status**: Fixed
**Found**: 2026-01-16 16:29
**Fixed**: 2026-01-16

### Description
The homepage loads with content in the DOM but displays only a large blue whale/logo that obscures all page content. The accessibility tree shows all content is present (navigation, headings, CTA buttons, etc.) but none is visible on screen.

### Steps to Reproduce
1. Navigate to http://localhost:3001/
2. Page loads
3. Observe that only a large blue logo/whale is visible

### Expected Result
Homepage should display:
- Navigation bar with links (Find Artisans, Categories, How It Works, About, Sign In, Get Started)
- Hero section with heading "Connect with Skilled Artisans across South Africa"
- Why Choose Taska section
- Popular Services section
- How Taska Works section
- Footer

### Actual Result
Only blue whale/logo graphic is visible, covering entire viewport. Content exists in DOM but is not rendered visually.

### Technical Details
- Console errors: "Error: A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received" (2 occurrences)
- DOM structure is complete and correct
- **Root Cause**: SVG icons (particularly social media icons in footer) are rendering at massive scale (1508px × 1508px) instead of respecting their Tailwind CSS size classes (w-5 h-5 = 20px × 20px)
- Facebook icon SVG with class "w-5 h-5" is computing to 1508px width/height
- Multiple SVG elements have z-index positioning that overlays content
- Tailwind CSS size constraints are not being applied to SVG elements

### Impact
Complete blocker for any user interaction on homepage. No user can:
- Navigate the site
- Register
- Sign in
- Browse artisans
- Learn about the platform

### Screenshots
See initial testing screenshots showing only logo visible.

### Fix Applied
1. Added explicit `width="20" height="20"` attributes to all footer social media SVG icons (`footer.tsx`)
2. Added global CSS rules in `globals.css` to enforce SVG size constraints:
   - `svg { max-width: 100%; height: auto; }` for general SVG containment
   - Explicit size rules for `.w-5`, `.h-5`, `.w-6`, `.h-6` classes with `!important`
3. These changes ensure SVGs respect their Tailwind CSS size classes

---

## BUG-002: Registration Page Cannot Load - Module Not Found ✅ FIXED
**Severity**: Critical
**Priority**: P0
**Status**: Fixed
**Found**: 2026-01-16 16:35
**Fixed**: 2026-01-16

### Description
The registration page (/auth/register) fails to load with a Next.js server error. The page displays a "Server Error" overlay with "Error: Cannot find module './6552.js'".

### Steps to Reproduce
1. Navigate to http://localhost:3001/
2. Click "Get Started" or "Sign In" link in navigation
3. Page attempts to load /auth/register
4. Server error appears

### Expected Result
Registration page should load with:
- User type selection (Client vs Artisan)
- Registration form fields
- Validation
- Submit functionality

### Actual Result
Next.js error overlay displays:
```
Error: Cannot find module './6552.js'
Require stack:
- C:\Users\Yaseen\OneDrive\Documents\Investments\Taska\frontend\.next\server\webpack-runtime.js
- C:\Users\Yaseen\OneDrive\Documents\Investments\Taska\frontend\.next\server\app\not-found.js
- [multiple server files]
```

### Technical Details
- Error Type: Module Resolution Error
- Module: ./6552.js (webpack chunk)
- Location: webpack-runtime.js
- Next.js is unable to find a dynamically imported chunk file
- Likely causes:
  - Incomplete build
  - Missing webpack chunk after code change
  - Build cache corruption
  - Dynamic import not properly bundled

### Impact
Complete blocker for user registration. No users can:
- Register as Client
- Register as Artisan
- Access authentication flow
- Create accounts on the platform

### Recommended Fix
1. Stop dev server
2. Clear Next.js cache: `rm -rf frontend/.next`
3. Restart dev server: `npm run dev`
4. If issue persists, check for:
   - Dynamic imports in registration page
   - Code splitting configuration
   - Webpack configuration issues

### Fix Applied
1. Cleared `.next` cache directory to rebuild webpack chunks
2. Verified build completes successfully with `npm run build`

---

## BUG-003: Mobile Menu Not Opening ✅ FIXED
**Severity**: Medium
**Priority**: P2
**Status**: Fixed
**Found**: 2026-01-16 16:42
**Fixed**: 2026-01-16

### Description
The mobile menu "Toggle menu" button (hamburger menu) does not open a navigation menu when clicked on mobile viewport (375px width).

### Steps to Reproduce
1. Resize browser to mobile viewport (375px × 667px)
2. Navigate to any page
3. Click "Open main menu" button (hamburger icon)
4. Observe behavior

### Expected Result
Mobile navigation menu should slide in or expand, showing:
- Find Artisans
- Categories
- How It Works
- About
- Sign In
- Get Started

### Actual Result
Button appears but clicking it produces no visible response. No menu opens, no animation occurs.

### Technical Details
- Button element exists with proper text "Open main menu"
- Button has accessible label and proper ARIA attributes
- Click event fires but no visual feedback
- Likely missing onClick handler or menu state management
- Could be issue with mobile menu component not rendering

### Impact
Mobile users cannot access navigation. Forces users to:
- Manually type URLs
- Use browser back button exclusively
- Cannot discover other pages easily

### User Experience Impact
- Poor mobile usability
- Navigation is fundamental for mobile users
- Affects discoverability of all site features

### Fix Applied
1. Root cause was BUG-001 - SVGs rendering at massive scale created invisible overlay intercepting clicks
2. Added explicit `width` and `height` attributes to footer SVG icons (`footer.tsx`)
3. Added global CSS rules to enforce SVG size constraints (`globals.css`)
4. Added `relative z-50` to mobile menu button for proper stacking context
5. Added `active:bg-cream-100` for visual feedback on touch
6. Added `aria-expanded` attribute for accessibility

---

# Exploratory Testing Session - 2026-01-16

## Testing Summary
**Date**: 2026-01-16
**Tester**: Claude (AI Agent)
**Testing Type**: Exploratory Testing
**Environment**: Linux, Node.js v22.21.1, localhost:3001 (Frontend), localhost:3000 (Backend attempted)

### New Bugs Found: 2
- **Critical (P0)**: 1 bug - Backend not starting due to Prisma client generation issues
- **High (P1)**: 1 bug - All backend-dependent features non-functional

### Testing Approach
Manual exploratory testing was performed due to network restrictions preventing Playwright browser installation. Testing included:
- Backend startup verification
- Backend compilation error analysis
- Frontend page accessibility checks
- Review of existing E2E test results
- Code inspection for potential issues

---

## BUG-004: Backend Not Starting - Prisma Client Not Generated ❌ OPEN
**Severity**: Critical
**Priority**: P0
**Status**: Open
**Found**: 2026-01-16
**Area**: Backend/Database

### Description
The backend application fails to start due to 120 TypeScript compilation errors. The root cause is that the Prisma client has not been generated, causing all Prisma type imports to fail. This completely blocks the backend from running.

### Steps to Reproduce
1. Navigate to backend directory
2. Run `npm run start:dev`
3. Observe TypeScript compilation errors
4. Check backend logs in dev server output

### Expected Result
Backend should:
- Generate Prisma client during installation or initial setup
- Compile successfully with 0 TypeScript errors
- Start NestJS server on port 3000
- Respond to health check endpoint at /health
- Expose API endpoints for authentication, users, jobs, etc.

### Actual Result
Backend compilation fails with 120 TypeScript errors including:
```
TS2305: Module '"@prisma/client"' has no exported member 'User'.
TS2305: Module '"@prisma/client"' has no exported member 'UserRole'.
TS2694: Namespace 'Prisma' has no exported member 'UserInclude'.
TS2694: Namespace 'Prisma' has no exported member 'UserWhereInput'.
TS2694: Namespace 'Prisma' has no exported member 'UserCreateInput'.
TypeError: Cannot read properties of undefined (reading 'CLIENT')
```

Error appears at: `backend/src/auth/dto/register.dto.ts:30`
```
example: UserRole.CLIENT,
                  ^
TypeError: Cannot read properties of undefined (reading 'CLIENT')
```

### Technical Details
**Root Cause**: Prisma client not generated. The Prisma schema exists at `backend/prisma/schema.prisma` but `npx prisma generate` has not been run, so the TypeScript types are missing.

**Affected Files** (sample):
- `src/users/users.service.ts` - Multiple Prisma type errors
- `src/auth/dto/register.dto.ts` - UserRole.CLIENT undefined
- `src/modules/settings/settings.controller.ts` - Type errors
- All files importing from `@prisma/client`

**Total Errors**: 120 TypeScript compilation errors
**Compilation Time**: ~22 seconds before failing

**Required Fix**:
1. Run `npx prisma generate` to generate Prisma client
2. May also need `npx prisma migrate dev` if database needs migrations
3. Ensure DATABASE_URL is properly configured in .env file
4. Add prisma generate to postinstall script in package.json

### Impact
**CRITICAL BLOCKER** - Entire backend is non-functional. Blocks:
- User registration (Client and Artisan)
- User authentication/login
- Job posting and management
- Artisan browsing and search
- Profile management
- Messaging system
- Payment/escrow functionality
- Admin panel
- All API endpoints
- Database operations

**User Impact**:
- Frontend appears functional but all interactive features requiring backend API calls will fail
- Users cannot create accounts
- Users cannot log in
- No data persistence
- Complete platform dysfunction

**Business Impact**:
- Application cannot be used in current state
- No MVP functionality available
- Blocks all user testing
- Platform launch impossible without fix

### Recommended Fix Priority
**IMMEDIATE** - This is a P0 blocker that must be fixed before any other testing or development can proceed.

### Fix Steps
```bash
cd backend
npx prisma generate
npx prisma migrate dev  # If migrations needed
npm run start:dev
```

Also add to `backend/package.json`:
```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

---

## BUG-005: All Backend-Dependent Features Non-Functional ❌ OPEN
**Severity**: High
**Priority**: P1
**Status**: Open
**Found**: 2026-01-16
**Area**: Integration/Full Stack
**Depends On**: BUG-004

### Description
All features requiring backend API communication are non-functional due to backend server not running. While the frontend loads successfully and displays UI components, any feature requiring data persistence, authentication, or server-side processing fails.

### Steps to Reproduce
1. Navigate to http://localhost:3001
2. Frontend loads successfully
3. Attempt any of the following:
   - Register a new account (Client or Artisan)
   - Log in with credentials
   - Post a job
   - Browse artisans
   - Send a message
   - Make a payment
4. Features will fail silently or show network/API errors

### Expected Result
All features should work end-to-end:
- Registration form should create new users in database
- Login should authenticate and create sessions
- Job posting should persist to database
- Artisan browsing should fetch real data
- Messaging should send/receive messages
- Payments should process through escrow system

### Actual Result
Frontend displays properly but:
- No API responses from http://localhost:3000
- Backend health check at /health returns no response
- All fetch/API calls to backend fail with network errors
- Forms submit but data is not persisted
- Authentication state cannot be established
- No database operations can be performed

### Technical Details
**Root Cause**: Backend server not running (see BUG-004)

**Affected User Journeys**:
1. **Guest User Journey**:
   - ✅ Can view homepage
   - ✅ Can view categories page
   - ✅ Can view how-it-works page
   - ✅ Can view about page
   - ❌ Cannot register
   - ❌ Cannot log in

2. **Client Journey** (All Blocked):
   - ❌ Cannot register as client
   - ❌ Cannot log in
   - ❌ Cannot post jobs
   - ❌ Cannot browse artisans
   - ❌ Cannot view artisan profiles
   - ❌ Cannot send messages
   - ❌ Cannot make payments

3. **Artisan Journey** (All Blocked):
   - ❌ Cannot register as artisan
   - ❌ Cannot log in
   - ❌ Cannot create profile
   - ❌ Cannot browse available jobs
   - ❌ Cannot bid on jobs
   - ❌ Cannot manage portfolio
   - ❌ Cannot receive messages

4. **Admin Journey** (All Blocked):
   - ❌ Cannot access admin panel
   - ❌ Cannot manage users
   - ❌ Cannot manage disputes
   - ❌ Cannot view analytics

**Testing Coverage**:
Based on E2E test results (E2E_TEST_RESULTS.md), previous test runs showed:
- 87 out of 93 tests failing due to backend/navigation timeouts
- Only 6 tests passing (basic static page loads)
- 6.45% success rate
- All authentication and protected route tests failing

### Impact
**HIGH** - Platform is essentially a static website without backend functionality.

**User Impact**:
- No user registration possible
- No login functionality
- No core platform features work
- Users can only view static content
- Platform appears broken/incomplete

**Development Impact**:
- Cannot test any backend-integrated features
- Cannot perform E2E testing
- Cannot validate user journeys
- QA/testing blocked

### Dependencies
This bug is a direct consequence of BUG-004. Once the backend starts successfully, this bug should be automatically resolved. However, additional testing will be needed to verify all features work correctly.

### Recommended Fix
1. Fix BUG-004 first (generate Prisma client, start backend)
2. Verify backend is running: `curl http://localhost:3000/health`
3. Test API endpoints individually
4. Run E2E test suite to verify all features
5. Document any additional bugs found after backend is running

---

