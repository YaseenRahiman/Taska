# PowerShell Script to Fix Playwright Authentication Test Failures
# This script fixes the race condition between cookie setting and navigation

Write-Host "🔧 Fixing Playwright Authentication Test Failures..." -ForegroundColor Cyan
Write-Host ""

# File paths
$authProviderPath = "frontend\src\components\providers\auth-provider.tsx"
$testHelperPath = "frontend\tests\e2e\helpers\user-management.helper.ts"

Write-Host "📁 Target files:" -ForegroundColor Yellow
Write-Host "  1. $authProviderPath"
Write-Host "  2. $testHelperPath"
Write-Host ""

# Backup files
Write-Host "💾 Creating backups..." -ForegroundColor Yellow
Copy-Item $authProviderPath "$authProviderPath.backup"
Copy-Item $testHelperPath "$testHelperPath.backup"
Write-Host "  ✅ Backups created" -ForegroundColor Green
Write-Host ""

# Fix 1: Auth Provider - Replace router.push with window.location.href
Write-Host "🔧 Fix 1: Updating auth-provider.tsx..." -ForegroundColor Yellow

$authContent = Get-Content $authProviderPath -Raw

# Fix login function
$authContent = $authContent -replace `
  '(\s+)// Wait for React state to flush before navigation\r?\n\s+await new Promise\(resolve => setTimeout\(resolve, 0\)\);\r?\n\r?\n\s+// Determine redirect', `
  '$1// Determine redirect'

$authContent = $authContent -replace `
  "console\.log\('\[AuthProvider\] Login successful, redirecting to:', redirectPath\);\r?\n\r?\n(\s+)// Perform redirect after state is settled\r?\n\s+router\.push\(redirectPath\);", `
  "console.log('[AuthProvider] Login successful, redirecting to:', redirectPath);`n`n`$1// Wait for cookies and state to fully settle`n`$1await new Promise(resolve => setTimeout(resolve, 150));`n`n`$1// Use window.location for immediate, reliable full-page redirect`n`$1// This ensures cookies are readable by middleware`n`$1window.location.href = redirectPath;"

# Fix register function
$authContent = $authContent -replace `
  "console\.log\('\[AuthProvider\] Registration successful, redirecting to:', redirectPath\);\r?\n\r?\n(\s+)// Perform redirect after state is settled\r?\n\s+router\.push\(redirectPath\);", `
  "console.log('[AuthProvider] Registration successful, redirecting to:', redirectPath);`n`n`$1// Wait for cookies and state to fully settle`n`$1await new Promise(resolve => setTimeout(resolve, 150));`n`n`$1// Use window.location for immediate, reliable full-page redirect`n`$1// This ensures cookies are readable by middleware`n`$1window.location.href = redirectPath;"

Set-Content -Path $authProviderPath -Value $authContent
Write-Host "  ✅ auth-provider.tsx updated" -ForegroundColor Green
Write-Host ""

# Fix 2: Test Helper - Add better wait conditions
Write-Host "🔧 Fix 2: Updating user-management.helper.ts..." -ForegroundColor Yellow

$helperContent = Get-Content $testHelperPath -Raw

# Improve createUser wait conditions
$helperContent = $helperContent -replace `
  "await page\.waitForURL\(/\\\\\\/\(client\|artisan\|admin\)\\\\\\/dashboard/, \{ timeout: 30000 \}\);(\r?\n\r?\n\s+)// If redirected to login", `
  "await page.waitForURL(/\(client|artisan|admin)\/dashboard/, { timeout: 30000 });`n`n      // Wait for dashboard content to render`n      await page.waitForSelector('[data-testid=`"dashboard-content`"], h1, main', {`n        state: 'visible',`n        timeout: 10000`n      }).catch(() => console.warn('Dashboard content not found, continuing'));`n`n      // Wait for network to settle`n      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});`$1// If redirected to login"

# Improve loginWithUser wait conditions
$helperContent = $helperContent -replace `
  "await page\.waitForURL\(/\\\\\\/\(client\|artisan\|admin\)\\\\\\/dashboard/, \{ timeout: 30000 \}\);(\r?\n\r?\n\s+)// Wait for dashboard to fully load", `
  "await page.waitForURL(/\(client|artisan|admin)\/dashboard/, { timeout: 30000 });`n`n    // Wait for dashboard content to render`n    await page.waitForSelector('[data-testid=`"dashboard-content`"], h1, main', {`n      state: 'visible',`n      timeout: 10000`n    }).catch(() => console.warn('Dashboard content not found, continuing'));`$1// Wait for dashboard to fully load"

Set-Content -Path $testHelperPath -Value $helperContent
Write-Host "  ✅ user-management.helper.ts updated" -ForegroundColor Green
Write-Host ""

Write-Host "✨ All fixes applied successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Review the changes in the modified files"
Write-Host "  2. Run: cd frontend && npx playwright test"
Write-Host "  3. Verify all 158 tests pass"
Write-Host ""
Write-Host "💡 Backups created:" -ForegroundColor Cyan
Write-Host "  - $authProviderPath.backup"
Write-Host "  - $testHelperPath.backup"
Write-Host ""
Write-Host "🔄 To rollback: " -ForegroundColor Yellow
Write-Host "  Copy-Item '$authProviderPath.backup' '$authProviderPath' -Force"
Write-Host "  Copy-Item '$testHelperPath.backup' '$testHelperPath' -Force"
