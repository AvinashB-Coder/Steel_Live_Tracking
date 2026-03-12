# ============================================
# TRIP TABLE SETUP - Automated Script
# ============================================
# This script will check and create the trips table

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Trip Management - Database Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$dbName = "steel_tracking"
$sqlFile = "sql\trips-quick-setup.sql"

Write-Host "Database: $dbName" -ForegroundColor Yellow
Write-Host "SQL File: $sqlFile" -ForegroundColor Yellow
Write-Host ""

# Check if SQL file exists
if (-Not (Test-Path $sqlFile)) {
    Write-Host "❌ Error: SQL file not found at $sqlFile" -ForegroundColor Red
    Write-Host ""
    Write-Host "Creating the SQL file..." -ForegroundColor Yellow
    
    $sqlContent = @"
-- Quick Trip Setup
CREATE TABLE IF NOT EXISTS trips (
    id SERIAL PRIMARY KEY,
    trip_number VARCHAR(50) UNIQUE NOT NULL,
    origin VARCHAR(255) NOT NULL,
    origin_address TEXT,
    destination VARCHAR(255) NOT NULL,
    destination_address TEXT,
    driver_id INTEGER REFERENCES users(id),
    driver_name VARCHAR(255),
    vendor_id INTEGER REFERENCES users(id),
    vendor_name VARCHAR(255),
    dispatch_time TIMESTAMP WITH TIME ZONE,
    estimated_arrival TIMESTAMP WITH TIME ZONE,
    material_name VARCHAR(255),
    material_type VARCHAR(100),
    quantity INTEGER DEFAULT 0,
    weight DECIMAL(10, 3),
    total_distance_km DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'scheduled',
    progress INTEGER DEFAULT 0,
    vehicle_number VARCHAR(20),
    vehicle_type VARCHAR(50),
    notes TEXT,
    route_card_id INTEGER REFERENCES route_cards(id),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_trip_number ON trips(trip_number);
CREATE INDEX IF NOT EXISTS idx_driver_id ON trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_vendor_id ON trips(vendor_id);
CREATE INDEX IF NOT EXISTS idx_status ON trips(status);

GRANT ALL PRIVILEGES ON TABLE trips TO steel_user;
GRANT USAGE, SELECT ON SEQUENCE trips_id_seq TO steel_user;
"@
    
    Set-Content -Path $sqlFile -Value $sqlContent
    Write-Host "✅ SQL file created" -ForegroundColor Green
}

Write-Host "==========================================" -ForegroundColor White
Write-Host "  INSTRUCTIONS" -ForegroundColor White
Write-Host "==========================================" -ForegroundColor White
Write-Host ""
Write-Host "1. Open pgAdmin or your PostgreSQL client" -ForegroundColor Cyan
Write-Host "2. Connect to database: $dbName" -ForegroundColor Cyan
Write-Host "3. Open Query Tool" -ForegroundColor Cyan
Write-Host "4. Copy and paste the contents from: $sqlFile" -ForegroundColor Cyan
Write-Host "5. Click Execute (F5)" -ForegroundColor Cyan
Write-Host ""
Write-Host "OR run this command manually:" -ForegroundColor Yellow
Write-Host "  psql -U steel_user -d $dbName -f $sqlFile" -ForegroundColor White
Write-Host ""
Write-Host "==========================================" -ForegroundColor White
Write-Host ""

# Offer to open pgAdmin
$openPgAdmin = Read-Host "Do you want to open pgAdmin? (y/n)"
if ($openPgAdmin -eq 'y' -or $openPgAdmin -eq 'Y') {
    Start-Process "C:\Program Files\PostgreSQL\*\pgAdmin 4\pgAdmin4.exe" -ErrorAction SilentlyContinue
    Write-Host "✅ Attempting to open pgAdmin..." -ForegroundColor Green
}

Write-Host ""
Write-Host "After running the SQL, restart your server:" -ForegroundColor Cyan
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
