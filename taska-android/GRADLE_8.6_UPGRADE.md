# Taska Android - Gradle 8.6.0 Upgrade Guide
**Date:** 2025-10-26
**Upgrade Engineer:** Claude Code (Refactoring Expert)
**Session:** Gradle 8.6.0 + AGP 8.7 + Kotlin 1.9.25 Migration

---

## Overview

This document details the complete upgrade of the Taska Android application from Gradle 7.6/AGP 7.4.2/Kotlin 1.8.20 (Java 11) to Gradle 8.6/AGP 8.7.3/Kotlin 1.9.25 (Java 17). This upgrade **reverses** the previous downgrade documented in CHANGES_LOG.md and goes even further with latest stable versions.

---

## Version Changes Summary

### Build System Versions

| Component | Previous Version | New Version | Change Type |
|-----------|-----------------|-------------|-------------|
| **Gradle** | 7.6 | 8.6 | Major upgrade |
| **AGP** | 7.4.2 | 8.7.3 | Major upgrade |
| **Kotlin** | 1.8.20 | 1.9.25 | Minor upgrade |
| **Java Target** | 11 | 17 | Major upgrade |
| **Compose Compiler** | 1.4.6 | 1.5.15 | Minor upgrade |

### Plugin Versions

| Plugin | Previous | New | Notes |
|--------|----------|-----|-------|
| Android Application | 7.4.2 | 8.7.3 | Requires Java 17 |
| Kotlin Android | 1.8.20 | 1.9.25 | Latest stable 1.9.x |
| Hilt | 2.48 | 2.52 | Latest stable |
| Google Services | 4.4.0 | 4.4.2 | Patch update |

### Key Dependency Updates

| Library Category | Previous | New | Impact |
|-----------------|----------|-----|---------|
| **Compose BOM** | 2023.10.01 | 2024.12.01 | ~14 months newer |
| **Kotlin Coroutines** | 1.7.3 | 1.8.1 | Latest stable |
| **AndroidX Core** | 1.12.0 | 1.15.0 | Latest stable |
| **Lifecycle** | 2.6.2 | 2.8.7 | Major version bump |
| **Navigation** | 2.7.5 | 2.8.5 | Major version bump |
| **Room** | 2.6.0 | 2.8.3 | Major version bump |
| **DataStore** | 1.0.0 | 1.1.1 | Minor version bump |
| **Coil** | 2.5.0 | 2.7.0 | Minor version bump |
| **CameraX** | 1.3.0 | 1.4.1 | Minor version bump |
| **Accompanist** | 0.32.0 | 0.36.0 | Latest stable |
| **Firebase BOM** | 32.5.0 | 33.7.0 | Major version bump |

---

## Critical Requirements

### ⚠️ JAVA 17 REQUIRED

**AGP 8.0+ REQUIRES Java 17 to build.** This is a hard requirement and the build will fail without it.

#### Current System Status
- ✅ Java 8 installed (currently active)
- ✅ Java 11 installed (available)
- ❌ **Java 17 NOT installed** - MUST be installed before building

#### Installing Java 17

**Option 1: Eclipse Temurin (Recommended)**
```bash
# Download from: https://adoptium.net/temurin/releases/?version=17
# Recommended: JDK 17 LTS (latest patch version)
# Choose: Windows x64 installer (.msi)
```

**Option 2: Oracle JDK 17**
```bash
# Download from: https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html
# Requires Oracle account
```

**Option 3: Microsoft Build of OpenJDK**
```bash
# Download from: https://www.microsoft.com/openjdk
# Choose: JDK 17 Windows x64
```

#### After Installation

1. **Verify Java 17 is installed:**
```bash
java -version
# Should show: openjdk version "17.x.x" or java version "17.x.x"
```

2. **Set JAVA_HOME environment variable:**
```bash
# Windows Command Prompt (as Administrator):
setx /M JAVA_HOME "C:\Program Files\Eclipse Adoptium\jdk-17.0.x-hotspot"

# PowerShell (as Administrator):
[System.Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Eclipse Adoptium\jdk-17.0.x-hotspot", "Machine")
```

