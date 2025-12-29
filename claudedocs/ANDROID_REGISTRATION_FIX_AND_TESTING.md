# Android Registration Flow - Root Cause Analysis and Fix

**Date**: 2025-10-27
**Status**: ✅ ROOT CAUSE IDENTIFIED | 🔧 FIX READY | 📋 TESTING PLAN COMPLETE

---

## Executive Summary

**Problem**: Android app registration fails with "not found" error after password entry
**Root Cause**: Missing `/api/v1/` prefix in Android API configuration
**Impact**: 100% registration failure rate on Android app
**Fix Complexity**: LOW - Single configuration file update
**Testing Strategy**: Maestro E2E framework recommended

---

## 1. Root Cause Analysis

### The Issue

When Android users complete the registration flow and enter their password, the app sends an API request that fails with a 404 "not found" error.

### Investigation Results

**Backend Configuration** (✅ Correct):
- Server running on: `http://localhost:3000`
- Global API prefix set in `backend/src/main.ts:26`: `app.setGlobalPrefix('api/v1')`
- Expected registration endpoint: `POST http://localhost:3000/api/v1/auth/register`

**Android Configuration** (❌ Incorrect):
- Base URL in `taska-android/app/build.gradle.kts:46`: `"http://10.0.2.2:3000"`
- Retrofit constructs URL as: `POST http://10.0.2.2:3000/auth/register`
- Missing: `/api/v1/` prefix

**API Call Flow**:
```
Android App          Backend Server
     |                     |
     | POST /auth/register |
     |-------------------->| ❌ 404 Not Found
     |                     | (expects /api/v1/auth/register)
```

**Why This Happens**:
1. `AuthApiService.kt` (line 17) defines endpoint as `@POST("auth/register")`
2. `NetworkModule.kt` (line 78) sets base URL from `BuildConfig.API_BASE_URL`
3. Retrofit combines: `base_url` + `endpoint` = `http://10.0.2.2:3000/auth/register`
4. Backend expects: `http://localhost:3000/api/v1/auth/register`

### Verification

**Backend DTO** (`backend/src/auth/dto/register.dto.ts`):
```typescript
export class RegisterDto {
  email: string;         // Required, validated
  password: string;      // Min 8 chars, complexity rules
  role?: UserRole;       // Optional, defaults to CLIENT
  firstName: string;     // Required, max 50 chars
  lastName: string;      // Required, max 50 chars
  phoneNumber?: string;  // Optional, SA format
}
```

**Android Request** (`taska-android/app/src/main/kotlin/za/co/taska/data/remote/dto/request/RegisterRequest.kt`):
```kotlin
data class RegisterRequest(
    val email: String,
    val password: String,
    val role: String = "ARTISAN",
    val firstName: String?,
    val lastName: String?,
    val phoneNumber: String?
)
```

✅ Request payload structure matches backend expectations
❌ Request URL does not match backend routing

---

## 2. The Fix

### Required Changes

**File**: `taska-android/app/build.gradle.kts`

**Lines to Update**:

**Line 27** (defaultConfig):
```kotlin
// BEFORE:
buildConfigField("String", "API_BASE_URL", "\"https://api.taska.co.za\"")

// AFTER:
buildConfigField("String", "API_BASE_URL", "\"https://api.taska.co.za/api/v1/\"")
```

**Line 41** (release buildType):
```kotlin
// BEFORE:
buildConfigField("String", "API_BASE_URL", "\"https://api.taska.co.za\"")

// AFTER:
buildConfigField("String", "API_BASE_URL", "\"https://api.taska.co.za/api/v1/\"")
```

**Line 46** (debug buildType - MOST IMPORTANT FOR DEVELOPMENT):
```kotlin
// BEFORE:
buildConfigField("String", "API_BASE_URL", "\"http://10.0.2.2:3000\"")

// AFTER:
buildConfigField("String", "API_BASE_URL", "\"http://10.0.2.2:3000/api/v1/\"")
```

### Why This Works

After the fix, Retrofit will construct URLs correctly:
```
Base URL: "http://10.0.2.2:3000/api/v1/"
Endpoint: "auth/register"
Result:   "http://10.0.2.2:3000/api/v1/auth/register" ✅
```

### Alternative Solutions Considered

1. **❌ Modify backend to remove `/api/v1` prefix**
   - Breaks frontend (Next.js) which expects `/api/v1`
   - Breaks API documentation at `/api/docs`
   - Not recommended - backend is correctly configured

