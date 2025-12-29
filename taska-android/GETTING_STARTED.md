# Taska Android App - Getting Started Guide

**Quick Reference** for starting Android app development

---

## 📚 Documentation Index

1. **[IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md)** - Complete 8-phase development plan
2. **[ANDROID_APP_DEVELOPMENT_PROMPT.md](../claudedocs/ANDROID_APP_DEVELOPMENT_PROMPT.md)** - Full technical specification
3. **[IMPLEMENTATION_PROGRESS.md](./IMPLEMENTATION_PROGRESS.md)** - Current status tracker
4. This file - Quick start guide

---

## 🚀 Quick Start

### Prerequisites

```bash
# Required
- Android Studio Giraffe (2023.3.1) or later
- JDK 17
- Android SDK 24-34
- Git

# Recommended
- 16GB RAM minimum
- SSD storage
- Android device/emulator for testing
```

### Initial Setup

```bash
# 1. Clone the repository (if not already done)
cd C:\Users\Yaseen\OneDrive\Documents\Investments\Taska\taska-android

# 2. Open in Android Studio
# File → Open → Select taska-android directory

# 3. Wait for Gradle sync to complete

# 4. Add Firebase config (google-services.json)
# Download from Firebase Console
# Place in: app/google-services.json

# 5. Configure local.properties
# Create if doesn't exist:
echo "sdk.dir=C:\\Users\\Yaseen\\AppData\\Local\\Android\\Sdk" > local.properties
echo "STRIPE_PUBLISHABLE_KEY=your_stripe_key" >> local.properties
echo "PAYFAST_MERCHANT_ID=your_payfast_id" >> local.properties

# 6. Build the project
./gradlew build
```

---

## 📱 Current State

### ✅ What's Working (60-70% Complete)

**Architecture Foundation:**
- Clean Architecture with 3 layers (Domain → Data → Presentation)
- Hilt dependency injection configured
- Room database with 6 entities
- All Retrofit API services defined
- JWT authentication with interceptors

**Data Layer:**
- All API service interfaces (Auth, Jobs, Bids, Messages, Payments, Reviews, Notifications)
- All domain models and DTOs
- Repository implementations with caching
- 30+ use cases across all business domains

**Presentation:**
- Material 3 theme with colors and typography
- Navigation graph (basic)
- Splash screen with token check
- Login/Register screens (basic implementations)
- Artisan dashboard skeleton
- Reusable components (buttons, text fields)

### 🔄 What Needs Completion

**Critical Priority:**
1. **Authentication Flow** - Complete multi-step registration, role-based routing
2. **CLIENT Screens** - Job posting wizard, job management, payments
3. **ARTISAN Screens** - Enhanced job browser, projects, earnings
4. **Real-time Messaging** - Socket.IO integration, chat UI

**High Priority:**
5. **Location Services** - Permission handling, distance calculation
6. **Camera Integration** - Photo capture, gallery picker, image upload
7. **Payment Integration** - Stripe and PayFast flows

**Medium Priority:**
8. **ADMIN Panel** - User management, moderation, escrow
9. **Testing** - Unit, integration, UI, E2E tests (target: >80% coverage)

---

## 🎯 Implementation Strategy

Follow the **8-phase roadmap** in `IMPLEMENTATION_ROADMAP.md`:

| Phase | Focus | Priority | Duration |
|-------|-------|----------|----------|
| **Phase 1** | Auth & Navigation | CRITICAL | 4-6 hours |
| **Phase 2** | CLIENT Role | HIGH | 12-16 hours |
| **Phase 3** | ARTISAN Complete | HIGH | 10-12 hours |
| **Phase 4** | ADMIN Role | MEDIUM | 8-10 hours |
| **Phase 5** | Messaging | HIGH | 6-8 hours |
| **Phase 6** | Location & Camera | MEDIUM | 4-6 hours |
| **Phase 7** | Payments | HIGH | 6-8 hours |
| **Phase 8** | Testing | CRITICAL | 10-12 hours |

**Total Estimate:** 60-78 hours (2-3 weeks)

---

## 🛠️ Development Workflow

### Recommended Approach

```bash
# 1. Start a new feature branch
git checkout -b feature/phase-1-auth

# 2. Work on one phase at a time
# Follow the tasks in IMPLEMENTATION_ROADMAP.md

# 3. Test as you go
./gradlew test                    # Unit tests
./gradlew connectedAndroidTest   # Instrumented tests

# 4. Check code quality
./gradlew lint                   # Lint checks
./gradlew ktlintCheck            # Kotlin style

# 5. Commit with clear messages
git add .
git commit -m "feat(auth): implement multi-step registration wizard"

# 6. Build and test on device
./gradlew assembleDebug
# Install: adb install app/build/outputs/apk/debug/app-debug.apk

# 7. Merge when complete
git checkout main
git merge feature/phase-1-auth
```

### Testing Strategy