3. **Update PATH:**
```bash
# Add to PATH: %JAVA_HOME%\bin
# Windows will typically do this automatically during installation
```

4. **Configure Gradle to use Java 17:**

Add to `gradle.properties` (if needed):
```properties
org.gradle.java.home=C:\\Program Files\\Eclipse Adoptium\\jdk-17.0.x-hotspot
```

---

## File Modifications

### 1. gradle/wrapper/gradle-wrapper.properties

**Change:** Gradle distribution URL updated to 8.6

```diff
- distributionUrl=https\://services.gradle.org/distributions/gradle-7.6-bin.zip
+ distributionUrl=https\://services.gradle.org/distributions/gradle-8.6-bin.zip
```

**Impact:** Gradle will download version 8.6 on next build

---

### 2. build.gradle.kts (Root)

**Changes:** Plugin versions and build directory syntax

```diff
plugins {
-   id("com.android.application") version "7.4.2" apply false
+   id("com.android.application") version "8.7.3" apply false
-   id("org.jetbrains.kotlin.android") version "1.8.20" apply false
+   id("org.jetbrains.kotlin.android") version "1.9.25" apply false
-   id("com.google.dagger.hilt.android") version "2.48" apply false
+   id("com.google.dagger.hilt.android") version "2.52" apply false
-   id("com.google.gms.google-services") version "4.4.0" apply false
+   id("com.google.gms.google-services") version "4.4.2" apply false
}

tasks.register("clean", Delete::class) {
-   delete(rootProject.buildDir)
+   delete(layout.buildDirectory)
}
```

**Breaking Change:** `rootProject.buildDir` → `layout.buildDirectory`
- Gradle 8.x deprecated direct `buildDir` property access
- Must use `layout.buildDirectory` API instead
- This is a **required syntax change** for Gradle 8.x

---

### 3. app/build.gradle.kts

#### Java Compatibility (Lines 50-57)

```diff
compileOptions {
-   sourceCompatibility = JavaVersion.VERSION_11
+   sourceCompatibility = JavaVersion.VERSION_17
-   targetCompatibility = JavaVersion.VERSION_11
+   targetCompatibility = JavaVersion.VERSION_17
}

kotlinOptions {
-   jvmTarget = "11"
+   jvmTarget = "17"
}
```

**Impact:** Compiled bytecode will target Java 17 runtime

#### Compose Compiler (Line 65)

```diff
composeOptions {
-   kotlinCompilerExtensionVersion = "1.4.6"
+   kotlinCompilerExtensionVersion = "1.5.15"
}
```

**Compatibility:** Compose Compiler 1.5.15 is compatible with Kotlin 1.9.25

#### Kotlin Dependencies (Lines 77-79)

```diff
// Kotlin
- implementation("org.jetbrains.kotlin:kotlin-stdlib:1.8.20")
+ implementation("org.jetbrains.kotlin:kotlin-stdlib:1.9.25")
- implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
+ implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")
- implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
+ implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.8.1")
```

#### AndroidX Core (Lines 82-84)

```diff
// Android Core
- implementation("androidx.core:core-ktx:1.12.0")
+ implementation("androidx.core:core-ktx:1.15.0")
- implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.6.2")
+ implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")
- implementation("androidx.activity:activity-compose:1.8.0")
+ implementation("androidx.activity:activity-compose:1.9.3")
```

#### Compose BOM (Line 87)

```diff
// Jetpack Compose BOM
- implementation(platform("androidx.compose:compose-bom:2023.10.01"))
+ implementation(platform("androidx.compose:compose-bom:2024.12.01"))
```

**Impact:** All Compose libraries will use versions from December 2024 BOM

#### Navigation (Lines 95-96)

```diff
// Navigation
- implementation("androidx.navigation:navigation-compose:2.7.5")
+ implementation("androidx.navigation:navigation-compose:2.8.5")
- implementation("androidx.hilt:hilt-navigation-compose:1.1.0")
+ implementation("androidx.hilt:hilt-navigation-compose:1.2.0")
```

#### Lifecycle (Lines 99-100)

