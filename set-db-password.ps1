# Set PostgreSQL Password Script
$psqlPath = "C:\Program Files\PostgreSQL\18\pgAdmin 4\runtime\psql.exe"
$sql = "ALTER USER postgres WITH PASSWORD 'postgres';"

Write-Host "=== Setting PostgreSQL Password ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Using: $psqlPath"
Write-Host "SQL: $sql"
Write-Host ""

& $psqlPath -h localhost -U postgres -c $sql

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ SUCCESS! Password set to: postgres" -ForegroundColor Green
    Write-Host ""
    Write-Host "Now run: npm start" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "❌ FAILED! Check if PostgreSQL is running." -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternative: Use pgAdmin 4 GUI to set password" -ForegroundColor Yellow
}
