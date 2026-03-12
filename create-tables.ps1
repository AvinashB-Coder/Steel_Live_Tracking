# Create Route Cards Table with password
$env:PGPASSWORD = "postgres"
$psqlPath = "C:\Program Files\PostgreSQL\18\pgAdmin 4\runtime\psql.exe"
$sqlFile = "C:\Users\babua\Downloads\steel_live\route_cards.sql"

Write-Host "=== Creating Route Cards Table ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Using: $psqlPath"
Write-Host "SQL File: $sqlFile"
Write-Host ""

& $psqlPath -h localhost -U postgres -d steel_tracking -f $sqlFile

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ SUCCESS! Route cards table created." -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "⚠️  Table might already exist or there was an error." -ForegroundColor Yellow
    Write-Host ""
}

Remove-Item Env:\PGPASSWORD