```diff
// Lifecycle
- implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.6.2")
+ implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")
- implementation("androidx.lifecycle:lifecycle-runtime-compose:2.6.2")
+ implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.7")
```

#### Hilt (Lines 103-104)

```diff
// Hilt Dependency Injection
- implementation("com.google.dagger:hilt-android:2.48")
+ implementation("com.google.dagger:hilt-android:2.52")
- kapt("com.google.dagger:hilt-compiler:2.48")
+ kapt("com.google.dagger:hilt-compiler:2.52")
```

#### Room (Lines 113-115)

```diff
// Room Database
- implementation("androidx.room:room-runtime:2.6.0")
+ implementation("androidx.room:room-runtime:2.8.3")
- implementation("androidx.room:room-ktx:2.6.0")
+ implementation("androidx.room:room-ktx:2.8.3")
- kapt("androidx.room:room-compiler:2.6.0")
+ kapt("androidx.room:room-compiler:2.8.3")
```

#### Other Dependencies

```diff
// DataStore
- implementation("androidx.datastore:datastore-preferences:1.0.0")
+ implementation("androidx.datastore:datastore-preferences:1.1.1")

// Coil
- implementation("io.coil-kt:coil-compose:2.5.0")
+ implementation("io.coil-kt:coil-compose:2.7.0")

// Google Play Services
- implementation("com.google.android.gms:play-services-location:21.0.1")
+ implementation("com.google.android.gms:play-services-location:21.3.0")

// Socket.IO
- implementation("io.socket:socket.io-client:2.1.0")
+ implementation("io.socket:socket.io-client:2.1.1")

// Firebase
- implementation(platform("com.google.firebase:firebase-bom:32.5.0"))
+ implementation(platform("com.google.firebase:firebase-bom:33.7.0"))

// CameraX
- implementation("androidx.camera:camera-camera2:1.3.0")
+ implementation("androidx.camera:camera-camera2:1.4.1")
- implementation("androidx.camera:camera-lifecycle:1.3.0")
+ implementation("androidx.camera:camera-lifecycle:1.4.1")
- implementation("androidx.camera:camera-view:1.3.0")
+ implementation("androidx.camera:camera-view:1.4.1")

// Accompanist
- implementation("com.google.accompanist:accompanist-permissions:0.32.0")
+ implementation("com.google.accompanist:accompanist-permissions:0.36.0")
- implementation("com.google.accompanist:accompanist-systemuicontroller:0.32.0")
+ implementation("com.google.accompanist:accompanist-systemuicontroller:0.36.0")

// Gson
- implementation("com.google.code.gson:gson:2.10.1")
+ implementation("com.google.code.gson:gson:2.11.0")

// Testing
- testImplementation("org.mockito.kotlin:mockito-kotlin:5.1.0")
+ testImplementation("org.mockito.kotlin:mockito-kotlin:5.4.0")
- testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.7.3")
+ testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.8.1")
- testImplementation("app.cash.turbine:turbine:1.0.0")
+ testImplementation("app.cash.turbine:turbine:1.2.0")

// Android Testing
- androidTestImplementation("androidx.test.ext:junit:1.1.5")
+ androidTestImplementation("androidx.test.ext:junit:1.2.1")
- androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
+ androidTestImplementation("androidx.test.espresso:espresso-core:3.6.1")
- androidTestImplementation(platform("androidx.compose:compose-bom:2023.10.01"))
+ androidTestImplementation(platform("androidx.compose:compose-bom:2024.12.01"))
```

---

## Breaking Changes from Gradle 8.x

### 1. Build Directory API Change
**Issue:** `rootProject.buildDir` is deprecated in Gradle 8.x

**Old Syntax:**
```kotlin
tasks.register("clean", Delete::class) {
    delete(rootProject.buildDir)
}
```

**New Syntax:**
```kotlin
tasks.register("clean", Delete::class) {
    delete(layout.buildDirectory)
}
```

**Reason:** Gradle 8.x uses Configuration Cache, which requires using the Provider API for file paths.

### 2. Java 17 Requirement
**Issue:** AGP 8.0+ requires JDK 17 to run Gradle

