# Quick Testing Guide - Bug Fixes

**Test Environment:** http://localhost:3001
**Date:** 2025-12-25

---

## Test Scenario 1: Verify JavaScript Error Fix (Bug #1)

**Expected Outcome:** No console errors, clean application load

### Steps:
1. Open browser and navigate to http://localhost:3001
2. Open Developer Console (F12 → Console tab)
3. Navigate through these pages:
   - Homepage (/)
   - Login page (/auth/login)
   - Register page (/auth/register)
   - Client dashboard (/client/dashboard) - requires login
   - Any other page

### Pass Criteria:
- ✅ No "ReferenceError: process is not defined" in console
- ✅ No red "1 error" notification in bottom-left corner
- ✅ Pages load without JavaScript errors
- ✅ All functionality works normally

---

## Test Scenario 2: Messages Page Functionality (Bug #2)

**Expected Outcome:** Complete messaging system works end-to-end

### Steps:

#### A. Page Access
1. Login as a client user
2. Navigate to http://localhost:3001/client/messages
3. Verify page loads (200 status, not 404)

#### B. Conversation List
1. Check if conversations appear in left panel
2. Verify conversation shows:
   - Artisan name and avatar
   - Last message preview
   - Timestamp
   - Unread count badge (if applicable)
   - Job context (if linked)

#### C. Message Thread
1. Click on a conversation
2. Verify message thread loads
3. Check message display:
   - Messages appear in chronological order
   - Own messages aligned right (primary color)
   - Other user messages aligned left (gray)
   - Timestamps visible
   - Read receipts (checkmarks) on sent messages

#### D. Send Message
1. Type a test message in input box
2. Click "Send" button OR press Enter
3. Verify:
   - Message appears in thread immediately
   - Message persists after page refresh
   - Conversation list updates with new last message
   - Loading state shows during send

#### E. Search Function
1. Type in search box at top of conversation list
2. Verify conversations filter by name or job title

### Pass Criteria:
- ✅ Page loads at /client/messages (not 404)
- ✅ Conversations display with all details
- ✅ Message thread displays correctly
- ✅ Can send messages successfully
- ✅ Search functionality works
- ✅ No console errors
- ✅ Responsive design works on mobile size

---

## Test Scenario 3: Payments Page Functionality (Bug #3)

**Expected Outcome:** Complete payment management system works

### Steps:

#### A. Page Access
1. Login as a client user
2. Navigate to http://localhost:3001/client/payments
3. Verify page loads (200 status, not 404)

#### B. Statistics Dashboard
1. Check if stat cards display at top:
   - Total Spent (green icon)
   - Pending (yellow icon)
   - Refunded (blue icon)
   - Transactions count (purple icon)
2. Verify amounts are formatted correctly (R ###.##)

#### C. Payment History Tab
1. Click "Payment History" tab (should be default)
2. Verify table displays:
   - Date, Job, Amount, Type, Status, Transaction ID columns
   - Proper formatting for dates and currency
   - Color-coded status badges
3. Test search:
   - Type job name in search box
   - Verify filtering works
4. Test status filter:
   - Select "Completed" from dropdown
   - Verify only completed payments show
   - Try other statuses
5. Test CSV export:
   - Click "Export CSV" button
   - Verify CSV file downloads with correct data

#### D. Payment Methods Tab
1. Click "Payment Methods" tab
2. Verify:
   - Saved payment methods display (or empty state)
   - Card shows last 4 digits
   - "Default" badge on default method
   - Expiry date visible
   - "Add Payment Method" button present
   - Delete button (trash icon) present
3. Test delete (if methods exist):
   - Click trash icon on a payment method
   - Confirm deletion
   - Verify method removed from list

#### E. Invoices Tab
1. Click "Invoices" tab
2. Verify table displays:
   - Invoice #, Job, Amount, Dates, Status columns
   - Proper date formatting
   - Status badges
   - "Download" button on each invoice
3. Test download:
   - Click "Download" button on an invoice
   - Verify PDF downloads (or appropriate action)

### Pass Criteria:
- ✅ Page loads at /client/payments (not 404)
- ✅ All stat cards display correctly
- ✅ Payment history table works with search/filter
- ✅ CSV export downloads successfully
- ✅ Payment methods tab displays correctly
- ✅ Invoices tab displays correctly
- ✅ All buttons and interactions work
- ✅ No console errors
- ✅ Responsive design works on mobile size

---

## Test Scenario 4: Category Selection UI (Bug #4)

**Expected Outcome:** Card-based category selection shows visual feedback

### Steps:

#### A. Navigate to Job Creation
1. Login as a client user
2. Navigate to http://localhost:3001/client/jobs/create
3. Fill in Step 1:
   - Title: "Test job for category selection"
   - Description: "Testing category selection visual feedback"
4. Click "Continue" to Step 2

#### B. Category Selection
1. Observe category UI:
   - Should see hierarchical card layout (NOT dropdown)
   - Parent categories as headers
   - Subcategory cards in grid below each parent
2. Click on a category card (e.g., "Plumbing" under "Home Services")
3. **Verify visual feedback:**
   - Card border changes to primary color (teal/green)
   - Card background changes to light teal
   - Checkmark icon appears in top-right corner
   - Shadow/ring effect appears
4. Click a different category
5. Verify:
   - Previous selection clears
   - New selection highlights
   - Only one category selected at a time

#### C. Selection Persistence
1. Click "Continue" to Step 3 (Budget)
2. Fill in budget fields
3. Click "Previous" to return to Step 2
4. **Verify:** Selected category still highlighted
5. Continue through all steps to Step 5 (Review)
6. **Verify:** Selected category displays in review section

### Pass Criteria:
- ✅ Category selection uses CARD UI (not dropdown)
- ✅ Clicking a card highlights it with color change
- ✅ Checkmark icon appears on selected category
- ✅ Only one category selected at a time
- ✅ Selection persists when navigating between steps
- ✅ Selected category shows in Step 5 review
- ✅ Can successfully complete job creation with selected category

---

## Quick Smoke Test (All Bugs)

**Time:** ~5 minutes
**Purpose:** Rapid verification all fixes work

1. **Bug #1:** Open console, navigate to homepage → No `process is not defined` error
2. **Bug #2:** Navigate to `/client/messages` → Page loads (not 404)
3. **Bug #3:** Navigate to `/client/payments` → Page loads (not 404)
4. **Bug #4:** Create job, go to Step 2 → Click category card → Card highlights

**Pass:** All 4 checks pass with no errors

---

## Regression Testing

**Verify existing functionality still works:**

1. **Authentication**
   - Can login as client
   - Can logout
   - Can register new account

2. **Client Dashboard**
   - Stats display correctly
   - Recent jobs show
   - Navigation links work

3. **Job Creation (existing steps)**
   - Step 1 (Basic Info) works
   - Step 3 (Budget) works
   - Step 4 (Location) works
   - Step 5 (Images & Review) works
   - Can submit job successfully

4. **Jobs List**
   - Can view all jobs
   - Can filter/search jobs
   - Can view job details

---

## Browser Compatibility Testing

Test on these browsers:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)
- [ ] Safari (if on Mac)
- [ ] Mobile Chrome (Android)
- [ ] Mobile Safari (iOS)