2. **❌ Update each Android API service endpoint**
   - Would need to change all endpoints to `@POST("api/v1/auth/register")`
   - Violates DRY principle
   - Error-prone for future endpoints

3. **✅ Update base URL configuration** (RECOMMENDED)
   - Single point of change
   - Fixes all endpoints at once
   - Maintains proper separation of concerns

---

## 3. Testing Infrastructure Recommendation

### Framework Comparison

After extensive research of Android/React Native testing frameworks for 2025, here's the analysis:

| Framework | Strengths | Weaknesses | Score |
|-----------|-----------|------------|-------|
| **Maestro** | Simple YAML syntax, fast setup, cross-platform, built-in flakiness tolerance | Newer tool, smaller community | **9/10** ⭐ |
| **Detox** | Purpose-built for React Native, fast execution, smart sync | React Native only, complex setup | 8/10 |
| **Appium** | Most flexible, supports hybrid apps, mature ecosystem | Complex setup, slower execution | 7/10 |
| **Espresso** | Native Android, fast, reliable | Android-only, Java/Kotlin required | 7/10 |

### Recommendation: Maestro

**Why Maestro?**

1. **Simplicity**: YAML-based tests, no programming required
2. **Speed**: Fast installation and execution
3. **Compatibility**: Supports Android (Views + Compose), iOS, React Native, Flutter
4. **Reliability**: Built-in tolerance for UI flakiness
5. **CI/CD Ready**: Easy integration with CI pipelines
6. **Modern**: Actively maintained, growing community in 2025

### Maestro Setup Guide

**Installation**:
```bash
# macOS/Linux
curl -Ls "https://get.maestro.dev" | bash

# Windows
powershell -ExecutionPolicy Bypass -File install-maestro.ps1
```

**Test Structure**:
```
taska-android/
├── .maestro/
│   ├── flows/
│   │   ├── registration-flow.yaml
│   │   ├── login-flow.yaml
│   │   └── job-posting-flow.yaml
│   └── maestro.config.yaml
```

**Example Registration Test** (`.maestro/flows/registration-flow.yaml`):
```yaml
appId: za.co.taska.artisan
---
# Registration Flow E2E Test

- launchApp
- assertVisible: "Create Account"

# Step 1: Personal Details
- tapOn: "First Name"
- inputText: "John"
- tapOn: "Last Name"
- inputText: "Doe"
- tapOn: "Next"

# Step 2: Contact Info
- tapOn: "Email"
- inputText: "john.doe.test@example.com"
- tapOn: "Phone"
- inputText: "0821234567"
- tapOn: "Next"

# Step 3: Skills (optional)
- tapOn: "Next"

# Step 4: Create Account
- tapOn: "Password"
- inputText: "SecurePass123!"
- tapOn: "Confirm Password"
- inputText: "SecurePass123!"
- tapOn: "Create Account"

# Verify Success
- assertVisible: "Registration Successful"
- assertVisible: "Welcome, John"
```

**Running Tests**:
```bash
# Connect device or start emulator
adb devices

# Run specific flow
maestro test .maestro/flows/registration-flow.yaml

# Run all flows
maestro test .maestro/flows/

# With cloud recording
maestro cloud .maestro/flows/registration-flow.yaml
```

**CI/CD Integration** (GitHub Actions example):
```yaml
name: Android E2E Tests

on: [pull_request]

jobs:
  maestro-tests:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Android SDK
        uses: android-actions/setup-android@v2

      - name: Install Maestro
        run: curl -Ls "https://get.maestro.dev" | bash

      - name: Start Emulator
        run: |
          echo "no" | avdmanager create avd -n test -k "system-images;android-30;google_apis;x86"
          emulator -avd test -no-window -gpu swiftshader_indirect -no-snapshot -noaudio -no-boot-anim &

      - name: Build APK
        run: ./gradlew assembleDebug

      - name: Run Maestro Tests
        run: maestro test .maestro/flows/
```

### Alternative: Detox (For React Native Focus)

If you want deep React Native integration:

**Setup**:
```bash
npm install --save-dev detox detox-cli
```

**Configuration** (`package.json`):
```json
{
  "detox": {
    "test-runner": "jest",
    "configurations": {
      "android": {
        "type": "android.emulator",
        "device": {
          "avdName": "Pixel_4_API_30"
        },
        "app": "android/app/build/outputs/apk/debug/app-debug.apk"
      }
    }
  }
}
```

