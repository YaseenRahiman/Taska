# Clear Next.js Build Cache Script
# Purpose: Remove corrupted .next build cache to resolve module resolution errors

Write-Host "=== Next.js Cache Cleaner ===" -ForegroundColor Cyan
Write-Host ""

$frontendPath = Join-Path $PSScriptRoot "..\frontend"
$nextCachePath = Join-Path $frontendPath ".next"

if (Test-Path $nextCachePath) {
    Write-Host "Found .next cache directory at: $nextCachePath" -ForegroundColor Yellow
    Write-Host "Removing cache..." -ForegroundColor Yellow

    try {
        Remove-Item -Recurse -Force $nextCachePath
        Write-Host "✓ Cache cleared successfully!" -ForegroundColor Green
    } catch {
        Write-Host "✗ Error clearing cache: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "No .next cache directory found. Nothing to clear." -ForegroundColor Green
}

Write-Host ""
Write-Host "You can now run 'npm run dev' or 'npm run build'" -ForegroundColor Cyan
