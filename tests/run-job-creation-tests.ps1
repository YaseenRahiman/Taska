# Job Creation Test Suite Runner (PowerShell)
# Runs all job creation tests and generates comprehensive report

Write-Host "🧪 Taska Job Creation Test Suite" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if servers are running
Write-Host "🔍 Checking if servers are running..." -ForegroundColor Yellow

try {
    $frontendCheck = Invoke-WebRequest -Uri "http://localhost:3001" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
    Write-Host "✅ Frontend server running on port 3001" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend server not running on port 3001" -ForegroundColor Red
    Write-Host "Please start frontend: cd frontend && npm run dev" -ForegroundColor Yellow
    exit 1
}

try {
    $backendCheck = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
    Write-Host "✅ Backend server running on port 3000" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend server not running on port 3000" -ForegroundColor Red
    Write-Host "Please start backend: cd backend && npm run start:dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Create output directories
$null = New-Item -ItemType Directory -Force -Path "claudedocs\test-reports\detailed"
$null = New-Item -ItemType Directory -Force -Path "test-results\screenshots"

# Test execution
Write-Host "🚀 Running Job Creation Tests..." -ForegroundColor Cyan
Write-Host ""

# Run tests based on argument or run all
$testType = $args[0]

switch ($testType) {
    "direct" {
        Write-Host "📝 Running: Direct Page Flow Test" -ForegroundColor Yellow
        npx playwright test tests/e2e/job-creation-category-fix.spec.ts --project=chromium
    }
    "modal" {
        Write-Host "📝 Running: Dashboard Modal Flow Test" -ForegroundColor Yellow
        npx playwright test tests/e2e/job-creation-dashboard-modal.spec.ts --project=chromium
    }
    "db" {
        Write-Host "📝 Running: Database Verification Test" -ForegroundColor Yellow
        npx playwright test tests/e2e/job-creation-database-verification.spec.ts --project=chromium
    }
    "comprehensive" {
        Write-Host "📝 Running: Comprehensive Test Suite" -ForegroundColor Yellow
        npx playwright test tests/e2e/job-creation-comprehensive.spec.ts --project=chromium
    }
    default {
        Write-Host "📝 Running: All Job Creation Tests" -ForegroundColor Yellow
        npx playwright test tests/e2e/job-creation-*.spec.ts --project=chromium
    }
}

# Check test results
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ All tests passed!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Some tests failed" -ForegroundColor Red
    Write-Host ""
}

# Generate report summary
Write-Host "📊 Test Report Summary" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host ""

if (Test-Path "claudedocs\test-reports\results.json") {
    Write-Host "📄 Detailed results: claudedocs\test-reports\results.json"
    Write-Host "📄 JUnit report: claudedocs\test-reports\junit.xml"
    Write-Host "🌐 HTML report: claudedocs\test-reports\html\index.html"
    Write-Host ""

    # Parse and display stats
    $results = Get-Content "claudedocs\test-reports\results.json" | ConvertFrom-Json
    Write-Host "Test Statistics:"
    $total = $results.stats.expected + $results.stats.unexpected + $results.stats.skipped
    $duration = [math]::Round($results.stats.duration / 1000, 2)
    Write-Host "  Total: $total"
    Write-Host "  Passed: $($results.stats.expected)" -ForegroundColor Green
    Write-Host "  Failed: $($results.stats.unexpected)" -ForegroundColor Red
    Write-Host "  Skipped: $($results.stats.skipped)" -ForegroundColor Yellow
    Write-Host "  Duration: ${duration}s"
}

Write-Host ""
Write-Host "📸 Screenshots: test-results\"
Write-Host "📋 Detailed reports: claudedocs\test-reports\detailed\"
Write-Host ""

# Open HTML report if available
if (Test-Path "claudedocs\test-reports\html\index.html") {
    Write-Host "💡 To view HTML report, run:" -ForegroundColor Cyan
    Write-Host "   npx playwright show-report claudedocs\test-reports\html"
}

Write-Host ""
Write-Host "✅ Test execution complete!" -ForegroundColor Green
