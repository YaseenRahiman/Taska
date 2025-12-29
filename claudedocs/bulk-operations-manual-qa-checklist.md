# Bulk Operations Module - Manual QA Testing Checklist

**Tester Instructions**: Use this checklist to manually verify all functionality before production deployment. Check each box as you test.

---

## Pre-Testing Setup

### Environment Verification
- [ ] Backend server running on http://localhost:4000
- [ ] Frontend server running on http://localhost:3000
- [ ] Database seeded with test data
- [ ] Admin user logged in
- [ ] Browser DevTools console open (check for errors)
- [ ] Network tab open (monitor API calls)

### Test Data Requirements
- [ ] At least 50 test users in database
- [ ] At least 20 pending jobs
- [ ] At least 15 flagged reviews
- [ ] At least 10 reported comments
- [ ] At least 5 email templates configured
- [ ] Test CSV files prepared (valid and invalid)

---

## 1. Page Load and Navigation Testing

### 1.1 Initial Page Load
- [ ] Navigate to `/admin/bulk-operations`
- [ ] Page loads without errors
- [ ] Default tab is "User Actions"
- [ ] Breadcrumb shows "Admin / Bulk Operations"
- [ ] Page title displays "Bulk Operations"
- [ ] No console errors in browser
- [ ] All icons render correctly

### 1.2 Desktop Tab Navigation
- [ ] 5 tabs visible horizontally
- [ ] Each tab shows icon + label
- [ ] Active tab has blue underline
- [ ] Hover over inactive tab shows gray underline
- [ ] Click "Email Campaigns" → tab switches
- [ ] Click "Content Moderation" → tab switches
- [ ] Click "Import/Export" → tab switches
- [ ] Click "Operation History" → tab switches
- [ ] Click "User Actions" → returns to first tab
- [ ] URL updates with `?tab=email` when tab changes
- [ ] Refresh page → maintains active tab from URL

### 1.3 Mobile Tab Navigation (Resize to 375px)
- [ ] Horizontal tabs hidden
- [ ] Dropdown button visible
- [ ] Dropdown shows active tab (icon + label)
- [ ] Click dropdown → menu expands
- [ ] All 5 tabs listed with descriptions
- [ ] Active tab highlighted in blue
- [ ] Click different tab → menu closes and tab switches
- [ ] Touch targets ≥44px (easy to tap)

### 1.4 Keyboard Navigation
- [ ] Press Alt+1 → switches to User Actions
- [ ] Press Alt+2 → switches to Email Campaigns
- [ ] Press Alt+3 → switches to Content Moderation
- [ ] Press Alt+4 → switches to Import/Export
- [ ] Press Alt+5 → switches to Operation History
- [ ] Tab to focus on tab button → visible focus ring
- [ ] Press Arrow Right → next tab activates
- [ ] Press Arrow Left → previous tab activates
- [ ] Arrow keys wrap around (last → first, first → last)

---

## 2. User Actions Tab Testing

### 2.1 User Selection
- [ ] UserSelectionTable loads with users
- [ ] Table shows: Name, Email, Role, Status, Created Date
- [ ] "Select All" checkbox in header
- [ ] Individual checkboxes for each user
- [ ] Click "Select All" → all users selected
- [ ] Click "Select All" again → all users deselected
- [ ] Select 3 individual users → count shows "3 selected"
- [ ] Search box filters users by name/email

### 2.2 Ban Users Flow
- [ ] Select 2 users
- [ ] "Ban Users" button enabled
- [ ] Click "Ban Users" → modal opens
- [ ] Modal title: "Ban Users"
- [ ] Reason textarea visible (required field)
- [ ] Character counter shows 0/500
- [ ] Click "Submit" without reason → validation error "Reason is required"
- [ ] Type reason (20 characters)
- [ ] Character counter updates to 20/500
- [ ] Click "Submit" → modal closes
- [ ] Toast notification: "2 users banned successfully"
- [ ] Network tab: POST to `/admin/users/bulk/ban`
- [ ] Request payload includes userIds and reason
- [ ] User selection clears after action
- [ ] Table refreshes to show updated status