```bash
# Run all tests
./gradlew test
./gradlew connectedAndroidTest

# Generate coverage report
./gradlew jacocoTestReport
# View: app/build/reports/jacoco/test/html/index.html

# Specific test suite
./gradlew test --tests "*ViewModelTest"
./gradlew connectedAndroidTest --tests "*ScreenTest"
```

---

## 📂 Project Structure

```
taska-android/
├── app/
│   ├── src/
│   │   ├── main/kotlin/za/co/taska/
│   │   │   ├── TaskaApplication.kt
│   │   │   ├── di/                    # Dependency Injection
│   │   │   │   ├── AppModule.kt
│   │   │   │   ├── NetworkModule.kt
│   │   │   │   └── DatabaseModule.kt
│   │   │   ├── data/                  # Data Layer
│   │   │   │   ├── local/             # Room DB, DAOs, Entities
│   │   │   │   ├── remote/            # Retrofit APIs, DTOs
│   │   │   │   ├── repository/        # Repository implementations
│   │   │   │   └── mapper/            # DTO ↔ Domain mappers
│   │   │   ├── domain/                # Domain Layer
│   │   │   │   ├── model/             # Domain models
│   │   │   │   ├── repository/        # Repository interfaces
│   │   │   │   └── usecase/           # Business logic use cases
│   │   │   └── presentation/          # Presentation Layer
│   │   │       ├── screens/           # Compose screens
│   │   │       │   ├── auth/          # Login, Register
│   │   │       │   ├── client/        # CLIENT role screens
│   │   │       │   ├── artisan/       # ARTISAN role screens
│   │   │       │   └── admin/         # ADMIN role screens
│   │   │       ├── components/        # Reusable UI components
│   │   │       ├── navigation/        # NavGraph, destinations
│   │   │       └── theme/             # Material 3 theme
│   │   ├── test/                      # Unit tests
│   │   └── androidTest/               # Instrumented tests
│   └── build.gradle.kts
├── build.gradle.kts
├── settings.gradle.kts
└── Documentation files
```

---

## 🔑 Key Files to Know

### Configuration Files

| File | Purpose |
|------|---------|
| `app/build.gradle.kts` | App dependencies and build config |
| `local.properties` | Local SDK paths and API keys |
| `app/google-services.json` | Firebase configuration |
| `app/proguard-rules.pro` | Code obfuscation rules |

### Core Application Files

| File | Purpose |
|------|---------|
| `TaskaApplication.kt` | Application entry point with Hilt |
| `MainActivity.kt` | Single activity with Compose |
| `NavGraph.kt` | App navigation routes |
| `Theme.kt` | Material 3 theme definition |

### Dependency Injection

| File | Purpose |
|------|---------|
| `AppModule.kt` | Application-level dependencies |
| `NetworkModule.kt` | Retrofit, OkHttp, interceptors |
| `DatabaseModule.kt` | Room database, DAOs |

---

## 🌐 Backend API Reference

### Base URLs

```kotlin
// Production
const val BASE_URL = "https://api.taska.co.za/api/v1/"

// Development (Android Emulator)
const val DEBUG_URL = "http://10.0.2.2:3000/api/v1/"

// Development (Physical Device - use your local IP)
const val DEBUG_URL = "http://192.168.1.x:3000/api/v1/"
```

### API Endpoints Summary

**Authentication:**
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login with email/password
- `POST /auth/refresh-token` - Refresh access token
- `GET /auth/profile` - Get current user profile

**Jobs (CLIENT):**
- `POST /jobs` - Create new job
- `GET /jobs/my-jobs` - Get user's jobs
- `PATCH /jobs/:id` - Update job
- `DELETE /jobs/:id` - Delete job

**Jobs (ARTISAN):**
- `GET /jobs/nearby` - Find jobs near location
- `GET /jobs` - Browse all jobs with filters

**Bids (ARTISAN):**
- `POST /bids` - Submit bid
- `GET /bids/my-bids` - Get artisan's bids
- `POST /bids/:id/withdraw` - Withdraw bid

**Bids (CLIENT):**
- `GET /bids/job/:jobId` - Get bids for job
- `POST /bids/:id/accept` - Accept bid
- `POST /bids/:id/reject` - Reject bid

**Messages:**
- `GET /messages/conversations` - Get all conversations
- `GET /messages` - Get messages with filters
- `POST /messages` - Send message
- `POST /messages/mark-read` - Mark as read

**Payments:**
- `POST /payments/create-intent` - Create payment intent
- `GET /payments` - Get user payments
- `PATCH /payments/:id/release` - Release to artisan

**Admin:**
- `GET /admin/dashboard/metrics` - Dashboard metrics
- `POST /admin/users/:id/ban` - Ban user
- `POST /admin/users/:id/verify` - Verify artisan

See full API documentation in `ANDROID_APP_DEVELOPMENT_PROMPT.md`

---

## 🧰 Useful Commands

### Gradle Tasks

