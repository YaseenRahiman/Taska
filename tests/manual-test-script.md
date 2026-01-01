# Manual Testing Script for UX Fixes

## Prerequisites
- Frontend running on: http://localhost:3001
- Backend running on: http://localhost:3000
- Test credentials: Grahiman02@gmail.com / R4h1m@n!Y2025

## Test Flow

### 1. Login
1. Navigate to http://localhost:3001/auth/login
2. Enter email: Grahiman02@gmail.com
3. Enter password: R4h1m@n!Y2025
4. Click "Sign In"
5. **Expected**: Redirect to http://localhost:3001/client/dashboard

### 2. Dashboard Button Text
1. On dashboard, locate "Post a new job" button in the turquoise banner
2. **Expected**: Button text should be BLACK and clearly readable
3. **Before**: Text was white/turquoise (hard to read)
4. **After**: Text is black with semi-bold weight

### 3. Category Selection Feedback
1. Click "Post a new job" button
2. Modal appears showing Step 1 of 4
3. Fill in title: "Need plumbing repair"
4. Fill in description: "I have a leaky faucet that needs fixing urgently"
5. **BEFORE clicking category**: All category boxes look the same (gray border)
6. Click on "Plumbing" category
7. **Expected**:
   - Turquoise border appears around selected category
   - Turquoise background color (light)
   - Checkmark icon in top-right corner
   - Subtle shadow effect
   - Text color becomes darker
8. Try clicking another category - previous selection should lose highlight
9. Click back to "Plumbing" - highlight should return

### 4. Continue Button Text
1. With category selected, locate "Continue" button at bottom
2. **Expected**: Button text should be BLACK and clearly readable
3. **Before**: Text was white (hard to read on turquoise button)
4. **After**: Text is black with semi-bold weight
5. Click "Continue"

### 5. Urgency Selection Feedback
1. Now on Step 2 of 4
2. Fill in budget: 1500
3. **BEFORE clicking urgency**: All urgency boxes look the same (gray border)
4. Click on "Urgent" (or any urgency option)
5. **Expected**:
   - Turquoise border appears around selected urgency
   - Turquoise background color (light)
   - Checkmark icon in top-right corner
   - Subtle shadow effect
   - Label text becomes darker
6. Try clicking different urgency - previous selection should lose highlight
7. Click "Continue"

### 6. Location Step
1. Now on Step 3 of 4
2. Fill in:
   - Address: "15 Long Street"
   - City: "Cape Town"
   - Postal Code: "8001"
   - Province: "Western Cape"
3. Click "Continue"

### 7. Authentication Test (CRITICAL)
1. Now on Step 4 of 4 - "Add Photos (Optional)"
2. **Expected**: Step loads without errors
3. **Before Fix**: Error appeared: "Access denied: User not authenticated"
4. **After Fix**: No error, can see image upload area
5. **Verify**:
   - No red error banner
   - Can see "Add Photos" heading
   - Can see upload dropzone
   - Can see "Post Job" button

### 8. Complete Job Posting
1. Optional: Upload a test image (or skip)
2. Click "Post Job" button
3. **Expected**:
   - Job is created successfully
   - Modal closes
   - Dashboard refreshes
   - New job appears in job list
4. **Before Fix**: Would fail on step 4 with auth error
5. **After Fix**: Completes successfully

## Checklist

- [ ] Dashboard "Post a new job" button has black text
- [ ] Category selection shows checkmark when clicked
- [ ] Category selection shows turquoise border when selected
- [ ] Category selection shows turquoise background when selected
- [ ] Category selection shows shadow when selected
- [ ] "Continue" button has black text
- [ ] Urgency selection shows checkmark when clicked
- [ ] Urgency selection shows turquoise border when selected
- [ ] Urgency selection shows turquoise background when selected
- [ ] Urgency selection shows shadow when selected
- [ ] Step 4 loads without authentication error
- [ ] Job posting completes end-to-end successfully

## Screenshots to Capture

1. `dashboard-button-fixed.png` - Dashboard with readable button text
2. `category-before-selection.png` - Categories before any selection
3. `category-after-selection.png` - Category with checkmark and turquoise styling
4. `continue-button-fixed.png` - Continue button with black text
5. `urgency-before-selection.png` - Urgency options before selection
6. `urgency-after-selection.png` - Urgency with checkmark and turquoise styling
7. `step4-no-auth-error.png` - Step 4 loading without errors
8. `job-posted-success.png` - Successfully posted job on dashboard

## Visual Verification

### Selected State Should Have:
- **Border**: 2px solid turquoise (#12806B - primary-600)
- **Background**: Light turquoise (#E8F6F3 - primary-50)
- **Ring**: 2px turquoise glow (#A3DBCF - primary-200)
- **Shadow**: Medium shadow (visible drop shadow)
- **Checkmark**: Turquoise checkmark icon in top-right corner
- **Text**: Darker color (primary-900 for selected vs gray-900 for unselected)

### Unselected State Should Have:
- **Border**: 2px solid gray (#E5E7EB - gray-200)
- **Background**: Transparent or white
- **No ring**: No glow effect
- **No shadow**: Flat appearance
- **No checkmark**: No icon visible
- **Text**: Standard gray-900 color

### Hover State (Unselected) Should Have:
- **Border**: Light turquoise (#75C9B7 - primary-300)
- **Background**: Very light gray (#F9FAFB - gray-50)

## Pass/Fail Criteria

### PASS if:
- All button text is clearly readable (black on light backgrounds)
- Category selection is visually obvious (checkmark + colors + shadow)
- Urgency selection is visually obvious (checkmark + colors + shadow)
- No authentication error appears on any step
- Job posting completes successfully end-to-end

### FAIL if:
- Any button text is white/light on light background
- Category selection has no visual feedback
- Urgency selection has no visual feedback
- Authentication error appears on step 4
- Job posting fails to complete

## Notes

- Primary color is turquoise: #16A085
- All turquoise classes have been replaced with primary-* classes
- Auth fix ensures user state is loaded on app initialization
- Visual feedback follows consistent pattern across all selection UI