**Example Test** (`e2e/registration.test.js`):
```javascript
describe('Registration Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should complete registration successfully', async () => {
    await element(by.id('firstName')).typeText('John');
    await element(by.id('lastName')).typeText('Doe');
    await element(by.id('nextButton')).tap();

    await element(by.id('email')).typeText('john@test.com');
    await element(by.id('phone')).typeText('0821234567');
    await element(by.id('nextButton')).tap();

    await element(by.id('nextButton')).tap(); // Skip skills

    await element(by.id('password')).typeText('SecurePass123!');
    await element(by.id('confirmPassword')).typeText('SecurePass123!');
    await element(by.id('createAccountButton')).tap();

    await expect(element(by.text('Registration Successful'))).toBeVisible();
  });
});
```

---

## 4. Validation Strategy

### Pre-Fix Validation

**Test 1**: Verify Current Failure
```bash
# Start backend
cd backend
npm run dev

# Start Android app
cd taska-android
./gradlew installDebug

# Expected: Registration fails with "not found" error
```

### Post-Fix Validation

**Test 2**: Manual Registration Test
```bash
# 1. Apply fix to build.gradle.kts
# 2. Rebuild app: ./gradlew clean assembleDebug
# 3. Install: adb install app/build/outputs/apk/debug/app-debug.apk
# 4. Test registration flow
# Expected: Registration completes successfully
```

**Test 3**: API Endpoint Verification
```bash
# Monitor backend logs during registration
cd backend
npm run dev

# Expected log:
# POST /api/v1/auth/register 201 (Created)
```

**Test 4**: Network Traffic Analysis
```bash
# Use Android Studio Network Profiler or Charles Proxy
# Expected request:
# POST http://10.0.2.2:3000/api/v1/auth/register
# Status: 201 Created
```

### Regression Testing

**Critical Paths to Verify**:
1. ✅ Registration flow (new users)
2. ✅ Login flow (existing users)
3. ✅ Profile retrieval
4. ✅ Token refresh
5. ✅ Password reset request
6. ✅ Job posting (requires auth)
7. ✅ Bid creation (requires auth)
8. ✅ Messaging (requires auth)

---

## 5. Implementation Checklist

### Phase 1: Fix Application (Immediate)

- [ ] Backup current `build.gradle.kts`
- [ ] Update Line 27: defaultConfig API_BASE_URL
- [ ] Update Line 41: release API_BASE_URL
- [ ] Update Line 46: debug API_BASE_URL (CRITICAL for dev)
- [ ] Clean build: `./gradlew clean`
- [ ] Rebuild: `./gradlew assembleDebug`
- [ ] Install on device: `adb install app/build/outputs/apk/debug/app-debug.apk`
- [ ] Test registration manually
- [ ] Verify backend logs show correct endpoint
- [ ] Test login flow
- [ ] Test token refresh
- [ ] Commit fix with message: "fix: Add /api/v1/ prefix to Android API base URL"

### Phase 2: Testing Infrastructure (Next Sprint)

- [ ] Install Maestro CLI
- [ ] Create `.maestro/` directory structure
- [ ] Write registration flow test
- [ ] Write login flow test
- [ ] Write job posting flow test
- [ ] Configure CI/CD pipeline
- [ ] Document test execution process
- [ ] Train team on Maestro usage

### Phase 3: Comprehensive Testing (Ongoing)

- [ ] Add unit tests for RegisterUseCase
- [ ] Add unit tests for AuthRepositoryImpl
- [ ] Add integration tests for API layer
- [ ] Add UI tests for all registration steps
- [ ] Add performance tests
- [ ] Add accessibility tests
- [ ] Set up automated regression suite

---

## 6. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Fix breaks other endpoints | Low | High | Test all authenticated endpoints |
| Build configuration cache | Medium | Low | Clean build before testing |
| OneDrive sync conflicts | Medium | Medium | Pause sync during file edits |
| Hardcoded URLs elsewhere | Low | Medium | Search codebase for "10.0.2.2" |
| Backend routing change | Very Low | High | Backend config is standard practice |

---

## 7. Success Metrics

### Immediate Success Criteria

✅ Registration API calls return 201 Created (not 404 Not Found)
✅ User account created in database
✅ JWT tokens returned to Android app
✅ User automatically logged in after registration
✅ No console errors during flow