### 2.3 Suspend Users Flow
- [ ] Select 1 user
- [ ] "Suspend Users" button enabled
- [ ] Click "Suspend Users" → modal opens
- [ ] Modal shows: Reason textarea + End date picker
- [ ] Click "Submit" without reason → error "Reason is required"
- [ ] Enter reason, no end date → error "End date is required"
- [ ] Enter reason + select yesterday's date → error "End date must be in the future"
- [ ] Enter reason + select tomorrow's date → valid
- [ ] Click "Submit" → modal closes
- [ ] Toast: "1 user suspended successfully"
- [ ] Network: POST to `/admin/users/bulk/suspend`
- [ ] Payload includes userIds, reason, endDate

### 2.4 Verify Users Flow
- [ ] Select 3 users
- [ ] "Verify Users" button enabled
- [ ] Click "Verify Users" → confirmation modal opens
- [ ] Modal: "Are you sure you want to verify 3 users?"
- [ ] Click "Cancel" → modal closes, no action
- [ ] Click "Verify Users" again
- [ ] Click "Confirm" → modal closes
- [ ] Toast: "3 users verified successfully"
- [ ] Network: POST to `/admin/users/bulk/verify`
- [ ] Selection clears

### 2.5 Delete Users Flow
- [ ] Select 2 users
- [ ] "Delete Users" button enabled (red color)
- [ ] Click "Delete Users" → warning modal opens
- [ ] Modal shows warning icon and message about permanence
- [ ] Click "Cancel" → modal closes, no action
- [ ] Click "Delete Users" again
- [ ] Click "Confirm Delete" → modal closes
- [ ] Toast: "2 users deleted successfully"
- [ ] Network: POST to `/admin/users/bulk/delete`
- [ ] Users removed from table

### 2.6 Error Handling
- [ ] Disconnect internet
- [ ] Try to ban user → toast "No internet connection"
- [ ] Reconnect internet
- [ ] Mock 500 server error
- [ ] Try to ban user → toast "Server error. Please contact support."
- [ ] Mock 403 forbidden error
- [ ] Try to ban user → toast "You don't have permission for this action."

---

## 3. Email Campaigns Tab Testing

### 3.1 Recipient Selection
- [ ] "All Users" radio button selected by default
- [ ] "Specific Users" radio button available
- [ ] UserSelectionTable hidden when "All Users" selected
- [ ] Click "Specific Users" → UserSelectionTable appears
- [ ] Select 5 users → recipient count shows "5 recipients"
- [ ] Click "All Users" → count shows total users (e.g., "150 recipients")

### 3.2 Email Template Selection
- [ ] Template dropdown shows "Select Template" placeholder
- [ ] Click dropdown → 5 templates listed:
  - [ ] Welcome Email
  - [ ] Account Verification
  - [ ] Password Reset
  - [ ] Promotional Campaign
  - [ ] System Announcement
- [ ] Select "Welcome Email" → subject and body populate
- [ ] Subject: "Welcome to Taska!"
- [ ] Body: Pre-filled welcome message
- [ ] Template variables visible: {{userName}}, {{email}}

### 3.3 Email Composition
- [ ] Subject field max 100 characters
- [ ] Character counter: "0/100"
- [ ] Type 50 characters → counter: "50/100"
- [ ] Type 101 characters → validation error "Subject must be under 100 characters"
- [ ] Delete to 100 characters → error clears
- [ ] Body field max 2000 characters
- [ ] Character counter: "0/2000"
- [ ] Type 1500 characters → counter: "1500/2000"
- [ ] Type 2001 characters → validation error "Body must be under 2000 characters"

### 3.4 Email Preview
- [ ] Click "Preview Email" → modal opens
- [ ] Modal shows subject at top
- [ ] Body rendered with formatting
- [ ] Template variables replaced with sample data
- [ ] {{userName}} → "John Doe"
- [ ] {{email}} → "john@example.com"
- [ ] Click "Close" → modal closes

### 3.5 Schedule Email
- [ ] "Send Immediately" checkbox checked by default
- [ ] Uncheck "Send Immediately" → date picker appears
- [ ] Select yesterday → error "Schedule date must be in the future"
- [ ] Select tomorrow 10:00 AM → valid
- [ ] Re-check "Send Immediately" → date picker hides