```bash
# Clean build
./gradlew clean

# Compile debug
./gradlew assembleDebug

# Compile release
./gradlew assembleRelease

# Run unit tests
./gradlew test

# Run instrumented tests (requires emulator/device)
./gradlew connectedAndroidTest

# Generate test coverage report
./gradlew jacocoTestReport

# Run lint checks
./gradlew lint

# Check Kotlin code style
./gradlew ktlintCheck

# Auto-format Kotlin code
./gradlew ktlintFormat

# Dependency report
./gradlew dependencies

# List all tasks
./gradlew tasks
```

### ADB Commands

```bash
# Install APK
adb install app/build/outputs/apk/debug/app-debug.apk

# Uninstall app
adb uninstall za.co.taska

# View logs
adb logcat | grep "Taska"

# Clear app data
adb shell pm clear za.co.taska

# List connected devices
adb devices

# Screenshot
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png

# Record screen
adb shell screenrecord /sdcard/demo.mp4
adb pull /sdcard/demo.mp4
```

---

## 🐛 Troubleshooting

### Common Issues

**1. Gradle sync fails**
```bash
# Solution 1: Invalidate caches
File → Invalidate Caches → Invalidate and Restart

# Solution 2: Clean and rebuild
./gradlew clean build

# Solution 3: Delete .gradle directory
rm -rf .gradle
./gradlew build
```

**2. Compilation errors after updating dependencies**
```bash
# Update Gradle wrapper
./gradlew wrapper --gradle-version=8.6

# Sync project
./gradlew --refresh-dependencies
```

**3. Tests fail with "No cached version"**
```bash
# Clear test caches
./gradlew cleanTest test
```

**4. App crashes on startup**
```bash
# Check logs
adb logcat | grep -E "AndroidRuntime|Taska"

# Common causes:
# - Missing google-services.json
# - Incorrect API URL
# - Missing permissions in AndroidManifest
```

**5. Cannot connect to backend API**
```bash
# For emulator, use:
http://10.0.2.2:3000/api/v1/

# For physical device, check:
# 1. Device and computer on same WiFi
# 2. Backend running on computer
# 3. Use computer's local IP: http://192.168.1.x:3000/api/v1/
```

---

## 📊 Progress Tracking

### After Each Phase

1. **Update progress**:
   - Edit `IMPLEMENTATION_PROGRESS.md`
   - Mark completed tasks with ✅
   - Update percentage complete

2. **Run tests**:
   ```bash
   ./gradlew test
   ./gradlew connectedAndroidTest
   ```

3. **Check coverage**:
   ```bash
   ./gradlew jacocoTestReport
   ```

4. **Commit changes**:
   ```bash
   git add .
   git commit -m "feat(phase-X): complete [feature description]"
   ```

5. **Tag milestone**:
   ```bash
   git tag -a v0.X.0 -m "Phase X complete"
   ```

---

## 🎓 Learning Resources

### Official Documentation

- [Jetpack Compose](https://developer.android.com/jetpack/compose)
- [Hilt Dependency Injection](https://developer.android.com/training/dependency-injection/hilt-android)
- [Room Database](https://developer.android.com/training/data-storage/room)
- [Retrofit](https://square.github.io/retrofit/)
- [Material 3](https://m3.material.io/)

### Code Patterns

**Clean Architecture:**
- Use Cases → Single responsibility business logic
- Repositories → Abstract data sources
- Mappers → DTO ↔ Domain conversions
- ViewModels → UI state management

**Compose Best Practices:**
- State hoisting
- Side effects (LaunchedEffect, DisposableEffect)
- Remember and derivedStateOf
- Recomposition optimization

---

## 💡 Tips for Success

1. **Work in small increments** - Complete one screen at a time
2. **Test as you go** - Don't wait until the end
3. **Follow the roadmap** - Phases are ordered by dependency
4. **Ask for help** - Check existing code for patterns
5. **Keep it simple** - MVP first, enhancements later
6. **Document as you code** - Future you will thank you
7. **Use version control** - Commit frequently with clear messages

---

## 🚦 Next Steps

### Immediate Actions

1. **Read the full roadmap**: `IMPLEMENTATION_ROADMAP.md`
2. **Set up your environment**: Install Android Studio, sync Gradle
3. **Review existing code**: Understand the current structure
4. **Start with Phase 1**: Authentication & Navigation
5. **Follow the TODO list**: Check off items as you complete them

### Phase 1 Checklist

- [ ] Complete multi-step registration wizard
- [ ] Implement role-based navigation
- [ ] Add session management
- [ ] Enhance splash screen routing
- [ ] Test all auth flows
- [ ] Update documentation

---

## 📞 Support

If you encounter issues or have questions:

1. Check `TROUBLESHOOTING.md` (if exists)
2. Review existing code for similar patterns
3. Consult official Android documentation
4. Ask for help with specific error messages

---

**Document Version:** 1.0.0
**Last Updated:** 2025-12-25
**Status:** Ready to Start Development