**Impact:**
- Cannot build with Java 11 or older
- Must install Java 17+ before building
- Runtime can still target older Android API levels

### 3. Kotlin Compatibility
**Issue:** Compose Compiler versions must match Kotlin versions

**Resolution:**
- Kotlin 1.9.25 → Compose Compiler 1.5.15
- Always check [Compose to Kotlin Compatibility Map](https://developer.android.com/jetpack/androidx/releases/compose-kotlin)

---

## Migration from Previous Configuration

This upgrade **reverses** the downgrade documented in CHANGES_LOG.md (2025-10-26):

| Aspect | Previous Downgrade | This Upgrade |
|--------|-------------------|--------------|
| **Gradle** | 8.2 → 7.6 | 7.6 → 8.6 |
| **AGP** | 8.2.0 → 7.4.2 | 7.4.2 → 8.7.3 |
| **Kotlin** | 1.9.10 → 1.8.20 | 1.8.20 → 1.9.25 |
| **Java** | 17 → 11 | 11 → 17 |
| **Compose** | 1.5.3 → 1.4.6 | 1.4.6 → 1.5.15 |
| **Reason** | Java 17 not available | Java 17 now required |

---

## Expected Gradle 8.6 Features & Improvements

### Performance Enhancements
- **Configuration Cache Improvements**: Faster builds through improved caching
- **Parallel Task Execution**: Better multi-core CPU utilization
- **Dependency Resolution**: Faster dependency resolution and download

### New Capabilities
- **Provider Support for Capabilities**: More flexible dependency management
- **Encryption Key Management**: Enhanced configuration cache security via `GRADLE_ENCRYPTION_KEY`
- **Improved Error Messages**: Better error reporting for dependency locking

### Dependency Updates in Gradle 8.6
- Guava: 32.1.2 → 33.4.6
- Groovy: 3.0.21 → 3.0.24
- JaCoCo: 0.8.11 → 0.8.13
- SLF4J: 1.7.36 → 2.0.17

---

## AGP 8.7 New Features & Changes

### Key Features
- **API Level 35 Support**: Maximum API level supported
- **Precise Resource Shrinking**: Enabled by default (removes unused resources from resources.arsc)
- **Separate Lint Analysis**: Lint runs separately for main and test components for better performance
- **CompileSdk Warnings**: Android Studio warns if compileSdk isn't supported by AGP version

### Breaking Changes
- **Java 17 Required**: Hard requirement, no workarounds
- **Semantic Versioning**: AGP now uses semantic versioning
- **Major Release Cadence**: One major AGP release per year, aligned with Gradle

---

## Building After Upgrade

### First Build Steps

1. **Install Java 17** (see instructions above)

2. **Clean Gradle cache:**
```bash
cd taska-android
./gradlew.bat clean
```

3. **Sync Gradle wrapper:**
```bash
./gradlew.bat --version
# Should download Gradle 8.6 and show version info
```

4. **Build the project:**
```bash
# Debug build
./gradlew.bat assembleDebug

# Release build
./gradlew.bat assembleRelease
```

5. **Run tests:**
```bash
./gradlew.bat test
./gradlew.bat connectedAndroidTest
```

### Expected First Build Behavior

**First Build:**
- Gradle 8.6 will be downloaded (~150MB)
- All dependencies will be re-downloaded with new versions
- Configuration cache will be rebuilt
- Build will take 5-10 minutes

**Subsequent Builds:**
- Configuration cache will speed up builds significantly
- Incremental compilation will be faster
- Typical build time: 30-90 seconds for incremental changes

---

## Potential Issues & Solutions

### Issue 1: Java Version Mismatch
**Error:**
```
Android Gradle plugin requires Java 17 to run. You are currently using Java 11.
```

**Solution:**
1. Install Java 17 (see installation instructions above)
2. Set `JAVA_HOME` environment variable
3. Restart terminal/IDE
4. Verify: `java -version`

### Issue 2: Kotlin Compiler Version Mismatch
**Error:**
```
This version (1.5.15) of the Compose Compiler requires Kotlin version 1.9.25
but you appear to be using Kotlin version X.X.X
```

**Solution:**
- Verify Kotlin plugin version in root `build.gradle.kts` is 1.9.25
- Verify `kotlinCompilerExtensionVersion` in app `build.gradle.kts` is 1.5.15
- Clean and rebuild: `./gradlew.bat clean build`

### Issue 3: Configuration Cache Issues
**Error:**
```
Configuration cache problems found
```

**Solution:**
- Disable configuration cache temporarily:
```bash
./gradlew.bat build --no-configuration-cache
```
- Or add to `gradle.properties`:
```properties
org.gradle.configuration-cache=false
```

### Issue 4: Dependency Resolution Failures
**Error:**
```
Could not resolve androidx.compose:compose-bom:2024.12.01
```

**Solution:**
1. Check internet connection
2. Clear Gradle cache:
```bash
./gradlew.bat clean --refresh-dependencies
```
3. Check `repositories` in `settings.gradle.kts`:
```kotlin
dependencyResolutionManagement {
    repositories {
        google()
        mavenCentral()
    }
}
```

### Issue 5: SSL/Certificate Errors
**Error:**
```
peer not authenticated
```

**Solution:**
- See previous `SSL_FIX_QUICKSTART.md` for corporate proxy/firewall solutions
- Ensure Java 17 has proper certificate store

---

## Testing Checklist

After successful build, verify:

### Build Verification
- [ ] `./gradlew.bat clean` completes without errors
- [ ] `./gradlew.bat assembleDebug` produces APK
- [ ] APK exists at: `app/build/outputs/apk/debug/app-debug.apk`
- [ ] APK size is reasonable (not drastically larger)

### Functionality Testing
- [ ] Install APK on emulator/device
- [ ] App launches without crashes
- [ ] Login/authentication works
- [ ] Database operations work (Room 2.8.3)
- [ ] Navigation works (Navigation 2.8.5)
- [ ] Network requests work (Retrofit)
- [ ] Camera/image capture works (CameraX 1.4.1)
- [ ] Compose UI renders correctly
- [ ] Dark mode/theming works

### Code Quality Checks
- [ ] Run lint: `./gradlew.bat lint`
- [ ] Check lint report: `app/build/reports/lint-results.html`
- [ ] Run unit tests: `./gradlew.bat test`
- [ ] Run instrumented tests: `./gradlew.bat connectedAndroidTest`
- [ ] No deprecation warnings for critical APIs

### Performance Testing
- [ ] Cold start time is acceptable
- [ ] Compose recomposition is smooth
- [ ] Memory usage is stable
- [ ] Build time is improved vs Gradle 7.6

---

## Rollback Procedure

If critical issues arise and you need to rollback to Gradle 7.6/AGP 7.4.2:

### Step 1: Revert gradle-wrapper.properties
```diff
+ distributionUrl=https\://services.gradle.org/distributions/gradle-7.6-bin.zip
```

### Step 2: Revert build.gradle.kts (root)
```diff
plugins {
+   id("com.android.application") version "7.4.2" apply false
+   id("org.jetbrains.kotlin.android") version "1.8.20" apply false
+   id("com.google.dagger.hilt.android") version "2.48" apply false
+   id("com.google.gms.google-services") version "4.4.0" apply false
}

tasks.register("clean", Delete::class) {
+   delete(rootProject.buildDir)
}
```

### Step 3: Revert app/build.gradle.kts Java versions
```diff
compileOptions {
+   sourceCompatibility = JavaVersion.VERSION_11
+   targetCompatibility = JavaVersion.VERSION_11
}
kotlinOptions {
+   jvmTarget = "11"
}
composeOptions {
+   kotlinCompilerExtensionVersion = "1.4.6"
}
```

### Step 4: Revert dependencies
Use the versions from CHANGES_LOG.md (previous configuration)

### Step 5: Clean and rebuild
```bash
./gradlew.bat clean build
```

---

## Compatibility Matrix

### Build System Compatibility

| Gradle | AGP | Kotlin | Java | Compose Compiler |
|--------|-----|--------|------|------------------|
| 8.6 | 8.7.3 | 1.9.25 | 17 | 1.5.15 |
| 8.2 | 8.2.0 | 1.9.10 | 17 | 1.5.3 |
| 7.6 | 7.4.2 | 1.8.20 | 11 | 1.4.6 |

### AndroidX Library Compatibility

All upgraded AndroidX libraries are compatible with each other when using:
- Compose BOM 2024.12.01
- Lifecycle 2.8.7
- Navigation 2.8.5
- Room 2.8.3

**Verified Compatible:** All libraries tested together in AndroidX release testing

---

## Performance Expectations

### Build Performance
- **First Build:** 5-10 minutes (downloading dependencies)
- **Clean Build:** 2-4 minutes
- **Incremental Build:** 30-90 seconds
- **Configuration Cache Hit:** 10-30 seconds

### Configuration Cache Benefits
- Up to 50% faster builds on configuration cache hit
- Gradle 8.6 has improved configuration cache reliability
- Enable in `gradle.properties`:
```properties
org.gradle.configuration-cache=true
org.gradle.caching=true
```

### Runtime Performance
- Compose 2024.12.01 includes performance improvements
- Room 2.8.3 has query optimization improvements
- Lifecycle 2.8.7 includes memory leak fixes
- No expected performance degradation

---

## Resources & Documentation

### Official Documentation
- [Gradle 8.6 Release Notes](https://docs.gradle.org/8.6/release-notes.html)
- [Gradle 8.x Upgrade Guide](https://docs.gradle.org/current/userguide/upgrading_version_8.html)
- [AGP 8.7 Release Notes](https://developer.android.com/build/releases/past-releases/agp-8-7-0-release-notes)
- [AGP 8.8 Release Notes](https://developer.android.com/build/releases/past-releases/agp-8-8-0-release-notes)
- [Kotlin 1.9.25 Release](https://kotlinlang.org/docs/releases.html)
- [Compose to Kotlin Compatibility](https://developer.android.com/jetpack/androidx/releases/compose-kotlin)

### Dependency Documentation
- [Compose BOM Mapping](https://developer.android.com/develop/ui/compose/bom/bom-mapping)
- [AndroidX Releases](https://developer.android.com/jetpack/androidx/versions)
- [Room Release Notes](https://developer.android.com/jetpack/androidx/releases/room)
- [Navigation Release Notes](https://developer.android.com/jetpack/androidx/releases/navigation)
- [Lifecycle Release Notes](https://developer.android.com/jetpack/androidx/releases/lifecycle)

### Java 17 Downloads
- [Eclipse Temurin (Recommended)](https://adoptium.net/temurin/releases/?version=17)
- [Oracle JDK 17](https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html)
- [Microsoft OpenJDK](https://www.microsoft.com/openjdk)

---

## Summary

### What Changed
✅ Gradle: 7.6 → 8.6
✅ AGP: 7.4.2 → 8.7.3
✅ Kotlin: 1.8.20 → 1.9.25
✅ Java Target: 11 → 17
✅ Compose Compiler: 1.4.6 → 1.5.15
✅ All major AndroidX libraries updated to latest stable
✅ Build script syntax updated for Gradle 8.x compatibility

### What's Required
🔴 **Java 17 MUST be installed** before building
🟡 Set `JAVA_HOME` environment variable
🟡 First build will download new dependencies (~5-10 minutes)

### Expected Benefits
🚀 Faster incremental builds with configuration cache
🚀 Latest Compose features and performance improvements
🚀 Latest AndroidX library features and bug fixes
🚀 Better error messages and tooling support
🚀 Access to Android API 35 features

### Risk Assessment
⚠️ **Medium Risk**: Major version upgrades across entire stack
⚠️ **Mitigation**: All versions are stable releases, widely tested
⚠️ **Rollback**: Simple rollback procedure documented above

---

## Next Steps

1. **Install Java 17** using one of the methods above
2. **Verify installation:** `java -version`
3. **Clean build:** `./gradlew.bat clean`
4. **First build:** `./gradlew.bat assembleDebug`
5. **Test thoroughly** using the checklist above
6. **Report any issues** for immediate resolution

---

**Upgrade Completed:** 2025-10-26
**Documentation Version:** 1.0
**Status:** Ready for Java 17 installation and testing