### 3.6 Send Email Flow
- [ ] Leave subject empty → "Send Email" button disabled
- [ ] Enter subject
- [ ] Leave body empty → button disabled
- [ ] Enter body
- [ ] Select "All Users"
- [ ] Click "Send Email" → confirmation modal
- [ ] Modal: "Send email to 150 users?"
- [ ] Click "Cancel" → modal closes
- [ ] Click "Send Email" again
- [ ] Click "Confirm" → modal closes
- [ ] Loading spinner on button
- [ ] Toast: "Email sent to 150 users"
- [ ] Network: POST to `/admin/emails/bulk/send`
- [ ] Payload: recipients, subject, body, scheduleDate
- [ ] Form resets after send

### 3.7 Error Scenarios
- [ ] Try to send with no recipients selected (Specific mode) → error "Please select at least one recipient"
- [ ] Try to send with no template and empty fields → validation errors
- [ ] Mock API error → toast "Failed to send email. Please try again."

---

## 4. Content Moderation Tab Testing

### 4.1 Jobs Sub-Tab
- [ ] "Jobs" tab active by default
- [ ] Table loads pending jobs
- [ ] Columns: Title, Client, Category, Status, Created Date
- [ ] Select All checkbox in header
- [ ] Select 5 jobs
- [ ] Action buttons enabled: Approve, Reject

#### Approve Jobs
- [ ] Click "Approve Jobs" → confirmation modal
- [ ] Modal: "Approve 5 jobs?"
- [ ] Click "Confirm" → modal closes
- [ ] Toast: "5 jobs approved successfully"
- [ ] Network: POST to `/admin/jobs/bulk/approve`
- [ ] Jobs removed from pending list

#### Reject Jobs
- [ ] Select 3 jobs
- [ ] Click "Reject Jobs" → reason modal opens
- [ ] Click "Submit" without reason → error "Reason is required"
- [ ] Enter reason: "Violates guidelines"
- [ ] Click "Submit" → modal closes
- [ ] Toast: "3 jobs rejected successfully"
- [ ] Network: POST to `/admin/jobs/bulk/reject`
- [ ] Payload includes jobIds and reason

### 4.2 Reviews Sub-Tab
- [ ] Click "Reviews" tab
- [ ] Table loads flagged reviews
- [ ] Columns: Review Text, Rating, Reviewer, Job, Created Date
- [ ] Select 4 reviews
- [ ] Action buttons: Hide, Delete

#### Hide Reviews
- [ ] Click "Hide Reviews" → reason modal
- [ ] Enter reason: "Inappropriate content"
- [ ] Click "Submit" → modal closes
- [ ] Toast: "4 reviews hidden successfully"
- [ ] Network: POST to `/admin/reviews/bulk/hide`

#### Delete Reviews
- [ ] Select 2 reviews
- [ ] Click "Delete Reviews" → warning modal
- [ ] Modal shows warning about permanent deletion
- [ ] Click "Confirm" → modal closes
- [ ] Toast: "2 reviews deleted successfully"
- [ ] Network: POST to `/admin/reviews/bulk/delete`

### 4.3 Comments Sub-Tab
- [ ] Click "Comments" tab
- [ ] Table loads reported comments
- [ ] Columns: Comment Text, Author, Job, Flagged Reason, Created Date
- [ ] Select 3 comments
- [ ] Action buttons: Hide, Delete

#### Hide Comments
- [ ] Click "Hide Comments" → reason modal
- [ ] Enter reason: "Spam"
- [ ] Submit → toast "3 comments hidden successfully"

#### Delete Comments
- [ ] Select 1 comment
- [ ] Click "Delete Comments" → warning modal
- [ ] Confirm → toast "1 comment deleted successfully"
- [ ] Network: POST to `/admin/comments/bulk/delete`

### 4.4 Empty States
- [ ] Approve all pending jobs → "No pending jobs to moderate."
- [ ] Hide all flagged reviews → "No flagged reviews found."
- [ ] Delete all reported comments → "No reported comments."

