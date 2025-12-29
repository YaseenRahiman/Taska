# Maestro E2E Tests for Taska Android

## Setup

### 1. Install Maestro

**macOS/Linux**:
```bash
curl -Ls "https://get.maestro.dev" | bash
```

**Windows**:
```bash
# Download installer from https://maestro.dev
# Or use WSL2 and run Linux commands
```

### 2. Verify Installation

```bash
maestro --version
```

## Running Tests

### Prerequisites

1. Backend server must be running:
   ```bash
   cd backend
   npm run dev
   ```

2. Android emulator running OR physical device connected:
   ```bash
   adb devices
   ```

3. App installed on device:
   ```bash
   cd taska-android
   ./gradlew installDebug
   ```

### Run Single Flow

```bash
# From project root
maestro test taska-android/.maestro/flows/registration-flow.yaml

# With custom email
maestro test taska-android/.maestro/flows/login-flow.yaml \
  -e TEST_EMAIL=user@example.com \
  -e TEST_PASSWORD=MyPassword123!
```

### Run All Flows

```bash
maestro test taska-android/.maestro/flows/
```

### Run with Cloud Recording

```bash
# Sign up at https://console.mobile.dev
maestro cloud taska-android/.maestro/flows/registration-flow.yaml
```

## Test Flows

### 1. `registration-flow.yaml`

Tests the complete 4-step registration process:
- Step 1: Personal details (first/last name)
- Step 2: Contact info (email/phone)
- Step 3: Skills selection (optional)
- Step 4: Password creation

**Expected outcome**: User registered and logged in

### 2. `login-flow.yaml`

Tests authentication with existing credentials.

**Expected outcome**: User logged into dashboard

## Writing New Tests

### Basic Structure

```yaml
appId: za.co.taska.artisan
---
# Test description

- launchApp
- tapOn: "Button Text"
- inputText: "Some text"
- assertVisible: "Expected Element"
```

### Common Commands

```yaml
# Navigation
- tapOn: "Button"
- swipe:
    direction: UP

# Input
- inputText: "Text to type"
- hideKeyboard

# Assertions
- assertVisible: "Text or ID"
- assertNotVisible: "Text or ID"

# Waits
- waitForAnimationToEnd
- wait:
    milliseconds: 2000

# Conditional
- runFlow:
    when:
      visible: "Element"
    file: other-flow.yaml
```

### Best Practices

1. **Use unique identifiers**: Add `testTag` to Compose components
2. **Wait for animations**: Use `waitForAnimationToEnd` after navigation
3. **Hide keyboard**: Call `hideKeyboard` after text input
4. **Make tests independent**: Use `clearState: true` in `launchApp`
5. **Use environment variables**: For sensitive data or configurable values

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [pull_request]

jobs:
  maestro:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Android SDK
        uses: android-actions/setup-android@v2

      - name: Install Maestro
        run: curl -Ls "https://get.maestro.dev" | bash

      - name: Start Backend
        run: |
          cd backend
          npm install
          npm run dev &
          sleep 10

      - name: Build APK
        run: |
          cd taska-android
          ./gradlew assembleDebug

      - name: Start Emulator
        run: |
          echo "no" | avdmanager create avd -n test -k "system-images;android-30;google_apis;x86_64"
          emulator -avd test -no-window &
          adb wait-for-device

      - name: Run Tests
        run: maestro test taska-android/.maestro/flows/

      - name: Upload Results
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: maestro-results
          path: ~/.maestro/tests/
```

## Troubleshooting

### Tests Fail to Find Elements

1. Check element text matches exactly (case-sensitive)
2. Use Maestro Studio to inspect UI: `maestro studio`
3. Add test tags to Compose components:
   ```kotlin
   Button(
       modifier = Modifier.testTag("loginButton"),
       onClick = { }
   ) { Text("Login") }
   ```

### App Doesn't Launch

1. Verify app is installed: `adb shell pm list packages | grep taska`
2. Check correct app ID in config
3. Increase launch timeout in `maestro.config.yaml`

### Backend Connection Fails

1. Verify backend is running: `curl http://localhost:3000/api/docs`
2. Check Android emulator can reach host: `adb shell ping 10.0.2.2`
3. Verify API_BASE_URL in app config includes `/api/v1/`

## Resources

- [Maestro Documentation](https://maestro.dev/docs)
- [Maestro GitHub](https://github.com/mobile-dev-inc/maestro)
- [Maestro Cloud Console](https://console.mobile.dev)
- [Command Reference](https://maestro.dev/docs/api-reference)
