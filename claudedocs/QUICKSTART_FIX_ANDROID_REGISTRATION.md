# QUICKSTART: Fix Android Registration Issue

**Time Required**: 5 minutes
**Risk Level**: LOW
**Impact**: HIGH (Fixes 100% registration failure)

---

## The Problem

Android app registration fails with "not found" error after password entry.

## The Fix

Add `/api/v1/` to API base URL in Android configuration.

---

## Step-by-Step Instructions

### 1. Open the File

File: `taska-android/app/build.gradle.kts`

### 2. Find and Replace (3 locations)

**Location 1** - Line ~27 (defaultConfig):
```kotlin
// FIND:
buildConfigField("String", "API_BASE_URL", "\"https://api.taska.co.za\"")

// REPLACE WITH:
buildConfigField("String", "API_BASE_URL", "\"https://api.taska.co.za/api/v1/\"")
```

**Location 2** - Line ~41 (release):
```kotlin
// FIND:
buildConfigField("String", "API_BASE_URL", "\"https://api.taska.co.za\"")

// REPLACE WITH:
buildConfigField("String", "API_BASE_URL", "\"https://api.taska.co.za/api/v1/\"")
```

**Location 3** - Line ~46 (debug) **← MOST IMPORTANT**:
```kotlin
// FIND:
buildConfigField("String", "API_BASE_URL", "\"http://10.0.2.2:3000\"")

// REPLACE WITH:
buildConfigField("String", "API_BASE_URL", "\"http://10.0.2.2:3000/api/v1/\"")
```

### 3. Rebuild and Test

```bash
cd taska-android

# Clean build
./gradlew clean

# Rebuild app
./gradlew assembleDebug

# Install on device/emulator
adb install app/build/outputs/apk/debug/app-debug.apk
```

### 4. Verify Fix

1. Open the app
2. Go to Registration
3. Fill in all steps
4. Enter password
5. Tap "Create Account"
6. ✅ Should succeed and log you in

---

## What Changed?

**Before**:
```
Android Request: POST http://10.0.2.2:3000/auth/register
Backend Expects: POST http://10.0.2.2:3000/api/v1/auth/register
Result: 404 Not Found ❌
```

**After**:
```
Android Request: POST http://10.0.2.2:3000/api/v1/auth/register
Backend Expects: POST http://10.0.2.2:3000/api/v1/auth/register
Result: 201 Created ✅
```

---

## Troubleshooting

### Build Fails

```bash
# If build fails, sync Gradle first
./gradlew --refresh-dependencies
```

### Still Getting 404

1. Check backend is running: `http://localhost:3000/api/docs`
2. Verify you rebuilt after changes: `./gradlew clean assembleDebug`
3. Uninstall old app first: `adb uninstall za.co.taska.artisan`

### File Won't Save (OneDrive Issue)

1. Pause OneDrive sync temporarily
2. Make changes
3. Save file
4. Resume OneDrive sync

---

## Next Steps

See `ANDROID_REGISTRATION_FIX_AND_TESTING.md` for:
- Complete root cause analysis
- Testing infrastructure setup (Maestro)
- Comprehensive validation strategy
- Additional validation issues found

---

**Need Help?** Check the full documentation in `claudedocs/`
