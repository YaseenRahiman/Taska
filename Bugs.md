# Bugs Found During Exploratory Testing
**Date**: 2026-01-16
**Testing Environment**: Chrome, localhost:3001 (Frontend), localhost:3000 (Backend)

## Summary
**Total Bugs Found**: 3
**Total Bugs Fixed**: 3 ✅
- **Critical (P0)**: 2 bugs - Homepage SVG rendering ✅, Registration page module error ✅
- **Medium (P2)**: 1 bug - Mobile menu not functioning ✅

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