---

## 5. Import/Export Tab Testing

### 5.1 Export Section

#### Export Users
- [ ] Entity type dropdown shows "Users" by default
- [ ] Format selector: CSV, Excel
- [ ] Select "Users" entity
- [ ] Filter builder shows user-specific filters:
  - [ ] Status: Active, Inactive, Banned, Suspended
  - [ ] Role: Client, Artisan, Admin
  - [ ] Created Date: Date range picker
- [ ] Select Status: "Active"
- [ ] Select Role: "Client"
- [ ] Column selector shows all user columns
- [ ] Select columns: Name, Email, Role, Created Date
- [ ] Click "Export" → loading spinner on button
- [ ] File downloads: `users_export_2025-11-08.csv`
- [ ] Network: POST to `/admin/export/users`
- [ ] Payload includes entity, filters, columns, format

#### Export Jobs
- [ ] Select "Jobs" entity
- [ ] Filters update to job-specific: Status, Category, Date
- [ ] Select filters
- [ ] Choose columns
- [ ] Export → downloads `jobs_export_2025-11-08.csv`

#### Export Reviews
- [ ] Select "Reviews" entity
- [ ] Apply filters (Rating, Date)
- [ ] Export → downloads `reviews_export_2025-11-08.csv`

### 5.2 Import Section

#### File Upload Validation
- [ ] Drag & drop zone visible
- [ ] Drag a .xlsx file → error "Only CSV files are supported"
- [ ] Drag a 15MB CSV → error "File size must be under 10MB"
- [ ] Drag a valid 5MB CSV → file accepted
- [ ] Click "Choose file" button → file picker opens
- [ ] Select CSV file → file accepted

#### CSV Preview and Mapping
- [ ] Upload valid CSV with 100 rows
- [ ] Preview table shows first 10 rows
- [ ] CSV columns detected: name, email, role, status
- [ ] Column mapping interface shows
- [ ] Map CSV "name" → System "name" (auto-detected)
- [ ] Map CSV "email" → System "email_address"
- [ ] Map CSV "role" → System "role"
- [ ] Unmapped columns highlighted in yellow

#### Data Validation
- [ ] Upload CSV with invalid emails
- [ ] Validation runs automatically
- [ ] Error summary shows: "5 errors found"
- [ ] Expand error details → shows row numbers and issues:
  - [ ] Row 3: Invalid email format "notanemail"
  - [ ] Row 7: Missing required field "name"
  - [ ] Row 12: Invalid role "SuperUser"
- [ ] Fix errors in CSV file
- [ ] Re-upload → validation passes "All rows valid"

#### Import Flow
- [ ] Upload valid CSV (50 users)
- [ ] Validation passes
- [ ] Click "Import Users" → confirmation modal
- [ ] Modal: "Import 50 users?"
- [ ] Click "Confirm" → modal closes
- [ ] Progress bar appears: "Processing... 25/50 (50%)"
- [ ] Progress updates in real-time
- [ ] Completion: "45 users imported, 5 skipped (duplicates)"
- [ ] Toast: "Import completed successfully"
- [ ] Network: POST to `/admin/import/users`
- [ ] File input clears after import

#### Import Error Scenarios
- [ ] Upload empty CSV → error "CSV file is empty"
- [ ] Upload CSV with no headers → error "Invalid CSV format"
- [ ] Upload CSV with only 1 column → error "Insufficient columns"
- [ ] Try to import without mapping required columns → error "Please map all required columns"

---

## 6. Operation History Tab Testing

### 6.1 Operations Table
- [ ] Table loads with recent operations
- [ ] Columns: Type, Status, Progress, Started, Completed, Actions
- [ ] Shows 10 operations per page
- [ ] Each row shows:
  - [ ] Type badge (Email, Ban, Export, etc.)
  - [ ] Status badge (Pending, Running, Completed, Failed)
  - [ ] Progress bar (if running)
  - [ ] Start timestamp
  - [ ] Completion timestamp (if completed)
  - [ ] View Details + Delete buttons

