-- ============================================
-- Trips Table - For managing steel shipment trips
-- ============================================
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
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, dispatched, in_transit, arriving, completed, cancelled
    progress INTEGER DEFAULT 0, -- Percentage completion
    
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

-- Indexes for faster searches
CREATE INDEX IF NOT EXISTS idx_trip_number ON trips(trip_number);
CREATE INDEX IF NOT EXISTS idx_driver_id ON trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_vendor_id ON trips(vendor_id);
CREATE INDEX IF NOT EXISTS idx_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_dispatch_time ON trips(dispatch_time);
CREATE INDEX IF NOT EXISTS idx_route_card_id ON trips(route_card_id);

-- Grant permissions
GRANT ALL PRIVILEGES ON TABLE trips TO steel_user;
GRANT USAGE, SELECT ON SEQUENCE trips_id_seq TO steel_user;

-- Sample data
INSERT INTO trips (
    trip_number, origin, origin_address, destination, destination_address,
    driver_id, driver_name, vendor_id, vendor_name,
    dispatch_time, estimated_arrival,
    material_name, quantity, weight, total_distance_km,
    status, progress, vehicle_number, notes, created_by
) VALUES
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
),
(
    'TRIP-2024-002',
    'XYZ Manufacturing',
    'Sector 5, Industrial Estate, Chennai',
    'Lakshmi Vacuum Services',
    'No. 45, Main Road, Chennai - 600032',
    NULL,
    NULL,
    3,
    'XYZ Manufacturing',
    CURRENT_TIMESTAMP + INTERVAL '1 day',
    CURRENT_TIMESTAMP + INTERVAL '1 day 2 hours',
    'Metal Pipes',
    50,
    250.250,
    18.2,
    'scheduled',
    0,
    'TN-01-CD-5678',
    NULL,
    1
),
(
    'TRIP-2024-003',
    'Steel Corp',
    'Anna Nagar, Chennai',
    'Lakshmi Vacuum Services',
    'No. 45, Main Road, Chennai - 600032',
    4,
    'Driver One',
    3,
    'Steel Corp',
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    CURRENT_TIMESTAMP - INTERVAL '10 hours',
    'Steel Rods',
    200,
    1000.000,
    30.0,
    'completed',
    100,
    'TN-01-EF-9012',
    'Delivered successfully',
    1
);

-- Comments
COMMENT ON TABLE trips IS 'Stores all trip/shipment information for steel materials';
COMMENT ON COLUMN trips.status IS 'Trip status: scheduled, dispatched, in_transit, arriving, completed, cancelled';
COMMENT ON COLUMN trips.progress IS 'Completion percentage (0-100)';
COMMENT ON COLUMN trips.route_card_id IS 'Optional link to route card for tracking';
