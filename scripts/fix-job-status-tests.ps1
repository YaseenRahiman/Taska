# PowerShell Script to Add isDraft: false to All Test Job Data
# This ensures jobs are created as OPEN instead of DRAFT in E2E tests

$testDir = "C:\Users\Yaseen\OneDrive\Documents\Investments\Taska\backend\test"
$testFiles = Get-ChildItem -Path $testDir -Filter "*.e2e-spec.ts"
$totalFixed = 0
$filesModified = @()

Write-Host "`n🔧 Starting automated job status fix...`n" -ForegroundColor Cyan

foreach ($file in $testFiles) {
    $filePath = $file.FullName
    $content = Get-Content -Path $filePath -Raw
    $originalContent = $content
    $modified = $false

    # Pattern 1: jobData objects ending with requirements: []
    $pattern1 = '(requirements:\s*\[\])\s*\n(\s+)\};'
    if ($content -match $pattern1) {
        $content = $content -replace $pattern1, "`$1,`n`$2  isDraft: false // Publish job immediately for E2E testing`n`$2};"
        $modified = $true
    }

    # Pattern 2: jobData objects ending with images: []
    $pattern2 = '(images:\s*\[\])\s*\n(\s+)\};'
    if ($content -match $pattern2) {
        $content = $content -replace $pattern2, "`$1,`n`$2  isDraft: false // Publish job immediately for E2E testing`n`$2};"
        $modified = $true
    }

    # Pattern 3: jobData objects ending with longitude coordinate
    $pattern3 = '(longitude:\s*[\d.-]+)\s*\n(\s+)\};'
    if ($content -match $pattern3 -and $content -notmatch 'isDraft') {
        $content = $content -replace $pattern3, "`$1,`n`$2  isDraft: false // Publish job immediately for E2E testing`n`$2};"
        $modified = $true
    }

    # Only write if content actually changed and doesn't already have isDraft
    if ($modified -and $content -ne $originalContent) {
        # Count how many times we added isDraft
        $addedCount = ([regex]::Matches($content, 'isDraft: false')).Count - ([regex]::Matches($originalContent, 'isDraft: false')).Count

        if ($addedCount -gt 0) {
            Set-Content -Path $filePath -Value $content -NoNewline
            $totalFixed += $addedCount
            $filesModified += $file.Name
            Write-Host "  ✅ $($file.Name) - Added isDraft to $addedCount job data object(s)" -ForegroundColor Green
        }
    }
}

Write-Host "`n📊 Summary:" -ForegroundColor Cyan
Write-Host "  Files modified: $($filesModified.Count)" -ForegroundColor Yellow
Write-Host "  Total job data objects fixed: $totalFixed" -ForegroundColor Yellow

if ($totalFixed -gt 0) {
    Write-Host "`n✨ Success! All test files have been updated." -ForegroundColor Green
    Write-Host "`n📋 Modified files:" -ForegroundColor Cyan
    foreach ($fileName in $filesModified) {
        Write-Host "    - $fileName" -ForegroundColor Gray
    }
} else {
    Write-Host "`n⚠️  No changes made. Files may already be fixed." -ForegroundColor Yellow
}

Write-Host "`n"