### 6.2 Filters
- [ ] Type filter dropdown shows all operation types:
  - [ ] Email
  - [ ] Ban
  - [ ] Suspend
  - [ ] Verify
  - [ ] Delete
  - [ ] Export
  - [ ] Import
- [ ] Select "Email" → table filters to email operations only
- [ ] Status filter shows: All, Pending, Running, Completed, Failed
- [ ] Select "Failed" → shows only failed operations
- [ ] Date range picker allows custom range
- [ ] Select "Last 7 days" → filters operations
- [ ] Apply multiple filters → all filters applied (AND logic)
- [ ] Click "Clear Filters" → resets to show all

### 6.3 Pagination
- [ ] Pagination controls at bottom
- [ ] Shows "Showing 1-10 of 47 operations"
- [ ] "Previous" button disabled on page 1
- [ ] Click "Next" → page 2 loads (operations 11-20)
- [ ] "Previous" button enabled
- [ ] Click "Last" → jumps to last page
- [ ] Click "First" → returns to page 1
- [ ] Page numbers clickable
- [ ] Click page 3 → loads page 3

### 6.4 View Details Modal
- [ ] Click "View Details" on completed operation → OperationProgress modal opens
- [ ] Modal shows:
  - [ ] Operation type and ID
  - [ ] Status badge
  - [ ] Progress bar (100% if completed)
  - [ ] Stats: Total items, Processed, Succeeded, Failed
  - [ ] Operation logs (timestamped)
  - [ ] Error details (if failed)
- [ ] Click "Close" → modal closes
- [ ] Click "View Details" on running operation → real-time progress updates
- [ ] Progress bar animates
- [ ] Logs append as operation progresses

### 6.5 Delete Operation
- [ ] Click "Delete" on operation → confirmation modal
- [ ] Modal: "Delete this operation?"
- [ ] Warning: "This will remove the operation from history"
- [ ] Click "Cancel" → modal closes, no action
- [ ] Click "Delete" again → click "Confirm"
- [ ] Modal closes
- [ ] Toast: "Operation deleted successfully"
- [ ] Network: DELETE to `/admin/operations/{id}`
- [ ] Operation removed from table
- [ ] Pagination updates if needed

### 6.6 Real-Time Updates
- [ ] Start a bulk email operation in another tab
- [ ] Return to Operation History tab
- [ ] New operation appears at top of table
- [ ] Status updates from "Pending" → "Running" → "Completed"
- [ ] Progress bar updates in real-time
- [ ] Refresh not required to see updates (WebSocket or polling)

---

## 7. Responsive Design Testing

### 7.1 Desktop (1920px)
- [ ] All tabs visible horizontally
- [ ] Tables show all columns
- [ ] Modals centered and properly sized
- [ ] No horizontal scrolling
- [ ] Text readable
- [ ] Buttons and inputs appropriately sized

### 7.2 Tablet (768px)
- [ ] Tabs remain horizontal (slightly compressed)
- [ ] Tables scroll horizontally if needed
- [ ] Modals adjust to smaller width
- [ ] Forms stack if needed
- [ ] Touch targets ≥44px
- [ ] Text remains readable

### 7.3 Mobile (375px)
- [ ] Tabs switch to dropdown menu
- [ ] Tables show essential columns only
- [ ] Horizontal scroll for extra columns
- [ ] Modals full-screen or adapt to small width
- [ ] Forms stack vertically
- [ ] Buttons full-width or centered
- [ ] Text size appropriate
- [ ] All features accessible

### 7.4 Responsive Breakpoints
- [ ] Test at 320px (small phone) → works
- [ ] Test at 375px (iPhone SE) → works
- [ ] Test at 414px (iPhone Plus) → works
- [ ] Test at 768px (iPad portrait) → works
- [ ] Test at 1024px (iPad landscape) → works
- [ ] Test at 1366px (laptop) → works
- [ ] Test at 1920px (desktop) → works

---

## 8. Accessibility Testing

### 8.1 Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Focus order logical (top to bottom, left to right)
- [ ] All buttons reachable with Tab
- [ ] All form fields reachable with Tab
- [ ] Shift+Tab reverses focus
- [ ] Enter key activates buttons
- [ ] Escape key closes modals
- [ ] Space bar toggles checkboxes

