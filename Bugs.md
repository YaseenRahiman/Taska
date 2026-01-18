# Bugs Found During Testing

**Last Updated**: 2026-01-17
**Testing Session**: Fresh Exploratory Testing with Chrome Automation

---

## Active Bugs

_No active bugs._

---

## Resolved Bugs

### BUG-001: "Sign up" Link Not Working on Login Page
**Severity**: 🟡 Medium
**Page**: /auth/login
**User Type**: All
**Status**: ✅ Resolved (2026-01-17)

**Root Cause**:
The "Sign up" link was rendered in a server component (page.tsx) while the login form was a client component. This caused hydration/navigation issues where clicks on the link didn't trigger navigation.

**Fix Applied**:
Moved the "Sign up" link from `frontend/src/app/auth/login/page.tsx` into the client component `frontend/src/components/auth/UserLoginForm.tsx` to ensure proper client-side navigation handling.

**Files Changed**:
- `frontend/src/components/auth/UserLoginForm.tsx` - Added "Sign up" link section
- `frontend/src/app/auth/login/page.tsx` - Removed duplicate link section

---

### BUG-002: No Jobs Visible on Artisan Browse Jobs Page
**Severity**: 🔴 Critical
**Page**: /artisan/jobs
**User Type**: Artisan
**Status**: ✅ Resolved (2026-01-17)

**Root Cause**:
Two issues were identified:
1. **API Response Mismatch**: Frontend expected `response.data.jobs` but API returned `response.data.data`
2. **Data Structure Mismatch**: Frontend Job interface expected flat fields (`category: string`, `location: string`) but API returned nested objects (`category: { name, ... }`, separate `city`/`province` fields)

**Fix Applied**:
1. Changed `response.data.jobs` to `response.data.data` in the fetchJobs function
2. Added data transformation to map API response to frontend Job interface:
   - `job.category?.name` → `category`
   - `${job.city}, ${job.province}` → `location`
   - `job.client?.profile?.firstName + lastName` → `client.name`
   - `job.createdAt` → `postedAt`

**Files Changed**:
- `frontend/src/app/artisan/jobs/page.tsx` - Fixed API response handling and added data transformation

---
