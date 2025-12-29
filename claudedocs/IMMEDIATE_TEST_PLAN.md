# Taska Android - Immediate Test Plan

**Purpose**: Verify the navigation crash fix and validate core authentication flow
**Duration**: 30-60 minutes
**Prerequisites**: Backend API running, test credentials available

---

## Test Credentials
```
Email: Grahiman02@gmail.com
Password: Qwerty12345!@
Expected Role: Artisan
```

---

## Critical Path Test Cases

### Test 1: Cold Start → Login → Home Navigation
**ID**: TC-CRITICAL-001
**Priority**: HIGHEST
**Status**: Ready to Execute

**Steps**:
1. Clean install the application (uninstall previous version)
2. Launch the application
3. Observe splash screen appears
4. Wait for navigation to login screen
5. Enter test credentials:
   - Email: `Grahiman02@gmail.com`
   - Password: `Qwerty12345!@`
6. Tap "Login" button
7. Observe loading indicator
8. Wait for authentication to complete

**Expected Results**:
- ✅ Splash screen displays briefly
- ✅ Login screen appears with email/password fields
- ✅ Login button shows loading state when tapped
- ✅ **Navigation to Artisan Home screen succeeds (NO CRASH)**
- ✅ Home screen displays welcome message and quick actions

**Actual Results**:
- [ ] Pass
- [ ] Fail (Describe):

**Notes**:

---

### Test 2: Home Screen Navigation - Browse Jobs
**ID**: TC-CRITICAL-002
**Priority**: HIGH
**Prerequisites**: User authenticated and on Home screen

**Steps**:
1. On Artisan Home screen
2. Tap "Browse Jobs" quick action card
3. Observe navigation

**Expected Results**:
- ✅ Jobs screen appears
- ✅ Top bar shows "Browse Jobs" title
- ✅ Back button present in top bar
- ✅ Placeholder message "Jobs screen - Coming soon" visible

**Actual Results**:
- [ ] Pass
- [ ] Fail (Describe):

**Notes**:

---

### Test 3: Home Screen Navigation - My Bids
**ID**: TC-CRITICAL-003
**Priority**: HIGH
**Prerequisites**: User authenticated and on Home screen

**Steps**:
1. Return to Home screen (if not already there)
2. Tap "My Bids" quick action card
3. Observe navigation

**Expected Results**:
- ✅ Bids screen appears
- ✅ Top bar shows "My Bids" title
- ✅ Back button present in top bar
- ✅ Placeholder message visible

**Actual Results**:
- [ ] Pass
- [ ] Fail (Describe):

**Notes**:

---

### Test 4: Home Screen Navigation - My Profile
**ID**: TC-CRITICAL-004
**Priority**: HIGH
**Prerequisites**: User authenticated and on Home screen

**Steps**:
1. Return to Home screen
2. Tap "My Profile" card
3. Observe navigation

**Expected Results**:
- ✅ Profile screen appears
- ✅ Top bar shows "My Profile" title
- ✅ Back button present in top bar
- ✅ Placeholder message visible

**Actual Results**:
- [ ] Pass
- [ ] Fail (Describe):

**Notes**:

---

### Test 5: Back Navigation from Jobs
**ID**: TC-CRITICAL-005
**Priority**: HIGH
**Prerequisites**: User on Jobs screen

**Steps**:
1. Navigate to Jobs screen (from Home → Browse Jobs)
2. Tap back arrow in top bar
3. Observe navigation

**Expected Results**:
- ✅ User returns to Artisan Home screen
- ✅ No crash or navigation error
- ✅ Home screen state preserved

**Actual Results**:
- [ ] Pass
- [ ] Fail (Describe):

**Notes**:

---

### Test 6: Back Navigation from Bids
**ID**: TC-CRITICAL-006
**Priority**: HIGH
**Prerequisites**: User on Bids screen

**Steps**:
1. Navigate to Bids screen (from Home → My Bids)
2. Tap back arrow in top bar
3. Observe navigation

**Expected Results**:
- ✅ User returns to Artisan Home screen
- ✅ No crash or navigation error

**Actual Results**:
- [ ] Pass
- [ ] Fail (Describe):

**Notes**:

---

### Test 7: Back Navigation from Profile
**ID**: TC-CRITICAL-007
**Priority**: HIGH
**Prerequisites**: User on Profile screen

**Steps**:
1. Navigate to Profile screen (from Home → My Profile)
2. Tap back arrow in top bar
3. Observe navigation

**Expected Results**:
- ✅ User returns to Artisan Home screen
- ✅ No crash or navigation error

**Actual Results**:
- [ ] Pass
- [ ] Fail (Describe):

**Notes**:

---

### Test 8: System Back Button Navigation
**ID**: TC-CRITICAL-008
**Priority**: MEDIUM
**Prerequisites**: User on any secondary screen (Jobs/Bids/Profile)

**Steps**:
1. Navigate to Jobs screen
2. Press Android system back button (or gesture)
3. Observe behavior

**Expected Results**:
- ✅ User returns to Home screen
- ✅ Behavior consistent with top bar back button

**Actual Results**:
- [ ] Pass
- [ ] Fail (Describe):

**Notes**:

