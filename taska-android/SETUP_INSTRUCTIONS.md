# Taska Android App - Setup Instructions

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)
1. **Double-click** `setup-and-run.bat`
2. Wait for Android Studio to open
3. Follow the on-screen instructions

### Option 2: Manual Setup

#### Prerequisites
- ✅ **Java JDK 11+** (Already installed: Java 8 & 11 detected)
- ✅ **Android Studio** (Already installed)
- ✅ **Android SDK 34** (Already installed)

#### Step-by-Step Instructions

1. **Open Android Studio**
   ```
   Start Menu → Android Studio
   ```

2. **Open the Project**
   - Click "Open" or "File → Open"
   - Navigate to: `C:\Users\Yaseen\OneDrive\Documents\Investments\Taska\taska-android`
   - Click "OK"

3. **Trust the Project**
   - When prompted, click "Trust Project"

4. **Wait for Gradle Sync**
   - Android Studio will automatically download dependencies
   - This may take 5-10 minutes on first run
   - Progress shown in bottom status bar

5. **Create an Emulator** (if you don't have one)
   - Click "Tools → Device Manager"
   - Click "Create Device"
   - Select "Phone → Pixel 5" (or any modern phone)
   - Click "Next"
   - Select "API 34" (Android 14.0)
   - Click "Next" → "Finish"

6. **Run the App**
   - Click the green "Run" button (▶️) or press `Shift + F10`
   - Select your emulator or connected device
   - Wait for app to build and launch

---

## 📱 Testing the App

### First Launch Flow
1. **Splash Screen** (1.5 seconds)
   - Shows Taska logo and loading indicator
   - Checks for existing authentication

2. **Login Screen**
   - Click "Don't have an account? Register"

3. **Registration (4 Steps)**
   - **Step 1:** Enter First and Last Name
   - **Step 2:** Enter Email and Phone (0XX XXX XXXX)
   - **Step 3:** (Optional) Enter Bio
   - **Step 4:** Create Password (min 8 characters)
   - Click "Finish"

4. **Backend Connection**
   - App will try to connect to backend
   - **Debug mode:** Expects backend at `http://10.0.2.2:3000`
   - **Production mode:** Uses `https://api.taska.co.za`

---

## 🔧 Backend Setup (For Full Testing)

### Start Backend Server
```bash
cd C:\Users\Yaseen\OneDrive\Documents\Investments\Taska\backend
npm run start:dev
```

Backend will run on: `http://localhost:3000`
Android emulator accesses it via: `http://10.0.2.2:3000`

---

## ⚙️ Environment Configuration

### Debug vs Release Builds

**Debug Build** (Default for development)
- API URL: `http://10.0.2.2:3000` (local backend)
- No code optimization
- Full logging enabled

**Release Build** (For production)
- API URL: `https://api.taska.co.za`
- ProGuard enabled (code minification)
- Optimized for app stores

### Change Build Variant
1. In Android Studio: "Build → Select Build Variant"
2. Choose "debug" or "release"

---

## 📊 Project Structure

```
taska-android/
├── app/
│   ├── src/
│   │   └── main/
│   │       ├── kotlin/za/co/taska/
│   │       │   ├── presentation/      # UI (Screens, Components)
│   │       │   ├── domain/            # Business Logic
│   │       │   ├── data/              # Repositories, API, Database
│   │       │   └── di/                # Dependency Injection
│   │       ├── res/                   # Resources (layouts, strings, colors)
│   │       └── AndroidManifest.xml
│   └── build.gradle.kts               # App dependencies
├── build.gradle.kts                   # Project configuration
├── settings.gradle.kts                # Gradle settings
└── gradle.properties                  # Gradle properties
```

---

## 🐛 Troubleshooting

### "Gradle Sync Failed"
- Click "File → Invalidate Caches → Invalidate and Restart"
- Wait for Android Studio to restart and re-sync

### "SDK Not Found"
- Click "Tools → SDK Manager"
- Ensure "Android 14.0 (API 34)" is installed
- SDK Location should be: `C:\Users\Yaseen\AppData\Local\Android\Sdk`

### "Emulator Won't Start"
- Check "Tools → Device Manager"
- Delete and recreate the emulator
- Ensure HAXM or Hyper-V is enabled in BIOS

### "Cannot Connect to Backend"
**If using local backend:**
1. Start backend: `cd backend && npm run start:dev`
2. Verify backend is running: Open browser to `http://localhost:3000`
3. Android emulator uses `10.0.2.2` to access host machine's localhost

**If backend not running:**
- App will show connection errors
- Some features (login, registration) won't work
- Offline features (cached data) will still work

### "Build Takes Too Long"
- First build downloads ~500MB of dependencies
- Subsequent builds are much faster (30-60 seconds)
- Enable "File → Settings → Build → Compiler → Parallel compilation"

---

## 📋 Checklist Before First Run

- ✅ Android Studio installed
- ✅ Java JDK installed (version 11+)
- ✅ Android SDK 34 installed
- ✅ Project opened in Android Studio
- ✅ Gradle sync completed successfully
- ✅ Emulator created (or device connected)
- ⏳ Backend running (optional, for full features)

---

## 🎯 What's Implemented (Phase 2 Complete)

### ✅ Working Features
- **Navigation System** - Splash → Login → Register flow
- **Authentication** - Login and 4-step registration
- **Form Validation** - Email, password, SA phone numbers
- **Location Services** - Permission handling, distance calculation
- **UI Components** - Button, TextField, PasswordField, Error messages
- **Offline-First** - Room database caching
- **Material 3 Design** - Taska colors (#16A085 teal)

### ⏳ Coming in Phase 3
- Jobs feed with location-based sorting
- Job details screen
- Bid placement
- Image upload
- Real-time messaging
- Profile management

---

## 📞 Need Help?

**Common Issues:**
1. **Gradle errors** → Clean project: "Build → Clean Project"
2. **Emulator slow** → Allocate more RAM in Device Manager
3. **App crashes** → Check Logcat in Android Studio (bottom panel)

**Development Resources:**
- Android Studio Docs: https://developer.android.com/studio
- Kotlin Docs: https://kotlinlang.org/docs
- Jetpack Compose: https://developer.android.com/jetpack/compose

---

**Happy Testing! 🚀**
