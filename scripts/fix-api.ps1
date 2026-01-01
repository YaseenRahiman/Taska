$file = "C:\Users\Yaseen\OneDrive\Documents\Investments\Taska\taska-android\app\build.gradle.kts"
$backup = "$file.backup"

Write-Host "Creating backup..." -ForegroundColor Cyan
Copy-Item $file $backup -Force

Write-Host "Reading file..." -ForegroundColor Cyan
$content = Get-Content $file -Raw

Write-Host "Applying fixes..." -ForegroundColor Cyan
$content = $content -replace '"https://api\.taska\.co\.za"', '"https://api.taska.co.za/api/v1/"'
$content = $content -replace '"http://10\.0\.2\.2:3000"', '"http://10.0.2.2:3000/api/v1/"'

Write-Host "Writing changes..." -ForegroundColor Cyan
Set-Content $file $content -NoNewline

Write-Host "Done! All API URLs fixed." -ForegroundColor Green
Write-Host "Backup saved to: $backup" -ForegroundColor Gray
