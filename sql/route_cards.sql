-- ============================================
-- Route Cards Table - With Photo Upload Support
-- ============================================
CREATE TABLE IF NOT EXISTS route_cards (
    id SERIAL PRIMARY KEY,
    route_card_no VARCHAR(50) UNIQUE NOT NULL,
    grn_date DATE NOT NULL,
    in_time TIME NOT NULL,
    pg_number VARCHAR(50),
    po_number VARCHAR(100),
    customer_name VARCHAR(255) NOT NULL,
    cus_dc_no VARCHAR(100),
    cus_dc_date DATE,
    part_name VARCHAR(255) NOT NULL,
    part_no VARCHAR(100),
    received_qty INTEGER DEFAULT 0,
    quantity INTEGER NOT NULL DEFAULT 0,
    grade VARCHAR(100),
    weight DECIMAL(10, 3),
    req_hardness_hrc VARCHAR(50),
    prepared_by INTEGER REFERENCES users(id),
    prepared_by_name VARCHAR(255),
    verified_by INTEGER REFERENCES users(id),
    verified_by_name VARCHAR(255),

    -- Inspection fields
    incoming_inspection BOOLEAN DEFAULT FALSE,
    checked_ok BOOLEAN DEFAULT FALSE,

    -- Packing instructions
    packing_carton_box BOOLEAN DEFAULT FALSE,
    packing_plastic_bin BOOLEAN DEFAULT FALSE,
    packing_bubble_sheet BOOLEAN DEFAULT FALSE,
    packing_wooden_pallet BOOLEAN DEFAULT FALSE,
    packing_material_cap BOOLEAN DEFAULT FALSE,
    packing_none BOOLEAN DEFAULT FALSE,
    packing_cover BOOLEAN DEFAULT FALSE,
    packing_bag BOOLEAN DEFAULT FALSE,

    -- Process confirmation
    process_confirmation BOOLEAN DEFAULT FALSE,
    work_instruction_available BOOLEAN DEFAULT FALSE,

    -- Legacy job photo fields (for backward compatibility)
    job_photo TEXT,
    job_photo_url VARCHAR(500),

    -- Photo upload fields (camera or file upload)
    photo_base64 TEXT,
    photo_url VARCHAR(500),
    photo_filename VARCHAR(255),
    photo_mime_type VARCHAR(100),
    photo_size_bytes INTEGER,
    photo_uploaded_at TIMESTAMP WITH TIME ZONE,

    -- Status
    status VARCHAR(50) DEFAULT 'pending',
    remarks TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for faster searches
CREATE INDEX IF NOT EXISTS idx_route_card_no ON route_cards(route_card_no);
CREATE INDEX IF NOT EXISTS idx_customer_name ON route_cards(customer_name);
CREATE INDEX IF NOT EXISTS idx_grn_date ON route_cards(grn_date);
CREATE INDEX IF NOT EXISTS idx_status ON route_cards(status);
CREATE INDEX IF NOT EXISTS idx_part_name ON route_cards(part_name);

-- Grant permissions
GRANT ALL PRIVILEGES ON TABLE route_cards TO steel_user;
GRANT USAGE, SELECT ON SEQUENCE route_cards_id_seq TO steel_user;

-- Sample data with photo upload fields
INSERT INTO route_cards (
    route_card_no, grn_date, in_time, pg_number, customer_name,
    cus_dc_no, cus_dc_date, part_name, part_no, received_qty, quantity, grade, weight,
    req_hardness_hrc, prepared_by, prepared_by_name, status,
    photo_filename, photo_mime_type, photo_uploaded_at
) VALUES
(
    'RC-2024-001',
    '2024-01-15',
    '09:30:00',
    'PG-001',
    'ABC Industries',
    'DC-12345',
    '2024-01-15',
    'Steel Bracket',
    'SB-001',
    100,
    100,
    'SS304',
    50.500,
    '45-50',
    1,
    'Employee One',
    'completed',
    'route_card_001.jpg',
    'image/jpeg',
    CURRENT_TIMESTAMP
),
(
    'RC-2024-002',
    '2024-01-16',
    '10:15:00',
    'PG-002',
    'XYZ Manufacturing',
    'DC-12346',
    '2024-01-16',
    'Metal Flange',
    'MF-002',
    50,
    50,
    'SS316',
    75.250,
    '50-55',
    1,
    'Employee One',
    'pending',
    NULL,
    NULL,
    NULL
);
