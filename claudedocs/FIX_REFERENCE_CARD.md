# Android Registration Fix - Quick Reference Card

---

## THE PROBLEM
Registration fails with "not found" error after password entry

---

## THE FIX (5 MINUTES)

### File
`taska-android/app/build.gradle.kts`

### Changes (Add `/api/v1/` to 3 URLs)

```kotlin
Line 27:  "\"https://api.taska.co.za/api/v1/\""
Line 41:  "\"https://api.taska.co.za/api/v1/\""
Line 46:  "\"http://10.0.2.2:3000/api/v1/\""  ← CRITICAL
```

### Rebuild
```bash
cd taska-android
./gradlew clean assembleDebug
adb install app/build/outputs/apk/debug/app-debug.apk
```

---

## TESTING INFRASTRUCTURE

### Install Maestro
```bash
curl -Ls "https://get.maestro.dev" | bash
```

### Run Tests
```bash
maestro test taska-android/.maestro/flows/registration-flow.yaml
```

---

## DOCUMENTATION

📋 **Full Analysis**: `ANDROID_REGISTRATION_FIX_AND_TESTING.md`
⚡ **Quick Guide**: `QUICKSTART_FIX_ANDROID_REGISTRATION.md`
📊 **Summary**: `IMPLEMENTATION_SUMMARY.md`
🧪 **Test Guide**: `taska-android/.maestro/README.md`

---

## VERIFICATION CHECKLIST

- [ ] Edit build.gradle.kts (3 changes)
- [ ] Clean build: `./gradlew clean`
- [ ] Rebuild: `./gradlew assembleDebug`
- [ ] Install app
- [ ] Test registration → ✅ Should succeed
- [ ] Verify backend logs show `/api/v1/auth/register`
- [ ] Commit changes

---

**Time**: 15 minutes total
**Risk**: LOW
**Impact**: HIGH (Fixes 100% registration failures)