---

### Test 9: Invalid Login Credentials
**ID**: TC-CRITICAL-009
**Priority**: HIGH
**Prerequisites**: Fresh app state, on Login screen

**Steps**:
1. Enter invalid credentials:
   - Email: `test@invalid.com`
   - Password: `wrongpassword`
2. Tap "Login" button
3. Observe behavior

**Expected Results**:
- ✅ Loading indicator appears briefly
- ✅ Error message displayed (API error or validation error)
- ✅ User remains on login screen
- ✅ No crash

**Actual Results**:
- [ ] Pass
- [ ] Fail (Describe):

**Notes**:

---

### Test 10: Token Persistence (App Restart)
**ID**: TC-CRITICAL-010
**Priority**: HIGH
**Prerequisites**: User previously logged in successfully

**Steps**:
1. Successfully login (Test 1)
2. Force close the application (swipe away from recent apps)
3. Relaunch the application
4. Observe navigation flow

**Expected Results**:
- ✅ Splash screen appears
- ✅ **App navigates directly to Home screen (bypasses login)**
- ✅ No re-authentication required
- ✅ Token persistence working

**Actual Results**:
- [ ] Pass
- [ ] Fail (Describe):

**Notes**:

---

## Additional Validation Tests

### Test 11: Email Validation
**ID**: TC-VALIDATION-001
**Priority**: MEDIUM

**Steps**:
1. On login screen, enter invalid email: `notanemail`
2. Enter valid password: `Qwerty12345!@`
3. Tap "Login"

**Expected Results**:
- ✅ Email validation error displayed
- ✅ Login prevented
- ✅ Error message: "Invalid email format"

**Actual Results**:
- [ ] Pass
- [ ] Fail (Describe):

---

### Test 12: Password Length Validation
**ID**: TC-VALIDATION-002
**Priority**: MEDIUM

**Steps**:
1. Enter valid email: `Grahiman02@gmail.com`
2. Enter short password: `abc`
3. Tap "Login"

**Expected Results**:
- ✅ Password validation error displayed
- ✅ Login prevented
- ✅ Error message mentions minimum length requirement

**Actual Results**:
- [ ] Pass
- [ ] Fail (Describe):

---

### Test 13: Empty Fields Validation
**ID**: TC-VALIDATION-003
**Priority**: MEDIUM

**Steps**:
1. Leave email field empty
2. Leave password field empty
3. Tap "Login"

**Expected Results**:
- ✅ Validation errors displayed for both fields
- ✅ Login prevented

**Actual Results**:
- [ ] Pass
- [ ] Fail (Describe):

---

## Exploratory Testing

### Session 1: General Navigation (15 minutes)
**Instructions**: Navigate freely through the app, trying different paths and sequences

**Focus Areas**:
- Navigation consistency
- Back button behavior
- Loading states
- Error handling
- UI responsiveness

**Findings**:

---

### Session 2: Stress Testing (10 minutes)
**Instructions**: Attempt to break navigation through rapid actions

**Actions to Try**:
- Rapidly tap navigation buttons
- Press back button repeatedly
- Switch between screens quickly
- Rotate device during navigation
- Put app in background during loading

**Findings**:

---

## Test Summary

### Execution Date: _____________
### Tester Name: _____________
### Build Version: _____________
### Device: _____________
### Android Version: _____________

### Results Summary
| Status | Count | Percentage |
|--------|-------|------------|
| ✅ Pass | __ / 13 | __% |
| ❌ Fail | __ / 13 | __% |
| ⚠️ Partial | __ / 13 | __% |
| ⏭️ Skipped | __ / 13 | __% |

### Critical Issues Found
1.
2.
3.

### Recommendations
1.
2.
3.

---

## Post-Test Actions

### If All Tests Pass ✅
1. Document successful test execution
2. Proceed with feature implementation (Jobs, Bids, Profile screens)
3. Begin automated test development
4. Schedule performance testing

### If Any Test Fails ❌
1. Document exact failure scenario
2. Capture logcat output: `adb logcat > logcat_error.txt`
3. Take screenshots/screen recording of failure
4. Report to development team with:
   - Test case ID
   - Steps to reproduce
   - Expected vs actual behavior
   - Device/OS information
   - Logs and screenshots
5. Fix issues before proceeding to next development phase

---

## Logcat Command for Debugging
```bash
# Capture logs during test execution
adb logcat -v time > taska_test_logs.txt

# Filter for Taska-specific logs
adb logcat -v time | grep -i taska

# Clear logs before test
adb logcat -c

# Monitor for crashes
adb logcat | grep -i "AndroidRuntime\|FATAL\|Exception"
```

---

## Quick Issue Reporting Template

**Issue Title**: [Test ID] Brief description

**Severity**: Critical / High / Medium / Low

**Test Case**: TC-CRITICAL-XXX

**Steps to Reproduce**:
1.
2.
3.

**Expected Behavior**:

**Actual Behavior**:

**Device Information**:
- Device:
- Android Version:
- App Version:

**Logs/Screenshots**:
[Attach here]

**Additional Notes**:

---

**Report Status**: Ready for Execution
**Last Updated**: 2025-10-28
**Next Review**: After test execution
