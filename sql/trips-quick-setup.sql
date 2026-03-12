-- ============================================
-- Quick Trip Setup - Check and Create Table
-- ============================================
-- Run this in pgAdmin to verify/create the trips table

-- Check if table exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'trips'
        )
        THEN '✅ trips table exists'
        ELSE '❌ trips table DOES NOT EXIST - Run full migration!'
    END AS table_status;

-- Create table if not exists (safe to run multiple times)
CREATE TABLE IF NOT EXISTS trips (
    id SERIAL PRIMARY KEY,
    trip_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Route information
    origin VARCHAR(255) NOT NULL,
    origin_address TEXT,
    origin_coords_lat DECIMAL(10, 8),
    origin_coords_lng DECIMAL(11, 8),
    
    destination VARCHAR(255) NOT NULL,
    destination_address TEXT,
    destination_coords_lat DECIMAL(10, 8),
    destination_coords_lng DECIMAL(11, 8),
    
    -- Assignment
    driver_id INTEGER REFERENCES users(id),
    driver_name VARCHAR(255),
    vendor_id INTEGER REFERENCES users(id),
    vendor_name VARCHAR(255),
    
    -- Trip details
    dispatch_time TIMESTAMP WITH TIME ZONE,
    estimated_arrival TIMESTAMP WITH TIME ZONE,
    actual_arrival TIMESTAMP WITH TIME ZONE,
    
    -- Material information
    material_name VARCHAR(255),
    material_type VARCHAR(100),
    quantity INTEGER DEFAULT 0,
    weight DECIMAL(10, 3),
    total_distance_km DECIMAL(10, 2),
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'scheduled',
    progress INTEGER DEFAULT 0,
    
    -- Vehicle information
    vehicle_number VARCHAR(20),
    vehicle_type VARCHAR(50),
    
    -- Additional info
    notes TEXT,
    route_card_id INTEGER REFERENCES route_cards(id),
    
    -- Tracking
    current_location_lat DECIMAL(10, 8),
    current_location_lng DECIMAL(11, 8),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Audit fields
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_trip_number ON trips(trip_number);
CREATE INDEX IF NOT EXISTS idx_driver_id ON trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_vendor_id ON trips(vendor_id);
CREATE INDEX IF NOT EXISTS idx_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_dispatch_time ON trips(dispatch_time);

-- Grant permissions
GRANT ALL PRIVILEGES ON TABLE trips TO steel_user;
GRANT USAGE, SELECT ON SEQUENCE trips_id_seq TO steel_user;

-- Insert sample data only if table is empty
INSERT INTO trips (
    trip_number, origin, origin_address, destination, destination_address,
    driver_id, driver_name, vendor_id, vendor_name,
    dispatch_time, estimated_arrival,
    material_name, quantity, weight, total_distance_km,
    status, progress, vehicle_number, notes, created_by
)
SELECT * FROM (VALUES 
    (
        'TRIP-2024-001',
        'ABC Industries',
        'Plot 123, Industrial Area, Chennai',
        'Lakshmi Vacuum Services',
        'No. 45, Main Road, Chennai - 600032',
        4,
        'Driver One',
        3,
        'ABC Industries',
        CURRENT_TIMESTAMP - INTERVAL '2 hours',
        CURRENT_TIMESTAMP + INTERVAL '1 hour',
        'Steel Sheets',
        100,
        500.500,
        25.5,
        'in_transit',
        65,
        'TN-01-AB-1234',
        'Fragile cargo, handle with care',
        1
    )
) AS sample_data
WHERE NOT EXISTS (SELECT 1 FROM trips LIMIT 1);

-- Verify
SELECT '✅ Trips table is ready!' AS status, COUNT(*) AS trip_count FROM trips;
