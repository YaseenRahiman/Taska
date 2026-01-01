@echo off
echo ========================================
echo Taska Android App - Setup and Run
echo ========================================
echo.

REM Set environment variables
set ANDROID_HOME=C:\Users\Yaseen\AppData\Local\Android\Sdk
set ANDROID_SDK_ROOT=%ANDROID_HOME%
set PATH=%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools;%ANDROID_HOME%\emulator;%PATH%

echo [1/5] Environment variables set
echo ANDROID_HOME: %ANDROID_HOME%
echo.

REM Navigate to project directory
cd /d "%~dp0"
echo [2/5] Project directory: %CD%
echo.

REM Check for gradlew
if exist "gradlew.bat" (
    echo [3/5] Gradle wrapper found
) else (
    echo [3/5] Creating Gradle wrapper...
    gradle wrapper
)
echo.

REM Make gradlew executable
echo [4/5] Setting up Gradle permissions
echo.

REM Open Android Studio with the project
echo [5/5] Opening Android Studio...
echo.
echo ========================================
echo Opening Taska project in Android Studio
echo ========================================
echo.
echo Please wait for Android Studio to load...
echo.
echo NEXT STEPS IN ANDROID STUDIO:
echo 1. Wait for Gradle sync to complete
echo 2. Click "Trust Project" if prompted
echo 3. Wait for dependencies to download
echo 4. Create or start an emulator (Tools ^> Device Manager)
echo 5. Click the green "Run" button (or Shift+F10)
echo.

start "" "C:\Program Files\Android\Android Studio\bin\studio64.exe" "%CD%"

echo.
echo Android Studio is starting...
echo This window will close in 10 seconds.
timeout /t 10