---

## Performance Testing

Quick performance checks:

1. **Page Load Times**
   - Messages page should load < 2 seconds
   - Payments page should load < 2 seconds

2. **API Response Times**
   - Message fetch < 500ms
   - Payment history fetch < 1 second

3. **Smooth Interactions**
   - Message sending feels instant
   - Category selection has no lag
   - No janky scrolling

---

## Error Handling Testing

Test error scenarios:

1. **Messages Page**
   - Disconnect internet → Send message → Error message displays
   - Invalid conversation ID → Graceful error handling

2. **Payments Page**
   - API returns error → Error message displays
   - No payment data → Empty state shows

3. **Network Issues**
   - Offline mode → Appropriate messages
   - Slow connection → Loading states show

---

## Accessibility Testing

Quick accessibility checks:

1. **Keyboard Navigation**
   - Tab through messages page
   - Can send message with Enter key
   - Can navigate payments tabs with keyboard

2. **Screen Reader**
   - Messages page announces content
   - Payment amounts read correctly
   - Button labels are descriptive

3. **Color Contrast**
   - Status badges readable
   - Text contrast meets WCAG standards

---

## Mobile Responsive Testing

Test on mobile viewport (375px width):

1. **Messages Page**
   - Conversation list stacks properly
   - Message thread readable
   - Input box accessible
   - Send button touchable

2. **Payments Page**
   - Stats cards stack vertically
   - Tables scroll horizontally
   - Tabs work on mobile
   - Buttons large enough to tap

3. **Category Selection**
   - Cards display in grid
   - Cards touchable and responsive
   - Scroll works smoothly

---

## Test Results Template

```
# Test Results - Bug Fixes Implementation
Date: ___________
Tester: ___________
Environment: http://localhost:3001

## Bug #1 - JavaScript Error Fix
Status: [ ] PASS [ ] FAIL
Notes: ___________________________________________

## Bug #2 - Messages Page
Status: [ ] PASS [ ] FAIL
Notes: ___________________________________________

## Bug #3 - Payments Page
Status: [ ] PASS [ ] FAIL
Notes: ___________________________________________

## Bug #4 - Category Selection
Status: [ ] PASS [ ] FAIL
Notes: ___________________________________________

## Regression Tests
Status: [ ] PASS [ ] FAIL
Notes: ___________________________________________

## Overall Assessment
[ ] Ready for Production
[ ] Minor Issues - Can Deploy
[ ] Major Issues - Do Not Deploy

Critical Issues Found: ___________________________________________
```

---

## Contact for Issues

If you encounter any bugs during testing:

1. Check browser console for errors
2. Note the exact steps to reproduce
3. Capture screenshots/video if possible
4. Document expected vs actual behavior
5. Report with all details

---

**Last Updated:** 2025-12-25
**Next Review:** After UAT completion
