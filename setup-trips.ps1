# ============================================
# Trip Management Database Setup Script
# ============================================
# This script creates the trips table in your PostgreSQL database

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Trip Management Database Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$dbName = "steel_tracking"
$dbUser = "steel_user"
$sqlFile = "sql\trips.sql"

# Check if SQL file exists
if (-Not (Test-Path $sqlFile)) {
    Write-Host "Error: SQL file not found at $sqlFile" -ForegroundColor Red
    exit 1
}

Write-Host "Database: $dbName" -ForegroundColor Yellow
Write-Host "User: $dbUser" -ForegroundColor Yellow
Write-Host "SQL File: $sqlFile" -ForegroundColor Yellow
Write-Host ""

# Prompt for confirmation
$confirmation = Read-Host "Do you want to run the trips table migration? (y/n)"
if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
    Write-Host "Migration cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Running migration..." -ForegroundColor Green

# Run the SQL script
try {
    psql -U $dbUser -d $dbName -f $sqlFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "==========================================" -ForegroundColor Green
        Write-Host "  Migration completed successfully!" -ForegroundColor Green
        Write-Host "==========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "You can now:" -ForegroundColor Cyan
        Write-Host "  1. Start the server: npm run dev" -ForegroundColor White
        Write-Host "  2. Login as admin" -ForegroundColor White
        Write-Host "  3. Navigate to Trip Management tab" -ForegroundColor White
        Write-Host "  4. Create and manage trips" -ForegroundColor White
        Write-Host ""
    } else {
        throw "psql exited with code $LASTEXITCODE"
    }
} catch {
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Red
    Write-Host "  Migration failed!" -ForegroundColor Red
    Write-Host "==========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting tips:" -ForegroundColor Yellow
    Write-Host "  1. Ensure PostgreSQL is running" -ForegroundColor White
    Write-Host "  2. Check that database '$dbName' exists" -ForegroundColor White
    Write-Host "  3. Verify user '$dbUser' has proper permissions" -ForegroundColor White
    Write-Host "  4. Make sure psql is in your PATH" -ForegroundColor White
    Write-Host ""
    exit 1
}
