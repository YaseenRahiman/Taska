# Bugs Log - Exploratory Testing

**Test Date**: 2026-01-18
**Tester**: Claude AI
**Environment**: Chrome Browser, Frontend: localhost:3001, Backend: localhost:4000

---


## BUG-001: Submit Bid Button in Modal Does Nothing

**Severity**: 🔴 HIGH
**Page**: /artisan/jobs (Job Details Modal)
**User Type**: Artisan
**Status**: ✅ RESOLVED

### Resolution
**Fixed on**: 2026-01-18
**Root Cause**: The "Submit Bid" button in JobDetailsModal was calling `onClose()` before `onBidClick()`, which cleared the `selectedJob` state before the BidModal could use it.

**Fix Applied**:
1. Modified `JobDetailsModal.tsx` to only call `onBidClick()` without calling `onClose()` first
2. Updated `page.tsx` to properly manage modal state transitions - keeping `selectedJob` when transitioning from details modal to bid modal
3. Added logic to only clear `selectedJob` when both modals are closed

### Steps to Reproduce
1. Navigate to /artisan/jobs (Browse Jobs page)
2. Click "View Details" on any job card
3. Job details modal opens showing full job information
4. Click the green "Submit Bid" button at the bottom of the modal

### Expected Result
- Should open a bid submission form (modal or new page)
- OR should navigate to a bid creation page with job pre-selected
- OR should show inline bid form in the modal

### Actual Result
- Modal closes immediately
- No bid form appears
- No navigation occurs
- User is returned to job listing page
- No feedback or error message shown

### Impact
- **Critical user flow blocked**: Artisans cannot submit bids from job details view
- Primary call-to-action in job details modal is non-functional
- Forces artisans to use alternative "Submit Bid" button on job cards
- Poor user experience - clicking prominent CTA does nothing

### Workaround
- Use "Submit Bid" button on the job card directly (not tested yet)
- OR navigate to job detail page separately (if exists)

### Technical Notes
- Button appears functional (clickable, styled correctly)
- No visual feedback when clicked
- No console errors visible (need to check browser console)
- Possible JavaScript event handler missing or failing silently

### Additional Context
- Found during exploratory testing of artisan job browsing workflow
- User "Thabo" (artisan account)
- Testing environment: localhost:3001
- Browser: Chrome

---


## BUG-002: Bid Submission Fails Silently

**Severity**: 🔴 CRITICAL
**Page**: /artisan/jobs (Submit Bid Modal)
**User Type**: Artisan
**Status**: ✅ RESOLVED

### Resolution
**Fixed on**: 2026-01-18
**Root Cause**: The modal could be closed during submission by clicking backdrop or X button, interrupting the submission process. Additionally, network errors were not being handled with user-friendly messages.

**Fix Applied**:
1. Added `handleBackdropClick` function to prevent closing modal during submission or after success
2. Disabled X button during submission and success states
3. Enhanced error handling to cover:
   - 401 Unauthorized (session expired)
   - 409 Conflict (duplicate bid)
   - Network errors (no response)
   - Timeout errors
4. The success message now displays for 2 seconds before auto-closing, giving users clear feedback

### Steps to Reproduce
1. Navigate to /artisan/jobs (Browse Jobs)
2. Click "Submit Bid" button on a job card (e.g., "Kitchen Sink Leak Repair", R 800, Cape Town, John Smith)
3. Submit Bid modal opens
4. Fill in form:
   - Bid Amount: R 650
   - Estimated Completion Time: 1 day
   - Proposal Message: [valid 222 character message]
5. Click "Submit Bid" button in modal
6. Modal closes
7. Navigate to "My Bids" page
8. Click "Refresh Bids"

### Expected Result
- Bid submission should succeed OR show clear error message
- Success notification/toast should appear ("Bid submitted successfully!")
- New bid should appear in My Bids list
- Bid count should increment from 3 to 4
- Bid should show as PENDING status

### Actual Result
- Modal closes without any feedback
- NO success message displayed
- NO error message displayed
- Bid does NOT appear in My Bids page
- Bid count remains at 3 (unchanged)
- Clicking "Refresh Bids" does not show new bid
- User has zero indication that submission failed

### Impact
- **Critical data loss**: Artisan's work creating bid is lost
- **No user feedback**: User assumes bid was submitted successfully
- **Poor UX**: Silent failures damage trust in platform
- **Business impact**: Lost opportunities for artisans, fewer bids for clients
- **User confusion**: Artisan may wait for client response that will never come

### Technical Investigation Needed
- Check browser console for JavaScript errors
- Check network tab for failed API requests
- Verify backend API endpoint is working
- Check form validation (may be failing silently)
- Verify database connection and bid creation logic

### Comparison with Other Bids
Existing bid that DID work:
- Kitchen Sink Repair - Urgent, R 1,200, submitted 1/18/2026 at 4:33:16 AM
- Shows in My Bids list correctly

Failed bid:
- Kitchen Sink Leak Repair, R 650, 1 day, submitted ~4:33 AM (today)
- Does NOT appear anywhere

### Possible Root Causes
1. API call failing without error handling
2. Form validation failing silently
3. Backend rejecting bid without returning error
4. JavaScript error preventing submission
5. Database constraint violation
6. Session/authentication issue

### Additional Context
- Tested immediately after BUG-001 (modal Submit Bid button)
- Used Submit Bid button on job card (not modal)
- Form appeared to accept all inputs
- No client-side validation errors shown
- Modal closed normally (suggesting form submitted)

---

