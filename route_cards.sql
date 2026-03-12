-- Route Cards Table - Steel Live Location Monitoring System

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
    process_confirmation BOOLEAN DEFAULT FALSE,
    work_instruction_available BOOLEAN DEFAULT FALSE,
    photo_base64 TEXT,
    photo_url VARCHAR(500),
    photo_filename VARCHAR(255),
    photo_mime_type VARCHAR(100),
    photo_size_bytes INTEGER,
    photo_uploaded_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'pending',
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_route_card_no ON route_cards(route_card_no);
CREATE INDEX idx_customer_name ON route_cards(customer_name);
CREATE INDEX idx_part_name ON route_cards(part_name);
CREATE INDEX idx_grn_date ON route_cards(grn_date);
CREATE INDEX idx_status ON route_cards(status);
CREATE INDEX idx_prepared_by ON route_cards(prepared_by);
CREATE INDEX idx_created_at ON route_cards(created_at DESC);

GRANT ALL PRIVILEGES ON TABLE route_cards TO steel_user;
GRANT USAGE, SELECT ON SEQUENCE route_cards_id_seq TO steel_user;
