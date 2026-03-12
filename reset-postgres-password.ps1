# PostgreSQL Password Reset Script
# This script helps you reset the PostgreSQL password

$ErrorActionPreference = "Stop"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  PostgreSQL Password Reset Helper" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Find PostgreSQL data directory
$pgVersion = "18"
$pgDataPath = "C:\Program Files\PostgreSQL\$pgVersion\data"
$pgHbaConf = "$pgDataPath\pg_hba.conf"
$pgBinPath = "C:\Program Files\PostgreSQL\$pgVersion\bin"

Write-Host "Step 1: Stopping PostgreSQL service..." -ForegroundColor Yellow
Stop-Service -Name "postgresql-$pgVersion" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "Step 2: Backing up pg_hba.conf..." -ForegroundColor Yellow
Copy-Item $pgHbaConf "$pgHbaConf.backup" -Force
Write-Host "  Backup created: $pgHbaConf.backup"

Write-Host ""
Write-Host "Step 3: Modifying pg_hba.conf for trust authentication..." -ForegroundColor Yellow
$content = Get-Content $pgHbaConf -Raw
# Replace scram-sha-256 with trust for local connections
$content = $content -replace 'host\s+all\s+all\s+127\.0\.0\.1/32\s+scram-sha-256', 'host all all 127.0.0.1/32 trust'
$content = $content -replace 'host\s+all\s+all\s+::1/128\s+scram-sha-256', 'host all all ::1/128 trust'
Set-Content $pgHbaConf $content -NoNewline
Write-Host "  pg_hba.conf updated"

Write-Host ""
Write-Host "Step 4: Starting PostgreSQL service..." -ForegroundColor Yellow
Start-Service -Name "postgresql-$pgVersion" -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "Step 5: Setting password..." -ForegroundColor Yellow
& "$pgBinPath\psql.exe" -h localhost -U postgres -c "ALTER USER postgres WITH PASSWORD 'postgres';"

Write-Host ""
Write-Host "Step 6: Restoring original pg_hba.conf..." -ForegroundColor Yellow
Copy-Item "$pgHbaConf.backup" $pgHbaConf -Force
Write-Host "  Original configuration restored"

Write-Host ""
Write-Host "Step 7: Restarting PostgreSQL service..." -ForegroundColor Yellow
Restart-Service -Name "postgresql-$pgVersion" -Force
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  DONE! Password has been set to: postgres" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Now you can run: npm start" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
