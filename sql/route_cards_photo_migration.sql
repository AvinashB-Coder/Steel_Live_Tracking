-- ============================================
-- Route Cards Table - Photo Upload Migration
-- Run this to add photo upload support to existing table
-- ============================================

-- Add photo upload columns (if they don't exist)
ALTER TABLE route_cards 
ADD COLUMN IF NOT EXISTS photo_base64 TEXT,
ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS photo_filename VARCHAR(255),
ADD COLUMN IF NOT EXISTS photo_mime_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS photo_size_bytes INTEGER,
ADD COLUMN IF NOT EXISTS photo_uploaded_at TIMESTAMP WITH TIME ZONE;

-- Create index for photo_url for faster lookups
CREATE INDEX IF NOT EXISTS idx_photo_url ON route_cards(photo_url);

-- Grant permissions
GRANT ALL PRIVILEGES ON TABLE route_cards TO steel_user;

-- View sample data with photo fields
SELECT 
    id,
    route_card_no,
    customer_name,
    part_name,
    photo_url,
    photo_filename,
    photo_mime_type,
    photo_size_bytes,
    photo_uploaded_at
FROM route_cards
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- Alternative: Complete table recreation
-- (Use this if starting fresh)
-- ============================================
/*
DROP TABLE IF EXISTS route_cards CASCADE;

CREATE TABLE route_cards (
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

    -- Legacy job photo fields
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

-- Indexes
CREATE INDEX idx_route_card_no ON route_cards(route_card_no);
CREATE INDEX idx_customer_name ON route_cards(customer_name);
CREATE INDEX idx_grn_date ON route_cards(grn_date);
CREATE INDEX idx_status ON route_cards(status);
CREATE INDEX idx_part_name ON route_cards(part_name);
CREATE INDEX idx_photo_url ON route_cards(photo_url);

-- Grant permissions
GRANT ALL PRIVILEGES ON TABLE route_cards TO steel_user;
GRANT USAGE, SELECT ON SEQUENCE route_cards_id_seq TO steel_user;
*/
