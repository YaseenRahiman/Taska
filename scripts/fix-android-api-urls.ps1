# Fix Android API Base URLs - Add /api/v1/ prefix
# This script fixes the registration "not found" error

$gradleFile = "C:\Users\Yaseen\OneDrive\Documents\Investments\Taska\taska-android\app\build.gradle.kts"

Write-Host "Fixing Android API Base URLs..." -ForegroundColor Cyan
Write-Host "File: $gradleFile" -ForegroundColor Gray

# Read the file content
$content = Get-Content $gradleFile -Raw

# Backup original file
$backupFile = "$gradleFile.backup"
Copy-Item $gradleFile $backupFile -Force
Write-Host "Backup created: $backupFile" -ForegroundColor Green

# Fix 1: Line 27 - defaultConfig API_BASE_URL
$content = $content -replace 'buildConfigField\("String", "API_BASE_URL", "\"https://api\.taska\.co\.za\""\)', 'buildConfigField("String", "API_BASE_URL", "\"https://api.taska.co.za/api/v1/\"")'

# Fix 2: Line 41 - release API_BASE_URL
$content = $content -replace '// Release-specific config\s+buildConfigField\("String", "API_BASE_URL", "\"https://api\.taska\.co\.za\""\)', '// Release-specific config
            buildConfigField("String", "API_BASE_URL", "\"https://api.taska.co.za/api/v1/\"")'

# Fix 3: Line 46 - debug API_BASE_URL (MOST IMPORTANT)
$content = $content -replace 'buildConfigField\("String", "API_BASE_URL", "\"http://10\.0\.2\.2:3000\""\)', 'buildConfigField("String", "API_BASE_URL", "\"http://10.0.2.2:3000/api/v1/\"")'

# Write the fixed content
Set-Content $gradleFile $content -NoNewline

Write-Host ""
Write-Host "✓ Fixed Line 27: defaultConfig API_BASE_URL" -ForegroundColor Green
Write-Host "✓ Fixed Line 41: release API_BASE_URL" -ForegroundColor Green
Write-Host "✓ Fixed Line 46: debug API_BASE_URL (critical fix)" -ForegroundColor Green
Write-Host ""
Write-Host "All API URLs updated to include /api/v1/ prefix" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. cd taska-android" -ForegroundColor White
Write-Host "2. .\gradlew.bat clean assembleDebug" -ForegroundColor White
Write-Host "3. Install and test the app" -ForegroundColor White
Write-Host ""
Write-Host "If you need to rollback, restore from backup file" -ForegroundColor Gray
