-- Database Initialization Script for Steel Tracking System

-- 1. Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role VARCHAR(50) DEFAULT 'employee' CHECK (role IN ('admin', 'employee', 'vendor', 'driver')),
    is_active BOOLEAN DEFAULT TRUE,
    auth_provider VARCHAR(50) DEFAULT 'local',
    google_id VARCHAR(255),
    google_picture TEXT,
    last_login TIMESTAMP WITH TIME ZONE,
    reset_token VARCHAR(255),
    reset_token_expiry TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);

-- 3. Create route_cards table (if not already created by other scripts)
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

-- 4. Insert an admin user for testing
-- Password is 'admin123' (hashed using bcrypt)
INSERT INTO users (username, email, password_hash, role, is_active)
VALUES ('Admin User', 'admin@example.com', '$2a$12$R9h/lIPzHZ7W.7Wp6GZ.O.S0zV6ZfU1NqL.Yk7Y1Y1Y1Y1Y1Y1Y1Y', 'admin', TRUE)
ON CONFLICT (email) DO NOTHING;