### 8.2 Focus Indicators
- [ ] All focused elements show visible ring
- [ ] Ring color: blue (#2563EB)
- [ ] Ring width: 2px
- [ ] Ring offset visible
- [ ] No elements without focus indicator

### 8.3 ARIA Labels
- [ ] Inspect tab navigation: role="tablist"
- [ ] Each tab: role="tab", aria-selected="true/false"
- [ ] Tab panels: role="tabpanel"
- [ ] Modals: aria-modal="true", role="dialog"
- [ ] Form fields: aria-label or associated label
- [ ] Buttons: aria-label where text insufficient
- [ ] Status messages: aria-live="polite"

### 8.4 Screen Reader Testing (Optional)
- [ ] Enable screen reader (NVDA, JAWS, or VoiceOver)
- [ ] Navigate page → announces structure
- [ ] Switch tabs → announces tab change
- [ ] Open modal → announces modal and content
- [ ] Fill form → announces field labels
- [ ] Submit form → announces result
- [ ] Error occurs → announces error message

### 8.5 Color Contrast
- [ ] Text on white background: high contrast
- [ ] Links: blue (#2563EB) → readable
- [ ] Disabled buttons: gray but still visible
- [ ] Error messages: red (#DC2626) → clear
- [ ] Success messages: green (#16A34A) → clear
- [ ] Use contrast checker tool → all pass WCAG AA

---

## 9. Performance Testing

### 9.1 Load Times
- [ ] Open DevTools Performance tab
- [ ] Navigate to `/admin/bulk-operations`
- [ ] Record load time → should be < 2 seconds
- [ ] First Contentful Paint < 1 second
- [ ] Largest Contentful Paint < 2 seconds
- [ ] Time to Interactive < 3 seconds

### 9.2 Tab Switching Performance
- [ ] Record Performance profile
- [ ] Switch between all 5 tabs rapidly
- [ ] Each tab switch < 100ms
- [ ] No lag or stuttering
- [ ] Smooth transitions

### 9.3 Large Data Sets
- [ ] Load table with 100 users → smooth scrolling
- [ ] Load table with 500 operations → pagination helps
- [ ] Select 50 users → no performance drop
- [ ] Export 1000 rows → completes without hanging

### 9.4 Memory Leaks
- [ ] Open DevTools Memory tab
- [ ] Take heap snapshot
- [ ] Navigate through all tabs 10 times
- [ ] Take another heap snapshot
- [ ] Compare → memory should not grow significantly
- [ ] Close modals → memory released
- [ ] No detached DOM nodes

---

## 10. Browser Compatibility Testing

### 10.1 Chrome (latest)
- [ ] Page loads correctly
- [ ] All features work
- [ ] No console errors
- [ ] Styling correct
- [ ] Animations smooth

### 10.2 Firefox (latest)
- [ ] Page loads correctly
- [ ] All features work
- [ ] No console errors
- [ ] Styling correct
- [ ] Animations smooth

### 10.3 Safari (latest)
- [ ] Page loads correctly
- [ ] All features work
- [ ] No console errors
- [ ] Styling correct (Tailwind CSS compatibility)
- [ ] Date pickers work

### 10.4 Edge (latest)
- [ ] Page loads correctly
- [ ] All features work
- [ ] No console errors
- [ ] Styling correct

---

## 11. Security Testing

### 11.1 Input Sanitization
- [ ] Enter `<script>alert('XSS')</script>` in email body → HTML escaped
- [ ] Enter SQL injection in search → no effect
- [ ] Enter special characters in all fields → handled gracefully

### 11.2 Authorization
- [ ] Log out → redirect to login
- [ ] Try to access `/admin/bulk-operations` while logged out → redirect
- [ ] Log in as non-admin user → no access to bulk operations
- [ ] Log in as admin → full access

### 11.3 File Upload Security
- [ ] Upload .exe file renamed to .csv → rejected
- [ ] Upload CSV with malicious code → sanitized
- [ ] Upload very large file (50MB) → rejected

---

## 12. Error Handling Testing

### 12.1 Network Errors
- [ ] Disconnect internet → all API calls show error toast
- [ ] Slow 3G network → loading spinners visible
- [ ] Timeout (30s+) → timeout error shown

### 12.2 API Errors
- [ ] 400 Bad Request → error toast with message
- [ ] 401 Unauthorized → redirect to login
- [ ] 403 Forbidden → permission error toast
- [ ] 404 Not Found → not found error
- [ ] 500 Internal Server Error → server error toast

### 12.3 Validation Errors
- [ ] All required fields enforced
- [ ] Character limits enforced
- [ ] Date validations work
- [ ] Email format validated
- [ ] File type/size validated

---

## 13. User Experience Testing

### 13.1 Toast Notifications
- [ ] All success actions show green toast
- [ ] All errors show red toast
- [ ] Toasts auto-dismiss after 5 seconds
- [ ] Toasts can be manually dismissed
- [ ] Multiple toasts stack vertically
- [ ] Toast text clear and helpful

### 13.2 Loading States
- [ ] Buttons show spinner during API calls
- [ ] Buttons disabled during processing
- [ ] Tables show skeleton loaders
- [ ] Progress bars animate smoothly
- [ ] Loading text descriptive: "Processing..."

### 13.3 Confirmation Dialogs
- [ ] Destructive actions require confirmation
- [ ] Confirmation messages clear
- [ ] Cancel button always available
- [ ] Confirm button uses action verb (e.g., "Delete", not "OK")

---

## 14. Edge Cases and Stress Testing

### 14.1 Extreme Data
- [ ] Select 1000 users → performance acceptable
- [ ] Export 10,000 rows → completes successfully
- [ ] Import CSV with 5,000 rows → processes without crashing

### 14.2 Unusual Inputs
- [ ] Paste emoji in text fields → handled correctly
- [ ] Paste very long text (10,000 chars) → truncated or rejected
- [ ] Enter unicode characters → displayed correctly
- [ ] Enter RTL text (Arabic) → displays properly

### 14.3 Concurrent Operations
- [ ] Start email campaign
- [ ] Immediately start CSV export
- [ ] Both complete successfully
- [ ] No race conditions

### 14.4 Empty States
- [ ] No users in database → "No users found"
- [ ] No pending jobs → "No pending jobs to moderate"
- [ ] No operations → "No operations found"
- [ ] Empty states have helpful messaging

---

## 15. Final Verification

### 15.1 Console Errors
- [ ] Open browser console
- [ ] Navigate through all features
- [ ] **Zero console errors**
- [ ] **Zero console warnings** (or only acceptable warnings)

### 15.2 Network Requests
- [ ] Open Network tab
- [ ] Verify all API calls use correct endpoints
- [ ] Verify request payloads correct
- [ ] Verify response status codes (200, 201, etc.)
- [ ] No failed requests (red in Network tab)

### 15.3 Visual Inspection
- [ ] No UI glitches or layout breaks
- [ ] Text readable on all backgrounds
- [ ] Images/icons load correctly
- [ ] Colors consistent with design system
- [ ] Spacing and alignment correct

### 15.4 Production Build
- [ ] Run `npm run build`
- [ ] Build completes without errors
- [ ] Serve production build
- [ ] All features work in production mode
- [ ] Performance equal or better than dev

---

## Sign-Off

### Testing Summary
- **Total Test Cases**: 400+
- **Test Cases Passed**: ___/___
- **Test Cases Failed**: ___
- **Bugs Found**: ___
- **Critical Bugs**: ___
- **Medium Bugs**: ___
- **Minor Bugs**: ___

### Tester Sign-Off
- **Tester Name**: _________________
- **Date**: _________________
- **Signature**: _________________
- **Status**: [ ] APPROVED [ ] REJECTED

### Notes and Observations
```
[Space for tester notes]




```

### Bugs Found During Testing
```
Bug #1: [Description]
Severity: [ ] Critical [ ] Medium [ ] Minor
Steps to Reproduce:
Expected:
Actual:
Status: [ ] Fixed [ ] Pending

Bug #2: [Description]
...
```

---

**End of Manual QA Checklist**