### Long-term Success Metrics

- Registration completion rate: Target >95%
- Average registration time: Target <60 seconds
- Error rate: Target <1%
- Test coverage: Target >80%
- CI/CD test success rate: Target >98%

---

## 8. Additional Findings

### Password Validation Mismatch

**Backend Requirements** (`register.dto.ts:20-25`):
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@$!%*?&)

**Android Validation** (`RegisterViewModel.kt:179`):
- Minimum 8 characters only
- No complexity requirements

**Recommendation**: Update Android validation to match backend:
```kotlin
private fun validateStep4(): Boolean {
    var isValid = true

    if (state.password.isBlank()) {
        state = state.copy(passwordError = "Password is required")
        isValid = false
    } else if (state.password.length < 8) {
        state = state.copy(passwordError = "Password must be at least 8 characters")
        isValid = false
    } else if (!state.password.matches(Regex("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@\$!%*?&])[A-Za-z\\d@\$!%*?&].*$"))) {
        state = state.copy(passwordError = "Password must contain uppercase, lowercase, number and special character")
        isValid = false
    }

    // ... rest of validation
}
```

### Phone Number Validation Mismatch

**Backend Format** (`register.dto.ts:59`):
```
^\+?27[\s-]?[0-9]{2}[\s-]?[0-9]{3}[\s-]?[0-9]{4}$
Examples: +27821234567 or +27 82 123 4567
```

**Android Format** (`RegisterViewModel.kt:152-161`):
```
Starts with 0 or +27
If 0: exactly 10 digits (0XXXXXXXXX)
If +27: exactly 12 digits (+27XXXXXXXXX)
```

**Issue**: Backend allows spaces/dashes, Android validation doesn't account for this

**Recommendation**: Normalize phone number before sending:
```kotlin
private fun normalizePhoneNumber(phone: String): String {
    return phone.replace(Regex("[\\s-]"), "")
}
```

---

## 9. Future Enhancements

### Short Term (Next Sprint)

1. Add comprehensive error messages for API failures
2. Implement retry logic for network failures
3. Add loading states for all async operations
4. Implement analytics tracking for registration funnel
5. Add A/B testing framework for registration flow

### Medium Term (Next Quarter)

1. Implement social auth (Google, Facebook)
2. Add biometric authentication support
3. Implement progressive profiling (reduce initial registration fields)
4. Add email verification flow
5. Implement referral tracking

### Long Term (Roadmap)

1. Machine learning for fraud detection
2. Advanced identity verification
3. Multi-factor authentication
4. SSO for enterprise clients
5. Passwordless authentication

---

## 10. Conclusion

The Android registration "not found" error is caused by a simple configuration mismatch: the Android app is missing the `/api/v1/` prefix in its API base URL. This is a single-line fix with low risk and high impact.

The recommended testing approach uses Maestro for its simplicity, reliability, and future-proof architecture. This will prevent similar issues and enable comprehensive E2E testing across the entire app.

**Estimated Time to Resolution**:
- Fix implementation: 5 minutes
- Build and test: 10 minutes
- Full regression testing: 30 minutes
- Total: **45 minutes**

**Estimated Time for Testing Infrastructure**:
- Maestro setup: 1 hour
- Initial test suite (5 flows): 4 hours
- CI/CD integration: 2 hours
- Documentation: 1 hour
- Total: **8 hours (1 day)**

---

## Appendix A: Manual Fix Instructions

If automated tools fail, manually edit `taska-android/app/build.gradle.kts`:

1. Open file in text editor (VS Code, Notepad++, etc.)
2. Find line 27: `buildConfigField("String", "API_BASE_URL", "\"https://api.taska.co.za\"")`
3. Change to: `buildConfigField("String", "API_BASE_URL", "\"https://api.taska.co.za/api/v1/\"")`
4. Find line 41: Same change for release build
5. Find line 46: `buildConfigField("String", "API_BASE_URL", "\"http://10.0.2.2:3000\"")`
6. Change to: `buildConfigField("String", "API_BASE_URL", "\"http://10.0.2.2:3000/api/v1/\"")`
7. Save file
8. Run `./gradlew clean assembleDebug`
9. Test registration

---

**Document Version**: 1.0
**Last Updated**: 2025-10-27
**Author**: Quality Engineer - Claude Code
**Status**: READY FOR IMPLEMENTATION
